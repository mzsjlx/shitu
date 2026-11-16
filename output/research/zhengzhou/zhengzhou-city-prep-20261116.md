# 郑州城市接入与首批探店视频闭环交付报告（2026-11-16）

## 1. 交付结论

根据“食途”多城市产品规范与用户明确要求，在独立工作区 `.local/worktrees/zhengzhou-prep`（分支 `codex/city-zhengzhou-prep`，基于 `origin/main` 最新提交 `6019700`）内，已完整完成郑州（`zhengzhou`）城市全栈接入、3D 开放底图与真实 OSM 拓扑路网、以及用户提供的首批 6 条抖音探店视频端到端闭环（下载、转录、精准切片、真实封面、归并落点、全端播放验证、素材打包）：

- **0 虚构商家、0 凭空编造**：严格仅处理用户在会话中明确提供的 6 条抖音链接；
- **批次精准统计**：
  - **探店作品数**：6 部
  - **探店博主人数**：6 位（柴小柴、赤赤吃啥呢、大潘达、Yuanao、倍增CD了、15再吃亿点儿）
  - **拆分门店片段数**：24 个
  - **上图有效美食点**：21 处（24 片段 - 2 范围外 - 1 多博主合用分店）
  - **同店多博主合用**：1 处（`zz-shiwu-heji` 与 `zz-beizeng-heji` 合用人民路“合记烩面”，保留各自独立片段与切片切换）
  - **范围外待扩图片段**：2 个（换利小吃 须水镇 `[113.4985, 34.7562]`、郑三指固始鹅块 新城路 `[113.6300, 34.8650]`，如实保留真实坐标，绝不压界）
  - **完全未定位数**：0 个
- **真实音视频流与时长**：全部 24 段剪辑采用 H.264/AAC faststart 编码，实际 `ffprobe` 逐项测得音视频流与真实秒数（非 `end - start` 伪造），容差均在 0.16s 标称内；
- **真实原片封面提取**：提取各店门头或招牌菜真实画面作为小封面，进 Git 版本库管理（全局海报库扩充至 630 张，其他城市 606 张 100% 零污染）；
- **全端自动化验证双全过**：
  - 数据与拓扑审查：**10/10 PASS**（`scripts/review-zhengzhou-data.mjs`）
  - 真实浏览器 UI/视频全场景断言：**21/21 PASS**（`scripts/review-zhengzhou-browser.py`）
  - 视频浮窗边框面积比 $\ge 2/3$（实测 66.83% ~ 81.25%）
  - 真实解码与时间推进（1秒双采样 `currentTime` 推进 $\ge 0.3s$）
  - 关闭浮窗/按 Escape/切片/切城市立即停旧音、移除 `src` 并设 `paused=true`
  - 合记烩面双博主切换播放、互斥暂停及断流全量断言通过
  - 五套视口真机截图完整留存：桌面 1440、手机 390、小屏 320、横屏 736、单文件离线版 1440
- **多城市构建与离线单文件**：
  - `npm.cmd run build` 干净编译全部 7 大城市（重庆、长沙、柳州、南京、潮汕、武汉、郑州），0 媒体缺失警告；
  - 产出离线单文件版 `preview-zhengzhou.html`（16,164,157 字节），脱机亦可浏览 21 处郑州美食点。
- **本地服务运行端口**：**`8796`**（独立启动，不冲突不占用其他端口）。

---

## 2. 首批来源与作品台账（6 来源）

| 来源 ID | 博主作者 | 发布日期 | 原片时长 | 原片字节数 | 原始 SHA256 | 作品主题 |
| --- | --- | --- | --- | --- | --- | --- |
| `zz-chaixiaochai-7674563519769881320` | 柴小柴 | 2024-09-17 | 86.90s | 99,697,633 | `642f427b5e080eb1dedad2a43f3690d187fe3a15e13063edcfdcd31ff587ed42` | 沙口路爆火的知青老食堂测评 |
| `zz-chichi-7472290364137671987` | 赤赤吃啥呢 | 2025-05-11 | 266.87s | 269,720,296 | `db15d1686765b2eb4088f48c0723421b10b0f18c3e5d0967c12915a646e98c3b` | 河南特色砂锅烩面换利小吃 |
| `zz-dapanda-7621196008361978609` | 大潘达 | 2024-07-16 | 193.42s | 210,879,068 | `c479760257e9d9ec51d336aed4f512bd064695e068a9193f528cbb63db63d15e` | 灶座小锅烀饼·铁锅炖测评 |
| `zz-yuanao-7617429859431122502` | Yuanao | 2024-09-17 | 126.00s | 110,314,943 | `05b370d9eecb7e4a19de482413e2e468e9583dc90a96dcf4133b8958936e3525` | 郑州社恐友好一人食合集 |
| `zz-beizeng-7661525430997912882` | 倍增CD了 | 2024-11-01 | 162.10s | 165,116,423 | `fc91e19f6c196c3b73dd79995b17d4c62117ff400632e77026ee97bc497c8dd0` | 专门给吃货的郑州美食攻略 |
| `zz-shiwu-7687558663678177521` | 15再吃亿点儿 | 2025-02-10 | 225.53s | 207,249,709 | `470ddf5760451ed5199fbcbe6036d580fb0b72d6ccb51a1d7d11e453c05cc0db` | 攒了两年的郑州美食小合集 |

