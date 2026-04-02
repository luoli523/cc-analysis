# 第三部分：性能与渲染

> 隐藏延迟、并行协作、终端浏览器：三个让用户感知不到复杂度的工程利器。

Agent 系统最大的用户体验挑战是**等待**——等模型生成、等工具执行、等用户批准。这一部分介绍三种不同层次的性能优化策略。

**第 7 章** 投机执行与状态管理：用 Copy-on-Write Overlay 在用户批准前就开始工作，用 35 行 `createStore()` 替代 Redux 管理全局状态。

**第 8 章** 多 Agent 编排：当单 Agent 撞上上下文天花板，三种执行模型（Sub-Agent + Worktree、In-Process Teammate、Remote Agent）如何分而治之。

**第 9 章** 在终端里造浏览器：自定义 React Reconciler、Yoga Flexbox 布局、Int32Array 打包缓冲区、损伤矩形 Diff、DECSTBM 硬件滚动——一套完整的终端渲染管线。
