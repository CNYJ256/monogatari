# Monogatari Frame Generator — 设计规格书

> **版本**: 1.1 (spec review 修订)  
> **日期**: 2026-05-13  
> **状态**: 已通过 spec review，修订完成

---

## 1. 项目概述

### 1.1 定位
生成类似动画《物语系列》中静态帧（闪帧文字卡）的纯前端静态网页工具。部署于 GitHub Pages，所有操作在浏览器端完成。

### 1.2 目标用户
- 个人创作者：生成物语风格文字卡用于社交媒体或收藏
- 粉丝社区：低门槛工具，粉丝可自定义台词卡分享

### 1.3 核心约束
- 纯静态页面，无后端
- 所有操作前端实现
- 部署路径：`/monogatari/`（GitHub Pages）
- 固定输出比例：**2.40:1 (CinemaScope)**
- 技术栈：Vite + React 19 + Zustand + Canvas

---

## 2. 技术方案

### 2.1 渲染方案：纯 Canvas 引擎（方案 A）

所有内容在 `<canvas>` 上逐层绘制并导出，不依赖 DOM 排版。

**选择理由**：
- 纹理质量（扫描线 + 颗粒噪点）像素级精确可控
- 导出无需第三方库（`html2canvas` 等）
- 预览与导出共用同一渲染管线

### 2.2 架构总览

```
React App
├── 控制面板（参数表单）──┐
├── 模板系统（预设+自定义）─┤
├── i18n（中/日/英）      ─┤
└── 导出模块（PNG生成）   ─┤
                           ↓
                    Zustand FrameStore
                    （config + dirtyFlags）
                           ↓
                    Canvas 渲染引擎（纯函数）
                    Layer 1: 背景色
                    Layer 2: 扫描线纹理
                    Layer 3: 颗粒噪点
                    Layer 4: 文字（横排/竖排）
                    Layer 5: 番号栏
                    → 预览 <canvas> (HDPI)
                    → 导出离线 <canvas> (3840×1600)
```

---

## 3. 核心数据结构

### 3.1 FrameConfig

```ts
interface FrameConfig {
  baseWidth: number;  // 逻辑分辨率（渲染基准，默认 3840px）
  aspectRatio: [number, number];  // [12, 5] = 2.40:1

  assets: {
    fontsLoaded: boolean;
  };

  backgroundColor: string;

  texture: {
    scanline: {
      enabled: boolean;
      density: number;       // 线间距 (px)，默认 2
      opacity: number;       // 0.15–0.25
      color: string;         // 通常 '#000'
    };
    grain: {
      enabled: boolean;
      intensity: number;     // 0–1，默认 0.15
      type: 'luminance';     // 明度噪点
    };
  };

  textSlots: TextSlot[];

  footerBlock: {
    enabled: boolean;
    content: string;
    position: { x: number; y: number };  // 比例坐标 0–1（相对于 baseWidth/baseHeight）
    fontSize: number;                     // 比例字号（相对于 baseHeight）
    color: string;
    fontFamily: string;
    fontWeight: number;
    zIndex: number;                       // 固定为 textSlots 最大 zIndex + 1，保证在最上层
  };
}
```

### 3.2 TextSlot

```ts
interface TextSlot {
  id: string;
  content: string;
  position: { x: number; y: number };  // 比例坐标 0–1（相对于 baseWidth/baseHeight）
  fontSize: number;                     // 比例字号（相对于 baseHeight）
  color: string;
  direction: 'horizontal' | 'vertical';
  fontFamily: string;
  fontWeight: number;
  letterSpacing: number;                // 比例（相对于 fontSize）
  lineHeight: number;                   // 比例（相对于 fontSize）
  zIndex: number;                       // 叠放顺序，数值大者在上层。默认 0
  enabled: boolean;
  textAlign: 'left' | 'center' | 'right';
  textShadow?: { blur: number; color: string };
  border?: { width: number; color: string };
  stagger?: number;  // 竖排参差偏移
}
```

### 3.3 Template 定义

```ts
interface Template {
  id: string;
  name: string;           // 中文名
  nameJa: string;         // 日文名
  nameEn: string;         // 英文名
  thumbnail: string;    // 缩略图：base64 data URI 内联（≤2KB），避免额外 HTTP 请求
  category: 'single' | 'double' | 'poetry' | 'composite';
  lockedFields?: string[];
  baseConfig: {
    backgroundColor: string;
    texture: { scanline: {...}; grain: {...} };
    textSlots: TemplateTextSlot[];
    footerBlock: Partial<FooterBlock>;
  };
}

interface TemplateTextSlot extends Omit<TextSlot, 'content'> {
  label: string;
  placeholder: string;
}
```

