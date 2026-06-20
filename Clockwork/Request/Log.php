<?php namespace Clockwork\Request;

use Clockwork\Helpers\{Serializer, StackTrace};

// Data structure representing a log with timestamped messages
class Log
{
    // Array of logged messages
    public $messages = [];

    // Create a new log, optionally with existing messages
    public function __construct($messages = [])
    {
        $this->messages = $messages;
    }

    // Log a new message, with a level and context, context can be used to override serializer defaults,
    // $context['trace'] = true can be used to force collecting a stack trace

    public function emergency($message, array $context = [])
    {
        $this->log(LogLevel::EMERGENCY, $message, $context);
    }

    public function log($level = LogLevel::INFO, $message = null, array $context = [])
    {
        $trace = $this->hasTrace($context) ? $context['trace'] : StackTrace::get()->resolveViewName();

        $this->messages[] = [
            'message' => (new Serializer($context))->normalize($message),
            'exception' => $this->formatException($context),
            'context' => $this->formatContext($context),
            'level' => $level,
            'time' => microtime(true),
            'trace' => (new Serializer(!empty($context['trace']) ? ['traces' => true] : []))->trace($trace)
        ];
    }

    protected function hasTrace($context)
    {
        return !empty($context['trace']) && $context['trace'] instanceof StackTrace && empty($context['raw']);
    }

    protected function formatException($context)
    {
        if ($this->hasException($context)) {
            return (new Serializer)->exception($context['exception']);
        }
    }

    protected function hasException($context)
    {
        return !empty($context['exception'])
            && ($context['exception'] instanceof \Throwable || $context['exception'] instanceof \Exception)
            && empty($context['raw']);
    }

    protected function formatContext($context)
    {
        if ($this->hasException($context)) unset($context['exception']);
        if ($this->hasTrace($context)) unset($context['trace']);

        return (new Serializer)->normalize($context);
    }

    public function alert($message, array $context = [])
    {
        $this->log(LogLevel::ALERT, $message, $context);
    }

    public function critical($message, array $context = [])
    {
        $this->log(LogLevel::CRITICAL, $message, $context);
    }

    public function error($message, array $context = [])
    {
        $this->log(LogLevel::ERROR, $message, $context);
    }

    // Merge another log instance into the current log

    public function warning($message, array $context = [])
    {
        $this->log(LogLevel::WARNING, $message, $context);
    }

    // Sort the log messages by timestamp

    public function notice($message, array $context = [])
    {
        $this->log(LogLevel::NOTICE, $message, $context);
    }

    // Get all messages as an array

    public function info($message, array $context = [])
    {
        $this->log(LogLevel::INFO, $message, $context);
    }

    // Format message context, removes exception and trace if we are serializing them

    public function debug($message, array $context = [])
    {
        $this->log(LogLevel::DEBUG, $message, $context);
    }

    // Format exception if present in the context

    public function merge(Log $log)
    {
        $this->messages = array_merge($this->messages, $log->messages);

        return $this;
    }

    // Check if context has serializable trace

    public function sort()
    {
        usort($this->messages, function ($a, $b) {
            return $a['time'] * 1000 - $b['time'] * 1000;
        });
    }

    // Check if context has serializable exception

    public function toArray()
    {
        return $this->messages;
    }
}
