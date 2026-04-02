# 解剖 Claude Code（十一）：Skill、Plugin、Hook——三层扩展的设计谱系

> 一个 Agent 工具再多，也不可能覆盖所有场景。Claude Code 的解法是**三层扩展机制**：**Skill** 是可复用的提示模板（"做什么"），**Plugin（MCP Server）** 引入外部工具和资源（"能做什么"），**Hook** 在工具执行的关键时刻注入自定义逻辑（"怎么做"）。三者从高到低覆盖了"工作流定义 → 能力扩展 → 行为注入"的完整扩展谱系。

![封面图：三层扩展](./images/11-cover.png)
<!-- IMG_11_COVER -->

---

## 问题

Claude Code 内置了 50+ 个工具，但用户的需求远超这个范围：

1. **重复工作流**：每次提交代码都要执行同样的步骤（检查、格式化、提交、推送）——能否打包成一键命令？
2. **外部系统集成**：需要查询 Jira、操作数据库、调用内部 API——内置工具不可能覆盖所有服务
3. **策略与合规**：企业要求每次文件修改都经过代码审查 Hook、每次 Bash 命令都检查安全策略——需要在工具执行前后注入检查逻辑

这三个需求对应三种不同的扩展层次：

| 需求 | 扩展层 | 核心抽象 |
|------|--------|---------|
| 打包工作流 | Skill | 提示模板 + 参数替换 |
| 引入外部能力 | Plugin（MCP Server） | 工具 + 资源 + 协议 |
| 注入执行逻辑 | Hook | 事件 + 回调 + 决策 |

---

## 在整体架构中的位置

```
用户输入 "/commit fix auth bug"
   │
   ├─→ Skill 层：展开 /commit 的提示模板 → 注入到对话中
   │
   ▼
Agent Loop（ReAct 循环）
   │
   ├─→ Plugin 层：通过 MCP 协议调用外部工具（Jira、DB、API）
   │
   ├─→ Hook 层：
   │     ├─ PreToolUse  → 执行前检查（策略、审批）
   │     ├─ PostToolUse → 执行后处理（日志、通知）
   │     └─ 26 种事件  → 覆盖完整生命周期
   │
   ▼
工具执行 → 结果返回
```

三层扩展不是互斥的——一个工作流可以同时用到 Skill（定义流程）、Plugin（调用外部工具）和 Hook（注入检查）。

---

## Part 1：Skill——提示模板与延迟展开

Skill 的本质是**延迟展开的提示模板**：定义时只存储元数据和模板内容，调用时才展开为完整的用户消息注入到对话中。

### Skill 文件格式

```
~/.claude/skills/
└── my-skill/
    └── SKILL.md
```

一个 SKILL.md 的结构：

```markdown
---
name: "Code Review"
description: "对指定文件进行代码审查"
when-to-use: "当用户要求审查代码时"
allowed-tools: [Read, Grep, Glob]
model: "claude-sonnet-4-6"
arguments: ["file_path"]
user-invocable: true
---

# 代码审查

请对以下文件进行代码审查：${file_path}

重点检查：
1. 安全漏洞（OWASP Top 10）
2. 性能问题
3. 代码风格一致性

使用 Read 工具读取文件，用 Grep 搜索相关上下文。
```

### Frontmatter 字段

| 字段 | 类型 | 用途 |
|------|------|------|
| `name` | string | 显示名称（缺省用目录名） |
| `description` | string | 简短描述（自动从 Markdown 推导） |
| `when-to-use` | string | 模型判断何时调用的指引 |
| `arguments` | string[] | 参数名（用于 `${arg}` 替换） |
| `allowed-tools` | string[] | 限制可用的工具集 |
| `model` | string | 模型覆盖（如 `claude-opus-4-6`） |
| `effort` | string | 推理力度（low/medium/high） |
| `context` | string | 执行上下文（`inline` 或 `fork`） |
| `agent` | string | Fork 执行时的 Agent 类型 |
| `paths` | string[] | 条件激活的文件模式 |
| `hooks` | object | Skill 专属的 Hook 配置 |
| `user-invocable` | boolean | 是否出现在 `/` 命令列表中 |
| `disable-model-invocation` | boolean | 是否阻止 SkillTool 自动调用 |

### 四层来源

Skill 从四个位置加载，优先级从高到低：

```
1. 企业策略目录（Managed）      → 管理员强制部署
2. 用户目录（~/.claude/skills/） → 个人定制
3. 项目目录（.claude/skills/）   → 团队共享
4. 内置 Skill（bundled）         → Claude Code 自带
```

### 执行流程

