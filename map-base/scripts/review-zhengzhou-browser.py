"""Verify Zhengzhou map base, food cards, video popover, ratio >= 2/3, playback, and multi-creator switcher in headless browser with Playwright."""
import json, os, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
output_dir = root / '../output/playwright/zhengzhou'
output_dir.mkdir(parents=True, exist_ok=True)
report_path = root / '../output/research/zhengzhou/zhengzhou-browser-qa-20261116.json'
report_path.parent.mkdir(parents=True, exist_ok=True)

base_url = os.environ.get('PREVIEW_URL', 'http://127.0.0.1:8798')

checks = []
def check(name, passed, details=None):
    entry = {'name': name, 'passed': bool(passed)}
    if details:
        entry['details'] = details
    checks.append(entry)
    status = '[PASS]' if passed else '[FAIL]'
    print(f"{status} {name}")

def open_first_visible_popover(target_page):
    target_page.evaluate("""() => {
        const visibleCard = Array.from(document.querySelectorAll('.food-card')).find(c => {
            const r = c.getBoundingClientRect();
            return r.left >= -20 && r.right <= window.innerWidth + 20 && r.top >= -20 && r.bottom <= window.innerHeight + 20;
        }) || document.querySelector('.food-card');
        if (visibleCard) {
            const btn = visibleCard.querySelector('.food-open') || visibleCard;
            btn.click();
        }
    }""")
    target_page.wait_for_selector('.food-inline-popover:not([hidden])', timeout=10000)
    time.sleep(0.5)

