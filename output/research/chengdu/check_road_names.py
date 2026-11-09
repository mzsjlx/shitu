import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('map-base/data/cities/chengdu/food-road-network.json', 'r', encoding='utf-8') as f:
    net = json.load(f)

ways = net.get('ways', [])
node_to_road = {}
for w in ways:
    tags = w.get('tags', {})
    name = tags.get('name') or tags.get('ref')
    if name:
        for nid in w.get('nodes', []):
            if nid not in node_to_road:
                node_to_road[nid] = (name, w['id'])

test_nodes = {
    36038: "樊记牛肉面",
    8477: "富贵火锅",
    36125: "三妹小吃",
    23470: "上亿海鲜",
    30325: "阿城烤鱼片",
    22871: "南堂馆",
    28585: "好实惠冒菜",
    27301: "双桥肥肠粉",
    30217: "水津豆汤",
    25642: "钟水饺",
    27196: "美蹄花",
    27182: "双哨面",
    26648: "竹篓香冒菜",
    16387: "糖油果子"
}

for nid, desc in test_nodes.items():
    info = node_to_road.get(nid, ('UNKNOWN', None))
    print(f"Node {nid} ({desc}): road = '{info[0]}', wayId = {info[1]}")
