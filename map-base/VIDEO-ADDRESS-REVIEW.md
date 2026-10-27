# 原视频门牌与一手地址资料对照

2026-10-27。本轮补充两家店的地址出处，仍使用原有视频浮层的“店址核对说明”。没有新增页面、工具栏、门店图钉或到店路线。

本地入口：[菜篮子片段](http://127.0.0.1:8791/?view=food&videos=1&clip=nangua-cailanzi)、[嫩豆芽片段](http://127.0.0.1:8791/?view=food&videos=1&clip=nangua-nendouya)。两段仍使用已获用户确认授权的原片与原片封面。

## 本轮采用的证据

| 原片目标 | 实际核读的来源 | 采用结论 |
| --- | --- | --- |
| 菜篮子，福泉路22号附61号 | [江北区市场监管局食品经营许可新办信息](https://scjgj.cq.gov.cn/zz/jbq/zwgk/fdzdgknr_146781/xzxk_146787/xzspjg/202502/t20250212_14296418.html)，2025-02-12发布；列出江北区菜篮子面包店及完整门牌 | 门牌文字与原片片尾地址卡一致；没有精确地图位置或当前营业核实 |
| 嫩豆芽老火锅，新南路390号天邻风景南门 | [黄家码头餐饮官网联系页](https://www.hjmthot.com/contact)，页面未注明发布日期；本次读取日2026-10-27，单独列出“嫩豆芽北环” | 街道、门牌、小区南门与原片线索一致；门头图外观相符，没有可采用的坐标 |

品牌门头图片仅保存在忽略的本地目录用于内部对照，未作为封面或网站素材；检查没有EXIF GPS。网站封面仍取自用户确认可用的原视频。资料记录不包含许可公示中的经营者个人字段。

结构化证据在`../output/research/video-primary-address-evidence-20261027.json`，区分发布日期、读取日、原片地址、资料地址与采用范围。生成后的`data/video-location-reviews.json`增加两条`addressMatch:primary-source-crosschecked`，保留`branchMatch:unconfirmed`、`entranceMatch:unconfirmed`和`routeEligible:false`。这两条没有参考地标几何；原三样子的罗汉寺参考轮廓保持不变。

## 本地数据覆盖核对

`scripts/scan-video-pois.mjs`离线读取现有PMTiles的288张z15瓦片、POI/街道/建筑/地名图层，以及两份缓存XML。完整中间结果留在忽略的`.local/poi-scan/`，小型可交接结果在`../output/research/video-poi-audit-20261027.json`。

- 9,195个POI瓦片片段，按ID、名称与显示几何去重后8,165个显示要素；它们不是原始独立OSM节点、门店数量或入口记录。
- 7,084个显示点在当前配置范围内，1,081个位于边缘瓦片缓冲区域；不能把缓冲区域等同产品已经支持的城市范围。
- 20个视频目标的完整店名匹配为0；这一结果只说明现有资料没有匹配，不代表商家不存在。
- “天邻风景”为住宅标签，显示点在当前西边界之外。“福泉路”的已观察道路片段也位于西侧范围外，不能由此推导具体22号门牌坐标。没有用住宅中心、道路中心或无街道关联的门牌标签替代店点，也没有扩大地图包。

对8家店的有界检索结果另见`../output/research/store-location-a-20261027.md`、`store-location-b-20261027.md`及`cached-poi-match-20261027.md`。其余线索含不同分店、旧稿门牌差异或缺少可读一手地址，不生成坐标。

## 复现和检查

在`map-base`目录执行：

```powershell
node scripts/scan-video-pois.mjs
node scripts/prepare-video-address-reviews.mjs
node scripts/prepare-video-map-contexts.mjs
node scripts/review-primary-address-reviews.mjs
node scripts/review-video-map-context-data.mjs
npm.cmd run build
node scripts/review-video-library-data.mjs
```

`scripts/review-video-primary-address.js`由Playwright CLI的`run-code --filename`在隔离浏览器运行，输出保存为`VIDEO-PRIMARY-ADDRESS-UI-QA.json`。本轮结果：

- 地址数据14项通过，包括原文类型/门牌、仅搜索摘要拒绝、无坐标升级、原地图与公开记录哈希不变。
- 界面21项通过，包括两段精确链接、解码、说明及安全来源链接、没有新增附近按钮或店点、1440/390/320可达、关闭卸载、旧罗汉寺参考仍受限、无外站自动请求或页面错误。
- 原参考地标数据15项、媒体与无素材克隆构建44项通过；20段媒体及封面未变。上一阶段35项地图往返与55项视频库界面报告属于历史检查，本轮没有全套重跑。

截图`../output/playwright/video-address-cailanzi-1440.png`及`video-address-cailanzi-390.png`已人工查看。手机是浏览器模拟；用户浏览器的想去清单未修改。

## 下一阶段的实际依赖

本轮没有新增可采用的门店坐标。用户暂时没有商家或作者定位链接，应先评估可追溯、可使用的位置数据渠道与西侧地图覆盖，再按同分店关联证据接入具体店点。重复检索相同名称、借用商业地图坐标或把住宅/寺庙标签当店门口不能解决这一缺口。精确店址、入口到路网、第三条原片、生产媒体托管和上线仍需后续完成。