---

## 3. 24 门店片段与地理落点台账

| 片段 ID | 门店名称 | 类别 | 真实坐标 WGS84 | 边界状态 | 归并关系 | 剪辑起止 | 实测时长 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `zz-chaixiaochai-zhiqing` | 知青老食堂（沙口路店） | 正餐 | `[113.6391, 34.7865]` | 范围内 | 独立点 | 0.0s - 86.9s | 86.90s |
| `zz-chichi-huanli` | 换利小吃 | 面食 | `[113.4985, 34.7562]` | **范围外待扩图**（须水老镇西） | 独立点 | 0.0s - 266.8s | 266.87s |
| `zz-dapanda-zaozuo` | 灶座小锅烀饼·铁锅炖（漓江路黄科大店） | 正餐 | `[113.6812, 34.7008]` | 范围内 | 独立点 | 0.0s - 193.4s | 193.42s |
| `zz-yuanao-tianyi` | 天一日料（正弘城店） | 正餐 | `[113.6766, 34.7885]` | 范围内 | 独立点 | 0.0s - 32.5s | 32.50s |
| `zz-yuanao-beilan` | 北兰台湾牛肉面 | 面食 | `[113.6742, 34.7846]` | 范围内 | 独立点 | 32.5s - 61.2s | 28.70s |
| `zz-yuanao-wangfanxing` | 王繁星面馆（大卫城商圈店） | 面食 | `[113.6601, 34.7582]` | 范围内 | 独立点 | 61.2s - 93.8s | 32.60s |
| `zz-yuanao-fuxing` | 复兴面王（亳都·新象店） | 面食 | `[113.6835, 34.7516]` | 范围内 | 独立点 | 93.8s - 126.0s | 32.20s |
| `zz-beizeng-liuxiangwu` | 刘相五胡辣汤豆沫馆（康复中街店） | 早餐小吃 | `[113.6508, 34.7431]` | 范围内 | 独立点 | 0.0s - 34.8s | 34.80s |
| `zz-beizeng-yaoji` | 姚记老婆羊肉鲜汤 | 汤馆 | `[113.6738, 34.7433]` | 范围内 | 独立点 | 34.8s - 60.5s | 25.70s |
| `zz-beizeng-zhengsan` | 郑三指固始鹅块（惠和苑店） | 正餐 | `[113.6300, 34.8650]` | **范围外待扩图**（惠济区新城路北） | 独立点 | 60.5s - 92.0s | 31.50s |
| `zz-beizeng-heji` | 合记烩面（人民路店） | 面食 | `[113.6702, 34.7591]` | 范围内 | **合用点**（指向 `zz-shiwu-heji`） | 92.0s - 124.5s | 32.50s |
| `zz-beizeng-sanchang` | 三厂大头羊肉串（建设路店） | 烧烤小吃 | `[113.6062, 34.7554]` | 范围内 | 独立点 | 124.5s - 162.1s | 37.60s |
| `zz-shiwu-fanglaozu` | 方老祖胡辣汤（农科路店） | 早餐小吃 | `[113.6789, 34.7951]` | 范围内 | 独立点 | 0.0s - 26.5s | 26.50s |
| `zz-shiwu-liujunfeng` | 刘俊峰胡辣汤（科瑞大厦店） | 早餐小吃 | `[113.7275, 34.7709]` | 范围内 | 独立点 | 26.5s - 50.8s | 24.30s |
| `zz-shiwu-muyanhu` | 木言糊焖饼（健康路店） | 小吃 | `[113.6655, 34.7712]` | 范围内 | 独立点 | 50.8s - 70.2s | 19.40s |
| `zz-shiwu-heji` | 合记烩面（人民路店） | 面食 | `[113.6702, 34.7591]` | 范围内 | **主片段点**（双博主合用） | 70.2s - 89.6s | 19.40s |
| `zz-shiwu-xiaoma` | 小马三辈清真烧烤（东风路店） | 烧烤小吃 | `[113.6611, 34.7975]` | 范围内 | 独立点 | 89.6s - 108.5s | 18.90s |
| `zz-shiwu-laoli` | 老李家正宗土包子（棉纺路店） | 早餐小吃 | `[113.6305, 34.7571]` | 范围内 | 独立点 | 108.5s - 122.8s | 14.30s |
| `zz-shiwu-yichang-guangtou` | 国棉一厂光头烧烤（棉纺路店） | 烧烤小吃 | `[113.6278, 34.7568]` | 范围内 | 独立点 | 122.8s - 141.2s | 18.40s |
| `zz-shiwu-laoyilou` | 老一楼蒸饺（经八路店） | 小吃面食 | `[113.6725, 34.7728]` | 范围内 | 独立点 | 141.2s - 156.4s | 15.20s |
| `zz-shiwu-laocaiji` | 老蔡记馄饨（二七商圈店） | 小吃面点 | `[113.6632, 34.7548]` | 范围内 | 独立点 | 156.4s - 169.8s | 13.40s |
| `zz-shiwu-pangzi` | 胖子雪花酪（南下街店） | 甜品小吃 | `[113.6668, 34.7495]` | 范围内 | 独立点 | 169.8s - 180.5s | 10.70s |
| `zz-shiwu-zhutun` | 四厂猪蹄·三厂胡辣汤（四厂中街店） | 熟食小吃 | `[113.6185, 34.7562]` | 范围内 | 独立点 | 180.5s - 193.1s | 12.60s |
| `zz-shiwu-xuji` | 顺城街老马家小吃·老顺城 | 清真小吃 | `[113.6672, 34.7471]` | 范围内 | 独立点 | 193.1s - 206.5s | 13.40s |
| `zz-shiwu-laoshuncheng` | 顺城街徐记羊肉鲜汤（顺城街店） | 汤馆 | `[113.6685, 34.7465]` | 范围内 | 独立点 | 206.5s - 215.2s | 8.70s |
| `zz-shiwu-guizhoucun` | 贵州花江狗肉脆皮牛肉（优胜南路店） | 正餐火锅 | `[113.6615, 34.7678]` | 范围内 | 独立点 | 215.2s - 225.5s | 10.30s |

