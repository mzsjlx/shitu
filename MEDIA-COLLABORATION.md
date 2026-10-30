# 两台电脑共用地图与视频素材

**2026-10-30 第五批：** 3个来源、9段片段，需先取得第四批代码和素材，再取得第五批代码及 [第五批素材 Release](https://github.com/mzsjlx/shitu/releases/tag/media-2026-10-30-batch5) 中3个来源包并按下文导入。具体包名、哈希和页面发布状态以 `map-base/data/media-bundles.json` 及 Release 页面为准。第五批依赖尚未合并的第四批，不应直接覆盖同学的增量。

**2026-10-30第四批：** 对应代码 `codex/chongqing-video-batch4`，新增4个来源、24段视频；四个素材包及校验摘要已上传并核对远端哈希，下载入口为 [第四批素材 Release](https://github.com/mzsjlx/shitu/releases/tag/media-2026-10-30-batch4)，以页面实际发布状态为准。已有前3批14包的电脑只需追加本批4包，取得对应代码后继续使用 `media:import` 命令。下文旧日期数字是当时记录。

**2026-10-30：第三批代码在 `codex/chongqing-video-batch3`，尚未合入 `main`。** 当前该分支包含14份已取得原片、15个来源记录、93个片段与93张原片封面；64个有坐标片段归并为60个地图点，29段未定位。地图只整理用户提供的链接，位置允许按有依据的街区大致放置；朱儿面庄共3位博主、一口汤饺共2位博主，蔡记未强行归并，PP的2025年原片年份保留。

第三批4个来源包共约2.0 GB，均已上传并通过远端SHA256校验；下载入口为 [第三批视频素材 Release](https://github.com/mzsjlx/shitu/releases/tag/media-2026-10-30-batch3)，具体附件与发布状态以该页面为准。精确包名、大小和哈希记录在 `map-base/data/media-bundles.json`。

## 第一次下载：先看到地图和美食图片

**另一城市的 Agent 先读：** [完整交接手册](CITY-AGENT-HANDBOOK.md)和[开工指令](CITY-AGENT-STARTER.md)。本文命令目前针对已接通的全局重庆目录；新城市需先统一目录读取、校验、构建和城市隔离，不得直接把重庆清单替换成异城记录。原片/剪辑与小封面分开同步的原则继续适用。

第三批合并前，先在维护者推送后取得 `codex/chongqing-video-batch3`；合并后再从 `main` 同步。已有工作区先提交或妥善保存自己的修改，不重置或覆盖同学的城市分支。本地还没有该分支时，在仓库根目录执行 `git fetch origin`、`git switch --track origin/codex/chongqing-video-batch3`；已有分支则切回并快进更新。随后进入 `map-base`，执行：

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd run preview
```

非 Windows 系统把 `npm.cmd` 换成 `npm`。预览默认打开美食地图。第三批分支带有扩展至北碚的底图、门店位置、来源、博主和93张原片封面；即使还没导入视频素材，也能看到地图上的美食缩略图。播放本地剪辑需要再完成下一步。只查看地图不需要 FFmpeg。

已克隆代码的电脑应先确认本批是否已合入 `main`，再快进更新对应分支并重新构建。不要为了同步覆盖本机尚未提交的新增素材目录或门店清单。

## 下载和导入原片、剪辑

首批素材包在仓库的 [视频素材 Release](https://github.com/mzsjlx/shitu/releases/tag/media-2026-10-28)：

- `shitu-media-nangua-d590027fc3ebc378.zip`：南瓜小丸子呀🎃的完整原片、11 段剪辑和封面，约 178 MB。
- `shitu-media-abang-33590fa9cfb07431.zip`：阿棒馋了的完整原片、9 段剪辑和封面，约 89 MB。

这两个附件才是视频素材包。Release 自动提供的 `Source code` 是代码压缩包，里面有封面，但不包含视频原片与剪辑。

新增 8 条视频的素材包在 [第二批视频素材 Release](https://github.com/mzsjlx/shitu/releases/tag/media-2026-10-28-batch2)。每位博主一个 ZIP，合计 8 份原片、18 个剪辑，作者为吃货老外铁蛋儿、隔壁的鱼某、特别乌啦啦、健康哥哥、白龙吃了又饿了、密子君、张喜喜、满杯小白。已有首批素材的电脑只需下载新增的 8 个 `shitu-media-*.zip`；首次完整导入需首批 2 包加新增 8 包。两批的精确包名、体积和 SHA256 均在 `map-base/data/media-bundles.json`，文件名末尾的 `.zip.json` 是校验摘要，不能代替视频 ZIP。

第三批4个包如下。已有前两批10包的电脑只追加本表4包；首次完整导入为14包。分包指纹、精确字节数与SHA256以各包摘要和 `map-base/data/media-bundles.json` 为准。

| 作者 | 新剪片段 | 本机包约大小 |
| --- | --- | --- |
| 小洋嘎嘣脆 | 6 | 233 MB |
| 一颗蓝莓 | 6 | 235 MB |
| 一支凯子 | 11 | 988 MB |
| PP超能炫 | 32 | 542 MB |

第三批代码与素材包须使用同一版目录和切点。使用下述 `media:import` 命令导入新包；不要用自动生成的 `Source code` 代码包代替素材包。

下载后不必手工解压。下面假设两个 ZIP 保存在 Windows 的“下载”文件夹，在 `map-base` 中运行：

```powershell
npm.cmd run media:import -- "$env:USERPROFILE\Downloads\shitu-media-nangua-d590027fc3ebc378.zip" "$env:USERPROFILE\Downloads\shitu-media-abang-33590fa9cfb07431.zip"
npm.cmd run build
npm.cmd run preview
```

保存位置不同就替换为实际路径。导入器会校验目录记录、原片和每个片段的 SHA256；重复导入相同素材会跳过，已有不同内容时会停止并保留本机文件。不同来源的包会合并到素材清单，不会把另一人的来源删掉。不要把 ZIP 直接解压覆盖整个项目。

新增包用相同的 `media:import` 命令，每次可以传入一个或多个 ZIP 路径。只导入某一包时，其他未导入视频仍显示封面、作者与原链接，不会自动从抖音重新下载。

## 统一文件夹约定

```text
map-base/
  assets/video-posters/<来源ID>/         # 小封面，随代码提交
  data/video-library.json               # 门店、坐标、作者、原链接、剪辑时间
  data/video-posters.json               # 封面与片段的对应、哈希
  .local/                              # 仅本机使用，Git 已忽略
    video-intake/<来源ID>/source.mp4     # 完整原片
    video-clips/<来源ID>/               # 单店 MP4 与封面
    video-clips/report.json             # 剪辑处理记录，导入时合并
    media-bundles/                      # 准备上传的 ZIP 素材包
```

`dist/` 是构建产物，构建时把可用素材复制过去；不要直接在 `dist/` 中维护视频。只上传打包命令生成的 ZIP，不要把整个 `.local/` 上传，它还可能包含浏览器临时资料、日志和下载记录。

## 你和同学新增视频时都用这个流程

1. 先同步最新代码，在自己的 `codex/` 工作分支操作。添加前按原视频链接、来源 ID、店名、地址及分店检查是否重复。已有门店关联新片段，不再新建同一分店。
2. 把授权使用的原片放入 `.local/video-intake/<来源ID>/source.mp4`，在 `data/video-library.json` 添加来源、作者、原链接、原片哈希、每店切点、封面时间及大致位置。来源 ID 保持唯一，已有 ID 不随意改名。

   同一分店已有地图点时，在新片段中设置 `placeId` 为已有主片段 ID（不带 `video-`）；主片段自身不变。店名、类别、坐标必须一致，校验器会拒绝错误归并。地图只显示一个点，浮窗提供不同博主的视频切换。未读到店名或街区的片段使用 `coordinates: null` 并填写 `addressNote`，先保留在视频库。记录真实 `publishedOn`；旧视频补充 `footageNote`，例如“2024年视频 · 营业情况待确认”。不要用现在的抓取日期代替视频发布日期。
3. 剪辑新来源。FFmpeg、FFprobe 在 PATH 时直接运行以下命令；否则先设置 `FOODCITY_FFMPEG`、`FOODCITY_FFPROBE` 为本机程序路径。`--source` 后替换为目录中的实际来源 ID：

   ```powershell
   node scripts/prepare-video-clips.mjs --source 你的来源ID
   npm.cmd run media:posters
   npm.cmd run build
   npm.cmd run preview
   ```

   按来源处理会保留其他来源的剪辑记录。检查视频、封面、博主、分店及大致位置是否对应；选两家检查连线。没有视频素材的电脑也要能显示封面。
4. 提交代码、门店数据、`assets/video-posters/` 中的小封面和 `data/video-posters.json`，推送自己的分支并创建 PR。请在 PR 写清新增来源、门店、位置估算依据和验证情况。原片和 MP4 剪辑不提交到 Git 历史。
5. 为这次处理的来源打包：

   ```powershell
   npm.cmd run media:pack -- --source 你的来源ID
   ```

   ZIP 和它的 `.zip.json` 校验摘要会生成在 `.local/media-bundles/`。包名包含来源 ID 和内容指纹，同一内容可重复识别。每个包只含该来源的原片、剪辑、封面和导入清单。

   `media:pack` 只生成本机附件，不自动上传Release，也不自动更新 `data/media-bundles.json`。发布后还需核对附件下载地址，并按来源追加合并下载索引、包体积及SHA256；不要覆盖其他批次记录。
6. 在 GitHub 仓库打开 **Releases → Draft a new release**，用自己的日期加昵称创建不重名的标签，例如 `media-日期-昵称`，指向已推送的对应代码提交。上传新生成的 ZIP 及 `.zip.json` 摘要，说明来源、作者、片段数量和对应代码分支/提交，然后发布为预发布版本。不要覆盖或删除另一人的附件。也可以由 Agent 用 GitHub CLI 完成同样的步骤。
7. 把 Release 链接和代码分支/PR 发给另一人。另一台电脑先同步对应代码，再下载、导入新 ZIP，重新构建并刷新。已有素材无需反复下载。

目前仓库是公开的，发布的 Release 素材附件也公开。包用于协作下载；网站开发时从本机提供视频，未来正式部署的媒体存储另行安排。

## 可以直接发给另一台电脑的 Agent

请先阅读仓库根目录的 MEDIA-COLLABORATION.md，按现有数据结构继续添加我提供的视频链接。代码、门店、坐标与小封面一起提交；完整原片和剪辑保存在 map-base/.local 中，按来源使用 media:pack 打包，上传到本仓库的独立 Release，并提供链接与对应代码提交。不要上传整个 .local，也不要覆盖另一人的素材包。添加前核对重复门店和重复视频；保留平台、博主与原链接。完成后确认只下载代码也能看到地图及封面，导入 ZIP 后对应视频可以播放，再把分支、PR 和 Release 地址交接给我。
