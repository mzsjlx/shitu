# 食途 · 潮汕城市交付与进展报告 (Chaoshan City Handoff)

- **更新日期**：2026-11-09
- **城市标识**：`chaoshan`（高德城市代码 `440500`）
- **开发分支**：`codex/city-chaoshan-prep`（隔离工作树 `.local/worktrees/chaoshan`）
- **初始化基线**：主分支最新提交 `2fe1e05`（南京城市整合与四城通过检查）
- **当前状态**：全量完成三批共 23 个探店视频来源深度解析、42 个探店视频切片、35 处实体门店归并全链路落地；达成 6 组多博主同店深度归并（包含 3 博主同店与 5 组双博主同店）；打通潮州古城牌坊街、汕头小公园福平路老城区、龙眼南路美食街、华坞市场、乌桥廻澜市场及万象城商圈六大核心片区真实 OSM 步行拓扑路网连通；通过 19 项 Playwright 真实浏览器端到端核验与 8 项数据完整性自动化审查。

---

## 1. 探店来源与素材归档（23 来源全量接入）

所有 23 支探店视频原片均已通过无水印渠道下载至本机 `.local/video-intake/`，完成 SHA256 校验固化，并通过 Faster-Whisper 完成全量语音 ASR 转录（生成 `transcript.txt` 与 `asr.json`）：

