# Monogatari Frame Generator — 实施计划

> **日期**: 2026-05-13  
> **基于**: 设计规格书 v1.1  
> **原则**: 每阶段可独立验证，先骨架后血肉，引擎优先于 UI

---

## 阶段总览

```
Phase 1: 基础设施    ████████░░░░░░░░░░  (预计 20%)
Phase 2: 渲染引擎    ████████████████░░  (预计 35%)
Phase 3: 模板 + 状态  ██████████████████  (预计 15%)
Phase 4: UI 组件     ██████████████████  (预计 20%)
Phase 5: 集成 + 打磨  ██████████████████  (预计 10%)
```

---

## Phase 1: 基础设施搭建

**目标**: 可运行的空项目 + 字体就绪 + 状态骨架

### 任务

| # | 任务 | 产出 | 验证方式 |
|---|------|------|----------|
| 1.1 | 安装 zustand | `npm install zustand` | `npm ls zustand` |
| 1.2 | 清理 Vite 模板代码 | 删除 `App.jsx` 中 demo 内容，保留空壳 AppShell | `npm run dev` 看到空白页 |
| 1.3 | 创建 `src/state/frameStore.js` | Zustand store 骨架：`config` + `dirtyFlags` + `setConfig` / `updateSlot` / `setDirty` actions | console 测试 store 读写 |
| 1.4 | 创建 `src/engine/internalState.js` | 资源池骨架（空对象，后续填充 Pattern） | import 不报错 |
| 1.5 | 创建 `src/utils/coordinates.js` | `ratioToPixel()` / `pixelToRatio()` 转换函数 + 单元测试 | 手动 console 验证几个坐标 |
| 1.6 | 放置 `MS-PMincho-2.ttf` 到 `src/fonts/` | 字体文件就位 | 文件存在 |
| 1.7 | 创建 `src/engine/assetsManager.js` | `loadFont()` 函数 + `document.fonts.load()` 封装 | console 确认字体加载成功 |
| 1.8 | 创建 `src/config/defaults.js` | 默认 `FrameConfig`、预设色板、推荐纹理参数常量 | import 不报错 |

**验证里程碑**: `npm run dev` → 空白深色页面，DevTools console 中可手动调用 store 读写和坐标转换函数。

---

## Phase 2: 渲染引擎（核心）

**目标**: Canvas 上能画出完整的物语帧（背景 + 纹理 + 文字），不依赖任何 React 组件

### 子阶段 2A：背景 + 纹理层

| # | 任务 | 产出 | 验证方式 |
|---|------|------|----------|
| 2A.1 | 创建 `src/engine/layers/background.js` | `drawBackground(ctx, color)` — 纯色填充 | 手工在 canvas 测试页验证 |
| 2A.2 | 创建 `src/engine/layers/scanlines.js` | `drawScanlines(ctx, density, opacity, color)` — 用 `createPattern` 平铺生成的 1px 高条纹纹理 | 肉眼可见水平线 |
| 2A.3 | 创建 `src/engine/layers/grain.js` | `generateNoisePattern(size)` 预生成函数 + `drawGrain(ctx, pattern, intensity)` — 512×512 噪点平铺 | 肉眼可见颗粒 |
| 2A.4 | 创建 `src/engine/cache.js` | `createCacheCanvas()` / `updateCache()` / `drawCache()` — 离屏 canvas 缓存背景+纹理合成结果 | 修改背景色后验证脏标记 |

**子阶段 2A 验证**: 在一个裸 `<canvas>` 上调用各 layer 函数，能看到红底 + 扫描线 + 颗粒噪点的物语帧背景。

### 子阶段 2B：横排文字

| # | 任务 | 产出 | 验证方式 |
|---|------|------|----------|
| 2B.1 | 创建 `src/engine/layers/text.js` | `drawHorizontalText(ctx, slot, scale)` — 横排 `fillText`，处理 textAlign + letterSpacing + textShadow | 黑底白字「悪」居中显示 |
| 2B.2 | text.js 增加字体就绪检查 | 渲染前调用 `document.fonts.check()` | 字体未加载时不崩溃 |

**子阶段 2B 验证**: Canvas 上有红底 + 纹理 + 居中的白色日文大字。

### 子阶段 2C：竖排文字

| # | 任务 | 产出 | 验证方式 |
|---|------|------|----------|
| 2C.1 | 创建 `src/engine/layout/verticalText.js` | `computeVerticalLayout(text, slot, canvasW, canvasH, scale)` — 字素分割 + 逐字 Y 坐标 + 换列 + 水平溢出预计算 | 返回结构化布局数据 |
| 2C.2 | verticalText.js — 标点处理 | 括号旋转 90° / 句逗号平移 / 纵中横打包 | 逐个字符类型验证 |
| 2C.3 | verticalText.js — 避头尾 | 两阶段算法 + 回溯上限 2 | 用「あいうえお。」测试句号不落列首 |
| 2C.4 | text.js 增加 `drawVerticalText()` | 遍历 computeVerticalLayout 结果逐字绘制到 canvas | 竖排「物語」正确渲染 |

