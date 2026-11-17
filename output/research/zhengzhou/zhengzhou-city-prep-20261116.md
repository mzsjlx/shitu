# 郑州城市全栈接入与全三批次探店视频完整闭环交付报告（2026-11-16 ~ 2026-11-17）

## 1. 交付结论

根据“食途”多城市产品规范与用户明确要求，在独立工作区 `.local/worktrees/zhengzhou-prep`（分支 `codex/city-zhengzhou-prep`，基于 `origin/main` 最新提交 `6019700`，PR #11）内，已完整完成郑州（`zhengzhou`）城市全栈接入、3D 开放底图与真实 OSM 拓扑路网、以及用户提供的全三批次共 21 条抖音探店视频端到端闭环（下载、转录、精准切片、真实封面、归并落点、全端播放验证、素材打包、Release 发布与隔离导入测试）：

- **0 虚构商家、0 凭空编造**：严格仅处理用户在会话中明确提供的 21 条抖音链接；
- **全三批次精准统计**：
  - **探店作品数**：21 部（第一批 6 部 + 第二批 7 部 + 第三批 8 部）
  - **探店博主人数**：19 位（柴小柴、赤赤吃啥呢、大潘达、Yuanao、倍增CD了、15再吃亿点儿、樱桃大婉子、河南民生频道香香美食、特别乌啦啦、蛋壳Danke、李囧囧、迈扣来了、薄荷脆脆薯、丸子头逛郑州、干饭同事局、百变小樱、UU不吃、橘子公主、小晨吃不饱）
  - **拆分门店片段数**：93 个（第一批 24 个 + 第二批 32 个 + 第三批 37 个）
  - **去重美食点**：85 处（93 片段 - 6 处跨博主合用分店 - 2 处同博主同地点多分店片段）
  - **上图有效美食点**：83 处（85 去重点 - 2 处范围外去重点：换利小吃须水老镇、郑三指固始鹅块新城路）
  - **同分店多博主合用**：6 处：
    1. 人民路“合记烩面”：`zz-shiwu-heji`（主片段）与 `zz-beizeng-heji`（合用点，指向主片段）
    2. 南阳路“唐风阁肉夹馍（南阳路总店）”：`zz-lijiongjiong-tangfengge`（主片段）与 `zz-maikou-tangfengge`（合用点，指向主片段）
    3. 城北路“五福油泼面（城北路店）”：`zz-maikou-wufu`（主片段）与 `zz-wanzitou-wufu`（合用点，指向主片段）
    4. 永安街“买买江新疆大盘鸡（永安街店）”：`zz-wanzitou-maimaijiang`（主片段）与 `zz-yingtao-maimaijiang`（合用点，指向主片段）
    5. 黄河路“清真老李牛肉丸子汤（黄河路230号院店）”：`zz-shiwu-laoli`（主片段）与 `zz-ganfan-laoli`（合用点，指向主片段）
    6. 须水镇“换利小吃”：`zz-chichi-huanli`（主片段）与 `zz-xiaochen-huanli`（合用点，指向主片段）
  - **同博主同物理点多片段合用**：2 处：
    1. 中原电影院“石记百花面鱼”：`zz-maikou-shiji`（主片段）与 `zz-maikou-chaoliangfen`（炒凉粉，指向主片段）
    2. 河南农大“牧场直销门市部”：`zz-maikou-nongda-niunai`（主片段）与 `zz-maikou-nongda-suannaijuan`（酸奶卷，指向主片段）
  - **范围外待扩图片段**：3 个（换利小吃 须水老镇西 `[113.4985, 34.7562]` 包含赤赤吃啥呢与小晨吃不饱 2 片段、郑三指固始鹅块 惠济新城路北 `[113.6300, 34.8650]` 1 片段，如实保留真实坐标并标记 `locationStatus: approximate-planning`，绝不压界）
  - **完全未定位数**：0 个
