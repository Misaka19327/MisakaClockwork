// Request list + request detail mock data — ported from request-list.html and request-detail.html.

// ── Request list rows ──
export const REQUESTS = [
  { type: 'request',   method: 'GET',    uri: '/api/users',                    controller: 'App\\Http\\Controllers\\UserController@index',        status: 200, dur: 48.2,   mem: 12.4, time: '14:32:01.466' },
  { type: 'request',   method: 'POST',   uri: '/api/orders',                   controller: 'App\\Http\\Controllers\\OrderController@store',       status: 201, dur: 156.8,  mem: 24.1, time: '14:31:58.221' },
  { type: 'request',   method: 'GET',    uri: '/dashboard',                    controller: 'App\\Http\\Controllers\\DashboardController@index',   status: 500, dur: 2340.1, mem: 38.7, time: '14:31:55.880', failed: true },
  { type: 'request',   method: 'GET',    uri: '/api/products/search?q=laptop', controller: 'App\\Http\\Controllers\\ProductController@search',   status: 200, dur: 320.5,  mem: 18.2, time: '14:31:50.102' },
  { type: 'request',   method: 'PUT',    uri: '/api/users/42',                 controller: 'App\\Http\\Controllers\\UserController@update',       status: 200, dur: 89.4,   mem: 15.8, time: '14:31:44.755' },
  { type: 'request',   method: 'DELETE', uri: '/api/sessions/abc123',          controller: 'App\\Http\\Controllers\\AuthController@logout',        status: 204, dur: 22.1,   mem: 8.9,  time: '14:31:40.320' },
  { type: 'command',   method: '—',      uri: 'artisan migrate',               controller: '—',                                                    status: '—', dur: 1840.2, mem: 52.3, time: '14:31:30.000' },
  { type: 'queue-job', method: '—',      uri: 'ProcessPodcast',                controller: '—',                                                    status: '—', dur: 430.8,  mem: 20.1, time: '14:31:20.450' },
  { type: 'request',   method: 'GET',    uri: '/admin/reports/monthly',        controller: 'App\\Http\\Controllers\\ReportController@monthly',     status: 200, dur: 1120.6, mem: 44.2, time: '14:31:15.780' },
  { type: 'test',      method: '—',      uri: 'UserTest::test_can_create',     controller: '—',                                                    status: '—', dur: 85.3,   mem: 16.0, time: '14:31:10.100' },
  { type: 'request',   method: 'GET',    uri: '/login',                        controller: 'App\\Http\\Controllers\\AuthController@showLogin',     status: 200, dur: 18.9,   mem: 6.2,  time: '14:31:05.432' },
  { type: 'request',   method: 'POST',   uri: '/login',                        controller: 'App\\Http\\Controllers\\AuthController@login',         status: 302, dur: 210.3,  mem: 12.0, time: '14:31:02.111' },
  { type: 'queue-job', method: '—',      uri: 'SendWelcomeMail',               controller: '—',                                                    status: '—', dur: 620.1,  mem: 14.5, time: '14:30:45.000', failed: true },
  { type: 'request',   method: 'GET',    uri: '/api/notifications',            controller: 'App\\Http\\Controllers\\NotificationController@index', status: 200, dur: 65.2,  mem: 10.8, time: '14:30:38.900' },
  { type: 'request',   method: 'POST',   uri: '/api/upload',                   controller: 'App\\Http\\Controllers\\UploadController@store',       status: 422, dur: 340.7,  mem: 22.3, time: '14:30:30.200' },
  { type: 'command',   method: '—',      uri: 'artisan queue:work',            controller: '—',                                                    status: '—', dur: 0,      mem: 0,    time: '14:30:20.000' },
  { type: 'request',   method: 'GET',    uri: '/health',                       controller: 'App\\Http\\Controllers\\HealthController@check',       status: 200, dur: 2.1,    mem: 3.4,  time: '14:30:10.050' },
]

