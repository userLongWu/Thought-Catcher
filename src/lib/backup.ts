import { db, type ThoughtRecord } from '../db/database'
import { thoughtFingerprint } from './thoughts'

export const MAX_BACKUP_BYTES = 10 * 1024 * 1024
const recordKeys = ['id', 'originalText', 'translatedCasual', 'translatedFormal', 'grammarNotes', 'tags', 'createdAt', 'generationMode', 'generationModel', 'updatedAt']

function object(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('备份中包含无效对象。')
  const result = value as Record<string, unknown>
  if (Object.keys(result).some((key) => !keys.includes(key))) throw new Error('备份包含不支持的字段，请使用 Thought Catcher 导出的 JSON。')
  return result
}

function date(value: unknown): Date {
  if (typeof value !== 'string') throw new Error('备份日期格式无效。')
  const result = new Date(value)
  if (!Number.isFinite(result.getTime()) || result.toISOString() !== value) throw new Error('备份日期格式无效。')
  return result
}

function text(value: unknown, max = 20000): string {
  if (typeof value !== 'string' || value.length > max) throw new Error('备份文本字段无效或过长。')
  return value
}

function parseRecord(value: unknown): ThoughtRecord {
  const raw = object(value, recordKeys)
  if (raw.id !== undefined && (!Number.isSafeInteger(raw.id) || (raw.id as number) < 1)) throw new Error('备份记录 ID 必须为正安全整数。')
  const originalText = text(raw.originalText)
  if (!originalText.trim()) throw new Error('备份中有空白原文。')
  if (!Array.isArray(raw.tags) || raw.tags.length > 30) throw new Error('备份标签格式无效。')
  const tags = raw.tags.map((tag) => {
    const value = text(tag, 80)
    if (!value.trim()) throw new Error('备份中有空白标签。')
    return value
  })
  const mode = raw.generationMode
  if (mode !== undefined && mode !== 'ai' && mode !== 'manual' && mode !== 'mock') throw new Error('备份生成来源无效。')
  return {
    ...(raw.id !== undefined ? { id: raw.id as number } : {}),
    originalText,
    translatedCasual: text(raw.translatedCasual),
    translatedFormal: text(raw.translatedFormal),
    grammarNotes: text(raw.grammarNotes),
    tags,
    createdAt: date(raw.createdAt),
    ...(mode !== undefined ? { generationMode: mode } : {}),
    ...(raw.generationModel !== undefined ? { generationModel: text(raw.generationModel, 200) } : {}),
    ...(raw.updatedAt !== undefined ? { updatedAt: date(raw.updatedAt) } : {}),
  }
}

export function parseBackup(json: string): ThoughtRecord[] {
  if (new TextEncoder().encode(json).byteLength > MAX_BACKUP_BYTES) throw new Error('备份文件不能超过 10 MB。')
  let value: unknown
  try { value = JSON.parse(json) } catch { throw new Error('文件不是有效的 JSON 备份。') }
  const raw = object(value, ['app', 'version', 'exportedAt', 'thoughts'])
  if (raw.app !== 'thought-catcher' || raw.version !== 1) throw new Error('不支持的备份类型或版本，需要 Thought Catcher v1 备份。')
  date(raw.exportedAt)
  if (!Array.isArray(raw.thoughts) || raw.thoughts.length > 10000) throw new Error('备份必须包含念头列表，且最多 10,000 条。')
  return raw.thoughts.map(parseRecord)
}

export function createBackup(thoughts: ThoughtRecord[]): string {
  // Whitelist data fields: settings, API credentials and unknown properties never leave storage.
  const records = thoughts.map((thought) => ({
    id: thought.id,
    originalText: thought.originalText,
    translatedCasual: thought.translatedCasual,
    translatedFormal: thought.translatedFormal,
    grammarNotes: thought.grammarNotes,
    tags: thought.tags,
    createdAt: thought.createdAt,
    generationMode: thought.generationMode,
    generationModel: thought.generationModel,
    updatedAt: thought.updatedAt,
  }))
  const json = JSON.stringify({ app: 'thought-catcher', version: 1, exportedAt: new Date().toISOString(), thoughts: records }, null, 2)
  parseBackup(json)
  return json
}

export async function restoreBackup(json: string): Promise<{ added: number; duplicates: number; conflicts: number }> {
  const incoming = parseBackup(json)
  return db.transaction('rw', db.thoughts, async () => {
    const existing = await db.thoughts.toArray()
    // Only IDs present before restoration are conflict candidates. Imported records
    // receive local IDs, so untrusted IDs never advance IndexedDB's key generator.
    const existingIds = new Set(existing.map((item) => item.id))
    const sourceIds = new Set<number>()
    const fingerprints = new Set(existing.map(thoughtFingerprint))
    const counts = { added: 0, duplicates: 0, conflicts: 0 }
    for (const thought of incoming) {
      const fingerprint = thoughtFingerprint(thought)
      const hasIdConflict = thought.id !== undefined && (existingIds.has(thought.id) || sourceIds.has(thought.id))
      if (thought.id !== undefined) sourceIds.add(thought.id)
      if (fingerprints.has(fingerprint)) {
        counts.duplicates++
      } else if (hasIdConflict) {
        counts.conflicts++
      } else {
        await db.thoughts.add({ ...thought, id: undefined })
        fingerprints.add(fingerprint)
        counts.added++
      }
    }
    return counts
  })
}
