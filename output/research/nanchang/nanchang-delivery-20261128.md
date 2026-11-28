# 南昌（`nanchang`）美食地图扩充交付记录（2026-11-28）

## 1. 城市配置与合并规模（一期 + 二期全量）
- **分支 / 基线 / PR**：`codex/city-nanchang-prep`（基于 `origin/main` 9 城基线 `a13549f`），交付 [PR #16](https://github.com/mzsjlx/shitu/pull/16)
- **城市标识**：`cityId: "nanchang"`，`sourceId` 前缀 `nc-`，`amapCityCode: "360100"`，`activeCity` 保持 `chongqing`
- **底图范围**：`[115.77, 28.58, 116.01, 28.76]`，`center: [115.89, 28.68]`（横跨东湖/西湖老城与红谷滩赣江两岸）
- **全量规模统计**：
  - **作品数**：8（首期 4 + 二期 4）
  - **独立作者数**：8（首期：`番茄酱酱.`、`一坨小草莓`、`演员王迅`、`TC在中国`；二期：`一支凯子`、`Renyi毅哥`、`小魔鱼`、`椰子Ryan`）
  - **片段数**：60（首期 28 + 二期 32；全部实测 FFprobe H.264 + AAC，仓库封面共 60 张）
  - **去重点数**：51（其中 **9 处跨博主同店 `placeId` 归并**：`老南昌白糖糕（大士院）`、`无矾鸡蛋油条（大士院）`、`杨大娘粽子（带子街店）`、`徐氏姐妹老糊羹（带子街珠宝路口）`、`羊子巷199号咖啡`、`羊子巷鸡蛋汉堡`、`细英水酒店（大士院店）`、`春字号·乡野江西菜（万寿宫店）`、`周记生煎（船山店）`；不同分店如 `打平伙（豫章后街店）` 与 `打平伙（红谷滩店）`、`堂瓦里` 与 `南昌里`、`小吴水煮` 与 `小欧水煮` 均独立设点不混并）
  - **在图点数**：40 处去重地点（对应 49 条在图切片，100% 绑定真实整型 OSM `way` 与所属 `nodeId`，`<= 174.3m`，全主分量连通）
  - **范围外与未定位段数**：11（1 处范围外：`熊庆彬小锅小灶（莲塘力高总店）` `[115.929, 28.5407]` `out-of-bounds`；10 段未定位诚实标 `coordinates: null` / `unlocated`：首期 `地铁A口鸡蛋汉堡` 1 段 + 二期 `殷氏无骨鸡柳`、`小时候南瓜饼`、`重庆米发糕`、`Renyi毅哥` 5 段品类指南、`椰子Ryan` 35.7 秒混剪合集 1 段）

## 2. 冻结底图与 OSM 真实路网
- **Protomaps 矢量底图**：`map-base/data/cities/nanchang/nanchang.pmtiles`（`7,251,348` 字节，SHA256 `0da549788f5905b081cdc5b9264dbc1d247a2073bf6ee7eabae9a7968597f28f`），z15 共 `460/460` 瓦片、`2,449` 命名道路分组。
- **Geofabrik 江西省原始 OSM 路网**：来源 `jiangxi-latest.osm.pbf`（快照 `2026-11-25`，SHA256 `e48e9f86a54e2c937c1f60233587e1a76b5f41ec30639cd8700a3afec64ad8cd`），生成 `food-road-network.json`（`8,882,983` 字节，LF，SHA256 `53f64576bcc2a709a22c17cfacbabdcf408067e3f31067b4a8f9c0ce4707852d`，`128,151` 节点 / `25,276` way），`.gitattributes` 已锁定 LF。

## 3. Release 素材包与核验边界
- **一期 Release**：[media-2026-11-27-nanchang](https://github.com/mzsjlx/shitu/releases/tag/media-2026-11-27-nanchang)（ID `460853689`，8/8 `uploaded`，共 `1,186,760,911` 字节，抽样下载 `nc-fanqiejiangjiang` 隔离导入 `newFiles: 35` / 重复 `0`）
- **二期 Release**：[media-2026-11-28-nanchang-batch2](https://github.com/mzsjlx/shitu/releases/tag/media-2026-11-28-nanchang-batch2)（ID `461638914`）
  - **全量 API 核对范围（8/8 附件，见 [release-assets-batch2-20261128.json](release-assets-batch2-20261128.json)）**：分页核对全部 `uploaded`（0 `starter`），总计 `811,183,783` 字节，服务端 SHA256 digest 与 `map-base/data/media-bundles.json`（全库 355 条 / 南昌 8 条）100% 一致：
    - `shitu-media-nc-yizhikaizi-7632259305453915398-20853846b8dcf42c.zip`（`145,939,809` B，10 段）
    - `shitu-media-nc-renyi-7666686014391405833-00a2789e83c27fea.zip`（`193,036,669` B，5 段）
    - `shitu-media-nc-xiaomoyu-7661184284460404411-ec216f7eb7ba6979.zip`（`328,270,646` B，16 段）
    - `shitu-media-nc-yezryan-7683867017498094306-0827441d8f59b1d8.zip`（`143,936,659` B，1 段）
  - **实际远端下载与隔离导入抽样范围**：从二期 Release 实际下载 `nc-yizhikaizi` 包（`145,939,809` B，本地重算 SHA256 `59459001dcd4a3d8292b2eea0c360bd00f398fb5ce6e1900dcc49163daa004bb` 一致），在空 `.local` 隔离目录执行 `media:import -- --city nanchang`：首轮 `clips: 10, newFiles: 21`，重复导入 `newFiles: 0`。其余二期 3 包已完成全量服务端 digest 核对与本地全量剪辑/实播验证，未执行全量 665 MB 远端重下载。

## 4. 自动化与端到端验证结果
- `node scripts/review-nanchang-data.mjs --require-bundles`：**8/8 PASS**
- `python scripts/review-nanchang-browser.py`（[nanchang-browser-qa-20261128.json](nanchang-browser-qa-20261128.json)）：**19/19 PASS**
  - 本机完整导入媒体环境下完成双采样播放推进（`dt >= 0.3s && !paused`）、切店与 `Escape` 保留旧 `<video>` 引用 `&&` 强断言停音、**同店多博主（`老南昌白糖糕（大士院）`：`番茄酱酱.` ↔ `小魔鱼`）切换实播与停音强断言**、跨赣江 3 站「直线 ↔ 沿路」切换、`1440×960` / `390×844` / `320×680` / `736×414` 四视口在屏内且媒体占比 `>= 2/3`、`preview-nanchang.html` 单页包、`videos-nanchang.html`（60 卡片）/ `places-nanchang.html`（51 卡片）及重庆/武汉/郑州跨城零串城验证。
- 无 `.local` 媒体干净临时检出构建（`npm.cmd ci && npm.cmd run build`）：10 城通过，`1,073` 张封面 0 丢失、0 脏文件。
