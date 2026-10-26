'use strict'

// A small client for the Privatus Analytics REST API.
// Docs: https://privatusanalytics.com/docs/api

const DEFAULT_API_URL = 'https://privatusanalytics.com'
const SITE_ID = /^pa_[A-Za-z0-9]+$/
const PERIODS = [
  'today', 'yesterday', '24h', '7d', '14d', '28d', '30d', '90d', 'mtd', 'last_month',
  'qtd', 'last_quarter', 'ytd', '12mo', 'last_year', 'all', 'custom',
]
const DATE = /^\d{4}-\d{2}-\d{2}$/

class PrivatusApiError extends Error {
  constructor(message, statusCode, code) {
    super(message)
    this.name = 'PrivatusApiError'
    this.statusCode = statusCode
    this.code = code
  }
}

function checkSite(site) {
  const value = String(site || '').trim()
  if (!SITE_ID.test(value)) {
    throw new PrivatusApiError('Set a site id that starts with pa_ (in the node or in msg.site)', 0, 'invalid_site')
  }
  return value
}

// Builds the period part of a query from the node settings and the message.
// The message wins, so one node can serve many periods.
function periodQuery(msg, node) {
  const period = String(msg.period || node.period || '7d')
  if (!PERIODS.includes(period)) {
    throw new PrivatusApiError(`Unknown period "${period}". Use one of: ${PERIODS.join(', ')}`, 0, 'invalid_period')
  }
  const query = { period }
  if (period === 'custom') {
    for (const key of ['from', 'to']) {
      const value = msg[key] || node[key]
      if (value) {
        if (!DATE.test(String(value))) throw new PrivatusApiError(`msg.${key} must look like 2026-10-31`, 0, 'invalid_date')
        query[key] = String(value)
      }
    }
  }
  const compare = msg.compare || node.compare
  if (compare && compare !== 'none') query.compare = String(compare)
  if (Array.isArray(msg.filters) && msg.filters.length) query.filters = JSON.stringify(msg.filters)
  return query
}

async function request(config, path, query, options = {}) {
  if (!config || !config.token) {
    throw new PrivatusApiError('Add an API token to the Privatus Analytics config node', 0, 'missing_token')
  }
  const base = String(config.apiUrl || DEFAULT_API_URL).replace(/\/+$/, '')
  const url = new URL(base + path)
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }
  const fetchImpl = options.fetch || globalThis.fetch
  const response = await fetchImpl(url, {
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/json',
      'User-Agent': 'node-red-contrib-privatus-analytics',
    },
    signal: AbortSignal.timeout(options.timeout || 30000),
  })
  const text = await response.text()
  let body = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = null
  }
  if (!response.ok) {
    const error = body && body.error
    const message = (error && error.message) || `Privatus Analytics API responded with status ${response.status}`
    throw new PrivatusApiError(message, response.status, error && error.code)
  }
  if (!body || typeof body !== 'object') {
    throw new PrivatusApiError('Privatus Analytics API sent a response that is not JSON', response.status, 'invalid_json')
  }
  return body
}

module.exports = { DEFAULT_API_URL, PERIODS, PrivatusApiError, checkSite, periodQuery, request }