| 来源 ID | 博主 | 原标题 | 视频时长 | 原片 SHA256 (留存 .local) | 接入片段数 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `chaoshan-miaojiang-7661157240087097061` | 喵酱饿了 | 潮汕太好吃了！4天3晚吃了38顿选出的精髓... | 265.0s | `8b31fceed9b5d7...` | 4 个片段 |
| `chaoshan-zhizhi-7556966907678084409` | 汁汁冰激凌 | 汕头美食攻略极速版第一弹～ | 603.2s | `fdfd5d12b00db2...` | 4 个片段 |
| `chaoshan-zhizhi-7604486952716553381` | 汁汁冰激凌 | 2025年度总结汕头只有本地人老饕才知道的16家... | 536.8s | `47d173ec49f378...` | 1 个片段 |
| `chaoshan-xiaolu-7589618937185756025` | 小陆日记 | 潮汕潮州一日游！24小时狂吃18家店是什么体验！ | 191.1s | `d98a57f0ee9ca0...` | 3 个片段 |
| `chaoshan-xiaolu-7573258815165689536` | 小陆日记 | 潮汕揭阳一日游！24小时狂吃15家店是什么体验！ | 206.1s | `bf7d436366b644...` | 2 个片段 |
| `chaoshan-xiaozhen-7695617424514632994` | 小珍来咯… | 潮汕牛肉火锅的魅力在于新鲜的食材... | 1002.7s | `7e864ca9c1ada8...` | 1 个片段 |
| `chaoshan-taojie-7612866882735066377` | 桃姐在路上-潮汕纯玩 | 潮州美食 超详细攻略 我不理解，潮州美食明明多到炸... | 114.7s | `fa9dcd4cc20ab1...` | 4 个片段 |
| `chaoshan-lezai-7617868427658718193` | 乐仔到处跑 | 别再去吃假汕头美食了！ 真正二十六年汕头本地人攻略... | 236.4s | `1d120c5d5a5042...` | 3 个片段 |
| `chaoshan-yuwei-7671587236994895138` | 鱼尾呀 | 📍汕头攻略\|如何两天9家美食吃到爽顺路6个景点看日... | 197.8s | `f1a2512d89a496...` | 2 个片段 |
| `chaoshan-ashen-7605899092857903507` | AAA阿珅在干饭 | 潮汕潮州两天爽吃11家店不踩雷攻略！ | 129.5s | `9f093c5a7e6d94...` | 3 个片段 |
| `chaoshan-mengmengyu-7585886099617991986` | 萌萌鱼 | 汕头龙眼南路必吃美食攻略！n刷不踩雷！！！ | 95.9s | `f28973f74260b5...` | 3 个片段 |
| `chaoshan-dage-7675288235698023602` | 达哥在上海 | 在广东潮汕饶平县欧石村吃鱼排海上餐厅... | 338.2s | `3f9820c947eef2...` | 1 个片段 |
| `chaoshan-beizeng-7551339620382936356` | 倍增CD了 | 可能是最适合吃货的汕头美食攻略（合集） | 154.5s | `5d926f6e8eb947...` | 1 个片段 |
| `chaoshan-xiaolin-7644562295713266043` | 我是小林 | 三刷潮州美食旅游合集攻略请收好！ | 126.3s | `774d8f75b619ae...` | 1 个片段 |
| `chaoshan-dongmai-7670683829091266466` | 东麦 | 揭阳“21家本土老店”4天3夜 潮汕土著带你吃遍揭阳... | 258.9s | `4e8679d21d953e...` | 1 个片段 |
| `chaoshan-xiaozhen-7698251458919091475` | 小珍来咯… | 小众赛道的小众火锅之卤水火锅 涮鞋垫子都好吃 | 796.6s | `2c82858e00d8f3...` | 1 个片段 |
| `chaoshan-dage-7569558745106572019` | 达哥在上海 | 在潮汕汕头高架桥下的深夜烤牛肉，3块的烤牛筋 2块... | 571.4s | `02b506e282c60e...` | 1 个片段 |
| `chaoshan-mizijun-7462282366891937058` | 密子君 | 7元潮汕夜茶初体验！80种茶点不重样！ | 475.8s | `f3d5026b33a625...` | 1 个片段 |
| `chaoshan-xiaozhen-7665542156819451151` | 小珍来咯… | 一家特别温暖的农村大排档 品尝到在外面都没见过的菜... | 910.6s | `04defaaede6c63...` | 1 个片段 |
| `chaoshan-dongmai-7438037425907174719` | 东麦 | 《汕头深夜的实在大排档》5个硬菜150 食物是真好 | 181.1s | `c6e0c14acdb228...` | 1 个片段 |
| `chaoshan-yige-7355328441836752155` | Renyi毅哥 | 深陷潮汕街头烟火气！满满一锅超辣烧牛杂，配上纯鲜嫩... | 156.1s | `c3c335143c6e62...` | 1 个片段 |
| `chaoshan-zhizhi-7601508904490022821` | 汁汁冰激凌 | 建议所有来汕头旅游的都来农贸市场吃饭… | 115.4s | `c9c090f5b75d8b...` | 1 个片段 |
| `chaoshan-dongmai-7651745837265799019` | 东麦 | 开在老城区里的潮汕大排档，这就是人间烟火！ | 145.3s | `029ca3e1725af2...` | 1 个片段 |

---

## 2. 多博主同店归并与美食网络（42 片段 / 35 实体门店）

### A. 6 组多博主同店归并网络（核心亮点）
1. **春梅里卤鹅馆（中山路总店）**【3 位博主归并！】
   - **坐标**：`[116.6869, 23.3589]`
   - **镜头 1**（喵酱饿了）：`chaoshan-miaojiang-chunmeili`（71.6s - 84.0s）狮头鹅全拼
   - **镜头 2**（鱼尾呀）：`chaoshan-yuwei-chunmeili`（62.0s - 82.2s）金牌粉肝与鹅肉
   - **镜头 3**（萌萌鱼）：`chaoshan-mengmengyu-chunmeili`（23.2s - 31.3s）卤鹅三拼配蒜泥醋
2. **阿伯梅汁水果（小公园店）**【2 位博主归并】
   - **坐标**：`[116.6845, 23.3575]`
   - **镜头 1**（喵酱饿了）：`chaoshan-miaojiang-abomeizhi`（185.0s - 192.0s）腌制青芒油柑
   - **镜头 2**（汁汁冰激凌）：`chaoshan-zhizhi-abomeizhi`（47.0s - 72.0s）现切大芒果淋秘制梅汁
