# rspress-plugin-privatus

**Real visitor numbers for your Rspress docs. No cookies, no cookie pop-up, no bots.**

You want to know if people read your Rspress docs. But Google Analytics uses
cookies, so in many countries you must show a cookie pop-up first (the box that
asks visitors to say yes to cookies). Many people click no, so they never show
up in your numbers. Bots add fake visits on top.

This plugin adds the Privatus Analytics script to every page of your Rspress
production build. The script sets no cookies and keeps no IP addresses. Bots are
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

- Adds the Privatus Analytics tracking script to the `<head>` of every page of
  your [Rspress](https://rspress.rs) production build (`rspress build`).
- Adds nothing while `rspress dev` runs, so your own visits while you write are
  not counted.
- Only prints the browser script and a few HTML attributes. It never sends
  events from your build, sets no cookies and reads nothing about your visitors.

You need a Privatus Analytics account to see reports, and there is a free plan.
Sign up at https://privatusanalytics.com.

## Requirements

* Rspress 2.
* A Privatus Analytics site id.

## Install

```sh
npm install rspress-plugin-privatus -D
```

A site id starts with `pa_`. You find it in Privatus Analytics under Site
settings, Tracking. For the full setup guide and every tracker option, see the
[Privatus Analytics docs](https://privatusanalytics.com/docs).

## Add the tag

Add the plugin to `rspress.config.ts`:

```ts
import { defineConfig } from '@rspress/core'
import { pluginPrivatus } from 'rspress-plugin-privatus'

export default defineConfig({
  plugins: [pluginPrivatus({ siteId: 'pa_YOURSITEID' })],
})
```

Run `rspress build` and every page gets this in its `<head>`:

```html
<script defer src="https://privatusstats.com/js/pa.js" data-site="pa_YOURSITEID" data-modules="engage,auto,vitals,clicks,ask"></script>
```

You can also leave out `siteId` and set the `PRIVATUS_SITE_ID` environment
variable when you build. Rspress changes pages without a full reload, and the
tracker notices each page change by itself.

## Configuration

Every setting is optional except the site id.

```ts
pluginPrivatus({
  siteId: 'pa_YOURSITEID',                 // or PRIVATUS_SITE_ID
  scriptHost: 'https://privatusstats.com', // or PRIVATUS_SCRIPT_HOST
  modules: ['engage', 'auto', 'vitals', 'clicks', 'ask'],
  excludedPaths: ['/drafts/*'],
  domains: ['docs.example.com'],
  spa: 'auto',                             // auto, history, hash or off
  manual: false,                           // true turns off the automatic pageview
  enabled: undefined,                      // true or false forces it on or off
  extraAttributes: { 'data-mask': '/orders/*->/orders/:id' },
  props: (route) => ({ lang: route.lang || 'en' }),
  queueStub: false,
  nonce: undefined,
})
```

| Setting | Default | What it does |
|---|---|---|
| `siteId` | `PRIVATUS_SITE_ID` | The `data-site` attribute. Nothing prints without it |
| `scriptHost` | `https://privatusstats.com` | Where `/js/pa.js` is served from (or `PRIVATUS_SCRIPT_HOST`). Change it only if you host your own copy |
| `modules` | `engage, auto, vitals, clicks, ask` | The `data-modules` attribute. `[]` loads none |
| `excludedPaths` | none | The `data-exclude` attribute. Path patterns the tracker never counts, like `/drafts/*` |
| `domains` | all hosts | The `data-domains` attribute. Count only these hostnames |
| `spa` | `auto` | The `data-spa` attribute. It tells the tracker how your pages change without a full reload |
| `manual` | `false` | The `data-manual` attribute. `true` turns off the automatic pageview |
| `enabled` | on in `rspress build`, off in `rspress dev` | `true` or `false` forces the tag on or off |
| `extraAttributes` | `{}` | Any other `data-*` attribute |
| `props` | none | Page props sent with every pageview and event. An object, or a function that gets each page's route |
| `queueStub` | `false` | Prints a small script first, so `privatus.track` calls made before the tracker loads are kept |
| `nonce` | none | The Content Security Policy nonce for the scripts |

Each tracker attribute is explained in the [script attributes
reference](https://privatusanalytics.com/docs/tracker/attributes), and the
modules in [Modules](https://privatusanalytics.com/docs/tracker/modules).

### Page props: language, version and other groups

Page props are sent with every pageview and event. Use them to split your
reports, for example by language or docs version. The function gets each
page's Rspress route, with `routePath`, `lang` and `version`:

```ts
pluginPrivatus({
  siteId: 'pa_YOURSITEID',
  props: (route) => ({ lang: route.lang || 'en', docs_version: route.version || 'latest' }),
})
```

The tag then prints a small script before the tracker and points the tracker
at it:

```html
<script>window.privatusPageProps=function(){return {"lang":"en","docs_version":"latest"}}</script>
<script defer src="https://privatusstats.com/js/pa.js" data-site="pa_YOURSITEID" data-modules="engage,auto,vitals,clicks,ask" data-props="privatusPageProps"></script>
```

**Never put names, emails, user ids or anything that points to one person in
props.** Privatus Analytics counts visitors without any id. Put groups (like the
language or the version), not people. The server also removes emails and long
ids it finds.

## Product analytics: see which features people use

Privatus Analytics can show which buttons and links people really use. MDX
pages take the attributes as they are:

```jsx
<button data-privatus-event="Download clicked" data-privatus-prop-file="guide-pdf">Download</button>
<a href="/guide/start" data-privatus-click="hero.get-started">Get started</a>
```

Use a short "Noun verb" name and put the details in `data-privatus-prop-*`
attributes. See the [attributes
reference](https://privatusanalytics.com/docs/tracker/attributes) for every
attribute.

For things that are not a click or a submit, call the tracker from your
JavaScript, as the [JavaScript API
docs](https://privatusanalytics.com/docs/tracker/javascript-api) explain:

```js
privatus.track("Feature used", { feature: "export" })
```

If your code may run before the tracker has loaded, switch on the queue stub
with `queueStub: true`. It prints a tiny script before the tracker that keeps
your calls in a list and sends them once the tracker is ready.

## Privacy

The script sets no cookies and stores nothing in the browser. The plugin only adds the script tag and, when you use them, two small scripts.
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

This package lives in the `rspress` folder of the
[Privatus Analytics JavaScript repo](https://github.com/Privatus-Analytics/js).
The tests run in Docker so your local Node does not matter. From the repo root:

```sh
./run-docker.sh
```

It installs every package, then runs the repo's `build`, `test` and
`typecheck` scripts in a `node:22-slim` container. The tests include a real
`rspress build` of a small site in `test/site`.

## Contributing

Bug reports and pull requests are welcome at
https://github.com/Privatus-Analytics/js.

## License

MIT. See [LICENSE](LICENSE). Privatus Analytics is a product of Two Phase LLC,
Wyoming, USA.
