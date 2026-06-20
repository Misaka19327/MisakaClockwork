<?php namespace Clockwork\Support\Laravel;

use Clockwork\Authentication\{NullAuthenticator, SimpleAuthenticator};
use Clockwork\Clockwork;
use Clockwork\DataSource\PhpDataSource;
use Clockwork\Helpers\{Serializer, ServerTiming, StackFilter, StackTrace};
use Clockwork\Request\{IncomingRequest, Request};
use Clockwork\Storage\{FileStorage, RedisStorage, Search, SqlStorage};
use Clockwork\Web\Web;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Http\{JsonResponse, Response};
use Illuminate\Redis\RedisManager;
use Symfony\Component\HttpFoundation\{BinaryFileResponse, Cookie};
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

// Support class for the Laravel integration
class ClockworkSupport
{
    // Laravel application instance
    protected $app;

    // Laravel artisan (console application) instance
    protected $artisan;

    // Incoming request instance
    protected $incomingRequest;

    public function __construct(Application $app)
    {
        $this->app = $app;
    }

    // Get a value form the Clockwork config

    public function getExtendedData($id, $filter = [])
    {
        return $this->getData($id, null, null, $filter, true);
    }

    // Retrieve metadata

    public function getData($id = null, $direction = null, $count = null, $filter = [], $extended = false)
    {
        if (isset($this->app['session'])) $this->app['session.store']->reflash();

        $authenticator = $this->app['clockwork']->authenticator();
        $storage = $this->app['clockwork']->storage();

        $authenticated = $authenticator->check($this->app['request']->header('X-Clockwork-Auth'));

        if ($authenticated !== true) {
            return new JsonResponse(['message' => $authenticated, 'requires' => $authenticator->requires()], 403);
        }

        if ($direction == 'previous') {
            $data = $storage->previous($id, $count, Search::fromRequest($this->app['request']->all()));
        } elseif ($direction == 'next') {
            $data = $storage->next($id, $count, Search::fromRequest($this->app['request']->all()));
        } elseif ($id == 'latest') {
            $data = $storage->latest(Search::fromRequest($this->app['request']->all()));
        } else {
            $data = $storage->find($id);
        }

        if ($extended) {
            $this->addDataSources();
            $this->app['clockwork']->extendRequest($data);
        }

        $except = isset($filter['except']) ? explode(',', $filter['except']) : [];
        $only = isset($filter['only']) ? explode(',', $filter['only']) : null;

        if (is_array($data)) {
            $data = array_map(function ($request) use ($except, $only) {
                return $only ? $request->only(array_diff($only, ['updateToken'])) : $request->except(array_merge($except, ['updateToken']));
            }, $data);
        } elseif ($data) {
            $data = $only ? $data->only(array_diff($only, ['updateToken'])) : $data->except(array_merge($except, ['updateToken']));
        }

        return new JsonResponse($data);
    }

    // Retrieve extended metadata

    public function addDataSources()
    {
        $clockwork = $this->app['clockwork'];

        $clockwork
            ->addDataSource(new PhpDataSource)
            ->addDataSource($this->frameworkDataSource());

        if ($this->isFeatureEnabled('database')) $clockwork->addDataSource($this->app['clockwork.eloquent']);
        if ($this->isFeatureEnabled('cache')) $clockwork->addDataSource($this->app['clockwork.cache']);
        if ($this->isFeatureEnabled('redis')) $clockwork->addDataSource($this->app['clockwork.redis']);
        if ($this->isFeatureEnabled('queue')) $clockwork->addDataSource($this->app['clockwork.queue']);
        if ($this->isFeatureEnabled('events')) $clockwork->addDataSource($this->app['clockwork.events']);
        if ($this->isFeatureEnabled('notifications')) {
            $clockwork->addDataSource(
                $this->isFeatureAvailable('notifications-events')
                    ? $this->app['clockwork.notifications'] : $this->app['clockwork.swift']
            );
        }
        if ($this->isFeatureEnabled('http_requests')) $clockwork->addDataSource($this->app['clockwork.http-requests']);
        if ($this->isFeatureAvailable('xdebug')) $clockwork->addDataSource($this->app['clockwork.xdebug']);
        if ($this->isFeatureEnabled('views')) {
            $clockwork->addDataSource(
                $this->getConfig('features.views.use_twig_profiler', false)
                    ? $this->app['clockwork.twig'] : $this->app['clockwork.views']
            );
        }

        return $this;
    }

    // Retrieve reproduction details for a request by uuid

    protected function frameworkDataSource()
    {
        return $this->app['clockwork.laravel'];
    }

    // Retrieve recent failure summaries for agent-oriented debugging

    public function isFeatureEnabled($feature)
    {
        return $this->getConfig("features.{$feature}.enabled") && $this->isFeatureAvailable($feature);
    }

    // Retrieve a debugging-oriented environment snapshot

    public function getConfig($key, $default = null)
    {
        return $this->app['config']->get("clockwork.{$key}", $default);
    }

    // Update metadata

    public function isFeatureAvailable($feature)
    {
        if ($feature == 'database') {
            return $this->app['config']->get('database.default');
        } elseif ($feature == 'http_requests') {
            return class_exists(\Illuminate\Http\Client\Request::class);
        } elseif ($feature == 'notifications-events') {
            return class_exists(\Illuminate\Mail\Events\MessageSent::class)
                && class_exists(\Illuminate\Notifications\Events\NotificationSent::class);
        } elseif ($feature == 'redis') {
            return method_exists(\Illuminate\Redis\RedisManager::class, 'enableEvents');
        } elseif ($feature == 'queue') {
            return method_exists(\Illuminate\Queue\Queue::class, 'createPayloadUsing');
        } elseif ($feature == 'xdebug') {
            return in_array('xdebug', get_loaded_extensions());
        }

        return true;
    }

    // Return an asset for web ui based on it's path, resolves correct mime-type and protectes from accessing files
    // outside of Clockwork public dir

    public function getEventDetailsByUuid($uuid)
    {
        if ($response = $this->ensureMetadataAccess()) return $response;

        $storage = $this->app['clockwork']->storage();

        $request = $storage->findByUuid($uuid);

        if (!$request) {
            return new JsonResponse(['message' => 'Request not found.'], 404);
        }

        return new JsonResponse($request->toEventDetails());
    }

