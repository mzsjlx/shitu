# 食途 · 真实道路地图底座

2026-10-26，本地验证版，已在 v0.3.1 底座上加入街道近景、美食候选与卡片快捷收藏、类别挑选弹窗、想去行程浮条与排序、固定道路节点试算、独立门店/探店视频资料页和内容核实工作台。主工程使用 MapLibre GL JS 6.15.0 + PMTiles 4.5.0，新增Three.js 0.186.1独立洪崖洞地标图层；原美术小样仍留在 ../design/prototype-3d/。

## 查看

**推荐双击本目录的“打开地图.cmd”**。它使用已安装的 Node.js 启动仅供本机访问的预览，然后打开浏览器，不依赖对话中的临时测试服务。重复打开会复用当前项目的服务，默认地址为 http://127.0.0.1:8791/；端口被其他服务占用时会选择 8792–8799 中的空闲端口，不结束其他程序。

也可运行 npm.cmd run preview。启动器日志在 .local/preview-端口.log。启动器服务只监听 127.0.0.1，不对外发布；它会持续运行至本机重启或手动停止对应 Node 进程。开发时需要随终端停止的服务可用下方 npm.cmd start。

本目录的 **preview.html** 是约 16.75 MB 的单文件评审版本，包含程序、洪崖洞模型与装饰植栽、地图包、地形、道路索引、街道资料、美食候选及示意图、类别挑选、想去行程和道路试算图。它与普通页面都改用经典 Worker，减少模块 Worker 的本地文件兼容问题；file 协议仍受具体浏览器限制，不再把双击 HTML 作为推荐入口。生产网站仍按需读取城市瓦片。

若浏览器限制本地 file 页面，在本机运行：

~~~powershell
cd 'D:\codex\美食网站\map-base'
npm.cmd start
~~~

打开 http://127.0.0.1:8791/；/preview.html 提供同一份单文件。服务仅监听本机，在终端按 Ctrl+C 停止。本轮已实际通过 HTTP 检查普通页面与单文件原件，也在 Codex 内置浏览器中确认地图已展开，没有把它称为 file 协议实测。

## 洪崖洞地标

打开 http://127.0.0.1:8791/?view=landmark，或从“地图图层 → 看看洪崖洞”进入临江视角。木楼和屋檐按原美术模型重组，位置与朝向按真实开放足迹校正；地图仍保留真实道路。临江平台与基座按粗高程衔接，周围楼体使用暖白层次，地标近景收起重复地点文字。西侧真实公园边界内增加22株装饰树，楼前有7个美术花箱；它们不是实测树木或入口资料。模型可随地图旋转、缩放，2D与街道模式按各自用途恢复显示。更详细的来源、性能、地形限制与复核方法见 [HONGYADONG.md](HONGYADONG.md)。

## 探店视频资料

