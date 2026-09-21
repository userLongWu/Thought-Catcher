import { useRef, useState } from 'react'
import { updateThoughtText, type ThoughtRecord } from '../db/database'
import { parseEditedTags } from '../lib/thoughts'

interface ThoughtEditorProps {
  thought: ThoughtRecord
  onClose: () => void
}

export function ThoughtEditor({ thought, onClose }: ThoughtEditorProps) {
  // Keep the initial snapshot so a concurrent edit cannot be overwritten by this form.
  const [snapshot] = useState(thought)
  const [text, setText] = useState(thought.originalText)
  const [tags, setTags] = useState(thought.tags.join(', '))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef(false)

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current) return
    pending.current = true
    setBusy(true)
    setError('')
    try {
      await updateThoughtText(snapshot, text, parseEditedTags(tags, snapshot.tags))
      onClose()
    } catch (error) { setError(error instanceof Error ? error.message : '保存失败，请重试。') }
    finally { pending.current = false; setBusy(false) }
  }

  return (
    <form onSubmit={save} className="mt-5 space-y-3 rounded-xl border border-neutral-700 bg-neutral-900 p-4" aria-label="编辑念头">
      <label className="block text-sm text-neutral-300">原文
        <textarea autoFocus value={text} onChange={(event) => setText(event.target.value)} readOnly={busy} maxLength={20000} rows={3} className="mt-2 block w-full resize-y rounded-lg border border-neutral-600 bg-neutral-950 p-3" />
      </label>
      <label className="block text-sm text-neutral-300">标签（用逗号分隔）
        <input value={tags} onChange={(event) => setTags(event.target.value)} readOnly={busy} maxLength={2500} className="mt-2 block w-full rounded-lg border border-neutral-600 bg-neutral-950 p-3" />
      </label>
      <p className="text-xs leading-5 text-neutral-400">修改原文会清除旧生成内容，保留为原文笔记；可保存后重新生成 AI 表达。仅修改标签会保留原有表达与来源。</p>
      {error ? <p role="alert" className="text-sm text-red-200">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy || !text.trim()} className="min-h-11 rounded-lg bg-neutral-100 px-4 py-2 text-sm text-neutral-950 disabled:opacity-40">{busy ? '正在保存…' : '保存修改'}</button>
        <button type="button" disabled={busy} onClick={onClose} className="min-h-11 rounded-lg border border-neutral-600 px-4 py-2 text-sm disabled:opacity-40">取消编辑</button>
      </div>
    </form>
  )
}
