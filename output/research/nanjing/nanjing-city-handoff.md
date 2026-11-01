# 食途 · 南京城市制作接手与基础初始化报告

日期：2026-11-01  
负责城市：南京（`nanjing`）  
当前工作分支：`codex/city-nanjing-prep`（基于 `origin/main` 提交 `95c88b8` 创建的独立 worktree 工作区 `.local/worktrees/nanjing`）  
协作隔离说明：
- 重庆：主分支及 `codex/trip-sharing` 分支保留重庆既有成果与未提交工作，互不干扰；
- 长沙：`codex/city-changsha-prep`（`.local/worktrees/changsha`）独立制作，互不影响；
- 南京：本工作区全权负责，采用独立数据目录 `map-base/data/cities/nanjing/` 与独立研究目录 `output/research/nanjing/`。

---

## 1. 城市配置与地理边界

- **城市标识**：`nanjing`
- **中文名称**：南京
- **所属省份**：江苏省
- **高德城市代码（amapCityCode）**：`320100`
- **核心城区坐标范围（WGS84 Bounds）**：
  `[118.70, 31.98, 118.88, 32.12]`（涵盖玄武湖、秦淮河、新街口、老门东及钟山周边商圈，跨度约 17.1 × 15.6 公里）
- **地图默认中心点（Center）**：`[118.796, 32.058]`
- **视角配置**：Zoom 15.5，Pitch 52°，Bearing -15°，MinZoom 12.0，MaxZoom 19

---

## 2. 独立数据目录与骨架文件清单

已在 `map-base/data/cities/nanjing/` 目录下完成骨架初始化：

1. **`city-profile.json`**：
   - 记录南京城市元数据、核心范围、高德代码、多博主归并策略与数据文件映射；
2. **`video-library.json`**：
   - 遵从规范的视频资料库骨架，`schemaVersion: 1`，`city: "nanjing"`，`rights.status: "user-confirmed"`，待录入第一批探店视频；
3. **`video-posters.json`**：
   - 片段真实画面封面索引骨架，`schemaVersion: 1`，`segments: {}`；
4. **`food-records.json`**：
   - 静态美食记录骨架，`schemaVersion: 1`，`city: "nanjing"`，`records: []`；
5. **`map-base/config/cities.json`**：
   - 登记 `nanjing` 城市节点，`status: "in-preparation"`；保留 `activeCity: "chongqing"` 与重庆现有完整配置，无任何破坏性改动。

---

## 3. 严格遵守的视频与地理资产协作规范

1. **真实性第一**：
   - 仅整理用户明确提供的探店视频链接；
   - 完整保留原平台（抖音）、作者、原帖链接（规范作品页与短链）和作品时长；
   - 封面必须截取自原视频对应的真实画面，严禁使用 AI 菜品图冒充实拍。
2. **严禁造点与串城**：
   - 仅限南京本地且具备可信街区/门牌依据的门店才进行 WGS84 规划坐标落点（`approximate-planning`）；
   - 绝不随机在城市中心或政府大楼造点；
   - 缺乏足够地理线索或非南京本地视频，诚实归档在 `video-library.json`，不上地图 Marker。
3. **支持多博主同店归并**：
   - 同一家店（相同分店）被多位博主探访时，通过相同的 `placeId` 归并为一个地图 Marker；
   - 地图浮窗内保留各自博主片段，支持顺畅切换，并严格在换店/换博主/关闭时卸载停止前一个音轨。
4. **大文件严格隔离**：
   - 原片与剪辑 MP4 一律存放在 `.local/video-intake/` 与 `.local/video-clips/` 隔离环境，严禁提交进 Git；
   - Git 仅跟踪数十 KB 的小封面 JPG（`map-base/assets/video-posters/<sourceId>/`）与 JSON 元数据。
5. **多城市代码解耦**：
   - `validateVideoLibrary(data, expectedCity)` 支持参数化多城校验；
   - `amapSearchUrl(name, cityCode)` 适配各城专属代码（南京 `320100`）；
   - 严禁全局查找替换或破坏其他城市的既有资产。

---

## 4. 下一步工作（Ready for Batch 1）

基础环境与文件骨架初始化已完成并通过语法和校验检查，等待用户发送第一批南京探店视频链接。
收到链接后将按规范流水线推进：
`链接去重与元数据校验 -> 原片获取与SHA256固化 -> 门头字幕抽帧与门店切点划分 -> 原片高清封面截取 -> 街区规划坐标核实 -> 写入视频库与封面索引 -> 准备南京底图与离线切片`。
