---
name: ink-line-design-system
description: Use when building or extending any page/component on Zihao Zhang's personal website (this repo), or when asked elsewhere to apply "the ink-line aesthetic" / "墨线设计风格" — a warm-neutral + violet visual language with hand-drawn circle annotations and offset hard-shadow cards, built for an academic/engineering personal brand.
---

# Ink-line Design System

## Overview

个人品牌视觉语言：**克制的学术气质 + 手工感线条强调**，不靠花哨发光或多色相取胜。核心哲学（讨论中反复验证的边界）——**强调用黑色线条/描边做，不用堆颜色**；工艺感可以有，Reflect 式华丽发光不要；一切动效服务内容，可信度优先于炫技。灵感来源：Anthropic 官网的米色调 + ink-line 插画语言，Linear 首页级联浮现，rauno.me 的入场动效（但要补足它缺失的悬停反馈）。

**5 色相封顶，色相已用满，不加新色相**（功能色如 error/success 除外，按需再加）。加新组件/新页面时，优先用已有的线条语言表达强调，而不是引入新颜色。

## 色板（`src/styles/tokens.css`，唯一权威来源）

| 变量 | 值 | 用途 |
|---|---|---|
| `--bg` | `#F7F4EE` | 页面底色，米白 |
| `--surface` | `#CDCAE0` | 淡薰衣草，大色块（卡片交替底色） |
| `--purple-mid` | `#8A82C9` | 中紫，插画/次级点缀（目前较少直接用） |
| `--accent` | `#5E6AD2` | 交互紫（**装饰用**）：InkButton 硬投影、LangSwitch hover 背景等；**不作小字文字色**（对比度 4.28:1，不足 WCAG AA 4.5） |
| `--accent-ink` | `#5460CC` | 深靛（**文字用**）：kicker、项目卡分类小标、LangSwitch 静态态等 ≤14px 紫色文字；从 `--accent` 深化派生，非新色相，对比度 4.88:1 |
| `--ink` | `#1C1917` | 墨色，正文字/线条/描边 |
| `--card` | `#FFFFFF` | 白卡片 |
| `--text-2` / `--text-3` | `#44403C` / `#746D67` | 次级文字（从墨色派生，非新色相）；`--text-3` 深化自 `#78716C`，保 13.5px 摘要文字达 4.5:1 |
| `--border` | `#E7E2D8` | 极浅分隔线 |

## 字体系统

```css
--font-serif: 'Source Serif 4 Variable', Georgia, 'Songti SC', 'Noto Serif CJK SC', serif;   /* 标题 h1-h4 */
--font-sans:  'Inter Variable', 'Helvetica Neue', 'PingFang SC', 'Noto Sans CJK SC', sans-serif; /* 正文 */
--font-mono:  'JetBrains Mono Variable', Menlo, monospace;   /* 数据/术语高亮、代码 */
```

**硬约束：禁止引入 CJK webfont。** 中文字符一律吃系统字体栈（`Songti SC`/`PingFang SC`/`Noto Sans CJK SC` 等），只有拉丁字符加载自托管的 variable font 并 preload。这是刻意的性能取舍，别为了"中英文字重统一"去引入中文 webfont。

**等宽高亮 chip**（术语、量化数据用，如 `900+ regression tests`、`OS × AI`）：
```css
.mono-chip { font-family: var(--font-mono); font-size: .85em; background: var(--surface); border: var(--line) solid var(--ink); padding: 2px 9px; border-radius: 5px; margin-inline: .35em; }
.mono-chip--outline { background: var(--card); } /* 次级变体：换底色，不换描边——两种变体共用同一条墨色边框 */
.chips .mono-chip, .meta .mono-chip { margin-inline: 0; } /* 专用 chip 行由 flex gap 控距，清掉自带外边距 */
```
两种变体**都有墨色描边**，只用底色（`--surface` 紫 / `--card` 白）区分强调层级，边框本身不作为差异维度——否则在 `OffsetCard` 的 `lavender` 变体上会出现"紫底 chip 无边框、白底 chip 有边框"的不对称观感（紫底 chip 会和卡片背景糊在一起，白底 chip 却被强描边勾出来）。

