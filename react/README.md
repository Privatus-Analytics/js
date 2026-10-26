# @privatus-analytics/react

**Real visitor numbers for your React app. No cookies, no cookie pop-up, no bots.**

You want to know if people use your React app. But Google Analytics uses
cookies, so in many countries you must show a cookie pop-up first (the box that
asks visitors to say yes to cookies). Many people click no, so they never show
up in your numbers. Bots add fake visits on top.

This package adds the Privatus Analytics script to your React app with one
component, and gives you a hook to track events. It is safe for server-side
rendering: the script only loads in the browser. The script sets no cookies and
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

- Adds the Privatus Analytics tracking script to your React app with one component, and gives you a hook to track events.
- Sets no cookies, uses no storage and no device ids.
- Safe for server-side rendering (SSR): the script loads only in the browser.

## Install

```sh
npm install @privatus-analytics/react
```

## Usage

```tsx
import { PrivatusAnalytics, usePrivatus } from '@privatus-analytics/react'

export function App() {
  return (
    <>
      <PrivatusAnalytics site="pa_XXXX" />
      <Signup />
    </>
  )
}

function Signup() {
  const privatus = usePrivatus()
  return <button onClick={() => privatus.track('signup', { plan: 'pro' })}>Sign up</button>
}
```

- `<PrivatusAnalytics {...options} />` injects `pa.js` once, from an effect, and renders nothing. It accepts every [`@privatus-analytics/tracker`](../tracker) option.
- `usePrivatus(namespace?)` returns the client: `track`, `trackAsync`, `pageview`, `props`, `optOut`, `optIn`, `isOptedOut`, `ready`. Calls made before the script loads are queued.
- React Router and other `pushState` routers are tracked automatically (`spa: 'auto'`).

For Next.js, use [`@privatus-analytics/next`](../next).

## Privacy

The tracker sets no cookies and uses no device ids. This package only loads it. See the
[privacy documentation](https://privatusanalytics.com/docs/privacy) for what is collected.

If you have a privacy policy, it should say which tools handle your visitors' data. You can paste this:

> This website uses [Privatus Analytics](https://privatusanalytics.com/privacy-analytics) to count visits. It
> does not use cookies and does not follow you from one website to another. Your IP address is used for a moment
> to count visits and is never stored.

Change it to fit your site. The [privacy policy generator](https://privatusanalytics.com/tools/privacy-policy-generator)
makes a longer version with your site's name in it.

MIT licensed.
