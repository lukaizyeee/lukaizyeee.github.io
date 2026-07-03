# 个人主页（框架 + 视觉系统）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按设计 spec（`docs/superpowers/specs/2026-07-03-homepage-design.md`）搭建 Astro 双语个人主页的完整框架与设计系统，全部页面用占位内容渲染，部署到 GitHub Pages。

**Architecture:** Astro 6 静态站；内容全部走 content collections（Markdown + zod schema 强校验）；英文默认无前缀、中文 `/zh` 前缀；设计系统 = CSS 设计令牌 + 一组零运行时 `.astro` 组件（动效为 CSS + 原生 JS）。

**Tech Stack:** Astro 6（Node 24, npm）· @fontsource 字体 · @astrojs/rss · @astrojs/sitemap · GitHub Actions + GitHub Pages

## Global Constraints

- 色彩仅 5 色相 + 派生中性阶，色值逐字复制 spec：底 `#F7F4EE`、薰衣草 `#CDCAE0`、中紫 `#8A82C9`、交互紫 `#5E6AD2`、墨 `#1C1917`、白卡 `#FFFFFF`；中性 `#44403C` `#78716C` `#E7E2D8`。不得引入新色相。
- 字体：标题 Source Serif 4 / 正文 Inter / 等宽 JetBrains Mono（均 webfont）；**中文一律系统字体栈，禁止加载 CJK webfont**。
- 不引入任何 UI 框架运行时（无 React/Vue）；动效 = CSS transition/animation + 原生 `<script>`。
- 所有可交互元素必须有悬停反馈；所有动效尊重 `prefers-reduced-motion`（降级为直接显示）。
- 手绘圈注必须运行时 `getTotalLength()` 设置 dasharray/offset，CSS 兜底值 600，禁止硬编码估算真实长度。
- 路由：EN 默认无前缀，ZH 前缀 `/zh`；博客文章单一规范 URL `/blog/<slug>`，无 `/zh` 镜像。
- `astro.config.mjs` 的 `site` 固定为 `https://aizyeee.github.io`，无 `base`（用户站仓库）。
- 提交信息用 conventional commits（`feat:`/`chore:`/`docs:`）。
- 每个任务结束运行 `npm run build && bash scripts/check-dist.sh` 全绿再提交。

## 文件结构总览

```
astro.config.mjs                    # site + i18n + 集成
src/content.config.ts               # blog/projects/now 三个集合的 zod schema
src/content/{blog,projects/{en,zh},now}/   # Markdown 内容（占位）
src/styles/{tokens.css,global.css}  # 设计令牌 + 全局排版/chip/reduced-motion
src/i18n/ui.ts                      # 词条字典 + locale 工具函数
src/components/*.astro              # InkButton OffsetCard CircleAnnotation NavLink
                                    # SectionRule CornerFrame MonoChip LangSwitch
                                    # CascadeGroup ReadingProgress PostList ProjectCard
src/layouts/BaseLayout.astro        # SEO/OG + header/footer 组装
src/components/{SiteHeader,SiteFooter}.astro
src/pages/                          # index, projects/, blog/, now, about, 404 + zh/ 镜像
scripts/check-dist.sh               # 构建产物路由断言（本站的"回归测试"）
.github/workflows/deploy.yml        # Actions → GitHub Pages
public/{robots.txt,resume.pdf,favicon.svg}
```

---

### Task 1: 脚手架 + 站点配置 + 路由断言脚本

**Files:**
- Create: 项目脚手架（`package.json`、`astro.config.mjs`、`tsconfig.json`、`src/pages/index.astro`）
- Create: `scripts/check-dist.sh`

**Interfaces:**
- Produces: `npm run build` 可用；`bash scripts/check-dist.sh` 作为后续每个任务的验收命令；`astro.config.mjs` 含 `site` 与 i18n 配置供 RSS/sitemap/`getRelativeLocaleUrl` 使用。

- [ ] **Step 1: 在仓库根目录脚手架 Astro（保留现有 git 与 docs）**

```bash
npm create astro@latest . -- --template minimal --install --no-git --yes
```

预期：生成 `package.json`、`astro.config.mjs`、`src/pages/index.astro`；现有 `discussion.md`、`docs/`、`.git` 不受影响（如向导询问"目录非空"，选择继续/合并）。

- [ ] **Step 2: 写入站点配置（覆盖 `astro.config.mjs`）**

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://aizyeee.github.io',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh'],
    routing: { prefixDefaultLocale: false },
  },
});
```

- [ ] **Step 3: 写失败中的路由断言脚本（先声明目标，让它红）**

```bash
# scripts/check-dist.sh
#!/usr/bin/env bash
# 构建产物路由断言：每个任务把新增路由加进 EXPECTED，先跑红再实现。
set -euo pipefail
EXPECTED=(
  index.html
)
missing=0
for f in "${EXPECTED[@]}"; do
  if [ ! -f "dist/$f" ]; then echo "MISSING dist/$f"; missing=1; fi
done
[ "$missing" -eq 0 ] && echo "OK: ${#EXPECTED[@]} routes present"
exit "$missing"
```

```bash
chmod +x scripts/check-dist.sh
```

- [ ] **Step 4: 构建并验证**

```bash
npm run build && bash scripts/check-dist.sh
```

预期：`OK: 1 routes present`

- [ ] **Step 5: 提交**

```bash
git add -A && git commit -m "chore: scaffold astro site with i18n config and route assertions"
```

---

### Task 2: 设计令牌 + 全局样式 + 字体

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/global.css`
- Modify: `package.json`（新增 fontsource 依赖）

**Interfaces:**
- Produces: CSS 自定义属性 `--bg --surface --purple-mid --accent --ink --card --text-2 --text-3 --border --font-serif --font-sans --font-mono`；工具类 `.mono-chip`（默认薰衣草底）与 `.mono-chip--outline`；全局 `prefers-reduced-motion` 降级规则。后续所有组件只允许引用这些令牌，不得写死色值。

- [ ] **Step 1: 安装字体（仅拉丁字体，无 CJK）**

```bash
npm i @fontsource-variable/inter @fontsource-variable/source-serif-4 @fontsource-variable/jetbrains-mono
```

- [ ] **Step 2: 写设计令牌**

```css
/* src/styles/tokens.css — 色值与 spec §4.1 逐字一致，5 色相封顶 */
:root {
  --bg: #F7F4EE;
  --surface: #CDCAE0;
  --purple-mid: #8A82C9;
  --accent: #5E6AD2;
  --ink: #1C1917;
  --card: #FFFFFF;
  --text-2: #44403C;
  --text-3: #78716C;
  --border: #E7E2D8;

  --font-serif: 'Source Serif 4 Variable', Georgia, 'Songti SC', 'Noto Serif CJK SC', serif;
  --font-sans: 'Inter Variable', 'Helvetica Neue', 'PingFang SC', 'Noto Sans CJK SC', sans-serif;
  --font-mono: 'JetBrains Mono Variable', Menlo, monospace;

  --ease-out: cubic-bezier(.21, .6, .35, 1);
  --ease-draw: cubic-bezier(.55, .06, .35, .98);
  --line: 1.5px;   /* 墨线统一粗细 */
}
```

- [ ] **Step 3: 写全局样式**

```css
/* src/styles/global.css */
@import '@fontsource-variable/inter';
@import '@fontsource-variable/source-serif-4';
@import '@fontsource-variable/jetbrains-mono';
@import './tokens.css';

* { box-sizing: border-box; margin: 0; }
html { scroll-behavior: smooth; }
body {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.75;
}
h1, h2, h3, h4 { font-family: var(--font-serif); font-weight: 600; line-height: 1.2; }
a { color: inherit; text-decoration: none; }
code, pre { font-family: var(--font-mono); }

/* 等宽 chip：spec §4.2 两种变体 */
.mono-chip {
  font-family: var(--font-mono);
  font-size: .85em;
  background: var(--surface);
  color: var(--ink);
  padding: 2px 9px;
  border-radius: 5px;
  white-space: nowrap;
}
.mono-chip--outline { background: var(--card); border: 1px solid var(--ink); }

/* 动效全局降级：spec §4.4 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-delay: 0ms !important;
    transition-duration: .01ms !important;
  }
  html { scroll-behavior: auto; }
}
```

