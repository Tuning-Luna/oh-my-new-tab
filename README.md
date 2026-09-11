# oh-my-new-tab

一个 Chrome 新标签页替换扩展（Manifest V3）。按视口高度分三层展示：时间与日期在上、一句随机短语居于屏幕正中、一条随机名言落在短语与屏幕底部之间，背景为模糊处理后的本地图片。

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
│   ├── content.js       随机短语与随机名言
│   └── fit.js           短语单行自适应
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

编辑 `data/quotes.json`。每项只需要 `content` 和 `author` 两个字段，`author` 建议连书名一起写，例如 `"李白《将进酒》"`。渲染时 `author` 会被原样输出在 `content` 的下一行，不加任何前缀——想加破折号之类的符号，直接写进 `author` 字段即可。

### 更换标签页图标

替换 `assets/favicon.svg`，或在 `index.html` 中修改 `<link rel="icon">` 的 `href`。当前图标是 1024×1024 的方形图标，PNG 与 SVG 都可用；写 `type="image/svg+xml"` 时需确保文件确为 SVG。

### 调整模糊程度

编辑 `styles.css` 顶部的 `--bg-blur`：

```css
:root {
  --bg-blur: 10px;   /* 改为 0px 即完全关闭模糊 */
}
```

### 调整背景明暗

`--bg-scrim` 控制压在图片上的暗色遮罩。当前背景图是黑白高对比剧照、亮部很亮，不加遮罩时白色文字在上半部分会看不清，所以默认给了一层 38% 的黑色：

```css
:root {
  --bg-scrim: rgba(0, 0, 0, 0.38);   /* 改为 transparent 即移除遮罩 */
}
```

### 调整位置

三个模块各自独立定位，`top` 描述的是**该模块中心**的位置（因为配了 `translate(-50%, -50%)`），取值是视口高度的百分比：

```css
:root {
  --head-y: 25%;     /* 时间 + 日期 */
  --phrase-y: 50%;   /* 短语 —— 屏幕正中 */
  --quote-y: 75%;    /* 名言 —— 短语与屏幕底部的中间 */
}
```

`.stage` 有一个 `min-height: max(100vh, 40rem)` 的下限：窗口过矮时页面改为滚动，避免三个模块叠在一起。副作用是这种情况下短语会低于屏幕正中。

### 调整字体

```css
:root {
  --font-clock: "Segoe UI Variable Display", "Segoe UI", system-ui, ...;
  --font-ui:    system-ui, ...;                         /* 短语 */
  --font-quote: "Microsoft YaHei", "PingFang SC", ...;  /* 名言 */
}
```

**换 `--font-clock` 前请先验证该字体支持 `tnum` 特性。** 时钟用了 `font-variant-numeric: tabular-nums` 来保证数字等宽，缺这个特性的字体会让 `tabular-nums` **静默失效**，时钟宽度随时间每秒变化。实测本机 Corbel / Candara / Georgia / Franklin Gothic 都不支持，Segoe UI 支持。

**`--font-quote` 必须选含中文字形的字体。** 把 Georgia、Constantia、Sitka 这类纯西文衬线放在前面，中文不会报错，而是被**静默回退**成另一个字体，观感与预期不符。

引文目前用**系统字体**，不随扩展打包：Windows 落到微软雅黑，macOS 落到苹方。代价是**跨机器观感可能不一致**——若要求任何机器上都完全一样，需要把字体文件打包进 `assets/` 并用 `@font-face` 引入（此前用过这个方案，见 git 历史 `e864601`）。

### 短语为什么总是一行

短语设了 `white-space: nowrap`，由 `js/fit.js` 在渲染后量一次宽度、按比例缩字号，保证任何长度的短语都停在一行内。宽度与字号成正比，所以**一次测量就能算出精确值**，不需要循环试探。

因此 `.slot--phrase` 里的 `clamp()` 只是**上限**：短句按上限显示，长句自动缩小。缩到 `fit.js` 里的 `MIN_SIZE`（16px）仍放不下才会溢出——按现有数据长度不会触及（最长 46 字符，会缩到约 74px）。

### 更换背景图

替换 `assets/JSA.png`，或改 `styles.css` 中 `.bg` 的 `url()`。图片是照片级内容，若在意体积可考虑换成 WebP——见下方「体积」一节。

## 体积

扩展包只有背景图 **1.2MB** 一项主要资源。

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
- **三个模块是三个独立定位的兄弟节点，不是一条居中列。** 只有这样短语才能钉在屏幕正中、而名言落在它与底部之间；单列布局做不到这一点。
- **时钟字体选 `Segoe UI Variable Display`**，它是 Windows 11 为大字号提供的显示用光学尺寸。选它之前实测过各候选字体的等宽数字支持与字重轴可用性（见上方「调整字体」）。
- **`font-family` 写了一个不存在的字体不会报错。** 中文会由回退字体照常画出，问题无声无息；要确认某个字体是否真的生效，不能看「有没有报错」或「字体名写对没有」，得比对渲染出的像素。引文现在依赖系统字体，跨机器观感可能不同。
- **短语的单行自适应是一次测量而非循环试探。** 文本宽度与字号严格成正比，量一次即可算出恰好放得下的字号。
- **当前为只读展示，未使用 `chrome.storage`。** 若将来要支持用户自定义数据：小型偏好（如模糊值、开关）用 `chrome.storage.sync`（约 100KB，单键 8KB），较大缓存用 `chrome.storage.local`（约 10MB）。

## 验证情况

- `data/*.json` 与 `manifest.json` 均可被 `JSON.parse` 解析；24 条短语全部以 `TuningLuna` 结尾且全为 ASCII；20 条名言全部含 `content` 与 `author`。
- `formatTime` / `formatDate` 通过边界用例测试：午夜为 `00:00:00`（非 `24:00:00`）、`23:59:59` 上界、13 点保持 `13` 不塌回 `01`。
- `content.js` 的随机与渲染逻辑经打桩集成测试：400 次抽取全部以 `TuningLuna` 结尾、20 条名言往返一致、JSON 404 时不抛异常且不污染 DOM。
- 背景图压缩后经逐像素比对，可见像素完全一致。
- 页面在 headless Chrome 中实拍渲染通过（背景、模糊、居中、四项内容均正确）。
- 三个模块的垂直位置经实测为 25% / 50% / 75%：短语中心落在视口 50% 处误差 0.5px。
- 短语单行：最长 46 字符与 61 字符压力样本均为 `lines=1.00`、无横向溢出。

未做浏览器内的端到端验证——需在 `chrome://extensions/` 实际加载后才能确认渲染效果。
