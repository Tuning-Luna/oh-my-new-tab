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
├── manifest.json              MV3 清单，通过 chrome_url_overrides.newtab 注册新标签页
├── index.html                 页面结构
├── styles.css                 样式与全部可调参数（见文件顶部 :root 块）
├── js/
│   ├── main.js                启动入口，装配 DOM
│   ├── time.js                时钟与日期
│   ├── content.js             随机短语与随机名言
│   └── fit.js                 短语单行自适应
├── data/
│   ├── phrases.json           短语，字符串数组
│   ├── anime-quotes.json      动画语料，1465 条，约 560 KB
│   ├── literature-quotes.json 文学语料，1944 条，约 770 KB
│   ├── poem-quotes.json       诗词语料，753 条，约 275 KB
│   └── video-quotes.json      影视语料，196 条，约 77 KB
└── assets/
    ├── JSA.png                            背景图
    ├── favicon.svg                        标签页图标
    ├── NotoSerifCJKsc-VF-subset.woff2     名言字体，Noto Serif CJK SC 的可变字体子集，约 4.3 MB
    └── NotoSerifCJKsc-OFL.txt             该字体的 SIL OFL 1.1 许可证与版权声明
```

> 页面文件名由 `manifest.json` 的 `chrome_url_overrides.newtab` 指定，扩展不做目录索引，因此文件名本身是自由的，`index.html` 只是约定。

## 自定义

### 修改短语

编辑 `data/phrases.json`，它是短语本身的字符串数组。称呼不写进数组，而是由 `js/content.js` 顶部的 `PHRASE_ADDRESSEE` 在渲染时追加：改名字、或改成 `""` 去掉称呼，都只改这一处。

### 修改名言

四条语料各自放在 `data/` 下的一个 JSON 文件里，格式是一言 hitokoto 的原始格式，每条只读取 `hitokoto`（正文）、`from_who`（作者）和 `from`（出处）。

署名行把两者都显示出来，以 ` · ` 连接成「作者 · 出处」；只有其中一个时只显示那一个。缺失的字段是 `null`，但 `from` 偶尔会是全角空格 `U+3000` 而并非 `null`，所以取值前会先 `trim()`。两边完全相同（有 45 条把作品名同时填进了作者，如「伴我同行」）只显示一次；一方包含另一方（如「夏目」与「夏目友人帐」）是人物与作品的关系，照常两段都显示。分隔符是 `js/content.js` 顶部的 `ATTRIBUTION_SEPARATOR`，若觉得中点在所选字体下间距不合适，改这一处即可。

要改选择范围，编辑 `js/content.js` 顶部的 `QUOTE_SOURCES` 数组：加一行多一份语料，删一行少一份，顺序无关。每次打开新标签页先从数组里随机挑一个文件，再从该文件里随机挑一条。

注意这是「先挑文件、再挑条目」两步，所以每个文件被选中的概率都是 `1 / 文件数`，与它有多少条无关——196 条的影视和 1944 条的文学出现频率一样，摊到每条上影视要高出约十倍。想让所有语料按条目数等概率出现，把数组里的文件读出来拼接后只随机一次即可。

每份语料除这三个字段外还有约九个字段（`id`、`uuid`、`creator`、`created_at` 等）不被使用，删掉不影响显示，这也是缩小体积的入手点。

### 名言字体

名言用 `assets/NotoSerifCJKsc-VF-subset.woff2` 渲染，页面其余部分不受影响：字体族名只出现在 `styles.css` 顶部的 `@font-face` 与 `--font-quote` 里，而 `--font-quote` 只被 `.quote__content` 和 `.quote__author` 引用。想换回系统字体，把 `--font-quote` 首选的那个名字删掉即可。

这个文件是**子集，不是上游原文件**。上游 `NotoSerifCJKsc-VF.otf` 有 52.8 MB，而四份语料加起来只用到 3770 个不同字符。裁到「语料用字 ∪ GB2312 全表」后是 4.3 MB，字体可用时间从约 830 ms 降到约 200 ms。`font-display` 取 `block` 而非 `swap`，为的是**完全不绘制备用字体**（`swap` 下备用字体是实打实画出来的，实测可截图证实）；代价是字体就绪前名言不可见，所以体积必须先降下来，否则那段时间会很长。

要重新生成，先造保留字符表，再跑 `pyftsubset`（需要 `fonttools` 与 `brotli`）：

```sh
python - <<'PY' > /tmp/keep.txt
import json, glob
keep = set()
for f in glob.glob("data/*.json"):
    for row in json.load(open(f, encoding="utf-8")):
        vals = [row] if isinstance(row, str) else [row.get(k) for k in ("hitokoto", "from_who", "from")]
        keep |= {c for v in vals if isinstance(v, str) for c in v}