print(f"=== Starting Zhengzhou Browser UI, Food Markers & Video Verification against {base_url} ===\n")

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    
    # 1. Desktop 1440x960 verification in Food Mode
    context_desktop = browser.new_context(
        viewport={'width': 1440, 'height': 960},
        device_scale_factor=1.0,
        locale='zh-CN'
    )
    page = context_desktop.new_page()
    page_errors = []
    console_errors = []
    page.on('pageerror', lambda e: page_errors.append(str(e)))
    page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)

    url = f"{base_url}/?city=zhengzhou&view=food"
    page.goto(url, wait_until='networkidle', timeout=30000)
    
    # Wait for map ready signal
    page.wait_for_function("() => window.foodCityMap && window.foodCityMap.ready", timeout=30000)
    
    status_text = page.locator('#status').inner_text()
    title = page.title()
    check('1. Map readiness signal and Zhengzhou title', 
          '食途 · 郑州地图' in title and '郑州地图已展开' in status_text, 
          {'title': title, 'statusText': status_text})
    
    # Check food markers rendered on map (140 on-map stops: 169 total segments - 14 out-of-bounds - 15 merged places)
    page.wait_for_selector('.food-card', timeout=10000)
    food_cards = page.locator('.food-card')
    card_count = food_cards.count()
    check('2. Food cards rendered on map for Zhengzhou (140 on-map stops)', 
          card_count == 140, {'cardCount': card_count})
    
    # Verify shop names in cards
    card_names = page.evaluate("() => Array.from(document.querySelectorAll('.food-card strong')).map(el => el.textContent)")
    check('3. Shop names match real Zhengzhou establishments across districts', 
          any('合记' in n for n in card_names) and any('知青' in n for n in card_names) and any('唐风阁' in n or '小锅烀饼' in n or '方老祖' in n or '四厂' in n for n in card_names), 
          {'cardNames': card_names[:10]})

    # Open first food card popover
    open_first_visible_popover(page)

    popover_visible = page.locator('.food-inline-popover').is_visible()
    check('4. Video popover opens on card click', popover_visible)

    # 5. Ratio assertion: media box area >= 2/3 of popover border box
    ratio_info = page.evaluate('''() => {
        const popover = document.querySelector('.food-inline-popover');
        const media = document.querySelector('.food-popover-media');
        if (!popover || !media) return null;
        const pRect = popover.getBoundingClientRect();
        const mRect = media.getBoundingClientRect();
        const pArea = pRect.width * pRect.height;
        const mArea = mRect.width * mRect.height;
        const ratio = mArea / pArea;
        return {
            popoverWidth: pRect.width,
            popoverHeight: pRect.height,
            popoverArea: pArea,
            mediaWidth: mRect.width,
            mediaHeight: mRect.height,
            mediaArea: mArea,
            ratio: ratio
        };
    }''')
    check('5. Floating window media area >= 2/3 of border box', 
          ratio_info and ratio_info['ratio'] >= (2.0 / 3.0), ratio_info)

    # 6. Video playback test: click play button
    play_btn = page.locator('.food-popover-play')
    if play_btn.is_visible():
        play_btn.click()
        page.wait_for_selector('video.food-popover-video', timeout=5000)
        
        # Store reference to old video in window
        page.evaluate("() => { window.__testedVideo1 = document.querySelector('video.food-popover-video'); }")
        
        # Two-sample advance check
        t1 = page.evaluate("() => ({ t: window.__testedVideo1.currentTime, paused: window.__testedVideo1.paused })")
        time.sleep(1.0)
        t2 = page.evaluate("() => ({ t: window.__testedVideo1.currentTime, paused: window.__testedVideo1.paused })")
        adv = (t2['t'] - t1['t']) if (t2 and t1) else 0
        adv_ok = adv >= 0.3 and not t2['paused']
        check('6. Video mounts and playback advances time across two samples (dt >= 0.3s)', 
              adv_ok, {'t1': t1, 't2': t2, 'advance': adv})

        # 7. Unmount and stop sound on close/Escape (retaining old video reference)
        page.keyboard.press('Escape')
        time.sleep(0.5)
        old_state = page.evaluate('''() => {
            const v = window.__testedVideo1;
            const popover = document.querySelector('.food-inline-popover');
            return {
                popoverHidden: popover ? popover.hidden : true,
                paused: v ? v.paused : true,
                hasSrc: v ? (v.hasAttribute('src') && v.getAttribute('src') !== '') : false,
                srcVal: v ? v.getAttribute('src') : null
            };
        }''')
        check('7. Retained old video reference is paused, src removed, and popover closed on Escape', 
              old_state['popoverHidden'] and not old_state['hasSrc'] and old_state['paused'], 
              old_state)
    else:
        check('6. Video play button present', False)
        check('7. Video unmount check', False)

    # 8. Multi-creator shop switcher test for 合记烩面（人民路店）
    # Click card, play creator 1 (15再吃亿点儿), retain reference, click creator 2 (倍增CD了), verify old paused and new playing, then close
    multi_creator_test = page.evaluate('''() => {
        const cards = Array.from(document.querySelectorAll('.food-card'));
        const target = cards.find(c => (c.textContent || '').includes('合记'));
        if (!target) return { found: false };
        const btn = target.querySelector('.food-open') || target;
        btn.click();
        const clipButtons = Array.from(document.querySelectorAll('.food-popover-clip'));
        return {
            found: true,
            title: target.querySelector('strong')?.textContent,
            clipCount: clipButtons.length,
            authors: clipButtons.map(b => b.textContent)
        };
    }''')
    if multi_creator_test['found'] and multi_creator_test['clipCount'] >= 2:
        page.wait_for_selector('.food-inline-popover:not([hidden])')
        play_btn2 = page.locator('.food-popover-play')
        if play_btn2.is_visible():
            play_btn2.click()
        page.wait_for_selector('video.food-popover-video', timeout=5000)
        page.evaluate("() => { window.__creatorVideo1 = document.querySelector('video.food-popover-video'); }")
        time.sleep(0.5)
        c1_t1 = page.evaluate("() => window.__creatorVideo1 ? window.__creatorVideo1.currentTime : 0")
        time.sleep(0.8)
        c1_t2 = page.evaluate("() => window.__creatorVideo1 ? window.__creatorVideo1.currentTime : 0")
        
        # Switch to creator 2
        clip_btns = page.locator('.food-popover-clip')
        clip_btns.nth(1).click()
        time.sleep(0.5)
        play_btn_c2 = page.locator('.food-popover-play')
        if play_btn_c2.is_visible():
            play_btn_c2.click()
            page.wait_for_selector('video.food-popover-video', timeout=5000)
        
        c1_after = page.evaluate('''() => {
            const v1 = window.__creatorVideo1;
            return {
                paused: v1 ? v1.paused : true,
                hasSrc: v1 ? (v1.hasAttribute('src') && v1.getAttribute('src') !== '') : false
            };
        }''')
        page.evaluate("() => { window.__creatorVideo2 = document.querySelector('video.food-popover-video'); }")
        time.sleep(0.5)
        c2_t1 = page.evaluate("() => window.__creatorVideo2 ? window.__creatorVideo2.currentTime : -1")
        time.sleep(0.8)
        c2_t2 = page.evaluate("() => window.__creatorVideo2 ? window.__creatorVideo2.currentTime : -1")
        c2_adv = (c2_t2 - c2_t1) if (c2_t2 >= 0 and c2_t1 >= 0) else 0

        # Close popover
        page.keyboard.press('Escape')
        time.sleep(0.5)
        c2_after = page.evaluate('''() => {
            const v2 = window.__creatorVideo2;
            return {
                paused: v2 ? v2.paused : true,
                hasSrc: v2 ? (v2.hasAttribute('src') && v2.getAttribute('src') !== '') : false
            };
        }''')
        
        c1_adv = (c1_t2 - c1_t1) if (c1_t2 >= 0 and c1_t1 >= 0) else 0
        c2_adv = (c2_t2 - c2_t1) if (c2_t2 >= 0 and c2_t1 >= 0) else 0

        switch_ok = bool(
            c1_adv >= 0.2 and
            c1_after['paused'] and
            not c1_after['hasSrc'] and
            c2_adv >= 0.2 and
            c2_after['paused'] and
            not c2_after['hasSrc']
        )
        check('8. Multi-creator shop switch: old creator video stops, new creator plays and advances, stops on close', 
              switch_ok, 
              {'c1Advance': c1_adv, 'c1After': c1_after, 'c2Advance': c2_adv, 'c2After': c2_after})
    else:
        check('8. Multi-creator shop switch tabs', False, multi_creator_test)

    # 9. Food picker and Video library search
    page.click('#food-pick-open')
    page.wait_for_selector('#food-pick-dialog[open]', timeout=5000)
    page.click('#video-library-open')
    page.wait_for_selector('#video-library-dialog[open]', timeout=5000)
    page.wait_for_selector('#video-library-grid .video-clip-card', timeout=10000)
    c1_cards = page.evaluate("""() => {
        const items = Array.from(document.querySelectorAll('#video-library-grid .video-clip-card strong'));
        return items.map(el => el.textContent.trim()).filter(Boolean);
    }""")
    page.wait_for_selector('#video-library-sources .video-source-tab', timeout=5000)
    page.evaluate("""() => {
        const tabs = Array.from(document.querySelectorAll('#video-library-sources .video-source-tab'));
        const target = tabs.find(t => t.textContent.includes('15再吃') || t.textContent.includes('亿点儿'));
        if (target) target.click();
    }""")
    time.sleep(0.5)
    page.fill('#video-library-search', '烩面')
    time.sleep(0.5)
    video_search_results = page.evaluate("""() => {
        const items = Array.from(document.querySelectorAll('#video-library-grid .video-clip-card strong'));
        return items.map(el => el.textContent.trim()).filter(Boolean);
    }""")
    check('9. Video library creator tabs and search filter clips containing "烩面" (合记)', 
          any('合记' in r for r in video_search_results) and any('知青' in r for r in c1_cards), 
          {'defaultCards': c1_cards, 'results': video_search_results})
    page.click('#video-library-close')
    time.sleep(0.3)
    page.evaluate("() => { const d = document.getElementById('food-pick-dialog'); if(d && d.open) d.close(); }")
    time.sleep(0.3)

    # Desktop screenshot in food mode
    desktop_png = output_dir / 'zhengzhou-desktop-1440.png'
    page.screenshot(path=str(desktop_png), full_page=False)
    check('10. Desktop 1440x960 screenshot saved', 
          desktop_png.exists() and desktop_png.stat().st_size > 10000, 
          {'path': str(desktop_png), 'bytes': desktop_png.stat().st_size})

    # City Switcher regression: switch to Chongqing then back to Zhengzhou
    page.select_option('.city-chip select', 'chongqing')
    page.wait_for_function("() => window.foodCityMap && window.foodCityMap.ready", timeout=30000)
    cq_city = page.evaluate("() => window.foodCityMap.city.name")
    page.select_option('.city-chip select', 'zhengzhou')
    page.wait_for_function("() => window.foodCityMap && window.foodCityMap.ready", timeout=30000)
    zz_city = page.evaluate("() => window.foodCityMap.city.name")
    check('11. Multi-city navigation switches without cross-city contamination', 
          cq_city == '重庆' and zz_city == '郑州', 
          {'cqCity': cq_city, 'zzCity': zz_city})

    context_desktop.close()

    # 2. Road search in Base Street Mode (?city=zhengzhou without food mode)
    context_street = browser.new_context(viewport={'width': 1440, 'height': 960}, locale='zh-CN')
    page_st = context_street.new_page()
    page_st.goto(f"{base_url}/?city=zhengzhou", wait_until='networkidle', timeout=30000)
    page_st.wait_for_function("() => window.foodCityMap && window.foodCityMap.ready", timeout=30000)
    page_st.wait_for_selector('#search-input', timeout=5000)
    page_st.fill('#search-input', '二七')
    page_st.wait_for_selector('#search-results button', timeout=5000)
    results = page_st.evaluate("""() => {
        const items = Array.from(document.querySelectorAll('#search-results button span'));
        return items.map(el => el.textContent.trim()).filter(Boolean);
    }""")
    check('12. Road search in street mode returns genuine Zhengzhou roads containing "二七"', 
          len(results) > 0 and any('二七' in r for r in results), 
          {'results': results[:5]})
    context_street.close()

    # 3. Mobile 390x844 verification
    context_mobile = browser.new_context(
        viewport={'width': 390, 'height': 844},
        device_scale_factor=2.0,
        is_mobile=True,
        has_touch=True,
        locale='zh-CN'
    )
    p_mob = context_mobile.new_page()
    p_mob.goto(f"{base_url}/?city=zhengzhou&view=food", wait_until='networkidle')
    p_mob.wait_for_function("() => window.foodCityMap && window.foodCityMap.ready", timeout=30000)
    p_mob.wait_for_selector('.food-card', timeout=10000)
    
    # Open popover on mobile
    open_first_visible_popover(p_mob)
    mob_ratio = p_mob.evaluate('''() => {
        const popover = document.querySelector('.food-inline-popover');
        const media = document.querySelector('.food-popover-media');
        if (!popover || !media) return null;
        return (media.getBoundingClientRect().width * media.getBoundingClientRect().height) / 
               (popover.getBoundingClientRect().width * popover.getBoundingClientRect().height);
    }''')
    check('13. Mobile 390x844 popover media area >= 2/3', 
          mob_ratio and mob_ratio >= (2.0 / 3.0), {'ratio': mob_ratio})
    mob_shot = output_dir / 'zhengzhou-mobile-390.png'
    p_mob.screenshot(path=str(mob_shot))
    check('14. Mobile 390x844 screenshot saved', 
          mob_shot.exists() and mob_shot.stat().st_size > 10000, {'file': str(mob_shot)})
    context_mobile.close()

    # 4. Small screen 320x680 verification
    context_small = browser.new_context(
        viewport={'width': 320, 'height': 680},
        device_scale_factor=1.0,
        is_mobile=True,
        has_touch=True,
        locale='zh-CN'
    )
    p_small = context_small.new_page()
    p_small.goto(f"{base_url}/?city=zhengzhou&view=food", wait_until='networkidle')
    p_small.wait_for_function("() => window.foodCityMap && window.foodCityMap.ready", timeout=30000)
    p_small.wait_for_selector('.food-card', timeout=10000)
    open_first_visible_popover(p_small)
    small_ratio = p_small.evaluate('''() => {
        const popover = document.querySelector('.food-inline-popover');
        const media = document.querySelector('.food-popover-media');
        if (!popover || !media) return null;
        return (media.getBoundingClientRect().width * media.getBoundingClientRect().height) / 
               (popover.getBoundingClientRect().width * popover.getBoundingClientRect().height);
    }''')
    check('15. Small screen 320x680 popover media area >= 2/3', 
          small_ratio and small_ratio >= (2.0 / 3.0), {'ratio': small_ratio})
    small_shot = output_dir / 'zhengzhou-small-320.png'
    p_small.screenshot(path=str(small_shot))
    check('16. Small screen 320x680 screenshot saved', 
          small_shot.exists() and small_shot.stat().st_size > 10000, {'file': str(small_shot)})
    context_small.close()

    # 5. Short landscape 736x414 verification
    context_land = browser.new_context(
        viewport={'width': 736, 'height': 414},
        device_scale_factor=2.0,
        is_mobile=True,
        has_touch=True,
        locale='zh-CN'
    )
    p_land = context_land.new_page()
    p_land.goto(f"{base_url}/?city=zhengzhou&view=food", wait_until='networkidle')
    p_land.wait_for_function("() => window.foodCityMap && window.foodCityMap.ready", timeout=30000)
    p_land.wait_for_selector('.food-card', timeout=10000)
    open_first_visible_popover(p_land)
    land_ratio = p_land.evaluate('''() => {
        const popover = document.querySelector('.food-inline-popover');
        const media = document.querySelector('.food-popover-media');
        if (!popover || !media) return null;
        return (media.getBoundingClientRect().width * media.getBoundingClientRect().height) / 
               (popover.getBoundingClientRect().width * popover.getBoundingClientRect().height);
    }''')
    check('17. Short landscape 736x414 popover media area >= 2/3', 
          land_ratio and land_ratio >= (2.0 / 3.0), {'ratio': land_ratio})
    land_shot = output_dir / 'zhengzhou-landscape-736.png'
    p_land.screenshot(path=str(land_shot))
    check('18. Short landscape 736x414 screenshot saved', 
          land_shot.exists() and land_shot.stat().st_size > 10000, {'file': str(land_shot)})
    context_land.close()

    # 6. Single-file preview-zhengzhou.html verification
    context_single = browser.new_context(
        viewport={'width': 1440, 'height': 960},
        locale='zh-CN'
    )
    p_single = context_single.new_page()
    p_single.goto(f"{base_url}/preview-zhengzhou.html?view=food", wait_until='networkidle')
    p_single.wait_for_function("() => window.foodCityMap && window.foodCityMap.ready", timeout=30000)
    p_single.wait_for_selector('.food-card', timeout=5000)
    single_cards = p_single.locator('.food-card').count()
    check('19. Standalone bundle preview-zhengzhou.html renders food cards (140 offline stops)', 
          single_cards == 140, {'cardCount': single_cards})
    single_shot = output_dir / 'zhengzhou-preview-bundle-1440.png'
    p_single.screenshot(path=str(single_shot))
    check('20. Standalone bundle preview-zhengzhou.html screenshot saved', 
          single_shot.exists() and single_shot.stat().st_size > 10000, {'file': str(single_shot)})
    context_single.close()

    # 7. Check for runtime page errors
    check('21. No unhandled page errors during browser navigation', 
          len(page_errors) == 0, {'errors': page_errors})

    browser.close()

passed_count = sum(1 for c in checks if c['passed'])
total_count = len(checks)
print(f"\n=== Zhengzhou Browser Verification Summary: {passed_count}/{total_count} PASSED ===")

report = {
    'city': 'zhengzhou',
    'verifiedAt': time.strftime('%Y-%m-%d %H:%M:%S'),
    'previewUrl': base_url,
    'total': total_count,
    'passed': passed_count,
    'checks': checks
}
report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf8')

if passed_count != total_count:
    sys.exit(1)