新增“三样子”片段与罗汉寺附近的地图往返：[打开该片段](http://127.0.0.1:8791/?view=food&videos=1&clip=nangua-sanyangzi)，点击标题旁“看看罗汉寺附近”。参考轮廓保留OSM原坐标，可返回同一片段；准确分店和门口仍待核，没有新增门店图钉或路线。来源与检查见 [VIDEO-MAP-CONTEXT.md](VIDEO-MAP-CONTEXT.md)。

2026-10-27新增本地探店片段浮层：<http://127.0.0.1:8791/?view=food&videos=1>。用户提供的前两条抖音已拆成20段单店视频并从原片取封面，保留作者、原链接与原片时间；第三条尚需原文件。普通地图可从“今天想吃什么 → 看看探店片段”进入。这一批分店坐标尚未核实，暂不生成地图钉或到店路线。视频大文件留在本机忽略目录，朋友只克隆代码仍能查看来源与地址；素材路径、复现与核对记录见 [VIDEO-LIBRARY.md](VIDEO-LIBRARY.md)。

打开 http://127.0.0.1:8791/videos.html，可阅读第一份原作者资料：六家店的名称、简介地址、作者章节与原平台链接。页面采用奶油白、宋体和明确标示的AI小面配图，静态HTML无需JavaScript。六条是视频文字线索，地图仍只有原有两家候选；其中小面可回到相关地图候选，另外五条标为地图位置待补，不生成点或导航。

“今天想吃什么”弹窗底部、地图说明和独立地点资料页页脚均可进入。小面候选新增2026原作者链接与0:40文字标注，同时保留2020历史链接。2026原页文字读取日为10月25日，未验证视频播放、分店画面或站内嵌入，不提供自动章节跳转。

来源见 ../CREATOR-GUIDES-SOURCES.md；数据/生成步骤见 CREATOR-GUIDES.md。检查结果为 CREATOR-GUIDES-DATA-QA.json（15项）、CREATOR-GUIDES-UI-QA.json（35项），以及 FOOD-DATA-20261025-VERIFICATION.json。静态资料页不内嵌地图单文件；HTTP单文件链接到同目录页面，file协议隐藏链接。

## 挑选想吃的美食

打开 http://127.0.0.1:8791/?view=food，点击地图上方“今天想吃什么”。类别与数量直接从现有候选生成，目前是“都看看 / 小面 / 火锅”。弹窗可看详情、在地图上只看选定类别，或将尚未加入的候选追加到原想去清单末尾并安排顺序。店址待核与AI示意标识仍保留，未增加无依据的辣度、预算或用餐时长条件。

关闭或Esc会放弃未提交的类别；筛选保留当前视角和朝向，不删清单或重排原顺序。清单定位到被筛掉的门店或总览包含它时会展开全部。类别仅保留于当前页面会话，刷新后恢复全部；想去继续保存于原浏览器存储键。道路试算期间暂时隐藏挑选入口。

FOOD-PICKER-QA.json 保存37项最终通过的独立浏览器检查，包含五种尺寸、键盘与回焦、类别/批量保存、视角、加载和存储失败、深链接与HTTP单文件；首次报告另存FOOD-PICKER-QA-initial.json。截图为 ../output/playwright/food-picker-1440.png、food-picker-390.png 和 food-picker-filtered-map.png。手机尺寸为浏览器模拟。

## 门店资料页

资料目录为 http://127.0.0.1:8791/places.html；详情为 /places/osm-node-13649952401.html（小面）和 /places/osm-node-4460519589.html（火锅）。静态HTML直接呈现整理文字、来源日期与本地菜品示意，禁用JavaScript仍可阅读，不请求地图程序或外站媒体。两家均是店址待核候选，页面整理日不代表重新访问来源或确认营业。

地图详情底部“打开独立资料页”与资料页“去地图看这一站”互通。地图支持 ?view=food&place=已有ID（无view也可）；初次按对应店打开详情，之后普通重新进入美食模式不会重复弹窗。用户在加载时切视角、复位或拖动会取消旧深链接意图。未知ID只展开现有候选，不创建记录或修改清单。

构建时 scripts/build-place-pages.mjs 从 data/food-records.json 和 data/place-editorial.json 生成；来源与原创整理说明分开维护。改候选或来源状态后，先复核对应整理文案，再构建，不能用旧的待核文案自动发布新的核实结论。资料页单独生成在dist/places/，不内嵌preview.html；file协议下地图隐藏资料页链接，该协议未实测。

PLACE-PAGES-QA.json 保存57项浏览器检查，PLACE-PAGES-DATA-QA.json 保存7项隔离构建检查。截图位于 ../output/playwright/place-page-1440.png 与 place-page-390.png；手机为浏览器模拟。当前仍仅本机预览。

## 内容核实工作台

启动本机预览后打开 http://127.0.0.1:8791/content-review.html。工作台单独展示两家候选的来源、分店、入口、图片、视频与入口到道路材料，支持材料引用、本地自动保存、JSON 导入导出、替换预览和撤销。2026-10-25新增“材料库 → 整理视频简介”：按字面预览地址/时间点/已有名称，显式勾选、手动归入候选并保存为一份材料，不自动更新核实结论或抓取媒体。64条缓存餐饮线索在工作台中只读展示；当前审查没有找到具备明确店铺关联的入口配对。

草稿即使材料齐全也只显示“可提交复核”，不改变公众地图、想去清单或路线资格。地图单文件 preview.html 不包含工作台。具体使用、保存位置、来源日期与复现命令见 CONTENT-WORKBENCH.md，原有检查结果见 CONTENT-MODEL-QA.json（85项）、CONTENT-UI-QA.json（33项）、CONTENT-FAILURE-QA.json（4项）；简介整理新增检查为 CONTENT-INTAKE-MODEL-QA.json（23项）与 CONTENT-INTAKE-UI-QA.json（35项）。

## 道路节点试算

“美食探索”左上角的“沿路看看”，或 http://127.0.0.1:8791/?view=walk，可打开朝千路到解放东路的固定道路样板；图层设置也有开关。底部面板可切俯瞰/立体、查看源道路、关闭。看道路时暂时隐藏美食候选，关闭后恢复。

两个端点都是原始道路节点，未接门店门口。按当前局部图和规则得到50段、11条源way、约1.07公里的二维长度；其中10条普通道路缺显式步行许可。说明窗持续解释待核条件，不显示步行时间或到店导航。“仅使用步行类资料”会得到暂未连通，线路和分段清空，不跨缺口补线。

普通页不请求 walk-network.json，打开样板后共用一次读取；12秒超时可重试，不使底图失败。加载中复位或切换视角会取消旧聚焦意图。详细规则、源节点与扩展边界见 WALK-ROUTING-NOTES.md。

资料生成：node scripts/prepare-walk-network.mjs；独立核对：node scripts/review-walk-graph.mjs；改源后运行 npm.cmd run build。18项图/原XML检查、22项界面检查、4项加载检查，以及2026-10-23最终4项回归分别保存在 WALK-DATA-VERIFICATION.json、WALK-UI-QA.json、WALK-LOADING-QA.json、WALK-FINAL-QA.json。手机检查为浏览器模拟。

## 街道近景样板

打开 http://127.0.0.1:8791/?view=street 可直接进入新华路 / 小什字附近；普通城市页左上角的“看看街道细节”也可进入。直接放大到样板区时会自动载入资料，复位或缩小后收起。图层设置可以关闭街道近景；旁边的说明按钮解释符号与来源。

- 普通城市首页不请求街道资料；近景共用一次加载，缓存后不重复下载。12 秒未能读取附加资料则显示重试，底图继续使用。
- 745 条原始 OSM way 记录经地面显示过滤后为 542 条，含 29 条人行道、13 条过街通道、91 条台阶通道、182 条步行小径、12 条步行街及 215 条道路记录。这些不是去重后的实物数量，也没有经过现场核实。
- 32 条有明确车道数且为单向的地面路段绘制路宽和车道分隔线示意，默认每车道 3.2 米。未知双向分配不生成分隔线；路口附近留白，不生成停止线或转向箭头。
- 过街通道使用虚线符号；仅源记录明确 zebra 才用斑马线符号。台阶横纹是分类符号，不对应实际阶数。
- 近景楼体会压低，便于看路；回到城市后恢复源楼高表达式。画面中持续标明路宽、标线和楼体为示意。
- 点击步行线可查看源 way 标识。桥隧、地下、非零层级、受限通行、室内等记录不混入当前地面详细层。

资料来自此前保存的 OSM 原始 XML 和 JSON，来源时间 2026-10-19。JSON 仅保留 406 个节点，准备脚本从通过哈希验证的原 XML 恢复另外 12,148 个原始坐标；未插值或跨缺失节点连线。原始坐标、节点顺序和 tags 已核对。此附加层不依赖底图 z15 简化后的几何，不代表全城已有车道级资料。

重新生成运行 node scripts/prepare-street-detail.mjs，核对运行 node scripts/review-street-data.mjs，再运行 npm.cmd run build。浏览器检查记录在 STREET-QA-REPORT.json（19项），源数据核对在 STREET-DATA-VERIFICATION.json，慢请求/镜头操作与超时回归在 STREET-RACE-QA.json（6项），单文件检查在 STREET-STANDALONE-QA.json。

## 已完成

- 真实道路、中文路名、岸线、建筑轮廓与粗地形显示。
- 拖动、旋转、缩放，2D 看路 / 3D 漫游，回到初始视角。
- 1041 组源道路名称搜索，定位并高亮；点击路面查看道路信息。
- 道路名称、立体建筑、山地地形开关，来源说明和可见署名。
- 独立美食卡片接口，随镜头保持经纬度锚定；“美食探索”接入两家明确标示待核实的来源记录候选。
- 原始道路节点之间的本地连接与长度试算，支持来源查看；候选门店尚未连入导航。
- 手机布局、减少动态效果，以及卡片点击不会选到底层道路。
- 加载以真实道路可见为准，地形失败单独降级；独立启动错误提示与 20 秒超时，防止永远停在“正在展开”。

页面运行时只读取本地程序与地图资产，不请求高德底图或展示密钥，也不热链 Protomaps 演示服务。自托管表示我们控制渲染和服务，基础数据仍遵守开放许可。

## 范围与精度

当前为重庆中心城区局部，WGS84 bbox 为 [106.49, 29.49, 106.65, 29.65]，约 15.5 × 17.8 公里。尚未准备第二座城市。

| 数据 | 实际记录 | 限制 |
| --- | --- | --- |
| 矢量包 | Protomaps 20261020，模式 v4.15.2，5,639,870 字节 | 最大源级别 z15；放大到 z19 不增加源精度 |
| OSM 时间 | 2026-10-20T04:00:00Z | 非实时路况或现场调查 |
| 道路 | 1041 组名称，5889 个 z15 道路线片段 | 名称组不是独立物理道路，瓦片片段可能重复 |
| 建筑 | 6616 个多边形片段，1106 带正高度、5510 无正高度 | 不是独立建筑数，源高度值不等于测绘已核实 |
| 地形 | Tilezen Terrarium z11–13，89 张，共 3,886,382 字节 | 粗高程，不能确定桥面、台阶或楼层 |

缺少正高度的楼体暂以 9 米示意，部分复杂建筑还带底高；不随机生成高楼。地形夸张系数为 1.0，江面和桥面仍有视觉高程误差。地标、外立面和景观可以继续在独立层中精修。

搜索按源名称分组。“嘉滨路”精确源条目在范围西部，洪崖洞旁的相关源名是“嘉陵江滨江路”；不随意替换源名。“含桥梁/隧道路段”表示该组至少有一个相应标记，不代表整条路都具有该属性。

地图包只用于显示，不能代替可路由道路图。当前另用原始道路缓存验证固定节点试算，尚无可执行到店路径、入口/楼层连通校验或步行时间。

## 工程

- src/main.js：地图、搜索、浮层、镜头与诊断入口。
- src/map-style.js：地图视觉样式。
- src/food-overlay.js：独立卡片叠加接口。
- src/food-experience.js、data/food-records.json：候选内容、详情、图片说明与浏览器想去清单。
- src/street-detail.js、street-style.js、street-geometry.js：街道按需载入、视觉、来源与车道示意。
- src/walk-graph.js、walk-preview.js、data/walk-network.json：独立道路图、试算、来源和显示。
- config/cities.json：城市范围、镜头、地图包、地形与数据文件路径。
- data/source-manifest.json、tile-metadata.json：源版本、时间、哈希、图层字段。
- data/terrain-manifest.json：逐张地形来源和哈希。
- data/roads-index.json、data-audit.json：搜索索引与数据核查。
- dist/：HTTP 页面和资产；preview.html：单文件评审版本。
- QA-REPORT.json、VERIFICATION.md：验证记录。

修改源码后运行 npm.cmd run build。换电脑先运行 npm.cmd ci；本机依赖已经安装。软件许可文本在 dist/ 和单文件中保留。

## 数据更新与全国扩展

日常改视觉不需要重新下载。获取和索引流程已按城市配置复用：

~~~powershell
python scripts/prepare-map.py --city chongqing
python scripts/prepare-terrain.py --city chongqing
node scripts/index-roads.mjs --city chongqing
npm.cmd run build
~~~

Python 脚本仅使用标准库；python 指可用的 Python 3。摘录脚本会获取官方 go-pmtiles 工具，已有工具和地图则复用；tools/SOURCE.json 记录工具来源与本地哈希，该哈希不是独立发布的签名。

默认检查缓存包的范围和 SHA-256 后复用；替换地图须显式加 --refresh。--build YYYYMMDD 可选择上游仍保留的构建。该流程摘录区域，不下载整个世界包。

新增城市需在配置中加入独立的 tiles、demTiles、dataFiles 路径，运行同一流程、验收后切换 activeCity。当前没有城市选择器，也未验证全国覆盖。生产阶段仍需版本化 CDN、更新回退、未覆盖区域管理和第二城市验收。

## 美食卡片

点顶栏“美食探索”，或打开 http://127.0.0.1:8791/?view=food。两家店为公开地图来源记录候选，卡片标“店址待核实”；位置来自缓存 OSM 节点，尚未独立确认当前分店、营业与实际门口。近景卡片拥挤时折成圆点，仍可点击打开详情。图片是已有 AI 通用菜品图，卡片与详情标示“菜品示意”，不作为本店实拍。

地图展开卡片可直接加入/移除想去，详情按钮同步；有已记录的相关视频时可直接打开原页，没有对应视频则不放入口。主详情按钮、快捷收藏和链接平级，不嵌套交互；Enter/Space可以收藏。卡片折叠时保留可点击的圆点，快捷动作焦点回到主按钮。CARD-ACTIONS-QA.json 的36项与 CARD-ACTIONS-LINK-QA.json 的4项检查通过，视频popup使用本地拦截，不代表平台播放已核实。

加入后显示在地图底部行程浮条。点击一站查看来源位置，“一起看”总览已选地点；“安排顺序”可上下调整、打开详情、定位或移除。顺序保存在当前浏览器，不跨设备同步；普通整理不改变地图视角，主动查看位置也保留当前2D/3D。排序是想去先后，尚未生成到店路线。道路试算期间隐藏此浮条，退出后恢复。

清单沿用旧存储键并去重，不在资料读取失败时覆写旧选择。存储受限会明确提示未保存，当前内存选择仍可用；刷新会失去未保存修改。TRIP-UI-QA.json 保存41项界面最终结果，TRIP-EDGE-QA.json 保存6项异常与单文件检查；TRIP-CAMERA-QA.json 保存36项取景最终断言及针对复查。窄屏卡片会避开控件和其他候选锚点，空间不足时折为可点击的点。首次发现的遮挡与修复检查均保留记录。最后仅楼体起始缩放级别的调整，由 TRIP-VISUAL-QA.json 的8项检查确认普通页和单文件总览仍显示真实楼体、2D切换正常。手机为浏览器模拟。

李板凳面有一条 2020 年原作者相关视频链接，按“分店待核”处理；点击由原平台提供观看，本项目未验证播放或实现站内嵌入。赵二没有可靠匹配的视频入口。没有从视频自动提取、猜测推荐菜、价格、评分或营业时间。

来源依据见 ../FOOD-CONTENT-SOURCES.md。候选记录使用 verificationStatus=source-record、entranceStatus=unverified、routeEligible=false，由内部 replaceCandidates 显示；不能混入已核实门店或自动路线。原始节点核对运行 node scripts/review-food-data.mjs，记录在 FOOD-DATA-VERIFICATION.json。地图包用于显示，想去清单暂不连线，也不生成虚构距离或耗时。

浏览器记录为 FOOD-QA-REPORT.json（29项，首次焦点问题经专项修复）、FOOD-FOCUS-QA.json（最终8项回归）及 FOOD-LOADING-QA.json（4项延迟、超时和单文件检查）。全部检查结论与限制见 VERIFICATION.md。

供后续已核实内容接入的公开接口保持严格：

地图准备后调用 window.foodCityMap.setFoodCards(records, onOpen)，或 clearFoodCards() 清除。

~~~typescript
type FoodRecord = {
  id: string;
  name: string;
  coordinates: [longitude: number, latitude: number];
  coordinateSystem: 'WGS84';
  verificationStatus: 'verified';
  photoURL?: string;
};
~~~

记录须有唯一 ID，坐标须在当前覆盖范围内；其他坐标系和未核实状态会被拒绝。字段检查不能替代真实分店与入口核实，素材权利由独立内容系统管理。

此前已用明确标明“非门店”的 QA 卡检查锚定、回调、清除和点击不穿透。当前两张来源记录候选不等于已核实推荐；没有可执行路线或广告。

## 来源与商业化

- [OpenStreetMap / ODbL](https://www.openstreetmap.org/copyright)
- [Protomaps 区域包](https://docs.protomaps.com/basemaps/downloads)与[图层定义](https://docs.protomaps.com/basemaps/layers)
- [PMTiles 对象存储要求](https://docs.protomaps.com/pmtiles/cloud-storage)
- [Tilezen 高程署名](https://github.com/tilezen/joerd/blob/master/docs/attribution.md)
- [MapLibre 软件许可](https://github.com/maplibre/maplibre-gl-js/blob/main/LICENSE.txt)

开放数据许可、国内地图发布要求、素材权利和 AdSense 审核分别处理。后续商业化以原创攻略、核实分店与路线说明内容页为基础，不承诺过审。具体架构与官方依据见根目录 MAP-PLATFORM-DECISION.md。
