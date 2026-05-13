# Monogatari Frame Generator — 审查日志

## Phase 1: 基础设施 — 2026-05-13

### 审查结果: 通过（4 个问题已修复）

### 涉及文件
- `src/state/frameStore.js` — Zustand store (新增)
- `src/engine/internalState.js` — 资源池工厂 (新增)
- `src/utils/coordinates.js` — 坐标转换 (新增)
- `src/engine/assetsManager.js` — 字体加载 (新增)
- `src/config/defaults.js` — 默认配置 (新增)
- `src/App.jsx` — 清理 (修改)
- `src/App.css` — 清理 (修改)
- `src/index.css` — 清理 (修改)
- `public/fonts/MS-PMincho-2.ttf` — 字体静态资源 (新增)

### 发现 & 修复

| # | 严重度 | 问题 | 修复 |
|---|--------|------|------|
| 1 | CRITICAL | `setConfig` 对不存在的路径崩溃 | 添加 null/object 防护 + console.warn |
| 2 | CRITICAL | `loadFont` CSS 注入风险 | 添加 SAFE_PATH_RE 白名单验证 |
| 3 | WARNING | `index.css` 残留模板规则 | 删除 h1/h2/p/code/.counter 死代码 |
| 4 | WARNING | 字体路径生产环境 404 | 字体移至 `public/fonts/`，路径改为 `/fonts/...` |

### 规格书一致性检查

| 要求 | 状态 |
|------|------|
| `setConfig(path, value)` 点分隔路径更新 | PASS |
| 坐标公式 `P_pixel = P_ratio × baseDimension × globalScale` | PASS |
| `internalState` 工厂函数（非单例） | PASS |
| 字体加载失败不抛异常 | PASS |
| `defaults.js` 与 frameStore initialConfig 一致 | PASS |
| Zustand 不可变更新 | PASS |

### 构建状态
- `npm run build`: PASS
- ESLint: PASS

### 就绪进入 Phase 2

---

## Phase 2: 渲染引擎 — 2026-05-13

### 审查结果: ✅ 通过（9 个问题已修复）

### 涉及文件
- `src/engine/renderer.js` — 主管线 + footer 渲染 (新增)
- `src/engine/layers/background.js` — 背景色填充 (新增)
- `src/engine/layers/scanlines.js` — 扫描线纹理 (新增)
- `src/engine/layers/grain.js` — 颗粒噪点 (新增)
- `src/engine/layers/text.js` — 横排/竖排文字 + drawTextSlots (新增)
- `src/engine/layout/verticalText.js` — 竖排布局引擎 (新增)
- `src/engine/cache.js` — 离屏缓存 (新增)
- `src/state/frameStore.js` — (已在 Phase 1 审查)
- `src/config/defaults.js` — (已在 Phase 1 审查)

### 修复记录 (2026-05-13)

| # | 严重度 | 问题 | 修复 |
|---|--------|------|------|
| C1 | CRITICAL | `SAFE_PATH_RE` 允许 `../` 路径遍历 | 添加 `(?!.*\.\.)` 负向前瞻拒绝 `..` 序列 |
| C2 | CRITICAL | canvas 0×0 静默不渲染 | 添加 `width < 1 \|\| height < 1` guard + console.warn |
| W1 | WARNING | 注释写 0.25，代码用 0.5 | 统一为 0.5 |
| W2 | WARNING | drawVerticalText 逐字重复设置 font/fillStyle/shadow/stroke | 提到循环外，循环内仅保留 translate/rotate/offset |
| W3 | WARNING | buildItems Step 3 死代码 | 删除不可达的 Latin 合并分支 |
| W4 | WARNING | recalcPositions + applyKinsoku 未使用的 canvasHeight/margin 参数 | 从函数签名+JSDoc+调用处移除 |
| W5 | WARNING | lineHeight=0 导致 columnWidth=0, maxColumns=Infinity | 添加 `Math.max(lineHeight, 0.5)` 下限 |
| W6 | WARNING | Config 在 frameStore + defaults 重复定义 | frameStore 改为 `import { DEFAULT_FRAME_CONFIG }` |
| W7 | WARNING | setConfig 无条件设 backgroundOrTexture=true | 仅 `backgroundColor` / `texture` 路径设脏标记 |
| E1 | ESLINT | unused vars canvasHeight, margin | 随 W4 一并移除 |
| E2 | ESLINT | useless assignment to totalColumns | 删除死赋值 |

### 规格书一致性检查

| 要求 | 状态 |
|------|------|
| 渲染管线顺序: bg → texture → text → footer | PASS |
| DPR 适配 | PASS |
| 脏检查 backgroundOrTexture | PASS |
| 竖排: grapheme 分割 (Intl.Segmenter + 回退) | PASS |
| 竖排: 标点旋转/平移 | PASS |
| 竖排: 纵中横 | PASS |
| 竖排: 避头尾 (回溯上限 2) | PASS |
| 竖排: 列右→左排列 | PASS |
| 横排: textShadow + letterSpacing | PASS |
| cache 集成 | PASS |

