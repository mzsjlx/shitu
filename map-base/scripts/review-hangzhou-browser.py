import argparse
import functools
import http.server
import json
import mimetypes
import os
import re
import socketserver
import threading
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT_JSON = ROOT.parent / 'output/research/hangzhou/hangzhou-browser-qa-20261125.json'
SHOT_DIR = ROOT / '.local/reviews/hangzhou'

mimetypes.add_type('application/javascript', '.cjs')
mimetypes.add_type('application/vnd.pmtiles', '.pmtiles')
mimetypes.add_type('application/geo+json', '.geojson')


class RangeHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def handle_one_request(self):
        try:
            super().handle_one_request()
        except (ConnectionResetError, BrokenPipeError, ConnectionAbortedError):
            self.close_connection = True

    def send_head(self):
        path = Path(self.translate_path(self.path.split('?', 1)[0]))
        if path.is_dir():
            path = path / 'index.html'
        if not path.is_file():
            self.send_error(404, 'File not found')
            return None
        size = path.stat().st_size
        ctype = self.guess_type(str(path))
        range_hdr = self.headers.get('Range')
        start, end = 0, size - 1
        status = 200
        if range_hdr:
            m = re.match(r'^bytes=(\d+)-(\d*)$', range_hdr.strip())
            if m:
                start = int(m.group(1))
                end = min(int(m.group(2)), size - 1) if m.group(2) else size - 1
                if start >= size or start > end:
                    self.send_response(416)
                    self.send_header('Content-Range', f'bytes */{size}')
                    self.end_headers()
                    return None
                status = 206
        self.send_response(status)
        self.send_header('Content-type', ctype)
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Cache-Control', 'no-cache')
        if status == 206:
            self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.send_header('Content-Length', str(end - start + 1))
        self.end_headers()
        if self.command == 'HEAD':
            return None
        f = open(path, 'rb')
        f.seek(start)
        return _RangedFile(f, end - start + 1)


class _RangedFile:
    def __init__(self, f, remaining):
        self.f = f
        self.remaining = remaining

    def read(self, amt=65536):
        if self.remaining <= 0:
            return b''
        chunk = self.f.read(min(amt, self.remaining) if amt and amt > 0 else self.remaining)
        self.remaining -= len(chunk)
        return chunk

    def close(self):
        self.f.close()


def start_server(directory: Path):
    handler = functools.partial(RangeHandler, directory=str(directory))
    httpd = socketserver.ThreadingTCPServer(('127.0.0.1', 0), handler)
    httpd.daemon_threads = True
    port = httpd.server_address[1]
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    return httpd, port


