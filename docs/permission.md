## 许可与数据来源

本项目整体以 **AGPL-3.0** 授权，见 `LICENSE`。这里不是宽松许可，原因在 `data/` 下的四份语料：

| 本仓库                        | 上游               | 分类 | 条数 |
| ----------------------------- | ------------------ | ---- | ---- |
| `data/anime-quotes.json`      | `sentences/a.json` | 动画 | 1465 |
| `data/literature-quotes.json` | `sentences/d.json` | 文学 | 1944 |
| `data/poem-quotes.json`       | `sentences/i.json` | 诗词 | 753  |
| `data/video-quotes.json`      | `sentences/h.json` | 影视 | 196  |

它们来自一言开源社区的 sentences-bundle（<https://github.com/hitokoto-osc/sentences-bundle>），该仓库以 **AGPL-3.0** 授权，快照为 bundle `1.0.1289`。本仓库中的四份文件都是上游文件的**原样拷贝**，未作改动，sha256 与上游一致。

该仓库 README 明确声明：只有它提供的**超链接调用方式**不受 AGPL 的传染，**其余使用方式**都需遵循 AGPL。像本项目这样把 JSON 直接打包进扩展属于后者，因此整个扩展按 AGPL-3.0 发布——AGPL 是强 copyleft，仅标注出处并不足以合规。

语料的著作权并非完全由一言网持有，原作者可以要求下架；上游给出的渠道是 `i@loli.online`。如果你是其中某条的作者并希望移除，走该渠道，并可在本仓库同步删除对应条目。

字体是另一条独立的授权线，与上面的 AGPL 无关。`assets/NotoSerifCJKsc-VF-subset.woff2` 是 **Noto Serif CJK SC** 的子集，上游以 **SIL OFL 1.1** 授权，版权 © 2017-2024 Adobe，Noto 是 Google Inc. 的商标。OFL 允许把字体与任何许可证下的软件打包分发，本项目的 AGPL-3.0 也不例外；反过来 AGPL 也不会传染到字体上。许可证全文与版权声明随字体一起放在 `assets/NotoSerifCJKsc-OFL.txt`。

上游版权声明中**没有声明 Reserved Font Name**，所以子集化——在 OFL 的定义下属于修改——之后仍可沿用原名。若日后换成别的字体，这层义务同样成立：字体文件必须与它的许可证和版权声明一起分发。