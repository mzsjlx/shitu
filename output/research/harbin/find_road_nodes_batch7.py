import json
from pathlib import Path

root = Path(__file__).resolve().parents[3]
network_path = root / "map-base/data/cities/harbin/food-road-network.json"
index_path = root / "map-base/data/cities/harbin/roads-index.json"

with open(network_path, "r", encoding="utf-8") as f:
    network = json.load(f)

with open(index_path, "r", encoding="utf-8") as f:
    roads_index = json.load(f)

roads = roads_index.get("roads", [])
if isinstance(roads, dict):
    roads = list(roads.values())

keywords = [
    "新华街", "西五道街", "宣庆街", "松发街", "南新街", "草市街",
    "建兴街", "安静街", "红专街", "地段街", "学府", "哈西", "通达街", "宣化街"
]

print("=== Searching Road Index ===")
for r in roads:
    name = r.get("name", "")
    for kw in keywords:
        if kw in name:
            mid = r.get("midpoint", [])
            print(f"Road: {name} | Midpoint: {mid} | Ways: {len(r.get('ways', []))}")
            break
