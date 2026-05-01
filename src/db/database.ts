import Dexie, { liveQuery, type Table } from 'dexie'
import { useEffect, useState } from 'react'

export interface ThoughtRecord {
  id?: number
  originalText: string
  translatedCasual: string
  translatedFormal: string
  grammarNotes: string
  tags: string[]
  createdAt: Date
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
