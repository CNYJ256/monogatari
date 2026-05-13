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

### 审查结果: 需修复（2 CRITICAL + 7 WARNING + 3 ESLint）

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

### 待修复问题

#### CRITICAL

| # | 文件 | 问题 | 修复方向 |
|---|------|------|----------|
| C1 | assetsManager.js:1 | `SAFE_PATH_RE` 允许 `../` 路径遍历 | 收紧正则，拒绝 `..` 序列 |
| C2 | renderer.js:33-37 | canvas 0×0 时静默不渲染 | 添加最小尺寸 guard + console.warn |

#### WARNING

| # | 文件 | 问题 | 修复方向 |
|---|------|------|----------|
| W1 | text.js:25/35 | 注释写 0.25，代码用 0.5 | 统一为 0.5 |
| W2 | text.js:167-221 | drawVerticalText 逐字重复设置 font/fillStyle | 提到循环外 |
| W3 | verticalText.js:141-158 | buildItems Step 3 死代码 (Latin 已合并不触发) | 删除死代码 |
| W4 | verticalText.js:246 | recalcPositions 未使用的 canvasHeight/margin 参数 | 移除多余参数 (ESLint) |
| W5 | verticalText.js:396 | lineHeight=0 导致 columnWidth=0, maxColumns=Infinity | 添加 Math.max(lineHeight, 0.5) |
| W6 | frameStore.js + defaults.js | Config 在两处重复定义 | frameStore 从 defaults 导入 |
| W7 | frameStore.js:59 | setConfig 无条件设 backgroundOrTexture=true | 仅 bg/texture 相关路径设 dirty |

#### ESLint (3 errors)
- `verticalText.js:246` — unused vars `canvasHeight`, `margin`
- `verticalText.js:437` — useless assignment to `totalColumns`

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
- `npm run lint`: **FAIL** (3 errors in verticalText.js)

### 下次行动
修复上述 9 个问题后进入 Phase 3
