# 洪崖洞地标图层

2026-10-26 本地验证。入口为 `/?view=landmark`，普通地图右上“地图图层 → 看看洪崖洞”也可进入。桌面按临江方向取景，手机按视口宽度缩放；模型随地图缩放、旋转与地形开关变化。复位回到原城市视角。

## 地理与美术的边界

- 平面锚点为 WGS84 `[106.57533890406658, 29.565051423897692]`，源自原始 OSM way/939578294 的足迹质心。22个闭合坐标、方向计算与缓存日期保存在 `data/hongyadong-landmark.json`，可以追溯到原XML。
- 从原 `../design/prototype-3d/src/main.js` 提取独立洪崖洞美术模型，保留11组层叠木楼、上层亭阁、曲面屋顶、窗格、回廊、灯笼与侧面台阶。细节和约73.86米的整体高度是美术近似，并非测绘或摄影重建；没有把概念图片当成地理数据。
- 本地顶点单位为米，X向东、Y向上、Z向南；约20.207°的朝向已经写入几何，地图集成层不重复旋转。采用 MapLibre 6 的 `defaultProjectionData.mainMatrix` 与 Mercator 锚点组合，避免把城市坐标写入Float32顶点。
- 有地形时，在足迹内部的临江基座选3点读取DEM，取最低值加0.5米的视觉余量；关闭地形时基座为0米。不修改道路、水面、周边建筑位置或地形原始数据。当前粗DEM会遮住部分基座和楼层，尤其中央临江侧；还需要更细的地形资料及局部基座精修。

## 显示与资源

`src/hongyadong-layer.js` 使用自定义3D图层，共享地图的颜色与深度缓冲，不清空深度、不循环请求重绘。约102,832个三角形、8个材质批次，几何缓冲约7.4MB；程序生成几何，不下载GLB、纹理或外站模型。主包增加Three.js，生产仍按需读PMTiles；HTTP单文件也包含相同模型。

只替换当前PMTiles中已与原足迹核对的 `buildings` 要素ID `35185311667126`。z15中的量化轮廓到源边界最大偏差约0.13米，允许源简化。较低源级别会合并建筑，故模型从地图z15.2起显示；2D、低级别、建筑关闭、街道近景或模型失败时恢复原过滤器。更换城市瓦片包后必须重新核对ID及归档SHA256，不能跨数据版本盲用。

进入专门地标视角时，暂时收起街道近景的压楼显示，不改变用户的街道开关偏好；进入美食、道路试算、道路选择、2D或复位后恢复街道行为。模型异常只退回普通楼体，不阻断真实底图或美食卡片。MapLibre恢复WebGL时不会自动恢复自定义图层，本项目重新挂载模型并释放旧资源；为避开实测的地形缓存纹理异常，绘图恢复后先使用平面地形，用户可再开启山地地形。

Three.js 0.186.1为MIT许可；构建把 `THREE-LICENSE.txt` 放入dist，并在单文件中保留许可。模型位置资料继续署名OpenStreetMap。自定义图层的共享深度接口见 [MapLibre官方文档](https://maplibre.org/maplibre-gl-js/docs/API/interfaces/CustomLayerInterface/)。

## 复核

运行 `node scripts/review-hongyadong-data.mjs` 核对原XML、缓存哈希、足迹、采样点、几何预算和PMTiles替换对象。浏览器脚本 `scripts/review-hongyadong.js` 与 `scripts/review-hongyadong-followup.js` 通过Playwright CLI执行，使用隔离context，不读写用户浏览器清单。报告分别为 `HONGYADONG-DATA-QA.json`、`HONGYADONG-UI-QA.json`、`HONGYADONG-FOLLOWUP-QA.json`。初次失败报告保留，不能把无异常日志当作视觉验收。

公众门店仍为原来的两个来源候选。这个图层没有改变店址、入口核实、视频播放或路线资格，也没有发布网站。