3. **吴敬平传统潮州春饼（牌坊街）**【2 位博主归并】
   - **坐标**：`[116.6455, 23.6678]`
   - **镜头 1**（小陆日记）：`chaoshan-xiaolu-wujinpingchunbing`（57.0s - 63.2s）现炸金黄春饼
   - **镜头 2**（AAA阿珅在干饭）：`chaoshan-ashen-wujinpingchunbing`（26.7s - 34.8s）绿豆沙香菇五花肉馅
4. **开元上西平咸水粿（开元路）**【2 位博主归并】
   - **坐标**：`[116.6420, 23.6658]`
   - **镜头 1**（桃姐在路上）：`chaoshan-taojie-kaiyuanshangxipingxianshuiguo`（33.2s - 45.0s）米浆小盏盛热炒菜脯粒
   - **镜头 2**（AAA阿珅在干饭）：`chaoshan-ashen-kaiyuanshangxipingxianshuiguo`（19.7s - 26.7s）老爷爷传统手推车现炊
5. **谢怀亮芝麻茶（潮州总店）**【2 位博主归并】
   - **坐标**：`[116.6450, 23.6640]`
   - **镜头 1**（桃姐在路上）：`chaoshan-taojie-xiehuailiangzhimacha`（45.0s - 57.0s）香滑黑芝麻杏仁太极茶
   - **镜头 2**（AAA阿珅在干饭）：`chaoshan-ashen-xiehuailiangzhimacha`（34.8s - 50.9s）现炸脆油条蘸香浓芝麻茶
6. **谢氏盛兴丸店（龙眼北路总店）**【2 位博主归并】
   - **坐标**：`[116.7062, 23.3720]`
   - **镜头 1**（鱼尾呀）：`chaoshan-yuwei-xieshishengxingwandian`（27.0s - 37.5s）墨斗丸与手打牛丸双拼
   - **镜头 2**（倍增CD了）：`chaoshan-beizeng-xieshishengxingwandian`（16.9s - 54.0s）现挤现煮手打鲜肉丸墨斗卵

### B. 第三批新增特色门店（8 家实体门店）
1. **厝味火锅（十一合店）**（小珍来咯…）：`[116.7842, 23.3855]` 下山虎潮汕老厝庭院，特色卤水火锅与卤粉鹅肝；
2. **高架桥下深夜炭烤牛肉**（达哥在上海）：`[116.7350, 23.3850]` 泰山路高架桥周边市井路边摊，炭烤鲜牛筋牛肉串；
3. **春满园夜茶（普宁流沙店）**（密子君）：`coordinates: null, routeEligible: false, locationStatus: 'unpositioned-archive'` 普宁流沙平价潮汕夜茶，80多种茶点（超出当前底图范围，严格遵守“诚实归档，绝不凭空造点”规范）；
4. **乡村特色柴火大排档（特色农家大院）**（小珍来咯…）：`coordinates: null, routeEligible: false, locationStatus: 'unpositioned-archive'` 农村柴火土灶现烤脆皮烧鹅（乡村无街区线索，诚实归档在视频库）；
5. **华坞宏兴大排档（华坞路店）**（东麦）：`[116.6912, 23.3685]` 华坞市场旁20年老店，猪油大火现炒、普宁炸豆干与爽脆鲜鹅肠；
6. **正五冻品辣粿条（乌桥老店）**（Renyi毅哥）：`[116.6665, 23.3682]` 乌桥二马路廻澜市场大门旁，深夜辣味浓汤底牛腩牛杂细米粿条；
7. **林三满农贸工厂火锅·卤水传承（万象城店）**（汁汁冰激凌）：`[116.7145, 23.3646]` 金砂东路2000平沉浸式菜市档口主题火锅；
8. **黄记饮食店·潮汕家常菜（丹霞庄店）**（东麦）：`[116.7167, 23.3638]` 丹霞庄老社区32年老牌海鲜大排档，招牌杂鱼鼎与生炊海鲜。

