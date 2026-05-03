import { LoaderCircle, Sparkles } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface CommandPaletteProps {
  value: string
  isSubmitting: boolean
  onValueChange: (value: string) => void
  onSubmit: () => Promise<void>
}

export function CommandPalette({
  value,
  isSubmitting,
  onValueChange,
  onSubmit,
}: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isSubmitting) {
      inputRef.current?.focus()
    }
  }, [isSubmitting])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-md">
      <form
        className="group w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl transition duration-200 focus-within:-translate-y-0.5 focus-within:border-neutral-600"
        onSubmit={handleSubmit}
      >
        <div className="flex min-h-24 items-center gap-4 px-5 py-4 sm:px-6">
          <Sparkles className="h-6 w-6 shrink-0 text-neutral-400" aria-hidden="true" />

          <input
            ref={inputRef}
            autoFocus
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            disabled={isSubmitting}
            placeholder="输入一个中文念头"
            className="min-w-0 flex-1 border-0 bg-transparent text-2xl text-white outline-none placeholder:text-neutral-500 disabled:cursor-wait sm:text-3xl"
          />

          {isSubmitting ? (
            <LoaderCircle className="h-6 w-6 shrink-0 animate-spin text-neutral-300" aria-hidden="true" />
          ) : null}
        </div>
      </form>
    </div>
  )
}
