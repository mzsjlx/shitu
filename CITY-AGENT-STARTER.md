# 可转发给城市 Agent 的开工指令

## 2026-11-24 最新通用开工指南（9 城主线基线就绪）

> **新同学阅读止损提示**：本仓库历史记录较长，新城市 Agent **只需要读** `AGENTS.md` + 本文顶部 + [PR-CHECKLIST.md](PR-CHECKLIST.md) + [MEDIA-COLLABORATION.md](MEDIA-COLLABORATION.md) 顶部 + 标杆复核 [zhengzhou-review-20261122.md](output/research/zhengzhou-review-20261122.md) / [harbin-review-20261123.md](output/research/harbin-review-20261123.md) / [liuzhou-review-20261124.md](output/research/liuzhou-review-20261124.md) / [chengdu-review-20261124.md](output/research/chengdu-review-20261124.md) 即可开工；不要通读 350 KB 的 `PROJECT-STATUS.md` 全文，也不要照搬 2026-10 月的旧单城硬编码限制。

### 城市认领与 ID / 前缀防撞表（开工前先核对）

| 城市 | `cityId` | `sourceId` 前缀 | 当前状态（2026-11-24） |
| --- | --- | --- | --- |
| 重庆 | `chongqing` | `cq-`（及首批旧 ID） | 已合入 `main` |
| 长沙 | `changsha` | `cs-` / `changsha-` | 已合入 `main` |
| 柳州 | `liuzhou` | `lz-` | 已合入 `main`（51 点扩充 PR #9，`f35fbf4`） |
| 南京 | `nanjing` | `nj-` | 已合入 `main` |
| 潮汕 | `chaoshan` | `chaoshan-` | 已合入 `main` |
| 武汉 | `wuhan` | `wh-` | 已合入 `main`（PR #10，`6019700`） |
| 郑州 | `zhengzhou` | `zz-` | 已合入 `main`（PR #11，`7f513e1`） |
| 哈尔滨 | `harbin` | `hb-` | 已合入 `main`（PR #12，`3f52b16`） |
| 成都 | `chengdu` | `cd-` | 已通过复核合入 `main`（PR #13，首期 6/82 包已实装） |
| 南昌 | `nanchang` | `nc-` | 首期 4 来源 / 28 片段 / 26 在图点开发中（`codex/city-nanchang-prep`） |

新同学开工前请先与仓库维护者确认未占用的 `cityId` 与 `sourceId` 前缀，避免撞城或撞 ID。

### 可直接复制发给新城市 Agent 的标准提示词

> 把下方的 `【城市中文名】` 与 `【cityId】` 替换为实际值后转发（不转发账号令牌、验证码或 Cookie）：

