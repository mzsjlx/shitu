import json
import math
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('map-base/data/cities/chengdu/food-road-network.json', 'r', encoding='utf-8') as f:
    network = json.load(f)

nodes = network.get('nodes', [])
print(f"Loaded road network with {len(nodes)} nodes.")

# Haversine distance in meters
def haversine(lon1, lat1, lon2, lat2):
    R = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

node_items = [(int(n[0]), n[1], n[2]) for n in nodes]

def find_nearest_node(lng, lat):
    best_nid = None
    best_dist = float('inf')
    best_coords = None
    for nid, nx, ny in node_items:
        # rough filter
        if abs(lng - nx) > 0.005 or abs(lat - ny) > 0.005:
            continue
        d = haversine(lng, lat, nx, ny)
        if d < best_dist:
            best_dist = d
            best_nid = nid
            best_coords = [nx, ny]
    return best_nid, best_dist, best_coords

# Candidate spots for Batch 8
candidate_spots = [
    {
        "id": "cd-xiaojie-mingyu",
        "name": "重庆明玉九宫格老火锅（洞子口路店）",
        "category": "火锅 / 社区九宫格",
        "approxCoords": [104.0682, 30.7135]
    },
    {
        "id": "cd-xulaosi-ludazhong",
        "name": "卢大众烧烤（洞子口总店）",
        "category": "烧烤 / 洞子口老店",
        "approxCoords": [104.0665, 30.7182]
    },
    {
        "id": "cd-danniushi-zhangpopoguokui",
        "name": "张婆婆香酥锅盔（北门店）",
        "category": "锅盔 / 传统名小吃",
        "approxCoords": [104.0795, 30.6872]
    },
    {
        "id": "cd-danniushi-shierbaimian",
        "name": "食而百面馆（北门店）",
        "category": "面馆 / 成都50强面馆",
        "approxCoords": [104.0782, 30.6865]
    },
    {
        "id": "cd-xiaozhou-xiexiaoyao",
        "name": "谢逍遥山城大排档（成都总店）",
        "category": "川味爆炒 / 江湖菜烧烤",
        "approxCoords": [104.0673, 30.6128],
        "placeId": "cd-xulaosihebeijiang-xiexiaoyao"
    },
    {
        "id": "cd-liuyuxin-jianglongzhuazhua",
        "name": "降龙爪爪（春熙路总店）",
        "category": "街头小吃 / 卤味鸡爪",
        "approxCoords": [104.0815, 30.6558]
    },
    {
        "id": "cd-suipo-baojia",
        "name": "包家兄弟餐馆（包家巷店）",
        "category": "川菜 / 苍蝇馆子",
        "approxCoords": [104.0538, 30.6625]
    },
    {
        "id": "cd-wangxun-fenggutu",
        "name": "风骨兔（玉林菜市店）",
        "category": "兔头 / 凉拌菜 / 熟食卤味",
        "approxCoords": [104.0558, 30.6288]
    },
    {
        "id": "cd-xiaojinzhang-nianfeng",
        "name": "年丰饭店（米其林必比登推介）",
        "category": "老字号川菜 / 米其林必比登",
        "approxCoords": [104.0772, 30.6186]
    },
    {
        "id": "cd-xiaojie-zhengnanqibei",
        "name": "正南齐北重庆老火锅（东门市井店）",
        "category": "火锅 / 重庆老火锅",
        "approxCoords": [104.1165, 30.6272]
    },
    {
        "id": "cd-qianjin-liuwenxiang",
        "name": "刘文祥大盘麻辣烫（春熙太古里店）",
        "category": "麻辣烫 / 东北麻辣烫",
        "approxCoords": [104.0835, 30.6558]
    },
    {
        "id": "cd-finn-huangniang",
        "name": "黄嬢甜不辣（太升南路店）",
        "category": "传统小吃 / 油炸甜不辣",
        "approxCoords": [104.0745, 30.6658]
    },
    {
        "id": "cd-finn-taoxiangyuan",
        "name": "桃香源火锅鸡（东门大桥店）",
        "category": "火锅鸡 / 川味火锅",
        "approxCoords": [104.0885, 30.6515]
    },
    {
        "id": "cd-ganshiqi-tianxingzhengyuan",
        "name": "天星正源火锅（地勘路总店）",
        "category": "火锅 / 社区老火锅",
        "approxCoords": [104.1285, 30.6868]
    }
]

print("\n--- Checking Snapping to Road Nodes (< 250m) ---")
for spot in candidate_spots:
    lng, lat = spot['approxCoords']
    nid, dist, ncoords = find_nearest_node(lng, lat)
    spot['nearestNode'] = nid
    spot['nearestDistance'] = round(dist, 1)
    spot['snappedCoords'] = ncoords
    passed = dist <= 250.0
    status = "PASS" if passed else "FAIL"
    print(f"[{status}] {spot['name']}: {dist:.1f}m -> node {nid} ({ncoords})")

with open('output/research/chengdu/batch8/snapped_spots.json', 'w', encoding='utf-8') as f:
    json.dump(candidate_spots, f, ensure_ascii=False, indent=2)