```
用户输入 /commit -m "fix auth"
   ↓
1. SkillTool 查找名为 "commit" 的 Skill
   ↓
2. 权限检查：
   · 只读属性的 Skill → 自动放行
   · 有副作用的 Skill → 弹出权限确认
   ↓
3. 展开模板：
   · getPromptForCommand("-m fix auth", context)
   · 参数替换：${ARGUMENTS} → "-m fix auth"
   · 内联 Shell：!`git status` → 执行并替换为输出
   · 路径替换：${CLAUDE_SKILL_DIR} → Skill 文件所在目录
   ↓
4. 执行模式选择：
   · context: 'inline'（默认）→ 展开的内容注入当前对话
   · context: 'fork' → 在独立的 Sub-Agent 中执行
   ↓
5. 模型处理展开后的提示 → 调用工具 → 返回结果
```

### Inline vs Fork

```
Inline（默认）：
  Skill 内容展开后直接注入当前对话。
  模型在当前上下文中处理，可以看到之前的对话历史。
  适合：需要上下文的短任务（代码审查、提交）

Fork：
  Skill 在独立的 Sub-Agent 中执行。
  有独立的 Token 预算和上下文窗口。
  结果作为字符串返回到父对话。
  适合：长时间运行或资源密集的任务（大规模重构）
```

### 条件激活 Skill

```yaml
---
name: "React Component Check"
paths: ["src/components/**/*.tsx"]
---
```

带 `paths` 的 Skill 在启动时不加载——只有当用户操作匹配模式的文件时才激活。这避免了为不相关的 Skill 消耗提示空间。

### SkillTool 的预算管理

Skill 列表需要告诉模型"有哪些 Skill 可用"——但太多描述会浪费 Token。SkillTool 的提示生成器有一个**预算分配**策略：

```
总预算 = 上下文窗口 × 1%（~8000 字符）

1. 内置 Skill → 完整描述（从不截断）
2. 用户/项目 Skill → 按需截断
3. 单条上限 250 字符
4. 超出预算 → 从最低优先级开始丢弃
```

---

## Part 2：Plugin——MCP Server 与工具集成

Plugin 通过 **MCP（Model Context Protocol）** 将外部系统的能力引入 Claude Code。每个 Plugin 本质上是一个 MCP Server——它可以提供工具、资源和提示模板。

### MCP Server 配置

```json
// .mcp.json（项目级）或 ~/.claude/config.json（用户级）
{
  "mcpServers": {
    "my-db": {
      "type": "stdio",
      "command": "python",
      "args": ["-m", "db_mcp_server"],
      "env": { "DB_URL": "postgres://..." }
    },
    "internal-api": {
      "type": "http",
      "url": "https://mcp.internal.example.com/api",
      "headers": { "Authorization": "Bearer ${API_TOKEN}" }
    }
  }
}
```

### 八种传输类型

| 类型 | 传输方式 | 典型场景 |
|------|---------|---------|
| `stdio` | 子进程 stdin/stdout | 本地工具（Python/Node 脚本） |
| `sse` | Server-Sent Events | HTTP 长轮询服务 |
| `http` | Streamable HTTP | 标准 REST API |
| `ws` | WebSocket | 双向实时通信 |
| `sdk` | 进程内（In-Process） | 内置服务（VS Code 桥、Chrome） |
| `sse-ide` | SSE（IDE 专用） | IDE 扩展 |
| `ws-ide` | WebSocket（IDE 专用） | IDE 扩展 |
| `claudeai-proxy` | Claude.ai 代理中继 | 组织管理的连接器 |

### 配置层级与合并

配置从 8 个来源合并，优先级从高到低：

```
1. 企业配置（managed/.mcp.json）  ← 排他：存在则忽略其他
2. 运行时注入（--mcp-config）
3. 本地配置（.mcp.json）
4. 项目配置（.claude/config.json）
5. 用户配置（~/.claude/config.json）
6. 插件配置（plugin manifest）
7. Claude.ai 组织连接器
8. 企业白名单/黑名单过滤
```

**去重机制**：基于内容签名（stdio = `command+args`，remote = `url`）防止同一个 Server 运行两次。

### Server 生命周期

```
1. 传输建立
   stdio → spawn 子进程
   http  → HTTP 连接 + OAuth 握手
   ws    → WebSocket 连接
   ↓
2. MCP 握手
   Client 声明能力：{ roots, elicitation }
   Server 声明能力：{ tools, resources, prompts, logging }
   ↓
3. 工具发现
   client.listTools() → 转换为 Claude Code 内部 Tool 格式
   ↓
4. 稳态运行
   工具调用 → MCP tools/call → 结果返回
   资源读取 → MCP resources/read → 内容返回
   ↓
5. 断线重连
   指数退避：1s → 2s → 4s → ... → 30s（最多 5 次）
   ↓
6. 优雅终止
   stdio: SIGINT(100ms) → SIGTERM(400ms) → SIGKILL
   总清理时间 ≤ 600ms
```

