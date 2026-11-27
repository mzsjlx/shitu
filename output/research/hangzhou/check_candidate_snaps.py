import json, math
from pathlib import Path

worktree = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep\map-base")
road_net = json.loads((worktree / "data/cities/hangzhou/food-road-network.json").read_text(encoding="utf-8"))

nodes = []
if isinstance(road_net["nodes"], dict):
    for k, v in road_net["nodes"].items():
        nodes.append({"id": v[0], "lon": v[1], "lat": v[2]})
else:
    for v in road_net["nodes"]:
        nodes.append({"id": v[0], "lon": v[1], "lat": v[2]})

def dist_m(lon1, lat1, lon2, lat2):
    mid_lat = math.radians((lat1 + lat2) / 2.0)
    dx = (lon1 - lon2) * 111320.0 * math.cos(mid_lat)
    dy = (lat1 - lat2) * 110540.0
    return math.hypot(dx, dy)

candidates = [
    # Video 1: 羊桑
    {
        "name": "柿野（天目里店）",
        "author": "羊桑",
        "category": "创意湘菜",
        "coord": [120.1015, 30.2693],
        "address": "天目山路398号天目里16号楼9层（沿天目山路西走廊延伸）"
    },
    # Video 2: 牛牛很挑食
    {
        "name": "PICATHAM Thai Cuisine & Wine",
        "author": "牛牛很挑食",
        "category": "泰式料理",
        "coord": [120.1505, 30.2725],
        "address": "西湖区莫干山路17号（武林商圈）"
    },
    # Video 3: 杰欧
    {
        "name": "对照馆子（蔡马店）",
        "author": "杰欧",
        "category": "市井杭帮菜",
        "coord": [120.1452, 30.3182],
        "address": "拱墅区宸麟路497号（蔡马/拱宸桥东）"
    },
    {
        "name": "常顺茶食（大井巷店）",
        "author": "杰欧",
        "category": "特色茶食/小吃",
        "coord": [120.1685, 30.2402],
        "address": "上城区大井巷41-42号（清河坊/吴山）"
    },
    {
        "name": "水墨徽·山野土菜（鼓楼店）",
        "author": "杰欧",
        "category": "徽派土菜",
        "coord": [120.1705, 30.2372],
        "address": "上城区中山南路462号（鼓楼景区望仙阁旁）"
    },
    # Video 4: jiding
    {
        "name": "柑杯·鸡汤关东煮（ODEN & BEER）",
        "author": "jiding",
        "category": "日式关东煮/小酒馆",
        "coord": [120.2105, 30.2072],
        "address": "滨江区江汉路1515号龙湖滨江天街旁"
    },
    {
        "name": "寿司正传（滨江天街店）",
        "author": "jiding",
        "category": "创意寿司",
        "coord": [120.2108, 30.2076],
        "address": "滨江区江汉路1515号龙湖杭州滨江天街B馆L5"
    },
    {
        "name": "影子岛韩国料理（武林店）",
        "author": "jiding",
        "category": "韩国料理",
        "coord": [120.1622, 30.2642],
        "address": "拱墅区延安路466号浙江经贸大楼综合楼（凤起路地铁口）"
    },
    {
        "name": "Miang·Miang泰馆（星光大道店）",
        "author": "jiding",
        "category": "泰国菜/小火锅",
        "coord": [120.2120, 30.2090],
        "address": "滨江区长河街道江南大道228号星光大道一期1F"
    }
]

print("=== CANDIDATE SNAP DISTANCE CHECK ===")
for c in candidates:
    clon, clat = c["coord"]
    best_dist = 999999
    best_node = None
    for n in nodes:
        d = dist_m(clon, clat, n["lon"], n["lat"])
        if d < best_dist:
            best_dist = d
            best_node = n
    c["snap_dist"] = round(best_dist, 1)
    c["snap_node"] = best_node["id"]
    print(f"{c['name']} -> Node {best_node['id']}: {c['snap_dist']}m (lon={best_node['lon']}, lat={best_node['lat']})")
