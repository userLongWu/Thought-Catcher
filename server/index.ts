import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleApi, trustedHost } from './api.ts'

const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const types: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2' }
const port = Number(process.env.PORT ?? 43174)
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535')
await stat(resolve(dist, 'index.html')).catch(() => { throw new Error('Please run npm run build before npm start.') })

const server = createServer(async (request, response) => {
  if (!trustedHost(request.headers.host)) { response.writeHead(403).end('Local access only'); return }
  if (await handleApi(request, response)) return
  if (!['GET', 'HEAD'].includes(request.method ?? '')) { response.writeHead(405).end(); return }
  try {
    const path = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname)
    let file = resolve(dist, `.${path}`)
    if (!file.startsWith(resolve(dist) + sep)) file = resolve(dist, 'index.html')
    let info = await stat(file).catch(() => null)
    if (!info?.isFile() && !extname(path)) {
      file = resolve(dist, 'index.html')
      info = await stat(file)
    }
    if (!info?.isFile()) { response.writeHead(404).end('Not found'); return }
    response.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Content-Length': info.size, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache', 'Referrer-Policy': 'no-referrer' })
    if (request.method === 'HEAD') response.end()
    else createReadStream(file).on('error', () => response.destroy()).pipe(response)
  } catch { response.writeHead(400).end('Invalid request') }
})
server.requestTimeout = 15000
server.headersTimeout = 10000
server.listen(port, '127.0.0.1', () => console.log(`Thought Catcher: http://127.0.0.1:${port}`))
