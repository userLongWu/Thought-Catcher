export interface Expressions {
  translatedCasual: string
  translatedFormal: string
  grammarNotes: string
  tags: string[]
  model: string
}

export interface AiStatus { configured: boolean; model: string | null }

export async function getAiStatus(): Promise<AiStatus> {
  const response = await fetch('/api/ai-status', { signal: AbortSignal.timeout(5000) })
  if (!response.ok) throw new Error('无法读取 AI 配置状态，请确认本地服务已启动。')
  const result = await response.json() as AiStatus
  if (typeof result.configured !== 'boolean' || (result.model !== null && typeof result.model !== 'string')) throw new Error('AI 配置响应无效，请重启本地服务。')
  return result
}

export async function generateExpressions(text: string, signal?: AbortSignal): Promise<Expressions> {
  const timeout = AbortSignal.timeout(50000)
  let response: Response
  try {
    response = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }),
      signal: signal ? AbortSignal.any([timeout, signal]) : timeout,
    })
  } catch {
    if (signal?.aborted) throw new Error('AI 请求已取消。')
    throw new Error(timeout.aborted ? 'AI 请求超时，请稍后重试。' : '无法连接本地 AI 服务，请确认服务已启动。')
  }
  let result: unknown
  try { result = await response.json() } catch { throw new Error('本地服务返回了无效内容，请重启后重试。') }
  if (!response.ok) throw new Error((result as { error?: string })?.error || 'AI 生成失败，请重试。')
  const data = result as Expressions
  if (!data || ![data.translatedCasual, data.translatedFormal, data.grammarNotes, data.model].every(value => typeof value === 'string' && value.trim()) || !Array.isArray(data.tags) || data.tags.some(tag => typeof tag !== 'string')) {
    throw new Error('AI 内容不完整，尚未保存，请重试。')
  }
  return data
}
