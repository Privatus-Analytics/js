# @privatus/react

> **Not published.** Do not install `@privatus/react` from the public npm registry.
> The `@privatus` scope on npm does not belong to Privatus Analytics, so a package with this name there is not ours.
> Build and install it from this folder until we announce the published name.

[Privatus Analytics](https://privatusanalytics.com) for React. Cookieless: no cookies, storage or device IDs. SSR-safe.

```sh
npm install @privatus/react
```

```tsx
import { PrivatusAnalytics, usePrivatus } from '@privatus/react'

export function App() {
  return (
    <>
      <PrivatusAnalytics site="pa_XXXX" />
      <Signup />
    </>
  )
}

function Signup() {
  const privatus = usePrivatus()
  return <button onClick={() => privatus.track('signup', { plan: 'pro' })}>Sign up</button>
}
```

- `<PrivatusAnalytics {...options} />` injects `pa.js` once, from an effect, and renders nothing. It accepts every [`@privatus/tracker`](../tracker) option.
- `usePrivatus(namespace?)` returns the client: `track`, `trackAsync`, `pageview`, `props`, `optOut`, `optIn`, `isOptedOut`, `ready`. Calls made before the script loads are queued.
- React Router and other `pushState` routers are tracked automatically (`spa: 'auto'`).

For Next.js, use [`@privatus/next`](../next).

MIT licensed.
