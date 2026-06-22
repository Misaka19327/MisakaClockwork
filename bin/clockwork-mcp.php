<?php

$autoloadPath = __DIR__ . '/../vendor/autoload.php';

if (is_file($autoloadPath)) {
    require_once $autoloadPath;
} else {
    spl_autoload_register(function ($class) {
        $prefix = 'Clockwork\\';

        if (strncmp($class, $prefix, strlen($prefix)) !== 0) {
            return;
        }

        $path = __DIR__ . '/../' . str_replace('\\', '/', $class) . '.php';

        if (is_file($path)) require_once $path;
    });
}

use Clockwork\Clockwork;
use Clockwork\Request\Request;
use Clockwork\Storage\Search;
use Clockwork\Storage\SqlStorage;

class ClockworkMcpServer
{
    const MCP_PROTOCOL_VERSION = '2025-11-25';

    private $stdin;
    private $stdout;
    private $stderr;
    private $rootPath;
    private $storage;
    private $storageMeta;
    private $storageError;
    private $running = true;

    public function __construct()
    {
        $this->stdin = fopen('php://stdin', 'rb');
        $this->stdout = fopen('php://stdout', 'wb');
        $this->stderr = fopen('php://stderr', 'wb');
        $this->rootPath = realpath(__DIR__ . '/..') ?: dirname(__DIR__);

        try {
            $this->storage = $this->makeStorage();
        } catch (\Throwable $e) {
            $this->storage = null;
            $this->storageError = $e->getMessage();
            $this->storageMeta = [
                'available' => false,
                'error' => $this->storageError
            ];
        }
    }

    private function makeStorage()
    {
        $dsn = getenv('CLOCKWORK_MCP_STORAGE_DSN');

        if (!$dsn) {
            throw new \RuntimeException('CLOCKWORK_MCP_STORAGE_DSN environment variable is required (e.g. sqlite:/path/to/clockwork.sqlite).');
        }

        $this->storageMeta = [
            'available' => true,
            'driver' => 'sql',
            'dsn' => $dsn,
            'table' => getenv('CLOCKWORK_MCP_STORAGE_SQL_TABLE') ?: 'clockwork'
        ];

        return new SqlStorage(
            $dsn,
            $this->storageMeta['table'],
            getenv('CLOCKWORK_MCP_STORAGE_SQL_USERNAME') ?: null,
            getenv('CLOCKWORK_MCP_STORAGE_SQL_PASSWORD') ?: null,
            getenv('CLOCKWORK_MCP_STORAGE_SQL_OPERATIONS_TABLE') ?: 'clockwork_operations',
            null,
            false
        );
    }

    public function run()
    {
        while ($this->running && ($payload = $this->readMessage()) !== null) {
            $message = json_decode($payload, true);

            if (!is_array($message)) {
                $this->respondError(null, -32700, 'Invalid JSON payload.');
                continue;
            }

            $this->handleMessage($message);
        }
    }

    private function readMessage()
    {
        $headers = [];

        while (($line = fgets($this->stdin)) !== false) {
            $line = rtrim($line, "\r\n");

            if ($line === '') break;

            $parts = explode(':', $line, 2);

            if (count($parts) !== 2) continue;

            $headers[strtolower(trim($parts[0]))] = trim($parts[1]);
        }

        if (!count($headers)) return null;

        if (!isset($headers['content-length'])) {
            throw new \RuntimeException('Missing Content-Length header.');
        }

        $length = (int)$headers['content-length'];
        $body = '';

        while (strlen($body) < $length) {
            $chunk = fread($this->stdin, $length - strlen($body));

            if ($chunk === false || $chunk === '') break;

            $body .= $chunk;
        }

        return $body;
    }

    private function respondError($id, $code, $message, $data = null)
    {
        $error = [
            'code' => $code,
            'message' => $message
        ];

        if ($data !== null) $error['data'] = $data;

        $this->writeMessage([
            'jsonrpc' => '2.0',
            'id' => $id,
            'error' => $error
        ]);
    }