for hi in range(0xA1, 0xF8):                    # 全部 GB2312
    for lo in range(0xA1, 0xFF):
        try: keep.add(bytes([hi, lo]).decode("gb2312"))
        except UnicodeDecodeError: pass
print("".join(sorted(c for c in keep if ord(c) > 0x20)), end="")
PY

python -m fontTools.subset assets/NotoSerifCJKsc-VF.otf --text-file=/tmp/keep.txt \
  --output-file=assets/NotoSerifCJKsc-VF-subset.woff2 --flavor=woff2 \
  --layout-features='*' --name-IDs='*' --no-hinting --desubroutinize
```

保留集刻意取「语料用字 ∪ GB2312 全表」而不是仅当前语料：语料里有 1073 个字符不在 GB2312 一级字表内，说明这些语料用字本来就偏冷僻，只按当前语料裁的话，以后新增名言一旦用到表外字符，那一个字会单独退回系统字体，在一行衬线字里很显眼。

字重轴 200–900 完整保留，改 `.quote__content` 的 `font-weight` 即可取用。`@font-face` 里的 `font-weight: 200 900` 不能省略——这个文件是可变字体且默认实例是 200（ExtraLight），而描述符缺省为 `normal`，会把轴钉死。

### 更换标签页图标

替换 `assets/favicon.svg`，或在 `index.html` 中修改 `<link rel="icon">` 的 `href`。当前图标是 1024×1024 的方形图标，PNG 与 SVG 都可用；写 `type="image/svg+xml"` 时需确保文件确为 SVG。

## 许可与数据来源

本项目整体以 **AGPL-3.0** 授权，见 `LICENSE`。这里不是宽松许可，原因在 `data/` 下的四份语料：

| 本仓库 | 上游 | 分类 | 条数 |
| --- | --- | --- | --- |
| `data/anime-quotes.json` | `sentences/a.json` | 动画 | 1465 |
| `data/literature-quotes.json` | `sentences/d.json` | 文学 | 1944 |
| `data/poem-quotes.json` | `sentences/i.json` | 诗词 | 753 |
| `data/video-quotes.json` | `sentences/h.json` | 影视 | 196 |

它们来自一言开源社区的 sentences-bundle（<https://github.com/hitokoto-osc/sentences-bundle>），该仓库以 **AGPL-3.0** 授权，快照为 bundle `1.0.1289`。本仓库中的四份文件都是上游文件的**原样拷贝**，未作改动，sha256 与上游一致。

该仓库 README 明确声明：只有它提供的**超链接调用方式**不受 AGPL 的传染，**其余使用方式**都需遵循 AGPL。像本项目这样把 JSON 直接打包进扩展属于后者，因此整个扩展按 AGPL-3.0 发布——AGPL 是强 copyleft，仅标注出处并不足以合规。

语料的著作权并非完全由一言网持有，原作者可以要求下架；上游给出的渠道是 `i@loli.online`。如果你是其中某条的作者并希望移除，走该渠道，并可在本仓库同步删除对应条目。

字体是另一条独立的授权线，与上面的 AGPL 无关。`assets/NotoSerifCJKsc-VF-subset.woff2` 是 **Noto Serif CJK SC** 的子集，上游以 **SIL OFL 1.1** 授权，版权 © 2017-2024 Adobe，Noto 是 Google Inc. 的商标。OFL 允许把字体与任何许可证下的软件打包分发，本项目的 AGPL-3.0 也不例外；反过来 AGPL 也不会传染到字体上。许可证全文与版权声明随字体一起放在 `assets/NotoSerifCJKsc-OFL.txt`。

上游版权声明中**没有声明 Reserved Font Name**，所以子集化——在 OFL 的定义下属于修改——之后仍可沿用原名。若日后换成别的字体，这层义务同样成立：字体文件必须与它的许可证和版权声明一起分发。
