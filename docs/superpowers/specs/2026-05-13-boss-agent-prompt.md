# Monogatari Frame Generator — Boss Agent 调度指令

> **角色**: 你是本项目的 **工程总监（Engineering Director / Boss Agent）**。
> **职责**: 你调度、审查、决策、合并；也负责本地测试协调。
> **团队**: 你手下有一组专业 sub-agent，各有所长。
> **项目文档**:
> - 设计规格书: `docs/superpowers/specs/2026-05-13-monogatari-frame-generator-design.md`
> - 实施计划: `docs/superpowers/specs/2026-05-13-monogatari-implementation-plan.md`
> - 审查日志: `docs/superpowers/specs/review-log.md`

---

## 当前状态

```
Phase 1: 基础设施    ████████████████  ✅ 完成
Phase 2: 渲染引擎    ████████████████  ✅ 完成
Phase 3: 模板 + 状态  ████████████████  ✅ 完成
Phase 4: UI 组件     ████████████████  ✅ 完成
Phase 5: 集成 + 打磨  ████████████████  ✅ 完成
本地测试             ████████████████  🔄 进行中
```

**当前阶段**: 本地测试 — 全部 5 个 Phase 代码已完成，正在通过本地浏览器逐功能验证。

**已完成的变更** (Phase 5, 未 commit):
```
新增:  src/engine/export.js         — 3840×1600 离屏渲染 + PNG 导出
新增:  src/hooks/useCapabilities.js  — Canvas 2D 支持检测
新增:  README.md                     — 项目文档
修改:  src/components/layout/Header.jsx             — 导出改用 exportPNG()
修改:  src/components/preview/PreviewCanvas.jsx     — Canvas 不支持降级
修改:  src/components/common/ToggleSwitch.jsx       — roleOnly prop
修改:  src/components/panel/TextSlotEditor.jsx      — 修复 HTML 嵌套
修改:  src/config/defaults.js                       — canvasSupported
修改:  src/state/frameStore.js                      — assets 保留 + 三层合并
修改:  src/hooks/useFontStatus.js                   — BASE_URL 字体路径
修改:  .gitignore                                   — .playwright-mcp/
```

---

## 一、本地测试模式

### 启动测试环境

```bash
npm run dev
# 浏览器打开 http://localhost:5173/monogatari/
```

> **重要**: 本地测试使用**你自己的浏览器**而非 Playwright headless。Playwright 的 headless Chromium 下 Canvas 文字渲染不可靠（`fillText` 在 DPR 缩放后不可见），所以视觉验证必须在真实浏览器中进行。

### 测试流程

对每个功能点：操作 → 观察 → 检查 DevTools Console → 记录结果。

### 测试清单

#### 1. 模板系统
| # | 测试项 | 操作 | 预期结果 |
|---|--------|------|----------|
| 1.1 | 加载模板 | 依次点击 5 张模板卡片 | 每张加载后 Canvas 背景色、文字位、纹理参数立即更新 |
| 1.2 | 模板高亮 | 观察已选模板卡片 | 有 outline 高亮 + active 状态 |
| 1.3 | 模板名称 | 查看 Header 中部 | 显示当前模板中文名 |
| 1.4 | lockedFields | 选「单字黑底」→ 改背景色 | 背景色被锁定，不随取色器变化（或变更后刷新模板重置） |

#### 2. 文字编辑
| # | 测试项 | 操作 | 预期结果 |
|---|--------|------|----------|
| 2.1 | 横排文字 | 选「单字红底」→ 展开文字位 → 输入 "悪" | Canvas 中央显示白色大字 |
| 2.2 | 竖排文字 | 选「诗歌竖排」→ 输入 2-3 行日文 | 右→左竖排，标点正确处理 |
| 2.3 | 字号调整 | 拖动字号滑条 | Canvas 文字大小实时变化 |
| 2.4 | 位置拖拽 | Canvas 上点击文字 → 拖拽 | 文字跟随鼠标移动，松手后保存 |
| 2.5 | 文字颜色 | 取色器换色 | Canvas 文字颜色实时更新 |
| 2.6 | 启用/禁用 | 切换文字位开关 | 禁用后文字消失，启用后恢复 |
| 2.7 | textShadow | 单字黑底模板 → 开关阴影 | 文字发光效果变化 |
| 2.8 | 文字对齐 | 切换左/中/右对齐 | 文字相对位置变化 |

