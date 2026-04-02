# 解剖 Claude Code（七）：投机执行与自研状态管理——隐藏延迟的两个利器

> 用户按下 Tab 接受建议，文件瞬间修改完成——但 Claude 的 API 调用至少需要几秒。延迟去哪了？答案是**投机执行（Speculative Execution）**：在用户还没确认之前，Agent 已经在一个影子文件系统里执行完了所有操作。用户确认的那一刻，只需要把影子文件复制到真实目录——感知延迟为零。

![封面图：投机执行与 Overlay FS](./images/07-cover.png)
<!-- IMG_07_COVER -->

---

## 问题

Agent 的用户体验有一个核心矛盾：

1. **安全性要求确认**：用户必须在执行前看到并批准操作
2. **延迟让人等不了**：API 调用 + 工具执行可能需要 5-30 秒
3. **确认时间被浪费**：用户审查建议的那几秒，Agent 完全空闲

如果能在用户审查的同时就开始执行，确认后瞬间呈现结果——用户的等待时间就从"API 延迟 + 执行时间"缩短为"确认操作的那一下按键"。

CPU 领域解决这个问题的技术叫**投机执行（Speculative Execution）**——先执行，错了再回滚。Claude Code 将这个思想搬到了 Agent 领域，配合一个 Copy-on-Write 的 Overlay 文件系统和一套精简的自研状态管理器。

---

## 在整体架构中的位置

```
ReAct 循环一轮结束后：

  Claude 回复完成
       │
       ▼
  生成 Prompt Suggestion（下一步建议）
       │
       ├──→ 展示给用户（等待 Tab 确认）
       │
       └──→ startSpeculation()  ← 在后台立即开始投机执行
            · 在 Overlay FS 中执行工具
            · 同时生成下一条建议（流水线）
            · 用户确认 → 物化文件 + 注入消息
            · 用户拒绝 → 删除 Overlay，无痕清理
```

---

## Part 1：投机执行——在用户思考时偷跑

### 核心流程

```
1. Claude 完成回复 → 生成 Suggestion（"接下来我会修改 auth.ts..."）
2. Suggestion 展示给用户的同时，后台启动投机执行
3. 投机 Agent 在 Overlay FS 中执行工具（Edit、Write、Read、Grep...）
4. 用户决策：
   a. Tab 确认 → Overlay 文件复制到真实 FS → 消息注入对话 → 继续
   b. 输入其他内容 → Overlay 删除 → 状态重置 → 当作从未发生
```

### 投机 Agent：隔离的 Fork

投机执行使用 `runForkedAgent()` 创建一个隔离的 Agent 上下文：

```typescript
// 与父 Agent 共享的（节省 API 成本）：
// · 系统提示、工具列表、模型配置 → 命中 Prompt Cache
// · CacheSafeParams → 利用父上下文的缓存前缀

// 与父 Agent 隔离的：
// · 独立的 messages 数组
// · 独立的 readFileState 缓存
// · 独立的 abortController
// · 不写入会话 transcript（skipTranscript: true）
```

**关键设计**：投机 Agent 共享父 Agent 的 Prompt Cache 参数——这意味着投机执行的 API 调用可以复用父上下文缓存的 Token，大幅降低成本。

### 工具访问控制：哪些工具可以投机？

投机执行不是无限制地执行所有工具。`canUseTool` 回调精确控制了哪些工具被允许：

```
✅ 安全只读工具（直接执行）：
   Read, Glob, Grep, ToolSearch, LSP, TaskGet, TaskList

✅ 写入工具（需要权限模式允许）：
   Edit, Write, NotebookEdit
   → 只在 acceptEdits / bypassPermissions 模式下执行
   → 否则触发 boundary，投机暂停

⚠️  Bash 工具（条件执行）：
   → 只读命令（ls, cat, grep...）→ 允许
   → 非只读命令 → 触发 boundary，投机暂停

❌ 其他所有工具（立即拒绝）：
   WebFetch, WebSearch, AgentTool...
   → 触发 boundary，投机暂停
```

### 边界（Boundary）：优雅暂停而非粗暴失败

当投机遇到无法执行的操作时，它不会报错，而是记录一个**边界**并暂停：

```typescript
type CompletionBoundary =
  | { type: 'complete'; outputTokens }        // 投机完整完成
  | { type: 'bash'; command }                  // 遇到非只读 Bash
  | { type: 'edit'; toolName; filePath }       // 写入工具缺少权限
  | { type: 'denied_tool'; toolName; detail }  // 不支持的工具
```

边界的精妙之处：**投机可以部分接受**。如果投机执行了 3 个 Read + 1 个 Edit 后因为 Bash 命令暂停，用户仍然可以接受已完成的 4 个操作的结果。

