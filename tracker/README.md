# @privatus-analytics/tracker

**Real visitor numbers for your JavaScript site or app. No cookies, no cookie pop-up, no bots.**

You want to know if people use your JavaScript site or app. But Google Analytics
uses cookies, so in many countries you must show a cookie pop-up first (the box
that asks visitors to say yes to cookies). Many people click no, so they never
show up in your numbers. Bots add fake visits on top.

This package loads the Privatus Analytics script in any JavaScript app, with
types. It is safe to import during server-side rendering and adds no storage of
its own. The script sets no cookies and keeps no IP addresses. Bots are filtered
out before they are counted.

So you see how many real people came, which pages they looked at and where they
came from, on one simple dashboard. A report comes to your inbox each week, and
you can set alerts for when traffic jumps or drops. And you don't need a cookie
pop-up for your analytics.

**Free plan, no card:** 10,000 events a month (an event is a page view or an action you track) on up to 3 sites. [Start free at privatusanalytics.com](https://privatusanalytics.com).

- **No cookies.** No cookies and no hidden IDs on your visitors' devices, and no IP
  addresses are kept. Laws differ by country, so check your own legal advice.
- **Real people, not bots.** Known bots, data centers and spam visits are left
  out on every plan.
- **Small and fast.** The script is about 3 KB when compressed.

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
