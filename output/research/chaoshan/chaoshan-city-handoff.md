# 食途 · 潮汕城市交付与进展报告 (Chaoshan City Handoff)

- **更新日期**：2026-11-09
- **城市标识**：`chaoshan`（高德城市代码 `440500`）
- **开发分支**：`codex/city-chaoshan-prep`（隔离工作树 `.local/worktrees/chaoshan`）
- **初始化基线**：主分支最新提交 `2fe1e05`（南京城市整合与四城通过检查）
- **当前状态**：第一批首个来源 3 家门店全链路闭环跑通并通过 14 项自动化浏览器与 8 项数据完整性验证。

---

## 1. 第一批首个来源与 3 家闭环门店

### 视频来源
- **来源 ID**：`chaoshan-miaojiang-7661157240087097061`
- **博主**：`喵酱饿了`
- **原标题**：`潮汕太好吃了！4天3晚吃了38顿选出的精髓，特色又好吃！`
- **原网页**：`https://www.douyin.com/video/7661157240087097061`（短链 `https://v.douyin.com/-XV6cMe-S20/`）
- **发布日期**：`2026-09-27`
- **时长**：`265.0s`（H.264 1080×1920 + AAC）
- **原片 SHA256**：`8b31fceed9b5d7bfd0c2753a7902d46f1471fd35d7a8e6b12c1bedf9228899fd`（严格保存在 `.local/video-intake/`，不提交 Git）

### 认店与闭环门店清单
1. **一杯潮茶（小公园店）**
   - 片段 ID：`chaoshan-miaojiang-yibaichaoche`
   - 时间区间：`60.0s - 71.6s`（截取 11.60s）
   - 海报秒数：`64.0s`（实拍汕头小公园骑楼“汕頭”红字标志墙及茶壶盖奶茶）
   - 品类标签：`茶饮 / 鸭屎香单丛`
   - 地址与街区线索：汕头市金平区安平路（小公园中山纪念亭旁）
   - WGS84 规划坐标：`[116.6785, 23.3598]`（`routeEligible: false`，位置大致）
2. **春梅里卤鹅馆（中山路总店）**
   - 片段 ID：`chaoshan-miaojiang-chunmeili`
   - 时间区间：`71.6s - 84.0s`（截取 12.40s）
   - 海报秒数：`80.0s`（近50年老字号，实拍大竹簸箕盛装澄海狮头鹅全拼淋卤汁）
   - 品类标签：`潮汕卤味 / 狮头鹅全拼`
   - 地址与街区线索：汕头市金平区中山路71号（中山路老城区一带）
   - WGS84 规划坐标：`[116.6869, 23.3589]`（`routeEligible: false`，位置大致）
3. **老市区老字号粿汁**
   - 片段 ID：`chaoshan-miaojiang-laoshiquguozhi`
   - 时间区间：`107.5s - 117.0s`（截取 9.50s）
   - 海报秒数：`114.0s`（实拍大铁锅老卤水、手工粿角米浆、卤大肠、卤肉卤蛋配炸蒜）
   - 品类标签：`潮汕传统小吃 / 老式粿汁`
   - 地址与街区线索：汕头市金平区镇邦路老市区美食街
   - WGS84 规划坐标：`[116.6660, 23.3538]`（`routeEligible: false`，位置大致）

---

## 2. 真实底图与真实路网拓扑

1. **Protomaps 矢量底图**：
   - 提取自官方 `build.protomaps.com` 最新版本；
   - 覆盖范围：`[116.55, 23.3, 116.85, 23.72]`（涵盖汕头小公园、龙湖区、礐石大桥、潮州古城牌坊街核心区）；
   - 文件路径：`map-base/data/cities/chaoshan/chaoshan.pmtiles`（6.67 MB，maxzoom 15）；
   - 生成道路索引：`data/cities/chaoshan/roads-index.json`（收录 1,066 条命名道路，包含安平路、镇邦路、中山路、升平路、国平路等）。
2. **真实 OSM 可通行路网拓扑**：
   - 文件路径：`map-base/data/cities/chaoshan/food-road-network.json`（5.48 MB）；
   - 拓扑规模：101,797 个真实节点，23,801 条连通道路；
   - 验证结果：
     - 一杯潮茶 -> 春梅里卤鹅：沿真实路网连通，距离 3,501.0m，39 个拐弯路网节点（`status: 'ready'`）；
     - 老市区老字号粿汁 -> 一杯潮茶：沿真实路网连通，距离 2,254.0m，30 个拐弯路网节点（`status: 'ready'`）；
     - 严禁任何直线乘以系数，断路与连通完全基于物理路网。

---

## 3. 产品交互与视频音轨规范验证

1. **视频浮窗占比**：
   - 地图点击卡片时，平滑展开 `.food-inline-popover`；
   - 测量结果：视频媒体区域占浮窗整体高度的 **69.0%**（占浮窗总面积的 **65.9%**），严格满足至少 2/3 的规范要求。
2. **音轨与播放隔离**：
   - 点击播放时，视频正常解码播放且 currentTime 顺畅前进；
   - 切换到其他门店时，旧音轨与视频立即调用 `video.pause(); video.removeAttribute('src'); video.load()`，旧音轨完全停播且释放资源；
   - 按 `Escape` 键或点击关闭时，浮窗隐藏，音轨即刻停止。
3. **独立美食页面生成**：
   - 生成 `places-chaoshan.html`、`videos-chaoshan.html` 及各门店独立静态详情页；
   - 桌面端（1440×900）与移动端（390×844）排版均适配通过。

---

## 4. 自动化测试报告清单

- 数据完整性自动化核验：`output/research/chaoshan/chaoshan-batch1-qa.json`（8/8 项全部通过）
- 真实浏览器 Playwright 自动化核验：`output/research/chaoshan/chaoshan-browser-qa.json`（14/14 项全部通过）
- 测试截图：
  - `output/research/chaoshan/playwright/popover-chaoshan.png`（3D 地图视频浮窗实测截图）
  - `output/research/chaoshan/playwright/map-chaoshan-desktop.png`（桌面端地图全貌）
  - `output/research/chaoshan/playwright/map-chaoshan-mobile.png`（移动端地图全貌）
  - `output/research/chaoshan/playwright/places-desktop.png`（桌面端门店卡片列表）
  - `output/research/chaoshan/playwright/places-mobile.png`（移动端门店卡片列表）
  - `output/research/chaoshan/playwright/detail-video-yibaichaoche.png`（一杯潮茶独立播放页）

---

## 5. Git 资产边界与提交状态

- **已遵守原则**：
  - 原片 `source.mp4` 与截取切片留在 `.local/`，未进入 Git 跟踪；
  - 仅提交元数据 JSON、小封面海报 JPG（`assets/video-posters/`）与必要代码/脚本；
  - 未覆盖、破坏或修改重庆、长沙、柳州、南京等其他城市的独立数据；
  - 准备提交至独立分支 `codex/city-chaoshan-prep` 并通过 PR 合入。
