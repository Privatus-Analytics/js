/**
 * Auto inject for Node's http.ServerResponse (Express, NestJS on Express, Connect).
 * Kept apart from the main entry so packages for other runtimes never load Buffer.
 *
 * It wraps res.write and res.end. On the first write it checks the status and headers.
 * If the response may get the tag, it holds the body until res.end, puts the tag
 * before </head>, fixes Content-Length and drops the ETag. Otherwise it gets out of
 * the way at once, so streams and files pass straight through.
 */
import { canInjectInto, injectTag, shouldInject } from './inject.js'

type Chunk = string | Uint8Array
type Callback = (error?: Error | null) => void

/** The parts of http.ServerResponse this needs. */
export interface NodeResponse {
  statusCode: number
  readonly headersSent: boolean
  getHeader(name: string): number | string | string[] | undefined
  setHeader(name: string, value: number | string | readonly string[]): unknown
  removeHeader(name: string): void
  write: (...args: any[]) => boolean
  end: (...args: any[]) => unknown
}

/** The parts of http.IncomingMessage this needs. */
export interface NodeRequest {
  method?: string
  headers: Record<string, string | string[] | undefined>
}

function header(value: number | string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined
  return Array.isArray(value) ? value.join(', ') : String(value)
}

function utf8(contentType: string | undefined): boolean {
  const match = /charset\s*=\s*"?([^";\s]+)/i.exec(contentType ?? '')
  return !match || /^utf-?8$/i.test(match[1])
}

function toBuffer(chunk: Chunk, encoding?: BufferEncoding): Buffer {
  if (typeof chunk === 'string') return Buffer.from(chunk, encoding || 'utf8')
  return Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength)
}

/**
 * Wraps res.write and res.end so the tag lands before </head>. `render` is called once,
 * only for a page that can take the tag, and returns the tag HTML ('' for none).
 */
export function injectIntoNodeResponse(req: NodeRequest, res: NodeResponse, render: () => string): void {
  if ((req.method ?? 'GET').toUpperCase() !== 'GET') return
  const write = res.write
  const end = res.end
  const chunks: Buffer[] = []
  let holding: boolean | undefined

  const restore = (): void => {
    res.write = write
    res.end = end
  }
  const decide = (): boolean => {
    if (holding !== undefined) return holding
    const contentType = header(res.getHeader('content-type'))
    holding =
      !res.headersSent &&
      utf8(contentType) &&
      shouldInject({
        status: res.statusCode,
        contentType,
        contentEncoding: header(res.getHeader('content-encoding')),
        requestedWith: header(req.headers['x-requested-with']),
      })
    if (!holding) restore()
    return holding
  }

  res.write = function (this: unknown, chunk: Chunk, encoding?: BufferEncoding | Callback, callback?: Callback): boolean {
    if (!decide()) return write.apply(res, arguments as unknown as unknown[])
    if (typeof encoding === 'function') {
      callback = encoding
      encoding = undefined
    }
    if (chunk !== null && chunk !== undefined) chunks.push(toBuffer(chunk, encoding))
    if (callback) process.nextTick(callback)
    return true
  }

  res.end = function (this: unknown, chunk?: Chunk | Callback, encoding?: BufferEncoding | Callback, callback?: Callback): unknown {
    if (typeof chunk === 'function') {
      callback = chunk
      chunk = undefined
    } else if (typeof encoding === 'function') {
      callback = encoding
      encoding = undefined
    }
    if (!decide()) return end.apply(res, arguments as unknown as unknown[])
    restore()
    if (chunk !== null && chunk !== undefined) chunks.push(toBuffer(chunk, encoding as BufferEncoding | undefined))
    let body = Buffer.concat(chunks)
    const html = body.toString('utf8')
    if (canInjectInto(html)) {
      const changed = injectTag(html, render())
      if (changed !== html) {
        body = Buffer.from(changed, 'utf8')
        // The ETag was made from the page without the tag.
        if (!res.headersSent) res.removeHeader('etag')
      }
    }
    if (!res.headersSent) res.setHeader('content-length', body.length)
    return callback ? end.call(res, body, callback) : end.call(res, body)
  }
}
