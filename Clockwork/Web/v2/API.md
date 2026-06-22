# Clockwork HTTP API (`/__clockwork/*`)

The React v2 app talks to the Clockwork backend over these endpoints, registered by
`Clockwork\Support\Laravel\ClockworkController`. All
paths are rooted at `/__clockwork`. The app calls them with **relative** URLs (`/__clockwork/…`),
so they resolve same-origin in production and are proxied to the Laravel app in dev
(see `vite.config.js` → `server.proxy`).

## Authentication

| | |
|---|---|
| `POST /__clockwork/auth` | body `{ password }` → `200 { token }` on success, `403` on wrong password |

- When Clockwork's `authentication` config is **off** (the default, and the test app), the
  endpoint returns `{ token: true }` for any password and data endpoints require no auth.
- When **on** (`SimpleAuthenticator`), `token` is a `password_hash` string. It must be sent
  back on every data request via the **`X-Clockwork-Auth`** header (`authenticator::check`
  reads that header).
- The login page (`src/pages/Login.jsx`) stores the token (`api/clockwork.js` `setToken`)
  and the client attaches `X-Clockwork-Auth` automatically. `Remember me` only controls
  `localStorage` vs `sessionStorage` persistence.

## Data endpoints

All return JSON. A 404 for an unknown id returns **HTML** (Laravel's error page), not JSON —
the client guards with `res.ok` + content-type.

| Method | Path | Returns | Used by |
|--------|------|---------|---------|
| GET | `/__clockwork/latest` | latest request (single object) | RequestList bootstrap |
| GET | `/__clockwork/{id}` | one request by id (single object) | — |
| GET | `/__clockwork/{id}/extended` | one request **with all data sources attached** (db/cache/redis/events/views/http… fully populated) | **RequestDetail** |
| GET | `/__clockwork/{id}/previous/{count}` | array of `count` requests older than id | RequestList (page back) |
| GET | `/__clockwork/{id}/next/{count}` | array of `count` requests newer than id | RequestList (page forward) |
| GET | `/__clockwork/failures?limit=&type=&status=&search=&since=` | failed-requests list | (future: 失败请求) |
| GET | `/__clockwork/events/details/{id}` | event-details / failure-diagnosis payload | (future) |
| GET | `/__clockwork/env` | environment snapshot (PHP/Laravel/Clockwork versions, storage driver…) | (future: Overview) |
| GET | `/__clockwork/stats?since=&until=&type=&limit=` | **overview KPIs** aggregated across recent requests (counts, errorRate, avgDuration, db/cache/redis/log totals). `failedRequests` uses the same definition as `/failures` (`requestHasFailures`: HTTP 4xx/5xx, command≠0, queue/test failed, error-level logs, failed outbound HTTP). Walks up to `limit` (default 1000) requests; durations outside 0–600000ms are rejected as corrupt. | Overview (backend ready, frontend not yet wired) |
| GET | `/__clockwork/operations/{category}?since=&until=&type=&limit=&scanLimit=` | **operations center**: per-category (`database\|cache\|redis\|log\|events\|views\|notifications`) KPIs + a flattened list of individual operations, each carrying `requestId`/`requestUri`/`requestType`/`requestTime` for reverse-lookup. `total` = matched ops across the scanned set (pre-limit), `returned` = length of the returned (capped) list; `window.truncated` flags when either cap was hit. `notifications` also merges the legacy `emailsData` (old Swift-based mail). Client-side search/sort/paginate the returned list. | Operations center (backend ready, frontend not yet wired) |
| PUT | `/__clockwork/{id}` | update a stored request (e.g. client-side updates) | — |

> Note: `/__clockwork/latest/previous/{n}` returns `[]` — `latest` is not a valid paging
> anchor. The client resolves the latest id first, then calls `/{id}/previous/{n}` (see
> `api.recent()` in `src/api/clockwork.js`).

## Request object shape (what you get back)

Each request object already carries **everything** (the same payload whether from `latest`,
`{id}`, or the list endpoints); `extended` additionally re-runs framework data sources.
Key fields the UI consumes:

```
id, version, type, time, method, url, uri, controller,
getData, postData, requestData, headers{}, cookies, sessionData, authenticatedUser,
responseTime, responseStatus, responseDuration, memoryUsage, middleware[],
databaseQueries[], databaseQueriesCount, databaseSlowQueries,
databaseSelects/Inserts/Updates/Deletes/Others, databaseDuration,
cacheQueries[], cacheReads, cacheHits, cacheWrites, cacheDeletes, cacheTime,
modelsActions[], modelsRetrieved/Created/Updated/Deleted,
redisCommands[], queueJobs[], timelineData[], log[], events[], routes[],
notifications[], emailsData[], viewsData[], userData[], httpRequests[], subrequests[],
commandName/Arguments/Options/ExitCode/Output, jobName/Status/Payload/Queue, testName/Status,
parent, …
```

The client normalizes this into the shapes the components expect (`toListRow`, `toDetail` in
`src/api/clockwork.js`): e.g. `responseDuration`→duration, `memoryUsage`→bytes, real
`databaseQueriesCount`/`databaseDuration`/`cacheReads`… map to the UI's `dbStats`/`cacheStats`.

## Status: which app pages are live vs. still mock

| Page | Data source | Endpoint |
|------|-------------|----------|
| Login | **live** | `POST /auth` |
| Request list | **live** | `GET /latest` + `/{id}/previous/{n}` |
| Request detail (all tabs) | **live** | `GET /{id}/extended` |
| Overview (KPI + recent) | **backend ready** (frontend mock) | `GET /stats` (KPIs) + `GET /latest`/`previous` (recent table) |
| Operations center (7 categories) | **backend ready** (frontend mock) | `GET /operations/{category}` |

The two deferred pages need **new** backend endpoints (cross-request aggregation) — see
`clockwork-operation-centric-capability.md` in the project root. Existing endpoints listed
above are already wired and verified against the running Laravel test app.

## Known limitations

- **`since`/`until` are matched to whole seconds.** `Search` casts time-window bounds with
  `(int)` (`Storage/Search.php`), so sub-second boundaries are truncated. This only matters
  for sub-second edge requests; the UI's window presets (15m / 1h / 24h / 7d) are whole-second,
  so there's no practical impact. Not fixed to avoid changing the shared `Search` class.
- Both endpoints walk stored requests server-side (capped by `limit`/`scanLimit`). With
  `window.truncated = true`, `total`/KPIs reflect the scanned set, not the full window.
