# 美食卡片的直线与沿路距离

在 `/?view=food` 中加入至少两家「想去」，底部显示「直线 / 沿路」。切换同时更新地图连线、每段标签及总距离；多家按清单顺序连接，调整顺序后重算。模式保存在独立浏览器键 `foodcity:distance-mode:chongqing:v1`，不会改写原清单。

- **直线**：两处规划点之间的球面距离，橙色虚线。
- **沿路**：按步行参考规则在本地开放道路网络中寻找连接，橙色实线。距离为采用的道路折线二维长度之和，不使用直线乘系数。街区点先投影到最近可用源道路线段；细灰虚线表示位置连接，不计入沿路长度。
- 最近道路超出 250 米或网络未连通时，该段不生成假路线。部分成功只显示成功段并提示未连通段数，不将部分距离当全程；读取失败可以再点「沿路」重试。

当前店点是大致街区位置，适合逛吃规划。源数据可能缺步行通道、现场通行状态和边界外绕路；没有核验店门、楼层和实时营业，不提供逐向导航或步行时间。沿路采用普通道路和步行道路，保留原节点连接的桥梁、隧道与台阶；已知步行禁止、受限通行和不明条件限制不采用。汽车单行不直接套用于步行，明确的 `oneway:foot` 保留。老的 `?view=walk` 固定样板仍使用原地面研究规则。

## 数据与构建

`data/food-road-network.json` 来自已保存的 Geofabrik 重庆 OSM 提取，源日期 **2026-10-25**。范围 `[106.43,29.48,106.65,29.65]`，保留 131,412 个原始节点、22,252 条 highway way；规划图有 126,384 个可用源线段。当前 31 个店点到最近可用道路的偏移均小于 66 米。

源 PBF SHA256 为 `ea1bd60ca0a71231f6ec62bb5ff270594e56559c88d483e25c7e60bcc6fd20ba`；输出大小、SHA256 与范围见 `data/food-road-network-manifest.json`。只按连续原始节点 ID 连接，缺节点就断开，几何交叉不创造路口。没有请求、转换或保存商业地图坐标。

来源：[Geofabrik 重庆下载页](https://download.geofabrik.de/asia/china/chongqing.html)，© OpenStreetMap contributors，按 [ODbL 1.0](https://www.openstreetmap.org/copyright) 提供该派生道路数据库。原始 PBF 放在本机忽略目录；生成的道路 JSON 随代码分发，朋友无需额外下载或注册地图账户。

普通 HTTP 页首次切到沿路模式才读取约 8.7 MB 道路 JSON，在独立 Worker 建图、计算并复用。取消、切模式、换店会使旧任务失效。单文件 `preview.html` 内嵌相同网络和 Worker，构建后约 28.4 MB；推荐本地 HTTP 预览。更换城市时应按城市范围准备独立提取，不将全国路网一次发送给浏览器。

维护数据时需要 Python 3、`osmium` 和已核对的 PBF；普通协作者只需常规构建，无需重跑 Python：

```powershell
.local/overture-venv/Scripts/python.exe scripts/prepare-food-road-network.py
.local/overture-venv/Scripts/python.exe scripts/review-food-road-source.py
node scripts/review-food-road-network.mjs
npm.cmd run build
```

Python 路径按自己电脑调整，`--pbf` 指定原始提取路径。替换快照时还应核对、显式指定新日期和 SHA256，保留来源清单。

## 验证

- `FOOD-ROAD-SOURCE-QA.json`：独立读取冻结原始 PBF，全部 131,412 个节点、22,252 条 way 的 ID、坐标、节点顺序与保留标签相符。
- `FOOD-ROAD-DATA-QA.json`：21 项，包含 U 形绕路、投影端点、步行单向、原节点连接/缺口、桥隧、通行限制、31 个点吸附距离，以及 6 对实际路线的源边邻接与独立距离求和。
- `FOOD-ROAD-UI-QA.json`：20 项，包含懒加载、两种连线/数字切换、总和与排序、偏好保留、390/320/横屏适配、失败重试、部分断路、过期结果、退出清理和 HTTP 单文件。手机为浏览器模拟；测试使用独立会话，不改使用者清单。
- `FOOD-ROAD-VIDEO-REGRESSION-QA.json`：原有视频地图流程 14 项通过，包含来源、真实片段播放、切店停止旧视频、直线模式及手机浮窗比例；旧道路图 18 项回归也通过。

浏览器脚本 `scripts/review-food-road-distance.js` 使用 Playwright CLI `run-code --filename` 执行。截图仅留本机 `.local/`。视频回归为 `scripts/review-video-food-map.js`，旧道路图回归为 `scripts/review-walk-graph.mjs`。
