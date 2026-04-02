<template>
  <div class="toc-wrap">

    <h2 class="toc-title">完整目录</h2>

    <div class="toc-grid">

      <div class="toc-part">
        <a class="part-heading" href="/cc-analysis/part1-foundation/">第一部分：架构基础</a>
        <p class="part-desc">从全景到细节：技术栈选型、ReAct 主循环设计、Token 经济学与缓存策略。</p>
        <ul>
          <li><a href="/cc-analysis/part1-foundation/ch01-architecture">第1章：512K 行代码，一个终端里的 Agent Runtime</a></li>
          <li><a href="/cc-analysis/part1-foundation/ch02-react-loop">第2章：ReAct 循环——while(true) 里的五个阶段与七层恢复</a></li>
          <li><a href="/cc-analysis/part1-foundation/ch03-cache-compression">第3章：Prompt 缓存分割与四级上下文压缩</a></li>
        </ul>
      </div>

      <div class="toc-part">
        <a class="part-heading" href="/cc-analysis/part2-core/">第二部分：核心系统</a>
        <p class="part-desc">Agent 的手脚和记忆：50 个工具的统一契约、五层记忆体系、六层安全纵深。</p>
        <ul>
          <li><a href="/cc-analysis/part2-core/ch04-tool-system">第4章：50 个工具的统一契约——Tool System 设计</a></li>
          <li><a href="/cc-analysis/part2-core/ch05-memory">第5章：五层记忆体系——从短期到持久化</a></li>
          <li><a href="/cc-analysis/part2-core/ch06-security">第6章：纵深防御——23 项安全检查与"不信任任何输入"</a></li>
        </ul>
      </div>

      <div class="toc-part">
        <a class="part-heading" href="/cc-analysis/part3-performance/">第三部分：性能与渲染</a>
        <p class="part-desc">隐藏延迟、并行协作、终端浏览器：三个让用户感知不到复杂度的工程利器。</p>
        <ul>
          <li><a href="/cc-analysis/part3-performance/ch07-speculation-state">第7章：投机执行与自研状态管理</a></li>
          <li><a href="/cc-analysis/part3-performance/ch08-multi-agent">第8章：多 Agent 编排——三种执行模型与 Coordinator 模式</a></li>
          <li><a href="/cc-analysis/part3-performance/ch09-ink-renderer">第9章：在终端里造一个浏览器——自定义 Ink 渲染引擎</a></li>
        </ul>
      </div>

      <div class="toc-part">
        <a class="part-heading" href="/cc-analysis/part4-integration/">第四部分：集成与模式</a>
        <p class="part-desc">多端共享、三层扩展、十大模式：从工程实现到方法论提炼。</p>
        <ul>
          <li><a href="/cc-analysis/part4-integration/ch10-bridge-protocol">第10章：Bridge 与协议层——让多端共享一个 Claude</a></li>
          <li><a href="/cc-analysis/part4-integration/ch11-skill-plugin-hook">第11章：Skill、Plugin、Hook——三层扩展的设计谱系</a></li>
          <li><a href="/cc-analysis/part4-integration/ch12-agent-patterns">第12章：从 Claude Code 中提炼的 10 个 Agent 工程模式</a></li>
        </ul>
      </div>

    </div>

  </div>
</template>

<style scoped>
.toc-wrap {
  max-width: 1152px;
  margin: 0 auto;
  padding: 48px 24px 64px;
}

.toc-title {
  text-align: center;
  font-size: 1.6rem;
  font-weight: 600;
  margin-bottom: 36px;
  border: none !important;
}

.toc-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.toc-part {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 22px 24px;
  transition: border-color 0.2s;
}

.toc-part:hover {
  border-color: var(--vp-c-brand-1);
}

.part-heading {
  display: block;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  text-decoration: none;
  margin-bottom: 6px;
}

.part-heading:hover {
  color: var(--vp-c-brand-1);
}

.part-desc {
  font-size: 0.82rem;
  color: var(--vp-c-text-2);
  line-height: 1.55;
  margin: 0 0 12px;
}

.toc-part ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.toc-part ul li {
  border-top: 1px solid var(--vp-c-divider);
}

.toc-part ul li a {
  display: block;
  padding: 6px 0;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition: color 0.15s;
}

.toc-part ul li a:hover {
  color: var(--vp-c-brand-1);
}

.toc-appendix {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 16px 24px;
}

.apx-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  margin-right: 8px;
}

.toc-appendix a {
  font-size: 0.82rem;
  color: var(--vp-c-text-2);
  text-decoration: none;
  padding: 4px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 20px;
  transition: border-color 0.15s, color 0.15s;
}

.toc-appendix a:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

@media (max-width: 768px) {
  .toc-grid {
    grid-template-columns: 1fr;
  }
  .toc-appendix {
    gap: 6px;
  }
}
</style>
