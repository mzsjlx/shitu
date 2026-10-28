# 两台电脑共用地图与视频素材

当前开发分支：`feat/hongyadong-map-layer`。地图只整理我们自己提供的链接；位置允许按有依据的街区大致放置，分店未确认时保留说明。

## 第一次下载：先看到地图和美食图片

下载这个开发分支的代码，进入其中的 `map-base` 文件夹，执行：

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd run preview
```

非 Windows 系统把 `npm.cmd` 换成 `npm`。预览默认打开美食地图。代码中已经带有底图、门店位置、来源、博主和 20 张原片封面；即使还没导入视频素材，也能看到地图上的美食缩略图。播放本地剪辑需要再完成下一步。只查看地图不需要 FFmpeg。

## 下载和导入原片、剪辑

首批素材包在仓库的 [视频素材 Release](https://github.com/mzsjlx/shitu/releases/tag/media-2026-10-28)：

- `shitu-media-nangua-d590027fc3ebc378.zip`：南瓜小丸子呀🎃的完整原片、11 段剪辑和封面，约 178 MB。
- `shitu-media-abang-33590fa9cfb07431.zip`：阿棒馋了的完整原片、9 段剪辑和封面，约 89 MB。

这两个附件才是视频素材包。Release 自动提供的 `Source code` 是代码压缩包，里面有封面，但不包含视频原片与剪辑。

下载后不必手工解压。下面假设两个 ZIP 保存在 Windows 的“下载”文件夹，在 `map-base` 中运行：

```powershell
npm.cmd run media:import -- "$env:USERPROFILE\Downloads\shitu-media-nangua-d590027fc3ebc378.zip" "$env:USERPROFILE\Downloads\shitu-media-abang-33590fa9cfb07431.zip"
npm.cmd run build
npm.cmd run preview
```

保存位置不同就替换为实际路径。导入器会校验目录记录、原片和每个片段的 SHA256；重复导入相同素材会跳过，已有不同内容时会停止并保留本机文件。不同来源的包会合并到素材清单，不会把另一人的来源删掉。不要把 ZIP 直接解压覆盖整个项目。

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
6. 在 GitHub 仓库打开 **Releases → Draft a new release**，用自己的日期加昵称创建不重名的标签，例如 `media-日期-昵称`，指向已推送的对应代码提交。上传新生成的 ZIP 及 `.zip.json` 摘要，说明来源、作者、片段数量和对应代码分支/提交，然后发布为预发布版本。不要覆盖或删除另一人的附件。也可以由 Agent 用 GitHub CLI 完成同样的步骤。
7. 把 Release 链接和代码分支/PR 发给另一人。另一台电脑先同步对应代码，再下载、导入新 ZIP，重新构建并刷新。已有素材无需反复下载。

目前仓库是公开的，发布的 Release 素材附件也公开。包用于协作下载；网站开发时从本机提供视频，未来正式部署的媒体存储另行安排。

## 可以直接发给另一台电脑的 Agent

请先阅读仓库根目录的 MEDIA-COLLABORATION.md，按现有数据结构继续添加我提供的视频链接。代码、门店、坐标与小封面一起提交；完整原片和剪辑保存在 map-base/.local 中，按来源使用 media:pack 打包，上传到本仓库的独立 Release，并提供链接与对应代码提交。不要上传整个 .local，也不要覆盖另一人的素材包。添加前核对重复门店和重复视频；保留平台、博主与原链接。完成后确认只下载代码也能看到地图及封面，导入 ZIP 后对应视频可以播放，再把分支、PR 和 Release 地址交接给我。
