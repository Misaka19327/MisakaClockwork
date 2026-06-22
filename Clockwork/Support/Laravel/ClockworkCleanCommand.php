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
            ['hours', null, InputOption::VALUE_REQUIRED, 'cleans data older than the specified number of hours'],
            ['expiration', 'e', InputOption::VALUE_REQUIRED, 'deprecated alias for --hours, value in minutes']
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
            $this->laravel['config']->set('clockwork.storage_retention_hours', 0);
        } elseif (($hours = $this->option('hours')) !== null) {
            $this->laravel['config']->set('clockwork.storage_retention_hours', (float) $hours);
        } elseif ($expiration = $this->option('expiration')) {
            // deprecated minutes-based alias, convert up to whole hours
            $this->laravel['config']->set('clockwork.storage_retention_hours', ceil(((float) $expiration) / 60));
        }

        $this->laravel['clockwork.support']->makeStorage()->cleanup(true);

        $this->info('Metadata cleaned successfully.');
    }
}
