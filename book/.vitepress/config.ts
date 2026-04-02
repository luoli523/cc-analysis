import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/cc-analysis/',
  title: 'Claude Code源码剖析',
  description: '从 512K 行源码中提炼的 Agent 工程方法论',
  lang: 'zh-CN',

  themeConfig: {
    siteTitle: 'Claude Code源码剖析',

    nav: [
      { text: '首页', link: '/' },
      { text: '开始阅读', link: '/part1-foundation/' },
    ],

    sidebar: [
      {
        text: '第一部分：架构基础',
        collapsed: false,
        items: [
          { text: '本部分导读', link: '/part1-foundation/' },
          { text: '第1章：512K 行代码，一个终端里的 Agent Runtime', link: '/part1-foundation/ch01-architecture' },
          { text: '第2章：ReAct 循环与七层恢复', link: '/part1-foundation/ch02-react-loop' },
          { text: '第3章：Prompt 缓存分割与四级上下文压缩', link: '/part1-foundation/ch03-cache-compression' },
        ],
      },
      {
        text: '第二部分：核心系统',
        collapsed: false,
        items: [
          { text: '本部分导读', link: '/part2-core/' },
          { text: '第4章：50 个工具的统一契约', link: '/part2-core/ch04-tool-system' },
          { text: '第5章：五层记忆体系', link: '/part2-core/ch05-memory' },
          { text: '第6章：纵深防御与安全检查', link: '/part2-core/ch06-security' },
        ],
      },
      {
        text: '第三部分：性能与渲染',
        collapsed: false,
        items: [
          { text: '本部分导读', link: '/part3-performance/' },
          { text: '第7章：投机执行与自研状态管理', link: '/part3-performance/ch07-speculation-state' },
          { text: '第8章：多 Agent 编排', link: '/part3-performance/ch08-multi-agent' },
          { text: '第9章：自定义 Ink 渲染引擎', link: '/part3-performance/ch09-ink-renderer' },
        ],
      },
      {
        text: '第四部分：集成与模式',
        collapsed: false,
        items: [
          { text: '本部分导读', link: '/part4-integration/' },
          { text: '第10章：Bridge 与协议层', link: '/part4-integration/ch10-bridge-protocol' },
          { text: '第11章：Skill、Plugin、Hook 三层扩展', link: '/part4-integration/ch11-skill-plugin-hook' },
          { text: '第12章：10 个 Agent 工程模式', link: '/part4-integration/ch12-agent-patterns' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/luoli523/cc-analysis' },
    ],

    footer: {
      message: '基于 CC BY-NC-SA 4.0 许可证发布',
      copyright: '© 2026 鬼哥',
    },

    search: {
      provider: 'local',
    },

    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    outline: {
      label: '本页目录',
      level: [2, 3],
    },

    lastUpdated: {
      text: '最后更新于',
    },

    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '目录',
    darkModeSwitchLabel: '主题',
  },
})
