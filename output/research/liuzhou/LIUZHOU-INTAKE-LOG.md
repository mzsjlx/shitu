# 食途 · 柳州（liuzhou）首批视频摄入与验证台账

- **记录日期**：2026-11-01
- **分支**：`codex/city-liuzhou-intake`
- **城市标识**：`liuzhou`（柳州市中心城区 · 城中半岛至青云市场片区）
- **城市边界**：`[109.35, 24.26, 109.47, 24.38]`（WGS84 经度/纬度）
- **底图数据**：`map-base/data/liuzhou.pmtiles`
- **公共代码规范遵循**：严格遵守 `AGENTS.md`、`CITY-AGENT-HANDBOOK.md`、`CITY-AGENT-STARTER.md` 与 `MEDIA-COLLABORATION.md`。

---

## 1. 来源作品与授权信息

| 字段 | 详情 |
| --- | --- |
| **来源 ID** | `lz-wangzulan-7575112557141898601` |
| **作者** | 王祖蓝 |
| **作品标题** | welcome to“柳”约！和我一起尝尝柳州的早市吧！ |
| **分享链接** | `https://v.douyin.com/HnEwoKc_E8M/` |
| **规范作品原页** | `https://www.douyin.com/video/7575112557141898601` |
| **发布日期** | 2025-11-22 |
| **授权状态** | `user-confirmed`（会话内用户明确授权使用，保留原作者署名与原平台链接） |
| **原片位置** | `.local/video-intake/lz-wangzulan-7575112557141898601/source.mp4` |
| **原片参数** | 203.060s, 1080x1920 (9:16), H.264 + AAC 44.1kHz stereo, 63,721,630 字节 |
| **原片 SHA256** | `0c2b283fea30e36d38eaa0005c9c3a75b180d51e4c3660a4c4a9cbd46c8549a1` |

---

## 2. 门店认店、片段剪辑与近似定位

经原片核对与青云民生市场现场招牌识别，完整拆分 3 家老牌代表小吃门店：

### ① 张记玉米汁
- **片段 ID**：`lz-wangzulan-zhangji`
- **店名**：张记玉米汁（20年老店）
- **类别**：饮品 / 甜品
- **原片时间戳**：`48.0s` ～ `54.5s`（时长 6.5s），封面取第 `49.5s`
- **门店简介**：青云民生市场20年老字号现榨玉米汁，香浓顺滑、温热清甜，王祖蓝喝完直呼“太好喝了”。
- **地址文本**：柳州市城中区中山西路樵家巷9号（青云民生市场内）
- **WGS84 坐标**：`[109.40585, 24.31438]`（青云民生市场 · 中山西路樵家巷入口）
- **剪辑与封面文件**：
  - 视频：`lz-wangzulan-zhangji-13ffb75d0fe754f0.mp4`（3,424,797 字节）
  - 封面：`lz-wangzulan-zhangji-13ffb75d0fe754f0.jpg`（198,880 字节）

### ② 卓和记猪肉脯
- **片段 ID**：`lz-wangzulan-zhuoheji`
- **店名**：卓和记猪肉脯
- **类别**：特色小吃 / 伴手礼
- **原片时间戳**：`54.5s` ～ `65.5s`（时长 11.0s），封面取第 `56.0s`
- **门店简介**：青云市场现烤厚切猪肉脯，现场炭火铁板烤制、香气浓郁，王祖蓝尝后连赞厚实好吃。
- **地址文本**：柳州市城中区青云民生市场内（近中山西路入口通道）
- **WGS84 坐标**：`[109.40583, 24.31415]`（青云民生市场 · 樵家巷熟食区）
- **剪辑与封面文件**：
  - 视频：`lz-wangzulan-zhuoheji-97ebc37244c55470.mp4`（6,381,744 字节）
  - 封面：`lz-wangzulan-zhuoheji-97ebc37244c55470.jpg`（267,061 字节）

### ③ 青云老牌潘姐小吃
- **片段 ID**：`lz-wangzulan-panjie`
- **店名**：青云老牌潘姐小吃
- **类别**：特色小吃 / 糯米饭
- **原片时间戳**：`93.0s` ～ `109.0s`（时长 16.0s），封面取第 `94.0s`
- **门店简介**：青云市场招牌特色五色糯米饭，选用天然植物染色的彩色糯米，铺满腊肠、酸菜、肉松与炸腐竹等丰富配料，7元一大碗份量扎实。
- **地址文本**：柳州市城中区青云民生市场内（樵家巷中段）
- **WGS84 坐标**：`[109.40581, 24.31380]`（青云民生市场 · 樵家巷中段小吃区）
- **剪辑与封面文件**：
  - 视频：`lz-wangzulan-panjie-07e7661fda79898d.mp4`（10,737,060 字节）
  - 封面：`lz-wangzulan-panjie-07e7661fda79898d.jpg`（273,082 字节）

