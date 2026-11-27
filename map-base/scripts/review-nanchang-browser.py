"""Verify Nanchang map, progressive cards, popover (>=2/3 + in viewport), double-sample playback, stop-audio on switch/Escape, straight vs road routing, standalone bundle, pages, and cross-city isolation."""
import json, os, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
output_dir = root / '../output/playwright/nanchang'
output_dir.mkdir(parents=True, exist_ok=True)
report_path = root / '../output/research/nanchang/nanchang-browser-qa-20261127.json'
report_path.parent.mkdir(parents=True, exist_ok=True)

base_url = os.environ.get('PREVIEW_URL', 'http://127.0.0.1:8799').rstrip('/')
checks = []

def check(name, passed, details=None):
    entry = {'name': name, 'passed': bool(passed)}
    if details is not None:
        entry['details'] = details
    checks.append(entry)
    print(f"{'[PASS]' if passed else '[FAIL]'} {name}")

def open_visible_card(page, prefer_text=None):
    opened = page.evaluate("""(prefer) => {
        const cards = Array.from(document.querySelectorAll('.food-card'));
        let target = prefer ? cards.find(c => (c.textContent || '').includes(prefer)) : null;
        if (!target) {
            target = cards.find(c => {
                const r = c.getBoundingClientRect();
                return r.left >= 0 && r.right <= window.innerWidth && r.top >= 0 && r.bottom <= window.innerHeight;
            }) || cards[0];
        }
        if (!target) return null;
        const btn = target.querySelector('.food-open') || target;
        btn.click();
        return target.querySelector('strong')?.textContent || '';
    }""", prefer_text)
    page.wait_for_selector('.food-inline-popover:not([hidden])', timeout=10000)
    time.sleep(0.4)
    return opened

def check_popover_box(page):
    return page.evaluate("""() => {
        const popover = document.querySelector('.food-inline-popover');
        const media = document.querySelector('.food-popover-media');
        if (!popover || !media) return null;
        const pRect = popover.getBoundingClientRect();
        const mRect = media.getBoundingClientRect();
        const pArea = pRect.width * pRect.height;
        const mArea = mRect.width * mRect.height;
        return {
            inViewport: pRect.left >= 0 && pRect.top >= 0 && pRect.right <= window.innerWidth + 1 && pRect.bottom <= window.innerHeight + 1,
            pRect: { left: pRect.left, top: pRect.top, right: pRect.right, bottom: pRect.bottom, width: pRect.width, height: pRect.height },
            viewport: { width: window.innerWidth, height: window.innerHeight },
            ratio: pArea > 0 ? mArea / pArea : 0
        };
    }""")

