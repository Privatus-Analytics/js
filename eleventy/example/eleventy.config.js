// The site id and script host come from PRIVATUS_SITE_ID and PRIVATUS_SCRIPT_HOST.
// build.sh sets EXAMPLE_BUILD to main or auto.
import privatus from 'eleventy-plugin-privatus'

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(privatus, {
    enabled: true,
    queueStub: true,
    props: { plan: 'pro', role: 'admin', beta: true, seats: 3 },
    // The main build prints the tag with the shortcode. The auto build tests the transform.
    autoInject: process.env.EXAMPLE_BUILD === 'auto',
  })
}

export const config = { dir: { input: 'site' } }