---

## 4. 渲染引擎设计

### 4.1 渲染管线

```
render(config, canvas, dirtyFlags)
  1. clearCanvas(canvas)
  2. if dirtyFlags.backgroundOrTexture:
       fillBackground(cacheCanvas, config.backgroundColor)
       if config.texture.scanline.enabled: drawScanlines(cacheCanvas, ...)
       if config.texture.grain.enabled: drawGrain(cacheCanvas, ...)
  3. ctx.drawImage(cacheCanvas, 0, 0)  // 从缓存层合并
  4. for each textSlot (sorted by z-order):
       if slot.enabled && slot.content:
         if slot.direction === 'vertical':
           computeVerticalLayout(slot, ...) → 逐字绘制
         else:
           ctx.fillText(slot.content, ...)
  5. if config.footerBlock.enabled:
       drawFooterBlock(ctx, config.footerBlock)
```

### 4.2 脏检查（Dirty Check）

- `backgroundOrTexture` 变 → 清缓存，全量重绘
- 仅文字/番号栏变 → 重用缓存层，仅重绘 Layer 4/5
- 纹理滑条拖拽中使用 `onAfterChange` 防抖

**已知技术债务**: 当前文字层脏检查粒度为「任意 slot 变 → 所有 slot 重绘」。MVP 阶段 slot 数量少（1–3 个），影响可忽略。后续若支持多 slot 模板（5+），应引入 slot 级脏标记（记录变更 slot ID 集合），仅重绘受影响的 slot。

### 4.3 噪点优化

- 预生成 512×512 噪点纹理（离屏 Canvas）
- 使用 `ctx.createPattern()` 平铺
- 每次渲染仅偏移 pattern 坐标，不重新计算像素

**实现要点**: `CanvasPattern` 自身不支持偏移。需通过 `ctx.save()` → `ctx.translate(offsetX, offsetY)` → `ctx.fillRect()` → `ctx.restore()` 包裹实现偏移效果。偏移量可在渲染循环中随机微调以模拟动态颗粒感。

### 4.4 HDPI 适配

```
const dpr = window.devicePixelRatio;
canvas.width = cssWidth * dpr;
canvas.height = cssHeight * dpr;
canvas.style.width = cssWidth + 'px';
canvas.style.height = cssHeight + 'px';
ctx.scale(dpr, dpr);
```

### 4.5 字体加载门控

```
应用启动 → document.fonts.ready
         → assetsManager.loadFont('MS-PMincho-2.ttf')
         → 逐字体就绪 → store.fontsLoaded = true
         → 引擎 render 前：if !fontsLoaded → 跳过文字层
```

### 4.6 字体回退链

```
SimSun, PMingLiU, MS Mincho, Yu Mincho,          // Windows
Songti SC, Songti TC, Hiragino Mincho ProN,       // macOS
MS PMincho,                                        // 本地 (MS-PMincho-2.ttf)
serif                                              // 终极回退
```

---

## 5. 竖排布局引擎

### 5.1 字素分割

优先使用 `Intl.Segmenter('ja-JP', { granularity: 'grapheme' })` 进行字素级分割。

**回退方案**（`Intl.Segmenter` 不可用时——如 Safari < 16.4）：
```ts
function splitGraphemes(text: string): string[] {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter('ja-JP', { granularity: 'grapheme' });
    return [...segmenter.segment(text)].map(s => s.segment);
  }
  // 回退：正则匹配 CJK 字符 + 假名 + 标点（每字独立）+ 连续半角/数字（分组）
  return text.match(/[\p{Script=Hani}\p{Script=Hiragana}\p{Script=Katakana}\p{P}]|[\p{Latin}\p{N}]+|./gu) ?? [];
}
```

字体加载门控中增加此能力检测，若两者均不可用则降级提示。

### 5.2 逐字定位与溢出控制

- 每字 Y 坐标 = `startY + index × fontSize × lineHeight`
- 列从右向左排列（日文传统方向）
- **竖向溢出**: 超出画布高度 → 换列（X 左移 `fontSize × lineHeight`）
- **水平溢出**: 列数过多超出画布宽度时，超出部分被 `clip()` 裁剪。渲染前预计算最大列数 `maxColumns = floor(canvasWidth / (fontSize × lineHeight))`，超出列数的文字不渲染
- 画布物理坐标由 `utils/coordinates.js` 基于 §5.6 公式统一换算

### 5.3 标点处理

