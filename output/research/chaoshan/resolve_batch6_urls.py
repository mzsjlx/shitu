# -*- coding: utf-8 -*-
import urllib.request
import re
import json
import sys

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

urls = [
    ('zhuzhanggui1', '北京一家五口（猪掌柜）', 'https://v.douyin.com/cZ_Az4rT6SY/', '揭阳东山二奶街夜市'),
    ('donggua', '冬瓜_🍒', 'https://v.douyin.com/nhuB0MphWsI/', '来北环夜市不知道吃什么'),
    ('shaofeng', '少锋📸', 'https://v.douyin.com/I7RgynZ7bgI/', '汕头花城夜市一条街竖屏版本'),
    ('jiajun', '嘉俊和黄斯', 'https://v.douyin.com/E7oXoDHnflk/', '广东汕头的牛肉火锅自助'),
    ('dongmai', '东麦', 'https://v.douyin.com/vFv5-ViCWAg/', '汕头“农贸工厂火锅自助”一家店几乎把潮汕的美食都搬来'),
    ('zengge', '曾哥探路', 'https://v.douyin.com/U9EaGZb2ysg/', '你们试过这样吃潮汕牛肉火锅自助吗'),
    ('qiqiba', '778潮汕寻食小分队', 'https://v.douyin.com/J49u2u91Iu4/', '汕头居然有活鳗鱼鲜虾烤肉自助'),
    ('zhuzhanggui2', '北京一家五口（猪掌柜）', 'https://v.douyin.com/Suhqt_9_HXM/', '从来不拍自助的我超级喜欢这家'),
    ('lixiangxiang', '李想想队长', 'https://v.douyin.com/fRqjkhTs-Zo/', '今天我要花159把海鲜自助吃到爽大连')
]

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

results = []
for tag, author, url, note in urls:
    req = urllib.request.Request(url.strip(), headers=headers)
    opener = urllib.request.build_opener(urllib.request.HTTPRedirectHandler)
    try:
        resp = opener.open(req)
        final_url = resp.geturl()
        match = re.search(r'video/(\d+)', final_url)
        vid = match.group(1) if match else None

        # Clean tag for source_id
        author_clean = tag.replace('1', '').replace('2', '')
        source_id = f'chaoshan-{author_clean}-{vid}' if vid else None

        results.append({
            'tag': tag,
            'author': author,
            'short_url': url.strip(),
            'final_url': final_url,
            'aweme_id': vid,
            'source_id': source_id,
            'user_note': note
        })
        print(f"[{tag}] {author} -> {vid} ({source_id})")
    except Exception as e:
        print(f"[{tag}] {author} error: {e}")

out_path = 'output/research/chaoshan/batch6-resolved-urls.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"\nSaved {len(results)} resolved URLs to {out_path}")