    // Add enabled data sources

    protected function ensureMetadataAccess()
    {
        if (isset($this->app['session'])) $this->app['session.store']->reflash();

        $authenticator = $this->app['clockwork']->authenticator();
        $authenticated = $authenticator->check($this->app['request']->header('X-Clockwork-Auth'));

        if ($authenticated === true) return null;

        return new JsonResponse(['message' => $authenticated, 'requires' => $authenticator->requires()], 403);
    }

    // Start listening to events

    public function getFailures(array $input = [])
    {
        if ($response = $this->ensureMetadataAccess()) return $response;

        $limit = max(1, min((int)($input['limit'] ?? 25), 100));
        $types = $this->csvInput($input['type'] ?? []);
        $statuses = $this->csvInput($input['status'] ?? []);
        $search = trim((string)($input['search'] ?? ''));
        $since = isset($input['since']) ? (float)$input['since'] : null;

        $failures = [];
        $storage = $this->app['clockwork']->storage();
        $cursor = $storage->latest();

        while ($cursor) {
            $request = $cursor;
            $previous = $storage->previous($request->id, 1);
            $cursor = count($previous) ? $previous[0] : null;

            if (!$this->requestHasFailures($request)) continue;
            if (count($types) && !in_array($request->type, $types)) continue;
            if ($since !== null && $request->time < $since) continue;
            if (count($statuses) && !in_array((string)$this->requestStatus($request), $statuses)) continue;
            if ($search !== '' && !$this->matchesFailureSearch($request, $search)) continue;

            $summary = $request->toFailureSummary();
            $failures[] = [
                'uuid' => $request->uuid,
                'id' => $request->id,
                'type' => $request->type,
                'name' => $summary['name'],
                'status' => $summary['status'],
                'receivedAt' => $request->time,
                'duration' => $request->responseDuration ?? ($request->responseTime ? $request->getResponseDuration() : null),
                'title' => $summary['title'],
                'rootMessage' => $summary['rootMessage'],
                'topAppFrame' => $summary['topAppFrame']
            ];

            if (count($failures) >= $limit) break;
        }

        return new JsonResponse($failures);
    }

    // Resolves the framework data source from the container

    protected function csvInput($value)
    {
        if (is_array($value)) return array_values(array_filter($value, function ($item) {
            return $item !== '';
        }));

        return array_values(array_filter(array_map('trim', explode(',', (string)$value)), function ($item) {
            return $item !== '';
        }));
    }

    protected function requestHasFailures($request)
    {
        return count($request->toEventDetails()['errors'] ?? []) > 0;
    }

    protected function requestStatus($request)
    {
        if ($request->type == 'command') return $request->commandExitCode;
        if ($request->type == 'queue-job') return $request->jobStatus;
        if ($request->type == 'test') return $request->testStatus;

        return $request->responseStatus;
    }

    // Make a storage instance based on the current configuration

    protected function matchesFailureSearch($request, $search)
    {
        $details = $request->toEventDetails();
        $haystacks = array_filter([
            $request->uuid,
            $request->id,
            $details['summary']['name'] ?? null,
            $details['summary']['title'] ?? null,
            $details['summary']['rootMessage'] ?? null,
            $request->controller,
            $request->uri,
            $request->commandName,
            $request->jobName,
            $request->jobDescription,
            $request->testName
        ]);

        foreach ($haystacks as $value) {
            if (stripos((string)$value, $search) !== false) return true;
        }

        return false;
    }

    // Aggregate overview KPIs across recent requests. Walks the most recent matching
    // requests (capped) and sums per-request counters. GET /__clockwork/stats.
    public function getStats(array $input = [])
    {
        if ($response = $this->ensureMetadataAccess()) return $response;

        $since = isset($input['since']) ? (float)$input['since'] : null;
        $until = isset($input['until']) ? (float)$input['until'] : null;
        $types = $this->csvInput($input['type'] ?? []);
        $scanLimit = max(1, min((int)($input['limit'] ?? 1000), 5000));

        $search = $this->operationsSearch($since, $until, $types);

        $storage = $this->app['clockwork']->storage();
        $cursor = $storage->latest($search);
        $scanned = 0; $truncated = false;

        $requests = 0; $failed = 0; $durationSum = 0.0; $durationCount = 0;
        $byType = ['request' => 0, 'command' => 0, 'queue-job' => 0, 'test' => 0];
        $db = ['queries' => 0, 'slow' => 0, 'duration' => 0.0, 'selects' => 0, 'inserts' => 0, 'updates' => 0, 'deletes' => 0, 'others' => 0];
        $cache = ['reads' => 0, 'hits' => 0, 'writes' => 0, 'deletes' => 0, 'time' => 0.0];
        $redis = 0;
        $log = ['total' => 0, 'errors' => 0, 'byLevel' => []];

        while ($cursor) {
            if ($scanned++ >= $scanLimit) { $truncated = true; break; }
            $r = $cursor;

            $requests++;
            if (isset($byType[$r->type])) $byType[$r->type]++;
            if ($this->requestHasFailures($r)) $failed++;

            $dur = $this->requestDuration($r);
            if ($dur !== null) { $durationSum += $dur; $durationCount++; }

            $db['queries']  += $this->n($r->databaseQueriesCount);
            $db['slow']     += $this->n($r->databaseSlowQueries);
            $db['duration'] += $this->n($r->databaseDuration);
            $db['selects']  += $this->n($r->databaseSelects);
            $db['inserts']  += $this->n($r->databaseInserts);
            $db['updates']  += $this->n($r->databaseUpdates);
            $db['deletes']  += $this->n($r->databaseDeletes);
            $db['others']   += $this->n($r->databaseOthers);

            $cache['reads']   += $this->n($r->cacheReads);
            $cache['hits']    += $this->n($r->cacheHits);
            $cache['writes']  += $this->n($r->cacheWrites);
            $cache['deletes'] += $this->n($r->cacheDeletes);
            $cache['time']    += $this->n($r->cacheTime);

            $redis += count($r->redisCommands ?: []);

            foreach ($r->log ?: [] as $entry) {
                $log['total']++;
                $level = $entry['level'] ?? 'info';
                $log['byLevel'][$level] = ($log['byLevel'][$level] ?? 0) + 1;
                if (in_array($level, ['emergency', 'alert', 'critical', 'error'])) $log['errors']++;
            }

            $cursor = $this->previousOne($storage, $r->id, $search);
        }

        return new JsonResponse([
            'window' => ['since' => $since, 'until' => $until, 'scannedRequests' => $scanned, 'truncated' => $truncated],
            'requests' => $requests,
            'failedRequests' => $failed,
            'errorRate' => $requests ? round($failed / $requests * 100, 2) : 0,
            'avgDuration' => $durationCount ? round($durationSum / $durationCount, 1) : 0,
            'byType' => $byType,
            'database' => $db,
            'cache' => array_merge($cache, ['hitRate' => $cache['reads'] ? round($cache['hits'] / $cache['reads'] * 100, 1) : 0]),
            'redis' => ['commands' => $redis],
            'log' => $log,
        ]);
    }