- **真实音视频流与时长**：全部 93 段剪辑采用 H.264/AAC faststart 编码，实际 `ffprobe` 逐项测得音视频流与真实秒数（非 `end - start` 伪造），容差均在 0.16s 标称内；
- **真实原片封面提取**：提取各店门头、菜品或实景真实画面作为小封面，进 Git 版本库管理（郑州专有封面 93 张，全局海报库扩充至 699 张，其他城市 606 张 100% 零污染）；
- **全端自动化验证双全过**：
  - 数据与拓扑审查：**10/10 PASS**（`scripts/review-zhengzhou-data.mjs`）
  - 真实浏览器 UI/视频全场景断言：**21/21 PASS**（`scripts/review-zhengzhou-browser.py`）
  - 视频浮窗边框面积比 $\ge 2/3$（实测 66.83% ~ 81.25% 全部合规）
  - 真实解码与时间推进（1秒双采样 `currentTime` 推进 $\ge 0.3s$）
  - 关闭浮窗/按 Escape/切片/切城市立即停旧音、移除 `src` 并设 `paused=true`
  - 合记烩面与唐风阁等跨博主同店切换播放、互斥暂停及断流全量断言通过
  - 五套视口真机截图完整留存：桌面 1440、手机 390、小屏 320、横屏 736、单文件离线版 1440
- **多城市构建与离线单文件**：
  - `npm.cmd run build` 干净编译全部 7 大城市（重庆、长沙、柳州、南京、潮汕、武汉、郑州），0 媒体缺失警告；
  - 产出离线单文件版 `preview-zhengzhou.html`（16,286,750 字节），脱机亦可浏览 83 处郑州在图美食点。
- **本地服务运行端口**：**`8798`**（独立启动于郑州工作区 `map-base/dist`，避免与旧端口冲突）。

---

## 2. 21 个探店来源与作品台账

