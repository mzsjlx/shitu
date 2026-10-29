# 食途 · 美食旅行地图

食途是一个正在开发的美食旅行网站，以重庆为首个城市。主界面使用真实道路三维地图，叠加美食候选卡片、原作者视频资料和想去清单。

项目仓库：[mzsjlx/shitu](https://github.com/mzsjlx/shitu)。

当前主工程是 **`map-base/`**。地图采用 MapLibre GL JS 与本地 PMTiles 数据，自定义奶油色视觉；不需要高德显示密钥即可运行本地版本。当前地图范围是重庆中心城区局部，尚未发布网站。

地图加入两家以上想去后，可以在底部切换「直线 / 沿路」距离。沿路按本地真实道路计算步行参考长度，连线与总距离一起更新；店点仍为街区近似位置，适合旅行规划。道路资料随代码提供，详见 [距离功能与数据说明](map-base/FOOD-ROAD-DISTANCE.md)。

## 在自己的电脑运行

当前项目已在 Windows、Node.js 24 与 npm 下验证。先安装 Node.js 并确认终端能运行 `node --version` 和 `npm --version`，再进入克隆后的项目目录。

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

当前可用版本从主分支 `main` 获取。已处理用户提供的 10 份原片，共 38 个片段，按重复分店归并为 31 个地图点，另外 5 段保留在视频库等待补充店名或街区。地图扩到沙坪坝三峡广场；点位使用独立开放地图街区坐标作大致规划参考，选两家可切换直线与沿路距离。相同分店可切换不同博主的视频，保留原作者、原页、年份和切点。两条早期示例地点及额外 B站内容已移除，后续仅整理用户提供的链接。第三条旧来源“汁汁冰激凌”仍缺完整原片。具体实现与验证范围见 [主工程说明](map-base/README.md)、[验证记录](map-base/VERIFICATION.md)、[片段素材说明](map-base/VIDEO-LIBRARY.md) 和 [地址核对记录](map-base/VIDEO-ADDRESS-REVIEW.md)。

## 两人一起开发

目前分工：本会话继续重庆，同学正在制作柳州（城市ID `liuzhou`）。双方可在独立分支推进完整城市功能，公共改动单独提交并统一集成；柳州无需停工等待。后续地图目标为连续拖动与城市快速跳转并存，当前仍只有重庆局部地图接通。

分别建设不同城市时，先读 [城市 Agent 完整交接手册](CITY-AGENT-HANDBOOK.md)。它包含已确定的设计要求、重庆硬编码清单、视频到地图的完整步骤、实际踩坑、验收及媒体交付。直接转发给另一台电脑的指令在 [CITY-AGENT-STARTER.md](CITY-AGENT-STARTER.md)；仓库 Agent 入口为 [AGENTS.md](AGENTS.md)。当前尚未完成全链路多城市，不能只替换重庆数据或修改 `activeCity` 来接入新城。

协作约定见 [CONTRIBUTING.md](CONTRIBUTING.md)。建议每项修改使用独立分支，通过 Pull Request 说明改动与验证，再合并到 `main`。

仓库保留源码、必要数据、设计素材与来源记录；依赖目录、构建目录、本机缓存和环境配置由 `.gitignore` 排除。`map-base/dist/` 与 `map-base/preview.html` 在本地执行构建后生成，不需要手动上传。

项目自有代码尚未选定开源许可证。现有第三方软件、地图数据、图片和视频各自的来源与用途说明仍需保留，见 `map-base/licenses/`、`MAP-PLATFORM-DECISION.md`、`FOOD-CONTENT-SOURCES.md` 和 `CREATOR-GUIDES-SOURCES.md`。

## 两台电脑的素材同步

主分支的代码包含 38 张视频封面，首次安装构建即可显示地图与美食缩略图。完整原片与剪辑通过仓库两批 Release、按作者共 10 个素材包单独下载、校验导入。已有首批素材时只需下载新增 8 包。双方新增和上传素材都遵循 [MEDIA-COLLABORATION.md](MEDIA-COLLABORATION.md)。
