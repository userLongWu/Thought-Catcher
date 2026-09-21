import { useEffect, useRef, useState } from 'react'
import { deleteThought, saveGeneratedThought, type ThoughtRecord } from '../db/database'
import { generateExpressions } from '../lib/aiClient'
import { ThoughtEditor } from './ThoughtEditor'

interface ThoughtCardProps { thought: ThoughtRecord }

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(date)
}

export function ThoughtCard({ thought }: ThoughtCardProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState('')
  const [notice, setNotice] = useState('')
  const deletionPending = useRef(false)
  const generationPending = useRef(false)
  const generationVersion = useRef(0)
  const controller = useRef<AbortController | null>(null)
  const deleteButton = useRef<HTMLButtonElement>(null)
  const editButton = useRef<HTMLButtonElement>(null)
  const mode = thought.generationMode ?? 'mock'

  useEffect(() => () => {
    generationVersion.current++
    controller.current?.abort()
  }, [])

  function cancelGeneration() {
    generationVersion.current++
    controller.current?.abort()
    generationPending.current = false
    setIsGenerating(false)
  }

  async function regenerate() {
    if (generationPending.current || isEditing || isDeleting) return
    setGenerationError('')
    setNotice('')
    if (thought.originalText.length > 5000) {
      setGenerationError('AI 生成最多支持 5,000 字原文。请编辑缩短后重试，当前笔记不会被截断。')
      return
    }
    generationPending.current = true
    setIsGenerating(true)
    const version = ++generationVersion.current
    const request = new AbortController()
    controller.current = request
    const snapshot = thought
    try {
      const generated = await generateExpressions(snapshot.originalText, request.signal)
      if (version !== generationVersion.current) return
      await saveGeneratedThought(snapshot, generated, request.signal)
      if (version === generationVersion.current) setNotice('AI 表达已更新。')
    } catch (error) {
      if (version === generationVersion.current) setGenerationError(error instanceof Error ? error.message : '生成失败，请重试。')
    } finally {
      if (version === generationVersion.current) {
        generationPending.current = false
        setIsGenerating(false)
      }
    }
  }

  async function handleDelete() {
    if (thought.id === undefined || deletionPending.current) return
    deletionPending.current = true
    setIsDeleting(true)
    setDeleteError(null)
    try { await deleteThought(thought.id) }
    catch (error) { setDeleteError(error instanceof Error ? error.message : String(error)) }
    finally { deletionPending.current = false; setIsDeleting(false) }
  }

  return (
    <article className="thought-card break-words rounded-2xl border border-neutral-800 bg-neutral-950/70 p-5 shadow-[0_12px_32px_rgba(0,0,0,0.28)] backdrop-blur">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">💡 我的中文念头</p>
          <h3 className="mt-2 whitespace-pre-wrap text-xl font-medium leading-8 text-white">{thought.originalText}</h3>
        </div>
        <time className="shrink-0 text-sm text-neutral-500" dateTime={thought.createdAt.toISOString()}>{formatTimestamp(thought.createdAt)}</time>
      </header>
      <p className="mt-4 text-xs leading-5 text-neutral-400">
        {mode === 'mock' ? '模拟 AI 示例 · 以下内容由固定模板生成，不是真实翻译或语法建议。' : mode === 'manual' ? '原文笔记 · 尚未生成 AI 表达。' : `AI 生成 · ${thought.generationModel ?? '模型未记录'} · 结果仅供参考，请核对。`}
      </p>
      {thought.updatedAt ? <p className="mt-1 text-xs text-neutral-500">更新于 {thought.updatedAt.toLocaleString('zh-CN')}</p> : null}
      {mode !== 'manual' ? (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            ['🗣 口语表达 (Casual)', thought.translatedCasual],
            ['👔 正式表达 (Formal)', thought.translatedFormal],
            ['🧠 表达说明 (Notes)', thought.grammarNotes],
          ].map(([label, value]) => (
            <section key={label} className="min-w-0 rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4">
              <h4 className="text-sm text-neutral-400">{label}{mode === 'mock' ? ' · 模拟内容' : ''}</h4>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-neutral-100">{value || '暂无内容'}</p>
            </section>
          ))}
        </div>
      ) : null}
      {thought.tags.length > 0 ? (
        <footer className="mt-4 flex flex-wrap gap-2">
          {[...new Set(thought.tags)].map((tag) => <span key={tag} className="max-w-full rounded-full border border-neutral-800 px-3 py-1 text-xs text-neutral-400">#{tag}</span>)}
        </footer>
      ) : null}
      {thought.id !== undefined ? (
        <div className="mt-5 border-t border-neutral-800 pt-4">
          <div className="flex flex-wrap gap-2">
            <button ref={editButton} type="button" disabled={isEditing || isDeleting || isConfirmingDelete} onClick={() => { cancelGeneration(); setGenerationError(''); setNotice(''); setIsEditing(true) }} className="min-h-11 rounded-lg border border-neutral-700 px-3 py-2 text-sm disabled:opacity-40">编辑念头</button>
            <button type="button" disabled={isGenerating || isEditing || isDeleting || isConfirmingDelete} onClick={() => { void regenerate() }} className="min-h-11 rounded-lg border border-neutral-700 px-3 py-2 text-sm disabled:opacity-40">{isGenerating ? '正在生成…' : mode === 'manual' ? '生成 AI 表达' : '重新生成 AI 表达'}</button>
            {isGenerating ? <button type="button" onClick={() => { cancelGeneration(); setNotice('已取消生成，保留原记录。') }} className="min-h-11 rounded-lg px-3 py-2 text-sm text-neutral-400">取消生成</button> : null}
            <button ref={deleteButton} type="button" disabled={isEditing || isGenerating || isDeleting} onClick={() => { setIsConfirmingDelete(true); setDeleteError(null) }} aria-expanded={isConfirmingDelete} className="min-h-11 rounded-lg px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-800 hover:text-red-200 disabled:opacity-40">删除念头</button>
          </div>
          {isEditing ? <ThoughtEditor thought={thought} onClose={() => { setIsEditing(false); requestAnimationFrame(() => editButton.current?.focus()) }} /> : null}
          {generationError ? <p role="alert" className="mt-3 text-sm text-red-200">生成失败，原记录已保留：{generationError}</p> : null}
          <p role="status" className="mt-2 text-sm text-neutral-400">{isGenerating ? '正在请求 AI 服务，完成后会更新表达并合并标签，保留已有标签。' : notice}</p>
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
