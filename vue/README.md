# @privatus/vue

> **Not published.** Do not install `@privatus/vue` from the public npm registry.
> The `@privatus` scope on npm does not belong to Privatus Analytics, so a package with this name there is not ours.
> Build and install it from this folder until we announce the published name.

[Privatus Analytics](https://privatusanalytics.com) for Vue 3. Cookieless: no cookies, storage or device IDs. SSR-safe.

```sh
npm install @privatus/vue
```

```ts
import { createApp } from 'vue'
import { createPrivatus } from '@privatus/vue'

createApp(App).use(createPrivatus({ site: 'pa_XXXX' })).mount('#app')
```

```vue
<script setup lang="ts">
import { usePrivatus } from '@privatus/vue'
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

Vue Router navigations are tracked automatically. For Nuxt, use [`@privatus/nuxt`](../nuxt).

MIT licensed.
