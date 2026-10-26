# @privatus-analytics/svelte

**Real visitor numbers for your Svelte or SvelteKit app. No cookies, no cookie pop-up, no bots.**

You want to know if people use your Svelte or SvelteKit app. But Google
Analytics uses cookies, so in many countries you must show a cookie pop-up first
(the box that asks visitors to say yes to cookies). Many people click no, so
they never show up in your numbers. Bots add fake visits on top.

This package adds the Privatus Analytics script to Svelte and SvelteKit apps,
with a use:privatus action to track events. The script sets no cookies and keeps
no IP addresses. Bots are filtered out before they are counted.

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

- Adds the Privatus Analytics tracking script to Svelte and SvelteKit apps, with a `use:privatus` action for events.
- Sets no cookies, uses no storage and no device ids.

## Install

```sh
npm install @privatus-analytics/svelte
```

## SvelteKit: server-rendered script via a `handle` hook

```ts
// src/hooks.server.ts
import { privatusHandle } from '@privatus-analytics/svelte'
export const handle = privatusHandle({ site: 'pa_XXXX' })
// with other hooks: export const handle = sequence(privatusHandle({ site: 'pa_XXXX' }), yourHandle)
```

The hook puts the tracker `<script>` right before `</head>`. Client-side navigations are tracked automatically.

## Plain Svelte

```svelte
<script>
  import { onMount } from 'svelte'
  import { initPrivatus } from '@privatus-analytics/svelte'
  onMount(() => initPrivatus({ site: 'pa_XXXX' }))
</script>
```

## Events: `use:privatus` action

```svelte
<script>
  import { privatus, getClient } from '@privatus-analytics/svelte'
</script>

<button use:privatus={{ name: 'signup', props: { plan: 'pro' } }}>Sign up</button>
<form use:privatus={{ name: 'contact', on: 'submit' }}>…</form>
<button on:click={() => getClient().track('upgrade')}>Upgrade</button>
```

The action is a plain function, so it works on Svelte 3, 4 and 5 without compiling anything.

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
