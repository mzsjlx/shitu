import json
import sys

sys.stdout.reconfigure(encoding='utf-8')
vl = json.load(open('map-base/data/cities/chengdu/video-library.json', encoding='utf-8'))
segs = {seg['id']: seg for s in vl['sources'] for seg in s.get('segments', [])}
keys = [
    'cd-yizhihedapang-tiemen',
    'cd-yizhihedapang-heji',
    'cd-mizijun-yanglaotou-taikooli',
    'cd-rourou-maojiheyi',
    'cd-xiaojie-kaojianghu',
    'cd-wangxun-yanglaotou-yushuang',
    'cd-shashayouchanle-ganji'
]
for k in keys:
    s = segs[k]
    print(f"'{k}':")
    print(f"  name: '{s['name']}'")
    print(f"  category: '{s['category']}'")
    print(f"  coordinates: {s['coordinates']}")