- [ ] **Step 4: 让首页临时引用全局样式并验证渲染**

```astro
---
// src/pages/index.astro（临时，Task 9 重写）
import '../styles/global.css';
---
<html lang="en"><head><meta charset="utf-8" /><title>tokens check</title></head>
<body>
  <h1>Serif heading 标题</h1>
  <p>Body text with <span class="mono-chip">900+ tests</span> and <span class="mono-chip mono-chip--outline">OS × AI</span>.</p>
</body></html>
```

```bash
npm run build && bash scripts/check-dist.sh
```

预期：`OK: 1 routes present`；`npx astro dev` 目测米色底、衬线标题、两种 chip。

- [ ] **Step 5: 提交**

```bash
git add -A && git commit -m "feat: design tokens, global styles, latin webfonts"
```

---

### Task 3: 内容集合 schema + 占位内容 + 校验失败验证

**Files:**
- Create: `src/content.config.ts`
- Create: `src/content/blog/hello-astro.md`, `src/content/blog/di-yi-pian.md`
- Create: `src/content/projects/en/contract-review.md`, `src/content/projects/zh/contract-review.md`, `src/content/projects/en/lighter.md`, `src/content/projects/zh/lighter.md`
- Create: `src/content/now/en.md`, `src/content/now/zh.md`

**Interfaces:**
- Produces: 集合名 `blog` / `projects` / `now`；blog entry `id` = 文件名 slug，`data = { title, date: Date, lang: 'en'|'zh', tags: string[], description, draft }`；projects entry `id` 形如 `en/contract-review`，`data = { title, period, role, summary, tech: string[], metrics: string[], featured, order }`；now entry `id` = `en`|`zh`，`data = { updated: Date }`。后续页面用 `getCollection('blog')` 等消费。

- [ ] **Step 1: 定义 schema**

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    lang: z.enum(['en', 'zh']),
    tags: z.array(z.string()).default([]),
    description: z.string(),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    period: z.string(),
    role: z.string(),
    summary: z.string(),
    tech: z.array(z.string()),
    metrics: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    order: z.number().default(99),
    cover: z.string().optional(),
  }),
});

const now = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/now' }),
  schema: z.object({ updated: z.coerce.date() }),
});

export const collections = { blog, projects, now };
```

- [ ] **Step 2: 写占位内容（8 个文件，文案均为占位示意）**

```markdown
---
# src/content/blog/hello-astro.md
title: "Placeholder: notes on building this site"
date: 2026-07-03
lang: en
tags: [meta]
description: "Placeholder post to exercise the blog pipeline."
---
Placeholder body. Replaced during content phase.
```

```markdown
---
# src/content/blog/di-yi-pian.md
title: "占位：本站搭建记录"
date: 2026-07-02
lang: zh
tags: [meta]
description: "用于打通博客链路的中文占位文章。"
---
占位正文，内容阶段替换。
```

```markdown
---
# src/content/projects/en/contract-review.md
title: "LLM Contract Review System"
period: "2025 – present"
role: "Solo developer"
summary: "End-to-end AI review system around LLM + vector retrieval."
tech: [Python, RAG, pytest]
metrics: ["900+ regression tests", "end-to-end Word write-back"]
featured: true
order: 1
---
## Background & motivation
Placeholder.
## System architecture
Placeholder (architecture diagram slot).
## Key design decisions
Placeholder.
## Data & results
Placeholder.
## Screenshots / demo
Placeholder.
## Reflection & next steps
Placeholder.
```

`zh/contract-review.md` 同结构（title: "基于大模型与向量检索的合同审查系统"，六个 `##` 用中文：背景与动机/系统架构/关键设计决策/数据与成果/截图与演示/反思与下一步）。`en/lighter.md`、`zh/lighter.md` 同骨架（title: "Lighter" / "赛博朋克横版动作游戏 Lighter"，`featured: true, order: 2`，tech: `[Elm, Messenger, elm-regl]`，metrics: `["162 Elm modules", "24k LOC"]`）。

```markdown
---
# src/content/now/en.md
updated: 2026-07-03
---
**Reading** — placeholder. **Building** — placeholder. **Thinking about** — placeholder.
```

`zh.md` 同（**在读/在做/在想** 三段占位）。

- [ ] **Step 3: 验证 schema 真的在拦错（负向测试）**

```bash
printf -- '---\ndate: 2026-01-01\nlang: en\ndescription: x\n---\nbody\n' > src/content/blog/_broken.md
mv src/content/blog/_broken.md src/content/blog/broken.md
npm run build; echo "exit=$?"
```

预期：构建**失败**，报错含 `title` required（zod 校验生效）。然后删除：

```bash
rm src/content/blog/broken.md
```

- [ ] **Step 4: 正向构建**

```bash
npm run build && bash scripts/check-dist.sh
```

预期：`OK: 1 routes present`（集合已加载，页面尚未消费）。

- [ ] **Step 5: 提交**

```bash
git add -A && git commit -m "feat: content collections with zod schemas and placeholder content"
```

---

### Task 4: i18n 字典与工具

**Files:**
- Create: `src/i18n/ui.ts`

**Interfaces:**
- Produces: `type Locale = 'en' | 'zh'`；`ui[locale][key]` 词条字典（key 见下，后续页面新增词条只改此文件）；`t(locale)` 返回取词函数；`localePath(locale, path)` —— `localePath('zh','/projects') === '/zh/projects'`，`localePath('en','/projects') === '/projects'`；`altLocale(locale)` 返回另一语言。

- [ ] **Step 1: 实现**

```ts
// src/i18n/ui.ts
export type Locale = 'en' | 'zh';

export const ui = {
  en: {
    'nav.projects': 'Projects',
    'nav.blog': 'Blog',
    'nav.now': 'Now',
    'nav.about': 'About',
    'home.selectedWork': 'Selected work',
    'home.readBlog': 'Read the blog',
    'home.recentPosts': 'Recent posts',
    'home.featuredProjects': 'Selected projects',
    'projects.title': 'Projects',
    'projects.other': 'Other projects',
    'blog.title': 'Blog',
    'now.title': 'Now',
    'now.updated': 'Last updated',
    'about.title': 'About',
    'about.resume': 'Download résumé (PDF)',
    'post.back': 'All posts',
    'notfound.message': 'Page not found',
  },
  zh: {
    'nav.projects': '项目',
    'nav.blog': '博客',
    'nav.now': '此刻',
    'nav.about': '关于',
    'home.selectedWork': '精选项目',
    'home.readBlog': '读博客',
    'home.recentPosts': '最近文章',
    'home.featuredProjects': '精选项目',
    'projects.title': '项目',
    'projects.other': '其他项目',
    'blog.title': '博客',
    'now.title': '此刻',
    'now.updated': '最后更新',
    'about.title': '关于',
    'about.resume': '下载简历（PDF）',
    'post.back': '全部文章',
    'notfound.message': '页面不存在',
  },
} as const;

export type UiKey = keyof (typeof ui)['en'];

export function t(locale: Locale) {
  return (key: UiKey): string => ui[locale][key];
}

export function localePath(locale: Locale, path: string): string {
  return locale === 'en' ? path : `/zh${path === '/' ? '' : path}` || '/zh';
}

export function altLocale(locale: Locale): Locale {
  return locale === 'en' ? 'zh' : 'en';
}
```

