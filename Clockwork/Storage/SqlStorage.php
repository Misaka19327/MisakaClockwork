<?php namespace Clockwork\Storage;

use Clockwork\Request\Request;
use PDO;

// SQL storage for requests using PDO. The 7 operation categories are stored as first-class rows
// in a separate operations table and reassembled onto the Request object at read time, so the
// getData/toArray contract is preserved while operation-centric queries stay cheap.
class SqlStorage extends Storage implements OperationsStorageInterface
{
    // PDO instance
    protected $pdo;

    // Name of the table with Clockwork requests metadata
    protected $table;

    // Name of the table storing operations as first-class rows
    protected $operationsTable;

    // Retention window in hours (requests/operations older than this are cleaned up)
    protected $retentionHours;

    // Whether automatic cleanup runs after each store
    protected $cleanupEnabled;

    // Schema for the Clockwork requests table — operation arrays are NOT stored here (they live
    // in the operations table); only the header, non-operation context, and denormalized counts
    // (which keep getStats cheap) remain.
    protected $fields = [
        'id' => 'VARCHAR(100) PRIMARY KEY',
        'version' => 'INTEGER',
        'type' => 'VARCHAR(100) NULL',
        'time' => 'DOUBLE PRECISION NULL',
        'method' => 'VARCHAR(10) NULL',
        'url' => 'TEXT NULL',
        'uri' => 'TEXT NULL',
        'headers' => 'TEXT NULL',
        'controller' => 'VARCHAR(250) NULL',
        'getData' => 'TEXT NULL',
        'postData' => 'TEXT NULL',
        'requestData' => 'TEXT NULL',
        'sessionData' => 'TEXT NULL',
        'authenticatedUser' => 'TEXT NULL',
        'cookies' => 'TEXT NULL',
        'responseTime' => 'DOUBLE PRECISION NULL',
        'responseStatus' => 'INTEGER NULL',
        'responseDuration' => 'DOUBLE PRECISION NULL',
        'memoryUsage' => 'DOUBLE PRECISION NULL',
        'middleware' => 'TEXT NULL',
        'databaseQueriesCount' => 'INTEGER NULL',
        'databaseSlowQueries' => 'INTEGER NULL',
        'databaseSelects' => 'INTEGER NULL',
        'databaseInserts' => 'INTEGER NULL',
        'databaseUpdates' => 'INTEGER NULL',
        'databaseDeletes' => 'INTEGER NULL',
        'databaseOthers' => 'INTEGER NULL',
        'databaseDuration' => 'DOUBLE PRECISION NULL',
        'cacheReads' => 'INTEGER NULL',
        'cacheHits' => 'INTEGER NULL',
        'cacheWrites' => 'INTEGER NULL',
        'cacheDeletes' => 'INTEGER NULL',
        'cacheTime' => 'DOUBLE PRECISION NULL',
        'modelsActions' => 'TEXT NULL',
        'modelsRetrieved' => 'TEXT NULL',
        'modelsCreated' => 'TEXT NULL',
        'modelsUpdated' => 'TEXT NULL',
        'modelsDeleted' => 'TEXT NULL',
        'queueJobs' => 'TEXT NULL',
        'timelineData' => 'TEXT NULL',
        'routes' => 'TEXT NULL',
        'userData' => 'TEXT NULL',
        'subrequests' => 'TEXT NULL',
        'httpRequests' => 'TEXT NULL',
        'xdebug' => 'TEXT NULL',
        'commandName' => 'TEXT NULL',
        'commandArguments' => 'TEXT NULL',
        'commandArgumentsDefaults' => 'TEXT NULL',
        'commandOptions' => 'TEXT NULL',
        'commandOptionsDefaults' => 'TEXT NULL',
        'commandExitCode' => 'INTEGER NULL',
        'commandOutput' => 'TEXT NULL',
        'jobName' => 'TEXT NULL',
        'jobDescription' => 'TEXT NULL',
        'jobStatus' => 'TEXT NULL',
        'jobPayload' => 'TEXT NULL',
        'jobQueue' => 'TEXT NULL',
        'jobConnection' => 'TEXT NULL',
        'jobOptions' => 'TEXT NULL',
        'testName' => 'TEXT NULL',
        'testStatus' => 'TEXT NULL',
        'testStatusMessage' => 'TEXT NULL',
        'testAsserts' => 'TEXT NULL',
        'clientMetrics' => 'TEXT NULL',
        'webVitals' => 'TEXT NULL',
        'parent' => 'TEXT NULL',
        'updateToken' => 'VARCHAR(100) NULL'
    ];

