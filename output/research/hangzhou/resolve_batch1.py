import urllib.request, re, json, time
from pathlib import Path

raw_items = [
    {
        "author": "陈赫",
        "title": "外卖测评第二期，这次吃的是杭州！ # 外卖分享 #...",
        "short_url": "https://v.douyin.com/elhjfqQikqw/"
    },
    {
        "author": "小甲同学",
        "title": "第十站：浙江杭州 在西湖边吃超大西湖醋鱼是种什么样...",
        "short_url": "https://v.douyin.com/TTTpO18usMA/"
    },
    {
        "author": "红薯味的芹菜",
        "title": "杭州夜市天花板！超大规模吃遍全球美食！ # 杭州美...",
        "short_url": "https://v.douyin.com/uwBqUzUKnnk/"
    },
    {
        "author": "二百者也",
        "title": "杭州200元开盲盒 杭州第一开，物美价廉，美味无边...",
        "short_url": "https://v.douyin.com/lFF4sAMlCW8/"
    },
    {
        "author": "特别乌啦啦",
        "title": "每当深夜看见包子我就迈不开腿 干掉105个我们都不...",
        "short_url": "https://v.douyin.com/O-fSFD24ILQ/"
    },
    {
        "author": "大专厨子",
        "title": "杭州藏在犄角旮旯里的松针烤油边❗️，酥脆暴汁烤乳鸽...",
        "short_url": "https://v.douyin.com/vDCoshStV2g/"
    },
    {
        "author": "特厨隋坡（重新出发版）",
        "title": "特厨探店 |加长版！他们说这是杭州最好吃的餐厅？！...",
        "short_url": "https://v.douyin.com/f0zzZOFQWio/"
    },
    {
        "author": "小怡雯",
        "title": "驱车252公里来杭州就为了这口地道的川香麻辣水煮鱼...",
        "short_url": "https://v.douyin.com/VLkUX8d3UQ0/"
    },
    {
        "author": "超开心的大嘴猴",
        "title": "杭州美食都藏在菜市场里？比脸大的软糯肘子配拌川香迷...",
        "short_url": "https://v.douyin.com/HKllaptUlDY/"
    },
    {
        "author": "红薯味的芹菜",
        "title": "这还是杭州吗？这家东北菜份量又大又好吃！ # 十万...",
        "short_url": "https://v.douyin.com/zTdG9NJevYc/"
    },
    {
        "author": "浪胃仙做自己",
        "title": "今天在杭州吃了一顿好吃的爆辣冒菜！ # 心动打卡指...",
        "short_url": "https://v.douyin.com/opYwMFWPhSc/"
    },
    {
        "author": "特别乌啦啦",
        "title": "花46元吃「杭州地道片儿川」~ 你觉得这家是天花板...",
        "short_url": "https://v.douyin.com/CmGluMrFITU/"
    },
    {
        "author": "起飞一仔",
        "title": "在杭州吃到好的了！超火超下饭的贵州菜！ # 杭州美...",
        "short_url": "https://v.douyin.com/cPzPeXgSICk/"
    },
    {
        "author": "瓦萨北北(全国巡烤中)",
        "title": "杭州30多年土著一天吃遍杭州 23年路边摊炸串，几...",
        "short_url": "https://v.douyin.com/4F9BylR9V_g/"
    },
    {
        "author": "大专厨子",
        "title": "杭州深夜12点排队路边摊❗️糖醋铁板烧与东北烤冷面...",
        "short_url": "https://v.douyin.com/yz4kkALYyfk/"
    },
    {
        "author": "十一的两三天",
        "title": "杭州必吃两人食！5家老底子小馆 来杭州玩必冲的几家...",
        "short_url": "https://v.douyin.com/WC1_bWZ4SOo/"
    },
    {
        "author": "战宝饱饱",
        "title": "多人测评杭州美食荒漠绿洲 合理饮食 # 杭州美食 ...",
        "short_url": "https://v.douyin.com/SBz7hovpbs4/"
    },
    {
        "author": "温油辣辣U",
        "title": "冲评价“杭州白月光海鲜小馆”，周六冒雨去吃 惊喜小...",
        "short_url": "https://v.douyin.com/4FFJ4101FHg/"
    },
    {
        "author": "胖虎一米八",
        "title": "打卡杭州苍蝇馆子，三个人五个菜90，性价比太高了！...",
        "short_url": "https://v.douyin.com/fI_Dte5bIvw/"
    },
    {
        "author": "盗月社食遇记",
        "title": "和朋友极限24小时逛吃杭州，没想到解决了多年的困惑...",
        "short_url": "https://v.douyin.com/U13qxfJ8I2Q/"
    },
    {
        "author": "瓦萨北北(全国巡烤中)",
        "title": "188一位，100多种港式早点畅吃 杭州超贵港式自...",
        "short_url": "https://v.douyin.com/Qzn_47psOcY/"
    }
]

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

opener = urllib.request.build_opener(NoRedirect)
opener.addheaders = [
    ('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
]

results = []
for idx, item in enumerate(raw_items, 1):
    short_url = item['short_url']
    final_location = ""
    try:
        req = urllib.request.Request(short_url)
        resp = opener.open(req)
        final_location = resp.geturl()
    except urllib.error.HTTPError as e:
        final_location = e.headers.get('Location', '')
    except Exception as e:
        final_location = f"Error: {e}"
        
    vid_match = re.search(r'/video/(\d+)', final_location)
    vid = vid_match.group(1) if vid_match else ""
    canonical_url = f"https://www.douyin.com/video/{vid}" if vid else final_location
    
    entry = {
        "idx": idx,
        "author": item['author'],
        "title": item['title'],
        "short_url": short_url,
        "vid": vid,
        "canonical_url": canonical_url
    }
    results.append(entry)
    print(f"[{idx:02d}] {item['author']} -> vid: {vid} | {canonical_url}")
    time.sleep(0.5)

out_file = Path(__file__).resolve().parent / "batch1_resolved.json"
out_file.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf8')
print(f"\nAll {len(results)} items resolved. Saved to {out_file}")
