import type { ThoughtRecord } from '../db/database'

interface ThoughtCardProps {
  thought: ThoughtRecord
}

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function ThoughtCard({ thought }: ThoughtCardProps) {
  return (
    <article className="thought-card rounded-2xl border border-neutral-800 bg-neutral-950/70 p-5 shadow-[0_12px_32px_rgba(0,0,0,0.28)] backdrop-blur">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">💡 我的中文念头</p>
          <h3 className="mt-2 text-xl font-medium leading-8 text-white">{thought.originalText}</h3>
        </div>
        <time className="shrink-0 text-sm text-neutral-500" dateTime={thought.createdAt.toISOString()}>
          {formatTimestamp(thought.createdAt)}
        </time>
      </header>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <span>🗣 地道口语 (Casual)</span>
            <span className="ml-2 text-xs text-neutral-500">日常聊天直接用</span>
          </div>
          <p className="mt-3 text-sm leading-7 text-neutral-100">{thought.translatedCasual}</p>
        </section>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <span>👔 正式表达 (Formal)</span>
            <span className="ml-2 text-xs text-neutral-500">职场或书面环境</span>
          </div>
          <p className="mt-3 text-sm leading-7 text-neutral-100">{thought.translatedFormal}</p>
        </section>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <span>🧠 语法与思维 (Grammar)</span>
            <span className="ml-2 text-xs text-neutral-500">为什么要这么说</span>
          </div>
          <p className="mt-3 text-sm leading-7 text-neutral-100">{thought.grammarNotes}</p>
        </section>
      </div>

      {thought.tags.length > 0 ? (
        <footer className="mt-4 flex flex-wrap gap-2">
          {thought.tags.map((tag) => (
            <span
              key={`${thought.id ?? thought.createdAt.toISOString()}-${tag}`}
              className="rounded-full border border-neutral-800 px-3 py-1 text-xs text-neutral-400"
            >
              #{tag}
            </span>
          ))}
        </footer>
      ) : null}
    </article>
  )
}
