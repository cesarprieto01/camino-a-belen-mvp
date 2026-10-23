import { chromium } from 'playwright';
const [out] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/Users/ces/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:5190/app.html'); await p.waitForTimeout(900);
await p.addStyleTag({ content: '#panelBtn{display:none!important}' });
const shots = [];
for (const [bat, sin, tema, tab] of [[4, 1, 'claro', 'hoy'], [4, 1, 'oscuro', 'teodoro'], [0, 5, 'claro', 'hoy'], [0, 5, 'oscuro', 'teodoro']]) {
  await p.evaluate(async ([bat, sin, tema, tab]) => { const c = await import('/js/core.js'); c.reset({ hoy: 9, inscrito: true, teaserVisto: true, tardeVisto: true, tema, bateria: bat, sinCaminar: sin, pilaVista: bat }); for (let n = 1; n <= 3; n++) c.S.completos[n] = { contenido: true, trivia: true }; c.save(); c.clearHistory(); c.go(tab, {}, 'none', { tab: true }); }, [bat, sin, tema, tab]);
  await p.waitForTimeout(1600);
  const el = await p.evaluateHandle(() => { const L = [...document.querySelectorAll('#viewport .layer')].pop(); const s = [...L.querySelectorAll('a[aria-label="Ver el camino"]')]; const a = s[s.length - 1]; a.scrollIntoView({ block: 'center' }); return a.closest('[role=group]') || a; });
  await p.waitForTimeout(300);
  shots.push(await el.asElement().screenshot());
}
const html = `<body style="margin:0;display:flex;gap:8px;background:#888">${shots.map(s => `<img src="data:image/png;base64,${s.toString('base64')}" style="width:360px">`).join('')}</body>`;
const q = await (await b.newContext({ viewport: { width: 368 * shots.length, height: 400 } })).newPage();
await q.setContent(html); await q.waitForTimeout(300); await q.screenshot({ path: out, fullPage: true });
console.log(errs.length ? 'ERRORES: ' + errs.join(' | ') : 'sin errores'); await b.close();
