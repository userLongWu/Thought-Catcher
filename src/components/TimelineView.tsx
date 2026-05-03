import { useThoughts } from '../db/database'
import { groupThoughtsByDay } from '../lib/timeline'
import { ThoughtCard } from './ThoughtCard'

function TimelineShortcutHint() {
  return <p className="mt-6 text-sm text-neutral-600">按下 K 或 Ctrl+K 捕捉脑海中的念头</p>
}

export function TimelineView() {
  const { thoughts, isLoading, error } = useThoughts()

  if (isLoading) {
    return (
      <>
        <TimelineShortcutHint />
        <section className="mt-8 rounded-[24px] border border-dashed border-neutral-800 bg-neutral-950/50 p-6 text-sm text-neutral-500">
          Loading timeline...
        </section>
      </>
    )
  }

  if (error) {
    return (
      <>
        <TimelineShortcutHint />
        <section className="mt-8 rounded-[24px] border border-red-900/60 bg-red-950/20 p-6 text-sm text-red-200">
          Failed to read local thoughts: {error.message}
        </section>
      </>
    )
  }

  if (thoughts.length === 0) {
    return (
      <>
        <TimelineShortcutHint />
        <section className="mt-8 rounded-[24px] border border-dashed border-neutral-800 bg-neutral-950/50 p-6 text-sm text-neutral-500">
          No thoughts yet. Capture one above and it will appear here instantly.
        </section>
      </>
    )
  }

  const groups = groupThoughtsByDay(thoughts)

  return (
    <>
      <TimelineShortcutHint />
      <section className="mt-8 space-y-8">
        {groups.map((group) => (
          <div key={group.dateKey}>
            <div className="mb-4 flex items-center gap-4">
              <h2 className="text-sm uppercase tracking-[0.24em] text-neutral-500">{group.label}</h2>
              <div className="h-px flex-1 bg-neutral-800" />
            </div>

            <div className="space-y-4">
              {group.thoughts.map((thought) => (
                <ThoughtCard
                  key={thought.id ?? `${thought.originalText}-${thought.createdAt.toISOString()}`}
                  thought={thought}
                />
              ))}
            </div>
          </div>
        ))}
      </section>
    </>
  )
}
