# @privatus-analytics/react

> **Not published yet.** Build and install `@privatus-analytics/react` from this folder until the first release.
> The `@privatus` scope on npm belongs to another organisation, so `@privatus/...` packages there are not ours.

[Privatus Analytics](https://privatusanalytics.com) for React. Cookieless: no cookies, storage or device IDs. SSR-safe.

```sh
npm install @privatus-analytics/react
```

```tsx
import { PrivatusAnalytics, usePrivatus } from '@privatus-analytics/react'

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

- `<PrivatusAnalytics {...options} />` injects `pa.js` once, from an effect, and renders nothing. It accepts every [`@privatus-analytics/tracker`](../tracker) option.
- `usePrivatus(namespace?)` returns the client: `track`, `trackAsync`, `pageview`, `props`, `optOut`, `optIn`, `isOptedOut`, `ready`. Calls made before the script loads are queued.
- React Router and other `pushState` routers are tracked automatically (`spa: 'auto'`).

For Next.js, use [`@privatus-analytics/next`](../next).

MIT licensed.