**子阶段 2C 验证**: Canvas 上有竖排文字 + 标点位置正确 + 超长文字正确换列。

### 子阶段 2D：渲染管线 + 番号栏

| # | 任务 | 产出 | 验证方式 |
|---|------|------|----------|
| 2D.1 | 创建 `src/engine/renderer.js` | 主管线函数 `render(config, canvas, dirtyFlags)` — 按 §4.1 调度各 layer | 传入完整 config 后 canvas 出现完整帧 |
| 2D.2 | renderer.js 集成缓存层 | 脏检查逻辑：`dirtyFlags.backgroundOrTexture` → 更新 cache → drawImage | 修改文字不触发纹理重绘 |
| 2D.3 | renderer.js 增加番号栏渲染 | `drawFooterBlock(ctx, footerBlock, scale)` — 横排小字渲染 | 底部显示「第二十六話・三」 |

**子阶段 2D 验证**: 纯 JS 调用 `render(config, canvas, { backgroundOrTexture: true })`，能得到一张完整的物语帧。

---

## Phase 3: 模板系统 + i18n 骨架

**目标**: 5 个内置模板可加载，i18n 可切换，localStorage 可读写

| # | 任务 | 产出 | 验证方式 |
|---|------|------|----------|
| 3.1 | 创建 `src/templates/index.js` + 5 个模板文件 | 每个模板导出符合 `Template` 接口的配置对象 | import 后 console.log 结构正确 |
| 3.2 | 创建 `src/i18n/zh-CN.js` / `ja.js` / `en.js` | 所有 UI 文案的翻译键值对（先覆盖 MVP 面板所需） | 手动切换 `currentLang` 验证 |
| 3.3 | 创建 `src/i18n/index.js` | `t(key)` + `setLang()` + 语言检测逻辑 | 同上 |
| 3.4 | frameStore 增加模板相关 actions | `loadTemplate(templateId)` / `saveConfig()` / `resetToTemplate()` | 手动调用后 store 状态正确 |
| 3.5 | frameStore 增加 localStorage 持久化 | §6.2.2 完整策略实现（含版本号 + 错误降级） | 刷新页面后模板配置保留 |

**验证里程碑**: 在 console 中可加载模板 → 生成 FrameConfig → 调 renderer → Canvas 出图；切换语言后 `t('export.button')` 返回对应语言字符串。

---

## Phase 4: UI 组件

**目标**: 完整的 React 界面，面板 + 预览 + 交互

### 子阶段 4A：布局骨架

| # | 任务 | 产出 | 验证方式 |
|---|------|------|----------|
| 4A.1 | 创建 `src/components/layout/AppShell.jsx` | 响应式两栏布局（桌面左右 / 移动上下堆叠） | 拉伸窗口验证断点 |
| 4A.2 | 创建 `src/components/layout/Header.jsx` | 顶栏：标题 + 语言切换下拉 + 导出按钮 | 视觉确认 |
| 4A.3 | 创建 `src/components/preview/PreviewCanvas.jsx` | `<canvas>` 容器 + HDPI 适配 + 棋盘格背景 | 2.40:1 画布在深灰背景中居中 |
| 4A.4 | 创建 `src/hooks/useWindowResize.js` | 监听容器 resize → 更新 canvas 尺寸 → 触发重绘 | 拖拽窗口画布自适应 |

### 子阶段 4B：控制面板

| # | 任务 | 产出 | 验证方式 |
|---|------|------|----------|
| 4B.1 | 创建 `src/components/panel/ControlPanel.jsx` | 面板容器 + 滚动 + 折叠逻辑 | 视觉确认 |
| 4B.2 | 创建 `src/components/panel/TemplateSelector.jsx` | 5 张模板卡片网格 + hover 放大 + outline 高亮 | 点击切换模板 |
| 4B.3 | 创建 `src/components/common/ColorPicker.jsx` | 预设色块 + 传统色 + 原生 `<input type="color">` | 取色后 store 更新 |
| 4B.4 | 创建 `src/components/common/SliderInput.jsx` | 带数值标签的滑条 + `onAfterChange` 防抖 | 拖动滑条值时流畅 |
| 4B.5 | 创建 `src/components/panel/BackgroundPicker.jsx` | 背景色选择区（预设 + ColorPicker） | 选色后预览实时刷新 |
| 4B.6 | 创建 `src/components/panel/TextureControls.jsx` | 扫描线开关 + 密度滑条 + 透明度滑条；颗粒开关 + 强度滑条 | 开关/滑条变化后预览更新 |
| 4B.7 | 创建 `src/components/panel/TextSlotEditor.jsx` | Accordion 折叠面板：文字输入框 + 字号滑条 + X/Y 位置滑条 + 颜色 + 横竖排切换 + textShadow 开关 + 启用开关 | 编辑后预览文字实时刷新 |
| 4B.8 | 创建 `src/components/panel/FooterBlockEditor.jsx` | 番号栏 Accordion：开关 + 文字内容 + X/Y 滑条 + 字号 + 颜色 | 编辑后预览番号栏刷新 |

