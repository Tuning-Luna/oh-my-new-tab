## 文件结构

```
oh-my-new-tab/
├── manifest.json              MV3 清单，通过 chrome_url_overrides.newtab 注册新标签页
├── index.html                 页面结构
├── style/                     样式，按职责拆分，由 index.html 逐个 link
│   ├── tokens.css             :root 里的全部可调参数
│   ├── fonts.css              名言字体的 @font-face
│   ├── base.css               重置、页面盒子、.slot 共用定位、背景图
│   ├── clock.css              时钟与日期
│   ├── phrase.css             短语
│   ├── quote.css              名言
│   ├── fullscreen.css         右下角全屏按钮
│   └── motion.css             全部 @keyframes 与减少动态效果的覆盖
├── js/
│   ├── main.js                启动入口，装配 DOM
│   ├── time.js                时钟与日期
│   ├── content.js             随机短语与随机名言
│   ├── fit.js                 短语单行自适应
│   └── fullscreen.js          右下角全屏按钮
├── data/
│   ├── phrases.json           短语，字符串数组
│   ├── anime-quotes.json      动画语料，1465 条，约 560 KB
│   ├── literature-quotes.json 文学语料，1944 条，约 770 KB
│   ├── poem-quotes.json       诗词语料，753 条，约 275 KB
│   └── video-quotes.json      影视语料，196 条，约 77 KB
└── assets/
    ├── JSA.webp                           背景图
    ├── favicon.svg                        标签页图标
    ├── fullscreen-expand.svg              全屏按钮图标，未全屏时显示
    ├── fullscreen-shrink.svg              全屏按钮图标，全屏时显示
    ├── NotoSerifCJKsc-VF-subset.woff2     名言字体，Noto Serif CJK SC 的可变字体子集，约 4.3 MB
    └── NotoSerifCJKsc-OFL.txt             该字体的 SIL OFL 1.1 许可证与版权声明
```

> 页面文件名由 `manifest.json` 的 `chrome_url_overrides.newtab` 指定，扩展不做目录索引，因此文件名本身是自由的，`index.html` 只是约定。