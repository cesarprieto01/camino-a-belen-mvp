// Capturas del periodo de gracia (25 dic – 6 ene) y del recuerdo (7 ene): node tools/gracia-check.mjs <out-dir>
import { chromium } from 'playwright';
import fs from 'fs';
const dir = process.argv[2] || 'tmp/gracia'; fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ executablePath: '/Users/ces/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:5190/app.html'); await p.waitForTimeout(1000);
await p.addStyleTag({ content: '#panelBtn{display:none!important}' });
const set = (o) => p.evaluate(async (o) => {
  const c = await import('/js/core.js');
  c.reset({ hoy: o.hoy, tema: o.tema || 'claro', inscrito: o.inscrito ?? true, teaserVisto: true, tardeVisto: o.tardeVisto ?? true, panes: 80 });
  c.S.completos = { 0: { contenido: true } };
  for (let n = 1; n <= (o.upto || 0); n++) c.S.completos[n] = { contenido: true, trivia: true, estrellas: 2 };
  c.save(); c.clearHistory(); c.go(o.scr || 'hoy', {}, 'none', { tab: true }); if (o.abajo) setTimeout(() => { const L = [...document.querySelectorAll('#viewport .layer')].pop(); const k = L?.querySelectorAll('[role=group][aria-label^="Adviento"]'); k?.[k.length - 1]?.scrollIntoView({ block: 'center' }); }, 900);
}, o);
const info = () => p.evaluate(() => {
  const L = [...document.querySelectorAll('#viewport .layer')].pop();
  if (!L) return { vacío: document.querySelector('#viewport')?.innerHTML.slice(0, 200) };
  const t = s => [...L.querySelectorAll(s)].map(e => e.textContent.replace(/\s+/g, ' ').trim()).slice(0, 3);
  // cabecera del mapa: separación mínima entre botones, píldora y batería (nada se toca)
  const head = [...L.querySelectorAll('.map-head > *, .map-head')].filter(e => e.offsetWidth && e.offsetWidth < 300 && getComputedStyle(e).position === 'absolute');
  const rs = head.map(e => e.getBoundingClientRect()).filter(r => r.top < 120).sort((a, b) => a.left - b.left);
  let gap = null; for (let i = 1; i < rs.length; i++) { const g = rs[i].left - rs[i - 1].right; if (Math.abs(rs[i].top - rs[i - 1].top) < 40) gap = gap == null ? g : Math.min(gap, g); }
  return { gap, scr: L.dataset.screen, heroe: t('.heroe-titulo'), pills: t('.gracia-pill'), sheet: L.querySelector('[data-sheet]')?.textContent.replace(/\s+/g, ' ').trim().slice(0, 90), chip: L.querySelector('.map-head [aria-label]')?.getAttribute('aria-label') };
});
const CASOS = [
  ['0-25dic-mapa', { hoy: 27, upto: 3, scr: 'mapa' }], ['0-25dic-mapa-oscuro', { hoy: 27, upto: 3, scr: 'mapa', tema: 'oscuro' }],
  ['1-medias-hoy', { hoy: 32, upto: 14 }], ['2-medias-mapa', { hoy: 32, upto: 14, scr: 'mapa' }], ['3-medias-teodoro', { hoy: 32, upto: 14, scr: 'teodoro', abajo: 1 }], ['3b-medias-hoy-abajo', { hoy: 32, upto: 14, abajo: 1 }],
  ['4-ultimo-hoy', { hoy: 39, upto: 20 }], ['5-nada-hoy', { hoy: 35, upto: 0 }], ['6-completo-hoy', { hoy: 32, upto: 26 }],
  ['7-sin-inscribir-hoy', { hoy: 30, inscrito: false, tardeVisto: false }], ['8-recuerdo-hoy', { hoy: 40, upto: 14 }], ['9-recuerdo-mapa', { hoy: 40, upto: 14, scr: 'mapa' }],
];
for (const [name, o] of CASOS) {
  await set(o); await p.waitForTimeout(o.scr === 'mapa' ? 2200 : 1800);
  console.log(name, JSON.stringify(await info()));
  await p.locator('#viewport').screenshot({ path: `${dir}/${name}.png` });
}
console.log('errores:', errs);
await b.close();
