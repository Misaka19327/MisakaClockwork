// Clockwork HTTP API client.
//
// Endpoints (all under /__clockwork, served by Clockwork\Support\Laravel\ClockworkController):
//   POST /auth                         -> { token }   (token is `true` when auth is disabled)
//   GET  /latest                       -> latest request (single object)
//   GET  /{id}                         -> request by id (single object)
//   GET  /{id}/extended                -> request by id with all data sources attached
//   GET  /{id}/previous/{count}        -> array of `count` requests older than id
//   GET  /{id}/next/{count}            -> array of `count` requests newer than id
//   GET  /failures?...                 -> failed requests list
//   GET  /env                          -> environment snapshot
//
// Auth: the token from /auth is sent back on every data request via the
// `X-Clockwork-Auth` header (authenticator::check reads that header). When authentication is
// disabled (the default test config), /auth returns token:true and the header is ignored.

const API_BASE = '/__clockwork'
const TOKEN_KEY = 'clockwork:token'

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) } catch (_) { return null }
}

export function setToken(token, persist) {
  const v = String(token)
  try {
    sessionStorage.setItem(TOKEN_KEY, v)
    if (persist) localStorage.setItem(TOKEN_KEY, v)
  } catch (_) { /* ignore */ }
}

export function clearToken() {
  try { sessionStorage.removeItem(TOKEN_KEY); localStorage.removeItem(TOKEN_KEY) } catch (_) { /* ignore */ }
}

// Auth-required bridge to the router. The request layer can't navigate on its own, so App
// (which lives inside <HashRouter>) registers a callback via setAuthRequiredHandler. When the
// backend replies 403 with a non-empty `requires` array, we drop any stale token and invoke it,
// so App can redirect to /login. NullAuthenticator never returns 403, so this only fires when
// authentication is actually configured — matching the official Clockwork web app behavior, where
// no login page is ever shown when no key is set.
let authRequiredHandler = null

export function setAuthRequiredHandler(fn) { authRequiredHandler = fn }
export function clearAuthRequiredHandler() { authRequiredHandler = null }

function triggerAuthRequired() {
  clearToken()
  if (authRequiredHandler) authRequiredHandler()
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { Accept: 'application/json' }
  if (auth) {
    const tok = getToken()
    if (tok) headers['X-Clockwork-Auth'] = tok
  }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let res
  try {
    res = await fetch(API_BASE + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined })
  } catch (e) {
    const err = new Error('网络错误：无法连接 Clockwork 服务') // network / server down
    err.status = 0
    throw err
  }

  const ct = res.headers.get('content-type') || ''
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    let payload = null
    if (ct.includes('json')) {
      try { payload = await res.json(); msg = payload.message || payload.detail || msg } catch (_) { /* ignore */ }
    }
    // 403 + a non-empty `requires` array (eg. ['password']) is the backend's "authentication
    // required" signal — route to /login via the registered handler. The POST /auth wrong-password
    // 403 carries only `{ token: false }` (no `requires`), so it falls through as a normal error
    // and the Login page shows "incorrect key".
    if (res.status === 403 && payload && Array.isArray(payload.requires) && payload.requires.length) {
      triggerAuthRequired()
    }
    const err = new Error(msg)
    err.status = res.status
    throw err
  }
  if (ct.includes('json')) return res.json()
  return null
}

