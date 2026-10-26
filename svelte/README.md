# @privatus-analytics/svelte

> **Not published yet.** Build and install `@privatus-analytics/svelte` from this folder until the first release.
> The `@privatus` scope on npm belongs to another organisation, so packages under that scope are not ours.

**Simple, private website analytics for your Svelte or SvelteKit app.** No cookies, honest numbers, and a dashboard you understand in seconds.

## Why Privatus Analytics

**Google Analytics is slow, confusing and hungry for data.** It sends what your visitors do to Google. In many countries it needs a cookie pop-up (the box that asks visitors to accept cookies), and everyone who clicks "reject" is lost from your numbers.

**Privatus Analytics fixes that.** It counts visits to your Svelte or SvelteKit app without cookies and never stores IP addresses. Bots are filtered out before they are counted, and your data is never sold or shared.

- **A dashboard you understand in seconds.** Visitors, top pages and where people came from, all on one screen.
- **No cookie pop-up needed for our analytics.** We set no cookies and store no personal data. Laws differ by country, so check your own legal advice.
- **A fast app.** The tracking script is about 3 KB, tiny next to most tracking tags.

**Start free.** The Free plan has 10,000 events a month and 3 sites, with no card. [Create your account](https://privatusanalytics.com).

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
