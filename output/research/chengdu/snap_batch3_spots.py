import json
import math

with open('map-base/data/cities/chengdu/food-road-network.json', 'r', encoding='utf-8') as f:
    network = json.load(f)

nodes = network['nodes']

# haversine distance in meters
def distance_m(coord1, coord2):
    lng1, lat1 = coord1
    lng2, lat2 = coord2
    R = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)
    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

spots = [
    {
        "name": "老成都三样面（过街楼街店）",
        "coords": [104.056104, 30.672497],
        "road": "过街楼街"
    },
    {
        "name": "马旺子（太古里店）",
        "coords": [104.080693, 30.654225],
        "road": "东糠市街"
    }
]

results = []
for s in spots:
    best_node = None
    min_dist = float('inf')
    for n in nodes:
        nid, n_lng, n_lat = n[0], n[1], n[2]
        d = distance_m(s['coords'], [n_lng, n_lat])
        if d < min_dist:
            min_dist = d
            best_node = (nid, n_lng, n_lat)
    
    print(f"\n{s['name']} (target {s['coords']}):")
    print(f"  Nearest node: {best_node[0]} at [{best_node[1]:.6f}, {best_node[2]:.6f}]")
    print(f"  Distance: {min_dist:.2f} meters (threshold <= 250m: {min_dist <= 250})")
    results.append({
        "name": s['name'],
        "road": s['road'],
        "targetCoords": s['coords'],
        "nearestNode": best_node[0],
        "snappedCoords": [best_node[1], best_node[2]],
        "distanceMeters": round(min_dist, 2)
    })

with open('output/research/chengdu/batch3_snapped.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
