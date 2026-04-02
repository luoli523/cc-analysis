# 解剖 Claude Code（十二）：回顾——从 Claude Code 中提炼的 10 个 Agent 工程模式

> 十一篇文章，我们从架构总览走到了扩展机制，从 `while(true)` 循环走到了终端渲染引擎。现在是时候回头看——从 512K 行代码中，哪些设计决策不是"Claude Code 特有的"，而是**任何 Agent 系统**都可以借鉴的工程模式？本篇提炼 10 个，每个配上原理、实现要点和适用边界。

![封面图：10 个 Agent 工程模式](./images/12-cover.png)
<!-- IMG_12_COVER -->

---

## 为什么要提炼模式？

Agent 工程还没有成熟的设计模式体系。GoF 有 23 个设计模式，分布式系统有 CAP 定理和 Saga 模式，但"如何工程化地构建一个 Agent"——业界还在摸索。

Claude Code 是目前公开可见的**最复杂的生产级 Agent 系统之一**。它不是实验室 Demo，而是每天服务数万开发者的工具。它踩过的坑、做出的取舍，值得提炼为可复用的模式。

以下 10 个模式按"从核心到外围"排列：先是 Agent 的心脏（主循环），然后是大脑（记忆与上下文），接着是手脚（工具与安全），最后是骨架（性能、协作、扩展）。

---

## 模式一：自愈主循环

> **来源**：[第 02 篇 · ReAct 循环](/part1-foundation/ch02-react-loop)

### 原理

Agent 的核心是一个**无限循环**：思考 → 行动 → 观察 → 思考……但生产环境中，这个循环会被无数异常打断：API 过载、上下文溢出、输出截断、网络超时、用户中断。

**自愈主循环**的关键是：**不要退出循环，而是在循环内部恢复**。

### Claude Code 的实现

```
while (true) {
  try {
    response = await callModel(messages)
    
    for (toolUse of response.toolCalls) {
      result = await executeTool(toolUse)
      messages.push(result)
    }
    
    if (response.stopReason === 'end_turn') break
    
  } catch (error) {
    // 7 层恢复，不退出循环
    if (isContextOverflow(error))  → compactMessages()
    if (isOutputTruncated(error))  → injectContinuationPrompt()
    if (isRateLimit(error))        → exponentialBackoff()
    if (isNetworkError(error))     → retryWithBackoff()
    if (isOverloaded(error))       → waitAndRetry()
    if (isAborted(error))          → cleanupAndBreak()
    if (isUnknown(error))          → logAndRetry(maxRetries)
  }
}
```

**七层恢复策略**：

| 异常 | 恢复策略 | 最大重试 |
|------|---------|---------|
| 上下文溢出 | 压缩消息历史 | 无限（只要能压缩） |
| 输出截断 | 注入"继续"提示 | 3 次 |
| 速率限制 | 指数退避等待 | 直到限制解除 |
| 网络错误 | 重试 + 退避 | 5 次 |
| 服务过载 | 长等待 + 重试 | 10 次 |
| 用户中断 | 清理 + 优雅退出 | 不重试 |
| 未知错误 | 日志 + 重试 | 3 次 |

### 适用场景

任何需要长时间运行的 Agent 系统。特别是：
- 需要多步推理的复杂任务
- 与不可靠的外部 API 交互
- 用户可能随时中断的交互式系统

### 关键约束

**不要无限重试所有错误**。用户中断和认证失败应该立即终止，而不是"自愈"。自愈的范围应该限于**可恢复的瞬态故障**。

---

## 模式二：缓存分割与渐进压缩

> **来源**：[第 03 篇 · Prompt 缓存分割与四级上下文压缩](/part1-foundation/ch03-cache-compression)

### 原理

LLM API 按输入 Token 收费，但**缓存命中的 Token 便宜 10 倍**。同时，上下文窗口有限——长对话最终会撞上天花板。

**缓存分割**解决成本问题：把不变的部分放在前面（命中缓存），变化的部分放在后面。
**渐进压缩**解决容量问题：对话增长时，逐级压缩保留核心信息。

### Claude Code 的实现

**缓存分割**：

