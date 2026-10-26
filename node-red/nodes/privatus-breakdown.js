'use strict'

const { PrivatusApiError, checkSite, periodQuery } = require('../lib/api')
const { queryNode } = require('../lib/query-node')

const DIMENSION = /^(?:[a-z_]+|prop:[A-Za-z0-9_.-]+)$/

module.exports = function (RED) {
  function PrivatusBreakdownNode(config) {
    RED.nodes.createNode(this, config)
    const node = this
    node.site = config.site
    node.period = config.period
    node.compare = config.compare
    node.from = config.from
    node.to = config.to
    node.dimension = config.dimension || 'page'
    node.limit = config.limit
    queryNode(RED, node, config, (msg) => {
      const site = checkSite(msg.site || node.site)
      const dimension = String(msg.dimension || node.dimension)
      if (!DIMENSION.test(dimension)) {
        throw new PrivatusApiError(`Unknown dimension "${dimension}"`, 0, 'invalid_dimension')
      }
      const query = periodQuery(msg, node)
      const limit = parseInt(msg.limit || node.limit || 10, 10)
      query.limit = Math.min(Math.max(Number.isFinite(limit) ? limit : 10, 1), 1000)
      return { path: `/sites/${site}/breakdown/${encodeURIComponent(dimension)}.json`, query }
    })
  }

  RED.nodes.registerType('privatus-breakdown', PrivatusBreakdownNode)
}
