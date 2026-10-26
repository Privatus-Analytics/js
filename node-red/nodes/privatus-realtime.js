'use strict'

const { checkSite } = require('../lib/api')
const { queryNode } = require('../lib/query-node')

module.exports = function (RED) {
  function PrivatusRealtimeNode(config) {
    RED.nodes.createNode(this, config)
    const node = this
    node.site = config.site
    queryNode(RED, node, config, (msg) => {
      const site = checkSite(msg.site || node.site)
      const query = { limit: 10 }
      if (Array.isArray(msg.filters) && msg.filters.length) query.filters = JSON.stringify(msg.filters)
      return { path: `/sites/${site}/live.json`, query }
    })
  }

  RED.nodes.registerType('privatus-realtime', PrivatusRealtimeNode)
}
