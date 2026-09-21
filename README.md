# Thought Catcher · 本地 AI 念头助手

用 React、TypeScript、Dexie / IndexedDB 和 Node.js 构建的单人本地 MVP：记录中文念头，按需生成英文表达，再搜索、编辑和备份。

## 功能

- **捕捉**：点击“新建念头”或 Ctrl / ⌘ + K。Enter 仅保存原文；“AI 生成并保存”调用你配置的模型。
- **真实 AI**：生成口语英文、正式英文、中文说明和标签。调用失败保留输入，支持明确重试，不会返回模拟模板冒充结果。
- **管理**：搜索原文/表达/说明/标签，按标签筛选，编辑原文和标签，确认删除。
- **重新生成**：保留人工标签，可以取消；生成期间发生编辑或删除时，不会用过期结果覆盖记录。
- **备份**：导出全部记录为 JSON；校验后合并恢复，跳过重复项并保留现有冲突记录。
- **本地保存**：数据在当前浏览器 IndexedDB 中保存，刷新后保留。

旧版本固定模板记录仍会标注模拟来源。新生成的记录显示模型名；仅保存原文的记录显示手动来源。修改原文会清除旧生成内容，需要时再点击生成，避免展示与原文不一致的结果。

## 环境与启动

需要 **Node.js 24 或更高版本**，本次验证使用 Node 24.16 / npm 11。

```bash
npm ci
cp .env.example .env.local
```

用编辑器打开 `.env.local`，填写你的服务配置：

```dotenv
AI_BASE_URL=https://your-provider.example/v1
AI_MODEL=your-model-name
AI_API_KEY=your-own-key
```

地址、模型名应使用服务商提供的值，上面的域名是占位示例。基础地址不要包含 `/chat/completions`；程序会追加该路径。支持 HTTPS；本机接口联调允许 loopback HTTP。不会跟随服务端重定向。

配置为空时仍可仅保存原文。修改配置后必须重启服务。密钥只由本地 Node 后端读取，不使用 `VITE_` 变量，不进入网页构建产物、IndexedDB 或 JSON 备份；`.env.local` 已忽略，不要提交它。

开发运行：

```bash
npm run dev -- --port 43174 --strictPort
```

正式构建运行：

```bash
npm run build
npm start
```

两种模式均打开 http://127.0.0.1:43174/；不要同时占用同一端口。`npm start` 会绑定本机 127.0.0.1，也可通过 `PORT` 修改端口。`npm run preview` 使用同一本地服务。仅把 `dist/` 放到静态服务器不能调用 AI。

## 日常使用

1. 打开“AI 设置”查看配置状态，必要时点击重新检查。
2. 新建一条念头，可仅保存，或生成英文表达后保存。
3. 在时间线搜索关键词，或选择标签缩小结果。
4. 编辑原文与标签；原文变更后点击生成表达，生成中可取消。
5. 点击“导出 JSON 备份”。换浏览器或清理网站数据前，先保存备份。
6. 恢复时选择 JSON 文件，查看新增、重复和冲突数量。

## 数据与调用边界

- 记录保存在数据库 `thoughtCatcher` 中。主机名、端口或浏览器变化会切换到独立存储；建议固定使用同一地址。
- 恢复最多 10 MB / 10,000 条，先完整校验，再使用事务写入。先跳过内容与创建时间相同的重复项，再将来源 ID 与恢复前的本地记录比较；相同 ID 不同内容保留本地记录并计入冲突。新增记录分配本地 ID，外部 ID 不影响后续自动编号；不会清空现有数据库。
- 编辑时保留创建时间和身份。其他标签页已修改记录时，会提示冲突并停止写入。
- 原文最多 20,000 字；AI 单次最多 5,000 字，超限仍可保存原文。AI 上游超时为 45 秒，不自动重试，以免重复计费。
- 只有明确点击 AI 生成时，原文才会发送给配置的服务商；调用费用和额度由该服务商决定。
- 本项目没有账号、云同步或远程共享；请通过本机服务使用。

## 验证

```bash
npm test
npm run lint
npm run build
```

测试包含本地 HTTP 模型接口 fixture、错误状态/超时/重定向、备份校验/冲突/事务回滚与编辑竞态，使用模拟 IndexedDB，不修改浏览器日常记录。fixture 不等于真实模型质量验证；使用自己的服务配置后才能验证该服务的模型支持和输出质量。

接口依据：[Chat Completions](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create)、[API 认证](https://developers.openai.com/api/reference/overview)。兼容不同服务时采用 `model + messages` 最小请求，并在后端校验模型返回的 JSON。
