import json
import hashlib
from pathlib import Path

root = Path(__file__).resolve().parents[3]
lib_path = root / "map-base/data/cities/harbin/video-library.json"
intake_dir = root / "map-base/.local/video-intake"

with open(lib_path, "r", encoding="utf-8") as f:
    lib = json.load(f)

# Clean out any previous batch 7 run entries
target_new_source_ids = {
    "hb-hongjiantao-7455514963512282426",
    "hb-tongyizhongdiaodiao-7271545349351689526",
    "hb-xiaocaohehuige-7572409902087675107",
    "hb-dankedanke-7445571121983933715",
    "hb-geixiaoliuliuyikou-7687315511633627769",
    "hb-xiaokeriji-7640089065266233777",
    "hb-wenzai-7581023558908070073",
    "hb-tangshixiong-7588090865424421605",
    "hb-ppchaonengxuan-7325755091342953780",
    "hb-yangwenrou-7603728804608429419",
    "hb-shashayouchanle-7605151785506044657"
}

lib['sources'] = [s for s in lib['sources'] if s['id'] not in target_new_source_ids]

def get_sha256(sid):
    mp4 = intake_dir / sid / "source.mp4"
    if mp4.exists():
        return hashlib.sha256(mp4.read_bytes()).hexdigest()
    return ""