- [ ] **Step 2: 快速验证（node 内联断言）**

```bash
npx tsx -e "
import { localePath, altLocale } from './src/i18n/ui.ts';
console.assert(localePath('en','/projects')==='/projects');
console.assert(localePath('zh','/projects')==='/zh/projects');
console.assert(localePath('zh','/')==='/zh');
console.assert(altLocale('zh')==='en');
console.log('i18n utils OK');
"
```

预期：`i18n utils OK`（若无 tsx：`npm i -D tsx`）。

- [ ] **Step 3: 提交**

```bash
git add -A && git commit -m "feat: i18n dictionary and locale path helpers"
```

---

### Task 5: 签名组件 —— InkButton / OffsetCard / CircleAnnotation

**Files:**
- Create: `src/components/InkButton.astro`, `src/components/OffsetCard.astro`, `src/components/CircleAnnotation.astro`
- Create: `src/pages/dev/components.astro`（组件试炼页，最终任务删除）

**Interfaces:**
- Consumes: Task 2 令牌。
- Produces: `<InkButton href label />`；`<OffsetCard href? variant('white'|'lavender')><slot/></OffsetCard>`；`<CircleAnnotation delay?（ms，默认 0，>0 时进场自动播）><slot/></CircleAnnotation>`。

- [ ] **Step 1: InkButton（spec §4.3 #1：悬停填墨 + 上移 + 紫色硬投影）**

```astro
---
// src/components/InkButton.astro
interface Props { href: string; label: string; }
const { href, label } = Astro.props;
---
<a class="ink-btn" href={href}>{label}</a>
<style>
  .ink-btn {
    display: inline-block;
    border: var(--line) solid var(--ink);
    border-radius: 10px;
    padding: 11px 24px;
    font-size: 14px;
    font-weight: 600;
    color: var(--ink);
    background: transparent;
    transition: all .22s var(--ease-out);
  }
  .ink-btn:hover {
    background: var(--ink);
    color: var(--bg);
    transform: translateY(-2px);
    box-shadow: 0 4px 0 0 var(--accent);
  }
</style>
```

- [ ] **Step 2: OffsetCard（spec §4.3 #3：悬停错位 + 墨色硬投影）**

```astro
---
// src/components/OffsetCard.astro
interface Props { href?: string; variant?: 'white' | 'lavender'; }
const { href, variant = 'white' } = Astro.props;
const Tag = href ? 'a' : 'div';
---
<Tag class:list={['offset-card', variant]} href={href}>
  <slot />
</Tag>
<style>
  .offset-card {
    display: block;
    background: var(--card);
    border: var(--line) solid var(--ink);
    border-radius: 12px;
    padding: 20px 22px;
    transition: all .22s var(--ease-out);
  }
  .offset-card.lavender { background: var(--surface); }
  .offset-card:hover {
    transform: translate(-3px, -3px);
    box-shadow: 5px 5px 0 0 var(--ink);
  }
</style>
```

- [ ] **Step 3: CircleAnnotation（spec §4.3 #5 + 实现约束：getTotalLength、兜底 600、进场一次 + 悬停重播）**

```astro
---
// src/components/CircleAnnotation.astro
interface Props { delay?: number; }
const { delay = 0 } = Astro.props;
---
<span class="anno" data-delay={delay}>
  <slot />
  <svg viewBox="0 0 200 64" preserveAspectRatio="none" aria-hidden="true">
    <path d="M10,52 C-6,22 55,0 105,5 C162,10 206,24 190,42 C174,58 55,62 28,50" />
  </svg>
</span>
<style>
  .anno { position: relative; white-space: nowrap; }
  .anno svg {
    position: absolute; left: -10px; top: -10px;
    width: calc(100% + 20px); height: calc(100% + 20px);
    overflow: visible; pointer-events: none;
  }
  /* 兜底 600 防脚本执行前闪现；真实长度由 JS 用 getTotalLength() 覆盖 */
  .anno svg path {
    fill: none; stroke: var(--ink); stroke-width: 2.4; stroke-linecap: round;
    stroke-dasharray: 600; stroke-dashoffset: 600;
  }
  @media (prefers-reduced-motion: reduce) {
    .anno svg path { stroke-dasharray: none !important; stroke-dashoffset: 0 !important; }
  }
</style>
<script>
  function setup(el: Element) {
    const path = el.querySelector('path') as SVGPathElement;
    const len = Math.ceil(path.getTotalLength()) + 4;
    path.style.strokeDasharray = String(len);
    path.style.strokeDashoffset = String(len);
    const draw = (delayMs: number) => {
      path.getAnimations().forEach((a) => a.cancel());
      path.style.strokeDashoffset = String(len);
      path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], {
        duration: 950, delay: delayMs, fill: 'forwards',
        easing: 'cubic-bezier(.55,.06,.35,.98)',
      });
    };
    const entryDelay = Number((el as HTMLElement).dataset.delay ?? 0);
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (entryDelay > 0) draw(entryDelay);
      el.addEventListener('mouseenter', () => draw(0));
    }
  }
  document.querySelectorAll('.anno').forEach(setup);
</script>
```

- [ ] **Step 4: 组件试炼页（先让上述组件被消费，肉眼验收 + 构建验证）**

```astro
---
// src/pages/dev/components.astro — 开发试炼页，Task 13 删除
import '../../styles/global.css';
import InkButton from '../../components/InkButton.astro';
import OffsetCard from '../../components/OffsetCard.astro';
import CircleAnnotation from '../../components/CircleAnnotation.astro';
---
<html lang="en"><head><meta charset="utf-8" /><title>components</title></head>
<body style="padding:60px; display:grid; gap:32px;">
  <h1>heading toward <CircleAnnotation delay={800}>OS × AI</CircleAnnotation></h1>
  <div><InkButton href="#" label="Selected work" /></div>
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:18px; max-width:720px;">
    <OffsetCard href="#"><h4>Contract Review System</h4><p>white variant</p></OffsetCard>
    <OffsetCard variant="lavender"><h4>Lighter</h4><p>lavender variant</p></OffsetCard>
  </div>
</body></html>
```

`scripts/check-dist.sh` 的 `EXPECTED` 增加一行 `dev/components/index.html`。

- [ ] **Step 5: 构建验证 + 手动验收**

```bash
npm run build && bash scripts/check-dist.sh
```

预期：`OK: 2 routes present`。`npx astro dev` 打开 `/dev/components`：圈注进场 0.8s 后起笔且**起笔前无任何笔画**、悬停重画；按钮悬停填墨 + 紫投影；卡片悬停错位 + 墨投影。

- [ ] **Step 6: 提交**

```bash
git add -A && git commit -m "feat: signature ink-line components (button, card, annotation)"
```

---

### Task 6: 配角组件 —— NavLink / SectionRule / CornerFrame / CascadeGroup / ReadingProgress

**Files:**
- Create: `src/components/NavLink.astro`, `src/components/SectionRule.astro`, `src/components/CornerFrame.astro`, `src/components/CascadeGroup.astro`, `src/components/ReadingProgress.astro`
- Modify: `src/pages/dev/components.astro`（追加各组件示例）

**Interfaces:**
- Consumes: Task 2 令牌。
- Produces: `<NavLink href label active? />`；`<SectionRule no（如 "01"） title />`；`<CornerFrame><slot/></CornerFrame>`；`<CascadeGroup><任意子元素/></CascadeGroup>`（直接子元素按 .05/.18/.32/.46/.62/.78s 阶梯浮现，第 7 个及以后统一 .78s）；`<ReadingProgress />`（fixed 顶部 2px 墨线，滚动映射宽度）。
- 说明：spec §4.5 的 `MonoChip` 由 Task 2 的 `.mono-chip` 工具类承担（纯样式无逻辑，不单独建组件）；`LangSwitch` 归入 Task 7（需要 i18n 上下文）。

