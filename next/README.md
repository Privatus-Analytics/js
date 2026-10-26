# @privatus-analytics/next

> **Not published yet.** Build and install `@privatus-analytics/next` from this folder until the first release.
> The `@privatus` scope on npm belongs to another organisation, so packages under that scope are not ours.

**Simple, private website analytics for your Next.js app.** No cookies, honest
numbers, and a dashboard you understand in seconds.

## Why Privatus Analytics

**Google Analytics is slow, confusing and hungry for data.** It sends what your
visitors do to Google. In many countries it means showing a cookie pop-up (the
box that asks visitors to accept cookies), and many people click "reject", so
you never see them. Bots pad the numbers that are left.

**Privatus Analytics fixes that.** It counts visits to your Next.js app without
cookies and never stores IP addresses. Bots are filtered out before they are
counted. Your data is never sold or shared.

What you get:

- **A dashboard you understand in seconds.** Visitors, top pages and where
  people came from, all on one screen.
- **No cookie pop-up needed for our analytics.** We set no cookies and store no
  personal data. Laws differ by country, so check your own legal advice.
- **Honest numbers.** Known bots and fake traffic are left out on every plan.
- **A fast app.** The tracking script is about 3 KB, tiny next to most tracking
  tags.
- **Data you own.** We never sell it or show you ads, and you can pull it out
  any time through the API.

