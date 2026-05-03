import type { ThoughtRecord } from '../db/database'

export interface TimelineGroup {
  label: string
  dateKey: string
  thoughts: ThoughtRecord[]
}

const DAY_IN_MS = 24 * 60 * 60 * 1000

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function formatAbsoluteDay(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function getTimelineDayLabel(date: Date, now = new Date()): string {
  const dayStart = startOfDay(date)
  const nowStart = startOfDay(now)
  const diffInDays = Math.round((nowStart.getTime() - dayStart.getTime()) / DAY_IN_MS)

  if (diffInDays === 0) {
    return '今天'
  }

  if (diffInDays === 1) {
    return '昨天'
  }

  return formatAbsoluteDay(date)
}

export function groupThoughtsByDay(
  thoughts: ThoughtRecord[],
  now = new Date(),
): TimelineGroup[] {
  const groups = new Map<string, TimelineGroup>()

  thoughts.forEach((thought) => {
    const date = thought.createdAt
    const dateKey = startOfDay(date).toISOString()

    const existingGroup = groups.get(dateKey)
    if (existingGroup) {
      existingGroup.thoughts.push(thought)
      return
    }

    groups.set(dateKey, {
      label: getTimelineDayLabel(date, now),
      dateKey,
      thoughts: [thought],
    })
  })

  return Array.from(groups.values())
}