- [ ] **Step 1: NavLink（spec §4.3 #2 动态下划线：左入右出）**

```astro
---
// src/components/NavLink.astro
interface Props { href: string; label: string; active?: boolean; }
const { href, label, active = false } = Astro.props;
---
<a class:list={['nav-link', { active }]} href={href}>{label}</a>
<style>
  .nav-link {
    font-size: 13.5px; font-weight: 550; color: var(--text-2);
    position: relative; padding-bottom: 3px;
  }
  .nav-link::after {
    content: ''; position: absolute; left: 0; bottom: 0;
    height: var(--line); width: 100%; background: var(--ink);
    transform: scaleX(0); transform-origin: right;
    transition: transform .28s var(--ease-out);
  }
  .nav-link:hover::after, .nav-link.active::after {
    transform: scaleX(1); transform-origin: left;
  }
</style>
```

- [ ] **Step 2: SectionRule（spec §4.3 #4：入视口线条 1/4 → 全宽）**

```astro
---
// src/components/SectionRule.astro
interface Props { no: string; title: string; }
const { no, title } = Astro.props;
---
<div class="section-rule">
  <div class="rule"><span class="no">{no}</span><span class="line"></span></div>
  <h2>{title}</h2>
</div>
<style>
  .section-rule { margin-bottom: 28px; }
  .rule { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .no { font-family: var(--font-mono); font-size: 11px; font-weight: 700; color: var(--ink); }
  .line {
    flex: 1; height: var(--line); background: var(--ink);
    transform: scaleX(.25); transform-origin: left;
    transition: transform .45s var(--ease-out);
  }
  .section-rule.in-view .line { transform: scaleX(1); }
  h2 { font-size: 28px; }
</style>
<script>
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
  }, { threshold: 0.4 });
  document.querySelectorAll('.section-rule').forEach((el) => io.observe(el));
</script>
```

- [ ] **Step 3: CornerFrame（spec §4.3 #6：悬停四角合拢）**

```astro
---
// src/components/CornerFrame.astro
---
<div class="corner-frame">
  <i></i><i></i><i></i><i></i>
  <slot />
</div>
<style>
  .corner-frame { position: relative; padding: 24px 28px; }
  .corner-frame i {
    position: absolute; width: 18px; height: 18px;
    border: 0 solid var(--ink);
    transition: all .3s var(--ease-out);
  }
  .corner-frame i:nth-of-type(1) { top: 0; left: 0; border-top-width: 2px; border-left-width: 2px; }
  .corner-frame i:nth-of-type(2) { top: 0; right: 0; border-top-width: 2px; border-right-width: 2px; }
  .corner-frame i:nth-of-type(3) { bottom: 0; left: 0; border-bottom-width: 2px; border-left-width: 2px; }
  .corner-frame i:nth-of-type(4) { bottom: 0; right: 0; border-bottom-width: 2px; border-right-width: 2px; }
  .corner-frame:hover i { width: 100%; height: 100%; }
</style>
```

- [ ] **Step 4: CascadeGroup（spec §4.4 级联进场，0.05–0.78s 阶梯）**

```astro
---
// src/components/CascadeGroup.astro
---
<div class="cascade"><slot /></div>
<style>
  @keyframes rise-in { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
  .cascade > :global(*) { opacity: 0; animation: rise-in .7s var(--ease-out) forwards; }
  /* 阶梯延迟：.05 .18 .32 .46 .62 .78s，超过 6 个的子元素统一 .78s */
  .cascade > :global(*:nth-child(1)) { animation-delay: .05s; }
  .cascade > :global(*:nth-child(2)) { animation-delay: .18s; }
  .cascade > :global(*:nth-child(3)) { animation-delay: .32s; }
  .cascade > :global(*:nth-child(4)) { animation-delay: .46s; }
  .cascade > :global(*:nth-child(5)) { animation-delay: .62s; }
  .cascade > :global(*:nth-child(n+6)) { animation-delay: .78s; }
  @media (prefers-reduced-motion: reduce) { .cascade > :global(*) { opacity: 1; animation: none; } }
</style>
```

- [ ] **Step 5: ReadingProgress（spec §4.4 长文页顶部细墨线）**

```astro
---
// src/components/ReadingProgress.astro
---
<div class="read-progress" aria-hidden="true"></div>
<style>
  .read-progress {
    position: fixed; top: 0; left: 0; height: 2px; width: 0;
    background: var(--ink); z-index: 100;
  }
</style>
<script>
  const bar = document.querySelector('.read-progress') as HTMLElement;
  const update = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    bar.style.width = max > 0 ? `${(h.scrollTop / max) * 100}%` : '0';
  };
  addEventListener('scroll', update, { passive: true });
  update();
</script>
```

- [ ] **Step 6: 试炼页追加示例并验证**

在 `src/pages/dev/components.astro` 的 `<body>` 内追加：

```astro
  <nav style="display:flex; gap:24px;"><NavLink href="#" label="Projects" active /><NavLink href="#" label="Blog" /></nav>
  <SectionRule no="01" title="Selected Projects" />
  <CornerFrame><h4>Now — 2026.07</h4><p>Reading OSTEP · Building eval harness</p></CornerFrame>
  <CascadeGroup><p>line 1</p><p>line 2</p><p>line 3</p></CascadeGroup>
  <ReadingProgress />
  <div style="height:150vh"></div><!-- 撑高页面测进度条/标尺线入视口 -->
```

（frontmatter 补齐五个 import。）

```bash
npm run build && bash scripts/check-dist.sh
```

预期：`OK: 2 routes present`。dev 页验收：下划线左入右出、标尺线滚动入视口延展、角标合拢、级联浮现、进度条随滚动增长。

- [ ] **Step 7: 提交**

```bash
git add -A && git commit -m "feat: supporting components (nav underline, rules, corners, cascade, progress)"
```

---

### Task 7: BaseLayout + SiteHeader（含 LangSwitch）+ SiteFooter

**Files:**
- Create: `src/layouts/BaseLayout.astro`, `src/components/SiteHeader.astro`, `src/components/SiteFooter.astro`, `src/components/LangSwitch.astro`

**Interfaces:**
- Consumes: Task 4 `t/localePath/altLocale`，Task 6 `NavLink`。
- Produces: `<BaseLayout locale title description altHref?（另一语言对应页，缺省首页）><slot/></BaseLayout>` —— 输出完整 html 骨架：SEO meta、OG 标签、canonical、header（logo + 4 个 NavLink + LangSwitch）、`<main><slot/></main>`、footer（邮箱 / GitHub / © 一行）。所有页面（除 dev）必须经由它。

- [ ] **Step 1: LangSwitch**

```astro
---
// src/components/LangSwitch.astro
import type { Locale } from '../i18n/ui';
interface Props { locale: Locale; altHref: string; }
const { locale, altHref } = Astro.props;
const label = locale === 'en' ? '中' : 'EN';
---
<a class="lang-switch" href={altHref} aria-label="Switch language">{label}</a>
<style>
  .lang-switch {
    font-family: var(--font-mono); font-size: 12px; font-weight: 700;
    color: var(--accent); border: var(--line) solid var(--accent);
    border-radius: 6px; padding: 3px 9px;
    transition: all .2s var(--ease-out);
  }
  .lang-switch:hover { background: var(--accent); color: var(--card); }
</style>
```

- [ ] **Step 2: SiteHeader**