def run_qa(dist_dir: Path, expect_local_videos: bool = True):
    SHOT_DIR.mkdir(parents=True, exist_ok=True)
    httpd, port = start_server(dist_dir)
    base_url = f'http://127.0.0.1:{port}'
    report = {
        'baseUrl': base_url,
        'distDir': str(dist_dir),
        'expectLocalVideos': expect_local_videos,
        'checks': {},
        'pageErrors': [],
        'failedRequests': [],
    }

    try:
        with sync_playwright() as p:
            browser = None
            for opts in (
                {'headless': True},
                {'headless': True, 'channel': 'chrome'},
                {'headless': True, 'channel': 'msedge'},
            ):
                try:
                    browser = p.chromium.launch(**opts)
                    break
                except Exception:
                    pass
            if browser is None:
                raise RuntimeError('No Chromium/Chrome/Edge executable available for Playwright')

            context = browser.new_context(viewport={'width': 1440, 'height': 960})
            page = context.new_page()
            page.on('pageerror', lambda err: report['pageErrors'].append(str(err)))
            page.on(
                'response',
                lambda res: report['failedRequests'].append({'url': res.url, 'status': res.status})
                if res.url.startswith(base_url) and res.status >= 400
                else None,
            )

            # 1. Load preview-hangzhou.html?view=food and verify 82 in-bounds map stops + posters
            page.goto(f'{base_url}/preview-hangzhou.html?view=food', wait_until='domcontentloaded', timeout=60000)
            page.wait_for_function('() => window.foodCityMap?.ready === true', timeout=45000)
            page.wait_for_selector('.food-card', timeout=30000)
            page.wait_for_timeout(1000)

            cards_count = page.locator('.food-card').count()
            assert cards_count == 82, f'Expected 82 in-bounds map cards on preview-hangzhou.html, got {cards_count}'
            collapsed_default = page.locator('.food-card.is-collapsed').count()
            assert collapsed_default == 82, f'Expected all 82 unselected markers to start collapsed (48px dot), got {collapsed_default}'

            # 2. Hovering a collapsed dot must NOT accidentally pop open video; clicking expands card to ~190px & opens popover
            first_btn = page.locator('[data-food-id="video-hz-wulala-wumingshi"] .food-open')
            page.evaluate('window.foodCityMap.map.jumpTo({ center: [120.1618, 30.254], zoom: 16.0 })')
            page.wait_for_timeout(350)
            first_btn.hover(force=True)
            page.wait_for_timeout(350)
            assert page.locator('.food-inline-popover').is_hidden(), 'Hovering collapsed dot must NOT trigger popover'

            first_btn.evaluate('el => el.click()')
            page.wait_for_selector('.food-inline-popover:not([hidden])', timeout=10000)
            page.wait_for_timeout(300)
            selected_width = page.evaluate('document.querySelector(\'[data-food-id="video-hz-wulala-wumingshi"]\').getBoundingClientRect().width')
            assert selected_width >= 170, f'Selected card must expand (~190px), got width={selected_width}'
            page.keyboard.press('Escape')
            page.wait_for_timeout(200)
            report['checks']['mapCards'] = {
                'totalInBounds': cards_count,
                'collapsedDefaultDots': collapsed_default,
                'expandedSelectedWidth': round(selected_width, 1),
                'noHoverTriggerWhileCollapsed': True,
            }

            # 3. Road search check (deactivate food-mode temporarily to reveal road search, verify 延安路, re-enable food-mode)
            page.click('#food-entry')
            page.wait_for_selector('#search-input', state='visible', timeout=5000)
            page.fill('#search-input', '延安路')
            page.wait_for_timeout(400)
            sr_text = page.locator('#search-results').inner_text()
            assert '延安路' in sr_text, f'Expected 延安路 in road search results, got: {sr_text[:120]}'
            page.click('#clear-search')
            page.click('#food-entry')
            page.wait_for_selector('.food-card', timeout=10000)
            report['checks']['roadSearch'] = {'query': '延安路', 'matched': True}

            # 4. Open multi-creator merged stop (无名氏面馆) & verify playback + strict creator switch + stop switch + Escape cleanup
            page.evaluate('window.foodCityMap.map.jumpTo({ center: [120.1618, 30.254], zoom: 16.2 })')
            page.wait_for_timeout(300)
            page.locator('[data-food-id="video-hz-wulala-wumingshi"] .food-open').evaluate('el => el.click()')
            page.wait_for_selector('.food-inline-popover:not([hidden])', timeout=10000)
            page.wait_for_timeout(300)

            clip_buttons = page.locator('.food-popover-clips .food-popover-clip')
            clip_btn_count = clip_buttons.count()
            assert clip_btn_count == 2, f'Expected 2 creator buttons on merged 无名氏面馆, got {clip_btn_count}'

            if expect_local_videos:
                page.locator('.food-popover-play').click()
                page.wait_for_selector('.food-popover-video', timeout=10000)
                page.evaluate('() => { window.__oldVid1 = document.querySelector(".food-popover-video"); }')
                page.wait_for_timeout(700)
                t0 = page.evaluate('window.__oldVid1 ? window.__oldVid1.currentTime : -1')
                page.wait_for_timeout(850)
                t1 = page.evaluate('window.__oldVid1 ? window.__oldVid1.currentTime : -1')
                assert t1 - t0 >= 0.25, f'First creator playback did not advance enough: {t0} -> {t1}'

                # Switch to creator #2 -> strict cleanup on old <video> + second clip plays
                clip_buttons.nth(1).click()
                page.wait_for_timeout(300)
                cleanup1 = page.evaluate('''() => ({
                  exists: !!window.__oldVid1,
                  paused: window.__oldVid1 ? window.__oldVid1.paused : false,
                  hasSrc: window.__oldVid1 ? !!window.__oldVid1.getAttribute('src') : true
                })''')
                assert cleanup1['exists'] and cleanup1['paused'] and not cleanup1['hasSrc'], (
                    f'Creator switch failed strict old video cleanup: {cleanup1}'
                )
                page.locator('.food-popover-play').click()
                page.wait_for_selector('.food-popover-video', timeout=10000)
                page.evaluate('() => { window.__oldVid2 = document.querySelector(".food-popover-video"); }')
                page.wait_for_timeout(700)
                t2a = page.evaluate('window.__oldVid2 ? window.__oldVid2.currentTime : -1')
                page.wait_for_timeout(850)
                t2b = page.evaluate('window.__oldVid2 ? window.__oldVid2.currentTime : -1')
                assert t2b - t2a >= 0.25, f'Second creator playback did not advance: {t2a} -> {t2b}'

                # Escape closes popover & cleans <video>
                page.keyboard.press('Escape')
                page.wait_for_timeout(250)
                cleanup2 = page.evaluate('''() => ({
                  popoverHidden: document.querySelector('.food-inline-popover')?.hidden ?? true,
                  paused: window.__oldVid2 ? window.__oldVid2.paused : false,
                  hasSrc: window.__oldVid2 ? !!window.__oldVid2.getAttribute('src') : true
                })''')
                assert cleanup2['popoverHidden'] and cleanup2['paused'] and not cleanup2['hasSrc'], (
                    f'Escape close failed strict cleanup: {cleanup2}'
                )

                # Switch stop check: open 百家鸡味馆, play, then open 椿芽 -> strict cleanup
                page.locator('[data-food-id="video-hz-shiyi-baijia-jiweiguan"] .food-open').evaluate('el => el.click()')
                page.wait_for_selector('.food-inline-popover:not([hidden])', timeout=10000)
                page.locator('.food-popover-play').click()
                page.wait_for_selector('.food-popover-video', timeout=10000)
                page.evaluate('() => { window.__oldVid3 = document.querySelector(".food-popover-video"); }')
                page.wait_for_timeout(450)
                page.locator('[data-food-id="video-hz-shiyi-chunya-banchuan"] .food-open').evaluate('el => el.click()')
                page.wait_for_timeout(300)
                cleanup3 = page.evaluate('''() => ({
                  paused: window.__oldVid3 ? window.__oldVid3.paused : false,
                  hasSrc: window.__oldVid3 ? !!window.__oldVid3.getAttribute('src') : true
                })''')
                assert cleanup3['paused'] and not cleanup3['hasSrc'], f'Stop switch failed cleanup: {cleanup3}'
                page.keyboard.press('Escape')

                report['checks']['videoPlayback'] = {
                    'multiCreatorAdvance1': round(t1 - t0, 3),
                    'multiCreatorAdvance2': round(t2b - t2a, 3),
                    'creatorSwitchCleanup': cleanup1,
                    'escapeCleanup': cleanup2,
                    'stopSwitchCleanup': cleanup3,
                }
            else:
                missing_text = page.locator('.food-popover-missing').inner_text()
                assert '待' in missing_text, f'Expected pending copy without local videos, got {missing_text}'
                page.keyboard.press('Escape')
                report['checks']['videoPlayback'] = {'pendingCopy': missing_text}

            # 5. Add 3 stops & verify Direct -> Road switching with real road geometry badges
            for sid in ['video-hz-wulala-wumingshi', 'video-hz-shiyi-baijia-jiweiguan', 'video-hz-shiyi-chunya-banchuan']:
                page.locator(f'[data-food-id="{sid}"] .food-open').evaluate('el => el.click()')
                page.wait_for_selector('.food-inline-popover:not([hidden]) .food-popover-save', timeout=8000)
                save_text = page.locator('.food-popover-save').inner_text()
                if '已加入' not in save_text:
                    page.locator('.food-popover-save').click()
                    page.wait_for_timeout(200)
            page.keyboard.press('Escape')
            page.wait_for_timeout(400)

            direct_caption = page.locator('#trip-dock-caption').inner_text().strip()
            direct_badges = [t.strip() for t in page.locator('.food-distance-badge').all_inner_texts() if t.strip()]
            assert '直线约' in direct_caption and len(direct_badges) >= 2, (
                f'Expected 2+ direct distance badges & 直线 caption, got {direct_caption} / {direct_badges}'
            )

            road_btn = page.locator('#trip-distance-modes button[data-route-mode="road"]')
            road_btn.click()
            page.wait_for_function(
                "() => window.foodCityMap?.food?.getStats()?.route?.phase === 'ready'",
                timeout=15000,
            )
            page.wait_for_timeout(300)
            route_stats = page.evaluate('window.foodCityMap.food.getStats().route')
            road_caption = page.locator('#trip-dock-caption').inner_text().strip()
            road_badges = [t.strip() for t in page.locator('.food-distance-badge').all_inner_texts() if t.strip()]
            assert route_stats['phase'] == 'ready' and route_stats.get('missing', 0) == 0 and route_stats['total'] > 0, (
                f'Road routing stats invalid: {route_stats}'
            )
            assert '沿路约' in road_caption and len(road_badges) >= 2 and all('沿路约' in t and '0 米' not in t for t in road_badges), (
                f'Road mode routing failed or incomplete: {road_caption} / {road_badges}'
            )
            assert road_btn.get_attribute('aria-pressed') == 'true'
            report['checks']['routeSwitching'] = {
                'stopsAdded': 3,
                'directCaption': direct_caption,
                'directBadges': direct_badges,
                'roadCaption': road_caption,
                'roadBadges': road_badges,
                'routeStats': route_stats,
            }

            # 6. Four-viewport popover responsiveness & media >= 2/3 area checks + screenshots
            viewports = [
                ('desktop-1440', 1440, 960),
                ('mobile-390', 390, 844),
                ('compact-320', 320, 680),
                ('landscape-736', 736, 414),
            ]
            vp_results = {}
            for label, vw, vh in viewports:
                page.set_viewport_size({'width': vw, 'height': vh})
                page.evaluate('window.foodCityMap.map.jumpTo({ center: [120.1680, 30.2494], zoom: 16.0 })')
                page.wait_for_timeout(350)
                page.locator('[data-food-id="video-hz-shiyi-baijia-jiweiguan"] .food-open').evaluate('el => el.click()')
                page.wait_for_selector('.food-inline-popover.is-shown', timeout=8000)
                page.wait_for_timeout(300)
                metrics = page.evaluate('''() => {
                  const pop = document.querySelector('.food-inline-popover');
                  const media = pop.querySelector('.food-popover-media');
                  const pr = pop.getBoundingClientRect();
                  const mr = media.getBoundingClientRect();
                  const mediaRatio = (mr.width * mr.height) / (pr.width * pr.height);
                  return {
                    vw: window.innerWidth,
                    vh: window.innerHeight,
                    pop: { left: pr.left, top: pr.top, right: pr.right, bottom: pr.bottom, width: pr.width, height: pr.height },
                    media: { width: mr.width, height: mr.height },
                    mediaRatio,
                    inViewport: pr.left >= -2 && pr.top >= -2 && pr.right <= window.innerWidth + 2 && pr.bottom <= window.innerHeight + 2
                  };
                }''')
                assert metrics['inViewport'], f'Popover overflows viewport at {label}: {metrics}'
                assert metrics['mediaRatio'] >= (2 / 3), f'Media ratio < 2/3 at {label}: {metrics["mediaRatio"]}'
                shot_path = SHOT_DIR / f'qa-{label}.png'
                page.screenshot(path=str(shot_path))
                metrics['screenshot'] = str(shot_path)
                vp_results[label] = metrics
                page.keyboard.press('Escape')
                page.wait_for_timeout(200)
            report['checks']['viewports'] = vp_results

            # 7. Check videos-hangzhou.html (70 source links, 108 segment cards) & interactive video library dialog search
            page.set_viewport_size({'width': 1440, 'height': 960})
            page.goto(f'{base_url}/videos-hangzhou.html', wait_until='domcontentloaded', timeout=30000)
            page.wait_for_selector('article.card', timeout=10000)
            v_card_count = page.locator('article.card').count()
            v_source_count = page.locator('.intro a').count()
            assert v_card_count == 108, f'Expected 108 segment cards on videos-hangzhou.html, got {v_card_count}'
            assert v_source_count == 70, f'Expected 70 source links on videos-hangzhou.html, got {v_source_count}'

            page.goto(f'{base_url}/index.html?city=hangzhou&view=food&videos=1', wait_until='domcontentloaded', timeout=45000)
            page.wait_for_function('() => window.foodCityMap?.ready === true', timeout=45000)
            page.wait_for_selector('#video-library-dialog[open]', timeout=15000)
            page.click('button.video-source-tab:has-text("大专厨子")')
            page.wait_for_timeout(300)
            page.fill('#video-library-search', '铁板烧')
            page.wait_for_timeout(300)
            filtered_text = page.locator('#video-library-grid').inner_text()
            assert '王记糖醋铁板烧' in filtered_text, (
                f'Video library search filter failed: {filtered_text[:120]}'
            )
            page.click('#video-library-close')
            report['checks']['videosPage'] = {'segmentCards': v_card_count, 'sourceLinks': v_source_count, 'dialogSearchFilter': True}

            # 8. Check places-hangzhou.html (103 dedup places, 82 in-bounds map points, truthful OOB representation)
            page.goto(f'{base_url}/places-hangzhou.html', wait_until='domcontentloaded', timeout=30000)
            page.wait_for_selector('article.card', timeout=10000)
            p_card_count = page.locator('article.card').count()
            assert p_card_count == 103, f'Expected 103 dedup place cards on places-hangzhou.html, got {p_card_count}'
            ptext = page.locator('body').inner_text()
            assert '103 个门店' in ptext and '108 个探店片段' in ptext and '82 个地图点' in ptext, (
                'places-hangzhou.html intro counts mismatch'
            )
            assert '王记糖醋铁板烧（萧山利华路店）' in ptext and '郑阿公顺德鸡煲饭双皮奶（西溪八方城店）' in ptext, (
                'OOB places must appear with real suburban branch names in directory'
            )
            report['checks']['placesPage'] = {'placeCards': p_card_count, 'inBoundsSummary': 82, 'oobVisible': True}

            # 9. Verify main entry index.html defaults to Chongqing (Chongqing compatibility)
            page.goto(f'{base_url}/index.html?view=food', wait_until='domcontentloaded', timeout=45000)
            page.wait_for_function('() => window.foodCityMap?.ready === true', timeout=45000)
            page.wait_for_selector('.food-card', timeout=30000)
            cq_city = page.evaluate('() => window.foodCityMap?.city?.name')
            assert cq_city == '重庆', f'Default city must remain 重庆, got {cq_city}'
            cq_cards = page.locator('.food-card').count()
            assert cq_cards > 10, f'Chongqing default map cards broken: {cq_cards}'
            report['checks']['chongqingCompat'] = {'defaultCity': cq_city, 'chongqingCards': cq_cards}

            browser.close()

        assert not report['pageErrors'], f'Page errors detected: {report["pageErrors"]}'
        assert not report['failedRequests'], f'Failed local requests detected: {report["failedRequests"]}'
        report['status'] = 'PASS'
    finally:
        httpd.shutdown()
        OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
        OUT_JSON.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--dist', default=str(ROOT / 'dist'))
    parser.add_argument('--no-local-videos', action='store_true')
    args = parser.parse_args()
    run_qa(Path(args.dist), expect_local_videos=not args.no_local_videos)
    print(f'Browser E2E QA PASSED -> {OUT_JSON}')
