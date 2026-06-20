<?php namespace Clockwork\Storage;

use Clockwork\Request\Request;

abstract class Storage implements StorageInterface
{
    // Return a single request by uuid
    public function findByUuid($uuid)
    {
        foreach ($this->all(new Search) as $request) {
            if ($request->uuid == $uuid) return $request;
        }
    }

    // Update existing request
    public function update(Request $request)
    {
    }
}
