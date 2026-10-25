import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// The example loads the built package, so this runs after `npm run build`.
const built = existsSync(new URL('../dist/index.js', import.meta.url))

describe.skipIf(!built)('example.js', () => {
  it('serves a page with the tag, an event button and a click name', async () => {
    // @ts-expect-error the example is plain JavaScript
    const { build } = await import('../example.js')
    const app = await build({ siteId: 'pa_EXAMPLE' })
    const body = (await app.inject('/')).body
    expect(body).toContain('data-site="pa_EXAMPLE"')
    expect(body).toContain('data-privatus-event="Report exported"')
    expect(body).toContain('data-privatus-click="pricing.cta"')
  })
})
