'use strict'

const { DEFAULT_API_URL } = require('../lib/api')

module.exports = function (RED) {
  function PrivatusConfigNode(config) {
    RED.nodes.createNode(this, config)
    this.name = config.name
    this.apiUrl = config.apiUrl || DEFAULT_API_URL
  }

  RED.nodes.registerType('privatus-config', PrivatusConfigNode, {
    credentials: {
      token: { type: 'password' },
    },
  })
}
