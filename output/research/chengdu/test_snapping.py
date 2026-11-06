import json
import math

def haversine(lon1, lat1, lon2, lat2):
    R = 6371000  # meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

with open('map-base/data/cities/chengdu/food-road-network.json', 'r', encoding='utf-8') as f:
    net = json.load(f)

nodes = net['nodes']  # {id: [lon, lat]} or list? Let's check structure
print('Network keys:', list(net.keys()))
node_items = [(item[0], item[1], item[2]) for item in nodes]

def find_nearest(lon, lat):
    best_dist = float('inf')
    best_node = None
    best_coords = None
    for nid, nlon, nlat in node_items:
        d = haversine(lon, lat, nlon, nlat)
        if d < best_dist:
            best_dist = d
            best_node = nid
            best_coords = [nlon, nlat]
    return best_node, best_dist, best_coords

# Test candidates
candidates = [
    ("三道街老宅子肥肠鱼", 104.0526, 30.6769),
    ("朱大嘴肥肠豆汤(福字街)", 104.0788, 30.6564),
    ("私房水饺(海椒市)", 104.1012, 30.6416),
    ("小妹滋补蹄花(理工大学)", 104.1458, 30.6738),
    ("纯阳馆鱼香排骨面(吉祥街)", 104.0583, 30.6698),
    ("罗大姐餐厅(肖家河)", 104.0410, 30.6270),
    ("奇味甜不辣(水碾河)", 104.0950, 30.6480)
]

for name, lon, lat in candidates:
    nid, dist, coords = find_nearest(lon, lat)
    print(f"{name}: nearest node {nid}, dist = {dist:.1f}m (coords: {coords})")
