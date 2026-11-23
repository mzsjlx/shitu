# 郑州 PR #11 接收端独立复核与合并记录（2026-11-22）

## 结论与合并状态

郑州分支 `codex/city-zhengzhou-prep`（最终复核提交 `48fb7b5513b7ce0be508f2486aef9913fac6a95f`，[PR #11](https://github.com/mzsjlx/shitu/pull/11)）经初审整改与接收端独立复核全部通过，已以合并提交 `7f513e1548be7461e0396183a495b89507895be8` 合入远端 `main`。

主线现包含 **7 座城市**：重庆、长沙、柳州（初始 9 点版）、南京、潮汕、武汉、郑州。柳州扩充 PR #9、哈尔滨与成都本轮未合并。根工作区 `codex/trip-sharing` 保留原有未提交成果未作改动。

## 复核过程（`20cab1f` → `48fb7b5`）

1. **初审发现的阻塞项（`20cab1f`）**：
   - `map-base/data/media-bundles.json` 中第 7 批 7 个素材包的 `sha256` 与 Release 实际 ZIP 不一致（实际远端下载 `zz-shejianshang-7634461692823242158` 执行 `media:import` 在 `media-bundles.mjs:38` 直接抛出校验失败）；另 `zz-beizeng` 与 `zz-shiwu` 的 `clips` 计数存在 `5/4`、`12/13` 偏差；
   - 与最新 `origin/main`（`7db95f8`）在 `PROJECT-STATUS.md` 存在 1 处合并冲突；
   - 第 1 批 21 处（共 22 条记录）OSM 锚点存在按 10 递减的失配 `way` ID（偏离门店 0.5–7.3 km 且错将 `wayId` 写入 `nodeId`），第 10–12 批 17 条锚点为 `"way-xxxx"` 字符串；
   - `zz-fantongdidi-liuzhenzhen`（正弘城店）落入孤立道路分量导致与其余 140 点断路；两段 `穆彦华逍遥镇胡辣汤` 相距约 130 m 待确认同店归并。

2. **整改后接收端独立复核（`48fb7b5`）**：
   - **主线合并与索引保真**：合入 `7db95f8` 后 0 冲突，GitHub PR #11 返回 `mergeable: true / clean`；未污染任何既有城市文件，`media-bundles.json` 原 165 条与 `video-posters.json` 原 511 条 0 丢失 0 修改。
   - **Release 全量分页核对**：[media-2026-11-16-zhengzhou](https://github.com/mzsjlx/shitu/releases/tag/media-2026-11-16-zhengzhou)（ID `447100672`）共 176/176 附件（88 ZIP + 88 `.zip.json`，总计 `16,785,427,262` 字节），全部为 `uploaded`、0 `starter`，88 条索引与远端名称、URL、字节数、服务端 SHA256 digest 及目录片段数（169 段）0 偏差。
   - **远端实测下载、隔离导入与幂等性**：使用实际从 Release 远端下载的 3 个包（`zz-shejianshang` 90,825,026 B、`zz-beizeng` 173,113,846 B、`zz-shiwu` 217,400,491 B）在全新无媒体 worktree 执行 `npm run media:import -- --city zhengzhou`，首次导入分别为 `clips: 1 / newFiles: 3`、`clips: 4 / newFiles: 9`、`clips: 13 / newFiles: 27`，重复导入均为 `newFiles: 0`。
   - **干净构建、LF 路网、全锚点与全连通**：无 `.local` 媒体干净构建通过，保留 7 城 775 张封面；新 Windows 检出 `food-road-network.json` 严格 LF（`4,184,356` 字节、SHA256 精确吻合，64,780 节点 / 10,536 ways），`review-zhengzhou-data.mjs` 10/10 PASS；独立核验全部 155 条在图片段锚点 `stringWayId=0`、`missingWay=0`、`badNodeId=0`、`nodeNotInWay=0`、`farOver300m=0`；140/140 在图去重点全部位于主连通分量 `6789889049`（`9,730/9,730` 点对连通，抽检 40 条 A* 路线 40/40 `ready`）。
   - **导入后独立浏览器实测（10/10 PASS）**：`zz-shejianshang-liwainiu` 双采样推进 `+0.924s`、Escape 后 `paused=true && hasSrc=false`；`穆彦华逍遥镇胡辣汤` 呈现双博主标签；`合记烩面` 双博主实播推进（`+0.857s` / `+0.857s`），切换与关闭均停止旧视频并移除 `src`；`柳真真 + 天一日料 + 合记 + 穆彦华` 4 站切换「沿路」由直线约 11.1 公里更新为沿路约 12.2 公里（0 缺段）；1440 / 390 / 320 / 736 四视口浮窗均在屏内且媒体占比 66.67%–66.84%（≥ 2/3）；`preview-zhengzhou.html` 渲染 140 张卡片；0 页面异常。

3. **合并后主线复验（`7f513e1`）**：
   - 在独立无媒体整合 worktree（`.local/worktrees/zhengzhou-integration`）完成全城构建（7 城 775 张封面）与 `review-zhengzhou-data.mjs` 10/10 PASS，随后推送 `main`。

## 验证范围边界

- 88 个远端素材包完成了全量 GitHub API 元数据、附件上传状态与服务端 SHA256 digest 逐项比对。
- 实际远端下载、本地重算 SHA256、隔离空目录导入、重复导入幂等性与真实视频播放验证覆盖上述 3 个代表包共 18 段；未声称重新下载全量 15.63 GiB 或远端全量播放 169 段，亦未测试旧包覆盖升级路径。
- 临时审计脚本、下载抽样与截图留存于本机 `.local/reviews/audit-20261122/`，不随 Git 提交。
