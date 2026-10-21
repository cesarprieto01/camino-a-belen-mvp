import { chromium } from 'playwright';
import fs from 'fs';
const [dir, vw = '390', vh = '844', temas = 'claro,oscuro'] = process.argv.slice(2); fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ executablePath: '/Users/ces/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const p = await (await b.newContext({ viewport: { width: +vw, height: +vh }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.goto('http://localhost:5190/app.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1000);
await p.addStyleTag({ content: '#panelBtn,#toast{display:none!important}' });
const js = (f, a) => p.evaluate(f, a); const W = ms => p.waitForTimeout(ms);
const tap = q => js(q => { const L = document.querySelector('#viewport .layer:last-child'); const el = [...L.querySelectorAll('a,button,[role=button],[aria-label]')].find(e => (e.getAttribute('aria-label') || e.textContent).trim().startsWith(q)); el?.click(); return !!el; }, q);
const layers = () => js(() => [...document.querySelectorAll('#viewport .layer')].map(l => l.dataset.screen).join('>'));
const shot = async n => { await js(() => document.querySelectorAll('.floaty, .confetti, canvas').forEach(e => e.remove())); await p.screenshot({ path: `${dir}/${n}.jpg`, type: 'jpeg', quality: 84 }); };
const open = (tema, n) => js(async ([tema, n]) => { const c = await import('/js/core.js'); const g = await import('/js/games.js'); c.reset({ hoy: n, inscrito: true, teaserVisto: true, tema }); c.S.completos = { 0: { contenido: true } }; for (let k = 1; k < n; k++) c.S.completos[k] = { contenido: true, trivia: true, estrellas: 2 }; c.S.completos[n] = { contenido: true }; c.save(); c.clearHistory(); c.go('mapa', {}, 'none', { tab: true }); await new Promise(r => setTimeout(r, 500)); await c.go('completado', { day: n }, 'fade', { replace: true }); await new Promise(r => setTimeout(r, 300)); const root = document.querySelector('#viewport .layer:last-child .root > div'); if (!root.querySelector('.rate-row')) g.rateRow(root, n); }, [tema, n]);
const overlap = () => js(() => { const L = document.querySelector('#viewport .layer:last-child'); const r = e => e?.getBoundingClientRect(); const row = r(L.querySelector('.rate-row')); const teo = r([...L.querySelectorAll('img')].find(i => /Teodoro/.test(i.alt || '') || i.style.zIndex === '2')); const btn = r([...L.querySelectorAll('a')].find(a => /^(¡A jugar!|Abrir la sorpresa|Volver al camino)$/.test(a.textContent.trim()))); const sub = r([...L.querySelectorAll('.root > div > div')].find(d => /sobre el|juego sorpresa/.test(d.textContent) && d.style.display !== 'none' && d.children.length === 0)); return `fila ${row?.top.toFixed(0)}-${row?.bottom.toFixed(0)} · teo fin ${teo?.bottom.toFixed(0)} · sub ${sub ? sub.top.toFixed(0) + '-' + sub.bottom.toFixed(0) : '-'} · botón ${btn?.top.toFixed(0)}`; });
for (const tema of temas.split(',')) {
  for (const [n, tag] of [[9, 'trivia'], [12, 'sorpresa'], [10, 'nada']]) {
    await open(tema, n); await W(1500); await shot(`terminaste-${tag}-${tema}-${vw}`); console.log(tema, tag, await overlap());
  }
  await open(tema, 9); await W(900); await tap('4 de 5'); await W(700); await shot(`terminaste-4-${tema}-${vw}`);
  console.log('guardado', await js(async () => JSON.stringify((await import('/js/core.js')).S.calificaciones)), await js(() => document.querySelector('.rr-q').textContent));
  await tap('Compartir'); await W(1200); await shot(`compartir-${tema}-${vw}`); console.log(tema, await layers());
  await tap('Cerrar'); await W(900); console.log(tema, 'tras X', await layers(), await js(() => document.querySelector('#viewport .layer:last-child [aria-checked=true]')?.getAttribute('aria-label')));
}
await b.close();
