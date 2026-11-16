"""Verify Zhengzhou map base, city switcher, road search, multi-device viewport screenshots in headless Chromium with Playwright."""
import json, os, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
output_dir = root / '../output/playwright/zhengzhou'
output_dir.mkdir(parents=True, exist_ok=True)
report_path = root / '../output/research/zhengzhou/zhengzhou-browser-qa-20261116.json'
report_path.parent.mkdir(parents=True, exist_ok=True)

base_url = os.environ.get('PREVIEW_URL', 'http://127.0.0.1:8796')

checks = []
def check(name, passed, details=None):
    entry = {'name': name, 'passed': bool(passed)}
    if details:
        entry['details'] = details
    checks.append(entry)
    status = '[PASS]' if passed else '[FAIL]'
    print(f"{status} {name}")

print(f"=== Starting Zhengzhou Browser Verification against {base_url} ===\n")

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    
    # 1. Desktop 1440x960
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
    
    # 1. Map readiness and title
    title = page.title()
    status_text = page.locator('#status').inner_text()
    check('1. Map readiness signal and Zhengzhou title', 
          '食途 · 郑州地图' in title and '郑州地图已展开' in status_text, 
          {'title': title, 'statusText': status_text})
    
    # 2. City select dropdown contains all 6 cities
    city_options = page.evaluate("() => Array.from(document.querySelectorAll('.city-chip select option')).map(o => ({ value: o.value, text: o.textContent }))")
    city_values = [o['value'] for o in city_options]
    check('2. City switcher contains all 6 cities (chongqing, changsha, liuzhou, nanjing, chaoshan, zhengzhou)',
          all(c in city_values for c in ['chongqing', 'changsha', 'liuzhou', 'nanjing', 'chaoshan', 'zhengzhou']) and len(city_values) == 6,
          {'cities': city_values})
    
    current_city_val = page.locator('.city-chip select').input_value()
    check('3. City selector current value is zhengzhou', current_city_val == 'zhengzhou')

    # 4. Search input placeholder
    placeholder = page.locator('#search-input').get_attribute('placeholder')
    check('4. Search input placeholder for Zhengzhou', placeholder == '找一条路，开始逛郑州', {'placeholder': placeholder})

    # 5. Food cards count (clean 0 initially, strictly waiting for user video intake)
    card_count = page.locator('.food-card').count()
    check('5. Initial food card count is 0 (clean baseline awaiting user video links, no fabricated stores)', card_count == 0, {'cardCount': card_count})

    # 6. Road search test: search for real Zhengzhou road
    page.focus('#search-input')
    page.type('#search-input', '二七', delay=50)
    page.wait_for_selector('#search-results button', timeout=5000)
    results = page.evaluate("""() => {
        const items = Array.from(document.querySelectorAll('#search-results button span'));
        return items.map(el => el.textContent.trim()).filter(Boolean);
    }""")
    check('6. Road search returns genuine Zhengzhou roads containing "二七"', 
          len(results) > 0 and any('二七' in r for r in results), 
          {'results': results[:5]})
    page.click('#clear-search')
    page.wait_for_timeout(300)

    # 7. Desktop screenshot
    desktop_png = output_dir / 'zhengzhou-desktop-1440.png'
    page.screenshot(path=str(desktop_png), full_page=False)
    check('7. Desktop 1440x960 screenshot saved', desktop_png.exists() and desktop_png.stat().st_size > 10000, {'path': str(desktop_png), 'bytes': desktop_png.stat().st_size})
    context_desktop.close()

    # 8. Mobile 390x844
    context_mobile = browser.new_context(
        viewport={'width': 390, 'height': 844},
        device_scale_factor=2.0,
        is_mobile=True,
        has_touch=True,
        locale='zh-CN'
    )
    page_m = context_mobile.new_page()
    page_m.goto(f"{base_url}/?city=zhengzhou&view=food", wait_until='networkidle', timeout=30000)
    page_m.wait_for_function("() => window.foodCityMap && window.foodCityMap.ready", timeout=30000)
    mobile_png = output_dir / 'zhengzhou-mobile-390.png'
    page_m.screenshot(path=str(mobile_png), full_page=False)
    check('8. Mobile 390x844 screenshot saved', mobile_png.exists() and mobile_png.stat().st_size > 10000, {'path': str(mobile_png), 'bytes': mobile_png.stat().st_size})
    context_mobile.close()

    # 9. Small screen 320x680
    context_small = browser.new_context(
        viewport={'width': 320, 'height': 680},
        device_scale_factor=2.0,
        is_mobile=True,
        has_touch=True,
        locale='zh-CN'
    )
    page_s = context_small.new_page()
    page_s.goto(f"{base_url}/?city=zhengzhou&view=food", wait_until='networkidle', timeout=30000)
    page_s.wait_for_function("() => window.foodCityMap && window.foodCityMap.ready", timeout=30000)
    small_png = output_dir / 'zhengzhou-small-320.png'
    page_s.screenshot(path=str(small_png), full_page=False)
    check('9. Small screen 320x680 screenshot saved', small_png.exists() and small_png.stat().st_size > 10000, {'path': str(small_png), 'bytes': small_png.stat().st_size})
    context_small.close()

    # 10. Landscape 736x414
    context_ls = browser.new_context(
        viewport={'width': 736, 'height': 414},
        device_scale_factor=2.0,
        is_mobile=True,
        has_touch=True,
        locale='zh-CN'
    )
    page_ls = context_ls.new_page()
    page_ls.goto(f"{base_url}/?city=zhengzhou&view=food", wait_until='networkidle', timeout=30000)
    page_ls.wait_for_function("() => window.foodCityMap && window.foodCityMap.ready", timeout=30000)
    ls_png = output_dir / 'zhengzhou-landscape-736.png'
    page_ls.screenshot(path=str(ls_png), full_page=False)
    check('10. Landscape 736x414 screenshot saved', ls_png.exists() and ls_png.stat().st_size > 10000, {'path': str(ls_png), 'bytes': ls_png.stat().st_size})
    context_ls.close()

    # 11. Cross-city switching regression check (Switch to Chongqing then back to Zhengzhou)
    context_switch = browser.new_context(viewport={'width': 1440, 'height': 960})
    page_sw = context_switch.new_page()
    page_sw.goto(f"{base_url}/?city=zhengzhou&view=food", wait_until='networkidle', timeout=30000)
    page_sw.wait_for_function("() => window.foodCityMap && window.foodCityMap.ready", timeout=30000)
    
    # Switch to Chongqing
    with page_sw.expect_navigation(timeout=15000):
        page_sw.select_option('.city-chip select', 'chongqing')
    page_sw.wait_for_function("() => window.foodCityMap && window.foodCityMap.ready && window.foodCityMap.city.name === '重庆'", timeout=30000)
    cq_title = page_sw.title()
    cq_cards = page_sw.locator('.food-card').count()
    check('11. Switch to Chongqing: title is Chongqing and food cards render without city collision',
          '重庆地图' in cq_title and cq_cards > 0, {'cqTitle': cq_title, 'cqCards': cq_cards})

    # Switch back to Zhengzhou
    with page_sw.expect_navigation(timeout=15000):
        page_sw.select_option('.city-chip select', 'zhengzhou')
    page_sw.wait_for_function("() => window.foodCityMap && window.foodCityMap.ready && window.foodCityMap.city.name === '郑州'", timeout=30000)
    zz_title_sw = page_sw.title()
    check('12. Switch back to Zhengzhou: state isolated, no ghost cards or Chongqing artifacts',
          '郑州地图' in zz_title_sw and page_sw.locator('.food-card').count() == 0, {'zzTitle': zz_title_sw})

    context_switch.close()
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
