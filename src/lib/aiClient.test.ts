import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateExpressions, getAiStatus } from './aiClient'

afterEach(() => vi.unstubAllGlobals())

describe('browser AI boundary', () => {
  it('uses only the same-origin backend without any provider configuration', async () => {
    const data = { translatedCasual: 'Hi', translatedFormal: 'Hello', grammarNotes: '问候', tags: [], model: 'test' }
    const request = vi.fn(async () => new Response(JSON.stringify(data)))
    vi.stubGlobal('fetch', request)
    expect(await generateExpressions('你好')).toEqual(data)
    expect(request).toHaveBeenCalledWith('/api/generate', expect.objectContaining({ body: '{"text":"你好"}', headers: { 'Content-Type': 'application/json' } }))
  })

  it('propagates normalized errors and rejects incomplete success output', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"error":"额度不足"}', { status: 429 })))
    await expect(generateExpressions('test')).rejects.toThrow('额度不足')
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}')))
    await expect(generateExpressions('test')).rejects.toThrow('内容不完整')
    await expect(getAiStatus()).rejects.toThrow('配置响应无效')
  })
})
