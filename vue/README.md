# @privatus-analytics/vue

**Real visitor numbers for your Vue app. No cookies, no cookie pop-up, no bots.**

You want to know if people use your Vue app. But Google Analytics uses cookies,
so in many countries you must show a cookie pop-up first (the box that asks
visitors to say yes to cookies). Many people click no, so they never show up in
your numbers. Bots add fake visits on top.

This package adds the Privatus Analytics script to your Vue 3 app with one
plugin. usePrivatus() and a directive track events. The script sets no cookies
and keeps no IP addresses. Bots are filtered out before they are counted.

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

- Adds the Privatus Analytics tracking script to your Vue 3 app with one plugin, and gives you `usePrivatus()` and a directive to track events.
- Sets no cookies, uses no storage and no device ids.
- Safe for server-side rendering (SSR): the script loads only in the browser.

## Install

```sh
npm install @privatus-analytics/vue
```

## Usage

```ts
import { createApp } from 'vue'
import { createPrivatus } from '@privatus-analytics/vue'

createApp(App).use(createPrivatus({ site: 'pa_XXXX' })).mount('#app')
```

```vue
<script setup lang="ts">
import { usePrivatus } from '@privatus-analytics/vue'
const privatus = usePrivatus()
</script>

<template>
  <button @click="privatus.track('upgrade', { plan: 'pro' })">Upgrade</button>
  <a href="/pricing" v-privatus-event="{ name: 'pricing_click', props: { from: 'nav' } }">Pricing</a>
  <button v-privatus-event="'signup'">Sign up</button>
</template>
```

The plugin gives you:

- The script injection
- `usePrivatus()` (provide/inject)
- `this.$privatus`
- The `v-privatus-event` directive (click by default, or `{ on: 'submit' }`)

Vue Router navigations are tracked automatically. For Nuxt, use [`@privatus-analytics/nuxt`](../nuxt).

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
