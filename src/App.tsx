import { useEffect, useState } from 'react'
import { CommandPalette } from './components/CommandPalette'
import { TimelineView } from './components/TimelineView'
import { addThought } from './db/database'
import { useThoughtCapture } from './hooks/useThoughtCapture'

function App() {
  const [isPaletteOpen, setIsPaletteOpen] = useState(true)
  const { inputValue, isSubmitting, submitError, setInputValue, submitThought } =
    useThoughtCapture({
      addThought,
    })

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isPaletteShortcut = event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)

      if (isPaletteShortcut) {
        event.preventDefault()
        setIsPaletteOpen((currentValue) => !currentValue)
        return
      }

      if (event.key === 'Escape') {
        setIsPaletteOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  async function handlePaletteSubmit() {
    const didSaveThought = await submitThought()

    if (didSaveThought) {
      setIsPaletteOpen(false)
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-neutral-100 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-5xl">
        <header className="flex items-center justify-between border-b border-neutral-900 pb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">Thought Catcher</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Timeline</h1>
          </div>
        </header>

        {isPaletteOpen ? (
          <CommandPalette
            value={inputValue}
            isSubmitting={isSubmitting}
            onValueChange={setInputValue}
            onSubmit={handlePaletteSubmit}
          />
        ) : null}

        {submitError ? (
          <div className="mt-4 rounded-2xl border border-red-900/60 bg-red-950/20 px-4 py-3 text-sm text-red-200">
            Failed to capture thought: {submitError.message}
          </div>
        ) : null}

        <TimelineView />
      </section>
    </main>
  )
}

export default App
