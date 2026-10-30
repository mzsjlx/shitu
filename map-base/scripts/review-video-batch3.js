async page => {
  // Run with playwright-cli run-code --filename. All state belongs to fresh contexts.
  const browser = page.context().browser();
  let base = 'http://127.0.0.1:8791';
  try {
    const current = new URL(page.url());
    if (['127.0.0.1', 'localhost', '[::1]'].includes(current.hostname)) base = current.origin;
  } catch {}
  const root = 'D:/codex/美食网站/';
  const workIds = ['7602232743804036730', '7666393424492268852', '7583215165723266354', '7692311805913784713'];
  const report = {
    verifiedOn: new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date()),
    scope: 'Isolated local Chromium: every new clip decodes, one muted advancing playback per source, media cleanup, same-store creator switches, responsive geometry and generated pages. No external platform playback or geographic verification.',
    checks: [], errors: [], media: [], externalRequests: [], screenshots: []
  };
  const check = (name, passed, detail) => report.checks.push({name, passed: !!passed, ...(detail === undefined ? {} : {detail})});
  const errorText = error => String(error?.message || error);
  const shot = async (p, suffix) => {
    const path = root + 'output/playwright/video-batch3-' + suffix + '.png';
    await p.screenshot({path}); report.screenshots.push(path);
  };
  async function isolated(name, body) {
    const context = await browser.newContext({viewport: {width: 1440, height: 960}, reducedMotion: 'reduce'});
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (['http:', 'https:'].includes(url.protocol) && url.origin !== base) {
        report.externalRequests.push({stage: name, origin: url.origin, pathname: url.pathname});
        await route.abort();
      } else await route.continue();
    });
    const p = await context.newPage();
    p.on('pageerror', error => report.errors.push({stage: name, message: errorText(error)}));
    try { await body(p); }
    catch (error) {
      const detail = {message: errorText(error), url: p.url()};
      report.errors.push({stage: name, ...detail}); check(name + ' completes', false, detail);
      await shot(p, 'failure-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).catch(() => {});
    } finally { await context.close(); }
  }
  const foodReady = p => p.waitForFunction(() => window.foodCityMap?.ready && window.foodCityMap?.food?.active, undefined, {timeout: 40000});
  const libraryReady = p => p.waitForFunction(() => document.querySelectorAll('#video-library-sources [data-source]').length > 0 && document.querySelector('#video-library-player video'), undefined, {timeout: 20000});
  const mediaSelector = '#video-library-player video';
  const assetURL = clip => new URL(clip, base + '/').href;
  async function decoded(p, selector, source, segment, asset, surface) {
    const expectedURL = assetURL(asset.clip);
    await p.waitForFunction(({selector, expectedURL}) => {
      const v = document.querySelector(selector);
      return v?.readyState >= 2 && v.videoWidth > 0 && v.currentSrc === expectedURL;
    }, {selector, expectedURL}, {timeout: 20000});
    const value = await p.locator(selector).evaluate(v => ({
      duration: v.duration, width: v.videoWidth, height: v.videoHeight, readyState: v.readyState,
      currentTime: v.currentTime, paused: v.paused, src: v.currentSrc,
      objectFit: getComputedStyle(v).objectFit, error: v.error?.message || null
    }));
    report.media.push({source: source.id, id: segment.id, surface, ...value});
    check(segment.id + ' decodes on ' + surface,
      value.readyState >= 2 && value.width > 0 && value.height > 0 && !value.error &&
      value.src === expectedURL && Math.abs(value.duration - (segment.end - segment.start)) < .25 && value.objectFit === 'contain',
      {...value, expectedDuration: segment.end - segment.start});
    return value;
  }
  async function advance(p, selector, name) {
    const initial = await p.locator(selector).evaluate(async v => { v.muted = true; await v.play(); return v.currentTime; });
    await p.waitForFunction(({selector, initial}) => {
      const v = document.querySelector(selector); return v && !v.paused && v.currentTime > initial + .12;
    }, {selector, initial}, {timeout: 10000});
    check(name + ' really advances after play', true, await p.locator(selector).evaluate(v => ({currentTime: v.currentTime, muted: v.muted})));
  }
  async function remember(p, selector) {
    await p.locator(selector).evaluate(v => { window.__batch3OldVideo = v; });
  }
  async function stopped(p, name) {
    await p.waitForFunction(() => {
      const v = window.__batch3OldVideo; return v?.paused && !v.getAttribute('src') && !v.querySelector('source[src]');
    }, undefined, {timeout: 5000});
    check(name, true, await p.evaluate(() => ({paused: window.__batch3OldVideo.paused, src: window.__batch3OldVideo.getAttribute('src')})));
  }
  let catalog, assets, batchSources = [], allRows = [], batchRows = [], locatedGroups = [];
  await isolated('Catalog and library media', async p => {
    const catalogResponse = await p.request.get(base + '/data/video-library.json');
    const assetsResponse = await p.request.get(base + '/data/video-library-assets.json');
    if (!catalogResponse.ok() || !assetsResponse.ok()) throw new Error('Built video catalog or asset index is unavailable');
    catalog = await catalogResponse.json(); assets = (await assetsResponse.json()).segments;
    batchSources = catalog.sources.filter(source => workIds.some(id => source.url?.endsWith('/video/' + id)));
    allRows = catalog.sources.flatMap(source => source.segments.map(segment => ({source, segment})));
    batchRows = batchSources.flatMap(source => source.segments.map(segment => ({source, segment})));
    const groups = new Map();
    for (const row of allRows) {
      const id = row.segment.placeId || row.segment.id;
      if (!groups.has(id)) groups.set(id, []);
      groups.get(id).push(row);
    }
    locatedGroups = [...groups.entries()].filter(([, rows]) => rows.some(row => row.segment.coordinates));
    report.counts = {
      sources: batchSources.length, newSegments: batchRows.length,
      newUnlocatedSegments: batchRows.filter(row => !row.segment.coordinates).length,
      totalSegments: allRows.length, totalUnlocatedSegments: allRows.filter(row => !row.segment.coordinates).length,
      mapPlaces: locatedGroups.length
    };
    report.sources = batchSources.map(source => ({id: source.id, author: source.author, segments: source.segments.length}));
    check('All four supplied works are present with actual segments', batchSources.length === workIds.length && batchSources.every(source => source.segments.length > 0), report.sources);
    check('Every new segment has a built local clip and poster', batchRows.length > 0 && batchRows.every(({segment}) => assets[segment.id]?.clip && assets[segment.id]?.poster), batchRows.filter(({segment}) => !assets[segment.id]?.clip || !assets[segment.id]?.poster).map(({segment}) => segment.id));
    if (!batchRows.length) throw new Error('No third-batch segments in the built catalog');
    await p.goto(base + '/?view=food&videos=1&clip=' + encodeURIComponent(batchRows[0].segment.id));
    await libraryReady(p); await foodReady(p);
    const totalPending = report.counts.totalUnlocatedSegments;
    const expectedStatus = allRows.filter(({segment}) => assets[segment.id]?.clip).length + ' 个本地片段 · ' + (totalPending ? totalPending + ' 段位置待补' : '位置大致');
    check('Library counts reflect the full current JSON', await p.locator('#video-library-status').innerText() === expectedStatus, expectedStatus);
    let previous = null;
    for (const source of batchSources) {
      if (previous) await remember(p, mediaSelector);
      const tab = p.locator('#video-library-sources [data-source]').filter({hasText: source.author});
      await tab.scrollIntoViewIfNeeded(); await tab.click();
      if (previous) await stopped(p, 'Changing to ' + source.id + ' pauses and unloads the previous source');
      check(source.id + ' exposes every registered segment', await p.locator('.video-clip-card').count() === source.segments.length);
      for (const [index, segment] of source.segments.entries()) {
        const asset = assets[segment.id];
        if (!asset?.clip) { check(segment.id + ' local clip is available', false); continue; }
        const hadVideo = await p.locator(mediaSelector).count() > 0;
        if (hadVideo) await remember(p, mediaSelector);
        // Match by the stable dataset ID as names can legitimately repeat.
        const exactCard = p.locator('#video-library-grid [data-clip="' + segment.id + '"]');
        await exactCard.scrollIntoViewIfNeeded(); await exactCard.click();
        if (hadVideo) await stopped(p, segment.id + ' selection stops the old segment');
        try {
          await decoded(p, mediaSelector, source, segment, asset, 'library');
          check(segment.id + ' keeps the original work and creator',
            (await p.locator('#video-library-player .video-player-kicker').innerText()).includes(source.author) &&
            await p.locator('#video-library-player .video-original-link').getAttribute('href') === source.url);
          if (index === 0) await advance(p, mediaSelector, source.id);
          if (!segment.coordinates) {
            check(segment.id + ' stays playable without a fictitious map action',
              await p.locator('#video-library-player .video-nearby-button').count() === 0 &&
              await p.evaluate(id => !window.foodCityMap.food.records.some(record => record.id === 'video-' + id || record.clips?.some(clip => clip.id === id)), segment.id));
          }
          if (source.url.endsWith('/video/7583215165723266354')) {
            const text = await p.locator('#video-library-player').innerText();
            check(segment.id + ' preserves 2025 publication and historical-footage note', source.publishedOn?.startsWith('2025-') && text.includes(source.publishedOn) && text.includes('2025年'), {publishedOn: source.publishedOn, footageNote: segment.footageNote});
          }
        } catch (error) {
          check(segment.id + ' media verification completes', false, errorText(error));
          report.errors.push({stage: 'clip', id: segment.id, message: errorText(error)});
        }
        previous = segment.id;
      }
    }
    if (await p.locator(mediaSelector).count()) {
      await advance(p, mediaSelector, 'Library before close'); await remember(p, mediaSelector);
      await p.locator('#video-library-close').click(); await stopped(p, 'Closing library unloads active video');
      check('Library is closed after the close control', !await p.locator('#video-library-dialog').evaluate(d => d.open));
    }
  });
  if (catalog && batchRows.length) await isolated('Map groups and popup geometry', async p => {
    const newIds = new Set(batchRows.map(row => row.segment.id));
    const touched = locatedGroups.filter(([, rows]) => rows.some(row => newIds.has(row.segment.id)));
    const shared = touched.filter(([, rows]) => rows.length > 1 && new Set(rows.map(row => row.source.id)).size > 1);
    await p.goto(base + '/?view=food'); await foodReady(p);
    check('Distinct located places have one marker each', await p.locator('.food-card').count() === locatedGroups.length, {expected: locatedGroups.length, actual: await p.locator('.food-card').count()});
    check('New same-store creator matches were found dynamically', shared.length > 0, shared.map(([id, rows]) => ({id, clips: rows.map(row => row.segment.id)})));
    async function show(id, clipId) {
      await p.evaluate(({id, clipId}) => {
        const food = window.foodCityMap.food, item = food.records.find(record => record.id === 'video-' + id);
        if (!item) throw new Error('Missing map stop: ' + id);
        food.focusStops(item.id); food.overlay.showPopover(item, true, clipId);
      }, {id, clipId});
      await p.locator('.food-inline-popover.is-shown').waitFor({state: 'visible'});
    }
    for (const [id, rows] of shared) {
      const first = rows.find(row => newIds.has(row.segment.id)), second = rows.find(row => row.source.id !== first.source.id);
      await show(id, first.segment.id);
      const markerCount=await p.locator('.food-card[data-food-id="video-' + id + '"]').count(),recordCount=await p.evaluate(id=>window.foodCityMap.food.records.filter(record=>record.id==='video-'+id).length,id),choiceCount=await p.locator('.food-popover-clip').count();
      check(id + ' keeps all creator choices at one marker', markerCount===1&&recordCount===1&&choiceCount===rows.length,{markerCount,recordCount,choiceCount,expectedChoices:rows.length});
      await p.locator('.food-popover-play').click();
      await decoded(p, '.food-popover-media video', first.source, first.segment, assets[first.segment.id], 'shared popup');
      await advance(p, '.food-popover-media video', id + ' first creator'); await remember(p, '.food-popover-media video');
      await p.locator('.food-popover-clip[data-clip-id="' + second.segment.id + '"]').click();
      await stopped(p, id + ' creator switch stops and unloads the prior audio');
      check(id + ' switches attribution and original work with the clip', (await p.locator('.food-popover-heading small').innerText()).includes(second.source.author) && await p.locator('.food-popover-links a').getAttribute('href') === second.source.url);
      await p.locator('.food-popover-play').click();
      await decoded(p, '.food-popover-media video', second.source, second.segment, assets[second.segment.id], 'shared popup');
      await advance(p, '.food-popover-media video', id + ' second creator');
    }
    const geometryCases = [];
    const largest = [...touched].sort((a, b) => b[1].length - a[1].length)[0];
    if (largest) geometryCases.push({label: 'shared', id: largest[0], row: largest[1].find(row => newIds.has(row.segment.id))});
    const pp = batchRows.find(({source, segment}) => source.url.endsWith('/video/7583215165723266354') && segment.coordinates);
    if (pp && (!largest || largest[0] !== (pp.segment.placeId || pp.segment.id))) geometryCases.push({label: 'pp-2025', id: pp.segment.placeId || pp.segment.id, row: pp});
    check('At least one new located clip is available for popup checks', geometryCases.length > 0);
    for (const [width, height] of [[1440, 960], [390, 844], [320, 680], [736, 414]]) {
      await p.setViewportSize({width, height});
      for (const item of geometryCases) {
        await show(item.id, item.row.segment.id);
        if (await p.locator('.food-popover-play').count()) await p.locator('.food-popover-play').click();
        await decoded(p, '.food-popover-media video', item.row.source, item.row.segment, assets[item.row.segment.id], 'popup ' + width);
        const geometry = await p.evaluate(() => {
          const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return {left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height}; };
          return {popup:rect('.food-inline-popover'), media:rect('.food-popover-media'), video:rect('.food-popover-media video'), pageWidth:document.documentElement.scrollWidth, viewport:{width:innerWidth,height:innerHeight}};
        });
        const r = geometry.popup, m = geometry.media;
        check(item.label + ' popup fits ' + width + 'x' + height,
          r.left >= -1 && r.top >= -1 && r.right <= width + 1 && r.bottom <= height + 1 && geometry.pageWidth <= width + 1, geometry);
        check(item.label + ' media occupies at least two-thirds at ' + width + 'x' + height,
          m.height + 2 >= r.height * 2 / 3 && geometry.video.height > 0, {...geometry, mediaHeightRatio:m.height/r.height});
        await shot(p, 'popup-' + item.label + '-' + width);
      }
    }
    if (await p.locator('.food-popover-media video').count()) {
      await remember(p, '.food-popover-media video');
      const other = touched.find(([id]) => id !== geometryCases.at(-1)?.id);
      if (other) { await show(other[0], other[1][0].segment.id); await stopped(p, 'Changing map shop unloads the previous video'); }
      const active = p.locator('.food-popover-media video');
      if (!await active.count() && await p.locator('.food-popover-play').count()) await p.locator('.food-popover-play').click();
      if (await active.count()) { await remember(p, '.food-popover-media video'); await p.locator('.food-popover-close').click(); await stopped(p, 'Closing popup unloads its video'); }
      check('Map popup is hidden after close', await p.locator('.food-inline-popover').isHidden());
    }
    check('Media checks never add favorites', await p.evaluate(() => window.foodCityMap.food.saved.length === 0));
  });
  if (catalog && batchRows.length) await isolated('Generated source pages', async p => {
    for (const {source, segment} of batchRows) {
      const response = await p.request.get(base + '/places/video-' + encodeURIComponent(segment.id) + '.html');
      const body = await response.text();
      check(segment.id + ' has a generated source page', response.ok() && body.includes(source.author) && body.includes(source.url));
      if (!segment.coordinates) check(segment.id + ' generated page has no made-up place link', !body.includes('place=video-' + segment.id));
    }
    const videos = await p.request.get(base + '/videos.html'), directoryBody = await videos.text();
    check('Generated video directory credits all new sources', videos.ok() && batchSources.every(source => directoryBody.includes(source.author) && directoryBody.includes(source.url)));
    for (const source of batchSources) {
      const segment = source.segments.find(value => value.coordinates) || source.segments[0];
      await p.goto(base + '/places/video-' + encodeURIComponent(segment.id) + '.html');
      check(source.id + ' page visibly identifies its store and creator', await p.locator('h1').innerText() === segment.name && (await p.locator('main').innerText()).includes(source.author));
      if (source.url.endsWith('/video/7583215165723266354')) check('PP generated page retains the 2025 footage date', (await p.locator('main').innerText()).includes('2025年'));
      const back = p.locator('header nav a').filter({hasText: '回地图'});
      const href = new URL(await back.getAttribute('href'), p.url());
      check(source.id + ' page offers a local map return', href.origin === base && href.searchParams.get('view') === 'food');
      await back.click(); await foodReady(p);
      check(source.id + ' generated-page return really loads the map', await p.evaluate(() => window.foodCityMap.ready && window.foodCityMap.food.active));
    }
  });
  check('No runtime or media verification errors', report.errors.length === 0, report.errors);
  check('No external platform or third-party prefetch requests', report.externalRequests.length === 0, report.externalRequests);
  report.passed = report.checks.length > 0 && report.checks.every(value => value.passed);
  return report;
}
