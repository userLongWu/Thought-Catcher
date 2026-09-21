import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { CommandPalette } from './CommandPalette'
import { ThoughtCard } from './ThoughtCard'

function renderCapture(overrides: Partial<Parameters<typeof CommandPalette>[0]> = {}) {
  return renderToStaticMarkup(<CommandPalette value="新的念头" isSubmitting={false} error={null} onValueChange={vi.fn()} onSubmit={async () => {}} onClose={vi.fn()} {...overrides} />)
}

describe('demo capture states', () => {
  it('provides a named dialog, labelled input, touch controls and mock disclosure', () => {
    const markup = renderCapture()
    expect(markup).toContain('role="dialog"')
    expect(markup).toContain('aria-labelledby="capture-title"')
    expect(markup).toContain('for="thought-input"')
    expect(markup).toContain('关闭捕捉面板')
    expect(markup).toContain('保存念头')
    expect(markup).toContain('不是真实翻译')
    expect(markup).toContain('Ctrl/Cmd+K')
  })

  it('keeps the original input and displays actionable errors inside the dialog', () => {
    const markup = renderCapture({ value: '  保留我的输入  ', error: new Error('存储空间不足') })
    expect(markup).toContain('value="  保留我的输入  "')
    expect(markup).toContain('aria-describedby="capture-error"')
    expect(markup).toContain('role="alert"')
    expect(markup).toContain('保存失败，原文已保留，请重试。存储空间不足')
    expect(markup.indexOf('capture-error')).toBeLessThan(markup.indexOf('</form>'))
  })

  it('prevents empty submission and keeps input visible while saving', () => {
    expect(renderCapture({ value: '  ' })).toMatch(/type="submit" disabled=""/)
    const markup = renderCapture({ isSubmitting: true })
    expect(markup).toContain('value="新的念头"')
    expect(markup).toContain('readonly=""')
    expect(markup).toMatch(/type="submit" disabled=""/)
    expect(markup).toContain('aria-busy="true"')
    expect(markup).toContain('正在保存…')
  })
})

describe('thought card', () => {
  it('labels existing records as examples and exposes deliberate deletion', () => {
    const markup = renderToStaticMarkup(<ThoughtCard thought={{ id: 4, originalText: '测试念头', translatedCasual: 'sample', translatedFormal: 'sample', grammarNotes: 'sample', tags: ['mock-ai'], createdAt: new Date('2026-09-21T08:00:00Z') }} />)
    expect(markup).toContain('测试念头')
    expect(markup).toContain('固定模板生成，不是真实翻译或语法建议')
    expect(markup).toContain('删除念头')
    expect(markup).not.toContain('确认删除')
    expect(markup).not.toContain('日常聊天直接用')
  })
})
