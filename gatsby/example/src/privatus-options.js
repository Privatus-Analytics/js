// The plugin options, shared by gatsby-config.js and gatsby-ssr.js.
exports.OPTIONS = {
  enabled: true,
  queueStub: true,
  props: { plan: 'pro', role: 'admin', beta: true, seats: 3 },
}

// The nasty value from the conformance contract.
exports.NASTY = '</script><script>window.__pwned=1</script>\u2028\u2029&<>"\''
