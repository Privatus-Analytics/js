# @privatus-analytics/next

> **Not published yet.** Build and install `@privatus-analytics/next` from this folder until the first release.
> The `@privatus` scope on npm belongs to another organisation, so `@privatus/...` packages there are not ours.

[Privatus Analytics](https://privatusanalytics.com) for Next.js (App Router and Pages Router). This package is cookieless: no cookies, no storage and no device IDs.

```sh
npm install @privatus-analytics/next
```

## Component (`app/layout.tsx`)

```tsx
import { PrivatusAnalytics } from '@privatus-analytics/next'

export default function RootLayout({ children }) {
  return (
    <html><body>
      {children}
      <PrivatusAnalytics site="pa_XXXX" />
    </body></html>
  )
}
```

The component loads `https://privatusstats.com/js/pa.js`, and hits go to `https://privatusstats.com/api/event`. Every `@privatus-analytics/tracker` option is accepted (`spa`, `modules`, `exclude`, `mask`, …). Client-side navigations are tracked automatically.

```tsx
'use client'
import { usePrivatus } from '@privatus-analytics/next'

export function Upgrade() {
  const privatus = usePrivatus()
  return <button onClick={() => privatus.track('upgrade', { plan: 'pro' })}>Upgrade</button>
}
```

MIT licensed.