```astro
---
// src/components/SiteHeader.astro
import NavLink from './NavLink.astro';
import LangSwitch from './LangSwitch.astro';
import { t, localePath, type Locale } from '../i18n/ui';
interface Props { locale: Locale; altHref: string; }
const { locale, altHref } = Astro.props;
const tr = t(locale);
const current = Astro.url.pathname;
const items = [
  { href: localePath(locale, '/projects'), label: tr('nav.projects') },
  { href: localePath(locale, '/blog'), label: tr('nav.blog') },
  { href: localePath(locale, '/now'), label: tr('nav.now') },
  { href: localePath(locale, '/about'), label: tr('nav.about') },
];
---
<header class="site-header">
  <a class="logo" href={localePath(locale, '/')}>Zihao Zhang</a>
  <nav>
    {items.map((it) => <NavLink href={it.href} label={it.label} active={current.startsWith(it.href)} />)}
    <LangSwitch locale={locale} altHref={altHref} />
  </nav>
</header>
<style>
  .site-header {
    display: flex; justify-content: space-between; align-items: center;
    max-width: 960px; margin: 0 auto; padding: 24px 24px 20px;
  }
  .logo { font-family: var(--font-serif); font-weight: 700; font-size: 17px; }
  nav { display: flex; gap: 28px; align-items: center; }
</style>
```

- [ ] **Step 3: SiteFooter**

```astro
---
// src/components/SiteFooter.astro
---
<footer class="site-footer">
  <span>© 2026 Zihao Zhang</span>
  <span>
    <a href="mailto:aizyeee@foxmail.com">aizyeee@foxmail.com</a> ·
    <a href="https://github.com/aizyeee">GitHub</a>
  </span>
</footer>
<style>
  .site-footer {
    display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap;
    max-width: 960px; margin: 64px auto 0; padding: 24px;
    border-top: 1px solid var(--border);
    font-size: 13px; color: var(--text-3);
  }
  .site-footer a { color: var(--text-2); text-decoration: underline; }
</style>
```

- [ ] **Step 4: BaseLayout**

```astro
---
// src/layouts/BaseLayout.astro
import '../styles/global.css';
import SiteHeader from '../components/SiteHeader.astro';
import SiteFooter from '../components/SiteFooter.astro';
import { altLocale, localePath, type Locale } from '../i18n/ui';
interface Props { locale: Locale; title: string; description: string; altHref?: string; }
const { locale, title, description, altHref = localePath(altLocale(locale), '/') } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site);
---
<!doctype html>
<html lang={locale === 'en' ? 'en' : 'zh-CN'}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonical} />
    <link rel="alternate" type="application/rss+xml" title="Blog RSS" href="/rss.xml" />
  </head>
  <body>
    <SiteHeader locale={locale} altHref={altHref} />
    <main><slot /></main>
    <SiteFooter />
  </body>
</html>
<style>
  main { max-width: 960px; margin: 0 auto; padding: 0 24px; }
</style>
```

- [ ] **Step 5: 构建验证 + 提交**

```bash
npm run build && bash scripts/check-dist.sh
git add -A && git commit -m "feat: base layout with header, footer, language switch, SEO meta"
```

---

### Task 8: 博客 —— 列表页（en/zh）+ 文章页 + RSS

**Files:**
- Create: `src/pages/blog/index.astro`, `src/pages/zh/blog/index.astro`, `src/pages/blog/[slug].astro`, `src/pages/rss.xml.js`
- Create: `src/components/PostList.astro`
- Modify: `scripts/check-dist.sh`（EXPECTED 增加博客路由）
- Modify: `package.json`（`npm i @astrojs/rss`）

**Interfaces:**
- Consumes: `getCollection('blog')`（Task 3 schema）、`BaseLayout`（Task 7）、`ReadingProgress`（Task 6）、`SectionRule`（Task 6）。
- Produces: `<PostList posts locale />`（posts = blog entry 数组；渲染 标题+日期+标签+语言徽标，徽标用 `.mono-chip--outline`）；路由 `/blog`、`/zh/blog`、`/blog/<slug>`；`/rss.xml`。

- [ ] **Step 1: 安装 RSS 集成**

```bash
npm i @astrojs/rss
```

- [ ] **Step 2: PostList**

```astro
---
// src/components/PostList.astro
import type { CollectionEntry } from 'astro:content';
import type { Locale } from '../i18n/ui';
interface Props { posts: CollectionEntry<'blog'>[]; locale: Locale; }
const { posts, locale } = Astro.props;
const fmt = (d: Date) => d.toISOString().slice(0, 10);
---
<ul class="post-list">
  {posts.map((p) => (
    <li>
      <a href={`/blog/${p.id}/`}>
        <span class="title">{p.data.title}</span>
        <span class="meta">
          <time datetime={fmt(p.data.date)}>{fmt(p.data.date)}</time>
          <span class="mono-chip mono-chip--outline">{p.data.lang === 'en' ? 'EN' : '中'}</span>
          {p.data.tags.map((tg) => <span class="mono-chip">{tg}</span>)}
        </span>
      </a>
    </li>
  ))}
</ul>
<style>
  .post-list { list-style: none; padding: 0; display: grid; gap: 4px; }
  .post-list a {
    display: flex; justify-content: space-between; align-items: baseline; gap: 16px;
    padding: 12px 8px; border-radius: 8px; transition: background .2s var(--ease-out);
  }
  .post-list a:hover { background: var(--card); }
  .post-list a:hover .title { text-decoration: underline; }
  .title { font-weight: 600; }
  .meta { display: flex; gap: 8px; align-items: baseline; font-size: 13px; color: var(--text-3); flex-shrink: 0; }
</style>
```

- [ ] **Step 3: 列表页 ×2（博客文章池共享，页面骨架双语）**

```astro
---
// src/pages/blog/index.astro
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import SectionRule from '../../components/SectionRule.astro';
import PostList from '../../components/PostList.astro';
const posts = (await getCollection('blog', ({ data }) => !data.draft))
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
---
<BaseLayout locale="en" title="Blog — Zihao Zhang" description="Notes on AI systems, OS, and engineering." altHref="/zh/blog">
  <SectionRule no="02" title="Blog" />
  <PostList posts={posts} locale="en" />
</BaseLayout>
```

`src/pages/zh/blog/index.astro` 相同，仅 `locale="zh"`、`title="博客 — 张子灏"`、`description` 中文、`altHref="/blog"`、`SectionRule title="博客"`。

- [ ] **Step 4: 文章页（单一规范 URL，无 zh 镜像；骨架语言跟随文章 lang）**

```astro
---
// src/pages/blog/[slug].astro
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import ReadingProgress from '../../components/ReadingProgress.astro';
import { t, localePath } from '../../i18n/ui';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}
const { post } = Astro.props;
const { Content } = await render(post);
const lang = post.data.lang;
const tr = t(lang);
---
<BaseLayout locale={lang} title={`${post.data.title} — Zihao Zhang`} description={post.data.description}
  altHref={localePath(lang === 'en' ? 'zh' : 'en', '/blog')}>
  <ReadingProgress />
  <article class="post">
    <a class="back" href={localePath(lang, '/blog')}>← {tr('post.back')}</a>
    <h1>{post.data.title}</h1>
    <p class="meta">
      <time>{post.data.date.toISOString().slice(0, 10)}</time>
      {post.data.tags.map((tg) => <span class="mono-chip">{tg}</span>)}
    </p>
    <Content />
  </article>
</BaseLayout>
<style>
  .post { max-width: 680px; margin: 0 auto; padding-top: 24px; }
  .post h1 { font-size: 36px; margin: 16px 0 12px; }
  .back { font-size: 13.5px; color: var(--text-3); }
  .back:hover { color: var(--ink); text-decoration: underline; }
  .meta { display: flex; gap: 10px; align-items: baseline; color: var(--text-3); font-size: 14px; margin-bottom: 32px; }
</style>
```

- [ ] **Step 5: RSS**

