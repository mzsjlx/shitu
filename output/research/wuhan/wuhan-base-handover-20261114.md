# 武汉城市底座就绪与验证报告（2026-11-14）

## 1. 工作区与分支状态

- **根工作区**：`D:\codex\美食网站`（分支 `codex/trip-sharing`，保留未提交修改，未做任何清理或切分支操作）
- **武汉独立工作区**：`D:\codex\美食网站\.local\worktrees\wuhan-prep`
- **武汉工作分支**：`codex/city-wuhan-prep`，基于 `origin/main`（提交 `51f15e5`）创建
- **本地服务**：已在独立端口启动，访问地址 `http://127.0.0.1:8798/?city=wuhan&view=food`

---

## 2. 城市配置与数据底座

### 2.1 城市配置 (`config/cities.json`)
- **城市 ID**：`wuhan`
- **中文名称**：武汉
- **高德行政编码**：`420100`
- **范围 (BBox)**：`[114.18, 30.48, 114.42, 30.64]`（完整覆盖汉口、武昌、汉阳三镇核心区、东湖、王家湾以及长江/汉江各大跨江通道）
- **中心视角**：中心 `[114.305, 30.562]`，缩放 `15.5`，倾角 `52°`，方位角 `-15°`

### 2.2 3D 显示底图 (`data/cities/wuhan/wuhan.pmtiles`)
- **来源**：官方 Protomaps upstream 构建 `20261113.pmtiles`
- **文件大小**：`7,047,532` 字节 (~6.72 MB)
- **文件哈希**：SHA256 `b0af5c1540c3a08bdf07bf5c10b077e0fb6cd023bf4a346fb7173eed83c83cb0`
- **瓦片覆盖**：414/414 目标瓦片 100% 提取
- **道路索引 (`roads-index.json`)**：提取 1,726 组已命名道路，全部位于 BBox 范围内

### 2.3 真实拓扑沿路路网 (`data/cities/wuhan/food-road-network.json`)
- **来源**：Geofabrik 湖北原始 OSM PBF (`hubei-261113.osm.pbf`，大小 `56,423,995` 字节，SHA256 `49ca07434d859a01f5fbaf238558806ea67be0fb3335c53c4bc313a446c5ff6c`)
- **生成脚本**：`scripts/prepare-food-road-network.py --city wuhan`（由 `scripts/prepare-wuhan-road-network.mjs` 封装）
- **文件大小**：`9,640,292` 字节 (~9.19 MB)
- **文件哈希**：SHA256 `6768706cce8b1c9395a78c54f8a034ec781b6abc789e17b8206c7f20f3c0655b`
- **拓扑节点**：`145,114` 个真实 OSM 原始节点（保留 64 位整数 OSM ID）
- **通行路径**：`25,028` 条道路（桥梁、隧道、单行、转向及通行限制完整保留）
- **跨江与城区实测路线（A* 拓扑寻路）**：
  - 汉口万松园 ➔ 江汉路：`2,939 米`
  - 武汉长江大桥跨江通道：`1,612 米`
  - 江汉一桥跨汉江通道：`1,530 米`
  - 武昌粮道街 ➔ 楚河汉街：`3,816 米`

---

## 3. 视频与数据真实性（0 视频如实空状态）

严格遵守规则，绝不伪造虚构店铺、虚假点位或示例视频：
- `map-base/data/cities/wuhan/food-records.json`：`[]`（0 假店）
- `map-base/data/cities/wuhan/video-library.json`：`sources: []`（0 虚构来源）
- `map-base/data/cities/wuhan/video-posters.json`：`segments: {}`（0 虚构封面）
- `map-base/data/cities/wuhan/location-anchors.json`：`anchors: []`（0 虚构锚点）

修复了视频库组件在 0 视频状态下的防御性渲染（`src/video-library.js`），支持安全显示“当前城市暂未收录视频来源。”而不会引发运行时未定义异常。

---

## 4. 全量验证结论

### 4.1 数据一致性审计 (`review-wuhan-data.mjs`)
- 9 项断言全部通过：
  1. `config/cities.json` 包含 `wuhan` 且参数合法
  2. `wuhan.pmtiles` 大小与 SHA256 精确匹配
  3. `data-audit.json` 瓦片覆盖 414/414
  4. `roads-index.json` 1726 条道路均在 BBox 范围内
  5. `food-road-network.json` 包含 145,114 节点、25,028 条道路，桥梁与隧道完整
  6. 跨江及城区 4 条实际路线真实可通，拓扑与距离精确
  7. 武汉数据文件真实保留 0 店铺 0 视频空状态
  8. 全局 `data/video-posters.json` 375 条与构建产物 `dist/data/video-library-assets.json` 470 条全量保留既有城市（重庆、长沙、柳州、南京、潮汕），无覆盖
  9. `npm run build` 构建产物完整包含 6 个城市预览及武汉独立页面

### 4.2 真实浏览器多视口检查 (`review-wuhan-browser.py`)
- 15 项断言全部通过：
  - 桌面端 (1440x900)、手机端 (390x844)、小屏 (320x568)、短横屏 (736x414) 均成功渲染
  - 奶油暖色调 3D 地图正常加载，MapLibre WebGL 上下文稳定无报错
  - 2D/3D 俯仰视角切换动画流畅
  - 搜索栏在底图视图下功能正常
  - 视频库空状态弹窗正常弹出并显示“当前城市暂未收录视频来源。”
  - 单文件打包预览 `dist/preview-wuhan.html` 离线运行完整正常
  - 生成 5 张真实视口截图并已通过视觉比对审查。

---

## 5. 当前已就绪，随时接收首批视频链接

当前工作区和底座环境已完全就绪，可以开始接收首批武汉探店视频链接。
收到链接后将按照规范执行完整链路：
`原页去重 ➔ 取得原片 ➔ 核对作者与日期 ➔ 看门头/字幕/地址卡 ➔ 真实切片 ➔ 提取原片封面 ➔ 街区近似定位 ➔ 浮窗播放验证 ➔ Release 打包与交付`。
