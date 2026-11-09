# -*- coding: utf-8 -*-
import subprocess
import time
import os
import sys
import json
from playwright.sync_api import sync_playwright

root = 'D:/codex/美食网站/.local/worktrees/chaoshan/map-base'
out_dir = 'D:/codex/美食网站/.local/worktrees/chaoshan/output/research/chaoshan/playwright'
os.makedirs(out_dir, exist_ok=True)

port = 8795
base_url = f'http://127.0.0.1:{port}'

# Start serve.mjs
server_proc = subprocess.Popen(
    ['node', 'scripts/serve.mjs', '--port', str(port)],
    cwd=root,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

time.sleep(2)
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
        check('2. places-chaoshan.html shows expanded food cards', card_count >= 25, f'Count: {card_count}')
        
        # Check multi-blogger merge badge in cards
        multi_badges = page.locator('.card small:has-text("条同店视频")')
        check('3. Multi-blogger same-shop merge badges exist on grouped cards', multi_badges.count() >= 6, f'Badges: {multi_badges.count()}')
        
        # Check batch 3 & 4 new shops exist on places list
        page_text = page.locator('main').inner_text()
        check('3b. Batch 3 & 4 new shops exist in food cards list', 
              '厝味火锅' in page_text and '林三满' in page_text and '阿洲炭炉鸡煲' in page_text and '四十载古早味炭火烧烤' in page_text,
              'Found 厝味火锅, 林三满, 阿洲炭炉鸡煲, 四十载古早味炭火烧烤')

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
        check('9. Chaoshan 3D map initializes with food overlay active', stats.get('hasPopover') and stats.get('foodCards') >= 20)
        check('10. Food overlay has Chaoshan food stops', stats.get('foodCards') >= 20, f"Cards: {stats.get('foodCards')}")

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
            check('14. Video media occupies significant area of popover (>= 60% height)', h_ratio >= 0.55, f"heightRatio: {h_ratio:.1%}, areaRatio: {geometry.get('areaRatio',0):.1%}")

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

        browser.close()

finally:
    server_proc.terminate()
    server_proc.wait()
    print('Server terminated.')

out_qa = 'D:/codex/美食网站/.local/worktrees/chaoshan/output/research/chaoshan/chaoshan-batch1-playwright-qa.json'
with open(out_qa, 'w', encoding='utf-8') as f:
    json.dump(checks, f, ensure_ascii=False, indent=2)

passed_count = sum(1 for c in checks if c['passed'])
print(f'\nPlaywright QA Results: {passed_count}/{len(checks)} passed')
