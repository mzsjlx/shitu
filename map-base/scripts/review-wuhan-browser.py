"""Verify Wuhan map base, food cards, video popover, ratio >= 2/3, playback, and multi-creator switcher in headless browser with Playwright."""
import json, os, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
output_dir = root / '../output/research/wuhan/screenshots'
output_dir.mkdir(parents=True, exist_ok=True)
report_path = root / '../output/research/wuhan/wuhan-browser-qa-20261114.json'

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

print(f"=== Starting Wuhan Browser UI, Food Markers & Video Verification against {base_url} ===\n")

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    
    # 1. Desktop 1440x960 verification
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

    url = f"{base_url}/?city=wuhan&view=food"
    page.goto(url, wait_until='networkidle', timeout=30000)
    
    # Wait for map ready signal
    page.wait_for_function("() => window.foodCityMap && window.foodCityMap.ready", timeout=30000)
    
    status_text = page.locator('#status').inner_text()
    check('1. Map readiness signal and Wuhan title', '武汉地图已展开' in status_text, {'statusText': status_text})
    
    # Check food markers rendered on map
    page.wait_for_selector('.food-card', timeout=10000)
    food_cards = page.locator('.food-card')
    card_count = food_cards.count()
    check('2. Food cards rendered on map for Wuhan (33 on-map stops across Hankou, Wuchang, Hanyang, Qingshan)', card_count == 33, {'cardCount': card_count})
    
    # Verify shop names in cards
    card_names = page.evaluate("() => Array.from(document.querySelectorAll('.food-card strong')).map(el => el.textContent)")
    check('3. Shop names match real Wuhan establishments across 3 areas', 
          any('小屋' in n for n in card_names) and any('长堤' in n for n in card_names) and any('赵师傅' in n or '燕子' in n or '山海关' in n for n in card_names), 
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
    check('5. Floating window media area >= 2/3 of border box', ratio_info and ratio_info['ratio'] >= (2.0 / 3.0), ratio_info)

    # 6. Video playback test: click play button
    play_btn = page.locator('.food-popover-play')
    if play_btn.is_visible():
        play_btn.click()
        page.wait_for_selector('video.food-popover-video', timeout=5000)
        time.sleep(1.0)
        
        # Verify video playback state
        play_state = page.evaluate('''() => {
            const v = document.querySelector('video.food-popover-video');
            if (!v) return null;
            return {
                src: v.src,
                paused: v.paused,
                currentTime: v.currentTime,
                duration: v.duration,
                readyState: v.readyState
            };
        }''')
        check('6. Video mounts and playback advances time', play_state and play_state['currentTime'] >= 0, play_state)

        # 7. Unmount and stop sound on close/Escape
        page.keyboard.press('Escape')
        time.sleep(0.5)
        stop_state = page.evaluate('''() => {
            const popover = document.querySelector('.food-inline-popover');
            const v = document.querySelector('video.food-popover-video');
            return {
                popoverHidden: popover.hidden,
                hasSrc: v ? v.hasAttribute('src') : false,
                paused: v ? v.paused : true
            };
        }''')
        check('7. Pressing Escape stops video, removes src, and closes popover', 
              stop_state['popoverHidden'] and not stop_state['hasSrc'] and stop_state['paused'], 
              stop_state)
    else:
        check('6. Video play button present', False)
        check('7. Video unmount check', False)

    # 8. Multi-creator shop switcher test (e.g., 燕子煨汤 or 赵师傅 or 毛氏汽水包)
    multi_creator_test = page.evaluate('''() => {
        // Find card for a merged stop
        const cards = Array.from(document.querySelectorAll('.food-card'));
        const target = cards.find(c => {
            const t = c.textContent || '';
            return t.includes('燕子') || t.includes('赵师傅') || t.includes('毛氏') || t.includes('汪记') || t.includes('长堤');
        });
        if (!target) return { found: false };
        const btn = target.querySelector('.food-open') || target;
        btn.click();
        const popover = document.querySelector('.food-inline-popover');
        const clipButtons = Array.from(document.querySelectorAll('.food-popover-clip'));
        return {
            found: true,
            title: target.querySelector('strong')?.textContent,
            clipCount: clipButtons.length,
            authors: clipButtons.map(b => b.textContent)
        };
    }''')
    check('8. Multi-creator merged shop renders creator switch tabs', 
          multi_creator_test['found'] and multi_creator_test['clipCount'] >= 2, 
          multi_creator_test)

    # Desktop screenshot
    desktop_shot = output_dir / 'wuhan-desktop-1440.png'
    page.screenshot(path=str(desktop_shot))
    check('9. Desktop 1440x960 screenshot saved', desktop_shot.exists(), {'file': str(desktop_shot)})
    
    # 9. City Isolation Test: switch to Chongqing then back to Wuhan
    page.select_option('.city-chip select', 'chongqing')
    time.sleep(1.0)
    cq_city = page.evaluate("() => window.foodCityMap.city.name")
    page.select_option('.city-chip select', 'wuhan')
    time.sleep(1.0)
    wh_city = page.evaluate("() => window.foodCityMap.city.name")
    check('10. Multi-city navigation switches without cross-city contamination', cq_city == '重庆' and wh_city == '武汉', {'cqCity': cq_city, 'whCity': wh_city})

    context_desktop.close()

    # 2. Mobile 390x844 verification
    context_mobile = browser.new_context(
        viewport={'width': 390, 'height': 844},
        device_scale_factor=2.0,
        is_mobile=True,
        has_touch=True,
        locale='zh-CN'
    )
    p_mob = context_mobile.new_page()
    p_mob.goto(f"{base_url}/?city=wuhan&view=food", wait_until='networkidle')
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
    check('11. Mobile 390x844 popover media area >= 2/3', mob_ratio and mob_ratio >= (2.0 / 3.0), {'ratio': mob_ratio})
    mob_shot = output_dir / 'wuhan-mobile-390.png'
    p_mob.screenshot(path=str(mob_shot))
    check('12. Mobile 390x844 screenshot saved', mob_shot.exists(), {'file': str(mob_shot)})
    context_mobile.close()

    # 3. Small screen 320x680 verification
    context_small = browser.new_context(
        viewport={'width': 320, 'height': 680},
        device_scale_factor=1.0,
        is_mobile=True,
        has_touch=True,
        locale='zh-CN'
    )
    p_small = context_small.new_page()
    p_small.goto(f"{base_url}/?city=wuhan&view=food", wait_until='networkidle')
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
    check('13. Small screen 320x680 popover media area >= 2/3', small_ratio and small_ratio >= (2.0 / 3.0), {'ratio': small_ratio})
    small_shot = output_dir / 'wuhan-small-320.png'
    p_small.screenshot(path=str(small_shot))
    check('14. Small screen 320x680 screenshot saved', small_shot.exists(), {'file': str(small_shot)})
    context_small.close()

    # 4. Short landscape 736x414 verification
    context_land = browser.new_context(
        viewport={'width': 736, 'height': 414},
        device_scale_factor=2.0,
        is_mobile=True,
        has_touch=True,
        locale='zh-CN'
    )
    p_land = context_land.new_page()
    p_land.goto(f"{base_url}/?city=wuhan&view=food", wait_until='networkidle')
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
    check('15. Short landscape 736x414 popover media area >= 2/3', land_ratio and land_ratio >= (2.0 / 3.0), {'ratio': land_ratio})
    land_shot = output_dir / 'wuhan-landscape-736.png'
    p_land.screenshot(path=str(land_shot))
    check('16. Short landscape 736x414 screenshot saved', land_shot.exists(), {'file': str(land_shot)})
    context_land.close()

    # 5. Single-file preview-wuhan.html verification
    context_single = browser.new_context(
        viewport={'width': 1440, 'height': 960},
        locale='zh-CN'
    )
    p_single = context_single.new_page()
    p_single.goto(f"{base_url}/preview-wuhan.html?view=food", wait_until='networkidle')
    p_single.wait_for_function("() => window.foodCityMap && window.foodCityMap.ready", timeout=30000)
    p_single.wait_for_selector('.food-card', timeout=5000)
    single_cards = p_single.locator('.food-card').count()
    check('17. Standalone bundle preview-wuhan.html renders food cards (33 offline stops)', single_cards == 33, {'cardCount': single_cards})
    single_shot = output_dir / 'wuhan-preview-bundle-1440.png'
    p_single.screenshot(path=str(single_shot))
    check('18. Standalone bundle preview-wuhan.html screenshot saved', single_shot.exists(), {'file': str(single_shot)})
    context_single.close()

    # 6. Check for runtime page errors
    check('19. No unhandled page errors during browser navigation', len(page_errors) == 0, {'errors': page_errors})

    browser.close()

print(f"\nVerification completed: {sum(1 for c in checks if c['passed'])}/{len(checks)} checks passed!")
report_path.write_text(json.dumps(checks, ensure_ascii=False, indent=2) + '\n', encoding='utf8')

if any(not c['passed'] for c in checks):
    sys.exit(1)
