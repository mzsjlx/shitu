# 成都 PR #13 接收端独立复核与合并记录（2026-11-24）

## 结论与合并状态

成都分支 `codex/city-chengdu-prep`（整改闭环提交 `35551789a462d38f6947b870b4a72496bd7aae49`，[PR #13](https://github.com/mzsjlx/shitu/pull/13)）经两轮接收端独立复核全部通过，已在独立集成 worktree 合入最新 8 城 `origin/main`（`b174b19`）并推送至 PR 分支，供 GitHub `Squash and merge` 合入 `main`（消除早期分支历史中已删除的 335 MB 抽帧对象，保持主线克隆体积精简）。

合入后主线包含 **9 座城市**：重庆、长沙、柳州（51 点版）、南京、潮汕、武汉、郑州、哈尔滨、成都。根工作区 `codex/trip-sharing` 保留原有未提交成果未作改动。

## 复核过程（`66e635e` → `3555178`）

1. **前序复核拦截的 5 项阻塞/收口问题（`66e635e`）**：
   - **P1-1**：Release `media-2026-11-12-chengdu` 当时仅有 83 个 `.zip.json` 摘要和 3 个 `.zip`，而 `media-bundles.json` 登记了全部 82 条 URL（其余 79 条返回 HTTP 404）；
   - **P1-2**：`output/research/chengdu/` 误提交了 2,746 个临时抽帧/分析文件（`335.22 MB`）；
   - **P1-3**：误改了 `map-base/data/cities/liuzhou/video-library-assets.json` 及公共代码 `src/main.js`、`scripts/serve.mjs`、`src/index.html`；
   - **P1-4**：`PROJECT-STATUS.md` 顶部成都段落因反斜杠未转义出现控制字符损坏；
   - **P2**：`review-chengdu.mjs` 切第 2 博主未起播导致 `!oldVideo || oldVideo.paused` 空值假通过，且 `map-base/scripts/` 存在一次性上传脚本及个人本机路径。

2. **整改后接收端独立复核（`3555178`）**：
   - **Release 与索引按方案 B 严密对齐（0 个 404 留库）**：分页核对 [media-2026-11-12-chengdu](https://github.com/mzsjlx/shitu/releases/tag/media-2026-11-12-chengdu)（ID `455246557`），89/89 附件（83 份 `.zip.json` + 6 个真实视频 `.zip`）全部为 `uploaded`、0 `starter`；`media-bundles.json` 仅登记该 6 个已实装包（`cd-bozai`、`cd-chiyou`、`cd-suipo-7516`、`cd-suipo-7657`、`cd-wangxun`、`cd-xixichibupang`），并在 PR 与文档如实说明“首期实装 6/82 包，剩余 76 包待后续分批补传”；
   - **接收端 6/6 全量远端下载与隔离导入**：接收端将全部 6 个已登记 ZIP（合计 `241.42 MB`）远端下载并重算本地 SHA256，6/6 字节与哈希 100% 匹配；隔离目录 `media:import` 首次 `6/6` `newFiles: 3`、二次重复导入 **`6/6` `newFiles: 0`**；
   - **抽帧瘦身、源码还原与文档修复**：`output/research/chengdu/` 已瘦身至 **`3.71 MB`（195 文件）**；`liuzhou/video-library-assets.json`、`src/main.js`、`scripts/serve.mjs`、`src/index.html` 相对基线差异均为 `0`；`PROJECT-STATUS.md` 控制字符清零；`review-chengdu.mjs` 与 `register-all-chengdu-media.mjs` 已按规范修复；
   - **冻结路网 LF、真实 OSM 锚点与全主网连通**：`food-road-network.json`（`3,886,307` 字节，LF，SHA256 `12c1391a...`，53,607 节点 / 12,336 道路），86/86 在图片段真实 OSM 锚点 0 异常，**71/71 在图点 100% 处于同一主连通分量 `4779165773`**（2,485/2,485 对连通，抽样 40/40 A* 路径 `ready`）；30 段未上图（含跨城重庆链接诚实标 `coordinates: null` 留库不造点），往年视频 `footageNote` 覆盖率 100%；
   - **独立浏览器实播与多城隔离（11/11 PASS）**：71 卡片、`amapCityCode: "510100"`、动态下拉正常；连续实播 3 家在图门店（`风骨兔` `+0.82s` → `三道街老宅子肥肠鱼` `+0.88s` → 新上传 `包家兄弟餐馆` `+0.86s` → `Escape`），每次切店与关闭后旧 `<video>` 均 `paused: true && hasSrc: false`；未导入 4 博主合点 `毛记和意冒菜` 如实显示 `视频待同步`；3 站切换 `直线约 7.0 公里` → `沿路约 8.0 公里`；1440 / 390 / 320 / 736 四视口占比 `66.67%–66.84%`（≥ 2/3）且在屏内；重庆(81)/武汉(104)/郑州(140) 0 串台；`preview-chengdu.html` 71 卡，0 页面报错。

3. **9 城主线同步与干净构建复验**：
   - 合入 8 城 `origin/main`（`b174b19`，含哈尔滨 PR #12 与柳州 51 点 PR #9）后，无 `.local` 媒体 9 城干净构建通过，保留全站 **560 个来源 / 1,013 张封面**（`media-bundles.json` 共 347 条有效包 / 11 个 Release，全局 ID 0 冲突，构建后工作区 0 脏文件）。

## 验证范围边界

- Release `media-2026-11-12-chengdu` 的全部 89 个已上传附件完成了 GitHub API 分页核对；`media-bundles.json` 中登记的全部 **6/6** 个成都素材包均已完成远端下载、本地 SHA256 复算、隔离导入、重复导入幂等性与浏览器实播验证。
- 其余 76 个尚未上传 ZIP 的成都来源当前在仓库中仅交付了经校验的 116 张真实原片封面、视频库元数据与定位锚点（页面端如实显示封面、原视频链接与 `视频待同步`），不视同已完成全量视频分发。
- 临时审计脚本、下载文件与截图留存于本机 `.local/reviews/audit-20261124-cd/`，不随 Git 提交。
