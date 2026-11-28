# 南昌（`nanchang`）美食地图首期交付记录（2026-11-28）

## 1. 城市配置与地理规模
- **分支 / 基线**：`codex/city-nanchang-prep`（基于 `origin/main` 9 城基线 `a13549f`）
- **城市标识**：`cityId: "nanchang"`，`sourceId` 前缀 `nc-`，`amapCityCode: "360100"`，`activeCity` 保持 `chongqing`
- **底图范围**：`[115.77, 28.58, 116.01, 28.76]`，`center: [115.89, 28.68]`（横跨东湖/西湖老城与红谷滩赣江两岸）
- **规模统计**：
  - **作品数**：4
  - **独立作者数**：4（`番茄酱酱.`、`一坨小草莓`、`演员王迅`、`TC在中国`）
  - **片段数**：28（全部实测 FFprobe H.264 + AAC）
  - **去重点数**：28（其中 0 处跨博主归并；`堂瓦里` 与 `南昌里·老街南昌味` 实拍核对为不同门店，未强行归并）
  - **在图点数**：26（100% 绑定真实整型 OSM `way` 与所属 `nodeId`，`<= 174.3m`，全主分量连通）
  - **范围外与未定位段数**：2（1 处范围外：`熊庆彬小锅小灶（莲塘力高总店）` `[115.929, 28.5407]` `out-of-bounds`；1 处未定位：`地铁A口鸡蛋汉堡` `coordinates: null` `unlocated`）

## 2. 冻结底图与 OSM 真实路网
- **Protomaps 矢量底图**：`map-base/data/cities/nanchang/nanchang.pmtiles`（`7,251,348` 字节，SHA256 `0da549788f5905b081cdc5b9264dbc1d247a2073bf6ee7eabae9a7968597f28f`），z15 共 `460/460` 瓦片、`2,449` 命名道路分组。
- **Geofabrik 江西省原始 OSM 路网**：来源 `jiangxi-latest.osm.pbf`（快照 `2026-11-25`，SHA256 `e48e9f86a54e2c937c1f60233587e1a76b5f41ec30639cd8700a3afec64ad8cd`），生成 `food-road-network.json`（`8,882,983` 字节，LF，SHA256 `53f64576bcc2a709a22c17cfacbabdcf408067e3f31067b4a8f9c0ce4707852d`，`128,151` 节点 / `25,276` way），`.gitattributes` 已锁定 LF。

## 3. Release 素材包与核验边界
- **Release**：[media-2026-11-27-nanchang](https://github.com/mzsjlx/shitu/releases/tag/media-2026-11-27-nanchang)（Release ID `460853689`）
- **全量 API 核对范围（8/8 附件）**：分页查询全量资产均为 `uploaded`（0 `starter`），总计 `1,186,760,911` 字节，服务端 SHA256 digest 与 `map-base/data/media-bundles.json`（4 条南昌条目）及 `.zip.json` 100% 一致：
  - `shitu-media-nc-fanqiejiangjiang-7620293280337585536-d3b95f5b1a617441.zip`（`215,007,666` B，17 段）
  - `shitu-media-nc-yituoxiaocaomei-7370304732994342181-f2edaeb0fdb30aaf.zip`（`270,030,821` B，9 段）
  - `shitu-media-nc-wangxun-7672572030960536875-6a74f54f34370cfb.zip`（`270,846,008` B，1 段）
  - `shitu-media-nc-tczhongguo-7662692018056957234-005f3825bf97152a.zip`（`430,876,416` B，1 段）
- **实际远端下载与隔离导入抽样范围**：从 Release 实际下载 `nc-fanqiejiangjiang` 包（`215,007,666` B，本地重算 SHA256 一致），在独立空目录执行 `media:import -- --city nanchang`：首轮导入 `clips: 17, newFiles: 35`，重复导入 `newFiles: 0`。其余 3 包已完成服务端全量 digest 核对与本地全量剪辑/实播验证，尚未执行全量 1.11 GiB 远端重下载。

## 4. 自动化与端到端验证结果
- `node scripts/review-nanchang-data.mjs --require-bundles`：**8/8 PASS**
- `python scripts/review-nanchang-browser.py`（[nanchang-browser-qa-20261127.json](nanchang-browser-qa-20261127.json)）：**18/18 PASS**
  - 本机完整导入媒体环境下完成真实播放双采样推进（`dt >= 0.3s && !paused`）、切店与 `Escape` 保留旧 `<video>` 引用 `&&` 强断言停音、跨赣江 3 站「直线 ↔ 沿路」切换、`1440×960` / `390×844` / `320×680` / `736×414` 四视口在屏内且媒体占比 `>= 2/3`、`preview-nanchang.html` 单页包、`videos-nanchang.html` / `places-nanchang.html` 及重庆/武汉/郑州跨城零串城验证。
- 无 `.local` 媒体干净新检出构建（`npm.cmd ci && npm.cmd run build`）：10 城通过，`1,041` 张封面 0 丢失、0 脏文件。
