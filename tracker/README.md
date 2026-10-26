# @privatus-analytics/tracker

> **Not published yet.** Build and install `@privatus-analytics/tracker` from this folder until the first release.
> The `@privatus` scope on npm belongs to another organisation, so packages under that scope are not ours.

**Simple, private website analytics for any JavaScript site or app.** No cookies, honest numbers, and a dashboard you understand in seconds.

## Why Privatus Analytics

**Google Analytics is slow, confusing and hungry for data.** It sends what your visitors do to Google. In many countries it needs a cookie pop-up (the box that asks visitors to accept cookies), and everyone who clicks "reject" is lost from your numbers.

**Privatus Analytics fixes that.** It counts visits to any JavaScript site or app without cookies and never stores IP addresses. Bots are filtered out before they are counted, and your data is never sold or shared.

- **A dashboard you understand in seconds.** Visitors, top pages and where people came from, all on one screen.
- **No cookie pop-up needed for our analytics.** We set no cookies and store no personal data. Laws differ by country, so check your own legal advice.
- **A fast site.** The tracking script is about 3 KB, tiny next to most tracking tags.

**Start free.** The Free plan has 10,000 events a month and 3 sites, with no card. [Create your account](https://privatusanalytics.com).

## What this package does

- A typed loader for the Privatus Analytics tracker (`pa.js`) that is safe to import during server-side rendering (SSR).
- Privatus Analytics uses no cookies, no localStorage or sessionStorage, no fingerprinting and no device ids. This package keeps that promise and adds no storage of its own.

## Install

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
| `src` | `src` | Defaults to `{api}/js/pa.js`, or to `https://privatusstats.com/js/pa.js` when `api` is not set |
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

## Privacy

The tracker sets no cookies and uses no device ids. This package only loads it and calls it. See the
[privacy documentation](https://privatusanalytics.com/docs/privacy) for what is collected.

If you have a privacy policy, it should say which tools handle your visitors' data. You can paste this:

> This website uses [Privatus Analytics](https://privatusanalytics.com/privacy-analytics) to count visits. It
> does not use cookies and does not follow you from one website to another. Your IP address is used for a moment
> to count visits and is never stored.

Change it to fit your site. The [privacy policy generator](https://privatusanalytics.com/tools/privacy-policy-generator)
makes a longer version with your site's name in it.

MIT licensed.
