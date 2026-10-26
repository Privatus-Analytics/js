# @privatus-analytics/astro

> **Not published yet.** Build and install `@privatus-analytics/astro` from this folder until the first release.
> The `@privatus` scope on npm belongs to another organisation, so packages under that scope are not ours.

**Simple, private website analytics for your Astro site.** No cookies, honest numbers, and a dashboard you understand in seconds.

## Why Privatus Analytics

**Google Analytics is slow, confusing and hungry for data.** It sends what your visitors do to Google. In many countries it needs a cookie pop-up (the box that asks visitors to accept cookies), and everyone who clicks "reject" is lost from your numbers.

**Privatus Analytics fixes that.** It counts visits to your Astro site without cookies and never stores IP addresses. Bots are filtered out before they are counted, and your data is never sold or shared.

- **A dashboard you understand in seconds.** Visitors, top pages and where people came from, all on one screen.
- **No cookie pop-up needed for our analytics.** We set no cookies and store no personal data. Laws differ by country, so check your own legal advice.
- **A fast site.** The tracking script is about 3 KB, tiny next to most tracking tags.

**Start free.** The Free plan has 10,000 events a month and 3 sites, with no card. [Create your account](https://privatusanalytics.com).

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
