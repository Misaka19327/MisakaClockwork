<?php namespace Clockwork\Support\Laravel\Eloquent;

use Illuminate\Database\MySqlConnection;

class CapturingMySqlConnection extends MySqlConnection
{
    use CapturesQueryResults;
}
