# @privatus-analytics/hono

> **Not published yet.** Build and install `@privatus-analytics/hono` from this folder until the first release.
> The `@privatus` scope on npm belongs to another organisation, so packages under that scope are not ours.

Adds the cookieless [Privatus Analytics](https://privatusanalytics.com)
tracking script to your Hono app. You get a helper for `html` templates and
JSX, or an optional middleware setting that puts the tag in the `<head>` for
you. It works on every runtime Hono runs on: Node.js, Bun, Deno and
Cloudflare Workers.

Privatus Analytics counts visits, sources, pages and conversions without
cookies, local storage or fingerprinting, so analytics does not need a consent
banner by itself. Check with your own lawyer for the rules in your country.

The package only prints the browser script and a few HTML attributes. It never
sends events from your server, sets no cookies and reads nothing about your
visitors. You need a Privatus Analytics account to see reports, and there is a
free plan. Sign up at https://privatusanalytics.com.

## Requirements

* Hono 4 or later.
* A Privatus Analytics site id.

## Install

```sh
npm install @privatus-analytics/hono
```

A site id starts with `pa_`. You find it in Privatus Analytics under Site
settings, Tracking. For the full setup guide and every tracker option, see the
[Privatus Analytics docs](https://privatusanalytics.com/docs).

Set your site id with an environment variable (on Cloudflare Workers, a
variable in `wrangler.toml` works too):

```sh
PRIVATUS_SITE_ID=pa_YOURSITEID
```

or pass it to the middleware:

```ts
import { Hono } from 'hono'
import { privatus } from '@privatus-analytics/hono'

const app = new Hono()
app.use(privatus({ siteId: 'pa_YOURSITEID' }))
```

## Add the tag

`privatusAnalyticsTag(c)` gives the tag as raw HTML, ready for the `html`
helper and for JSX:

```ts
import { html } from 'hono/html'
import { privatusAnalyticsTag } from '@privatus-analytics/hono'

app.get('/', (c) =>
  c.html(html`<html><head><title>My app</title>${privatusAnalyticsTag(c)}</head><body>...</body></html>`),
)
```

```tsx
app.get('/', (c) =>
  c.html(
    <html>
      <head>
        <title>My app</title>
        {c.var.privatus.tag()}
      </head>
      <body>...</body>
    </html>,
  ),
)
```

In production it prints:

```html
<script defer src="https://privatusstats.com/js/pa.js" data-site="pa_YOURSITEID"></script>
```

The tag prints nothing when there is no site id, and nothing unless `NODE_ENV`
is `production`. The package reads `NODE_ENV` and `PRIVATUS_SITE_ID` from
`process.env` and from your runtime's variables (with Hono's `env()` helper and
`c.env`). Cloudflare Workers have no `NODE_ENV` unless you set one, so either
add `NODE_ENV = "production"` under `[vars]` in `wrangler.toml` or set
`enabled: true` in the code you deploy. The one exception is the queue stub:
when you turn it on, it still prints (see below).

If your app uses a Content Security Policy (a list of the scripts a page may
run), the tag needs a nonce, a one-time code that allows inline scripts. With
Hono's `secureHeaders` middleware and `NONCE` in `scriptSrc`, the package uses
that nonce for you. You can also pass `nonce: (c) => ...`.

### Or let the middleware add it

If you would rather not touch your pages, switch on auto inject:

```ts
app.use(privatus({ siteId: 'pa_YOURSITEID', autoInject: true }))
```

After your handler runs, the middleware rewrites the `Response`: it adds the
tag just before `</head>` in `text/html` responses with status 200 to `GET`
requests. It skips Ajax requests (`X-Requested-With: XMLHttpRequest`), pages
without a `<head>`, and pages that already have the tag. It drops the
`Content-Length` and `ETag` headers, because the page changed. It reads the
whole body first, so a streamed page arrives in one piece. For streamed pages,
use the helper instead.

Responses that are already compressed (with a `Content-Encoding` header) are
left alone, so add `compress()` **before** this middleware:

```ts
app.use(compress())
app.use(privatus({ autoInject: true }))
```

## Configuration

Every setting is optional except the site id.

```ts
app.use(privatus({
  siteId: 'pa_YOURSITEID',              // or PRIVATUS_SITE_ID
  scriptHost: 'https://privatusstats.com', // or PRIVATUS_SCRIPT_HOST
  modules: ['engage', 'auto', 'vitals', 'clicks', 'ask'],
  excludedPaths: ['/admin/*', '/preview/*'],
  domains: ['example.com', 'www.example.com'],
  spa: 'auto',                          // auto, history, hash or off
  manual: false,                        // true turns off the automatic pageview
  autoInject: false,
  enabled: undefined,                   // true or false forces it on or off
  extraAttributes: { 'data-mask': '/orders/*->/orders/:id' },
  props: (c) => ({ plan: c.get('account')?.plan }),
  queueStub: false,
}))
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
| `enabled` | not set | `true` or `false` forces the tag on or off. When not set: on only when `NODE_ENV` is `production` |
| `autoInject` | `false` | Adds the tag to the head of HTML responses for you |
| `extraAttributes` | `{}` | Any other `data-*` attribute, like `{ "data-mask": "/orders/*->/orders/:id" }` |
| `props` | `{}` | Page props sent with every pageview and event. An object, or a function that gets the context `c`. See below |
| `queueStub` | `false` | Prints a small script first, so `privatus.track` calls made before the tracker loads are kept and sent later |
| `nonce` | `secureHeaders`' nonce | The Content Security Policy nonce. A string, or a function that gets `c` |

Each tracker attribute is explained in the [script attributes
reference](https://privatusanalytics.com/docs/tracker/attributes), and the
modules in [Modules](https://privatusanalytics.com/docs/tracker/modules).

You can also change a setting for one page:

```ts
privatusAnalyticsTag(c, { modules: ['engage', 'auto'], excludedPaths: ['/preview/*'] })
```

### Development and test

Development and test requests are not counted by default, so your own
clicking around never reaches your reports. To see the tag while you build,
set `enabled: true`. The tracker also ignores `localhost` unless you add
`data-allow-local` or `data-debug` (see [Debug
mode](https://privatusanalytics.com/docs/tracker/debug)):

```ts
app.use(privatus({ enabled: true, extraAttributes: { 'data-debug': 'true' } }))
```

### Leaving people out

Use `excludedPaths` for admin areas. To leave out signed-in staff, print the
tag only for other people:

```tsx
{c.get('user')?.isAdmin ? null : privatusAnalyticsTag(c)}
```

## Product analytics: see which features people use

Privatus can show which buttons, forms and features people really use. You
add a few attributes to your HTML. The tracker reads them in the browser and
sends the events. Your server still sends nothing.

### Name events well

Use a short "Noun verb" name, like `Report exported` or `Invite sent`. Put the
details in props, not in the name. So write `Report exported` with
`format: "csv"`, not `Report exported as CSV`. Then all exports add up in one
place, and you can split them by format.

### Events on buttons, links and forms

In JSX, spread `eventData` on the element:

```tsx
import { eventData } from '@privatus-analytics/hono'

<button {...eventData('Report exported', { format: 'csv', source: 'toolbar' })}>Export</button>
```

In `html` templates, `eventAttrs` prints the attributes inside a tag you write
yourself:

```ts
html`<button ${eventAttrs('Report exported', { format: 'csv', source: 'toolbar' })}>Export</button>`
```

Both print:

```html
<button data-privatus-event="Report exported" data-privatus-prop-format="csv" data-privatus-prop-source="toolbar">Export</button>
```

On a form, the event is sent when the form is submitted:

```tsx
<form method="post" action="/newsletter" {...eventData('Newsletter joined', { list: 'weekly' })}>
```

The rules:

* The name is trimmed and cut to 120 characters. An empty name prints nothing.
* Prop keys are made lowercase. Anything that is not a letter, a digit or `_`
  becomes `_`, so `"Report Type"` becomes `report_type`. Keys are cut to 64
  characters.
* At most 30 props. Values become text: `true`, `false`, numbers as written,
  lists joined with commas. `null` and `undefined` values are left out. Values
  are cut to 500 characters.
* Everything is escaped for HTML.
* The attributes print in every environment, even when the tag is off. They do
  nothing without the tracker, so your pages look the same in development and
  production.

### Click maps

A click map shows where people click on a page. Give the important parts a
name so they stay easy to find, even when the page changes:

```tsx
<a href="/pricing" {...clickData('pricing.cta')}>See plans</a>
```

```ts
html`<a href="/pricing" ${clickAttr('pricing.cta')}>See plans</a>`
```

A name may use letters, digits and `_ . : -`, up to 100 characters. Anything
else prints nothing, and outside production the package writes a warning with
`console.warn`.

### Page props: plan, role and other groups

Page props are sent with every pageview and event on the page. Use them to
split your reports by plan, role, app version, feature flag or account tier.

Set them for every page with a function. It runs on each request and gets the
context:

```ts
app.use(privatus({
  props: (c) => ({ plan: c.get('account')?.plan, role: c.get('user')?.role, app_version: '2.4' }),
}))
```

A plain object works too. You can also set or change props for one page. They
are merged over the configured ones, and `null` removes one:

```ts
privatusAnalyticsTag(c, { props: { section: 'billing', role: null } })
```

The tag then prints a small script before the tracker, with your Content Security Policy nonce when you have one, and points
the tracker at it:

```html
<script>window.privatusPageProps=function(){return {"plan":"pro","role":"admin"}}</script>
<script defer src="https://privatusstats.com/js/pa.js" data-site="pa_YOURSITEID" data-props="privatusPageProps"></script>
```

The function only runs when the tag prints. Auto inject uses the same setting.

Keys follow the same rules as event props. Numbers and `true` or `false` stay
as they are, and lists stay lists (up to 30 items). The props are escaped so
they are safe inside a script.

**Never put names, emails, user ids or anything that points to one person in
props.** Privatus counts visitors without any id. Put groups (like the plan or
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

The stub prints even where the tag is off (in development, with
`enabled: false` or without a site id). Then only the stub prints: no tracker
and no page props. So you can always call `privatus.track(...)`. In
development the calls just wait in the queue and are never sent.
Auto inject adds nothing while the tag is off, so print the tag in your page
if you want the stub there.

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

The script sets no cookies and stores nothing in the browser. The event, click and props helpers only print HTML attributes and a small script.
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

This package lives in the `hono` folder of the
[Privatus Analytics JavaScript repo](https://github.com/Privatus-Analytics/js).
The tests run in Docker so your local Node does not matter. From the repo root:

```sh
./run-docker.sh
```

It installs every package, then runs the repo's `build`, `test` and
`typecheck` scripts in a `node:22-slim` container.

`example/` is a small Hono app for the Privatus Analytics conformance tests,
which check the tag in a real browser.

## Contributing

Bug reports and pull requests are welcome at
https://github.com/Privatus-Analytics/js.

## License

MIT. See [LICENSE](LICENSE). Privatus Analytics is a product of Two Phase LLC,
Wyoming, USA.
