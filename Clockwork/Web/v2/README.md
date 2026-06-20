# Clockwork Web — v2 (React)

The Clockwork debug-panel UI, rewritten in React from the Open Design prototype. This
directory (`Clockwork/Web/v2`) **is** the v2 app — it replaces the previous TypeScript
v2 source that lived here.

## Integration with Clockwork

- **Source:** `Clockwork/Web/v2/` (this folder)
- **Build output:** `Clockwork/Web/public/v2/` (set via `build.outDir` in `vite.config.js`)
- **Serving:** `Clockwork/Web/Web.php` serves everything under `Clockwork/Web/public/`, so
  the built app is reachable at the `/v2/` sub-path. Assets are emitted with `base: './'`
  (relative URLs) so the app works regardless of the mount path.
- **Routing:** `HashRouter` — the PHP static serving has no SPA fallback and the app runs
  at a sub-path, so hash-based routing needs no server support (deep links like
  `/v2/#/operations?category=cache` work directly).

## Stack

Vite + React 18 (JSX) + React Router v6 (HashRouter) + GSAP. All visuals, layout,
interaction, mock data, light/dark theming, zh/en i18n and GSAP animations are ported 1:1
from the prototype HTML/CSS/JS.

## Develop / build

```bash
cd Clockwork/Web/v2
npm install        # first time
npm run dev        # dev server with HMR → http://localhost:5173
npm run build      # production build → ../public/v2  (what Clockwork serves)
npm run preview    # preview the built app → http://localhost:4173
```

> `vite.config.js` enables `server.host` + `allowedHosts` so the dev/preview server is
> reachable from other network interfaces (e.g. containerized browsers).

Demo access key: `clockwork-admin-2024`.

## Routes

| Hash route | Page |
|------------|------|
| `#/login` | Login (access-key) |
| `#/` | Overview (status + KPI + recent requests) |
| `#/requests` | Request list |
| `#/requests/:id` | Request detail (9 tabs incl. timeline Gantt) |
| `#/operations?category=…` | Operations center (database/cache/redis/log/events/views/notifications) |

## Project layout

```
v2/
  index.html              # Vite entry
  vite.config.js          # base './', build.outDir '../public/v2'
  package.json
  src/
    main.jsx              # React root + HashRouter + AppProvider
    App.jsx               # routes + RequireAuth guard
    index.css             # tokens, dark mode, shared shell/sidebar/badges
    context/AppContext.jsx# theme + lang + t()
    i18n/en.js            # English dictionary (zh is identity)
    lib/{auth,format,motion}.js
    data/{overview,requests,operations}.js   # ported mock data
    components/{BrandMark,UtilToggles,Sidebar,Icon,Badges,ExpandableCode,RequireAuth}.jsx
    pages/{Login,Overview,RequestList,RequestDetail,Operations}.jsx + *.css
```

## Notes on intentional deviations from the prototype

1. **Login guard bug** — prototype only persisted auth when "remember" was ticked, so a
   non-remember login was lost on reload. Fixed: session auth always set on success;
   "remember" only adds `localStorage` persistence. See `src/lib/auth.js`.
2. **Operations "来源" column** — prototype keyed it `source` but data field is `file`, so
   it was blank. Fixed to show `file` (e.g. `app/Http/Controllers/UserController.php:42`).
3. **`queue-job` rows** were uncolored in the request list (class/CSS mismatch). Fixed.
4. **`t()` variable shadowing** in the prototype's operations detail — avoided here.

## Restoring the previous v2

The previous TypeScript v2 source and built output were removed from the working tree
during this replacement but are still available from git — restore with:

```bash
git checkout HEAD -- Clockwork/Web/v2 Clockwork/Web/public/v2
```
