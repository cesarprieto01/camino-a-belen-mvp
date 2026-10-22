// Recorrido free: candados, «Desbloquear el día», ventana de pago y Pase simulado: node tools/plan-check.mjs <out-dir>
import { chromium } from 'playwright';
import fs from 'fs';
const dir = process.argv[2] || 'tmp/plan'; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ executablePath: '/Users/ces/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:5190/app.html'); await p.waitForTimeout(1000);
await p.addStyleTag({ content: '#panelBtn{display:none!important}' });
const scr = () => p.evaluate(() => [...document.querySelectorAll('#viewport .layer')].pop()?.dataset.screen);
const shot = n => p.locator('#viewport').screenshot({ path: `${dir}/${n}.png` });
const set = (tema) => p.evaluate(async (tema) => { const c = await import('/js/core.js'); c.reset({ hoy: 13, inscrito: true, teaserVisto: true, plan: 'free', tema }); for (let n = 0; n <= 12; n++) c.S.completos[n] = { contenido: true, trivia: true, estrellas: 2 }; c.save(); c.clearHistory(); c.go('mapa', {}, 'none'); }, tema);
for (const tema of ['claro', 'oscuro']) {
  await set(tema); await p.waitForTimeout(2000);
  const info = await p.evaluate(() => { const L = [...document.querySelectorAll('#viewport .layer')].pop(); return { locks: L.querySelectorAll('.node-lock').length, cta: L.querySelector('[data-sheet] a:last-of-type')?.textContent.trim(), n13: L.querySelector('a[aria-label^="Día 13"]')?.getAttribute('aria-label') }; });
  console.log(tema, JSON.stringify(info)); await shot(`1-mapa-${tema}`);
  await p.evaluate(() => { const L = [...document.querySelectorAll('#viewport .layer')].pop(); [...L.querySelectorAll('[data-sheet] a')].find(a => /Desbloquear/.test(a.textContent))?.click(); });
  await p.waitForTimeout(1200); console.log('tras desbloquear:', await scr()); await shot(`2-pago-${tema}`);
}
await p.evaluate(() => { const L = [...document.querySelectorAll('#viewport .layer')].pop(); [...L.querySelectorAll('a')].find(a => /Pase de Adviento/.test(a.textContent))?.click(); });
await p.waitForTimeout(1800);
console.log('tras el Pase:', await scr(), await p.evaluate(async () => (await import('/js/core.js')).S.plan));
console.log('errores:', errs); await b.close();
