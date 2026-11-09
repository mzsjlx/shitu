import urllib.request
import json
import re
import os

links_text = """
1.23 复制打开抖音，看看【小解的作品】菜品从2.8块开始，吃疯了！成都宝藏社区火锅赶超重... https://v.douyin.com/t5tiefW9k7c/ l@c.NJ EhB:/ :8pm 11/01 
6.99 复制打开抖音，看看【徐老斯和bee酱的作品】北门棚户级神店终于开到我家附近了！！没理由不冲！ ... https://v.douyin.com/GeNhiCqZb8E/ xSL:/ :6pm 04/08 J@i.PK 
2.56 复制打开抖音，看看【丹牛食的作品】我吃遍了成都最經典的早餐，第四家太香了！ # 成都... https://v.douyin.com/swRzsh6ODd0/ fbN:/ 12/23 :7pm J@I.VY 
2.02 复制打开抖音，看看【张喜喜的作品】怒花小1千点了11家成都顶级外卖，美食博主严选每一... https://v.douyin.com/mfcBM_7UslY/ K@W.zG :1pm 01/14 qEu:/ 
1.00 复制打开抖音，看看【小周和小张的作品】四川成都江湖菜 这家的沸腾鱼简直惊为天人,麻辣过瘾... https://v.douyin.com/QsbhdHXsPKw/ :6pm 02/16 wfB:/ e@o.qe 
0.25 复制打开抖音，看看【刘雨鑫JASON的作品】今天在成都街头吃顿老火锅，尝尝怎么样？ # 人间烟... https://v.douyin.com/d2KToN8JXLQ/ v@S.Ym :6pm reo:/ 01/24 
5.17 复制打开抖音，看看【丹妮妮妮妮的作品】和老朋友的夜宵局！ 火辣辣的江湖菜和成都的夜晚适配... https://v.douyin.com/kl1_DHuC6n8/ :2pm zGV:/ Z@Z.md 04/05 
0.51 复制打开抖音，看看【刘雨鑫JASON的作品】你们要的成都春熙路小吃避雷指南来啦！# 我要上热门... https://v.douyin.com/GcOD1yaPQzQ/ h@O.kP 01/06 :3pm teB:/ 
2.87 复制打开抖音，看看【特厨隋坡（重新出发版）的作品】特厨探店 |完全没有外地人的成都小馆是什么味道—包... https://v.douyin.com/gGa0FcfCcFY/ h@o.qR trr:/ :7pm 03/02 
0.28 复制打开抖音，看看【演员王迅的作品】每回回成都都会去逛菜市场，除了满满的烟火气还有很多... https://v.douyin.com/jJUIY1UZU9Y/ iCH:/ 08/15 :4pm I@I.vf 
8.46 复制打开抖音，看看【小紧张的虫虫的作品】落地成都第一顿，冲连续两年米其林川菜馆，点9道菜会... https://v.douyin.com/Xz2uvgQVg1k/ HIi:/ :5pm 12/27 e@o.dn 
1.02 复制打开抖音，看看【小解的作品】1000万人推荐的火锅！成都前三⁉️ 大家评论区见... https://v.douyin.com/yWzcCUZ2VFQ/ :5pm a@A.Ty OXZ:/ 09/06 
5.69 复制打开抖音，看看【杨队！快来吃点！的作品】成都金牛区人气烧烤，小串不用撒料就够味，全凭食材新... https://v.douyin.com/B2tERMiyg9g/ :0pm 10/09 s@r.rR MWM:/ 
0.02 复制打开抖音，看看【Renyi毅哥的作品】赶场3小时只为一碗川式老味早餐！鲜粉现烫加上爆汁节... https://v.douyin.com/XxS66BX43Ac/ R@K.Wm :6pm 12/19 icN:/ 
1.71 复制打开抖音，看看【队长0527的作品】累了就喝点，不用逢场作戏，也不用带着面具，生活本来... https://v.douyin.com/jygpkGR3m58/ a@A.Ty YZZ:/ :5pm 10/04 
2.38 复制打开抖音，看看【盗月社食遇记的作品】这个贵州五线小城，凭什么是中国“吃商”最高的城市？... https://v.douyin.com/Xg1oXevXgQY/ o@D.UL 05/25 :7pm tRx:/ 
0.07 复制打开抖音，看看【特厨隋坡（重新出发版）的作品】边吃边笑，重庆本地人的食堂到底咋样？—口未餐家常菜... https://v.douyin.com/GCNj0aNSgus/ 07/14 H@i.Px YZZ:/ :5pm 
3.05 复制打开抖音，看看【巨爱吃的周嘉伟的作品】贡菜肥牛凤爪螺蛳粉加麻辣小龙虾串加黑椒土豆泥炸鸡加... https://v.douyin.com/l6PDDbYwDsQ/ oDU:/ 12/02 :6pm o@d.AG 
3.38 复制打开抖音，看看【小珍来咯…的作品】再次被重庆火锅惊艳了 肥肠炒饭吃完念念不忘～# 好... https://v.douyin.com/qTm5R6cMLz0/ :4pm 04/26 Y@M.wF lPx:/ 
7.69 复制打开抖音，看看【橘子公主的作品】第7年来吃大姐铁板烧啦，还是熟悉的配方熟悉的味道 ... https://v.douyin.com/riHkA0ocZiY/ :6pm HiP:/ O@K.wS 11/24 
8.41 复制打开抖音，看看【千金饱了的作品】挑战火爆全网的刘文祥麻辣烫,又黏又辣简直“夯爆了”... https://v.douyin.com/uTauG1haMVA/ dAG:/ 08/23 :3pm V@y.gB 
1.56 复制打开抖音，看看【叫我Finn的作品】成都外卖推荐3🥘绿色无广保姆级攻略来袭！ ！ 假期... https://v.douyin.com/xZZ0LVPaG3Q/ :9pm 11/08 Hvf:/ y@t.rE 
9.92 复制打开抖音，看看【小笼人的作品】八个小时炫成都！看看我都吃了什么～ 没睡饱…也没吃... https://v.douyin.com/omFxXS6MUDg/ 03/27 :7pm mda:/ J@i.Ch 
1.25 复制打开抖音，看看【淦诗岐的作品】成都的网红店会惩罚每一个不做攻略就来的人# 成都美... https://v.douyin.com/C9EotAUArgo/ i@P.kc 06/12 zTL:/ :6pm 
"""

items = []
lines = [l.strip() for l in links_text.strip().split('\n') if l.strip()]

url_regex = re.compile(r'https://v\.douyin\.com/[A-Za-z0-9_-]+/?')
author_regex = re.compile(r'【(.*?)的作品】')

for idx, line in enumerate(lines, 1):
    u_match = url_regex.search(line)
    a_match = author_regex.search(line)
    if u_match:
        url = u_match.group(0)
        author = a_match.group(1) if a_match else f"author_{idx}"
        items.append({
            "index": idx,
            "author": author,
            "shareUrl": url,
            "rawLine": line
        })

print(f"Extracted {len(items)} items.")
os.makedirs('output/research/chengdu/batch8', exist_ok=True)
with open('output/research/chengdu/batch8/items.json', 'w', encoding='utf-8') as f:
    json.dump(items, f, ensure_ascii=False, indent=2)