    private function writeMessage(array $message)
    {
        $json = json_encode($message, JSON_UNESCAPED_SLASHES);

        if ($json === false) {
            fwrite($this->stderr, "Failed to encode MCP response.\n");
            return;
        }

        $payload = "Content-Length: " . strlen($json) . "\r\n\r\n" . $json;

        fwrite($this->stdout, $payload);
        fflush($this->stdout);
    }

    private function handleMessage(array $message)
    {
        $method = isset($message['method']) ? $message['method'] : null;
        $id = array_key_exists('id', $message) ? $message['id'] : null;
        $params = isset($message['params']) && is_array($message['params']) ? $message['params'] : [];

        if (!$method) {
            if ($id !== null) $this->respondError($id, -32600, 'Missing method.');
            return;
        }

        switch ($method) {
            case 'initialize':
                $this->respond($id, [
                    'protocolVersion' => $this->negotiateProtocolVersion($params),
                    'capabilities' => [
                        'tools' => new stdClass
                    ],
                    'serverInfo' => [
                        'name' => 'clockwork-mcp',
                        'version' => Clockwork::VERSION
                    ],
                    'instructions' => 'Read Clockwork request metadata from local storage.'
                ]);
                return;

            case 'notifications/initialized':
                return;

            case 'ping':
                if ($id !== null) $this->respond($id, new stdClass);
                return;

            case 'shutdown':
                $this->running = false;
                if ($id !== null) $this->respond($id, new stdClass);
                return;

            case 'exit':
                $this->running = false;
                return;

            case 'tools/list':
                $this->respond($id, ['tools' => $this->toolDefinitions()]);
                return;

            case 'tools/call':
                $this->respond($id, $this->callTool($params));
                return;

            default:
                if ($id !== null) $this->respondError($id, -32601, "Unsupported method: {$method}");
        }
    }

    private function respond($id, $result)
    {
        $this->writeMessage([
            'jsonrpc' => '2.0',
            'id' => $id,
            'result' => $result
        ]);
    }

    private function negotiateProtocolVersion(array $params)
    {
        $requested = isset($params['protocolVersion']) ? (string)$params['protocolVersion'] : '';

        foreach ([self::MCP_PROTOCOL_VERSION, '2025-06-18', '2024-11-05'] as $supported) {
            if ($requested === $supported) return $supported;
        }

        return self::MCP_PROTOCOL_VERSION;
    }

