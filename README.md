# 食途 · 美食旅行地图

> 2026-11-07 南京整合：现支持顶部菜单切换重庆、长沙、柳州、南京。南京104地图点、164视频片段；四城构建及54项浏览器复核通过。当前整合工作区 `.local/worktrees/nanjing-integration`，本机预览 [打开南京与四城切换](http://127.0.0.1:8792/?city=nanjing&view=food)。南京MP4在本机已接通，尚未发布南京Release素材包；只拉代码可看地图和封面。详见 [本轮复核记录](output/research/nanjing/integration-review-20261107.md) 与 PROJECT-STATUS 顶部。下方旧日期数字和端口为历史记录。

食途是“跟着探店视频安排旅行吃什么”的网站，以真实道路三维地图、美食图片、原作者视频和想去清单帮助规划逛吃行程。主工程为 **`map-base/`**，使用 MapLibre GL JS、本地 PMTiles 与 Terrarium 地形，自定义奶油暖色视觉，本地运行不需要高德显示密钥。

仓库：[mzsjlx/shitu](https://github.com/mzsjlx/shitu)。重庆与长沙的整合见 [PR #6](https://github.com/mzsjlx/shitu/pull/6)，柳州的接入见 [PR #8](https://github.com/mzsjlx/shitu/pull/8)。三城采用局部底图，可以在本地预览中快速切城。

## 当前状态与协作入口

| 城市 | 2026-11-06 状态 |
| --- | --- |
| 重庆 | 154片段、110地图卡片、40段待定位或扩图；覆盖主城至北碚局部 |
| 长沙 | 54来源、95片段、71地图点；另10段待定位、3段范围外，视频均保留 |
| 南京 | ID `nanjing`，本机已有独立初始化分支，尚未接入 |
| 柳州 | ID `liuzhou`，7 个来源、9 个片段、9 个地图点，覆盖中心城区局部 |

数字为本次快照，后续以当前目录与 [PROJECT-STATUS.md](PROJECT-STATUS.md) 顶部为准。地图位置是有依据的街区近似点，不代表店门或实时营业核实。加入两家以上想去后，可切换直线/沿路；沿路使用真实道路源节点拓扑和长度，适合规划参考。

仓库Agent入口为 [AGENTS.md](AGENTS.md)。新城市及交接先读 [完整城市手册](CITY-AGENT-HANDBOOK.md) 和 [城市整合注意事项](CITY-INTEGRATION-NOTES.md)，长沙续做/南京开工文字在 [CITY-AGENT-MESSAGES.md](CITY-AGENT-MESSAGES.md)，通用模板在 [CITY-AGENT-STARTER.md](CITY-AGENT-STARTER.md)。协作流程见 [CONTRIBUTING.md](CONTRIBUTING.md)，媒体同步见 [MEDIA-COLLABORATION.md](MEDIA-COLLABORATION.md)。

## 在自己的电脑运行

新克隆取得最新main；已有城市工作区先检查并保存修改，执行 `git fetch origin`，在自己的原分支合入最新 `origin/main`，不硬重置或覆盖他人工作。无需再切回旧视频批次分支来启动。

当前在 Windows、Node.js 24 与 npm 下验证。安装Node.js后，在仓库的 `map-base/` 下执行：

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd run preview
```

macOS/Linux把 `npm.cmd` 换成 `npm`；地图提取工具另需检查平台兼容。启动器通常使用 `http://127.0.0.1:8791/`，占用时改用8792–8799，以实际输出为准。首次构建后也可双击 `map-base/打开地图.cmd`。只查看地图不需要FFmpeg。

| 页面 | 路径 |
| --- | --- |
| 重庆美食地图 | `/?view=food` |
| 长沙美食地图 | `/?city=changsha&view=food` |
| 柳州美食地图 | `/?city=liuzhou&view=food` |
| 重庆资料目录 | `/videos.html`、`/places.html` |
| 长沙资料目录 | `/videos-changsha.html`、`/places-changsha.html` |
| 重庆内容核实工作台 | `/content-review.html` |
| 单文件本地审阅 | `/preview-chongqing.html`、`/preview-changsha.html`、`/preview-liuzhou.html`。`/preview.html` 为默认别名 |
| 重庆旧道路节点试算 | `/?view=walk`，不代表其他城市已适配该样板 |

普通页面顶部可切城市。长沙核实工作台明确提示未开放，不读取重庆草稿。想去与距离模式按城保存在浏览器里，不随Git同步；重庆核实草稿可导出/导入。单文件也应通过HTTP验证，不能据此承诺所有浏览器的file协议均可用。

## 两台电脑的素材同步

Git 包含三城 230 张片段封面、来源和必要地图。原片与 MP4 按 `map-base/data/media-bundles.json` 选择 ZIP 单独导入。长沙有 54 个来源包，其中 5 份仅含原片。柳州有 7 个来源包，共 9 段视频。[长沙素材](https://github.com/mzsjlx/shitu/releases/tag/media-2026-11-01-changsha) · [柳州素材](https://github.com/mzsjlx/shitu/releases/tag/media-2026-11-02-liuzhou)

先同步包含相应来源的代码，在 `map-base/` 执行：

```powershell
npm.cmd run media:import -- '下载目录/实际素材包.zip'
npm.cmd run build
npm.cmd run preview
```

无本机视频时仍可看地图、封面、来源和地址；导入后再验证实际播放。导入器自动识别城市、校验身份和哈希，旧重庆包兼容；重复同内容跳过，冲突保留本机文件。不要整包手动覆盖`.local`。制作方的按城剪辑/封面/打包及Release交付步骤见 [素材说明](MEDIA-COLLABORATION.md)。

## 目录与进一步说明

| 位置 | 用途 |
| --- | --- |
| `map-base/src/` | 当前网站源码和样式 |
| `map-base/config/cities.json` | 已接入城市配置；准备态不会自动跳过缺资源项 |
| `map-base/data/` | 重庆兼容数据、公共索引与必要地图 |
| `map-base/data/cities/<cityId>/` | 新城市独立数据、地图与路网 |
| `map-base/assets/video-posters/<sourceId>/` | 对应片段真实原片小封面 |
| `map-base/scripts/` | 构建、素材、数据准备与检查脚本 |
| `output/research/<cityId>/` | 按城来源核对和交接记录 |
| `output/` | 研究与验证材料，部分脚本依赖，不能整体删除或忽略 |
| `design/` | 设计参考和早期原型，非主工程 |
| `PROJECT-STATUS.md` | 日期倒序状态，旧章节保留为历史 |

各城在独立分支推进完整功能，公共改动单独提交并统一整合。不要用异城目录覆盖重庆，不只修改 `activeCity` 就宣称新城完成；已有分支继续保留。构建产物 `dist/`、`preview*.html` 以及依赖、本机媒体和环境按`.gitignore`处理，不手工维护。

功能和数据说明见 [主工程说明](map-base/README.md)、[验证记录](map-base/VERIFICATION.md)、[片段素材说明](map-base/VIDEO-LIBRARY.md) 和 [道路距离说明](map-base/FOOD-ROAD-DISTANCE.md)。这些文档的旧日期数字以最新状态为准，不作为当前验收固定数量。

项目自有代码尚未选定开源许可证。第三方软件、地图、图片和视频各自来源与用途说明保留，见 `map-base/licenses/`、`MAP-PLATFORM-DECISION.md`、`FOOD-CONTENT-SOURCES.md` 和 `CREATOR-GUIDES-SOURCES.md`。
