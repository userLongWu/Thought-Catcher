import { LoaderCircle, Sparkles, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface CommandPaletteProps {
  value: string
  isSubmitting: boolean
  error: Error | null
  onValueChange: (value: string) => void
  onSubmit: () => Promise<void>
  onClose: () => void
}

export function CommandPalette({
  value,
  isSubmitting,
  error,
  onValueChange,
  onSubmit,
  onClose,
}: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const isComposing = useRef(false)

  useEffect(() => {
    inputRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [])

  useEffect(() => {
    if (!isSubmitting) inputRef.current?.focus()
  }, [isSubmitting])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isComposing.current && !isSubmitting) await onSubmit()
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    // keyCode 229 also covers browsers that end composition before the Enter keydown.
    if (event.key === 'Enter' && (isComposing.current || event.nativeEvent.isComposing || event.keyCode === 229)) {
      event.preventDefault()
    }
    if (event.key !== 'Tab') return
    const controls = Array.from(formRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)') ?? [])
    const first = controls[0]
    const last = controls[controls.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 px-4 py-6 backdrop-blur-md">
      <form
        ref={formRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="capture-title"
        aria-describedby="capture-help"
        aria-busy={isSubmitting}
        className="max-h-[calc(100dvh-3rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-2xl sm:p-6"
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="capture-title" className="flex items-center gap-2 text-lg font-medium"><Sparkles className="h-5 w-5 text-neutral-400" aria-hidden="true" />捕捉念头</h2>
          <button type="button" onClick={onClose} disabled={isSubmitting} aria-label="关闭捕捉面板" className="rounded-lg p-3 text-neutral-400 hover:bg-neutral-800 hover:text-white disabled:opacity-40"><X className="h-5 w-5" aria-hidden="true" /></button>
        </div>
        <p id="capture-help" className="mt-2 text-sm leading-6 text-neutral-400">模拟 AI 演示：约 1.5 秒后生成示例内容，不是真实翻译。念头仅保存在当前浏览器。</p>
        <label htmlFor="thought-input" className="mt-6 block text-sm text-neutral-300">我的中文念头</label>
        <input
          id="thought-input"
          ref={inputRef}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onCompositionStart={() => { isComposing.current = true }}
          onCompositionEnd={() => { isComposing.current = false }}
          readOnly={isSubmitting}
          placeholder="输入一个中文念头"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'capture-error' : undefined}
          className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-4 text-xl text-white outline-none placeholder:text-neutral-500 focus:border-neutral-400 read-only:cursor-wait"
        />
        {error ? <p id="capture-error" role="alert" className="mt-4 break-words rounded-xl border border-red-900/60 bg-red-950/20 p-3 text-sm text-red-200">保存失败，原文已保留，请重试。{error.message}</p> : null}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-neutral-400">Enter 保存 · Esc 关闭 · Ctrl/Cmd+K 开关</p>
          <button type="submit" disabled={isSubmitting || !value.trim()} className="flex min-h-11 items-center gap-2 rounded-xl bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40">
            {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {isSubmitting ? '正在保存…' : '保存念头'}
          </button>
        </div>
        <p role="status" className="mt-3 text-sm text-neutral-400">{isSubmitting ? '正在生成模拟内容并保存，请稍候。' : ''}</p>
      </form>
    </div>
  )
}