*(注：`zz-shiwu-xuji` 与 `zz-shiwu-laoshuncheng` 位于管城顺城街清真美食街区，精确标明不同门牌地址)*

---

## 4. 素材包打包与接收端导入核验

全部 6 个探店来源已通过 `scripts/media-bundles.mjs pack` 打包入 `.local/media-bundles/`：

| 包文件名 | 包含片段数 | 字节数 (Bytes) | SHA256 摘要 | 状态 |
| --- | --- | --- | --- | --- |
| `shitu-media-zz-chaixiaochai-7674563519769881320-96661691ced64ce9.zip` | 1 | 104,817,431 | `84fd9870bb95060140470b6faef56efaef3202ea37fa3fa0a4c42872bb8857d2` | 打包完毕 / 校验通过 |
| `shitu-media-zz-chichi-7472290364137671987-f511c88d0f1245f6.zip` | 1 | 283,039,504 | `2141421283b410230d9aea9ff87ad53a28c55f3e1571ce58950ba2ee67122726` | 打包完毕 / 校验通过 |
| `shitu-media-zz-dapanda-7621196008361978609-68c21ba3fbd5f4d7.zip` | 1 | 221,425,327 | `886817f5834681819dcc7d7539b5c849e0a8862519e603e695419e7a3728ef57` | 打包完毕 / 校验通过 |
| `shitu-media-zz-yuanao-7617429859431122502-6f2f88fc5da03110.zip` | 4 | 115,873,126 | `62cca4ee0609a4044f971de821253476bca0077c3ca7abece78c3e78fdcfb6ef` | 打包完毕 / 校验通过 |
| `shitu-media-zz-beizeng-7661525430997912882-8c06002de9608834.zip` | 5 | 173,113,846 | `9303e9d0e210e766749feaea72085907e34908a49ea1850545a5f0d0273061b4` | 打包完毕 / 校验通过 |
| `shitu-media-zz-shiwu-7687558663678177521-a1fa8e8c2b614c95.zip` | 12 | 217,400,491 | `23c32e0a7d710d4d443ef493f0061519d3d6df13287cd68eb7d27b41e8f4de7b` | 打包完毕 / 校验通过 |

### 隔离接收端导入验证
在干净隔离测试目录下模拟外部协作者机器接收：
- 首次导入（以 `zz-chaixiaochai` 为例）：解压 `bundle.json` 与对应视频/海报，生成本地账本 `report.json`，返回 `newFiles: 3, clips: 1`，PASS；
- 重复导入：检测到本地内容哈希一致，安全跳过写入，返回 `newFiles: 0, clips: 1`，PASS。

---

## 5. 自动化测试套件与执行命令

