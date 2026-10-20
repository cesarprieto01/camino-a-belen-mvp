import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/Users/ces/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('http://localhost:5190/app.html'); await p.waitForTimeout(1500);
const st = () => p.evaluate(() => [...document.querySelectorAll('#viewport .layer')].map(l => l.dataset.screen + '[' + l.className.replace('layer', '').trim() + ']').join(' > '));
await p.evaluate(async () => { const c = await import('/js/core.js'); Object.assign(c.S, { hoy: 0, inscrito: false, teaserVisto: true }); c.save(); c.go('hoy', {}, 'none', { tab: true }); });
await p.waitForTimeout(900);
await p.evaluate(async () => { const c = await import('/js/core.js'); c.go('teaser', {}, 'modal'); });
await p.waitForTimeout(900); console.log(await st());
await p.evaluate(() => { const L = document.querySelector('#viewport .layer:last-child'); [...L.querySelectorAll('a,button,[aria-label]')].find(e => /^inscribirme/i.test((e.getAttribute('aria-label') || e.textContent).trim())).click(); });
for (const t of [100, 400, 900, 2500]) { await p.waitForTimeout(t); console.log(t, await st()); }
await b.close();
