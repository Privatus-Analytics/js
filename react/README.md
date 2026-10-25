# @privatus-analytics/react

> **Not published yet.** Build and install `@privatus-analytics/react` from this folder until the first release.
> The `@privatus` scope on npm belongs to another organisation, so packages under that scope are not ours.

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
