'use strict'

// Shared input handler for the nodes that call the API. Each node gives a
// function that turns the message into { path, query }.

const { request } = require('./api')

function queryNode(RED, node, config, build) {
  node.server = RED.nodes.getNode(config.server)

  node.on('input', async (msg, send, done) => {
    send = send || function () { node.send.apply(node, arguments) }
    done = done || function (error) { if (error) node.error(error, msg) }
    try {
      if (!node.server) throw new Error('Choose a Privatus Analytics config node with your API token')
      const { path, query } = build(msg)
      node.status({ fill: 'blue', shape: 'dot', text: 'loading' })
      const body = await request({ token: node.server.credentials && node.server.credentials.token, apiUrl: node.server.apiUrl }, path, query)
      msg.payload = body.data !== undefined ? body.data : body
      msg.meta = body.meta
      node.status({ fill: 'green', shape: 'dot', text: new Date().toLocaleTimeString() })
      send(msg)
      done()
    } catch (error) {
      msg.statusCode = error.statusCode
      node.status({ fill: 'red', shape: 'ring', text: error.statusCode ? `error ${error.statusCode}` : 'error' })
      done(error)
    }
  })
}

module.exports = { queryNode }
