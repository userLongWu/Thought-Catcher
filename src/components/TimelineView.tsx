import { useState } from 'react'
import { useThoughts } from '../db/database'
import { groupThoughtsByDay } from '../lib/timeline'
import { filterThoughts } from '../lib/thoughts'
import { DataTools } from './DataTools'
import { ThoughtCard } from './ThoughtCard'

export function TimelineView() {
  const { thoughts, isLoading, error } = useThoughts()
  const [query, setQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const tags = [...new Set(thoughts.flatMap((thought) => thought.tags))].sort((a, b) => a.localeCompare(b))
  const visibleThoughts = filterThoughts(thoughts, query, selectedTag)
  const groups = groupThoughtsByDay(visibleThoughts)

  return (
    <>
      <p className="mt-6 text-sm text-neutral-400">点击“新建念头”或按 Ctrl/Cmd+K，捕捉脑海中的念头</p>
      <section aria-label="搜索与备份" className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-900/30 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-0 flex-1 basis-64 text-sm text-neutral-300">搜索念头
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索原文、表达、说明或标签" className="mt-2 block min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2" />
          </label>
          <label className="min-w-0 flex-1 basis-40 text-sm text-neutral-300">标签筛选
            <select value={selectedTag} onChange={(event) => setSelectedTag(event.target.value)} className="mt-2 block min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2">
              <option value="">全部标签</option>
              {selectedTag && !tags.includes(selectedTag) ? <option value={selectedTag}>{selectedTag}（已无记录）</option> : null}
              {tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
            </select>
          </label>
          {query || selectedTag ? <button type="button" onClick={() => { setQuery(''); setSelectedTag('') }} className="min-h-11 rounded-lg px-3 py-2 text-sm text-neutral-300">清除筛选</button> : null}
        </div>
        {!isLoading && !error ? <p role="status" className="mt-3 text-xs text-neutral-400">显示 {visibleThoughts.length} / {thoughts.length} 条念头</p> : null}
        <DataTools />
      </section>
      {isLoading ? <p role="status" className="mt-8 text-sm text-neutral-400">正在读取本地念头…</p> : error ? (
        <section role="alert" className="mt-8 rounded-2xl border border-red-900/60 bg-red-950/20 p-6 text-sm text-red-200">读取本地念头失败，请刷新后重试：{error.message}</section>
      ) : visibleThoughts.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-dashed border-neutral-800 p-6 text-sm text-neutral-400">
          {thoughts.length === 0 ? '还没有念头。点击“新建念头”，记录第一个灵感，或恢复已有备份。' : '没有符合条件的念头，请调整搜索或清除筛选。'}
        </section>
      ) : (
        <section className="mt-8 space-y-8" aria-label="念头列表">
          {groups.map((group) => (
            <div key={group.dateKey}>
              <div className="mb-4 flex items-center gap-4">
                <h2 className="text-sm uppercase tracking-[0.24em] text-neutral-500">{group.label}</h2>
                <div className="h-px flex-1 bg-neutral-800" />
              </div>
              <div className="space-y-4">
                {group.thoughts.map((thought) => <ThoughtCard key={thought.id ?? `${thought.originalText}-${thought.createdAt.toISOString()}`} thought={thought} />)}
              </div>
            </div>
          ))}
        </section>
      )}
    </>
  )
}
