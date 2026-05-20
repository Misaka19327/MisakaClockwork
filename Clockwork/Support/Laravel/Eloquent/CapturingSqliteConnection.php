<?php namespace Clockwork\Support\Laravel\Eloquent;

use Illuminate\Database\SQLiteConnection;

class CapturingSqliteConnection extends SQLiteConnection
{
	use CapturesQueryResults;
}
