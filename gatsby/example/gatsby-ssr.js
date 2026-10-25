// Plugin options are for the whole site. A few pages need other settings, so here
// the plugin's own scripts are swapped for headComponents() with those settings:
//   /nasty      the page props also hold the nasty value
//   /off        the tag forced off, queue stub on, between two marker tags
//   /off-plain  the tag forced off, queue stub off, between two marker tags
const React = require('react')
const { headComponents } = require('gatsby-plugin-privatus/gatsby-ssr')
const { OPTIONS, NASTY } = require('./src/privatus-options')

const marker = (name) => React.createElement('meta', { key: name, name })

function scriptsFor(path) {
  if (path === '/nasty') return headComponents({ ...OPTIONS, props: { ...OPTIONS.props, nasty: NASTY } })
  if (path === '/off' || path === '/off-plain') {
    const scripts = headComponents({ ...OPTIONS, enabled: false, queueStub: path === '/off' })
    return [marker('privatus-off-start'), ...scripts, marker('privatus-off-end')]
  }
  return null
}

exports.onPreRenderHTML = ({ pathname, getHeadComponents, replaceHeadComponents }) => {
  const scripts = scriptsFor(pathname.replace(/\/$/, ''))
  if (!scripts) return
  const head = getHeadComponents()
  const isPrivatus = (c) => typeof c?.key === 'string' && c.key.startsWith('privatus-analytics-')
  const at = head.findIndex(isPrivatus)
  const rest = head.filter((c) => !isPrivatus(c))
  rest.splice(at === -1 ? rest.length : at, 0, ...scripts)
  replaceHeadComponents(rest)
}
