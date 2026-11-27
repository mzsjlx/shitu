# 泉州 PR #15 接收端独立复核与合并记录（2026-11-27）

## 结论与合并状态

泉州分支 `codex/city-quanzhou-prep`（最新提交 `f8b107fe2a4ca5ecce14d913805158d9679c97cb`，[PR #15](https://github.com/mzsjlx/shitu/pull/15)）经接收端独立全项复核与 11 城无损合并终检全部通过，已在独立集成 worktree 以标准非快进合并（`37445fb`）合入 `origin/main`。

合入后主线包含 **11 座城市**：重庆、长沙、柳州（51 点版）、南京、潮汕、武汉、郑州、哈尔滨、成都、杭州、泉州。根工作区 `codex/trip-sharing` 与并行城市工作树保持未触碰。

## 复核过程（`e19090f` → `f8b107f`）

1. **首轮独立技术与内容复核（`e19090f`，全部技术项一次 PASS）**：
   - **代码隔离与历史清洁度**：`map-base/src/*` 与既往城市目录 `0` 改动，公共路网脚本 Windows ASCII 相对路径优化单独拆为 `b267fc0`；分支仅新增 `312` 个 Git 对象，`output/research/quanzhou/` 仅 15 个文件、`5.29 MB`（仅标准截图、QA 报告与交接文档，0 抽帧/脚本垃圾）。
   - **冻结路网、OSM 锚点与全连通拓扑**：`map-base/data/cities/quanzhou/food-road-network.json` 精确 `2,526,241` 字节（`.gitattributes` 锁定 LF，SHA256 `f161b01d6b457683a904d373cf969464e2ff6fcc6786587820513568fe5f7dc4`，37,761 节点 / 6,789 条道路）；71/71 已定位片段（**66 处在图美食点**）全部绑定真实整型 OSM `way`/`nodeId`，最大锚点偏距仅 **`102.6m`**，**71/71 100% 落入同一主连通分量 `666649067`**（跨晋江大桥 `2,145/2,145` 对全通）；7 段未定位与 3 段范围外诚实标记 `coordinates: null` 留库。
   - **目录、发布日期与封面完整性**：56 作品 / 49 独立作者 / 81 片段 / 76 去重地点（含 `李大富旋转小火锅` 2 博主、`阿超小排档` 3 博主、`泉州油边王烧烤` 3 博主共 3 处多博主归并）；全部 56 作品发布日期与抖音 ID 时间戳 0 跨年偏差，往年视频 `footageNote` 100% 覆盖；81/81 实拍封面哈希全匹配且 0 孤立封面；`video-library-assets.json` 的 `catalogSHA256` 与 LF 归一化目录完全一致。
   - **公开 Release 112/112 全量比对与 4 包远端实测**：分页核对 [media-2026-11-26-quanzhou](https://github.com/mzsjlx/shitu/releases/tag/media-2026-11-26-quanzhou)（ID `459633772`），**112/112** 附件（56 ZIP + 56 `.zip.json`，`5,271,243,667` 字节）全部 `uploaded`、0 `starter`，与 `media-bundles.json` 56/56 条目字节、服务端 SHA256、片段数 **0 偏差**；接收端远端下载 4 个代表性 ZIP（`qz-wxxin-7698...`、`qz-shuibuzhaojiao-7700...`、`qz-yesoso-7596...`、`qz-miemie-7490...`，共 6 段切片），4/4 本地 SHA256 匹配，6/6 MP4 经 FFprobe 实测均为真实 `h264 + aac`，隔离导入（`3/3/3/7`）、二次重复导入幂等（`newFiles: 0`）与错城 `--city chongqing` 拒绝全部通过。
   - **独立 Playwright 浏览器强断言（11/11 PASS）**：66 张初始 48px 圆点卡片、`amapCityCode: "350500"`；`李大富旋转小火锅` 双博主实播切换（`Wxxin-` `+0.829s` → `睡不着觉` `+0.865s`）+ 切店 `新门街豆浆店`（`+0.869s`）+ `Escape` 关闭均通过旧 `<video>` 引用 `paused === true && !hasSrc` 强断言；未导入 3 博主点 `泉州油边王烧烤` 正常展示 `视频待同步` 与 3 个作者页签；`西街` 道路搜索命中；跨晋江 3 站行程切换 `直线约 12.9 公里` → `沿路约 15.0 公里`；四视口（`1440×960` `0.6677`、`390×844` `0.6667`、`320×680` `0.6667`、`736×414` `0.6684`）与 5 既有城市（重庆/武汉/郑州/哈尔滨/柳州）严格 `>= 2/3` 且零串台，`preview-quanzhou.html`（66 卡）正常，`0 pageerror`。

2. **10 城主线同步与 PR #15 终检（`f8b107f`）**：
   - 分支合入最新 10 城 `origin/main`（`536f346`，含成都 #13、杭州 #14）并创建正式 [PR #15](https://github.com/mzsjlx/shitu/pull/15)（`mergeable: true / clean`，0 冲突，`new_objects=341`）；
   - `cities.json`（11 城，`activeCity: "chongqing"`）、`media-bundles.json`（`417 → 473` 条，13 套 Release，既有 0 丢失/0 篡改）、`video-posters.json`（`1,121 → 1,202` 张，0 丢失/0 篡改）、`.gitattributes`（全 11 城 LF 保留）、`PROJECT-STATUS.md`（纯净 UTF-8，完整保留杭州 #14 与成都 #13）全部无损合并；11 城全局 `686` 来源 / `1,202` 片段 0 冲突；
   - `prepare-food-road-network.py` 与 `review-food-road-source.py` 均保留三城 URL 与跨盘符 `ValueError` 兜底并通过 `py_compile`；
   - 无 `.local` 媒体 11 城干净构建通过（`0 local clips, 1,202 posters`，11 份 `preview-*.html` 齐全，构建后 0 脏文件），`review-quanzhou-data.mjs` **10/10 PASS**；11 城跨城 Playwright 烟测确认泉州（66 卡，`0.6683`）、杭州（82 卡，`0.6677`）、成都（71 卡，`0.6677`）、重庆（81 卡，`0.6682`）下拉 11 城齐全、浮窗严格 `>= 2/3`、`0 pageerror`。

## 验证范围边界

- Release `media-2026-11-26-quanzhou` 的全部 **56 个 ZIP 与 56 份 `.zip.json`**（112/112 `uploaded`）完成了 GitHub API 分页枚举与服务端 SHA256 / 字节数 / 片段集合比对。
- 本地实际远端下载、重算 SHA256、FFprobe 流核验、隔离导入（含重复导入 `newFiles: 0` 与错城拒绝）与浏览器实播覆盖上述 **4 个代表性来源包（6 段切片）**，不冒充对全部 `4.91 GiB` / 56 包完成全量本地下载。
- 接收端临时审计脚本、下载样本与截图留存于本机 `.local/reviews/audit-20261127-qz/`，不随 Git 提交。
