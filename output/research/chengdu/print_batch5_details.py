import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

sources = [
    ('岛民大白', 'cd-daomindabai-7703823334010051003'),
    ('小紧张的虫虫', 'cd-xiaojinzhangdechongchong-7498312599780560147'),
    ('特别乌啦啦', 'cd-wulala-7560927991686008098'),
    ('JoJo觅食', 'cd-jojomishi-7704936890641747227'),
    ('是 Simon 啊', 'cd-shisimon-7641414725993719515'),
    ('贺千万。', 'cd-heqianwan-7616015531045363578'),
    ('霹雳干饭记', 'cd-piliganfanji-7700130613965155529'),
    ('马伯骞', 'cd-maboqian-7628555606619063478'),
    ('小解', 'cd-xiaojie-7614776037532110143')
]

for author, sid in sources:
    p = Path(f'output/research/chengdu/details/{sid}.json')
    if not p.exists(): continue
    with open(p, 'r', encoding='utf-8') as f:
        d = json.load(f)
    print(f'=== {author} ({sid}) ===')
    print('  Desc:', d.get('desc'))
    poi = d.get('poi_info') or {}
    print('  POI Name:', poi.get('poi_name'))
    print('  POI Subtitle:', poi.get('poi_subtitle'))
    addr = poi.get('address_info') or {}
    print('  POI Addr:', addr.get('address'), addr.get('simple_addr'))
    print('  POI Coord:', poi.get('poi_longitude'), poi.get('poi_latitude'))
