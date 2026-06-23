<?php

return [

    /*
    |------------------------------------------------------------------------------------------------------------------
    | Enable Clockwork
    |------------------------------------------------------------------------------------------------------------------
    |
    | Clockwork is enabled by default only when your application is in debug mode. Here you can explicitly enable or
    | disable Clockwork. When disabled, no data is collected and the api and web ui are inactive.
    | Unless explicitly enabled, Clockwork only runs on localhost, *.local, *.test and *.wip domains.
    |
    | Clockwork 默认仅在应用处于调试模式(debug mode)时启用。在此你可以显式地启用或禁用 Clockwork。
    | 禁用后,不会收集任何数据,API 与 Web 界面也将处于非活动状态。
    | 除非显式启用,Clockwork 仅在 localhost、*.local、*.test 和 *.wip 域名下运行。
    |
    */

    'enable' => env('CLOCKWORK_ENABLE', null),

    /*
    |------------------------------------------------------------------------------------------------------------------
    | Features
    |------------------------------------------------------------------------------------------------------------------
    |
    | You can enable or disable various Clockwork features here. Some features have additional settings (eg. slow query
    | threshold for database queries).
    |
    | 在此可以启用或禁用 Clockwork 的各项功能。部分功能带有附加设置(例如数据库查询的慢查询阈值)。
    |
    */

    'features' => [

        // Cache usage stats and cache queries including results
        // 缓存使用统计以及缓存查询(含结果)
        'cache' => [
            'enabled' => env('CLOCKWORK_CACHE_ENABLED', true),

            // Collect cache queries
            // 收集缓存查询
            'collect_queries' => env('CLOCKWORK_CACHE_QUERIES', true),

            // Collect values from cache queries (high performance impact with a very high number of queries)
            // 收集缓存查询的值(在查询量非常大时对性能影响较大)
            'collect_values' => env('CLOCKWORK_CACHE_COLLECT_VALUES', false)
        ],

        // Database usage stats and queries
        // 数据库使用统计及查询
        'database' => [
            'enabled' => env('CLOCKWORK_DATABASE_ENABLED', true),

            // Collect database queries (high performance impact with a very high number of queries)
            // 收集数据库查询(在查询量非常大时对性能影响较大)
            'collect_queries' => env('CLOCKWORK_DATABASE_COLLECT_QUERIES', true),

            // Collect details of models updates (high performance impact with a lot of model updates)
            // 收集模型更新详情(在模型更新较多时对性能影响较大)
            'collect_models_actions' => env('CLOCKWORK_DATABASE_COLLECT_MODELS_ACTIONS', true),

            // Collect details of retrieved models (very high performance impact with a lot of models retrieved)
            // 收集从数据库查询(retrieved)出来的每个模型的属性内容(查询大量模型时性能影响极大)
            'collect_models_retrieved' => env('CLOCKWORK_DATABASE_COLLECT_MODELS_RETRIEVED', false),

            // Query execution time threshold in milliseconds after which the query will be marked as slow
            // 查询执行时间阈值(毫秒),超过该阈值的查询将被标记为慢查询
            'slow_threshold' => env('CLOCKWORK_DATABASE_SLOW_THRESHOLD'),

            // Collect only slow database queries
            // 仅收集慢数据库查询
            'slow_only' => env('CLOCKWORK_DATABASE_SLOW_ONLY', false),

            // Detect and report duplicate queries
            // 检测并报告重复查询
            'detect_duplicate_queries' => env('CLOCKWORK_DATABASE_DETECT_DUPLICATE_QUERIES', false),

            // Collect database query results (high performance impact with large result sets)
            // 收集数据库查询结果(在结果集较大时对性能影响较大)
            'collect_results' => env('CLOCKWORK_DATABASE_COLLECT_RESULTS', false),

            // Maximum number of rows to collect per query result (0 for unlimited)
            // 每个查询结果最多收集的行数(0 表示不限)
            'max_result_rows' => env('CLOCKWORK_DATABASE_MAX_RESULT_ROWS', 25)
        ],

        // Dispatched events
        // 已分发(dispatched)的事件
        'events' => [
            'enabled' => env('CLOCKWORK_EVENTS_ENABLED', true),

            // Ignored events (framework events are ignored by default)
            // 忽略的事件(框架事件默认已被忽略)
            'ignored_events' => [
                // App\Events\UserRegistered::class,
                // 'user.registered'
            ],
        ],

        // Sent HTTP requests
        // 已发送的 HTTP 请求
        'http_requests' => [
            'enabled' => env('CLOCKWORK_HTTP_REQUESTS_ENABLED', true),

            // Collect structured request and response content (json and form data)
            // 收集结构化的请求与响应内容(json 和表单数据)
            'collect_data' => env('CLOCKWORK_HTTP_REQUESTS_COLLECT_DATA', true),

            // Collect raw request and response content (high storage usage with large responses)
            // 收集原始的请求与响应内容(在响应较大时存储占用较高)
            'collect_raw_data' => env('CLOCKWORK_HTTP_REQUESTS_COLLECT_RAW_DATA', true)
        ],

        // Laravel log (you can still log directly to Clockwork with laravel log disabled)
        // Laravel 日志(即使禁用 Laravel 日志,你仍可直接向 Clockwork 记录日志)
        'log' => [
            'enabled' => env('CLOCKWORK_LOG_ENABLED', true)
        ],

        // Sent notifications
        // 已发送的通知
        'notifications' => [
            'enabled' => env('CLOCKWORK_NOTIFICATIONS_ENABLED', true),
        ],

        // Performance metrics
        // 性能指标
        'performance' => [
            // Allow collecting of client metrics. Requires separate clockwork-browser npm package.
            // 允许收集客户端指标。需要单独安装 clockwork-browser npm 包。
            'client_metrics' => env('CLOCKWORK_PERFORMANCE_CLIENT_METRICS', true)
        ],

        // Dispatched queue jobs
        // 已分发的队列任务
        'queue' => [
            'enabled' => env('CLOCKWORK_QUEUE_ENABLED', true)
        ],

        // Redis commands
        // Redis 命令
        'redis' => [
            'enabled' => env('CLOCKWORK_REDIS_ENABLED', true)
        ],

        // Routes list
        // 路由列表
        'routes' => [
            'enabled' => env('CLOCKWORK_ROUTES_ENABLED', false),

            // Collect only routes from particular namespaces (only application routes by default)
            // 仅收集来自特定命名空间的路由(默认仅应用路由)
            'only_namespaces' => ['App']
        ],

        // Rendered views
        // 已渲染的视图
        'views' => [
            'enabled' => env('CLOCKWORK_VIEWS_ENABLED', true),

            // Collect views including view data (high performance impact with a high number of views)
            // 收集视图(含视图数据)(在视图数量较多时对性能影响较大)
            'collect_data' => env('CLOCKWORK_VIEWS_COLLECT_DATA', false),

            // Use Twig profiler instead of Laravel events for apps using laravel-twigbridge (more precise, but does
            // not support collecting view data)
            // 对使用 laravel-twigbridge 的应用,改用 Twig profiler 替代 Laravel 事件(更精确,但不支持收集视图数据)
            'use_twig_profiler' => env('CLOCKWORK_VIEWS_USE_TWIG_PROFILER', false)
        ]

    ],

    /*
    |------------------------------------------------------------------------------------------------------------------
    | Enable web UI
    |------------------------------------------------------------------------------------------------------------------
    |
    | Clockwork comes with a web UI accessible via http://your.app/clockwork. Here you can enable or disable this
    | feature. You can also set a custom path for the web UI.
    |
    | Clockwork 自带一个 Web 界面,可通过 http://your.app/clockwork 访问。在此可启用或禁用该功能,
    | 也可为 Web 界面设置自定义路径。
    |
    */

    'web' => env('CLOCKWORK_WEB', true),

    /*
    |------------------------------------------------------------------------------------------------------------------
    | Enable toolbar
    |------------------------------------------------------------------------------------------------------------------
    |
    | Clockwork can show a toolbar with basic metrics on all responses. Here you can enable or disable this feature.
    | Requires a separate clockwork-browser npm library.
    | For installation instructions see https://underground.works/clockwork/#docs-viewing-data
    |
    | Clockwork 可以在所有响应上显示一个包含基础指标的工具栏。在此可启用或禁用该功能。
    | 需要单独安装 clockwork-browser npm 库。
    | 安装说明见 https://underground.works/clockwork/#docs-viewing-data
    |
    */

    'toolbar' => env('CLOCKWORK_TOOLBAR', true),

    /*
    |------------------------------------------------------------------------------------------------------------------
    | HTTP requests collection
    |------------------------------------------------------------------------------------------------------------------
    |
    | Clockwork collects data about HTTP requests to your app. Here you can choose which requests should be collected.
    |
    | Clockwork 会收集发往应用的 HTTP 请求数据。在此可选择需要收集哪些请求。
    |
    */

    'requests' => [
        // With on-demand mode enabled, Clockwork will only profile requests when the browser extension is open or you
        // manually pass a "clockwork-profile" cookie or get/post data key.
        // Optionally you can specify a "secret" that has to be passed as the value to enable profiling.
        // 启用按需模式(on-demand)后,Clockwork 仅在浏览器扩展打开、或你手动传入 "clockwork-profile" cookie
        // 或 get/post 数据键时,才对请求进行性能分析(profiling)。
        // 你也可以指定一个 "secret",必须以该值传入才能启用性能分析。
        'on_demand' => env('CLOCKWORK_REQUESTS_ON_DEMAND', false),

        // Collect only errors (requests with HTTP 4xx and 5xx responses)
        // 仅收集错误请求(响应为 HTTP 4xx 和 5xx 的请求)
        'errors_only' => env('CLOCKWORK_REQUESTS_ERRORS_ONLY', false),

        // Response time threshold in milliseconds after which the request will be marked as slow
        // 响应时间阈值(毫秒),超过该阈值的请求将被标记为慢请求
        'slow_threshold' => env('CLOCKWORK_REQUESTS_SLOW_THRESHOLD'),

        // Collect only slow requests
        // 仅收集慢请求
        'slow_only' => env('CLOCKWORK_REQUESTS_SLOW_ONLY', false),

        // Sample the collected requests (e.g. set to 100 to collect only 1 in 100 requests)
        // 对收集到的请求进行采样(例如设为 100 表示每 100 个请求只收集 1 个)
        'sample' => env('CLOCKWORK_REQUESTS_SAMPLE', false),

        // List of URIs that should not be collected
        // 不应收集的 URI 列表
        'except' => [
            '/horizon/.*', // Laravel Horizon requests / Laravel Horizon 请求
            '/telescope/.*', // Laravel Telescope requests / Laravel Telescope 请求
            '/_tt/.*', // Laravel Telescope toolbar / Laravel Telescope 工具栏
            '/_debugbar/.*', // Laravel DebugBar requests / Laravel DebugBar 请求
        ],

        // List of URIs that should be collected, any other URI will not be collected if not empty
        // 应收集的 URI 列表;若不为空,则其他 URI 都不会被收集
        'only' => [
            // '/api/.*'
        ],

        // Don't collect OPTIONS requests, mostly used in the CSRF pre-flight requests and are rarely of interest
        // 不收集 OPTIONS 请求,这类请求多用于 CSRF 预检,通常没有关注价值
        'except_preflight' => env('CLOCKWORK_REQUESTS_EXCEPT_PREFLIGHT', true)
    ],

    /*
    |------------------------------------------------------------------------------------------------------------------
    | Artisan commands collection
    |------------------------------------------------------------------------------------------------------------------
    |
    | Clockwork can collect data about executed artisan commands. Here you can enable and configure which commands
    | should be collected.
    |
    | Clockwork 可以收集已执行的 artisan 命令的数据。在此可启用并配置需要收集哪些命令。
    |
    */

    'artisan' => [
        // Enable or disable collection of executed Artisan commands
        // 启用或禁用对已执行 Artisan 命令的收集
        'collect' => env('CLOCKWORK_ARTISAN_COLLECT', false),

        // List of commands that should not be collected (built-in commands are not collected by default)
        // 不应收集的命令列表(内置命令默认不被收集)
        'except' => [
            // 'inspire'
        ],

        // List of commands that should be collected, any other command will not be collected if not empty
        // 应收集的命令列表;若不为空,则其他命令都不会被收集
        'only' => [
            // 'inspire'
        ],

        // Enable or disable collection of command output
        // 启用或禁用命令输出的收集
        'collect_output' => env('CLOCKWORK_ARTISAN_COLLECT_OUTPUT', false),

        // Enable or disable collection of built-in Laravel commands
        // 启用或禁用对内置 Laravel 命令的收集
        'except_laravel_commands' => env('CLOCKWORK_ARTISAN_EXCEPT_LARAVEL_COMMANDS', true)
    ],

    /*
    |------------------------------------------------------------------------------------------------------------------
    | Queue jobs collection
    |------------------------------------------------------------------------------------------------------------------
    |
    | Clockwork can collect data about executed queue jobs. Here you can enable and configure which queue jobs should
    | be collected.
    |
    | Clockwork 可以收集已执行队列任务的数据。在此可启用并配置需要收集哪些队列任务。
    |
    */

    'queue' => [
        // Enable or disable collection of executed queue jobs
        // 启用或禁用对已执行队列任务的收集
        'collect' => env('CLOCKWORK_QUEUE_COLLECT', false),

        // List of queue jobs that should not be collected
        // 不应收集的队列任务列表
        'except' => [
            // App\Jobs\ExpensiveJob::class
        ],

        // List of queue jobs that should be collected, any other queue job will not be collected if not empty
        // 应收集的队列任务列表;若不为空,则其他队列任务都不会被收集
        'only' => [
            // App\Jobs\BuggyJob::class
        ]
    ],

    /*
    |------------------------------------------------------------------------------------------------------------------
    | Tests collection
    |------------------------------------------------------------------------------------------------------------------
    |
    | Clockwork can collect data about executed tests. Here you can enable and configure which tests should be
    | collected.
    |
    | Clockwork 可以收集已执行测试的数据。在此可启用并配置需要收集哪些测试。
    |
    */

    'tests' => [
        // Enable or disable collection of ran tests
        // 启用或禁用对已运行测试的收集
        'collect' => env('CLOCKWORK_TESTS_COLLECT', false),

        // List of tests that should not be collected
        // 不应收集的测试列表
        'except' => [
            // Tests\Unit\ExampleTest::class
        ]
    ],

    /*
    |------------------------------------------------------------------------------------------------------------------
    | Enable data collection when Clockwork is disabled
    |------------------------------------------------------------------------------------------------------------------
    |
    | You can enable this setting to collect data even when Clockwork is disabled, e.g. for future analysis.
    |
    | 你可以启用此项,以便在 Clockwork 被禁用时仍然收集数据(例如用于日后分析)。
    |
    */

    'collect_data_always' => env('CLOCKWORK_COLLECT_DATA_ALWAYS', false),

    /*
    |------------------------------------------------------------------------------------------------------------------
    | Metadata storage
    |------------------------------------------------------------------------------------------------------------------
    |
    | Configure how is the metadata collected by Clockwork stored. Two options are available:
    |   - sql - Stores requests (and operations, as first-class rows) in a sql database. Supports MySQL, PostgreSQL and SQLite. Requires PDO.
    |   - redis - Stores requests in redis. Requires phpredis. (The operations center is SQL-only.)
    |
    | 配置 Clockwork 收集到的元数据如何存储。可选项有两种:
    |   - sql —— 将请求(以及操作,作为一等行)存储在 SQL 数据库中。支持 MySQL、PostgreSQL 和 SQLite。需要 PDO。
    |   - redis —— 将请求存储在 redis 中。需要 phpredis。(操作中心仅支持 SQL。)
    |
    */

    'storage' => env('CLOCKWORK_STORAGE', 'sql'),

    // SQL database to use, can be a name of database configured in database.php or a path to a SQLite file
    // 要使用的 SQL 数据库,可以是 database.php 中配置的数据库名称,或 SQLite 文件路径
    'storage_sql_database' => env('CLOCKWORK_STORAGE_SQL_DATABASE', storage_path('clockwork.sqlite')),

    // SQL table name to use, the table is automatically created and updated when needed
    // 要使用的 SQL 表名;该表会在需要时自动创建和更新
    'storage_sql_table' => env('CLOCKWORK_STORAGE_SQL_TABLE', 'clockwork'),

    // SQL table storing operations as first-class rows (powers the operation-centric center)
    // 将操作作为一等行存储的 SQL 表(支撑以操作为中心的中心)
    'storage_sql_operations_table' => env('CLOCKWORK_STORAGE_SQL_OPERATIONS_TABLE', 'clockwork_operations'),

    // Redis connection, name of redis connection or cluster configured in database.php
    // Redis 连接,即 database.php 中配置的 redis 连接或集群名称
    'storage_redis' => env('CLOCKWORK_STORAGE_REDIS', 'default'),

    // Redis prefix for Clockwork keys ("clockwork" if not set)
    // Clockwork 键的 Redis 前缀(未设置时为 "clockwork")
    'storage_redis_prefix' => env('CLOCKWORK_STORAGE_REDIS_PREFIX', 'clockwork'),

    // Automatically delete requests and operations older than this many hours (0 keeps nothing; runs on each store)
    // 自动删除超过此小时数的请求与操作(0 表示不保留任何数据;每次存储时都会执行)
    'storage_retention_hours' => env('CLOCKWORK_STORAGE_RETENTION_HOURS', 168),

    // Run automatic cleanup after each store; set to false to only clean via clockwork:clean
    // 每次存储后运行自动清理;设为 false 则仅通过 clockwork:clean 命令清理
    'storage_cleanup_enabled' => env('CLOCKWORK_STORAGE_CLEANUP_ENABLED', true),

    /*
    |------------------------------------------------------------------------------------------------------------------
    | Authentication
    |------------------------------------------------------------------------------------------------------------------
    |
    | Clockwork can be configured to require authentication before allowing access to the collected data. This might be
    | useful when the application is publicly accessible. Setting to true will enable a simple authentication with a
    | pre-configured password. You can also pass a class name of a custom implementation.
    |
    | 可将 Clockwork 配置为在允许访问收集到的数据之前要求身份验证。当应用可被公开访问时,这可能会很有用。
    | 设为 true 将启用一个使用预设密码的简单身份验证。你也可以传入自定义实现类的类名。
    |
    */

    'authentication' => env('CLOCKWORK_AUTHENTICATION', false),

    // Password for the simple authentication
    // 简单身份验证所用的密码
    'authentication_password' => env('CLOCKWORK_AUTHENTICATION_PASSWORD', 'VerySecretPassword'),

    /*
    |------------------------------------------------------------------------------------------------------------------
    | Stack traces collection
    |------------------------------------------------------------------------------------------------------------------
    |
    | Clockwork can collect stack traces for log messages and certain data like database queries. Here you can set
    | whether to collect stack traces, limit the number of collected frames and set further configuration. Collecting
    | long stack traces considerably increases metadata size.
    |
    | Clockwork 可以为日志消息以及数据库查询等特定数据收集堆栈跟踪。在此可设置是否收集堆栈跟踪、限制收集
    | 的帧数,并进行进一步配置。收集过长的堆栈跟踪会显著增加元数据体积。
    |
    */

    'stack_traces' => [
        // Enable or disable collecting of stack traces
        // 启用或禁用堆栈跟踪的收集
        'enabled' => env('CLOCKWORK_STACK_TRACES_ENABLED', true),

        // Limit the number of frames to be collected
        // 限制要收集的帧数
        'limit' => env('CLOCKWORK_STACK_TRACES_LIMIT', 10),

        // List of vendor names to skip when determining caller, common vendors are automatically added
        // 在判定调用方时要跳过的 vendor 名称列表;常见 vendor 会被自动加入
        'skip_vendors' => [
            // 'phpunit'
        ],

        // List of namespaces to skip when determining caller
        // 在判定调用方时要跳过的命名空间列表
        'skip_namespaces' => [
            // 'Laravel'
        ],

        // List of class names to skip when determining caller
        // 在判定调用方时要跳过的类名列表
        'skip_classes' => [
            // App\CustomLog::class
        ]

    ],

    /*
    |------------------------------------------------------------------------------------------------------------------
    | Serialization
    |------------------------------------------------------------------------------------------------------------------
    |
    | Clockwork serializes the collected data to json for storage and transfer. Here you can configure certain aspects
    | of serialization. Serialization has a large effect on the cpu time and memory usage.
    |
    | Clockwork 会将收集到的数据序列化为 json,以便存储和传输。在此可配置序列化的若干方面。
    | 序列化对 CPU 时间和内存占用有较大影响。
    |
    */

    // Maximum depth of serialized multi-level arrays and objects
    // 序列化多层数组与对象的最大深度
    'serialization_depth' => env('CLOCKWORK_SERIALIZATION_DEPTH', 10),

    // A list of classes that will never be serialized (e.g. a common service container class)
    // 永远不会被序列化的类列表(例如常见的服务容器类)
    'serialization_blackbox' => [
        \Illuminate\Container\Container::class,
        \Illuminate\Foundation\Application::class,
        \Laravel\Lumen\Application::class
    ],

    /*
    |------------------------------------------------------------------------------------------------------------------
    | Register helpers
    |------------------------------------------------------------------------------------------------------------------
    |
    | Clockwork comes with a "clock" global helper function. You can use this helper to quickly log something and to
    | access the Clockwork instance.
    |
    | Clockwork 自带一个 "clock" 全局辅助函数。你可以用该辅助函数快速记录日志,并访问 Clockwork 实例。
    |
    */

    'register_helpers' => env('CLOCKWORK_REGISTER_HELPERS', true),

    /*
    |------------------------------------------------------------------------------------------------------------------
    | Send headers for AJAX request
    |------------------------------------------------------------------------------------------------------------------
    |
    | When trying to collect data, the AJAX method can sometimes fail if it is missing required headers. For example, an
    | API might require a version number using Accept headers to route the HTTP request to the correct codebase.
    |
    | 在尝试收集数据时,如果缺少必要的请求头,AJAX 方式有时会失败。例如,某个 API 可能需要通过 Accept 请求头
    | 携带版本号,以便将 HTTP 请求路由到正确的代码库。
    |
    */

    'headers' => [
        // 'Accept' => 'application/vnd.com.whatever.v1+json',
    ],

    /*
    |------------------------------------------------------------------------------------------------------------------
    | Server timing
    |------------------------------------------------------------------------------------------------------------------
    |
    | Clockwork supports the W3C Server Timing specification, which allows for collecting a simple performance metrics
    | in a cross-browser way. E.g. in Chrome, your app, database and timeline event timings will be shown in the Dev
    | Tools network tab. This setting specifies the max number of timeline events that will be sent. Setting to false
    | will disable the feature.
    |
    | Clockwork 支持 W3C 的 Server Timing 规范,可跨浏览器收集简单的性能指标。例如在 Chrome 中,你的应用、
    | 数据库和时间线事件的计时信息会显示在 Dev Tools(开发者工具)的网络(Network)标签页中。此项设置要发送
    | 的时间线事件的最大数量。设为 false 将禁用该功能。
    |
    */

    'server_timing' => env('CLOCKWORK_SERVER_TIMING', 10)

];
