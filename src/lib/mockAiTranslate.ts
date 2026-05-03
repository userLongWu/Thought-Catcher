export interface MockAiTranslationResult {
  translatedCasual: string
  translatedFormal: string
  grammarNotes: string
  tags: string[]
}

export async function mockAiTranslate(text: string): Promise<MockAiTranslationResult> {
  const normalizedText = text.trim()

  return new Promise((resolve) => {
    globalThis.setTimeout(() => {
      resolve({
        translatedCasual: `I'd say: "${normalizedText}" means I want to say this in a natural, everyday way.`,
        translatedFormal: `A more formal rendering of "${normalizedText}" would fit a deliberate written or professional context.`,
        grammarNotes:
          'The casual line sounds spoken and direct. The formal line is more explicit and structured, which is usually how English writing marks intent more clearly.',
        tags: ['mock-ai', 'daily-thought', normalizedText.length > 12 ? 'long-form' : 'quick-note'],
      })
    }, 1500)
  })
}
