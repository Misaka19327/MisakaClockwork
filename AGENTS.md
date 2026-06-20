# Project Notes

- Frontend v2 lives in `Clockwork/Web/v2`.
- In this workspace, the default PowerShell shell does not expose `npm`.
- Build v2 from `Clockwork/Web/v2` with `cmd /c npm run build`.
- If the sandbox blocks the build, rerun it with escalated permissions.
- The build output is published to `Clockwork/Web/public/v2`.
- After frontend changes, rebuild before committing so the published assets stay in sync.
- Keep `Clockwork/Web/public/v2` in source control when the change affects the shipped UI.
- After committing and pushing, update the consumer project inside the `php74` Docker container at
  `/www/company/crm/boss_laravel` so it picks up the latest package changes.
- Use the container workspace command sequence for that project, e.g.
  `docker exec php74 sh -lc 'cd /www/company/crm/boss_laravel && composer update itsgoingd/clockwork --ignore-platform-reqs'`.
