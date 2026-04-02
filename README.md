# 解剖 Claude Code

> 从 512K 行泄露源码中提炼的 Agent 工程方法论

在线阅读：**https://luoli523.github.io/cc-analysis/**

## 内容简介

本书共 12 章，按「架构基础 → 核心系统 → 性能与渲染 → 集成与模式」四个部分逐步深入：

| 部分 | 章节 | 主题 |
|------|------|------|
| 第一部分：架构基础 | 第 1–3 章 | 全景导读、ReAct 循环、缓存与压缩 |
| 第二部分：核心系统 | 第 4–6 章 | 工具系统、记忆体系、安全纵深 |
| 第三部分：性能与渲染 | 第 7–9 章 | 投机执行、多 Agent 编排、Ink 渲染引擎 |
| 第四部分：集成与模式 | 第 10–12 章 | Bridge 协议、扩展机制、10 个工程模式 |

## 本地开发

```bash
npm install
npm run docs:dev      # 启动开发服务器 http://localhost:5175/cc-analysis/
npm run docs:build    # 构建静态文件
npm run docs:preview  # 预览构建产物
```

## 技术栈

- [VitePress](https://vitepress.dev/) 静态站点生成
- [Waline](https://waline.js.org/) 评论系统
- GitHub Actions 自动部署到 GitHub Pages
