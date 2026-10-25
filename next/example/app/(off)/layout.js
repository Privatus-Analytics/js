import { PrivatusAnalyticsTag } from '@privatus-analytics/next/server'
import { PAGE_PROPS, nonce } from '../shared'

export const metadata = { title: 'Off' }

// Off with the queue stub on: only the stub prints, so privatus.track still works.
// React moves a plain <meta> to the top of <head>. With itemProp it stays where it is,
// so the two markers sit right around what the tag printed.
export default async function Layout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="privatus-off-start" itemProp="privatus-off-start" />
        <PrivatusAnalyticsTag enabled={false} props={PAGE_PROPS} queueStub nonce={await nonce()} />
        <meta name="privatus-off-end" itemProp="privatus-off-end" />
      </head>
      <body>{children}</body>
    </html>
  )
}
