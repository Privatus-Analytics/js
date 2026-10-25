# gatsby-plugin-privatus

A [Gatsby](https://www.gatsbyjs.com) plugin that adds the cookieless
[Privatus Analytics](https://privatusanalytics.com) tracking script to every
page of your production build.

Privatus Analytics counts visits, sources, pages and conversions without
cookies, local storage or fingerprinting, so analytics does not need a consent
banner by itself. Check with your own lawyer for the rules in your country.

The plugin only prints the browser script and a few HTML attributes. It never
sends events from your build, sets no cookies and reads nothing about your
visitors. You need a Privatus Analytics account to see reports, and there is a
free plan. Sign up at https://privatusanalytics.com.

## Requirements

* Gatsby 4 or 5, with React 18 or later.
* A Privatus Analytics site id.

## Install

```sh
npm install gatsby-plugin-privatus
```

A site id starts with `pa_`. You find it in Privatus Analytics under Site
settings, Tracking. For the full setup guide and every tracker option, see the
[Privatus Analytics docs](https://privatusanalytics.com/docs).

Add the plugin to `gatsby-config.js`:

```js
module.exports = {
  plugins: [
    { resolve: 'gatsby-plugin-privatus', options: { siteId: 'pa_YOURSITEID' } },
  ],
}
```

You can also leave `siteId` out and set an environment variable when you
build:

```sh
PRIVATUS_SITE_ID=pa_YOURSITEID npx gatsby build
```

## Add the tag

You do not need to change any pages. The plugin adds the tag to the `<head>`
of every page in `gatsby build`:

```html
<script defer="" src="https://privatusstats.com/js/pa.js" data-site="pa_YOURSITEID"></script>
```

(React writes `defer=""`. It means the same as `defer`.)

It prints nothing when there is no site id, and nothing in `gatsby develop`,
so your own visits while you build are never counted. The one exception is the
queue stub: when you turn it on, it still prints (see below). Gatsby moves between
pages without a full reload. The tracker notices those page changes by itself,
so every page you open is counted.

## Configuration

Every setting is optional except the site id.

```js
{
  resolve: 'gatsby-plugin-privatus',
  options: {
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
    props: { site: 'blog' },
  },
}
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
| `enabled` | not set | `true` or `false` forces the tag on or off. When not set: on only in production builds (`NODE_ENV` is `production`, which `gatsby build` sets) |
| `extraAttributes` | `{}` | Any other `data-*` attribute, like `{ "data-mask": "/orders/*->/orders/:id" }` |
| `props` | `{}` | Page props sent with every pageview and event. A plain object, the same for the whole site. See below |
| `queueStub` | `false` | Prints a small script first, so `privatus.track` calls made before the tracker loads are kept and sent later |
| `nonce` | none | A Content Security Policy nonce for the scripts. Only needed if your host adds a policy with a fixed nonce |

Each tracker attribute is explained in the [script attributes
reference](https://privatusanalytics.com/docs/tracker/attributes), and the
modules in [Modules](https://privatusanalytics.com/docs/tracker/modules).

Gatsby checks the options when it starts, so a typo (like `siteID`) stops the
build with a clear message.

### Development

To see the tag in `gatsby develop`, set `enabled: true`. The tracker also
ignores `localhost` unless you add `data-allow-local` or `data-debug` (see
[Debug mode](https://privatusanalytics.com/docs/tracker/debug)):

```js
options: { enabled: true, extraAttributes: { 'data-debug': 'true' } }
```

### Leaving people out

Use `excludedPaths` for pages you never want counted, like drafts. A static
site has no idea who is signed in, so it cannot leave out staff by itself.
Staff can turn tracking off in their own browser, as the [opt out
docs](https://privatusanalytics.com/docs/tracker/javascript-api) explain.

## Product analytics: see which features people use

Privatus can show which buttons, links and forms people really use. The
tracker reads a few attributes in the browser and sends the events. Your site
still sends nothing from the build.

### Name events well

Use a short "Noun verb" name, like `Report exported` or `Invite sent`. Put the
details in props, not in the name. So write `Report exported` with
`format: "csv"`, not `Report exported as CSV`. Then all exports add up in one
place, and you can split them by format.

### Events and click maps in JSX

React components take the attributes as they are:

```jsx
<button data-privatus-event="Report exported" data-privatus-prop-format="csv">Export</button>
<Link to="/pricing/" data-privatus-click="pricing.cta">See plans</Link>
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

### Page props: site, section and other groups

Page props are sent with every pageview and event. Use them to split your
reports, for example by which site of several it is:

```js
options: { siteId: 'pa_YOURSITEID', props: { site: 'blog' } }
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
props.** Privatus counts visitors without any id. Put groups (like the plan or
the role), not people. The server also removes emails and long ids it finds.

Plugin options are for the whole site. To use other settings on some pages,
like props for one section, swap the plugin's scripts in your own
`gatsby-ssr.js`. `headComponents(options)` gives the scripts for any options,
and the plugin's own scripts have keys that start with `privatus-analytics-`:

```js
// gatsby-ssr.js
const { headComponents } = require('gatsby-plugin-privatus/gatsby-ssr')
const options = { siteId: 'pa_YOURSITEID', props: { site: 'blog' } }

exports.onPreRenderHTML = ({ pathname, getHeadComponents, replaceHeadComponents }) => {
  if (!pathname.startsWith('/docs/')) return
  const ours = (c) => typeof c?.key === 'string' && c.key.startsWith('privatus-analytics-')
  const rest = getHeadComponents().filter((c) => !ours(c))
  replaceHeadComponents([...rest, ...headComponents({ ...options, props: { site: 'docs' } })])
}
```

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

This package lives in the `gatsby` folder of the
[Privatus Analytics JavaScript repo](https://github.com/Privatus-Analytics/js).
The tests run in Docker so your local Node does not matter. From the repo root:

```sh
./run-docker.sh
```

It installs every package, then runs the repo's `build`, `test` and
`typecheck` scripts in a `node:22-slim` container.

`example/` is a small Gatsby site for the Privatus Analytics conformance tests,
which check the tag in a real browser. The site is built with the plugin and
served by nginx.

## Contributing

Bug reports and pull requests are welcome at
https://github.com/Privatus-Analytics/js.

## License

MIT. See [LICENSE](LICENSE). Privatus Analytics is a product of Two Phase LLC,
Wyoming, USA.
