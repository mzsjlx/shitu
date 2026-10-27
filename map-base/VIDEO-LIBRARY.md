# 探店视频：本地片段与地图浮层

2026-10-27。本轮处理用户提供的三条抖音链接；用户已在本项目会话中确认作者允许剪辑并在网站使用，记录为用户确认，未独立审查授权文件。

推荐入口：<http://127.0.0.1:8791/?view=food&videos=1>。普通地图从“美食探索 → 今天想吃什么 → 看看探店片段”进入；原有 `/videos.html` 也有入口。视频以浮层覆盖地图，不移动镜头或生成未经核实的门店图钉。

补充：三样子片段可从“看看罗汉寺附近”收起浮层、查看真实参考地标，并返回同一片段；店门口仍未核实。`clip=nangua-sanyangzi`可直接打开这一片段；操作与地址资料对照见 [VIDEO-MAP-CONTEXT.md](VIDEO-MAP-CONTEXT.md)。

## 当前内容

| 作者 | 原页 | 本地原片 | 已剪单店片段 | 地址情况 |
| --- | --- | --- | --- | --- |
| 南瓜小丸子呀🎃 | https://www.douyin.com/video/7699050477137231973 | 完整音画，约5分22秒 | 11 | 据319.367秒起作者地址卡记录；最后一家仅抄录辨清的路口 |
| 阿棒馋了 | https://www.douyin.com/video/7696830954535675065 | 完整音画，约3分27秒 | 9 | 据205.7秒起作者九店清单及字幕；仅归井有“重庆动物园旁边”的区域线索 |
| 汁汁冰激凌 | https://www.douyin.com/video/7653075066175338725 | 未取得 | 0 | 原页可播放，不能用平台AI地区章节代替门店核对 |

前两条保存浏览器正常播放时已观察到的音画资源，以默认TLS的普通下载取得完整文件，再无损合成原片。没有复制登录Cookie、生成签名、使用第三方解析站或改变TLS验证。第三条播放器直接保存失败，普通下载器读取403并要求新Cookie；未继续提取Cookie或绕过限制，需要作者/用户提供原文件后继续。

店名依据实际中文字幕、门头与片尾作者清单核对。第一条将平台自动章节中的“大雁”“大龄”“潜江”纠正为“大堰”“大玲”“黔江”。第二条三家面包店分别剪开，不把同一食品分类章节当成一家店。原有音轨、字幕、比例和画面内容保留，未添加配音、音乐或生成菜品图。没有声称已逐句完成人工听校；本地ASR曾因模型下载连接失败而中止，未采用其结果。

后续放大复看片尾清单，第二条第七家原文为“山乘树”，此前整理成“山梨树”为误读；已修正展示名称，内部片段ID仍为`abang-shanlishu`，原片与剪辑没有变化。高德人工候选核对及分店差异记录在 [video-store-matching-20261027.md](../output/research/video-store-matching-20261027.md)。

本轮20条均没有独立核实的WGS84分店位置，`coordinates:null`、`routeEligible:false`。原有两家地图候选及想去清单逻辑不变。已有地图/研究缓存没有本批可直接采用的同名对象；在线Overpass查询返回406，不能解释为这些店不存在。Nominatim一次“三样子 罗汉寺 重庆”搜索返回空结果，亦未据此生成坐标。地址文字、地图位置、门口和通行路线仍需分别核实。

## 文件与复现

- `data/video-library.json`：作者、稳定原页、用户确认的使用范围、原片SHA256、每店起止秒、原片封面时间、文字地址和待核状态。没有临时CDN地址。
- `.local/video-intake/{nangua,abang}/source.mp4`：本机原片。获取日志、响应HTML、临时媒体地址、抽帧和ASR运行环境均在忽略目录，不进Git或静态服务。
- `scripts/prepare-video-clips.mjs`：先比对原片哈希，再精确解码裁切为H.264/yuv420p、AAC和faststart MP4；原片封面另存JPEG。`ffprobe`核对音画与时长，保存每份产物的哈希。
- `.local/video-clips/{sourceId}/`：20个片段与封面，处理账本为`.local/video-clips/report.json`。
- `scripts/build-video-library.mjs`：只复制与目录、分段参数、原片哈希及产物哈希一致的素材到`dist/media/videos/`，生成可用性清单。单独的`.local`从不挂到HTTP目录。
- `src/video-library.js` / `.css`：按作者、店名/类别/地址浏览，原生视频控件、原作者入口、手机换店按钮。关闭或切换作者/片段会暂停并卸载旧媒体。

取得授权原片并放到上述本机路径后，在`map-base/`运行：

```powershell
# ffmpeg与ffprobe在PATH时无需设置这两项；本机安装路径如下。
$env:FOODCITY_FFMPEG='D:/ffmpeg/bin/ffmpeg.exe'
$env:FOODCITY_FFPROBE='D:/ffmpeg/bin/ffprobe.exe'
node scripts/prepare-video-clips.mjs
npm.cmd run build
node scripts/review-video-library-data.mjs
npm.cmd run preview
```

Git保存代码、结构化记录和核对报告，不保存整段原片或剪辑大文件。朋友只克隆仓库时仍能构建，页面显示来源/地址与“素材待导入”，不会展示失效视频。需要另行提供同哈希原片后生成本机片段；更换原片必须重新核对切点并更新哈希。生产媒体存储/CDN、第三条原片、精确店址和门店卡片定位尚未完成，没有发布网站或提交广告审核。

地图单文件约16.77MB，只内嵌程序与地图，不内嵌这批视频；HTTP入口按需读取同目录清单/媒体，直接file协议提示用项目启动器。普通地图不打开视频浮层时不读取视频目录或媒体，也不自动访问原平台。

## 验证

- `VIDEO-LIBRARY-MEDIA-QA.json`：20个产物的源时间、哈希、字节数和音画流检查，以及无本机素材时的隔离构建结果。
- `VIDEO-LIBRARY-UI-QA.json`：55项检查通过，包含20段真实浏览器解码、实际播放时间推进、切换/关闭停止媒体、搜索、第三条缺失、数据失败重试、无素材回退、HTTP206及MIME、普通地图按需读取与4种屏幕尺寸。
- `VIDEO-LIBRARY-PICKER-REGRESSION.json`：原有挑选、想去清单、存储失败与HTTP单文件流程37项回归通过；`executedOn`标明本次运行日。
- `../output/playwright/video-library-1440.png`、`video-library-390.png`：已查看最终布局。手机为浏览器模拟，尚未进行真机、生产网络和整段逐秒听校。
