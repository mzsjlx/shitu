# 食途 · 新城市 PR 准入自查表（2026-11-22）

面向新加入协作者及其 Agent。**提 PR 前请逐条自检并实际跑通**，避免因常见规范问题返工。本表汇总了武汉 PR #10、郑州 PR #11 与多轮审查的实测经验，标杆实现与测试脚本可直接参考：
- 数据与路网校验模板：`map-base/scripts/review-zhengzhou-data.mjs`
- 浏览器端到端校验模板：`map-base/scripts/review-zhengzhou-browser.py`
- 标杆终审记录：`output/research/zhengzhou-review-20261122.md`、`output/research/wuhan-followup-20261116.md`

---

## 强烈推荐：两阶段交付，避免大批量返工

1. **阶段 1（探路小闭环，强烈建议先走一遍）**：完成城市配置 + 开放底图 + 真实 OSM 路网 + `.gitattributes` LF + **1~3 个真实探店视频**（尽量覆盖跨博主同店或 2 店沿路）→ 跑通剪辑、封面、打包、公开 Release、隔离导入与浏览器 QA，先开 **Draft PR** 或交审核方快速预检结构。
2. **阶段 2（批量扩量）**：确认骨架、路网、锚点与打包流程 0 问题后，再批量摄入几十上百条视频，一次过审合入。

---

## 提交正式 PR 前 10 条必过红线

### 1. 分支清洁，绝不污染其他城市文件
- 从最新 `origin/main` 建立独立分支 `codex/city-<cityId>-prep`（同机多城市请用独立 worktree）。
- **高频坑**：在本机没有其他城市 MP4 时运行 `npm run build`，会改写其他城市的 `map-base/data/cities/*/video-library-assets.json`。提交前**务必执行 `git diff --name-only origin/main`**，还原所有非本城城市的 `video-library-assets.json`，禁止盲目 `git add -A`。

### 2. 共享索引按 ID 合并，零覆盖零丢失
- 修改 `map-base/config/cities.json`、`map-base/data/video-posters.json`、`map-base/data/media-bundles.json`、`PROJECT-STATUS.md` 时，只按 `cityId` / `sourceId` / `segmentId` 追加本城条目。
- 保持 `activeCity` 为 `chongqing`；确认既有全部城市条目 0 丢失、0 被修改。

### 3. 真实 OSM PBF 路网 + `.gitattributes` 锁定 LF
- 必须用 `map-base/scripts/prepare-food-road-network.py --city <cityId>` 从 Geofabrik 原始省份 `.osm.pbf` 生成路网，保留原始 OSM 节点与 way 拓扑和通行标签；**禁止从 PMTiles 显示瓦片抽线拼接或自造流水号节点**。
- 在根目录 `.gitattributes` 显式追加以下两行，并在新检出确认 0 CRLF、落盘字节数与 SHA256 与清单完全一致：
  ```gitattributes
  map-base/data/cities/<cityId>/food-road-network.json text eol=lf
  map-base/data/cities/<cityId>/food-road-network-manifest.json text eol=lf
  ```

### 4. 在图锚点与主路网全连通
- 每个在图点的 `planningLocation.anchor` 必须是真实**整型** OSM `way` ID 与属于该 `way.nodes` 的真实 `nodeId`：
  - `typeof anchor.id === 'number'` 且 `typeof anchor.nodeId === 'number'`（禁止 `"way-xxxx"` 字符串、禁止 `road:xxx` 合成 ID）；
  - `anchor.nodeId !== anchor.id` 且 `way.nodes.includes(anchor.nodeId)`；
  - 锚点道路距门店坐标 ≤ 300m。
- 全部在图点需在 250m 内吸附到主连通分量，无误落入孤立环路导致的断路点；确实在底图范围外的门店保留真实 WGS84 坐标并标记范围外，不强行夹回地图边界。

