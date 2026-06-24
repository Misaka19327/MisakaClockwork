<?php namespace Clockwork\Support\Laravel\Eloquent;

// Trait to capture query results by overriding Connection::run()
trait CapturesQueryResults
{
    protected function run($query, $bindings, \Closure $callback)
    {
        // We must store() the result BEFORE parent::run() returns: Laravel's Connection::run()
        // dispatches the QueryExecuted event (via logQuery()) before returning, and Clockwork's
        // listener consumes the captured result from that event. Storing only after parent::run()
        // would make consume() always run against an empty buffer ("Query result was not captured"),
        // so we wrap the callback and store right after the query executes, still inside
        // runQueryCallback() and before logQuery() fires.
        //
        // The capture key uses run()'s own $query/$bindings, which are the authoritative SQL and
        // bindings across every Laravel version (and the exact values logQuery()/the event use).
        // The original callback is invoked with its arguments forwarded verbatim through a variadic:
        // Laravel <5.2 calls it as ($connection, $query, $bindings), while 5.2+ calls it as
        // ($query, $bindings) -- pinning the signature to either one would break the other.
        $captureQuery = $query;
        $captureBindings = $bindings;

        $wrapped = function (...$args) use ($callback, $captureQuery, $captureBindings) {
            $result = $callback(...$args);

            if (QueryResultCapture::isEnabled()) {
                $this->captureResult($captureQuery, $captureBindings, $result);
            }

            return $result;
        };

        return parent::run($query, $bindings, $wrapped);
    }

    protected function captureResult($sql, $bindings, $result)
    {
        QueryResultCapture::store($this->getName(), $sql, $bindings, $this->normalizeResult($result));
    }

    protected function normalizeResult($result)
    {
        $maxRows = QueryResultCapture::maxRows();

        if (is_array($result)) {
            $totalRows = count($result);
            return [
                'result' => $maxRows ? array_slice($result, 0, $maxRows) : $result,
                'truncated' => $maxRows && $totalRows > $maxRows,
                'totalRows' => $totalRows,
            ];
        }

        return [
            'result' => $result,
            'truncated' => false,
            'totalRows' => null,
        ];
    }
}