// ── Single request detail payload ──
export const DETAIL = {
  id: '1779256690-1032-14011576',
  uuid: 'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
  type: 'request',
  method: 'GET',
  uri: '/api/users?page=1&per_page=25',
  controller: 'App\\Http\\Controllers\\UserController@index',
  status: 500,
  duration: 2340.1,
  memory: 38700000,
  time: 1779088876.466,
  timeStr: '2026-06-17 14:31:55.880',
  failed: true,
  failureMsg: "SQLSTATE[HY000]: General error: 2006 MySQL server has gone away — app/Http/Controllers/UserController.php:42",

  getData: { page: '1', per_page: '25', sort: 'created_at', order: 'desc' },
  postData: {},
  requestData: {},
  headers: { accept: 'application/json', authorization: 'Bearer *removed*', 'user-agent': 'Clockwork/5.x' },
  cookies: { laravel_session: '*removed*' },
  sessionData: { _token: '*removed*', _previous: { url: 'http://localhost/dashboard' } },
  middleware: ['web', 'auth', 'throttle:60,1', 'api'],
  authenticatedUser: { id: 42, username: 'admin', email: 'admin@example.com', name: 'Admin' },

  totalDuration: 2340.1,
  timelineData: [
    { description: 'Controller',           start: 0,    end: 2340.1, color: 'blue',   data: null },
    { description: 'auth middleware',      start: 0,    end: 8.2,    color: 'purple', data: null },
    { description: 'throttle middleware',  start: 8.2,  end: 9.8,    color: 'purple', data: null },
    { description: 'Rendering a view',     start: 10,   end: 890,    color: 'green',  data: { name: 'users.index', data: {} } },
    { description: 'Sending welcome email',start: 15,   end: 320,    color: 'grey',   data: { subject: 'Welcome', to: 'a@b.com' } },
    { description: 'custom:process',       start: 50,   end: 2180,   color: 'blue',   data: null },
  ],

  databaseQueries: [
    { query: 'SELECT * FROM `users` WHERE `users`.`deleted_at` IS NULL ORDER BY `created_at` DESC LIMIT 25 OFFSET 0', duration: 1840.2, connection: 'mysql', file: 'app/Http/Controllers/UserController.php', line: 42, tags: ['slow'], model: 'App\\Models\\User' },
    { query: 'SELECT COUNT(*) AS aggregate FROM `users` WHERE `users`.`deleted_at` IS NULL', duration: 45.8, connection: 'mysql', file: 'app/Http/Controllers/UserController.php', line: 38, model: 'App\\Models\\User' },
    { query: 'SELECT * FROM `roles` INNER JOIN `role_user` ON `roles`.`id` = `role_user`.`role_id` WHERE `role_user`.`user_id` IN (1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25)', duration: 82.3, connection: 'mysql', file: 'app/Models/User.php', line: 28, model: 'App\\Models\\Role', tags: ['slow', 'n+1'] },
    { query: 'SELECT * FROM `sessions` WHERE `user_id` = 5 AND `last_activity` > 1779085276', duration: 12.4, connection: 'mysql', file: 'app/Http/Middleware/Authenticate.php', line: 22 },
    { query: "SELECT * FROM `settings` WHERE `key` = 'app.name' LIMIT 1", duration: 0.8, connection: 'mysql', file: 'app/Providers/AppServiceProvider.php', line: 45 },
  ],
  dbStats: { count: 5, slow: 2, duration: 1981.5, selects: 5, inserts: 0, updates: 0, deletes: 0 },

  cacheQueries: [
    { type: 'miss',  key: 'users:page:1:per_page:25', value: null,        duration: 0.3, connection: 'redis' },
    { type: 'write', key: 'users:page:1:per_page:25', value: '[...]',     duration: 1.2, connection: 'redis' },
    { type: 'hit',   key: 'settings:app.name',        value: '"My App"',  duration: 0.1, connection: 'redis' },
    { type: 'hit',   key: 'roles:all',                value: '[...]',     duration: 0.2, connection: 'redis' },
  ],
  cacheStats: { reads: 4, hits: 2, writes: 1, deletes: 0, time: 1.8 },

  redisCommands: [
    { command: 'GET',   key: 'users:page:1:per_page:25', parameters: ['users:page:1:per_page:25'], duration: 0.3 },
    { command: 'SETEX', key: 'users:page:1:per_page:25', parameters: ['users:page:1:per_page:25', '3600', '[...]'], duration: 1.2 },
    { command: 'GET',   key: 'settings:app.name',        parameters: ['settings:app.name'], duration: 0.1 },
    { command: 'GET',   key: 'roles:all',                parameters: ['roles:all'], duration: 0.2 },
  ],

  httpRequests: [
    { request: { method: 'POST', url: 'https://api.mailgun.net/v3/mg.example.com/messages' }, response: { status: 502 }, duration: 340.5, time: 1779088876.5, error: null, stats: { timing: { lookup: 12, connect: 45, waiting: 280, transfer: 3.5 } } },
    { request: { method: 'GET',  url: 'https://api.github.com/repos/laravel/framework/releases/latest' }, response: { status: 200 }, duration: 210.3, time: 1779088876.2, error: null },
  ],

  logs: [
    { level: 'error',   message: 'SQLSTATE[HY000]: General error: 2006 MySQL server has gone away', time: 1779088878.1, context: { query: 'SELECT * FROM users...' }, trace: [{ file: 'app/Http/Controllers/UserController.php', line: 42, call: 'UserController@index' }] },
    { level: 'warning', message: 'Slow query detected (>1000ms)', time: 1779088878.0, context: { duration: 1840.2 } },
    { level: 'info',    message: 'User admin logged in', time: 1779088876.5, context: { user_id: 42 } },
    { level: 'debug',   message: 'Cache miss for key: users:page:1:per_page:25', time: 1779088876.48, context: { key: 'users:page:1:per_page:25' } },
    { level: 'debug',   message: 'Executing query on connection [mysql]', time: 1779088876.47, context: null },
  ],

  events: [
    { event: 'Illuminate\\Database\\Events\\QueryExecuted', data: { sql: 'SELECT * FROM users...', time: 1840.2 }, listeners: [], duration: null, time: 1779088878.2 },
    { event: 'eloquent.retrieved: App\\Models\\User', data: { model: 'App\\Models\\User', count: 25 }, listeners: [], duration: 0.5, time: 1779088876.48 },
  ],

  viewsData: [
    { description: 'Rendering a view', data: { name: 'users.index', data: {} }, duration: 880, start: 1779088876.48, end: 1779088877.36 },
    { description: 'Rendering a view', data: { name: 'layouts.app', data: {} }, duration: 120, start: 1779088876.49, end: 1779088876.61 },
    { description: 'Rendering a view', data: { name: 'partials.pagination', data: {} }, duration: 45, start: 1779088877.3, end: 1779088877.345 },
  ],
}

// The prototype's list→detail link used a numeric ?idx. We keep it for parity, but the
// detail payload is a single mocked record. findByIdx resolves safely for any id/idx.
export function getRequestDetail(/* id */) {
  return DETAIL
}