    // Per-category cross-request operations: KPIs + a flattened, back-referenced operation
    // list. GET /__clockwork/operations/{category}. Client-side search/sort/paginate the
    // returned list (matches the existing operations-center UI).
    public function getOperations($category, array $input = [])
    {
        if ($response = $this->ensureMetadataAccess()) return $response;

        $allowed = ['database', 'cache', 'redis', 'log', 'events', 'views', 'notifications'];
        if (!in_array($category, $allowed)) {
            return new JsonResponse(['message' => "Unknown operation category: {$category}", 'allowed' => $allowed], 400);
        }

        $since = isset($input['since']) ? (float)$input['since'] : null;
        $until = isset($input['until']) ? (float)$input['until'] : null;
        $types = $this->csvInput($input['type'] ?? []);
        $scanLimit = max(1, min((int)($input['scanLimit'] ?? 1000), 5000));
        $opLimit = max(1, min((int)($input['limit'] ?? 2000), 10000));

        $search = $this->operationsSearch($since, $until, $types);
        $storage = $this->app['clockwork']->storage();

        $cursor = $storage->latest($search);
        $scanned = 0; $truncated = false; $requestCount = 0; $opCount = 0;
        $operations = [];
        $durationSum = 0.0; $durationCount = 0;
        $tally = [
            'commands' => [], 'levels' => [], 'events' => [], 'views' => [], 'types' => [],
            'db' => ['queries' => 0, 'slow' => 0, 'duration' => 0.0, 'select' => 0, 'insert' => 0, 'update' => 0, 'delete' => 0, 'other' => 0],
            'cache' => ['reads' => 0, 'hits' => 0, 'writes' => 0, 'deletes' => 0, 'time' => 0.0],
            'slowestView' => ['name' => null, 'duration' => 0],
        ];

        while ($cursor) {
            if ($scanned++ >= $scanLimit) { $truncated = true; break; }
            $r = $cursor;
            $arr = $this->operationsArray($r, $category);
            if (!count($arr)) { $cursor = $this->previousOne($storage, $r->id, $search); continue; }
            $requestCount++;

            // Per-request counters feed the database / cache KPIs.
            if ($category == 'database') {
                $tally['db']['queries']  += $this->n($r->databaseQueriesCount);
                $tally['db']['slow']     += $this->n($r->databaseSlowQueries);
                $tally['db']['duration'] += $this->n($r->databaseDuration);
                $tally['db']['select']   += $this->n($r->databaseSelects);
                $tally['db']['insert']   += $this->n($r->databaseInserts);
                $tally['db']['update']   += $this->n($r->databaseUpdates);
                $tally['db']['delete']   += $this->n($r->databaseDeletes);
                $tally['db']['other']    += $this->n($r->databaseOthers);
            } elseif ($category == 'cache') {
                $tally['cache']['reads']   += $this->n($r->cacheReads);
                $tally['cache']['hits']    += $this->n($r->cacheHits);
                $tally['cache']['writes']  += $this->n($r->cacheWrites);
                $tally['cache']['deletes'] += $this->n($r->cacheDeletes);
                $tally['cache']['time']    += $this->n($r->cacheTime);
            }

            foreach ($arr as $op) {
                $opCount++;
                $row = $this->operationRow($op, $r, $category);

                $dur = $this->saneDuration($row['duration'] ?? null);
                if ($dur !== null) { $durationSum += $dur; $durationCount++; }

                switch ($category) {
                    case 'redis':
                        $c = $row['command'] ?? '?';
                        $tally['commands'][$c] = ($tally['commands'][$c] ?? 0) + 1;
                        break;
                    case 'log':
                        $lvl = $row['level'] ?? 'info';
                        $tally['levels'][$lvl] = ($tally['levels'][$lvl] ?? 0) + 1;
                        break;
                    case 'events':
                        $e = $row['event'] ?? '?';
                        $tally['events'][$e] = ($tally['events'][$e] ?? 0) + 1;
                        break;
                    case 'views':
                        $name = $row['data']['name'] ?? ($row['name'] ?? '?');
                        $tally['views'][$name] = ($tally['views'][$name] ?? 0) + 1;
                        if ($dur !== null && $dur > $tally['slowestView']['duration']) {
                            $tally['slowestView'] = ['name' => $name, 'duration' => $dur];
                        }
                        break;
                    case 'notifications':
                        $t = $row['type'] ?? 'unknown';
                        $tally['types'][$t] = ($tally['types'][$t] ?? 0) + 1;
                        break;
                }

                if (count($operations) < $opLimit) $operations[] = $row;
                else $truncated = true;
            }

            $cursor = $this->previousOne($storage, $r->id, $search);
        }

        $kpis = $this->buildOperationsKpis($category, $tally, $durationSum, $durationCount, $opCount, $requestCount);

        return new JsonResponse([
            'category' => $category,
            'window' => ['since' => $since, 'until' => $until, 'scannedRequests' => $scanned, 'truncated' => $truncated],
            'kpis' => $kpis,
            'total' => $opCount,
            'returned' => count($operations),
            'requestCount' => $requestCount,
            'operations' => $operations,
        ]);
    }

