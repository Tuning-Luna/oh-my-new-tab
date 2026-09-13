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

