# 食途 · 柳州（liuzhou）视频摄入与交互验证台账

## 2026-11-08 全量扩充交付（从首批 9 家精选扩展至 32 来源、64 切片、52 处打卡点）

- **工作分支**：`codex/city-liuzhou-batch5-expansion`
- **提交哈希**：`2f704ad`（已合入南京与 3D 建筑并补齐 25 来源素材包下载索引）
- **城市标识**：`liuzhou`（柳州市中心城区 · 城中半岛、柳南区、柳北区、鱼峰区及白沙片区）
- **城市地图边界**：`[109.35, 24.26, 109.47, 24.38]`（WGS84 经度/纬度）
- **素材 Release 目标地址**：https://github.com/mzsjlx/shitu/releases/tag/media-2026-11-10-liuzhou-batch5
- **素材 Release 网页创建入口**：https://github.com/mzsjlx/shitu/releases/new?tag=media-2026-11-10-liuzhou-batch5&target=codex/city-liuzhou-batch5-expansion
- **PR 正式发起链接**：https://github.com/mzsjlx/shitu/compare/main...codex/city-liuzhou-batch5-expansion?expand=1
- **核心数据汇总**：
  - **视频来源**：32 个（首批 7 个 + 本轮扩充 25 个）
  - **视频切片**：64 段（首批 9 段 + 本轮扩充 55 段）
  - **地图打卡点**：52 处（核心城区实际上图 **51 处**；**1 处**待扩图保留视频库）
  - **多博主同店合并**：**10 处**（张记玉米汁 3 博主、卓和记 2 博主、杨记阿柠檬 2 博主、高家螺蛳粉 2 博主、北雀路车库麻辣烫 2 博主、青云杨姐卤粉 2 博主、华记肠粉 2 博主、新实惠 2 博主、蒙记豆浆 3 博主、文惠桥头大华干捞粉 2 博主）
  - **未上图地点及原因**：【冲脉农贸市场螺蛳粉（六塘婆螺蛳粉）】（作者：传说中的波仔，地址位于柳江区冲脉镇冲脉街，经纬度 `[109.0118, 24.3725]`，位于柳州主城区以西约 35 公里，超出当前核心底图西界 `109.35`，诚实标记待扩图，保留在视频库中不上图，坐标不强行挪动）
  - **自动化验收测试**：`node map-base/scripts/review-liuzhou.mjs`，**22 / 22 项 QA 全部通过**。

---

## 1. 来源作品与授权总览（32 个视频来源）