```
系统提示 = [静态部分（全局缓存）] + [动态部分（会话缓存）]

静态（~10K Token，跨会话缓存）：
  · 身份声明、工具指南、安全规则
  · 位置：最前面，一个 cache_control 断点

动态（~5K Token，会话内缓存）：
  · 项目 CLAUDE.md、当前 git 状态
  · 位置：静态之后，另一个 cache_control 断点

对话历史（不缓存）：
  · 消息、工具结果
  · 位置：最后面
```

**四级压缩**：

```
Level 0: 无压缩（对话短于上下文 50%）
Level 1: 裁剪旧工具结果（保留摘要，删除细节）
Level 2: 用 LLM 摘要旧消息（保留关键决策和文件修改）
Level 3: 激进压缩（只保留最近 N 轮 + 全局摘要）
```

### 适用场景

任何使用 LLM API 的长对话系统——聊天机器人、Agent 系统、RAG 管线。

### 关键约束

**缓存分割要求提示结构稳定**。如果每次调用都改变系统提示的前半部分，缓存就失效了。Claude Code 甚至对工具 Schema 排序以保证缓存稳定性。

---

## 模式三：Fail-Closed 工具契约

> **来源**：[第 04 篇 · 50 个工具的统一契约](/part2-core/ch04-tool-system)，[第 06 篇 · 纵深防御](/part2-core/ch06-security)

### 原理

Agent 工具是**代码执行入口**——一个不安全的工具可以删除文件、运行恶意命令、泄露密钥。

**Fail-Closed** 意味着：**默认拒绝一切，需要显式授权才能执行**。如果工具定义中遗漏了某个安全属性，系统应该假设最严格的限制，而不是最宽松的。

### Claude Code 的实现

```typescript
buildTool({
  name: 'MyTool',
  // 如果忘记声明以下属性，它们的默认值是最安全的：
  isReadOnly: () => false,           // 默认"有副作用"→ 需要权限
  isDestructive: () => true,         // 默认"有破坏性"→ 需要确认
  isConcurrencySafe: () => false,    // 默认"不能并发"→ 串行执行
  needsPermissions: () => true,      // 默认"需要权限"
  userFacingName: () => name,        // 对外展示的名称（可不同于内部名）
})
```

**六层安全纵深**：

```
Layer 1: 操作系统沙箱（Seatbelt/bubblewrap）
Layer 2: 权限模式（allow/ask/deny 三态决策）
Layer 3: 规则匹配（8 个来源的 allow/deny 规则）
Layer 4: 命令验证（纯 TypeScript Bash 解析器，23 项检查）
Layer 5: 路径验证（符号链接解析 + 沙箱边界检查）
Layer 6: 内容检测（40+ 秘密模式 + AI 分类器）
```

### 适用场景

任何允许 LLM 调用工具/执行代码的系统。

### 关键约束

Fail-Closed 的代价是**更多的权限弹窗**。Claude Code 通过规则系统（用户可定义 allow/deny 规则）和权限记忆（本次会话允许了就不再问）来平衡安全与体验。纯 Fail-Closed 不做任何缓解，用户会被频繁打断。

---

## 模式四：LLM 即检索器

> **来源**：[第 05 篇 · 五层记忆体系](/part2-core/ch05-memory)

### 原理

Agent 需要记忆——但传统的向量数据库检索有一个根本问题：**它用嵌入相似度做语义匹配，但用户的意图往往不是"相似"而是"相关"**。

"我上周修复的那个 auth bug"和"认证模块的设计决策"在嵌入空间中可能很远，但对当前任务高度相关。

**LLM 即检索器**的方案：让 LLM 自己决定从记忆库中取什么。

### Claude Code 的实现

```
记忆检索流程：

1. 维护一个 MEMORY.md 索引（每条记忆一行摘要，< 200 行）
2. 每次对话开始时，MEMORY.md 自动加载到上下文
3. LLM 根据当前对话判断哪些记忆相关
4. 按需 Read 具体的记忆文件获取详情

不需要：向量数据库、嵌入模型、相似度阈值、top-K 参数
```

**五层记忆体系**：

| 层 | 时间尺度 | 机制 | 对应人类记忆 |
|---|---------|------|------------|
| 短期 | 当前对话 | Message[] 数组 | 工作记忆 |
| 工作 | 当前任务 | AppState（任务列表） | 桌面便签 |
| 长期 | 跨会话 | CLAUDE.md + Auto-Memory | 长期记忆 |
| 摘要 | 会话间 | 上下文压缩 + Session Memory | 日记摘要 |
| 检查点 | 持久化 | JSONL 追加写入 | 日志归档 |

