<?php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/Support/Storage/FakeRedisClient.php';

use Clockwork\Request\Request;
use Clockwork\Storage\RedisStorage;
use Clockwork\Storage\Search;
use Clockwork\Storage\SqlStorage;
use Clockwork\Tests\Support\Storage\FakeRedisClient;

class InspectableSqlStorage extends SqlStorage
{
    public $capturedQueries = [];

    protected function query($query, array $bindings = [], $firstTry = true)
    {
        $this->capturedQueries[] = ['query' => $query, 'bindings' => $bindings];

        return parent::query($query, $bindings, $firstTry);
    }
}

function assertSameStrict($expected, $actual, $message)
{
    if ($expected !== $actual) {
        throw new RuntimeException(
            $message . "\nExpected: " . var_export($expected, true) . "\nActual:   " . var_export($actual, true)
        );
    }
}

function assertIds(array $requests, array $expected, $message)
{
    assertSameStrict(
        $expected,
        array_map(function ($request) { return $request->id; }, $requests),
        $message
    );
}

function makeRequest($id, $time, $uri)
{
    return new Request([
        'id' => $id,
        'time' => $time,
        'method' => 'GET',
        'uri' => $uri,
        'responseStatus' => 200,
        'responseDuration' => 12.5,
    ]);
}

function makeSqlStorage()
{
    $path = sys_get_temp_dir() . '/clockwork-request-ordering-' . uniqid('', true) . '.sqlite';
    $pdo = new PDO('sqlite:' . $path);

    return [new SqlStorage($pdo, 'clockwork_test', null, null, 'clockwork_test_operations', 168, false), $path];
}

function makeInspectableSqlStorage()
{
    $path = sys_get_temp_dir() . '/clockwork-request-ordering-' . uniqid('', true) . '.sqlite';
    $pdo = new PDO('sqlite:' . $path);

    return [new InspectableSqlStorage($pdo, 'clockwork_test', null, null, 'clockwork_test_operations', 168, false), $path];
}

function makeRedisStorage()
{
    return new RedisStorage(new FakeRedisClient, 168, 'clockwork-test', false);
}

function storeRequests($storage, array $requests)
{
    foreach ($requests as $request) {
        $storage->store($request);
    }
}

function cleanupSqlStorage($storage, $path)
{
    $storage->cleanup(true);
    if (is_file($path)) @unlink($path);
}

function assertUniquePlaceholders($sql, $message)
{
    preg_match_all('/:[A-Za-z_][A-Za-z0-9_]*/', $sql, $matches);
    $placeholders = $matches[0];

    assertSameStrict(
        count($placeholders),
        count(array_unique($placeholders)),
        $message
    );
}

function testSqlLatestUsesRequestTimeDescending()
{
    [$storage, $path] = makeSqlStorage();

    try {
        storeRequests($storage, [
            makeRequest('z-old', 100.0, '/old'),
            makeRequest('m-middle', 200.0, '/middle'),
            makeRequest('a-new', 300.0, '/new'),
        ]);

        $latest = $storage->latest();

        assertSameStrict('a-new', $latest->id, 'SQL latest request should be chosen by request time, not id.');
    } finally {
        cleanupSqlStorage($storage, $path);
    }
}

function testSqlPreviousReturnsOlderRequestsNewestFirst()
{
    [$storage, $path] = makeSqlStorage();

    try {
        storeRequests($storage, [
            makeRequest('300-new', 300.0, '/new'),
            makeRequest('200-middle', 200.0, '/middle'),
            makeRequest('100-old', 100.0, '/old'),
        ]);

        $previous = $storage->previous('300-new', 2);

        assertIds(
            $previous,
            ['200-middle', '100-old'],
            'SQL previous requests should stay in descending request-time order.'
        );
    } finally {
        cleanupSqlStorage($storage, $path);
    }
}

function testSqlNextReturnsNewerRequestsNewestFirst()
{
    [$storage, $path] = makeSqlStorage();

    try {
        storeRequests($storage, [
            makeRequest('300-new', 300.0, '/new'),
            makeRequest('200-middle', 200.0, '/middle'),
            makeRequest('100-old', 100.0, '/old'),
        ]);

        $next = $storage->next('100-old', 2);

        assertIds(
            $next,
            ['300-new', '200-middle'],
            'SQL next requests should stay in descending request-time order.'
        );
    } finally {
        cleanupSqlStorage($storage, $path);
    }
}

