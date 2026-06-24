<?php

namespace Clockwork\Tests\Support\Laravel\Eloquent;

use Clockwork\Support\Laravel\Eloquent\CapturesQueryResults;
use Clockwork\Support\Laravel\Eloquent\QueryResultCapture;

class CapturesQueryResultsHarnessBase
{
    protected $callbackStyle;
    protected $capturedAtEvent;
    protected $callbackArgs = [];

    public function __construct($callbackStyle)
    {
        $this->callbackStyle = $callbackStyle;
    }

    protected function run($query, $bindings, \Closure $callback)
    {
        if ($this->callbackStyle === 'legacy') {
            $result = $callback($this, $query, $bindings);
        } else {
            $result = $callback($query, $bindings);
        }

        $this->capturedAtEvent = QueryResultCapture::consume($this->getName(), $query, $bindings);

        return $result;
    }
}

class CapturesQueryResultsHarness extends CapturesQueryResultsHarnessBase
{
    use CapturesQueryResults;

    public static function forLegacyCallback()
    {
        return new static('legacy');
    }

    public static function forModernCallback()
    {
        return new static('modern');
    }

    public function executeSelect($query, array $bindings, array $rows)
    {
        return $this->run($query, $bindings, function (...$args) use ($rows) {
            $this->callbackArgs = $args;

            return $rows;
        });
    }

    public function callbackArgs()
    {
        return $this->callbackArgs;
    }

    public function capturedAtEvent()
    {
        return $this->capturedAtEvent;
    }

    public function getName()
    {
        return 'harness-mysql';
    }
}
