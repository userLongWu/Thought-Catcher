import type { IncomingMessage, ServerResponse } from 'node:http'
import { ApiError, aiStatus, generateExpressionsOnServer, type AiEnvironment } from './ai.ts'

export function trustedHost(host: string | undefined) {
  if (!host) return false
  try {
    const url = new URL(`http://${host}`)
    return ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && url.host === host && url.pathname === '/' && !url.username && !url.password
  } catch { return false }
}

function json(response: ServerResponse, status: number, value: unknown) {
  if (response.destroyed) return
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' })
  response.end(JSON.stringify(value))
}

function readBody(request: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    let total = 0
    const chunks: Buffer[] = []
    const timer = setTimeout(() => reject(new ApiError(408, '请求读取超时，请重试。')), 10000)
    request.on('data', (chunk: Buffer) => {
      total += chunk.length
      if (total > 32 * 1024) { chunks.length = 0; clearTimeout(timer); reject(new ApiError(413, '请求过大，请缩短原文。')) }
      else chunks.push(chunk)
    })
    request.on('end', () => { clearTimeout(timer); resolve(Buffer.concat(chunks).toString('utf8')) })
    request.on('error', () => { clearTimeout(timer); reject(new ApiError(400, '请求未完整接收，请重试。')) })
    request.on('aborted', () => { clearTimeout(timer); reject(new ApiError(400, '请求已取消。')) })
  })
}

export async function handleApi(request: IncomingMessage, response: ServerResponse, env: AiEnvironment = process.env): Promise<boolean> {
  const path = request.url?.split('?')[0] ?? ''
  if (path !== '/api' && !path.startsWith('/api/')) return false
  try {
    if (!trustedHost(request.headers.host)) throw new ApiError(403, '仅允许本机访问。')
    if (request.headers.origin) {
      const expected = `http://${request.headers.host}`
      if (request.headers.origin !== expected) throw new ApiError(403, '请求来源不受信任。')
    }
    if (path === '/api/ai-status' && request.method === 'GET') {
      json(response, 200, aiStatus(env))
      return true
    }
    if (path !== '/api/generate') throw new ApiError(404, '接口不存在。')
    if (request.method !== 'POST') throw new ApiError(405, '请使用 POST 请求。')
    if (!request.headers.origin) throw new ApiError(403, '请求缺少来源信息。')
    if (request.headers['content-type']?.split(';')[0].trim() !== 'application/json') throw new ApiError(415, '仅支持 JSON 请求。')
    if (Number(request.headers['content-length'] ?? 0) > 32 * 1024) throw new ApiError(413, '请求过大，请缩短原文。')
    const body = await readBody(request)
    let data: unknown
    try { data = JSON.parse(body) } catch { throw new ApiError(400, '请求不是有效 JSON。') }
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new ApiError(400, '请求格式不正确。')
    const controller = new AbortController()
    const onClose = () => { if (!response.writableEnded) controller.abort() }
    response.on('close', onClose)
    try {
      const output = await generateExpressionsOnServer((data as { text?: unknown }).text, env, { signal: controller.signal })
      json(response, 200, output)
    } finally { response.off('close', onClose) }
  } catch (error) {
    json(response, error instanceof ApiError ? error.status : 500, { error: error instanceof ApiError ? error.message : '服务遇到问题，请重试。' })
  }
  return true
}