function testSqlPreviousUsesDriverSafeAnchorPlaceholders()
{
    [$storage, $path] = makeInspectableSqlStorage();

    try {
        storeRequests($storage, [
            makeRequest('300-new', 300.0, '/new'),
            makeRequest('200-middle', 200.0, '/middle'),
            makeRequest('100-old', 100.0, '/old'),
        ]);

        $storage->capturedQueries = [];
        $storage->previous('300-new', 2);

        $anchorQuery = null;

        foreach ($storage->capturedQueries as $entry) {
            if (strpos($entry['query'], 'anchor_') !== false) {
                $anchorQuery = $entry['query'];
                break;
            }
        }

        if (!$anchorQuery) {
            throw new RuntimeException('Expected SQL previous query to include anchor placeholders.');
        }

        assertUniquePlaceholders(
            $anchorQuery,
            'SQL previous query should not reuse named placeholders; MySQL PDO rejects duplicate names.'
        );
    } finally {
        cleanupSqlStorage($storage, $path);
    }
}

function testSqlNextUsesDriverSafeAnchorPlaceholders()
{
    [$storage, $path] = makeInspectableSqlStorage();

    try {
        storeRequests($storage, [
            makeRequest('300-new', 300.0, '/new'),
            makeRequest('200-middle', 200.0, '/middle'),
            makeRequest('100-old', 100.0, '/old'),
        ]);

        $storage->capturedQueries = [];
        $storage->next('100-old', 2);

        $anchorQuery = null;

        foreach ($storage->capturedQueries as $entry) {
            if (strpos($entry['query'], 'anchor_') !== false) {
                $anchorQuery = $entry['query'];
                break;
            }
        }

        if (!$anchorQuery) {
            throw new RuntimeException('Expected SQL next query to include anchor placeholders.');
        }

        assertUniquePlaceholders(
            $anchorQuery,
            'SQL next query should not reuse named placeholders; MySQL PDO rejects duplicate names.'
        );
    } finally {
        cleanupSqlStorage($storage, $path);
    }
}

function testRedisPreviousReturnsOlderRequestsNewestFirst()
{
    $storage = makeRedisStorage();

    storeRequests($storage, [
        makeRequest('300-new', 300.0, '/new'),
        makeRequest('200-middle', 200.0, '/middle'),
        makeRequest('100-old', 100.0, '/old'),
    ]);

    $previous = $storage->previous('300-new', 2, new Search);

    assertIds(
        $previous,
        ['200-middle', '100-old'],
        'Redis previous requests should stay in descending request-time order.'
    );
}

function testRedisNextReturnsNewerRequestsNewestFirst()
{
    $storage = makeRedisStorage();

    storeRequests($storage, [
        makeRequest('300-new', 300.0, '/new'),
        makeRequest('200-middle', 200.0, '/middle'),
        makeRequest('100-old', 100.0, '/old'),
    ]);

    $next = $storage->next('100-old', 2, new Search);

    assertIds(
        $next,
        ['300-new', '200-middle'],
        'Redis next requests should stay in descending request-time order.'
    );
}

$tests = [
    'testSqlLatestUsesRequestTimeDescending',
    'testSqlPreviousReturnsOlderRequestsNewestFirst',
    'testSqlNextReturnsNewerRequestsNewestFirst',
    'testSqlPreviousUsesDriverSafeAnchorPlaceholders',
    'testSqlNextUsesDriverSafeAnchorPlaceholders',
    'testRedisPreviousReturnsOlderRequestsNewestFirst',
    'testRedisNextReturnsNewerRequestsNewestFirst',
];

$failures = 0;

foreach ($tests as $test) {
    try {
        $test();
        echo "[PASS] {$test}\n";
    } catch (Throwable $e) {
        $failures++;
        echo "[FAIL] {$test}\n{$e->getMessage()}\n";
    }
}

if ($failures > 0) exit(1);

echo "All request storage ordering regression tests passed.\n";
