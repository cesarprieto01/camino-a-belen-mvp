// Prueba: cambiar de día en el panel no sube el scroll ni cambia de pestaña
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/Users/ces/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const p = await (await b.newContext({ viewport: { width: 1500, height: 1000 } })).newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:5190/app.html'); await p.waitForTimeout(900);
const res = [];
for (const tab of ['hoy', 'teodoro']) {
  await p.evaluate(async (tab) => { const c = await import('/js/core.js'); c.reset({ hoy: 2, inscrito: true, teaserVisto: true, tardeVisto: true }); c.save(); c.clearHistory(); c.go(tab, {}, 'none', { tab: true }); }, tab);
  await p.waitForTimeout(1300);
  await p.evaluate(() => { const L = document.querySelector('#viewport .layer:last-child'); L.scrollTop = 520; });
  await p.waitForTimeout(200);
  for (const a of ['dayPlus', 'dayPlus', 'dayMinus']) {
    await p.click(`#panel [data-a="${a}"], #panel [data-act="${a}"], #panel [data-action="${a}"]`).catch(async () => { await p.evaluate(a => [...document.querySelectorAll('#panel *')].find(e => Object.values(e.dataset || {}).includes(a))?.click(), a); });
    await p.waitForTimeout(900);
    res.push(await p.evaluate(async () => { const L = document.querySelector('#viewport .layer:last-child'); const c = await import("/js/core.js"); return `día ${c.S.hoy} ${L.dataset.screen} scroll=${L.scrollTop}`; }));
  }
}
console.log(res.join(' | ')); console.log(errs.length ? 'ERRORES: ' + errs.join(' | ') : 'sin errores'); await b.close();
