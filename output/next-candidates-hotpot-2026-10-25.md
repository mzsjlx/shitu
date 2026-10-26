# 火锅及丘二馆公开来源候选检索（2026-10-25）

本轮仅检查已有 OSM 名称对应的公开来源；执行 3 条检索后停止。未新增合格候选，未修改产品数据。没有下载媒体、联系作者、推定门口或建立路线。

## 检索边界

- `"齐齐鳝鱼火锅" "解放碑" "视频" 地址`
- `"夜福火锅" 地址 作者 视频`
- `"丘二馆" "视频" "民权路"`

OSM 名称与坐标来自 `output/entrance-candidate-audit.json`，源缓存获取时间为 2026-10-19；本文件的 observedOn 是 2026-10-25，不代表到店日期。

| OSM 对象 | 缓存名称 | 缓存 WGS84 坐标 | 本轮结果 |
| --- | --- | --- | --- |
| node/5458158321 | 齊齊鱔魚火鍋 | 106.568129, 29.5631724 | 搜索出现攻略转载和聚合资料，未读到满足原创作者及具体分店地址条件的来源 |
| node/8441264117 | 夜福火锅 | 106.5677518, 29.563061 | 找到原创图文线索，但门牌地址及名称对应仍不明确，暂缓 |
| node/4139951983 | 丘二馆 | 106.5740459, 29.5585258 | 本轮检索未取得合格证据，不据此断言不存在来源或店铺 |

## 暂缓线索：夜福火锅

原创公开图文：[麻宁VIP2 的微博](https://weibo.com/2/detail/5349286381881340)。正文为第一人称聚餐描述；页面有作者名及临江门分店位置标签。正文自己指出招牌名称存在福夜/夜福两种写法。页面仅显示月日和时刻，没有读到完整年份，所以 `publishedAt` 保持 null，`publishedAtDisplay` 为 `10-1 19:05`。没有从相对搜索时间补出完整发布日期。

读取范围是网页可见文本及图片链接清单，未打开或识别配图。它不能证明街道、门牌、楼层或门口身份，无法将该来源精确绑定到已有 OSM 点。

```json
{
  "osmType": "node",
  "osmId": 8441264117,
  "osmName": "夜福火锅",
  "decision": "withheld",
  "reason": "original creator text and branch label exist; exact street/house number and OSM point identity are not established",
  "sourceURL": "https://weibo.com/2/detail/5349286381881340",
  "sourceAuthor": "麻宁VIP2",
  "sourceType": "creator-post",
  "publishedAt": null,
  "publishedAtDisplay": "10-1 19:05",
  "observedOn": "2026-10-25",
  "sourceBranchLabel": "重庆·夜福火锅(临江门店)",
  "sourceAddress": null,
  "candidateAdded": false,
  "entranceVerified": false,
  "businessStatusVerified": false,
  "routeEligible": false
}
```

地址历史线索：[新浪时尚 2016-04-27 页面](https://fashion.sina.com.cn/l/ts/go/2016-04-27/0713/doc-ifxrpvea1177279.shtml?from=wap) 在夜福段落写到临江门 35 号附近及楼梯，但文章明确标注来源 LonelyPlanet，属于转载。它既不是本轮要求的原作者页面，也不能证明 2026 年的入口或营业状态，因此未采用。另一个搜狐候选页 `https://www.sohu.com/a/128798392_430490` 打开超时，搜索摘要不作为已核读来源。

本轮接受候选数组：`[]`。若继续调查，优先核读原作者配图中的门头及门牌，或取得明确注明分店完整地址的原创内容；在缺少这项证据之前保持暂缓。
