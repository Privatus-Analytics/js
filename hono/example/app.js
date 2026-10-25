// Conformance example app for @privatus-analytics/hono, on Node with @hono/node-server.
//
// Built by the conformance suite (https://github.com/Privatus-Analytics/conformance).
// See its CONTRACT.md for what each route must render. The site id and script
// host come from PRIVATUS_SITE_ID and PRIVATUS_SCRIPT_HOST.
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { html } from 'hono/html'
import { secureHeaders } from 'hono/secure-headers'
import { clickAttr, eventAttrs, privatus, privatusAnalyticsTag } from '@privatus-analytics/hono'

const PAGE_PROPS = { plan: 'pro', role: 'admin', beta: true, seats: 3 }
const NASTY = '</script><script>window.__pwned=1</script>  &<>"\''
const NONCE = 'testnonce'
const SCRIPT_HOST = (process.env.PRIVATUS_SCRIPT_HOST || 'https://privatusstats.com').replace(/\/+$/, '')

// Hono's secureHeaders middleware with a fixed nonce instead of its random NONCE.
// Like NONCE, it keeps the value in c.get('secureHeadersNonce'), where the package finds it.
const fixedNonce = (c) => {
  c.set('secureHeadersNonce', NONCE)
  return `'nonce-${NONCE}'`
}

const page = (title, head, body) => html`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
${head}
</head>
<body>
${body}
</body>
</html>
`

const app = new Hono()
app.use(
  secureHeaders({
    contentSecurityPolicy: { scriptSrc: [fixedNonce, SCRIPT_HOST] },
    // The suite serves over plain HTTP, where Chromium logs an error for this header.
    crossOriginOpenerPolicy: false,
  }),
)

// Auto inject for /auto only, so the other routes test the helper alone.
app.get('/auto', privatus({ enabled: true, autoInject: true }), (c) =>
  c.html(page('Auto inject', '', html`<h1>Auto inject</h1><p>No tag in the template. The middleware adds it.</p>`)),
)

// Forced on, so the tag prints whatever the environment.
app.use(privatus({ enabled: true, queueStub: true, props: PAGE_PROPS }))

app.get('/', (c) => c.html(page('Privatus conformance', privatusAnalyticsTag(c), html`<h1>Home</h1>`)))

app.get('/event', (c) =>
  c.html(
    page(
      'Events',
      privatusAnalyticsTag(c),
      html`<h1>Events</h1>
<button type="button" ${eventAttrs('Report exported', { format: 'csv', source: 'toolbar' })}>Export report</button>
<p><a href="#pricing" ${clickAttr('pricing.cta')}>Pricing</a></p>
<form action="/event" method="get" ${eventAttrs('Signup form')}>
  <button type="submit">Sign up</button>
</form>`,
    ),
  ),
)

app.get('/nasty', (c) =>
  c.html(
    page(
      'Nasty',
      privatusAnalyticsTag(c, { props: { nasty: NASTY } }),
      html`<h1>Nasty values</h1>
<button type="button" ${eventAttrs('Nasty value', { nasty: NASTY })}>Nasty</button>`,
    ),
  ),
)

// Off with the queue stub on: only the stub prints, so privatus.track still works.
// Off with the queue stub off: nothing prints.
for (const [path, title, queueStub] of [['/off', 'Off', true], ['/off-plain', 'Off plain', false]]) {
  app.get(path, (c) =>
    c.html(
      page(
        title,
        html`<meta name="privatus-off-start">${privatusAnalyticsTag(c, { enabled: false, queueStub })}<meta name="privatus-off-end">`,
        html`<h1>${title}</h1>`,
      ),
    ),
  )
}

const port = Number(process.env.PORT || 8080)
serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, () => console.log(`Listening on http://0.0.0.0:${port}`))
