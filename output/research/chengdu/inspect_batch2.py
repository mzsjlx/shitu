import sys, json

sys.stdout.reconfigure(encoding='utf-8')

targets = [
    'cd-wenyoulala-7528381853955411210.json',
    'cd-renyi-7606583802420317455.json',
    'cd-dage-7597692982615261083.json',
    'cd-jianxishishen-7626213680585166118.json'
]

for t in targets:
    p = 'output/research/chengdu/details/' + t
    with open(p, 'r', encoding='utf-8') as f:
        d = json.load(f)
    print('==============================')
    print('FILE:', t)
    print('Author:', d.get('author', {}).get('nickname'))
    print('Desc:', d.get('desc'))
    ch = d.get('chapter_list')
    if ch:
        for c in ch:
            ts = c.get('timestamp')
            desc = c.get('desc')
            detail = c.get('detail')
            print(f'  Chapter {ts}ms: {desc} | {detail}')
