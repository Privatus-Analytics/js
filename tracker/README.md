# @privatus-analytics/tracker

> **Not published yet.** Build and install `@privatus-analytics/tracker` from this folder until the first release.
> The `@privatus` scope on npm belongs to another organisation, so `@privatus/...` packages there are not ours.

A typed, SSR-safe loader for the [Privatus Analytics](https://privatusanalytics.com) tracker (`pa.js`). Privatus Analytics is cookieless analytics: no cookies, no localStorage or sessionStorage, no fingerprinting and no device IDs. This package keeps that promise and adds no storage of its own.

```sh
npm install @privatus-analytics/tracker
```

## Usage

```ts
import { init, track, pageview, props, optOut } from '@privatus-analytics/tracker'

init({ site: 'pa_XXXX' })           // injects <script src=".../js/pa.js" data-site="pa_XXXX" defer>

track('signup', { plan: 'pro' })    // safe before pa.js loads: calls are queued and replayed
track('purchase', { revenue: 49.99, currency: 'USD' })
props({ theme: 'dark' })            // sent with every later hit on this page load
pageview()                          // manual pageview (with `manual: true`)
await trackAsync('outbound', { to: 'docs' }, 800) // resolves once sent, or after the timeout
optOut()                            // user-initiated opt-out (pa.js stores this one flag)
```

Calls made before `pa.js` loads are pushed to `window.privatus.q` as `[method, args]`. `pa.js` replays them when it starts. `init()` is idempotent: calling it again, or calling it after a server-rendered tag, does not add a second script.

Every function is a no-op when there is no `window`, so it is safe to import in SSR code.

## Options → script attributes

| Option | Attribute | Notes |
|---|---|---|
| `site` (required) | `data-site` | Site ID, e.g. `pa_AbC123` |
| `api` | `data-api` | Origin for `/api/event` and modules. Only needed when you host a copy of `pa.js` yourself |
| `src` | `src` | Defaults to `{api}/js/pa.js`, or to `https://privatusanalytics.com/js/pa.js` when `api` is not set |
| `spa` | `data-spa` | `auto` (default), `history`, `hash`, `off` |
| `manual` | `data-manual` | Turn off the automatic pageview |
| `modules` | `data-modules` | e.g. `['engage', 'vitals']`. Setting this replaces the default `engage`, so list it too if you want to keep it |
| `domains` | `data-domains` | Only track on these hostnames |
| `exclude` | `data-exclude` | Path globs, e.g. `['/admin/*']` |
| `mask` | `data-mask` | `{ '/users/*': '/users/:id' }` |
| `params` | `data-params` | Query params to keep in addition to UTM/ref params |
| `canonical` | `data-canonical` | Report the canonical URL |
| `hash` | `data-hash` | Keep `#fragment`s |
| `props` | `data-props` | Name of a global function that returns props for every hit |
| `namespace` | `data-namespace` | Global name (default `privatus`) |
| `debug` | `data-debug` | Log hits to the console instead of sending them |
| `allowLocal` | `data-allow-local` | Track on localhost |
| `nonce` | `nonce` | CSP nonce |

Helpers for server rendering and integrations:

- `scriptAttributes(options)`
- `renderScriptTag(options)` (HTML string)
- `loaderSnippet(options)` (inline JS that adds the stub and injects the script)
- `queueStub(namespace)`
- `createClient(namespace)` / `getClient(namespace)`
- `hasTrackerScript()`

## Tests

```sh
docker run --rm -v "$PWD/..":/w -w /w node:22 sh -c "npm install && npm test -w @privatus-analytics/tracker"
```

MIT licensed.
