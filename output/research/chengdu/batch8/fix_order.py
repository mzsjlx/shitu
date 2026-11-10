import json
import re

with open('output/research/chengdu/batch8/generate_batch8_full.mjs', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's verify how danniushi is written:
# We can swap the two segments in danniushi and finn.
# Let's inspect using re:
# 1. Danniushi:
danniushi_match = re.search(r'(id:\s*"cd-danniushi-7645662813721054504"[\s\S]*?segments:\s*\[\s*)(\{[\s\S]*?id:\s*"cd-danniushi-zhangpopoguokui"[\s\S]*?\},\s*)(\{[\s\S]*?id:\s*"cd-danniushi-shierbaimian"[\s\S]*?\})(\s*\])', text)

if danniushi_match:
    print("Found danniushi match!")
    prefix = danniushi_match.group(1)
    seg_zhang = danniushi_match.group(2).rstrip().rstrip(',')
    seg_shier = danniushi_match.group(3)
    suffix = danniushi_match.group(4)
    # Swap them
    new_danniushi = prefix + seg_shier + ",\n      " + seg_zhang + suffix
    text = text[:danniushi_match.start()] + new_danniushi + text[danniushi_match.end():]
    print("Swapped danniushi segments!")
else:
    print("Danniushi match failed!")

# 2. Finn:
finn_match = re.search(r'(id:\s*"cd-finn-7632654123914398054"[\s\S]*?segments:\s*\[\s*)(\{[\s\S]*?id:\s*"cd-finn-huangniang"[\s\S]*?\},\s*)(\{[\s\S]*?id:\s*"cd-finn-taoxiangyuan"[\s\S]*?\})(\s*\])', text)

if finn_match:
    print("Found finn match!")
    prefix = finn_match.group(1)
    seg_huang = finn_match.group(2).rstrip().rstrip(',')
    seg_tao = finn_match.group(3)
    suffix = finn_match.group(4)
    # Swap them
    new_finn = prefix + seg_tao + ",\n      " + seg_huang + suffix
    text = text[:finn_match.start()] + new_finn + text[finn_match.end():]
    print("Swapped finn segments!")
else:
    print("Finn match failed!")

with open('output/research/chengdu/batch8/generate_batch8_full.mjs', 'w', encoding='utf-8') as f:
    f.write(text)

print("Saved generate_batch8_full.mjs")
