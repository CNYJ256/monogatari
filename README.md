# Monogatari Frame Generator

纯前端的物语系列风格闪帧文字卡生成器。所有编辑、预览、导出操作均在浏览器端完成，无需后端服务。

在线使用: [https://cnyj256.github.io/monogatari/](https://cnyj256.github.io/monogatari/)

## 为什么会存在

物语系列动画中大量使用的闪帧文字卡（黑底/红底大字、竖排诗句、双行字幕等）具有独特的视觉辨识度。手动制作这类文字卡需要反复调整字体、字号、间距和纹理，本工具将其简化为：选择模板，填入文字，导出 PNG。


## 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | React 19 + Zustand 5 |
| 构建 | Vite 8 |
| 渲染 | Canvas 2D API |
| 排版 | Intl.Segmenter |
| 字体 | MS PMincho|
| 部署 | GitHub Pages，base path 为 `/monogatari/` |

## 快速开始

```bash
npm install       # 安装依赖
npm run dev       # 启动开发服务器
npm run build     # 生产构建（输出到 dist/）
npm run preview   # 本地预览生产构建
```

## 项目结构

```
src/
├── main.jsx                # 应用入口
├── App.jsx / App.css       # 根组件与样式
├── index.css               # 全局样式 / CSS 变量
├── config/defaults.js      # 各模板默认参数
├── state/frameStore.js     # Zustand 全局状态（模板切换、参数更新、持久化）
├── engine/                 # Canvas 渲染引擎（无 DOM 依赖）
│   ├── renderer.js         # 渲染主管线：依序调度各图层
│   ├── export.js           # 3840x1600 离屏渲染与 PNG 导出
│   ├── cache.js            # 离屏 Canvas 缓存，避免逐帧重绘
│   ├── internalState.js    # Canvas 资源池（渐变、图案等）
│   ├── assetsManager.js    # 字体加载与注册
│   ├── layers/             # 各渲染层实现（背景、纹理、噪点、文字、番号栏）
│   └── layout/verticalText.js  # 竖排布局引擎（字素分割、标点处理、纵中横、避头尾）
├── components/             # React UI 组件（控制面板、Canvas 面板、模板选择器等）
├── hooks/                  # 自定义 Hooks（Canvas 交互、响应式断点、i18n）
├── templates/              # 5 个内置模板定义（id、名称、默认参数）
├── i18n/                   # 三语翻译文件（zh-CN / ja / en）
└── utils/coordinates.js    # 逻辑坐标与 Canvas 像素坐标转换
```


## 许可

MIT
