import json
import math

with open('map-base/data/cities/chengdu/food-road-network.json', 'r', encoding='utf-8') as f:
    network = json.load(f)

nodes = network.get('nodes', [])
print(f"Loaded {len(nodes)} nodes")

def haversine(lon1, lat1, lon2, lat2):
    R = 6371000 # meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def find_nearest(lon, lat):
    best_dist = float('inf')
    best_node = None
    for pt in nodes:
        nid, nlon, nlat = pt[0], pt[1], pt[2]
        dist = haversine(lon, lat, nlon, nlat)
        if dist < best_dist:
            best_dist = dist
            best_node = nid
    return best_node, best_dist

candidates = {
    "樊记干捞牛肉面(科华店)": [104.072721, 30.627824],
    "富贵原味火锅": [104.025981, 30.686437],
    "三妹小吃(馨兰苑店)": [104.070316, 30.625741],
    "上亿海鲜烧烤自贡江湖菜": [104.109414, 30.659755],
    "阿城烤鱼片(牛市口店)": [104.104659, 30.642232],
    "南堂馆·非遗传承人餐厅(IFS国金店)": [104.078731, 30.657219],
    "张记好实惠冒菜(燃灯寺东街店)": [104.0384, 30.6455],
    "双桥美味肥肠粉": [104.1042, 30.6508],
    "水津豆汤": [104.0886, 30.6465],
    "钟水饺(祠堂街店)": [104.0592, 30.6568],
    "美蹄花": [104.0988, 30.6492],
    "双哨面": [104.1022, 30.6482],
    "竹篓香冒菜": [104.0792, 30.6545],
    "老成都名小吃糖油果子(奎星楼街)": [104.0515, 30.6685]
}

for name, coord in candidates.items():
    nid, d = find_nearest(coord[0], coord[1])
    print(f"{name}: node={nid}, dist={d:.1f}m {'[OK]' if d <= 250 else '[EXCEEDED]'}")
