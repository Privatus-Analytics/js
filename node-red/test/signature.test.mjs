import { createRequire } from 'node:module'
import crypto from 'node:crypto'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const { verify, parseHeader, sign } = require('../lib/signature.js')

const secret = 'whsec_test'
const body = '{"id":"whd_1","event":"webhook.test"}'
const now = 1761436800 * 1000
const header = (t, s = secret, b = body) =>
  `t=${t},v1=${crypto.createHmac('sha256', s).update(`${t}.${b}`).digest('hex')}`

describe('signature', () => {
  it('parses the header', () => {
    expect(parseHeader('t=12,v1=ab,v1=cd')).toEqual({ t: '12', v1: ['ab', 'cd'] })
  })

  it('signs like the Privatus Analytics server (HMAC-SHA256 of "t.body")', () => {
    expect(sign(secret, 5, Buffer.from(body))).toBe(crypto.createHmac('sha256', secret).update(`5.${body}`).digest('hex'))
  })

  it('accepts a right signature', () => {
    expect(verify(secret, header(1761436800), Buffer.from(body), { now })).toEqual({ ok: true })
  })

  it('accepts a time up to 5 minutes off, and refuses more', () => {
    expect(verify(secret, header(1761436800 - 300), body, { now }).ok).toBe(true)
    expect(verify(secret, header(1761436800 + 300), body, { now }).ok).toBe(true)
    expect(verify(secret, header(1761436800 - 301), body, { now }).ok).toBe(false)
    expect(verify(secret, header(1761436800 + 301), body, { now }).ok).toBe(false)
  })

  it('refuses a wrong secret, a changed body and a broken header', () => {
    expect(verify(secret, header(1761436800, 'whsec_other'), body, { now }).ok).toBe(false)
    expect(verify(secret, header(1761436800), body + ' ', { now }).ok).toBe(false)
    expect(verify(secret, 'v1=abc', body, { now }).ok).toBe(false)
    expect(verify(secret, 't=1761436800,v1=zz', body, { now }).ok).toBe(false)
    expect(verify(secret, undefined, body, { now }).ok).toBe(false)
    expect(verify('', header(1761436800), body, { now }).ok).toBe(false)
  })

  it('accepts any of several v1 values', () => {
    const good = header(1761436800).split(',')[1]
    expect(verify(secret, `t=1761436800,v1=${'0'.repeat(64)},${good}`, body, { now }).ok).toBe(true)
  })
})
