// A small Fastify app with Privatus Analytics. Run it with:
//   npm run build && PRIVATUS_SITE_ID=pa_YOURSITEID node example.js
// then open http://localhost:3000 and view the page source.
import Fastify from 'fastify'
import privatus, { eventAttrs, clickAttr } from './dist/index.js'

export async function build(options = {}) {
  const app = Fastify()
  // enabled: true shows the tag outside production too. Leave it out in a real app.
  await app.register(privatus, { enabled: true, props: { plan: 'free' }, ...options })

  app.get('/', async (_request, reply) => {
    reply.type('text/html')
    return `<!doctype html>
<html>
  <head><title>Privatus example</title>${reply.privatusAnalyticsTag()}</head>
  <body>
    <button ${eventAttrs('Report exported', { format: 'csv' })}>Export</button>
    <a href="/pricing" ${clickAttr('pricing.cta')}>See plans</a>
  </body>
</html>`
  })
  return app
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = await build()
  await app.listen({ port: 3000 })
  console.log('Listening on http://localhost:3000')
}
