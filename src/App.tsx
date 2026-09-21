import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { CommandPalette } from './components/CommandPalette'
import { TimelineView } from './components/TimelineView'
import { AiSettings } from './components/AiSettings'
import { addThought } from './db/database'
import { useThoughtCapture } from './hooks/useThoughtCapture'

function App() {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  const [saveNotice, setSaveNotice] = useState('')
  const newThoughtButton = useRef<HTMLButtonElement>(null)
  const { inputValue, isSubmitting, submitError, setInputValue, submitThought } =
    useThoughtCapture({ addThought })

  useEffect(() => {
    if (!isPaletteOpen) newThoughtButton.current?.focus()
  }, [isPaletteOpen])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.isComposing || event.keyCode === 229) return
      const isPaletteShortcut = event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)
      if (isPaletteShortcut || event.key === 'Escape') {
        event.preventDefault()
        if (isSubmitting) return
        if (isPaletteShortcut) {
          setSaveNotice('')
          setIsPaletteOpen((currentValue) => !currentValue)
        } else {
          setIsPaletteOpen(false)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSubmitting])

  async function handlePaletteSubmit(mode: 'ai' | 'manual') {
    if (await submitThought(mode)) {
      setSaveNotice('念头已保存到当前浏览器。')
      setIsPaletteOpen(false)
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-neutral-100 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-5xl" aria-hidden={isPaletteOpen ? true : undefined}>
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-900 pb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">Thought Catcher</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">念头时间线</h1>
            <p className="mt-2 text-sm text-neutral-400">捕捉灵感 · AI 英文表达 · 本地保存</p>
          </div>
          <button ref={newThoughtButton} type="button" onClick={() => { setSaveNotice(''); setIsPaletteOpen(true) }} className="flex min-h-11 items-center gap-2 rounded-xl bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-white"><Plus className="h-4 w-4" aria-hidden="true" />新建念头</button>
        </header>
        <p role="status" className="mt-4 text-sm text-neutral-300">{saveNotice}</p>
        <AiSettings />
        <TimelineView />
      </section>
      {isPaletteOpen ? (
        <CommandPalette
          value={inputValue}
          isSubmitting={isSubmitting}
          error={submitError}
          onValueChange={setInputValue}
          onSubmit={handlePaletteSubmit}
          onClose={() => { if (!isSubmitting) setIsPaletteOpen(false) }}
        />
      ) : null}
    </main>
  )
}

export default App