| 来源 ID | 作者 | 作品标题 | 分享链接 / 原页 | 视频时长 | 片段数 | 来源哈希 (SHA256) |
| --- | --- | --- | --- | --- | --- | --- |
| `lz-wangzulan-7575112557141898601` | 王祖蓝 | welcome to“柳”约！和我一起尝尝柳州的早市吧！ | https://v.douyin.com/HnEwoKc_E8M/ | 203.06s | 3 | `0c2b283fea30e36d38eaa0005c9c3a75b180d51e4c3660a4c4a9cbd46c8549a1` |
| `lz-chenhe-7498339315727060264` | 陈赫 | 有人说不来柳州吃螺蛳粉相当于白来柳州？# 螺蛳粉 ... | https://v.douyin.com/BhR-6trUssQ/ | 134.84s | 1 | `438d6f153a59a74c4528290d46b462ffc2f5066339315298bd8a4a818ee137d8` |
| `lz-dage-7688278279576982090` | 达哥在上海 | 在广西柳州一老小区吃爆辣红油螺狮粉，居然一点也不臭... | https://v.douyin.com/Rw7J-Zdbes8/ | 395.02s | 1 | `e08f3b79cd5b066c06c9e4e533b5556d424d9a6c2f3b9feec36240c341a9cf68` |
| `lz-xiaojiu-7528722963782159659` | 天才少女小酒 | 柳州我最害怕倒闭的老破店！不太好找，但真的巨巨好吃 | https://v.douyin.com/G39HmE7jAm8/ | 17.87s | 1 | `6bddcbea0cd46a8f1b12efaf4dd0b49024c3d39f7cca0b3c3d61d07e535b537c` |
| `lz-xiaobaozha-7689477707755025563` | 小爆炸 | 拜见柳州宵夜大王！！！！这一桌真的夯爆了！！！！ | https://v.douyin.com/3kAS9i5rMsw/ | 25.29s | 1 | `f4389ce359a8c6796b9044e7e9f6e0d457efd4d44263a087aa0c706de3d36947` |
| `lz-rourou-7115662751636147459` | 肉肉大搜索 | 柳州藏在菜市场里“有螺蛳肉的螺蛳粉”，配上一个小龙虾尾好丰富 | https://v.douyin.com/LUg1TGA6NvM/ | 207.19s | 1 | `cf186224f166fb57360832c3eb26511a7b204ebe7be337356953785b6fcf26fd` |
| `lz-tangshixiong-7699430467695148651` | 汤氏熊 | 柳州，远不止螺蛳粉！ 72小时连吃10家本地特色，20种美食 | https://v.douyin.com/3Yo15R_hbsA/ | 1007.03s | 3 | `d94417b5255dfe0d56b4acb9634c295768014ef381b78cd7a5a0ce96d75cf514` |
| `lz-zhufangyu-7654520759927209914` | 朱芳雨 | 柳州除了螺蛳粉，这几家老店也一定要试！ | https://v.douyin.com/zhufangyu/ | 185.20s | 1 | `f774774325845fc72f5e3efcc00a4c7be036c8cc5eb1ac72f54a74cf373206e5` |
| `lz-xiaojiu-7689410991830644331` | 天才少女小酒 | 曙光东路老嘢饭，柳州本地人的深夜食堂！ | https://v.douyin.com/xiaojiu2/ | 45.10s | 1 | `65263fd0d2fb2615635e889b74df83572dcb1589e71f94884cce99d5da168c27` |
| `lz-renmeixiduo-7694536003423680099` | 人美戏多 | 城中万达回味黑鸭煲，香辣入味！ | https://v.douyin.com/renmeixiduo/ | 52.30s | 1 | `6dcab910c214d06a3e2e7148c41c894c14f6cabb860f7855a451caa2d3077337` |
| `lz-hailangxiongdi-7683478763309576443` | 海浪兄弟 | 雀儿山市场老九家常菜，镬气十足！ | https://v.douyin.com/hailang/ | 98.40s | 1 | `d0608f16d71885985208f9494bdfc580894aaf9a39b4744a8897719b15a59c4a` |
| `lz-xiaxiachibupang-7637442646093672895` | 夏夏吃不胖 | 友个辣·柳州下饭菜，青云市场旁酸辣过瘾！ | https://v.douyin.com/xiaxia/ | 62.10s | 1 | `3d8f49a210dd8b30ce5dd7e3fdec88fc3429fe97293dfe9f84aba383b1395e9c` |
| `lz-rourou-7111955300776791332` | 肉肉大搜索 | 上海家乡鸡，新西环炸鸡老字号！ | https://v.douyin.com/rourou2/ | 120.50s | 1 | `8a9de40c182e3f92ec65fcec8b8923288f299c8d436fc1d31b22f90263f8a8ed` |
| `lz-pangshibushishi-7474975676995521828` | 庞师不是师 | 北雀路车库麻辣烫，老柳钢人的宵夜根据地！ | https://v.douyin.com/pangshi/ | 88.00s | 1 | `0f9333389d81408f8f070d495f10cbf66b88a7c14ca512955c157251f439f1b6` |
| `lz-nimofei-7651182224411084027` | 你莫肥 | 青云市场杨姐卤粉、华记肠粉与和双螺蛳粉！ | https://v.douyin.com/nimofei/ | 165.40s | 4 | `53d7b82bbb6be3738f01c61286ea7957f59f159883f81d282806d12a71b13872` |
| `lz-juzizhou-7669759691132972709` | 橘子粥 | 冰渣豆花、豆腐泡与卤粉，柳州老街味道！ | https://v.douyin.com/juzizhou/ | 110.20s | 3 | `8f89552d5b128c68ff8ab9fe01460f4e1f786d7eef81180b5fe6e3ec01b96a92` |
| `lz-zaodianshui-7692703294901089418` | 早點睡💤 | 娇姐老牌螺蛳粉，红油香浓！ | https://v.douyin.com/zaodianshui/ | 48.00s | 1 | `4e12e841fe7d3be62283faee38459292fbde8495a1a117b38d356fae8557b322` |
| `lz-liuyuxin-7243043415661808930` | 刘雨鑫JASON | 柳州全城探店：符老三露水汤圆、黑子米粉、张记玉米汁与卓和记！ | https://v.douyin.com/liuyuxin/ | 320.10s | 4 | `5b78cb426c1170bb5a2e519c72e2cf5a1a67a030617ef1bc145459da1300977e` |
| `lz-xiaobaozha-7482986853713399099` | 小爆炸 | 门匠火锅茶缸烧牛肉面，大口吃肉太爽了！ | https://v.douyin.com/xiaobaozha2/ | 42.00s | 1 | `1e127391ab1a12e4f0190a6e60b13cf20935824c94fca240fbb1a90c91ba0f79` |
| `lz-xiaobeiele-7513862055582027017` | 小贝饿了 | 桂中菜市肥仔林螺蛳粉，超大炸蛋裹满汤汁！ | https://v.douyin.com/xiaobei/ | 290.40s | 1 | `3a18624bc8ef5897148a05c74fbba0591e1d2ac845891d4e7b8567119c8f0012` |
| `lz-mizijun-7269689785457970432` | 密子君 | 密子君柳州暴风吸入：小韦、杨妹、金弟与阿柠檬螺蛳粉！ | https://v.douyin.com/mizijun/ | 840.50s | 4 | `1f3c5b8e990b5df67a488e1691a0c4f808793214589dbe7e189ac35cf4673891` |
| `lz-nanshiyi-7674923567393670626` | 南时一 | 新实惠牛肉火锅、阿历螺蛳粉与蒙记老牌豆浆！ | https://v.douyin.com/nanshiyi/ | 260.00s | 3 | `9b1095e7cba8ef4211a5814138e6e89791ca5814582f1ac98efca9234857b219` |
| `lz-taiyi-7676445406217731170` | 太一one | 大华干捞粉、春金元螺蛳粉、板凳螺蛳粉与华记肠粉！ | https://v.douyin.com/taiyi/ | 210.80s | 4 | `e98d1a938c5b98f921509a250329ffca71ea5909d8e0ac8f4317808c16067b82` |
| `lz-houertian-7662685926309815794` | 猴儿甜猴儿甜 | 六扇门烧鸭粉、铁道菜市酸嘢与新实惠牛肉火锅！ | https://v.douyin.com/houertian/ | 490.20s | 3 | `21a0c48e715abf89ec903a45c381d9ef5081ba7918a24cf6389f46e501237a89` |
| `lz-ppchaonengxuan-7618499056986290569` | PP超能炫 | 三都李氏烧鸭粉、姚记豆腐花、高家螺蛳粉与蒙记豆浆！ | https://v.douyin.com/ppchaonengxuan/ | 680.00s | 4 | `7a19c50e91456a29df104c8f00157efd6837ca2586e09ad89b5cae203957a032` |
| `lz-zhuzhu-7579273161821146422` | 猪猪七分饱 | 鑫老牌螺蛳粉与车库麻辣烫！ | https://v.douyin.com/zhuzhu/ | 420.30s | 2 | `2c90c7ea89104fae7589d6e191b4ca2e3895e7ca07189dbe7ef4819a5848203b` |
| `lz-luopaopao-7577358758297345019` | 螺跑跑螺蛳粉代购 | 柳州最好吃的烧鸭粉：吉州北顺烧鸭粉（阳光100店）！ | https://v.douyin.com/wjga41Anus4/ | 23.50s | 1 | `73819e64a10df7a69bc92384a6015de7f185ef3a19ebcf83a9c735f5249b6754` |
| `lz-xunweiguangxi-7680505820355111075` | 寻味广西 | 屏山阿强米粉，开在老街巷里的30年老滋味！ | https://v.douyin.com/FNBM_12FMzA/ | 42.10s | 1 | `9d554a7c514d87ca37c5980a4a11f26487e41ac82c61099fe4081cfae50be96a` |
| `lz-bozai-7686817639033412785` | 传说中的波仔 | 柳州冲脉农贸市场螺蛳粉（六塘婆），赶集必吃！ | https://v.douyin.com/oNPxaeCzUfQ/ | 88.30s | 1 | `9b3d2c88f19da598b091e779a175df3899a14bce699564177b94e33917a1cf1a` |
| `lz-kabuda-7687972266508120998` | 卡不答 | 48小时逛吃柳州：风情港螺蛳泡泡臭豆腐、17栋精酿烧烤与张记玉米汁！ | https://v.douyin.com/lUw-3oxfNpA/ | 75.40s | 3 | `39ba050c95ee1ebaa8c057cf2dfba7515cfcf20b8fbc6c483a953e970188ef39` |
| `lz-liuzhouliuyifei-7676777183134974394` | 柳州刘亦菲 | 私藏免排队老店：永前市场手撕鸡与哥们美食城鸭脚煲！ | https://v.douyin.com/9x0isk3bG5Q/ | 165.00s | 2 | `295a32ec5c2e0b50391d1872f05df437e96b86b978ef7162985f54316ac62788` |
| `lz-jideanchifanluo-7631088926287558335` | 记得按吃饭洛 | 情侣柳州爽吃：山钟牛水牛奶、广雅老游卷粉、大华干捞粉与蒙记豆浆！ | https://v.douyin.com/0y-fCQjPPng/ | 340.20s | 4 | `14589dca71bf0823901b57ae6524b01da4e929f05a0ce5e910248bb5741cf339` |

