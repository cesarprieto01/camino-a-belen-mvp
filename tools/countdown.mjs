import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/Users/ces/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.clock.install({ time: new Date(2026, 9, 20, 21, 30, 30) });
await p.goto('http://localhost:5190/app.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.clock.runFor(1500);
const read = () => p.evaluate(() => [...document.querySelectorAll('#viewport .layer:last-child [data-cd]')].map(e => e.textContent).join('·'));
for (const [scr, s] of [['hoy', { inscrito: false }], ['teodoro', { inscrito: false }], ['teodoro', { inscrito: true }], ['teaser', {}], ['espera', { inscrito: true }]]) {
  await p.evaluate(async ([scr, s]) => { const c = await import('/js/core.js'); Object.assign(c.S, { hoy: 0, teaserVisto: true }, s); c.save(); c.go(scr, {}, 'none'); }, [scr, s]);
  await p.clock.runFor(1500); const a = await read(); await p.clock.runFor(120000); const z = await read();
  console.log(scr, JSON.stringify(s), a, '→', z);
}
await p.evaluate(async () => { const c = await import('/js/core.js'); Object.assign(c.S, { hoy: 9, inscrito: true }); c.save(); c.go('cerrado', { day: 9 }, 'none'); });
await p.clock.runFor(1500); const t = () => p.evaluate(() => document.querySelector('#viewport .layer:last-child').textContent.match(/Faltan \d+ h \d+ min/)?.[0]);
const a = await t(); await p.clock.runFor(120000); console.log('cerrado', a, '→', await t());
await b.close();