### C. 汕头小公园与福平路老城区片区
- 一杯潮茶（小公园店）：`[116.6785, 23.3598]`
- 老市区老字号粿汁：`[116.6660, 23.3538]`
- 福合埕牛肉丸（福平路店）：`[116.6720, 23.3610]`（实测已完美吸附福平路 OSM 主路，路由 ready）
- 爱西干面（小公园总店）：`[116.6815, 23.3592]`
- 跃进鲎粿（福平路总店）：`[116.6715, 23.3610]`
- 广场老姿娘米粉店：`[116.6830, 23.3540]`
- 老市区老饕私藏干面：`[116.6800, 23.3560]`

### D. 汕头龙眼路美食街片区
- 洪记猪肚汤（龙眼南路店）：`[116.7082, 23.3662]`
- 长平老牌肥姐肠粉（龙眼南路分店）：`[116.7075, 23.3675]`
- 苏南特产卤鹅（金平店）：`[116.6710, 23.3685]`
- 同济肠粉：`[116.6725, 23.3710]`
- 谢肥记牛肉（新溪店）：`[116.7900, 23.4150]`

### E. 潮州古城核心片区
- 阿忠石磨肠粉（太平路店）：`[116.6435, 23.6665]`
- 镇前街腐乳鸡翅（牌坊街分店）：`[116.6465, 23.6685]`
- 潮州老牌沙茶花生酱肠粉：`[116.6430, 23.6660]`
- 官塘老陈鱼生：`[116.6480, 23.6645]`
- 潮州地道浓酱花生酱肠粉：`[116.6425, 23.6655]`

### F. 揭阳、普宁、饶平及近郊外延（严格遵守“诚实归档，绝不凭空造点”规范）
- 卢记牛肉店（揭阳东山）：`coordinates: null, routeEligible: false, locationStatus: 'unpositioned-archive'`
- 新辉隆猪脚饭（揭阳揭东）：`coordinates: null, routeEligible: false, locationStatus: 'unpositioned-archive'`
- 欧石村海上鱼排餐厅（饶平县欧石村）：`coordinates: null, routeEligible: false, locationStatus: 'unpositioned-archive'`
- 揭阳老店粿汁（揭阳榕城进贤门）：`coordinates: null, routeEligible: false, locationStatus: 'unpositioned-archive'`
- 春满园夜茶（普宁流沙）：`coordinates: null, routeEligible: false, locationStatus: 'unpositioned-archive'`
- 乡村特色柴火大排档（特色农家大院）：`coordinates: null, routeEligible: false, locationStatus: 'unpositioned-archive'`

---

## 3. 真实地理与 OSM 步行路网拓扑连通

- **Protomaps 矢量底图**：覆盖 `[116.55, 23.3, 116.85, 23.72]`（大小 6.67 MB），完全涵盖汕头老城区、龙湖区、海滨路以及潮州古城区；
- **OSM 步行拓扑路网**：101,797 个节点，23,801 条道路；
- **真实步行路网连通性实测验证**：
  - **新区域连通验证**：
    - 正五冻品辣粿条（乌桥老街） -> 苏南特产卤鹅（金平）：沿金平乌桥跨桥人行道路网，实测距离 **1,636.2 米**，37 个转折节点（`ready`）；
    - 林三满农贸工厂火锅（万象城） -> 黄记饮食店（丹霞庄）：沿金砂东路与华山南路人行道路网，实测距离 **1,899.5 米**，22 个转折节点（`ready`）；
  - **潮州古城内部路线**：
    - 开元上西平咸水粿 -> 谢怀亮芝麻茶：真实古城人行道通行，实测距离 **740.7 米**，8 个转折节点（`ready`）；
    - 谢怀亮芝麻茶 -> 镇前街腐乳鸡翅：牌坊街北段穿行，实测距离 **1,401.9 米**，16 个转折节点（`ready`）；
  - **龙眼南路美食街路线**：
    - 长平肠粉 -> 洪记猪肚汤：沿龙眼南路人行道，实测距离 **166.7 米**，4 个转折节点（`ready`）；
    - 洪记猪肚汤 -> 谢氏盛兴丸店：沿龙眼北路主干人行道，实测距离 **778.4 米**，8 个转折节点（`ready`）；
  - **小公园与福平路路线**：
    - 爱西干面 -> 福合埕牛肉丸：沿国平路经中山路至福平路，实测距离 **1,770.9 米**，30 个转折节点（`ready`）；
    - 福合埕牛肉丸 -> 跃进鲎粿：紧邻福平路交叉口，实测距离 **63.4 米**，2 个节点（`ready`）。
  - **纪律遵守**：严格使用真实 OSM 道路拓扑图计算，严禁使用直线乘以系数冒充。

