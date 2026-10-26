'use strict'

const { verify, TOLERANCE_SECONDS } = require('../lib/signature')

const MAX_BODY_BYTES = 1024 * 1024

// Reads the raw request body. The signature covers the exact bytes, so the
// body must not be parsed first.
function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body)
  if (typeof req.body === 'string') return Promise.resolve(Buffer.from(req.body, 'utf8'))
  if (req.readableEnded || req.complete) {
    return Promise.reject(Object.assign(new Error('The request body was already read by other middleware'), { status: 500 }))
  }
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Body too large'), { status: 413 }))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function normalizePath(url) {
  let path = String(url || '').trim()
  if (!path.startsWith('/')) path = '/' + path
  return path
}

module.exports = function (RED) {
  function PrivatusWebhookNode(config) {
    RED.nodes.createNode(this, config)
    const node = this

    if (RED.settings.httpNodeRoot === false) {
      node.warn('HTTP nodes are turned off in this Node-RED (httpNodeRoot is false), so the webhook cannot listen')
      node.status({ fill: 'red', shape: 'ring', text: 'http off' })
      return
    }

    node.url = normalizePath(config.url || '/privatus/webhook')
    const secret = node.credentials && node.credentials.secret
    if (!secret) node.status({ fill: 'yellow', shape: 'ring', text: 'no secret' })

    const handler = async (req, res) => {
      let raw
      try {
        raw = await readRawBody(req)
      } catch (error) {
        res.status(error.status || 400).json({ error: error.message })
        return
      }
      const check = verify(secret, req.get('privatus-signature'), raw, { tolerance: TOLERANCE_SECONDS })
      if (!check.ok) {
        node.warn(`Rejected a webhook: ${check.reason}`)
        node.status({ fill: 'red', shape: 'ring', text: 'bad signature' })
        res.status(401).json({ error: 'invalid signature' })
        return
      }
      let payload
      try {
        payload = JSON.parse(raw.toString('utf8'))
      } catch {
        res.status(400).json({ error: 'body is not JSON' })
        return
      }
      res.status(200).json({ received: true })
      const event = req.get('privatus-event') || (payload && payload.event)
      node.status({ fill: 'green', shape: 'dot', text: event || 'received' })
      node.send({
        _msgid: RED.util.generateId(),
        topic: event,
        event,
        delivery: req.get('privatus-delivery') || (payload && payload.id),
        payload,
        headers: req.headers,
      })
    }

    const errorHandler = (error, req, res, next) => {
      node.warn(error)
      res.sendStatus(500)
    }

    RED.httpNode.post(node.url, handler, errorHandler)

    node.on('close', () => {
      const router = RED.httpNode._router || RED.httpNode.router
      if (!router || !router.stack) return
      for (let i = router.stack.length - 1; i >= 0; i--) {
        const layer = router.stack[i]
        if (layer.route && layer.route.path === node.url && layer.route.methods && layer.route.methods.post) {
          router.stack.splice(i, 1)
        }
      }
    })
  }

  RED.nodes.registerType('privatus-webhook', PrivatusWebhookNode, {
    credentials: {
      secret: { type: 'password' },
    },
  })
}
