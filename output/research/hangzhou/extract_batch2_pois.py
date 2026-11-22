import urllib.request, json, time
from pathlib import Path

worktree_root = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep")
mobile_ua = 'Mozilla/5.0 (Linux; Android 13; 2210132C Build/TKQ1.220829.002) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36'
resolved = json.loads((worktree_root / 'output/research/hangzhou/batch2_resolved.json').read_text(encoding='utf-8'))

results = []
for item in resolved:
    vid = item['vid']
    author = item['author']
    idx = item['idx']
    endpoint = f'https://api.amemv.com/aweme/v1/aweme/detail/?aweme_id={vid}&aid=6383&device_platform=web&version_code=190500&version_name=19.5.0'
    req = urllib.request.Request(endpoint, headers={'User-Agent': mobile_ua})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            detail = data.get('aweme_detail', {})
            poi = detail.get('poi_info', {})
            p_name = poi.get('poi_name')
            p_id = poi.get('poi_id')
            p_addr = poi.get('address_info', {}).get('simple_addr')
            city = poi.get('address_info', {}).get('city')
            lat = poi.get('latitude')
            lng = poi.get('longitude')
            desc = detail.get('desc')
            res = {
                'idx': idx,
                'author': author,
                'vid': vid,
                'poi_name': p_name,
                'poi_id': p_id,
                'city': city,
                'simple_addr': p_addr,
                'lat': lat,
                'lng': lng,
                'desc': desc
            }
            results.append(res)
            print(f"[{idx:02d}] {author} -> POI: {p_name} | {city} {p_addr} | ({lng}, {lat}) | {desc[:40]}")
    except Exception as e:
        print(f"[{idx:02d}] {author} -> Error: {e}")
    time.sleep(0.3)

out_path = worktree_root / 'output/research/hangzhou/batch2_douyin_pois.json'
out_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
print("Saved batch2_douyin_pois.json")
