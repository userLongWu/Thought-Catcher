import { useRef, useState } from 'react'
import { getThoughts } from '../db/database'
import { createBackup, MAX_BACKUP_BYTES, restoreBackup } from '../lib/backup'

export function DataTools() {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const pending = useRef(false)

  async function run(action: () => Promise<void>) {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    setError('')
    setMessage('')
    try { await action() } catch (error) { setError(error instanceof Error ? error.message : '操作失败，请重试。') }
    finally { pending.current = false; setBusy(false) }
  }

  function download() {
    void run(async () => {
      const thoughts = await getThoughts()
      const url = URL.createObjectURL(new Blob([createBackup(thoughts)], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `thought-catcher-${new Date().toISOString().slice(0, 10)}.json`
      document.body.append(link)
      link.click()
      link.remove()
      // Let the browser consume the download URL before releasing it.
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setMessage(`已导出 ${thoughts.length} 条念头，不含 AI 服务配置或密钥。`)
    })
  }

  async function restore(file?: File) {
    if (!file) return
    await run(async () => {
      if (file.size > MAX_BACKUP_BYTES) throw new Error('备份文件不能超过 10 MB。')
      const counts = await restoreBackup(await file.text())
      setMessage(`恢复完成：新增 ${counts.added} 条，跳过重复 ${counts.duplicates} 条，保留现有冲突 ${counts.conflicts} 条。`)
    })
    if (fileInput.current) fileInput.current.value = ''
  }

  return (
    <div className="mt-5 border-t border-neutral-800 pt-4">
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={busy} onClick={download} className="min-h-11 rounded-lg border border-neutral-700 px-4 py-2 text-sm disabled:opacity-40">导出 JSON 备份</button>
        <button type="button" disabled={busy} onClick={() => fileInput.current?.click()} className="min-h-11 rounded-lg border border-neutral-700 px-4 py-2 text-sm disabled:opacity-40">恢复 JSON 备份</button>
        <input ref={fileInput} type="file" accept=".json,application/json" className="hidden" aria-label="选择 JSON 备份" onChange={(event) => { void restore(event.target.files?.[0]) }} />
      </div>
      <p className="mt-2 text-xs leading-5 text-neutral-400">备份包含全部念头。恢复会合并数据，跳过重复项；与恢复前记录相同 ID 的冲突保留当前记录；新增记录分配本地 ID，不会覆盖。最多 10 MB / 10,000 条。</p>
      <p role="status" className="mt-2 text-sm text-neutral-300">{busy ? '正在处理备份…' : message}</p>
      {error ? <p role="alert" className="mt-2 break-words text-sm text-red-200">{error}</p> : null}
    </div>
  )
}
