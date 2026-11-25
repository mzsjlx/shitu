# 哈尔滨 PR #12 接收端独立复核与合并记录（2026-11-23）

## 结论与合并状态

哈尔滨分支 `codex/city-harbin-prep`（最终复核提交 `0c9ae1bea9f6aaac007f25a6c94e415f4f821ead`，[PR #12](https://github.com/mzsjlx/shitu/pull/12)）经接收端独立复核全部通过，已以合并提交 `3f52b161f74049ed54a5b4efb67896e5dc85707b` 合入远端 `main`。

主线现包含 **8 座城市**：重庆、长沙、柳州（初始 9 点版）、南京、潮汕、武汉、郑州、哈尔滨。柳州扩充 PR #9 与成都 PR #13 本轮仍处于整改复核中，未合入。根工作区 `codex/trip-sharing` 保留原有未提交成果未作改动。

## 独立复核记录（`0c9ae1b`）

1. **主线合并、全局索引与干净构建**：
   - 相对 7 城主线（`26bd02f`）0 合并冲突，GitHub PR #12 `mergeable_state: clean`；未修改任何非哈尔滨城市的 `video-library-assets.json` 或 `map-base/src/*`；
   - 全局 `media-bundles.json`（253 → 316，+63 哈尔滨）与 `video-posters.json`（680 → 747，+67 哈尔滨）对既有 7 城 0 丢失 0 篡改；
   - 公共脚本改动两处均已审验：`build-video-library.mjs` 防止无媒体构建覆写源码目录中已存在的非重庆 `video-library-assets.json`（同时正常输出至 `dist/`），`prepare-terrain.py` 增加 DEM 下载重试；
   - 无 `.local` 媒体的独立 worktree 中 `npm ci && npm run build` 干净通过，生成 8 城 `preview-*.html`（`preview-harbin.html` 12.07 MB），保留全量 **842 张封面**（含哈尔滨 67 张）。

2. **冻结路网 LF、真实 OSM 锚点与全连通性**：
   - `.gitattributes` 锁定哈尔滨及既有城市冻结路网 LF；Windows 全新检出 `food-road-network.json` 精确 `1,919,139` 字节、`hasCRLF: false`，SHA256 `f6c71632cf6e4e1373d4ea3ea08c25627bc8ce244f05a458e3beae5aff3839d5` 与 manifest 完全一致；
   - 源于真实 `heilongjiang-latest.osm.pbf`（27,124 节点 / 5,944 道路，0 小整数合成 ID，0 单节点道路）；
   - 全量 67 段 `planningLocation.anchor` 严查 0 异常（全部为真实整型 `osm-way` 与所属 `way.nodes` 中的 `nodeId`，`nodeId !== wayId`，无 `None`/`road:*`，最大偏移 `125.8m`）；
   - 54/54 在图地标全部落入主连通分量 `334304160`，穷举全城 **1,431/1,431 对（100%）A* 路径 `ready`**（0 不可达，最大吸附 `44.81m`）；
   - 台账统计：63 来源 / 49 独立作者 / 67 片段（统一 12.0 秒高光预览切片，完整原片封存于 Release ZIP `source.mp4`）/ 54 在图地标（5 处多博主归并：道里菜市场 6、红专街早市 4、安静街早市 4、胖姐涮肚 2、张飞扒肉 2），0 范围外、0 未定位、0 重复 URL、0 缺 `publishedOn`、0 往年视频缺 `footageNote`。

3. **Release 126/126 全量分页核对 + 远端抽样导入**：
   - 分页查询 [media-2026-11-17-harbin](https://github.com/mzsjlx/shitu/releases/tag/media-2026-11-17-harbin)（ID `454543152`）：**126/126 附件全部 `uploaded`、0 `starter`**（63 ZIP + 63 `.zip.json`，合计 `6,709,064,690` 字节）；63/63 条目的文件名、URL、字节、服务端 SHA256 digest 与 `clips` 计数 0 偏差；
   - 接收端实际从远端下载 3 个 ZIP（`hb-nangci` 9.98 MB、`hb-kanqiuzugeju` 39.33 MB、`hb-lige` 2 切片 76.73 MB，共 4 段切片），字节与本地重算 SHA256 100% 一致；隔离 `media:import` 首次 `newFiles: 3 / 3 / 5`，重复导入 **3/3 `newFiles: 0`**；导入后构建产出 `harbin: 4 local clips, 67 posters` 且 `git status` 保持纯净。

4. **独立浏览器实播与跨城隔离（11/11 PASS）**：
   - 54 卡片、`amapCityCode: "230100"`、8 城下拉选择、`buildings-detail-3d` 与 `hill-shade` DEM 正常加载；
   - 道里菜市场 6 博主浮窗：`给我囊次一口` 双采样推进 `+0.83s` → 切同店 `看球组个局` 旧 `<video>` `paused: true && hasSrc: false` → 新博主推进 `+0.86s` → 切店 `凯奇清真` 旧 `<video>` `paused: true && hasSrc: false` → 新店推进 `+0.85s` → `Escape` 关闭 `paused: true && hasSrc: false`；
   - 未导入点 `笨锅铁锅炖大鹅` 如实显示 `视频待同步` 与年份提示；
   - 3 站行程切换：`直线约 9.5 公里` → `沿路约 11.9 公里`；
   - 1440 / 390 / 320 / 736 四视口 6 博主浮窗媒体面积占比均为 `66.67%–66.84%`（≥ 2/3）且完全在屏内；重庆(81)/武汉(104)/郑州(140) 0 串台；`preview-harbin.html` 渲染 54 张卡片；0 页面报错。

5. **合入顺手收口（紧随合并提交）**：
   - 从 Git 树移除已加 `.gitignore` 的 `output/research/harbin/frames/` 临时抽帧排查目录（401 个文件，21.83 MB）与 8 张不再被索引的旧哈希孤儿封面；
   - 同步更新 `PROJECT-STATUS.md` 顶部 8 城基线记录与 `CITY-AGENT-STARTER.md` 城市状态表，并在清理后于独立无媒体集成 worktree 重新通过 8 城干净构建（842 张封面全部保留）。

## 验证范围边界

- 63 个远端素材包（126 附件）完成了全量 GitHub API 分页核对、上传状态与服务端 SHA256 digest 逐项比对。
- 实际远端下载、本地重算 SHA256、隔离导入、重复导入幂等性与真实视频播放验证覆盖上述 3 个代表包共 4 段切片；未声称重新下载全量 6.71 GB 或播放全部 67 段，亦未测试旧包覆盖升级路径。
- 临时审计脚本、下载抽样与截图留存于本机 `.local/reviews/audit-20261123-hrb/`，不随 Git 提交。
