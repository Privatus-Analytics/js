import { createRequire } from 'node:module'
import crypto from 'node:crypto'
import http from 'node:http'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const helper = require('node-red-node-test-helper')
const configNode = require('../nodes/privatus-config.js')
const statsNode = require('../nodes/privatus-stats.js')
const breakdownNode = require('../nodes/privatus-breakdown.js')
const realtimeNode = require('../nodes/privatus-realtime.js')
const webhookNode = require('../nodes/privatus-webhook.js')

helper.init(require.resolve('node-red'))

// A fake Privatus Analytics API that records each request.
let api
let apiUrl
let requests = []
let reply = () => ({ status: 200, body: { data: {}, meta: {} } })

beforeAll(async () => {
  api = http.createServer((req, res) => {
    requests.push({ url: new URL(req.url, 'http://x'), headers: req.headers })
    const { status, body } = reply(req)
    res.writeHead(status, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(body))
  })
  await new Promise((resolve) => api.listen(0, '127.0.0.1', resolve))
  apiUrl = `http://127.0.0.1:${api.address().port}`
  await new Promise((resolve) => helper.startServer(resolve))
})

afterAll(async () => {
  await new Promise((resolve) => helper.stopServer(resolve))
  await new Promise((resolve) => api.close(resolve))
})

beforeEach(() => {
  requests = []
  reply = () => ({ status: 200, body: { data: {}, meta: {} } })
})

afterEach(async () => {
  await helper.unload()
})

const config = () => ({ id: 'cfg', type: 'privatus-config', name: 'Privatus Analytics', apiUrl })
const creds = { cfg: { token: 'pat_test123' } }

function nextMessage(node) {
  return new Promise((resolve) => node.on('input', resolve))
}

function nextError(node) {
  return new Promise((resolve) => {
    const original = node.error.bind(node)
    node.error = (error, msg) => {
      resolve({ error, msg })
      original(error, msg)
    }
  })
}

describe('privatus stats', () => {
  it('gets the aggregate stats with the token and puts data in msg.payload', async () => {
    const data = { period: { from: '2026-10-19', to: '2026-10-25' }, metrics: { visitors: 120, pageviews: 300 } }
    reply = () => ({ status: 200, body: { data, meta: { site_id: 'pa_ABC123' } } })
    const flow = [
      config(),
      { id: 's', type: 'privatus-stats', server: 'cfg', site: 'pa_ABC123', period: '7d', compare: 'previous_period', wires: [['out']] },
      { id: 'out', type: 'helper' },
    ]
    await helper.load([configNode, statsNode], flow, creds)
    const out = helper.getNode('out')
    const received = nextMessage(out)
    helper.getNode('s').receive({ payload: 'go' })
    const msg = await received
    expect(msg.payload).toEqual(data)
    expect(msg.meta).toEqual({ site_id: 'pa_ABC123' })
    expect(requests).toHaveLength(1)
    expect(requests[0].url.pathname).toBe('/sites/pa_ABC123/stats/aggregate.json')
    expect(requests[0].url.searchParams.get('period')).toBe('7d')
    expect(requests[0].url.searchParams.get('compare')).toBe('previous_period')
    expect(requests[0].headers.authorization).toBe('Bearer pat_test123')
  })

  it('lets the message set the site, the period, custom dates and filters', async () => {
    const flow = [
      config(),
      { id: 's', type: 'privatus-stats', server: 'cfg', site: 'pa_ABC123', period: '7d', wires: [['out']] },
      { id: 'out', type: 'helper' },
    ]
    await helper.load([configNode, statsNode], flow, creds)
    const received = nextMessage(helper.getNode('out'))
    helper.getNode('s').receive({ site: 'pa_OTHER9', period: 'custom', from: '2026-10-01', to: '2026-10-31', filters: [['country', 'is', 'US']] })
    await received
    const url = requests[0].url
    expect(url.pathname).toBe('/sites/pa_OTHER9/stats/aggregate.json')
    expect(url.searchParams.get('period')).toBe('custom')
    expect(url.searchParams.get('from')).toBe('2026-10-01')
    expect(url.searchParams.get('to')).toBe('2026-10-31')
    expect(JSON.parse(url.searchParams.get('filters'))).toEqual([['country', 'is', 'US']])
  })

  it('reports an API error with its message and status code', async () => {
    reply = () => ({ status: 401, body: { error: { code: 'unauthorized', message: 'That API token is invalid, revoked or expired.' } } })
    const flow = [config(), { id: 's', type: 'privatus-stats', server: 'cfg', site: 'pa_ABC123', period: '7d', wires: [[]] }]
    await helper.load([configNode, statsNode], flow, creds)
    const node = helper.getNode('s')
    const failed = nextError(node)
    node.receive({})
    const { error, msg } = await failed
    expect(error.message).toBe('That API token is invalid, revoked or expired.')
    expect(msg.statusCode).toBe(401)
  })

  it('refuses a bad site id or period without calling the API', async () => {
    const flow = [config(), { id: 's', type: 'privatus-stats', server: 'cfg', site: '', period: '7d', wires: [[]] }]
    await helper.load([configNode, statsNode], flow, creds)
    const node = helper.getNode('s')
    let failed = nextError(node)
    node.receive({})
    expect((await failed).error.message).toMatch(/pa_/)
    failed = nextError(node)
    node.receive({ site: 'pa_ABC123', period: 'forever' })
    expect((await failed).error.message).toMatch(/Unknown period/)
    expect(requests).toHaveLength(0)
  })

  it('asks for a token when the config node has none', async () => {
    const flow = [config(), { id: 's', type: 'privatus-stats', server: 'cfg', site: 'pa_ABC123', period: '7d', wires: [[]] }]
    await helper.load([configNode, statsNode], flow, {})
    const node = helper.getNode('s')
    const failed = nextError(node)
    node.receive({})
    expect((await failed).error.message).toMatch(/API token/)
  })
})

