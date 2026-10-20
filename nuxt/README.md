# @privatus/nuxt

> **Not published.** Do not install `@privatus/nuxt` from the public npm registry.
> The `@privatus` scope on npm does not belong to Privatus Analytics, so a package with this name there is not ours.
> Build and install it from this folder until we announce the published name.

Nuxt 3 module for [Privatus Analytics](https://privatusanalytics.com). Cookieless: no cookies, storage or device IDs.

```sh
npm install @privatus/nuxt
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@privatus/nuxt'],
  privatus: { site: 'pa_XXXX' }, // or set NUXT_PUBLIC_PRIVATUS_SITE / PRIVATUS_SITE at build time
})
```

The module server-renders the tracker `<script>` into `<head>` through `app.head.script`, and Vue Router navigations are tracked automatically. Every [`@privatus/tracker`](../tracker) option is accepted under `privatus` (`spa`, `modules`, `exclude`, `mask`, `api`, …). If no site ID is configured, the module logs a warning and adds nothing.

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