### 适用场景

记忆量适中（数百到数千条）的 Agent 系统。当记忆量大到索引本身超过上下文窗口时，需要结合传统检索。

### 关键约束

**索引必须简洁**。如果 MEMORY.md 本身有上万行，它就占满了上下文窗口。Claude Code 限制索引在 200 行以内，每条不超过 150 字符。记忆量超过这个阈值时，需要引入分层索引或混合检索。

---

## 模式五：投机执行隐藏延迟

> **来源**：[第 07 篇 · 投机执行与自研状态管理](/part3-performance/ch07-speculation-state)

### 原理

LLM 流式生成时，后面的工具调用往往在前面的工具还在等用户批准时就已经生成了。传统做法是丢弃这些后续调用，等用户批准后再重新生成——浪费时间和 Token。

**投机执行**：在用户批准前就开始执行后续操作，但在一个**隔离的 Overlay 环境**中。如果用户批准了，Overlay 的结果直接生效；如果用户拒绝了，丢弃 Overlay，零成本回滚。

### Claude Code 的实现

```
模型生成：[Read(a.ts)] [Edit(a.ts, ...)] [Bash(npm test)]
                ↑
           用户需要批准 Edit

传统做法：
  执行 Read ✅ → 等用户批准 Edit → 用户批准 → 执行 Edit → 执行 Bash
  总延迟 = Read + 等待 + Edit + Bash

投机执行：
  执行 Read ✅ → 在 Overlay 中执行 Edit → 在 Overlay 中执行 Bash
                  ↓ 同时显示权限弹窗
                  用户批准 → Overlay 合并 → 零等待
  总延迟 = Read + max(等待, Edit + Bash)
```

**Overlay 文件系统**（Copy-on-Write）：

```
读取路径：
  1. 先查 Overlay 层（Map<path, Buffer>）
  2. 不在 Overlay → 读真实文件系统

写入路径：
  1. 总是写入 Overlay（不改真实文件）
  2. 用户批准 → Overlay 合并到真实文件系统
  3. 用户拒绝 → 丢弃 Overlay

透明性：
  工具代码完全不知道自己运行在 Overlay 中——
  路径重写在 canUseTool 层透明完成。
```

### 适用场景

任何有"人在环路中"的 Agent 系统——代码编辑需要审批、命令执行需要确认、数据修改需要校验。

### 关键约束

**不是所有操作都能投机执行**。有外部副作用的操作（发邮件、调 API、提交 PR）不能在 Overlay 中执行。Claude Code 定义了四种**边界条件**来暂停投机：上下文压缩、Bash 执行、文件编辑完成、权限拒绝。

---

## 模式六：编排-执行分离

> **来源**：[第 08 篇 · 多 Agent 编排](/part3-performance/ch08-multi-agent)

### 原理

单 Agent 有三个天花板：上下文窗口有限、串行执行瓶颈、模型成本不分级。

**编排-执行分离**的核心规则：**编排者只做分派和综合，不直接执行任务**。

### Claude Code 的实现

```
Coordinator（编排者）：
  可用工具 = { Agent, SendMessage, TaskStop, SyntheticOutput }
  职责 = 规划任务、分配 Worker、综合结果
  规则 = 绝不自己执行 Read/Write/Bash 等工具

Worker（执行者）：
  可用工具 = { Read, Write, Bash, Grep, ... }（完整工具集）
  职责 = 执行具体任务、报告结果
  隔离 = 独立的 Git Worktree + 独立的上下文窗口
```

**三种执行模型覆盖不同取舍**：

| 模型 | 隔离级别 | 通信开销 | 适用场景 |
|------|---------|---------|---------|
| Sub-Agent + Worktree | 文件系统隔离 | 低 | 可能产生文件冲突的并行任务 |
| In-Process Teammate | 进程内共享 | 最低 | 需要实时通信的持续协作 |
| Remote Agent | 完全独立 | 最高 | 长时间运行的远程任务 |