```text
我们一起协作开发“食途”美食旅行地图网站，主仓库是 https://github.com/mzsjlx/shitu 。
你现在负责【城市中文名】，城市 ID 约定为 `【cityId】`（来源 ID 统一用 `<城市前缀>-<作者拼音>-<作品数字ID>`，仅限小写字母/数字/连字符，全局唯一）。

1. 先同步并基于最新 `origin/main`（已含重庆、长沙、柳州、南京、潮汕、武汉、郑州、哈尔滨、成都 9 城）建立工作分支 `codex/city-【cityId】-prep`；同机并行请在独立 worktree 开发，绝不重置或覆盖他人工作区。
2. 开工先读 `AGENTS.md`、`CITY-AGENT-STARTER.md` 顶部、`PR-CHECKLIST.md`、`MEDIA-COLLABORATION.md` 顶部及 `output/research/zhengzhou-review-20261122.md`（标杆测试模板为 `map-base/scripts/review-zhengzhou-data.mjs` 和 `review-zhengzhou-browser.py`）。不要通读旧历史文档，也不要按 10 月旧单城限制工作。
3. 推荐两阶段交付：阶段 1 先完成城市配置、开放底图、地形、原始 OSM PBF 路网（`prepare-food-road-network.py --city 【cityId】`）、`.gitattributes` 本城 LF 规则，并用我提供的 1~3 个探店链接跑通剪辑、封面、定位锚点、公开 Release、隔离导入与浏览器 QA，先发 Draft PR 预检结构；确认无误后再批量扩充。未收到链接前先准备地图与路网，不自行找外站视频凑数。
4. 严守目录隔离：本城文件放 `map-base/data/cities/【cityId】/`、`map-base/assets/video-posters/<sourceId>/`、`output/research/【cityId】/`；原片/MP4/ZIP/临时文件留 `.local/`。共享索引按 ID 追加合并，保持 `activeCity` 为 `chongqing`；提交前检查 `git diff --name-only origin/main`，严禁提交无媒体构建改动其他城市的 `video-library-assets.json`。
5. 路网与定位硬约束：禁止从 PMTiles 拼路网或造流水号；所有在图点锚点必须是真实整型 OSM `way` 与所属 `way.nodes` 中的 `nodeId`（`nodeId !== wayId`、距坐标 ≤ 300m），全部在图点位于主连通分量 0 断路；超出范围的保留真实坐标不夹边界，无线索留视频库不造点。
6. 视频剪辑与 Release 交付：按真实门店内容切分（不要一刀切固定秒数），实测 FFprobe，非今年旧片补 `footageNote`，同分店多博主用 `placeId` 归并。按来源 `media:pack` 后上传全部 ZIP 和 `.zip.json` 到独立公开 Release（有主仓权限发主仓，Fork 同学无主仓写权限则发自己公开 Fork 仓库的 Release，并填真实可公开下载 URL，严禁填 404 地址）。注意重打包会改 ZIP SHA256，`media-bundles.json` 的 `sha256`/`bytes`/`clips` 必须与 Release 实际 `uploaded` 附件 100% 一致，并在新隔离空目录实测远端下载 + `media:import`（含重复导入 `newFiles: 0`）。
7. 验收与正式 PR：必须通过无 `.local` 媒体的干净构建（全城封面 0 丢失）、数据与全锚点/全连通测试、以及浏览器端到端强断言（双采样播放推进 `dt >= 0.3s`、持有旧 `<video>` 引用且用 `&&` 验证切店/换博主/Escape 后 `old && old.paused && !old.getAttribute('src')`、1440/390/320/736 四视口浮窗在屏内且媒体占比 ≥ 2/3、直线/沿路切换、离线单页包与跨城零串城）。完成后在 `mzsjlx/shitu` 创建目标为 `main` 的正式编号 PR，分开统计作品/作者/切片/去重点/在图点/未上图段数，并诚实写明全量元数据核对范围与抽样下载播放范围。
```

---

## 历史开工记录（归档参考，以顶部最新标准为准）

### 2026-11-16 最新开工补充（郑州及后续城市）

武汉PR #10的 `488079f` 已通过接收端复核，并以 `6019700` 合入主线。开工先同步最新main并确认本地检出已包含该合并，旧工作区不会自动更新；下面旧日期的城市数量和硬编码描述仅供历史参考。

可以把本段和下方通用开工指令一同转发：

> 我现在负责食途【郑州】，城市ID为 `zhengzhou`，工作分支 `codex/city-zhengzhou-prep`，建议独立worktree为 `.local/worktrees/zhengzhou-prep`。请先读AGENTS、README、PROJECT-STATUS最新章节、城市手册与素材说明，尤其是2026-11-16武汉复核补充。根目录可能有其他任务的未提交内容，不在根目录切分支或覆盖文件；从开工时最新main创建或继续已有独立工作区。还没收到视频链接时，先检查并准备城市配置、开放底图和真实路网，不自行添加探店来源。收到链接后先用一个来源跑通剪辑、真实封面、近似定位、同店归并、地图播放和素材包交付，再扩量。
>
> 保留其他城市和全局索引，冻结路网固定LF，并在无本地媒体的新检出验证构建与封面。实际播放要两次采样确认推进；持有旧video对象，把换片与关闭后的暂停和src移除纳入最终断言。改剪辑后重新核对并打包，分别验证空目录、重复导入及涉及的旧版本处理。Release分页核验ZIP及摘要，starter不计完成，上传期间如实报告；上传完核对全量名称、URL、大小和SHA256，实际下载样本并在隔离目录导入，注明抽样范围，不把服务端digest核验写成全量下载验证。提供存在的报告文件、正式编号PR、Release及是否已合并的真实状态。常规可逆工作持续推进，遇到单条来源受限先做其余内容。

其他城市替换城市名称、ID、分支和目录即可。郑州授权只按本次实际来源确认，不沿用武汉素材授权。完整方法见 [手册](CITY-AGENT-HANDBOOK.md)，证据见 [武汉最终复核](output/research/wuhan-followup-20261116.md)。


