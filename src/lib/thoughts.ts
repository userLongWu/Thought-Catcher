import type { ThoughtRecord } from '../db/database'

export function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))]
}

export function parseEditedTags(input: string, originalTags: string[]): string[] {
  // Existing tags can themselves contain commas; unchanged input is lossless.
  return input === originalTags.join(', ') ? [...originalTags] : input.split(/[,，]/)
}

export function filterThoughts(thoughts: ThoughtRecord[], query: string, tag: string): ThoughtRecord[] {
  const needle = query.trim().toLocaleLowerCase()
  return thoughts.filter((thought) => {
    if (tag && !thought.tags.includes(tag)) return false
    const text = [thought.originalText, thought.translatedCasual, thought.translatedFormal, thought.grammarNotes, ...thought.tags].join('\n').toLocaleLowerCase()
    return !needle || text.includes(needle)
  })
}

// Stable content identity excludes the local numeric ID; also used for optimistic writes.
export function thoughtFingerprint(thought: ThoughtRecord): string {
  return JSON.stringify([
    thought.originalText, thought.translatedCasual, thought.translatedFormal,
    thought.grammarNotes, [...thought.tags].sort(), thought.createdAt.toISOString(),
    thought.generationMode ?? 'mock', thought.generationModel ?? '',
  ])
}
