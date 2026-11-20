#!/usr/bin/env node
/**
 * Zero-dependency rendered QA gate for pilgrimsnest.org using local Chrome/Edge CDP.
 * Usage: node scripts/check-rendered.mjs
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain; charset=utf-8',
};

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  const pwDir = path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright');
  if (fs.existsSync(pwDir)) {
    for (const entry of fs.readdirSync(pwDir).sort().reverse()) {
      if (!entry.startsWith('chromium')) continue;
      for (const sub of ['chrome-win64/chrome.exe', 'chrome-win/chrome.exe', 'chrome-headless-shell-win64/chrome-headless-shell.exe']) {
        const p = path.join(pwDir, entry, sub);
        if (fs.existsSync(p)) return p;
      }
    }
  }
  throw new Error('No Chrome/Edge/Chromium executable found. Set CHROME_PATH to override.');
}

const checks = [];
function assert(cond, label, detail = '') {
  checks.push({ ok: Boolean(cond), label, detail });
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const file = path.resolve(root, rel);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

let browserProc = null;
let ws = null;
const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'pn_rendered_'));

try {
  const browserPath = findBrowser();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  browserProc = spawn(browserPath, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=0',
    '--remote-allow-origins=*',
    `--user-data-dir=${userData}`,
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  const wsUrl = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Browser startup timeout')), 12000);
    let buf = '';
    browserProc.stderr.on('data', (chunk) => {
      buf += chunk.toString();
      const m = buf.match(/(ws:\/\/127\.0\.0\.1:\d+\/devtools\/browser\/[\w-]+)/);
      if (m) {
        clearTimeout(timer);
        resolve(m[1]);
      }
    });
    browserProc.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`Browser exited early (${code})`));
    });
  });

  ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let nextId = 0;
  const pending = new Map();
  const consoleErrors = [];
  const pageErrors = [];
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      pageErrors.push(msg.params.exceptionDetails.text);
    } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(msg.params.args.map((a) => a.value || a.description).join(' '));
    }
  };
  const call = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  const evalPage = async (sessionId, expression, awaitPromise = false) => {
    const res = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise }, sessionId);
    if (res.exceptionDetails) throw new Error(res.exceptionDetails.text);
    return res.result.value;
  };
  const navWait = async (sessionId, url, expectedPath) => {
    await call('Page.navigate', { url }, sessionId);
    for (let i = 0; i < 45; i++) {
      await new Promise((r) => setTimeout(r, 100));
      const v = await evalPage(sessionId, `({ ready: document.readyState, path: location.pathname, menu: document.querySelector('.menu-toggle')?.hidden })`);
      if (v && v.path === expectedPath && v.ready === 'complete' && v.menu === false) break;
    }
    await new Promise((r) => setTimeout(r, 150));
  };

  const { targetId } = await call('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await call('Target.attachToTarget', { targetId, flatten: true });
  await call('Page.enable', {}, sessionId);
  await call('Runtime.enable', {}, sessionId);
  await call('Page.addScriptToEvaluateOnNewDocument', {
    source: "window.__cspViolations=[];document.addEventListener('securitypolicyviolation',e=>window.__cspViolations.push({directive:e.violatedDirective,blocked:e.blockedURI}));",
  }, sessionId);

  const favRes = await fetch(`${base}/favicon.ico`);
  assert(favRes.status === 200, 'favicon.ico returns HTTP 200', `status=${favRes.status}`);

  for (const vp of [{ w: 1280, h: 800 }, { w: 375, h: 812 }]) {
    await call('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: 1, mobile: vp.w < 600 }, sessionId);
    for (const p of ['/index.html', '/music.html', '/films.html', '/404.html']) {
      consoleErrors.length = 0;
      pageErrors.length = 0;
      await navWait(sessionId, base + p, p);
      const report = await evalPage(sessionId, `(async () => {
        await document.fonts.ready;
        const vw = window.innerWidth;
        const sw = document.documentElement.scrollWidth;
        const overflowEls = [...document.querySelectorAll('*')]
          .filter(el => el.offsetParent !== null && el.getBoundingClientRect().right > vw + 1)
          .slice(0, 5)
          .map(el => el.tagName + '.' + el.className + ':' + Math.round(el.getBoundingClientRect().right));
        const brokenImgs = [...document.images]
          .filter(i => i.loading !== 'lazy' && (!i.complete || i.naturalWidth === 0))
          .map(i => i.src);
        const externalImgs = [...document.images]
          .filter(i => !i.src.startsWith(location.origin))
          .map(i => i.src);
        const missingAlt = [...document.images].filter(i => !i.hasAttribute('alt')).length;
        const onerrorCount = document.querySelectorAll('[onerror]').length;
        const h1Count = document.querySelectorAll('h1').length;
        const lang = document.documentElement.lang;
        const hasMain = !!document.getElementById('main');
        const smallOrUnnamed = [...document.querySelectorAll('a, button, input, select')].filter(el => {
          const cs = getComputedStyle(el);
          if (el.hidden || cs.display === 'none' || cs.visibility === 'hidden') return false;
          const r = el.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) return false;
          const label = el.getAttribute('aria-label') || el.textContent.trim() || el.placeholder || el.title || (el.id && document.querySelector('label[for="' + el.id + '"]')?.textContent.trim()) || '';
          return r.height < 44 || !label;
        }).map(el => el.tagName + '#' + el.id + '.' + el.className);
        const jsonld = [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => JSON.parse(s.textContent));
        const hasCsp = !!document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        const hasReferrer = !!document.querySelector('meta[name="referrer"]');
        const cspViolations = [...(window.__cspViolations || [])];
        return { vw, sw, overflow: sw > vw, overflowEls, brokenImgs, externalImgs, missingAlt, onerrorCount, h1Count, lang, hasMain, smallOrUnnamed, jsonldCount: jsonld.length, hasCsp, hasReferrer, cspViolations };
      })()`, true);

      const tag = `${p} @ ${vp.w}x${vp.h}`;
      assert(consoleErrors.length === 0, `${tag}: 0 console errors`, consoleErrors.join('; '));
      assert(pageErrors.length === 0, `${tag}: 0 page errors`, pageErrors.join('; '));
      assert(report.hasCsp && report.hasReferrer, `${tag}: CSP & referrer meta present`);
      assert(report.cspViolations.length === 0, `${tag}: 0 CSP violations`, JSON.stringify(report.cspViolations));
      assert(!report.overflow && report.overflowEls.length === 0, `${tag}: 0 horizontal overflow`, JSON.stringify(report.overflowEls));
      assert(report.brokenImgs.length === 0, `${tag}: 0 broken eager images`, JSON.stringify(report.brokenImgs));
      assert(report.externalImgs.length === 0, `${tag}: 0 external images`, JSON.stringify(report.externalImgs));
      assert(report.missingAlt === 0, `${tag}: all images have alt`);
      assert(report.onerrorCount === 0, `${tag}: 0 inline onerror handlers`);
      assert(report.lang === 'en' && report.h1Count === 1 && report.hasMain, `${tag}: lang=en, 1 h1, #main present`);
      assert(report.smallOrUnnamed.length === 0, `${tag}: all visible controls >=44px & named`, JSON.stringify(report.smallOrUnnamed));
      if (p !== '/404.html') assert(report.jsonldCount === 1, `${tag}: JSON-LD parses cleanly`);
    }
  }

  // index.html 375x812 checks
  await call('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true }, sessionId);
  await navWait(sessionId, `${base}/index.html`, '/index.html');
  const idx375 = await evalPage(sessionId, `(() => {
    const panels = [...document.querySelectorAll('.path-panel')].map(p => {
      const pr = p.getBoundingClientRect(), img = p.querySelector('img').getBoundingClientRect(), cta = p.querySelector('.gold-link').getBoundingClientRect();
      return { clippedRight: Math.round(img.right - pr.right), ctaInFold: cta.bottom <= 812 };
    });
    const toggle = document.querySelector('.menu-toggle');
    toggle.click();
    const opened = document.getElementById('primary-nav').classList.contains('is-open');
    document.body.click();
    const closedOutside = !document.getElementById('primary-nav').classList.contains('is-open');
    toggle.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    const closedEsc = !document.getElementById('primary-nav').classList.contains('is-open');
    return { panels, opened, closedOutside, closedEsc };
  })()`);
  assert(idx375.panels.every((p) => p.clippedRight <= -10 && p.ctaInFold), 'index.html 375x812: panels unclipped & both CTAs above fold', JSON.stringify(idx375.panels));
  assert(idx375.opened && idx375.closedOutside && idx375.closedEsc, 'index.html 375x812: mobile nav opens & closes on outside click and Escape');

  // music.html desktop checks (fonts, covers, lyrics modal + deep link, JS-disabled)
  await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false }, sessionId);
  await call('Page.navigate', { url: `${base}/music.html#lyrics=tears-in-the-rain` }, sessionId);
  await new Promise((r) => setTimeout(r, 700));
  const musChk = await evalPage(sessionId, `(async () => {
    await document.fonts.ready;
    const d = document.getElementById('lyricsDialog');
    const opened = !!(d && d.open);
    const bodyRole = d ? d.querySelector('.lyrics-body').getAttribute('role') : null;
    const bodyLen = d ? d.querySelector('.lyrics-body').textContent.length : 0;
    const closeBtn = d ? d.querySelector('.lyrics-close') : null;
    if (closeBtn) closeBtn.click();
    await new Promise(r => setTimeout(r, 80));
    const closedByForm = !!(d && !d.open);
    const cspAfterForm = [...(window.__cspViolations || [])];
    const covers = [...document.querySelectorAll('.feature-cover, .single-cover')];
    covers.forEach(i => { i.loading = 'eager'; });
    await Promise.all(covers.map(i => i.complete ? null : new Promise(res => { i.onload = res; i.onerror = res; })));
    const italicLoaded = [...document.fonts].some(f => f.family.includes('Cormorant') && f.style === 'italic' && f.status === 'loaded');
    return {
      opened, bodyRole, bodyLen, closedByForm, cspAfterForm, hashAfterClose: location.hash,
      artistFont: getComputedStyle(document.querySelector('.artist-name')).fontFamily,
      albumFont: getComputedStyle(document.querySelector('.album-title')).fontFamily,
      italicLoaded,
      coversCount: covers.length,
      covers600: covers.every(i => i.complete && i.naturalWidth === 600 && i.naturalHeight === 600),
    };
  })()`, true);
  assert(musChk.opened && musChk.bodyRole === 'region' && musChk.bodyLen > 500 && musChk.closedByForm && musChk.hashAfterClose === '', 'music.html: lyrics deep-link modal opens & form-close clears hash');
  assert(musChk.cspAfterForm.length === 0, 'music.html: 0 CSP violations on form[method=dialog] close', JSON.stringify(musChk.cspAfterForm));
  assert(musChk.artistFont.includes('Cinzel') && musChk.albumFont.includes('Cinzel') && musChk.italicLoaded, 'music.html: Cinzel display + Cormorant italic loaded');
  assert(musChk.coversCount === 9 && musChk.covers600, 'music.html: all 9 local covers loaded at 600x600');

  await call('Emulation.setScriptExecutionDisabled', { value: true }, sessionId);
  await call('Page.navigate', { url: `${base}/music.html` }, sessionId);
  await new Promise((r) => setTimeout(r, 400));
  await call('Emulation.setScriptExecutionDisabled', { value: false }, sessionId);
  const musNoJs = await evalPage(sessionId, `({
    featured: !!document.getElementById('featuredRelease'),
    singles: document.querySelectorAll('.single-card').length,
    tracks: document.querySelectorAll('.album-track-link').length,
    lyrics: document.querySelectorAll('a[data-lyrics]').length,
    loading: document.querySelectorAll('.release-loading').length,
  })`);
  assert(musNoJs.featured && musNoJs.singles === 7 && musNoJs.tracks === 18 && musNoJs.lyrics === 8 && musNoJs.loading === 0, 'music.html JS-disabled: full static catalogue renders', JSON.stringify(musNoJs));

  // films.html discovery controls, year/account/search/reset, reduced-motion, delegated fallback
  await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, sessionId);
  await navWait(sessionId, `${base}/films.html?account=thetruegentile&year=2025`, '/films.html');
  const filmsChk = await evalPage(sessionId, `(() => {
    const cards = [...document.querySelectorAll('.film-card')];
    const urlFiltered = cards.filter(c => !c.hidden);
    const urlAllMatch = urlFiltered.length > 0 && urlFiltered.every(c => c.dataset.account === 'thetruegentile' && c.dataset.year === '2025');
    document.querySelector('button[data-account="all"]').click();
    document.getElementById('filmYear').value = 'all';
    document.getElementById('filmYear').dispatchEvent(new Event('change'));
    const search = document.getElementById('filmSearch');
    search.value = 'Jehovah';
    search.dispatchEvent(new Event('input'));
    const searchVis = cards.filter(c => !c.hidden).length;
    search.value = 'zzzz-no-match-check';
    search.dispatchEvent(new Event('input'));
    const zeroVis = cards.filter(c => !c.hidden).length;
    const emptyVisible = !document.getElementById('filmEmpty').hidden;
    document.querySelector('.film-reset').click();
    const afterResetVis = cards.filter(c => !c.hidden).length;
    const searchAfterReset = location.search;
    const statusText = document.getElementById('ambientStatus').textContent;
    const firstImg = document.querySelector('.film-still-image');
    firstImg.dispatchEvent(new Event('error', { bubbles: false }));
    const fallbackDisplay = getComputedStyle(firstImg.closest('.film-still').querySelector('.film-still-fallback')).display;
    return { total: cards.length, urlFilteredCount: urlFiltered.length, urlAllMatch, searchVis, zeroVis, emptyVisible, afterResetVis, searchAfterReset, statusText, imgHidden: firstImg.hidden, fallbackDisplay };
  })()`);
  assert(filmsChk.total === 227 && filmsChk.urlAllMatch, 'films.html: ?account=thetruegentile&year=2025 filters accurately', JSON.stringify(filmsChk));
  assert(filmsChk.searchVis >= 1 && filmsChk.searchVis < 10 && filmsChk.zeroVis === 0 && filmsChk.emptyVisible, 'films.html: search narrows matches & shows empty state on 0 hits');
  assert(filmsChk.afterResetVis === 227 && filmsChk.searchAfterReset === '', 'films.html: reset restores all 227 cards & clears query');
  assert(filmsChk.statusText === '' && filmsChk.imgHidden && filmsChk.fallbackDisplay === 'grid', 'films.html: reduced motion silent & delegated error fallback shows grid');

  await navWait(sessionId, `${base}/404.html`, '/404.html');
  const hasFooter404 = await evalPage(sessionId, `!!document.querySelector('footer.portfolio-footer')`);
  assert(hasFooter404, '404.html: includes footer.portfolio-footer');

  const failed = checks.filter((c) => !c.ok);
  for (const c of checks) {
    console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.label}${c.detail && !c.ok ? ' — ' + c.detail : ''}`);
  }
  console.log(`\nRendered QA summary: ${checks.length - failed.length}/${checks.length} passed.`);
  process.exitCode = failed.length ? 1 : 0;
} finally {
  try { ws?.close(); } catch {}
  try { browserProc?.kill(); } catch {}
  try { server.close(); } catch {}
  setTimeout(() => {
    try { fs.rmSync(userData, { recursive: true, force: true }); } catch {}
    process.exit(process.exitCode || 0);
  }, 200);
}
