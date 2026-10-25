import { PrivatusAnalyticsTag } from '@privatus-analytics/next/server'
import { PAGE_PROPS, nonce } from '../shared'

export const metadata = { title: 'Off plain' }

// Off with the queue stub off: nothing prints.
// React moves a plain <meta> to the top of <head>. With itemProp it stays where it is,
// so the two markers sit right around what the tag printed.
export default async function Layout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="privatus-off-start" itemProp="privatus-off-start" />
        <PrivatusAnalyticsTag enabled={false} props={PAGE_PROPS} queueStub={false} nonce={await nonce()} />
        <meta name="privatus-off-end" itemProp="privatus-off-end" />
      </head>
      <body>{children}</body>
    </html>
  )
}
