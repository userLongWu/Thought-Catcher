import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockAiTranslate } from './mockAiTranslate'

describe('mockAiTranslate', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('waits 1.5 seconds before resolving mock data', async () => {
    vi.useFakeTimers()

    let settled = false
    const responsePromise = mockAiTranslate('我想把这个灵感记下来').then((response) => {
      settled = true
      return response
    })

    await vi.advanceTimersByTimeAsync(1499)
    expect(settled).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    const response = await responsePromise

    expect(settled).toBe(true)
    expect(response.translatedCasual).toContain('我想把这个灵感记下来')
    expect(response.translatedFormal).toContain('我想把这个灵感记下来')
    expect(response.grammarNotes).toContain('casual')
    expect(response.tags).toContain('mock-ai')
  })
})