new_sources = [
    # 1. 洪剑涛 -> 张家清真小吃
    {
        "id": "hb-hongjiantao-7455514963512282426",
        "author": "洪剑涛",
        "title": "尔滨的物价太低了，88吃8个菜，一碗拉面4块钱，三人吃到肚歪～",
        "url": "https://www.douyin.com/video/7455514963512282426",
        "shareURL": "https://v.douyin.com/5R2gYXTmNd4/",
        "publishedOn": "2025-01-03",
        "durationSeconds": 221.31,
        "sourceSHA256": get_sha256("hb-hongjiantao-7455514963512282426"),
        "acquisitionStatus": "local-source",
        "evidenceNote": "洪剑涛哈尔滨实地探访视频，原片探访道里区新华街84号张家清真小吃，招牌菜单清晰明确。",
        "segments": [
            {
                "id": "hb-hongjiantao-zhangjiaqingzhen",
                "name": "张家清真小吃（新华街老店）",
                "category": "传统清真小吃 / 平民拉面凉菜",
                "summary": "洪剑涛实地探访哈尔滨超实惠清真老店，一碗拉面4元，88元摆满8道硬菜与传统凉拌牛肉。",
                "addressText": "哈尔滨市道里区新华街84号",
                "start": 8.0,
                "end": 20.0,
                "posterSecond": 10.0,
                "coordinates": [126.5845719, 45.7344726],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "道里区新华街张家清真小吃门前",
                    "source": "douyin-poi",
                    "osmNode": 21721
                },
                "routeEligible": False,
                "footageNote": "洪剑涛实拍进店点菜与丰盛餐桌全景，突出拉面与家常清真硬菜。"
            }
        ]
    },
    # 2. 同一种调调 -> 小安利餐厅
    {
        "id": "hb-tongyizhongdiaodiao-7271545349351689526",
        "author": "同一种调调",
        "title": "盘点哈尔滨那些不用营销真正好吃的小店",
        "url": "https://www.douyin.com/video/7271545349351689526",
        "shareURL": "https://v.douyin.com/OVlBqFkxoVI/",
        "publishedOn": "2023-08-26",
        "durationSeconds": 97.71,
        "sourceSHA256": get_sha256("hb-tongyizhongdiaodiao-7271545349351689526"),
        "acquisitionStatus": "local-source",
        "evidenceNote": "同一种调调哈尔滨探店视频，原片首推道里区西五道街小安利俄式餐厅，招牌罐焖牛肉画面清晰。",
        "segments": [
            {
                "id": "hb-tongyizhongdiaodiao-xiaoanli",
                "name": "小安利餐厅（俄式西餐）",
                "category": "俄式家庭料理 / 经典焖罐牛肉",
                "summary": "中央大街旁无需营销的宝藏俄式餐厅，招牌罐焖牛肉肉质软烂大块，罐焖虾与沙拉虾球地道浓郁。",
                "addressText": "哈尔滨市道里区西五道街3号",
                "start": 4.0,
                "end": 16.0,
                "posterSecond": 8.0,
                "coordinates": [126.6156507, 45.7730722],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "道里区西五道街小安利餐厅门前",
                    "source": "douyin-poi",
                    "osmNode": 10287
                },
                "routeEligible": False,
                "footageNote": "博主实拍经典罐焖牛肉开罐与热气腾腾大块软烂牛肉特写。"
            }
        ]
    },
    # 3. 小曹和辉哥 -> 义增祥回民饭店
    {
        "id": "hb-xiaocaohehuige-7572409902087675107",
        "author": "小曹和辉哥（吃客）",
        "title": "逛吃哈尔滨开了40多年的清真老馆子",
        "url": "https://www.douyin.com/video/7572409902087675107",
        "shareURL": "https://v.douyin.com/5Y-vFEuOXoc/",
        "publishedOn": "2025-11-18",
        "durationSeconds": 288.5,
        "sourceSHA256": get_sha256("hb-xiaocaohehuige-7572409902087675107"),
        "acquisitionStatus": "local-source",
        "evidenceNote": "小曹和辉哥哈尔滨探店视频，原片探访南岗区宣庆街3-7号义增祥回民饭店总店，四十余年清真老菜。",
        "segments": [
            {
                "id": "hb-xiaocaohehuige-yizengxiang",
                "name": "义增祥回民饭店（宣庆街总店）",
                "category": "传统清真菜 / 四十年老字号",
                "summary": "哈尔滨开了40多年的老牌清真馆子，招牌尖椒干豆腐镬气十足，清真溜肉段与辣炒羊蝎子焦香酥脆。",
                "addressText": "哈尔滨市南岗区宣庆街3-7号",
                "start": 10.0,
                "end": 22.0,
                "posterSecond": 14.0,
                "coordinates": [126.6685975, 45.7536457],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "南岗区宣庆街义增祥回民饭店门前",
                    "source": "douyin-poi",
                    "osmNode": 15654
                },
                "routeEligible": False,
                "footageNote": "博主实拍宣庆街义增祥门脸与刚出锅招牌溜肉段焦香脆壳特写。"
            }
        ]
    },
    # 4. 蛋壳Danke -> 百姓小吃
    {
        "id": "hb-dankedanke-7445571121983933715",
        "author": "蛋壳Danke",
        "title": "东北居民楼里的小菜馆 没想到这么好吃 太下饭啦",
        "url": "https://www.douyin.com/video/7445571121983933715",
        "shareURL": "https://v.douyin.com/cJMBaZw90mw/",
        "publishedOn": "2024-12-07",
        "durationSeconds": 351.53,
        "sourceSHA256": get_sha256("hb-dankedanke-7445571121983933715"),
        "acquisitionStatus": "local-source",
        "evidenceNote": "蛋壳Danke哈尔滨探店视频，原片探访道里区松发街29号原炉具胡同百姓小吃，每天限时营业4小时。",
        "segments": [
            {
                "id": "hb-dankedanke-baixingxiaochi",
                "name": "百姓小吃（松发街店 / 原炉具胡同）",
                "category": "东北居民楼老菜馆 / 秘制扒肉肘子",
                "summary": "居民楼下每天仅营业4小时的传奇老馆，满满两大锅秘制老汤扒肉与脱骨大肘子，拌米饭满口留香。",
                "addressText": "哈尔滨市道里区松发街29号",
                "start": 22.0,
                "end": 34.0,
                "posterSecond": 26.0,
                "coordinates": [126.5729043, 45.7462659],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "道里区松发街百姓小吃门前",
                    "source": "douyin-poi",
                    "osmNode": 16485
                },
                "routeEligible": False,
                "footageNote": "实拍松发街居民楼入口与老汤大铜锅热气腾腾大肘子特写。"
            }
        ]
    },
    # 5. 给小刘留一口 -> 晓军麻辣面
    {
        "id": "hb-geixiaoliuliuyikou-7687315511633627769",
        "author": "给小刘留一口",
        "title": "哈尔滨美食🔥平价又量大吃美了真是吃美了",
        "url": "https://www.douyin.com/video/7687315511633627769",
        "shareURL": "https://v.douyin.com/ckxpWLHkRUc/",
        "publishedOn": "2026-03-26",
        "durationSeconds": 644.17,
        "sourceSHA256": get_sha256("hb-geixiaoliuliuyikou-7687315511633627769"),
        "acquisitionStatus": "local-source",
        "evidenceNote": "给小刘留一口哈尔滨探店视频，原片探访道外区南新街晓军麻辣面老店，招牌麻辣面与双拼凉菜。",
        "segments": [
            {
                "id": "hb-geixiaoliuliuyikou-xiaojunmalamian",
                "name": "晓军麻辣面（道外店）",
                "category": "老字号麻辣面 / 熏酱干香拌菜",
                "summary": "道外老区深藏的人气麻辣面馆，面条筋道麻香浓厚，搭配招牌土豆丝拼干豆腐下饭一绝。",
                "addressText": "哈尔滨市道外区南新街（近南十七道街）",
                "start": 16.0,
                "end": 28.0,
                "posterSecond": 18.0,
                "coordinates": [126.6565892, 45.7853062],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "道外区南新街晓军麻辣面门前",
                    "source": "douyin-poi",
                    "osmNode": 6011
                },
                "routeEligible": False,
                "footageNote": "实拍道外南新街招牌晓军麻辣面拌面与招牌土豆丝拼干豆腐。"
            }
        ]
    },
    # 6. 小可吃日记 -> 李桂鑫老式麻辣烫
    {
        "id": "hb-xiaokeriji-7640089065266233777",
        "author": "小可吃日记",
        "title": "哈尔滨好吃的麻辣烫合集，一共七家店～",
        "url": "https://www.douyin.com/video/7640089065266233777",
        "shareURL": "https://v.douyin.com/hpboJ9YFC4U/",
        "publishedOn": "2024-05-18",
        "durationSeconds": 79.93,
        "sourceSHA256": get_sha256("hb-xiaokeriji-7640089065266233777"),
        "acquisitionStatus": "local-source",
        "evidenceNote": "小可吃日记哈尔滨探店视频，原片探访道外区草市街78号李桂鑫老式麻辣烫，老汤原汁无麻酱。",
        "segments": [
            {
                "id": "hb-xiaokeriji-liguixinmalatang",
                "name": "李桂鑫老式麻辣烫（草市街老店）",
                "category": "东北老式麻辣烫 / 纯汤无麻酱",
                "summary": "草市街老字号老式麻辣烫，十元一碗大份瓷实，传统老汤麻辣鲜香、原汁原味透着市井烟火。",
                "addressText": "哈尔滨市道外区草市街78号",
                "start": 18.0,
                "end": 30.0,
                "posterSecond": 20.0,
                "coordinates": [126.6399086, 45.7750665],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "道外区草市街李桂鑫麻辣烫门前",
                    "source": "douyin-poi",
                    "osmNode": 8595
                },
                "routeEligible": False,
                "footageNote": "实拍草市街李桂鑫老式麻辣烫沸腾红油大碗与大份吸汁面条。"
            }
        ]
    },
    # 7. 稳仔 -> 安静街早市 (co-anchor to hb-bunny-anjingzaoshi)
    {
        "id": "hb-wenzai-7581023558908070073",
        "author": "稳仔",
        "title": "东北早市美食速通攻略！真正哈尔滨本地人逛的市场 零下25度，从集头吃到集尾，有想来哈尔滨玩的可以先码住了！",
        "url": "https://www.douyin.com/video/7581023558908070073",
        "shareURL": "https://v.douyin.com/LJX9EE9wi1U/",
        "publishedOn": "2025-12-07",
        "durationSeconds": 239.5,
        "sourceSHA256": get_sha256("hb-wenzai-7581023558908070073"),
        "acquisitionStatus": "local-source",
        "evidenceNote": "稳仔哈尔滨实地探访视频，原片清晨探访哈尔滨道里区安静街早市，从集头吃到集尾。",
        "segments": [
            {
                "id": "hb-wenzai-anjingzaoshi",
                "placeId": "hb-bunny-anjingzaoshi",
                "name": "安静街早市（哈尔滨市井大早市）",
                "category": "哈尔滨市井早市 / 特色早点小吃",
                "summary": "稳仔实地速通哈尔滨安静街早市，从集头吃到集尾，打卡特色巧克力油条、大酱肉包与东北蛋宝宝。",
                "addressText": "哈尔滨市道里区安静街（近安和街、安发街交汇段）",
                "start": 2.0,
                "end": 14.0,
                "posterSecond": 4.0,
                "coordinates": [126.6079366, 45.7586255],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "道里区安静街早市街区",
                    "source": "douyin-poi",
                    "osmWay": 3666
                },
                "routeEligible": False,
                "footageNote": "稳仔实拍安静街早市人头攒动的市井烟火气与特色早餐。"
            }
        ]
    },
    # 8. 汤氏熊 -> 安静街早市 (co-anchor to hb-bunny-anjingzaoshi)
    {
        "id": "hb-tangshixiong-7588090865424421605",
        "author": "汤氏熊",
        "title": "东北的早市能有多丰富？逛吃哈尔滨本地人私藏安静市场！",
        "url": "https://www.douyin.com/video/7588090865424421605",
        "shareURL": "https://v.douyin.com/J2Q1RhSjXoc/",
        "publishedOn": "2025-12-26",
        "durationSeconds": 352.29,
        "sourceSHA256": get_sha256("hb-tangshixiong-7588090865424421605"),
        "acquisitionStatus": "local-source",
        "evidenceNote": "汤氏熊哈尔滨实地探访视频，原片清晨探访哈尔滨道里区安静街早市，打卡阿玉锅包肉与现炸大油条。",
        "segments": [
            {
                "id": "hb-tangshixiong-anjingzaoshi",
                "placeId": "hb-bunny-anjingzaoshi",
                "name": "安静街早市（哈尔滨市井大早市）",
                "category": "哈尔滨市井早市 / 特色早点小吃",
                "summary": "汤氏熊逛吃哈尔滨本地人私藏安静街市场，现炸大油条与阿玉热气腾腾锅包肉，充满市井生活气息。",
                "addressText": "哈尔滨市道里区安静街（近安和街、安发街交汇段）",
                "start": 12.0,
                "end": 24.0,
                "posterSecond": 18.0,
                "coordinates": [126.6079366, 45.7586255],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "道里区安静街早市街区",
                    "source": "douyin-poi",
                    "osmWay": 3666
                },
                "routeEligible": False,
                "footageNote": "汤氏熊实拍安静街早市金黄现炸大油条与市井摊位。"
            }
        ]
    },
    # 9. PP超能炫 -> 道里菜市场 (co-anchor to hb-lingzi-daolishichang)
    {
        "id": "hb-ppchaonengxuan-7325755091342953780",
        "author": "PP超能炫",
        "title": "尔滨 你还有多少惊喜是我不知道的",
        "url": "https://www.douyin.com/video/7325755091342953780",
        "shareURL": "https://v.douyin.com/r6xlOTVZLTU/",
        "publishedOn": "2024-01-19",
        "durationSeconds": 290.55,
        "sourceSHA256": get_sha256("hb-ppchaonengxuan-7325755091342953780"),
        "acquisitionStatus": "local-source",
        "evidenceNote": "PP超能炫哈尔滨探店视频，原片打卡道里菜市场，品尝现炸油炸糕、酥饼与特色豆腐脑。",
        "segments": [
            {
                "id": "hb-ppchaonengxuan-daolishichang",
                "placeId": "hb-lingzi-daolishichang",
                "name": "道里菜市场（百年老字号美食城）",
                "category": "百年室内菜市 / 东北名吃聚集地",
                "summary": "PP超能炫逛吃哈尔滨道里菜市场，一口气打卡排队现炸糕、小酥饼、杂粮糕与传统醇厚豆腐脑。",
                "addressText": "哈尔滨市道里区尚志大街57号（索菲亚广场西侧）",
                "start": 6.0,
                "end": 18.0,
                "posterSecond": 10.0,
                "coordinates": [126.6161925, 45.7725128],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "尚志大街与西十二道街交汇处",
                    "source": "douyin-poi",
                    "osmWay": 2439
                },
                "routeEligible": False,
                "footageNote": "PP超能炫实拍百年道里菜市场熙熙攘攘的小吃长廊与丰富熟食糕点。"
            }
        ]
    },
    # 10. 杨温柔今天吃点啥 -> 红专街早市 (co-anchor to hb-lingzi-hongzhuanzaoshi)
    {
        "id": "hb-yangwenrou-7603728804608429419",
        "author": "杨温柔今天吃点啥",
        "title": "☺️有好东西一定跟小宝们分享～ 欢迎大家来哈尔滨玩嘿嘿",
        "url": "https://www.douyin.com/video/7603728804608429419",
        "shareURL": "https://v.douyin.com/ScbVFYtrg2s/",
        "publishedOn": "2026-02-06",
        "durationSeconds": 371.15,
        "sourceSHA256": get_sha256("hb-yangwenrou-7603728804608429419"),
        "acquisitionStatus": "local-source",
        "evidenceNote": "杨温柔今天吃点啥哈尔滨探店视频，原片清晨实拍红专街早市，东北特色早餐与市井晨烟。",
        "segments": [
            {
                "id": "hb-yangwenrou-hongzhuanzaoshi",
                "placeId": "hb-lingzi-hongzhuanzaoshi",
                "name": "红专街早市（哈尔滨百年晨市）",
                "category": "哈尔滨百年晨市 / 特色早点小吃",
                "summary": "杨温柔冬日清晨打卡红专街早市，体验零下20度的热气腾腾白气与地道东北特色早点小吃。",
                "addressText": "哈尔滨市道里区红专街与通江街交界处",
                "start": 24.0,
                "end": 36.0,
                "posterSecond": 28.0,
                "coordinates": [126.6111815, 45.7725927],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "道里区红专街街区",
                    "source": "douyin-poi",
                    "osmWay": 2447
                },
                "routeEligible": False,
                "footageNote": "杨温柔实拍零下20度红专街早市热气腾腾的早市长廊。"
            }
        ]
    },
    # 11. 鲨鲨又馋了 -> 胖姐涮肚烧烤 (co-anchor to hb-miantiaoren-pangjie)
    {
        "id": "hb-shashayouchanle-7605151785506044657",
        "author": "鲨鲨又馋了",
        "title": "零下25度在东北逛吃一天！热乎乎的涮肚锅也太幸福啦",
        "url": "https://www.douyin.com/video/7605151785506044657",
        "shareURL": "https://v.douyin.com/LvMi3Y2rfdo/",
        "publishedOn": "2026-02-10",
        "durationSeconds": 270.77,
        "sourceSHA256": get_sha256("hb-shashayouchanle-7605151785506044657"),
        "acquisitionStatus": "local-source",
        "evidenceNote": "鲨鲨又馋了哈尔滨探店视频，原片夜访南岗区建兴街胖姐涮肚老店，招牌老味砂锅涮肚锅与烤串。",
        "segments": [
            {
                "id": "hb-shashayouchanle-pangjie",
                "placeId": "hb-miantiaoren-pangjie",
                "name": "胖姐涮肚烧烤（建兴街老店）",
                "category": "东北烧烤 / 老味涮肚",
                "summary": "鲨鲨又馋了零下25度夜访建兴街胖姐涮肚，居民楼下热气腾腾的砂锅涮肚锅、酸菜五花与烤千层筋。",
                "addressText": "哈尔滨市南岗区建兴街5号（近铁工街）",
                "start": 12.0,
                "end": 24.0,
                "posterSecond": 16.0,
                "coordinates": [126.6074163, 45.731537],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "南岗区建兴街胖姐涮肚老店",
                    "source": "douyin-poi",
                    "osmNode": 22359
                },
                "routeEligible": False,
                "footageNote": "鲨鲨又馋了实拍居民楼下胖姐涮肚招牌与沸腾砂锅涮肚锅。"
            }
        ]
    }
]

lib['sources'].extend(new_sources)

with open(lib_path, "w", encoding="utf-8") as f:
    json.dump(lib, f, ensure_ascii=False, indent=2)

print(f"Integration complete: {len(lib['sources'])} sources, {sum(len(s['segments']) for s in lib['sources'])} segments.")