    // Assemble the per-category KPI object from the walk tallies.
    protected function buildOperationsKpis($category, $tally, $durationSum, $durationCount, $opCount, $requestCount)
    {
        $avg = $durationCount ? round($durationSum / $durationCount, 2) : 0;

        switch ($category) {
            case 'database':
                $d = $tally['db'];
                return [
                    'select' => $d['select'], 'insert' => $d['insert'], 'update' => $d['update'],
                    'delete' => $d['delete'], 'other' => $d['other'], 'slow' => $d['slow'],
                    'avgDuration' => $d['queries'] ? round($d['duration'] / $d['queries'], 1) : 0,
                    'totalDuration' => (int) round($d['duration']), 'requestCount' => $requestCount,
                ];
            case 'cache':
                $c = $tally['cache'];
                return [
                    'hits' => $c['hits'], 'misses' => max(0, $c['reads'] - $c['hits']),
                    'writes' => $c['writes'], 'deletes' => $c['deletes'], 'readTotal' => $c['reads'],
                    'hitRate' => $c['reads'] ? round($c['hits'] / $c['reads'] * 100, 1) : 0,
                    'avgDuration' => $avg, 'totalTime' => (int) round($c['time']), 'requestCount' => $requestCount,
                ];
            case 'redis':
                arsort($tally['commands']);
                return [
                    'total' => $opCount, 'commands' => (object) $tally['commands'],
                    'avgDuration' => $avg, 'totalTime' => (int) round($durationSum), 'requestCount' => $requestCount,
                ];
            case 'log':
                $levels = $tally['levels'];
                return [
                    'total' => $opCount, 'byLevel' => (object) $levels,
                    'error' => ($levels['error'] ?? 0) + ($levels['critical'] ?? 0) + ($levels['alert'] ?? 0) + ($levels['emergency'] ?? 0),
                    'warning' => $levels['warning'] ?? 0, 'notice' => $levels['notice'] ?? 0,
                    'info' => $levels['info'] ?? 0, 'debug' => $levels['debug'] ?? 0,
                    'requestCount' => $requestCount,
                ];
            case 'events':
                arsort($tally['events']);
                return [
                    'total' => $opCount, 'topEvents' => (object) array_slice($tally['events'], 0, 10, true),
                    'avgDuration' => $avg, 'requestCount' => $requestCount,
                ];
            case 'views':
                arsort($tally['views']);
                return [
                    'total' => $opCount, 'topViews' => (object) array_slice($tally['views'], 0, 10, true),
                    'avgDuration' => $avg, 'totalTime' => (int) round($durationSum), 'requestCount' => $requestCount,
                    'slowest' => (int) round($tally['slowestView']['duration']), 'slowestName' => $tally['slowestView']['name'],
                ];
            case 'notifications':
                arsort($tally['types']);
                return [
                    'total' => $opCount, 'types' => (object) $tally['types'],
                    'avgDuration' => $avg, 'totalTime' => (int) round($durationSum), 'requestCount' => $requestCount,
                ];
        }

        return [];
    }

    // Search filter (received-time window + request type) shared by both aggregation walks.
    protected function operationsSearch($since, $until, $types)
    {
        $received = [];
        if ($since !== null) $received[] = '>' . $since;
        if ($until !== null) $received[] = '<' . $until;

        return new Search(array_filter([
            'received' => $received,
            'type' => $types,
        ]));
    }

    // Walk one step backward through matching requests (respects the Search filter).
    protected function previousOne($storage, $id, $search)
    {
        $prev = $storage->previous($id, 1, $search);

        return count($prev) ? $prev[0] : null;
    }

    // Coerce a possibly-null counter into a number.
    protected function n($v)
    {
        return is_numeric($v) ? $v * 1 : 0;
    }
    // A duration (ms) is only trustworthy in the 0..10min range; older/corrupt records can
    // carry values like -1.78e12 (responseTime was null when stored), which would poison
    // aggregates. Reject anything outside the sane range.
    protected function saneDuration($v)
    {
        return ($v !== null && is_numeric($v) && $v >= 0 && $v < 600000) ? $v * 1 : null;
    }

    // Sane response duration for a request, preferring the persisted responseDuration.
    protected function requestDuration($request)
    {
        $dur = $request->responseDuration ?? ($request->responseTime ? $request->getResponseDuration() : null);

        return $this->saneDuration($dur);
    }

    // Human label for a request — used as an operation's back-reference target.
    protected function requestLabel($request)
    {
        if ($request->type == 'command') return $request->commandName ? 'artisan ' . $request->commandName : 'artisan';
        if ($request->type == 'queue-job') return $request->jobName ?: 'queue-job';
        if ($request->type == 'test') return $request->testName ?: 'test';

        return $request->uri ?: (string) ($request->url ?? '');
    }

    // The operation array on a request for a given category.
    protected function operationsArray($request, $category)
    {
        // Notifications also include the legacy emailsData (older Swift-based emails that
        // predate the notifications data source), normalized to the notifications shape so
        // old records don't silently drop their mail.
        if ($category == 'notifications') {
            $emails = [];
            foreach ((array) ($request->emailsData ?: []) as $email) {
                $data = (is_array($email) && isset($email['data']) && is_array($email['data'])) ? $email['data'] : [];
                $emails[] = [
                    'subject'     => $data['subject'] ?? null,
                    'to'          => $data['to'] ?? null,
                    'from'        => $data['from'] ?? null,
                    'type'        => 'mail',
                    'duration'    => $email['duration'] ?? null,
                    'time'        => $email['start'] ?? null,
                    'description' => $email['description'] ?? 'Sending an email message',
                    '_source'     => 'emailsData',
                ];
            }

            return array_merge(is_array($request->notifications) ? $request->notifications : [], $emails);
        }

        $map = [
            'database' => 'databaseQueries', 'cache' => 'cacheQueries', 'redis' => 'redisCommands',
            'log' => 'log', 'events' => 'events', 'views' => 'viewsData',
        ];

        $prop = $map[$category] ?? null;
        if (!$prop) return [];

        $arr = $request->$prop;

        return is_array($arr) ? $arr : [];
    }

