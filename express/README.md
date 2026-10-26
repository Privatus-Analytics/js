# @privatus-analytics/express

**Real visitor numbers for your Express app. No cookies, no cookie pop-up, no bots.**

You want to know if people use your Express app. But Google Analytics uses
cookies, so in many countries you must show a cookie pop-up first (the box that
asks visitors to say yes to cookies). Many people click no, so they never show
up in your numbers. Bots add fake visits on top.

This package adds the Privatus Analytics script to your Express app with a
helper for your templates, or a middleware setting that puts it in the page head
for you. The script sets no cookies and keeps no IP addresses. Bots are filtered
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

- Adds the Privatus Analytics tracking script to your Express app with a helper
  for your templates, or an optional middleware setting that puts the tag in the
  `<head>` for you.
- Only prints the browser script and a few HTML attributes. It never sends
  events from your server, sets no cookies and reads nothing about your
  visitors.

You need a Privatus Analytics account to see reports, and there is a free plan.
Sign up at https://privatusanalytics.com.

## Requirements

* Node.js 18 or later.
* Express 4.17 or later (Express 5 works).
* A Privatus Analytics site id.

## Install

```sh
npm install @privatus-analytics/express
```

A site id starts with `pa_`. You find it in Privatus Analytics under Site
settings, Tracking. For the full setup guide and every tracker option, see the
[Privatus Analytics docs](https://privatusanalytics.com/docs).

Set your site id with an environment variable:

```sh
PRIVATUS_SITE_ID=pa_YOURSITEID
```

or pass it to the middleware:

```js
import express from 'express'
import privatus from '@privatus-analytics/express'

const app = express()
app.use(privatus({ siteId: 'pa_YOURSITEID' }))
```

## Add the tag

The middleware adds `privatusAnalyticsTag()` to `res.locals`, so every
template can call it. Put it in the `<head>` of your layout. Print it without
escaping, because it is HTML:

```ejs
<!-- EJS -->
<head>
  <title>My app</title>
  <%- privatusAnalyticsTag() %>
</head>
```

```pug
//- Pug
head
  title My app
  != privatusAnalyticsTag()
```

In production it prints:

```html
<script defer src="https://privatusstats.com/js/pa.js" data-site="pa_YOURSITEID"></script>
```

The tag prints nothing when there is no site id, and nothing outside
production. Production means `app.get('env')` is `production`, which Express
takes from the `NODE_ENV` environment variable. The one exception is the queue
stub: when you turn it on, it still prints (see below).

If your app uses a Content Security Policy (a list of the scripts a page may
run), the tag needs a nonce, a one-time code that allows inline scripts. The
helper uses `res.locals.cspNonce` when it is set, which is the name the helmet
docs use. You can also pass `nonce: (req, res) => ...`.

Without templates, or outside the request cycle, call the tag yourself:

```js
const analytics = privatus({ siteId: 'pa_YOURSITEID' })
app.use(analytics)
app.get('/', (req, res) => res.send(`<head>${analytics.tag(req, res)}</head>...`))
```

### Or let the middleware add it

If you would rather not touch your layouts, switch on auto inject:

```js
app.use(privatus({ siteId: 'pa_YOURSITEID', autoInject: true }))
```

It adds the tag just before `</head>` in `text/html` responses with status 200
to `GET` requests. It skips Ajax requests (`X-Requested-With: XMLHttpRequest`),
pages without a `<head>`, and pages that already have the tag. It fixes the
`Content-Length` header and drops the `ETag` header, because the page changed.

How it works, and what it cannot do:

* Express has no hook for "the page is ready". So the middleware wraps
  `res.write` and `res.end`. On the first write it checks the status and
  headers. For a page that may get the tag, it holds the body until `res.end`,
  then adds the tag. Everything else passes straight through.
* A page you stream in parts is held until it ends, so the browser gets it in
  one piece. For streamed pages, use `privatusAnalyticsTag()` in the template
  instead.
* It skips responses whose headers were already sent with `res.writeHead()`,
  responses that are already compressed (with a `Content-Encoding` header),
  and pages that are not UTF-8.
* If you use the `compression` middleware, add it **before** this one, so the
  tag goes in first and the page is compressed after:

  ```js
  app.use(compression())
  app.use(privatus({ autoInject: true }))
  ```

Register the middleware before your routes.

## Configuration

Every setting is optional except the site id.

```js
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
  props: (req) => ({ plan: req.user?.plan }),
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
| `enabled` | not set | `true` or `false` forces the tag on or off. When not set: on only when `app.get("env")` is `production` |
| `autoInject` | `false` | Adds the tag to the head of HTML responses for you |
| `extraAttributes` | `{}` | Any other `data-*` attribute, like `{ "data-mask": "/orders/*->/orders/:id" }` |
| `props` | `{}` | Page props sent with every pageview and event. An object, or a function that gets the request. See below |
| `queueStub` | `false` | Prints a small script first, so `privatus.track` calls made before the tracker loads are kept and sent later |
| `nonce` | `res.locals.cspNonce` | The Content Security Policy nonce. A string, or a function that gets `req` and `res` |
| `locals` | `true` | `false` stops the middleware from adding the helpers to `res.locals` |

Each tracker attribute is explained in the [script attributes
reference](https://privatusanalytics.com/docs/tracker/attributes), and the
modules in [Modules](https://privatusanalytics.com/docs/tracker/modules).

You can also change a setting for one page:

```ejs
<%- privatusAnalyticsTag({ modules: ['engage', 'auto'], excludedPaths: ['/preview/*'] }) %>
```

### Development and test

Development and test requests are not counted by default, so your own
clicking around never reaches your reports. To see the tag while you build,
set `enabled: true`. The tracker also ignores `localhost` unless you add
`data-allow-local` or `data-debug` (see [Debug
mode](https://privatusanalytics.com/docs/tracker/debug)):

```js
app.use(privatus({ enabled: true, extraAttributes: { 'data-debug': 'true' } }))
```

### Leaving people out

Use `excludedPaths` for admin areas. To leave out signed-in staff, print the
tag only for other people:

```ejs
<% if (!user?.isAdmin) { %><%- privatusAnalyticsTag() %><% } %>
```

## Product analytics: see which features people use

Privatus Analytics can show which buttons, forms and features people really use. You
add a few attributes to your HTML. The tracker reads them in the browser and
sends the events. Your server still sends nothing.

### Name events well

Use a short "Noun verb" name, like `Report exported` or `Invite sent`. Put the
details in props, not in the name. So write `Report exported` with
`format: "csv"`, not `Report exported as CSV`. Then all exports add up in one
place, and you can split them by format.

### Events on buttons, links and forms

`privatusEventAttrs` prints the attributes inside a tag you write yourself:

```ejs
<button <%- privatusEventAttrs('Report exported', { format: 'csv', source: 'toolbar' }) %>>Export</button>
```

It prints:

```html
<button data-privatus-event="Report exported" data-privatus-prop-format="csv" data-privatus-prop-source="toolbar">Export</button>
```

On a form, the event is sent when the form is submitted:

```ejs
<form action="/newsletter" method="post" <%- privatusEventAttrs('Newsletter joined', { list: 'weekly' }) %>>
```

Outside templates, import the same helpers. `eventData` gives an object with
the full attribute names, handy for JSX or other HTML builders:

```js
import { eventAttrs, eventData, clickAttr, clickData } from '@privatus-analytics/express'

eventAttrs('Report exported', { format: 'csv' }) // 'data-privatus-event="Report exported" data-privatus-prop-format="csv"'
eventData('Report exported', { format: 'csv' })  // { 'data-privatus-event': 'Report exported', 'data-privatus-prop-format': 'csv' }
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

```ejs
<a href="/pricing" <%- privatusClickAttr('pricing.cta') %>>See plans</a>
```

A name may use letters, digits and `_ . : -`, up to 100 characters. Anything
else prints nothing, and outside production the package writes a warning with
`console.warn`.

### Page props: plan, role and other groups

Page props are sent with every pageview and event on the page. Use them to
split your reports by plan, role, app version, feature flag or account tier.

Set them for every page with a function. It runs on each request and gets the
request:

```js
app.use(privatus({
  props: (req) => ({ plan: req.user?.plan, role: req.user?.role, app_version: '2.4' }),
}))
```

A plain object works too. You can also set or change props for one page. They
are merged over the configured ones, and `null` removes one:

```ejs
<%- privatusAnalyticsTag({ props: { section: 'billing', role: null } }) %>
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

The stub prints even where the tag is off (in development, with
`enabled: false` or without a site id). Then only the stub prints: no tracker
and no page props. So you can always call `privatus.track(...)`. In
development the calls just wait in the queue and are never sent.
Auto inject adds nothing while the tag is off, so print the tag in your layout
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

This package lives in the `express` folder of the
[Privatus Analytics JavaScript repo](https://github.com/Privatus-Analytics/js).
The tests run in Docker so your local Node does not matter. From the repo root:

```sh
./run-docker.sh
```

It installs every package, then runs the repo's `build`, `test` and
`typecheck` scripts in a `node:22-slim` container.

`example/` is a small Express app for the Privatus Analytics conformance tests,
which check the tag in a real browser.

## Contributing

Bug reports and pull requests are welcome at
https://github.com/Privatus-Analytics/js.

## License

MIT. See [LICENSE](LICENSE). Privatus Analytics is a product of Two Phase LLC,
Wyoming, USA.
