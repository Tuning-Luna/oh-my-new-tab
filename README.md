# oh-my-new-tab

一个 Chrome 新标签页替换扩展（Manifest V3）。垂直居中展示当前时间、日期、一句随机短语和一条随机名言，背景为模糊处理后的本地图片。

## 安装

1. 打开 `chrome://extensions/`
2. 右上角开启 **开发者模式**
3. 点击 **加载已解压的扩展程序**，选择本目录
4. 新建标签页即可看到效果

## 文件结构

```
oh-my-new-tab/
├── manifest.json        MV3 清单，通过 chrome_url_overrides.newtab 注册新标签页
├── index.html           页面结构
├── styles.css           样式与全部可调参数（见文件顶部 :root 块）
├── js/
│   ├── main.js          启动入口，装配 DOM
│   ├── time.js          时钟与日期
│   └── content.js       随机短语与随机名言
├── data/
│   ├── phrases.json     短语，字符串数组
│   └── quotes.json      名言，{ content, author } 数组
└── assets/
    ├── JSA.png          背景图
    └── favicon.svg      标签页图标
```

> 页面文件名由 `manifest.json` 的 `chrome_url_overrides.newtab` 指定，扩展不做目录索引，因此文件名本身是自由的，`index.html` 只是约定。

## 自定义

### 修改短语

编辑 `data/phrases.json`，它是一个字符串数组。**数组里每一条都必须以 `TuningLuna` 结尾**（这是约定，由数据保证，代码不会自动追加）。每次打开新标签页随机取一条。

### 修改名言

编辑 `data/quotes.json`。每项只需要 `content` 和 `author` 两个字段，`author` 建议连书名一起写，例如 `"李白《将进酒》"`。渲染时会自动在前面加 `—— `。

### 更换标签页图标

替换 `assets/favicon.svg`，或在 `index.html` 中修改 `<link rel="icon">` 的 `href`。当前图标是 1024×1024 的方形图标，PNG 与 SVG 都可用；写 `type="image/svg+xml"` 时需确保文件确为 SVG。

### 调整模糊程度

编辑 `styles.css` 顶部的 `--bg-blur`：

```css
:root {
  --bg-blur: 16px;   /* 改为 0px 即完全关闭模糊 */
}
```

### 调整背景明暗

`--bg-scrim` 控制压在图片上的暗色遮罩。当前背景图是黑白高对比剧照、亮部很亮，不加遮罩时白色文字在上半部分会看不清，所以默认给了一层 38% 的黑色：

```css
:root {
  --bg-scrim: rgba(0, 0, 0, 0.38);   /* 改为 transparent 即移除遮罩 */
}
```

### 更换背景图

替换 `assets/JSA.png`，或改 `styles.css` 中 `.bg` 的 `url()`。图片是照片级内容，若在意体积可考虑换成 WebP——见下方「体积」一节。

## 体积

背景图已做过无损压缩：**1619KB → 1189KB（-26.6%）**。

压缩只改动了底行 2048 个**完全透明**（alpha=0）像素的 RGB 值，它们不参与渲染；265 万个可见像素逐字节完全一致。

如果还想更小，这张图在 `--bg-blur` 模糊下细节本就不可见，换格式收益极大（实测数据）：

| 方案 | 体积 | 相对原图 |
| --- | --- | --- |
| PNG 无损（当前） | 1189KB | -26.6% |
| PNG 调色板 q80（有损） | 491KB | -69.7% |
| JPEG q85 | 188KB | -88.4% |
| **WebP q80** | **86KB** | **-94.7%** |

扩展只跑在 Chrome 上，WebP 支持没有任何顾虑。若要换，把图片转成 `assets/JSA.webp` 并同步修改 `styles.css` 里的 `url()`。

## 本地预览

用 `vite`（或任意静态服务器）打开本目录可以快速看样式：

```bash
vite
```

但**这不是扩展环境**，`chrome.*` API 一个都没有。页面因此做了两处兼容：