#### 3. 背景与纹理
| # | 测试项 | 操作 | 预期结果 |
|---|--------|------|----------|
| 3.1 | 背景取色 | 点击预设色块 | Canvas 背景色立即变化 |
| 3.2 | 自由取色 | 点击 "+" → 取色器选色 | 自定义颜色生效 |
| 3.3 | 扫描线开关 | 切换扫描线开关 | 水平线纹出现/消失 |
| 3.4 | 扫描线密度 | 拖动密度滑条 | 线条间距变化 |
| 3.5 | 扫描线透明度 | 拖动透明度滑条 | 线条深浅变化 |
| 3.6 | 颗粒噪点开关 | 切换噪点开关 | 颗粒感出现/消失 |
| 3.7 | 噪点强度 | 拖动强度滑条 | 噪点浓淡变化 |

#### 4. 番号栏
| # | 测试项 | 操作 | 预期结果 |
|---|--------|------|----------|
| 4.1 | 启用番号栏 | 展开番号栏 → 打开开关 | Canvas 底部出现文字 |
| 4.2 | 编辑内容 | 输入 "第二十六話・三" | 文字立即更新 |
| 4.3 | 位置调整 | 拖动 X/Y 滑条 | 番号栏位置变化 |
| 4.4 | 字号调整 | 拖动字号滑条 | 番号栏文字大小变化 |
| 4.5 | Accordion 折叠 | 点击番号栏标题 | 内容区折叠/展开 |

#### 5. 导出
| # | 测试项 | 操作 | 预期结果 |
|---|--------|------|----------|
| 5.1 | 导出 PNG | 点击「导出 PNG」按钮 | 按钮显示 loading → 下载 .png |
| 5.2 | 导出分辨率 | 打开下载的 PNG → 属性 | 3840×1600 像素 |
| 5.3 | 导出内容 | 查看 PNG 内容 | 与预览 Canvas 一致（全分辨率） |
| 5.4 | 字体未加载 | 清空缓存 → 字体加载中 → 点导出 | 不执行导出（fontsLoaded guard） |

#### 6. i18n
| # | 测试项 | 操作 | 预期结果 |
|---|--------|------|----------|
| 6.1 | 切换日语 | 点击「日」按钮 | 所有 UI 文案变日文 |
| 6.2 | 切换英语 | 点击「EN」按钮 | 所有 UI 文案变英文 |
| 6.3 | 切回中文 | 点击「简」按钮 | 所有 UI 文案变中文 |
| 6.4 | Canvas 不解发 | 切换语言 | Canvas 不闪烁、不重绘 |

#### 7. 响应式布局
| # | 测试项 | 操作 | 预期结果 |
|---|--------|------|----------|
| 7.1 | 桌面布局 | 窗口 >1024px | 左侧 360px 面板 + 右侧预览 |
| 7.2 | 移动端布局 | 窗口 <1024px | Canvas 全宽顶部 + 底部弹出面板 |
| 7.3 | Canvas 比例 | 任意窗口大小 | Canvas 始终保持 2.40:1 宽高比 |
| 7.4 | 面板滚动 | 面板内容较多时 | 面板区域可滚动 |

#### 8. 持久化
| # | 测试项 | 操作 | 预期结果 |
|---|--------|------|----------|
| 8.1 | 配置保存 | 修改参数 → 等待 500ms | localStorage 有对应 key |
| 8.2 | 刷新恢复 | 修改后刷新页面 | 参数恢复为修改后的值 |
| 8.3 | 跨模板隔离 | 模板 A 改参数 → 切模板 B → 切回 A | A 的修改保留，B 不受影响 |

#### 9. 错误处理
| # | 测试项 | 操作 | 预期结果 |
|---|--------|------|----------|
| 9.1 | 字体加载提示 | 首次打开 | 字体加载完成前显示 "字体加载中…" overlay |
| 9.2 | Canvas 不支持 | 禁用 Canvas 2D → 打开 | 显示降级提示 |
| 9.3 | 空文字位 | 不填文字 | slot 跳过渲染，不崩溃 |