**综合原则**：Coordinator 必须综合 Worker 的发现后再下发指令。"根据你的发现去修改"是一个反模式——它把理解的责任推给了没有足够上下文的下一个 Agent。

### 适用场景

任务复杂到需要并行处理的 Agent 系统。特别是多文件修改、多模块分析、研究 + 实施的两阶段工作。

### 关键约束

编排者的**上下文窗口必须专注于全局视角**。如果编排者既规划又执行，它的上下文很快就被执行细节填满，失去了综合和规划的能力。

---

## 模式七：极简状态管理

> **来源**：[第 07 篇 · 投机执行与自研状态管理](/part3-performance/ch07-speculation-state)

### 原理

Agent 系统的状态管理有一个悖论：状态很复杂（对话历史、工具状态、权限、配置……），但状态管理方案应该**极简**。因为 Agent 系统已经有足够多的移动部件——状态管理不应该再增加认知负担。

### Claude Code 的实现

**35 行 createStore()**：

```typescript
function createStore<T>(initialValue: T) {
  let value: T = initialValue
  const listeners = new Set<() => void>()

  return {
    getState: () => value,
    setState: (updater: (prev: T) => T) => {
      value = updater(value)
      listeners.forEach(fn => fn())
    },
    subscribe: (fn: () => void) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    }
  }
}
```

**三个设计决策**：

1. **DeepImmutable 类型**：编译时阻止状态突变，不需要运行时 freeze
2. **onChange 集中副作用**：所有状态变更的副作用（持久化、同步、日志）都在一个 `onChange` 回调中处理
3. **useSyncExternalStore 集成**：React 通过原生 hook 订阅 Store，无需 Redux/MobX

**为什么不用 Redux/Zustand/MobX？**

- 生命周期比 React 组件长（Agent 在没有 UI 时也运行）
- 不需要中间件、devtools、time-travel
- 不需要 action/reducer/selector 的概念分层
- 35 行足够了

### 适用场景

状态模型相对简单、更新频率不高的系统。Agent 的状态通常是"少量大对象"（一个对话历史、一个工具池、一个配置对象），不是"大量小对象"。

### 关键约束

极简 Store 不适合需要**细粒度订阅**的场景（如表格中每个单元格独立订阅）。Claude Code 的场景是"整个 UI 在任何状态变化时重渲染"——React 的 VDOM diff 保证了性能。

---

## 模式八：打包缓冲区与 Intern Pool

> **来源**：[第 09 篇 · 自定义 Ink 渲染引擎](/part3-performance/ch09-ink-renderer)

### 原理

在 JavaScript 中，高频读写大量同构数据时，**对象数组**是性能杀手——每个对象带来 GC 压力、内存碎片和缓存未命中。

**打包缓冲区**用 TypedArray 存储同构数据，每个元素用位运算打包到固定宽度的整数中。**Intern Pool** 将重复出现的复杂值（字符串、样式）映射为整数 ID，让比较和存储都在整数域完成。

### Claude Code 的实现

```
屏幕缓冲区：24,000 cells × 2 Int32/cell = 192 KB
对比对象数组：24,000 objects ≈ 2-3 MB + GC 暂停

打包格式（每 cell 8 字节）：
  word0: charId（32-bit → CharPool 索引）
  word1: styleId[15bit] | hyperlinkId[15bit] | width[2bit]

三级 Intern Pool：
  CharPool  → ASCII 快速路径（Int32Array[128]）+ 非 ASCII Map
  StylePool → 样式数组 → ID + 转换缓存（(from,to) → ANSI 序列）
  HyperlinkPool → URL → ID
```

**StylePool 的转换缓存**是一个巧妙的优化：稳态帧中，相邻 cell 的样式转换模式是固定的（比如"代码 → 普通文本 → 代码"）。缓存 `(fromStyleId, toStyleId) → ANSI序列` 后，渲染管线的热循环完全没有字符串分配。

### 适用场景

JavaScript 中需要高性能处理大量同构数据的场景：
- 游戏引擎的粒子系统 / 碰撞检测
- 音频处理的采样缓冲区
- 数据可视化的像素缓冲区
- 任何需要避免 GC 暂停的实时系统

### 关键约束

打包缓冲区的代码**可读性较差**——位移和掩码操作不如 `cell.style` 直观。只在性能关键路径上使用，非热路径保持对象形式。

