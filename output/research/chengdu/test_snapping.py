import json, math

def haversine(c1, c2):
    lon1, lat1 = c1
    lon2, lat2 = c2
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

with open('map-base/data/cities/chengdu/food-road-network.json', 'r', encoding='utf-8') as f:
    net = json.load(f)

nodes = net['nodes']

candidates = {
    "daming_jiachangcai": [104.0864, 30.6872],
    "xiexiaoyao_dapaidang": [104.0673, 30.6128],
    "xinlin_tiaoshuitu": [104.0538, 30.6685],
    "maojiao_nailiang": [104.0526, 30.6683],
    "wuming_maocai": [104.0531, 30.6684],
    "zhubiqiong_feichangfen": [104.0371, 30.6865],
    "heizhu_xiangji": [104.0355, 30.6878],
    "dongguang_shaokao": [104.1015, 30.6195],
    "yanglaotou_taikooli": [104.0847, 30.6515]
}

results = {}
for name, coord in candidates.items():
    best_dist = 999999
    best_node = None
    for entry in nodes:
        nid = entry[0]
        pt = [entry[1], entry[2]]
        d = haversine(coord, pt)
        if d < best_dist:
            best_dist = d
            best_node = (nid, pt)
    results[name] = {
        "coord": coord,
        "best_node": best_node[0],
        "node_coord": best_node[1],
        "dist": round(best_dist, 2),
        "pass_250m": best_dist <= 250
    }
    print(f'{name}: dist={best_dist:.2f}m, node={best_node[0]}, pass={best_dist <= 250}')

with open('output/research/chengdu/batch7_snapping_results.json', 'w', encoding='utf-8') as out:
    json.dump(results, out, ensure_ascii=False, indent=2)
