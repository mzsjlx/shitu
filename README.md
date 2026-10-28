# 食途 · 美食旅行地图

食途是一个正在开发的美食旅行网站，以重庆为首个城市。主界面使用真实道路三维地图，叠加美食候选卡片、原作者视频资料和想去清单。

项目仓库：[mzsjlx/shitu](https://github.com/mzsjlx/shitu)。

当前主工程是 **`map-base/`**。地图采用 MapLibre GL JS 与本地 PMTiles 数据，自定义奶油色视觉；不需要高德显示密钥即可运行本地版本。当前地图范围是重庆中心城区局部，尚未发布网站。

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

当前地图有两家入口待核的来源候选，视频资料页另外整理了一份作者简介的六条门店线索。用户提供的前两条抖音已整理为20个本地单店片段，保留作者、原页和时间；素材不随Git克隆同步，没有媒体时仍可构建并查看原页。菜篮子与嫩豆芽北环门牌已有政府/品牌原文对照，20条精确位置仍待补齐。没有把待定位线索生成地图坐标或可执行到店路线。具体实现与验证范围见 [主工程说明](map-base/README.md)、[验证记录](map-base/VERIFICATION.md)、[片段素材说明](map-base/VIDEO-LIBRARY.md) 和 [地址核对记录](map-base/VIDEO-ADDRESS-REVIEW.md)。

## 两人一起开发

协作约定见 [CONTRIBUTING.md](CONTRIBUTING.md)。建议每项修改使用独立分支，通过 Pull Request 说明改动与验证，再合并到 `main`。

仓库保留源码、必要数据、设计素材与来源记录；依赖目录、构建目录、本机缓存和环境配置由 `.gitignore` 排除。`map-base/dist/` 与 `map-base/preview.html` 在本地执行构建后生成，不需要手动上传。

项目自有代码尚未选定开源许可证。现有第三方软件、地图数据、图片和视频各自的来源与用途说明仍需保留，见 `map-base/licenses/`、`MAP-PLATFORM-DECISION.md`、`FOOD-CONTENT-SOURCES.md` 和 `CREATOR-GUIDES-SOURCES.md`。

## 两台电脑的素材同步

代码中包含 20 张视频封面，首次安装构建即可显示地图与美食缩略图。完整原片与剪辑通过仓库 Release 素材包单独下载、校验导入。双方新增和上传素材都遵循 [MEDIA-COLLABORATION.md](MEDIA-COLLABORATION.md)。
