import Dexie, { liveQuery, type Table, type Transaction } from 'dexie'
import { useEffect, useState } from 'react'
import { normalizeTags, thoughtFingerprint } from '../lib/thoughts'

export interface ThoughtRecord {
  id?: number
  originalText: string
  translatedCasual: string
  translatedFormal: string
  grammarNotes: string
  tags: string[]
  createdAt: Date
  generationMode?: 'ai' | 'manual' | 'mock'
  generationModel?: string
  updatedAt?: Date
}

export type ThoughtDraft = Omit<ThoughtRecord, 'id' | 'createdAt'> & {
  createdAt?: Date
}

class ThoughtCatcherDatabase extends Dexie {
  thoughts!: Table<ThoughtRecord, number>

  constructor() {
    super('thoughtCatcher')

    this.version(1).stores({
      thoughts: '++id, createdAt, *tags',
    })
  }
}

export const db = new ThoughtCatcherDatabase()

export async function addThought(thought: ThoughtDraft): Promise<number> {
  return db.thoughts.add({
    ...thought,
    tags: [...thought.tags],
    createdAt: thought.createdAt ?? new Date(),
  })
}

export async function getThoughts(): Promise<ThoughtRecord[]> {
  return db.thoughts.orderBy('createdAt').reverse().toArray()
}

export async function updateThoughtText(expected: ThoughtRecord, originalText: string, tags: string[]): Promise<void> {
  const text = originalText.trim()
  const normalizedTags = normalizeTags(tags)
  if (!text || text.length > 20000) throw new Error('原文不能为空，且不能超过 20,000 字。')
  if (normalizedTags.length > 30 || normalizedTags.some((tag) => tag.length > 80)) throw new Error('最多 30 个标签，每个标签不超过 80 字。')
  await db.transaction('rw', db.thoughts, async () => {
    const current = await getUnchangedThought(expected)
    const changed = text !== current.originalText
    await db.thoughts.put({
      ...current,
      originalText: text,
      tags: normalizedTags,
      updatedAt: new Date(),
      ...(changed ? { translatedCasual: '', translatedFormal: '', grammarNotes: '', generationMode: 'manual' as const, generationModel: undefined } : {}),
    })
  })
}

export async function saveGeneratedThought(expected: ThoughtRecord, generated: {
  translatedCasual: string; translatedFormal: string; grammarNotes: string; tags: string[]; model: string
}, signal?: AbortSignal): Promise<void> {
  let transaction: Transaction | undefined
  const abortTransaction = () => transaction?.abort()
  signal?.addEventListener('abort', abortTransaction, { once: true })
  try {
    await db.transaction('rw', db.thoughts, async () => {
      transaction = Dexie.currentTransaction
      if (signal?.aborted) throw new Error('AI 请求已取消。')
      const current = await getUnchangedThought(expected)
      if (signal?.aborted) throw new Error('AI 请求已取消。')
      await db.thoughts.put({
        ...current,
        translatedCasual: generated.translatedCasual,
        translatedFormal: generated.translatedFormal,
        grammarNotes: generated.grammarNotes,
        tags: normalizeTags([...current.tags, ...generated.tags]).slice(0, 30),
        generationMode: 'ai',
        generationModel: generated.model,
        updatedAt: new Date(),
      })
      if (signal?.aborted) throw new Error('AI 请求已取消。')
    })
  } finally {
    // The callback can finish before IndexedDB commits. Cancellation must remain
    // attached until the outer transaction promise settles.
    signal?.removeEventListener('abort', abortTransaction)
  }
}

async function getUnchangedThought(expected: ThoughtRecord): Promise<ThoughtRecord> {
  if (expected.id === undefined) throw new Error('这条念头尚未保存。')
  const current = await db.thoughts.get(expected.id)
  if (!current) throw new Error('这条念头已被删除。')
  if (thoughtFingerprint(current) !== thoughtFingerprint(expected) || current.updatedAt?.getTime() !== expected.updatedAt?.getTime()) throw new Error('这条念头已在其他位置修改，请取消编辑后重试。')
  return current
}

export async function deleteThought(id: number): Promise<void> {
  await db.thoughts.delete(id)
}

export async function clearThoughts(): Promise<void> {
  await db.thoughts.clear()
}

export interface UseThoughtsResult {
  thoughts: ThoughtRecord[]
  isLoading: boolean
  error: Error | null
  addThought: typeof addThought
  deleteThought: typeof deleteThought
  clearThoughts: typeof clearThoughts
}

export function useThoughts(): UseThoughtsResult {
  const [thoughts, setThoughts] = useState<ThoughtRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const subscription = liveQuery(() => getThoughts()).subscribe({
      next(nextThoughts) {
        setThoughts(nextThoughts)
        setIsLoading(false)
        setError(null)
      },
      error(nextError) {
        setError(nextError instanceof Error ? nextError : new Error(String(nextError)))
        setIsLoading(false)
      },
    })

    return () => subscription.unsubscribe()
  }, [])

  return {
    thoughts,
    isLoading,
    error,
    addThought,
    deleteThought,
    clearThoughts,
  }
}
