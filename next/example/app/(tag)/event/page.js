import { clickData, eventData } from '@privatus-analytics/next/server'

export const metadata = { title: 'Events' }

export default function Events() {
  return (
    <>
      <h1>Events</h1>
      <button type="button" {...eventData('Report exported', { format: 'csv', source: 'toolbar' })}>
        Export report
      </button>
      <p>
        <a href="#pricing" {...clickData('pricing.cta')}>
          Pricing
        </a>
      </p>
      <form action="/event" method="get" {...eventData('Signup form')}>
        <button type="submit">Sign up</button>
      </form>
    </>
  )
}
