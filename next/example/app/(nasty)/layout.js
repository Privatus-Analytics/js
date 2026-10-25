import { PrivatusAnalyticsTag } from '@privatus-analytics/next/server'
import { NASTY, PAGE_PROPS, nonce } from '../shared'

export const metadata = { title: 'Nasty' }

export default async function Layout({ children }) {
  return (
    <html lang="en">
      <head>
        <PrivatusAnalyticsTag enabled props={{ ...PAGE_PROPS, nasty: NASTY }} queueStub nonce={await nonce()} />
      </head>
      <body>{children}</body>
    </html>
  )
}
