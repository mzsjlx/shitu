import json

with open('map-base/data/cities/chengdu/roads-index.json', 'r', encoding='utf-8') as f:
    roads_data = json.load(f)
roads = roads_data['roads']

with open('map-base/data/cities/chengdu/food-road-network.json', 'r', encoding='utf-8') as f:
    network = json.load(f)

nodes_dict = {n[0]: [n[1], n[2]] for n in network['nodes']}

for query in ['过街楼', '东糠市', '大慈寺', '肖家河', '东大街']:
    found = [r for r in roads if query in r['name']]
    print(f"\n=== Query: {query} ===")
    for r in found:
        print(f"  {r['name']} ({r['id']}): center: {r['center']}, bounds: {r['bounds']}")

