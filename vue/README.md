# @privatus-analytics/vue

> **Not published yet.** Build and install `@privatus-analytics/vue` from this folder until the first release.
> The `@privatus` scope on npm belongs to another organisation, so `@privatus/...` packages there are not ours.

[Privatus Analytics](https://privatusanalytics.com) for Vue 3. Cookieless: no cookies, storage or device IDs. SSR-safe.

```sh
npm install @privatus-analytics/vue
```

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

MIT licensed.
