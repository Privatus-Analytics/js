// Calls the Privatus Analytics REST API from the Directus app in the browser.
// Docs: https://privatusanalytics.com/docs/api

export const API_URL = 'https://privatusanalytics.com'
export const SITE_ID = /^pa_[A-Za-z0-9]+$/

export const PERIODS = [
  { text: 'Today', value: 'today' },
  { text: 'Yesterday', value: 'yesterday' },
  { text: 'Last 24 hours', value: '24h' },
  { text: 'Last 7 days', value: '7d' },
  { text: 'Last 30 days', value: '30d' },
  { text: 'Last 90 days', value: '90d' },
  { text: 'Month to date', value: 'mtd' },
  { text: 'Last month', value: 'last_month' },
  { text: 'Year to date', value: 'ytd' },
  { text: 'Last 12 months', value: '12mo' },
] as const

export interface Metrics {
  visitors: number
  visits: number
  pageviews: number
  views_per_visit: number
  bounce_rate: number
  visit_duration: number
}

export interface PageRow {
  value: string
  pageviews: number
  visits: number
  share: number
}

export interface Insights {
  metrics: Metrics
  change: Partial<Record<keyof Metrics, number | null>> | null
  pages: PageRow[]
}

export interface InsightsOptions {
  token?: string | null
  siteId?: string | null
  period?: string | null
  topPages?: number | null
}

export class InsightsError extends Error {
  status: number
  constructor(message: string, status = 0) {
    super(message)
    this.name = 'InsightsError'
    this.status = status
  }
}

type Fetch = (input: string, init?: RequestInit) => Promise<Response>

async function getJson(fetchImpl: Fetch, url: string, token: string): Promise<any> {
  let response: Response
  try {
    response = await fetchImpl(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
  } catch {
    throw new InsightsError('Could not reach Privatus Analytics. Check your connection.')
  }
  let body: any = null
  try {
    body = await response.json()
  } catch {
    body = null
  }
  if (!response.ok) {
    const message = body?.error?.message || `Privatus Analytics responded with status ${response.status}.`
    throw new InsightsError(message, response.status)
  }
  return body?.data ?? body
}

export async function loadInsights(options: InsightsOptions, fetchImpl: Fetch = (input, init) => fetch(input, init)): Promise<Insights> {
  const token = String(options.token || '').trim()
  const siteId = String(options.siteId || '').trim()
  if (!token) throw new InsightsError('Add your Privatus Analytics API token in the panel settings.')
  if (!SITE_ID.test(siteId)) throw new InsightsError('Add your site id (it starts with pa_) in the panel settings.')
  const period = PERIODS.some((p) => p.value === options.period) ? String(options.period) : '7d'
  const limit = Math.min(Math.max(Math.round(Number(options.topPages ?? 5)) || 0, 0), 50)

  const base = `${API_URL}/sites/${siteId}`
  const [aggregate, breakdown] = await Promise.all([
    getJson(fetchImpl, `${base}/stats/aggregate.json?period=${period}&compare=previous_period`, token),
    limit > 0 ? getJson(fetchImpl, `${base}/breakdown/page.json?period=${period}&limit=${limit}`, token) : Promise.resolve({ rows: [] }),
  ])

  return {
    metrics: aggregate?.metrics ?? { visitors: 0, visits: 0, pageviews: 0, views_per_visit: 0, bounce_rate: 0, visit_duration: 0 },
    change: aggregate?.change ?? null,
    pages: Array.isArray(breakdown?.rows) ? breakdown.rows : [],
  }
}

export function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat().format(Number(value || 0))
}

export function formatChange(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return ''
  const rounded = Math.round(value * 10) / 10
  return `${rounded > 0 ? '+' : ''}${rounded}%`
}
