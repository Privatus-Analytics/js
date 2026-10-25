// Gatsby finds the APIs in this file by reading it, not by running it, so each one
// is named here. The code is in dist/ (built from src/gatsby-ssr.ts).
const ssr = require('./dist/gatsby-ssr.js')

exports.onRenderBody = ssr.onRenderBody
exports.headComponents = ssr.headComponents
