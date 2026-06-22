---
name: clockwork-laravel-test-debug
description: Use when Codex needs to debug a Laravel test or local non-production environment that exposes this Clockwork fork. Prefer this skill when the app provides the agent-oriented Clockwork endpoints `/__clockwork/failures`, `/__clockwork/events/details/{id}`, and `/__clockwork/env`, and Codex needs to inspect recent failures, retrieve full event context by request id, or snapshot the Laravel debug environment before changing code.
---

# Clockwork Laravel Test Debug

Use the Clockwork Laravel endpoints as the first read path for test-environment triage.

## Workflow

1. Fetch `GET /__clockwork/failures` first.
2. Pick the most relevant failure by `type`, `status`, `title`, `rootMessage`, and `topAppFrame`.
3. Fetch `GET /__clockwork/events/details/{id}` for the chosen failure, using its `id` from the failures list.
4. Read `summary`, `primaryError`, and `topAppFrames` before scanning `raw`.
5. Fetch `GET /__clockwork/env` when the failure may depend on environment, storage driver, queue mode, or collection
   settings.

## Endpoint Contract

Use `GET /__clockwork/failures` for a recent failure list.

Supported query parameters:

- `limit`
- `type`
- `status`
- `since`
- `search`

Use `GET /__clockwork/events/details/{id}` for the full debugging payload for one event.

Prioritize these fields:

- `summary`
- `primaryError`
- `topAppFrames`
- `entrypoint`
- `response`
- `errors`
- `externalAccess`
- `context`

Use `GET /__clockwork/env` for the Laravel test-environment snapshot.

Prioritize these fields:

- `appEnv`
- `appDebug`
- `phpVersion`
- `laravelVersion`
- `storageDriver`
- `databaseDefault`
- `cacheDefault`
- `queueDefault`
- `clockwork`

## Operating Rules

Use `/__clockwork/events/details/{id}` (the request `id` from the failures list) for new agent logic. The legacy `/uuid/{uuid}/details` path has been removed.

Treat these endpoints as read-only evidence sources. Do not infer missing business state from them alone.

Use `X-Clockwork-Auth` when authentication is enabled.

When a failure has no obvious stack frame, inspect `context.log`, `externalAccess.http`, `externalAccess.database`, and
`response` before reading `raw`.

When multiple failures look similar, group them by `summary.title`, `summary.rootMessage`, and the first `topAppFrame`.