    private function toolDefinitions()
    {
        return [
            [
                'name' => 'clockwork_storage_status',
                'description' => 'Show which Clockwork storage backend is configured and whether request metadata is available.',
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => new stdClass
                ]
            ],
            [
                'name' => 'clockwork_list_requests',
                'description' => 'List recent Clockwork requests with optional filters and cursor-based navigation.',
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'limit' => [
                            'type' => 'integer',
                            'minimum' => 1,
                            'maximum' => 100,
                            'description' => 'Maximum number of requests to return. Defaults to 20.'
                        ],
                        'search' => [
                            'type' => 'string',
                            'description' => 'Case-insensitive keyword search across route or command names.'
                        ],
                        'type' => [
                            'type' => 'string',
                            'enum' => ['request', 'command', 'queue-job', 'test'],
                            'description' => 'Restrict results to a single Clockwork request type.'
                        ],
                        'method' => [
                            'type' => 'string',
                            'description' => 'HTTP method filter for request items.'
                        ],
                        'status' => [
                            'type' => 'string',
                            'description' => 'Status filter such as 500, >399 or 200-299.'
                        ],
                        'uri' => [
                            'type' => 'string',
                            'description' => 'URI substring filter for HTTP requests.'
                        ],
                        'name' => [
                            'type' => 'string',
                            'description' => 'Name substring filter for commands, queue jobs or tests.'
                        ],
                        'controller' => [
                            'type' => 'string',
                            'description' => 'Controller substring filter for HTTP requests.'
                        ],
                        'receivedAfter' => [
                            'type' => 'integer',
                            'description' => 'Only include requests received after this unix timestamp.'
                        ],
                        'receivedBefore' => [
                            'type' => 'integer',
                            'description' => 'Only include requests received before this unix timestamp.'
                        ],
                        'fromId' => [
                            'type' => 'string',
                            'description' => 'Anchor request id used with direction.'
                        ],
                        'direction' => [
                            'type' => 'string',
                            'enum' => ['previous', 'next'],
                            'description' => 'Fetch requests before or after fromId.'
                        ]
                    ]
                ]
            ],
            [
                'name' => 'clockwork_get_request',
                'description' => 'Fetch a single Clockwork request by id.',
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'id' => [
                            'type' => 'string',
                            'description' => 'Clockwork request id.'
                        ],
                        'view' => [
                            'type' => 'string',
                            'enum' => ['summary', 'raw'],
                            'description' => 'summary returns a compact view, raw returns the full request payload without updateToken.'
                        ]
                    ]
                ]
            ],
            [
                'name' => 'clockwork_get_event_details',
                'description' => 'Return the event-details payload for a request by id.',
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'id' => [
                            'type' => 'string',
                            'description' => 'Clockwork request id.'
                        ]
                    ]
                ]
            ]
        ];
    }

    private function callTool(array $params)
    {
        $name = isset($params['name']) ? $params['name'] : null;
        $arguments = isset($params['arguments']) && is_array($params['arguments']) ? $params['arguments'] : [];

        try {
            switch ($name) {
                case 'clockwork_storage_status':
                    return $this->toolSuccess($this->storageStatus());

                case 'clockwork_list_requests':
                    return $this->toolSuccess($this->listRequests($arguments));

                case 'clockwork_get_request':
                    return $this->toolSuccess($this->getRequestPayload($arguments));

                case 'clockwork_get_event_details':
                    return $this->toolSuccess($this->getEventDetailsPayload($arguments));

                default:
                    return $this->toolError("Unknown tool: {$name}");
            }
        } catch (\InvalidArgumentException $e) {
            return $this->toolError($e->getMessage());
        } catch (\Throwable $e) {
            return $this->toolError($e->getMessage());
        }
    }

    private function toolSuccess(array $payload)
    {
        $json = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

        return [
            'content' => [
                [
                    'type' => 'text',
                    'text' => $json === false ? '{}' : $json
                ]
            ],
            'structuredContent' => $payload
        ];
    }

    private function storageStatus()
    {
        $status = $this->storageMeta;

        if (!$this->storage) {
            return $status;
        }

        $status['requestCount'] = count($this->storage->all(new Search));

        $latest = $this->storage->latest(new Search);
        $status['latestRequest'] = $latest ? $this->summarizeRequest($latest) : null;

        return $status;
    }

    private function summarizeRequest(Request $request)
    {
        return [
            'id' => $request->id,
            'type' => $request->type,
            'time' => $request->time,
            'method' => $request->method,
            'name' => $this->requestName($request),
            'uri' => $request->uri,
            'controller' => $request->controller,
            'status' => $this->requestStatus($request),
            'durationMs' => $request->responseDuration !== null
                ? $request->responseDuration
                : ($request->responseTime ? $request->getResponseDuration() : null),
            'memoryUsage' => $request->memoryUsage,
            'databaseQueries' => count($request->databaseQueries),
            'cacheQueries' => count($request->cacheQueries),
            'redisCommands' => count($request->redisCommands),
            'httpRequests' => count($request->httpRequests),
            'logEntries' => count($request->log()->toArray()),
            'hasErrors' => count($request->toEventDetails()['errors']) > 0
        ];
    }

    private function requestName(Request $request)
    {
        if ($request->type === 'command') return $request->commandName;
        if ($request->type === 'queue-job') return $request->jobName;
        if ($request->type === 'test') return $request->testName;
        return $request->uri;
    }

    private function requestStatus(Request $request)
    {
        if ($request->type === 'command') return $request->commandExitCode;
        if ($request->type === 'queue-job') return $request->jobStatus;
        if ($request->type === 'test') return $request->testStatus;
        return $request->responseStatus;
    }

    private function listRequests(array $arguments)
    {
        $this->requireStorage();

        $limit = isset($arguments['limit']) ? (int)$arguments['limit'] : 20;
        $limit = max(1, min($limit, 100));

        $search = $this->makeSearch($arguments);
        $direction = isset($arguments['direction']) ? $arguments['direction'] : null;
        $fromId = isset($arguments['fromId']) ? (string)$arguments['fromId'] : null;

        if ($fromId && $direction === 'previous') {
            $requests = $this->storage->previous($fromId, $limit, $search);
        } elseif ($fromId && $direction === 'next') {
            $requests = $this->storage->next($fromId, $limit, $search);
        } else {
            $requests = $this->storage->all($search);
            usort($requests, function (Request $left, Request $right) {
                if ($left->time == $right->time) return 0;
                return $left->time > $right->time ? -1 : 1;
            });
            $requests = array_slice($requests, 0, $limit);
        }

        return [
            'storage' => $this->storageMeta,
            'count' => count($requests),
            'requests' => array_map(function (Request $request) {
                return $this->summarizeRequest($request);
            }, $requests)
        ];
    }

    private function requireStorage()
    {
        if ($this->storage) return;

        throw new \RuntimeException(
            $this->storageError ?: 'Clockwork storage is not available yet.'
        );
    }

    private function makeSearch(array $arguments)
    {
        $search = [];

        if (isset($arguments['search']) && $arguments['search'] !== '') {
            $search['search'] = (string)$arguments['search'];
        }

        foreach (['uri', 'controller', 'method', 'type', 'name', 'status'] as $field) {
            if (!isset($arguments[$field]) || $arguments[$field] === '') continue;

            $value = is_array($arguments[$field]) ? $arguments[$field] : [(string)$arguments[$field]];
            $search[$field] = array_values(array_filter($value, function ($item) {
                return $item !== null && $item !== '';
            }));
        }

        $received = [];

        if (isset($arguments['receivedAfter'])) {
            $received[] = '>' . (int)$arguments['receivedAfter'];
        }

        if (isset($arguments['receivedBefore'])) {
            $received[] = '<' . (int)$arguments['receivedBefore'];
        }

        if (count($received)) $search['received'] = $received;

        return new Search($search);
    }

    private function getRequestPayload(array $arguments)
    {
        $this->requireStorage();

        $request = $this->requireRequest($arguments);
        $view = isset($arguments['view']) ? $arguments['view'] : 'raw';

        if ($view === 'summary') {
            return [
                'storage' => $this->storageMeta,
                'request' => $this->summarizeRequest($request)
            ];
        }

        return [
            'storage' => $this->storageMeta,
            'request' => $request->except(['updateToken'])
        ];
    }

    private function requireRequest(array $arguments)
    {
        $id = isset($arguments['id']) ? trim((string)$arguments['id']) : '';

        if ($id === '') {
            throw new \InvalidArgumentException('Provide a request id.');
        }

        $request = $this->storage->find($id);

        if (!$request) {
            throw new \InvalidArgumentException('Clockwork request not found.');
        }

        return $request;
    }

    private function getEventDetailsPayload(array $arguments)
    {
        $this->requireStorage();

        $request = $this->requireRequest($arguments);

        return [
            'storage' => $this->storageMeta,
            'request' => $request->toEventDetails()
        ];
    }

    private function toolError($message)
    {
        return [
            'content' => [
                [
                    'type' => 'text',
                    'text' => $message
                ]
            ],
            'isError' => true
        ];
    }
}

$server = new ClockworkMcpServer;
$server->run();