### 5. 内容真实、实测 FFprobe、合理切点与旧片提示
- 只整理用户明确提供的链接，不自行扩充无关来源，不虚构授权。
- 按真实门店内容（门头、菜品、评价、地址）精准切分，**不要一刀切统一剪成固定秒数**；同一分店多博主用 `placeId`（不带 `video-`）归并合用一点，早市/美食街合集如实标为街区合集。
- 用实际 FFprobe 记录 H.264+AAC 流与实测时长，禁止硬编码或用 `end-start` 冒充探测结果；非今年旧视频补齐 `footageNote`（注明年份与营业情况待确认）。

### 6. 公开可下载 Release（主仓或公开 Fork 均可，严禁 404）
- 源码、地图数据与小封面进 Git；原片、剪辑 MP4、打包 ZIP、下载日志与本机环境留 `.local/`。
- 上传本城全部来源的 `.zip` 与 `.zip.json` 到独立公开 Release（标签建议 `media-YYYY-MM-DD-<cityId>`）：
  - **有主仓权限**：发到 `mzsjlx/shitu`；
  - **Fork 协作者（无主仓写权限）**：直接发到自己**公开 Fork 仓库**的 Release，并将真实可公开下载的 Fork Release URL 写入 `map-base/data/media-bundles.json`，**绝不要填入未创建的主仓 404 地址**。
- 分页查全 Release 附件，确认全部 ZIP 与摘要均为 `uploaded`（`starter` 不算完成，上传中须如实标明进度）。

### 7. `media-bundles.json` 必须与远端实传 ZIP 100% 一致
- **高频坑**：`media:pack` 每次重打包会写入当前时间戳，导致 ZIP 包体 SHA256 改变；`media:import` 会强校验 `media-bundles.json` 中的 `bytes` 与 `sha256`，不一致会直接报错拒绝导入。
- 必须逐项核对 `media-bundles.json` 的 `name`、`url`、`bytes`、`sha256`、`clips` 与 Release 实际 `uploaded` 附件及 `video-library.json` 片段数 0 偏差。
- 至少从远端 Release 实际下载 1~3 个代表性 ZIP，在新隔离空媒体目录执行 `npm.cmd run media:import -- --city <cityId> <zip>`，实测首次导入成功且重复导入 `newFiles: 0`。

### 8. 无 `.local` 媒体的干净新检出构建必测
- 在不含 `.local` 原片/剪辑的新检出中运行 `npm.cmd ci && npm.cmd run build`，确认全部既有城市与本城小封面 0 丢失，无本地视频的卡片如实显示“视频待同步”（不伪装可播）。

### 9. 真实浏览器端到端强断言（禁止虚假 PASS）
- 测试脚本禁止硬编码本机路径或写死端口（支持环境变量/参数，参考 `review-zhengzhou-browser.py`）。
- 播放断言必须**双采样**验证 `currentTime` 实际推进（`dt >= 0.3s && !paused`）；切店、切多博主片段与按 Escape 关闭前保存旧 `<video>` 引用，操作后必须用 **`&&`** 严格断言 `old && old.paused && !old.getAttribute('src')`（禁止用 `||`，禁止无播放按钮直接 PASS）。
- 覆盖 4 种视口：`1440×960`、`390×844`、`320×680`、`736×414`，均须断言浮窗在视口内且媒体面积 / 浮窗总面积 **≥ 2/3**（不要用 `0.66`），并保存截图肉眼检查。
- 实测 2~3 站「直线 / 沿路」真实切换、离线单页包 `preview-<cityId>.html`、道路搜索、`videos-<cityId>.html` / `places-<cityId>.html`，以及切换重庆/武汉/郑州等既有城市时收藏、搜索、道路与页面零串城。

### 10. 正式编号 PR 与诚实的范围口径
- 在 `https://github.com/mzsjlx/shitu` 创建指向 `main` 的**正式编号 PR**（`compare` 或 `pull/new` 页面不算 PR）。
- PR 描述与交接文档中：
  - 分开统计：**作品数 / 独立作者数 / 片段数 / 去重点数 / 在图点数 / 范围外与未定位段数 / 跨博主归并处数**；
  - 明确区分验证范围：**全量 Release API 服务端 digest 核对范围** vs **实际远端下载、隔离导入与真机播放抽样范围**；
  - 注明最新提交 SHA、Release 链接、实际跑过的命令与待办项。
