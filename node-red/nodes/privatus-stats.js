'use strict'

const { checkSite, periodQuery } = require('../lib/api')
const { queryNode } = require('../lib/query-node')

module.exports = function (RED) {
  function PrivatusStatsNode(config) {
    RED.nodes.createNode(this, config)
    const node = this
    node.site = config.site
    node.period = config.period
    node.compare = config.compare
    node.from = config.from
    node.to = config.to
    queryNode(RED, node, config, (msg) => {
      const site = checkSite(msg.site || node.site)
      return { path: `/sites/${site}/stats/aggregate.json`, query: periodQuery(msg, node) }
    })
  }

  RED.nodes.registerType('privatus-stats', PrivatusStatsNode)
}