export const api = {
  /**
   * Authenticate against the backend.
   * `POST /__clockwork/auth`  body: `{ password }`  → `200 { token }` / `403` on wrong password.
   * `token` is `true` when Clockwork auth is disabled; otherwise a password_hash string
   * that must be sent back via the `X-Clockwork-Auth` header (the `request` helper does that).
   * No auth header is sent on this call itself (`auth: false`).
   * Used by: Login page.
   */
  authenticate(password) {
    return request('/auth', { method: 'POST', body: { password }, auth: false })
  },

  /**
   * Environment snapshot.
   * `GET /__clockwork/env` → `{ appEnv, appDebug, phpVersion, laravelVersion, clockworkVersion,
   * storageDriver, ... }`. Reserved for the (currently mock) Overview page.
   */
  env() { return request('/env') },

  /**
   * Latest recorded request.
   * `GET /__clockwork/latest` → a single request object (the special id `latest`).
   * Note: `latest` is NOT a valid paging anchor — `latest/previous/N` returns `[]`.
   */
  latest() { return request('/latest') },

  /**
   * One request by id.
   * `GET /__clockwork/{id}` → single request object (already carries all collected arrays).
   * `GET /__clockwork/latest` is the special case handled by `latest()`.
   */
  get(id) { return request(`/${encodeURIComponent(id)}`) },

  /**
   * One request with all data sources attached (db/cache/redis/events/views/http fully populated).
   * `GET /__clockwork/{id}/extended` → single request object. This is the canonical "detail"
   * payload. A missing/unknown id returns 404 as HTML — `request()` rejects with `status: 404`.
   * Used by: RequestDetail page.
   */
  extended(id) { return request(`/${encodeURIComponent(id)}/extended`) },

  /**
   * Page backwards (older) from an anchor id.
   * `GET /__clockwork/{id}/previous/{count}` → array of `count` request objects older than `id`.
   * Used by: RequestList (initial load via `recent()`, plus backward paging).
   */
  previous(id, count) { return request(`/${encodeURIComponent(id)}/previous/${count}`) },

  /**
   * Page forwards (newer) from an anchor id.
   * `GET /__clockwork/{id}/next/{count}` → array of `count` request objects newer than `id`.
   * Reserved for RequestList forward paging.
   */
  next(id, count) { return request(`/${encodeURIComponent(id)}/next/${count}`) },

  /**
   * Failed-requests list.
   * `GET /__clockwork/failures?limit=&type=&status=&search=&since=` → array of failed request
   * summaries. `limit` is clamped server-side to 1..100. Reserved for the 失败事件 nav item.
   */
  failures(params = {}) {
    const q = new URLSearchParams(params).toString()
    return request('/failures' + (q ? `?${q}` : ''))
  },

  /**
   * Convenience: the `count` most-recent requests (latest first).
   * Two-step because `latest/previous/N` returns `[]`: resolve the latest id, then page back
   * from it. Returns `[latest, ...previous(latest.id, count-1)]`. Used by: RequestList.
   */
  async recent(count = 50) {
    const latest = await this.latest()
    if (!latest) return []
    const older = await this.previous(latest.id, Math.max(0, count - 1))
    return [latest, ...(Array.isArray(older) ? older : [])]
  },

  /**
   * Overview KPIs.
   * `GET /__clockwork/stats?since=&until=&type=&limit=` → aggregated totals across recent
   * requests (requests, failedRequests, errorRate, avgDuration, byType, database, cache,
   * redis, log). `failedRequests` uses the same definition as `/failures`. Used by: Overview.
   */
  stats(params = {}) {
    const q = new URLSearchParams(params).toString()
    return request('/stats' + (q ? `?${q}` : ''))
  },

  /**
   * Operations center for one category.
   * `GET /__clockwork/operations/{category}?since=&until=&type=&limit=&scanLimit=` →
   * `{ category, window, kpis, total, returned, requestCount, operations[] }`. Each operation
   * carries `requestId`/`requestUri`/`requestType`/`requestTime` for reverse-lookup; `total`
   * is the matched count (pre-limit), `returned` the page length. Used by: Operations page.
   */
  operations(category, params = {}) {
    const q = new URLSearchParams(params).toString()
    return request(`/operations/${encodeURIComponent(category)}` + (q ? `?${q}` : ''))
  },
}

// ── Field mappers: real Clockwork request object → shapes the UI expects ──

const ERROR_LEVELS = new Set(['emergency', 'alert', 'critical', 'error'])

