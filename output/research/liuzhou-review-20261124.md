# 柳州扩充 PR #9 接收端独立复核与合并记录（2026-11-24）

## 结论与合并状态

柳州扩充分支 `codex/city-liuzhou-batch5-expansion`（最终复核提交 `91a0370a73351555b6de8f6cda56add2cbd37b46`，[PR #9](https://github.com/mzsjlx/shitu/pull/9)）经多轮整改与接收端独立复核通过，已在独立集成 worktree 合并含哈尔滨在内的最新 8 城 `origin/main`（`681ebda`），并以合并提交 `f35fbf4102e899e40094f89463eab558edaf280d` 合入远端 `main`。

主线现包含 **8 座城市**：重庆、长沙、柳州（已由初始 9 点版升级为 **51 在图点 / 64 切片完整版**）、南京、潮汕、武汉、郑州、哈尔滨；仅成都 PR #13 仍处于待补传 Release ZIP 与清理抽帧阶段未合入。根工作区 `codex/trip-sharing` 保留原有未提交成果未作改动。

## 复核过程（`ebc9e44` → `91a0370`）

1. **前序复核拦截的阻塞与细节项（`ebc9e44`）**：
   - **P1 阻塞**：早期提交曾手工修改冻结的 `map-base/data/cities/liuzhou/food-road-network.json`，塞入伪造节点 `9999991` 与单点假路 `way/999999` 供西侧 35 km 范围外门店 `lz-bozai-chongmai` 绑定；
   - **P2 细节**：`video-library.json` 与 `location-anchors.json` 含 10 处 `"None（...参照段）"` 字面量；第 5 批 9 个来源缺 `publishedOn` 及往年视频 `footageNote`；`lz-rourou-xiangxiangji` 原锚点绑在 `access: 'no'` 路段；作者统计未剔除合拍与同博主多作品。

2. **整改后接收端独立复核（`91a0370`）**：
   - **冻结路网与假节点清零**：`food-road-network.json` 与 `food-road-network-manifest.json` 相对 `origin/main` 差异归零（精确 `1,507,824` 字节、SHA256 `746799e71c795341eaa00ca4e840222fd31c42fa26e75ea3643394e4a32ef473`、22,161 节点 / 4,186 道路、`hasCRLF: false`）；假节点 `9999991` 与假道路 `999999` 在全部 JSON 中清零，`lz-bozai-chongmai` 保留真实 WGS84 坐标 `[109.0118, 24.3725]` 与 `routeEligible: false`。
   - **元数据、锚点与连通性**：两份定位 JSON 中 `"None"` 降为 `0`；32 来源 `publishedOn` 缺失数为 `0`（抖音作品雪花 ID 时间戳抽核吻合）；21 段非当年视频 `footageNote` 缺失数为 `0`；63 条在图片段 `planningLocation.anchor` 严查 0 异常（最大偏移 `78.6m`）。全城口径统一为 **32 部作品 / 29 位独立作者 / 64 段切片 / 52 去重地点（51 在图 + 1 范围外待扩图，10 处多博主归并）**。
   - **如实记录部分断路边界**：`lz-rourou-xiangxiangji`（上海家乡鸡新西环店）锚点已改绑开放道路 `way/1075268069 / node/9861771850`（距店 `66.7m`）；但因沿路路由严格按坐标最近源路段吸附、不跨街强移坐标，该店东南 `35.7m` 处为紧邻红岩路封闭段（`access=no`）的独立人行地道 `way/1538446953`（`tunnel=yes`），实际全图连通度为 **50/51 店（1,225/1,275 对）主网直通，该 1 店选入行程时按规范如实提示 `道路暂未连通`**。
   - **Release 全量核对与真实旧包升级验证**：分页核对 [media-2026-11-02-liuzhou](https://github.com/mzsjlx/shitu/releases/tag/media-2026-11-02-liuzhou)（7/7 `uploaded`）与 [media-2026-11-10-liuzhou-batch5](https://github.com/mzsjlx/shitu/releases/tag/media-2026-11-10-liuzhou-batch5)（52/52 `uploaded`），32 个有效来源包全部 `uploaded`、0 `starter`，字节数、服务端 SHA256 digest 与片段计数 0 偏差；前序已在独立沙箱实测“旧主线 7 包 9 段（含 1 段汤氏熊）→ 切新分支导入 3 段新版汤氏熊增量写入 `newFiles: 4` → 二次导入 `newFiles: 0`”，并在 `91a0370` 重新导入 `lz-liuyuxin`、`lz-tangshixiong`（3 段版）、`lz-wangzulan` 共 3 包 10 段，重复导入 3/3 `newFiles: 0`。
   - **独立浏览器实测（11/11 PASS）**：51 卡片、`amapCityCode: "450200"`、运行时 `0` 处 `None`；`阿娇特色炒螺蛳` 双采样推进 `+0.83s`、`Escape` 停播清 `src`；`张记玉米汁` 跨博主切换（王祖蓝 → 刘雨鑫JASON，显示 2023 年份提示）双端推进 `+0.86s / +0.85s` 且切换/关闭均 `paused: true && hasSrc: false`；3 站连通路线切换 `直线约 11.2 公里` → `沿路约 12.5 公里`，加入 `上海家乡鸡新西环店` 如实提示 `1 段道路暂未连通`；1440 / 390 / 320 / 736 四视口占比 `66.67%–66.84%`（≥ 2/3）且在屏内；重庆(81)/武汉(104)/郑州(140) 0 串台；`preview-liuzhou.html` 51 卡，0 页面报错。

3. **8 城主线集成与干净构建复验（`f35fbf4`）**：
   - 在独立集成 worktree（`.local/worktrees/liuzhou-integration`）按城市与 ID 合并 `.gitattributes`、`PROJECT-STATUS.md`、`map-base/data/media-bundles.json`（保留其余 7 城全部 309 条来源索引，柳州去重收敛为与 `video-library.json` 严格一一对应的 32 条有效来源索引，全站达 **341 条来源包 / 10 个 Release**；`video-posters.json` 达 **802 条非重庆封面**，全站 8 城总封面达 **897 张**）。

## 验证范围边界

- 32 个柳州来源包完成了全量 GitHub API 分页核对、上传状态与服务端 SHA256 digest 比对。
- 实际远端下载、旧版 `1 → 3` 段平滑升级、重复导入幂等性与浏览器真实播放验证覆盖代表性素材包（含 `lz-tangshixiong` 旧/新双包、`lz-wangzulan`、`lz-liuyuxin` 等）；未在本轮接收端重复下载全部 32 包全量 5+ GB 字节。
- 临时审计脚本与截图留存于本机 `.local/reviews/audit-20261124-lz/`，不随 Git 提交。