| 序号 | 来源 ID | 博主作者 | 发布日期 | 原片时长 | 压缩包字节数 | 原始 SHA256 | 作品主题 | 片段数 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `zz-chaixiaochai-7674563519769881320` | 柴小柴 | 2026-08-16 | 86.90s | 104,817,431 | `642f427b5e080eb1dedad2a43f3690d187fe3a15e13063edcfdcd31ff587ed42` | 沙口路爆火的知青老食堂！六大招牌菜真实测评来了 | 1 |
| 2 | `zz-chichi-7472290364137671987` | 赤赤吃啥呢 | 2025-02-17 | 266.87s | 283,039,504 | `db15d1686765b2eb4088f48c0723421b10b0f18c3e5d0967c12915a646e98c3b` | 河南特色砂锅烩面，猛火现煮麻辣重口嘎嘎好吃（换利小吃） | 1 |
| 3 | `zz-dapanda-7621196008361978609` | 大潘达 | 2026-03-25 | 193.42s | 221,425,327 | `c479760257e9d9ec51d336aed4f512bd064695e068a9193f528cbb63db63d15e` | 糯糯糊糊的铁锅炖这一口好好好好吃！（灶座小锅烀饼） | 1 |
| 4 | `zz-yuanao-7617429859431122502` | Yuanao | 2026-03-15 | 126.00s | 115,873,126 | `05b370d9eecb7e4a19de482413e2e468e9583dc90a96dcf4133b8958936e3525` | 郑州适合独处的一人食店 社恐友好版 | 4 |
| 5 | `zz-beizeng-7661525430997912882` | 倍增CD了 | 2026-07-12 | 162.10s | 173,113,846 | `fc91e19f6c196c3b73dd79995b17d4c62117ff400632e77026ee97bc497c8dd0` | 这是一条专门给吃货的郑州美食攻略 | 4 |
| 6 | `zz-shiwu-7687558663678177521` | 15再吃亿点儿 | 2026-09-20 | 225.53s | 217,400,491 | `470ddf5760451ed5199fbcbe6036d580fb0b72d6ccb51a1d7d11e453c05cc0db` | 河南混血儿攒了两年的郑州美食小合集！ | 13 |
| 7 | `zz-yingtao-7600001486366366446` | 樱桃大婉子 | 2026-01-27 | 193.20s | 204,475,927 | `0b194b6b1929a9cb423a09cf80e2cdb4d85478c95baf85b7dd1134c74302eea0` | 【年度总结】来郑州必吃！土著私藏 6 家 20 年+老店！ | 6 |
| 8 | `zz-xiangxiang-7545084990569123110` | 河南民生频道香香美食 | 2025-09-02 | 170.34s | 109,202,398 | `0aca01b5fceed998dcb95ff2f6d8bc77d4e3fb39394e59811a989cf33602ceab` | 寻找郑州100家老店：京广路保全街烧烤 | 1 |
| 9 | `zz-wulala-7558104351017897231` | 特别乌啦啦 | 2025-10-07 | 291.33s | 275,532,265 | `9326a41e1b30d674d511a3faa43d5847586d22f720109e5b110c3bb22990230a` | 花110元在郑州狂喝8碗胡辣汤（穆彦华岗坡路店） | 1 |
| 10 | `zz-danke-7342060229149855028` | 蛋壳Danke | 2024-03-03 | 313.13s | 368,066,323 | `0898f7737d8c27cc17472b132e82e1425c05e8af455e72bad3f625ab2ca7d2b3` | 郑州深夜的爆辣炒鸡吃爽了（起龙香辣鸡金城街店） | 1 |
| 11 | `zz-lijiongjiong-7703625687684386074` | 李囧囧 | 2026-11-03 | 162.05s | 359,872,730 | `281abc8a180b0491f220d1d5e22f391f57bebc53d2c620c4aec46e2648f692c4` | 郑州真正好吃的美味在民间（唐风阁/崔记米线/烙馍卷烤面筋） | 3 |
| 12 | `zz-maikou-7617388953503456226` | 迈扣来了 | 2026-03-15 | 722.47s | 671,931,482 | `1d1850fc07e2b08f538e3b9c17c4c9fd90142a04c92271292165d0bfd85ee067` | 河南郑州美食推荐：19家地道老店真实打卡合集 | 19 |
| 13 | `zz-cuicuishu-7661276660537628270` | 薄荷脆脆薯 | 2026-07-11 | 17.37s | 22,252,410 | `5b6cee002f7823080b6cb1b6f4875beedd76c60b9d4658d57f485830ade4ae78` | 河南人眼中的漂亮饭（鸣升鲜炒鸡经七路店） | 1 |
| 14 | `zz-wanzitou-7595848325316775203` | 丸子头逛郑州 | 2026-01-16 | 137.07s | 197,645,195 | `b0a02640faefebcb60211b5214e52b69ec01de5677de104aa82d174cf845e64b` | 在郑州经常去的6家面馆，一碗一碗吃出来的合集！ | 6 |
| 15 | `zz-yingtao-7594792007391003238` | 樱桃大婉子 | 2026-01-13 | 176.17s | 204,542,723 | `eba2ab0f5ae123675db130604acbe9e774d1fde2b30930d599f34c68989452d0` | 这才是郑州的必吃榜！这6家私藏小破店，只要不倒闭我都会一直吃！ | 6 |
| 16 | `zz-ganfan-7690414619361430819` | 干饭同事局 | 2026-03-31 | 329.87s | 291,668,252 | `515295d5f7f5f9172f30d4fad008c04f05e0dd97f3a40fb2791e5fa8a71bfb6c` | 整整 22 家！郑州土著私藏的美食家底大公开（甄选11处实体店） | 11 |
| 17 | `zz-yingtao-7637482311005593006` | 樱桃大婉子 | 2026-05-09 | 170.34s | 177,411,493 | `a8eb9a3c57420807f2fab440015ddedcb148b5b27bd7e202edb4a85ad901eee3` | 周末吃郑州，看这一条老店合集就够啦～天南海北老味道应有尽有！ | 6 |
| 18 | `zz-xiaoying-7641156958607073521` | 百变小樱 | 2026-05-18 | 129.17s | 155,581,314 | `277329da09bcb93efab320221c80669e07274ad59b84cbe2f5c8e005f9733500` | 郑州南五里堡的美食绝对是被低估了 | 5 |
| 19 | `zz-uubuchi-7626717054757964922` | UU不吃 | 2026-04-10 | 23.00s | 37,254,204 | `6c39f3a7d8f1c0cdf4a11b2735c471262a42cd6ce025fc128e995ea4b0ee9076` | 郑州这一口山楂凤梨排骨将会很疯狂！（南山有鸣思茅普洱菜） | 1 |
| 20 | `zz-juzigongzhu-7264126930473995557` | 橘子公主 | 2023-08-06 | 427.18s | 415,740,369 | `3fb8057b5c14a5d94f3db1f1977cd62984df7207d866f65cc02e9be340b68a52` | 第一次来河南怼正宗烩面，配上当地天花板米皮（赵记米皮南关街店） | 1 |
| 21 | `zz-xiaochen-7307296694943681830` | 小晨吃不饱 | 2023-12-03 | 160.53s | 173,242,244 | `cebe5a6e83602ce2d1dc7236e097f0af207282bd66bec173dfce4947957fee52` | 它唯一的缺点是：郑州限定！！！炸面筋封神了（换利小吃） | 1 |

