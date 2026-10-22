// Comprobación: Teodoro siempre en el día del calendario, aunque la familia vaya atrasada
import { chromium } from 'playwright';
const dir = process.argv[2] || 'tmp/teo';
const b = await chromium.launch({ executablePath: '/Users/ces/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:5190/app.html'); await p.waitForTimeout(1000);
const estado = async (hoy, extra = '') => {
  await p.evaluate(async ([hoy, extra]) => {
    const c = await import('/js/core.js');
    c.reset({ hoy, inscrito: true, teaserVisto: true, tardeVisto: true, panes: 50 });
    for (let d = 0; d <= Math.min(hoy, 26); d++) if (d !== 7 && d !== 9 && d !== hoy) c.S.completos[d] = { contenido: true, trivia: d > 0, estrellas: d ? 2 : 0 };
    eval(extra);
    c.save(); c.clearHistory(); c.go('mapa', {}, 'none', { tab: true });
  }, [hoy, extra]);
  await p.waitForTimeout(2600);
};
const donde = () => p.evaluate(async () => {
  const c = await import('/js/core.js');
  const teo = [...document.querySelectorAll('#viewport .layer:last-child img')].find(i => (i.alt || '').startsWith('Teodoro'));
  const n7 = ["7","9"].map(d => document.querySelector(`#viewport .layer:last-child a[aria-label^="Día ${d}"]`)?.getAttribute('aria-label'));
  return { teoMapa: c.S.teoMapa, teoTop: teo && parseFloat(teo.style.top), n7 };
});
const out = [];
await estado(25); out.push(['día 25, día 7 sin hacer', await donde()]);
await p.locator('#viewport').screenshot({ path: `${dir}/1-dia25-atrasado.png` });
await estado(25, "c.S.completos[7] = { contenido: true }; c.S.completos[9] = { contenido: true }; c.S.pasoAnimado = 9;"); out.push(['día 25, vio el cuento del 7', await donde()]);
await p.evaluate(() => { const n = document.querySelector('#viewport .layer:last-child a[aria-label^="Día 9"]'); n.scrollIntoView({ block: 'center' }); });
await p.waitForTimeout(500); await p.locator('#viewport').screenshot({ path: `${dir}/2-dia7-check.png` });
// avanza el calendario: ayer lo vio en el 24, hoy es 25
await estado(25, "c.S.teoMapa = 24;"); out.push(['calendario avanzó 24→25', await donde()]);
console.log(JSON.stringify(out, null, 1), errs);
await b.close();