**Start free.** The Free plan has 10,000 events a month and 3 sites, with no
card. Every new account also gets 14 days of Pro free, with no card. [Create
your account](https://privatusanalytics.com).

## What this package does

- Adds the Privatus Analytics tracking script to your Next.js app with a tag for
  the `<head>` of your root layout.
- Gives you helpers for event and click attributes, and a hook for tracking from
  your own code.
- Only prints the browser script and a few HTML attributes. It never sends
  events from your server, sets no cookies and reads nothing about your
  visitors.

You need a Privatus Analytics account to see reports, and there is a free plan.
Sign up at https://privatusanalytics.com.

## Requirements

* Next.js 13.4 or later. The tag is made for the App Router. In the Pages
  Router, use the component at the end of this page.
* React 18 or later.
* A Privatus Analytics site id.

## Install

```sh
npm install @privatus-analytics/next
```

A site id starts with `pa_`. You find it in Privatus Analytics under Site
settings, Tracking. For the full setup guide and every tracker option, see the
[Privatus Analytics docs](https://privatusanalytics.com/docs).

Set your site id with an environment variable:

```sh
PRIVATUS_SITE_ID=pa_YOURSITEID
```

or pass it to the tag as `siteId`.

## Add the tag

Put `<PrivatusAnalyticsTag />` in the `<head>` of your root layout. It comes
from `@privatus-analytics/next/server`, which works in Server Components:

```tsx
// app/layout.tsx
import { PrivatusAnalyticsTag } from '@privatus-analytics/next/server'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <PrivatusAnalyticsTag />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

In production it prints:

```html
<script defer="" src="https://privatusstats.com/js/pa.js" data-site="pa_YOURSITEID"></script>
```

The tag is in the HTML the server sends, so the tracker starts as early as it
can. The tracker notices page changes made by the Next.js router by itself, so
every page people open is counted.

The tag prints nothing when there is no site id, and nothing unless `NODE_ENV`
is `production` (`next build` and `next start` set it, `next dev` does not).
The one exception is the queue stub: when you turn it on, it still prints (see
below).

`PRIVATUS_SITE_ID` and `PRIVATUS_SCRIPT_HOST` are read when the layout
renders. A page that Next.js renders once at build time reads them at build
time. In a Client Component the browser has no `PRIVATUS_SITE_ID`, so pass
`siteId` there.

### Content Security Policy nonce

If your app sends a Content Security Policy with a nonce, pass the nonce to the
tag. The [Next.js guide](https://nextjs.org/docs/app/guides/content-security-policy)
puts it in an `x-nonce` request header in `proxy.ts` (`middleware.ts` before
Next.js 16). Read it in the layout:

```tsx
import { headers } from 'next/headers'
import { PrivatusAnalyticsTag } from '@privatus-analytics/next/server'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined
  return (
    <html lang="en">
      <head>
        <PrivatusAnalyticsTag nonce={nonce} />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

Allow the script host in `script-src` too, for example
`script-src 'nonce-...' https://privatusstats.com`.

## Configuration

Every setting is optional except the site id.

```tsx
<PrivatusAnalyticsTag
  siteId="pa_YOURSITEID"                  // or PRIVATUS_SITE_ID
  scriptHost="https://privatusstats.com"  // or PRIVATUS_SCRIPT_HOST
  modules={['engage', 'auto', 'vitals', 'clicks', 'ask']}
  excludedPaths={['/admin/*', '/preview/*']}
  domains={['example.com', 'www.example.com']}
  spa="auto"                              // auto, history, hash or off
  manual={false}                          // true turns off the automatic pageview
  enabled={undefined}                     // true or false forces it on or off
  extraAttributes={{ 'data-mask': '/orders/*->/orders/:id' }}
  props={{ plan: 'pro', role: 'admin' }}
  queueStub={false}
  nonce={nonce}
/>
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
| `extraAttributes` | `{}` | Any other `data-*` attribute, like `{ "data-mask": "/orders/*->/orders/:id" }` |
| `props` | `{}` | Page props sent with every pageview and event. See below |
| `queueStub` | `false` | Prints a small script first, so `privatus.track` calls made before the tracker loads are kept and sent later |
| `nonce` | none | The Content Security Policy nonce for the scripts |

Each tracker attribute is explained in the [script attributes
reference](https://privatusanalytics.com/docs/tracker/attributes), and the
modules in [Modules](https://privatusanalytics.com/docs/tracker/modules).

### Development and test

`next dev` is not counted by default, so your own clicking around never
reaches your reports. To see the tag while you build, set `enabled`. The
tracker also ignores `localhost` unless you add `data-allow-local` or
`data-debug` (see [Debug mode](https://privatusanalytics.com/docs/tracker/debug)):

```tsx
<PrivatusAnalyticsTag enabled extraAttributes={{ 'data-debug': 'true' }} />
```

### Leaving people out

Use `excludedPaths` for admin areas. To leave out signed-in staff, render the
tag only for other people:

```tsx
{!user?.isAdmin && <PrivatusAnalyticsTag />}
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

`eventData` gives the attributes as an object. Spread it on the element:

```tsx
import { eventData } from '@privatus-analytics/next/server'

<button type="button" {...eventData('Report exported', { format: 'csv', source: 'toolbar' })}>Export</button>
```

It renders:

```html
<button type="button" data-privatus-event="Report exported" data-privatus-prop-format="csv" data-privatus-prop-source="toolbar">Export</button>
```

On a form, the event is sent when the form is submitted:

```tsx
<form action="/newsletter" method="post" {...eventData('Newsletter joined', { list: 'weekly' })}>
```

The rules:

* The name is trimmed and cut to 120 characters. An empty name gives nothing.
* Prop keys are made lowercase. Anything that is not a letter, a digit or `_`
  becomes `_`, so `"Report Type"` becomes `report_type`. Keys are cut to 64
  characters.
* At most 30 props. Values become text: `true`, `false`, numbers as written,
  lists joined with commas. `null` and `undefined` values are left out. Values
  are cut to 500 characters.
* React escapes every value.
* The attributes are there in every environment, even when the tag is off.
  They do nothing without the tracker, so your pages look the same in
  development and production.

### Click maps

A click map shows where people click on a page. Give the important parts a
name so they stay easy to find, even when the page changes:

```tsx
import { clickData } from '@privatus-analytics/next/server'

<a href="/pricing" {...clickData('pricing.cta')}>See plans</a>
```

A name may use letters, digits and `_ . : -`, up to 100 characters. Anything
else gives nothing, and outside production the package writes a warning with
`console.warn`.

### Page props: plan, role and other groups

Page props are sent with every pageview and event on the page. Use them to
split your reports by plan, role, app version, feature flag or account tier.
Work them out in the layout, which runs on the server for each request:

```tsx
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser()
  return (
    <html lang="en">
      <head>
        <PrivatusAnalyticsTag props={{ plan: user?.plan, role: user?.role, app_version: '2.4' }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

The tag then prints a small script before the tracker, with your nonce when
you pass one, and points the tracker at it:

```html
<script>window.privatusPageProps=function(){return {"plan":"pro","role":"admin"}}</script>
<script defer="" src="https://privatusstats.com/js/pa.js" data-site="pa_YOURSITEID" data-props="privatusPageProps"></script>
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

In a Client Component, `usePrivatus()` gives you the same calls, and they are
safe during server rendering:

```tsx
'use client'
import { usePrivatus } from '@privatus-analytics/next'

export function ExportButton() {
  const privatus = usePrivatus()
  return <button onClick={() => privatus.track('Report exported', { format: 'csv' })}>Export</button>
}
```

If your code may run before the tracker has loaded, switch on the queue stub
with `queueStub`. It prints a tiny script before the tracker that keeps your
calls in a list and sends them once the tracker is ready:

```tsx
<PrivatusAnalyticsTag queueStub />
```

The stub prints even where the tag is off (in `next dev`, with
`enabled={false}` or without a site id). Then only the stub prints: no tracker
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

## Load the tracker from the browser instead

`<PrivatusAnalytics />` adds the script in the browser after the page has
loaded, through
[`@privatus-analytics/tracker`](https://github.com/Privatus-Analytics/js/tree/main/tracker).
It works in the Pages Router too, but it starts later than the tag and has no
page props, queue stub or `enabled` setting. Use one or the other, not both.

```tsx
import { PrivatusAnalytics } from '@privatus-analytics/next'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <PrivatusAnalytics site="pa_YOURSITEID" />
      </body>
    </html>
  )
}
```

Every `@privatus-analytics/tracker` option is accepted (`spa`, `modules`,
`exclude`, `mask` and so on).

## Privacy

The script sets no cookies and stores nothing in the browser. The tag and the
event and click helpers only print HTML attributes and a small script. Keep
people out of your props and event props: no names, emails or user ids. See
the [privacy documentation](https://privatusanalytics.com/docs/privacy) for
what is collected.

If you have a privacy policy, it should say which tools handle your visitors' data. You can paste this:

> This website uses [Privatus Analytics](https://privatusanalytics.com/privacy-analytics) to count visits. It
> does not use cookies and does not follow you from one website to another. Your IP address is used for a moment
> to count visits and is never stored.

Change it to fit your site. The [privacy policy generator](https://privatusanalytics.com/tools/privacy-policy-generator)
makes a longer version with your site's name in it.

## Development

This package lives in the `next` folder of the
[Privatus Analytics JavaScript repo](https://github.com/Privatus-Analytics/js).
The tests run in Docker so your local Node does not matter. From the repo root:

```sh
./run-docker.sh
```

`example/` is a small Next.js app for the Privatus Analytics conformance tests,
which check the tag in a real browser.

## Contributing

Bug reports and pull requests are welcome at
https://github.com/Privatus-Analytics/js.

## License

MIT. See [LICENSE](LICENSE). Privatus Analytics is a product of Two Phase LLC,
Wyoming, USA.
