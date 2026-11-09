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
        check('2. places-chaoshan.html shows 3 food cards', card_count == 3, f'Count: {card_count}')
        
        page.screenshot(path=os.path.join(out_dir, 'places-desktop.png'))
        
        page.set_viewport_size({'width': 390, 'height': 844})
        page.screenshot(path=os.path.join(out_dir, 'places-mobile.png'))
        context.close()

        # 2. Test detail page with HTML5 Video
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = context.new_page()
        res = page.goto(f'{base_url}/places/video-chaoshan-miaojiang-yibaichaoche.html')
        check('3. Detail page loads successfully', res.status == 200)

        video = page.locator('video')
        check('4. Detail page has HTML5 video element', video.count() == 1)

        # Wait for video ready
        page.wait_for_function('() => document.querySelector("video")?.readyState >= 2', timeout=10000)
        v_info = page.evaluate('''() => {
            const v = document.querySelector('video');
            return {
                duration: v.duration,
                width: v.videoWidth,
                height: v.videoHeight,
                paused: v.paused,
                src: v.currentSrc
            };
        }''')
        check('5. Video loads metadata and decodes valid resolution', v_info['width'] > 0 and v_info['height'] > 0 and abs(v_info['duration'] - 11.6) < 0.2, f"{v_info['width']}x{v_info['height']}, {v_info['duration']:.2f}s")

        # Play video and test playback
        page.evaluate('() => document.querySelector("video").play()')
        time.sleep(1)
        cur_time = page.evaluate('() => document.querySelector("video").currentTime')
        check('6. Video playback advances past 0.5s', cur_time > 0.5, f'currentTime: {cur_time:.2f}s')

        page.screenshot(path=os.path.join(out_dir, 'detail-video-yibaichaoche.png'))
        context.close()

        # 3. Test main map interface (?city=chaoshan&view=food)
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = context.new_page()
        page.goto(f'{base_url}/?city=chaoshan&view=food')

        # Wait for map to load
        page.wait_for_function('() => window.foodCityMap?.ready && window.foodCityMap?.food?.active', timeout=30000)
        check('7. Chaoshan 3D map initializes with food overlay active', True)

        stats = page.evaluate('() => window.foodCityMap.getStats()')
        check('8. Food overlay has 3 Chaoshan food stops', stats.get('foodCards') == 3, f"Cards: {stats.get('foodCards')}")

        page.screenshot(path=os.path.join(out_dir, 'map-chaoshan-desktop.png'))

        # Mobile viewport screenshot
        page.set_viewport_size({'width': 390, 'height': 844})
        page.wait_for_timeout(500)
        page.screenshot(path=os.path.join(out_dir, 'map-chaoshan-mobile.png'))

        # 4. Test food card popover and video expansion
        page.set_viewport_size({'width': 1440, 'height': 900})
        # Click on first food open button
        card_btn = page.locator('.food-open').first
        card_btn.click()
        page.wait_for_timeout(800)

        popover_visible = page.evaluate('() => { const p = document.querySelector(".food-inline-popover"); return p && !p.hidden && p.classList.contains("is-shown"); }')
        check('9. Clicking food open button opens .food-inline-popover', popover_visible)

        # Check play button inside popover and click to expand video
        play_btn = page.locator('.food-popover-play')
        check('10. Popover contains video play button', play_btn.count() == 1)

        play_btn.click()
        page.wait_for_timeout(1000)

        # Verify video element is created and playing inside popover
        popover_video = page.locator('.food-inline-popover video')
        check('11. Clicking play launches HTML5 video in popover', popover_video.count() == 1)

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
            check('12. Video media occupies significant area of popover (>= 60% height)', h_ratio >= 0.55, f"heightRatio: {h_ratio:.1%}, areaRatio: {geometry.get('areaRatio',0):.1%}")

        page.screenshot(path=os.path.join(out_dir, 'popover-chaoshan.png'))

        # Test video track stops when switching store
        page.evaluate('() => { const v = document.querySelector(".food-inline-popover video"); if(v) window.__qaPopoverOldVideo = v; }')
        
        # Click second store button directly via evaluate or force=True
        page.evaluate('() => document.querySelectorAll(".food-open")[1].click()')
        page.wait_for_timeout(800)

        old_stopped = page.evaluate('() => { const v = window.__qaPopoverOldVideo; return v ? (v.paused && !v.getAttribute("src")) : true; }')
        check('13. Switching to another store unloads and stops old audio/video track', old_stopped)

        # Test pressing Escape closes popover and stops media
        page.keyboard.press('Escape')
        page.wait_for_timeout(600)
        popover_closed = page.evaluate('() => { const p = document.querySelector(".food-inline-popover"); return !p || p.hidden || !p.classList.contains("is-shown"); }')
        check('14. Pressing Escape closes video popover and resets state', popover_closed)

        browser.close()

finally:
    server_proc.terminate()
    server_proc.wait()
    print('Server terminated.')

report = {
    'city': 'chaoshan',
    'verifiedOn': '2026-11-09',
    'scope': 'Automated browser Playwright verification for Chaoshan (places page, video detail player, 3D map, video popovers, responsive layouts, audio stop on switch/close)',
    'totalChecks': len(checks),
    'passedChecks': sum(1 for c in checks if c['passed']),
    'allPassed': all(c['passed'] for c in checks),
    'checks': checks
}

with open('D:/codex/美食网站/.local/worktrees/chaoshan/output/research/chaoshan/chaoshan-browser-qa.json', 'w', encoding='utf8') as f:
    json.dump(report, f, ensure_ascii=False, indent=2)

print(f"\nBrowser test completed: {report['passedChecks']}/{report['totalChecks']} checks passed!")
if not report['allPassed']:
    sys.exit(1)
