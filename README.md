# Sakura. — 一处安放代码、灵感与日常的地方

为 Sakura125809.github.io 定制的轻量个人博客。Jekyll + 原生 CSS/JavaScript，无 npm 构建依赖。保留原有 CNAME：`zqliu.me`。

## 功能

首页、文字归档、文章详情、实验室、关于、404；深浅主题；本地全文搜索（⌘K / Ctrl+K）；标签筛选；代码高亮与复制；自动目录、阅读时长和进度；Canvas 生成艺术（种子、暂停、随机生成、PNG 导出）；RSS、站点地图和 SEO。

页面不加载外部字体、统计或评论追踪脚本。仅附一篇明确标记的站点使用指南，没有虚构个人履历、历史文章或项目。

## 发布

沿用 GitHub Pages 的分支发布：**Settings → Pages → Deploy from a branch → master → / (root)**。已有 Pages 构建历史，不新增或混用自定义部署工作流。提交后在 Actions 查看 `pages build and deployment`。

站点地址：`https://zqliu.me/`。保留 CNAME 不保证 DNS/TLS 正确；如果域名不能访问，请检查 Pages 域名状态和域名提供商 DNS。仓库默认域名为 `https://sakura125809.github.io/`，配置自定义域名后可能自动重定向。

## 写文章

创建 `_posts/YYYY-MM-DD-slug.md`，顶部添加：

```yaml
---
title: "我的第一篇文章"
description: "一句话摘要"
date: 2026-09-19 10:00:00 +0800
tags: [随记]
---
```

下面写 Markdown。日期改为实际发布日期，未来日期默认不发布。首页、搜索、归档、RSS 自动更新。

**隐私：公开仓库中的 `_drafts` 和 `published: false` 不会让源文件变私密。不要提交秘密或不准备公开的文字。**

## 个性化

| 文件 | 用途 |
|---|---|
| `_config.yml` | 站名、简介、域名、公开链接 |
| `index.html` | 首页文案 |
| `about.html` | 个人介绍 |
| `lab.html` | 实验与项目 |
| `assets/style.css` | 配色、排版和响应式布局 |
| `assets/art.js` | 生成艺术 |
| `_posts/` | Markdown 文章 |

`assets/style.css` 顶部为浅色、深色设计变量；主色为 `--accent`。系统字体栈不需要下载字体。换域名时同时修改 `_config.yml` 的 `url`、CNAME、Pages 与 DNS 设置。

## 本地开发（macOS）

先通过 Homebrew 或 rbenv 准备合适的 Ruby 环境，不建议使用旧系统 Ruby。

```bash
gem install bundler
bundle install
bundle exec jekyll serve --livereload
```

访问 `http://127.0.0.1:4000`。生产构建：

```bash
JEKYLL_ENV=production bundle exec jekyll build
```

依赖使用 GitHub Pages 的兼容集合。可在本机验证后提交生成的 Gemfile.lock。

禁用 JavaScript 仍可阅读与导航；搜索、主题切换和艺术交互需要 JavaScript。动画尊重系统减少动态效果设置，可手动暂停。照片与字体请仅使用有权发布的素材。

暂未替站主选择开源许可证；公开可见不等于授权任意转载。后续确认许可意愿后再添加 LICENSE。
