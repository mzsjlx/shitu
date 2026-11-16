# 郑州城市开工与底图路网交付报告（2026-11-16）

## 1. 交付结论

根据“食途”多城市架构规范与用户明确指令，在独立工作区 `.local/worktrees/zhengzhou-prep`（工作分支 `codex/city-zhengzhou-prep`，基于最新 `origin/main` 提交 `51f15e5`）下，已完整完成郑州城市接入、3D 开放底图提取、真实 OSM 拓扑路网生成、地形瓦片缓存、前端路由与城市切换适配、无媒体干净构建以及全端自动化回归验证：

- **0 虚构商家、0 假视频**：视频库 `map-base/data/cities/zhengzhou/video-library.json` 保持干净规范初始基线（`sources: []`），严格等待用户提供首批视频链接；
- **真实开放 3D 底图就绪**：基于官方 Protomaps 20261116 源提取郑州核心城区 `[113.58, 34.7, 113.78, 34.83]` 矢量瓦片，涵盖二七广场、健康路、国贸360、顺城街、CBD 等核心商圈；
- **原始 OSM 节点拓扑路网**：基于 2026-11-16 河南 Geofabrik OSM PBF，提取 64,780 个真实节点与 10,536 条道路，`.gitattributes` 固定 LF，二七广场到人民路、花园路真实测通；
- **全链路无媒体构建**：`npm.cmd run build` 成功编译六大城市（重庆、长沙、柳州、南京、潮汕、郑州），既有城市 470 张海报 100% 完整保留，产出 `preview-zhengzhou.html`；
- **真机多视口渲染无瑕疵**：Playwright 真实浏览器 12/12 自动化断言全部 PASS，四套端截图（桌面 1440、手机 390、小屏 320、横屏 736）视觉核验通过；
- **服务已就绪**：本地 HTTP 预览运行于独立端口 8796，未占用或冲突其他端口。

---

## 2. 郑州地理与数据资产清单

| 资产项 | 文件路径 | 规格与关键指标 | 校验 SHA256 / 状态 |
| --- | --- | --- | --- |
| 城市配置 | `map-base/config/cities.json` | 包含郑州完整字段，保留 chongqing/changsha/liuzhou/nanjing/chaoshan | 已合并 |
| 城市档案 | `map-base/data/cities/zhengzhou/city-profile.json` | 范围 `[113.58, 34.7, 113.78, 34.83]`，中心 `[113.665, 34.753]` | 已入库 |
| 矢量底图 | `map-base/data/cities/zhengzhou/zhengzhou.pmtiles` | 4,171,880 字节，285 张 z15 瓦片，19,245 栋三维建筑 | `d0c92b0598b8549627aaea9d0919efe348d9166e5242eebc538c6dde52c99a71` |
| 底图清单 | `map-base/data/cities/zhengzhou/source-manifest.json` | 上游来源 `https://build.protomaps.com/20261116.pmtiles` | 校验一致 |
| 瓦片审计 | `map-base/data/cities/zhengzhou/data-audit.json` | 285/285 瓦片全量呈现，4,139 条道路线段，19,245 建筑足迹 | 检查全过 |
| 瓦片元数据 | `map-base/data/cities/zhengzhou/tile-metadata.json` | 官方 pmtiles 元数据 | 提取完整 |
| 道路索引 | `map-base/data/cities/zhengzhou/roads-index.json` | 164,460 字节，625 个道路名称分组（含二七路、人民路、花园路、文化路、金水路、健康路等） | 检查全过 |
| 真实路网 | `map-base/data/cities/zhengzhou/food-road-network.json` | 4,184,356 字节，64,780 原始节点，10,536 道路 | `42840c5cecc8a4a9e973c9f9893d81bba134d406c1e60869b4a46bda5525f70e` |
| 路网清单 | `map-base/data/cities/zhengzhou/food-road-network-manifest.json` | 来源 Geofabrik 河南，源哈希 `a741ad25...`，严格保留原始节点顺序 | 校验一致 |
| 地形数据 | `map-base/data/cities/zhengzhou/terrain/{z}/{x}/{y}.png` | 97 张 Terrarium DEM PNG 瓦片（z11-z13），共 2,259,260 字节 | 校验一致 |
| 地形清单 | `map-base/data/cities/zhengzhou/terrain-manifest.json` | 97 张瓦片逐项登记 SHA256 与坐标 | 校验一致 |
| 视频目录 | `map-base/data/cities/zhengzhou/video-library.json` | 初始基线：`sources: []`，通过 `validateVideoLibrary` 校验 | 0 虚构点 |
| 门店记录 | `map-base/data/cities/zhengzhou/food-records.json` | 空候选记录：`records: []` | 干净基线 |
| 换行规则 | `.gitattributes` | 补齐郑州路网及清单 `text eol=lf`，杜绝 Windows CRLF 字节偏差 | LF 保证 |