### 五种连接状态

```typescript
type MCPServerConnection =
  | ConnectedMCPServer      // 就绪
  | FailedMCPServer         // 连接失败
  | NeedsAuthMCPServer      // 需要 OAuth 认证
  | PendingMCPServer        // 重连中（含重试计数）
  | DisabledMCPServer       // 用户禁用
```

### 工具转换管线

```
MCP Server tools/list 响应
   ↓
Unicode 净化（防注入）
   ↓
名称映射：mcp__<server>__<tool_name>
   ↓
Schema 透传：inputSchema → JSON Schema for model
   ↓
注解映射：
  readOnlyHint    → isConcurrencySafe() + isReadOnly()
  destructiveHint → isDestructive()
  openWorldHint   → isOpenWorld()
  searchHint      → 延迟加载标记
  alwaysLoad      → 强制加载
   ↓
描述截断：max 2048 字符（OpenAPI 生成的可达 60KB）
   ↓
注册到工具池 → 模型可调用
```

### 认证三机制

```
1. OAuth 2.0（RFC 6749）
   标准 Client Credentials + PKCE
   元数据发现 + Token 刷新
   
2. Cross-App Access（XAA）
   企业联合身份
   跨 IdP Token 交换
   
3. 静态 Headers
   headersHelper 脚本动态生成
   环境变量展开
```

### 内置 MCP Server

Claude Code 内置了三个进程内 MCP Server：

| Server | 用途 | 传输 |
|--------|------|------|
| `claude-vscode` | VS Code 扩展桥接 | SDK（进程内） |
| `claude-for-chrome` | Chrome 浏览器控制 | 进程内链接传输对 |
| `computer-use` | 计算机使用（屏幕/键鼠） | 进程内链接传输对 |

进程内运行避免了 325MB+ 的子进程开销。

---

## Part 3：Hook——26 种事件与四种执行后端

Hook 是最细粒度的扩展——它在 Agent 生命周期的**关键时刻**注入自定义逻辑，可以检查、修改、甚至阻止即将执行的操作。

### 26 种 Hook 事件

**工具执行**：
| 事件 | 时机 | 可阻止 |
|------|------|:---:|
| `PreToolUse` | 工具执行前 | ✅ |
| `PostToolUse` | 工具执行成功后 | ❌ |
| `PostToolUseFailure` | 工具执行失败后 | ❌ |
| `PermissionRequest` | 权限弹窗显示时 | ❌ |
| `PermissionDenied` | 自动模式拒绝工具时 | ❌ |

**生命周期**：
| 事件 | 时机 |
|------|------|
| `SessionStart` | 会话初始化 |
| `SessionEnd` | 会话终止 |
| `Setup` | 仓库设置/维护 |

**对话与 Agent**：
| 事件 | 时机 |
|------|------|
| `UserPromptSubmit` | 用户提交输入 |
| `Stop` | Claude 即将结束回复 |
| `SubagentStart` | Sub-Agent 启动 |
| `SubagentStop` | Sub-Agent 结束 |
| `PreCompact` | 上下文压缩前 |
| `PostCompact` | 上下文压缩后 |

**文件与配置**：
| 事件 | 时机 |
|------|------|
| `FileChanged` | 监控的文件变更 |
| `CwdChanged` | 工作目录切换 |
| `ConfigChange` | 配置文件变更 |
| `InstructionsLoaded` | CLAUDE.md/rules 加载 |

还有 `Notification`、`TaskCreated`、`TaskCompleted`、`Elicitation`、`WorktreeCreate` 等。

### Hook 配置

```json
// settings.json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "python3 validate_command.py",
            "timeout": 10
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "http",
            "url": "https://audit.example.com/file-change",
            "headers": { "Authorization": "Bearer ${AUDIT_TOKEN}" },
            "allowedEnvVars": ["AUDIT_TOKEN"]
          }
        ]
      }
    ]
  }
}
```

### 四种执行后端

**Command Hook**——执行 Shell 命令：

```json
{
  "type": "command",
  "command": "python3 check_security.py",
  "shell": "bash",
  "timeout": 600,
  "statusMessage": "正在检查安全策略..."
}
```

输入通过 stdin JSON 传入，输出通过 stdout JSON 返回。

