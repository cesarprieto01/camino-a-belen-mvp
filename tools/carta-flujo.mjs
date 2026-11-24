// Recorrido real de la carta, como un niño (node tools/carta-flujo.mjs [carpeta-de-capturas]; BASE=https://… para producción): día 26 con un día pendiente → firma → guardada → termina el que falta → sorpresa → carta.
import { chromium } from 'playwright';
import fs from 'fs';
const CFT = '/Users/ces/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const executablePath = process.env.CHROME || (fs.existsSync(CFT) ? CFT : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
const BASE = process.env.BASE || 'http://localhost:5190';
const b = await chromium.launch({ executablePath });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true })).newPage();
const errs = [], fallos = [];
p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && !/Failed to fetch/.test(m.text()) && errs.push(m.text()));
const OUT = process.argv[2] || 'tmp/carta-flujo';
await fs.promises.mkdir(OUT, { recursive: true });
await p.goto(BASE + '/index.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForSelector('#viewport .layer');
const pantalla = () => p.evaluate(() => document.querySelector('#viewport .layer:last-child')?.dataset.screen);
const estado = () => p.evaluate(async () => { const c = await import('/js/core.js'); return { carta: { ...c.S.carta, firma: c.S.carta?.firma ? c.S.carta.firma.length : null }, d26: !!c.S.completos[26]?.contenido, d19: !!c.S.completos[19]?.contenido }; });
const tocar = q => p.evaluate(q => { const L = document.querySelector('#viewport .layer:last-child'); const el = [...L.querySelectorAll('a,button,[role=button]')].find(e => (e.getAttribute('aria-label') || e.textContent || '').trim().startsWith(q)); el?.click(); return !!el; }, q);
const terminarVideo = () => p.evaluate(() => { const sl = document.querySelector('#viewport .layer:last-child [role=slider]'); if (!sl) return false; const r = sl.getBoundingClientRect(); sl.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.right - 1, clientY: r.top + r.height / 2 })); return true; });
const espera = async (nombre, ms = 6000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if ((await pantalla()) === nombre) return true; await p.waitForTimeout(150); } fallos.push(`esperaba ${nombre}, está en ${await pantalla()}`); return false; };
const foto = n => p.locator('#viewport').screenshot({ path: `${OUT}/${n}.png` });
// estado: 24 de diciembre, todo hecho menos los días 19 y 26
await p.evaluate(async () => { const c = await import('/js/core.js'); c.reset({ hoy: 26, inscrito: true, teaserVisto: true }); for (let n = 0; n <= 25; n++) if (n !== 19) c.S.completos[n] = { contenido: true, trivia: true, estrellas: 3 }; c.save(); c.clearHistory(); c.go('reproductor', { day: 26, ultimo: true }, 'none'); });
await p.waitForTimeout(1200); await terminarVideo();
await espera('cartaSecreta'); await p.waitForTimeout(900); await foto('1-secreta');
let e = await estado(); if (!e.carta.vista || !e.d26) fallos.push('al terminar el 26: vista y día 26 completos ' + JSON.stringify(e));
await tocar('Firmar la carta'); await espera('cartaFirma'); await p.waitForTimeout(900);
const listoDes = await p.evaluate(() => { const L = document.querySelector('#viewport .layer:last-child'); return [...L.querySelectorAll('a')].find(a => /Listo, firmé/.test(a.textContent))?.getAttribute('aria-disabled'); });
if (listoDes !== 'true') fallos.push('«¡Listo, firmé!» debería estar apagado sin firma: ' + listoDes);
// firmar con el ratón dentro de la caja
const caja = await p.evaluate(() => { const c = document.querySelector('#viewport .layer:last-child .firma-caja'); if (!c) return null; const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
if (!caja) fallos.push('no hay caja de firma (.firma-caja)');
else {
  const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push([caja.x + 30 + t * (caja.w - 80), caja.y + caja.h * .45 + Math.sin(t * 12) * 18]); }
  await p.mouse.move(...pts[0]); await p.mouse.down(); for (const q of pts) await p.mouse.move(...q, { steps: 2 }); await p.mouse.up();
  await p.mouse.move(caja.x + 60, caja.y + 30); await p.mouse.down(); await p.mouse.move(caja.x + 70, caja.y + caja.h * .7, { steps: 8 }); await p.mouse.up();
}
await p.waitForTimeout(400); await foto('2-firma');
await tocar('¡Listo, firmé!'); await espera('cartaGuardada'); await p.waitForTimeout(1300); await foto('3-guardada');
e = await estado(); if (!(e.carta.firma > 2000)) fallos.push('la firma no se guardó: ' + e.carta.firma);
// bloqueada: «¡Desbloquea tu sorpresa!», la carta tapada con el candado del mapa y los días que faltan; la carta no se toca
const sub = await p.evaluate(() => { const L = document.querySelector('#viewport .layer:last-child'); return { titulo: /¡Desbloquea tu sorpresa!/.test(L.textContent), bloqueo: L.querySelector('.carta-bloqueo')?.textContent.trim(), candado: !!L.querySelector('.carta-bloqueo img[src*="candado"]'), falta: /TE FALTA 1 DÍA/.test(L.textContent), sinCambiar: !L.querySelector('.carta-otra-firma') }; });
if (!sub.titulo || !/Se desbloquea al completar los 26 días/.test(sub.bloqueo || '') || !sub.candado || !sub.falta || !sub.sinCambiar) fallos.push('carta bloqueada: ' + JSON.stringify(sub));
const firma0 = (await estado()).carta.firma;
await tocar('Seguir con el día 19'); await espera('mapa'); await p.waitForFunction(() => document.querySelector('#viewport .layer:last-child .carta-belen'), null, { timeout: 8000 }).catch(() => {}); await p.waitForTimeout(400); await foto('4-mapa-faltan'); // en producción el ícono tarda un poco más en pintarse
const ico = await p.evaluate(() => { const i = document.querySelector('#viewport .layer:last-child .carta-belen'); return i ? { clase: i.className, badge: i.querySelector('.carta-badge')?.textContent, aria: i.getAttribute('aria-label') } : null; });
if (!ico || !/carta-faltan/.test(ico.clase) || ico.badge !== '1') fallos.push('ícono en el mapa: ' + JSON.stringify(ico));
// termina el día 19 (el último que faltaba): el día sigue normal (completado) y, al volver al camino, entra al final con el puente
await p.evaluate(async () => { const c = await import('/js/core.js'); c.go('reproductor', { day: 19 }, 'none'); });
await p.waitForTimeout(1200); await terminarVideo();
await espera('completado'); await p.waitForTimeout(900); await foto('5a-dia-completado');
const salir = await p.evaluate(() => [...document.querySelectorAll('#viewport .layer:last-child a, #viewport .layer:last-child button')].map(b => (b.getAttribute('aria-label') || b.textContent).trim()).filter(Boolean));
await tocar(salir.find(t => /Volver al camino|Seguir|camino/i.test(t)) || 'Volver al camino');
// terminó: vuelve a ver su carta («¡Completaste el camino!»), puede firmar de nuevo, y «Siguiente» la entrega
await espera('cartaGuardada'); await p.waitForTimeout(1200); await foto('5b-revision');
if (!(await p.evaluate(() => /¡Completaste el camino!/.test(document.querySelector('#viewport .layer:last-child').textContent)))) fallos.push('no salió la revisión «¡Completaste el camino!»');
await tocar('Firmar de nuevo'); await espera('cartaFirma'); await p.waitForTimeout(700);
await tocar('Ahora no'); await espera('cartaGuardada'); if ((await estado()).carta.firma !== firma0) fallos.push('«Ahora no» al firmar de nuevo cambió la firma');
await tocar('Firmar de nuevo'); await espera('cartaFirma'); await p.waitForTimeout(700);
{ const c2 = await p.evaluate(() => { const r = document.querySelector('#viewport .layer:last-child .firma-caja').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await p.mouse.move(c2.x + 40, c2.y + 60); await p.mouse.down(); await p.mouse.move(c2.x + c2.w - 60, c2.y + 90, { steps: 12 }); await p.mouse.up(); }
await tocar('¡Listo, firmé!'); await espera('cartaGuardada'); if ((await estado()).carta.firma === firma0) fallos.push('firmar de nuevo no cambió la firma');
await p.waitForTimeout(900); await tocar('Siguiente');
await espera('cartaSorpresa'); await p.waitForTimeout(800); await foto('5-sorpresa-antes');
// Teodoro camina hasta el pesebre (~5 s de animación) y después se revela: se espera el título nuevo, hasta 12 s
await p.waitForFunction(() => /era para Jes/.test(document.querySelector('#viewport .layer:last-child')?.textContent || ''), null, { timeout: 12000 }).catch(() => {}); await p.waitForTimeout(600); await foto('6-sorpresa-revela');
const titulo = await p.evaluate(() => [...document.querySelectorAll('#viewport .layer:last-child div')].find(d => /para Jesús!$/.test(d.textContent) && !d.children.length)?.textContent);
if (!titulo) fallos.push('no se reveló «¡La carta era para Jesús!»');
await tocar('Leer la carta'); await espera('carta'); await p.waitForTimeout(1800); await foto('7-carta');
const firmaEnCarta = await p.evaluate(() => !!document.querySelector('#viewport .layer:last-child img[alt^="Firma de"]'));
if (!firmaEnCarta) fallos.push('la carta no lleva la firma real');
// en la carta abierta: tocar la firma → firmar de nuevo → «Ahora no» vuelve a la carta
await p.evaluate(() => document.querySelector('#viewport .layer:last-child .carta-firma-boton')?.click()); await espera('cartaFirma'); await p.waitForTimeout(600);
await tocar('Ahora no'); await espera('carta'); await p.waitForTimeout(800);
for (const [btn, ext] of [['Compartir', '.png'], ['Imprimir', '.pdf']]) {
  try { const [d] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), tocar(btn)]); if (!d.suggestedFilename().endsWith(ext)) fallos.push(`${btn} bajó ${d.suggestedFilename()}`); }
  catch { fallos.push(`${btn} no descargó nada`); }
  if ((await pantalla()) !== 'carta') fallos.push(`${btn} cambió de pantalla: ${await pantalla()}`);
  await p.waitForTimeout(600);
}
await tocar('Cerrar'); await espera('mapa'); await p.waitForTimeout(1200);
const ico2 = await p.evaluate(() => document.querySelector('#viewport .layer:last-child .carta-belen')?.className);
if (!/carta-abierta/.test(ico2 || '')) fallos.push('ícono tras abrir: ' + ico2);
await foto('10-mapa-abierta');
// «Ahora no» en la firma con días pendientes → mapa con el punto
await p.evaluate(async () => { const c = await import('/js/core.js'); c.reset({ hoy: 26, inscrito: true, teaserVisto: true }); for (let n = 0; n <= 26; n++) if (n !== 12) c.S.completos[n] = { contenido: true }; c.S.carta = { vista: true }; c.save(); c.clearHistory(); c.go('cartaFirma', {}, 'none'); });
await p.waitForTimeout(1200); await tocar('Ahora no'); await espera('mapa'); await p.waitForTimeout(1200);
const ico3 = await p.evaluate(() => document.querySelector('#viewport .layer:last-child .carta-belen')?.className);
if (!/carta-firmar/.test(ico3 || '')) fallos.push('ícono tras «Ahora no»: ' + ico3);
console.log('FALLOS:', fallos.length ? '\n - ' + fallos.join('\n - ') : 'ninguno');
console.log('ERRORES:', errs.length ? errs.join(' | ') : 'ninguno');
await b.close();
