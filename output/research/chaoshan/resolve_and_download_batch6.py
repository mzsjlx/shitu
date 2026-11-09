# -*- coding: utf-8 -*-
import urllib.request
import re
import json
import os
import hashlib
import time

urls = [
    ('zhuzhanggui', '北京一家五口（猪掌柜）', 'https://v.douyin.com/cZ_Az4rT6SY/', '揭阳东山二奶街夜市'),
    ('donggua', '冬瓜_🍒', 'https://v.douyin.com/nhuB0MphWsI/', '来北环夜市不知道吃什么'),
    ('shaofeng', '少锋📸', 'https://v.douyin.com/I7RgynZ7bgI/', '汕头花城夜市一条街竖屏版本'),
    ('jiajun', '嘉俊和黄斯', 'https://v.douyin.com/E7oXoDHnflk/ ', '广东汕头的牛肉火锅自助'),
    ('dongmai', '东麦', 'https://v.douyin.com/vFv5-ViCWAg/', '汕头“农贸工厂火锅自助”'),
    ('zengge', '曾哥探路', 'https://v.douyin.com/U9EaGZb2ysg/', '你们试过这样吃潮汕牛肉火锅自助吗'),
    ('qiqiba', '778潮汕寻食小分队', 'https://v.douyin.com/J49u2u91Iu4/', '汕头居然有活鳗鱼鲜虾烤肉自助'),
    ('zhuzhanggui2', '北京一家五口（猪掌柜）', 'https://v.douyin.com/Suhqt_9_HXM/', '从来不拍自助的我超级喜欢这家'),
    ('lixiangxiang', '李想想队长', 'https://v.douyin.com/fRqjkhTs-Zo/', '今天我要花159把海鲜自助吃到爽大连')
]

root = 'D:/codex/美食网站/.local/worktrees/chaoshan'
out_dir = f'{root}/output/research/chaoshan'
intake_dir = f'{root}/map-base/.local/video-intake'
os.makedirs(out_dir, exist_ok=True)

headers_pc = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}
headers_mobile = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
}

results = []

for tag, author, short_url, note in urls:
    clean_url = short_url.strip()
    req = urllib.request.Request(clean_url, headers=headers_pc)
    opener = urllib.request.build_opener(urllib.request.HTTPRedirectHandler)
    try:
        resp = opener.open(req)
        final_url = resp.geturl()
        match = re.search(r'video/(\d+)', final_url)
        vid = match.group(1) if match else None
        
        # Also handle author prefix for tag
        author_clean = re.sub(r'[^a-zA-Z0-9]', '', tag)
        source_id = f'chaoshan-{tag}-{vid}' if vid else None

        print(f"\n[{author}] ({clean_url}) -> {vid}")
        print(f"Final URL: {final_url}")

        # Fetch mobile share page for _ROUTER_DATA
        item_data = {}
        if vid:
            share_page_url = f'https://www.iesdouyin.com/share/video/{vid}/'
            req_m = urllib.request.Request(share_page_url, headers=headers_mobile)
            try:
                with urllib.request.urlopen(req_m, timeout=15) as m_resp:
                    html = m_resp.read().decode('utf-8', errors='ignore')
                    m = re.search(r'window\._ROUTER_DATA\s*=\s*(\{.*?\});', html, re.DOTALL)
                    if m:
                        router_data = json.loads(m.group(1))
                        page_data = router_data.get('loaderData', {}).get('video_(id)/page', {})
                        item_list = page_data.get('videoInfoRes', {}).get('item_list', [])
                        if item_list:
                            item_data = item_list[0]
            except Exception as e_share:
                print(f"Error fetching share page for {vid}: {e_share}")

        results.append({
            'tag': tag,
            'author': author,
            'user_note': note,
            'short_url': clean_url,
            'final_url': final_url,
            'aweme_id': vid,
            'source_id': source_id,
            'item_data': item_data
        })
    except Exception as e:
        print(f"Error resolving {clean_url}: {e}")

out_resolved = f'{out_dir}/batch6-resolved-urls.json'
with open(out_resolved, 'w', encoding='utf-8') as f:
    json.dump([{k: v for k, v in r.items() if k != 'item_data'} for r in results], f, ensure_ascii=False, indent=2)

print(f"\nResolved all {len(results)} URLs.")
for r in results:
    it = r.get('item_data', {})
    desc = it.get('desc', 'N/A')
    dur = it.get('duration', 0) / 1000 if it.get('duration') else 0
    print(f"- {r['author']} ({r['aweme_id']}): {desc[:50]}... ({dur:.1f}s)")
