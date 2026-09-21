import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { CommandPalette } from './CommandPalette'
import { ThoughtCard } from './ThoughtCard'

function renderCapture(overrides: Partial<Parameters<typeof CommandPalette>[0]> = {}) {
  return renderToStaticMarkup(<CommandPalette value="新的念头" isSubmitting={false} error={null} onValueChange={vi.fn()} onSubmit={async () => {}} onClose={vi.fn()} {...overrides} />)
}

describe('demo capture states', () => {
  it('provides a named dialog, labelled input, touch controls and explicit AI / local-only actions', () => {
    const markup = renderCapture()
    expect(markup).toContain('role="dialog"')
    expect(markup).toContain('aria-labelledby="capture-title"')
    expect(markup).toContain('for="thought-input"')
    expect(markup).toContain('关闭捕捉面板')
    expect(markup).toContain('仅保存原文')
    expect(markup).toContain('AI 生成并保存')
    expect(markup).toContain('原文会发送到你配置的模型服务')
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
    expect(markup).toContain('正在处理…')
  })
})

describe('thought card', () => {
  const thought = { id: 4, originalText: '测试念头', translatedCasual: 'sample', translatedFormal: 'sample', grammarNotes: 'sample', tags: ['mock-ai'], createdAt: new Date('2026-09-21T08:00:00Z') }
  it('labels legacy records as examples and exposes deliberate deletion', () => {
    const markup = renderToStaticMarkup(<ThoughtCard thought={thought} />)
    expect(markup).toContain('固定模板生成，不是真实翻译或语法建议')
    expect(markup).toContain('删除念头')
    expect(markup).not.toContain('确认删除')
  })
  it('shows AI provenance without falsely labelling output as mock', () => {
    const markup = renderToStaticMarkup(<ThoughtCard thought={{ ...thought, generationMode: 'ai', generationModel: 'fixture-model', tags: ['ai'] }} />)
    expect(markup).toContain('AI 生成 · fixture-model')
    expect(markup).toContain('重新生成 AI 表达')
    expect(markup).not.toContain('模拟')
  })
  it('shows manual notes without presenting stale generated fields', () => {
    const markup = renderToStaticMarkup(<ThoughtCard thought={{ ...thought, generationMode: 'manual', tags: [] }} />)
    expect(markup).toContain('原文笔记 · 尚未生成 AI 表达')
    expect(markup).toContain('生成 AI 表达')
    expect(markup).toContain('编辑念头')
    expect(markup).not.toContain('sample')
    expect(markup).not.toContain('模拟')
  })
})
