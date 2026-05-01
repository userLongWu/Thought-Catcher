import 'fake-indexeddb/auto'

import { beforeEach, describe, expect, it } from 'vitest'
import {
  addThought,
  clearThoughts,
  deleteThought,
  getThoughts,
  type ThoughtDraft,
} from './database'

const makeThought = (overrides: Partial<ThoughtDraft> = {}): ThoughtDraft => ({
  originalText: '我想把这个想法记下来',
  translatedCasual: 'I want to jot this thought down.',
  translatedFormal: 'I would like to record this thought.',
  grammarNotes: 'Use "jot down" for a casual note-taking nuance.',
  tags: ['note'],
  ...overrides,
})

describe('thought database', () => {
  beforeEach(async () => {
    await clearThoughts()
  })

  it('stores a thought and assigns a creation date when omitted', async () => {
    const id = await addThought(makeThought())

    expect(id).toBeGreaterThan(0)

    const thoughts = await getThoughts()
    expect(thoughts).toHaveLength(1)
    expect(thoughts[0]).toMatchObject({
      id,
      originalText: '我想把这个想法记下来',
      translatedCasual: 'I want to jot this thought down.',
      translatedFormal: 'I would like to record this thought.',
      grammarNotes: 'Use "jot down" for a casual note-taking nuance.',
      tags: ['note'],
    })
    expect(thoughts[0].createdAt).toBeInstanceOf(Date)
  })

  it('returns thoughts newest first', async () => {
    await addThought(makeThought({ originalText: '旧念头', createdAt: new Date('2025-01-01') }))
    await addThought(makeThought({ originalText: '新念头', createdAt: new Date('2025-01-02') }))

    const thoughts = await getThoughts()

    expect(thoughts.map((thought) => thought.originalText)).toEqual(['新念头', '旧念头'])
  })

  it('deletes a thought by id', async () => {
    const keepId = await addThought(makeThought({ originalText: '保留' }))
    const deleteId = await addThought(makeThought({ originalText: '删除' }))

    await deleteThought(deleteId)

    const thoughts = await getThoughts()
    expect(thoughts).toHaveLength(1)
    expect(thoughts[0].id).toBe(keepId)
    expect(thoughts[0].originalText).toBe('保留')
  })
})
