import json
import math

def gcj02_to_wgs84(lng, lat):
    a = 6378245.0
    ee = 0.00669342162296594323
    def transform_lat(x, y):
        ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * math.sqrt(abs(x))
        ret += (20.0 * math.sin(6.0 * x * math.pi) + 20.0 * math.sin(2.0 * x * math.pi)) * 2.0 / 3.0
        ret += (20.0 * math.sin(y * math.pi) + 40.0 * math.sin(y / 3.0 * math.pi)) * 2.0 / 3.0
        ret += (160.0 * math.sin(y / 12.0 * math.pi) + 320 * math.sin(y * math.pi / 30.0)) * 2.0 / 3.0
        return ret
    def transform_lng(x, y):
        ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * math.sqrt(abs(x))
        ret += (20.0 * math.sin(6.0 * x * math.pi) + 20.0 * math.sin(2.0 * x * math.pi)) * 2.0 / 3.0
        ret += (20.0 * math.sin(x * math.pi) + 40.0 * math.sin(x / 3.0 * math.pi)) * 2.0 / 3.0
        ret += (150.0 * math.sin(x / 12.0 * math.pi) + 300.0 * math.sin(x / 30.0 * math.pi)) * 2.0 / 3.0
        return ret
    dlat = transform_lat(lng - 105.0, lat - 35.0)
    dlng = transform_lng(lng - 105.0, lat - 35.0)
    radlat = lat / 180.0 * math.pi
    magic = math.sin(radlat)
    magic = 1 - ee * magic * magic
    sqrtmagic = math.sqrt(magic)
    dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * math.pi)
    dlng = (dlng * 180.0) / (a / sqrtmagic * math.cos(radlat) * math.pi)
    mglat = lat + dlat
    mglng = lng + dlng
    return [round(lng * 2 - mglng, 6), round(lat * 2 - mglat, 6)]

def haversine(lon1, lat1, lon2, lat2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi, dlam = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

with open('map-base/data/cities/chengdu/food-road-network.json', 'r', encoding='utf-8') as f:
    net = json.load(f)

nodes = net['nodes']
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

# Candidate spots for batch 2
candidates = [
    {
        "name": "滴滴自助餐（城隍庙店）",
        "category": "快餐便当 / 市井自助餐",
        "district": "金牛区 · 城隍庙街区",
        "gcj02": [104.078561, 30.669331]
    },
    {
        "name": "王记特色锅魁（泡桐树街店）",
        "category": "锅魁 / 川味小吃",
        "district": "青羊区 · 宽窄巷子街区",
        "gcj02": [104.0532, 30.6625]
    },
    {
        "name": "眼哥素椒面（文殊院店）",
        "category": "面馆 / 川味面食",
        "district": "青羊区 · 金丝街文殊院街区",
        "gcj02": [104.080139, 30.66472]
    },
    {
        "name": "杨老头鲜货烧烤（中粮鸿云店）",
        "category": "烧烤 / 夜宵烤肉",
        "district": "锦江区 · 汇源北路中粮鸿云街区",
        "gcj02": [104.113968, 30.642369]
    },
    {
        "name": "芙蓉爆炒烧烤香辣蟹（吉祥街店）",
        "category": "川味爆炒 / 江湖菜烧烤",
        "district": "青羊区 · 吉祥街奎星楼街区",
        "gcj02": [104.06911, 30.666113]
    },
    {
        "name": "华丰火锅（二仙桥老店）",
        "category": "老火锅 / 社区火锅",
        "district": "成华区 · 二仙桥机车厂街区",
        "gcj02": [104.119791, 30.683653]
    },
    {
        "name": "烤江湖（泛悦国际店）",
        "category": "江湖烧烤 / 夜宵大排档",
        "district": "武侯区 · 科华中路泛悦国际商圈",
        "gcj02": [104.077823, 30.616743]
    },
    {
        "name": "左撇子私房面（莲桂东路店）",
        "category": "私房面馆 / 炸酱面",
        "district": "锦江区 · 莲桂东路川师附中街区",
        "gcj02": [104.0985, 30.6372]
    },
    {
        "name": "永乐饭店（肖家河中街店）",
        "category": "老字号川菜 / 米其林指南",
        "district": "武侯区 · 肖家河中街街区",
        "gcj02": [104.0412, 30.6275]
    },
    {
        "name": "杨老头鲜货烧烤（玉双路店）",
        "category": "烧烤 / 卤烤猪蹄",
        "district": "成华区 · 玉双路望平街区",
        "gcj02": [104.091352, 30.658636]
    },
    {
        "name": "五井合火锅店（通盈街店）",
        "category": "社区老火锅 / 川味火锅",
        "district": "锦江区 · 通盈街万科街区",
        "gcj02": [104.111557, 30.642858]
    }
]

print("=== Batch 2 Spot Snapping to Chengdu Road Network ===")
for c in candidates:
    wgs = gcj02_to_wgs84(c['gcj02'][0], c['gcj02'][1])
    nid, dist, snap_coords = find_nearest(wgs[0], wgs[1])
    c['wgs84'] = wgs
    c['nearestNode'] = nid
    c['snapDist'] = round(dist, 1)
    c['snapCoords'] = snap_coords
    status = "OK (<= 250m)" if dist <= 250 else "EXCEEDS 250m!"
    print(f"{c['name']} -> WGS84: {wgs}, Node {nid}, Dist: {dist:.1f}m [{status}]")

with open('output/research/chengdu/batch2_snapped.json', 'w', encoding='utf-8') as out:
    json.dump(candidates, out, ensure_ascii=False, indent=2)