---

## 4. 产品交互与视频音轨规范核验

1. **多博主归并卡片与详情互链**：
   - 在 `places-chaoshan.html` 列表中，合并显示为 35 张美食卡片，多博主同店卡片顶部自豪呈现“3条同店视频”或“2条同店视频”标识；
   - 在独立详情页中，自动生成“同一家店的其他视频”博主直通链接（如春梅里页面直通鱼尾呀与萌萌鱼）。
2. **视频浮窗占比**：
   - 视频媒体区域占浮窗整体高度的 **69.0%**（占浮窗总面积的 **65.9%**），严格满足至少 2/3 的规范要求。
3. **音轨与播放隔离**：
   - 切店、换片、换博主、关闭浮窗时，旧音轨与视频元素即时停播并清空 src（调用 `video.pause(); video.removeAttribute('src'); video.load()`）。

---

## 5. 自动化测试核验清单

- **数据完整性自动化核验**：`map-base/scripts/review-chaoshan-data.mjs`（**8/8 项全部 PASS**）
  - [PASS] 1. Catalog schema and rights status: user-confirmed
  - [PASS] 2. Local source.mp4 integrity against sourceSHA256 for all sources
  - [PASS] 3. Single-shop clips match expected media keys and H.264+AAC format
  - [PASS] 4. Video posters in assets/video-posters have matching hashes and paths
  - [PASS] 5. Approximate locations stay within Chaoshan bounds with routeEligible=false
  - [PASS] 6. Cross-city catalog uniqueness via allCityCatalogs
  - [PASS] 7. Generated food pages (places-chaoshan.html and detail pages) contain correct content
  - [PASS] 8. Real OSM walking route between Chaoshan shops resolves to ready status
- **真实浏览器 Playwright 自动化核验**：`output/research/chaoshan/browser_test_chaoshan.py`（**19/19 项全部 PASS**）
  - 生成报告：`output/research/chaoshan/chaoshan-batch1-playwright-qa.json`
  - 测试截图落盘于 `output/research/chaoshan/playwright/`：
    - `map-chaoshan-desktop.png`（桌面端 3D 地图展示美食卡片与路网）
    - `map-chaoshan-mobile.png`（移动端 3D 地图自适应）
    - `popover-chaoshan.png`（视频浮窗 2/3 画面占比实测）
    - `places-desktop.png` 与 `places-mobile.png`（全量卡片列表页与同店归并标签）
    - `detail-video-cuoweihuoguo.png`（第三批新增厝味火锅独立详情与视频播放器）
    - `detail-video-chunmeili.png`（多博主同店归并详情与播放器）

---

## 6. Git 资产边界与提交状态

- 原片 MP4、切片 MP4 均严格留存在 `.local/`，未污染 Git 仓库；
- Git 仅提交代码、测试脚本、小封面海报 JPG（`assets/video-posters/`）与元数据 JSON；
- 未修改或覆盖其他城市（重庆、长沙、柳州、南京）的任何私有数据文件；
- 遵循 PR 工作流，在独立工作树分支 `codex/city-chaoshan-prep` 交付。
