# @privatus/svelte

> **Not published.** Do not install `@privatus/svelte` from the public npm registry.
> The `@privatus` scope on npm does not belong to Privatus Analytics, so a package with this name there is not ours.
> Build and install it from this folder until we announce the published name.

[Privatus Analytics](https://privatusanalytics.com) for Svelte and SvelteKit. Cookieless: no cookies, storage or device IDs.

```sh
npm install @privatus/svelte
```

## SvelteKit: server-rendered script via a `handle` hook

```ts
// src/hooks.server.ts
import { privatusHandle } from '@privatus/svelte'
export const handle = privatusHandle({ site: 'pa_XXXX' })
// with other hooks: export const handle = sequence(privatusHandle({ site: 'pa_XXXX' }), yourHandle)
```

The hook puts the tracker `<script>` right before `</head>`. Client-side navigations are tracked automatically.

## Plain Svelte

```svelte
<script>
  import { onMount } from 'svelte'
  import { initPrivatus } from '@privatus/svelte'
  onMount(() => initPrivatus({ site: 'pa_XXXX' }))
</script>
```

## Events: `use:privatus` action

```svelte
<script>
  import { privatus, getClient } from '@privatus/svelte'
</script>

<button use:privatus={{ name: 'signup', props: { plan: 'pro' } }}>Sign up</button>
<form use:privatus={{ name: 'contact', on: 'submit' }}>…</form>
<button on:click={() => getClient().track('upgrade')}>Upgrade</button>
```

The action is a plain function, so it works on Svelte 3, 4 and 5 without compiling anything.

MIT licensed.
