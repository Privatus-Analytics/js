// The site id and script host come from PRIVATUS_SITE_ID and PRIVATUS_SCRIPT_HOST.
// build.sh sets EXAMPLE_BUILD to main, nasty, off or off-plain.
const { NASTY } = require('./src/nasty')

const BUILD = process.env.EXAMPLE_BUILD || 'main'
const PROPS = { plan: 'pro', role: 'admin', beta: true, seats: 3 }
const OFF = BUILD === 'off' || BUILD === 'off-plain'

// A tiny local plugin that adds one marker tag to the head. On /off and /off-plain the
// privatus plugin sits between two of them, so the suite can see exactly what it printed.
function marker(name) {
  return () => ({
    name: `marker-${name}`,
    injectHtmlTags: () => ({ headTags: [{ tagName: 'meta', attributes: { name } }] }),
  })
}

const privatus = [
  'docusaurus-plugin-privatus',
  {
    enabled: !OFF,
    queueStub: BUILD !== 'off-plain',
    props: BUILD === 'nasty' ? { ...PROPS, nasty: NASTY } : PROPS,
  },
]

module.exports = {
  title: 'Privatus conformance',
  url: 'http://example-app:8080',
  baseUrl: '/',
  onBrokenLinks: 'warn',
  plugins: [
    '@docusaurus/plugin-content-pages',
    ...(OFF ? [marker('privatus-off-start'), privatus, marker('privatus-off-end')] : [privatus]),
  ],
}
