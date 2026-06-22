<?php namespace Clockwork\DataSource;

use Clockwork\Helpers\{Serializer, StackTrace};
use Clockwork\Request\Request;
use Illuminate\Queue\Queue;

// Data source for Laravel queue component, provides dispatched queue jobs
class LaravelQueueDataSource extends DataSource
{
    // Queue instance
    protected $queue;

    // Dispatched queue jobs
    protected $jobs = [];

    // Clockwork ID of the current request
    protected $currentRequestId;

    // Create a new data source instance, takes a queue as an argument
    public function __construct(Queue $queue)
    {
        $this->queue = $queue;
    }

    // Adds dispatched queue jobs to the request
    public function resolve(Request $request)
    {
        $request->queueJobs = array_merge($request->queueJobs, $this->getJobs());

        return $request;
    }

    // Reset the data source to an empty state, clearing any collected data

    protected function getJobs()
    {
        return array_map(function ($query) {
            return array_merge($query, [
                'data' => isset($query['data']) ? (new Serializer)->normalize($query['data']) : null
            ]);
        }, $this->jobs);
    }

    // Listen to the queue events

    public function reset()
    {
        $this->jobs = [];
    }

    // Set Clockwork ID of the current request

    public function listenToEvents()
    {
        $this->queue->createPayloadUsing(function ($connection, $queue, $payload) {
            $request = new Request;

            $this->registerJob([
                'id' => $request->id,
                'connection' => $connection,
                'queue' => $queue,
                'name' => $payload['displayName'],
                'data' => $payload['data']['command'] ?? null,
                'maxTries' => $payload['maxTries'],
                'timeout' => $payload['timeout'],
                'time' => microtime(true)
            ]);

            return [
                'clockwork_id' => $request->id,
                'clockwork_parent_id' => $this->currentRequestId,
            ];
        });
    }

    // Set Clockwork UUID of the current request

    protected function registerJob(array $job)
    {
        $trace = StackTrace::get()->resolveViewName();

        $job = array_merge($job, [
            'trace' => (new Serializer)->trace($trace)
        ]);

        if ($this->passesFilters([$job])) {
            $this->jobs[] = $job;
        }
    }

    // Collect a dispatched queue job

    public function setCurrentRequestId($requestId)
    {
        $this->currentRequestId = $requestId;
        return $this;
    }
}
