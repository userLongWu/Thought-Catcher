import { useEffect, useState } from 'react'
import { getAiStatus, type AiStatus } from '../lib/aiClient'

export function AiSettings() {
  const [status, setStatus] = useState<AiStatus | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  async function refresh() {
    setLoading(true)
    setError('')
    try { setStatus(await getAiStatus()) } catch (err) { setError(err instanceof Error ? err.message : '读取配置失败') }
    finally { setLoading(false) }
  }
  useEffect(() => {
    let active = true
    void getAiStatus().then(
      next => { if (active) setStatus(next) },
      err => { if (active) setError(err instanceof Error ? err.message : '读取配置失败') },
    ).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  return (
    <details className="mt-5 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 text-sm text-neutral-300">
      <summary className="cursor-pointer font-medium">AI 设置 · {loading ? '正在读取' : error ? '服务连接失败' : status?.configured ? `已配置 ${status.model}` : '尚未配置'}</summary>
      <p className="mt-3 leading-6">在项目的 .env.local 中设置 AI_BASE_URL、AI_MODEL 和 AI_API_KEY，然后重启本地服务。服务地址填写到 /v1 或供应商指定的基础路径，无需添加 /chat/completions。</p>
      <p className="mt-2 leading-6">密钥由本地后端读取，不进入网页或数据备份。点击“AI 生成并保存”或“重新生成表达”时，原文会发送到你配置的服务；也可以仅保存原文。</p>
      {error && <p role="alert" className="mt-2 text-red-200">{error}</p>}
      <button type="button" disabled={loading} onClick={() => void refresh()} className="mt-3 min-h-11 rounded-lg border border-neutral-700 px-3 py-2 disabled:opacity-40">重新检查配置</button>
    </details>
  )
}
