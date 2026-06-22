<?php namespace Clockwork\Support\Laravel;

use Clockwork\Clockwork;
use Illuminate\Http\{JsonResponse, RedirectResponse, Request};
use Illuminate\Routing\Controller;
use Laravel\Telescope\Telescope;

// Clockwork api and app controller
class ClockworkController extends Controller
{
    // Authantication endpoint
    public function authenticate(Clockwork $clockwork, ClockworkSupport $clockworkSupport, Request $request)
    {
        $this->ensureClockworkIsEnabled($clockworkSupport);

        $token = $clockwork->authenticator()->attempt(
            $request->only(['username', 'password'])
        );

        return new JsonResponse(['token' => $token], $token ? 200 : 403);
    }

    // Metadata retrieving endpoint

    protected function ensureClockworkIsEnabled(ClockworkSupport $clockworkSupport)
    {
        if (class_exists(Telescope::class)) Telescope::stopRecording();

        if (!$clockworkSupport->isEnabled()) abort(404);
    }

    // Extended metadata retrieving endpoint

    public function getData(ClockworkSupport $clockworkSupport, Request $request, $id = null, $direction = null, $count = null)
    {
        $this->ensureClockworkIsEnabled($clockworkSupport);

        return $clockworkSupport->getData(
            $id, $direction, $count, $request->only(['only', 'except'])
        );
    }

    // Event details retrieving endpoint

    public function getExtendedData(ClockworkSupport $clockworkSupport, Request $request, $id = null)
    {
        $this->ensureClockworkIsEnabled($clockworkSupport);

        return $clockworkSupport->getExtendedData(
            $id, $request->only(['only', 'except'])
        );
    }

    // Failures list endpoint

    public function getEventDetailsById(ClockworkSupport $clockworkSupport, $id)
    {
        $this->ensureClockworkIsEnabled($clockworkSupport);

        return $clockworkSupport->getEventDetailsById($id);
    }

    // Environment snapshot endpoint

    public function getFailures(ClockworkSupport $clockworkSupport, Request $request)
    {
        $this->ensureClockworkIsEnabled($clockworkSupport);

        return $clockworkSupport->getFailures($request->all());
    }

    // Overview KPIs (cross-request aggregation)

    public function getStats(ClockworkSupport $clockworkSupport, Request $request)
    {
        $this->ensureClockworkIsEnabled($clockworkSupport);

        return $clockworkSupport->getStats($request->all());
    }

    // Operations center (per-category cross-request aggregation)

    public function getOperations(ClockworkSupport $clockworkSupport, Request $request, $category)
    {
        $this->ensureClockworkIsEnabled($clockworkSupport);

        return $clockworkSupport->getOperations($category, $request->all());
    }

    // Metadata updating endpoint

    public function getEnv(ClockworkSupport $clockworkSupport)
    {
        $this->ensureClockworkIsEnabled($clockworkSupport);

        return $clockworkSupport->getEnvironmentSnapshot();
    }

    // App index

    public function updateData(ClockworkSupport $clockworkSupport, Request $request, $id = null)
    {
        $this->ensureClockworkIsEnabled($clockworkSupport);

        return $clockworkSupport->updateData($id, $request->json()->all());
    }

    // App assets serving

    public function webIndex(ClockworkSupport $clockworkSupport)
    {
        $this->ensureClockworkIsEnabled($clockworkSupport);

        return $clockworkSupport->getWebAsset('index.html');
    }

    // App redirect (/clockwork -> /clockwork/app)

    public function webAsset(ClockworkSupport $clockworkSupport, $path)
    {
        $this->ensureClockworkIsEnabled($clockworkSupport);

        return $clockworkSupport->getWebAsset($path);
    }

    // V2 app index

    public function webRedirect(ClockworkSupport $clockworkSupport, Request $request)
    {
        $this->ensureClockworkIsEnabled($clockworkSupport);

        return new RedirectResponse('/' . $request->path() . '/app');
    }

    // V2 app assets serving

    public function webV2Index(ClockworkSupport $clockworkSupport)
    {
        $this->ensureClockworkIsEnabled($clockworkSupport);

        return $clockworkSupport->getWebAsset('v2/index.html');
    }

    // Ensure Clockwork is still enabled at this point and stop Telescope recording if present

    public function webV2Asset(ClockworkSupport $clockworkSupport, $path)
    {
        $this->ensureClockworkIsEnabled($clockworkSupport);

        return $clockworkSupport->getWebAsset("v2/{$path}");
    }
}
