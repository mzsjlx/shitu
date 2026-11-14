import json, math

net = json.load(open('map-base/data/cities/harbin/food-road-network.json', encoding='utf-8'))
nodes = {n[0]: n for n in net['nodes']}
ways = net['ways']

targets = [
    ('善嘉农大烤盘', '公滨路', 126.705, 45.728),
    ('嘉样小吃森林街', '森林街', 126.628, 45.776),
    ('安静街早市', '安静街', 126.608, 45.758),
    ('山河屯中央大街店', '中央大街', 126.616, 45.772)
]

for name, street, approx_lon, approx_lat in targets:
    matched = [w for w in ways if street in w.get('tags', {}).get('name', '')]
    best_n = None
    best_d = 999999
    best_w = None
    for w in matched:
        for nid in w['nodes']:
            ninfo = nodes.get(nid)
            if ninfo:
                d = math.hypot(ninfo[1] - approx_lon, ninfo[2] - approx_lat)
                if d < best_d:
                    best_d = d
                    best_n = ninfo
                    best_w = w
    street_name = best_w.get('tags', {}).get('name') if best_w else 'Unknown'
    way_id = best_w['id'] if best_w else -1
    node_id = best_n[0] if best_n else -1
    coord = [best_n[1], best_n[2]] if best_n else []
    print(f"{name} on {street_name}: node={node_id}, coord={coord} (way={way_id})")
