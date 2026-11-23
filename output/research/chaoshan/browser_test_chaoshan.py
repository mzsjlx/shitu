# -*- coding: utf-8 -*-
import subprocess
import time
import os
import sys
import json
from pathlib import Path
import urllib.request
from playwright.sync_api import sync_playwright

repo = Path(__file__).resolve().parents[3]
root = str(repo / 'map-base')
out_dir = str(repo / 'output/playwright/chaoshan-integration')
os.makedirs(out_dir, exist_ok=True)

port = int(os.environ.get('PREVIEW_PORT', '8795'))
base_url = f'http://127.0.0.1:{port}'

# Start serve.mjs
server_proc = subprocess.Popen(
    ['node', 'scripts/serve.mjs', '--port', str(port)],
    cwd=root,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

for _ in range(80):
    if server_proc.poll() is not None:
        raise RuntimeError('Preview process exited; refusing to test an unrelated server')
    try:
        with urllib.request.urlopen(base_url + '/__foodcity_health', timeout=1) as response:
            health = json.load(response)
        if Path(health['root']).resolve() != (Path(root) / 'dist').resolve():
            raise RuntimeError('Unexpected preview workspace')
        break
    except (OSError, TimeoutError):
        time.sleep(.25)
else:
    raise RuntimeError('Preview did not become ready')
print(f'Server started on {base_url} (PID {server_proc.pid})')

checks = []
def check(name, condition, detail=''):
    checks.append({'name': name, 'passed': bool(condition), 'detail': detail})
    status = '[PASS]' if condition else '[FAIL]'
    print(f'{status} {name} {detail}')

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # 1. Test places-chaoshan.html (Desktop & Mobile)
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = context.new_page()
        res = page.goto(f'{base_url}/places-chaoshan.html')
        check('1. places-chaoshan.html loads successfully', res.status == 200)

        cards = page.locator('.card')
        card_count = cards.count()
        check('2. places-chaoshan.html shows expanded food cards', card_count == 67, f'Count: {card_count}')

        # Check multi-blogger merge badge in cards
        multi_badges = page.locator('.card small:has-text("条同店视频")')
        check('3. Multi-blogger same-shop merge badges exist on grouped cards', multi_badges.count() == 7, f'Badges: {multi_badges.count()}')

        # Check batch 3, 4, 5, 6 & 7 new shops exist on places list
        page_text = page.locator('main').inner_text()
        check('3b. Batch 3, 4, 5, 6 & 7 new shops exist in food cards list',
              '厝味火锅' in page_text and '林三满' in page_text and '阿洲炭炉鸡煲' in page_text and '蔡杰牛肉店' in page_text and '花城夜市' in page_text and '薪滋滋' in page_text and '熹烤' in page_text and '来只蛙' in page_text,
              'Found 厝味火锅, 林三满, 阿洲炭炉鸡煲, 蔡杰牛肉店, 花城夜市, 薪滋滋, 熹烤, 来只蛙')

        page.screenshot(path=os.path.join(out_dir, 'places-desktop.png'))

        page.set_viewport_size({'width': 390, 'height': 844})
        page.screenshot(path=os.path.join(out_dir, 'places-mobile.png'))
        context.close()

        # 2. Test detail page with HTML5 Video and multi-blogger cross-links
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = context.new_page()
        res = page.goto(f'{base_url}/places/video-chaoshan-miaojiang-chunmeili.html')
        check('4. Detail page loads successfully', res.status == 200)

        # Check cross-blogger related links
        related_links = page.locator('p:has-text("同一家店") a')
        check('5. Detail page provides cross-blogger links for same shop', related_links.count() >= 2, f'Related bloggers: {related_links.count()}')

        video = page.locator('video')
        check('6. Detail page has HTML5 video element', video.count() == 1)

        # Wait for video metadata to load
        page.wait_for_function('() => document.querySelector("video") && document.querySelector("video").readyState >= 1')
        video_meta = page.evaluate('''() => {
            const v = document.querySelector("video");
            return {
                videoWidth: v.videoWidth,
                videoHeight: v.videoHeight,
                duration: v.duration,
                paused: v.paused
            };
        }''')
        check('7. Video loads metadata and decodes valid resolution', video_meta['videoWidth'] > 0 and video_meta['videoHeight'] > 0, f"{video_meta['videoWidth']}x{video_meta['videoHeight']}, {video_meta['duration']:.2f}s")

        # Play video and test playback advance
        page.evaluate('() => document.querySelector("video").play()')
        page.wait_for_timeout(1000)
        curr_time = page.evaluate('() => document.querySelector("video").currentTime')
        check('8. Video playback advances past 0.5s', curr_time > 0.5, f"currentTime: {curr_time:.2f}s")
        page.screenshot(path=os.path.join(out_dir, 'detail-video-chunmeili.png'))
        context.close()

        # 2b. Test batch 3 new shop detail page with video playback (厝味火锅)
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = context.new_page()
        res = page.goto(f'{base_url}/places/video-chaoshan-xiaozhen-cuoweihuoguo.html')
        check('8b. Batch 3 detail page loads successfully', res.status == 200)
        page.wait_for_function('() => document.querySelector("video") && document.querySelector("video").readyState >= 1')
        cuowei_meta = page.evaluate('''() => {
            const v = document.querySelector("video");
            return {
                videoWidth: v.videoWidth,
                videoHeight: v.videoHeight,
                duration: v.duration
            };
        }''')
        check('8c. Batch 3 video loads valid metadata', cuowei_meta['videoWidth'] > 0 and cuowei_meta['duration'] > 10, f"{cuowei_meta['videoWidth']}x{cuowei_meta['videoHeight']}, {cuowei_meta['duration']:.2f}s")
        page.screenshot(path=os.path.join(out_dir, 'detail-video-cuoweihuoguo.png'))
        context.close()

        # 2c. Test batch 4 new shop detail page with video playback (阿洲炭炉鸡煲)
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = context.new_page()
        res = page.goto(f'{base_url}/places/video-chaoshan-wangdingyi-azhoujibao.html')
        check('8d. Batch 4 detail page loads successfully', res.status == 200)
        page.wait_for_function('() => document.querySelector("video") && document.querySelector("video").readyState >= 1')
        azhou_meta = page.evaluate('''() => {
            const v = document.querySelector("video");
            return {
                videoWidth: v.videoWidth,
                videoHeight: v.videoHeight,
                duration: v.duration
            };
        }''')
        check('8e. Batch 4 video loads valid metadata and decodes resolution', azhou_meta['videoWidth'] > 0 and azhou_meta['duration'] > 10, f"{azhou_meta['videoWidth']}x{azhou_meta['videoHeight']}, {azhou_meta['duration']:.2f}s")
        page.screenshot(path=os.path.join(out_dir, 'detail-video-azhoujibao.png'))
        context.close()

        # 2d. Test batch 5 new shop detail page with video playback (蔡杰牛肉店)
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = context.new_page()
        res = page.goto(f'{base_url}/places/video-chaoshan-wulala-caijieniurou.html')
        check('8f. Batch 5 detail page loads successfully', res.status == 200)
        page.wait_for_function('() => document.querySelector("video") && document.querySelector("video").readyState >= 1')
        caijie_meta = page.evaluate('''() => {
            const v = document.querySelector("video");
            return {
                videoWidth: v.videoWidth,
                videoHeight: v.videoHeight,
                duration: v.duration
            };
        }''')
        check('8g. Batch 5 video loads valid metadata and decodes resolution', caijie_meta['videoWidth'] > 0 and caijie_meta['duration'] > 10, f"{caijie_meta['videoWidth']}x{caijie_meta['videoHeight']}, {caijie_meta['duration']:.2f}s")
        page.screenshot(path=os.path.join(out_dir, 'detail-video-caijieniurou.png'))
        context.close()

        # 2e. Test batch 6 new shop detail page with video playback and triple-vlogger links (东麦·林三满)
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = context.new_page()
        res = page.goto(f'{base_url}/places/video-chaoshan-dongmai-linsanman.html')
        check('8h. Batch 6 detail page (林三满) loads successfully', res.status == 200)

        # Check triple-vlogger cross links (汁汁冰激凌 + 大猛每一餐)
        linsanman_related = page.locator('p:has-text("同一家店") a')
        check('8i. 林三满 has triple-vlogger merge cross-links', linsanman_related.count() >= 2, f'Related bloggers: {linsanman_related.count()}')

        page.wait_for_function('() => document.querySelector("video") && document.querySelector("video").readyState >= 1')
        dongmai_meta = page.evaluate('''() => {
            const v = document.querySelector("video");
            return {
                videoWidth: v.videoWidth,
                videoHeight: v.videoHeight,
                duration: v.duration
            };
        }''')
        check('8j. Batch 6 video loads valid metadata and decodes resolution', dongmai_meta['videoWidth'] > 0 and dongmai_meta['duration'] > 10, f"{dongmai_meta['videoWidth']}x{dongmai_meta['videoHeight']}, {dongmai_meta['duration']:.2f}s")
        page.screenshot(path=os.path.join(out_dir, 'detail-video-linsanman-dongmai.png'))
        context.close()

        # 2f. Test batch 7 new shop detail page with video playback (778 · 熹烤巴西烤肉自助)
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = context.new_page()
        res = page.goto(f'{base_url}/places/video-chaoshan-qiqiba-xikaobaxi.html')
        check('8k. Batch 7 detail page (熹烤巴西烤肉) loads successfully', res.status == 200)
        page.wait_for_function('() => document.querySelector("video") && document.querySelector("video").readyState >= 1')
        xikao_meta = page.evaluate('''() => {
            const v = document.querySelector("video");
            return {
                videoWidth: v.videoWidth,
                videoHeight: v.videoHeight,
                duration: v.duration
            };
        }''')
        check('8l. Batch 7 video loads valid metadata and decodes resolution', xikao_meta['videoWidth'] > 0 and xikao_meta['duration'] > 10, f"{xikao_meta['videoWidth']}x{xikao_meta['videoHeight']}, {xikao_meta['duration']:.2f}s")
        page.screenshot(path=os.path.join(out_dir, 'detail-video-xikaobaxi.png'))
        context.close()

        # 3. Test 3D Map Preview Page (preview-chaoshan.html)
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = context.new_page()
        res = page.goto(f'{base_url}/preview-chaoshan.html?view=food')
        page.wait_for_timeout(3500)

        # Check map overlay initialized
        stats = page.evaluate('''() => {
            const cards = document.querySelectorAll(".food-card");
            const popover = document.querySelector(".food-inline-popover");
            return {
                foodCards: cards.length,
                hasPopover: !!popover
            };
        }''')
        check('9. Chaoshan 3D map initializes with food overlay active', stats.get('hasPopover') and stats.get('foodCards') == 46)
        check('10. Food overlay has Chaoshan food stops', stats.get('foodCards') == 46, f"Cards: {stats.get('foodCards')}")

        page.screenshot(path=os.path.join(out_dir, 'map-chaoshan-desktop.png'))

        # Mobile viewport screenshot
        page.set_viewport_size({'width': 390, 'height': 844})
        page.wait_for_timeout(500)
        page.screenshot(path=os.path.join(out_dir, 'map-chaoshan-mobile.png'))

        # 4. Test food card popover and video expansion
        page.set_viewport_size({'width': 1440, 'height': 900})
        # Click on first food open button using evaluate for absolute marker positioning
        page.evaluate('() => { const btns = document.querySelectorAll(".food-open"); if(btns.length) btns[0].click(); }')
        page.wait_for_timeout(1000)

        popover_visible = page.evaluate('() => { const p = document.querySelector(".food-inline-popover"); return p && !p.hidden && p.classList.contains("is-shown"); }')
        check('11. Clicking food open button opens .food-inline-popover', popover_visible)

        # Check play button inside popover and click to expand video
        play_btn = page.locator('.food-popover-play')
        check('12. Popover contains video play button', play_btn.count() == 1)

        page.evaluate('() => { const b = document.querySelector(".food-popover-play"); if(b) b.click(); }')
        page.wait_for_timeout(1200)

        # Verify video element is created and playing inside popover
        popover_video = page.locator('.food-inline-popover video')
        check('13. Clicking play launches HTML5 video in popover', popover_video.count() == 1)

        # Check video size ratio in popover (video occupies >= 60% of popover height)
        geometry = page.evaluate('''() => {
            const p = document.querySelector('.food-inline-popover');
            const v = p ? p.querySelector('.food-popover-media, video') : null;
            if (!p || !v) return null;
            const pr = p.getBoundingClientRect();
            const vr = v.getBoundingClientRect();
            return {
                popoverHeight: pr.height,
                popoverWidth: pr.width,
                mediaHeight: vr.height,
                mediaWidth: vr.width,
                heightRatio: vr.height / pr.height,
                areaRatio: (vr.width * vr.height) / (pr.width * pr.height)
            };
        }''')
        if geometry:
            h_ratio = geometry.get('heightRatio', 0)
            check('14. Video media occupies at least 2/3 of the complete popover area', geometry.get('areaRatio', 0) >= 2/3, f"heightRatio: {h_ratio:.1%}, areaRatio: {geometry.get('areaRatio',0):.1%}")

        page.screenshot(path=os.path.join(out_dir, 'popover-chaoshan.png'))

        # Test video track stops when switching store
        page.evaluate('() => { const v = document.querySelector(".food-inline-popover video"); if(v) window.__qaPopoverOldVideo = v; }')

        # Click second store button directly via evaluate
        page.evaluate('() => { const btns = document.querySelectorAll(".food-open"); if(btns.length > 1) btns[1].click(); }')
        page.wait_for_timeout(800)

        old_stopped = page.evaluate('() => { const v = window.__qaPopoverOldVideo; return v ? (v.paused && !v.getAttribute("src")) : true; }')
        check('15. Switching to another store unloads and stops old audio/video track', old_stopped)

        # Test pressing Escape closes popover and stops media
        page.keyboard.press('Escape')
        page.wait_for_timeout(600)
        popover_closed = page.evaluate('() => { const p = document.querySelector(".food-inline-popover"); return !p || p.hidden || !p.classList.contains("is-shown"); }')
        check('16. Pressing Escape closes video popover and resets state', popover_closed)

        # Integration regression: exact map counts, state isolation, multi-creator playback,
        # compact screens and geographic search scope. All contexts are disposable.
        ctx = browser.new_context(viewport={'width': 1440, 'height': 960}, reduced_motion='reduce')
        q = ctx.new_page()
        errors = []
        q.on('pageerror', lambda error: errors.append(str(error)))
        for city, expected in [('chongqing',81),('changsha',71),('liuzhou',9),('nanjing',104),('chaoshan',46)]:
            q.goto(f'{base_url}/?city={city}&view=food')
            q.wait_for_function('() => window.foodCityMap?.ready && window.foodCityMap?.food?.active')
            info = q.evaluate('''() => {
                const f=window.foodCityMap.food;
                return {city:f.cityKey,count:f.records.length,saved:f.saved.length};
            }''')
            check(f'Integration: {city} loads correct records without saved-state leakage',
                  info['city']==city and info['count']==expected and info['saved']==0, info)
        q.evaluate('''() => {const f=window.foodCityMap.food;f.saved=f.records.slice(0,2).map(r=>r.id);f.persistSaved();f.refreshSaved();f.setRouteMode('road');}''')
        q.wait_for_function("() => window.foodCityMap.food.routePreview?.phase === 'ready'")
        check('Integration: original-node road network computes a connected trip',
              '沿路约' in q.locator('#trip-dock-caption').inner_text())
        q.goto(f'{base_url}/?city=chongqing&view=food')
        q.wait_for_function('() => window.foodCityMap?.ready && window.foodCityMap?.food?.active')
        check('Integration: Chaoshan wants do not enter Chongqing',q.evaluate('() => window.foodCityMap.food.saved.length')==0)
        q.goto(f'{base_url}/?city=chaoshan&view=food')
        q.wait_for_function('() => window.foodCityMap?.ready && window.foodCityMap?.food?.active')
        check('Integration: Chaoshan wants survive return',q.evaluate('() => window.foodCityMap.food.saved.length')==2)
        for width,height in [(1440,960),(390,844),(320,680),(736,414)]:
            q.set_viewport_size({'width':width,'height':height})
            q.evaluate('''() => {const f=window.foodCityMap.food;const r=f.records.find(r=>r.id==='video-chaoshan-miaojiang-chunmeili');window.foodCityMap.map.jumpTo({center:r.coordinates,zoom:16});document.querySelector('[data-food-id="'+r.id+'"] .food-open').click();}''')
            q.wait_for_function("() => document.querySelector('.food-inline-popover')?.classList.contains('is-shown')")
            q.wait_for_timeout(250)
            shape=q.evaluate('''() => {const p=document.querySelector('.food-inline-popover'),a=p.getBoundingClientRect(),b=p.querySelector('.food-popover-media').getBoundingClientRect();return {area:b.width*b.height/(a.width*a.height),inside:a.left>=0&&a.top>=0&&a.right<=innerWidth+1&&a.bottom<=innerHeight+1,tabs:p.querySelectorAll('.food-popover-clip').length};}''')
            check(f'Integration: {width}x{height} multi-creator area >=2/3 and fits screen',shape['area']>=2/3 and shape['inside'] and shape['tabs']==3,shape)
            q.locator('.food-popover-play').click()
            q.wait_for_function("() => document.querySelector('.food-popover-video')?.currentTime > .1")
            q.evaluate("() => window.__oldMedia=document.querySelector('.food-popover-video')")
            q.locator('.food-popover-clip').nth(1).click()
            check(f'Integration: {width}px switching creator unloads old audio',q.evaluate("() => window.__oldMedia.paused && !window.__oldMedia.getAttribute('src')"))
            q.locator('.food-popover-play').click()
            q.wait_for_function("() => document.querySelector('.food-popover-video')?.currentTime > .1")
            q.screenshot(path=os.path.join(out_dir,f'integration-popup-{width}.png'))
            q.evaluate("() => window.__oldMedia=document.querySelector('.food-popover-video')")
            q.keyboard.press('Escape')
            check(f'Integration: {width}px Escape unloads actively playing video',q.evaluate("() => window.__oldMedia.paused && !window.__oldMedia.getAttribute('src')"))
        q.evaluate("() => window.foodCityMap.videoLibrary.open()")
        q.wait_for_selector('#video-library-dialog[open] .video-map-search')
        for keyword,citycode in [('吴敬平','445100'),('揭阳卢记','445200'),('熹烤','440500')]:
            q.evaluate('''keyword=>{const l=window.foodCityMap.videoLibrary;const source=l.data.sources.find(v=>v.segments.some(s=>s.name.includes(keyword)));const seg=source.segments.find(s=>s.name.includes(keyword));l.renderSource(source.id,seg.id);}''',keyword)
            href=q.locator('.video-map-search').get_attribute('href')
            check(f'Integration: {keyword} searches the correct city',f'city={citycode}' in href,href)
        q.locator('#video-library-close').click()
        check('Integration: no browser page errors',not errors,errors)
        ctx.close()

        browser.close()

finally:
    server_proc.terminate()
    server_proc.wait()
    print('Server terminated.')

out_qa = str(repo / 'output/research/chaoshan/integration-browser-qa-20261110.json')
with open(out_qa, 'w', encoding='utf-8') as f:
    json.dump(checks, f, ensure_ascii=False, indent=2)

passed_count = sum(1 for c in checks if c['passed'])
print(f'\nPlaywright QA Results: {passed_count}/{len(checks)} passed')

if passed_count != len(checks):
    sys.exit(1)
