# @privatus-analytics/vue

> **Not published yet.** Build and install `@privatus-analytics/vue` from this folder until the first release.
> The `@privatus` scope on npm belongs to another organisation, so packages under that scope are not ours.

**Simple, private website analytics for your Vue app.** No cookies, honest numbers, and a dashboard you understand in seconds.

## Why Privatus Analytics

**Google Analytics is slow, confusing and hungry for data.** It sends what your visitors do to Google. In many countries it needs a cookie pop-up (the box that asks visitors to accept cookies), and everyone who clicks "reject" is lost from your numbers.

**Privatus Analytics fixes that.** It counts visits to your Vue app without cookies and never stores IP addresses. Bots are filtered out before they are counted, and your data is never sold or shared.

- **A dashboard you understand in seconds.** Visitors, top pages and where people came from, all on one screen.
- **No cookie pop-up needed for our analytics.** We set no cookies and store no personal data. Laws differ by country, so check your own legal advice.
- **A fast app.** The tracking script is about 3 KB, tiny next to most tracking tags.

**Start free.** The Free plan has 10,000 events a month and 3 sites, with no card. [Create your account](https://privatusanalytics.com).

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
