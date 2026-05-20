<?php namespace Clockwork\Support\Laravel\Eloquent;

use Illuminate\Database\PostgresConnection;

class CapturingPostgresConnection extends PostgresConnection
{
	use CapturesQueryResults;
}
