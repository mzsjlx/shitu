# 食途 · 洪崖洞三维小样

2026-10-20。当前交付是**第一块真实三维模型与交互验证版**，尚未通过参考图的美术验收，也不是正式上线的网站。

## 打开预览

用 Chrome 或 Edge 打开本目录的 **`preview.html`**。它包含模型生成代码、城市数据、样式和菜品概念图，可以离线使用，不需要高德账号、开发服务器或安装依赖。需要浏览器支持 WebGL 2。

- 拖动旋转，滚轮缩放；右键拖动平移。
- 触屏可单指旋转、双指缩放和平移。
- 底部切换江岸／俯瞰视角，或使用旋转与缩放按钮。
- 顶部“美食卡片”开关可以收起图片，单独看模型。
- 点击美食卡片打开浮层；点击“模型说明”查看数据边界；Esc 关闭浮层。

外部数据来源链接只有点击后才需要联网。这里没有真实门店视频播放、真实路线规划或账号登录。

## 本轮做了什么

这块场景覆盖重庆洪崖洞与千厮门大桥周边约 1.74 × 1.67 公里。地形、道路、岸线、建筑、桥、窗格、屋檐与树木都有三维几何；食物卡片由三维坐标投影到屏幕，转到遮挡位置或屏幕外时会收起。

普通楼使用奶油色材质与细窗格，洪崖洞使用近似的分层建筑和曲面屋檐，桥体使用自定义桥塔与拉索。浏览器包含接触阴影、日光、江面反射、可中断的镜头过渡和减少动态效果支持。三维场景按需渲染，静止时不持续播放动画。

**和参考图仍有明显差距**：普通楼外观重复、地标造型仍需按照片精修，地面和绿化缺少精细材质，部分道路与桥隧层级待核。不能把当前模型称为实景扫描或最终视觉效果。

## 数据依据与估算范围

| 内容 | 本轮依据 | 限制 |
| --- | --- | --- |
| 道路、岸线、建筑轮廓 | 2026-10-19 缓存的 OpenStreetMap 局部摘录 | 数据可能缺漏；不是现场测绘 |
| 建筑数据 | 400 条：25 条高度记录，69 条按层数推算，306 条估算 | 洪崖洞单独建模；普通楼共 399 栋。层数和窗格不代表逐楼核实 |
| 地形 | Mapzen / Tilezen Terrarium 高程瓦片，z14 两张 | 源高程较粗，无法还原建筑台地和每一级台阶 |
| 洪崖洞 | OSM way/939578294 的位置、朝向及大致轮廓 | 屋檐、层次和细部为近似建模；区域内地形做了容纳退台的视觉修正 |
| 千厮门大桥 | OSM way/1257167362 轮廓、路段与桥轴 | 桥塔、拉索、桥面高程是近似表达；不等于桥梁测绘 |
| 树木、窗格、船 | 自定义装饰几何；树木避开已知水面、路面和建筑轮廓 | 3500 处装饰树木，不是实际树木清单 |
| 江面 | 来自真实岸线；统一视觉水位与程序波纹 | 不是实时水位，颜色是产品配色 |
| 菜品图片 | 前一轮生成的火锅／小面概念图 | 未绑定具体门店，不是门店实拍 |

场景坐标以 WGS84 **106.5752, 29.5652** 为原点，近似转换为局部米制坐标：X 向东，Y 向上，Z 向南。没有接入 GCJ-02 路线或 POI；后续接入必须明确坐标转换和道路高程。

导航必须使用另行验证的路网、入口和路线服务。当前可见路面不构成可执行的步行网络，尤其不能据此推断台阶、桥隧和楼层连通。

## 文件

- `preview.html`：可直接用浏览器打开的完整离线预览。
- `models/chongqing-hongyadong-study.glb`：可检查和复用的三维网格与材质。
- `src/main.js`：模型构建、渲染、镜头和卡片投影。
- `src/index.html`、`src/styles.css`：全屏布局与浮层。
- `dist/`：用于本地 HTTP 预览的静态文件。
- `dist/data/city.json`：处理后的地形、岸线、道路、建筑轮廓、逐建筑高度依据与来源 ID。
- `data/osm-raw.xml`、`data/osm-source.json`：缓存的地理摘录、请求范围、时间和哈希。
- `data/terrain/`：缓存高程瓦片与来源记录。
- `data/quality-report.json`：数据数量、依据和限制。
- `VERIFICATION.md`：浏览器、导出和移动布局检查记录。

GLB 使用 glTF 2.0 和 `EXT_mesh_gpu_instancing`，查看器需支持实例扩展。导出文件包含几何、常规材质与来源说明；浏览器的实时水面反射、接触阴影和网页 UI 仍由源码实现，GLB 中的江面使用可移植的普通材质。单独在其他工具打开时，光照效果取决于该工具的场景设置。

## 继续开发

当前已固定 Three.js 0.186.1、esbuild 0.25.12，依赖版本见锁文件。

```powershell
cd 'D:\codex\美食网站\design\prototype-3d'
npm.cmd ci
node scripts/build.mjs
node scripts/serve.mjs
```

本地服务地址为 `http://127.0.0.1:8787/`，仅监听本机。修改源码后重新运行 build；它同时更新 `dist/` 和 `preview.html`。

只有修改地理处理规则时才需要重新生成 `city.json`：使用有 numpy、Pillow、Shapely 的 Python 运行 `scripts/build_data.py`，然后 build。原始数据已经缓存，日常改样式无需重复下载。`fetch_*.py` 保留获取过程，不是每次构建的前置步骤。

需要重新导出模型时，在预览的开发者工具中执行 `await window.cityStudy.exportScene()`。它会导出并用 GLTFLoader 重新解析一次，再下载 GLB。诊断入口 `window.cityStudy.getStats()` 可读取模型与渲染统计。

## 来源与许可记录

- [OpenStreetMap 数据与署名](https://www.openstreetmap.org/copyright)：© OpenStreetMap contributors，ODbL 1.0。
- [OSM 只读区域 API](https://wiki.openstreetmap.org/wiki/API_v0.6)：原始请求与哈希保存在 `data/osm-source.json`。
- [公开 Terrain Tiles](https://registry.opendata.aws/terrain-tiles/)；[Tilezen 高程数据署名](https://github.com/tilezen/joerd/blob/master/docs/attribution.md)：Mapzen / Tilezen；SRTM、GMTED2010（USGS），ETOPO1（NOAA）。
- [千厮门大桥官方介绍](https://zfcxjw.cq.gov.cn/zjzj/tszj/qdcq/202211/t20221128_11339950.html)：造型研究参考，模型细部仍为近似。
- Three.js 为 MIT 许可，保留于 `dist/THREE-LICENSE.txt`，离线 HTML 也包含该许可文本。
- 菜品概念素材生成记录见 `../concepts/GENERATION-NOTES.md`。没有将高德截图作为场景背景。

下一轮先精修关键地标、街面材质与近景绿化，再将已经确定的路线胶囊、偏好规划和视频浮层接到这块真实三维场景上。真实门店内容与路线接入仍需独立验证。