### 子阶段 4C：渲染 Hook + 交互

| # | 任务 | 产出 | 验证方式 |
|---|------|------|----------|
| 4C.1 | 创建 `src/hooks/useCanvasRenderer.js` | Zustand subscribe → 脏检查 → 调 `renderer.render()` | 面板改参数 → 预览刷新 |
| 4C.2 | 创建 `src/hooks/useFontStatus.js` | 全局字体加载状态 → store.assets.fontsLoaded | 启动时显示加载提示 |
| 4C.3 | PreviewCanvas 增加点击 + 拖拽交互 | 命中检测 → 高亮 panel 对应 slot；拖拽更新 x/y | 点击画布上文字 → 左侧 panel 对应 slot 展开 |

**验证里程碑**: 完整的可用界面——选模板、改文字、调纹理、换颜色，右侧实时预览，点击导出 PNG 下载。

---

## Phase 5: 导出 + 边缘打磨

**目标**: 高质量 PNG 导出 + 错误处理 + 部署就绪

| # | 任务 | 产出 | 验证方式 |
|---|------|------|----------|
| 5.1 | 创建 `src/engine/export.js` | `exportPNG(config)` — 离屏 canvas 3840×1600 全量渲染 → `toBlob` → download | 下载的 PNG 分辨率正确 |
| 5.2 | Header 导出按钮接入 export.js | Loading 状态 + 下载触发 + 错误提示 | 点击导出 → loading → 下载 |
| 5.3 | 错误处理集成 | 字体加载中提示 / Canvas 不支持降级 / localStorage 降级 | 模拟异常场景验证 |
| 5.4 | `vite build` + `vite preview` 验证 | 生产构建无报错，GitHub Pages 路径 `/monogatari/` 正确 | `npm run preview` 后功能完整 |
| 5.5 | 最终走查 | 检查所有交互、导出质量、移动端布局 | 完整 checklist |

---

## 依赖关系图

```
Phase 1 (基础设施)
  ├─→ Phase 2A (背景+纹理)
  │     └─→ Phase 2B (横排文字)
  │           └─→ Phase 2C (竖排文字)
  │                 └─→ Phase 2D (管线+番号栏)
  │
  ├─→ Phase 3 (模板+i18n) ← 可与 Phase 2 并行
  │
  └─→ Phase 4 (UI) ← 依赖 Phase 2D + Phase 3
        ├─→ Phase 4A (布局骨架) 先做
        ├─→ Phase 4B (控制面板) 与 4C 交替推进
        └─→ Phase 4C (渲染 Hook+交互)
              └─→ Phase 5 (导出+打磨)
```

---

## 关键风险 & 对策

| 风险 | 影响 | 对策 |
|------|------|------|
| 竖排引擎实现复杂度超预期 | 阻塞 Phase 2C → Phase 4 | 2C 作为最优先攻克项；若标点/避头尾耗时过多，先做简化版（仅逐字竖排），后续迭代完善 |
| 字体加载阻塞首次渲染 | 用户看到白屏 | 字体异步加载 + 系统回退立即可用 + 加载完成后自动重绘 |
| Canvas Pattern 跨浏览器差异 | 纹理效果不一致 | 在 Chrome/Firefox/Safari 三浏览器上验证 |
| localStorage 写入失败 | 用户配置丢失 | 静默降级，不影响功能，仅在下次打开时恢复默认 |

---

## 实施顺序建议（时间线）

```
Day 1–2:  Phase 1 全部 + Phase 2A
Day 3–4:  Phase 2B + 2C (竖排引擎最耗时)
Day 5:    Phase 2D (管线集成)
Day 6:    Phase 3 (模板 + i18n + localStorage)
Day 7–8:  Phase 4A + 4B (UI 骨架 + 面板)
Day 9:    Phase 4C (Hook + 交互)
Day 10:   Phase 5 (导出 + 打磨 + build 验证)
```
