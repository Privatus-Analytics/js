'use strict'

// Checks the Privatus-Signature header of a Privatus Analytics webhook.
// The header looks like t=<unix seconds>,v1=<hex HMAC-SHA256 of "<t>.<raw body>">.

const crypto = require('crypto')

const TOLERANCE_SECONDS = 300

function parseHeader(header) {
  const parts = { t: null, v1: [] }
  for (const piece of String(header || '').split(',')) {
    const index = piece.indexOf('=')
    if (index < 1) continue
    const key = piece.slice(0, index).trim()
    const value = piece.slice(index + 1).trim()
    if (key === 't') parts.t = value
    if (key === 'v1') parts.v1.push(value)
  }
  return parts
}

function sign(secret, timestamp, body) {
  return crypto.createHmac('sha256', String(secret)).update(`${timestamp}.`).update(body).digest('hex')
}

// Returns { ok: true } or { ok: false, reason }.
function verify(secret, header, body, options = {}) {
  if (!secret) return { ok: false, reason: 'no secret set' }
  const { t, v1 } = parseHeader(header)
  if (!t || !/^\d+$/.test(t) || v1.length === 0) return { ok: false, reason: 'missing or malformed Privatus-Signature header' }
  const now = Math.floor((options.now ?? Date.now()) / 1000)
  const tolerance = options.tolerance ?? TOLERANCE_SECONDS
  if (Math.abs(now - Number(t)) > tolerance) return { ok: false, reason: 'timestamp is too old or in the future' }
  const expected = Buffer.from(sign(secret, t, body), 'hex')
  const match = v1.some((candidate) => {
    if (!/^[0-9a-f]+$/i.test(candidate)) return false
    const given = Buffer.from(candidate, 'hex')
    return given.length === expected.length && crypto.timingSafeEqual(given, expected)
  })
  return match ? { ok: true } : { ok: false, reason: 'signature does not match' }
}

module.exports = { TOLERANCE_SECONDS, parseHeader, sign, verify }