**Prompt Hook**——查询 LLM 判断：

```json
{
  "type": "prompt",
  "prompt": "这个 Bash 命令是否安全？$ARGUMENTS",
  "model": "claude-haiku-4-5",
  "timeout": 30
}
```

用小模型（默认 Haiku）做快速判断，返回 `{ "ok": true/false, "reason": "..." }`。

**Agent Hook**——启动多轮 Agent：

```json
{
  "type": "agent",
  "prompt": "验证这个文件修改是否符合规范：$ARGUMENTS",
  "model": "claude-haiku-4-5",
  "timeout": 60
}
```

比 Prompt Hook 更强力——可以调用工具、多轮推理，但更慢。

**HTTP Hook**——调用外部 Webhook：

```json
{
  "type": "http",
  "url": "https://policy-server.example.com/validate",
  "headers": { "Authorization": "Bearer ${TOKEN}" },
  "allowedEnvVars": ["TOKEN"],
  "timeout": 600
}
```

POST 请求发送 Hook 输入 JSON，响应体解析为 Hook 输出。

### 输入/输出协议

**输入**（stdin JSON）：

```json
{
  "hook_event_name": "PreToolUse",
  "session_id": "uuid",
  "cwd": "/project",
  "tool_name": "Bash",
  "tool_input": { "command": "rm -rf /tmp/cache" },
  "tool_use_id": "uuid"
}
```

**输出**（stdout JSON）：

```json
{
  "decision": "block",
  "reason": "rm -rf 命令需要人工确认",
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "危险命令被策略阻止"
  }
}
```

**退出码语义**：
| 退出码 | PreToolUse | 其他事件 |
|--------|-----------|---------|
| `0` | 放行 | 正常完成 |
| `2` | **阻止执行**（stderr 展示给模型） | stderr 展示给模型 |
| 其他 | 非阻塞错误（stderr 展示给用户） | 非阻塞错误 |

### Hook 执行流程

```
工具即将执行（如 Write）
   ↓
1. 信任检查：工作区信任是否已接受？
   ↓
2. 策略检查：allowManagedHooksOnly？disableHooks？
   ↓
3. 查找匹配 Hook：
   事件 = PreToolUse
   matcher = "Write" → 匹配所有 Write 相关 Hook
   if 条件 → 权限规则语法预过滤
   ↓
4. 并行执行所有匹配的 Hook
   ↓
5. 聚合结果：
   任一 Hook 返回 block → 阻止工具执行
   有 updatedInput → 修改工具输入
   有 additionalContext → 追加上下文给模型
   ↓
6. 决策传递给工具执行管线
```

### 安全机制

**工作区信任**：所有 Hook（不论类型）在交互模式下都需要用户接受工作区信任才能执行。这防止了恶意仓库的 `.claude/settings.json` 中植入 Hook 导致 RCE。

**HTTP Hook 的 SSRF 防护**：

```typescript
// DNS 解析验证
ssrfGuardedLookup(hostname)
  // 阻止：10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
  // 阻止：169.254.169.254（云元数据端点）
  // 允许：127.0.0.0/8（本地开发）

// Header 注入防护
value.replace(/[\r\n\x00]/g, '')  // CRLF 剥离

// 环境变量白名单
allowedEnvVars: ["TOKEN"]  // 只有显式列出的变量才会展开
```

**企业策略控制**：
- `allowManagedHooksOnly`: 只允许管理员定义的 Hook
- `disableHooks`: 禁用所有 Hook（包括管理员定义的）
- URL 白名单：HTTP Hook 只能调用允许的端点

### 异步 Hook

```json
// Hook 在 stdout 第一行输出：
{"async": true, "asyncTimeout": 30}

// 然后继续在后台运行
// 退出码 2 → 唤醒模型（如果 asyncRewake: true）
```

异步 Hook 适合长时间运行的验证（如完整测试套件），不阻塞 Agent 继续工作。

### Session Hook（编程式 API）

```typescript
// 注册一个函数 Hook（仅本次会话有效）
addFunctionHook(
  setAppState,
  sessionId,
  'PreToolUse',
  'Bash',           // matcher
  async (messages, signal) => {
    // 自定义验证逻辑
    return isAllowed
  },
  'Command blocked by policy',
  { timeout: 5000 }
)
```

Session Hook 存在于内存中，不持久化——适合 SDK 集成场景下的动态策略注入。

---

## 三层扩展的对比

