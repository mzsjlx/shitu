# 本地开放地点核查

`scripts/audit-open-pois.py` 用本地 OSM PBF 和/或 Overture Places GeoParquet，对照 `data/video-library.json` 的视频门店名生成候选报告。它不会编辑门店库、地图数据、视频、路线或浏览器清单。报告只说明名称匹配，不能自动证明商家、分店、入口或使用许可；在扩大城市后，先准备对应范围的数据和视频目录。

2026-10-27 样本结果与来源见 [开放地点核查记录](../output/research/open-poi-source-evaluation-20261027.md)。下载文件、环境与报告保存在已忽略的 `.local/`，不会随 Git 仓库上传。

## 依赖与数据

以下是 Windows PowerShell 示例，在 `map-base` 目录执行；需要 Python 3.12 和网络。依赖仅安装在项目本地虚拟环境：

```powershell
py -3.12 -m venv .local\poi-venv
.\.local\poi-venv\Scripts\python.exe -m pip install -r .\scripts\open-poi-requirements.txt
.\.local\poi-venv\Scripts\python.exe .\scripts\test-open-poi-audit.py
```

从 [Geofabrik 重庆提取页面](https://download.geofabrik.de/asia/china/chongqing.html)选择具体版本并核验其公布的校验值。以下是本轮版本，文件留在 `.local/`：

```powershell
curl.exe --fail --location -o .local\chongqing-261025.osm.pbf https://download.geofabrik.de/asia/china/chongqing-261025.osm.pbf
```

本轮还使用 Overture `2026-10-21.0` Places。可按需从公开 S3 读取特定范围，保存样本和元数据；网络、数据版本或地区服务可用性可能变化：

```powershell
.\.local\poi-venv\Scripts\python.exe .\scripts\download-overture-places.py --bbox=106.45,29.47,106.67,29.66 --release 2026-10-21.0 --output overture-sample.parquet
```

`--bbox` 坐标顺序是 WGS84 西、南、东、北；下载时按数据边界筛选，核查时再判断点是否位于查询范围。该脚本不会覆盖现有样本，旁边的 `.meta.json` 记录版本、范围和 SHA-256。样本不包含完整城市，也无法证明数据源收录了所有门店。

## 生成待人工复核报告

```powershell
.\.local\poi-venv\Scripts\python.exe .\scripts\audit-open-pois.py --bbox=106.45,29.47,106.67,29.66 --pbf .\.local\chongqing-261025.osm.pbf --osm-url https://download.geofabrik.de/asia/china/chongqing-261025.osm.pbf --places .\.local\overture-sample.parquet --places-input-bbox=106.45,29.47,106.67,29.66 --release 2026-10-21.0 --output poi-review.json
```

也可只传 `--pbf` 或只传 `--places`。使用 Places 时必须填写实际下载范围和版本；查询范围须在样本范围内。脚本核对下载脚本生成的元数据与样本哈希；没有元数据的旧文件会在报告中标记范围和版本由使用者声明，哈希不证明原始数据的来源或位置准确。输出文件名仅允许位于 `.local/`，已有报告不会被覆盖；不指定 `--output` 时输出 JSON 到终端。

核查范围内的名称在 Unicode 规范化、简繁转换、大小写和标点处理后进行完整名/子串比较，少于 3 个字符的名称不参与，报告会列出被跳过的目标。OSM 节点保留原始 ID 和标签；匹配到的 way 用包围范围做宽松筛选，不假装计算了门店入口；无法定位的匹配对象单独列出。Overture 匹配项保留 `sources` 和 `addresses` 等原始资料。Windows 下若 PBF 路径包含中文，脚本会在系统临时目录创建校验后的短期副本并自动清理；若系统临时目录也含非 ASCII 字符，可把 `TEMP` 指向可写的英文路径后重试。

## 审核边界

1. 候选名字相似不等于同一家店：必须结合视频和可信来源核对城市、分店、门牌、时效及现场入口。
2. 数据可能缺失、过期或位置偏移；空结果只说明所选版本、范围和文字规则下没有候选。关系对象或缺失节点须人工检查。
3. 保留并遵守具体数据集的许可、署名、更新要求；开放数据不等于适用于所有地区上线要求。高德等商业服务的数据还需按其服务条款和书面授权确认，不能复制进开放数据报告冒充开放来源。
4. 分店坐标、入口坐标与可通行路线是不同问题。获得可用位置证据后才能考虑地图卡片，路线要另行核对可通行道路。