| 字符类型 | 处理 |
|----------|------|
| 「」『』（）{} | 绕字符中心旋转 90° |
| 。、，． | 不旋转，向右上角平移 `(+0.4fs, -0.4fs)` |
| —（长破折号） | 旋转 90° |

### 5.4 纵中横（Tate-chu-yoko）

连续 2–3 个半角字符 → 作为一个整体横向排列，占一个全角字位。

### 5.5 避头尾（Kinsoku Shori）

- **行首禁入**: 。、」）！？不能出现在列的第一个字
- **行末禁入**: 「（不能出现在列的最后一个字
- **算法**: 两阶段处理——先按高度贪心分行，再逐列扫描修正禁则字符
- **回溯上限**: 最多回溯 **2 次**。若连续修正 2 次后仍出现禁则冲突，保持当前布局不变并以 `console.warn` 记录。此限制防止超长文本引发级联重排
- **已知限制**: 对于极短列宽 + 长段连续禁则字符的极端组合，可能无法完全消除禁则冲突。此场景在物语帧的实际使用中几乎不会出现（文字量通常为 1–3 短句）

### 5.6 坐标系统

$$P_{pixel} = P_{ratio} \times baseDimension \times globalScale$$

$$globalScale = canvasActualWidth / baseWidth$$

---

## 6. 模板系统

### 6.1 MVP 内置模板（5 个）

| ID | 名称 | 底色 | 纹理 | 字位 |
|----|------|------|------|------|
| `single-char-black` | 单字·黑 | `#000` | 弱扫描线 + textShadow 晕光 | 1 横排大字居中 |
| `single-char-red` | 单字·红 | `#e60000` | 扫描线 + 颗粒 | 1 横排大字居中 |
| `double-line-red` | 双行·红 | `#e60000` | 扫描线 + 颗粒 | 2 横排（主大字 + 副小字） |
| `poetry-vertical` | 竖排·黑 | `#000` | 弱扫描线 | 1 竖排右上 + stagger 参差 |
| `vertical-white` | 竖排·白 | `#fff` | 颗粒噪点 + border 细边 | 1 竖排右上 + 1 横排角标 |

### 6.2 模板加载与持久化

#### 6.2.1 加载流程

```
用户选择模板
  ↓
从模板文件加载 baseConfig
  ↓
检查 localStorage key: monogatari:template:{templateId}:config
  ├─ 存在 → 深度合并（用户覆盖值优先，lockedFields 以模板值为准）
  └─ 不存在 → 直接使用 baseConfig
  ↓
TemplateTextSlot[] → TextSlot[] 转换
  （将 label/placeholder 剥离，填充用户已保存的 content，未保存则 content=''）
  ↓
生成初始 FrameConfig → 存入 Zustand store
```

#### 6.2.2 持久化策略

- **存储 key 格式**: `monogatari:template:{templateId}:config`
- **存储内容**: `{ version: 1, overrides: Partial<FrameConfig> }`
- **合并算法**: 深度合并（deep merge），用户 overrides 优先；`lockedFields` 中列出的字段强制使用模板默认值
- **版本迁移**: 加载时比对 `version` 字段。模板升级导致结构不兼容时，丢弃旧 overrides，以新版模板为准
- **跨模板隔离**: 每个模板使用独立的 localStorage key，模板 A 的配置不会污染模板 B
- **错误处理**: `localStorage` 满或不可用时 try-catch，静默降级为仅内存存储。用户体验不受影响，仅不持久化

### 6.3 lockedFields

模板可锁定特定字段，防止用户误调破坏风格。例如 `single-char-black` 可锁定 `backgroundColor` 为 `#000`。

---

## 7. 导出模块

```
用户点击导出
  ↓
Header 显示 "导出中…" loading
  ↓
创建离屏 canvas: baseWidth × (baseWidth / 2.40)
  默认 3840 × 1600
  ↓
renderer.render(config, offscreenCanvas, scale=1.0)
  （全量渲染，不做脏检查）
  ↓
offscreenCanvas.toBlob('image/png')
  ↓
URL.createObjectURL(blob) → <a download> 触发下载
  ↓
URL.revokeObjectURL() 清理
  ↓
Header 恢复 "导出 PNG"
```

文件命名格式：`monogatari-{timestamp}.png`

---

## 8. i18n（中/日/英）

### 8.1 方案

轻量自建，无外部依赖。

```
src/i18n/
├── index.js    # t(key) 翻译函数 + setLang() 切换
├── zh-CN.js    # 简体中文
├── ja.js       # 日本語
└── en.js       # English
```

```ts
function t(key: string): string {
  return translations[currentLang][key] 
    ?? translations['zh-CN'][key] 
    ?? key;
}
```

