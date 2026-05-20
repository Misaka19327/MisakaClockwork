<?php namespace Clockwork\Support\Laravel\Eloquent;

// Shared static storage for captured query results, used by all Capturing*Connection classes
class QueryResultCapture
{
	protected static $results = [];
	protected static $enabled = false;
	protected static $maxRows = 25;

	public static function enable($maxRows = 25)
	{
		static::$enabled = true;
		static::$maxRows = $maxRows;
	}

	public static function disable()
	{
		static::$enabled = false;
		static::$results = [];
	}

	public static function isEnabled()
	{
		return static::$enabled;
	}

	public static function maxRows()
	{
		return static::$maxRows;
	}

	public static function store($connectionName, $sql, $bindings, $result)
	{
		$key = md5($sql . json_encode($bindings));

		if (! isset(static::$results[$connectionName])) {
			static::$results[$connectionName] = [];
		}

		static::$results[$connectionName][$key] = $result;
	}

	public static function consume($connectionName, $sql, $bindings)
	{
		$key = md5($sql . json_encode($bindings));

		if (isset(static::$results[$connectionName][$key])) {
			$result = static::$results[$connectionName][$key];
			unset(static::$results[$connectionName][$key]);
			return $result;
		}

		return null;
	}

	public static function clear()
	{
		static::$results = [];
	}
}