---

## 3. 验证结果与复现命令

### 3.1 数据与拓扑回归（9/9 PASS）
命令：
```powershell
Set-Location "D:\codex\美食网站\.local\worktrees\zhengzhou-prep\map-base"
node scripts/review-zhengzhou-data.mjs
```
测试项：
1. `config/cities.json` 包含有效郑州配置并完整保留 5 个已有城市；
2. `zhengzhou.pmtiles` 存在且大小、SHA256 与 `source-manifest.json` 精确匹配；
3. `data-audit.json` 验证 285/285 张瓦片全部提取完毕，无缺失；
4. `roads-index.json` 包含 625 组道路索引且全部在边界内；
5. `food-road-network.json` 64,780 节点、10,536 条道路，大小哈希与 manifest 一致，严格 LF 换行；
6. `terrain-manifest.json` 与 97 张 DEM 瓦片存在且哈希无偏差；
7. `food-road-router` 真实计算二七广场到大上海城、国贸360到农科路实际连通路线，超距孤立点正确返回空；
8. `video-library.json` 格式通过 `validateVideoLibrary`，0 虚构商家；
9. `allCityCatalogs` 跨 6 城市全局扫描通过，0 来源/片段 ID 冲突。

### 3.2 浏览器端到端与多视口真机验证（12/12 PASS）
命令：
```powershell
Set-Location "D:\codex\美食网站\.local\worktrees\zhengzhou-prep\map-base"
python scripts/review-zhengzhou-browser.py
```
测试项与实测结果：
1. 页面标题为 `食途 · 郑州地图`，`#status` 正确显示 `郑州地图已展开`；
2. 城市切换器包含全部 6 个城市（重庆、长沙、柳州、南京、潮汕、郑州）；
3. 当前城市选择器处于 `zhengzhou`；
4. 搜索框 placeholder 为 `找一条路，开始逛郑州`；
5. 初始上图美食卡片数为 0（干净基线等待用户提供视频）；
6. 搜索框输入“二七”，实时返回郑州真实道路“二七广场隧道”、“二七路”等选项；
7. 桌面端 1440×960 截图保存并核实（二七商圈三维建筑、金水河绿带渲染优美）；
8. 移动端 390×844 截图保存并核实（控件、底栏、搜索框布局无遮挡）；
9. 小屏 320×680 截图保存并核实；
10. 短横屏 736×414 截图保存并核实；
11. 城市切换回归：切至重庆，标题切换且重庆卡片正常展示；
12. 切回郑州：状态严格隔离，无幽灵卡片或重庆残留图层。

---

## 4. 预览与访问

- 运行端口：**`8796`**（独立启动，未占用 8798 武汉服务）
- 美食地图预览：`http://127.0.0.1:8796/?city=zhengzhou&view=food`
- 单文件集成版：`http://127.0.0.1:8796/preview-zhengzhou.html`
- 服务健康检查：`http://127.0.0.1:8796/__foodcity_health`

---

## 5. 下一步工作（视频入库闭环）

在用户提供郑州探店视频链接后，严格遵循标准流程：
1. 链接去重与原页确认（抖音规范原页及稳定作品 ID）；
2. 原片下载到 `.local/video-intake/<sourceId>/source.mp4` 并冻结 SHA256；
3. 抽帧并回看门头、字幕、片尾地址卡与原音；
4. 按店剪辑（精确起止秒与封面秒），提取真实小封面至 `assets/video-posters/<sourceId>/`；
5. WGS84 街区大致坐标关联，同分店多博主共用 `placeId` 归并；
6. 接入 `map-base/data/cities/zhengzhou/video-library.json`；
7. 执行真实播放测试（1秒双采样推进、换片停旧音、浮窗边框面积 $\ge 2/3$）；
8. 打包发布独立郑州 Release 并追加 `media-bundles.json`。
