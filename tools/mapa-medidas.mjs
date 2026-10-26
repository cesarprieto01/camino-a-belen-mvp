// Mide el mapa del MVP contra el Figma «Mapa Diozen · Día» (día 9, días 1–8 hechos): cajas de días, íconos, números, estrellas, Teodoro y etiquetas.
// Uso: node tools/mapa-medidas.mjs [carpeta-para-la-captura]
import { chromium } from 'playwright';
const [out] = process.argv.slice(2);
// cajas del Figma (x, y, ancho, alto) en el marco de 390 × 3600
const FIGMA = {
  'día 1 · círculo': [104.09, 3056, 76, 76], 'día 1 · ✓': [127.09, 3066, 30, 30], 'día 1 · número': [137.59, 3099, 9, 22], 'día 1 · estrellas': [110.59, 3125, 63, 22],
  'día 2 · círculo': [186.89, 2946, 76, 76], 'día 2 · estrellas': [193.39, 3015, 63, 22], 'día 5 · círculo': [104.09, 2616, 76, 76], 'día 8 · círculo': [99.5, 2291, 76, 76],
  'día 9 · círculo': [170, 2153, 96, 96], 'día 9 · píldora': [203, 2233, 30, 26], 'Teodoro (dibujo)': [188.5, 2124.8, 59.5, 104.4],
  'día 10 · círculo': [122.5, 2051, 76, 76], 'día 10 · ícono': [138.5, 2056, 44, 44], 'día 10 · número': [151, 2100, 19, 20],
  'día 13 · círculo': [182.3, 1735, 76, 76], 'día 13 · ícono': [198.3, 1740, 44, 44], 'día 20 · círculo': [177.69, 979, 76, 76], 'día 25 · círculo': [180, 433, 76, 76],
  'día 26 · círculo': [85.5, 299, 104, 104], 'día 26 · ícono': [111.5, 306, 52, 52], 'día 26 · número': [123.5, 361, 28, 26],
  '¿Qué habrá aquí?': [206.5, 2071, 143.44, 34],
  'ruleta 4': [256, 2507, 135, 189], 'ruleta 11': [270, 1755, 119, 166], 'ruleta 18': [265, 971, 135, 189], 'ruleta 24': [-8, 320, 119, 166],
  'etiqueta ruleta 4': [281.56, 2689.98, 80.88, 26], 'etiqueta ruleta 11': [270.36, 1914.98, 108.27, 26], 'etiqueta ruleta 18': [288.12, 1159.98, 70.75, 26], 'etiqueta ruleta 24': [24.12, 507.14, 72.75, 26],
};
const b = await chromium.launch({ executablePath: '/Users/ces/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })).newPage();
await p.goto('http://localhost:5190/app.html'); await p.waitForTimeout(800);
await p.evaluate(async () => {
  const c = await import('/js/core.js');
  c.reset({ hoy: 9, inscrito: true, teaserVisto: true, tardeVisto: true, tema: 'claro', bateria: 5, teoMapa: 9 });
  [3, 2, 3, 1, 0, 0, 0, 0].forEach((e, i) => { c.S.completos[i + 1] = { contenido: true, trivia: true, estrellas: e }; });
  c.S.ruletas[4] = 'panes'; c.save();
});
await p.reload(); await p.waitForTimeout(1000);
await p.evaluate(async () => { const c = await import('/js/core.js'); c.clearHistory(); c.go('mapa', { from: 'hoy' }, 'none'); });
await p.waitForTimeout(2000);
const mio = await p.evaluate(() => {
  const L = [...document.querySelectorAll('#viewport .layer')].pop(), R = L.querySelector('.dz-mapa'), r0 = R.getBoundingClientRect(), k = r0.width / 390;
  const caja = el => { if (!el) return null; const r = el.getBoundingClientRect(); return [(r.left - r0.left) / k, (r.top - r0.top) / k, r.width / k, r.height / k]; };
  const texto = el => { if (!el) return null; const g = document.createRange(); g.selectNodeContents(el); const r = g.getBoundingClientRect(); return [(r.left - r0.left) / k, (r.top - r0.top) / k, r.width / k, r.height / k]; };
  const dia = n => R.querySelector(`button[aria-label^="Día ${n},"], button[aria-label^="Día ${n}:"]`);
  const rul = i => R.querySelector(`[aria-label^="Ruleta de la semana ${i}"]`);
  return {
    fuente: document.fonts.check('600 19px Fredoka'),
    'día 1 · círculo': caja(dia(1)), 'día 1 · ✓': caja(dia(1).querySelector('.dz-check')), 'día 1 · número': texto(dia(1).querySelector('.dz-num')), 'día 1 · estrellas': caja(dia(1).querySelector('.dz-estrellas')),
    'día 2 · círculo': caja(dia(2)), 'día 2 · estrellas': caja(dia(2).querySelector('.dz-estrellas')), 'día 5 · círculo': caja(dia(5)), 'día 8 · círculo': caja(dia(8)),
    'día 9 · círculo': caja(dia(9)), 'día 9 · píldora': caja(R.querySelector('.dz-hoy-num')), 'Teodoro (dibujo)': (() => { const t = R.querySelector('.dz-teo'); t.classList.remove('a-bob'); t.style.animation = 'none'; const [x, y, w, h] = caja(t); const a = t.naturalWidth / t.naturalHeight; const dw = Math.min(w, h * a), dh = dw / a; return [x + (w - dw) / 2, y + h - dh, dw, dh]; })(),
    'día 10 · círculo': caja(dia(10)), 'día 10 · ícono': caja(dia(10).querySelector('.dz-ico')), 'día 10 · número': texto(dia(10).querySelector('.dz-num')),
    'día 13 · círculo': caja(dia(13)), 'día 13 · ícono': caja(dia(13).querySelector('.dz-ico')), 'día 20 · círculo': caja(dia(20)), 'día 25 · círculo': caja(dia(25)),
    'día 26 · círculo': caja(dia(26)), 'día 26 · ícono': caja(dia(26).querySelector('.dz-ico')), 'día 26 · número': texto(dia(26).querySelector('.dz-num')),
    '¿Qué habrá aquí?': caja(R.querySelector('.dz-que')),
    ...Object.fromEntries([4, 11, 18, 24].flatMap((d, i) => [[`ruleta ${d}`, caja(rul(i + 1))], [`etiqueta ruleta ${d}`, caja(rul(i + 1)?.querySelector('.dz-etiqueta'))]])),
  };
});
console.log('Fredoka cargada:', mio.fuente);
let peor = 0;
for (const [k, f] of Object.entries(FIGMA)) {
  const m = mio[k];
  if (!m) { console.log(`${k.padEnd(22)} FALTA en el MVP`); continue; }
  const d = m.map((v, i) => v - f[i]); const max = Math.max(...d.map(Math.abs)); peor = Math.max(peor, max);
  console.log(`${k.padEnd(22)} Figma ${f.map(v => v.toFixed(1)).join(', ').padEnd(30)} MVP ${m.map(v => v.toFixed(1)).join(', ').padEnd(30)} ${max < 1.5 ? 'OK' : 'Δ ' + d.map(v => v.toFixed(1)).join(', ')}`);
}
console.log('mayor diferencia:', peor.toFixed(1), 'px');
if (out) {
  // el tramo del día 9 sin la hoja ni la cabecera, para ponerlo junto al Figma
  await p.evaluate(() => { const L = [...document.querySelectorAll('#viewport .layer')].pop(); L.querySelectorAll('[data-sheet], .map-head, .map-velo, .back-hoy').forEach(e => e.style.visibility = 'hidden'); L.firstElementChild.scrollTop = 1900; });
  await p.waitForTimeout(500);
  await p.locator('#viewport .layer:last-child').last().screenshot({ path: `${out}/mvp-tramo.png` });
}
await b.close();
