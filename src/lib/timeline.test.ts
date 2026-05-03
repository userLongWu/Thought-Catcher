import { describe, expect, it } from 'vitest'
import type { ThoughtRecord } from '../db/database'
import { getTimelineDayLabel, groupThoughtsByDay } from './timeline'

function makeThought(originalText: string, createdAt: string): ThoughtRecord {
  return {
    id: Number(createdAt.replace(/\D/g, '').slice(-6)),
    originalText,
    translatedCasual: 'casual',
    translatedFormal: 'formal',
    grammarNotes: 'notes',
    tags: [],
    createdAt: new Date(createdAt),
  }
}

describe('timeline helpers', () => {
  it('labels current and previous days with relative headings', () => {
    const now = new Date('2026-05-02T10:00:00')

    expect(getTimelineDayLabel(new Date('2026-05-02T08:00:00'), now)).toBe('今天')
    expect(getTimelineDayLabel(new Date('2026-05-01T23:00:00'), now)).toBe('昨天')
    expect(getTimelineDayLabel(new Date('2026-04-28T10:00:00'), now)).toBe('2026年4月28日')
  })

  it('groups already-sorted thoughts by day without reordering them', () => {
    const now = new Date('2026-05-02T10:00:00')
    const thoughts = [
      makeThought('最新', '2026-05-02T09:30:00'),
      makeThought('今天较早', '2026-05-02T07:30:00'),
      makeThought('昨天', '2026-05-01T18:00:00'),
    ]

    const groups = groupThoughtsByDay(thoughts, now)

    expect(groups).toHaveLength(2)
    expect(groups[0].label).toBe('今天')
    expect(groups[0].thoughts.map((thought) => thought.originalText)).toEqual(['最新', '今天较早'])
    expect(groups[1].label).toBe('昨天')
    expect(groups[1].thoughts.map((thought) => thought.originalText)).toEqual(['昨天'])
  })
})
