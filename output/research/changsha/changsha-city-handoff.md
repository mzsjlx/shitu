# 食途 · 长沙城市制作接手与准备报告

日期：2026-10-30  
负责城市：长沙（`changsha`）  
当前工作分支：`codex/city-changsha-prep`（基于 `main` 提交 `1676742` 的独立 worktree 工作区）  
当前协作状态：
- 重庆：由另一位 Agent 负责，保留本地分支 `codex/chongqing-video-batch3` 及未提交工作，互不干扰；
- 柳州：由另一位同学制作（`liuzhou`），保留独立工作和分支；
- 长沙：本工作区负责，使用独立数据目录 `map-base/data/cities/changsha/` 与研究目录 `output/research/changsha/`。

---

## 1. 阶段状态总览

- **当前阶段**：前期准备与多城市底座适配阶段（等待用户提供第一批长沙探店视频链接）。
- **已区分状态**：
  - [x] **长沙架构与前期准备完成**：目录、配置、空数据模型模板、多城市参数化抽象已就绪；
  - [ ] **长沙可单独运行（待地图与首批视频）**：待用户提供首批长沙视频链接后，确定精确探店分布并提取底图、路网；
  - [ ] **重庆、柳州、长沙完整集成**：公共接口保持兼容，待各城制作完成后统一集成。

---

## 2. 本次完成的不依赖视频链接的前期工作

### 2.1 独立 Worktree 工作区建立
- 检查主仓库 Git 状态，发现工作区处于 `codex/chongqing-video-batch3` 且有未提交文件（`PROJECT-STATUS.md`、`map-base/src/styles.css`）；
- 严格遵循协作规范，不执行任何 reset、stash 或覆盖他人操作，在 `.local/worktrees/changsha` 检出基于最新 `main`（`1676742`）的独立 worktree，创建分支 `codex/city-changsha-prep`；
- 在独立 worktree 中完成 `npm.cmd ci` 与首次干净构建，基线验证通过。

### 2.2 城市配置与数据目录规划
- 建立了长沙独立数据目录：`map-base/data/cities/changsha/`；
- 建立了长沙专属城市画像：`map-base/data/cities/changsha/city-profile.json`，明确：
  - 城市 ID：`changsha`，名称：`长沙`，行政区划：`湖南省`；
  - 高德地图外部搜索城市代码：`430100`（避免异城店名在重庆检索）；
  - 核心商圈规划覆盖：`[112.90, 28.14, 113.05, 28.25]`，中心点 `[112.977, 28.194]`，涵盖五一广场、黄兴路步行街、坡子街、太平老街、南门口、冬瓜山、潮宗街、开福寺、岳麓山与橘子洲；
- 在 `map-base/config/cities.json` 中登记了 `changsha` 独立配置，同时保持默认 `activeCity: "chongqing"` 不变；
- 初始化了符合 schemaVersion 1 的空数据模板：
  - `data/cities/changsha/video-library.json`（`sources: []`，`rights.status: "user-confirmed"`，等待用户输入链接）；
  - `data/cities/changsha/food-records.json`；
  - `data/cities/changsha/video-map-contexts.json`。

### 2.3 多城市公共代码解耦与平滑升级（保留重庆完全兼容）
对以下核心代码进行了参数化升级：
1. **`map-base/src/main.js`**：
   - 支持通过 URL 参数读取城市（如 `/?city=changsha`），未提供时平滑回退至 `config.activeCity`（重庆）；
   - 地标（洪崖洞）解耦：仅当城市配置显式包含 `hongyadong` 地标时才加载洪崖洞图层与入口，长沙等无该地标的城市自动隐藏地标入口，防止异城飞回重庆；
   - 界面文案与搜索参数化：使用 `city.name` 替换原有写死的“重庆”字样。
2. **`map-base/src/video-library-model.js`**：
   - `validateVideoLibrary(data, expectedCity)`：支持指定城市或合法城市名称校验，支持初始空来源列表（0～200个来源）；
   - `amapSearchUrl(name, cityCode = '500000')`：支持传入城市代码，长沙使用 `430100`，保持重庆默认值兼容。
3. **`map-base/src/food-experience.js`**：
   - 想去清单与距离偏好 LocalStorage 隔离：采用 `foodcity:wants:${this.cityId}:v1` 与 `foodcity:distance-mode:${this.cityId}:v1`，重庆保留旧键 `foodcity:wants:chongqing:v1`，保证已有用户收藏不丢失，新城市数据彻底隔离；
   - 视频库路径参数化：优先读取城市配置的 `foodContent.videoLibrary`，回退至全局目录；
   - 视角动画与边界适配当前城市。
4. **`map-base/scripts/prepare-food-road-network.py`**：
   - 增加 `--city` 参数支持，使道路拓扑网络提取能够按配置输出至对应城市目录（如 `data/cities/changsha/food-road-network.json`），并记录对应的 Geofabrik 湖南数据源信息。

---

## 3. 验证执行与当前限制

### 3.1 实际执行的验证
- **独立环境依赖与初始构建**：在 worktree 中执行 `npm.cmd ci` 与 `npm.cmd run build`，耗时约 2 秒，单文件与 `dist/` 产物正常生成，无依赖冲突；
- **公共代码改造后构建**：更新 `main.js`、`video-library-model.js`、`food-experience.js`、`cities.json` 后重新运行 `npm.cmd run build`，构建成功，生成 28,365,725 字节单文件产物，重庆默认模式完全正常；
- **配置与数据契约审查**：`cities.json` 与 `city-profile.json` 语法有效，字段与工程路径对应无断链。

### 3.2 当前限制与待办项
- **视频与门店尚未录入**：严格遵照用户要求，不自行去抖音或网络扒视频凑数，等待用户提供首批长沙探店链接；
- **底图切片与道路路网尚未生成**：等待用户提供首批链接后，根据探店门店的具体分布微调 bbox，再行提取 `changsha.pmtiles` 和湖南/长沙 OSM 道路拓扑；
- **跨城连续拖动尚未实现**：当前仍为单城局部地图模式，各城市通过独立数据与参数化配置运行。

---

## 4. 下一步行动

等待用户提供第一批长沙探店视频链接。
收到链接后将按照手册规范执行：
1. 链接去重与台账登记（作者、标题、发布日期、用户确认使用范围）；
2. 取得原片并冻结 SHA256 哈希（存入 `.local/video-intake/<sourceId>/`）；
3. 抽帧定位与逐店拆片（切点、原片封面时间、街区依据与 WGS84 近似规划点）；
4. 跑通首批 2～3 家店的完整闭环（小封面、视频裁剪、地图卡片、直线与沿路拓扑距离）；
5. 制作长沙专属素材包并按规范交接。
