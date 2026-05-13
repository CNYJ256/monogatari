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
