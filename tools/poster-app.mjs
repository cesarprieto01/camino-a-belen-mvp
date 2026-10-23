// node tools/poster-app.mjs <salida.png> <hoy,hoy,...> [oscuro]
import { chromium } from 'playwright';
const [out, dias, tema = 'claro'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/Users/ces/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:5190/app.html'); await p.waitForTimeout(900);
await p.addStyleTag({ content: '#panelBtn{display:none!important}' });
const shots = [];
for (const d of dias.split(',').map(Number)) {
  await p.evaluate(async ([d, tema]) => { const c = await import('/js/core.js'); c.reset({ hoy: d, inscrito: true, teaserVisto: true, tardeVisto: true, tema }); for (let n = 1; n < Math.min(d, 27); n++) c.S.completos[n] = { contenido: true, trivia: true }; c.save(); c.clearHistory(); c.go('hoy', {}, 'none', { tab: true }); }, [d, tema]);
  await p.waitForTimeout(1500);
  const el = await p.$('.theo-heroe');
  shots.push(await el.screenshot());
}
const html = `<body style="margin:0;display:flex;gap:6px;background:#888">${shots.map(s => `<img src="data:image/png;base64,${s.toString('base64')}" style="width:390px">`).join('')}</body>`;
const q = await (await b.newContext({ viewport: { width: 396 * shots.length, height: 400 }, deviceScaleFactor: 1 })).newPage();
await q.setContent(html); await q.waitForTimeout(300); await q.screenshot({ path: out, fullPage: true });
console.log(errs.length ? 'ERRORES: ' + errs.join(' | ') : 'sin errores'); await b.close();