### 投机限制

```
MAX_SPECULATION_TURNS   = 20   // 最多 20 轮迭代
MAX_SPECULATION_MESSAGES = 100  // 最多 100 条消息
```

超出限制自动中止——防止投机消耗过多资源。

---

## Part 2：Overlay 文件系统——Copy-on-Write 的影子世界

### 设计思想

投机执行必须修改文件（Edit、Write），但**不能真的修改文件**——用户还没确认呢。解决方案是 **Overlay 文件系统**：

```
真实文件系统                    Overlay 目录
/project/                      ~/.claude/temp/speculation/{pid}/{id}/
  ├── src/                       ├── src/
  │   ├── auth.ts  ← 原始文件    │   └── auth.ts  ← 修改后的副本
  │   └── index.ts               │
  └── package.json               └── package.json  ← 修改后的副本
```

### Copy-on-Write 机制

```
写操作拦截流程：

  Edit({ file_path: "src/auth.ts", ... })
       │
       ▼
  canUseTool 拦截
       │
       ├── 文件是否已在 Overlay 中？
       │    └── 否 → 复制原文件到 Overlay
       │              copyFile("project/src/auth.ts", "overlay/src/auth.ts")
       │              writtenPathsRef.add("src/auth.ts")
       │
       ▼
  重写路径：input.file_path = "overlay/src/auth.ts"
       │
       ▼
  工具正常执行（写入 Overlay 副本，不触碰真实文件）
```

```
读操作拦截流程：

  Read({ file_path: "src/auth.ts" })
       │
       ▼
  canUseTool 拦截
       │
       ├── 文件是否在 writtenPathsRef 中？
       │    ├── 是 → 重写路径到 Overlay（读修改后的版本）
       │    └── 否 → 保持原路径（读真实文件）
       │
       ▼
  工具正常执行
```

**工具完全不知道 Overlay 的存在**——路径重写发生在权限层，工具以为自己在读写真实文件。这种透明性意味着任何现有工具都可以参与投机执行，无需修改。

### 物化与清理

```
用户确认（Tab/Enter）：
  1. abort() 停止投机 Agent
  2. copyOverlayToMain() → 逐个文件从 Overlay 复制到真实 FS
  3. safeRemoveOverlay() → 删除 Overlay 目录（3 次重试）
  4. 投机消息注入对话历史
  5. 更新 speculationSessionTimeSavedMs

用户拒绝（输入其他内容）：
  1. abort() 停止投机 Agent
  2. safeRemoveOverlay() → 删除 Overlay 目录
  3. 状态重置为 idle
  4. 没有任何副作用——文件系统未被触碰
```

### 消息注入：投机结果进入对话

用户确认后，投机期间的消息需要注入到真实对话中。但不是所有消息都该保留：

```typescript
function prepareMessagesForInjection(messages: Message[]): Message[] {
  // 1. 找到有成功结果的 tool_use ID
  const successfulToolIds = findSuccessfulToolResults(messages)

  // 2. 过滤规则：
  //    ✅ 保留：有成功结果的 tool_use 和 tool_result
  //    ❌ 丢弃：thinking / redacted_thinking 块
  //    ❌ 丢弃：没有成功结果的 tool_use（被中断的）
  //    ❌ 丢弃：中断消息（INTERRUPT_MESSAGE）
  //    ❌ 丢弃：只有空白文本的消息
}
```

这保证了注入的消息是**干净的、已完成的操作**——不会有半成品或中断状态污染对话历史。

---

## Part 3：流水线——投机的投机

当投机完整完成（`boundary.type === 'complete'`）时，系统会做更激进的事——**生成下一条建议并开始下一轮投机**：

```
用户看到建议 A → 投机 A 在后台执行
                    │
                    ├── 投机 A 完成
                    │       │
                    │       └── 生成建议 B → 投机 B 在后台开始
                    │
                    ▼
用户确认建议 A → 物化 A → 展示建议 B（已经投机执行完了！）
                              │
                              ▼
                用户确认建议 B → 物化 B → ...
```

这是**流水线（Pipelining）**——第一轮投机完成后立刻开始第二轮，而用户甚至还没确认第一轮。如果用户连续 Tab 确认，每次确认都是瞬时的。

流水线的投机使用增强上下文：

```typescript
const augmentedContext = {
  ...parentContext,
  messages: [
    ...parentMessages,
    userMessage(suggestionA),     // 假设用户接受了建议 A
    ...speculatedMessagesA       // 投机 A 的执行结果
  ]
}
// 基于这个增强上下文，生成建议 B 并开始投机 B
```

