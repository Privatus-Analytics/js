# @privatus/next

> **Not published.** Do not install `@privatus/next` from the public npm registry.
> The `@privatus` scope on npm does not belong to Privatus Analytics, so a package with this name there is not ours.
> Build and install it from this folder until we announce the published name.

[Privatus Analytics](https://privatusanalytics.com) for Next.js (App Router and Pages Router). This package is cookieless: no cookies, no storage and no device IDs.

```sh
npm install @privatus/next
```

## Component (`app/layout.tsx`)

```tsx
import { PrivatusAnalytics } from '@privatus/next'

export default function RootLayout({ children }) {
  return (
    <html><body>
      {children}
      <PrivatusAnalytics site="pa_XXXX" />
    </body></html>
  )
}
```

The component loads `https://privatusanalytics.com/js/pa.js`, and hits go to `https://privatusanalytics.com/api/event`. Every `@privatus/tracker` option is accepted (`spa`, `modules`, `exclude`, `mask`, …). Client-side navigations are tracked automatically.

```tsx
'use client'
import { usePrivatus } from '@privatus/next'

export function Upgrade() {
  const privatus = usePrivatus()
  return <button onClick={() => privatus.track('upgrade', { plan: 'pro' })}>Upgrade</button>
}
```

MIT licensed.
