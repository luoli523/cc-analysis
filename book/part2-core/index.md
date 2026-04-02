# 第二部分：核心系统

> Agent 的手脚和记忆：50 个工具的统一契约、五层记忆体系、六层安全纵深。

Agent 能做什么取决于它的工具，能记住什么取决于它的记忆，能被信任取决于它的安全模型。这一部分拆解 Claude Code 的三大核心子系统。

**第 4 章** 剖析 Tool System：`Tool<Input, Output, Progress>` 泛型、`buildTool()` 的 Fail-Closed 默认值、从注册到执行的六步管线、延迟加载与 Schema 隐私。

**第 5 章** 解构五层记忆：从 `Message[]` 短期记忆到 JSONL 检查点持久化，以及 LLM-as-Retriever 如何替代向量数据库做记忆检索。

**第 6 章** 展开安全纵深：六层防御、纯 TypeScript Bash 解析器、23 项命令检查、40+ 秘密检测模式、AI 分类器——"不信任任何输入"的工程化实践。
