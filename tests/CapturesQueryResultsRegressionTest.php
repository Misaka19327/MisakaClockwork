<?php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/Support/Laravel/Eloquent/CapturesQueryResultsHarness.php';

use Clockwork\Support\Laravel\Eloquent\QueryResultCapture;
use Clockwork\Tests\Support\Laravel\Eloquent\CapturesQueryResultsHarness;

function assertSameStrict($expected, $actual, $message)
{
    if ($expected !== $actual) {
        throw new RuntimeException(
            $message . "\nExpected: " . var_export($expected, true) . "\nActual:   " . var_export($actual, true)
        );
    }
}

function assertNullStrict($actual, $message)
{
    assertSameStrict(null, $actual, $message);
}

function testConsumesCapturedResultBeforeParentRunReturns()
{
    QueryResultCapture::enable(25);
    QueryResultCapture::clear();

    $connection = CapturesQueryResultsHarness::forModernCallback();
    $rows = [['user_id' => 245, 'name' => 'Misaka']];
    $result = $connection->executeSelect('select * from `user` where `user_id` = ? limit 1', [245], $rows);

    assertSameStrict($rows, $result, 'Wrapped callback should still return the original query result.');
    assertSameStrict(
        ['result' => $rows, 'truncated' => false, 'totalRows' => 1],
        $connection->capturedAtEvent(),
        'Query result should already be available when the simulated QueryExecuted event consumes it.'
    );
    assertNullStrict(
        QueryResultCapture::consume($connection->getName(), 'select * from `user` where `user_id` = ? limit 1', [245]),
        'Event-time consume should drain the buffer; nothing should be left afterwards.'
    );
}

function testForwardsModernCallbackArgumentsVerbatim()
{
    QueryResultCapture::enable(25);
    QueryResultCapture::clear();

    $connection = CapturesQueryResultsHarness::forModernCallback();
    $connection->executeSelect('select 1', [245], [['ok' => true]]);

    assertSameStrict(
        ['select 1', [245]],
        $connection->callbackArgs(),
        'Laravel 5.2+ callback arguments should keep the original two-argument shape.'
    );
}

function testForwardsLegacyCallbackArgumentsVerbatim()
{
    QueryResultCapture::enable(25);
    QueryResultCapture::clear();

    $connection = CapturesQueryResultsHarness::forLegacyCallback();
    $connection->executeSelect('select 1', [245], [['ok' => true]]);

    $args = $connection->callbackArgs();
    assertSameStrict(3, count($args), 'Laravel 5.0/5.1 callback should still receive three arguments.');
    assertSameStrict($connection, $args[0], 'Legacy callback should still receive the connection instance as arg0.');
    assertSameStrict('select 1', $args[1], 'Legacy callback should still receive SQL as arg1.');
    assertSameStrict([245], $args[2], 'Legacy callback should still receive bindings as arg2.');
}

$tests = [
    'testConsumesCapturedResultBeforeParentRunReturns',
    'testForwardsModernCallbackArgumentsVerbatim',
    'testForwardsLegacyCallbackArgumentsVerbatim',
];

$failures = 0;

foreach ($tests as $test) {
    QueryResultCapture::disable();

    try {
        $test();
        echo "[PASS] {$test}\n";
    } catch (Throwable $e) {
        $failures++;
        echo "[FAIL] {$test}\n{$e->getMessage()}\n";
    }
}

if ($failures > 0) {
    exit(1);
}

echo "All query result capture regression tests passed.\n";
