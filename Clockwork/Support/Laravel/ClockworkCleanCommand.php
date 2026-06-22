<?php namespace Clockwork\Support\Laravel;

use Illuminate\Console\Command;
use Symfony\Component\Console\Input\InputOption;

// Console command for cleaning old requests metadata
class ClockworkCleanCommand extends Command
{
    // Command name
    protected $name = 'clockwork:clean';

    // Command description
    protected $description = 'Cleans Clockwork request metadata';

    // Command aliases
    protected $aliases = [
        'clockwork:clear',
    ];

    // Command options
    public function getOptions()
    {
        return [
            ['all', 'a', InputOption::VALUE_NONE, 'cleans all data'],
            ['hours', null, InputOption::VALUE_REQUIRED, 'cleans data older than the specified number of hours']
        ];
    }

    // Execute the console command

    public function fire()
    {
        return $this->handle();
    }

    // Compatibility for the old Laravel versions

    public function handle()
    {
        if ($this->option('all')) {
            // --all force-truncates both tables regardless of retention
            $this->laravel['clockwork.support']->makeStorage()->cleanup(true);
        } else {
            // --hours (or no arg) narrows the retention window, then runs a normal time-based
            // cleanup. It must NOT force-truncate.
            if (($hours = $this->option('hours')) !== null) {
                $this->laravel['config']->set('clockwork.storage_retention_hours', (float) $hours);
            }

            $this->laravel['clockwork.support']->makeStorage()->cleanup(false);
        }

        $this->info('Metadata cleaned successfully.');
    }
}
