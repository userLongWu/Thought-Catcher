# Project: Thought Catcher (念头捕捉器) - Web MVP V1

## 1. Project Overview
这是一个面向开发者的极简语言学习工具 MVP。核心目标是：用户随时通过键盘输入脑海中的中文念头（Thoughts），应用通过 AI 将其转化为目标语言（当前为英语）的三维解析（地道口语、正式表达、语法拆解），并全部保存在本地数据库中形成个人语料库。

**核心设计原则：**
- **Local-first (本地优先):** 极速启动，数据隐私，无需后端数据库。
- **Keyboard-centric (键盘为中心):** 交互必须像 Spotlight 或 Raycast 一样干脆。
- **Minimalist UI (极简界面):** 避免花哨，专注输入和回顾。

## 2. Tech Stack (技术栈)
- **Framework:** React 18 + TypeScript (使用 Vite 构建)
- **Styling:** Tailwind CSS
- **Local Database:** Dexie.js (封装 IndexedDB)
- **Icons:** lucide-react
- **State Management:** React Hooks (前期足够，无需 Redux)

## 3. Database Schema (数据结构)
使用 Dexie.js 初始化以下结构：
```typescript
interface ThoughtRecord {
  id?: number; // Auto-increment
  originalText: string; // 用户输入的中文念头
  translatedCasual: string; // AI 返回：地道口语
  translatedFormal: string; // AI 返回：正式书面语
  grammarNotes: string; // AI 返回：语法/思维差异解析
  tags: string[]; // 自动生成的标签
  createdAt: Date; // 创建时间
}

4. Core UI Components (核心组件)
请按以下模块化进行开发，保持组件间的低耦合：

1.CommandPalette (全局输入台):

  占据屏幕核心位置的单行大输入框。

  支持回车提交 (Enter to Submit)。

  提交时显示极简的 Loading 状态。

2.ThoughtCard (解析卡片):

  展示 originalText。

  以清晰的排版区分 Casual, Formal 和 Grammar 模块。

3.TimelineView (时间线信息流):

  读取本地数据库，按倒序排列展示历史记录。

  每日分割线 (Today, Yesterday等)。

5. Execution Plan (AI 执行步骤)
AI Agent, please execute the following steps sequentially. Ask for my confirmation after each step is completed:

[ ] Step 1: Initial Setup
    使用 Vite 搭建 React + TS 模板。
    安装并配置 Tailwind CSS, Dexie.js, lucide-react。
    清理默认模板代码。

[ ]Step 2: Database Initialization
    创建 src/db/database.ts，配置 Dexie 实例并建立 thoughts 表。
    编写基础的 CRUD hooks (e.g., useThoughts, addThought).

[ ] Step 3: Core UI Skeleton
    创建主页面布局 (黑白灰极简风格，类似 Notion 或 Raycast)。
    实现 CommandPalette UI 并确保自动聚焦 (auto-focus)。
    实现 ThoughtCard 的 UI 占位。

[ ] Step 4: Logic Integration & Mock AI
    绑定输入框的 Submit 事件。
    重要： 编写一个 mockAiTranslate(text) 函数，模拟 AI 接口的延迟（setTimeout 1.5s）并返回固定格式的 Mock JSON 数据，用来走通“输入 -> Mock 翻译 -> 存入 Dexie -> 列表刷新”的完整数据流。

[ ] Step 5: UI Polish
    添加细腻的过渡动画（如列表新增项的 slide-down 效果）。
    确保响应式布局（窄屏友好）。

6. Coding Guidelines (代码规范)
严格使用 TypeScript 类型定义。
Tailwind 类名如果过长，请合理使用跨行或提取公用样式。
业务逻辑抽离到 Custom Hooks 中，保持 UI 组件纯粹。
暂时不需要真实的 LLM API 接入代码，在 Step 4 中只需预留好 fetch 的入口位置即可。