    // Infer a SQL type from the statement verb (real query records carry no explicit type).
    protected function inferQueryType($sql)
    {
        $sql = ltrim((string) $sql);
        if (preg_match('/^select\b/i', $sql)) return 'select';
        if (preg_match('/^insert\b/i', $sql)) return 'insert';
        if (preg_match('/^update\b/i', $sql)) return 'update';
        if (preg_match('/^(delete|truncate)\b/i', $sql)) return 'delete';

        return 'other';
    }

    // Cast an operation to a JSON row and attach the originating-request back-reference.
    protected function operationRow($op, $request, $category)
    {
        $row = is_array($op) ? $op : (array) $op;

        if ($category == 'database' && !isset($row['type'])) {
            $row['type'] = $this->inferQueryType($row['query'] ?? '');
        }

        $row['requestId'] = $request->id;
        $row['requestUuid'] = $request->uuid;
        $row['requestUri'] = $this->requestLabel($request);
        $row['requestType'] = $request->type;
        $row['requestTime'] = $request->time;

        return $row;
    }

    // Make an authenticator instance based on the current configuration

    public function getEnvironmentSnapshot()
    {
        if ($response = $this->ensureMetadataAccess()) return $response;

        return new JsonResponse([
            'appEnv' => $this->app['config']->get('app.env'),
            'appDebug' => $this->app['config']->get('app.debug'),
            'phpVersion' => PHP_VERSION,
            'phpSapi' => PHP_SAPI,
            'laravelVersion' => Application::VERSION,
            'clockworkVersion' => Clockwork::VERSION,
            'gitSha' => $this->detectGitSha(),
            'storageDriver' => $this->getConfig('storage', 'files'),
            'databaseDefault' => $this->app['config']->get('database.default'),
            'cacheDefault' => $this->app['config']->get('cache.default'),
            'queueDefault' => $this->app['config']->get('queue.default'),
            'mailDefault' => $this->app['config']->get('mail.default'),
            'clockwork' => [
                'enabled' => $this->isEnabled(),
                'collectDataAlways' => $this->getConfig('collect_data_always', false),
                'requests' => [
                    'collect' => ($this->isEnabled() || $this->getConfig('collect_data_always', false))
                        && !$this->app->runningInConsole(),
                    'errorsOnly' => $this->getConfig('requests.errors_only', false),
                    'slowOnly' => $this->getConfig('requests.slow_only', false)
                ],
                'artisan' => [
                    'collect' => $this->getConfig('artisan.collect', false)
                ],
                'queue' => [
                    'collect' => $this->getConfig('queue.collect', false)
                ],
                'tests' => [
                    'collect' => $this->getConfig('tests.collect', false)
                ]
            ]
        ]);
    }

    // Set up collecting of executed artisan commands

    protected function detectGitSha()
    {
        $headPath = base_path('.git/HEAD');

        if (!is_readable($headPath)) return null;

        $head = trim((string)@file_get_contents($headPath));

        if (strpos($head, 'ref: ') !== 0) return $head ?: null;

        $ref = trim(substr($head, 5));
        $refPath = base_path('.git/' . $ref);

        if (!is_readable($refPath)) return null;

        return trim((string)@file_get_contents($refPath)) ?: null;
    }

    // Set up collecting of executed queue jobs

    public function isEnabled()
    {
        return $this->getConfig('enable')
            || $this->getConfig('enable') === null && $this->app['config']->get('app.debug')
            && ($this->incomingRequest()->hasLocalHost() || $this->app->runningInConsole());
    }

    // Process an executed queue job, resolves and records the current request

    protected function incomingRequest()
    {
        if ($this->incomingRequest) return $this->incomingRequest;

        return $this->incomingRequest = new IncomingRequest([
            'method' => $this->app['request']->getMethod(),
            'uri' => $this->app['request']->getRequestUri(),
            'input' => $this->app['request']->input(),
            'cookies' => $this->app['request']->cookie(),
            'host' => method_exists($this->app['request'], 'host') ? $this->app['request']->host() : $this->app['request']->getHost()
        ]);
    }

    // Process an executed http request, resolves the current request, sets Clockwork headers and cookies

    public function updateData($id, $input = [])
    {
        if (isset($this->app['session'])) $this->app['session.store']->reflash();

        if (!$this->isCollectingClientMetrics()) {
            throw new NotFoundHttpException;
        }

        $storage = $this->app['clockwork']->storage();

        $request = $storage->find($id);

        if (!$request) {
            return new JsonResponse(['message' => 'Request not found.'], 404);
        }

        $token = $input['_token'] ?? '';

        if (!$request->updateToken || !hash_equals($request->updateToken, $token)) {
            return new JsonResponse(['message' => 'Invalid update token.'], 403);
        }

        foreach ($input as $key => $value) {
            if (in_array($key, ['clientMetrics', 'webVitals'])) {
                $request->$key = $value;
            }
        }

        $storage->update($request);
    }

    // Records the current http request

    public function isCollectingClientMetrics()
    {
        return $this->getConfig('features.performance.client_metrics', true);
    }

    // Set current http response on the framework data source

    public function getWebAsset($path)
    {
        $asset = (new Web)->asset($path);

        if (!$asset) throw new NotFoundHttpException;

        return new BinaryFileResponse($asset['path'], 200, ['Content-Type' => $asset['mime']]);
    }

    // Configure serializer defaults

    public function listenToEvents()
    {
        $this->frameworkDataSource()->listenToEvents();

        if ($this->isFeatureEnabled('cache')) $this->app['clockwork.cache']->listenToEvents();
        if ($this->isFeatureEnabled('database')) $this->app['clockwork.eloquent']->listenToEvents();
        if ($this->isFeatureEnabled('events')) $this->app['clockwork.events']->listenToEvents();
        if ($this->isFeatureEnabled('http_requests')) $this->app['clockwork.http-requests']->listenToEvents();
        if ($this->isFeatureEnabled('notifications')) {
            $this->isFeatureAvailable('notifications-events')
                ? $this->app['clockwork.notifications']->listenToEvents() : $this->app['clockwork.swift']->listenToEvents();
        }
        if ($this->isFeatureEnabled('queue')) {
            $this->app['clockwork.queue']->listenToEvents();
            $this->app['clockwork.queue']->setCurrentRequestId($this->app['clockwork.request']->id);
            $this->app['clockwork.queue']->setCurrentRequestUuid($this->app['clockwork.request']->uuid);
        }
        if ($this->isFeatureEnabled('redis')) {
            $this->app[RedisManager::class]->enableEvents();
            $this->app['clockwork.redis']->listenToEvents();
        }
        if ($this->isFeatureEnabled('views')) {
            $this->getConfig('features.views.use_twig_profiler', false)
                ? $this->app['clockwork.twig']->listenToEvents() : $this->app['clockwork.views']->listenToEvents();
        }

        if ($this->isCollectingCommands()) $this->collectCommands();
        if ($this->isCollectingQueueJobs()) $this->collectQueueJobs();

        return $this;
    }

