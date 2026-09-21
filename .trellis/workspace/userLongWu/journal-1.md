# Journal - userLongWu (Part 1)

> AI development session journal
> Started: 2026-09-21

---



## Session 1: 完善可演示版本

**Date**: 2026-09-21
**Task**: 完善可演示版本
**Branch**: `main`

### Summary

完成用户确认的 Demo 范围，自动测试、独立审查与实际 UI 验证通过；无新依赖或数据迁移，未推送 GitHub。

### Main Changes

# 验证记录 · 2026-09-21

## 完成范围
- 增加可点击的新建入口，捕捉面板支持关闭、再次打开、快捷键和焦点恢复。
- 保存期间防止重复提交；错误在面板内反馈并保留输入。
- 增加逐条删除、取消确认和错误反馈。
- 主页、面板与卡片明确标注 Mock AI，完善空状态、手机尺寸布局和运行文档。

## 自动验证（最终代码）
- npm test：11/11。
- npm run lint：通过。
- npm run build：TypeScript 与生产构建通过。
- git diff --check：通过。

## 浏览器验证
使用全新 origin http://127.0.0.1:43174/，仅创建合成测试记录。
- 初始面板显示明确模拟说明，空输入不能保存。
- 输入记录后 Enter 提交；保存期间输入不可编辑、关闭和保存按钮禁用。
- 保存成功后时间线显示记录和模拟输出，焦点回到新建按钮。
- 新建按钮可再次打开；Shift+Tab 在面板内循环，Esc 关闭，Cmd+K 打开。
- 刷新后记录保留；取消删除保留记录，确认删除仅删除本轮合成记录，恢复空状态。
- 390×844 视口下，面板和时间线正常换行、无横向溢出；测试后已恢复视口。
- 浏览器 error/warn 日志为空。

## 独立审查与边界
独立代码审查未发现阻塞问题。现有组件测试主要使用 SSR，不能替代上述浏览器交互验证。中文输入法组合事件有代码防护，但未用真实输入法候选框做人工测试；持久化异常由现有自动测试覆盖，未破坏浏览器数据来注入故障。
保留固定模板 Mock AI，没有新增依赖、账号、导出备份、云同步、部署或 GitHub 推送。


### Git Commits

| Hash | Message |
|------|---------|
| `55b4a6c` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 2: 真实 AI 本地 MVP

**Date**: 2026-09-21
**Task**: 真实 AI 本地 MVP
**Branch**: `main`

### Summary

完成真实英文表达生成、搜索标签编辑、取消及备份恢复。56测试、lint、build通过；生产及未配置页面、390像素窄屏实测通过。真实提供方需用户本机配置。

### Main Changes

# MVP verification — 2026-09-21

## Result

Implemented and independently reviewed the confirmed real-AI local MVP with data management. Existing Dexie schema v1 remains unchanged. No new package dependency; lockfile changes only add root Node engine metadata. No production deployment or GitHub push.

## Automated evidence

- `npm test`: 56/56 tests passed, including local HTTP contracts, capture, editing/cancellation, search and backup regressions.
- `npm run lint`: passed.
- `npm run build`: TypeScript and Vite passed; final ID-restore fix included.
- Independent review reran all 56 tests, type checking and targeted lint; no remaining blocking findings.
- `git diff --check`: passed; fixture credential absent from dist; `.env.local` ignored.
- Production server smoke: homepage, SPA and HEAD work; environment file is not served, traversal remains within dist, malicious Host is rejected, unconfigured generation returns 503.

## Actual browser verification

Used isolated origins `http://127.0.0.1:43178` (production + fixture) and `http://127.0.0.1:43179` (unconfigured dev). Synthetic records only; daily-use IndexedDB untouched.

- AI capture shows a pending state and saves English expressions, Chinese notes, tags and model provenance.
- Editing source clears stale generated content and marks it manual. Explicit regeneration restores AI expressions and retains manual tags.
- Search and tag content display work; refresh preserves records.
- Export through the UI downloads JSON. Native file selection restores it with 0 additions, 1 duplicate and 0 conflicts; both existing records remain.
- Fixture quota error preserves capture input. Save-original-only succeeds from the same failed form.
- Missing configuration shows setup guidance inside the capture panel and preserves input; manual capture then succeeds.
- Timeline, data toolbar and edit form visually checked at 390×844; viewport override reset afterward.

## Review repairs

- Unchanged tag input preserves tags containing commas.
- Cancellation remains active until Dexie transaction completion; abort before commit rolls back generation.
- Incoming IDs never drive IndexedDB's automatic key generator. Dedupe by content first, compare conflicts against the pre-restore local IDs, and allocate local IDs for new records. Regression covers maximum safe source ID → new capture → export → repeated and clean restore.

## Validation limits

No live provider key was supplied. The real HTTP path and failures were exercised against a deterministic local fixture, not a paid model service. Actual model availability and output quality remain unverified. Browser data stays tied to its origin/browser; static-only deployment cannot serve the local AI endpoints. No accounts, cloud sync or remote access are included.


### Git Commits

| Hash | Message |
|------|---------|
| `8c44009` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete
