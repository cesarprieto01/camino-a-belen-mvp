// Vista previa: una escena de la pila dentro de las 3 piezas (destacado y pieza grande de Hoy, pieza del tab Teodoro)
// node tools/pila-preview.mjs <imagen.png> <salida.png> [oscuro]
import { chromium } from 'playwright';
import fs from 'fs';
const [img, out, tema = 'claro'] = process.argv.slice(2);
const b64 = 'data:image/png;base64,' + fs.readFileSync(img).toString('base64');
const b = await chromium.launch({ executablePath: '/Users/ces/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
await p.goto('http://localhost:5190/app.html'); await p.waitForTimeout(900);
await p.addStyleTag({ content: '#panelBtn{display:none!important}' });
const shots = [];
const pone = (src) => p.evaluate((src) => {
  const L = [...document.querySelectorAll('#viewport .layer')].pop();
  L.querySelectorAll('a[aria-label="Ver el camino"]').forEach(scene => {
    const imgs = [...scene.querySelectorAll('img')];
    const land = imgs.find(i => !/^Teodoro/.test(i.alt || '')) || imgs[0];
    imgs.filter(i => i !== land).forEach(i => i.style.display = 'none');
    [...scene.children].filter(c => c.tagName === 'SPAN').forEach(s => s.style.display = 'none');
    const destacado = !!scene.closest('.theo-heroe'); // igual que el MVP: en el destacado la escena sube 22 px
    Object.assign(land.style, { left: '0', top: destacado ? '-22px' : '0', width: '100%', height: destacado ? 'calc(100% + 22px)' : '100%', objectFit: 'cover', objectPosition: '50% 0%', transform: 'none', maxWidth: 'none' });
    land.src = src;
  });
}, src);
for (const scr of ['hoy', 'hoy-abajo', 'teodoro']) {
  await p.evaluate(async ([scr, tema]) => { const c = await import('/js/core.js'); c.reset({ hoy: 9, inscrito: true, teaserVisto: true, tardeVisto: true, tema, bateria: 0 }); for (let n = 0; n <= 8; n++) c.S.completos[n] = { contenido: true, trivia: true }; c.save(); c.clearHistory(); c.go(scr === 'hoy-abajo' ? 'hoy' : scr, {}, 'none', { tab: true }); }, [scr, tema]);
  await p.waitForTimeout(1500); await pone(b64); await p.waitForTimeout(400);
  const el = await p.evaluate((scr) => {
    const L = [...document.querySelectorAll('#viewport .layer')].pop();
    const scenes = [...L.querySelectorAll('a[aria-label="Ver el camino"]')];
    const s = scr === 'hoy' ? scenes[0] : scenes[scenes.length - 1];
    const card = s.closest('[role=group]') || s.parentElement;
    card.scrollIntoView({ block: 'center' });
    const r = card.getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height };
  }, scr);
  await p.waitForTimeout(500);
  const r = await p.evaluate((scr) => { const L = [...document.querySelectorAll('#viewport .layer')].pop(); const scenes = [...L.querySelectorAll('a[aria-label="Ver el camino"]')]; const s = scr === 'hoy' ? scenes[0] : scenes[scenes.length - 1]; const c = s.closest('[role=group]') || s.parentElement; const r = c.getBoundingClientRect(); return { x: r.left - 8, y: r.top - 8, width: r.width + 16, height: r.height + 16 }; }, scr);
  const f = out.replace(/\.png$/, `-${scr}.png`); await p.screenshot({ path: f, clip: r }); shots.push(f);
}
console.log(shots.join('\n')); await b.close();
