// The site id and script host come from PRIVATUS_SITE_ID and PRIVATUS_SCRIPT_HOST.
const { OPTIONS } = require('./src/privatus-options')

module.exports = {
  trailingSlash: 'ignore',
  plugins: [{ resolve: 'gatsby-plugin-privatus', options: OPTIONS }],
}