---

## 3. 素材包打包、正式 Release 发布与远端导入核验

全部 21 个探店来源已通过 `scripts/media-bundles.mjs pack` 打包入 `.local/media-bundles/`，并已全量发布至 GitHub Release [media-2026-11-16-zhengzhou](https://github.com/mzsjlx/shitu/releases/tag/media-2026-11-16-zhengzhou)：

- **Release ID**：447100672
- **全量附件核查**：**42/42 全部为 `uploaded` 状态**（21 个 ZIP 素材包 + 21 份 `.zip.json` 清单，**0 个 starter**）
- **ZIP 总字节数**：4,780,089,054 字节（约 4.45 GiB）

| 序号 | 包文件名 | 包含片段数 | 字节数 (Bytes) | SHA256 摘要 | 远端 Release 状态 |
| --- | --- | --- | --- | --- | --- |
| 1 | `shitu-media-zz-chaixiaochai-7674563519769881320-96661691ced64ce9.zip` | 1 | 104,817,431 | `84fd9870bb95060140470b6faef56efaef3202ea37fa3fa0a4c42872bb8857d2` | **uploaded** (已上线) |
| 2 | `shitu-media-zz-chichi-7472290364137671987-f511c88d0f1245f6.zip` | 1 | 283,039,504 | `2141421283b410230d9aea9ff87ad53a28c55f3e1571ce58950ba2ee67122726` | **uploaded** (已上线) |
| 3 | `shitu-media-zz-dapanda-7621196008361978609-68c21ba3fbd5f4d7.zip` | 1 | 221,425,327 | `886817f5834681819dcc7d7539b5c849e0a8862519e603e695419e7a3728ef57` | **uploaded** (已上线) |
| 4 | `shitu-media-zz-yuanao-7617429859431122502-6f2f88fc5da03110.zip` | 4 | 115,873,126 | `62cca4ee0609a4044f971de821253476bca0077c3ca7abece78c3e78fdcfb6ef` | **uploaded** (已上线) |
| 5 | `shitu-media-zz-beizeng-7661525430997912882-8c06002de9608834.zip` | 5 | 173,113,846 | `9303e9d0e210e766749feaea72085907e34908a49ea1850545a5f0d0273061b4` | **uploaded** (已上线) |
| 6 | `shitu-media-zz-shiwu-7687558663678177521-a1fa8e8c2b614c95.zip` | 12 | 217,400,491 | `23c32e0a7d710d4d443ef493f0061519d3d6df13287cd68eb7d27b41e8f4de7b` | **uploaded** (已上线) |
| 7 | `shitu-media-zz-yingtao-7600001486366366446-cc5288aae54152ae.zip` | 6 | 204,475,927 | `a3e0ffd9f544fbae935a978a2d6d8ec06028d04fd85e45b1e6c4910d702bfea4` | **uploaded** (已上线) |
| 8 | `shitu-media-zz-xiangxiang-7545084990569123110-60a545a8c9468aa3.zip` | 1 | 109,202,398 | `64c70baec0f63f7d6e321d664a8e64baa132a81316c63387d4d9e60b173b2f74` | **uploaded** (已上线) |
| 9 | `shitu-media-zz-wulala-7558104351017897231-ccc46cf636715213.zip` | 1 | 275,532,265 | `ec6ab2c183def521219479c9009990e68954ce7123107661ab4a5429c82e1bd1` | **uploaded** (已上线) |
| 10 | `shitu-media-zz-danke-7342060229149855028-fdcf0f121a2314a2.zip` | 1 | 368,066,323 | `ba244232c7cdf427397953b56f320950f2c2db85a7080213c167f555fbd28f36` | **uploaded** (已上线) |
| 11 | `shitu-media-zz-lijiongjiong-7703625687684386074-e3ccdae94b4905bb.zip` | 3 | 359,872,730 | `b30bb346e29602bfa9006582d3b2114f8b409c555b273454e50a69102ad3c874` | **uploaded** (已上线) |
| 12 | `shitu-media-zz-maikou-7617388953503456226-12e3d1fb9ae115fa.zip` | 19 | 671,931,482 | `da5ba0a0a569fadaf806da22247274f908b7cb2f4401be15de84fd4f5cc885e6` | **uploaded** (已上线) |
| 13 | `shitu-media-zz-cuicuishu-7661276660537628270-23d6eb799480c0c2.zip` | 1 | 22,252,410 | `b4e4573742fde7268b74b08283f9ee461b23aeb2856e22fd26c1097fc4734c47` | **uploaded** (已上线) |
| 14 | `shitu-media-zz-wanzitou-7595848325316775203-fb838ffe40ddc5ef.zip` | 6 | 197,645,195 | `c435af6752af94fffca47c3b1442a75b1057d52b742441693be757960d97bce1` | **uploaded** (已上线) |
| 15 | `shitu-media-zz-yingtao-7594792007391003238-2fcd6a9beffe7add.zip` | 6 | 204,542,723 | `a4918999682fad2eb4e9a06168c1d6e4f5596150b4a5fb724f0d6b531aaf5ff8` | **uploaded** (已上线) |
| 16 | `shitu-media-zz-ganfan-7690414619361430819-d2241aa8d1808302.zip` | 11 | 291,668,252 | `85106cbba123f565069349b9f820e0feca254f5c5bd1b633b57bfebcf064ab6d` | **uploaded** (已上线) |
| 17 | `shitu-media-zz-yingtao-7637482311005593006-37c75d0af55ea410.zip` | 6 | 177,411,493 | `3fd3a8aed37e49acbb210bb74c0ca1f0aea8481d9189d3cef01520456c2b8aa2` | **uploaded** (已上线) |
| 18 | `shitu-media-zz-xiaoying-7641156958607073521-2c3e5faa8cdaffa1.zip` | 5 | 155,581,314 | `d71031675f0d90553ff78c8cd6488b20a0ac8faff5291888e414e33cc6be06c8` | **uploaded** (已上线) |
| 19 | `shitu-media-zz-uubuchi-7626717054757964922-3a749c873be23dd1.zip` | 1 | 37,254,204 | `cffd435ac0501dce8ff9a3983f9e7e840422ad6c0cb0c14eb48c6bbf6894aa38` | **uploaded** (已上线) |
| 20 | `shitu-media-zz-juzigongzhu-7264126930473995557-9a6eb509b01428c7.zip` | 1 | 415,740,369 | `c7260e9cbc1a69fc4be986b08233967ac37a251a7632aeb8d4f4e61f9d51ebee` | **uploaded** (已上线) |
| 21 | `shitu-media-zz-xiaochen-7307296694943681830-fa6f00f98608cc24.zip` | 1 | 173,242,244 | `491a6d87f5cb370b6eb469aacc8af3cb0a3660b91869a21dc5b5f61839c2f03c` | **uploaded** (已上线) |

### 远端下载样本实测与接收端导入核验
- **远端下载核验**：通过公开 URL 从 Release 实际下载第三批样本 `shitu-media-zz-uubuchi-7626717054757964922-3a749c873be23dd1.zip`，实测 37,254,204 字节，重新计算 SHA256 为 `cffd435ac0501dce8ff9a3983f9e7e840422ad6c0cb0c14eb48c6bbf6894aa38`，与索引及本地打包完全一致；
- **干净隔离目录导入测试**：模拟外部协作者独立检出环境运行 `importBundle`：
  - 首次导入：成功解压 3 个文件（原片、单店切片、海报）并写入账本 `report.json`，返回 `newFiles: 3, clips: 1`，PASS；
  - 二次导入（幂等性验证）：检测到已有文件哈希完全一致，安全跳过写入，返回 `newFiles: 0, clips: 1`，PASS。
- **全局清单追加**：`map-base/data/media-bundles.json` 已追加全量 21 个包下载地址，`latestRelease` 指向该发布。

---

## 4. 自动化测试套件与执行命令

### 4.1 数据与路由回归检查（10/10 PASS）
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
[PASS] 8. data/cities/zhengzhou/video-library.json validates cleanly with 21 user sources and 93 segments
[PASS] 9. data/cities/zhengzhou/video-posters.json records all 93 posters matching disk files
[PASS] 10. allCityCatalogs passes without duplicate source or segment IDs across all 7 cities

Zhengzhou Data Review Summary: 10/10 passed.
```

### 4.2 浏览器端到端与真机视频断言（21/21 PASS）
执行命令：
```powershell
Set-Location "D:\codex\美食网站\.local\worktrees\zhengzhou-prep\map-base"
python -u scripts/review-zhengzhou-browser.py
```
输出：
```text
=== Starting Zhengzhou Browser UI, Food Markers & Video Verification against http://127.0.0.1:8798 ===

[PASS] 1. Map readiness signal and Zhengzhou title
[PASS] 2. Food cards rendered on map for Zhengzhou (83 on-map stops)
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
[PASS] 19. Standalone bundle preview-zhengzhou.html renders food cards (83 offline stops)
[PASS] 20. Standalone bundle preview-zhengzhou.html screenshot saved
[PASS] 21. No unhandled page errors during browser navigation

=== Zhengzhou Browser Verification Summary: 21/21 PASSED ===
```

---

## 5. 截图与证据归档

所有真机渲染截图存放于：
`output/playwright/zhengzhou/`

- [zhengzhou-desktop-1440.png](file:///D:/codex/美食网站/.local/worktrees/zhengzhou-prep/output/playwright/zhengzhou/zhengzhou-desktop-1440.png): 桌面 1440×960 美食卡片三维视图，83 处在图美食卡片与金水河道路展开；
- [zhengzhou-mobile-390.png](file:///D:/codex/美食网站/.local/worktrees/zhengzhou-prep/output/playwright/zhengzhou/zhengzhou-mobile-390.png): iPhone 390×844 竖屏，视频浮窗占比 $\ge 2/3$，比例尺与想去栏无遮挡；
- [zhengzhou-small-320.png](file:///D:/codex/美食网站/.local/worktrees/zhengzhou-prep/output/playwright/zhengzhou/zhengzhou-small-320.png): 小屏 320×680 紧凑适配；
- [zhengzhou-landscape-736.png](file:///D:/codex/美食网站/.local/worktrees/zhengzhou-prep/output/playwright/zhengzhou/zhengzhou-landscape-736.png): 短横屏 736×414 顺滑浮窗展示；
- [zhengzhou-preview-bundle-1440.png](file:///D:/codex/美食网站/.local/worktrees/zhengzhou-prep/output/playwright/zhengzhou/zhengzhou-preview-bundle-1440.png): 离线单文件构建验证（83 处在图离线卡片）。
