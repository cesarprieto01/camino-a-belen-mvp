// Recorrido automático: node tools/e2e.mjs <escenario> <out-dir> [mobile]
import { chromium } from 'playwright';
import fs from 'fs';
const [scen = '0', dir = 'tmp/e2e', mobile] = process.argv.slice(2);
fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ executablePath: '/Users/ces/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const ctx = await b.newContext(mobile ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => { if (!/Failed to fetch/.test(e.message)) errs.push('PAGEERROR ' + e.message); });
p.on('console', m => { if (m.type() === 'error' && !/Failed to fetch|Failed to load resource/.test(m.text())) errs.push(m.text()); });
await p.goto('http://localhost:5190/app.html');
await p.evaluate(() => localStorage.clear());
await p.reload(); await p.waitForTimeout(1200);
// la app arranca desde cero; los recorridos (salvo «inicio») parten del día 9 con 8 días hechos
if (!scen.startsWith('inicio')) {
  await p.evaluate(async () => { const c = await import('/js/core.js'); c.reset({ hoy: 9, inscrito: true, teaserVisto: true, panes: 120 }); for (let d = 0; d <= 8; d++) c.S.completos[d] = { contenido: true, trivia: d > 0, estrellas: d ? 2 : 0 }; [3, 6].forEach(d => c.S.sorpresas[d] = 'hecha'); c.S.ruletas[4] = 'gorro'; c.S.prendas = ['gorro']; c.S.prendasVistas = 1; c.save(); c.clearHistory(); c.go('hoy', {}, 'none', { tab: true }); });
  await p.waitForTimeout(900);
}
let k = 0;
// detector de textos rotos: frases repetidas seguidas («ya se unieron ya se unieron…»), «undefined», «NaN»
const textCheck = async (name) => {
  const bad = await p.evaluate(() => {
    const out = [];
    document.querySelectorAll('#viewport .layer *').forEach(el => {
      if (el.children.length > 2 || getComputedStyle(el).display === 'none') return;
      const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (/(\b[\wáéíóúñ]+(?: [\wáéíóúñ]+){1,3} )\1{2,}/i.test(t + ' ')) out.push('repetido: ' + t.slice(0, 80));
      if (/\bundefined\b|\bNaN\b|\[object Object\]/.test(t)) out.push('valor roto: ' + t.slice(0, 80));
    });
    return [...new Set(out)];
  });
  bad.forEach(b => errs.push(`TEXTO en ${name}: ${b}`));
};
const shot = async (name) => { await p.waitForTimeout(700); await textCheck(name); await p.locator('#viewport').screenshot({ path: `${dir}/${String(++k).padStart(2, '0')}-${name}.png` }); };
const screen = () => p.evaluate(() => document.querySelector('#viewport .layer:last-child')?.dataset.screen);
// clic por texto o aria-label dentro de la capa visible
const tap = async (q) => {
  const ok = await p.evaluate((q) => {
    const L = document.querySelector('#viewport .layer:last-child');
    const norm = s => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const els = [...L.querySelectorAll('a,button,[role=button],[role=checkbox],[aria-label],[data-bound]')];
    const el = els.find(e => norm(e.getAttribute('aria-label')).startsWith(norm(q))) || els.find(e => norm(e.textContent) === norm(q)) || els.find(e => norm(e.textContent).startsWith(norm(q)));
    if (!el) return false;
    el.scrollIntoView({ block: 'center' });
    el.click(); return true;
  }, q);
  if (!ok) errs.push(`NO ENCONTRADO «${q}» en ${await screen()}`);
  await p.waitForTimeout(600);
  if (process.env.DEBUG) console.log('tap', q, '→', await p.evaluate(() => [...document.querySelectorAll('#viewport .layer')].map(l => l.dataset.screen).join('>')));
  return ok;
};
const scenario = async (i) => { if (!(await p.evaluate(() => document.querySelectorAll('[data-tab]').length))) { await p.evaluate(() => document.getElementById('panelBtn')?.click()); await p.waitForTimeout(500); } await p.evaluate(() => document.querySelector(`[data-tab="rec"]`)?.click()); await p.waitForTimeout(150); await p.evaluate(t => [...document.querySelectorAll('[data-scen]')].find(b => b.querySelector('b')?.textContent.trim() === t)?.click(), i); await p.waitForTimeout(900); };
const answerTrivia = async () => {
  for (let q = 0; q < 5; q++) {
    // contesta bien leyendo los datos del juego
    await p.evaluate(async () => {
      const { TRIVIA } = await import('/js/data.js');
      const L = document.querySelector('#viewport .layer:last-child');
      const label = L.querySelector('[role=progressbar]')?.getAttribute('aria-label') || '';
      window.__q = label;
    });
    const info = await p.evaluate(async () => {
      const { TRIVIA } = await import('/js/data.js');
      const { cur } = await import('/js/core.js');
      const q = TRIVIA[cur.params.day][cur.params.i || 0];
      return { a: q.a, o: q.o.map(o => o.t || o) };
    });
    if (q === 1 && !Array.isArray(info.a)) { const wrong = info.o.find((_, i) => i !== info.a); await tap(wrong); await shot('trivia-pista'); }
    if (Array.isArray(info.a)) { for (const i of info.a) await tap(info.o[i]); await shot('trivia-varias'); await tap('Comprobar'); }
    else await tap(info.o[info.a]);
    await shot('trivia-q' + (q + 1));
    await tap(q < 4 ? 'Siguiente' : 'Ver resultado');
  }
};
const flows = {
  async dia() {
    await shot('hoy');
    await tap('Continuar la Aventura'); await shot('mapa');
    await tap('Ver historia'); await shot('reproductor');
    await p.waitForTimeout(9500); await shot('completado');
    await tap('¡A jugar!'); await shot('trivia');
    await answerTrivia(); await shot('trivia-fin');
    await tap('Ahora no'); await p.waitForTimeout(1500); await shot('mapa-avanza');
    await shot('mapa-sorpresa');
    await tap('Atrás'); await shot('hoy-sorpresa');
  },
  async ruleta() {
    await scenario('Día de ruleta'); await shot('mapa');
    await tap('Ver historia'); await shot('ruleta');
    await tap('¡Girar!'); await p.waitForTimeout(5200); await shot('premio');
    await tap('Ver historia'); await shot('reproductor');
  },
  async memorama() {
    await scenario('Memorama'); await shot('mapa');
    await p.evaluate(async () => { const c = await import('/js/core.js'); c.S.completos[3] = { contenido: true }; c.save(); });
    await p.evaluate(async () => { const c = await import('/js/core.js'); c.go('trivia', { day: 3, i: 4, ok: 4 }); });
    await p.waitForTimeout(800);
    const info = await p.evaluate(async () => { const { TRIVIA } = await import('/js/data.js'); const q = TRIVIA[3][4]; return { a: q.a, o: q.o.map(o => o.t || o) }; });
    if (Array.isArray(info.a)) { for (const i of info.a) await tap(info.o[i]); await tap('Comprobar'); } else await tap(info.o[info.a]);
    await tap('Ver resultado'); await shot('fin-sorpresa');
    await tap('Abrir la sorpresa'); await shot('memorama-reglas');
    await tap('¡A jugar!'); await shot('memorama');
    // resolver: voltear por parejas
    const n = await p.evaluate(() => document.querySelectorAll('.mm-card').length);
    await p.evaluate(async () => {
      const cards = [...document.querySelectorAll('.mm-card')];
      const key = c => c.querySelector('.mm-back img').src;
      const seen = new Set();
      for (const c of cards) { if (seen.has(c)) continue; const m = cards.find(x => x !== c && !seen.has(x) && key(x) === key(c)); seen.add(c); seen.add(m); c.click(); await new Promise(r => setTimeout(r, 120)); m.click(); await new Promise(r => setTimeout(r, 200)); }
    });
    await shot('memorama-hecho'); await p.waitForTimeout(1500); await shot('memorama-fin');
  },
  async adivinanza() {
    await scenario('Adivinanza');
    await p.evaluate(async () => { const c = await import('/js/core.js'); c.S.completos[7] = { contenido: true, trivia: true, estrellas: 2 }; c.save(); c.go('adivinanzaIntro', { day: 7 }); });
    await shot('intro'); await tap('¡A jugar!'); await shot('listos'); await tap('¿Listos?'); await shot('juego');
    await tap('¡La adivinaron!'); await shot('w2'); for (const a of ['Pasar a otra palabra', '¡La adivinaron!', '¡La adivinaron!', '¡La adivinaron!']) { await tap('¿Listos?'); await tap(a); }
    await shot('fin');
  },
  async desafio() {
    await p.evaluate(async () => { const c = await import('/js/core.js'); c.go('desafioIntro', { day: 9 }); });
    await shot('intro'); await tap('¡Vamos!'); await shot('carta'); await tap('Sacar otra carta'); await shot('otra'); await tap('¡Lo hicimos!'); await p.waitForTimeout(800); await shot('fin');
  },
  async antes() {
    await scenario('Sin inscribirse'); await p.waitForTimeout(1500); await shot('teaser');
    await tap('Inscribirme'); await shot('confirm'); await p.waitForTimeout(2300); await shot('espera');
    await tap('Invitar a un amigo'); await shot('invitacion');
  },
  async reto() {
    await scenario('Reto en familia'); await tap('Ver el reto'); await shot('hub'); await tap('¡Lo hicimos!'); await p.waitForTimeout(1200); await shot('completado');
  },
  async regreso() { await scenario('Regreso tras una semana'); await shot('regreso'); await tap('Empezar por el día'); await shot('mapa'); },
  async atrasado() { await scenario('Va atrasado'); await shot('hoy-atrasado'); await tap('Continuar la Aventura'); await shot('mapa'); },
  async nochebuena() { await scenario('Nochebuena'); await shot('mapa'); await tap('Comenzar'); await p.waitForTimeout(800); await shot('final'); },
  async oscuro() {
    await p.evaluate(() => document.querySelector('[data-tema="oscuro"]')?.click()); await p.waitForTimeout(900); await shot('hoy');
    await tap('Continuar la Aventura'); await shot('mapa'); await tap('Ver historia'); await shot('repro');
    await p.waitForTimeout(9500); await tap('¡A jugar!'); await shot('trivia'); await answerTrivia(); await shot('fin');
  },
  async post() { await scenario('Terminó incompleto'); await shot('hoy-incompleto'); await scenario('Terminó completo'); await shot('hoy-completo'); },
  // regresos al origen: cada «Ahora no», «Cerrar» o «Volver» deja donde estabas
  async nav() {
    const expect = async (want, why) => { await p.waitForTimeout(700); const s = await screen(); if (s !== want) errs.push(`${why}: esperaba ${want}, quedó ${s}`); };
    await scenario('Sin inscribirse'); await p.waitForTimeout(1500);
    await expect('teaser', 'teaser automático'); await tap('Ahora no'); await expect('hoy', 'teaser Ahora no');
    await tap('Teodoro'); await expect('teodoro', 'tab Teodoro'); await shot('teodoro-sin');
    await tap('Inscribirme'); await p.waitForTimeout(2400); await expect('espera', 'inscribirme desde Teodoro'); await shot('espera');
    await tap('Invitar a un amigo'); await expect('invitacion', 'invitar'); await shot('invitacion');
    await tap('Volver'); await expect('espera', 'volver de invitación');
    await tap('Cerrar'); await expect('teodoro', 'espera Cerrar vuelve a Teodoro'); await shot('teodoro-dentro');
    await tap('Entrar'); await expect('mapa', 'Entrar abre el camino'); await shot('mapa-dia0');
    await tap('Atrás'); await expect('teodoro', 'del camino a Teodoro');
    await tap('Ver Camino a Belén'); await expect('espera', 'la ilustración abre la espera'); await tap('Cerrar'); await expect('teodoro', 'espera Cerrar');
    await tap('Invitar'); await expect('invitacion', 'invitar desde Teodoro'); await tap('Volver'); await expect('teodoro', 'volver a Teodoro');
    await tap('Hoy'); await expect('hoy', 'tab Hoy'); await shot('hoy-dentro');
    await tap('Invitar'); await tap('Vista previa del enlace'); await expect('teaser', 'vista previa'); await tap('Inscribirme'); await expect('invitacion', 'vista previa vuelve');
    await tap('Volver'); await expect('hoy', 'invitación vuelve a Hoy');
    // ya empezó y no está inscrito: «Unirme al camino» entra directo
    await scenario('Hoy, tab Teodoro y Mundos'); await p.evaluate(async () => { const c = await import('/js/core.js'); c.S.inscrito = false; c.save(); c.go('hoy', {}, 'none', { tab: true }); }); await p.waitForTimeout(900);
    await tap('Unirme al camino'); await expect('mapa', 'unirse tarde'); await tap('Atrás'); await expect('hoy', 'unirse vuelve a Hoy');
    await tap('Teodoro'); await tap('Mundos de Teodoro'); await expect('mundos', 'la isla abre los mundos'); await tap('Adviento'); await expect('mapa', 'mapa desde mundos');
    await tap('Atrás'); await expect('mundos', 'volver del mapa'); await tap('Volver'); await expect('teodoro', 'mundos vuelve a Teodoro');
    // atrás del sistema
    await tap('Entrar al camino'); await expect('mapa', 'mapa otra vez'); await p.goBack(); await expect('teodoro', 'atrás del sistema en el mapa'); await tap('Ver mis mundos'); await p.goBack(); await expect('teodoro', 'atrás del sistema en mundos'); await p.goBack(); await expect('teodoro', 'atrás en una pestaña no sale');
  },
  // un día sin sorpresa: el mapa avanza y sale «Mañana seguimos» como hoja sobre el mapa
  async cerrado() {
    await p.evaluate(async () => { const c = await import('/js/core.js'); c.reset({ hoy: 10, inscrito: true }); for (let d = 0; d < 10; d++) c.S.completos[d] = { contenido: true, trivia: true, estrellas: 2 }; c.S.completos[10] = { contenido: true, trivia: true, estrellas: 3 }; c.S.pasoAnimado = 10; c.save(); c.go('mapa', { thenCerrado: true }, 'none'); });
    await p.waitForTimeout(3200); await shot('cerrado');
    const ov = await p.evaluate(() => [...document.querySelectorAll('#viewport .layer')].map(l => l.dataset.screen).join('>'));
    if (ov !== 'mapa>cerrado') errs.push('cerrado no es hoja sobre el mapa: ' + ov);
    await tap('¿Les gustó hoy?'); await shot('calificar'); await tap('¡Mucho!'); await shot('calificar-elegido'); await tap('Enviar'); await p.waitForTimeout(800);
    if (await screen() !== 'mapa') errs.push('tras calificar: esperaba mapa, quedó ' + await screen());
    await tap('Atrás'); await shot('hoy-fin');
  },
  // entrar por primera vez: desde cero hasta el día 1
  async inicio() {
    await p.waitForTimeout(800);
    const s0 = await p.evaluate(async () => { const c = await import('/js/core.js'); return { hoy: c.S.hoy, inscrito: c.S.inscrito }; });
    if (s0.hoy !== 0 || s0.inscrito) errs.push('no arranca desde cero: ' + JSON.stringify(s0));
    if (await screen() !== 'teaser') errs.push('el teaser no sale solo al entrar: ' + await screen());
    await shot('teaser'); await tap('Inscribirme'); await p.waitForTimeout(2400); await shot('espera');
    await tap('Cerrar'); await shot('hoy-dentro'); await tap('Entrar'); await shot('mapa-dia0');
    await tap('Ver historia'); await p.waitForTimeout(9800); await shot('dia0-hecho');
    // pasa la medianoche del 28 al 29: empieza el camino
    if (!(await p.evaluate(() => !!document.querySelector('[data-act="dayPlus"]')))) { await p.evaluate(() => document.getElementById('panelBtn')?.click()); await p.waitForTimeout(500); }
    await p.evaluate(() => document.querySelector('[data-act="dayPlus"]')?.click()); await p.waitForTimeout(1200); await shot('dia1');
    const s1 = await p.evaluate(async () => { const c = await import('/js/core.js'); return { hoy: c.S.hoy, bat: c.S.bateria }; });
    if (s1.hoy !== 1 || s1.bat !== 5) errs.push('día 1 mal: ' + JSON.stringify(s1));
  },
  // hojas de página: free sobre el reto, espera sobre Hoy, calificación sobre el mapa
  async paginas() {
    const layers = () => p.evaluate(() => [...document.querySelectorAll('#viewport .layer')].map(l => l.dataset.screen + (l.classList.contains('ov-page') ? '(hoja)' : '')).join('>'));
    await p.evaluate(async () => { const c = await import('/js/core.js'); c.S.plan = 'free'; c.S.hoy = 13; for (let d = 9; d < 13; d++) c.S.completos[d] = { contenido: true, trivia: true }; c.save(); c.go('hub', { day: 13 }, 'none'); });
    await p.waitForTimeout(900); await tap('Imprimible'); await p.waitForTimeout(500); await shot('free');
    if (await layers() !== 'hub>free(hoja)') errs.push('free no es hoja sobre el reto: ' + await layers());
    await tap('Ahora no'); await p.waitForTimeout(500);
    if (await layers() !== 'hub') errs.push('al cerrar free no queda el reto: ' + await layers());
    await p.evaluate(async () => { const c = await import('/js/core.js'); c.reset({ hoy: 0, inscrito: true, teaserVisto: true }); c.save(); c.clearHistory(); c.go('hoy', {}, 'none', { tab: true }); });
    await p.waitForTimeout(900); await tap('Ver Camino a Belén'); await p.waitForTimeout(500); await shot('espera-hoja');
    if (await layers() !== 'hoy>espera(hoja)') errs.push('espera no es hoja sobre Hoy: ' + await layers());
    await p.goBack(); await p.waitForTimeout(600);
    if (await layers() !== 'hoy') errs.push('atrás del sistema no cierra la hoja: ' + await layers());
  },
  async teodoro() { await tap('Teodoro'); await shot('tab'); await tap('Ver mis mundos'); await shot('mundos'); await tap('Adviento'); await shot('mapa'); },
};
for (const name of scen.split(',')) {
  try { await flows[name](); } catch (e) { errs.push(name + ': ' + e.message); }
}
console.log(errs.length ? errs.join('\n') : 'OK sin errores');
await b.close();
