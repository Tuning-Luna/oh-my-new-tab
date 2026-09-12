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

编辑 `data/phrases.json`，它是一个字符串数组。每次打开新标签页随机取一条。

### 修改名言

编辑 `data/quotes.json`。每项只需要 `content` 和 `author` 两个字段。
 
### 更换标签页图标

替换 `assets/favicon.svg`，或在 `index.html` 中修改 `<link rel="icon">` 的 `href`。当前图标是 1024×1024 的方形图标，PNG 与 SVG 都可用；写 `type="image/svg+xml"` 时需确保文件确为 SVG。
