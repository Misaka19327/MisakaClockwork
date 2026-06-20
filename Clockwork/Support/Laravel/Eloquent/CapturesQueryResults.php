<?php namespace Clockwork\Support\Laravel\Eloquent;

// Trait to capture query results by overriding Connection::run()
trait CapturesQueryResults
{
    protected function run($query, $bindings, \Closure $callback)
    {
        $result = parent::run($query, $bindings, $callback);

        if (QueryResultCapture::isEnabled()) {
            $this->captureResult($query, $bindings, $result);
        }

        return $result;
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