### 构建状态
- `npm run build`: PASS
- `npm run lint`: PASS (0 errors)

### 就绪进入 Phase 3

---

## Phase 3: 模板系统 + i18n + 持久化 — 2026-05-13

### 审查结果: ✅ 通过（1 CRITICAL + 3 WARNING 已修复）

### 涉及文件
- `src/templates/index.js` — 模板注册表 (新增)
- `src/templates/single-char-black.js` — 模板 1 (新增)
- `src/templates/single-char-red.js` — 模板 2 (新增)
- `src/templates/double-line-red.js` — 模板 3 (新增)
- `src/templates/poetry-vertical.js` — 模板 4 (新增)
- `src/templates/vertical-white.js` — 模板 5 (新增)
- `src/i18n/index.js` — i18n 主模块: t() + setLang() + getLang() (新增)
- `src/i18n/zh-CN.js` — 简体中文 68 keys (新增)
- `src/i18n/ja.js` — 日本語 68 keys (新增)
- `src/i18n/en.js` — English 68 keys (新增)
- `src/state/frameStore.js` — 模板 actions + localStorage 持久化 (修改)
- `src/config/defaults.js` — (未修改)

### 初始审查发现 (code-reviewer)

| # | 严重度 | 问题 | 修复 |
|---|--------|------|------|
| C1 | CRITICAL | `SAVED_FOOTER_FIELDS` 缺少 `fontFamily`, `fontWeight`, `zIndex` → 用户调整 footer 字体/z-index 后刷新页面丢失 | 添加 3 个缺失字段 |
| W1 | WARNING | i18n `currentLang` 与 store `lang` 双源不同步 | store 导入 `getLang()` 初始化，`setLang` 同步调用 `setI18nLang()` |
| W2 | WARNING | `applyLockedFields` 在 `convertTemplateSlots` 前执行 → 未来 textSlot 级锁字段会被覆盖 | 调换执行顺序 |
| W3 | WARNING | `deepMerge` 将 `null` override 视为权威值替换对象 | 添加 `if (override === null) return base` 守卫 |
| I1 | INFO | `deepMerge` 对 textSlots 的合并工作被 `convertTemplateSlots` 立即覆盖（浪费） | MVP 接受，后续优化 |
| I2 | INFO | `extractOverrides` 保存完整值而非 diff → 模板默认值升级后用户旧覆盖会阻止新默认 | 版本号机制覆盖大变更；小调整接受 |
| I3 | INFO | `setNested` 自动创建不存在的中间对象 → 拼写错误的 lockedField 静默失效 | 低风险，当前 lockedFields 只有 `['backgroundColor']` |
| I4 | INFO | i18n localStorage key `'lang'` 未加命名空间前缀 | 单用途应用，不影响功能 |
| I5 | INFO | `defaults.js` footerBlock 的 `fontFamily: 'sans-serif'` 未被任何模板使用 | 不一致但无影响 |

### 规格书一致性检查

| 要求 | 状态 |
|------|------|
| 5 个模板符合 `Template` 接口 (id/name/nameJa/nameEn/category/baseConfig/lockedFields) | PASS |
| `TemplateTextSlot` 含 `label` + `placeholder`，不含 `content` | PASS |
| `loadTemplate()`: localStorage 检测 → 深度合并 → lockedFields 强制 → 格式转换 | PASS |
| `saveConfig()`: 提取 overrides → `{ version: 1, overrides }` → localStorage | PASS |
| `resetToTemplate()`: 清除 localStorage → 重新加载模板默认值 | PASS |
| 持久化 key 格式 `monogatari:template:{id}:config` | PASS |
| 跨模板隔离：模板 A 配置不污染模板 B | PASS |
| localStorage 满/不可用时静默降级 | PASS |
| 版本迁移：version 不匹配时丢弃旧 overrides | PASS |
| i18n `t(key)`: currentLang → zh-CN fallback → raw key | PASS |
| `setLang()`: 语言切换 + localStorage 持久化 | PASS |
| 语言检测: localStorage → navigator.language → zh-CN | PASS |
| 68 个翻译 key 三语齐全且一致 | PASS |
| store `lang` 与 i18n 同步（初始化 + 切换双向） | PASS |

### 构建状态
- `npm run build`: PASS (16 modules)
- `npm run lint`: PASS (0 errors)

### 就绪进入 Phase 4

---

## Phase 4: UI 组件 — 2026-05-13

### 审查结果: ✅ 通过（4 CRITICAL + 7 WARNING 已修复）

### 涉及文件

