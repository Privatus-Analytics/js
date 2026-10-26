# vitepress-plugin-privatus

**Real visitor numbers for your VitePress site. No cookies, no cookie pop-up, no bots.**

You want to know if people read your VitePress site. But Google Analytics uses
cookies, so in many countries you must show a cookie pop-up first (the box that
asks visitors to say yes to cookies). Many people click no, so they never show
up in your numbers. Bots add fake visits on top.

This plugin adds the Privatus Analytics script to your VitePress site, or to any
plain Vite app. The script sets no cookies and keeps no IP addresses. Bots are
filtered out before they are counted.

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

- Adds the Privatus Analytics tracking script to your
  [VitePress](https://vitepress.dev) site, or to any plain
  [Vite](https://vite.dev) app.
- Only prints the browser script and a few HTML attributes. It never sends
  events from your build, sets no cookies and reads nothing about your visitors.

You need a Privatus Analytics account to see reports, and there is a free plan.
Sign up at https://privatusanalytics.com.

## Requirements

* VitePress 1 or later, or Vite 4 or later.
* A Privatus Analytics site id.

## Install

```sh
npm install vitepress-plugin-privatus
```

A site id starts with `pa_`. You find it in Privatus Analytics under Site
settings, Tracking. For the full setup guide and every tracker option, see the
[Privatus Analytics docs](https://privatusanalytics.com/docs).

## Add the tag

VitePress has no plugin system of its own. So this package gives you small
helpers for the settings VitePress already has. Pick one.

### The simple way: `head`

```js
// .vitepress/config.mjs
import { defineConfig } from 'vitepress'
import { privatusHead } from 'vitepress-plugin-privatus'

export default defineConfig({
  head: [...privatusHead({ siteId: 'pa_YOURSITEID' })],
})
```

Every page then gets, in `vitepress build`:

```html
<script defer src="https://privatusstats.com/js/pa.js" data-site="pa_YOURSITEID"></script>
```

`privatusHead` reads `NODE_ENV` when your config loads. `vitepress build` sets
it to `production` and `vitepress dev` does not, so your own visits while you
write are never counted.

### Per page: `transformHead`

`privatusTransformHead` gives you a `transformHead` hook. VitePress calls it
for each page, and only in `vitepress build`. Use it when you want page props
from each page, for example its front matter:

```js
import { privatusTransformHead } from 'vitepress-plugin-privatus'

export default defineConfig({
  transformHead: privatusTransformHead({
    siteId: 'pa_YOURSITEID',
    props: ({ pageData }) => ({ section: pageData.frontmatter.section }),
  }),
})
```

Use `privatusHead` or `privatusTransformHead`, not both. If you already have a
`transformHead` hook, call ours from yours and add its result to what you
return.

### Plain Vite apps: `privatusVitePlugin`

For a Vite app with an `index.html` (not VitePress), add the Vite plugin. In
`vite build` it puts the tag before `</head>` in your HTML. The dev server
never gets the tag (only the queue stub, when you turn it on, see below).

```js
// vite.config.js
import { defineConfig } from 'vite'
import { privatusVitePlugin } from 'vitepress-plugin-privatus'

export default defineConfig({
  plugins: [privatusVitePlugin({ siteId: 'pa_YOURSITEID' })],
})
```

VitePress builds its pages without `index.html`, so this plugin does nothing
there. In VitePress, use `privatusHead` or `privatusTransformHead`.

Every helper prints nothing without a site id, except the queue stub when you
turn it on (see below). You can leave `siteId` out and set an environment
variable when you build:

```sh
PRIVATUS_SITE_ID=pa_YOURSITEID npx vitepress build docs
```

VitePress moves between pages without a full reload. The tracker notices those
page changes by itself, so every page you open is counted.

## Configuration

Every setting is optional except the site id. All three helpers take the same
settings.

```js
privatusHead({
  siteId: 'pa_YOURSITEID',              // or PRIVATUS_SITE_ID
  scriptHost: 'https://privatusstats.com', // or PRIVATUS_SCRIPT_HOST
  modules: ['engage', 'auto', 'vitals', 'clicks', 'ask'],
  excludedPaths: ['/drafts/*'],
  domains: ['docs.example.com'],
  spa: 'auto',                          // auto, history, hash or off
  manual: false,                        // true turns off the automatic pageview
  enabled: undefined,                   // true or false forces it on or off
  extraAttributes: { 'data-mask': '/blog/*->/blog/:post' },
  queueStub: false,
  nonce: undefined,
  props: { site: 'docs' },
})
```

| Setting | Default | What it does |
|---|---|---|
| `siteId` | `PRIVATUS_SITE_ID` | The `data-site` attribute. Nothing prints without it |
| `scriptHost` | `https://privatusstats.com` | Where `/js/pa.js` is served from (or `PRIVATUS_SCRIPT_HOST`). Change it only if you host your own copy |
| `modules` | tracker default (`engage`) | The `data-modules` attribute. Setting it replaces the default, so keep `engage` for time on page and scroll depth. `[]` loads none |
| `excludedPaths` | none | The `data-exclude` attribute. Path patterns the tracker never counts, like `/admin/*` |
| `domains` | all hosts | The `data-domains` attribute. Count only these hostnames |
| `spa` | `auto` | The `data-spa` attribute: `auto`, `history`, `hash` or `off`. It tells the tracker how your pages change without a full reload |
| `manual` | `false` | The `data-manual` attribute. `true` turns off the automatic pageview |
| `enabled` | not set | `true` or `false` forces the tag on or off. When not set: `privatusHead`: on only when `NODE_ENV` is `production`. `privatusTransformHead`: on, because VitePress only runs it in a build. `privatusVitePlugin`: on only in a production `vite build` |
| `extraAttributes` | `{}` | Any other `data-*` attribute, like `{ "data-mask": "/orders/*->/orders/:id" }` |
| `props` | `{}` | Page props sent with every pageview and event. `privatusHead` takes an object. `privatusTransformHead` also takes a function that gets the page context (`page`, `pageData`). `privatusVitePlugin` takes a function that gets the HTML context (`path`). See below |
| `queueStub` | `false` | Prints a small script first, so `privatus.track` calls made before the tracker loads are kept and sent later |
| `nonce` | none | A Content Security Policy nonce for the scripts. Only needed if your host adds a policy with a fixed nonce |

Each tracker attribute is explained in the [script attributes
reference](https://privatusanalytics.com/docs/tracker/attributes), and the
modules in [Modules](https://privatusanalytics.com/docs/tracker/modules).

### Development

To see the tag in `vitepress dev`, use `privatusHead` with `enabled: true`.
The tracker also ignores `localhost` unless you add `data-allow-local` or
`data-debug` (see [Debug mode](https://privatusanalytics.com/docs/tracker/debug)):

```js
head: [...privatusHead({ enabled: true, extraAttributes: { 'data-debug': 'true' } })]
```

### Leaving people out

Use `excludedPaths` for pages you never want counted, like drafts. A static
site has no idea who is signed in, so it cannot leave out staff by itself.
Staff can turn tracking off in their own browser, as the [opt out
docs](https://privatusanalytics.com/docs/tracker/javascript-api) explain.

## Product analytics: see which features people use

Privatus Analytics can show which buttons, links and forms people really use. The
tracker reads a few attributes in the browser and sends the events. Your site
still sends nothing from the build.

### Name events well

Use a short "Noun verb" name, like `Report exported` or `Invite sent`. Put the
details in props, not in the name. So write `Report exported` with
`format: "csv"`, not `Report exported as CSV`. Then all exports add up in one
place, and you can split them by format.

### Events and click maps in Markdown and Vue

Markdown pages and Vue components take the attributes as they are:

```html
<button data-privatus-event="Report exported" data-privatus-prop-format="csv">Export</button>
<a href="/guide/" data-privatus-click="hero.get-started">Get started</a>
```

You can also write the attributes by hand. The tracker reads them in the
browser:

```html
<button data-privatus-event="Report exported" data-privatus-prop-format="csv">Export</button>
<form data-privatus-event="Newsletter joined" data-privatus-prop-list="weekly">...</form>
<a href="/pricing" data-privatus-click="pricing.cta">See plans</a>
```

On a `<form>`, the event is sent when the form is submitted. Use a short
"Noun verb" name and put details in `data-privatus-prop-*` attributes. A click
map name may use letters, digits and `_ . : -`, up to 100 characters.

See the [attributes reference](https://privatusanalytics.com/docs/tracker/attributes)
for every attribute.

### Page props: section, language and other groups

Page props are sent with every pageview and event on the page. On a docs site,
use them to split your reports by section, language or docs version. With
`privatusTransformHead`, read them from each page:

```js
transformHead: privatusTransformHead({
  props: ({ pageData }) => ({ section: pageData.frontmatter.section, lang: pageData.frontmatter.lang }),
})
```

The tag then prints a small script before the tracker and points
the tracker at it:

```html
<script>window.privatusPageProps=function(){return {"plan":"pro","role":"admin"}}</script>
<script defer src="https://privatusstats.com/js/pa.js" data-site="pa_YOURSITEID" data-props="privatusPageProps"></script>
```

VitePress shortens (minifies) inline head scripts in the build. So the plugin
gives its inline scripts `type="text/ecmascript"`, a standard JavaScript type
that browsers run as normal and VitePress leaves alone. The scripts in your
HTML are then exactly the ones above.

Keys follow the same rules as event props. Numbers and `true` or `false` stay
as they are, and lists stay lists (up to 30 items). The props are escaped so
they are safe inside a script.

**Never put names, emails, user ids or anything that points to one person in
props.** Privatus Analytics counts visitors without any id. Put groups (like the plan or
the role), not people. The server also removes emails and long ids it finds.

### Track from your own JavaScript

For things that are not a click or a submit, call the tracker from your
JavaScript, as the [JavaScript API
docs](https://privatusanalytics.com/docs/tracker/javascript-api) explain:

```js
privatus.track("Feature used", { feature: "export" })
```

If your code may run before the tracker has loaded, switch on the queue stub
with `queueStub: true`. It prints a tiny script before the tracker that keeps
your calls in a list and sends them once the tracker is ready.

The stub is added even when the tag is off (in development, with
`enabled: false` or without a site id), so `privatus.track(...)` calls never
fail in development: they just wait in the queue and are never sent. Then only
the stub is added: no tracker and no page props, and your props function is
not called. All three helpers do this. `privatusVitePlugin` adds it in the
Vite dev server too, and `privatusHead` in `vitepress dev`.
(`privatusTransformHead` only runs in `vitepress build`, so it cannot add it
in `vitepress dev`. Use `privatusHead` for that.) A page never gets two stubs:
`privatusTransformHead` skips it when `privatusHead` already added one, and
`privatusVitePlugin` skips it when your `index.html` already has one. With
`queueStub: false` nothing is added while the tag is off.

### See the results

* [Funnels](https://privatusanalytics.com/docs/features/funnels): how many
  people go from one step to the next.
* [Click maps](https://privatusanalytics.com/docs/features/click-maps): where
  people click.
* [Goals](https://privatusanalytics.com/docs/features/goals): turn an event
  into a goal to count conversions.
* [Events](https://privatusanalytics.com/docs/events): every custom event and
  its props.

## Privacy

The script sets no cookies and stores nothing in the browser. The helpers only add the script tag and, when you use them, two small scripts.
Keep people out of your props and event props: no names, emails or user ids.
See the [privacy documentation](https://privatusanalytics.com/docs/privacy)
for what is collected.

If you have a privacy policy, it should say which tools handle your visitors' data. You can paste this:

> This website uses [Privatus Analytics](https://privatusanalytics.com/privacy-analytics) to count visits. It
> does not use cookies and does not follow you from one website to another. Your IP address is used for a moment
> to count visits and is never stored.

Change it to fit your site. The [privacy policy generator](https://privatusanalytics.com/tools/privacy-policy-generator)
makes a longer version with your site's name in it.

## Development

This package lives in the `vitepress` folder of the
[Privatus Analytics JavaScript repo](https://github.com/Privatus-Analytics/js).
The tests run in Docker so your local Node does not matter. From the repo root:

```sh
./run-docker.sh
```

It installs every package, then runs the repo's `build`, `test` and
`typecheck` scripts in a `node:22-slim` container.

`example/` is a small VitePress site for the Privatus Analytics conformance tests,
which check the tag in a real browser. The site is built with the plugin and
served by nginx.

## Contributing

Bug reports and pull requests are welcome at
https://github.com/Privatus-Analytics/js.

## License

MIT. See [LICENSE](LICENSE). Privatus Analytics is a product of Two Phase LLC,
Wyoming, USA.
