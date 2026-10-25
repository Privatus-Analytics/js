# @privatus-analytics/astro

> **Not published yet.** Build and install `@privatus-analytics/astro` from this folder until the first release.
> The `@privatus` scope on npm belongs to another organisation, so packages under that scope are not ours.

Astro integration for [Privatus Analytics](https://privatusanalytics.com). Cookieless: no cookies, storage or device IDs.

```sh
npm install @privatus-analytics/astro
```

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