```js
// src/pages/rss.xml.js
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  return rss({
    title: 'Zihao Zhang — Blog',
    description: 'Notes on AI systems, OS, and engineering.',
    site: context.site,
    items: posts.map((p) => ({
      title: p.data.title,
      pubDate: p.data.date,
      description: p.data.description,
      link: `/blog/${p.id}/`,
    })),
  });
}
```

- [ ] **Step 6: 更新断言脚本（先红后绿）**

`scripts/check-dist.sh` 的 `EXPECTED` 更新为：

```bash
EXPECTED=(
  index.html
  dev/components/index.html
  blog/index.html
  zh/blog/index.html
  blog/hello-astro/index.html
  blog/di-yi-pian/index.html
  rss.xml
)
```

先跑 `bash scripts/check-dist.sh` 确认对旧产物报 MISSING（红），再：

```bash
npm run build && bash scripts/check-dist.sh
```

预期：`OK: 7 routes present`。并验证**无** `dist/zh/blog/hello-astro/`（单语无镜像）。

```bash
test ! -d dist/zh/blog/hello-astro && echo "no zh mirror OK"
```

- [ ] **Step 7: 提交**

```bash
git add -A && git commit -m "feat: blog list (en/zh), post pages with reading progress, RSS"
```

---

### Task 9: 项目 —— 列表页 + case study 页（en/zh 全双语）

**Files:**
- Create: `src/pages/projects/index.astro`, `src/pages/zh/projects/index.astro`, `src/pages/projects/[slug].astro`, `src/pages/zh/projects/[slug].astro`
- Create: `src/components/ProjectCard.astro`
- Modify: `scripts/check-dist.sh`

**Interfaces:**
- Consumes: `getCollection('projects')`（entry id 形如 `en/contract-review`）、`BaseLayout`、`OffsetCard`、`SectionRule`、`ReadingProgress`、`MonoChip` 样式。
- Produces: `<ProjectCard project locale featured? />`（内部用 OffsetCard，featured 时渲染 summary+tech+metrics，非 featured 紧凑单行）；路由 `/projects`、`/zh/projects`、`/projects/<slug>`、`/zh/projects/<slug>`。

- [ ] **Step 1: ProjectCard**

```astro
---
// src/components/ProjectCard.astro
import type { CollectionEntry } from 'astro:content';
import OffsetCard from './OffsetCard.astro';
import { localePath, type Locale } from '../i18n/ui';
interface Props { project: CollectionEntry<'projects'>; locale: Locale; featured?: boolean; }
const { project, locale, featured = false } = Astro.props;
const slug = project.id.split('/')[1]; // 'en/contract-review' → 'contract-review'
const href = localePath(locale, `/projects/${slug}`);
const variant = project.data.order % 2 === 0 ? 'lavender' : 'white';
---
<OffsetCard href={href} variant={featured ? variant : 'white'}>
  <p class="cat">{project.data.role} · {project.data.period}</p>
  <h4>{project.data.title}</h4>
  {featured && (
    <>
      <p class="summary">{project.data.summary}</p>
      <p class="chips">
        {project.data.tech.map((t) => <span class="mono-chip">{t}</span>)}
        {project.data.metrics.map((m) => <span class="mono-chip mono-chip--outline">{m}</span>)}
      </p>
    </>
  )}
</OffsetCard>
<style>
  .cat { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--accent); font-weight: 700; margin-bottom: 8px; }
  h4 { font-size: 17px; margin-bottom: 6px; }
  .summary { font-size: 13.5px; color: var(--text-3); line-height: 1.6; margin-bottom: 10px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
</style>
```

- [ ] **Step 2: 列表页 ×2**

```astro
---
// src/pages/projects/index.astro
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import SectionRule from '../../components/SectionRule.astro';
import ProjectCard from '../../components/ProjectCard.astro';
const all = (await getCollection('projects', (e) => e.id.startsWith('en/')))
  .sort((a, b) => a.data.order - b.data.order);
const featured = all.filter((p) => p.data.featured);
const others = all.filter((p) => !p.data.featured);
---
<BaseLayout locale="en" title="Projects — Zihao Zhang" description="Selected engineering work." altHref="/zh/projects">
  <SectionRule no="01" title="Projects" />
  <div class="grid">{featured.map((p) => <ProjectCard project={p} locale="en" featured />)}</div>
  {others.length > 0 && <>
    <SectionRule no="—" title="Other projects" />
    <div class="grid">{others.map((p) => <ProjectCard project={p} locale="en" />)}</div>
  </>}
</BaseLayout>
<style>
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 18px; margin-bottom: 40px; }
</style>
```

`zh/projects/index.astro` 同构：过滤 `e.id.startsWith('zh/')`、`locale="zh"`、标题词条中文（用 `t('projects.title')`/`t('projects.other')` 或直接中文字面量均可，但须与 Task 4 字典一致）、`altHref="/projects"`。

- [ ] **Step 3: case study 页 ×2**

```astro
---
// src/pages/projects/[slug].astro
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import ReadingProgress from '../../components/ReadingProgress.astro';

export async function getStaticPaths() {
  const projects = await getCollection('projects', (e) => e.id.startsWith('en/'));
  return projects.map((p) => ({ params: { slug: p.id.split('/')[1] }, props: { project: p } }));
}
const { project } = Astro.props;
const { Content } = await render(project);
---
<BaseLayout locale="en" title={`${project.data.title} — Zihao Zhang`} description={project.data.summary}
  altHref={`/zh/projects/${project.id.split('/')[1]}`}>
  <ReadingProgress />
  <article class="case-study">
    <h1>{project.data.title}</h1>
    <p class="meta">
      <span class="mono-chip mono-chip--outline">{project.data.role}</span>
      <span class="mono-chip mono-chip--outline">{project.data.period}</span>
      {project.data.tech.map((t) => <span class="mono-chip">{t}</span>)}
    </p>
    <Content />
  </article>
</BaseLayout>
<style>
  .case-study { max-width: 680px; margin: 0 auto; padding-top: 24px; }
  .case-study h1 { font-size: 36px; margin-bottom: 14px; }
  .meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 36px; }
  .case-study :global(h2) { font-size: 24px; margin: 36px 0 12px; }
</style>
```

`zh/projects/[slug].astro` 同构：过滤 `zh/`、`locale="zh"`、`altHref` 指向 `/projects/<slug>`。

- [ ] **Step 4: 断言 + 构建 + 提交**

`EXPECTED` 追加：

```bash
  projects/index.html
  zh/projects/index.html
  projects/contract-review/index.html
  projects/lighter/index.html
  zh/projects/contract-review/index.html
  zh/projects/lighter/index.html
```

```bash
npm run build && bash scripts/check-dist.sh
git add -A && git commit -m "feat: project list and bilingual case study pages"
```

预期：`OK: 13 routes present`

---

### Task 10: 首页（en/zh）—— Hero + 精选项目 + 最近文章

**Files:**
- Modify: `src/pages/index.astro`（替换 Task 2 的临时页）
- Create: `src/pages/zh/index.astro`
- Modify: `scripts/check-dist.sh`（追加 `zh/index.html`）

**Interfaces:**
- Consumes: `BaseLayout` `CascadeGroup` `CircleAnnotation` `InkButton` `NavLink`(经 header) `ProjectCard` `PostList` `SectionRule`、两个集合、i18n 工具。
- Produces: 路由 `/` 与 `/zh/`，结构 = spec §3.1（导航→hero→精选项目→最近文章→页脚）。文案为占位，内容阶段替换。

- [ ] **Step 1: 英文首页**