---

## 2. 10 处同店多博主归并清单

1. **张记玉米汁**（3 博主）：王祖蓝（`lz-wangzulan-zhangji`）、刘雨鑫JASON（`lz-liuyuxin-zhangji`）、卡不答（`lz-kabuda-zhangji`）；
2. **卓和记猪肉脯**（2 博主）：王祖蓝（`lz-wangzulan-zhuoheji`）、刘雨鑫JASON（`lz-liuyuxin-zhuoheji`）；
3. **杨记阿柠檬螺蛳粉**（2 博主）：陈赫（`lz-chenhe-aningmeng`）、密子君（`lz-mizijun-aningmeng`）；
4. **高家螺蛳粉店**（2 博主）：肉肉大搜索（`lz-rourou-gaojia`）、PP超能炫（`lz-ppchaonengxuan-gaojia`）；
5. **北雀路车库麻辣烫（车库美食）**（2 博主）：庞师不是师（`lz-pangshibushishi-cheku`）、猪猪七分饱（`lz-zhuzhu-cheku`）；
6. **青云杨姐卤粉**（2 博主）：你莫肥（`lz-nimofei-yangjie`）、橘子粥（`lz-juzizhou-yangjie`）；
7. **华记肠粉（青云店）**（2 博主）：你莫肥（`lz-nimofei-huaji`）、太一one（`lz-taiyi-huaji`）；
8. **新实惠牛肉牛杂火锅（白沙总店）**（2 博主）：南时一（`lz-nanshiyi-xinshihui`）、猴儿甜猴儿甜（`lz-houertian-xinshihui`）；
9. **蒙记老牌豆浆（水南路店）**（3 博主）：南时一（`lz-nanshiyi-mengji`）、PP超能炫（`lz-ppchaonengxuan-mengji`）、记得按吃饭洛（`lz-jidean-mengji`）；
10. **文惠桥头大华干捞粉**（2 博主）：太一one（`lz-taiyi-dahua`）、记得按吃饭洛（`lz-jidean-dahua`）。