---

## Part 4：自研状态管理——35 行代码的 Store

支撑投机执行等复杂交互的底层，是 Claude Code 自研的状态管理系统——没有 Redux，没有 Zustand，只有 35 行代码的 `createStore()`。

### 极简 Store

```typescript
// src/state/store.ts — 完整实现只有 35 行
function createStore<T>(initialState: T, onChange?: () => void): Store<T> {
  let state = initialState
  const listeners = new Set<() => void>()

  return {
    getState: () => state,
    setState: (updater: (prev: T) => T) => {
      const next = updater(state)
      if (Object.is(next, state)) return  // 引用不变则跳过
      state = next
      onChange?.()
      listeners.forEach(l => l())
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    }
  }
}
```

**设计哲学**：没有中间件、没有 action 类型、没有 reducer——只有函数式更新和引用相等检查。

### DeepImmutable：类型级不可变性

```typescript
type AppState = DeepImmutable<{
  tasks: Record<TaskId, TaskState>
  speculation: SpeculationState
  toolPermissionContext: ToolPermissionContext
  denialTracking?: DenialTrackingState
  speculationSessionTimeSavedMs: number
  // ... 更多字段
}>
```

`DeepImmutable` 在类型层面把整棵状态树标记为只读——编译器会拒绝任何直接修改。所有更新必须通过 `setState(prev => ({...prev, ...changes}))` 创建新引用。

### 选择性路径更新

状态更新只克隆从根到叶的路径，其余引用保持不变：

```typescript
store.setState(prev => ({
  ...prev,                           // 根（浅克隆）
  toolPermissionContext: {
    ...prev.toolPermissionContext,    // 中间层（浅克隆）
    alwaysAllowRules: {
      ...prev.toolPermissionContext.alwaysAllowRules,  // 叶（浅克隆）
      command: newRules               // 实际变化
    }
  }
}))
```

未变化的分支（如 `tasks`、`speculation`）保持同一引用——`Object.is()` 检查立即返回"无变化"，跳过重渲染。

### React 集成：useSyncExternalStore

```typescript
function useAppState<R>(selector: (s: AppState) => R): R {
  const store = useAppStore()
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState())
  )
}
```

组件通过选择器订阅状态的**切片**——只有切片引用变化时才触发重渲染。这在渲染性能上等价于 Zustand 的选择器模式，但不需要引入任何外部依赖。

### 集中式副作用：onChange 回调

```typescript
// src/state/onChangeAppState.ts
function onChangeAppState(prev, next) {
  // 权限模式变更 → 同步到远程
  if (prev.toolPermissionContext.mode !== next.toolPermissionContext.mode) {
    syncModeToRemote(next.toolPermissionContext.mode)
  }

  // 模型变更 → 持久化到 settings.json
  if (prev.mainLoopModel !== next.mainLoopModel) {
    saveModelToSettings(next.mainLoopModel)
  }

  // UI 偏好变更 → 持久化
  if (prev.expandedView !== next.expandedView) {
    saveExpandedViewPreference(next.expandedView)
  }
}
```

所有副作用集中在一个 `onChange` 回调中——状态变更是纯的，副作用是可审计的。

### 跨进程状态同步

子 Agent（投机 Agent、后台 Agent）与父 Agent 的状态关系有两种模式：

```
共享模式（shareSetAppState: true）：
  · 子 Agent 的 setAppState 指向父 Store
  · 变更立刻传播到 UI
  · 用于需要实时反馈的场景

隔离模式（shareSetAppState: false）：
  · 子 Agent 的 setAppState 是空操作
  · 变更不影响父 Store
  · 用于投机执行、异步 Agent
```

投机 Agent 使用隔离模式——它的状态变更不应该在确认前影响 UI。确认时，投机的消息通过 `setMessages()` 批量注入。

---

## Part 5：渲染层的内存优化——String Interning

状态管理的另一面是**渲染效率**。Claude Code 在自定义 Ink 渲染引擎中使用了三个 Intern Pool 来减少内存分配：

### 三级 Intern Pool

| Pool | 缓存对象 | 优化效果 |
|------|----------|----------|
| **CharPool** | 单个字符 → 数字 ID | ASCII 快速路径：直接数组查找，零 Map 开销 |
| **StylePool** | ANSI 样式数组 → 数字 ID | 80 字符行 × 3 个样式 = 3 次 intern 而非 80 次 |
| **HyperlinkPool** | URL 字符串 → 数字 ID | 5 分钟 TTL，链接是瞬态的 |

### 紧凑的 Cell 存储

屏幕缓冲区每个单元格用**两个 Int32** 存储，而非 JavaScript 对象：

