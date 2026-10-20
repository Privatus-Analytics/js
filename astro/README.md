# @privatus/astro

> **Not published.** Do not install `@privatus/astro` from the public npm registry.
> The `@privatus` scope on npm does not belong to Privatus Analytics, so a package with this name there is not ours.
> Build and install it from this folder until we announce the published name.

Astro integration for [Privatus Analytics](https://privatusanalytics.com). Cookieless: no cookies, storage or device IDs.

```sh
npm install @privatus/astro
```

```js
// astro.config.mjs
import { defineConfig } from 'astro/config'
import privatus from '@privatus/astro'

export default defineConfig({
  integrations: [privatus({ site: 'pa_XXXX' })],
})
```

The integration adds a small inline loader to every page's `<head>`. The loader sets up the queue stub and injects `pa.js` once. It works with static builds, SSR and view transitions (navigations are tracked through `pushState`). Every [`@privatus/tracker`](../tracker) option is accepted.

To track custom events from client scripts:

```astro
<button id="signup">Sign up</button>
<script>
  import { track } from '@privatus/astro'
  document.getElementById('signup')?.addEventListener('click', () => track('signup', { plan: 'pro' }))
</script>
```

Without any JavaScript, you can also use `<a data-privatus-event="signup" data-privatus-prop-plan="pro">`.

MIT licensed.