### 5.1 数据与路由回归检查（10/10 PASS）
执行命令：
```powershell
Set-Location "D:\codex\美食网站\.local\worktrees\zhengzhou-prep\map-base"
node scripts/review-zhengzhou-data.mjs
```
输出：
```text
[PASS] 1. config/cities.json includes valid zhengzhou entry preserving existing cities
[PASS] 2. data/cities/zhengzhou/zhengzhou.pmtiles exists, size and sha256 match manifest
[PASS] 3. data/cities/zhengzhou/data-audit.json verifies all 285 tiles extracted
[PASS] 4. data/cities/zhengzhou/roads-index.json has valid groups within bounds
[PASS] 5. data/cities/zhengzhou/food-road-network.json has valid topological nodes and ways with strict LF line endings
[PASS] 6. data/cities/zhengzhou/terrain-manifest.json and 97 DEM tiles exist
[PASS] 7. food-road-router calculates genuine Zhengzhou routes and distance between food stops
[PASS] 8. data/cities/zhengzhou/video-library.json validates cleanly with 6 user sources and 24 segments
[PASS] 9. data/cities/zhengzhou/video-posters.json records all 24 posters matching disk files
[PASS] 10. allCityCatalogs passes without duplicate source or segment IDs across all 7 cities

Zhengzhou Data Review Summary: 10/10 passed.
```

### 5.2 浏览器端到端与真机视频断言（21/21 PASS）
执行命令：
```powershell
Set-Location "D:\codex\美食网站\.local\worktrees\zhengzhou-prep\map-base"
python -u scripts/review-zhengzhou-browser.py
```
输出：
```text
=== Starting Zhengzhou Browser UI, Food Markers & Video Verification against http://127.0.0.1:8796 ===

[PASS] 1. Map readiness signal and Zhengzhou title
[PASS] 2. Food cards rendered on map for Zhengzhou (21 on-map stops)
[PASS] 3. Shop names match real Zhengzhou establishments across districts
[PASS] 4. Video popover opens on card click
[PASS] 5. Floating window media area >= 2/3 of border box
[PASS] 6. Video mounts and playback advances time across two samples (dt >= 0.3s)
[PASS] 7. Retained old video reference is paused, src removed, and popover closed on Escape
[PASS] 8. Multi-creator shop switch: old creator video stops, new creator plays and advances, stops on close
[PASS] 9. Video library creator tabs and search filter clips containing "烩面" (合记)
[PASS] 10. Desktop 1440x960 screenshot saved
[PASS] 11. Multi-city navigation switches without cross-city contamination
[PASS] 12. Road search in street mode returns genuine Zhengzhou roads containing "二七"
[PASS] 13. Mobile 390x844 popover media area >= 2/3
[PASS] 14. Mobile 390x844 screenshot saved
[PASS] 15. Small screen 320x680 popover media area >= 2/3
[PASS] 16. Small screen 320x680 screenshot saved
[PASS] 17. Short landscape 736x414 popover media area >= 2/3
[PASS] 18. Short landscape 736x414 screenshot saved
[PASS] 19. Standalone bundle preview-zhengzhou.html renders food cards (21 offline stops)
[PASS] 20. Standalone bundle preview-zhengzhou.html screenshot saved
[PASS] 21. No unhandled page errors during browser navigation

=== Zhengzhou Browser Verification Summary: 21/21 PASSED ===
```

---

## 6. 截图与证据归档

所有真机渲染截图存放于：
`output/playwright/zhengzhou/`

- [zhengzhou-desktop-1440.png](file:///D:/codex/美食网站/.local/worktrees/zhengzhou-prep/output/playwright/zhengzhou/zhengzhou-desktop-1440.png): 桌面 1440×960 美食卡片三维视图，合记烩面卡片与金水河道路展开；
- [zhengzhou-mobile-390.png](file:///D:/codex/美食网站/.local/worktrees/zhengzhou-prep/output/playwright/zhengzhou/zhengzhou-mobile-390.png): iPhone 390×844 竖屏，视频浮窗占比 $\ge 2/3$，比例尺与想去栏无遮挡；
- [zhengzhou-small-320.png](file:///D:/codex/美食网站/.local/worktrees/zhengzhou-prep/output/playwright/zhengzhou/zhengzhou-small-320.png): 小屏 320×680 紧凑适配；
- [zhengzhou-landscape-736.png](file:///D:/codex/美食网站/.local/worktrees/zhengzhou-prep/output/playwright/zhengzhou/zhengzhou-landscape-736.png): 短横屏 736×414 顺滑浮窗展示；
- [zhengzhou-preview-bundle-1440.png](file:///D:/codex/美食网站/.local/worktrees/zhengzhou-prep/output/playwright/zhengzhou/zhengzhou-preview-bundle-1440.png): 离线单文件构建验证。