    // Request keys serialized to JSON before storage. Must stay in lockstep with $fields — the
    // operation-array keys (databaseQueries, cacheQueries, redisCommands, log, events, viewsData,
    // notifications, emailsData) are intentionally absent: they are reassembled from the operations
    // table at read time instead of round-tripped through this list.
    protected $needsSerialization = [
        'headers', 'getData', 'postData', 'requestData', 'sessionData', 'authenticatedUser', 'cookies', 'middleware',
        'modelsActions', 'modelsRetrieved', 'modelsCreated', 'modelsUpdated',
        'modelsDeleted', 'queueJobs', 'timelineData', 'routes', 'userData', 'httpRequests', 'subrequests', 'xdebug', 'commandArguments',
        'commandArgumentsDefaults', 'commandOptions', 'commandOptionsDefaults', 'jobPayload', 'jobOptions', 'testAsserts',
        'parent', 'clientMetrics', 'webVitals'
    ];

    // Maps an operation category to the Request property its rows reassemble into at read time.
    protected $categoryProperty = [
        'database' => 'databaseQueries', 'cache' => 'cacheQueries', 'redis' => 'redisCommands',
        'log' => 'log', 'events' => 'events', 'views' => 'viewsData',
    ];

    // Return a new storage, takes PDO object or DSN and optionally a table name and database
    // credentials as arguments. $operationsTable is positioned after the credentials to avoid
    // breaking positional callers that pass ($dsn, $table, $user, $pass).
    public function __construct($dsn, $table = 'clockwork', $username = null, $password = null, $operationsTable = 'clockwork_operations', $retentionHours = null, $cleanupEnabled = true)
    {
        $this->pdo = $dsn instanceof PDO ? $dsn : new PDO($dsn, $username, $password);
        $this->table = $table;
        $this->operationsTable = $operationsTable;
        $this->retentionHours = $retentionHours === null ? 168 : $retentionHours;
        $this->cleanupEnabled = $cleanupEnabled;
    }

    // Returns all requests
    public function all(?Search $search = null)
    {
        $fields = implode(', ', array_map(function ($field) {
            return $this->quote($field);
        }, array_keys($this->fields)));
        $search = SqlSearch::fromBase($search, $this->pdo);
        $result = $this->query("SELECT {$fields} FROM {$this->table} {$search->query}", $search->bindings);

        return $this->resultsToRequests($result);
    }

    // Return a single request by id
    public function find($id)
    {
        $fields = implode(', ', array_map(function ($field) {
            return $this->quote($field);
        }, array_keys($this->fields)));
        $result = $this->query("SELECT {$fields} FROM {$this->table} WHERE id = :id", ['id' => $id]);

        $requests = $this->resultsToRequests($result);
        return end($requests);
    }

    // Return the latest request
    public function latest(?Search $search = null)
    {
        $fields = implode(', ', array_map(function ($field) {
            return $this->quote($field);
        }, array_keys($this->fields)));
        $search = SqlSearch::fromBase($search, $this->pdo);
        $result = $this->query(
            "SELECT {$fields} FROM {$this->table} {$search->query} ORDER BY id DESC LIMIT 1", $search->bindings
        );

        $requests = $this->resultsToRequests($result);
        return end($requests);
    }

    // Return requests received before specified id, optionally limited to specified count
    public function previous($id, $count = null, ?Search $search = null)
    {
        $count = (int)$count;

        $fields = implode(', ', array_map(function ($field) {
            return $this->quote($field);
        }, array_keys($this->fields)));
        $search = SqlSearch::fromBase($search, $this->pdo)->addCondition('id < :id', ['id' => $id]);
        $limit = $count ? "LIMIT {$count}" : '';
        $result = $this->query(
            "SELECT {$fields} FROM {$this->table} {$search->query} ORDER BY id DESC {$limit}", $search->bindings
        );

        return array_reverse($this->resultsToRequests($result));
    }

    // Return requests received after specified id, optionally limited to specified count
    public function next($id, $count = null, ?Search $search = null)
    {
        $count = (int)$count;

        $fields = implode(', ', array_map(function ($field) {
            return $this->quote($field);
        }, array_keys($this->fields)));
        $search = SqlSearch::fromBase($search, $this->pdo)->addCondition('id > :id', ['id' => $id]);
        $limit = $count ? "LIMIT {$count}" : '';
        $result = $this->query(
            "SELECT {$fields} FROM {$this->table} {$search->query} ORDER BY id ASC {$limit}", $search->bindings
        );

        return $this->resultsToRequests($result);
    }

    // Store the request and its operations atomically. On the first run (tables missing) the lazy
    // bootstrap below creates both tables, then the store is retried once.
    public function store(Request $request)
    {
        try {
            $this->storeOnce($request);
        } catch (\PDOException $e) {
            // assume a missing or out-of-date schema, (re)create both tables and retry once
            $this->initialize();
            $this->storeOnce($request);
        }

        if ($this->cleanupEnabled) $this->cleanup();
    }

