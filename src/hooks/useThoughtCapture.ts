import { useRef, useState } from 'react'
import { type ThoughtDraft } from '../db/database'
import { generateExpressions } from '../lib/aiClient'

interface UseThoughtCaptureOptions {
  addThought: (thought: ThoughtDraft) => Promise<number>
}

export interface UseThoughtCaptureResult {
  inputValue: string
  isSubmitting: boolean
  submitError: Error | null
  setInputValue: (value: string) => void
  submitThought: (mode: 'ai' | 'manual') => Promise<boolean>
}

export function useThoughtCapture({
  addThought,
}: UseThoughtCaptureOptions): UseThoughtCaptureResult {
  const [inputValue, setInputValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<Error | null>(null)
  const submissionPending = useRef(false)

  async function submitThought(mode: 'ai' | 'manual'): Promise<boolean> {
    const originalText = inputValue.trim()
    if (!originalText || submissionPending.current) {
      return false
    }

    submissionPending.current = true
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const translation = mode === 'ai' ? await generateExpressions(originalText) : null

      await addThought({
        originalText,
        translatedCasual: translation?.translatedCasual ?? '',
        translatedFormal: translation?.translatedFormal ?? '',
        grammarNotes: translation?.grammarNotes ?? '',
        tags: translation?.tags ?? [],
        generationMode: mode,
        generationModel: translation?.model,
      })

      setInputValue('')
      return true
    } catch (error) {
      setSubmitError(error instanceof Error ? error : new Error(String(error)))
      return false
    } finally {
      submissionPending.current = false
      setIsSubmitting(false)
    }
  }

  return {
    inputValue,
    isSubmitting,
    submitError,
    setInputValue,
    submitThought,
  }
}