function pad(n) { return String(n).padStart(2, '0') }
export function fmtClock(unix) {
  if (!unix) return '—'
  const d = new Date(unix * 1000)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
export function fmtDateTime(unix) {
  if (!unix) return '—'
  const d = new Date(unix * 1000)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, '0')}`
}

// Date + time without milliseconds — for list rows where ms precision is noise but the date still
// matters (a time-only column loses the day for requests that span midnight).
export function fmtDateTimeSec(unix) {
  if (!unix) return '—'
  const d = new Date(unix * 1000)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function displayUri(r) {
  if (r.type === 'command') return r.commandName ? `artisan ${r.commandName}` : 'artisan'
  if (r.type === 'queue-job') return r.jobName || 'queue-job'
  if (r.type === 'test') return r.testName || 'test'
  return r.uri || r.url || ''
}

function deriveFailure(r) {
  const errLog = (r.log || []).find(l => ERROR_LEVELS.has(l.level))
  if (errLog) {
    const frame = errLog.trace && errLog.trace[0]
    return frame ? `${errLog.message} — ${frame.file}:${frame.line}` : errLog.message
  }
  if (r.type === 'command') return `Command exited ${r.commandExitCode}`
  if (r.type === 'queue-job') return `Queue job ${r.jobStatus || 'failed'}: ${r.jobName || r.jobDescription || ''}`
  if (r.type === 'test') return `Test ${r.testStatus || 'failed'}: ${r.testName || ''}`
  return `HTTP ${requestStatus(r) ?? '—'} on ${r.uri || r.url || ''}`
}

// Status for a request, mirroring Clockwork\Support\Laravel\ClockworkSupport::requestStatus —
// non-HTTP types carry their status in a different field (command exit code, job/test status).
export function requestStatus(r) {
  if (r.type === 'command') return r.commandExitCode
  if (r.type === 'queue-job') return r.jobStatus
  if (r.type === 'test') return r.testStatus
  return r.responseStatus
}

// Whether a request is failed, mirroring requestHasFailures / getErrorInformation: type-specific
// status failure (HTTP >=400, non-zero command exit, failed job, non-passed test) OR an
// error-level log entry.
export function requestFailed(r) {
  if (r.type === 'command') {
    if (r.commandExitCode != null && r.commandExitCode !== 0) return true
  } else if (r.type === 'queue-job') {
    if (r.jobStatus === 'failed') return true
  } else if (r.type === 'test') {
    if (r.testStatus && r.testStatus !== 'passed') return true
  } else {
    if (r.responseStatus != null && r.responseStatus >= 400) return true
  }
  return (r.log || []).some(l => ERROR_LEVELS.has(l.level))
}

// Coerce a value loaded from storage (numbers come back as strings via Redis hGetAll / PDO)
// into a real number, defaulting to 0 for null/undefined/empty/non-numeric — so downstream
// .toFixed() calls and arithmetic don't throw on strings. Mirrors the local helper in
// normalizeKpi, hoisted so the row/detail mappers share it.
const num = (v) => (typeof v === 'number' ? v : (Number.isFinite(Number(v)) ? Number(v) : 0))

// Request list row shape (matches what RequestList.jsx renders).
export function toListRow(r) {
  const status = requestStatus(r)
  return {
    id: r.id,
    type: r.type,
    method: r.method || '—',
    uri: displayUri(r),
    controller: r.controller || '',
    status: status == null ? '—' : status,
    dur: num(r.responseDuration),
    mem: r.memoryUsage ? num(r.memoryUsage) / 1e6 : 0,
    time: fmtDateTimeSec(r.time),
    ts: num(r.time),
    failed: requestFailed(r),
  }
}

// Failure-list row shape: maps a /__clockwork/failures summary onto the row RequestList renders.
// The failures endpoint returns a different shape than a full request (no method/memory/controller),
// so those render as "—". Every row here is a failure by definition.
export function toFailureRow(f) {
  return {
    id: f.id,
    type: f.type,
    method: '—',
    uri: f.name || '',
    controller: '',
    status: f.status == null ? '—' : f.status,
    dur: num(f.duration),
    mem: null,
    time: fmtDateTimeSec(f.receivedAt),
    ts: num(f.receivedAt),
    failed: true,
    failureMsg: f.title || f.rootMessage || '',
  }
}

// Full request detail shape (matches what RequestDetail.jsx renders).
// Maps the raw Clockwork request object onto the component's expected fields, e.g.:
//   responseStatus → status, responseDuration → duration, memoryUsage (bytes) → memory,
//   databaseQueriesCount/Slow/Duration/Selects/... → dbStats.{count,slow,duration,...},
//   cacheReads/Hits/Writes/Deletes/Time → cacheStats.{reads,hits,...},
//   log → logs, headers (arrays joined to strings), time → timeStr.
export function toDetail(r) {
  const status = requestStatus(r)
  return {
    id: r.id,
    type: r.type,
    method: r.method || '—',
    uri: displayUri(r),
    controller: r.controller || '',
    status: status == null ? '—' : status,
    duration: num(r.responseDuration),
    memory: num(r.memoryUsage),
    time: r.time,
    timeStr: fmtDateTime(r.time),
    failed: requestFailed(r),
    failureMsg: deriveFailure(r),
    getData: r.getData || {},
    postData: r.postData || {},
    requestData: r.requestData || {},
    headers: Object.fromEntries(Object.entries(r.headers || {}).map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : v])),
    cookies: r.cookies || {},
    sessionData: r.sessionData || {},
    middleware: r.middleware || [],
    authenticatedUser: r.authenticatedUser,
    totalDuration: num(r.responseDuration),
    timelineData: r.timelineData || [],
    databaseQueries: r.databaseQueries || [],
    cacheQueries: r.cacheQueries || [],
    redisCommands: r.redisCommands || [],
    httpRequests: r.httpRequests || [],
    logs: r.log || [],
    events: r.events || [],
    viewsData: r.viewsData || [],
    dbStats: {
      count: num(r.databaseQueriesCount ?? (r.databaseQueries || []).length),
      slow: num(r.databaseSlowQueries),
      duration: num(r.databaseDuration),
      selects: num(r.databaseSelects),
      inserts: num(r.databaseInserts),
      updates: num(r.databaseUpdates),
      deletes: num(r.databaseDeletes),
    },
    cacheStats: {
      reads: num(r.cacheReads),
      hits: num(r.cacheHits),
      writes: num(r.cacheWrites),
      deletes: num(r.cacheDeletes),
      time: num(r.cacheTime),
    },
  }
}

// Coerce an operations-category KPI object into the safe shape KpiBand renders: numbers
// default to 0, sub-maps default to {}, and the log/views fields the UI expects (levels,
// slowestCount) are derived from the API's byLevel / topViews so empty categories don't
// render NaN.
export function normalizeKpi(category, k) {
  const num = (v) => (typeof v === 'number' ? v : (Number.isFinite(Number(v)) ? Number(v) : 0))
  const obj = (o) => (o && typeof o === 'object' && !Array.isArray(o) ? o : {})

  switch (category) {
    case 'database':
      return { select: num(k.select), insert: num(k.insert), update: num(k.update), delete: num(k.delete), other: num(k.other), slow: num(k.slow), avgDuration: num(k.avgDuration), totalDuration: num(k.totalDuration), requestCount: num(k.requestCount) }
    case 'cache':
      return { hits: num(k.hits), misses: num(k.misses), writes: num(k.writes), deletes: num(k.deletes), readTotal: num(k.readTotal), hitRate: num(k.hitRate), avgDuration: num(k.avgDuration), totalTime: num(k.totalTime), requestCount: num(k.requestCount) }
    case 'redis':
      return { total: num(k.total), commands: obj(k.commands), avgDuration: num(k.avgDuration), totalTime: num(k.totalTime), requestCount: num(k.requestCount) }
    case 'log': {
      const levels = obj(k.byLevel ?? k.levels)
      return { total: num(k.total), error: num(k.error), warning: num(k.warning), notice: num(k.notice), info: num(k.info), debug: num(k.debug), levels, requestCount: num(k.requestCount) }
    }
    case 'events':
      return { total: num(k.total), topEvents: obj(k.topEvents), avgDuration: num(k.avgDuration), requestCount: num(k.requestCount) }
    case 'views': {
      const topViews = obj(k.topViews)
      const slowestName = k.slowestName || null
      return { total: num(k.total), topViews, avgDuration: num(k.avgDuration), totalTime: num(k.totalTime), requestCount: num(k.requestCount), slowest: num(k.slowest), slowestName, slowestCount: num(slowestName ? topViews[slowestName] : 0) }
    }
    case 'notifications':
      return { total: num(k.total), types: obj(k.types), avgDuration: num(k.avgDuration), totalTime: num(k.totalTime), requestCount: num(k.requestCount) }
    default:
      return k
  }
}
