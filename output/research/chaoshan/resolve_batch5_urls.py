# -*- coding: utf-8 -*-
import urllib.request
import re
import json

urls = [
    ('wulala', '特别乌啦啦', 'https://v.douyin.com/ywOE2J8_UXs/', '特别乌啦啦潮汕牛肉与茶'),
    ('wangdingyi', '王丁亿Dean', 'https://v.douyin.com/QffKCM6HcHw/', '揭阳大排档最终形态'),
    ('anywei', 'Any味', 'https://v.douyin.com/CArodHtBTSc/', '汕头随便攻略老板不想火的小店'),
    ('maomao', '毛毛美食指南', 'https://v.douyin.com/FpCm0lMhsAg/', '汕头火了十几年的老牌土鸡火锅'),
    ('dongmai', '东麦', 'https://v.douyin.com/mYNQpcnb_70/', '西堤老三鱼仔·汕头20多年老式大排档'),
    ('zhuzhanggui1', '北京一家五口（猪掌柜）', 'https://v.douyin.com/a_JidGhHOsA/', '棉湖糖厂前砂锅粥·路边深夜小炒砂锅粥'),
    ('zhuzhanggui2', '北京一家五口（猪掌柜）', 'https://v.douyin.com/ndgWmkQ2Cyk/', '大鹏车烧烤马牙店·潮汕揭阳夯爆了的路边烧烤摊'),
    ('liuyuxin', '刘雨鑫JASON', 'https://v.douyin.com/DL3qatSiOJQ/', '潮汕揭阳网红卢前夜市高颜值路边摊'),
    ('zhuzhanggui3', '北京一家五口（猪掌柜）', 'https://v.douyin.com/X4NhshA_t9o/', '揭阳新亨三角楼炸猪肉条'),
    ('zhuzhujixingzi', '猪猪急性子', 'https://v.douyin.com/uPczzRYuJ58/', '潮汕市场里的蒜蓉炸串')
]

results = []
for tag, author, url, note in urls:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    opener = urllib.request.build_opener(urllib.request.HTTPRedirectHandler)
    try:
        resp = opener.open(req)
        final_url = resp.geturl()
        match = re.search(r'video/(\d+)', final_url)
        vid = match.group(1) if match else None
        source_id = f'chaoshan-{tag}-{vid}' if vid else None
        results.append({
            'tag': tag,
            'author': author,
            'short_url': url,
            'final_url': final_url,
            'aweme_id': vid,
            'source_id': source_id,
            'user_note': note
        })
        print(f"[{author}] -> {vid} (ID: {source_id})")
    except Exception as e:
        print(f"[{author}] error: {e}")

out_path = 'output/research/chaoshan/batch5-resolved-urls.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"\nResolved {len(results)} URLs to {out_path}")