---

## 模式九：传输无关的消息协议

> **来源**：[第 10 篇 · Bridge 与协议层](/part4-integration/ch10-bridge-protocol)

### 原理

Agent 需要与多种前端通信（终端、IDE、Web、移动端），但每种前端的网络条件和传输能力不同。

**传输无关协议**：协议层定义消息类型和语义，传输层负责可靠投递。两者通过一个**接口**解耦——切换传输不影响协议逻辑。

### Claude Code 的实现

```
协议层：NDJSON（每行一个 JSON 对象）
  消息类型：user, assistant, stream_event, control_request, ...
  元数据：uuid（去重）, session_id（路由）, parent_tool_use_id（嵌套）

传输层接口：
  write(message) / writeBatch(messages[])
  setOnData(callback)
  connect() / close()
  isConnectedStatus()

三种传输实现：
  V1: 纯 WebSocket（简单但不可靠）
  V1+: Hybrid（WS 读 + HTTP POST 写，写可靠了）
  V2: SSE + CCR（读写都可靠，有序列号恢复）
```

**UUID 去重**：

```typescript
// 2000 条目的环形缓冲区
class BoundedUUIDSet {
  // O(1) add + O(1) has
  // FIFO 淘汰最老条目
}

// 两个独立的去重集
recentPostedUUIDs  → 过滤自己发出的消息被回弹
recentInboundUUIDs → 过滤服务端重发的消息
```

### 适用场景

任何需要多客户端连接的 Agent 系统，特别是需要在不同网络条件下工作的场景。

### 关键约束

**选 NDJSON 还是 Protobuf？** 取决于消息量级。Claude Code 每秒几十条消息，JSON 解析不是瓶颈——但可调试性（`console.log` 就能看）是巨大优势。如果消息量级是每秒几万条，二进制协议更合适。

---

## 模式十：三层扩展谱系

> **来源**：[第 11 篇 · Skill、Plugin、Hook](/part4-integration/ch11-skill-plugin-hook)

### 原理

Agent 的能力需要可扩展，但不同的扩展需求对应不同的抽象层次：

- 用户想定义**工作流**（"提交代码的时候自动跑 lint"）
- 开发者想集成**外部能力**（"让 Agent 能查 Jira"）
- 平台想注入**策略逻辑**（"每次文件修改都检查合规"）

用一种扩展机制覆盖所有需求会导致过度设计或能力不足。

### Claude Code 的实现

```
Skill（工作流层）：
  本质 = 延迟展开的提示模板
  格式 = Markdown + YAML frontmatter
  触发 = 用户 /command 或模型自动调用
  能力 = 定义流程、限制工具集、覆盖模型

Plugin（能力层）：
  本质 = MCP Server（外部进程/服务）
  协议 = Model Context Protocol（开放标准）
  集成 = 工具 + 资源 + 提示模板
  生态 = 数千个现成 MCP Server

Hook（行为层）：
  本质 = 事件回调（26 种事件 × 4 种后端）
  能力 = 检查、修改、阻止工具执行
  后端 = Shell 命令 / LLM 判断 / Agent 推理 / HTTP 调用
  安全 = 工作区信任 + SSRF 防护 + 环境变量白名单
```

**三层的设计意图不同**：

| 层 | 问题 | 控制力 | 门槛 |
|---|------|-------|------|
| Skill | "做什么" | 定义流程 | 写 Markdown |
| Plugin | "能做什么" | 扩展能力 | 实现 MCP Server |
| Hook | "怎么做" | 修改行为 | 写脚本/配置 |

### 适用场景

任何需要用户/开发者/管理员扩展的 Agent 平台。

### 关键约束

三层扩展的**安全模型各不相同**。Skill 是提示注入（相对安全），Plugin 是进程间通信（需要协议安全），Hook 是代码执行（需要沙箱和信任模型）。每一层都需要独立的安全设计。

---

## 模式总览

