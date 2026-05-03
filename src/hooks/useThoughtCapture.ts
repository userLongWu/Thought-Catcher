import { useState } from 'react'
import { type ThoughtDraft } from '../db/database'
import { mockAiTranslate } from '../lib/mockAiTranslate'

interface UseThoughtCaptureOptions {
  addThought: (thought: ThoughtDraft) => Promise<number>
}

export interface UseThoughtCaptureResult {
  inputValue: string
  isSubmitting: boolean
  submitError: Error | null
  setInputValue: (value: string) => void
  submitThought: () => Promise<boolean>
}

export function useThoughtCapture({
  addThought,
}: UseThoughtCaptureOptions): UseThoughtCaptureResult {
  const [inputValue, setInputValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<Error | null>(null)

  async function submitThought(): Promise<boolean> {
    const originalText = inputValue.trim()
    if (!originalText || isSubmitting) {
      return false
    }

    setIsSubmitting(true)
    setSubmitError(null)
    setInputValue('')

    try {
      const translation = await mockAiTranslate(originalText)

      await addThought({
        originalText,
        translatedCasual: translation.translatedCasual,
        translatedFormal: translation.translatedFormal,
        grammarNotes: translation.grammarNotes,
        tags: translation.tags,
      })

      return true
    } catch (error) {
      setInputValue(originalText)
      setSubmitError(error instanceof Error ? error : new Error(String(error)))
      return false
    } finally {
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