### 8.2 语言检测

1. `localStorage.getItem('lang')` 优先
2. 其次 `navigator.language` 自动检测
3. 回退 `zh-CN`

### 8.3 语言切换器

Header 右侧下拉菜单。切换后更新 Zustand store 的 `lang` 字段。

**重要**: `lang` 变更**仅触发 React 组件树 re-render**（控制面板文案切换），**不触发 Canvas 重绘**。Canvas 渲染订阅仅限 `config` 和 `dirtyFlags` 的变化，与 `lang` 解耦。这避免用户切换 UI 语言时产生不必要的 Canvas 全量重绘开销。

---

## 9. UI 布局

### 9.1 桌面端 (≥1024px)

```
┌────────────────────────────────────────────────────┐
│  Header: 标题 | 模板切换 | 语言切换 | 导出 PNG     │
├──────────────┬─────────────────────────────────────┤
│  控制面板     │       预览区                        │
│  (360px)     │   ┌───────────────────────────┐    │
│              │   │  深灰棋盘格背景            │    │
│  模板选择    │   │    <canvas> 2.40:1        │    │
│  (卡片网格)  │   │    实时渲染               │    │
│              │   │                           │    │
│  TextSlot 1  │   └───────────────────────────┘    │
│  (Accordion) │                                     │
│  TextSlot 2  │   当前分辨率 + 逻辑基准尺寸指示      │
│  (Accordion) │                                     │
│              │                                     │
│  背景色      │                                     │
│  (预设+取色) │                                     │
│              │                                     │
│  纹理控制    │                                     │
│  (扫描线/噪点)│                                     │
│              │                                     │
│  番号栏      │                                     │
│  (Accordion) │                                     │
└──────────────┴─────────────────────────────────────┘
```

### 9.2 移动端 (<1024px)

- 预览 Canvas 固定在屏幕顶部
- 参数面板以 Bottom Sheet 从底部拉起，遮挡一半预览区
- 面板默认折叠，点击展开

### 9.3 视觉主题

- 默认**深色模式**
- 预览区：深灰/棋盘格背景包围 2.40:1 画布
- 模板卡片：`hover` 放大 + `outline` 高亮（非 `border` 避免布局抖动）
- 取色器：预设色板 + 传统色（中国红、玄青、月白等）+ 自由取色

### 9.4 交互细节

| 交互 | 实现 |
|------|------|
| Canvas 点击 | 逆映射点击坐标（像素 → 比例），遍历 textSlots 按 `zIndex` 降序命中检测，命中后高亮对应 TextSlotEditor |
| Canvas 拖拽 | 命中 slot 后拖动更新 store 中的 x/y 比例值 |
| 纹理滑条 | `onAfterChange` 防抖，避免逐帧重绘 |
| TextSlotEditor | Accordion 折叠，标题显示摘要（如「Slot 1: 悪 (竖排)」） |
| 番号栏 | 独立 Accordion，提供 X/Y 滑条 + 文字编辑 + 开关 |

**点击命中检测策略**:
1. 将点击的像素坐标除以 `dpr`，再通过 `utils/coordinates.js` 转换为比例坐标
2. 对每个 `enabled` 且 `content` 非空的 slot，按 `zIndex` 降序遍历
3. 横排 slot：以 `position` 为中心，根据 `fontSize` 和文字实际宽度计算包围盒（bounding box）
4. 竖排 slot：逐字检测——重构 `computeVerticalLayout` 的布局结果，对每列每字做点-in-rect 判定
5. 首个命中的 slot 即为选中目标；若未命中任何 slot 则取消选中

---

## 10. 文件结构

