import json
import math
from pathlib import Path

root = Path(__file__).resolve().parents[3]
network_path = root / "map-base/data/cities/harbin/food-road-network.json"

with open(network_path, "r", encoding="utf-8") as f:
    network = json.load(f)

nodes = network.get("nodes", {})
print(f"Total road nodes in Harbin: {len(nodes)}")

def haversine_m(lon1, lat1, lon2, lat2):
    R = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(delta_lambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

test_stores = [
    ("前宏吉之味砂锅面 (金太阳店)", 126.6278, 45.7695, "地段街128号索菲亚金太阳6楼"),
    ("崔家鸡馆 (正阳北小区店)", 126.6575, 45.7892, "道外区北十道街17号"),
    ("辣椒高手韩国辣料理 (中央大街店)", 126.6210, 45.7682, "道里区红霞街59号"),
    ("居家菜馆 (下夹树街店)", 126.6340, 45.7530, "南岗区下夹树街20号"),
    ("丹科手工面包 DANKO", 126.6390, 45.7580, "南岗区花园街D区20号"),
    ("长春街222号三鲜水饺", 126.6660, 45.7880, "道外区长春街222号"),
    ("徐包铺 (丰润街店)", 126.6530, 45.7875, "道外区丰润街17号"),
    ("永顺小吃 (长春街店)", 126.6630, 45.7870, "道外区长春街37号"),
    ("沿江饺子馆", 126.6540, 45.7925, "道外区钱塘街163号")
]

for name, lon, lat, addr in test_stores:
    best_dist = 999999
    best_node = None
    for item in nodes:
        nid, nlon, nlat = item[0], item[1], item[2]
        d = haversine_m(lon, lat, nlon, nlat)
        if d < best_dist:
            best_dist = d
            best_node = (nid, [nlon, nlat])
    print(f"\nStore: {name} ({addr})")
    print(f"  Target: [{lon}, {lat}]")
    print(f"  Nearest node: {best_node[0]} at {best_node[1]}, dist: {best_dist:.2f}m")
