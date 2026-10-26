# @privatus-analytics/astro

**Real visitor numbers for your Astro site. No cookies, no cookie pop-up, no bots.**

You want to know if people visit your Astro site. But Google Analytics uses
cookies, so in many countries you must show a cookie pop-up first (the box that
asks visitors to say yes to cookies). Many people click no, so they never show
up in your numbers. Bots add fake visits on top.

This Astro integration adds the Privatus Analytics script to every page, with a
track() helper for events. The script sets no cookies and keeps no IP addresses.
Bots are filtered out before they are counted.

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

- An Astro integration that adds the Privatus Analytics tracking script to every page, with a `track()` helper for events.
- Sets no cookies, uses no storage and no device ids.

## Install

```sh
npm install @privatus-analytics/astro
```

## Usage

```js
// astro.config.mjs
import { defineConfig } from 'astro/config'
import privatus from '@privatus-analytics/astro'

export default defineConfig({
  integrations: [privatus({ site: 'pa_XXXX' })],
})
```

The integration adds a small inline loader to every page's `<head>`. The loader sets up the queue stub and injects `pa.js` once. It works with static builds, SSR and view transitions (navigations are tracked through `pushState`). Every [`@privatus-analytics/tracker`](../tracker) option is accepted.

To track custom events from client scripts:

```astro
<button id="signup">Sign up</button>
<script>
  import { track } from '@privatus-analytics/astro'
  document.getElementById('signup')?.addEventListener('click', () => track('signup', { plan: 'pro' }))
</script>
```

Without any JavaScript, you can also use `<a data-privatus-event="signup" data-privatus-prop-plan="pro">`.

## Privacy

The tracker sets no cookies and uses no device ids. This integration only loads it. See the
[privacy documentation](https://privatusanalytics.com/docs/privacy) for what is collected.

If you have a privacy policy, it should say which tools handle your visitors' data. You can paste this:

> This website uses [Privatus Analytics](https://privatusanalytics.com/privacy-analytics) to count visits. It
> does not use cookies and does not follow you from one website to another. Your IP address is used for a moment
> to count visits and is never stored.

Change it to fit your site. The [privacy policy generator](https://privatusanalytics.com/tools/privacy-policy-generator)
makes a longer version with your site's name in it.

MIT licensed.