```astro
---
// src/pages/index.astro
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import CascadeGroup from '../components/CascadeGroup.astro';
import CircleAnnotation from '../components/CircleAnnotation.astro';
import InkButton from '../components/InkButton.astro';
import SectionRule from '../components/SectionRule.astro';
import ProjectCard from '../components/ProjectCard.astro';
import PostList from '../components/PostList.astro';

const projects = (await getCollection('projects', (e) => e.id.startsWith('en/') && e.data.featured))
  .sort((a, b) => a.data.order - b.data.order);
const posts = (await getCollection('blog', ({ data }) => !data.draft))
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
  .slice(0, 5);
---
<BaseLayout locale="en" title="Zihao Zhang — AI systems" description="Undergrad at SJTU building reliable AI systems, heading toward OS × AI." altHref="/zh/">
  <CascadeGroup>
    <p class="kicker">AI SYSTEMS · SJTU ECE '28 · SHANGHAI</p>
    <h1 class="headline">Building AI systems that hold up — heading toward
      <CircleAnnotation delay={1150}>OS × AI</CircleAnnotation></h1>
    <p class="sub">I'm an undergrad at Shanghai Jiao Tong University. I build LLM pipelines with retrieval, evidence tracking and
      <span class="mono-chip mono-chip--outline">900+ regression tests</span>, and I care about making model behavior
      <span class="mono-chip">reliable</span>, <span class="mono-chip">controllable</span>, <span class="mono-chip">measurable</span>.</p>
    <p class="cta">
      <InkButton href="/projects" label="Selected work" />
      <a class="quiet" href="/blog">Read the blog →</a>
    </p>
  </CascadeGroup>

  <SectionRule no="01" title="Selected projects" />
  <div class="grid">{projects.map((p) => <ProjectCard project={p} locale="en" featured />)}</div>

  <SectionRule no="02" title="Recent posts" />
  <PostList posts={posts} locale="en" />
</BaseLayout>
<style>
  .kicker { font-family: var(--font-mono); font-size: 12px; letter-spacing: 2.2px; color: var(--accent); font-weight: 700; margin: 40px 0 20px; }
  .headline { font-size: clamp(32px, 5.5vw, 46px); max-width: 640px; margin-bottom: 20px; }
  .sub { max-width: 580px; color: var(--text-2); margin-bottom: 26px; }
  .cta { display: flex; gap: 16px; align-items: center; margin-bottom: 64px; }
  .quiet { font-size: 14px; font-weight: 600; position: relative; padding-bottom: 3px; }
  .quiet::after { content: ''; position: absolute; left: 0; bottom: 0; height: var(--line); width: 100%; background: var(--ink); transform: scaleX(0); transform-origin: right; transition: transform .28s var(--ease-out); }
  .quiet:hover::after { transform: scaleX(1); transform-origin: left; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 18px; margin-bottom: 56px; }
</style>
```

- [ ] **Step 2: 中文首页**

`src/pages/zh/index.astro` 同构：`locale="zh"`、`altHref="/"`、集合过滤 `zh/`、占位文案中文（headline 例："构建经得起考验的 AI 系统 — 走向 <CircleAnnotation>OS × AI</CircleAnnotation>"）、CTA 用 `localePath('zh', '/projects')` 与 `/zh/blog`。

- [ ] **Step 3: 断言 + 构建 + 验收 + 提交**

`EXPECTED` 追加 `zh/index.html`。

```bash
npm run build && bash scripts/check-dist.sh
```

预期：`OK: 14 routes present`。dev 验收：级联进场顺序正确（kicker→标题→正文→CTA）、圈注 1.15s 起笔 + 悬停重播、语言切换互跳 `/` ↔ `/zh/`。

```bash
git add -A && git commit -m "feat: bilingual homepage with cascade hero and annotation"
```

---

### Task 11: Now + About + 404

**Files:**
- Create: `src/pages/now.astro`, `src/pages/zh/now.astro`, `src/pages/about.astro`, `src/pages/zh/about.astro`, `src/pages/404.astro`
- Create: `public/resume.pdf`（复制现有 PDF）
- Modify: `scripts/check-dist.sh`

**Interfaces:**
- Consumes: `getCollection('now')`（entry id `en`/`zh`）、`BaseLayout` `CornerFrame` `SectionRule` `InkButton`。
- Produces: 路由 `/now` `/zh/now` `/about` `/zh/about` `/404`；About 页含 `/resume.pdf` 下载（InkButton）。

- [ ] **Step 1: 简历 PDF 入 public**

```bash
cp "张子灏_技术简历.pdf" public/resume.pdf
```

- [ ] **Step 2: Now 页 ×2（spec §3.5：CornerFrame 包裹 + 等宽更新日期）**

```astro
---
// src/pages/now.astro
import { getCollection, render } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import SectionRule from '../components/SectionRule.astro';
import CornerFrame from '../components/CornerFrame.astro';
const entry = (await getCollection('now')).find((e) => e.id === 'en')!;
const { Content } = await render(entry);
---
<BaseLayout locale="en" title="Now — Zihao Zhang" description="What I'm doing now." altHref="/zh/now">
  <SectionRule no="03" title="Now" />
  <CornerFrame>
    <Content />
    <p class="updated">Last updated · {entry.data.updated.toISOString().slice(0, 10)}</p>
  </CornerFrame>
</BaseLayout>
<style>
  .updated { font-family: var(--font-mono); font-size: 12px; color: var(--text-3); margin-top: 18px; }
</style>
```

`zh/now.astro` 同构（`id === 'zh'`、词条中文、`altHref="/now"`）。

- [ ] **Step 3: About 页 ×2（spec §3.6：介绍占位 + 联系块 + PDF 按钮 + 技能 chip 分组）**

```astro
---
// src/pages/about.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import SectionRule from '../components/SectionRule.astro';
import InkButton from '../components/InkButton.astro';
---
<BaseLayout locale="en" title="About — Zihao Zhang" description="About Zihao Zhang." altHref="/zh/about">
  <SectionRule no="04" title="About" />
  <div class="about">
    <p>Placeholder bio — replaced in content phase. ECE undergrad at Shanghai Jiao Tong University (2024–2028), working toward AI systems and OS × AI research.</p>
    <h2>Skills</h2>
    <p class="chips">
      <span class="mono-chip">C/C++</span><span class="mono-chip">Python</span><span class="mono-chip">Elm</span>
      <span class="mono-chip mono-chip--outline">RAG</span><span class="mono-chip mono-chip--outline">pytest</span><span class="mono-chip mono-chip--outline">Linux/WSL</span>
    </p>
    <h2>Contact</h2>
    <p><a href="mailto:aizyeee@foxmail.com">aizyeee@foxmail.com</a> · <a href="mailto:orzaizyeee@sjtu.edu.cn">orzaizyeee@sjtu.edu.cn</a> · <a href="https://github.com/aizyeee">GitHub</a></p>
    <p class="dl"><InkButton href="/resume.pdf" label="Download résumé (PDF)" /></p>
  </div>
</BaseLayout>
<style>
  .about { max-width: 680px; display: grid; gap: 14px; }
  .about h2 { font-size: 22px; margin-top: 22px; }
  .about a { text-decoration: underline; }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .dl { margin-top: 10px; }
</style>
```

`zh/about.astro` 同构中文。

- [ ] **Step 4: 404（单版：英文 + 中文一行提示）**

```astro
---
// src/pages/404.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import CircleAnnotation from '../components/CircleAnnotation.astro';
---
<BaseLayout locale="en" title="404 — Zihao Zhang" description="Page not found.">
  <div class="nf">
    <h1><CircleAnnotation delay={400}>404</CircleAnnotation></h1>
    <p>Page not found · 页面不存在</p>
    <p><a href="/">← Home</a></p>
  </div>
</BaseLayout>
<style>
  .nf { text-align: center; padding: 80px 0; display: grid; gap: 16px; }
  .nf a { text-decoration: underline; }
</style>
```

- [ ] **Step 5: 断言 + 构建 + 提交**

`EXPECTED` 追加：`now/index.html` `zh/now/index.html` `about/index.html` `zh/about/index.html` `404.html` `resume.pdf`。