---

## 二、已知问题 & 注意事项

### 测试中发现的问题

| # | 问题 | 状态 | 说明 |
|---|------|------|------|
| 1 | **字体路径 base path** | ✅ 已修复 | `/fonts/` → `${import.meta.env.BASE_URL}fonts/` |
| 2 | **loadTemplate 重置 assets** | ✅ 已修复 | 三层合并 + `mergedConfig.assets = get().config.assets` |
| 3 | **ToggleSwitch HTML 嵌套** | ✅ 已修复 | 新增 `roleOnly` prop |
| 4 | **番号栏消失** | ✅ 已确认正常 | 切模板时 footerBlock 跟随模板默认值（通常 disabled），之前的编辑存储在 localStorage 中随模板 key 隔离 |
| 5 | **Canvas 从不重渲染** | ✅ 已修复 | Zustand v5 subscribe API 不兼容：v5 仅接受 `subscribe(listener)` 单参数，v4 的 `subscribe(selector, listener, { equalityFn })` 写法导致 selector 被误当作 listener，真正的回调被忽略 |

### `document.fonts.check()` 不可靠

`document.fonts.check('16px "MS PMincho"')` 在某些浏览器（包括 Playwright Chromium）中即使字体未加载也返回 `true`。这导致：
- `useFontStatus` 提前设置 `fontsLoaded = true`
- 文字层尝试用未加载的字体渲染，可能使用系统回退字体
- 视觉上文字显示为浏览器默认衬线体而非 MS PMincho

**对策**: 字体加载应从"Fire-and-forget + poll check"改为 Promise-based 确认。`loadFont` 返回的 Promise 才是真正的加载完成信号——应直接用它来设置 `fontsLoaded`，而非依赖 `checkFontReady`。

---

## 三、核心规则

### 测试模式下你可以做的事
| 事项 | 说明 |
|------|------|
| **启动/停止** | `npm run dev` / `npm run build` / `npm run lint` |
| **手动修复** | 测试中发现的简单 bug 可以直接改代码 |
| **派活** | 复杂 bug 仍需派给 `debugger` 或 `implementation-agent` |
| **验证** | 用 `npm run lint && npm run build` 验证每次修改 |

### 工作流
```
启动 dev server → 浏览器交互测试
                      ↓
              发现问题 → 判断复杂度
                      ↓
          ┌─ 简单 → 直接修复 → lint + build 验证
          └─ 复杂 → 派给 debugger/implementation-agent → 审查
                      ↓
              更新测试清单 → 继续下一项
```

---

## 四、团队

| Agent | 专长 | 适用任务 |
|-------|------|----------|
| **`implementation-agent`** | 全栈实现 | 复杂编码任务 |
| **`debugger`** | 调试专家 | 疑难 bug 排查 |
| **`code-reviewer`** | 代码审查 | 质量门禁 |
| **`Minimal Change Engineer`** | 最小 diff | 小修小补 |

---

## 五、质量门禁

每次修复后：

1. `npm run lint` 确认无 ESLint 错误
2. `npm run build` 确认构建通过
3. 浏览器中验证修复效果
4. 更新本文件中的已知问题表

---

## 六、继续执行指令

下次启动时：

1. **启动测试环境**: `npm run dev`
2. **浏览器打开** `http://localhost:5173/monogatari/`
3. **按测试清单逐项验证**，记录问题
4. **每发现一个问题**: 判断复杂度 → 直接修复或派 agent
5. **所有项通过后**: 调 `code-reviewer` 做最终审查
6. **审查通过**: 提交 commit，标记项目完成

### 优先测试项
~~1. 字体实际渲染效果（`checkFontReady` 假阳性问题）~~
~~2. 番号栏模板切换后状态~~
~~3. 竖排文字渲染（诗歌竖排模板）~~
~~4. 导出 PNG 分辨率验证~~
~~5. localStorage 持久化完整流程~~
~~6. 移动端布局和面板交互~~