    // Configure should collect rules

    public function isCollectingCommands()
    {
        return ($this->isEnabled() || $this->getConfig('collect_data_always', false))
            && $this->app->runningInConsole()
            && $this->getConfig('artisan.collect', false);
    }

    // Configure should record rules

    public function collectCommands()
    {
        $this->app['events']->listen(\Illuminate\Console\Events\CommandStarting::class, function ($event) {
            if (!$this->shouldCollectCommand($event->command)) return;

            if (!$this->getConfig('artisan.collect_output')) return;

            if (version_compare(\Illuminate\Foundation\Application::VERSION, '9.0.0', '<')) {
                $formatter = new Console\CapturingOldFormatter($event->output->getFormatter());
            } elseif (version_compare(\Illuminate\Foundation\Application::VERSION, '11.0.0', '<')) {
                $formatter = new Console\CapturingLegacyFormatter($event->output->getFormatter());
            } else {
                $formatter = new Console\CapturingFormatter($event->output->getFormatter());
            }

            $event->output->setFormatter($formatter);
        });

        $this->app['events']->listen(\Illuminate\Console\Events\CommandFinished::class, function ($event) {
            if (!$this->shouldCollectCommand($event->command)) return;

            $command = $this->artisan->find($event->command);

            $allArguments = $event->input->getArguments();
            $allOptions = $event->input->getOptions();

            $defaultArguments = $command->getDefinition()->getArgumentDefaults();
            $defaultOptions = $command->getDefinition()->getOptionDefaults();

            $this->app->make('clockwork')
                ->resolveAsCommand(
                    $event->command,
                    $event->exitCode,
                    array_udiff_assoc($allArguments, $defaultArguments, function ($a, $b) {
                        return $a == $b ? 0 : 1;
                    }),
                    array_udiff_assoc($allOptions, $defaultOptions, function ($a, $b) {
                        return $a == $b ? 0 : 1;
                    }),
                    $defaultArguments,
                    $defaultOptions,
                    $this->getConfig('artisan.collect_output') ? $event->output->getFormatter()->capturedOutput() : null
                )
                ->storeRequest();
        });
    }

    // Check whether Clockwork is enabled at all

    protected function shouldCollectCommand($command)
    {
        $trace = StackTrace::get();

        // only collect commands ran through the artisan cli, other commands are recorded as part of respective request
        if (basename($trace->last()->file) != 'artisan') return false;

        // also skip commands called from another command ran through the artisan cli
        if ($trace->first(StackFilter::make()->isClass(\Illuminate\Foundation\Console\Kernel::class)->isFunction('call'))) return false;

        return $command && !$this->isCommandFiltered($command);
    }

    // Check whether we are collecting data

    protected function isCommandFiltered($command)
    {
        $only = $this->getConfig('artisan.only', []);

        if (count($only)) return !in_array($command, $only);

        $except = $this->getConfig('artisan.except', []);

        if ($this->getConfig('artisan.except_laravel_commands', true)) {
            $except = array_merge($except, $this->builtinLaravelCommands());
        }

        $except = array_merge($except, $this->builtinClockworkCommands());

        return in_array($command, $except);
    }

    // Check whether we are collecting artisan commands

    protected function builtinLaravelCommands()
    {
        return [
            'clear-compiled', 'completion', 'db', 'down', 'dump-server', 'env', 'help', 'list', 'migrate', 'optimize',
            'preset', 'serve', 'test', 'tinker', 'up',
            'app:name',
            'auth:clear-resets',
            'cache:clear', 'cache:forget', 'cache:table',
            'config:cache', 'config:clear',
            'db:seed', 'db:wipe',
            'event:cache', 'event:clear', 'event:generate', 'event:list',
            'horizon', 'horizon:clear', 'horizon:continue', 'horizon:continue-supervisor', 'horizon:forget',
            'horizon:install', 'horizon:list', 'horizon:pause', 'horizon:pause-supervisor', 'horizon:publish',
            'horizon:purge', 'horizon:snapshot', 'horizon:status', 'horizon:supervisors', 'horizon:terminate',
            'horizon:work',
            'key:generate',
            'make:auth', 'make:cast', 'make:channel', 'make:command', 'make:component', 'make:controller', 'make:event',
            'make:exception', 'make:factory', 'make:job', 'make:listener', 'make:mail', 'make:middleware',
            'make:migration', 'make:model', 'make:notification', 'make:observer', 'make:policy', 'make:provider',
            'make:request', 'make:resource', 'make:rule', 'make:scope', 'make:seeder', 'make:test',
            'migrate:fresh', 'migrate:install', 'migrate:refresh', 'migrate:reset', 'migrate:rollback',
            'migrate:status',
            'model:prune',
            'notifications:table',
            'octane:install', 'octane:reload', 'octane:start', 'octane:status', 'octane:stop',
            'optimize:clear',
            'package:discover',
            'queue:batches-table', 'queue:clear', 'queue:failed', 'queue:failed-table', 'queue:flush', 'queue:forget',
            'queue:listen', 'queue:monitor', 'queue:prune-batches', 'queue:prune-failed', 'queue:restart',
            'queue:retry', 'queue:retry-batch', 'queue:table', 'queue:work',
            'route:cache', 'route:clear', 'route:list',
            'sail:install', 'sail:publish',
            'schedule:clear-cache', 'schedule:list', 'schedule:run', 'schedule:test', 'schedule:work',
            'schema:dump',
            'session:table',
            'storage:link',
            'stub:publish',
            'vendor:publish',
            'view:cache', 'view:clear'
        ];
    }