with sync_playwright() as pw:
    browser = pw.chromium.launch(channel='msedge', headless=True)

    # 1. Desktop 1440x960 in Food Mode
    ctx = browser.new_context(viewport={'width': 1440, 'height': 960}, device_scale_factor=1.0, locale='zh-CN')
    page = ctx.new_page()
    page_errors = []
    page.on('pageerror', lambda e: page_errors.append(str(e)))

    page.goto(f"{base_url}/?city=nanchang&view=food", wait_until='networkidle', timeout=30000)
    page.wait_for_function("() => window.foodCityMap && window.foodCityMap.ready", timeout=30000)
    status_text = page.locator('#status').inner_text()
    title = page.title()
    check('1. Map readiness signal and Nanchang title',
          '食途 · 南昌地图' in title and '南昌' in status_text,
          {'title': title, 'statusText': status_text})

    page.wait_for_selector('.food-card', timeout=10000)
    card_count = page.locator('.food-card').count()
    check('2. Nanchang renders 26 on-map food cards', card_count == 26, {'cardCount': card_count})

    card_names = page.evaluate("() => Array.from(document.querySelectorAll('.food-card strong')).map(el => el.textContent)")
    check('3. Authentic Nanchang shop names visible',
          any('小罗子' in n for n in card_names) and any('南昌里' in n for n in card_names) and any('椿椒' in n for n in card_names),
          {'sample': card_names[:8]})

    # Popover open + >= 2/3 ratio + in viewport
    open_visible_card(page, '小罗子')
    box_1440 = check_popover_box(page)
    check('4. Desktop 1440x960 popover visible, in viewport, and media ratio >= 2/3',
          box_1440 and box_1440['inViewport'] and box_1440['ratio'] >= (2.0 / 3.0),
          box_1440)

    # 5. Double-sample playback advance (dt >= 0.3s && !paused)
    page.locator('.food-popover-play').click()
    page.wait_for_selector('video.food-popover-video', timeout=8000)
    page.evaluate("() => { window.__v1 = document.querySelector('video.food-popover-video'); }")
    time.sleep(0.4)
    t1 = page.evaluate("() => ({ t: window.__v1.currentTime, paused: window.__v1.paused })")
    time.sleep(0.8)
    t2 = page.evaluate("() => ({ t: window.__v1.currentTime, paused: window.__v1.paused })")
    dt1 = t2['t'] - t1['t']
    check('5. Double-sample playback advances (dt >= 0.3s && !paused)',
          dt1 >= 0.3 and not t2['paused'],
          {'t1': t1, 't2': t2, 'dt': dt1})

    # 6. Switch to another shop while playing -> retained old video paused & src removed, new video plays & advances
    open_visible_card(page, '南昌里')
    old1 = page.evaluate("""() => {
        const v = window.__v1;
        return { paused: v ? v.paused : false, src: v ? v.getAttribute('src') : 'missing' };
    }""")
    page.locator('.food-popover-play').click()
    page.wait_for_selector('video.food-popover-video', timeout=8000)
    page.evaluate("() => { window.__v2 = document.querySelector('video.food-popover-video'); }")
    time.sleep(0.4)
    s1 = page.evaluate("() => ({ t: window.__v2.currentTime, paused: window.__v2.paused })")
    time.sleep(0.8)
    s2 = page.evaluate("() => ({ t: window.__v2.currentTime, paused: window.__v2.paused })")
    dt2 = s2['t'] - s1['t']
    check('6. Switching shop pauses old video, removes src, and new video advances (&& assertion)',
          bool(old1['paused'] and not old1['src'] and dt2 >= 0.3 and not s2['paused']),
          {'old1': old1, 'dt2': dt2, 's2': s2})

    # 7. Escape closes popover and cleans up retained old video reference
    page.keyboard.press('Escape')
    time.sleep(0.4)
    old2 = page.evaluate("""() => {
        const v = window.__v2;
        const p = document.querySelector('.food-inline-popover');
        return { hidden: p ? p.hidden : false, paused: v ? v.paused : false, src: v ? v.getAttribute('src') : 'missing' };
    }""")
    check('7. Escape hides popover, pauses retained video, and removes src',
          bool(old2['hidden'] and old2['paused'] and not old2['src']),
          old2)

    # 8. 3-stop straight vs road route switching across Ganjiang
    page.evaluate("""() => {
        const f = window.foodCityMap.food;
        for (const id of ['video-nc-fanqiejiangjiang-xiaoluozi', 'video-nc-wangxun-nanchangli', 'video-nc-tczhongguo-chunjiao']) {
            if (!f.saved.includes(id)) f.toggleSave(id);
        }
    }""")
    time.sleep(0.3)
    direct_stats = page.evaluate("() => window.foodCityMap.food.routePreview.getStats()")
    page.locator('[data-route-mode="road"]').click()
    page.wait_for_function("() => window.foodCityMap.food.routePreview.phase === 'ready'", timeout=20000)
    road_stats = page.evaluate("() => window.foodCityMap.food.routePreview.getStats()")
    road_badges = page.evaluate("() => Array.from(document.querySelectorAll('.food-distance-badge')).map(e => e.textContent)")
    check('8. 3-stop straight vs road toggle computes real cross-Ganjiang road legs',
          direct_stats['mode'] == 'direct' and direct_stats['count'] == 2 and
          road_stats['mode'] == 'road' and road_stats['phase'] == 'ready' and road_stats['count'] == 2 and
          road_stats['total'] > direct_stats['total'] and all('沿路' in b for b in road_badges),
          {'direct': direct_stats, 'road': road_stats, 'badges': road_badges})

    page.screenshot(path=str(output_dir / 'nanchang-desktop-1440.png'), full_page=False)
    check('9. Desktop 1440x960 screenshot saved', (output_dir / 'nanchang-desktop-1440.png').stat().st_size > 10000)

    # 10. Video library search & 4 creators (including out-of-bounds 熊庆彬 & unlocated 地铁A口鸡蛋汉堡)
    page.click('#food-pick-open')
    page.wait_for_selector('#food-pick-dialog[open]', timeout=5000)
    page.click('#video-library-open')
    page.wait_for_selector('#video-library-dialog[open]', timeout=5000)
    page.wait_for_selector('#video-library-sources .video-source-tab', timeout=10000)
    tab_counts = {}
    tabs = page.locator('#video-library-sources .video-source-tab')
    for ti in range(tabs.count()):
        tab_text = tabs.nth(ti).inner_text().strip()
        tabs.nth(ti).click()
        time.sleep(0.25)
        tab_counts[tab_text] = page.locator('#video-library-grid .video-clip-card').count()
    page.evaluate("""() => {
        const tabs = Array.from(document.querySelectorAll('#video-library-sources .video-source-tab'));
        const t = tabs.find(el => el.textContent.includes('一坨小草莓'));
        if (t) t.click();
    }""")
    time.sleep(0.25)
    page.fill('#video-library-search', '熊庆彬')
    time.sleep(0.3)
    filtered_names = page.evaluate("() => Array.from(document.querySelectorAll('#video-library-grid .video-clip-card strong')).map(e => e.textContent.trim())")
    check('10. Video library displays all 4 creator tabs (28 clips total) and filters out-of-bounds 熊庆彬',
          len(tab_counts) == 4 and sum(tab_counts.values()) == 28 and any('熊庆彬' in n for n in filtered_names),
          {'tabCounts': tab_counts, 'filtered': filtered_names})
    page.click('#video-library-close')
    page.evaluate("() => { const d = document.getElementById('food-pick-dialog'); if (d?.open) d.close(); }")

    # 11. Cross-city switch regression (chongqing -> wuhan -> zhengzhou -> nanchang)
    switched = {}
    for cid in ['chongqing', 'wuhan', 'zhengzhou', 'nanchang']:
        page.select_option('.city-chip select', cid)
        page.wait_for_function("(expected) => window.foodCityMap && window.foodCityMap.ready && window.foodCityMap.city?.name", arg=cid, timeout=30000)
        time.sleep(0.5)
        switched[cid] = page.evaluate("() => ({ name: window.foodCityMap.city.name, cards: document.querySelectorAll('.food-card').length })")
    check('11. Cross-city switches isolate city names and card counts with 0 contamination',
          switched['chongqing']['name'] == '重庆' and switched['wuhan']['name'] == '武汉' and switched['zhengzhou']['name'] == '郑州' and switched['nanchang']['name'] == '南昌' and switched['nanchang']['cards'] == 26,
          switched)
    ctx.close()

    # 12. Street mode road search (?city=nanchang)
    ctx_st = browser.new_context(viewport={'width': 1440, 'height': 960}, locale='zh-CN')
    p_st = ctx_st.new_page()
    p_st.goto(f"{base_url}/?city=nanchang", wait_until='networkidle', timeout=30000)
    p_st.wait_for_function("() => window.foodCityMap && window.foodCityMap.ready", timeout=30000)
    p_st.fill('#search-input', '八一大道')
    p_st.wait_for_selector('#search-results button', timeout=5000)
    road_res = p_st.evaluate("() => Array.from(document.querySelectorAll('#search-results button span')).map(e => e.textContent.trim())")
    check('12. Street mode road search returns Nanchang roads containing 八一大道',
          any('八一大道' in r for r in road_res),
          {'results': road_res[:5]})
    ctx_st.close()

    # 13-15. Responsive viewports: 390x844, 320x680, 736x414
    for idx, (w, h, dpr, fname) in enumerate([
        (390, 844, 2.0, 'nanchang-mobile-390.png'),
        (320, 680, 1.0, 'nanchang-small-320.png'),
        (736, 414, 2.0, 'nanchang-landscape-736.png'),
    ], start=13):
        c_vp = browser.new_context(viewport={'width': w, 'height': h}, device_scale_factor=dpr, is_mobile=True, has_touch=True, locale='zh-CN')
        p_vp = c_vp.new_page()
        p_vp.goto(f"{base_url}/?city=nanchang&view=food", wait_until='networkidle', timeout=30000)
        p_vp.wait_for_function("() => window.foodCityMap && window.foodCityMap.ready", timeout=30000)
        p_vp.wait_for_selector('.food-card', timeout=10000)
        open_visible_card(p_vp)
        box = check_popover_box(p_vp)
        p_vp.screenshot(path=str(output_dir / fname))
        check(f"{idx}. Viewport {w}x{h} popover in viewport & media ratio >= 2/3",
              box and box['inViewport'] and box['ratio'] >= (2.0 / 3.0) and (output_dir / fname).stat().st_size > 10000,
              box)
        c_vp.close()

    # 16. Standalone offline bundle preview-nanchang.html
    c_off = browser.new_context(viewport={'width': 1440, 'height': 960}, locale='zh-CN')
    p_off = c_off.new_page()
    p_off.goto(f"{base_url}/preview-nanchang.html?view=food", wait_until='networkidle', timeout=30000)
    p_off.wait_for_function("() => window.foodCityMap && window.foodCityMap.ready", timeout=30000)
    p_off.wait_for_selector('.food-card', timeout=5000)
    off_cards = p_off.locator('.food-card').count()
    check('16. Standalone preview-nanchang.html renders 26 food cards', off_cards == 26, {'offCards': off_cards})
    c_off.close()

    # 17. videos-nanchang.html & places-nanchang.html pages
    c_pg = browser.new_context(viewport={'width': 1440, 'height': 960}, locale='zh-CN')
    p_pg = c_pg.new_page()
    p_pg.goto(f"{base_url}/videos-nanchang.html", wait_until='networkidle', timeout=20000)
    vid_cards = p_pg.locator('.card').count()
    p_pg.goto(f"{base_url}/places-nanchang.html", wait_until='networkidle', timeout=20000)
    place_cards = p_pg.locator('.card').count()
    p_pg.goto(f"{base_url}/places/video-nc-tczhongguo-chunjiao.html", wait_until='networkidle', timeout=20000)
    has_video = p_pg.locator('video').count() == 1
    check('17. videos-nanchang.html, places-nanchang.html (28 cards) and detail page render cleanly',
          vid_cards == 28 and place_cards == 28 and has_video,
          {'vidCards': vid_cards, 'placeCards': place_cards, 'hasVideo': has_video})
    c_pg.close()

    check('18. Zero unhandled page errors', len(page_errors) == 0, {'errors': page_errors})
    browser.close()

passed_count = sum(1 for c in checks if c['passed'])
total_count = len(checks)
print(f"\n=== Nanchang Browser Verification Summary: {passed_count}/{total_count} PASSED ===")
report = {
    'city': 'nanchang',
    'verifiedAt': time.strftime('%Y-%m-%d %H:%M:%S'),
    'previewUrl': base_url,
    'total': total_count,
    'passed': passed_count,
    'checks': checks,
}
report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf8')
if passed_count != total_count:
    sys.exit(1)
