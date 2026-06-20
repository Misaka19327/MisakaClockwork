<?php namespace Clockwork\Support\Symfony;

use Clockwork\Clockwork;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\{JsonResponse, Request};

class ClockworkController extends AbstractController
{
    protected $clockwork;
    protected $support;

    public function __construct(Clockwork $clockwork, ClockworkSupport $support)
    {
        $this->clockwork = $clockwork;
        $this->support = $support;
    }

    public function authenticate(Request $request)
    {
        $this->ensureClockworkIsEnabled();

        $token = $this->clockwork->authenticator()->attempt($request->request->all());

        return new JsonResponse(['token' => $token], $token ? 200 : 403);
    }

    protected function ensureClockworkIsEnabled()
    {
        if (!$this->support->isEnabled()) throw $this->createNotFoundException();
    }

    public function getData(Request $request, $id = null, $direction = null, $count = null)
    {
        $this->ensureClockworkIsEnabled();

        return $this->support->getData($request, $id, $direction, $count);
    }

    public function getEventDetails(Request $request, $uuid)
    {
        $this->ensureClockworkIsEnabled();

        return $this->support->getEventDetailsByUuid($request, $uuid);
    }

    public function webIndex(Request $request)
    {
        $this->ensureClockworkIsEnabled();
        $this->ensureClockworkWebIsEnabled();

        return $this->support->getWebAsset('index.html');
    }

    protected function ensureClockworkWebIsEnabled()
    {
        if (!$this->support->isWebEnabled()) throw $this->createNotFoundException();
    }

    public function webAsset($path)
    {
        $this->ensureClockworkIsEnabled();
        $this->ensureClockworkWebIsEnabled();

        return $this->support->getWebAsset($path);
    }

    public function webRedirect(Request $request)
    {
        $this->ensureClockworkIsEnabled();
        $this->ensureClockworkWebIsEnabled();

        $path = $this->support->webPaths()[0];

        return $this->redirectToRoute("clockwork.webIndex.{$path}");
    }
}
