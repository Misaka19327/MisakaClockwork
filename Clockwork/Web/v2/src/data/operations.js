// Operations-center mock data — ported from operations.html CATEGORIES.
// Pure data only; per-category KPI/detail/cell rendering lives in pages/Operations.jsx.

export const CATEGORIES = {
  database: {
    name: '数据库',
    title: '数据库查询',
    icon: 'database',
    filterPlaceholder: '搜索 SQL / 连接 / 文件…',
    cols: [
      { id: 'query',      label: 'SQL', w: 'auto',   cls: 'cell-sql' },
      { id: 'duration',   label: '耗时', w: '90px',  cls: 'cell-dur', sortable: true },
      { id: 'connection', label: '连接', w: '80px',  cls: 'cell-mono' },
      { id: 'source',     label: '来源', w: '200px', cls: 'cell-src' },
      { id: 'request',    label: '请求', w: '160px', cls: 'cell-src' },
    ],
    kpi: { select: 4201, insert: 412, update: 780, delete: 301, other: 110, slow: 31, avgDuration: 42.3, totalDuration: 245800, requestCount: 892 },
    data: [
      { query: 'SELECT * FROM `users` WHERE `deleted_at` IS NULL ORDER BY `created_at` DESC LIMIT 25 OFFSET 0', duration: 1840.2, connection: 'mysql', file: 'app/Http/Controllers/UserController.php:42', requestId: '1779256690-1032', requestUri: 'GET /api/users?page=1', tags: ['slow'], model: 'App\\Models\\User', type: 'select', bindings: { limit: 25, offset: 0 }, trace: [{ file: 'app/Http/Controllers/UserController.php', line: 42, call: 'UserController@index' }, { file: 'app/Models/User.php', line: 28, call: 'User::with→roles' }, { file: 'vendor/laravel/framework/src/Illuminate/Database/Query/Builder.php', line: 3124, call: 'Builder::get' }] },
      { query: 'SELECT COUNT(*) AS aggregate FROM `users` WHERE `deleted_at` IS NULL', duration: 45.8, connection: 'mysql', file: 'app/Http/Controllers/UserController.php:38', requestId: '1779256690-1032', requestUri: 'GET /api/users?page=1', model: 'App\\Models\\User', type: 'select', bindings: {}, trace: null },
      { query: 'SELECT * FROM `roles` INNER JOIN `role_user` ON `roles`.`id` = `role_user`.`role_id` WHERE `role_user`.`user_id` IN (1..25)', duration: 82.3, connection: 'mysql', file: 'app/Models/User.php:28', requestId: '1779256690-1032', requestUri: 'GET /api/users?page=1', tags: ['n+1'], model: 'App\\Models\\Role', type: 'select', bindings: {} },
      { query: 'UPDATE `users` SET `last_login` = ?, `login_count` = ? WHERE `id` = ?', duration: 8.4, connection: 'mysql', file: 'app/Http/Controllers/AuthController.php:156', requestId: '1779256685-7812', requestUri: 'POST /login', type: 'update', bindings: { 0: '2026-06-20', 1: 47, 2: 42 } },
      { query: 'INSERT INTO `orders` (`user_id`, `total`, `status`) VALUES (?, ?, ?)', duration: 12.1, connection: 'mysql', file: 'app/Http/Controllers/OrderController.php:89', requestId: '1779256678-4401', requestUri: 'POST /api/orders', type: 'insert', bindings: { 0: 42, 1: '199.00', 2: 'pending' } },
      { query: 'SELECT * FROM `products` WHERE `category_id` = ? AND `status` = ? ORDER BY `price` ASC LIMIT 50', duration: 230.6, connection: 'mysql', file: 'app/Http/Controllers/ProductController.php:112', requestId: '1779256670-2215', requestUri: 'GET /api/products?category=3', tags: ['slow'], model: 'App\\Models\\Product', type: 'select', bindings: { 0: 3, 1: 'active' } },
      { query: 'DELETE FROM `sessions` WHERE `last_activity` < ?', duration: 4.2, connection: 'mysql', file: 'app/Console/Commands/CleanSessions.php:22', requestId: '1779256665-9904', requestUri: 'artisan session:clean', type: 'delete', bindings: { 0: 1779085276 } },
      { query: 'SELECT * FROM `settings` WHERE `key` = ? LIMIT 1', duration: 0.8, connection: 'mysql', file: 'app/Providers/AppServiceProvider.php:45', requestId: '1779256690-1032', requestUri: 'GET /api/users?page=1', type: 'select', bindings: { 0: 'app.name' } },
      { query: 'SELECT `orders`.*, `users`.`name` FROM `orders` JOIN `users` ON `orders`.`user_id` = `users`.`id` WHERE `orders`.`status` = ?', duration: 156.4, connection: 'mysql', file: 'app/Http/Controllers/ReportController.php:67', requestId: '1779256655-3308', requestUri: 'GET /admin/reports/monthly', tags: ['slow'], type: 'select', bindings: { 0: 'completed' } },
      { query: 'SELECT * FROM `cache_locks` WHERE `key` = ? FOR UPDATE', duration: 2.3, connection: 'mysql', file: 'app/Jobs/ProcessPodcast.php:34', requestId: '1779256640-5512', requestUri: 'ProcessPodcast (queue)', type: 'other', bindings: { 0: 'podcast:123' } },
      { query: 'SELECT DISTINCT `category_id` FROM `products` WHERE `status` = ?', duration: 18.7, connection: 'mysql', file: 'app/Http/Controllers/CategoryController.php:28', requestId: '1779256630-1198', requestUri: 'GET /api/categories', type: 'select', bindings: { 0: 'active' } },
      { query: 'UPDATE `products` SET `stock` = `stock` - ? WHERE `id` = ? AND `stock` >= ?', duration: 6.5, connection: 'mysql', file: 'app/Http/Controllers/CheckoutController.php:145', requestId: '1779256678-4401', requestUri: 'POST /api/checkout', type: 'update', bindings: { 0: 1, 1: 7, 2: 1 } },
    ],
  },

  cache: {
    name: '缓存',
    title: '缓存操作',
    icon: 'cache',
    filterPlaceholder: '搜索缓存键 / 连接…',
    cols: [
      { id: 'type',       label: '操作', w: '80px',  cls: null },
      { id: 'key',        label: '键',   w: 'auto',  cls: 'cell-mono' },
      { id: 'value',      label: '值',   w: '200px', cls: 'cell-mono' },
      { id: 'duration',   label: '耗时', w: '90px',  cls: 'cell-dur', sortable: true },
      { id: 'connection', label: '存储', w: '80px',  cls: 'cell-mono' },
      { id: 'request',    label: '请求', w: '160px', cls: 'cell-src' },
    ],
    kpi: { hits: 1840, misses: 420, writes: 810, deletes: 130, readTotal: 2260, hitRate: 81.4, avgDuration: 0.48, totalTime: 1536, requestCount: 740 },
    data: [
      { type: 'hit',    key: 'users:page:1:per_page:25',  value: '"[{id:1,name:\"Admin\"}...]"',         duration: 0.21, connection: 'redis', requestId: '1779256690-1032', requestUri: 'GET /api/users?page=1', expiration: null },
      { type: 'miss',   key: 'users:page:3:per_page:25',  value: null,                                   duration: 0.35, connection: 'redis', requestId: '1779256688-6602', requestUri: 'GET /api/users?page=3', expiration: null },
      { type: 'write',  key: 'users:page:3:per_page:25',  value: '"[...]"',                              duration: 1.45, connection: 'redis', requestId: '1779256688-6602', requestUri: 'GET /api/users?page=3', expiration: 3600 },
      { type: 'hit',    key: 'settings:app.name',         value: '"My App"',                             duration: 0.08, connection: 'redis', requestId: '1779256690-1032', requestUri: 'GET /api/users?page=1', expiration: null },
      { type: 'hit',    key: 'roles:all',                 value: '"[{\"id\":1,\"name\":\"admin\"}...]"', duration: 0.15, connection: 'redis', requestId: '1779256690-1032', requestUri: 'GET /api/users?page=1', expiration: null },
      { type: 'write',  key: 'products:category:3',       value: '"[...]"',                              duration: 2.10, connection: 'redis', requestId: '1779256670-2215', requestUri: 'GET /api/products?category=3', expiration: 1800 },
      { type: 'miss',   key: 'orders:report:daily',       value: null,                                   duration: 0.28, connection: 'redis', requestId: '1779256655-3308', requestUri: 'GET /admin/reports/monthly', expiration: null },
      { type: 'delete', key: 'user:42:profile',           value: null,                                   duration: 0.12, connection: 'redis', requestId: '1779256685-7812', requestUri: 'PUT /api/users/42', expiration: null },
      { type: 'hit',    key: 'config:mail.driver',        value: '"smtp"',                               duration: 0.07, connection: 'redis', requestId: '1779256640-5512', requestUri: 'ProcessPodcast (queue)', expiration: null },
      { type: 'write',  key: 'session:abc123def456',      value: '"[...]"',                              duration: 0.55, connection: 'redis', requestId: '1779256685-7812', requestUri: 'POST /login', expiration: 7200 },
    ],
  },

  redis: {
    name: 'Redis',
    title: 'Redis 命令',
    icon: 'redis',
    filterPlaceholder: '搜索命令 / 键…',
    cols: [
      { id: 'command',    label: '命令', w: '90px',  cls: 'cell-mono' },
      { id: 'key',        label: '键',   w: 'auto',  cls: 'cell-mono' },
      { id: 'parameters', label: '参数', w: '260px', cls: 'cell-mono' },
      { id: 'duration',   label: '耗时', w: '90px',  cls: 'cell-dur', sortable: true },
      { id: 'connection', label: '连接', w: '80px',  cls: 'cell-mono' },
      { id: 'request',    label: '请求', w: '160px', cls: 'cell-src' },
    ],
    kpi: { total: 4076, commands: { GET: 2340, SETEX: 520, HGETALL: 380, DEL: 210, INCR: 180, EXISTS: 150, LPUSH: 96, ZADD: 82, EXPIRE: 68, MGET: 50 }, avgDuration: 0.34, totalTime: 1386, requestCount: 810 },
    data: [
      { command: 'GET',     key: 'users:page:1:per_page:25', parameters: ['users:page:1:per_page:25'], duration: 0.31, connection: 'default', requestId: '1779256690-1032', requestUri: 'GET /api/users?page=1' },
      { command: 'SETEX',   key: 'users:page:3:per_page:25', parameters: ['users:page:3:per_page:25', '3600', '"[...]"'], duration: 1.52, connection: 'default', requestId: '1779256688-6602', requestUri: 'GET /api/users?page=3' },
      { command: 'MGET',    key: 'settings:app.name',        parameters: ['settings:app.name', 'settings:app.url', 'settings:app.timezone'], duration: 0.22, connection: 'default', requestId: '1779256690-1032', requestUri: 'GET /api/users?page=1' },
      { command: 'HGETALL', key: 'session:abc123',           parameters: ['session:abc123'], duration: 0.45, connection: 'default', requestId: '1779256685-7812', requestUri: 'POST /login' },
      { command: 'EXISTS',  key: 'locks:podcast:123',        parameters: ['locks:podcast:123'], duration: 0.09, connection: 'default', requestId: '1779256640-5512', requestUri: 'ProcessPodcast (queue)' },
      { command: 'INCR',    key: 'stats:api:requests:today', parameters: ['stats:api:requests:today'], duration: 0.18, connection: 'default', requestId: '1779256690-1032', requestUri: 'GET /api/users?page=1' },
      { command: 'ZADD',    key: 'leaderboard:daily',        parameters: ['leaderboard:daily', '420', 'user:42'], duration: 0.27, connection: 'default', requestId: '1779256655-3308', requestUri: 'GET /admin/reports/monthly' },
      { command: 'DEL',     key: 'user:42:profile',          parameters: ['user:42:profile'], duration: 0.11, connection: 'default', requestId: '1779256685-7812', requestUri: 'PUT /api/users/42' },
      { command: 'LPUSH',   key: 'queue:emails',             parameters: ['queue:emails', '{"to":"a@b.com","subject":"Welcome"}'], duration: 0.25, connection: 'default', requestId: '1779256690-1032', requestUri: 'GET /api/users?page=1' },
      { command: 'EXPIRE',  key: 'session:def456',           parameters: ['session:def456', '7200'], duration: 0.08, connection: 'default', requestId: '1779256685-7812', requestUri: 'POST /login' },
    ],
  },

  log: {
    name: '日志',
    title: '日志记录',
    icon: 'log',
    filterPlaceholder: '搜索日志消息…',
    // Note: log entries have NO duration — only level distribution is meaningful.
    cols: [
      { id: 'level',   label: '级别', w: '80px',  cls: null },
      { id: 'message', label: '消息', w: 'auto',  cls: 'cell-msg' },
      { id: 'time',    label: '时间', w: '110px', cls: 'cell-mono' },
      { id: 'request', label: '请求', w: '160px', cls: 'cell-src' },
    ],
    kpi: { error: 34, warning: 156, notice: 82, info: 420, debug: 8198, total: 8890, requestCount: 980, levels: { emergency: 0, alert: 0, critical: 1, error: 34, warning: 156, notice: 82, info: 420, debug: 8198 } },
    data: [
      { level: 'error',   message: 'SQLSTATE[HY000]: General error: 2006 MySQL server has gone away', time: '14:31:55.882', requestId: '1779256690-1032', requestUri: 'GET /api/users?page=1', context: { query: 'SELECT * FROM users...', connection: 'mysql' }, trace: [{ file: 'app/Http/Controllers/UserController.php', line: 42, call: 'UserController@index' }, { file: 'vendor/laravel/framework/src/Illuminate/Database/Connection.php', line: 671, call: 'Connection::runQueryCallback' }, { file: 'vendor/laravel/framework/src/Illuminate/Database/Connection.php', line: 478, call: 'Connection::run' }] },
      { level: 'warning', message: 'Slow query detected (>1000ms) on connection [mysql]', time: '14:31:55.881', requestId: '1779256690-1032', requestUri: 'GET /api/users?page=1', context: { duration: 1840.2, query: 'SELECT * FROM users...' }, trace: [{ file: 'app/Http/Controllers/UserController.php', line: 42, call: 'UserController@index' }, { file: 'app/Models/User.php', line: 28, call: 'User::all' }, { file: 'vendor/laravel/framework/src/Illuminate/Database/Eloquent/Builder.php', line: 627, call: 'Builder::get' }] },
      { level: 'error',   message: 'cURL error 28: Connection timed out after 5001ms (see https://curl.haxx.se/libcurl/c/libcurl-errors.html)', time: '14:31:55.500', requestId: '1779256690-1032', requestUri: 'GET /api/users?page=1', context: { url: 'https://api.mailgun.net/v3/mg.example.com/messages' } },
      { level: 'info',    message: 'User admin (id:42) logged in from 192.168.1.100', time: '14:31:02.111', requestId: '1779256685-7812', requestUri: 'POST /login', context: { user_id: 42, ip: '192.168.1.100' } },
      { level: 'warning', message: 'CSRF token mismatch — possible session expiry or cross-site request', time: '14:30:58.440', requestId: '1779256682-3309', requestUri: 'POST /api/checkout', context: { session_id: 'expired_token' } },
      { level: 'debug',   message: 'Cache miss for key: users:page:3:per_page:25', time: '14:30:55.120', requestId: '1779256688-6602', requestUri: 'GET /api/users?page=3', context: { key: 'users:page:3:per_page:25' } },
      { level: 'info',    message: 'Order #2026-0842 created — total ¥199.00', time: '14:30:45.880', requestId: '1779256678-4401', requestUri: 'POST /api/orders', context: { order_id: '2026-0842', total: '199.00' } },
      { level: 'debug',   message: 'Executing query on connection [mysql]: SELECT * FROM products WHERE category_id = 3', time: '14:30:42.100', requestId: '1779256670-2215', requestUri: 'GET /api/products?category=3', context: { query: 'SELECT * FROM products...' } },
      { level: 'notice',  message: 'Migration 2026_06_01_000000_create_users_table completed successfully', time: '14:30:20.000', requestId: '1779256665-9904', requestUri: 'artisan migrate', context: { migration: '2026_06_01_000000_create_users_table' } },
      { level: 'warning', message: 'Disk usage on /storage/logs approaching limit (92%)', time: '14:30:10.500', requestId: '1779256665-9904', requestUri: 'artisan queue:work', context: { disk: '/storage/logs', usage: '92%' } },
    ],
  },

  events: {
    name: '事件',
    title: '事件派发',
    icon: 'events',
    filterPlaceholder: '搜索事件名…',
    cols: [
      { id: 'event',     label: '事件',   w: '260px', cls: 'cell-mono' },
      { id: 'listeners', label: '监听器', w: '220px', cls: null },
      { id: 'duration',  label: '耗时',   w: '90px',  cls: 'cell-dur', sortable: true },
      { id: 'time',      label: '时间',   w: '110px', cls: 'cell-mono' },
      { id: 'request',   label: '请求',   w: '160px', cls: 'cell-src' },
    ],
    kpi: { total: 1420, topEvents: { 'eloquent.retrieved': 580, 'Illuminate\\Database\\Events\\QueryExecuted': 420, 'Illuminate\\Auth\\Events\\Login': 85, 'App\\Events\\OrderCreated': 48, 'Illuminate\\Mail\\Events\\MessageSent': 32 }, avgDuration: 3.2, requestCount: 620 },
    data: [
      { event: 'Illuminate\\Database\\Events\\QueryExecuted', data: { sql: 'SELECT * FROM users...', time: 1840.2 }, listeners: [], duration: null, time: '14:31:55.882', requestId: '1779256690-1032', requestUri: 'GET /api/users?page=1' },
      { event: 'eloquent.retrieved: App\\Models\\User', data: { model: 'App\\Models\\User', count: 25 }, listeners: [], duration: 0.52, time: '14:31:55.880', requestId: '1779256690-1032', requestUri: 'GET /api/users?page=1' },
      { event: 'Illuminate\\Auth\\Events\\Login', data: { user_id: 42, guard: 'web' }, listeners: ['App\\Listeners\\LogSuccessfulLogin', 'App\\Listeners\\UpdateLastLogin'], duration: 8.30, time: '14:31:02.111', requestId: '1779256685-7812', requestUri: 'POST /login' },
      { event: 'App\\Events\\OrderCreated', data: { order_id: '2026-0842', total: 199.0, user_id: 42 }, listeners: ['App\\Listeners\\SendOrderConfirmation', 'App\\Listeners\\UpdateInventory', 'App\\Listeners\\NotifyAdmin'], duration: 24.50, time: '14:30:45.880', requestId: '1779256678-4401', requestUri: 'POST /api/orders' },
      { event: 'Illuminate\\Mail\\Events\\MessageSent', data: { subject: 'Welcome', to: 'admin@example.com' }, listeners: [], duration: 1.20, time: '14:31:55.500', requestId: '1779256690-1032', requestUri: 'GET /api/users?page=1' },
      { event: 'App\\Events\\ProductSearched', data: { query: 'laptop', results_count: 48 }, listeners: ['App\\Listeners\\LogSearchQuery'], duration: 2.10, time: '14:30:42.100', requestId: '1779256670-2215', requestUri: 'GET /api/products?category=3' },
      { event: 'Illuminate\\Queue\\Events\\JobProcessed', data: { job: 'App\\Jobs\\ProcessPodcast', connection: 'redis' }, listeners: [], duration: 0.80, time: '14:30:40.500', requestId: '1779256640-5512', requestUri: 'ProcessPodcast (queue)' },
    ],
  },

  views: {
    name: '视图',
    title: '视图渲染',
    icon: 'views',
    filterPlaceholder: '搜索视图名…',
    cols: [
      { id: 'name',     label: '视图', w: 'auto',  cls: 'cell-mono' },
      { id: 'duration', label: '耗时', w: '90px',  cls: 'cell-dur', sortable: true },
      { id: 'request',  label: '请求', w: '160px', cls: 'cell-src' },
    ],
    kpi: { total: 2840, topViews: { 'users.index': 520, 'layouts.app': 510, 'partials.pagination': 480, 'dashboard.index': 340, 'products.search': 280, 'partials.product-card': 260, 'emails.welcome': 120 }, avgDuration: 28.5, totalTime: 80940, requestCount: 760, slowest: 880, slowestName: 'users.index', slowestCount: 520 },
    data: [
      { name: 'users.index',           duration: 880.0, start: 1779088876.48,  end: 1779088877.36,  description: 'Rendering a view', requestId: '1779256690-1032', requestUri: 'GET /api/users?page=1' },
      { name: 'layouts.app',           duration: 120.0, start: 1779088876.49,  end: 1779088876.61,  description: 'Rendering a view', requestId: '1779256690-1032', requestUri: 'GET /api/users?page=1' },
      { name: 'partials.pagination',   duration: 45.0,  start: 1779088877.30,  end: 1779088877.345, description: 'Rendering a view', requestId: '1779256690-1032', requestUri: 'GET /api/users?page=1' },
      { name: 'dashboard.index',       duration: 160.5, start: 1779088870.00,  end: 1779088870.160, description: 'Rendering a view', requestId: '1779256680-1150', requestUri: 'GET /dashboard' },
      { name: 'layouts.admin',         duration: 75.2,  start: 1779088870.01,  end: 1779088870.085, description: 'Rendering a view', requestId: '1779256680-1150', requestUri: 'GET /dashboard' },
      { name: 'products.search',       duration: 340.8, start: 1779088865.00,  end: 1779088865.340, description: 'Rendering a view', requestId: '1779256670-2215', requestUri: 'GET /api/products?category=3' },
      { name: 'partials.product-card', duration: 25.1,  start: 1779088865.10,  end: 1779088865.125, description: 'Rendering a view', requestId: '1779256670-2215', requestUri: 'GET /api/products?category=3' },
      { name: 'emails.welcome',        duration: 42.3,  start: 1779088860.00,  end: 1779088860.042, description: 'Rendering a view', requestId: '1779256690-1032', requestUri: 'GET /api/users?page=1' },
    ],
  },

  notifications: {
    name: '通知',
    title: '通知 / 邮件',
    icon: 'notifications',
    filterPlaceholder: '搜索主题 / 收件人…',
    cols: [
      { id: 'type',     label: '类型',   w: '80px',  cls: 'cell-mono' },
      { id: 'subject',  label: '主题',   w: 'auto',  cls: null },
      { id: 'to',       label: '收件人', w: '180px', cls: 'cell-mono' },
      { id: 'duration', label: '耗时',   w: '90px',  cls: 'cell-dur', sortable: true },
      { id: 'time',     label: '时间',   w: '110px', cls: 'cell-mono' },
      { id: 'request',  label: '请求',   w: '160px', cls: 'cell-src' },
    ],
    kpi: { total: 856, types: { mail: 680, sms: 120, slack: 56 }, avgDuration: 310.5, totalTime: 265780, requestCount: 380 },
    data: [
      { type: 'mail',  subject: 'Welcome to My App',                  to: 'admin@example.com',   from: 'noreply@myapp.com',  content: '<h1>Welcome!</h1><p>Thank you for registering...</p>',         duration: 310.5, time: '14:31:55.500', requestId: '1779256690-1032', requestUri: 'GET /api/users?page=1' },
      { type: 'mail',  subject: 'Your Order #2026-0842 Confirmation', to: 'admin@example.com',   from: 'orders@myapp.com',   content: '<h1>Order Confirmed</h1><p>Total: ¥199.00</p>',                duration: 280.2, time: '14:30:45.880', requestId: '1779256678-4401', requestUri: 'POST /api/orders' },
      { type: 'mail',  subject: 'Password Reset Request',             to: 'user@example.com',    from: 'security@myapp.com', content: '<p>Click here to reset your password...</p>',                   duration: 195.8, time: '14:30:30.100', requestId: '1779256675-8820', requestUri: 'POST /password/email' },
      { type: 'sms',   subject: 'Verification code',                  to: '+8613800138000',      from: 'MyApp',              content: 'Your verification code is 482931',                              duration: 850.4, time: '14:30:25.000', requestId: '1779256670-7715', requestUri: 'POST /api/verify/phone' },
      { type: 'mail',  subject: 'Weekly Report — 2026-W25',           to: 'manager@example.com', from: 'reports@myapp.com',  content: '<h1>Weekly Summary</h1><p>Total orders: 1,247...</p>',         duration: 450.1, time: '14:30:10.000', requestId: '1779256665-9904', requestUri: 'artisan report:weekly' },
      { type: 'mail',  subject: 'Failed Login Attempt',               to: 'admin@example.com',   from: 'security@myapp.com', content: '<p>5 failed login attempts detected...</p>',                    duration: 220.6, time: '14:29:58.440', requestId: '1779256660-3340', requestUri: 'POST /login' },
      { type: 'slack', subject: 'Deploy Complete',                    to: '#engineering',        from: 'deploy-bot',         content: 'Release v2.4.1 deployed to production',                         duration: 45.2,  time: '14:29:30.000', requestId: '1779256665-9904', requestUri: 'artisan deploy' },
    ],
  },
}

export const CATEGORY_ORDER = ['database', 'cache', 'redis', 'log', 'events', 'views', 'notifications']

// Sidebar badge counts (from the prototype sidebar)
export const NAV_COUNTS = {
  database: '5.8k', cache: '3.2k', redis: '4.1k', log: '8.9k', events: '1.4k', views: '2.8k', notifications: '856',
}
