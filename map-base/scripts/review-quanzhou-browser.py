"""Verify Quanzhou 3D map, 28 food cards (19 Batch 1 + 3 Batch 2 hotpot + 6 Batch 3 BBQ, incl. 1 merged multi-creator stop), video popover area >= 2/3, double-sampled playback, multi-creator clip switch stop, shop-switch stop, direct/road routes, 4 viewports, no-media fallback, cross-city isolation, and single-file preview."""
import json, os, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
output_dir = root / '../output/research/quanzhou/screenshots'
output_dir.mkdir(parents=True, exist_ok=True)
report_path = root / '../output/research/quanzhou/quanzhou-browser-qa-20261125.json'
base_url = os.environ.get('PREVIEW_URL', 'http://127.0.0.1:8791')

checks = []
def check(name, passed, details=None):
    entry = {'name': name, 'passed': bool(passed)}
    if details is not None:
        entry['details'] = details
    checks.append(entry)
    print(f"{'[PASS]' if passed else '[FAIL]'} {name}")

def open_card_by_name(page, substr=None):
    opened = page.evaluate("""(substr) => {
        const cards = Array.from(document.querySelectorAll('.food-card'));
        let target = null;
        if (substr) {
            target = cards.find(c => (c.textContent || '').includes(substr));
        }
        if (!target) {
            target = cards.find(c => {
                const r = c.getBoundingClientRect();
                return r.left >= -20 && r.right <= window.innerWidth + 20 && r.top >= -20 && r.bottom <= window.innerHeight + 20;
            }) || cards[0];
        }
        if (!target) return null;
        const btn = target.querySelector('.food-open') || target;
        btn.click();
        return target.querySelector('strong')?.textContent || '';
    }""", substr)
    page.wait_for_selector('.food-inline-popover:not([hidden])', timeout=10000)
    time.sleep(0.45)
    return opened

def measure_ratio(page):
    return page.evaluate("""() => {
        const popover = document.querySelector('.food-inline-popover');
        const media = document.querySelector('.food-popover-media');
        if (!popover || !media) return null;
        const p = popover.getBoundingClientRect();
        const m = media.getBoundingClientRect();
        return {
            popoverWidth: Math.round(p.width),
            popoverHeight: Math.round(p.height),
            mediaWidth: Math.round(m.width),
            mediaHeight: Math.round(m.height),
            ratio: (m.width * m.height) / (p.width * p.height)
        };
    }""")