chip 有两种出场方式，间距来源不同：**内联进正文**做高亮时（如 hero 的 `.sub`），靠 `margin-inline: .35em` 和前后文字/标点留呼吸空间，否则会紧贴成一团；**专用 chip 行**（`.chips`/`.meta` 这类 flex 容器）里间距由 `gap` 统一给，必须把 chip 自带的 `margin-inline` 清零，否则和 gap 叠加、且首个 chip 会相对容器左缘缩进错位。

## 线条语言组件（签名 vs 配角）

**签名元素**（辨识度最强，新页面优先复用而非发明新样式）：

| 组件 | 文件 | 效果 |
|---|---|---|
| InkButton | `src/components/InkButton.astro` | 细墨框按钮，悬停填墨反色 + 上浮 2px + 紫色硬投影 `0 4px 0 0 var(--accent)` |
| OffsetCard | `src/components/OffsetCard.astro` | 墨框卡片，悬停错位 `translate(-3px,-3px)` + 墨色硬投影 `5px 5px 0 0 var(--ink)`；`variant="lavender"` 用淡薰衣草底做交替 |
| CircleAnnotation | `src/components/CircleAnnotation.astro` | 手绘圈注：SVG 描边动画圈住关键词，进场画一次 + **每次 mouseenter 重画**。用户最强偏好的元素，新页面若要强调 1-2 个关键词，优先用它而不是加粗/变色 |

**配角**（简单实用，辅助结构）：NavLink 动态下划线（`scaleX` 从右到左收起、悬停从左到右展开）、SectionRule 编号+标尺线（滚入视口时 `scaleX(.25)→scaleX(1)`）、CornerFrame 四角括号框（悬停时四个 18px 直角"生长"为完整边框，`transition: all .7s`，用于 Now 页这类"数据高亮"场景）。

**圆角基准**（无统一变量，按元素类型分层，新组件照此选取，不要凭感觉定数）：交互卡片/按钮类（OffsetCard/InkButton）用 `10–12px` 柔和方框；小尺寸标签类（mono-chip/LangSwitch）用 `5–6px`；线条/结构性装饰元素（CornerFrame 的角标、下划线、标尺线、圈注 SVG）**不用圆角**，保持线条本身的锐利感——圆角只用于"有内部留白的容器"，不用于"线条本身"。

### 静态底色 = 气质分层的主开关

"位移+硬投影"是一套**手法**，不是 OffsetCard 组件的专属——PostList 就直接把它手写在 `<a>` 上而不用组件。同一手法只改静态底色就能拉开气质差异，同一页面里出现多种容器时优先靠这个维度分层，不要为了"看起来不一样"就发明新的 hover 语言：

| 静态底色 | 气质 | 用在哪 |
|---|---|---|
| `--card` 白 | **实体感强**，"完整内容块" | 项目卡片（有摘要、tech chips、metrics） |
| `--surface` 淡薰衣草 | 同强度但差异化 | 项目卡片交替底色（`order % 2 === 0`） |
| `--bg` 米白（融入页面） | **轮廓感**，只靠描边勾勒 | 博客列表这类"轻量索引"条目 |

选哪个看承载的内容分量——摘要 + 多标签 → `--card`/`--surface`；只有标题和元信息 → `--bg`。三者 hover 参数一致（`translate(-3px,-3px)` + `5px 5px 0 0 var(--ink)`，`.22s var(--ease-out)`）。

### CircleAnnotation 的关键实现约束（踩过的坑）