```bash
npm run build && bash scripts/check-dist.sh
git add -A && git commit -m "feat: now, about (with resume download), 404 pages"
```

预期：`OK: 20 routes present`

---

### Task 12: 站点基建 —— sitemap / robots / favicon / 语言提示条

**Files:**
- Create: `public/robots.txt`, `public/favicon.svg`
- Modify: `astro.config.mjs`（sitemap 集成）, `src/layouts/BaseLayout.astro`（语言提示条）, `scripts/check-dist.sh`, `package.json`

**Interfaces:**
- Consumes: Task 7 BaseLayout。
- Produces: `/sitemap-index.xml`、`/robots.txt`、墨线 monogram favicon、中文浏览器访问英文页时的一次性切换提示条（sessionStorage 记忆关闭）。

- [ ] **Step 1: sitemap**

```bash
npm i @astrojs/sitemap
```

```js
// astro.config.mjs — imports 区加：
import sitemap from '@astrojs/sitemap';
// defineConfig 内加：
  integrations: [sitemap()],
```

- [ ] **Step 2: robots.txt 与 favicon**

```
# public/robots.txt
User-agent: *
Allow: /
Sitemap: https://aizyeee.github.io/sitemap-index.xml
```

```svg
<!-- public/favicon.svg — 墨线 Z monogram，米底墨字 -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#F7F4EE"/>
  <path d="M9 10 h14 l-14 12 h14" fill="none" stroke="#1C1917" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

- [ ] **Step 3: 语言提示条（spec §2.1 可选项，不打扰、可关闭）**

`BaseLayout.astro` 的 `<body>` 末尾（`SiteFooter` 之后）加：

```astro
    {locale === 'en' && (
      <div class="lang-hint" hidden>
        <span>看起来你在使用中文浏览器 — <a href={altHref}>切换到中文版</a></span>
        <button aria-label="Dismiss">×</button>
      </div>
    )}
    <script>
      const hint = document.querySelector('.lang-hint') as HTMLElement | null;
      if (hint && navigator.language.startsWith('zh') && !sessionStorage.getItem('lang-hint-dismissed')) {
        hint.hidden = false;
        hint.querySelector('button')!.addEventListener('click', () => {
          hint.hidden = true;
          sessionStorage.setItem('lang-hint-dismissed', '1');
        });
      }
    </script>
```

对应样式（BaseLayout 的 `<style>`）：

```css
  .lang-hint {
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    background: var(--card); border: var(--line) solid var(--ink); border-radius: 10px;
    padding: 10px 16px; font-size: 13px; display: flex; gap: 14px; align-items: center;
    box-shadow: 4px 4px 0 0 var(--ink); z-index: 90;
  }
  .lang-hint a { text-decoration: underline; color: var(--accent); }
  .lang-hint button { border: 0; background: none; font-size: 15px; cursor: pointer; color: var(--text-3); }
```

链接用的是 `altHref`（BaseLayout 已有 prop，各页面已按路由传入正确目标；博客文章页传的是 `/zh/blog` 列表）。**不要**改成对 `Astro.url.pathname` 加 `/zh` 前缀重算——那会对博客文章页生成不存在的 `/zh/blog/<slug>` 坏链。

- [ ] **Step 4: 断言 + 构建 + 提交**

`EXPECTED` 追加：`sitemap-index.xml` `robots.txt` `favicon.svg`。

```bash
npm run build && bash scripts/check-dist.sh
git add -A && git commit -m "feat: sitemap, robots, monogram favicon, dismissible language hint"
```

预期：`OK: 23 routes present`

---

### Task 13: 收尾 —— 删 dev 页 + 移动端检查 + Lighthouse

**Files:**
- Delete: `src/pages/dev/components.astro`
- Modify: `scripts/check-dist.sh`（移除 dev 路由，改断言其不存在）
- Modify: 各页样式的移动端补丁（如有）

- [ ] **Step 1: 删除试炼页并反向断言**

```bash
rm src/pages/dev/components.astro
```

`check-dist.sh` 移除 `dev/components/index.html`，末尾加：

```bash
if [ -d dist/dev ]; then echo "dev pages leaked into production build"; exit 1; fi
```

- [ ] **Step 2: 移动端过一遍**

`npx astro dev` + 浏览器 375px 宽逐页检查：header 换行是否可接受、headline `clamp()` 生效、卡片网格塌成单列、chip 换行不溢出。发现问题就地修（预期主要是 header 在 375px 需要 `flex-wrap: wrap` 与 gap 调整——允许本步做微调 CSS）。

- [ ] **Step 3: Lighthouse 移动端 ≥ 90（spec 验收 #7）**

```bash
npm run build && npx astro preview --port 4321 &
sleep 2
npx lighthouse http://localhost:4321 --preset=perf --form-factor=mobile --chrome-flags="--headless" --output=json --output-path=/tmp/lh.json --quiet
node -e "const r=require('/tmp/lh.json');console.log('perf score:',r.categories.performance.score*100)"
kill %1
```

预期：`perf score: >= 90`。低于 90 的常见修复：确认无 CJK webfont 被引入、字体 `font-display: swap`（fontsource 默认）、无巨图。

- [ ] **Step 4: 构建 + 提交**

```bash
npm run build && bash scripts/check-dist.sh
git add -A && git commit -m "chore: remove dev pages, mobile polish, lighthouse pass"
```

---

### Task 14: GitHub Actions 部署

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: 全站构建绿。
- Produces: push `main` → 自动构建发布到 `https://aizyeee.github.io`。

- [ ] **Step 1: workflow**

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: withastro/action@v6

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```

- [ ] **Step 2: 创建远程仓库并推送（需要用户已登录 gh；仓库名必须是用户站名）**

```bash
gh repo create aizyeee.github.io --public --source=. --push
```

若 `gh` 未登录，提示用户在终端执行 `! gh auth login` 后重试。

- [ ] **Step 3: 开启 Pages（Source: GitHub Actions）并验证**

```bash
gh api repos/aizyeee/aizyeee.github.io/pages -X POST -f build_type=workflow 2>/dev/null || echo "Pages may already be enabled"
gh run watch --exit-status
curl -sI https://aizyeee.github.io | head -1
```

预期：workflow 绿；`HTTP/2 200`。

- [ ] **Step 4: 线上冒烟（spec 验收 #6 + #4 的最终确认）**

```bash
for p in / /zh/ /projects/ /blog/ /now/ /about/ /rss.xml /sitemap-index.xml /resume.pdf; do
  printf '%s -> ' "$p"; curl -so /dev/null -w '%{http_code}\n' "https://aizyeee.github.io$p"
done
```

预期：全部 `200`。

- [ ] **Step 5: 提交（workflow 文件）**

```bash
git add .github && git commit -m "ci: github pages deploy workflow" && git push
```

---

## 验收对照（spec §6 → 任务）

| spec 验收标准 | 覆盖任务 |
|---|---|
| 1. 8 类页面模板 + 双语路由 | T8–T11，`check-dist.sh` 最终 22 项断言（T13 删 dev 页后） |
| 2. 组件行为符合 §4.3/§4.4；圈注无预泄漏 | T5–T6（dev 页人工验收 + 兜底 600 + getTotalLength） |
| 3. 级联/悬停/滚动 reveal/进度 + reduced-motion | T2（全局降级）+ T5/T6/T10 |
| 4. 加 .md 自动进列表/RSS/首页 | T3 schema + T8/T10 集合驱动；T14 线上冒烟 |
| 5. frontmatter 错误 → 构建失败 | T3 Step 3 负向测试 |
| 6. Actions 绿 + 站点可访问 | T14 |
| 7. 无 CJK webfont；Lighthouse 移动端 ≥ 90 | T2（仅拉丁字体）+ T13 Step 3 |

