import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db, clearThoughts, getThoughts, type ThoughtRecord } from '../db/database'
import { createBackup, parseBackup, restoreBackup } from './backup'

const record = (id: number, originalText = '保留灵感'): ThoughtRecord => ({ id, originalText, translatedCasual: '', translatedFormal: '', grammarNotes: '', tags: ['灵感'], createdAt: new Date('2026-09-21T08:00:00.000Z'), generationMode: 'manual' })
const encode = (records: ThoughtRecord[]) => createBackup(records)

beforeEach(async () => { await clearThoughts(); vi.restoreAllMocks() })

describe('backup validation and restore', () => {
  it('round trips all provenance and dates without exporting extra fields', () => {
    const original = { ...record(1), generationMode: 'ai' as const, generationModel: 'test-model', updatedAt: new Date('2026-09-21T09:00:00.000Z'), apiKey: 'never-export' }
    const backup = encode([original])
    expect(backup).not.toContain('never-export')
    const [parsed] = parseBackup(backup)
    expect(parsed).toEqual(expect.objectContaining({ generationMode: 'ai', generationModel: 'test-model', createdAt: original.createdAt, updatedAt: original.updatedAt }))
  })

  it.each([
    { version: 2 },
    { thoughts: [{ ...record(1), createdAt: 'invalid' }] },
    { thoughts: [{ ...record(1), createdAt: '2026-02-30T08:00:00.000Z' }] },
    { thoughts: [{ ...record(1), id: -1 }] },
    { thoughts: [{ ...record(1), id: Number.MAX_SAFE_INTEGER + 1 }] },
    { thoughts: [{ ...record(1), tags: [5] }] },
    { thoughts: [{ ...record(1), generationMode: 'unknown' }] },
    { apiKey: 'unexpected' },
  ])('rejects malformed backups before changing existing data: %o', async (changes) => {
    await db.thoughts.add(record(8))
    const raw = JSON.stringify({ ...JSON.parse(encode([record(2)])), ...changes })
    await expect(restoreBackup(raw)).rejects.toThrow()
    expect(await getThoughts()).toEqual([record(8)])
  })

  it('remaps maximum safe IDs without exhausting storage or breaking subsequent backups', async () => {
    expect(await restoreBackup(encode([record(Number.MAX_SAFE_INTEGER)]))).toEqual({ added: 1, duplicates: 0, conflicts: 0 })
    const nextId = await db.thoughts.add({ ...record(1, 'new1'), id: undefined })
    const anotherId = await db.thoughts.add({ ...record(1, 'new2'), id: undefined })
    expect(nextId).toBeLessThan(Number.MAX_SAFE_INTEGER)
    expect(anotherId).toBe(nextId + 1)
    const backup = createBackup(await getThoughts())
    expect(await restoreBackup(backup)).toEqual({ added: 0, duplicates: 3, conflicts: 0 })
    await clearThoughts()
    expect(await restoreBackup(backup)).toEqual({ added: 3, duplicates: 0, conflicts: 0 })
    expect(await getThoughts()).toHaveLength(3)
    expect(() => createBackup(parseBackup(backup))).not.toThrow()
  })

  it('merges new records, skips content duplicates and preserves same-ID conflicts', async () => {
    await db.thoughts.add(record(1))
    const result = await restoreBackup(encode([record(1, '冲突内容'), record(2), record(3, '新内容'), record(4, '新内容')]))
    expect(result).toEqual({ added: 1, duplicates: 2, conflicts: 1 })
    expect((await getThoughts()).map((item) => item.originalText).sort()).toEqual(['保留灵感', '新内容'].sort())
    expect(await restoreBackup(encode([record(3, '新内容')]))).toEqual({ added: 0, duplicates: 1, conflicts: 0 })
  })

  it('keeps repeated text at different creation times and ignores update time for duplicates', async () => {
    const first = record(1)
    await db.thoughts.add(first)
    const later = { ...record(2), createdAt: new Date('2026-09-22T08:00:00.000Z') }
    const updatedDuplicate = { ...record(3), updatedAt: new Date('2026-09-23T08:00:00.000Z') }
    expect(await restoreBackup(encode([later, updatedDuplicate]))).toEqual({ added: 1, duplicates: 1, conflicts: 0 })
    expect(await getThoughts()).toHaveLength(2)
  })

  it('allocates local IDs without misclassifying other incoming source IDs', async () => {
    // Learn the next local ID without relying on the database's prior test history.
    const probe = await db.thoughts.add({ ...record(1, 'probe'), id: undefined })
    await db.thoughts.delete(probe)
    const nextLocalId = probe + 1
    const withoutId = { ...record(1, 'auto'), id: undefined }
    expect(await restoreBackup(encode([withoutId, record(nextLocalId, 'source')]))).toEqual({ added: 2, duplicates: 0, conflicts: 0 })
    const restored = await getThoughts()
    expect(restored.map((item) => item.originalText).sort()).toEqual(['auto', 'source'])
    expect(restored.find((item) => item.originalText === 'source')?.id).not.toBe(nextLocalId)
  })

  it('preserves the first incoming record when source IDs conflict within a backup', async () => {
    expect(await restoreBackup(encode([record(1000, 'first'), record(1000, 'conflict')]))).toEqual({ added: 1, duplicates: 0, conflicts: 1 })
    expect((await getThoughts())[0].originalText).toBe('first')
  })

  it('rejects a mixed-validity file without importing its valid prefix', async () => {
    const backup = JSON.parse(encode([record(1), record(2)]))
    backup.thoughts[1].tags = 'invalid'
    await expect(restoreBackup(JSON.stringify(backup))).rejects.toThrow()
    expect(await getThoughts()).toEqual([])
  })

  it('rolls back the entire import when a write fails', async () => {
    await db.thoughts.add(record(10))
    const add = db.thoughts.add.bind(db.thoughts)
    vi.spyOn(db.thoughts, 'add').mockImplementationOnce((item) => add(item)).mockRejectedValueOnce(new Error('storage full'))
    await expect(restoreBackup(encode([record(1, 'new1'), record(2, 'new2')]))).rejects.toThrow('storage full')
    expect(await getThoughts()).toEqual([record(10)])
  })
})
