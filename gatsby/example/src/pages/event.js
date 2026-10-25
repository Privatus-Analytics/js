import * as React from 'react'

// Gatsby has no event helper. The README shows the attributes written in JSX,
// so that is what this page does.
export default function Event() {
  return (
    <main>
      <h1>Event</h1>
      <button type="button" data-privatus-event="Report exported" data-privatus-prop-format="csv" data-privatus-prop-source="toolbar">
        Export report
      </button>
      <a href="#pricing" data-privatus-click="pricing.cta">
        Pricing
      </a>
      <form action="/event" method="get" data-privatus-event="Signup form">
        <button type="submit">Sign up</button>
      </form>
    </main>
  )
}
