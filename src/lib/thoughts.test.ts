import { describe, expect, it } from 'vitest'
import { filterThoughts, normalizeTags, parseEditedTags } from './thoughts'
import type { ThoughtRecord } from '../db/database'
const thoughts: ThoughtRecord[] = [
  { id: 1, originalText: '今天去散步', translatedCasual: 'Take a walk', translatedFormal: 'Stroll', grammarNotes: '动词', tags: ['daily'], createdAt: new Date() },
  { id: 2, originalText: '读书', translatedCasual: '', translatedFormal: '', grammarNotes: '', tags: ['book'], createdAt: new Date() },
]

describe('thought search', () => {
  it('searches original, generated notes, English and tags without case sensitivity', () => {
    for (const query of [' 散步 ', 'TAKE', 'Stroll', '动词', 'daily']) expect(filterThoughts(thoughts, query, '').map((item) => item.id)).toEqual([1])
    expect(filterThoughts(thoughts, '', '')).toHaveLength(2)
  })
  it('combines exact tag filtering with search', () => {
    expect(filterThoughts(thoughts, '读书', 'daily')).toEqual([])
    expect(filterThoughts(thoughts, '', 'book').map((item) => item.id)).toEqual([2])
    expect(filterThoughts(thoughts, '', 'boo')).toEqual([])
  })
  it('normalizes tags without retaining blank or duplicate entries', () => {
    expect(normalizeTags([' daily ', '', 'daily', 'book'])).toEqual(['daily', 'book'])
  })
})


describe('edited tags', () => {
  it('splits comma-separated tags only when input was changed', () => {
    expect(parseEditedTags('新标签, 第二个，第三个', ['工作,生活'])).toEqual(['新标签', ' 第二个', '第三个'])
    expect(parseEditedTags('', ['工作,生活'])).toEqual([''])
  })
})
