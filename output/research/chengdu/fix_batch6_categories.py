with open('output/research/chengdu/generate_batch6_full.mjs', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. tiemen
text = text.replace(
    'name: "铁门杂酱面（牛市口店）",\n        category: "非遗老面馆 / 经典杂酱面",',
    'name: "铁门杂酱面（牛市口店）",\n        category: "面馆 / 川味小吃",'
)

# 2. heji
text = text.replace(
    'name: "贺记蛋烘糕（文庙西街总店）",\n        category: "非遗传统小吃 / 街头名点",',
    'name: "贺记蛋烘糕（文庙西街总店）",\n        category: "川味小吃 / 蛋烘糕",'
)

# 3. maojiheyi
text = text.replace(
    'name: "毛记和意冒菜（解放西街店）",\n        category: "老成都四大天王冒菜 / 经典市井名吃",',
    'name: "毛记和意冒菜（解放西街店）",\n        category: "冒菜 / 川味小吃",'
)

# 4. kaojianghu
text = text.replace(
    'name: "烤江湖（泛悦国际店）",\n        category: "川味特色烧烤 / 宵夜江湖菜",',
    'name: "烤江湖（泛悦国际店）",\n        category: "江湖烧烤 / 夜宵大排档",'
)

# 5. yanglaotou yushuang
text = text.replace(
    'name: "杨老头鲜货烧烤（玉双路店）",\n        category: "市井鲜货烧烤 / 宵夜大排档",',
    'name: "杨老头鲜货烧烤（玉双路店）",\n        category: "烧烤 / 卤烤猪蹄",'
)

# 6. ganjifeichangfen
text = text.replace(
    'name: "甘记肥肠粉（马鞍北路总店）",\n        category: "市井老字号 / 米其林必比登",',
    'name: "甘记肥肠粉（马鞍北路总店）",\n        category: "川味小吃 / 肥肠粉",'
)

with open('output/research/chengdu/generate_batch6_full.mjs', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated generate_batch6_full.mjs!')