    // Update an existing request and replace its operations atomically.
    public function update(Request $request)
    {
        try {
            $this->updateOnce($request);
        } catch (\PDOException $e) {
            $this->initialize();
            $this->updateOnce($request);
        }

        if ($this->cleanupEnabled) $this->cleanup();
    }

    // Cleanup old requests and their operations. $force (or a zero retention window) clears
    // everything; otherwise rows older than the retention window are removed. This always runs
    // when called — the cleanupEnabled flag only gates the automatic cleanup after store/update.
    public function cleanup($force = false)
    {
        if ($force || $this->retentionHours === 0) {
            $this->query("DELETE FROM {$this->operationsTable}");
            $this->query("DELETE FROM {$this->table}");
            return;
        }

        $cutoff = time() - ($this->retentionHours * 3600);
        $this->query("DELETE FROM {$this->operationsTable} WHERE time < :time", ['time' => $cutoff]);
        $this->query("DELETE FROM {$this->table} WHERE time < :time", ['time' => $cutoff]);
    }

    // --- OperationsStorageInterface ---------------------------------------------

    // Flat operation rows for a category, each carrying an originating-request back-reference.
    public function operations($category, ?Search $search = null, $limit = null)
    {
        $limit = $limit !== null ? max(1, (int)$limit) : null;

        $requestIds = $this->searchRequestIds($search);
        if ($requestIds === []) return [];

        $sql = "SELECT request_id, category, sub_type, time, duration, seq, data FROM {$this->operationsTable} WHERE category = :category";
        $bindings = ['category' => $category];
        if ($requestIds !== null) {
            [$placeholder, $inBindings] = $this->inClause($requestIds);
            $sql .= " AND request_id IN ({$placeholder})";
            $bindings = array_merge($bindings, $inBindings);
        }
        $sql .= " ORDER BY time DESC";
        if ($limit) $sql .= " LIMIT {$limit}";

        $stmt = $this->query($sql, $bindings);
        $rows = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];

        $labels = $this->requestLabels(array_values(array_unique(array_map(function ($r) { return $r['request_id']; }, $rows))));

        $operations = [];
        foreach ($rows as $row) {
            $data = json_decode($row['data'], true);
            $label = $labels[$row['request_id']] ?? [];
            $operations[] = array_merge(is_array($data) ? $data : [], [
                'requestId'          => $row['request_id'],
                'requestUri'         => $label['uri'] ?? null,
                'requestType'        => $label['type'] ?? null,
                'requestReceivedAt'  => $label['time'] ?? null,
            ]);
        }