| # | 模式 | 一句话 | 关键取舍 |
|---|------|-------|---------|
| 1 | 自愈主循环 | 在循环内恢复，不退出循环 | 复杂度 vs 健壮性 |
| 2 | 缓存分割与渐进压缩 | 静态前置缓存，动态渐进压缩 | 缓存命中率 vs 灵活性 |
| 3 | Fail-Closed 工具契约 | 默认拒绝，显式授权 | 安全 vs 便利 |
| 4 | LLM 即检索器 | 让 LLM 自己选择相关记忆 | 简单性 vs 规模 |
| 5 | 投机执行 | 批准前在 Overlay 中先做 | 复杂度 vs 延迟 |
| 6 | 编排-执行分离 | 编排者不执行，执行者不编排 | 上下文隔离 vs 通信成本 |
| 7 | 极简状态管理 | 35 行 Store，不用框架 | 简单性 vs 功能 |
| 8 | 打包缓冲区 + Intern Pool | TypedArray 替代对象数组 | 性能 vs 可读性 |
| 9 | 传输无关协议 | 协议定义语义，传输可插拔 | 可适配性 vs 复杂度 |
| 10 | 三层扩展谱系 | 工作流 + 能力 + 行为 | 覆盖度 vs 设计复杂度 |

---

## 回顾全系列

十二篇文章，我们从外到内、从宏观到微观地拆解了 Claude Code 的架构：

```
第 01 篇  全景导读     → 512K 行代码的技术栈与数据流
第 02 篇  ReAct 循环   → Agent 的心脏：1,700 行的 while(true)
第 03 篇  缓存与压缩   → Token 经济学：10 倍成本差异的工程解法
第 04 篇  工具系统     → 50 个工具的统一契约与注册管线
第 05 篇  记忆体系     → 五层记忆：从 Message[] 到 JSONL 持久化
第 06 篇  安全纵深     → 六层防御、23 项检查、不信任任何输入
第 07 篇  投机与状态   → 用 Overlay 和 35 行 Store 隐藏延迟
第 08 篇  多 Agent     → 三种执行模型与 Coordinator 不执行原则
第 09 篇  渲染引擎     → 在终端里造浏览器：React + Yoga + Int32Array
第 10 篇  Bridge 协议  → NDJSON + 可插拔传输让多端共享一个 Agent
第 11 篇  扩展机制     → Skill + Plugin + Hook 三层扩展谱系
第 12 篇  模式提炼     → 10 个可复用的 Agent 工程模式（本篇）
```

Claude Code 不是一个完美的系统——没有哪个 500K+ 行的代码库是完美的。但它是**迄今为止公开可见的、最完整的生产级 Agent 架构参考**。它做出的每一个设计决策——无论是用 Bun 还是 Node、用 React 还是原生终端 API、用 MCP 还是自定义协议——背后都有清晰的工程推理。

理解这些推理，比复制这些代码更有价值。

---

| 篇 | 标题 | 状态 |
|----|------|------|
| [01](/part1-foundation/ch01-architecture) | 512K 行代码，一个终端里的 Agent Runtime | ✅ |
| [02](/part1-foundation/ch02-react-loop) | ReAct 循环：`while(true)` 里的五个阶段与七层恢复 | ✅ |
| [03](/part1-foundation/ch03-cache-compression) | Prompt 缓存分割与四级上下文压缩 | ✅ |
| [04](/part2-core/ch04-tool-system) | 50 个工具的统一契约：Tool System 设计 | ✅ |
| [05](/part2-core/ch05-memory) | 五层记忆体系：从短期到持久化 | ✅ |
| [06](/part2-core/ch06-security) | 纵深防御：23 项安全检查与"不信任任何输入" | ✅ |
| [07](/part3-performance/ch07-speculation-state) | 投机执行与自研状态管理：隐藏延迟的两个利器 | ✅ |
| [08](/part3-performance/ch08-multi-agent) | 多 Agent 编排：三种执行模型与 Coordinator 模式 | ✅ |
| [09](/part3-performance/ch09-ink-renderer) | 在终端里造一个浏览器：自定义 Ink 渲染引擎 | ✅ |
| [10](/part4-integration/ch10-bridge-protocol) | Bridge 与协议层：让 VS Code、Web、Mobile 共享一个 Claude | ✅ |
| [11](/part4-integration/ch11-skill-plugin-hook) | Skill、Plugin、Hook：三层扩展的设计谱系 | ✅ |
| **12** | **回顾：从 Claude Code 中提炼的 10 个 Agent 工程模式**（本篇） | ✅ |
