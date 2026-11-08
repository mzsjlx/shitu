import json
import math

def haversine(lon1, lat1, lon2, lat2):
    R = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi/2.0)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

with open('map-base/data/cities/chengdu/food-road-network.json', 'r', encoding='utf-8') as f:
    net = json.load(f)

nodes = net.get('nodes', [])
node_ways = {}
for w in net.get('ways', []):
    w_name = w.get('tags', {}).get('name', '未命名道路')
    for nid in w.get('nodes', []):
        if nid not in node_ways:
            node_ways[nid] = w_name

places_to_snap = [
    {"name": "杨老头鲜货烧烤（太古里店）", "coord": [104.0818, 30.6552]},
    {"name": "甘记肥肠粉（马鞍北路总店）", "coord": [104.0865, 30.6860]},
    {"name": "西月城谭豆花（太升南路总店）", "coord": [104.0782, 30.6628]},
    {"name": "回水镇·江湖川菜（太古里店）", "coord": [104.0825, 30.6538]},
    {"name": "晓薇冒菜（猛追湾店）", "coord": [104.0888, 30.6690]},
    {"name": "铁门杂酱面（牛市口店）", "coord": [104.1030, 30.6410]},
    {"name": "贺记蛋烘糕（文庙西街总店）", "coord": [104.0540, 30.6510]},
    {"name": "甩记小吃店（兴禅寺街店）", "coord": [104.0950, 30.6710]},
    {"name": "唐拌虎脑花·肥肠（一环路店）", "coord": [104.0797, 30.6401]},
    {"name": "眼哥素椒面（文殊院店）", "coord": [104.0776, 30.6671]}
]

for p in places_to_snap:
    lon, lat = p["coord"]
    best_dist = float('inf')
    best_node = None
    for n in nodes:
        nid, n_lon, n_lat = n[0], n[1], n[2]
        d = haversine(lon, lat, n_lon, n_lat)
        if d < best_dist:
            best_dist = d
            best_node = n
    rname = node_ways.get(best_node[0], '附近道路')
    print(f"{p['name']}:")
    print(f"  Coord: [{lon}, {lat}]")
    print(f"  Nearest node: {best_node[0]} at [{best_node[1]:.6f}, {best_node[2]:.6f}], dist: {best_dist:.1f}m (Road: {rname})")
