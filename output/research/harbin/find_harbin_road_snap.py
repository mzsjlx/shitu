import json
import math

net = json.load(open('map-base/data/cities/harbin/food-road-network.json', encoding='utf-8'))
nodes = net['nodes']
node_map = {n[0]: n for n in nodes}
ways = net['ways']

def haversine(lon1, lat1, lon2, lat2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1-a))

targets = [
    ("刘氏知音酒楼", "辽阳街", 126.65021, 45.74836),
    ("山河屯铁锅炖大鹅", "民安街", 126.60218, 45.75382),
    ("道里菜市场", "尚志大街", 126.62145, 45.77234),
    ("道外张飞扒肉", "南五道街", 126.64380, 45.78712),
    ("喜家德水饺", "中央大街", 126.61830, 45.77450),
    ("居民楼四张桌锅包肉", "六顺街", 126.68024, 45.73190)
]

for name, street, approx_lon, approx_lat in targets:
    matched_ways = [w for w in ways if street in w.get('tags', {}).get('name', '')]
    if not matched_ways:
        print(f"No ways found matching {street}")
        # find nearest any node
        best_n = None
        best_d = 999999
        for nid, ninfo in node_map.items():
            d = haversine(approx_lon, approx_lat, ninfo[1], ninfo[2])
            if d < best_d:
                best_d = d
                best_n = ninfo
        print(f"  Nearest node for {name}: id={best_n[0]}, dist={best_d:.1f}m, coord=[{best_n[1]}, {best_n[2]}]")
    else:
        # find node on matched ways closest to approx coords
        best_n = None
        best_d = 999999
        best_way = None
        for w in matched_ways:
            for nid in w['nodes']:
                ninfo = node_map.get(nid)
                if ninfo:
                    d = haversine(approx_lon, approx_lat, ninfo[1], ninfo[2])
                    if d < best_d:
                        best_d = d
                        best_n = ninfo
                        best_way = w
        print(f"SUCCESS {name} on {best_way.get('tags',{}).get('name')}: node_id={best_n[0]}, dist={best_d:.1f}m, coord=[{best_n[1]}, {best_n[2]}] (way_id={best_way['id']})")