`stroke-dasharray`/`stroke-dashoffset` **必须运行时用 `getTotalLength()` 精确设置**，不能硬编码估算长度——硬编码会在动画开始前泄漏一段笔画、且起笔位置错乱（真实周长和估算值不符时会露馅）。CSS 里保留一个明显偏大的兜底值（当前 600）防止 JS 执行前的样式闪现：

```js
const len = Math.ceil(path.getTotalLength()) + 4;  // 精确长度，禁止硬编码常数
path.style.strokeDasharray = String(len);
path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], {
  duration: 950, easing: 'cubic-bezier(.55,.06,.35,.98)', fill: 'forwards',
});
```
SVG 视觉出血约 10px 到容器外（笔画本身比文字略宽），给 `.anno` 加 `margin-inline: .18em` 让邻词不被挤压。

## 动效参数

- **Easing**：`--ease-out: cubic-bezier(.21,.6,.35,1)`（通用位移/悬停）、`--ease-draw: cubic-bezier(.55,.06,.35,.98)`（手绘描边专用，起笔慢、行笔快）。
- **级联进场（CascadeGroup）**：整页只用一个 CascadeGroup 包住全部内容（含章节标题、卡片网格、列表），形成**一条从上到下的时间轴**，不要按区块各自触发——那会显得割裂。阶梯延迟 `.05/.18/.32/.46/.62/.78/.94s`，第 8 个起统一 `1.1s`。纯 CSS 实现，无需 JS/IntersectionObserver。**易错点**：Astro 会把组件脚本注入为 `<script>` 子元素占用 `nth-child` 槽位，用 `:nth-child(n of :not(script))` 排除，否则延迟会悄悄错位。
- **常规 hover transition**：0.2–0.7s 区间，越"结构性"的元素（角标框这种从局部到完整的形变）适合更慢（.7s），越"即时反馈"的元素（按钮变色）适合更快（.22s）。没有统一数值，按元素的"动作幅度"判断。
- **`prefers-reduced-motion: reduce` 必须双层降级**：全局 `global.css` 里已有 `animation-duration/transition-duration: .01ms !important` 兜底，加新动效时如果用了 JS 驱动（如圈注的 `path.animate`），额外在 JS 里判断 `matchMedia('(prefers-reduced-motion: reduce)').matches` 直接跳过动画逻辑（纯 CSS 降级对 JS 驱动的动画不够）。

## Common Mistakes

- 加新强调手法时想直接换个颜色 → 先想能不能用线条/描边/圈注表达，颜色不够用是设计约束不是疏漏。
- 把 `--accent` 直接当小字文字色用（kicker、分类小标、元信息这类 ≤14px 紫色文字）→ 用 `--accent-ink`。`--accent` 是装饰色（按钮硬投影、hover 背景等），作小字文字色对比度不够 AA。
- 给中文标题引入更"好看"的中文 webfont → 不要，系统字体栈是性能优先的刻意选择。
- 新组件的悬停效果只变个颜色，没有位移/形变 → 参考 InkButton/OffsetCard 的"位移+硬投影"手法，悬停反馈应有实体动作感，不只是变色。
- 想让新容器和已有卡片"气质有区别"就想发明新 hover 手法 → 先只换静态底色（`--card` / `--surface` / `--bg`）。同一"位移+硬投影"配三种底色能读出显著气质差异（实体 vs 轮廓），不必新造 CSS 规则。
- 同一组强调元素（如 chip 的紫底/白底两种变体）只给其中一种加描边 → 两者应共用同一条边框语言，只用底色区分层级。否则两者叠在同色系容器上会出现"一个融进背景、一个被强行勾出来"的不对称，尤其当容器本身也在 `--card`/`--surface` 间切换时会放大这种割裂。
- 圈注或类似路径动画，图省事用固定数字当 `stroke-dasharray` → 必须 `getTotalLength()` 运行时取值。
- 新页面/区块的进场动画各自触发（比如各自套一层 IntersectionObserver）→ 整页应共享一条 CascadeGroup 时间轴。