        return $operations;
    }

    // Single-category KPIs, shape aligned with the former ClockworkSupport::buildOperationsKpis.
    public function operationStats($category, ?Search $search = null)
    {
        $requestIds = $this->searchRequestIds($search);
        if ($requestIds === []) return $this->emptyOperationStats($category);

        $sql = "SELECT sub_type, duration, data, request_id FROM {$this->operationsTable} WHERE category = :category";
        $bindings = ['category' => $category];
        if ($requestIds !== null) {
            [$placeholder, $inBindings] = $this->inClause($requestIds);
            $sql .= " AND request_id IN ({$placeholder})";
            $bindings = array_merge($bindings, $inBindings);
        }

        $stmt = $this->query($sql, $bindings);
        $rows = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];

        $opCount = 0;
        $requestSet = [];
        $durationSum = 0.0;
        $durationCount = 0;
        $bySubType = [];
        // category-specific tallies
        $slow = 0;
        $events = []; $views = []; $notifTypes = [];

        foreach ($rows as $row) {
            $opCount++;
            $requestSet[$row['request_id']] = true;
            $sub = $row['sub_type'];
            $data = json_decode($row['data'], true) ?: [];

            $dur = $this->saneDuration($row['duration']);
            if ($dur !== null) { $durationSum += $dur; $durationCount++; }

            if ($sub !== null) $bySubType[$sub] = ($bySubType[$sub] ?? 0) + 1;

            if ($category == 'database' && in_array('slow', $data['tags'] ?? [])) $slow++;
            if ($category == 'events') {
                $name = $data['event'] ?? '?';
                $events[$name] = ($events[$name] ?? 0) + 1;
            }
            if ($category == 'views') {
                $name = $data['data']['name'] ?? ($data['name'] ?? '?');
                $views[$name] = ($views[$name] ?? 0) + 1;
            }
            if ($category == 'notifications') {
                $t = $data['type'] ?? 'unknown';
                $notifTypes[$t] = ($notifTypes[$t] ?? 0) + 1;
            }
        }

        $requestCount = count($requestSet);
        $avg = $durationCount ? round($durationSum / $durationCount, 2) : 0;
        arsort($events); arsort($views); arsort($notifTypes);

        switch ($category) {
            case 'database':
                return [
                    'total' => $opCount,
                    'select' => $bySubType['select'] ?? 0, 'insert' => $bySubType['insert'] ?? 0,
                    'update' => $bySubType['update'] ?? 0, 'delete' => $bySubType['delete'] ?? 0,
                    'other' => $bySubType['other'] ?? 0, 'slow' => $slow,
                    'avgDuration' => $opCount ? round($durationSum / $opCount, 1) : 0,
                    'totalDuration' => (int) round($durationSum), 'requestCount' => $requestCount,
                ];
            case 'cache':
                $reads = ($bySubType['hit'] ?? 0) + ($bySubType['miss'] ?? 0);
                $hits = $bySubType['hit'] ?? 0;
                return [
                    'total' => $opCount,
                    'hits' => $hits, 'misses' => max(0, $reads - $hits),
                    'writes' => $bySubType['write'] ?? 0, 'deletes' => $bySubType['delete'] ?? 0, 'readTotal' => $reads,
                    'hitRate' => $reads ? round($hits / $reads * 100, 1) : 0,
                    'avgDuration' => $avg, 'totalTime' => (int) round($durationSum), 'requestCount' => $requestCount,
                ];
            case 'redis':
                return [
                    'total' => $opCount, 'commands' => (object) $bySubType,
                    'avgDuration' => $avg, 'totalTime' => (int) round($durationSum), 'requestCount' => $requestCount,
                ];
            case 'log':
                return [
                    'total' => $opCount, 'byLevel' => (object) $bySubType,
                    'error' => ($bySubType['error'] ?? 0) + ($bySubType['critical'] ?? 0) + ($bySubType['alert'] ?? 0) + ($bySubType['emergency'] ?? 0),
                    'warning' => $bySubType['warning'] ?? 0, 'notice' => $bySubType['notice'] ?? 0,
                    'info' => $bySubType['info'] ?? 0, 'debug' => $bySubType['debug'] ?? 0,
                    'requestCount' => $requestCount,
                ];
            case 'events':
                return [
                    'total' => $opCount, 'topEvents' => (object) array_slice($events, 0, 10, true),
                    'avgDuration' => $avg, 'requestCount' => $requestCount,
                ];
            case 'views':
                $slowest = ['name' => null, 'duration' => 0];
                foreach ($rows as $row) {
                    $d = $this->saneDuration($row['duration']);
                    $data = json_decode($row['data'], true) ?: [];
                    $name = $data['data']['name'] ?? ($data['name'] ?? '?');
                    if ($d !== null && $d > $slowest['duration']) $slowest = ['name' => $name, 'duration' => $d];
                }
                return [
                    'total' => $opCount, 'topViews' => (object) array_slice($views, 0, 10, true),
                    'avgDuration' => $avg, 'totalTime' => (int) round($durationSum), 'requestCount' => $requestCount,
                    'slowest' => (int) round($slowest['duration']), 'slowestName' => $slowest['name'],
                ];
            case 'notifications':
                return [
                    'total' => $opCount, 'types' => (object) $notifTypes,
                    'avgDuration' => $avg, 'totalTime' => (int) round($durationSum), 'requestCount' => $requestCount,
                ];
        }

        return [];
    }

    // Cross-category overview stats, shape aligned with the former ClockworkSupport::getStats.
    // The failure rate is approximate under SQL (the precise toEventDetails-based judgement can't
    // be reproduced in a query), so the result is tagged with failureRateMode.
    public function overviewStats(?Search $search = null)
    {
        $search = SqlSearch::fromBase($search, $this->pdo);
        $where = $search->query; // '' or 'WHERE ...'
        $bindings = $search->bindings;

        // request-level aggregates via the kept denormalized count columns
        $row = $this->aggregateOne(
            "SELECT COUNT(*) AS requests,"
            . " COALESCE(SUM(databaseQueriesCount), 0) AS dbQueries, COALESCE(SUM(databaseSlowQueries), 0) AS dbSlow, COALESCE(SUM(databaseDuration), 0) AS dbDuration,"
            . " COALESCE(SUM(databaseSelects), 0) AS dbSelects, COALESCE(SUM(databaseInserts), 0) AS dbInserts, COALESCE(SUM(databaseUpdates), 0) AS dbUpdates, COALESCE(SUM(databaseDeletes), 0) AS dbDeletes, COALESCE(SUM(databaseOthers), 0) AS dbOthers,"
            . " COALESCE(SUM(cacheReads), 0) AS cacheReads, COALESCE(SUM(cacheHits), 0) AS cacheHits, COALESCE(SUM(cacheWrites), 0) AS cacheWrites, COALESCE(SUM(cacheDeletes), 0) AS cacheDeletes, COALESCE(SUM(cacheTime), 0) AS cacheTime,"
            . " COALESCE(AVG(responseDuration), 0) AS avgDurationRaw"
            . " FROM {$this->table} {$where}",
            $bindings
        );

        $requests = (int) ($row['requests'] ?? 0);

        // approximate failure count via status fields (precise judgement requires toEventDetails)
        $failedWhere = $where === '' ? 'WHERE' : "{$where} AND";
        $failed = (int) $this->aggregateOne(
            "SELECT COUNT(*) AS c FROM {$this->table} {$failedWhere}"
            . " (responseStatus >= 400 OR commandExitCode <> 0 OR jobStatus = 'failed' OR testStatus = 'failed')",
            $bindings
        )['c'];

        $byType = $this->aggregateByType($where, $bindings);

        // operation counts that aren't denormalized (redis/events/views/notifications) + log,
        // scoped to the matched requests (null = no filter, [] = matched nothing)
        $matchedIds = $this->matchedRequestIds($where, $bindings);
        $opCounts = $this->operationCountsByCategory($matchedIds);
        $logStats = $this->logStats($matchedIds);

        $db = [
            'queries' => (int) $row['dbQueries'], 'slow' => (int) $row['dbSlow'], 'duration' => (float) $row['dbDuration'],
            'selects' => (int) $row['dbSelects'], 'inserts' => (int) $row['dbInserts'], 'updates' => (int) $row['dbUpdates'],
            'deletes' => (int) $row['dbDeletes'], 'others' => (int) $row['dbOthers'],
        ];
        $cache = [
            'reads' => (int) $row['cacheReads'], 'hits' => (int) $row['cacheHits'], 'writes' => (int) $row['cacheWrites'],
            'deletes' => (int) $row['cacheDeletes'], 'time' => (float) $row['cacheTime'],
        ];

        return [
            'failureRateMode' => 'approximate',
            'requests' => $requests,
            'failedRequests' => $failed,
            'errorRate' => $requests ? round($failed / $requests * 100, 2) : 0,
            'avgDuration' => $requests ? round((float) $row['avgDurationRaw'], 1) : 0,
            'byType' => $byType,
            'database' => $db,
            'cache' => array_merge($cache, ['hitRate' => $cache['reads'] ? round($cache['hits'] / $cache['reads'] * 100, 1) : 0]),
            'redis' => ['commands' => $opCounts['redis'] ?? 0],
            'events' => ['count' => $opCounts['events'] ?? 0],
            'views' => ['count' => $opCounts['views'] ?? 0],
            'notifications' => ['count' => $opCounts['notifications'] ?? 0],
            'log' => $logStats,
        ];
    }

    // --- internals --------------------------------------------------------------

    // A duration (ms) is only trustworthy in the 0..10min range; older/corrupt records can carry
    // values like -1.78e12 (responseTime was null when stored), which would poison aggregates.
    protected function saneDuration($v)
    {
        return ($v !== null && is_numeric($v) && $v >= 0 && $v < 600000) ? $v * 1 : null;
    }

    // Resolve the set of request ids matching a Search. Returns null when there is no filter
    // (apply none), or [] when the filter matches nothing.
    protected function searchRequestIds(?Search $search)
    {
        $search = SqlSearch::fromBase($search, $this->pdo);
        if ($search->query === '') return null;

        $stmt = $this->query("SELECT id FROM {$this->table} {$search->query}", $search->bindings);
        return $stmt ? $stmt->fetchAll(PDO::FETCH_COLUMN) : [];
    }

    // Build a parameterized IN (...) clause and its bindings for a list of values.
    protected function inClause(array $values)
    {
        if (!count($values)) return ['NULL', []];
        $bindings = [];
        $placeholders = implode(', ', array_map(function ($i, $v) use (&$bindings) {
            $key = "in{$i}";
            $bindings[$key] = $v;
            return ":{$key}";
        }, array_keys($values), $values));
        return [$placeholders, $bindings];
    }

    // Fetch lightweight label info (uri/type/time) for a set of request ids.
    protected function requestLabels(array $ids)
    {
        if (!count($ids)) return [];
        [$placeholder, $bindings] = $this->inClause($ids);
        $stmt = $this->query(
            "SELECT id, uri, type, time FROM {$this->table} WHERE id IN ({$placeholder})",
            $bindings
        );
        if (!$stmt) return [];
        $labels = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $labels[$row['id']] = ['uri' => $row['uri'], 'type' => $row['type'], 'time' => $row['time']];
        }
        return $labels;
    }

    // Count operations per category (redis/events/views/notifications) for the matched requests.
    protected function operationCountsByCategory($matchedIds)
    {
        $counts = ['redis' => 0, 'events' => 0, 'views' => 0, 'notifications' => 0];
        if ($matchedIds === []) return $counts;

        $sql = "SELECT category, COUNT(*) AS c FROM {$this->operationsTable} WHERE category IN ('redis','events','views','notifications')";
        $b = [];
        if ($matchedIds !== null) {
            [$placeholder, $b] = $this->inClause($matchedIds);
            $sql .= " AND request_id IN ({$placeholder})";
        }
        $sql .= " GROUP BY category";
        $stmt = $this->query($sql, $b);
        if ($stmt) {
            foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
                $counts[$row['category']] = (int) $row['c'];
            }
        }
        return $counts;
    }

    // Log totals + per-level breakdown for the matched requests.
    protected function logStats($matchedIds)
    {
        $log = ['total' => 0, 'errors' => 0, 'byLevel' => []];
        if ($matchedIds === []) return $log;

        $sql = "SELECT sub_type, COUNT(*) AS c FROM {$this->operationsTable} WHERE category = 'log'";
        $b = [];
        if ($matchedIds !== null) {
            [$placeholder, $b] = $this->inClause($matchedIds);
            $sql .= " AND request_id IN ({$placeholder})";
        }
        $sql .= " GROUP BY sub_type";
        $stmt = $this->query($sql, $b);
        if ($stmt) {
            foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
                $level = $row['sub_type'] ?? 'info';
                $count = (int) $row['c'];
                $log['byLevel'][$level] = $count;
                $log['total'] += $count;
                if (in_array($level, ['emergency', 'alert', 'critical', 'error'])) $log['errors'] += $count;
            }
        }
        return $log;
    }

    // Resolve matched request ids for a WHERE clause. Returns null when there is no filter.
    protected function matchedRequestIds($where, array $bindings)
    {
        if ($where === '') return null;
        $stmt = $this->query("SELECT id FROM {$this->table} {$where}", $bindings);
        return $stmt ? $stmt->fetchAll(PDO::FETCH_COLUMN) : [];
    }

    // GROUP BY type counts for the matched requests.
    protected function aggregateByType($where, array $bindings)
    {
        $byType = ['request' => 0, 'command' => 0, 'queue-job' => 0, 'test' => 0];
        $stmt = $this->query("SELECT type, COUNT(*) AS c FROM {$this->table} {$where} GROUP BY type", $bindings);
        if ($stmt) {
            foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
                if (isset($byType[$row['type']])) $byType[$row['type']] = (int) $row['c'];
            }
        }
        return $byType;
    }

    // Fetch the first row of an aggregate query as an associative array (empty if none).
    protected function aggregateOne($sql, array $bindings = [])
    {
        $stmt = $this->query($sql, $bindings);
        if (!$stmt) return [];
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: [];
    }

    // KPIs for a category with zero matching operations.
    protected function emptyOperationStats($category)
    {
        $base = ['requestCount' => 0];
        switch ($category) {
            case 'database':
                return array_merge($base, ['select' => 0, 'insert' => 0, 'update' => 0, 'delete' => 0, 'other' => 0, 'slow' => 0, 'avgDuration' => 0, 'totalDuration' => 0]);
            case 'cache':
                return array_merge($base, ['hits' => 0, 'misses' => 0, 'writes' => 0, 'deletes' => 0, 'readTotal' => 0, 'hitRate' => 0, 'avgDuration' => 0, 'totalTime' => 0]);
            case 'redis':
                return array_merge($base, ['total' => 0, 'commands' => (object) [], 'avgDuration' => 0, 'totalTime' => 0]);
            case 'log':
                return array_merge($base, ['total' => 0, 'byLevel' => (object) [], 'error' => 0, 'warning' => 0, 'notice' => 0, 'info' => 0, 'debug' => 0]);
            case 'events':
                return array_merge($base, ['total' => 0, 'topEvents' => (object) [], 'avgDuration' => 0]);
            case 'views':
                return array_merge($base, ['total' => 0, 'topViews' => (object) [], 'avgDuration' => 0, 'totalTime' => 0, 'slowest' => 0, 'slowestName' => null]);
            case 'notifications':
                return array_merge($base, ['total' => 0, 'types' => (object) [], 'avgDuration' => 0, 'totalTime' => 0]);
        }
        return $base;
    }

    // Perform a single request store within a transaction.
    protected function storeOnce(Request $request)
    {
        $data = $request->toArray();

        foreach ($this->needsSerialization as $key) {
            $data[$key] = @json_encode($data[$key], \JSON_PARTIAL_OUTPUT_ON_ERROR);
        }

        // Reduce to request-table columns only — operation arrays live in the operations table,
        // and handing extra keys to a native prepared statement triggers SQLITE_RANGE.
        $row = [];
        foreach ($this->fields as $field => $_) {
            $row[$field] = $data[$field] ?? null;
        }

        $fields = implode(', ', array_map(function ($field) {
            return $this->quote($field);
        }, array_keys($this->fields)));
        $placeholders = implode(', ', array_map(function ($field) {
            return ":{$field}";
        }, array_keys($this->fields)));
        $insert = $this->pdo->prepare("INSERT INTO {$this->table} ({$fields}) VALUES ({$placeholders})");

        $operations = iterator_to_array($request->toOperations());

        $this->pdo->beginTransaction();
        try {
            $insert->execute($row);
            $this->insertOperations($request->id, $operations);
            $this->pdo->commit();
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            throw $e;
        }
    }

    // Update a request and replace its operations within a transaction.
    protected function updateOnce(Request $request)
    {
        $data = $request->toArray();

        foreach ($this->needsSerialization as $key) {
            $data[$key] = @json_encode($data[$key], \JSON_PARTIAL_OUTPUT_ON_ERROR);
        }

        $row = [];
        foreach ($this->fields as $field => $_) {
            $row[$field] = $data[$field] ?? null;
        }

        // SET every column except the primary key (id is immutable); WHERE id has its own :id
        // binding so the SET and WHERE roles don't share a placeholder.
        $setFields = array_filter(array_keys($this->fields), function ($field) { return $field !== 'id'; });
        $values = implode(', ', array_map(function ($field) {
            return $this->quote($field) . " = :{$field}";
        }, $setFields));
        $update = $this->pdo->prepare("UPDATE {$this->table} SET {$values} WHERE id = :id");

        $operations = iterator_to_array($request->toOperations());

        $this->pdo->beginTransaction();
        try {
            $update->execute($row);
            $this->pdo->prepare("DELETE FROM {$this->operationsTable} WHERE request_id = :id")->execute(['id' => $request->id]);
            $this->insertOperations($request->id, $operations);
            $this->pdo->commit();
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            throw $e;
        }
    }

    // Batch-insert operation rows (<=500 per prepare loop) for a request.
    protected function insertOperations($requestId, array $operations)
    {
        if (!count($operations)) return;

        $fields = ['request_id', 'category', 'sub_type', 'time', 'duration', 'seq', 'data'];
        $columns = implode(', ', array_map(function ($f) { return $this->quote($f); }, $fields));
        $placeholders = implode(', ', array_map(function ($f) { return ":{$f}"; }, $fields));
        $stmt = $this->pdo->prepare("INSERT INTO {$this->operationsTable} ({$columns}) VALUES ({$placeholders})");

        foreach (array_chunk($operations, 500) as $batch) {
            foreach ($batch as $row) {
                $stmt->execute([
                    'request_id' => $requestId,
                    'category'   => $row['category'],
                    'sub_type'   => $row['sub_type'],
                    'time'       => $row['time'],
                    'duration'   => $row['duration'],
                    'seq'        => $row['seq'],
                    'data'       => json_encode($row['data'], \JSON_PARTIAL_OUTPUT_ON_ERROR),
                ]);
            }
        }
    }

    // Turn a PDO statement of request rows into Request instances, reassembling each request's
    // operations from the operations table with a single IN (...) query (no N+1).
    protected function resultsToRequests($stmt)
    {
        $rows = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
        if (!count($rows)) return [];

        $ids = array_column($rows, 'id');
        $operationsByRequest = $this->fetchOperationsForRequests($ids);

        $requests = [];
        foreach ($rows as $data) {
            foreach ($this->needsSerialization as $key) {
                $data[$key] = json_decode($data[$key], true);
            }

            foreach ($operationsByRequest[$data['id']] ?? [] as $category => $opRows) {
                if ($category == 'notifications') {
                    [$notifications, $emails] = $this->splitNotifications($opRows);
                    $data['notifications'] = $notifications;
                    $data['emailsData'] = $emails;
                } elseif (isset($this->categoryProperty[$category])) {
                    $data[$this->categoryProperty[$category]] = $opRows;
                }
            }

            $requests[] = new Request($data);
        }

        return $requests;
    }

    // Fetch all operations for a set of request ids, grouped by request_id then category, with
    // each operation's data JSON decoded. Ordered by seq so reassembly preserves in-request order.
    protected function fetchOperationsForRequests(array $ids)
    {
        if (!count($ids)) return [];
        [$placeholder, $bindings] = $this->inClause($ids);
        $stmt = $this->query(
            "SELECT request_id, category, seq, data FROM {$this->operationsTable}"
            . " WHERE request_id IN ({$placeholder}) ORDER BY request_id, seq",
            $bindings
        );
        if (!$stmt) return [];

        $grouped = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $grouped[$row['request_id']][$row['category']][] = json_decode($row['data'], true);
        }
        return $grouped;
    }

    // Split notifications rows back into true notifications and the legacy emailsData shape,
    // using the _source marker written by Request::toOperations().
    protected function splitNotifications(array $rows)
    {
        $notifications = [];
        $emails = [];
        foreach ($rows as $row) {
            if (($row['_source'] ?? null) === 'emailsData') {
                $emails[] = [
                    'start'       => $row['time'] ?? null,
                    'duration'    => $row['duration'] ?? null,
                    'description' => $row['description'] ?? 'Sending an email message',
                    'data'        => [
                        'subject' => $row['subject'] ?? null,
                        'to'      => $row['to'] ?? null,
                        'from'    => $row['from'] ?? null,
                    ],
                ];
            } else {
                $notifications[] = $row;
            }
        }
        return [$notifications, $emails];
    }

    // (Re)create the Clockwork metadata tables from scratch. This fork is local-only and does not
    // preserve old data on schema change, so existing tables are DROPped and recreated fresh (no
    // rename-to-backup). Triggered by the lazy query()/store()/update() retry on first run or when
    // a query fails against a missing/out-of-date schema.
    protected function initialize()
    {
        $table = $this->quote($this->table);
        $operationsTable = $this->quote($this->operationsTable);

        foreach ([$table, $operationsTable] as $t) {
            try { $this->pdo->exec("DROP TABLE IF EXISTS {$t}"); } catch (\PDOException $e) {}
        }

        // requests table (slimmed: no operation arrays, no uuid)
        $this->pdo->exec($this->buildSchema($table));
        $this->pdo->exec("CREATE INDEX " . $this->quote("{$this->table}_time_index") . " ON {$table} (" . $this->quote('time') . ')');

        // operations table + its indexes
        $this->pdo->exec($this->buildOperationsSchema($operationsTable));
        $this->pdo->exec("CREATE INDEX " . $this->quote("{$this->operationsTable}_category_time_index") . " ON {$operationsTable} (" . $this->quote('category') . ', ' . $this->quote('time') . ')');
        $this->pdo->exec("CREATE INDEX " . $this->quote("{$this->operationsTable}_request_index") . " ON {$operationsTable} (" . $this->quote('request_id') . ')');
        $this->pdo->exec("CREATE INDEX " . $this->quote("{$this->operationsTable}_time_index") . " ON {$operationsTable} (" . $this->quote('time') . ')');
    }

    // Builds the query to create the requests table
    protected function buildSchema($table)
    {
        $textType = $this->pdo->getAttribute(PDO::ATTR_DRIVER_NAME) == 'mysql' ? 'MEDIUMTEXT' : 'TEXT';

        $columns = implode(', ', array_map(function ($field, $type) use ($textType) {
            return $this->quote($field) . ' ' . str_replace('TEXT', $textType, $type);
        }, array_keys($this->fields), array_values($this->fields)));

        return "CREATE TABLE {$table} ({$columns});";
    }

    // Builds the query to create the operations table
    protected function buildOperationsSchema($table)
    {
        $textType = $this->pdo->getAttribute(PDO::ATTR_DRIVER_NAME) == 'mysql' ? 'MEDIUMTEXT' : 'TEXT';

        return "CREATE TABLE {$table} ("
            . $this->quote('id') . ' ' . $this->primaryKeyStrategy() . ', '
            . $this->quote('request_id') . ' VARCHAR(100) NOT NULL, '
            . $this->quote('category') . ' VARCHAR(50) NOT NULL, '
            . $this->quote('sub_type') . ' VARCHAR(50) NULL, '
            . $this->quote('time') . ' DOUBLE PRECISION NULL, '
            . $this->quote('duration') . ' DOUBLE PRECISION NULL, '
            . $this->quote('seq') . ' INTEGER NOT NULL, '
            . $this->quote('data') . ' ' . $textType . ' NOT NULL'
            . ');';
    }

    // Auto-increment primary key syntax for the current driver.
    protected function primaryKeyStrategy()
    {
        switch ($this->pdo->getAttribute(PDO::ATTR_DRIVER_NAME)) {
            case 'mysql': return 'INTEGER AUTO_INCREMENT PRIMARY KEY';
            case 'pgsql': return 'SERIAL PRIMARY KEY';
            default: return 'INTEGER PRIMARY KEY AUTOINCREMENT'; // sqlite
        }
    }

    // Quotes SQL identifier name properly for the current database
    protected function quote($identifier)
    {
        return $this->pdo->getAttribute(PDO::ATTR_DRIVER_NAME) == 'mysql' ? "`{$identifier}`" : "\"{$identifier}\"";
    }

    // Executes an sql query, lazily initiates the clockwork database schema if it's old or doesn't
    // exist yet, returns executed statement or false on error
    protected function query($query, array $bindings = [], $firstTry = true)
    {
        try {
            if ($stmt = $this->pdo->prepare($query)) {
                if ($stmt->execute($bindings)) return $stmt;
                throw new \PDOException;
            }
        } catch (\PDOException $e) {
            $stmt = strpos($e->getMessage(), 'Integrity constraint violation') !== false;
        }

        // the query failed to execute, assume it's caused by missing or old schema, try to reinitialize database
        if (!$stmt && $firstTry) {
            $this->initialize();
            return $this->query($query, $bindings, false);
        }
    }
}