describe('privatus breakdown', () => {
  it('gets the top rows of a dimension with a limit', async () => {
    const data = { dimension: 'page', rows: [{ value: '/', pageviews: 50, visits: 40, share: 60 }], has_more: false }
    reply = () => ({ status: 200, body: { data, meta: {} } })
    const flow = [
      config(),
      { id: 'b', type: 'privatus-breakdown', server: 'cfg', site: 'pa_ABC123', period: 'today', dimension: 'page', limit: '5', wires: [['out']] },
      { id: 'out', type: 'helper' },
    ]
    await helper.load([configNode, breakdownNode], flow, creds)
    const received = nextMessage(helper.getNode('out'))
    helper.getNode('b').receive({})
    expect((await received).payload).toEqual(data)
    expect(requests[0].url.pathname).toBe('/sites/pa_ABC123/breakdown/page.json')
    expect(requests[0].url.searchParams.get('period')).toBe('today')
    expect(requests[0].url.searchParams.get('limit')).toBe('5')
  })

  it('takes the dimension and limit from the message', async () => {
    const flow = [
      config(),
      { id: 'b', type: 'privatus-breakdown', server: 'cfg', site: 'pa_ABC123', period: '7d', dimension: 'page', wires: [['out']] },
      { id: 'out', type: 'helper' },
    ]
    await helper.load([configNode, breakdownNode], flow, creds)
    const received = nextMessage(helper.getNode('out'))
    helper.getNode('b').receive({ dimension: 'country', limit: 5000 })
    await received
    expect(requests[0].url.pathname).toBe('/sites/pa_ABC123/breakdown/country.json')
    expect(requests[0].url.searchParams.get('limit')).toBe('1000')
  })

  it('refuses a dimension that could change the URL', async () => {
    const flow = [config(), { id: 'b', type: 'privatus-breakdown', server: 'cfg', site: 'pa_ABC123', period: '7d', wires: [[]] }]
    await helper.load([configNode, breakdownNode], flow, creds)
    const node = helper.getNode('b')
    const failed = nextError(node)
    node.receive({ dimension: '../../account' })
    expect((await failed).error.message).toMatch(/Unknown dimension/)
    expect(requests).toHaveLength(0)
  })
})

