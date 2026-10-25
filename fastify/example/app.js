// Conformance example app for @privatus-analytics/fastify.
//
// Built by the conformance suite (https://github.com/Privatus-Analytics/conformance).
// See its CONTRACT.md for what each route must render. The site id and script
// host come from PRIVATUS_SITE_ID and PRIVATUS_SCRIPT_HOST.
import Fastify from 'fastify'
import privatus, { clickAttr, eventAttrs } from '@privatus-analytics/fastify'

const PAGE_PROPS = { plan: 'pro', role: 'admin', beta: true, seats: 3 }
const NASTY = '</script><script>window.__pwned=1</script>  &<>"\''
const NONCE = 'testnonce'
const SCRIPT_HOST = (process.env.PRIVATUS_SCRIPT_HOST || 'https://privatusstats.com').replace(/\/+$/, '')

const escape = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function page(title, head, body) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escape(title)}</title>
${head}
</head>
<body>
${body}
</body>
</html>
`
}

const app = Fastify({ logger: false })

// Where @fastify/helmet keeps its nonces (reply.cspNonce.script), with a matching
// policy. The package finds the nonce there.
app.decorateReply('cspNonce', null)
app.addHook('onRequest', async (_request, reply) => {
  reply.cspNonce = { script: NONCE, style: NONCE }
  reply.header('Content-Security-Policy', `script-src 'nonce-${NONCE}' ${SCRIPT_HOST}`)
})

// The routes that use the helper. Forced on, so the tag prints whatever the environment.
await app.register(async (pages) => {
  await pages.register(privatus, { enabled: true, queueStub: true, props: PAGE_PROPS })

  pages.get('/', async (_request, reply) => {
    reply.type('text/html; charset=utf-8')
    return page('Privatus conformance', reply.privatusAnalyticsTag(), '<h1>Home</h1>')
  })

  pages.get('/event', async (_request, reply) => {
    reply.type('text/html; charset=utf-8')
    return page(
      'Events',
      reply.privatusAnalyticsTag(),
      `<h1>Events</h1>
<button type="button" ${eventAttrs('Report exported', { format: 'csv', source: 'toolbar' })}>Export report</button>
<p><a href="#pricing" ${clickAttr('pricing.cta')}>Pricing</a></p>
<form action="/event" method="get" ${eventAttrs('Signup form')}>
  <button type="submit">Sign up</button>
</form>`,
    )
  })

  pages.get('/nasty', async (_request, reply) => {
    reply.type('text/html; charset=utf-8')
    return page(
      'Nasty',
      reply.privatusAnalyticsTag({ props: { nasty: NASTY } }),
      `<h1>Nasty values</h1>
<button type="button" ${eventAttrs('Nasty value', { nasty: NASTY })}>Nasty</button>`,
    )
  })

  // Off with the queue stub on: only the stub prints, so privatus.track still works.
  // Off with the queue stub off: nothing prints.
  for (const [path, title, queueStub] of [['/off', 'Off', true], ['/off-plain', 'Off plain', false]]) {
    pages.get(path, async (_request, reply) => {
      reply.type('text/html; charset=utf-8')
      const tag = reply.privatusAnalyticsTag({ enabled: false, queueStub })
      return page(title, `<meta name="privatus-off-start">${tag}<meta name="privatus-off-end">`, `<h1>${title}</h1>`)
    })
  }
})

// Auto inject for /auto only, in its own plugin scope, so the other routes test the helper alone.
await app.register(async (auto) => {
  await auto.register(privatus, { enabled: true, autoInject: true, locals: false })
  auto.get('/auto', async (_request, reply) => {
    reply.type('text/html; charset=utf-8')
    return page('Auto inject', '', '<h1>Auto inject</h1><p>No tag in the template. The plugin adds it.</p>')
  })
})

const port = Number(process.env.PORT || 8080)
await app.listen({ port, host: '0.0.0.0' })
console.log(`Listening on http://0.0.0.0:${port}`)