- 资源加载会回退到相对路径（见下方设计说明），所以短语和名言仍能正常显示；
- favicon 由浏览器按普通 `<link rel="icon">` 处理，与扩展环境下是否显示是两回事。

**只有 Load Unpacked 后的 `chrome://newtab` 才是真实环境。** 扩展相关的行为（尤其是标签页图标是否显示）必须在那里确认。

## 已知限制

- **隐身窗口不生效。** 这是 Chrome 的硬性限制——扩展无法在隐身窗口覆盖新标签页，与本扩展的实现无关。
- **一个扩展只能覆盖一个内置页面。** `chrome_url_overrides` 在 `newtab` / `bookmarks` / `history` 中只能选一个。
- **新标签页打开时焦点在地址栏**，这是浏览器行为，页面无法抢占。

## 设计说明

- **`data/*.json` 在扩展内通过 `chrome.runtime.getURL(...)` 读取，不需要 `web_accessible_resources`。** 官方文档明确：*"Only pages or scripts loaded from an extension's origin can access that extension's resources."* `web_accessible_resources` 只管「让**其他**源访问」，本页与资源同源，不在其管辖范围。页面本身就从扩展根目录提供服务，所以 `data/phrases.json` 这样的相对路径解析出的 URL 与 `getURL()` 完全一致；`resolveResource()` 在 `getURL` 不存在时回退到相对路径，两种环境下都能工作。
- **不需要 `host_permissions`。** 官方文档：*"Without requesting additional privileges, the extension can call `fetch()` to get resources within its installation."*
- **不需要任何 `permissions` 字段。** 除 `chrome.runtime.getURL` 外未使用任何扩展 API，而它无需声明权限。
- **没有内联脚本。** MV3 默认 CSP 为 `script-src 'self'; object-src 'self';`，内联 JS 会被拒绝，因此所有脚本都放在独立 `.js` 文件中。该默认 CSP 未限制 `connect-src`，同源 fetch 不受影响。
- **时间用 `getHours()` 手工补零，不用 `toLocaleTimeString()`。** 后者依赖 ICU 数据，且 `hourCycle: "h24"` 会把午夜渲染成 `24:00:00`。手工补零是确定性的，任何机器上都一致。
- **日期固定 `en-US`。** `Intl.DateTimeFormat` 显式指定 locale，输出恒为英文，不受浏览器界面语言影响。
- **所有文本用 `textContent` 写入，不用 `innerHTML`。** JSON 里的内容即使含标签也只会当纯文本显示。
- **时钟每秒对齐秒边界重排定时器**，不会累积漂移；从后台标签页切回时会立即重绘（Chrome 会限制后台标签页的定时器频率）。
- **当前为只读展示，未使用 `chrome.storage`。** 若将来要支持用户自定义数据：小型偏好（如模糊值、开关）用 `chrome.storage.sync`（约 100KB，单键 8KB），较大缓存用 `chrome.storage.local`（约 10MB）。

## 验证情况

- `data/*.json` 与 `manifest.json` 均可被 `JSON.parse` 解析；24 条短语全部以 `TuningLuna` 结尾且全为 ASCII；20 条名言全部含 `content` 与 `author`。
- `formatTime` / `formatDate` 通过边界用例测试：午夜为 `00:00:00`（非 `24:00:00`）、`23:59:59` 上界、13 点保持 `13` 不塌回 `01`。
- `content.js` 的随机与渲染逻辑经打桩集成测试：400 次抽取全部以 `TuningLuna` 结尾、20 条名言往返一致、JSON 404 时不抛异常且不污染 DOM。
- 背景图压缩后经逐像素比对，可见像素完全一致。
- 页面在 headless Chrome 中实拍渲染通过（背景、模糊、居中、四项内容均正确）。

未做浏览器内的端到端验证——需在 `chrome://extensions/` 实际加载后才能确认渲染效果。
