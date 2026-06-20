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
    if (ct.includes('json')) {
      try { const j = await res.json(); msg = j.message || j.detail || msg } catch (_) { /* ignore */ }
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
   * summaries. `limit` is clamped server-side to 1..100. Reserved for the 失败请求 nav item.
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
  return `HTTP ${r.responseStatus} on ${r.uri || r.url || ''}`
}

// Request list row shape (matches what RequestList.jsx renders).
export function toListRow(r) {
  const status = r.responseStatus
  return {
    id: r.id,
    type: r.type,
    method: r.method || '—',
    uri: displayUri(r),
    controller: r.controller || '',
    status: status == null ? '—' : status,
    dur: r.responseDuration ?? 0,
    mem: r.memoryUsage ? r.memoryUsage / 1e6 : 0,
    time: fmtClock(r.time),
    failed: status != null && status >= 500,
  }
}

// Full request detail shape (matches what RequestDetail.jsx renders).
// Maps the raw Clockwork request object onto the component's expected fields, e.g.:
//   responseStatus → status, responseDuration → duration, memoryUsage (bytes) → memory,
//   databaseQueriesCount/Slow/Duration/Selects/... → dbStats.{count,slow,duration,...},
//   cacheReads/Hits/Writes/Deletes/Time → cacheStats.{reads,hits,...},
//   log → logs, headers (arrays joined to strings), time → timeStr.
export function toDetail(r) {
  const status = r.responseStatus
  return {
    id: r.id,
    uuid: r.uuid,
    type: r.type,
    method: r.method || '—',
    uri: displayUri(r),
    controller: r.controller || '',
    status: status == null ? '—' : status,
    duration: r.responseDuration ?? 0,
    memory: r.memoryUsage ?? 0,
    time: r.time,
    timeStr: fmtDateTime(r.time),
    failed: (status != null && status >= 500) || (r.log || []).some(l => ERROR_LEVELS.has(l.level)),
    failureMsg: deriveFailure(r),
    getData: r.getData || {},
    postData: r.postData || {},
    requestData: r.requestData || {},
    headers: Object.fromEntries(Object.entries(r.headers || {}).map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : v])),
    cookies: r.cookies || {},
    sessionData: r.sessionData || {},
    middleware: r.middleware || [],
    authenticatedUser: r.authenticatedUser,
    totalDuration: r.responseDuration ?? 0,
    timelineData: r.timelineData || [],
    databaseQueries: r.databaseQueries || [],
    cacheQueries: r.cacheQueries || [],
    redisCommands: r.redisCommands || [],
    httpRequests: r.httpRequests || [],
    logs: r.log || [],
    events: r.events || [],
    viewsData: r.viewsData || [],
    dbStats: {
      count: r.databaseQueriesCount ?? (r.databaseQueries || []).length,
      slow: r.databaseSlowQueries ?? 0,
      duration: r.databaseDuration ?? 0,
      selects: r.databaseSelects ?? 0,
      inserts: r.databaseInserts ?? 0,
      updates: r.databaseUpdates ?? 0,
      deletes: r.databaseDeletes ?? 0,
    },
    cacheStats: {
      reads: r.cacheReads ?? 0,
      hits: r.cacheHits ?? 0,
      writes: r.cacheWrites ?? 0,
      deletes: r.cacheDeletes ?? 0,
      time: r.cacheTime ?? 0,
    },
  }
}
