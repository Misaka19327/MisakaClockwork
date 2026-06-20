<?php namespace Clockwork\Support\Lumen;

use Clockwork\DataSource\LumenDataSource;
use Clockwork\Support\Laravel\ClockworkServiceProvider as LaravelServiceProvider;
use Illuminate\Support\Facades\Facade;

// Clockwork Lumen service provider
class ClockworkServiceProvider extends LaravelServiceProvider
{
    // Register Clockwork configuration
    public function registerMiddleware()
    {
        $this->app->middleware([ClockworkMiddleware::class]);
    }

    // Register Clockwork components

    public function registerRoutes()
    {
        $router = $this->app->router ?? $this->app;

        $router->get('/__clockwork/uuid/{uuid:[0-9a-fA-F-]{36}}/details', 'Clockwork\Support\Lumen\Controller@getEventDetails');
        $router->get('/__clockwork/{id:(?:[0-9-]+|latest)}/extended', 'Clockwork\Support\Lumen\Controller@getExtendedData');
        $router->get('/__clockwork/{id:(?:[0-9-]+|latest)}[/{direction:(?:next|previous)}[/{count:\d+}]]', 'Clockwork\Support\Lumen\Controller@getData');
        $router->put('/__clockwork/{id}', 'Clockwork\Support\Lumen\Controller@updateData');
        $router->post('/__clockwork/auth', 'Clockwork\Support\Lumen\Controller@authenticate');
    }

    // Register Clockwork data sources

    public function registerWebRoutes()
    {
        $router = $this->app->router ?? $this->app;

        $this->app['clockwork.support']->webPaths()->each(function ($path) use ($router) {
            $router->get("{$path}", 'Clockwork\Support\Lumen\Controller@webRedirect');
            $router->get("{$path}/app", 'Clockwork\Support\Lumen\Controller@webIndex');
            $router->get("{$path}/{path:.+}", 'Clockwork\Support\Lumen\Controller@webAsset');
        });
    }

    // Register Clockwork components aliases for type hinting

    protected function registerConfiguration()
    {
        $this->app->configure('clockwork');
        $this->mergeConfigFrom(__DIR__ . '/../Laravel/config/clockwork.php', 'clockwork');
    }

    // Register event listeners

    protected function registerClockwork()
    {
        parent::registerClockwork();

        $this->app->singleton('clockwork.support', function ($app) {
            return new ClockworkSupport($app);
        });

        if ($this->isRunningWithFacades() && !class_exists('Clockwork')) {
            class_alias(\Clockwork\Support\Laravel\Facade::class, 'Clockwork');
        }
    }

    // Register Clockwork middleware

    protected function isRunningWithFacades()
    {
        return Facade::getFacadeApplication() !== null;
    }

    // Register Clockwork REST api routes

    protected function registerDataSources()
    {
        parent::registerDataSources();

        $this->app->singleton('clockwork.lumen', function ($app) {
            return (new LumenDataSource(
                $app,
                $app['clockwork.support']->isFeatureEnabled('log'),
                $app['clockwork.support']->isFeatureEnabled('views'),
                $app['clockwork.support']->isFeatureEnabled('routes')
            ));
        });
    }

    // Register Clockwork app routes

    protected function registerAliases()
    {
        parent::registerAliases();

        $this->app->alias('clockwork.lumen', LumenDataSource::class);
    }

    // Check whether we are running with facades enabled

    protected function registerEventListeners()
    {
        $this->app['clockwork.support']->addDataSources()->listenToEvents();
    }
}
