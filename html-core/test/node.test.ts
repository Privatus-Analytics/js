import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it } from 'vitest'
import { injectIntoNodeResponse } from '../src/node.js'

const TAG = '<script defer src="https://privatusstats.com/js/pa.js" data-site="pa_X"></script>'
let close: (() => void) | undefined

afterEach(() => close?.())

async function serve(handler: (req: IncomingMessage, res: ServerResponse) => void): Promise<string> {
  const server = createServer((req, res) => {
    injectIntoNodeResponse(req, res, () => TAG)
    handler(req, res)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  close = () => server.close()
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`
}

describe('injectIntoNodeResponse', () => {
  it('adds the tag to a page written in parts and fixes Content-Length', async () => {
    const url = await serve((_req, res) => {
      res.setHeader('content-type', 'text/html; charset=utf-8')
      res.setHeader('content-length', '999')
      res.setHeader('etag', 'W/"old"')
      res.write('<html><head><title>Café</title>')
      res.write(Buffer.from('</head>'))
      res.end('<body>hi</body></html>')
    })
    const response = await fetch(url)
    const body = await response.text()
    expect(body).toBe(`<html><head><title>Café</title>${TAG}\n</head><body>hi</body></html>`)
    expect(response.headers.get('content-length')).toBe(String(Buffer.byteLength(body)))
    expect(response.headers.get('etag')).toBeNull()
  })

  it('leaves other responses alone', async () => {
    const url = await serve((req, res) => {
      if (req.url === '/json') {
        res.setHeader('content-type', 'application/json')
        res.end('{"head":"</head>"}')
      } else if (req.url === '/missing') {
        res.statusCode = 404
        res.setHeader('content-type', 'text/html')
        res.end('<head></head>')
      } else if (req.url === '/latin1') {
        res.setHeader('content-type', 'text/html; charset=iso-8859-1')
        res.end('<head></head>')
      } else if (req.url === '/written-head') {
        res.writeHead(200, { 'content-type': 'text/html' })
        res.end('<head></head>')
      } else {
        res.setHeader('content-type', 'text/html')
        res.end('<head></head>')
      }
    })
    expect(await (await fetch(`${url}/json`)).text()).toBe('{"head":"</head>"}')
    expect(await (await fetch(`${url}/missing`)).text()).toBe('<head></head>')
    expect(await (await fetch(`${url}/latin1`)).text()).toBe('<head></head>')
    expect(await (await fetch(`${url}/written-head`)).text()).toBe('<head></head>')
    expect(await (await fetch(`${url}/`, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })).text()).toBe('<head></head>')
    expect(await (await fetch(`${url}/`, { method: 'POST' })).text()).toBe('<head></head>')
    expect(await (await fetch(`${url}/`)).text()).toBe(`${TAG}\n</head>`.replace(/^/, '<head>'))
  })

  it('passes end callbacks through', async () => {
    let called = false
    const url = await serve((_req, res) => {
      res.setHeader('content-type', 'text/html')
      res.end('<head></head>', () => {
        called = true
      })
    })
    await (await fetch(url)).text()
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(called).toBe(true)
  })
})
