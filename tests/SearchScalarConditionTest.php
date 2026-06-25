<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Clockwork\Storage\Search;

function assertSameStrict($expected, $actual, $message)
{
    if ($expected !== $actual) {
        throw new RuntimeException($message . "\nExpected: " . var_export($expected, true) . "\nActual:   " . var_export($actual, true));
    }
}

// The request-list type filter sends `type=request` as a scalar query param. Search must coerce
// conditions to arrays — otherwise count() in isEmpty() (and the foreach in the matches* methods)
// blows up on PHP 7.2+ with "count(): Parameter must be an array or an object that implements
// Countable".
function testFromRequestCoercesScalarConditionsToArray()
{
    $s = Search::fromRequest(['type' => 'request', 'uri' => '/foo', 'status' => '500']);

    assertSameStrict(['request'], $s->type, 'scalar `type` must coerce to a single-element array');
    assertSameStrict(['/foo'], $s->uri, 'scalar `uri` must coerce');
    assertSameStrict(['500'], $s->status, 'scalar `status` must coerce');
}

function testIsEmptyHandlesScalarConditionWithoutThrowing()
{
    // This is the exact path that fatal'd in production: fromRequest(['type'=>'request']) -> isEmpty().
    $s = Search::fromRequest(['type' => 'request']);
    assertSameStrict(false, $s->isEmpty(), 'isEmpty() must be false when a condition is set');
    assertSameStrict(true, Search::fromRequest([])->isEmpty(), 'isEmpty() must be true with no conditions');
}

function testArrayConditionsArePreserved()
{
    $s = Search::fromRequest(['type' => ['command', 'queue-job'], 'status' => ['500', '503']]);
    assertSameStrict(['command', 'queue-job'], $s->type, 'array `type` must be preserved as-is');
    assertSameStrict(['500', '503'], $s->status, 'array `status` must be preserved as-is');
    assertSameStrict(false, $s->isEmpty(), 'isEmpty() must be false with array conditions set');
}

$tests = [
    'testFromRequestCoercesScalarConditionsToArray',
    'testIsEmptyHandlesScalarConditionWithoutThrowing',
    'testArrayConditionsArePreserved',
];
$failures = 0;
foreach ($tests as $test) {
    try { $test(); echo "[PASS] {$test}\n"; }
    catch (Throwable $e) { $failures++; echo "[FAIL] {$test}\n{$e->getMessage()}\n"; }
}
if ($failures > 0) exit(1);
echo "All search scalar-condition tests passed.\n";
