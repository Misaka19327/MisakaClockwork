<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Clockwork\Request\Request;
use Clockwork\Storage\SqlStorage;

function assertSameStrict($expected, $actual, $message)
{
    if ($expected !== $actual) {
        throw new RuntimeException($message . "\nExpected: " . var_export($expected, true) . "\nActual:   " . var_export($actual, true));
    }
}

function makeSqlStorage()
{
    $path = sys_get_temp_dir() . '/clockwork-ops-offset-' . uniqid('', true) . '.sqlite';
    $pdo = new PDO('sqlite:' . $path);
    return [new SqlStorage($pdo, 'clockwork_test', null, null, 'clockwork_test_operations', 168, false), $path];
}

// 6 个请求,每个带 1 条 database 查询;time 递增 → 入库后 12 条 db op,time 倒序。
function makeReq($id, $time)
{
    return new Request([
        'id' => $id, 'time' => $time, 'method' => 'GET', 'uri' => "/{$id}",
        'responseStatus' => 200, 'responseDuration' => 5.0,
        'databaseQueries' => [
            ['query' => "select * from t where id = {$id}", 'duration' => 1.0, 'connection' => 'mysql', 'file' => 'x.php', 'line' => 1],
        ],
    ]);
}

function testOperationsOffsetSkipsFirstPage()
{
    [$storage, $path] = makeSqlStorage();
    try {
        foreach (['r1' => 100.0, 'r2' => 200.0, 'r3' => 300.0] as $id => $t) $storage->store(makeReq($id, $t));

        $page0 = $storage->operations('database', null, 1, 0);   // 最新 1 条(r3 的)
        $page1 = $storage->operations('database', null, 1, 1);   // 偏移 1(r2 的)
        $page2 = $storage->operations('database', null, 1, 2);   // 偏移 2(r1 的)

        assertSameStrict('r3', $page0[0]['requestId'], 'offset 0 should return newest request op.');
        assertSameStrict('r2', $page1[0]['requestId'], 'offset 1 should skip the newest.');
        assertSameStrict('r1', $page2[0]['requestId'], 'offset 2 should return the oldest.');
    } finally {
        $storage->cleanup(true);
        if (is_file($path)) @unlink($path);
    }
}

function testOperationsOffsetZeroEqualsDefault()
{
    [$storage, $path] = makeSqlStorage();
    try {
        foreach (['r1' => 100.0, 'r2' => 200.0] as $id => $t) $storage->store(makeReq($id, $t));
        assertSameStrict(
            array_map(fn($o) => $o['requestId'], $storage->operations('database', null, 10)),
            array_map(fn($o) => $o['requestId'], $storage->operations('database', null, 10, 0)),
            'offset 0 must equal the un-offset result.'
        );
    } finally {
        $storage->cleanup(true);
        if (is_file($path)) @unlink($path);
    }
}

$tests = ['testOperationsOffsetSkipsFirstPage', 'testOperationsOffsetZeroEqualsDefault'];
$failures = 0;
foreach ($tests as $test) {
    try { $test(); echo "[PASS] {$test}\n"; }
    catch (Throwable $e) { $failures++; echo "[FAIL] {$test}\n{$e->getMessage()}\n"; }
}
if ($failures > 0) exit(1);
echo "All operations offset tests passed.\n";
