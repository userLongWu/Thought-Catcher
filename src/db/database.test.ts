import 'fake-indexeddb/auto'
import { parseEditedTags } from '../lib/thoughts'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  addThought,
  clearThoughts,
  deleteThought,
  db,
  getThoughts,
  updateThoughtText,
  saveGeneratedThought,
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

  it('retains records after reopening local storage and persists deletion', async () => {
    const id = await addThought(makeThought({ originalText: '刷新后仍在' }))
    db.close()
    await db.open()
    expect(await getThoughts()).toEqual([expect.objectContaining({ id, originalText: '刷新后仍在' })])
    await deleteThought(id)
    db.close()
    await db.open()
    expect(await getThoughts()).toEqual([])
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


describe('thought edits and regeneration', () => {
  beforeEach(async () => { await clearThoughts() })

  it('clears outdated output when original text changes without changing identity or creation date', async () => {
    await addThought(makeThought({ generationMode: 'ai', generationModel: 'fixture-model' }))
    const [before] = await getThoughts()
    await updateThoughtText(before, '  新的原文  ', [' a ', 'a', 'b'])
    const [after] = await getThoughts()
    expect(after).toMatchObject({ id: before.id, createdAt: before.createdAt, originalText: '新的原文', translatedCasual: '', translatedFormal: '', grammarNotes: '', generationMode: 'manual', tags: ['a', 'b'] })
    expect(after.generationModel).toBeUndefined()
    expect(after.updatedAt).toBeInstanceOf(Date)
  })

  it.each([false, true])('preserves comma-containing tags when tag input is unchanged (text edit: %s)', async (changeText) => {
    const tags = ['工作,生活', 'AI，学习']
    await addThought(makeThought({ tags }))
    const [before] = await getThoughts()
    const tagInput = tags.join(', ')
    await updateThoughtText(before, changeText ? '只修改了原文' : before.originalText, parseEditedTags(tagInput, before.tags))
    const [after] = await getThoughts()
    expect(after.tags).toEqual(tags)
    expect(after.originalText).toBe(changeText ? '只修改了原文' : before.originalText)
  })

  it('keeps existing AI or legacy provenance when only tags change', async () => {
    for (const generationMode of [undefined, 'ai'] as const) {
      await clearThoughts()
      await addThought(makeThought({ generationMode, generationModel: generationMode ? 'fixture-model' : undefined }))
      const [before] = await getThoughts()
      await updateThoughtText(before, before.originalText, ['new'])
      const [after] = await getThoughts()
      expect(after).toMatchObject({ translatedCasual: before.translatedCasual, grammarNotes: before.grammarNotes, generationMode: before.generationMode, generationModel: before.generationModel, tags: ['new'] })
    }
  })

  it('rejects stale regeneration and stale edits after another edit, preserving the latest record', async () => {
    await addThought(makeThought())
    const [before] = await getThoughts()
    await updateThoughtText(before, '另一处更新', ['new'])
    const generated = { translatedCasual: 'new AI', translatedFormal: 'formal', grammarNotes: 'notes', tags: ['ai'], model: 'fixture-model' }
    await expect(saveGeneratedThought(before, generated)).rejects.toThrow('已在其他位置修改')
    await expect(updateThoughtText(before, '过期修改', [])).rejects.toThrow('已在其他位置修改')
    expect((await getThoughts())[0].originalText).toBe('另一处更新')
  })

  it('writes explicit generation with model provenance and refuses to recreate deleted records', async () => {
    await addThought(makeThought())
    const [before] = await getThoughts()
    const generated = { translatedCasual: 'new AI', translatedFormal: 'formal', grammarNotes: 'notes', tags: ['ai'], model: 'fixture-model' }
    await saveGeneratedThought(before, generated)
    expect((await getThoughts())[0]).toMatchObject({ originalText: before.originalText, createdAt: before.createdAt, generationMode: 'ai', generationModel: 'fixture-model', translatedCasual: 'new AI' })
    await deleteThought(before.id!)
    await expect(saveGeneratedThought(before, generated)).rejects.toThrow('已被删除')
    expect(await getThoughts()).toEqual([])
  })

  it('preserves user tags before merging generated tags up to the 30-tag limit', async () => {
    const originalTags = Array.from({ length: 29 }, (_, index) => `user-${index}`)
    await addThought(makeThought({ tags: originalTags }))
    const [before] = await getThoughts()
    await saveGeneratedThought(before, { translatedCasual: 'new', translatedFormal: 'formal', grammarNotes: 'notes', tags: ['user-0', 'new-ai', 'overflow'], model: 'fixture' })
    expect((await getThoughts())[0].tags).toEqual([...originalTags, 'new-ai'])
  })

  it('rolls back cancellation after the callback finishes but before transaction commit', async () => {
    await addThought(makeThought())
    const [before] = await getThoughts()
    const controller = new AbortController()
    const transaction = db.transaction.bind(db)
    const spy = vi.spyOn(db, 'transaction').mockImplementation(((mode: 'rw', table: typeof db.thoughts, scope: () => Promise<void>) => transaction(mode, table, async () => {
      await scope()
      controller.abort()
    })) as typeof db.transaction)
    try {
      await expect(saveGeneratedThought(before, { translatedCasual: 'new', translatedFormal: 'formal', grammarNotes: 'notes', tags: [], model: 'fixture' }, controller.signal)).rejects.toThrow()
    } finally {
      spy.mockRestore()
    }
    expect(await getThoughts()).toEqual([before])
  })

  it('does not write a cancelled AI response', async () => {
    await addThought(makeThought())
    const [before] = await getThoughts()
    const controller = new AbortController()
    controller.abort()
    await expect(saveGeneratedThought(before, { translatedCasual: 'new', translatedFormal: 'formal', grammarNotes: 'notes', tags: [], model: 'fixture' }, controller.signal)).rejects.toThrow('已取消')
    expect(await getThoughts()).toEqual([before])
  })

  it('rejects blank text and excessive tags without writing', async () => {
    await addThought(makeThought())
    const [before] = await getThoughts()
    await expect(updateThoughtText(before, '  ', [])).rejects.toThrow()
    await expect(updateThoughtText(before, 'new', ['a'.repeat(81)])).rejects.toThrow()
    expect(await getThoughts()).toEqual([before])
  })
})
