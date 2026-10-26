// Captura el mapa del camino en el día 9 (claro y oscuro): la vista de entrada y el mapa entero.
// Uso: node tools/mapa-app.mjs <carpeta> [hoy=9]
import { chromium } from 'playwright';
const [out, hoyArg] = process.argv.slice(2);
const hoy = +(hoyArg || 9);
const b = await chromium.launch({ executablePath: '/Users/ces/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:5190/app.html'); await p.waitForTimeout(900);
await p.addStyleTag({ content: '#panelBtn{display:none!important}' });
for (const tema of ['claro', 'oscuro']) {
  await p.evaluate(async ([tema, hoy]) => {
    const c = await import('/js/core.js');
    c.reset({ hoy, inscrito: true, teaserVisto: true, tardeVisto: true, tema, bateria: 5, sinCaminar: 0, pilaVista: 5, teoMapa: hoy });
    const est = [3, 2, 3, 1, 0, 0, 0, 0, 3, 2, 3, 1, 3, 2, 3, 1, 3, 2, 3, 1, 3, 2, 3, 1];
    for (let n = 1; n < hoy && n <= 26; n++) c.S.completos[n] = { contenido: true, trivia: true, estrellas: est[n - 1] };
    c.save();
  }, [tema, hoy]);
  await p.reload(); await p.waitForTimeout(1200);
  await p.addStyleTag({ content: '#panelBtn{display:none!important}' });
  await p.evaluate(async () => { const c = await import('/js/core.js'); c.clearHistory(); c.go('mapa', { from: 'hoy' }, 'none'); });
  await p.waitForTimeout(1800);
  await p.screenshot({ path: `${out}/mapa-${tema}-vista.png` });
  // el mapa entero: se agranda la ventana a lo alto del scroller
  const h = await p.evaluate(() => { const L = [...document.querySelectorAll('#viewport .layer')].pop(); const sc = L.firstElementChild; return sc.scrollHeight; });
  const sc = await p.evaluateHandle(() => [...document.querySelectorAll('#viewport .layer')].pop().firstElementChild);
  const shots = [];
  for (let y = 0; y < h; y += 844) {
    await p.evaluate(([el, y]) => { el.scrollTop = y; }, [sc, y]); await p.waitForTimeout(250);
    shots.push(await sc.asElement().screenshot());
  }
  const html = `<body style="margin:0;display:flex;gap:6px;background:#888">${shots.map(s => `<img src="data:image/png;base64,${s.toString('base64')}" style="width:300px">`).join('')}</body>`;
  const q = await (await b.newContext({ viewport: { width: 306 * shots.length, height: 650 } })).newPage();
  await q.setContent(html); await q.waitForTimeout(300); await q.screenshot({ path: `${out}/mapa-${tema}-entero.png`, fullPage: true });
}
console.log(errs.length ? 'ERRORES: ' + errs.join(' | ') : 'sin errores'); await b.close();
