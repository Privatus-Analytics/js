'use strict'

const { buildTag, isOn } = require('./lib/tag')

const SETTINGS_KEY = 'privatus-analytics'

// NodeBB modules are loaded from the NodeBB install when first needed.
// Tests swap them with plugin._setDeps().
let deps = null
function nodebb() {
  if (!deps) {
    deps = {
      meta: require.main.require('./src/meta'),
      user: require.main.require('./src/user'),
      routeHelpers: require.main.require('./src/routes/helpers'),
    }
  }
  return deps
}

const plugin = {}

plugin._setDeps = (value) => {
  deps = value
}

plugin.init = async function ({ router }) {
  nodebb().routeHelpers.setupAdminPageRoute(router, '/admin/plugins/privatus-analytics', [], (req, res) => {
    res.render('admin/plugins/privatus-analytics', { title: 'Privatus Analytics' })
  })
}

plugin.addAdminNavigation = async function (header) {
  header.plugins.push({
    route: '/plugins/privatus-analytics',
    icon: 'fa-bar-chart',
    name: 'Privatus Analytics',
  })
  return header
}

// Puts the script tag in the <head> of every forum page (not the admin panel).
// NodeBB themes print customHTML in the <head>, so the tag goes in front of it.
plugin.addTrackingScript = async function (hookData) {
  const data = hookData.templateData || hookData.templateValues
  if (!data) return hookData

  const settings = (await nodebb().meta.settings.get(SETTINGS_KEY)) || {}
  const tag = buildTag(settings.siteId)
  if (!tag) return hookData

  if (isOn(settings.skipAdmins)) {
    const uid = hookData.req && hookData.req.uid
    const isAdmin = typeof data.isAdmin === 'boolean'
      ? data.isAdmin
      : uid > 0 && await nodebb().user.isAdministrator(uid)
    if (isAdmin) return hookData
  }

  const existing = data.useCustomHTML ? (data.customHTML || '') : ''
  data.useCustomHTML = true
  data.customHTML = existing ? `${tag}\n${existing}` : tag
  return hookData
}

module.exports = plugin