**新增文件 (14)**:
- `src/components/layout/AppShell.jsx` — 响应式两栏布局
- `src/components/layout/Header.jsx` — 顶栏：标题 + 模板名 + 语言切换 + 导出
- `src/components/preview/PreviewCanvas.jsx` — HDPI Canvas + 点击命中检测 + 拖拽交互
- `src/components/common/SliderInput.jsx` — 通用滑条 + onAfterChange 防抖
- `src/components/common/ColorPicker.jsx` — 预设色板 + 自由取色
- `src/components/common/ToggleSwitch.jsx` — 通用开关组件
- `src/components/panel/ControlPanel.jsx` — 面板容器 + 移动端底部弹出
- `src/components/panel/TemplateSelector.jsx` — 5 张模板卡片网格
- `src/components/panel/BackgroundPicker.jsx` — 背景色选择
- `src/components/panel/TextureControls.jsx` — 扫描线 + 颗粒控制
- `src/components/panel/TextSlotEditor.jsx` — 文字位 Accordion 编辑器
- `src/components/panel/FooterBlockEditor.jsx` — 番号栏 Accordion 编辑器
- `src/hooks/useCanvasRenderer.js` — 核心渲染调度：store 订阅 → RAF 批处理 → render()
- `src/hooks/useFontStatus.js` — 字体加载 + Intl.Segmenter 能力检测

**修改文件 (4)**:
- `src/App.jsx` — 替换占位为完整 AppShell 组合
- `src/App.css` — ~750 行深色主题样式
- `src/index.css` — 精简 reset
- `src/state/frameStore.js` — 新增 `canvasRef` + `setCanvasRef`
- `src/config/defaults.js` — footerBlock.fontSize 从 60px 改为 0.015 ratio
- `src/i18n/zh-CN.js` / `ja.js` / `en.js` — 新增 `panel.showControls` / `panel.hideControls`

### 初始审查发现 (code-reviewer)

| # | 严重度 | 问题 | 修复 |
|---|--------|------|------|
| C1 | CRITICAL | AppShell mobile toggle 是 console.log 空壳 | 移除无功能按钮，ControlPanel 独立处理移动端 |
| C2 | CRITICAL | Export PNG 按钮是 console.log 空壳 | 实现完整导出：canvas.toBlob → download link + loading 状态 |
| C3 | CRITICAL | 5 个组件调用 t() 但未订阅 store.lang → 语言切换后文本不更新 | 全部添加 `useFrameStore(s => s.lang)` 订阅 |
| C4 | CRITICAL | BackgroundPicker + TextureControls 未持久化到 localStorage | 添加 500ms debounced saveConfig |
| W1 | WARNING | hitVerticalSlot 每次 pointermove 调用 computeVerticalLayout | 添加 module-level 缓存，相同参数复用布局结果 |
| W2 | WARNING | hitHorizontalSlot 用 content.length 估算宽度，非 CJK 不准 | 改用 ctx.measureText() + actualBoundingBoxAscent/Descent |
| W3 | WARNING | dirtyFlags.backgroundOrTexture 从未重置 → 每帧重建缓存 | render() 后调用 setDirty('backgroundOrTexture', false) |
| W4 | WARNING | ControlPanel mobile toggle 文案硬编码英文 | 添加 i18n key 并使用 t() |
| W5 | WARNING | FooterBlockEditor fontSize 滑条 max=0.1 与默认值 60 冲突 | 统一为 ratio：默认 0.015，滑条 0.005-0.05 |
| W6 | WARNING | hitHorizontalSlot 未考虑 textBaseline 不准确 | 随 W2 一并修复，使用 metrics.actualBoundingBoxAscent |
| W7 | WARNING | PreviewCanvas 和 renderer 双重设置 canvas 尺寸 | PreviewCanvas 仅设 style 尺寸，renderer 管理 backing store |
| I1 | INFO | ToggleSwitch 在 TextureControls + TextSlotEditor 重复定义 | 提取为 `src/components/common/ToggleSwitch.jsx` |

### 规格书一致性检查

| 要求 | 状态 |
|------|------|
| §9.1 桌面端两栏布局 (360px 侧栏 + 预览区) | PASS |
| §9.2 移动端 (<1024px) 底部弹出面板 | PASS |
| §9.3 深色模式 + 棋盘格背景 | PASS |
| §9.4 Canvas 点击命中检测 (横排 bounding box + 竖排逐字) | PASS |
| §9.4 Canvas 拖拽更新 position | PASS |
| §9.4 纹理滑条 onAfterChange 防抖 | PASS |
| §9.4 TextSlotEditor Accordion 折叠 + 摘要显示 | PASS |
| §9.4 番号栏独立 Accordion | PASS |
| §8.2 语言检测: localStorage → navigator → zh-CN | PASS |
| §8.3 语言切换仅触发 React re-render，不解发 Canvas 重绘 | PASS |
| 模板选择 → loadTemplate → 深度合并 → 渲染 | PASS |
| 面板参数变更 → store → useCanvasRenderer → Canvas 实时预览 | PASS |
| 导出 PNG 按钮 → loading → toBlob → download | PASS |
| 字体未加载时跳过文字层 + 显示加载提示 | PASS |
| localStorage 错误静默降级 | PASS |
| 竖排 hit-test 缓存避免重复计算 | PASS |
| HDPI canvas 尺寸由 renderer 统一管理 | PASS |

### 构建状态
- `npm run build`: PASS (57 modules, 235KB JS, 16KB CSS)
- `npm run lint`: PASS (0 errors, 0 warnings)

### 就绪进入 Phase 5
