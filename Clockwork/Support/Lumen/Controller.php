<?php namespace Clockwork\Support\Lumen;

use Clockwork\Clockwork;
use Illuminate\Http\{JsonResponse, RedirectResponse, Request};
use Laravel\Lumen\Routing\Controller as LumenController;
use Laravel\Telescope\Telescope;

// Clockwork api and app controller
class Controller extends LumenController
{
    // Clockwork and support instances
    public $clockwork;
    public $clockworkSupport;

    public function __construct(Clockwork $clockwork, ClockworkSupport $clockworkSupport)
    {
        $this->clockwork = $clockwork;
        $this->clockworkSupport = $clockworkSupport;
    }

    // Authantication endpoint
    public function authenticate(Request $request)
    {
        $this->ensureClockworkIsEnabled();

        $token = $this->clockwork->authenticator()->attempt(
            $request->only(['username', 'password'])
        );

        return new JsonResponse(['token' => $token], $token ? 200 : 403);
    }

    // Metadata retrieving endpoint

    protected function ensureClockworkIsEnabled()
    {
        if (class_exists(Telescope::class)) Telescope::stopRecording();

        if (!$this->clockworkSupport->isEnabled()) abort(404);
    }

    // Extended metadata retrieving endpoint

    public function getData(Request $request, $id = null, $direction = null, $count = null)
    {
        $this->ensureClockworkIsEnabled();

        return $this->clockworkSupport->getData(
            $id, $direction, $count, $request->only(['only', 'except'])
        );
    }

    // Event details retrieving endpoint

    public function getExtendedData(Request $request, $id = null)
    {
        $this->ensureClockworkIsEnabled();

        return $this->clockworkSupport->getExtendedData(
            $id, $request->only(['only', 'except'])
        );
    }

    // Metadata updating endpoint

    public function getEventDetails($uuid)
    {
        $this->ensureClockworkIsEnabled();

        return $this->clockworkSupport->getEventDetailsByUuid($uuid);
    }

    // App index

    public function updateData(Request $request, $id = null)
    {
        $this->ensureClockworkIsEnabled();

        return $this->clockworkSupport->updateData($id, $request->json()->all());
    }

    // App assets serving

    public function webIndex(Request $request)
    {
        $this->ensureClockworkIsEnabled();

        return $this->clockworkSupport->getWebAsset('index.html');
    }

    // App redirect (/clockwork -> /clockwork/app)

    public function webAsset($path)
    {
        $this->ensureClockworkIsEnabled();

        return $this->clockworkSupport->getWebAsset($path);
    }

    // Ensure Clockwork is still enabled at this point and stop Telescope recording if present

    public function webRedirect(Request $request)
    {
        $this->ensureClockworkIsEnabled();

        return new RedirectResponse('/' . $request->path() . '/app');
    }
}