| 维度 | Skill | Plugin（MCP） | Hook |
|------|-------|-------------|------|
| **抽象层次** | 工作流 | 能力 | 行为 |
| **核心机制** | 提示模板展开 | 协议通信 | 事件回调 |
| **触发方式** | 用户 `/command` 或模型自动 | 模型调用工具 | 工具执行生命周期 |
| **执行环境** | 当前对话或 Fork Agent | 外部进程/服务 | Shell/LLM/HTTP |
| **可阻止执行** | 否 | 否 | 是（PreToolUse） |
| **修改工具输入** | 否 | 否 | 是（updatedInput） |
| **安全模型** | 权限检查 | OAuth + 白名单 | 信任 + SSRF + 白名单 |
| **配置位置** | SKILL.md 文件 | .mcp.json / settings | settings.json |
| **生命周期** | 按需加载 | 会话全程运行 | 事件驱动 |

三者的设计意图不同：
- **Skill** 回答"我想让 Claude 做 X"——是用户意图的模板化
- **Plugin** 回答"Claude 需要访问 Y"——是能力的水平扩展
- **Hook** 回答"当 Claude 做 Z 时，先检查/记录/修改"——是行为的垂直切面

---

## 为什么这样设计

### 1. Skill 是提示而非代码

Skill 可以用代码实现（像 VS Code 扩展那样），但 Claude Code 选择了**提示模板**。原因很简单：用户能写自然语言，不一定能写代码。一个 SKILL.md 文件就是一段 Markdown——任何人都能创建和修改。

### 2. Plugin 用 MCP 而非自定义协议

MCP 是一个开放标准协议——已经有上千个现成的 MCP Server。选择 MCP 意味着 Claude Code 可以即时访问整个生态，而不需要从零建设插件市场。同时，MCP 的工具描述（JSON Schema）天然适合 LLM 理解和调用。

### 3. Hook 分四种后端

不同的检查需求对应不同的执行模型：
- **简单策略**（如"禁止 rm -rf"）→ 一个 Shell 命令就够了（Command）
- **模糊判断**（如"这个修改是否安全"）→ 需要 LLM 推理（Prompt/Agent）
- **集中策略**（如"企业合规检查"）→ 需要调用远程服务（HTTP）

四种后端覆盖了从"本地脚本"到"云端策略服务"的完整光谱。

### 4. Hook 的退出码设计

退出码 2 = 阻止，其他非零 = 非阻塞错误。为什么不用退出码 1？因为很多程序在各种情况下返回退出码 1——把它当作"阻止"会导致大量误拦截。退出码 2 是一个**显式的、不太可能意外触发**的信号。

### 5. 条件激活 Skill 节省 Token

把 50 个 Skill 的描述全放进系统提示会浪费宝贵的 Token。条件激活让 Skill 在用户**实际触及相关文件**时才出现——既节省了 Token，又保证了相关性。

---

## 可借鉴的模式

### 模式一：延迟展开模板

```
规则：存储时只保存模板元数据，调用时才展开完整内容。
实现：SKILL.md 的 frontmatter 存元数据，getPromptForCommand() 展开。
适用场景：任何需要大量预定义提示/模板的 LLM 应用——
         客服知识库、代码生成模板、自动化工作流。
```

### 模式二：开放协议扩展

```
规则：用开放标准协议（而非自定义 API）作为插件接口。
实现：MCP 协议 + 8 种传输 + 生态复用。
适用场景：任何需要第三方扩展的平台——
         API 网关、CI/CD 系统、开发工具。
```

### 模式三：事件驱动的行为注入

```
规则：在关键生命周期点暴露事件，允许外部逻辑注入决策。
实现：26 种 Hook 事件 + matcher 过滤 + 4 种执行后端。
适用场景：需要策略/合规/审计的企业系统——
         CI/CD Pipeline、API 网关、数据处理管道。
```

### 模式四：按文件模式条件激活

```
规则：扩展只在用户操作匹配的文件时才加载。
实现：paths 字段 + gitignore 模式匹配 + 延迟加载。
适用场景：按语言/框架/目录动态启用能力——
         IDE 插件、代码分析工具、构建系统。
```

---

## 下一篇预告

十一篇文章，我们从架构总览走到了扩展机制。最后一篇，我们回顾全系列，从 Claude Code 的 512K 行代码中提炼出 **10 个可复用的 Agent 工程模式**——从 ReAct 循环到投机执行，从安全纵深防御到多 Agent 编排——这些模式不只适用于 CLI Agent，而是任何 Agent 系统都可以借鉴的设计原则。

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
| **11** | **Skill、Plugin、Hook：三层扩展的设计谱系**（本篇） | ✅ |
| 12 | 回顾：从 Claude Code 中提炼的 10 个 Agent 工程模式 | 🔄 下一篇 |