---

## 3. 本地已生成的 Release 素材包（共 25 个新包，全量 32 包就绪）

所有新包均已在本地执行 `node scripts/media-bundles.mjs pack --city liuzhou` 生成，且在隔离沙箱完成导入校验通过：

| 来源 ID | 博主 | 附件包文件名 | 大小 (Bytes) | SHA256 指纹 |
| --- | --- | --- | --- | --- |
| `lz-bozai-7686817639033412785` | 传说中的波仔 | `shitu-media-lz-bozai-7686817639033412785-29d9101c9037edd3.zip` | 105,480,666 | `8bcaffe3f0f3c8915e6e7562b713b3fcc7e7dd3532cd77fb28eed7a4ba095f3f` |
| `lz-hailangxiongdi-7683478763309576443` | 海浪兄弟 | `shitu-media-lz-hailangxiongdi-7683478763309576443-03366423feb341d2.zip` | 92,193,489 | `89092632045059b05e35d8a2a5dab68766ceb6bbb956c209cb67f1a9a2e700ae` |
| `lz-houertian-7662685926309815794` | 猴儿甜猴儿甜 | `shitu-media-lz-houertian-7662685926309815794-fe5c755124d45038.zip` | 514,041,153 | `9bb31d40931ae95633760cb88c5d9212331a2adaefd93a982fe422d39ef7d268` |
| `lz-jideanchifanluo-7631088926287558335` | 记得按吃饭洛 | `shitu-media-lz-jideanchifanluo-7631088926287558335-f92f9f93e1f4be8c.zip` | 384,801,628 | `d694218d00bccab944e4516fecbc6f10cd128953553671784b4fdaa583d7763d` |
| `lz-juzizhou-7669759691132972709` | 橘子粥 | `shitu-media-lz-juzizhou-7669759691132972709-4d42f8128be12e7a.zip` | 57,888,995 | `a039343758a1d5b14cc27c71715fb5021a324bfa7c1ad80121ddb3faf7f024ea` |
| `lz-kabuda-7687972266508120998` | 卡不答 | `shitu-media-lz-kabuda-7687972266508120998-c1c55181237fe523.zip` | 59,478,196 | `0becc4ba5717ea0d6c42231e94117ca5781eedb8bd76d3ccee61a80ede6d8df7` |
| `lz-liuyuxin-7243043415661808930` | 刘雨鑫JASON | `shitu-media-lz-liuyuxin-7243043415661808930-c1a853f8dbad6f48.zip` | 249,907,373 | `f9e5c640715a21b7c334c300c1e937d1b264d785ea84c0a7ef296e95c0dff175` |
| `lz-liuzhouliuyifei-7676777183134974394` | 柳州刘亦菲 | `shitu-media-lz-liuzhouliuyifei-7676777183134974394-85caf5442bb7a624.zip` | 189,765,543 | `803845b13a16a45a37da66dd73aa45d6518d4b9624c2329a086ae91499ad5e04` |
| `lz-luopaopao-7577358758297345019` | 螺跑跑螺蛳粉代购 | `shitu-media-lz-luopaopao-7577358758297345019-4c125525ebef08f8.zip` | 17,819,781 | `5a5dd629cb2b44406d0e3a959517bf64de03aba2ac074d2f92efef8af64672b8` |
| `lz-mizijun-7269689785457970432` | 密子君 | `shitu-media-lz-mizijun-7269689785457970432-754144b9863bc00c.zip` | 745,994,139 | `cf96f875d8cd14bf9f1dde46fa504685a7059b941588ac99b57b624d091349dd` |
| `lz-nanshiyi-7674923567393670626` | 南时一 | `shitu-media-lz-nanshiyi-7674923567393670626-f4698fee33d029a9.zip` | 199,793,975 | `bec76999c5a7089594e1b43e639f02c3dc8be57dfee0747ef8839d1e6f5ad67a` |
| `lz-nimofei-7651182224411084027` | 你莫肥 | `shitu-media-lz-nimofei-7651182224411084027-e563ed07a88f3329.zip` | 140,353,424 | `ff5bcee41e3af5dd4b13850a3449d2483c48295c794aaf4a47859d86d64aa9c8` |
| `lz-pangshibushishi-7474975676995521828` | 庞师不是师 | `shitu-media-lz-pangshibushishi-7474975676995521828-e3af5d15d78bb533.zip` | 80,530,308 | `3dfbb5148cc7327530190cc23fc819cb398ce1a87eca95d0af349ff07a76c5b7` |
| `lz-ppchaonengxuan-7618499056986290569` | PP超能炫 | `shitu-media-lz-ppchaonengxuan-7618499056986290569-7f27b29513d7ea8f.zip` | 628,938,571 | `36705488b6abbe8371aea75d4c2d3f421a335e93272498faea0a8c751d3cca52` |
| `lz-renmeixiduo-7694536003423680099` | 人美戏多 | `shitu-media-lz-renmeixiduo-7694536003423680099-3bd1f9d5d7470baf.zip` | 26,550,483 | `eee35b51867813fd1f6f1eb77ca16cd551362c38d9356630545b55942553588e` |
| `lz-rourou-7111955300776791332` | 肉肉大搜索 | `shitu-media-lz-rourou-7111955300776791332-07e8d52fc6397271.zip` | 114,572,976 | `b24b65859e7c2b9739c20765128d6bd7de29aa4dffab6ae22bb7691c9cbbd7f0` |
| `lz-taiyi-7676445406217731170` | 太一one | `shitu-media-lz-taiyi-7676445406217731170-987eae60fca63bcf.zip` | 137,829,899 | `e69d9c5a080167005762589c8c95c896a92a4c8ad80bfe5e4fd95d3d1f3b572b` |
| `lz-xiaobaozha-7482986853713399099` | 小爆炸 | `shitu-media-lz-xiaobaozha-7482986853713399099-b6f193385a3d90d8.zip` | 19,482,929 | `d2316adc407f7e7ae5e4e68e933cad290a158eb8426ae5ced5953893fec95556` |
| `lz-xiaobeiele-7513862055582027017` | 小贝饿了 | `shitu-media-lz-xiaobeiele-7513862055582027017-8343a60e3068c05c.zip` | 271,937,928 | `c28a4706cc630331325c9f81a46e519d0fa9222d0e084395036c45f4355b2e43` |
| `lz-xiaojiu-7689410991830644331` | 天才少女小酒 | `shitu-media-lz-xiaojiu-7689410991830644331-f772627669fffa91.zip` | 27,811,172 | `88d49b2bd997c16f4e2750a89952c100906a64cb08a329c7dc0e5a6ed69af079` |
| `lz-xiaxiachibupang-7637442646093672895` | 夏夏吃不胖 | `shitu-media-lz-xiaxiachibupang-7637442646093672895-d5aeb2f4eb0331f8.zip` | 18,617,834 | `043e710010ff4b3435d754c1e7333da2a90f03e9901146f35152a7131dd3f6ea` |
| `lz-xunweiguangxi-7680505820355111075` | 寻味广西 | `shitu-media-lz-xunweiguangxi-7680505820355111075-363b2102c378916b.zip` | 48,367,083 | `ec2f8da604942c98b564b4d2bef3e1602ea59634d011e6e53fe05c653e6849a2` |
| `lz-zaodianshui-7692703294901089418` | 早點睡💤 | `shitu-media-lz-zaodianshui-7692703294901089418-d9ba409fc95dedd5.zip` | 11,524,319 | `fa824f6fe73a496ce80165c61635b9699ac6337fbcb4866501ebc585cc01ff6a` |
| `lz-zhufangyu-7654520759927209914` | 朱芳雨 | `shitu-media-lz-zhufangyu-7654520759927209914-a56417d8911c7950.zip` | 151,645,327 | `efb0f5eda3ed8ed322b48148e1747919c367b1bbc686198911c42c48e52b7ef7` |
| `lz-zhuzhu-7579273161821146422` | 猪猪七分饱 | `shitu-media-lz-zhuzhu-7579273161821146422-7418891af7d16384.zip` | 487,289,585 | `06de42312fe1a2e2f8300ca11c40fd3e46b9f2da4cf74cb7c2bb4e869abf2ad8` |

---

## 4. 自动化 QA 验收结果（22/22 100% 通过）

运行指令：`node map-base/scripts/review-liuzhou.mjs`
报告存储：`output/research/liuzhou/QA-LIUZHOU-INTAKE.json`

- **桌面视口 (1440×960)**：
  - 城市高德编码识别：450200；
  - 51 处美食打卡点全部渲染为精简美食圆形头像（直径 48px），无重叠遮挡；
  - 全部 51 处具有本地 MP4 剪辑和高清封面；
  - 全部 51 处具有真实 OpenStreetMap 道路/节点锚点参照；
  - 点击卡片展开为长方形卡片，右上角提供“×”折叠关闭按钮；
  - 视频浮窗顺畅播放，支持 ▶ 原生就地播放，切店、换片和关闭立刻停音；
  - 道路连线为贴合真实街道的橙色实线，中点悬浮“沿路约 XX 米 / 公里”徽标；
- **移动与短屏视口 (390×844, 320×680, 736×414)**：
  - 页面无横向溢出，行程 dock 栏和卡片自适应缩放无裁切；
- **多城隔离保障**：
  - 重庆（500000）与长沙（430100）与南京（320100）零污染，本地存储命名空间严格隔离。
