import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const require = createRequire(import.meta.url)
const plugin = require('../library.js')
const { buildTag, isSiteId } = require('../lib/tag.js')
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const TAG = '<script defer src="https://privatusstats.com/js/pa.js" data-site="pa_ABC123"></script>'

let settings
let admins
beforeEach(() => {
  settings = { siteId: 'pa_ABC123', skipAdmins: 'off' }
  admins = new Set([1])
  plugin._setDeps({
    meta: { settings: { get: vi.fn(async (key) => (key === 'privatus-analytics' ? settings : {})) } },
    user: { isAdministrator: vi.fn(async (uid) => admins.has(uid)) },
    routeHelpers: { setupAdminPageRoute: vi.fn() },
  })
})

const hook = (templateData, uid = 0) => ({ req: { uid }, res: {}, templateData, templateValues: templateData, data: {} })

describe('tag', () => {
  it('prints the Privatus Analytics script tag', () => {
    expect(buildTag('pa_ABC123')).toBe(TAG)
    expect(buildTag('  pa_ABC123 ')).toBe(TAG)
  })

  it('prints nothing for an empty or unsafe site id', () => {
    expect(buildTag('')).toBe('')
    expect(buildTag(undefined)).toBe('')
    expect(buildTag('pa_x" onload="alert(1)')).toBe('')
    expect(buildTag('abc')).toBe('')
    expect(isSiteId('pa_7Q2K9XH3AB')).toBe(true)
  })
})

describe('addTrackingScript', () => {
  it('adds the tag to the head of a forum page for a guest', async () => {
    const data = { useCustomHTML: false, customHTML: '', isAdmin: false }
    await plugin.addTrackingScript(hook(data))
    expect(data.useCustomHTML).toBe(true)
    expect(data.customHTML).toBe(TAG)
  })

  it('keeps the custom HTML the forum already has', async () => {
    const data = { useCustomHTML: true, customHTML: '<meta name="x">', isAdmin: false }
    await plugin.addTrackingScript(hook(data))
    expect(data.customHTML).toBe(`${TAG}\n<meta name="x">`)
  })

  it('does not print custom HTML that the admin turned off', async () => {
    const data = { useCustomHTML: false, customHTML: '<meta name="off">', isAdmin: false }
    await plugin.addTrackingScript(hook(data))
    expect(data.customHTML).toBe(TAG)
  })

  it('works with the older templateValues name', async () => {
    const data = { useCustomHTML: false, customHTML: '' }
    await plugin.addTrackingScript({ req: { uid: 0 }, templateValues: data })
    expect(data.customHTML).toBe(TAG)
  })

  it('adds nothing without a valid site id', async () => {
    settings = { siteId: '' }
    const data = { useCustomHTML: false, customHTML: '' }
    await plugin.addTrackingScript(hook(data))
    expect(data).toEqual({ useCustomHTML: false, customHTML: '' })
    settings = { siteId: '"><script>alert(1)</script>' }
    await plugin.addTrackingScript(hook(data))
    expect(data.customHTML).toBe('')
  })

  it('counts admins when the option is off', async () => {
    const data = { useCustomHTML: false, customHTML: '', isAdmin: true }
    await plugin.addTrackingScript(hook(data, 1))
    expect(data.customHTML).toBe(TAG)
  })

  it('skips logged-in admins when the option is on, and still counts everyone else', async () => {
    settings.skipAdmins = 'on'
    const admin = { useCustomHTML: false, customHTML: '', isAdmin: true }
    await plugin.addTrackingScript(hook(admin, 1))
    expect(admin.customHTML).toBe('')
    const member = { useCustomHTML: false, customHTML: '', isAdmin: false }
    await plugin.addTrackingScript(hook(member, 2))
    expect(member.customHTML).toBe(TAG)
  })

  it('asks NodeBB who is an admin when the page data does not say', async () => {
    settings.skipAdmins = 'on'
    const admin = { useCustomHTML: false, customHTML: '' }
    await plugin.addTrackingScript(hook(admin, 1))
    expect(admin.customHTML).toBe('')
    const guest = { useCustomHTML: false, customHTML: '' }
    await plugin.addTrackingScript(hook(guest, 0))
    expect(guest.customHTML).toBe(TAG)
  })

  it('returns the hook data', async () => {
    const h = hook({ customHTML: '' })
    expect(await plugin.addTrackingScript(h)).toBe(h)
  })
})

describe('admin page', () => {
  it('adds a menu item and a route for the settings page', async () => {
    const header = { plugins: [] }
    expect(await plugin.addAdminNavigation(header)).toBe(header)
    expect(header.plugins).toEqual([{ route: '/plugins/privatus-analytics', icon: 'fa-bar-chart', name: 'Privatus Analytics' }])

    const router = {}
    const deps = { meta: {}, user: {}, routeHelpers: { setupAdminPageRoute: vi.fn() } }
    plugin._setDeps(deps)
    await plugin.init({ router, middleware: {} })
    const [r, route, middlewares, controller] = deps.routeHelpers.setupAdminPageRoute.mock.calls[0]
    expect(r).toBe(router)
    expect(route).toBe('/admin/plugins/privatus-analytics')
    expect(middlewares).toEqual([])
    const res = { render: vi.fn() }
    controller({}, res)
    expect(res.render).toHaveBeenCalledWith('admin/plugins/privatus-analytics', { title: 'Privatus Analytics' })
  })

  it('has a template for the route and form fields for both settings', () => {
    const tpl = fs.readFileSync(path.join(root, 'templates/admin/plugins/privatus-analytics.tpl'), 'utf8')
    expect(tpl).toContain('class="privatus-analytics-settings"')
    expect(tpl).toContain('name="siteId"')
    expect(tpl).toContain('name="skipAdmins"')
  })
})

describe('plugin.json', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'plugin.json'), 'utf8'))
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))

  it('matches the package and points at methods that exist', () => {
    expect(manifest.id).toBe(pkg.name)
    for (const { method } of manifest.hooks) expect(typeof plugin[method]).toBe('function')
    expect(manifest.hooks.map((h) => h.hook)).toContain('filter:middleware.renderHeader')
  })

  it('ships every file it names', () => {
    for (const file of Object.values(manifest.modules)) expect(fs.existsSync(path.join(root, file))).toBe(true)
    expect(fs.existsSync(path.join(root, manifest.templates))).toBe(true)
    expect(fs.existsSync(path.join(root, manifest.library))).toBe(true)
  })

  it('tells the NodeBB package manager which versions it works with', () => {
    expect(pkg.nbbpm.compatibility).toBe('^3.0.0 || ^4.0.0')
  })
})