更新日期：2026-11-01。长沙续做与南京开工的具体文字见 [CITY-AGENT-MESSAGES.md](CITY-AGENT-MESSAGES.md)；以下为其他城市通用模板。把城市名与ID改成实际值，不转发令牌、验证码或浏览器Cookie。

---

我们共同开发“食途”美食旅行地图，仓库是 https://github.com/mzsjlx/shitu 。请负责【城市名】，城市ID为【cityId】。先读根目录 `AGENTS.md`、`README.md`、`PROJECT-STATUS.md` 顶部、`CITY-INTEGRATION-NOTES.md`、完整城市手册、素材说明与 `map-base/FOOD-ROAD-DISTANCE.md`，再检查真实代码。

当前main已通过PR #6接入重庆与长沙，支持城市下拉、`?city=`、按城视频目录/资料页/单文件，以及按城制作和导入素材。两城仍是局部底图，没有跨城连续拖动，长沙核实工作台尚未开放。不要从过期城市分支恢复旧公共实现。新任务从最新main创建 `codex/` 分支；已有分支与素材继续保留，先保存修改并合入最新 `origin/main`，不硬重置、强推或重做。同机用独立worktree，公共适配与城市内容尽量分开提交，冲突按ID保留各城增量。

新数据放 `map-base/data/cities/<cityId>/`，研究记录放 `output/research/<cityId>/`，来源/片段ID全局唯一。不要覆盖其他城市目录。当前构建遍历已配置城市，不会仅凭 `in-preparation` 跳过缺资源城市；准备骨架不破坏现有构建，底图、地形、路网、索引和目录齐备后再接入可运行配置。

只整理我实际提供的链接，保留平台、作者、原页、真实发布日期、原片哈希与切点。收到链接后：作品去重→核对实际授权范围→正常取得原片→回看门头/字幕/地址卡→按真实门店分段并截取对应封面→核对分店和已有门店→记录有依据的WGS84街区近似点→接入地图与页面→实际播放及距离检查。已有明确授权不重复询问，未收到来源的骨架不预填已获授权。一家店多道菜一般仍是一店，同一分店多博主共用一点、保留各自片段，不能仅凭同名归并。

高德可人工对照店名地址，持久化参照使用实际开放对象/源节点，记录类型/ID/URL、日期、原始文件SHA、推导方式和不确定处。OSM搜索网址或路线成功不能证明店址。无需精确店门，有街区线索可标位置大致，无依据留视频库；范围外待扩图，不夹边界或随便挪到远路。沿路用真实源节点拓扑和道路长度，保留直线切换、250米吸附约束及部分断路提示。

保持全屏真实3D地图、奶油暖色、圆点→卡片→卡片旁视频浮窗，视频约占至少2/3；改HTML类名时同步CSS。切店、换博主、换城与关闭停止旧音轨。完整检查城市配置、加载失败、外部搜索、收藏、资料页/店页及返回链接、HTTP与单文件、路网与旧异步结果，不只改 `activeCity`。

在 `map-base/` 中，剪辑为 `node scripts/prepare-video-clips.mjs --city 实际城市ID --source 实际来源ID`，封面为 `npm.cmd run media:posters -- --city 实际城市ID`，打包为 `npm.cmd run media:pack -- --city 实际城市ID --source 实际来源ID`。接收方先同步代码，再 `npm.cmd run media:import -- 实际ZIP路径` 自动识别城市，构建后验证。Git保留源码、必要地图、小封面、目录及来源/QA；原片、MP4和临时运行资料留`.local`，按来源ZIP+摘要上传唯一Release，核对远端大小/哈希并追加总索引。打包、上传、合并与网站部署分别报告，不上传整个`.local`或手工覆盖账本。

先用一个来源跑通完整闭环；原片确有2～3家店再做多店距离，不为凑数拆商家。未收到链接可准备环境和开放地图，不自行找视频。验证真实解码/时间前进、切换停音、同店归并、两种距离/失败重试、四种屏幕截图、无素材及隔离ZIP导入，公共修改回归已接入城市。旧QA先读再用，不改旧报告冒充执行，不清空用户真实收藏或素材。完成后写明实际数量、来源依据、分支/提交/PR是否合并、Release、实际测试与待补项。常规可逆工作直接推进，不增加无关账号、收费、复杂后台或额外平台内容。

---

柳州沿用约定的 `liuzhou` 与同学已有分支，不因模板更新重做；南京已指定 `nanjing`，现有分支与具体注意事项见专项消息。
