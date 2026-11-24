import json
from pathlib import Path

root = Path(__file__).resolve().parents[3]
network_path = root / "map-base/data/cities/harbin/food-road-network.json"

with open(network_path, "r", encoding="utf-8") as f:
    net = json.load(f)

# Nodes mapping: id -> [lng, lat]
node_map = {n[0]: [n[1], n[2]] for n in net.get("nodes", [])}

target_roads = ["新华街", "西五道街", "宣庆街", "松发街", "南新街", "草市街", "学府", "哈西"]

ways = net.get("ways", [])

print("=== Matching Ways and Nodes in Harbin Walking Road Network ===")
for r_name in target_roads:
    matched_ways = [w for w in ways if r_name in w.get("tags", {}).get("name", "")]
    print(f"\nTarget: {r_name} (found {len(matched_ways)} ways)")
    for w in matched_ways[:5]:
        way_id = w.get("id")
        w_nodes = w.get("nodes", [])
        w_name = w.get("tags", {}).get("name", "")
        if w_nodes:
            mid_node_id = w_nodes[len(w_nodes)//2]
            coords = node_map.get(mid_node_id, [])
            print(f"  Way {way_id} ({w_name}): Node {mid_node_id} -> {coords}")
