import { PrivatusAnalyticsTag } from '@privatus-analytics/next/server'
import { PAGE_PROPS, nonce } from '../shared'

export const metadata = { title: 'Privatus conformance' }

export default async function Layout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Forced on, so the tag prints whatever the environment. */}
        <PrivatusAnalyticsTag enabled props={PAGE_PROPS} queueStub nonce={await nonce()} />
      </head>
      <body>{children}</body>
    </html>
  )
}
