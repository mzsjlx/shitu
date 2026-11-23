import urllib.request
import re
import json

urls = [
    {"author_hint": "小张一人食", "share_url": "https://v.douyin.com/8GNhbZy7i4k/"},
    {"author_hint": "778潮汕寻食小分队", "share_url": "https://v.douyin.com/gHK18cepOt0/"},
    {"author_hint": "邓炫疯疯", "share_url": "https://v.douyin.com/JPb7C9m9s4U/"},
    {"author_hint": "阿超在广东", "share_url": "https://v.douyin.com/e0bT2y-NEj4/"},
    {"author_hint": "敢敢LETS GO", "share_url": "https://v.douyin.com/Z_SLwvy08UE/"},
    {"author_hint": "778潮汕寻食小分队", "share_url": "https://v.douyin.com/9DybVhD4Xjk/"},
    {"author_hint": "778潮汕寻食小分队", "share_url": "https://v.douyin.com/ROHEFnc8_bI/"},
    {"author_hint": "大椰吖", "share_url": "https://v.douyin.com/5rG8hSe1AG0/"},
    {"author_hint": "小珍来咯…", "share_url": "https://v.douyin.com/mpXjt8RbBUc/"},
    {"author_hint": "778潮汕寻食小分队", "share_url": "https://v.douyin.com/UExsEN2v8WU/"},
    {"author_hint": "Mark吃深圳", "share_url": "https://v.douyin.com/MfNnlcwNrjY/"},
    {"author_hint": "小林探", "share_url": "https://v.douyin.com/QmXGOWKj0XA/"}
]

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

results = []
for item in urls:
    req = urllib.request.Request(item["share_url"], headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            final_url = resp.geturl()
            m = re.search(r'video/(\d+)', final_url)
            aweme_id = m.group(1) if m else None
            results.append({
                "author_hint": item["author_hint"],
                "share_url": item["share_url"],
                "final_url": final_url,
                "aweme_id": aweme_id
            })
            print(f"Resolved: {item['author_hint']} -> {aweme_id}")
    except Exception as e:
        print(f"Error {item['share_url']}: {e}")
        results.append({
            "author_hint": item["author_hint"],
            "share_url": item["share_url"],
            "error": str(e)
        })

with open("output/research/chaoshan/batch7-resolved-urls.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print("Saved batch7-resolved-urls.json")