    // Check whether we are collecting queue jobs

    protected function builtinClockworkCommands()
    {
        return [
            'clockwork:clean'
        ];
    }

    // Check whether we are collecting http requests

    public function isCollectingQueueJobs()
    {
        return ($this->isEnabled() || $this->getConfig('collect_data_always', false))
            && $this->app->runningInConsole()
            && $this->getConfig('queue.collect', false);
    }

    // Check whether we are collecting tests

    public function collectQueueJobs()
    {
        $this->app['events']->listen(\Illuminate\Queue\Events\JobProcessing::class, function ($event) {
            // sync jobs are recorded as part of the parent request
            if ($event->job instanceof \Illuminate\Queue\Jobs\SyncJob) return;

            $payload = $event->job->payload();

            if (!isset($payload['clockwork_id']) || $this->isQueueJobFiltered($payload['displayName'])) return;

            $request = new Request([
                'id' => $payload['clockwork_id'],
                'uuid' => $payload['clockwork_uuid'] ?? null
            ]);
            if (isset($payload['clockwork_parent_id'])) {
                $request->setParent($payload['clockwork_parent_id'], ['uuid' => $payload['clockwork_parent_uuid'] ?? null]);
            }

            $this->app->make('clockwork')->reset()->request($request);

            $this->app['clockwork.queue']->setCurrentRequestId($request->id);
            $this->app['clockwork.queue']->setCurrentRequestUuid($request->uuid);
        });

        $this->app['events']->listen(\Illuminate\Queue\Events\JobProcessed::class, function ($event) {
            $this->processQueueJob($event->job);
        });

        $this->app['events']->listen(\Illuminate\Queue\Events\JobFailed::class, function ($event) {
            $this->processQueueJob($event->job, $event->exception);
        });
    }

    // Check whether we are recording the passed request

    protected function isQueueJobFiltered($queueJob)
    {
        $only = $this->getConfig('queue.only', []);

        if (count($only)) return !in_array($queueJob, $only);

        $except = $this->getConfig('queue.except', []);

        return in_array($queueJob, $except);
    }

    // Check whether a feature is enabled

    protected function processQueueJob($job, $exception = null)
    {
        // sync jobs are recorded as part of the parent request
        if ($job instanceof \Illuminate\Queue\Jobs\SyncJob) return;

        $payload = $job->payload();

        if (!isset($payload['clockwork_id'])) return;

        $unserialized = isset($payload['data']['command']) ? unserialize($payload['data']['command']) : null;

        if (!$unserialized || $this->isQueueJobFiltered(get_class($unserialized))) return;

        if ($exception) {
            $this->app->make('clockwork')->error($exception->getMessage(), ['exception' => $exception]);
        }

        $this->app->make('clockwork')
            ->resolveAsQueueJob(
                get_class($unserialized),
                $payload['displayName'],
                $job->hasFailed() ? 'failed' : ($job->isReleased() ? 'released' : 'done'),
                $unserialized,
                $job->getQueue(),
                $job->getConnectionName(),
                array_filter([
                    'maxTries' => $payload['maxTries'] ?? null,
                    'delaySeconds' => $payload['delaySeconds'] ?? null,
                    'timeout' => $payload['timeout'] ?? null,
                    'timeoutAt' => $payload['timeoutAt'] ?? null
                ])
            )
            ->storeRequest();
    }

    // Check whether a feature is available

    public function handleArtisanEvents()
    {
        if (class_exists(\Illuminate\Console\Events\ArtisanStarting::class)) {
            $this->app['events']->listen(\Illuminate\Console\Events\ArtisanStarting::class, function ($event) {
                $this->artisan = $event->artisan;
            });
        }
    }

    // Check whether we are collecting client metrics

    public function handleOctaneEvents()
    {
        $this->app['events']->listen(\Laravel\Octane\Events\RequestReceived::class, function ($event) {
            $this->app = $event->sandbox;
            $this->incomingRequest = null;

            $this->app->forgetInstance('clockwork.request');

            $this->app['clockwork']->reset()->request($this->app->make('clockwork.request'));
            $this->app['clockwork.laravel']->setApplication($this->app);
        });
    }

    // Check whether the toolbar is enabled

    public function makeStorage()
    {
        $storage = $this->getConfig('storage', 'files');
        $expiration = $this->getConfig('storage_expiration');

        if ($storage == 'sql') {
            $database = $this->getConfig('storage_sql_database', storage_path('clockwork.sqlite'));
            $table = $this->getConfig('storage_sql_table', 'clockwork');

            if ($this->app['config']->get("database.connections.{$database}")) {
                $database = $this->app['db']->connection($database)->getPdo();
            } else {
                $database = "sqlite:{$database}";
            }

            return new SqlStorage($database, $table, null, null, $expiration);
        } elseif ($storage == 'redis') {
            $connection = $this->app['redis']->connection($this->getConfig('storage_redis'))->client();

            return new RedisStorage($connection, $expiration, $this->getConfig('storage_redis_prefix', 'clockwork'));
        } else {
            return new FileStorage(
                $this->getConfig('storage_files_path', storage_path('clockwork')),
                0700,
                $expiration,
                $this->getConfig('storage_files_compress', false)
            );
        }
    }

    // Check whether the web ui is enabled

    public function makeAuthenticator()
    {
        $authenticator = $this->getConfig('authentication');

        if (is_string($authenticator)) {
            return $this->app->make($authenticator);
        } elseif ($authenticator) {
            return new SimpleAuthenticator($this->getConfig('authentication_password'));
        } else {
            return new NullAuthenticator;
        }
    }

    // Check whether we should collect currently executing command

