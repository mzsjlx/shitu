import json
import math
from pathlib import Path

root = Path(__file__).resolve().parents[3]
net_file = root / "map-base/data/cities/harbin/food-road-network.json"
net = json.load(open(net_file, encoding="utf-8"))

nodes = net["nodes"]
ways = net["ways"]

# Let's inspect road names in ways
road_names = set()
for w in ways:
    tags = w.get("tags", {})
    if "name" in tags:
        road_names.add(tags["name"])

print(f"Total road names in Harbin network: {len(road_names)}")

# Target query streets:
queries = [
    "友谊路", "中央大街", "靖宇街", "北三道街", "石头道街", "透笼街",
    "革新街", "南勋街", "学府路", "文兴街", "安发街", "纯化街",
    "通达街", "丰润街", "安和街", "红专街", "西十道街", "公滨路"
]

node_map = {n[0]: n for n in nodes}

for q in queries:
    matched_ways = [w for w in ways if q in w.get("tags", {}).get("name", "")]
    if matched_ways:
        sample_w = matched_ways[0]
        node_ids = sample_w["nodes"]
        sample_node_id = node_ids[len(node_ids)//2]
        node_obj = node_map.get(sample_node_id)
        if node_obj:
            print(f"[{q}] Matched way '{sample_w['tags'].get('name')}': node {node_obj[0]} at [{node_obj[1]}, {node_obj[2]}]")
    else:
        print(f"[{q}] No direct way match.")