---

## 3. 真实道路拓扑与双模式距离计算

- **路网抽取脚本**：`map-base/scripts/prepare-liuzhou-road-network.mjs`
- **路网产物**：`map-base/data/cities/liuzhou/food-road-network.json`（1.16 MB）
  - 包含柳州城中核心片区 22,168 个真实节点、5,032 条道路、21,444 个路段。
  - 保留真实步道与街区服务道路拓扑；排除车辆单行对步行路线的不当绕行限制。
- **双模式实测距离（青云市场 3 站连续规划）**：
  - **直线距离**：约 60 米（相邻地点大圆距离连线）
  - **沿路步行距离**：沿樵家巷真实步道拓扑为 **49.7 米**，吸附偏移量仅 1.2m～12m，展现青云民生市场真实的早市逛吃漫步体验。

---

## 4. 自动化回归验证结果（10/10 通过）

使用无头 Edge 浏览器执行独立环境全自动化测试（`map-base/scripts/review-liuzhou.mjs`）：
- **测试报告保存**：`output/research/liuzhou/QA-LIUZHOU-INTAKE.json`
- **验证项汇总**：
  1. `✓ PASS: Liuzhou city identified correctly`：城市名正确解析为“柳州”，城市上下文为 `liuzhou`。
  2. `✓ PASS: 3 food records loaded at Qingyun Market`：3家门店卡片正确加载于青云民生市场。
  3. `✓ PASS: All 3 records have local MP4 clips and JPG posters`：全部 3 个条目均具有本地 MP4 剪辑和高清封面。
  4. `✓ PASS: Popover opened and video is playing with advancing playback`：点击卡片顺利展开顺滑浮窗，视频在浮窗内直接播放且画面真实推进。
  5. `✓ PASS: Direct distance mode active with 3 saved stops`：想去清单加入3站，直线模式显示约60米。
  6. `✓ PASS: Road mode computed realistic route using Liuzhou road network`：切换“沿路”模式后，路网 Worker 毫秒级计算出 49.7 米真实步行路径，地图渲染真实路网折线。
  7. `✓ PASS: Local storage keys isolated to Liuzhou`：本地存储键严格隔离在 `foodcity:wants:liuzhou:v1` 和 `foodcity:distance-mode:liuzhou:v1`。
  8. `✓ PASS: Mobile layout renders cards and trip dock`：390x844 手机视口下卡片与底部行程栏适配完好。
  9. `✓ PASS: Chongqing city loads with correct city name`：访问 `?city=chongqing` 正确显示重庆主城地图。
  10. `✓ PASS: Chongqing records are not polluted by Liuzhou records`：重庆 60 个地图点完全不受柳州数据污染。

- **截图归档**：
  - `output/research/liuzhou/screenshots/liuzhou-food-overview.png`
  - `output/research/liuzhou/screenshots/liuzhou-video-popover.png`
  - `output/research/liuzhou/screenshots/liuzhou-road-distance.png`
  - `output/research/liuzhou/screenshots/liuzhou-wants-dialog.png`
  - `output/research/liuzhou/screenshots/liuzhou-mobile.png`

---

## 5. 素材包交付物与规范

依据 `MEDIA-COLLABORATION.md` 打包的跨机器交付包：
- **位置**：`map-base/.local/media-bundles/shitu-media-lz-wangzulan-7575112557141898601-e5abd9e724eecc8c.zip`
- **体积**：`85,011,082 字节`（81.07 MB）
- **SHA256**：`4e20f80764bbecbfc5ed9517a979ab6d606b9faafeefbbc64e9a404cc648a689`
- **内容物**：
  - 完整 1080p 原片：`video-intake/lz-wangzulan-7575112557141898601/source.mp4`
  - 3 个剪辑 MP4：`video-clips/lz-wangzulan-7575112557141898601/*.mp4`
  - 3 张高清原片封面：`video-clips/lz-wangzulan-7575112557141898601/*.jpg`
  - 清单：`bundle.json`
- **使用命令**：在另一台机器上执行 `npm run media:import -- <素材包路径>` 即可秒级导入并校验哈希。

---

## 6. 后续待处理视频来源

1. **达哥在上海**：`https://v.douyin.com/Rw7J-Zdbes8/`（老小区爆辣红油螺蛳粉）
2. **陈赫**：`https://v.douyin.com/BhR-6trUssQ/`（柳州螺蛳粉探店）
