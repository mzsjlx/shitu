# Targeted OSM lookup — 2026-10-25

This is a bounded lookup of existing OSM objects, not geocoding. No map provider coordinates were used or inferred.

Result: no publishable new point. The second and final API query succeeded with `elements: []` and OSM base timestamp `2026-10-25T09:45:03Z`. This means no object matched this query's named tags inside the requested bbox; it does not prove the shops do not exist or are absent from all OSM.

- Bbox (WGS84 west,south,east,north): `106.49,29.49,106.65,29.65`.
- Existing cached excerpt is only `106.566,29.558,106.584,29.573`; it is not city-wide coverage.
- Queried tags: `name`, `name:zh`, `alt_name`, `old_name`, `brand`.
- Regex: `花市|胖妹|好又来|老幺|老么|抄姐|潮姐|Chaojie|老甘家|放松空间|牛魔王` (case insensitive).
- Target names: 花市豌杂面; 胖妹面庄; 好又来酸辣粉; 水产老幺火锅 (video address 涂山路30号); 抄姐老火锅 (video address 民族路114号); 老甘家小龙虾&江湖菜 (video address 洋河中路91号); 放松空间虾蟹馆 (video address 洋河中路70号); 牛魔王串王 (video address 洋河路69-2号).
- All targets remain unmatched: no object id, tags, OSM coordinates or OSM address can be supplied. Do not substitute a nearby restaurant, a road point, or a same-name different branch.
- Derived OSM index false positive excluded: Mapcarta N6755704943 / OSM node 6755704943 is 好又来平价超市 in Hechuan; the type, full name, and region do not match 好又来酸辣粉.

Request log:
1. `https://overpass.private.coffee/api/interpreter` POST; client timeout after 65 seconds. The empty first response file is invalid and is not an empty search result. See first manifest.
2. `https://overpass-api.de/api/interpreter` GET, query timeout 30 seconds; successful JSON, zero elements. Raw response and query are frozen beside this file. No further API requests made.

Policy read before queries: https://wiki.openstreetmap.org/wiki/Overpass_API (public instance policy and usage). Nominatim policy was read, but Nominatim was not called. One-time targeted, cached, sequential use only. Attribution: © OpenStreetMap contributors; ODbL 1.0, https://www.openstreetmap.org/copyright .

Additional address-only primary corroboration (not a coordinate source): Chongqing Culture and Tourism Commission, 2025 PDF, lists 老甘家小龙虾·江湖菜 at 江北区洋河中路91号: https://whlyw.cq.gov.cn/zwxx_221/bmdt/tzgg/202505/P020250530603313691848.pdf . This does not identify an OSM shop object.