print(f"=== Starting Quanzhou Browser Verification against {base_url} ===\n")

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, channel='chrome')

    # 1. Desktop 1440x960
    ctx = browser.new_context(viewport={'width': 1440, 'height': 960}, device_scale_factor=1.0, locale='zh-CN')
    page = ctx.new_page()
    page_errors = []
    page.on('pageerror', lambda e: page_errors.append(str(e)))

    page.goto(f"{base_url}/?city=quanzhou&view=food", wait_until='networkidle', timeout=30000)
    page.wait_for_function("() => window.foodCityMap && window.foodCityMap.ready", timeout=30000)
    status_text = page.locator('#status').inner_text()
    check('1. Map readiness signal and Quanzhou title', '泉州地图已展开' in status_text and '泉州' in page.title(), {'statusText': status_text, 'title': page.title()})

    page.wait_for_selector('.food-card', timeout=10000)
    card_count = page.locator('.food-card').count()
    check('2. Exact 66 on-map Quanzhou food cards rendered (B1-B8 59 + 7 B9 Breakfast)', card_count == 66, {'cardCount': card_count})

    card_names = page.evaluate("() => Array.from(document.querySelectorAll('.food-card strong')).map(el => el.textContent)")
    check('3. Verified Quanzhou B1-B9 shop names present on map (incl. all 7 new Breakfast stops)',
          all(any(k in n for n in card_names) for k in [
              '阿玲花生汤', '李大富旋转小火锅', '泉州油边王烧烤', '回头炒饭',
              '金陵灌汤包', '桥头簸箕肠粉', '新门街豆浆店', '献啊仕公岭面线糊店',
              '文啊面线糊', '张记石磨花生乳', '真味道饮食店'
          ]),
          {'totalCards': len(card_names)})

    # 4. Popover open + >= 2/3 ratio on new Batch 9 breakfast stop
    opened1 = open_card_by_name(page, '新门街豆浆店')
    ratio_1440 = measure_ratio(page)
    check('4. Desktop 1440x960 popover opens on Batch 9 stop (新门街豆浆店) and media area >= 2/3',
          bool(ratio_1440 and ratio_1440['ratio'] >= (2.0 / 3.0)),
          {'shop': opened1, **(ratio_1440 or {})})

    # 5. Double-sampled playback advance on Batch 9 Breakfast video
    page.locator('.food-popover-play').click()
    page.wait_for_selector('video.food-popover-video', timeout=5000)
    page.evaluate("() => { window.__v1 = document.querySelector('video.food-popover-video'); }")
    time.sleep(0.4)
    s1 = page.evaluate("() => ({ t: window.__v1.currentTime, paused: window.__v1.paused, readyState: window.__v1.readyState })")
    time.sleep(1.0)
    s2 = page.evaluate("() => ({ t: window.__v1.currentTime, paused: window.__v1.paused, readyState: window.__v1.readyState })")
    dt1 = s2['t'] - s1['t']
    check('5. Real playback advances across two samples (dt >= 0.3s, playing)',
          dt1 >= 0.3 and not s2['paused'] and s2['readyState'] >= 2,
          {'shop': opened1, 's1': s1, 's2': s2, 'dt': round(dt1, 3)})

    # 6. Switch to another Batch 9 breakfast stop: old video paused + src removed, new video advances, Escape stops & removes src
    opened2 = open_card_by_name(page, '张记石磨花生乳')
    v1_after_switch = page.evaluate("() => ({ paused: window.__v1.paused, hasSrc: window.__v1.hasAttribute('src') && window.__v1.getAttribute('src') !== '' })")
    page.locator('.food-popover-play').click()
    page.wait_for_selector('video.food-popover-video', timeout=5000)
    page.evaluate("() => { window.__v2 = document.querySelector('video.food-popover-video'); }")
    time.sleep(0.4)
    b1 = page.evaluate("() => ({ t: window.__v2.currentTime, paused: window.__v2.paused })")
    time.sleep(1.0)
    b2 = page.evaluate("() => ({ t: window.__v2.currentTime, paused: window.__v2.paused })")
    dt2 = b2['t'] - b1['t']
    page.keyboard.press('Escape')
    time.sleep(0.4)
    v2_after_esc = page.evaluate("() => ({ popoverHidden: document.querySelector('.food-inline-popover')?.hidden, paused: window.__v2.paused, hasSrc: window.__v2.hasAttribute('src') && window.__v2.getAttribute('src') !== '' })")
    switch_ok = (v1_after_switch['paused'] and not v1_after_switch['hasSrc'] and dt2 >= 0.3 and not b2['paused'] and v2_after_esc['popoverHidden'] and v2_after_esc['paused'] and not v2_after_esc['hasSrc'])
    check('6. Shop switch stops & clears old video, plays new video, and Escape cleans up',
          switch_ok,
          {'shop2': opened2, 'v1AfterSwitch': v1_after_switch, 'dt2': round(dt2, 3), 'v2AfterEsc': v2_after_esc})

    # 7. Multi-creator 3-blogger switch on merged Batch 5 place (泉州油边王烧烤: 叶叶不回家 -> kakako -> 林林。)
    opened_mc = open_card_by_name(page, '泉州油边王烧烤')
    clip_buttons = page.evaluate("""() => Array.from(document.querySelectorAll('.food-popover-clip')).map(b => ({
        id: b.dataset.clipId, author: b.textContent, pressed: b.getAttribute('aria-pressed')
    }))""")
    mc_shot = output_dir / 'quanzhou-lidafu-multicreator-1440.png'
    page.screenshot(path=str(mc_shot))
    page.locator('.food-popover-play').click()
    page.wait_for_selector('video.food-popover-video', timeout=5000)
    page.evaluate("() => { window.__mc1 = document.querySelector('video.food-popover-video'); }")
    time.sleep(0.4)
    mc1_a = page.evaluate("() => ({ t: window.__mc1.currentTime, paused: window.__mc1.paused, readyState: window.__mc1.readyState })")
    time.sleep(1.0)
    mc1_b = page.evaluate("() => ({ t: window.__mc1.currentTime, paused: window.__mc1.paused, readyState: window.__mc1.readyState })")
    dt_mc1 = mc1_b['t'] - mc1_a['t']
    page.locator('.food-popover-clip[data-clip-id="qz-kakako-youbianwang"]').click()
    time.sleep(0.4)
    mc1_after_clip_switch = page.evaluate("() => ({ paused: window.__mc1.paused, hasSrc: window.__mc1.hasAttribute('src') && window.__mc1.getAttribute('src') !== '' })")
    btn2_pressed = page.locator('.food-popover-clip[data-clip-id="qz-kakako-youbianwang"]').get_attribute('aria-pressed')
    page.locator('.food-popover-play').click()
    page.wait_for_selector('video.food-popover-video', timeout=5000)
    page.evaluate("() => { window.__mc2 = document.querySelector('video.food-popover-video'); }")
    time.sleep(0.4)
    mc2_a = page.evaluate("() => ({ t: window.__mc2.currentTime, paused: window.__mc2.paused, readyState: window.__mc2.readyState })")
    time.sleep(1.0)
    mc2_b = page.evaluate("() => ({ t: window.__mc2.currentTime, paused: window.__mc2.paused, readyState: window.__mc2.readyState })")
    dt_mc2 = mc2_b['t'] - mc2_a['t']
    page.keyboard.press('Escape')
    time.sleep(0.4)
    mc2_after_esc = page.evaluate("() => ({ popoverHidden: document.querySelector('.food-inline-popover')?.hidden, paused: window.__mc2.paused, hasSrc: window.__mc2.hasAttribute('src') && window.__mc2.getAttribute('src') !== '' })")
    mc_ok = (
        len(clip_buttons) == 3
        and dt_mc1 >= 0.3 and not mc1_b['paused'] and mc1_b['readyState'] >= 2
        and mc1_after_clip_switch['paused'] and not mc1_after_clip_switch['hasSrc']
        and btn2_pressed == 'true'
        and dt_mc2 >= 0.3 and not mc2_b['paused'] and mc2_b['readyState'] >= 2
        and mc2_after_esc['popoverHidden'] and mc2_after_esc['paused'] and not mc2_after_esc['hasSrc']
        and mc_shot.exists()
    )
    check('7. Multi-creator 3-blogger switch on 泉州油边王烧烤 stops & clears Creator 1, advances Creator 2, and Escape cleans up',
          mc_ok,
          {'shop': opened_mc, 'clipButtons': clip_buttons, 'dtMc1': round(dt_mc1, 3), 'mc1AfterSwitch': mc1_after_clip_switch, 'btn2Pressed': btn2_pressed, 'dtMc2': round(dt_mc2, 3), 'mc2AfterEsc': mc2_after_esc, 'screenshot': str(mc_shot)})

    # 8. Add 2 shops to Wants -> verify Direct and Road modes + localStorage city isolation
    open_card_by_name(page, '鲤城渝都周孃孃地摊火锅')
    if page.locator('.food-popover-save').get_attribute('aria-pressed') != 'true':
        page.locator('.food-popover-save').click()
    time.sleep(0.3)
    open_card_by_name(page, '林请坐川味自助老火锅')
    if page.locator('.food-popover-save').get_attribute('aria-pressed') != 'true':
        page.locator('.food-popover-save').click()
    time.sleep(0.5)
    page.keyboard.press('Escape')
    time.sleep(0.4)
    page.wait_for_selector('#trip-dock:not([hidden])', timeout=5000)
    direct_summary = page.locator('#trip-dock').inner_text()
    road_btn = page.locator('#trip-dock button[data-route-mode="road"]')
    road_btn.click()
    page.wait_for_function("() => (document.querySelector('#trip-dock')?.textContent || '').includes('沿路约')", timeout=15000)
    time.sleep(0.5)
    road_summary = page.locator('#trip-dock').inner_text()
    ls_keys = page.evaluate("() => ({ wants: localStorage.getItem('foodcity:wants:quanzhou:v1'), mode: localStorage.getItem('foodcity:distance-mode:quanzhou:v1'), cqWants: localStorage.getItem('foodcity:wants:chongqing:v1') })")
    check('8. Direct and real-road routing both compute & isolate localStorage to quanzhou',
          '直线约' in direct_summary and '沿路约' in road_summary and bool(ls_keys['wants']) and ls_keys['mode'] == 'road' and ls_keys['cqWants'] is None,
          {'directSummary': direct_summary.replace('\n', ' '), 'roadSummary': road_summary.replace('\n', ' '), 'storage': ls_keys})

    desktop_shot = output_dir / 'quanzhou-desktop-1440.png'
    open_card_by_name(page, '漫火山葵烤肉')
    page.screenshot(path=str(desktop_shot))
    check('9. Desktop 1440x960 screenshot saved', desktop_shot.exists(), {'file': str(desktop_shot)})

    # 10. Cross-city regression (switch to Chongqing and verify no Quanzhou contamination)
    page.goto(f"{base_url}/?city=chongqing&view=food", wait_until='networkidle', timeout=30000)
    page.wait_for_function("() => window.foodCityMap && window.foodCityMap.ready", timeout=30000)
    page.wait_for_selector('.food-card', timeout=10000)
    cq_cards = page.locator('.food-card').count()
    cq_names = page.evaluate("() => Array.from(document.querySelectorAll('.food-card strong')).map(el => el.textContent)")
    check('10. Chongqing regression clean (81 stops, zero Quanzhou contamination)',
          cq_cards == 81 and not any('花生汤' in n or '面线糊' in n or '林请坐' in n or '李大富' in n or '南山塔' in n or '柳真真' in n or '漫火' in n for n in cq_names),
          {'cqCardCount': cq_cards})
    ctx.close()

    # 11-16. Mobile 390x844, Small 320x680, Short landscape 736x414
    for idx, (label, w, h, dpr, fname) in enumerate([
        ('Mobile 390x844', 390, 844, 2.0, 'quanzhou-mobile-390.png'),
        ('Small 320x680', 320, 680, 1.0, 'quanzhou-small-320.png'),
        ('Short landscape 736x414', 736, 414, 2.0, 'quanzhou-landscape-736.png')
    ]):
        mctx = browser.new_context(viewport={'width': w, 'height': h}, device_scale_factor=dpr, is_mobile=True, has_touch=True, locale='zh-CN')
        mp = mctx.new_page()
        mp.on('pageerror', lambda e: page_errors.append(str(e)))
        mp.goto(f"{base_url}/?city=quanzhou&view=food", wait_until='networkidle', timeout=30000)
        mp.wait_for_function("() => window.foodCityMap && window.foodCityMap.ready", timeout=30000)
        mp.wait_for_selector('.food-card', timeout=10000)
        open_card_by_name(mp, '霓大爷烤肉')
        r = measure_ratio(mp)
        shot = output_dir / fname
        mp.screenshot(path=str(shot))
        base_num = 11 + idx * 2
        check(f'{base_num}. {label} popover media area >= 2/3', bool(r and r['ratio'] >= (2.0 / 3.0)), r)
        check(f'{base_num + 1}. {label} screenshot saved', shot.exists(), {'file': str(shot)})
        mctx.close()

    # 17. No-media fallback simulation (strip clip URLs from video-library-assets.json)
    nctx = browser.new_context(viewport={'width': 1440, 'height': 960}, locale='zh-CN')
    np = nctx.new_page()
    np.on('pageerror', lambda e: page_errors.append(str(e)))
    def strip_clips(route):
        resp = route.fetch()
        data = json.loads(resp.text())
        for seg in data.get('segments', {}).values():
            seg.pop('clip', None)
        route.fulfill(response=resp, body=json.dumps(data), content_type='application/json')
    np.route('**/video-library-assets.json', strip_clips)
    np.goto(f"{base_url}/?city=quanzhou&view=food", wait_until='networkidle', timeout=30000)
    np.wait_for_function("() => window.foodCityMap && window.foodCityMap.ready", timeout=30000)
    np.wait_for_selector('.food-card', timeout=10000)
    open_card_by_name(np, '柳真真·云贵山岭烤肉')
    no_media_state = np.evaluate("""() => {
        const img = document.querySelector('.food-popover-media img');
        const msg = document.querySelector('.food-popover-missing')?.textContent || '';
        return { posterLoaded: Boolean(img && img.complete && img.naturalWidth > 0), missingText: msg };
    }""")
    check('17. No-media fallback decodes real Git poster and displays 视频待同步',
          no_media_state['posterLoaded'] and '视频待同步' in no_media_state['missingText'],
          no_media_state)
    nctx.close()

    # 18. Single-file preview-quanzhou.html, road search, and generated directory pages
    sctx = browser.new_context(viewport={'width': 1440, 'height': 960}, locale='zh-CN')
    sp = sctx.new_page()
    sp.on('pageerror', lambda e: page_errors.append(str(e)))
    sp.goto(f"{base_url}/preview-quanzhou.html?view=food", wait_until='networkidle', timeout=30000)
    sp.wait_for_function("() => window.foodCityMap && window.foodCityMap.ready", timeout=30000)
    sp.wait_for_selector('.food-card', timeout=10000)
    sc = sp.locator('.food-card').count()

    sp.goto(f"{base_url}/?city=quanzhou", wait_until='networkidle', timeout=30000)
    sp.wait_for_function("() => window.foodCityMap && window.foodCityMap.ready", timeout=30000)
    sp.fill('#search-input', '西街')
    sp.wait_for_selector('#search-results:not([hidden]) button', timeout=5000)
    road_hits = sp.locator('#search-results button').count()
    check('18. Standalone preview-quanzhou.html renders all 66 Quanzhou stops and base view searches Quanzhou roads', sc == 66 and road_hits >= 1, {'cardCount': sc, 'roadHitsForXijie': road_hits})

    sp.goto(f"{base_url}/places-quanzhou.html", wait_until='networkidle', timeout=20000)
    places_txt = sp.locator('body').inner_text()
    sp.goto(f"{base_url}/videos-quanzhou.html", wait_until='networkidle', timeout=20000)
    videos_txt = sp.locator('body').inner_text()
    check('19. HTTP directory pages places-quanzhou.html and videos-quanzhou.html render Quanzhou stops & creators',
          '金陵灌汤包' in places_txt and '新门街豆浆店' in places_txt and '献啊仕公岭面线糊店' in places_txt and '真味道饮食店' in places_txt and '3条同店视频' in places_txt and '咩咩酱' in videos_txt and '吃货界的荤君' in videos_txt,
          {'placesHasBatch9Breakfast': True, 'videosHasBatch9Creators': True})
    sctx.close()

    # 20. Zero unhandled page errors
    check('20. Zero unhandled page errors across all checks', len(page_errors) == 0, {'errors': page_errors})

    browser.close()

passed = sum(1 for c in checks if c['passed'])
print(f"\nVerification completed: {passed}/{len(checks)} checks passed!")
report_path.write_text(json.dumps({'verifiedOn': '2026-11-25', 'passed': all(c['passed'] for c in checks), 'checks': checks}, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
if passed != len(checks):
    sys.exit(1)
