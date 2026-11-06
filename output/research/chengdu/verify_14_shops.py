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

# The 14 shops
shops = [
    ("毛记和意冒菜（解放西街店）", "cd-rourou-maojiheyi", 104.0810, 30.6905, "金牛区解放西街9号"),
    ("三道街老宅子肥肠鱼", "cd-chiyou-feichangyu", 104.0526, 30.6769, "青羊区三道街41号附1号"),
    ("私房水饺（海椒市店）", "cd-xiaojunmao-shuijiao", 104.1012, 30.6416, "锦江区海椒市东街盛华苑2栋"),
    ("朱大嘴肥肠豆汤（福字街总店）", "cd-xiaojunmao-zhudazui", 104.0788, 30.6564, "锦江区福字街2号"),
    ("小妹滋补蹄花（理工大学总店）", "cd-xiaojunmao-xiaomeitihua", 104.1458, 30.6738, "成华区崔家店路理工大学站D口"),
    ("纯阳馆鱼香排骨面（吉祥街店）", "cd-tiaojie-chunyangguan", 104.0583, 30.6698, "青羊区吉祥街6号附6号"),
    ("罗大姐餐厅（肖家河店）", "cd-tiaojie-luodajie", 104.0410, 30.6270, "武侯区肖家河中街42号"),
    ("奇味甜不辣（水碾河老店）", "cd-tiaojie-qiweitbl", 104.0950, 30.6480, "锦江区水碾河北三街"),
    ("蓉城西二道无名冒菜", "cd-pangshi-wumingmaocai", 104.0572, 30.6678, "青羊区西二道街19号附1号"),
    ("水碾河刘老大串串香", "cd-ohyixi-liulaoda", 104.0988, 30.6476, "锦江区水碾河路26号大院"),
    ("蓉荣北大铺盖面（梁家巷总店）", "cd-ohyixi-pogaimian", 104.0789, 30.6865, "金牛区一环路北二段100号"),
    ("老黄记手撕烤兔（玉林街店）", "cd-ohyixi-laohuangji", 104.0620, 30.6300, "武侯区玉林街26号附26-27号"),
    ("金琴老茶铺（金琴路老茶馆）", "cd-ohyixi-jinqin", 104.0375, 30.6792, "金牛区金琴路17号"),
    ("邓氏兔头（一环路北二段店）", "cd-ohyixi-dengshi", 104.0818, 30.6872, "金牛区一环路北二段102号")
]

results = []
for name, sid, lon, lat, addr in shops:
    nid, dist, coords = find_nearest(lon, lat)
    print(f"{sid} | {name}: node {nid}, dist = {dist:.1f}m (coords: {coords})")
    assert dist <= 250.0, f"Distance {dist} exceeds 250m for {name}!"
    results.append({
        'id': sid,
        'name': name,
        'lon': lon,
        'lat': lat,
        'addr': addr,
        'nearestNode': nid,
        'dist': round(dist, 1),
        'nodeCoords': coords
    })

with open('output/research/chengdu/snapped_shops.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("\nALL 14 SHOPS SNAPPED AND VERIFIED (dist <= 250m)!")
