// The site id and script host come from PRIVATUS_SITE_ID and PRIVATUS_SCRIPT_HOST.
import { privatusTransformHead } from 'vitepress-plugin-privatus'
import { NASTY } from '../nasty.js'

const PROPS = { plan: 'pro', role: 'admin', beta: true, seats: 3 }
// Page props for each page. /nasty also gets the nasty value.
const props = ({ pageData }) => (pageData.relativePath === 'nasty.md' ? { ...PROPS, nasty: NASTY } : PROPS)

const tag = privatusTransformHead({ enabled: true, queueStub: true, props })
const offWithStub = privatusTransformHead({ enabled: false, queueStub: true, props })
const offPlain = privatusTransformHead({ enabled: false, queueStub: false, props })

export default {
  title: 'Privatus conformance',
  // On /off and /off-plain (privatusOff in the frontmatter), the tag is forced off and
  // what it prints goes between two marker tags.
  transformHead(context) {
    const off = context.pageData.frontmatter.privatusOff
    if (!off) return tag(context)
    const helper = off === 'stub' ? offWithStub : offPlain
    return [['meta', { name: 'privatus-off-start' }], ...helper(context), ['meta', { name: 'privatus-off-end' }]]
  },
}
