import { createServer, request as httpRequest, type Server } from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import { generateExpressionsOnServer } from './ai.ts'
import { handleApi } from './api.ts'

const servers: Server[] = []
const output = { translatedCasual: 'I want to write this down.', translatedFormal: 'I would like to record this thought.', grammarNotes: 'write down 表示记下。', tags: ['学习'] }

async function listen(server: Server) {
  servers.push(server)
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('fixture address missing')
  return `http://127.0.0.1:${address.port}`
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => {
    server.closeAllConnections()
    server.close(() => resolve())
  })))
})

describe('OpenAI-compatible HTTP boundary', () => {
  it('sends the configured bearer key only upstream and validates a real HTTP JSON response', async () => {
    let received: { url?: string; key?: string; body?: Record<string, unknown> } = {}
    const base = await listen(createServer(async (req, res) => {
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      received = { url: req.url, key: req.headers.authorization, body: JSON.parse(Buffer.concat(chunks).toString()) }
      res.end(JSON.stringify({ choices: [{ message: { content: `\`\`\`json\n${JSON.stringify(output)}\n\`\`\`` } }] }))
    }))
    const env = { AI_BASE_URL: `${base}/v1/`, AI_MODEL: 'fixture-model', AI_API_KEY: 'test-only-sentinel' }
    expect(await generateExpressionsOnServer('记下这个想法', env)).toEqual({ ...output, model: 'fixture-model' })
    expect(received.url).toBe('/v1/chat/completions')
    expect(received.key).toBe('Bearer test-only-sentinel')
    expect(received.body).toEqual({ model: 'fixture-model', messages: [expect.objectContaining({ role: 'system' }), { role: 'user', content: '记下这个想法' }] })
  })

  it.each([
    [401, { error: { message: 'test-only-sentinel' } }, '身份验证'],
    [429, { error: { code: 'insufficient_quota' } }, '额度不足'],
    [429, { error: { code: 'rate_limit_exceeded' } }, '限流'],
    [503, { error: { message: 'test-only-sentinel' } }, '暂时不可用'],
    [200, { choices: [] }, '格式不正确'],
    [200, { choices: [{ message: { content: '{"translatedCasual":"only one field"}' } }] }, '不完整'],
  ])('normalizes upstream status %s without exposing provider details', async (status, payload, hint) => {
    const base = await listen(createServer((_req, res) => { res.writeHead(status); res.end(JSON.stringify(payload)) }))
    await expect(generateExpressionsOnServer('test', { AI_BASE_URL: base, AI_MODEL: 'test', AI_API_KEY: 'test-only-sentinel' })).rejects.toThrow(hint)
  })

  it('does not follow redirects or forward a key to the redirect target', async () => {
    let hitTarget = false
    const target = await listen(createServer((_req, res) => { hitTarget = true; res.end() }))
    const base = await listen(createServer((_req, res) => { res.writeHead(302, { Location: target }); res.end('{}') }))
    await expect(generateExpressionsOnServer('test', { AI_BASE_URL: base, AI_MODEL: 'test', AI_API_KEY: 'test-key' })).rejects.toThrow('重定向')
    expect(hitTarget).toBe(false)
  })

  it('times out a stalled response without retries', async () => {
    let calls = 0
    const base = await listen(createServer(() => { calls++ }))
    await expect(generateExpressionsOnServer('test', { AI_BASE_URL: base, AI_MODEL: 'test', AI_API_KEY: 'test-key' }, { timeoutMs: 30 })).rejects.toThrow('超时')
    expect(calls).toBe(1)
  })

  it('rejects huge responses and insecure nonlocal endpoints', async () => {
    const base = await listen(createServer((_req, res) => res.end('x'.repeat(130 * 1024))))
    await expect(generateExpressionsOnServer('test', { AI_BASE_URL: base, AI_MODEL: 'test', AI_API_KEY: 'key' })).rejects.toThrow('内容过大')
    await expect(generateExpressionsOnServer('test', { AI_BASE_URL: 'http://example.com', AI_MODEL: 'test', AI_API_KEY: 'key' })).rejects.toThrow('HTTPS')
  })
})

describe('local API security and error boundaries', () => {
  it('reports configuration without returning secrets and rejects cross-origin or malformed writes', async () => {
    const env = { AI_BASE_URL: 'https://example.com/v1', AI_MODEL: 'test', AI_API_KEY: 'test-only-sentinel' }
    const base = await listen(createServer((req, res) => { void handleApi(req, res, env) }))
    const status = await fetch(`${base}/api/ai-status`)
    expect(await status.json()).toEqual({ configured: true, model: 'test' })
    const write = (headers: Record<string, string>, body = '{"text":"test"}') => fetch(`${base}/api/generate`, { method: 'POST', headers, body })
    expect((await write({ Origin: 'https://evil.example', 'Content-Type': 'application/json' })).status).toBe(403)
    expect((await write({ 'Content-Type': 'application/json' })).status).toBe(403)
    expect((await write({ Origin: base, 'Content-Type': 'text/plain' })).status).toBe(415)
    expect((await write({ Origin: base, 'Content-Type': 'application/json' }, '{')).status).toBe(400)
    expect((await write({ Origin: base, 'Content-Type': 'application/json' }, 'x'.repeat(33000))).status).toBe(413)
    const untrustedStatus = await new Promise<number | undefined>((resolve, reject) => {
      const request = httpRequest(`${base}/api/ai-status`, { headers: { Host: 'evil.example' } }, response => {
        response.resume()
        response.on('end', () => resolve(response.statusCode))
      })
      request.on('error', reject)
      request.end()
    })
    expect(untrustedStatus).toBe(403)
  })

  it('returns an actionable unconfigured response before any provider request', async () => {
    const base = await listen(createServer((req, res) => { void handleApi(req, res, {}) }))
    const response = await fetch(`${base}/api/generate`, { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' }, body: '{"text":"不会丢失原文"}' })
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: expect.stringContaining('仅保存原文') })
  })
})
