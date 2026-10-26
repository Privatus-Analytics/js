# @privatus-analytics/nuxt

**Real visitor numbers for your Nuxt app. No cookies, no cookie pop-up, no bots.**

You want to know if people use your Nuxt app. But Google Analytics uses cookies,
so in many countries you must show a cookie pop-up first (the box that asks
visitors to say yes to cookies). Many people click no, so they never show up in
your numbers. Bots add fake visits on top.

This Nuxt 3 module adds the Privatus Analytics script to every page, and
usePrivatus() tracks events. The script sets no cookies and keeps no IP
addresses. Bots are filtered out before they are counted.

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

- A Nuxt 3 module that adds the Privatus Analytics tracking script to every page, with `usePrivatus()` to track events.
- Sets no cookies, uses no storage and no device ids.

## Install

```sh
npm install @privatus-analytics/nuxt
```

## Usage

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@privatus-analytics/nuxt'],
  privatus: { site: 'pa_XXXX' }, // or set NUXT_PUBLIC_PRIVATUS_SITE / PRIVATUS_SITE at build time
})
```

The module server-renders the tracker `<script>` into `<head>` through `app.head.script`, and Vue Router navigations are tracked automatically. Every [`@privatus-analytics/tracker`](../tracker) option is accepted under `privatus` (`spa`, `modules`, `exclude`, `mask`, `api`, …). If no site ID is configured, the module logs a warning and adds nothing.

`usePrivatus()` is auto-imported:

```vue
<script setup>
const privatus = usePrivatus()
</script>
<template>
  <button @click="privatus.track('signup', { plan: 'pro' })">Sign up</button>
</template>
```

On the server, `usePrivatus()` returns a client whose methods do nothing.

## Privacy

The tracker sets no cookies and uses no device ids. This module only loads it. See the
[privacy documentation](https://privatusanalytics.com/docs/privacy) for what is collected.

If you have a privacy policy, it should say which tools handle your visitors' data. You can paste this:

> This website uses [Privatus Analytics](https://privatusanalytics.com/privacy-analytics) to count visits. It
> does not use cookies and does not follow you from one website to another. Your IP address is used for a moment
> to count visits and is never stored.

Change it to fit your site. The [privacy policy generator](https://privatusanalytics.com/tools/privacy-policy-generator)
makes a longer version with your site's name in it.

MIT licensed.
