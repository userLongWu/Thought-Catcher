import { useRef, useState } from 'react'
import { deleteThought, type ThoughtRecord } from '../db/database'

interface ThoughtCardProps {
  thought: ThoughtRecord
}

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function ThoughtCard({ thought }: ThoughtCardProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const deletionPending = useRef(false)
  const deleteButton = useRef<HTMLButtonElement>(null)

  async function handleDelete() {
    if (thought.id === undefined || deletionPending.current) return
    deletionPending.current = true
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await deleteThought(thought.id)
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : String(error))
    } finally {
      deletionPending.current = false
      setIsDeleting(false)
    }
  }

  return (
    <article className="thought-card break-words rounded-2xl border border-neutral-800 bg-neutral-950/70 p-5 shadow-[0_12px_32px_rgba(0,0,0,0.28)] backdrop-blur">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">💡 我的中文念头</p>
          <h3 className="mt-2 whitespace-pre-wrap text-xl font-medium leading-8 text-white">{thought.originalText}</h3>
        </div>
        <time className="shrink-0 text-sm text-neutral-500" dateTime={thought.createdAt.toISOString()}>
          {formatTimestamp(thought.createdAt)}
        </time>
      </header>

      <p className="mt-4 text-xs text-neutral-400">模拟 AI 示例 · 以下内容由固定模板生成，不是真实翻译或语法建议。</p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <span>🗣 口语示例 (Casual)</span>
            <span className="ml-2 text-xs text-neutral-500">模拟内容</span>
          </div>
          <p className="mt-3 text-sm leading-7 text-neutral-100">{thought.translatedCasual}</p>
        </section>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <span>👔 正式示例 (Formal)</span>
            <span className="ml-2 text-xs text-neutral-500">模拟内容</span>
          </div>
          <p className="mt-3 text-sm leading-7 text-neutral-100">{thought.translatedFormal}</p>
        </section>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <span>🧠 说明示例 (Grammar)</span>
            <span className="ml-2 text-xs text-neutral-500">模拟内容</span>
          </div>
          <p className="mt-3 text-sm leading-7 text-neutral-100">{thought.grammarNotes}</p>
        </section>
      </div>

      {thought.tags.length > 0 ? (
        <footer className="mt-4 flex flex-wrap gap-2">
          {thought.tags.map((tag) => (
            <span
              key={`${thought.id ?? thought.createdAt.toISOString()}-${tag}`}
              className="rounded-full border border-neutral-800 px-3 py-1 text-xs text-neutral-400"
            >
              #{tag}
            </span>
          ))}
        </footer>
      ) : null}
      {thought.id !== undefined ? (
        <div className="mt-5 border-t border-neutral-800 pt-4">
          <button ref={deleteButton} type="button" onClick={() => { setIsConfirmingDelete(true); setDeleteError(null) }} aria-expanded={isConfirmingDelete} className="min-h-11 rounded-lg px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-800 hover:text-red-200 disabled:opacity-40">删除念头</button>
          {isConfirmingDelete ? (
            <div className="mt-2 rounded-xl border border-neutral-700 bg-neutral-900 p-3" role="group" aria-label="确认删除念头">
              <p className="text-sm text-neutral-300">确定删除这条念头？删除后无法恢复。</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button type="button" autoFocus disabled={isDeleting} onClick={() => { setIsConfirmingDelete(false); setDeleteError(null); deleteButton.current?.focus() }} className="min-h-11 rounded-lg border border-neutral-600 px-4 py-2 text-sm disabled:opacity-40">取消</button>
                <button type="button" disabled={isDeleting} onClick={handleDelete} className="min-h-11 rounded-lg bg-red-950 px-4 py-2 text-sm text-red-200 disabled:opacity-40">{isDeleting ? '正在删除…' : '确认删除'}</button>
              </div>
              {deleteError ? <p role="alert" className="mt-3 text-sm text-red-200">删除失败，请重试：{deleteError}</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