```
src/
├── main.jsx
├── App.jsx
├── App.css
│
├── config/
│   └── defaults.js              # 默认帧配置、预设色板、推荐纹理参数
│
├── state/
│   └── frameStore.js            # Zustand: config + dirtyFlags + actions
│
├── engine/                       # 纯函数渲染引擎（无 React 依赖）
│   ├── renderer.js               # 主管线：根据 dirtyFlags 调度 layer
│   ├── internalState.js          # 运行时单例：预生成 CanvasPattern、离屏 canvas 等可复用资源
│   │                               #   并非全局可变状态，而是资源池。渲染管线通过参数传入以保持可测试性
│   ├── assetsManager.js          # 字体/图片预加载门控
│   ├── cache.js                  # 背景/纹理离屏 canvas 缓存
│   ├── export.js                 # 高分辨率 PNG 导出
│   ├── layers/
│   │   ├── background.js
│   │   ├── scanlines.js
│   │   ├── grain.js
│   │   └── text.js
│   └── layout/
│       └── verticalText.js       # 竖排布局引擎
│
├── hooks/                        # React Hooks
│   ├── useCanvasRenderer.js      # 核心渲染调度
│   ├── useFontStatus.js          # 全局字体加载状态
│   └── useWindowResize.js        # 容器尺寸 → canvas 自适应
│
├── components/
│   ├── layout/
│   │   ├── AppShell.jsx
│   │   └── Header.jsx
│   ├── panel/
│   │   ├── ControlPanel.jsx
│   │   ├── TemplateSelector.jsx
│   │   ├── BackgroundPicker.jsx
│   │   ├── TextureControls.jsx
│   │   ├── TextSlotEditor.jsx
│   │   └── FooterBlockEditor.jsx
│   ├── preview/
│   │   └── PreviewCanvas.jsx
│   └── common/
│       ├── ColorPicker.jsx
│       └── SliderInput.jsx
│
├── templates/
│   ├── index.js                  # 注册表
│   ├── single-char-black.js
│   ├── single-char-red.js
│   ├── double-line-red.js
│   ├── poetry-vertical.js
│   └── vertical-white.js
│
├── i18n/
│   ├── index.js
│   ├── zh-CN.js
│   ├── ja.js
│   └── en.js
│
├── fonts/
│   └── MS-PMincho-2.ttf
│
└── utils/
    └── coordinates.js            # 逻辑坐标 (0–1) ↔ 物理坐标 (px)
```

---

## 11. 错误处理

| 场景 | 处理 |
|------|------|
| 字体全部未加载 | 跳过文字层，预览区显示"字体加载中…" |
| `Intl.Segmenter` 不可用 | 使用正则回退方案（§5.1），降级警告 |
| 所有 TextSlot disabled | 仅渲染背景+纹理+番号栏 |
| 文字内容为空 | 该 slot 跳过不渲染 |
| 竖排文字竖向过长超出画布高度 | 换列；超出最大列数则 `clip()` 裁剪 |
| 竖排文字水平溢出（列数过多） | 预计算最大列数，超出部分不渲染 |
| localStorage 满/不可用 | try-catch，静默降级为仅内存存储 |
| Canvas 不支持 | 显示 "您的浏览器不支持此功能" 降级提示 |
| 纹理 pattern 生成失败 | 跳过纹理层，渲染纯色底 |
| 避头尾回溯超限（§5.5） | console.warn，保持当前布局不变 |

---

## 12. MVP 范围边界

| ✅ MVP 包含 | ❌ MVP 不包含 |
|-------------|---------------|
| 5 个内置模板 | 用户上传自定义图片作背景 |
| 纯色底 + 扫描线 + 颗粒噪点 | 撤销/重做 |
| 横排 + 竖排文字渲染 | 动画导出 (GIF/APNG) |
| 番号栏（可调位置） | 多语言 i18n 的 RTL 支持 |
| 中/日/英 UI | 在线画廊/分享 |
| 2.40:1 固定比例 PNG 导出 | WCAG 无障碍合规（Canvas 对屏幕阅读器不可见；后续版本可为控制面板增加键盘导航和 ARIA 标签） |
| localStorage 模板保存 | — |
| Canvas 点击定位 + 拖拽文字 | — |
| 深色模式 UI | — |

---

## 13. 依赖

### 运行时
- `react` ^19.2.5
- `react-dom` ^19.2.5
- `zustand` (待安装)

### 开发时
- `vite` ^8.0.10
- `@vitejs/plugin-react` ^6.0.1
- `eslint` ^10.2.1

### 非 npm 依赖
- `MS-PMincho-2.ttf`（本地字体文件）
- 浏览器 API：`Canvas 2D`、`Intl.Segmenter`、`document.fonts`、`window.devicePixelRatio`

### 字体体积与许可

| 项目 | 说明 |
|------|------|
| **体积** | `MS-PMincho-2.ttf` 预计 5–8MB。建议后续做字体子集化（subsetting），仅保留日文常用汉字 + 假名 + 标点，目标 < 2MB |
| **加载策略** | 字体使用 `font-display: swap` 策略。加载期间显示系统回退字体，就绪后自动重绘 |
| **许可** | MS PMincho 为商业字体。部署前需确认：若字体文件不可合法公开分发，则从仓库移除，改为提供字体上传功能让用户自行加载；或替换为开源替代（如 Google Fonts Noto Serif JP） |
| **运行时回退** | 字体加载失败时使用 §4.6 回退链，不影响工具基本可用性 |
