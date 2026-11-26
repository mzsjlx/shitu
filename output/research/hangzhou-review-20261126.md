# 杭州 PR #14 接收端独立复核与合并记录（2026-11-26）

## 结论与合并状态

杭州分支 `codex/city-hangzhou-prep`（整改闭环提交 `52c90238b0b6648a6a7ce7471ab4304980a45851`，[PR #14](https://github.com/mzsjlx/shitu/pull/14)）经两轮接收端独立复核全部通过，已在独立集成 worktree 以标准非快进合并（`b98269c`）合入 `origin/main`。

合入后主线包含 **10 座城市**：重庆、长沙、柳州（51 点版）、南京、潮汕、武汉、郑州、哈尔滨、成都、杭州。根工作区 `codex/trip-sharing` 及并行城市 worktree 均保留原有状态未作改动。

## 复核过程（`abf5237` → `52c9023`）

1. **首轮复核拦截的问题（`abf5237`）**：
   - **P1-1（公共源码改动引入浮窗比例退化与单文件回退）**：`abf5237` 修改了 `map-base/src/` 下 5 个公共文件，其中 `FoodPopover` 在入场 `scale(.97)` 阶段改用 `getBoundingClientRect()` 量取详情高度并写回未缩放的 `media.style.height`，导致首次展开浮窗媒体占比降至 `0.6647`（低于严格 `2/3 = 0.6667` 红线），同时移除了 `preview-*.html` 在本地 HTTP 服务下的内嵌回退逻辑；
   - **P1-2（需同步最新 9 城主线）**：分支当时基于 8 城 `b174b19`，尚未合入成都 PR #13（`a13549f`）；
   - **P2（元数据与脚本收尾）**：4 部往年视频（特厨隋卞 2023 楼外楼、宥宥/一支凯子/大专厨子 2025 原片）发布年份误写为 `2026`；`三特还在吃` 原片无音轨流未注明；交接文档 5 处同店归并名单有 2 处旧名未更新；`map-base/scripts/` 残留 10 个一次性批处理脚本。

2. **整改后接收端独立复核（`52c9023`）**：
   - **公共源码 100% 还原与 10 城无冲突合并**：`git diff origin/main HEAD -- map-base/src/` 输出为空（0 行差异）；与 9 城 `origin/main`（`a13549f`）合并 0 冲突，分支仅新增 `1,069` 个 Git 对象，无过程抽帧膨胀；`map-base/scripts/` 一次性过程脚本已全部移除；
   - **10 城全局索引零丢失与 ID 唯一性**：`config/cities.json` 保持 `activeCity: "chongqing"` 且既有 9 城配置 0 改动；全局 `data/media-bundles.json` 由 `347 → 417` 条（12 套 Release，既有 347 条 0 丢失/0 篡改 + 杭州 70 条）；全局 `data/video-posters.json` 汇总 **1,121 张**（补齐长沙 95 张全局同步 + 新增杭州 108 张，既有条目 0 丢失）；10 城累计 `630` 个 `sourceId`、`1,121` 个 `segmentId` 全局唯一（0 冲突）；
   - **冻结路网 LF、真实 OSM 锚点与主连通拓扑**：`map-base/data/cities/hangzhou/food-road-network.json` 精确为 `7,243,708` 字节（`.gitattributes` 锁定 LF，SHA256 `b46bc7b76dedba95f6bbac77e9da780617033ebf8b73d779390317a49067b0bf`，101,677 节点 / 23,386 条道路）；`review-hangzhou-data.mjs --no-local-videos` 10/10 PASS，86/86 在图片段使用有效整型 OSM `way` 与 `nodeId`（偏距 ≤ 250m），**82/82 在图去重点 100% 落入同一主连通分量 `26202712`**（3,321/3,321 对全通）；21 处萧山/余杭/西溪外围门店（22 段）如实保留真实 WGS84 坐标并标记 `routeEligible: false`；
   - **往年日期、无音轨说明与交接台账对齐**：全量 70 部作品 `publishedOn` 与抖音作品 ID 时间戳 0 跨年偏差（楼外楼 `2023-07-27` 等均已恢复真实日期与年份提示），`hz-santehaizaichi-7632141705400438382` 已注明“原片本身无音轨流”，交接文档 5 处跨博主归并台账与实际数据完全一致，`output/research/hangzhou/` 总体积仅 `2.79 MB`；
   - **Release 全量核对与远端抽样导入**：分页核对公开 Release [media-2026-11-25-hangzhou](https://github.com/mzsjlx/shitu/releases/tag/media-2026-11-25-hangzhou)（ID `457697401`），**140/140** 附件（70 ZIP + 70 `.zip.json`，合计 `7,372,519,822` 字节）全部为 `uploaded`、0 `starter`，与 `media-bundles.json` 70/70 条目的字节数、服务端 SHA256、片段数 **0 偏差**；接收端远端下载 6 个真实 ZIP（`hz-gmnini`、`hz-dadadawanzi`、`hz-santehaizaichi`、`hz-makeganfan`、`hz-mailejin`、`hz-zhanbaobaobao`，共 7 段切片），重算本地 SHA256 与 FFprobe 流参数完全一致，隔离导入与二次重复导入（`newFiles: 0`）通过；无媒体与含抽样媒体的 10 城构建均通过且工作区保持 `0` 脏文件；
   - **独立浏览器 E2E 强断言（12/12 PASS）**：82 张初始 48px 圆点卡片、`amapCityCode: "330100"`、10 城下拉齐全；`归禾小馆` 双博主实播切换（`Gmnini` `+0.84s` → `大大大丸子` `+0.85s`）+ 切店至 `Mokpo·木浦·韩式料理`（`+0.86s`）+ `Escape` 关闭，三次均通过旧 `<video>` 引用 `paused === true && !hasSrc` 强断言；未导入店 `无名氏面馆` 正常显示 `视频待同步`；`楼外楼` 正常显示 `2023年原视频实拍片段`；搜索 `延安路` 命中，3 站行程切换 `直线约 1.5 公里` → `沿路约 2.0 公里`；四视口（`1440×960` `0.6677`、`390×844` `0.6667`、`320×680` `0.6667`、`736×414` `0.6684`）及跨城抽检重庆（81 卡，`0.6682`）、武汉（104 卡，`0.6677`）、郑州（140 卡，`0.6683`）、成都（71 卡，`0.6677`）浮窗媒体面积占比均严格满足 `>= 2/3` 且 `saved` 零串城；`preview-hangzhou.html` 独立渲染 82 卡正常，全程 `0 pageerror`。

## 验证范围边界

- Release `media-2026-11-25-hangzhou` 的全部 **70 个 ZIP 与 70 份 `.zip.json`**（140/140 `uploaded`）已完成 GitHub API 分页枚举与服务端 SHA256 / 字节数 / 片段集合比对。
- 本地实际远端下载、重算 SHA256、FFprobe 流核验、隔离导入（含重复导入 `newFiles: 0`）与浏览器实播覆盖上述 **6 个代表性来源包（7 段切片）**，不冒充对全部 7.37 GB / 70 包完成全量本地下载。
- 接收端临时审计脚本、下载样本与截图留存于本机 `.local/reviews/audit-20261126-hz/`，不随 Git 提交。
