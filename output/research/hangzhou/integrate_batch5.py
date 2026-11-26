import json, subprocess
from pathlib import Path

worktree = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep\map-base")
intake_dir = Path(r"D:\Antigravity\地图\map-base\.local\video-intake")
ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
vlib_path = worktree / "data/cities/hangzhou/video-library.json"

vlib = json.loads(vlib_path.read_text(encoding="utf-8"))

new_sources = [
    {
        "id": "hz-yangsang-7653525512216707913",
        "author": "羊桑",
        "title": "终于打卡上需要提前俩月约的餐厅",
        "url": "https://www.douyin.com/video/7653525512216707913",
        "publishedOn": "2026-06-21",
        "durationSeconds": 1123.37,
        "segments": [
            {
                "id": "hz-yangsang-shiye-tianmuli",
                "name": "柿野（天目里店）",
                "category": "创意湘菜 · 美学餐厅",
                "start": 104.0,
                "end": 144.0,
                "posterSecond": 106.0,
                "coordinates": [120.1015, 30.2693],
                "addressText": "西湖区天目山路398号天目里16号楼9层（沿天目山路西走廊延伸）",
                "summary": "天目里16号楼9层高空预约制餐厅，主打克制极简的当季创意湘菜与开放式美学厨房，落地大窗俯瞰天目里树冠与建筑群。",
                "footageNote": "羊桑打卡天目里提前两月预约的柿野餐厅实况"
            }
        ]
    },
    {
        "id": "hz-niuniu-7646324850500266737",
        "author": "牛牛很挑食",
        "title": "杭州竟然有这么小众的泰国北部土菜！ 再吃个金枕榴莲，瞬间回到曼谷街头…",
        "url": "https://www.douyin.com/video/7646324850500266737",
        "publishedOn": "2026-06-01",
        "durationSeconds": 216.6,
        "segments": [
            {
                "id": "hz-niuniu-picatham-taicai",
                "name": "PICATHAM Thai Cuisine & Wine",
                "category": "泰式料理 · 餐酒馆",
                "start": 116.0,
                "end": 156.0,
                "posterSecond": 121.0,
                "coordinates": [120.1505, 30.2725],
                "addressText": "西湖区莫干山路17号（近武林门/环城北路）",
                "summary": "藏在市中心的纯正泰北乡村风味料理，粗盐封烤金目鲷鱼、香茅牛肋骨与炭火烤串，户外用餐区极富曼谷度假氛围。",
                "footageNote": "牛牛很挑食实测莫干山路正宗泰北土菜与盐烤鱼"
            }
        ]
    },
    {
        "id": "hz-jieou-7641070065438731368",
        "author": "杰欧",
        "title": "杭州美食尽情出列！",
        "url": "https://www.douyin.com/video/7641070065438731368",
        "publishedOn": "2026-05-18",
        "durationSeconds": 124.13,
        "segments": [
            {
                "id": "hz-jieou-duizhao-canguan",
                "name": "对照馆子（蔡马店）",
                "category": "市井杭帮菜 · 苍蝇馆",
                "start": 18.0,
                "end": 50.0,
                "posterSecond": 28.0,
                "coordinates": [120.1452, 30.3182],
                "addressText": "拱墅区宸麟路497号（近上塘街道/蔡马新村）",
                "summary": "拱墅区高人气老底子苍蝇馆，招牌白切杨中鸡皮滑肉嫩带鸡油冻、现切热出，油爆虾与家常小炒镬气十足。",
                "footageNote": "杰欧探访对照馆子招牌热出白切鸡"
            },
            {
                "id": "hz-jieou-changshun-chashi",
                "name": "常顺茶食（大井巷店）",
                "category": "特色茶食 · 慢炖羊肉",
                "start": 52.0,
                "end": 82.0,
                "posterSecond": 64.0,
                "coordinates": [120.1685, 30.2402],
                "addressText": "上城区大井巷41-42号（清河坊历史街区）",
                "summary": "吴山脚下大井巷古风雅致小馆，必点慢火清炖羊肉锅，酥烂温润不膻，肉尽下菌菇涮煮鲜甜，堪比中式轻食。",
                "footageNote": "杰欧品评大井巷常顺茶食慢炖羊肉锅"
            },
            {
                "id": "hz-jieou-shuimohui-tucai",
                "name": "水墨徽·山野土菜（鼓楼店）",
                "category": "山野徽菜 · 杭派融合",
                "start": 84.0,
                "end": 120.0,
                "posterSecond": 92.0,
                "coordinates": [120.1705, 30.2372],
                "addressText": "上城区中山南路462号（鼓楼景区望仙阁旁）",
                "summary": "鼓楼脚下性价比极高的中式土菜馆，臭鳜鱼捞饭浓郁开胃、墨黑香红烧肉软糯如果冻、石耳土鸡汤原汁原味。",
                "footageNote": "杰欧实测鼓楼旁水墨徽山野土菜大桌丰盛硬菜"
            }
        ]
    },
    {
        "id": "hz-jiding-7709105067328419515",
        "author": "jiding",
        "title": "杭州餐厅^_^会带每一任对象去吃的4家 选餐厅这块 我从不出错",
        "url": "https://www.douyin.com/video/7709105067328419515",
        "publishedOn": "2026-11-17",
        "durationSeconds": 202.03,
        "segments": [
            {
                "id": "hz-jiding-ganbei-oden",
                "name": "柑杯·鸡汤关东煮（ODEN & BEER）",
                "category": "鸡汤关东煮 · 日式小酒馆",
                "start": 10.0,
                "end": 45.0,
                "posterSecond": 26.0,
                "coordinates": [120.2105, 30.2072],
                "addressText": "滨江区江汉路1515号龙湖杭州滨江天街旁",
                "summary": "每天鲜熬鸡汤底的暖心关东煮小馆，慢煮8小时白萝卜充分吸汁，搭配外脆内嫩名古屋炸鸡翅与天妇罗乌冬面。",
                "footageNote": "jiding探访滨江天街鸡汤关东煮与名古屋鸡翅"
            },
            {
                "id": "hz-jiding-sushi-zhengchuan",
                "name": "寿司正传（滨江天街店）",
                "category": "创意寿司 · 板前料理",
                "start": 68.0,
                "end": 112.0,
                "posterSecond": 80.0,
                "coordinates": [120.2108, 30.2076],
                "addressText": "滨江区江汉路1515号龙湖杭州滨江天街B馆L5",
                "summary": "广州开来的新派中式板前寿司，一口饭层次丰富、炭烤鳗鱼寿司搭配清脆苹果丝解腻，地狱拉面浓汤醇正。",
                "footageNote": "jiding推荐滨江天街寿司正传与炭烤鳗鱼"
            },
            {
                "id": "hz-jiding-shadow-island",
                "name": "影子岛韩国料理（武林店）",
                "category": "韩国料理 · 街头风味",
                "start": 114.0,
                "end": 143.0,
                "posterSecond": 121.0,
                "coordinates": [120.1622, 30.2642],
                "addressText": "拱墅区延安路466号浙江经贸大楼综合楼（凤起路地铁口）",
                "summary": "凤起路地铁口人气韩料，招牌金黄杏仁脆皮炸鸡咸甜酥脆、米肠汤饭料多扎实，街头小馆氛围感拉满。",
                "footageNote": "jiding打卡延安路影子岛招牌杏仁炸鸡"
            },
            {
                "id": "hz-jiding-miangmiang-thai",
                "name": "Miang·Miang泰馆（星光大道店）",
                "category": "泰国菜 · 泰北风情",
                "start": 144.0,
                "end": 195.0,
                "posterSecond": 165.0,
                "coordinates": [120.2120, 30.2090],
                "addressText": "滨江区长河街道江南大道228号星光大道一期1F",
                "summary": "星光大道新晋高颜值泰北小馆，秘制酸辣牛肉酸辣爽口，浓郁黄咖喱罗氏虾裹满浓汁拌饭一绝，泰式炒粉甜咸平衡。",
                "footageNote": "jiding推荐星光大道MiangMiang泰馆咖喱罗氏虾"
            }
        ]
    }
]

existing_ids = {s["id"] for s in vlib["sources"]}
for s in new_sources:
    if s["id"] not in existing_ids:
        vlib["sources"].append(s)

vlib_path.write_text(json.dumps(vlib, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Updated video-library.json: {len(vlib['sources'])} sources, {sum(len(s['segments']) for s in vlib['sources'])} segments.")