```
word0: 32-bit char ID（interned）
word1: 15-bit styleId | 15-bit hyperlinkId | 2-bit width flag
```

这避免了每帧每单元格的对象分配——对于 200 列 × 50 行的终端，每帧节省 10,000 个对象的 GC 压力。

### 损伤区域跟踪

渲染帧之间的 diff 只扫描**损伤区域（Damage Rect）**——即标记为脏的矩形范围。未变化的区域通过 `blit`（TypedArray 批量复制）从上一帧直接搬运，无需重新计算。

---

## 为什么这样设计

### 1. 投机执行隐藏了"不可压缩"的延迟

API 延迟和工具执行时间是物理限制，无法通过优化消除。但用户的审查时间是"空闲"的——投机执行把工作从"用户确认后"移到了"用户思考中"，把串行变成了并行。

### 2. Copy-on-Write 比虚拟文件系统更简单

一个完整的虚拟文件系统（intercepting fs module）需要处理 stat、readdir、watch、symlink 等几十个 API。Copy-on-Write 只需要在 `canUseTool` 层重写路径——工具层面零修改，新工具自动兼容。

### 3. 35 行 Store 而非 Redux/Zustand

Claude Code 的状态管理需求很具体：函数式更新、引用相等、选择器订阅。35 行代码精确满足这些需求，不引入任何第三方依赖的复杂性。在一个已经有 512K 行代码的项目中，**减少依赖就是减少风险**。

### 4. 边界驱动的优雅降级

投机不是"全有或全无"——边界机制让部分完成的投机也能被接受。这比"投机失败 = 全部重来"好得多，因为即使只有几个 Read 的结果被复用，也节省了时间。

### 5. 流水线将投机推向极限

单轮投机节省一次等待时间。流水线让连续确认的场景中每一次都是瞬时的——这在快速迭代（一系列文件修改）时体验极好。

---

## 可借鉴的模式

### 模式一：Overlay 执行 + 透明路径重写

```
规则：需要"可回滚的执行"时，不修改执行层，在权限层重写路径。
实现：canUseTool 拦截 → Copy-on-Write 到临时目录 → 确认后物化。
适用场景：任何需要"预览修改"或"事务性操作"的 Agent 系统。
```

### 模式二：极简 Store + 类型级不可变

```
规则：状态管理的复杂度应该匹配需求，不是匹配框架。
实现：createStore() + DeepImmutable + useSyncExternalStore。
适用场景：中大型 TypeScript 项目，需要可预测状态但不需要 Redux 的仪式感。
```

### 模式三：空闲时间利用（投机 + 流水线）

```
规则：任何用户等待的时间都是潜在的预计算窗口。
实现：投机执行 + 流水线 + 边界暂停 + 部分接受。
适用场景：任何有"确认→执行→确认"循环的交互系统。
```

---

## 下一篇预告

投机执行是单个 Agent 的优化。但 Claude Code 还支持**多 Agent 编排**——一个 Coordinator 指挥多个 Sub-Agent，分别在独立的 Git Worktree 中工作，通过 SendMessage 协调。三种执行模型（Sub-Agent、In-Process Teammate、Remote Agent）各有什么取舍？下一篇，我们拆解多 Agent 编排。

---

| 篇 | 标题 | 状态 |
|----|------|------|
| [01](/part1-foundation/ch01-architecture) | 512K 行代码，一个终端里的 Agent Runtime | ✅ |
| [02](/part1-foundation/ch02-react-loop) | ReAct 循环：`while(true)` 里的五个阶段与七层恢复 | ✅ |
| [03](/part1-foundation/ch03-cache-compression) | Prompt 缓存分割与四级上下文压缩 | ✅ |
| [04](/part2-core/ch04-tool-system) | 50 个工具的统一契约：Tool System 设计 | ✅ |
| [05](/part2-core/ch05-memory) | 五层记忆体系：从短期到持久化 | ✅ |
| [06](/part2-core/ch06-security) | 纵深防御：23 项安全检查与"不信任任何输入" | ✅ |
| **07** | **投机执行与自研状态管理：隐藏延迟的两个利器**（本篇） | ✅ |
| 08 | 多 Agent 编排：三种执行模型与 Coordinator 模式 | 🔄 下一篇 |
| 09 | 在终端里造一个浏览器：自定义 Ink 渲染引擎 | ⬚ |
| 10 | Bridge 与协议层：让 VS Code、Web、Mobile 共享一个 Claude | ⬚ |
| 11 | Skill、Plugin、Hook：三层扩展的设计谱系 | ⬚ |
| 12 | 回顾：从 Claude Code 中提炼的 10 个 Agent 工程模式 | ⬚ |
