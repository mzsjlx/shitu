import os
import json
import hashlib
import time

sources = [
    {
        'id': 'chaoshan-miaojiang-7661157240087097061',
        'author': '喵酱饿了',
        'dir': 'chaoshan-miaojiang-7661157240087097061'
    },
    {
        'id': 'chaoshan-zhizhi-7556966907678084409',
        'author': '汁汁冰激凌',
        'dir': 'chaoshan-zhizhi-7556966907678084409'
    },
    {
        'id': 'chaoshan-xiaolu-7589618937185756025',
        'author': '小陆日记',
        'dir': 'chaoshan-xiaolu-7589618937185756025'
    },
    {
        'id': 'chaoshan-xiaozhen-7695617424514632994',
        'author': '小珍来咯…',
        'dir': 'chaoshan-xiaozhen-7695617424514632994'
    },
    {
        'id': 'chaoshan-dongmai-7670683829091266466',
        'author': '东麦',
        'dir': 'chaoshan-dongmai-7670683829091266466'
    },
    {
        'id': 'chaoshan-zhizhi-7604486952716553381',
        'author': '汁汁冰激凌',
        'dir': 'chaoshan-zhizhi-7604486952716553381'
    }
]

res = []
for s in sources:
    mp4_path = os.path.join('map-base', '.local', 'video-intake', s['dir'], 'source.mp4')
    if not os.path.exists(mp4_path):
        print(f"MISSING MP4: {mp4_path}")
        continue
    size = os.path.getsize(mp4_path)
    h = hashlib.sha256()
    with open(mp4_path, 'rb') as f:
        while True:
            chunk = f.read(1024*1024)
            if not chunk:
                break
            h.update(chunk)
    sha256 = h.hexdigest()

    sid = s['id']
    json_path = os.path.join('output', 'research', 'chaoshan', f'source-{sid}.json')
    if not os.path.exists(json_path):
        json_path = os.path.join('output', 'research', 'chaoshan', 'source-cs-miaojiang-7661157240087097061.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        ad = json.load(f)

    desc = ad.get('desc', '')
    ctime = ad.get('create_time', 0)
    date_str = time.strftime('%Y-%m-%d', time.localtime(ctime))
    duration = ad.get('duration', 0) / 1000.0

    info = {
        'id': sid,
        'author': s['author'],
        'date': date_str,
        'durationSeconds': duration,
        'bytes': size,
        'sha256': sha256,
        'title': desc
    }
    res.append(info)
    print(f"[{sid}]")
    print(f"  Author: {s['author']} | Date: {date_str} | Duration: {duration:.1f}s | Size: {size/(1024*1024):.2f}MB")
    print(f"  SHA256: {sha256}")
    print(f"  Title: {desc[:60]}...")

out_summary = os.path.join('output', 'research', 'chaoshan', 'batch1-all-sources.json')
with open(out_summary, 'w', encoding='utf-8') as f:
    json.dump(res, f, ensure_ascii=False, indent=2)
print(f"\nSaved all sources summary to {out_summary}")
