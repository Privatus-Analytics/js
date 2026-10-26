# eleventy-plugin-privatus

**Real visitor numbers for your Eleventy site. No cookies, no cookie pop-up, no bots.**

You want to know if people visit your Eleventy site. But Google Analytics uses
cookies, so in many countries you must show a cookie pop-up first (the box that
asks visitors to say yes to cookies). Many people click no, so they never show
up in your numbers. Bots add fake visits on top.

This plugin adds the Privatus Analytics script to every page of your Eleventy
site, with shortcodes to track events and clicks. The script sets no cookies and
keeps no IP addresses. Bots are filtered out before they are counted.

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

- Adds the Privatus Analytics tracking script to every page of your
  [Eleventy](https://www.11ty.dev) site.
- Gives you shortcodes for event and click attributes.
- Only prints the browser script and a few HTML attributes. It never sends
  events from your build, sets no cookies and reads nothing about your visitors.

You need a Privatus Analytics account to see reports, and there is a free plan.
Sign up at https://privatusanalytics.com.

## Requirements

* Eleventy 2 or later (Eleventy 3 is tested).
* A Privatus Analytics site id.

## Install

```sh
npm install eleventy-plugin-privatus
```

A site id starts with `pa_`. You find it in Privatus Analytics under Site
settings, Tracking. For the full setup guide and every tracker option, see the
[Privatus Analytics docs](https://privatusanalytics.com/docs).

Add the plugin in your Eleventy config:

```js
// eleventy.config.js
import privatus from 'eleventy-plugin-privatus'

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(privatus, { siteId: 'pa_YOURSITEID' })
}
```

With a CommonJS config, use `const { privatusPlugin } = require('eleventy-plugin-privatus')`
and `eleventyConfig.addPlugin(privatusPlugin, ...)`.

You can also leave `siteId` out and set an environment variable when you
build:

```sh
PRIVATUS_SITE_ID=pa_YOURSITEID npx @11ty/eleventy
```

## Add the tag

You do not need to change your layouts. The plugin puts the tag just before
`</head>` in every `.html` file the build writes. Pages without a `<head>`,
files that are not HTML (like feeds) and pages that already have the tag are
left alone.

In a build it prints:

```html
<script defer src="https://privatusstats.com/js/pa.js" data-site="pa_YOURSITEID"></script>
```

The tag prints nothing when there is no site id, and only in a real build.
Eleventy sets `ELEVENTY_RUN_MODE` to `build`, `serve` or `watch`. Only `build`
gets the tag, so `npx @11ty/eleventy --serve` while you write never counts your
own visits. The one exception is the queue stub: when you turn it on, it is
still added (see below).

### Or place it yourself

If you would rather choose where the tag goes, turn off auto inject and use
the shortcode in your layout:

```js
eleventyConfig.addPlugin(privatus, { siteId: 'pa_YOURSITEID', autoInject: false })
```

```njk
<head>
  <title>{{ title }}</title>
  {% privatusAnalyticsTag %}
</head>
```

The shortcode works in Nunjucks, Liquid and JavaScript templates.

## Configuration

Every setting is optional except the site id.

```js
eleventyConfig.addPlugin(privatus, {
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
  autoInject: true,
  props: (page) => ({ section: page.url.split('/')[1] || 'home' }),
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
| `enabled` | not set | `true` or `false` forces the tag on or off. When not set: on only in a build (`ELEVENTY_RUN_MODE` is `build`) |
| `autoInject` | `true` | Puts the tag before `</head>` in every HTML page. `false` leaves it to the shortcode |
| `extraAttributes` | `{}` | Any other `data-*` attribute, like `{ "data-mask": "/orders/*->/orders/:id" }` |
| `props` | `{}` | Page props sent with every pageview and event. An object, or a function that gets Eleventy's `page` object. See below |
| `queueStub` | `false` | Prints a small script first, so `privatus.track` calls made before the tracker loads are kept and sent later |
| `nonce` | none | A Content Security Policy nonce for the scripts. Only needed if your host adds a policy with a fixed nonce |

Each tracker attribute is explained in the [script attributes
reference](https://privatusanalytics.com/docs/tracker/attributes), and the
modules in [Modules](https://privatusanalytics.com/docs/tracker/modules).

In Nunjucks you can change a setting for one layout:

```njk
{% privatusAnalyticsTag { modules: ["engage", "auto"], props: { section: section } } %}
```

### Development

To see the tag while you write, set `enabled: true`. The tracker also ignores
`localhost` unless you add `data-allow-local` or `data-debug` (see [Debug
mode](https://privatusanalytics.com/docs/tracker/debug)):

```js
eleventyConfig.addPlugin(privatus, { enabled: true, extraAttributes: { 'data-debug': 'true' } })
```

### Leaving people out

Use `excludedPaths` for pages you never want counted, like drafts. A static
site has no idea who is signed in, so it cannot leave out staff by itself.
Staff can turn tracking off in their own browser, as the [opt out
docs](https://privatusanalytics.com/docs/tracker/javascript-api) explain.

## Product analytics: see which features people use

Privatus Analytics can show which buttons, forms and links people really use. You add a
few attributes to your HTML. The tracker reads them in the browser and sends
the events. Your site still sends nothing from the build.

### Name events well

Use a short "Noun verb" name, like `Report exported` or `Invite sent`. Put the
details in props, not in the name. So write `Report exported` with
`format: "csv"`, not `Report exported as CSV`. Then all exports add up in one
place, and you can split them by format.

### Events on buttons, links and forms

The `privatusEventAttrs` shortcode prints the attributes inside a tag you
write yourself. In Nunjucks, pass the props as an object:

```njk
<button {% privatusEventAttrs "Report exported", { format: "csv", source: "toolbar" } %}>Export</button>
```

Liquid has no object literals, so pass key and value pairs:

```liquid
<button {% privatusEventAttrs "Report exported", "format", "csv", "source", "toolbar" %}>Export</button>
```

Both print:

```html
<button data-privatus-event="Report exported" data-privatus-prop-format="csv" data-privatus-prop-source="toolbar">Export</button>
```

On a form, the event is sent when the form is submitted:

```njk
<form action="https://example.com/subscribe" method="post" {% privatusEventAttrs "Newsletter joined", { list: "weekly" } %}>
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

```njk
<a href="/pricing/" {% privatusClickAttr "pricing.cta" %}>See plans</a>
```

A name may use letters, digits and `_ . : -`, up to 100 characters. Anything
else prints nothing, and outside a build the plugin writes a warning with
`console.warn`.

### Page props: section, language and other groups

Page props are sent with every pageview and event on the page. On a content
site, use them to split your reports by section, language, author team or
template.

Set them for every page with a function. It runs for each page and gets
Eleventy's `page` object (`url`, `inputPath`, `fileSlug` and so on):

```js
eleventyConfig.addPlugin(privatus, {
  props: (page) => ({ section: page.url.split('/')[1] || 'home' }),
})
```

A plain object works too. With the shortcode you can also set or change props
from your front matter. They are merged over the configured ones, and `null`
removes one:

```njk
{% privatusAnalyticsTag { props: { section: section, template: "guide" } } %}
```

The tag then prints a small script before the tracker and points
the tracker at it:

```html
<script>window.privatusPageProps=function(){return {"plan":"pro","role":"admin"}}</script>
<script defer src="https://privatusstats.com/js/pa.js" data-site="pa_YOURSITEID" data-props="privatusPageProps"></script>
```

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

The stub is added even when the tag is off (in development with `--serve`,
with `enabled: false` or without a site id), so `privatus.track(...)` calls
never fail in development: they just wait in the queue and are never sent.
Then only the stub is added: no tracker and no page props, and your props
function is not called. Auto inject adds it to every page, and so does the
`privatusAnalyticsTag` shortcode. A page whose layout uses the shortcode still
gets the stub only once. With `queueStub: false` nothing is added while the
tag is off.

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

The script sets no cookies and stores nothing in the browser. The shortcodes only print HTML attributes and a small script.
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

This package lives in the `eleventy` folder of the
[Privatus Analytics JavaScript repo](https://github.com/Privatus-Analytics/js).
The tests run in Docker so your local Node does not matter. From the repo root:

```sh
./run-docker.sh
```

It installs every package, then runs the repo's `build`, `test` and
`typecheck` scripts in a `node:22-slim` container.

`example/` is a small Eleventy site for the Privatus Analytics conformance tests,
which check the tag in a real browser. The site is built with the plugin and
served by nginx.

## Contributing

Bug reports and pull requests are welcome at
https://github.com/Privatus-Analytics/js.

## License

MIT. See [LICENSE](LICENSE). Privatus Analytics is a product of Two Phase LLC,
Wyoming, USA.
