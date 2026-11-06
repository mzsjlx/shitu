# 食途 · 柳州（liuzhou）视频摄入与交互验证台账

## 2026-11-06 接续记录

最新素材包名称和 SHA256 见 `map-base/data/media-bundles.json`。下文保留首批制作时的记录。[柳州素材发布](https://github.com/mzsjlx/shitu/releases/tag/media-2026-11-02-liuzhou)

把细节 GeoJSON 的轮廓顶点与 `map-base/data/liuzhou.pmtiles` 的 z15 建筑轮廓比对后，确认 86 条细节轮廓对应 85 个底图要素。`config/cities.json` 中柳州的 `replacedBuildingIds` 保存这些瓦片要素 ID，供平面和立体图层过滤。底图文件 SHA256 为 `06fc19bffd1087a7395b2b7536c667312767df13157324bdf0e227b0c921e335`。更新柳州底图或细节轮廓时须重新比对。地标分层和补绘轮廓是视觉示意。

## 首批制作记录

- **记录日期**：2026-11-01
- **分支**：`codex/city-liuzhou-intake`
- **城市标识**：`liuzhou`（柳州市中心城区 · 城中半岛、柳南区、柳北区）
- **城市边界**：`[109.35, 24.26, 109.47, 24.38]`（WGS84 经度/纬度）
- **底图数据**：`map-base/data/liuzhou.pmtiles`
- **公共代码规范遵循**：严格遵守 `AGENTS.md`、`CITY-AGENT-HANDBOOK.md`、`CITY-AGENT-STARTER.md` 与 `MEDIA-COLLABORATION.md`。

---

## 1. 来源作品与授权信息（共 7 位博主、7 条来源视频）

| 来源 ID | 作者 | 作品标题 | 分享链接 / 原页 | 视频时长 | 来源哈希 (SHA256) | 素材包产物 |
| --- | --- | --- | --- | --- | --- | --- |
| `lz-wangzulan-7575112557141898601` | 王祖蓝 | welcome to“柳”约！和我一起尝尝柳州的早市吧！ | `https://v.douyin.com/HnEwoKc_E8M/`<br>`https://www.douyin.com/video/7575112557141898601` | 203.06s | `0c2b283fea30e36d38eaa0005c9c3a75b180d51e4c3660a4c4a9cbd46c8549a1` | `shitu-media-lz-wangzulan-7575112557141898601-*.zip` |
| `lz-chenhe-7498339315727060264` | 陈赫 | 有人说不来柳州吃螺蛳粉相当于白来柳州？# 螺蛳粉 ... | `https://v.douyin.com/BhR-6trUssQ/`<br>`https://www.douyin.com/video/7498339315727060264` | 134.84s | `438d6f153a59a74c4528290d46b462ffc2f5066339315298bd8a4a818ee137d8` | `shitu-media-lz-chenhe-7498339315727060264-4932dbb41cafde7b.zip` |
| `lz-dage-7688278279576982090` | 达哥在上海 | 在广西柳州一老小区吃爆辣红油螺狮粉，居然一点也不臭... | `https://v.douyin.com/Rw7J-Zdbes8/`<br>`https://www.douyin.com/video/7688278279576982090` | 395.02s | `e08f3b79cd5b066c06c9e4e533b5556d424d9a6c2f3b9feec36240c341a9cf68` | `shitu-media-lz-dage-7688278279576982090-2c20cc30dc1c2444.zip` |
| `lz-xiaojiu-7528722963782159659` | 天才少女小酒 | 柳州我最害怕倒闭的老破店！不太好找，但真的巨巨好吃 | `https://v.douyin.com/G39HmE7jAm8/`<br>`https://www.douyin.com/video/7528722963782159659` | 17.87s | `6bddcbea0cd46a8f1b12efaf4dd0b49024c3d39f7cca0b3c3d61d07e535b537c` | `shitu-media-lz-xiaojiu-7528722963782159659-93b0ec4cdc81b1b4.zip` |
| `lz-xiaobaozha-7689477707755025563` | 小爆炸 | 拜见柳州宵夜大王！！！！这一桌真的夯爆了！！！！ | `https://v.douyin.com/3kAS9i5rMsw/`<br>`https://www.douyin.com/video/7689477707755025563` | 25.29s | `f4389ce359a8c6796b9044e7e9f6e0d457efd4d44263a087aa0c706de3d36947` | `shitu-media-lz-xiaobaozha-7689477707755025563-037dad655e2b3ceb.zip` |
| `lz-rourou-7115662751636147459` | 肉肉大搜索 | 柳州藏在菜市场里“有螺蛳肉的螺蛳粉”，配上一个小龙虾尾好丰富 | `https://v.douyin.com/LUg1TGA6NvM/`<br>`https://www.douyin.com/video/7115662751636147459` | 207.19s | `cf186224f166fb57360832c3eb26511a7b204ebe7be337356953785b6fcf26fd` | `shitu-media-lz-rourou-7115662751636147459-1fe4a9f2a45d5ef1.zip` |
| `lz-tangshixiong-7699430467695148651` | 汤氏熊 | 柳州，远不止螺蛳粉！ 72小时连吃10家本地特色，20种美食 | `https://v.douyin.com/3Yo15R_hbsA/`<br>`https://www.douyin.com/video/7699430467695148651` | 1007.03s | `d94417b5255dfe0d56b4acb9634c295768014ef381b78cd7a5a0ce96d75cf514` | `shitu-media-lz-tangshixiong-7699430467695148651-9bc521588b5fe945.zip` |

> 授权状态：`user-confirmed`（会话内经用户确认授权使用，保留原作者署名与原平台链接；原视频完整存放于 `.local/video-intake/`，仅提炼门店片段与封面进 Git/Release）。

---

## 2. 门店认店、片段剪辑与近似定位（共 9 家门店）

### ① 张记玉米汁（王祖蓝）
- **片段 ID**：`lz-wangzulan-zhangji`
- **店名**：张记玉米汁（20年老店）
- **类别**：饮品 / 甜品
- **原片时间戳**：`48.0s` ～ `54.5s`（时长 6.5s），封面取第 `49.5s`
- **门店简介**：青云民生市场20年老字号现榨玉米汁，香浓顺滑、温热清甜，王祖蓝喝完直呼“太好喝了”。
- **地址文本**：柳州市城中区中山西路樵家巷9号（青云民生市场内）
- **WGS84 坐标**：`[109.40585, 24.31438]`（青云民生市场 · 中山西路樵家巷入口）

### ② 卓和记猪肉脯（王祖蓝）
- **片段 ID**：`lz-wangzulan-zhuoheji`
- **店名**：卓和记猪肉脯
- **类别**：特色小吃 / 伴手礼
- **原片时间戳**：`54.5s` ～ `65.5s`（时长 11.0s），封面取第 `56.0s`
- **门店简介**：青云市场现烤厚切猪肉脯，现场炭火铁板烤制、香气浓郁，王祖蓝尝后连赞厚实好吃。
- **地址文本**：柳州市城中区青云民生市场内（近中山西路入口通道）
- **WGS84 坐标**：`[109.40583, 24.31415]`（青云民生市场 · 樵家巷熟食区）

### ③ 青云老牌潘姐小吃（王祖蓝）
- **片段 ID**：`lz-wangzulan-panjie`
- **店名**：青云老牌潘姐小吃
- **类别**：特色小吃 / 糯米饭
- **原片时间戳**：`93.0s` ～ `109.0s`（时长 16.0s），封面取第 `94.0s`
- **门店简介**：青云市场招牌特色五色糯米饭，选用天然植物染色的彩色糯米，铺满腊肠、酸菜、肉松与炸腐竹等丰富配料，7元一大碗份量扎实。
- **地址文本**：柳州市城中区青云民生市场内（樵家巷中段）
- **WGS84 坐标**：`[109.40581, 24.31380]`（青云民生市场 · 樵家巷中段小吃区）

### ④ 杨记阿柠檬螺蛳粉（陈赫）
- **片段 ID**：`lz-chenhe-aningmeng`
- **店名**：杨记阿柠檬螺蛳粉
- **类别**：特色小吃 / 螺蛳粉
- **原片时间戳**：`58.0s` ～ `78.0s`（时长 20.0s），封面取第 `65.0s`
- **门店简介**：柳州开了二十多年的老牌夜宵螺蛳粉，以料足汤浓著称，陈赫打卡必点虎皮猪脚、炸蛋与大盆卤肥肠，酸爽过瘾。
- **地址文本**：柳州市柳南区潭中西路北一巷8号（近壶西实验中学）
- **WGS84 坐标**：`[109.38986, 24.33934]`（潭中西路北一巷 · 壶西实验中学旁）

### ⑤ 曹妹螺蛳粉（达哥在上海）
- **片段 ID**：`lz-dage-caomei`
- **店名**：曹妹螺蛳粉（曹子妹螺蛳粉 · 柳锌总店）
- **类别**：特色小吃 / 螺蛳粉
- **原片时间戳**：`15.0s` ～ `35.0s`（时长 20.0s），封面取第 `20.0s`
- **门店简介**：藏在柳锌老小区里的市井烟火宝藏老店，红油浓郁醇厚，炸蛋蓬松饱吸汤汁，木薯糖水清甜解辣，达哥盛赞一点都不臭、真的香。
- **地址文本**：柳州市柳北区白沙路5号柳锌小区10栋对面
- **WGS84 坐标**：`[109.42060, 24.33870]`（柳锌小区 · 白沙路5号老生活区）

### ⑥ 煨婆婆（天才少女小酒）
- **片段 ID**：`lz-xiaojiu-weipopo`
- **店名**：煨婆婆（公园路店）
- **类别**：特色小吃 / 铁板排档
- **原片时间戳**：`0.0s` ～ `17.5s`（时长 17.5s），封面取第 `4.0s`
- **门店简介**：藏在柳侯公园旁老巷子里的市井烟火排档，招牌炭火铁板猪脚皮糯肉烂、热油酱汁浇淋滋滋作响，搭配铁板排骨与鲜虾煲，是本地人私藏的夜宵宝藏老店。
- **地址文本**：柳州市城中区公园路44号（近柳侯公园）
- **WGS84 坐标**：`[109.41240, 24.31820]`（公园路44号 · 柳侯公园南门片区）

### ⑦ 雷老板家烧烤（小爆炸）
- **片段 ID**：`lz-xiaobaozha-leilaoban`
- **店名**：雷老板家烧烤（窑埠店）
- **类别**：宵夜 / 烧烤排档
- **原片时间戳**：`0.0s` ～ `20.0s`（时长 20.0s），封面取第 `5.0s`
- **门店简介**：窑埠古镇超人气夜宵大王，招牌鱼籽生牛裹满青金桔与薄荷蘸酱酸辣爽口，大盘烤牛肉、烤肥肠与炭烤海鲜份量霸道，夜宵氛围直接拉满。
- **地址文本**：柳州市鱼峰区蟠龙路9号窑埠古镇B区44栋第一层3号
- **WGS84 坐标**：`[109.42310, 24.32480]`（窑埠古镇B区 · 蟠龙路9号）

### ⑧ 高家螺蛳粉店（肉肉大搜索）
- **片段 ID**：`lz-rourou-gaojia`
- **店名**：高家螺蛳粉店
- **类别**：特色小吃 / 螺蛳粉
- **原片时间戳**：`0.0s` ～ `15.0s`（时长 15.0s），封面取第 `2.0s`
- **门店简介**：藏在火车站旁大鹅山菜市里的老字号螺蛳粉，最大亮点是能吃到货真价实的大勺炒螺蛳肉，酸笋脆爽，配菜丰富，配上小龙虾尾和油葱极其过瘾。
- **地址文本**：柳州市柳南区鹅山路大鹅山菜市31之一号
- **WGS84 坐标**：`[109.38750, 24.31680]`（大鹅山菜市 · 鹅山路31-1号）

### ⑨ 刘姐鲜肉螺蛳粉（汤氏熊）
- **片段 ID**：`lz-tangshixiong-liujie`
- **店名**：刘姐鲜肉螺蛳粉（总店）
- **类别**：特色小吃 / 炒螺蛳粉
- **原片时间戳**：`19.0s` ～ `39.0s`（时长 20.0s），封面取第 `20.0s`
- **门店简介**：连塘路上的老牌名店，荣获柳州最具创意螺蛳粉品牌，据传是柳州最早首创炒螺蛳粉的老店之一；大火爆炒锅气喷香，螺蛳大颗入味，虎皮猪脚酥烂饱汁。
- **地址文本**：柳州市城中区中南街道连塘路90号
- **WGS84 坐标**：`[109.40190, 24.31692]`（连塘路90号 · 中南街道）

---

## 3. 视觉与交互体验升级

1. **地图美食标记默认折叠为圆形小图标**：
   - 地图上的美食标记默认呈现为 40×40px 的圆形图钉（`.food-card.is-collapsed`），带品牌暖色外圈阴影与图片封面，视野清爽通透，不遮挡地图道路和相邻地点。
   - 点击圆形小图标时平滑展开为完整长方形卡片，且同一时刻仅展开被选中的卡片。
   - 展开的长方形卡片右上角增加专用的“×”关闭按钮（`.food-card-close`），点击即可收回圆形图钉，支持纯粹浏览且不误触“加入想去”逻辑。
2. **距离标签防遮挡缩放控制**：
   - 标签文字缩小至 10px 精巧尺寸，内边距压缩为 `3px 8px`，背景采用高辨识度的柔和白暖色底。
   - 当地图缩放级别低于 16.5（城市概览/片区级视图）时，距离标签自动平滑隐藏（`.is-zoom-hidden`），彻底消除大字号文字重叠遮挡图标的现象。
   - 当地图放大至 16.5 以上（街道近景级视图）时，距离标签平滑呈现，指引街巷步行。

---

## 4. 真实道路拓扑与双模式距离计算

- **路网抽取**：`map-base/data/cities/liuzhou/food-road-network.json`（1.16 MB）
  - 覆盖城中半岛、青云市场、柳南区及柳北区真实路网，基于 OSM/Protomaps 矢量瓦片连通拓扑构建。
- **双模式计算实测**：
  - **直线距离**：直接计算大圆测地线距离，支持跨城区全部 9 家地点连线规划。
  - **沿路步行距离**：遵循真实源节点拓扑；青云市场片区连通道路计算出 **49.7 米** 真实步行距离；跨城区远距离断路如实提示道路连通状态，绝不使用虚假系数拼凑伪造路线。

---

## 5. 自动化回归测试（16/16 全部通过）

执行测试脚本：`node map-base/scripts/review-liuzhou.mjs`
测试报告：`output/research/liuzhou/QA-LIUZHOU-INTAKE.json`

| # | 验证项 | 结果 | 说明 |
|---|---|---|---|
| 1 | Liuzhou city identified correctly | ✓ PASS | 城市名正确识别为“柳州”，激活 liuzhou 城市上下文 |
| 2 | 9 food records loaded across Liuzhou | ✓ PASS | 9 家美食卡片跨片区正常载入 |
| 3 | All 9 records have local MP4 clips and JPG posters | ✓ PASS | 全部 9 个片段均具有本地 H.264+AAC MP4 与高清封面 |
| 4 | All 9 food markers default to collapsed circular icon badges | ✓ PASS | 9 个标记默认全部呈现为精简圆形图标，不遮挡视线 |
| 5 | Clicking circular badge expands ONLY that card into rectangle with "×" close button | ✓ PASS | 点击圆形标记仅展开自身长方形卡片，带右上角叉叉关闭按钮 |
| 6 | Clicking "×" close button collapses card back into circular icon badge | ✓ PASS | 点击右上角“×”关闭按钮顺畅折叠还原 |
| 7 | Popover opened and video is playing with advancing playback | ✓ PASS | 浮窗展开视频播放，画面推进正常，音画合规 |
| 8 | Direct distance mode active with 9 saved stops | ✓ PASS | 9 站想去连线，直线模式计算准确 |
| 9 | Distance badge auto-hides when zoomed out (< 16.5) | ✓ PASS | 地图缩小 (< 16.5) 时距离标签自动隐藏防遮挡 |
| 10 | Distance badge smoothly appears when zoomed in (>= 16.5) | ✓ PASS | 地图放大 (>= 16.5) 时距离标签自然浮现 |
| 11 | Road mode truthfully reports route status across Liuzhou | ✓ PASS | 如实显示各段道路拓扑连通状态，不造假拼凑 |
| 12 | Local storage keys isolated to Liuzhou | ✓ PASS | 本地存储独立隔离为 `foodcity:*:liuzhou:v1` |
| 13 | Road mode computes fully connected route for Qingyun Market cluster | ✓ PASS | 青云市场片区 3 店毫秒级计算出 49.7 米沿路真实路网折线 |
| 14 | Mobile layout renders cards and trip dock | ✓ PASS | 390×844 移动视口 9 家卡片与行程栏适配无误 |
| 15 | Chongqing city loads with correct city name | ✓ PASS | 重庆城市切回正常（`?city=chongqing`） |
| 16 | Chongqing records are not polluted by Liuzhou records | ✓ PASS | 重庆数据完整隔离，无柳州脏数据污染 |

---

## 6. 截图归档清单

- `output/research/liuzhou/screenshots/liuzhou-food-overview.png`：柳州全城 9 家美食圆形图标概览（无遮挡）
- `output/research/liuzhou/screenshots/liuzhou-card-expanded.png`：点击圆形图标展开长方形卡片与带“×”关闭按钮
- `output/research/liuzhou/screenshots/liuzhou-video-popover.png`：视频浮窗顺滑播放（陈赫打卡阿柠檬螺蛳粉）
- `output/research/liuzhou/screenshots/liuzhou-road-distance.png`：沿路步行距离计算与行程栏
- `output/research/liuzhou/screenshots/liuzhou-wants-dialog.png`：想去清单弹窗
- `output/research/liuzhou/screenshots/liuzhou-mobile.png`：手机视口自适应布局
