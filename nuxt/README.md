# @privatus-analytics/nuxt

> **Not published yet.** Build and install `@privatus-analytics/nuxt` from this folder until the first release.
> The `@privatus` scope on npm belongs to another organisation, so `@privatus/...` packages there are not ours.

Nuxt 3 module for [Privatus Analytics](https://privatusanalytics.com). Cookieless: no cookies, storage or device IDs.

```sh
npm install @privatus-analytics/nuxt
```

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

MIT licensed.
