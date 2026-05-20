<?php namespace Clockwork\Support\Laravel\Eloquent;

use Illuminate\Database\SqlServerConnection;

class CapturingSqlServerConnection extends SqlServerConnection
{
	use CapturesQueryResults;
}
