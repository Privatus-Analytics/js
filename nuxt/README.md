# @privatus-analytics/nuxt

> **Not published yet.** Build and install `@privatus-analytics/nuxt` from this folder until the first release.
> The `@privatus` scope on npm belongs to another organisation, so packages under that scope are not ours.

**Simple, private website analytics for your Nuxt app.** No cookies, honest numbers, and a dashboard you understand in seconds.

## Why Privatus Analytics

**Google Analytics is slow, confusing and hungry for data.** It sends what your visitors do to Google. In many countries it needs a cookie pop-up (the box that asks visitors to accept cookies), and everyone who clicks "reject" is lost from your numbers.

**Privatus Analytics fixes that.** It counts visits to your Nuxt app without cookies and never stores IP addresses. Bots are filtered out before they are counted, and your data is never sold or shared.

- **A dashboard you understand in seconds.** Visitors, top pages and where people came from, all on one screen.
- **No cookie pop-up needed for our analytics.** We set no cookies and store no personal data. Laws differ by country, so check your own legal advice.
- **A fast app.** The tracking script is about 3 KB, tiny next to most tracking tags.

**Start free.** The Free plan has 10,000 events a month and 3 sites, with no card. [Create your account](https://privatusanalytics.com).

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