describe('privatus realtime', () => {
  it('gets the live visitors', async () => {
    const data = { live_visitors: 7, top_pages: [{ value: '/', visits: 4 }] }
    reply = () => ({ status: 200, body: { data, meta: {} } })
    const flow = [
      config(),
      { id: 'r', type: 'privatus-realtime', server: 'cfg', site: 'pa_ABC123', wires: [['out']] },
      { id: 'out', type: 'helper' },
    ]
    await helper.load([configNode, realtimeNode], flow, creds)
    const received = nextMessage(helper.getNode('out'))
    helper.getNode('r').receive({})
    expect((await received).payload.live_visitors).toBe(7)
    expect(requests[0].url.pathname).toBe('/sites/pa_ABC123/live.json')
  })
})

describe('privatus webhook', () => {
  const secret = 'whsec_abc'
  const body = JSON.stringify({ id: 'whd_1', event: 'alert.triggered', created_at: '2026-10-26T08:00:00Z', workspace_id: 'ws_1', data: { site_id: 'pa_ABC123' } })
  const signature = (t = Math.floor(Date.now() / 1000), s = secret, b = body) =>
    `t=${t},v1=${crypto.createHmac('sha256', s).update(`${t}.${b}`).digest('hex')}`

  // Node-RED serves http nodes from RED.httpNode. The test helper does not
  // expose it, so the wrapper keeps it and a small server sends requests to it.
  let httpNode
  let nodeServer
  let nodeUrl
  const wrapped = (RED) => {
    httpNode = RED.httpNode
    webhookNode(RED)
  }

  beforeAll(async () => {
    nodeServer = http.createServer((req, res) => httpNode(req, res))
    await new Promise((resolve) => nodeServer.listen(0, '127.0.0.1', resolve))
    nodeUrl = `http://127.0.0.1:${nodeServer.address().port}`
  })

  afterAll(async () => {
    await new Promise((resolve) => nodeServer.close(resolve))
  })

  function post(headers, payload = body) {
    return fetch(nodeUrl + '/privatus/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: payload,
    })
  }

  async function load() {
    const flow = [
      { id: 'w', type: 'privatus-webhook', url: '/privatus/webhook', wires: [['out']] },
      { id: 'out', type: 'helper' },
    ]
    await helper.load(wrapped, flow, { w: { secret } })
    return helper.getNode('out')
  }

  it('lets a correctly signed webhook through and replies 200', async () => {
    const out = await load()
    const received = nextMessage(out)
    const res = await post({ 'Privatus-Signature': signature(), 'Privatus-Event': 'alert.triggered', 'Privatus-Delivery': 'whd_1' })
    expect(res.status).toBe(200)
    const msg = await received
    expect(msg.payload).toEqual(JSON.parse(body))
    expect(msg.event).toBe('alert.triggered')
    expect(msg.topic).toBe('alert.triggered')
    expect(msg.delivery).toBe('whd_1')
  })

  it('refuses a wrong signature, an old time and a missing header with 401 and sends nothing', async () => {
    const out = await load()
    let sent = 0
    out.on('input', () => sent++)
    const old = Math.floor(Date.now() / 1000) - 301
    for (const header of [signature(undefined, 'whsec_wrong'), signature(old), null]) {
      const res = await post(header ? { 'Privatus-Signature': header } : {})
      expect(res.status).toBe(401)
    }
    expect(sent).toBe(0)
  })

  it('checks the exact bytes, so a re-encoded body fails', async () => {
    await load()
    const pretty = JSON.stringify(JSON.parse(body), null, 2)
    const res = await post({ 'Privatus-Signature': signature() }, pretty)
    expect(res.status).toBe(401)
  })

  it('removes its route when the flow stops', async () => {
    await load()
    await helper.unload()
    const res = await post({ 'Privatus-Signature': signature() })
    expect(res.status).toBe(404)
  })
})
