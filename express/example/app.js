// Conformance example app for @privatus-analytics/express.
//
// Built by the conformance suite (https://github.com/Privatus-Analytics/conformance).
// See its CONTRACT.md for what each route must render. The site id and script
// host come from PRIVATUS_SITE_ID and PRIVATUS_SCRIPT_HOST.
import { fileURLToPath } from 'node:url'
import express from 'express'
import privatus from '@privatus-analytics/express'

const PAGE_PROPS = { plan: 'pro', role: 'admin', beta: true, seats: 3 }
const NASTY = '</script><script>window.__pwned=1</script>  &<>"\''
const NONCE = 'testnonce'
const SCRIPT_HOST = (process.env.PRIVATUS_SCRIPT_HOST || 'https://privatusstats.com').replace(/\/+$/, '')

const AUTO_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Auto inject</title>
</head>
<body><h1>Auto inject</h1><p>No tag in the template. The middleware adds it.</p></body>
</html>
`

const app = express()
app.set('views', fileURLToPath(new URL('./views', import.meta.url)))
app.set('view engine', 'ejs')

// What helmet's docs suggest: a nonce in res.locals.cspNonce and a matching policy.
// The package finds the nonce there.
app.use((_req, res, next) => {
  res.locals.cspNonce = NONCE
  res.set('Content-Security-Policy', `script-src 'nonce-${NONCE}' ${SCRIPT_HOST}`)
  next()
})

// Auto inject for /auto only, so the other routes test the template helper alone.
app.get('/auto', privatus({ enabled: true, autoInject: true, locals: false }), (_req, res) => {
  res.type('html').send(AUTO_PAGE)
})

// Forced on, so the tag prints whatever the environment.
app.use(privatus({ enabled: true, queueStub: true, props: PAGE_PROPS }))

app.get('/', (_req, res) => res.render('home'))
app.get('/event', (_req, res) => res.render('event'))
app.get('/nasty', (_req, res) => res.render('nasty', { nasty: NASTY }))
// Off with the queue stub on: only the stub prints, so privatus.track still works.
app.get('/off', (_req, res) => res.render('off', { title: 'Off', queueStub: true }))
// Off with the queue stub off: nothing prints.
app.get('/off-plain', (_req, res) => res.render('off', { title: 'Off plain', queueStub: false }))

const port = Number(process.env.PORT || 8080)
app.listen(port, '0.0.0.0', () => console.log(`Listening on http://0.0.0.0:${port}`))