    public function processRequest($request, $response)
    {
        if (!$this->isCollectingRequests()) {
            return $response; // Clockwork is not collecting data, additional check when the middleware is enabled manually
        }

        $clockwork = $this->app['clockwork'];
        $clockworkRequest = $clockwork->request();

        $clockwork->event('Controller')->end();

        $this->setResponse($response);

        $clockwork->resolveRequest();

        if (!$this->isEnabled() || !$this->isRecording($clockworkRequest)) {
            return $response; // Clockwork is disabled or we are not recording this request
        }

        $response->headers->set('X-Clockwork-Id', $clockworkRequest->id, true);
        $response->headers->set('X-Clockwork-Uuid', $clockworkRequest->uuid, true);
        $response->headers->set('X-Clockwork-Version', Clockwork::VERSION, true);

        if ($request->getBasePath()) {
            $response->headers->set('X-Clockwork-Path', $request->getBasePath() . '/__clockwork/', true);
        }

        foreach ($this->getConfig('headers', []) as $headerName => $headerValue) {
            $response->headers->set("X-Clockwork-Header-{$headerName}", $headerValue);
        }

        foreach ($clockwork->request()->subrequests as $subrequest) {
            $url = urlencode($subrequest['url']);
            $path = urlencode($subrequest['path']);

            $response->headers->set('X-Clockwork-Subrequest', "{$subrequest['id']};{$url};{$path}", false);
        }

        $this->appendServerTimingHeader($response, $clockworkRequest);

        if (!($response instanceof Response)) {
            return $response;
        }

        if ($this->isCollectingClientMetrics() || $this->isToolbarEnabled()) {
            $clockworkBrowser = [
                'requestId' => $clockworkRequest->id,
                'requestUuid' => $clockworkRequest->uuid,
                'version' => Clockwork::VERSION,
                'path' => $request->getBasePath() . '/__clockwork/',
                'webPath' => $request->getBasePath() . '/' . $this->webPaths()[0] . '/app',
                'token' => $clockworkRequest->updateToken,
                'metrics' => $this->isCollectingClientMetrics(),
                'toolbar' => $this->isToolbarEnabled()
            ];

            $response->cookie(
                new Cookie('x-clockwork', json_encode($clockworkBrowser), time() + 60, null, null, $request->secure(), false)
            );
        } elseif (in_array('x-clockwork', $this->incomingRequest()->cookies)) {
            $response->cookie(
                new Cookie('x-clockwork', '', -1, null, null, $request->secure(), false)
            );
        }

        return $response;
    }

    // Check whether a command should not be collected

    public function isCollectingRequests()
    {
        return ($this->isEnabled() || $this->getConfig('collect_data_always', false))
            && !$this->app->runningInConsole()
            && $this->app['clockwork']->shouldCollect()->filter($this->incomingRequest());
    }

    // Check whether a queue job should not be collected

    protected function setResponse($response)
    {
        $this->app['clockwork.laravel']->setResponse($response);
    }

    // Check whether a test should not be collected

    public function isRecording($incomingRequest)
    {
        return ($this->isEnabled() || $this->getConfig('collect_data_always', false))
            && $this->app['clockwork']->shouldRecord()->filter($incomingRequest);
    }

    // Append server timing headers from a Clockwork request to a http response

    protected function appendServerTimingHeader($response, $request)
    {
        if (($eventsCount = $this->getConfig('server_timing', 10)) !== false) {
            $response->headers->set('Server-Timing', ServerTiming::fromRequest($request, $eventsCount)->value());
        }
    }

    // Make an incoming request instance

    public function isToolbarEnabled()
    {
        return $this->getConfig('toolbar', false);
    }

    // Return an array of web ui paths

    public function webPaths()
    {
        $path = $this->getConfig('web', true);

        if (is_string($path)) return collect([trim($path, '/')]);

        return collect(['clockwork', '__clockwork']);
    }

    // Return an array of built-in Laravel commands

    public function recordRequest()
    {
        if (!$this->isCollectingRequests()) {
            return; // Clockwork is not collecting data, additional check when the middleware is enabled manually
        }

        $clockwork = $this->app['clockwork'];

        if (!$this->isRecording($clockwork->request())) {
            return; // Collecting data is disabled, return immediately
        }

        $clockwork->storeRequest();
    }

    // Return an array of built-in Clockwork commands

    public function configureSerializer()
    {
        Serializer::defaults([
            'limit' => $this->getConfig('serialization_depth'),
            'blackbox' => $this->getConfig('serialization_blackbox'),
            'traces' => $this->getConfig('stack_traces.enabled', true),
            'tracesSkip' => StackFilter::make()
                ->isNotVendor(array_merge(
                    $this->getConfig('stack_traces.skip_vendors', []),
                    ['itsgoingd', 'laravel', 'illuminate', 'psr']
                ))
                ->isNotNamespace($this->getConfig('stack_traces.skip_namespaces', []))
                ->isNotFunction(['call_user_func', 'call_user_func_array'])
                ->isNotClass($this->getConfig('stack_traces.skip_classes', [])),
            'tracesLimit' => $this->getConfig('stack_traces.limit', 10)
        ]);

        return $this;
    }

    public function configureShouldCollect()
    {
        $this->app['clockwork']->shouldCollect([
            'onDemand' => $this->getConfig('requests.on_demand', false),
            'sample' => $this->getConfig('requests.sample', false),
            'except' => $this->getConfig('requests.except', []),
            'only' => $this->getConfig('requests.only', []),
            'exceptPreflight' => $this->getConfig('requests.except_preflight', [])
        ]);

        // don't collect data for Clockwork requests
        $webPath = $this->webPaths()[0];
        $this->app['clockwork']->shouldCollect()->except(['/__clockwork(?:/.*)?', "/{$webPath}(?:/.*)?"]);

        return $this;
    }

    public function configureShouldRecord()
    {
        $this->app['clockwork']->shouldRecord([
            'errorsOnly' => $this->getConfig('requests.errors_only', false),
            'slowOnly' => $this->getConfig('requests.slow_only', false) ? $this->getConfig('requests.slow_threshold') : false
        ]);

        return $this;
    }

    public function isCollectingData()
    {
        return $this->isCollectingCommands()
            || $this->isCollectingQueueJobs()
            || $this->isCollectingRequests()
            || $this->isCollectingTests();
    }

    public function isCollectingTests()
    {
        return ($this->isEnabled() || $this->getConfig('collect_data_always', false))
            && $this->app->runningInConsole()
            && $this->getConfig('tests.collect', false);
    }

    public function isWebEnabled()
    {
        return $this->getConfig('web', true);
    }

    public function isTestFiltered($test)
    {
        $except = $this->getConfig('tests.except', []);

        return in_array($test, $except);
    }
}
