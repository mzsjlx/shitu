# 食途 · 美食旅行地图

> 2026-10-30 第四批在 `codex/chongqing-video-batch4`：累计117个视频片段、79个地图点和34段未定位。下方第三批的93段、60点为之前的历史基线；最新交接和验证见 [PROJECT-STATUS.md](PROJECT-STATUS.md)。

食途是一个正在开发的美食旅行网站，以重庆为首个城市。主界面使用真实道路三维地图，叠加美食候选卡片、原作者视频资料和想去清单。

项目仓库：[mzsjlx/shitu](https://github.com/mzsjlx/shitu)。

当前主工程是 **`map-base/`**。地图采用 MapLibre GL JS 与本地 PMTiles 数据，自定义奶油色视觉；不需要高德显示密钥即可运行本地版本。2026-10-30 的本地版本已覆盖重庆中心城区、沙坪坝及北碚部分区域，尚未发布网站。

**第三批成果目前在 `codex/chongqing-video-batch3` 分支，尚未合入 `main`。** 下文的93个片段、60个地图点和北碚范围指这个分支；接收方应在维护者推送后取得对应分支，合并后再从 `main` 同步。素材下载入口见 [素材协作说明](MEDIA-COLLABORATION.md)。

地图加入两家以上想去后，可以在底部切换「直线 / 沿路」距离。沿路按本地真实道路计算步行参考长度，连线与总距离一起更新；店点仍为街区近似位置，适合旅行规划。道路资料随代码提供，详见 [距离功能与数据说明](map-base/FOOD-ROAD-DISTANCE.md)。

## 在自己的电脑运行

当前项目已在 Windows、Node.js 24 与 npm 下验证。先安装 Node.js 并确认终端能运行 `node --version` 和 `npm --version`，再进入克隆后的项目目录。

要查看尚未合并的第三批，先保存自己的修改。在分支已推送且本地还没有同名分支时，于仓库根目录运行 `git fetch origin`、`git switch --track origin/codex/chongqing-video-batch3`；已有本地分支则切回它并按需快进更新。不要覆盖另一位协作者的分支或未提交内容。取得对应代码后继续下面的安装、构建步骤。

Windows PowerShell：

```powershell
cd map-base
npm.cmd ci
npm.cmd run build
npm.cmd run preview
```

macOS / Linux 终端可使用相同命令，去掉 npm 后面的 `.cmd`。

启动器会显示本地网址，通常为 `http://127.0.0.1:8791/`；端口被占用时会使用 8792–8799。也可以在完成首次安装、构建后双击 `map-base/打开地图.cmd`。

常用页面：

| 页面 | 路径 |
| --- | --- |
| 美食地图 | `/?view=food` |
| 本地单店视频浮层 | `/?view=food&videos=1` |
| 探店视频资料 | `/videos.html` |
| 门店资料目录 | `/places.html` |
| 本地内容核实工作台 | `/content-review.html` |
| 道路节点试算 | `/?view=walk` |

本地预览仅监听本机。想去清单与核实草稿保存在各自浏览器中，不会随 Git 克隆同步；核实工作台可自行导出、导入草稿。

## 目录与当前进度

| 位置 | 用途 |
| --- | --- |
| `map-base/src/` | 当前网站源码与样式 |
| `map-base/data/` | 地图、候选门店、视频资料和来源清单 |
| `map-base/scripts/` | 构建、数据准备与检查脚本 |
| `design/concepts/`、`design/references/` | 设计概念、参考及菜品示意素材 |
| `design/prototype-3d/` | 早期三维地标研究与原始来源缓存 |
| `output/` | 来源核对、研究快照和检查截图；部分脚本需要这里的资料 |
| `PROJECT-STATUS.md` | 按时间记录的续做状态，以顶部最新章节为准 |

2026-10-30 本地第三批新增小洋嘎嘣脆、一颗蓝莓、一支凯子、PP超能炫的4份原片，分别拆成6、6、11、32段，共新增55段。累计15个来源记录、14份已取得原片、93个片段和93张原片封面；64个有坐标片段归并为60个地图点，29段保留在视频库等待补充店名、分店或街区。朱儿面庄共3位博主，一口汤饺共2位博主，保留各自视频；蔡记包子未仅凭同名强行归并。PP保留2025年原视频年份，其余旧片同样保留真实发布日期与营业待确认说明。“汁汁冰激凌”仍缺完整原片。

底图与沿路网络扩展到 `[106.36,29.48,106.65,29.87]`，含北碚；旧区域399张z15瓦片完整保留，新范围共1,134张z15瓦片、189张地形瓦片。地图点使用开放地图街区参照作大致规划，选两家可切换直线与沿路距离。两条早期示例地点及额外B站内容已移除，后续仅整理用户提供的链接。具体实现与实际验证范围见 [主工程说明](map-base/README.md)、[验证记录](map-base/VERIFICATION.md)、[片段素材说明](map-base/VIDEO-LIBRARY.md) 和 [距离功能与数据说明](map-base/FOOD-ROAD-DISTANCE.md)。

## 两人一起开发

目前分工：本会话继续重庆，同学正在制作柳州（城市ID `liuzhou`）。双方可在独立分支推进完整城市功能，公共改动单独提交并统一集成；柳州无需停工等待。后续地图目标为连续拖动与城市快速跳转并存，当前仍只有重庆局部地图接通。

分别建设不同城市时，先读 [城市 Agent 完整交接手册](CITY-AGENT-HANDBOOK.md)。它包含已确定的设计要求、重庆硬编码清单、视频到地图的完整步骤、实际踩坑、验收及媒体交付。直接转发给另一台电脑的指令在 [CITY-AGENT-STARTER.md](CITY-AGENT-STARTER.md)；仓库 Agent 入口为 [AGENTS.md](AGENTS.md)。当前尚未完成全链路多城市，不能只替换重庆数据或修改 `activeCity` 来接入新城。

协作约定见 [CONTRIBUTING.md](CONTRIBUTING.md)。建议每项修改使用独立分支，通过 Pull Request 说明改动与验证，再合并到 `main`。

仓库保留源码、必要数据、设计素材与来源记录；依赖目录、构建目录、本机缓存和环境配置由 `.gitignore` 排除。`map-base/dist/` 与 `map-base/preview.html` 在本地执行构建后生成，不需要手动上传。

项目自有代码尚未选定开源许可证。现有第三方软件、地图数据、图片和视频各自的来源与用途说明仍需保留，见 `map-base/licenses/`、`MAP-PLATFORM-DECISION.md`、`FOOD-CONTENT-SOURCES.md` 和 `CREATOR-GUIDES-SOURCES.md`。

## 两台电脑的素材同步

第三批分支的代码包含93张视频封面，安装构建即可显示地图与缩略图；完整原片和MP4另行导入。前两批有10个来源素材包，第三批新增4包约2.0 GB，已上传并核对远端哈希。已有旧10包的电脑只需追加4包；首次完整导入为旧10包加新4包。双方按 [MEDIA-COLLABORATION.md](MEDIA-COLLABORATION.md) 同步。
