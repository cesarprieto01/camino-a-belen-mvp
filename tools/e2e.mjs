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
// cada recorrido (salvo «inicio» y «completo») arranca del mismo estado, aunque se corran varios seguidos
const base = async () => {
  await p.evaluate(async () => { const c = await import('/js/core.js'); c.reset({ hoy: 9, inscrito: true, teaserVisto: true, panes: 120 }); for (let d = 0; d <= 8; d++) c.S.completos[d] = { contenido: true, trivia: d > 0, estrellas: d ? 2 : 0 }; [3, 6].forEach(d => c.S.sorpresas[d] = 'hecha'); c.S.ruletas[4] = 'gorro'; c.S.prendas = ['gorro']; c.S.prendasVistas = 1; c.save(); c.clearHistory(); c.go('hoy', {}, 'none', { tab: true }); });
  await p.waitForTimeout(900);
};
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
const waitScreen = async (want, ms = 10000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if ((await screen()) === want) return true; await p.waitForTimeout(150); } return false; };
const screen = () => p.evaluate(() => document.querySelector('#viewport .layer:last-child')?.dataset.screen);
// clic por texto o aria-label dentro de la capa visible
const tap = async (q) => {
  const ok = await p.evaluate((q) => {
    const L = document.querySelector('#viewport .layer:last-child');
    const norm = s => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const els = [...L.querySelectorAll('a,button,[role=button],[role=checkbox],[aria-label],[data-bound]')];
    const btns = els.filter(e => e.matches('a,button,[role=button],[role=checkbox]'));
    // el nombre exacto de una pestaña es la pestaña (el inicio de Theo trae cuentos que también empiezan por «Teodoro…»)
    const tab = [...L.querySelectorAll('nav.theo-tabbar a')].find(e => norm(e.getAttribute('aria-label')) === norm(q));
    const el = tab || els.find(e => norm(e.getAttribute('aria-label')).startsWith(norm(q))) || btns.find(e => norm(e.textContent) === norm(q)) || els.find(e => norm(e.textContent) === norm(q)) || btns.find(e => norm(e.textContent).startsWith(norm(q))) || els.find(e => norm(e.textContent).startsWith(norm(q)));
    if (!el) return false;
    el.scrollIntoView({ block: 'center' });
    el.click(); return true;
  }, q);
  if (!ok) errs.push(`NO ENCONTRADO «${q}» en ${await screen()}`);
  await p.waitForTimeout(600);
  if (process.env.DEBUG) console.log('tap', q, '→', await p.evaluate(() => [...document.querySelectorAll('#viewport .layer')].map(l => l.dataset.screen).join('>')));
  return ok;
};
// al terminar cada video o canción: calificar con 4 estrellas en «¡Terminaste!» (el siguiente paso lo toca quien llama)
const rate = async (tag = '') => { if ((await screen()) !== 'completado' || !(await p.evaluate(() => !!document.querySelector('#viewport .layer:last-child .rate-row')))) { errs.push(`${tag}: «¡Terminaste!» sin la fila de calificar (${await screen()})`); return; } await tap('4 de 5 estrellas'); const k = await p.evaluate(async () => (await import('/js/core.js')).S.calificaciones); if (!k || !Object.values(k).includes(4)) errs.push(`${tag}: no se guardó la calificación`); };
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
    await tap('Continuar la aventura'); await shot('mapa');
    await tap('Ver video'); await shot('reproductor');
    await p.waitForTimeout(9500); await shot('completado'); await rate('dia'); await shot('calificado');
    await tap('¡A jugar!'); await shot('trivia');
    await answerTrivia(); await shot('trivia-fin');
    await tap('Ahora no'); await p.waitForTimeout(1500); await shot('mapa-avanza');
    await shot('mapa-sorpresa');
    await tap('Atrás'); await shot('hoy-sorpresa');
  },
  // la ruleta solo se juega tocándola en el mapa: día 11 → tocar la ruleta → girar → premio → vuelve al mapa
  async ruleta() {
    await p.evaluate(async () => { const c = await import('/js/core.js'); c.reset({ hoy: 11, inscrito: true, teaserVisto: true, forzarPremio: 'panes' }); for (let d = 0; d <= 10; d++) c.S.completos[d] = { contenido: true, trivia: true, estrellas: 2 }; c.save(); c.clearHistory(); c.go('mapa', {}, 'none', { tab: true }); });
    await p.waitForTimeout(1500); await shot('mapa');
    const hoja = await p.evaluate(() => document.querySelector('#viewport .layer:last-child [data-sheet]')?.textContent || '');
    if (/Ruleta/.test(hoja)) errs.push('la hoja del día todavía habla de la ruleta: ' + hoja.replace(/\s+/g, ' ').slice(0, 140));
    const lbl = () => p.evaluate(() => document.querySelector('#viewport .layer:last-child [aria-label^="Ruleta de la semana 2"]')?.textContent.replace(/\s+/g, ' ').trim());
    if (!/¡Gírala!/.test(await lbl() || '')) errs.push('la ruleta del día 11 no dice «¡Gírala!»: ' + await lbl());
    await tap('Ruleta de la semana 2'); await p.waitForTimeout(900);
    if ((await screen()) !== 'ruletaPop') errs.push('tocar la ruleta del mapa no abre la ruleta: ' + await screen());
    await shot('ruleta'); await tap('¡Girar!'); await p.waitForTimeout(5200); await shot('premio');
    if (!['ruletaPremio', 'premioCuarto'].includes(await screen())) errs.push('girar no lleva al premio: ' + await screen());
    await tap('Volver al camino'); await p.waitForTimeout(1500);
    if ((await screen()) !== 'mapa') errs.push('el premio no vuelve al mapa: ' + await screen());
    if (!/¡Ya la giraste!/.test(await lbl() || '')) errs.push('la ruleta girada no dice «¡Ya la giraste!»: ' + await lbl());
    // ya girada: un aviso con el premio, no otra ruleta
    await tap('Ruleta de la semana 2'); await p.waitForTimeout(600);
    if ((await screen()) !== 'mapa') errs.push('tocar una ruleta girada no se queda en el mapa: ' + await screen());
    // la de un día que aún no llega: aviso con la fecha
    await tap('Ruleta de la semana 3'); await p.waitForTimeout(600);
    if ((await screen()) !== 'mapa') errs.push('tocar una ruleta futura no se queda en el mapa: ' + await screen());
  },
  async memorama() {
    await scenario('Memorama'); await shot('mapa');
    await p.evaluate(async () => { const c = await import('/js/core.js'); c.S.completos[3] = { contenido: true }; c.save(); });
    await p.evaluate(async () => { const c = await import('/js/core.js'); c.go('trivia', { day: 3, i: 4, ok: 4 }); });
    await p.waitForTimeout(800);
    const info = await p.evaluate(async () => { const { TRIVIA } = await import('/js/data.js'); const q = TRIVIA[3][4]; return { a: q.a, o: q.o.map(o => o.t || o) }; });
    if (Array.isArray(info.a)) { for (const i of info.a) await tap(info.o[i]); await tap('Comprobar'); } else await tap(info.o[info.a]);
    await tap('Ver resultado'); await shot('fin-sorpresa');
    await tap('Ir al juego sorpresa'); await shot('memorama-reglas');
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
    await tap('Unirme gratis'); await shot('confirm'); await p.waitForTimeout(1200); await shot('espera');
    await tap('Invitar a un amigo'); await shot('invitacion');
  },
  async reto() {
    await scenario('Reto en familia'); await tap('Ver el reto'); await shot('hub'); await tap('¡Lo hicimos!'); await p.waitForTimeout(1200); await shot('completado');
    // los retos y el juego en familia muestran sus pasos (del cronograma) y el descargable del día
    const hubDe = async (n) => { await p.evaluate(async (n) => { const c = await import('/js/core.js'); c.go('hub', { day: n }, 'none'); }, n); await p.waitForTimeout(900); return p.evaluate(() => { const L = document.querySelector('#viewport .layer:last-child'); return { pasos: [...L.querySelectorAll('.hub-pasos li')].map(li => li.textContent), txt: L.textContent }; }); };
    for (const [n, re] of [[6, /perdonar/], [13, /colores/], [19, /linterna/], [14, /oído/]]) { const h = await hubDe(n); if (h.pasos.length < 2 || !re.test(h.pasos.join(' '))) errs.push(`hub del día ${n} sin sus pasos: ` + JSON.stringify(h.pasos)); }
    const h13 = await hubDe(13); if (!/Pesebre para colorear/.test(h13.txt)) errs.push('el hub del día 13 no ofrece el pesebre para colorear');
    await shot('hub-pasos');
  },
  async regreso() { await scenario('Regreso tras una semana'); await shot('regreso'); await tap('Empezar por el día'); await shot('mapa'); },
  async atrasado() { await scenario('Va atrasado'); await shot('hoy-atrasado'); await tap('Continuar la aventura'); await shot('mapa'); },
  async nochebuena() { await scenario('Nochebuena'); await shot('mapa'); await tap('Comenzar'); await p.waitForTimeout(800); await shot('final'); },
  async oscuro() {
    await p.evaluate(() => document.querySelector('[data-tema="oscuro"]')?.click()); await p.waitForTimeout(900); await shot('hoy');
    await tap('Continuar la aventura'); await shot('mapa'); await tap('Ver video'); await shot('repro');
    await p.waitForTimeout(9500); await tap('¡A jugar!'); await shot('trivia'); await answerTrivia(); await shot('fin');
  },
  async post() { await scenario('Terminó incompleto'); await shot('hoy-incompleto'); await scenario('Terminó completo'); await shot('hoy-completo'); },
  // regresos al origen: cada «Ahora no», «Cerrar» o «Volver» deja donde estabas
  async nav() {
    const expect = async (want, why) => { await p.waitForTimeout(700); const s = await screen(); if (s !== want) errs.push(`${why}: esperaba ${want}, quedó ${s}`); };
    await scenario('Sin inscribirse'); await p.waitForTimeout(1500);
    await expect('teaser', 'teaser automático'); await tap('Ahora no'); await expect('hoy', 'teaser Ahora no');
    await tap('Teodoro'); await expect('teodoro', 'tab Teodoro'); await shot('teodoro-sin');
    await tap('Unirme gratis'); await p.waitForTimeout(2400); await expect('espera', 'inscribirme desde Teodoro'); await shot('espera');
    await tap('Invitar a un amigo'); await expect('invitacion', 'invitar'); await shot('invitacion');
    await tap('Volver'); await expect('espera', 'volver de invitación');
    await tap('Cerrar'); await expect('teodoro', 'espera Cerrar vuelve a Teodoro'); await shot('teodoro-dentro');
    await tap('Entrar'); await expect('mundos', 'Entrar abre los mundos antes del 29'); await shot('mundos-antes');
    await tap('Volver al cuarto de Teodoro'); await expect('teodoro', 'de los mundos a Teodoro');
    await tap('Mundos de Teodoro'); await expect('mundos', 'la isla abre los mundos antes del 29'); await tap('Volver al cuarto de Teodoro'); await expect('teodoro', 'isla: vuelve a Teodoro');
    await tap('Ver Camino a Belén'); await expect('espera', 'la ilustración abre la espera'); await tap('Cerrar'); await expect('teodoro', 'espera Cerrar');
    await tap('Invitar'); await expect('invitacion', 'invitar desde Teodoro'); await tap('Volver'); await expect('teodoro', 'volver a Teodoro');
    await tap('Hoy'); await expect('hoy', 'tab Hoy'); await shot('hoy-dentro');
    await tap('Invitar'); await tap('Vista previa del enlace'); await expect('teaser', 'vista previa'); await tap('Unirme gratis'); await expect('invitacion', 'vista previa vuelve');
    await tap('Volver'); await expect('hoy', 'invitación vuelve a Hoy');
    // ya empezó y no está inscrito: «Unirme al camino» entra directo
    await scenario('Hoy, tab Teodoro y Mundos'); await p.evaluate(async () => { const c = await import('/js/core.js'); c.S.inscrito = false; c.save(); c.go('hoy', {}, 'none', { tab: true }); }); await p.waitForTimeout(900);
    await tap('Unirme gratis'); await expect('mapa', 'unirse tarde'); await tap('Atrás'); await expect('hoy', 'unirse vuelve a Hoy');
    await tap('Teodoro'); await tap('Mundos de Teodoro'); await expect('mundos', 'la isla abre los mundos'); await tap('Adviento'); await expect('mapa', 'mapa desde mundos');
    await tap('Atrás'); await expect('mundos', 'volver del mapa'); await tap('Volver'); await expect('teodoro', 'mundos vuelve a Teodoro');
    // atrás del sistema
    await tap('Continuar la aventura'); await expect('mapa', 'mapa otra vez'); await p.goBack(); await expect('teodoro', 'atrás del sistema en el mapa'); await tap('Ver mis mundos'); await p.goBack(); await expect('teodoro', 'atrás del sistema en mundos'); await p.goBack(); await expect('teodoro', 'atrás en una pestaña no sale');
  },
  // un día sin sorpresa: el mapa avanza y sale «Mañana seguimos» como hoja sobre el mapa
  async cerrado() {
    await p.evaluate(async () => { const c = await import('/js/core.js'); c.reset({ hoy: 10, inscrito: true }); for (let d = 0; d < 10; d++) c.S.completos[d] = { contenido: true, trivia: true, estrellas: 2 }; c.S.completos[10] = { contenido: true, trivia: true, estrellas: 3 }; c.S.pasoAnimado = 10; c.save(); c.go('mapa', { thenCerrado: true }, 'none'); });
    await p.waitForTimeout(3200); await shot('cerrado');
    const ov = await p.evaluate(() => [...document.querySelectorAll('#viewport .layer')].map(l => l.dataset.screen).join('>'));
    if (ov !== 'mapa>cerrado') errs.push('cerrado no es hoja sobre el mapa: ' + ov);
    // ya no se califica el día al cerrarlo (se califica cada video al terminarlo)
    if (await p.evaluate(() => /¿Les gustó hoy\?/.test(document.querySelector('#viewport .layer:last-child').textContent))) errs.push('el cierre del día todavía pide «¿Les gustó hoy?»');
    await tap('Hasta mañana'); await p.waitForTimeout(900); await shot('hoy-fin');
  },
  // entrar por primera vez: desde cero hasta el día 1
  async inicio() {
    await p.waitForTimeout(800);
    const s0 = await p.evaluate(async () => { const c = await import('/js/core.js'); return { hoy: c.S.hoy, inscrito: c.S.inscrito }; });
    if (s0.hoy !== 0 || s0.inscrito) errs.push('no arranca desde cero: ' + JSON.stringify(s0));
    if (!(await waitScreen('teaser'))) errs.push('el teaser no sale solo al entrar: ' + await screen());
    await shot('teaser'); await tap('Unirme gratis'); await p.waitForTimeout(2400); await shot('espera');
    if (await p.evaluate(() => !!document.querySelector('#viewport .layer:last-child a[aria-label="Ver tu camino a Belén"]'))) errs.push('la espera todavía abre una vista previa del camino');
    await tap('Cerrar'); await shot('hoy-dentro');
    if ((await screen()) !== 'hoy') errs.push('la X de la espera no vuelve a Hoy: ' + await screen());
    await tap('Entrar'); await p.waitForTimeout(800);
    if ((await screen()) !== 'mundos') errs.push('antes del 29, «Entrar» no abre los mundos: ' + await screen());
    await shot('mundos-antes');
    await tap('Adviento'); await p.waitForTimeout(600);
    if ((await screen()) !== 'mundos') errs.push('antes del 29, tocar Adviento ya unido no debe salir de los mundos: ' + await screen());
    await tap('Volver al cuarto de Teodoro'); await p.waitForTimeout(800);
    if ((await screen()) !== 'hoy') errs.push('volver de los mundos no regresa a Hoy: ' + await screen());
    // pasa la medianoche del 28 al 29: empieza el camino
    if (!(await p.evaluate(() => !!document.querySelector('[data-act="dayPlus"]')))) { await p.evaluate(() => document.getElementById('panelBtn')?.click()); await p.waitForTimeout(500); }
    await p.evaluate(() => document.querySelector('[data-act="dayPlus"]')?.click()); await p.waitForTimeout(1200); await shot('dia1');
    const s1 = await p.evaluate(async () => { const c = await import('/js/core.js'); return { hoy: c.S.hoy, bat: c.S.bateria }; });
    if (s1.hoy !== 1 || s1.bat !== 5) errs.push('día 1 mal: ' + JSON.stringify(s1));
    if (!(await p.evaluate(() => /Iniciar la aventura/.test(document.querySelector('#viewport .layer:last-child').textContent)))) errs.push('el día 1 no dice «Iniciar la aventura»');
  },
  // hojas de página: free sobre el reto, espera sobre Hoy, calificación sobre el mapa
  async paginas() {
    const layers = () => p.evaluate(() => [...document.querySelectorAll('#viewport .layer')].map(l => l.dataset.screen + (l.classList.contains('ov-page') ? '(hoja)' : '')).join('>'));
    await p.evaluate(async () => { const c = await import('/js/core.js'); c.S.plan = 'free'; c.S.hoy = 13; for (let d = 9; d < 13; d++) c.S.completos[d] = { contenido: true, trivia: true }; c.save(); c.go('hub', { day: 13 }, 'none'); });
    await p.waitForTimeout(900); await tap('Pesebre para colorear'); await p.waitForTimeout(500); await shot('free');
    if (await layers() !== 'hub>free(hoja)') errs.push('free no es hoja sobre el reto: ' + await layers());
    await tap('Ahora no'); await p.waitForTimeout(500);
    if (await layers() !== 'hub') errs.push('al cerrar free no queda el reto: ' + await layers());
    await p.evaluate(async () => { const c = await import('/js/core.js'); c.reset({ hoy: 0, inscrito: true, teaserVisto: true }); c.save(); c.clearHistory(); c.go('hoy', {}, 'none', { tab: true }); });
    await p.waitForTimeout(900); await tap('Ver el camino'); await p.waitForTimeout(500); await shot('espera-hoja');
    if (await layers() !== 'hoy>espera(hoja)') errs.push('espera no es hoja sobre Hoy: ' + await layers());
    await p.goBack(); await p.waitForTimeout(600);
    if (await layers() !== 'hoy') errs.push('atrás del sistema no cierra la hoja: ' + await layers());
  },
  // EL FLUJO ENTERO como una familia: teaser → inscripción → día 0 → los 26 días → Nochebuena → Navidad
  async completo() {
    const cur = () => p.evaluate(async () => { const c = await import('/js/core.js'); return { s: c.cur.name, p: c.cur.params, hoy: c.S.hoy, bat: c.S.bateria, panes: c.S.panes }; });
    const clickYellow = () => p.evaluate(() => { const L = document.querySelector('#viewport .layer:last-child'); const a = [...L.querySelectorAll('a,button,[role=button]')].find(e => /F5DB78|245, 219, 120/i.test(e.getAttribute('style') || '') && e.offsetParent !== null && !/Premium/.test(e.textContent)); if (!a) return false; a.click(); return a.textContent.trim().slice(0, 30); });
    const sheetCta = () => p.evaluate(() => { const L = document.querySelector('#viewport .layer:last-child'); const a = L.querySelector('[data-sheet] a'); if (!a) return false; a.click(); return a.textContent.trim().slice(0, 30); });
    const nextDay = async () => { if (!(await p.evaluate(() => !!document.querySelector('[data-act="dayPlus"]')))) { await p.evaluate(() => document.getElementById('panelBtn')?.click()); await p.waitForTimeout(400); } await p.evaluate(() => document.querySelector('[data-act="dayPlus"]').click()); await p.waitForTimeout(1300); await p.evaluate(() => { if (innerWidth <= 1100) document.getElementById('panelBtn')?.click(); }); await p.waitForTimeout(300); };
    const finishPlayer = () => p.evaluate(() => { const sl = document.querySelector('#viewport .layer:last-child [role=slider]'); if (!sl) return false; const r = sl.getBoundingClientRect(); sl.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.right - 1, clientY: r.top + r.height / 2 })); return true; });
    const playMemorama = async () => {
      const groups = await p.evaluate(() => { const m = {}; [...document.querySelectorAll('#viewport .layer:last-child .mm-card')].forEach((b, i) => { const s = b.querySelector('.mm-back img').getAttribute('src'); (m[s] ||= []).push(i); }); return Object.values(m); });
      for (const [a, b] of groups) { for (const i of [a, b]) { await p.evaluate(i => document.querySelectorAll('#viewport .layer:last-child .mm-card')[i].click(), i); await p.waitForTimeout(120); } await p.waitForTimeout(250); }
    };
    // 1) antes del 29
    await p.waitForTimeout(800);
    if (!(await waitScreen('teaser'))) errs.push('no arranca con el teaser');
    await tap('Unirme gratis'); await p.waitForTimeout(2300); await shot('c-espera');
    await tap('Cerrar'); await p.waitForTimeout(800); await shot('c-dentro');
    // 2) los 26 días
    const visto = new Set();
    for (let d = 1; d <= 26; d++) {
      await nextDay();
      if (await screen() !== 'hoy') errs.push(`día ${d}: no abre en Hoy`);
      await textCheck('hoy-' + d);
      await tap(d === 1 ? 'Iniciar la aventura' : 'Continuar la aventura');
      // días de ruleta: se gira tocándola en el mapa (ya no sale sola)
      const rw = [4, 11, 18, 24].indexOf(d);
      if (rw >= 0) { await p.waitForTimeout(1200); await tap('Ruleta de la semana ' + (rw + 1)); }
      let steps = 0, done = false;
      while (!done && steps++ < 45) {
        await p.waitForTimeout(650);
        const c = await cur(); visto.add(c.s);
        await textCheck(`d${d}-${c.s}`);
        switch (c.s) {
          case 'mapa': {
            const t = await sheetCta();
            if (t && /Hasta mañana/.test(t)) done = true;
            if (!t) errs.push(`día ${d}: mapa sin botón`);
            if (d === 26 && t && /Ver el nacimiento/.test(t)) done = true;
            break; }
          case 'ruletaPop': await tap('¡Girar!'); await p.waitForTimeout(5200); break;
          case 'ruletaPremio': case 'premioCuarto': if (!(await clickYellow())) errs.push(`día ${d}: premio sin botón`); break;
          case 'reproductor': await finishPlayer(); await p.waitForTimeout(900); break;
          case 'hub': await tap('¡Lo hicimos!'); await p.waitForTimeout(600); break;
          case 'completado': { if (await p.evaluate(() => !!document.querySelector('#viewport .layer:last-child .rate-row'))) await rate(`día ${d}`); const t = await p.evaluate(() => [...document.querySelectorAll('#viewport .layer:last-child a')].map(a => a.textContent.trim()).find(x => /^(¡A jugar!|Ir al juego sorpresa|Volver al camino)$/.test(x))); await tap(t || '¡A jugar!'); break; }
          case 'trivia': await answerTrivia(); break;
          case 'triviaFin': if (!(await tap('Ir al juego sorpresa'))) { errs.pop(); await tap('Volver al camino'); } break;
          case 'memoramaReglas': await clickYellow(); break;
          case 'memorama': await playMemorama(); await p.waitForTimeout(1200); break;
          case 'adivinanzaIntro': await clickYellow(); break;
          case 'adivinanza': await tap('¿Listos?'); await tap('¡La adivinaron!'); await p.waitForTimeout(400); break;
          case 'desafioIntro': await tap('¡Vamos!'); break;
          case 'desafio': await tap('¡Lo hicimos!'); await p.waitForTimeout(500); break;
          case 'adivinanzaFin': case 'memoramaFin': case 'desafioFin': await tap('Volver al camino'); break;
          case 'cerrado': await tap('Hasta mañana'); done = true; break;
          case 'final': await shot('c-belen'); done = true; break;
          case 'hoy': await tap('Continuar la aventura'); break;
          default: errs.push(`día ${d}: pantalla inesperada ${c.s}`); done = true;
        }
      }
      if (!done) errs.push(`día ${d}: no se pudo terminar (atascado en ${(await cur()).s})`);
      console.log(`día ${d} listo · ${steps} pasos · ${new Date().toLocaleTimeString()}`);
      if ([3, 4, 9, 13, 24].includes(d)) await shot('c-dia' + d);
    }
    const st = await p.evaluate(async () => { const c = await import('/js/core.js'); return { hechos: Object.values(c.S.completos).filter(x => x.trivia).length, contenidos: Object.values(c.S.completos).filter(x => x.contenido).length, panes: c.S.panes, prendas: c.S.prendas.length, ruletas: Object.keys(c.S.ruletas).length, sorpresas: Object.values(c.S.sorpresas).filter(x => x === 'hecha').length }; });
    console.log('recorrido completo:', JSON.stringify(st), 'pantallas:', [...visto].join(','));
    if (st.contenidos < 26) errs.push('no se completaron todos los contenidos: ' + JSON.stringify(st));
    // 3) Navidad
    await nextDay(); await p.waitForTimeout(600); await shot('c-navidad');
    const nav = await p.evaluate(() => document.querySelector('#viewport .layer:last-child').textContent.includes('Feliz Navidad'));
    if (!nav) errs.push('el 25 de diciembre no dice «¡Feliz Navidad!»');
  },
  // hoja del día: minimizar a barra compacta, su botón ▶, abrir, arrastrar, y el botón de trivias pendientes
  async hoja() {
    await p.evaluate(async () => { const c = await import('/js/core.js'); c.reset({ hoy: 6, inscrito: true, teaserVisto: true }); c.S.completos[0] = { contenido: true }; for (const d of [1, 2, 3]) c.S.completos[d] = { contenido: true }; c.save(); c.go('mapa', {}, 'none'); });
    await p.waitForTimeout(1600);
    const st = () => p.evaluate(() => { const L = document.querySelector('#viewport .layer:last-child'); const s = L.querySelector('[data-sheet]'); const bar = L.querySelector('.mini-bar'); return { scr: L.dataset.screen, mini: !!s?.classList.contains('mini'), barVisible: !!bar && getComputedStyle(bar).display !== 'none', h: s?.offsetHeight, alt: L.querySelector('.sheet-alt')?.textContent.replace(/\s+/g, ' ').trim(), dot: L.querySelector('.mb-dot')?.textContent }; });
    let s = await st();
    if (!/3 trivias pendientes/.test(s.alt || '') || !/Día 1/.test(s.alt || '')) errs.push('botón de trivias pendientes: ' + s.alt);
    const altOneLine = await p.evaluate(() => { const a = document.querySelector('#viewport .layer:last-child .sheet-alt span'); return a && a.scrollWidth <= a.clientWidth + 1; });
    if (!altOneLine) errs.push('el botón de trivias pendientes no cabe en una línea');
    await p.evaluate(() => document.querySelector('#viewport .layer:last-child .sheet-min').click()); await p.waitForTimeout(600); await shot('mini');
    s = await st(); if (!s.mini || !s.barVisible || s.h > 124) errs.push('minimizar no deja la barra compacta: ' + JSON.stringify(s));
    if (!/3 trivias pendientes/.test(await p.evaluate(() => document.querySelector('#viewport .layer:last-child .mini-bar')?.getAttribute('aria-label') || ''))) errs.push('la barra no avisa las 3 trivias pendientes');
    await p.evaluate(() => document.querySelector('#viewport .layer:last-child .mini-bar .mb-txt').click()); await p.waitForTimeout(600);
    s = await st(); if (s.mini) errs.push('tocar la barra no abre la hoja');
    // arrastrar hacia abajo desde la rayita
    const g = await p.evaluate(() => { const r = document.querySelector('#viewport .layer:last-child [data-sheet]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + 12 }; });
    await p.mouse.move(g.x, g.y); await p.mouse.down(); await p.mouse.move(g.x, g.y + 60, { steps: 6 }); await p.mouse.move(g.x, g.y + 160, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(600);
    s = await st(); if (!s.mini) errs.push('arrastrar hacia abajo no minimiza');
    await p.evaluate(() => document.querySelector('#viewport .layer:last-child .mb-cta').click()); await p.waitForTimeout(900);
    if (!['reproductor', 'ruletaPop'].includes(await screen())) errs.push('el ▶ de la barra no abre el día (historia o su ruleta): ' + await screen());
    await p.evaluate(async () => { const c = await import('/js/core.js'); c.go('mapa', {}, 'none'); }); await p.waitForTimeout(1300);
    await tap('3 trivias pendientes'); await p.waitForTimeout(700);
    const c = await p.evaluate(async () => { const c = await import('/js/core.js'); return c.cur.name + ' ' + c.cur.params.day; });
    if (c !== 'trivia 1') errs.push('el botón de trivias pendientes no abre la del día 1: ' + c);
  },
  // «volver» nunca regresa a celebraciones, premios ni juegos ya terminados
  async volver() {
    const PASO = ['confirmacion', 'completado', 'triviaFin', 'trivia', 'ruletaPop', 'ruletaPremio', 'premioCuarto', 'memoramaReglas', 'memorama', 'memoramaFin', 'adivinanzaIntro', 'adivinanza', 'adivinanzaTiempo', 'adivinanzaFin', 'desafioIntro', 'desafio', 'desafioFin', 'cerrado', 'calificacion', 'compartir'];
    const backs = async (tag, n = 5) => {
      const ruta = [await screen()];
      for (let i = 0; i < n; i++) {
        await p.goBack(); await p.waitForTimeout(650);
        const s = await screen(); ruta.push(s);
        if (PASO.includes(s) || (s === 'teaser' && i > 0)) errs.push(`${tag}: «volver» cayó en ${s} (${ruta.join(' → ')})`);
      }
      const fin = ruta[ruta.length - 1];
      if (!['hoy', 'teodoro', 'mundos'].includes(fin)) errs.push(`${tag}: después de volver quedó en ${fin} (${ruta.join(' → ')})`);
      console.log(tag + ':', ruta.join(' → '));
    };
    const st = (o) => p.evaluate(async (o) => { const c = await import('/js/core.js'); c.reset({ inscrito: true, teaserVisto: true, ...o.s }); for (let d = 0; d <= o.upto; d++) c.S.completos[d] = { contenido: true, trivia: true, estrellas: 2 }; c.save(); c.clearHistory(); c.go('hoy', {}, 'none', { tab: true }); }, o);
    const finishPlayer = () => p.evaluate(() => { const sl = document.querySelector('#viewport .layer:last-child [role=slider]'); if (!sl) return; const r = sl.getBoundingClientRect(); sl.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.right - 1, clientY: r.top + 5 })); });
    // 1) inscripción → espera
    await p.evaluate(async () => { const c = await import('/js/core.js'); c.reset({}); c.save(); c.clearHistory(); c.go('hoy', {}, 'none', { tab: true }); }); await p.waitForTimeout(1600);
    await tap('Unirme gratis'); await p.waitForTimeout(2400); await backs('inscripción', 3);
    // 2) un día completo con trivia (17): historia → ¡Terminaste! → trivia → final de trivia → mapa
    await st({ s: { hoy: 17 }, upto: 16 }); await p.waitForTimeout(900);
    await tap('Continuar la aventura'); await p.waitForTimeout(700);
    await p.evaluate(() => document.querySelector('#viewport .layer:last-child [data-sheet] a').click()); await p.waitForTimeout(900);
    await finishPlayer(); await p.waitForTimeout(1300); await rate('volver'); await tap('¡A jugar!'); await answerTrivia(); await p.waitForTimeout(500);
    await tap('Volver al camino'); await p.waitForTimeout(3500);
    await backs('día completo', 4);
    // 3) ruleta (se toca en el mapa) → premio → mapa; la historia se abre sin ruleta
    await st({ s: { hoy: 11, forzarPremio: 'panes' }, upto: 10 }); await p.waitForTimeout(900);
    await tap('Continuar la aventura'); await p.waitForTimeout(900);
    await tap('Ruleta de la semana 2'); await p.waitForTimeout(900);
    await tap('¡Girar!'); await p.waitForTimeout(5300);
    // en el premio, el «atrás» del sistema hace lo mismo que «Volver al camino» (al mapa)
    await p.goBack(); await p.waitForTimeout(1000);
    if ((await screen()) !== 'mapa') errs.push('atrás en el premio de la ruleta no vuelve al mapa: ' + await screen());
    await p.evaluate(() => document.querySelector('#viewport .layer:last-child [data-sheet] a').click()); await p.waitForTimeout(900);
    if ((await screen()) !== 'reproductor') errs.push('«Ver video» en día de ruleta no abre el video: ' + await screen());
    await finishPlayer(); await p.waitForTimeout(1300); await rate('volver'); await tap('Ahora no'); await p.waitForTimeout(900);
    await backs('ruleta', 4);
    // 4) sorpresa (desafío) → final → mapa
    await st({ s: { hoy: 9 }, upto: 9 }); await p.waitForTimeout(900);
    await p.evaluate(async () => { const c = await import('/js/core.js'); c.go('mapa', {}, 'none'); }); await p.waitForTimeout(900);
    await p.evaluate(async () => { const c = await import('/js/core.js'); c.go('desafioIntro', { day: 9 }, 'fade'); }); await p.waitForTimeout(800);
    await tap('¡Vamos!'); await tap('¡Lo hicimos!'); await p.waitForTimeout(900); await tap('Volver al camino'); await p.waitForTimeout(1500);
    await backs('sorpresa', 4);
    // 5) reto en familia → ¡Lo hicimos! → ¡Terminaste! → mapa
    await st({ s: { hoy: 13 }, upto: 12 }); await p.waitForTimeout(900);
    await tap('Continuar la aventura'); await p.waitForTimeout(700);
    await p.evaluate(() => document.querySelector('#viewport .layer:last-child [data-sheet] a').click()); await p.waitForTimeout(900);
    await tap('¡Lo hicimos!'); await p.waitForTimeout(1200); await tap('Volver al camino'); await p.waitForTimeout(1000);
    await backs('reto', 4);
  },
  // días libres: tocar un día desbloqueado o con trivia pendiente abre su hoja; la ruleta aplazada vuelve
  async libre() {
    const st = () => p.evaluate(async () => { const c = await import('/js/core.js'); const L = document.querySelector('#viewport .layer:last-child'); return { s: c.cur.name, dia: c.cur.params.dia, titulo: L.querySelector('.sheet-head')?.children[1]?.textContent, cta: L.querySelector('[data-sheet] a')?.textContent.trim() }; });
    const tapNodo = n => p.evaluate(n => document.querySelector(`#viewport .layer:last-child a[aria-label^="Día ${n},"], #viewport .layer:last-child a[aria-label^="Día ${n}:"]`)?.click(), n);
    await p.evaluate(async () => { const c = await import('/js/core.js'); c.reset({ hoy: 10, inscrito: true, teaserVisto: true }); c.S.completos[0] = { contenido: true }; for (const d of [1, 2, 3]) c.S.completos[d] = { contenido: true }; c.save(); c.clearHistory(); c.go('mapa', {}, 'none'); });
    await p.waitForTimeout(1500);
    // día 10 desbloqueado (va en el 4): su hoja, no un bloqueo
    await tapNodo(10); await p.waitForTimeout(1200); let s = await st(); await shot('dia10');
    if (s.dia !== 10 || !/Ver|Escuchar|Jugar|Comenzar/.test(s.cta || '')) errs.push('tocar el día 10 no abre su hoja: ' + JSON.stringify(s));
    await tap('Volver con Teodoro'); await p.waitForTimeout(1000); s = await st();
    if (s.dia != null) errs.push('«Volver a tu día» no vuelve: ' + JSON.stringify(s));
    // día 2 (historia vista, trivia pendiente): hoja con «Jugar la trivia», sin saltar directo
    await tapNodo(2); await p.waitForTimeout(1200); s = await st(); await shot('dia2');
    if (s.s !== 'mapa' || s.dia !== 2 || !/Jugar la trivia/.test(s.cta || '')) errs.push('tocar el día 2 no muestra su hoja con la trivia: ' + JSON.stringify(s));
    // ruleta del día 4: X cierra y queda pendiente; luego se puede girar desde la hoja
    await p.evaluate(async () => { const c = await import('/js/core.js'); c.go('ruletaPop', { day: 4, from: 'mapa' }, 'modal'); }); await p.waitForTimeout(900); await shot('ruleta-x');
    await p.evaluate(() => document.querySelector('#viewport .layer:last-child .pop-x')?.click()); await p.waitForTimeout(1200);
    s = await st(); if (s.s !== 'mapa') errs.push('la X de la ruleta no cierra: ' + s.s);
    // la ruleta se gira tocándola en el mapa
    await tap('Ruleta de la semana 1'); await p.waitForTimeout(900);
    if ((await screen()) !== 'ruletaPop') errs.push('la ruleta aplazada no se puede girar después: ' + await screen());
  },
  // día sin trivia (10): la historia completa el día y vuelve al mapa; día sin trivia con sorpresa (12): la abre
  async sintrivia() {
    await p.evaluate(async () => { const c = await import('/js/core.js'); c.reset({ hoy: 10, inscrito: true, teaserVisto: true }); for (let d = 0; d <= 9; d++) c.S.completos[d] = { contenido: true, trivia: true, estrellas: 2 }; c.save(); c.clearHistory(); c.go('reproductor', { day: 10 }, 'none'); });
    await p.waitForTimeout(800);
    await p.evaluate(() => { const sl = document.querySelector('#viewport .layer:last-child [role=slider]'); const r = sl.getBoundingClientRect(); sl.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.right - 1, clientY: r.top + 5 })); });
    await p.waitForTimeout(1400); await rate('sintrivia'); await shot('completado-sin-trivia');
    const txt = await p.evaluate(() => document.querySelector('#viewport .layer:last-child').textContent);
    if (/¡A jugar!|trivia/i.test(txt)) errs.push('día sin trivia todavía ofrece la trivia');
    const st = await p.evaluate(async () => { const c = await import('/js/core.js'); return { done: c.isDone(10), st: c.stars(10), act: c.activeDay() }; });
    if (!st.done || st.st || st.act != null) errs.push('el día 10 sin trivia no queda completo: ' + JSON.stringify(st));
    await tap('Volver al camino'); await p.waitForTimeout(3500);
    if (!['mapa', 'cerrado'].includes(await screen())) errs.push('tras un día sin trivia no vuelve al mapa: ' + await screen());
    await shot('mapa-sin-trivia');
    await p.evaluate(async () => { const c = await import('/js/core.js'); c.reset({ hoy: 12, inscrito: true, teaserVisto: true }); for (let d = 0; d <= 11; d++) c.S.completos[d] = { contenido: true, trivia: true, estrellas: 2 }; c.save(); c.clearHistory(); c.go('completado', { day: 12 }, 'none'); c.S.completos[12] = { contenido: true }; c.save(); });
    await p.waitForTimeout(1200); await shot('completado-sorpresa');
    await tap('Ir al juego sorpresa'); await p.waitForTimeout(900);
    if (await screen() !== 'memoramaReglas') errs.push('día 12 sin trivia no abre la sorpresa: ' + await screen());
  },
  // títulos y subtítulos de los 26 días: nada encima de otra cosa ni cortado (reproductor, hoja del mapa, hub)
  async titulos() {
    const cruza = (a, b) => a && b && a.bottom > b.top + 1 && a.top < b.bottom - 1 && a.right > b.left + 1 && a.left < b.right - 1;
    for (let n = 1; n <= 26; n++) {
      // reproductor
      await p.evaluate(async (n) => { const c = await import('/js/core.js'); c.reset({ hoy: n, inscrito: true, teaserVisto: true }); for (let d = 0; d < n; d++) c.S.completos[d] = { contenido: true, trivia: true, estrellas: 2 }; c.save(); c.clearHistory(); c.go('reproductor', { day: n }, 'none'); }, n);
      await p.waitForTimeout(500);
      const r = await p.evaluate(() => {
        const L = document.querySelector('#viewport .layer:last-child'); const sl = L.querySelector('[role=slider]');
        const t = L.querySelector('.rep-sub')?.parentElement; const R = el => el && el.getBoundingClientRect().toJSON();
        const x = L.querySelector('[aria-label="Cerrar"]');
        return { scr: L.dataset.screen, t: R(t), sl: R(sl), x: R(x), corta: t ? t.scrollWidth > t.clientWidth + 1 : false, txt: t?.textContent };
      });
      if (process.env.DEBUG) console.log(n, JSON.stringify({ t: r.t && [r.t.top|0, r.t.bottom|0], sl: r.sl && r.sl.top|0, txt: r.txt }));
      if (r.scr === 'reproductor') {
        if (!r.t) errs.push(`reproductor día ${n}: sin la línea bajo el título`);
        else if (r.t.bottom > r.sl.top - 4) errs.push(`reproductor día ${n}: el título se monta sobre la barra («${r.txt}»)`);
        if (cruza(r.t, r.x)) errs.push(`reproductor día ${n}: el título choca con la X`);
        if (r.corta) errs.push(`reproductor día ${n}: título cortado («${r.txt}»)`);
      }
      // hoja del mapa
      await p.evaluate(async () => { const c = await import('/js/core.js'); c.go('mapa', {}, 'none', { replace: true }); });
      await p.waitForTimeout(1300);
      const h = await p.evaluate(() => {
        const L = document.querySelector('#viewport .layer:last-child'); const sh = L.querySelector('[data-sheet]'); if (!sh) return null;
        const head = sh.querySelector('.sheet-head'); const rows = [...sh.querySelectorAll('.sheet-row, :scope > a')].filter(e => e.offsetParent);
        const R = el => el.getBoundingClientRect().toJSON();
        const cortado = [head, ...rows].filter(Boolean).flatMap(e => [...e.querySelectorAll('div, span')]).filter(e => e.childElementCount === 0 && e.textContent.trim() && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).textOverflow !== 'ellipsis').map(e => e.textContent.trim());
        return { head: head && R(head), rows: rows.map(R), cortado, txt: head?.textContent };
      });
      if (h) {
        const all = [h.head, ...h.rows].filter(Boolean);
        for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (cruza(all[i], all[j])) errs.push(`hoja día ${n}: se montan dos filas («${h.txt}»)`);
        if (h.cortado.length) errs.push(`hoja día ${n}: texto cortado sin «…»: ${h.cortado.join(' | ')}`);
      }
      // «¡Terminaste!» (con la fila de calificar) e imprimible del día
      await p.evaluate(async (n) => { const c = await import('/js/core.js'); c.S.completos[n] = { contenido: true }; c.save(); c.go('completado', { day: n }, 'none'); }, n); await p.waitForTimeout(700);
      const k = await p.evaluate(() => {
        const L = document.querySelector('#viewport .layer:last-child'); const vis = el => el && el.offsetParent && getComputedStyle(el).display !== 'none';
        const R = el => vis(el) ? el.getBoundingClientRect().toJSON() : null; const kids = [...L.querySelector('.root').firstElementChild.children];
        const tit = kids.find(el => /¿Jugamos|Hoy toca|Un paso más/.test(el.textContent) && el.tagName === 'DIV');
        const btn = kids.find(el => el.tagName === 'A' && /^(¡A jugar!|Ir al juego sorpresa|Volver al camino)$/.test(el.textContent.trim()));
        const sub = kids.find(el => el.tagName === 'DIV' && /sobre el (video|reto)|juego sorpresa/.test(el.textContent));
        return { tit: R(tit), rate: R(L.querySelector('.rate-row')), sub: R(sub), btn: R(btn), teo: R([...L.querySelectorAll('img')].find(i => /Teodoro/.test(i.alt || ''))) };
      });
      const kk = [['título', k.tit], ['calificar', k.rate], ['subtítulo', k.sub], ['botón', k.btn]].filter(x => x[1]);
      for (let i = 0; i < kk.length; i++) for (let j = i + 1; j < kk.length; j++) if (cruza(kk[i][1], kk[j][1])) errs.push(`¡Terminaste! día ${n}: se montan ${kk[i][0]} y ${kk[j][0]}`);
      if (cruza(k.rate, k.teo) && k.teo.bottom > k.rate.top + 24) errs.push(`¡Terminaste! día ${n}: la fila de calificar tapa a Teodoro`);
      await p.evaluate(async (n) => { const c = await import('/js/core.js'); c.go('imprimible', { day: n }, 'none'); }, n); await p.waitForTimeout(500);
      const im = await p.evaluate(() => { const L = document.querySelector('#viewport .layer:last-child'); const h = [...L.querySelectorAll('div')].find(d => d.childElementCount === 0 && /^(Para colorear en familia|Ármenla en familia|Para tenerlo en casa)$/.test(d.textContent.trim()))?.parentElement; const sheet = [...L.querySelectorAll('img')].find(i => /Vista previa/.test(i.alt || '')); const R = el => el?.getBoundingClientRect().toJSON(); return { h: R(h), s: R(sheet) }; });
      if ([6, 19].includes(n)) { /* retos de acción: su descargable son los pasos del hub */ } else if (!im.h) errs.push(`imprimible día ${n}: sin título`); else if (cruza(im.h, im.s)) errs.push(`imprimible día ${n}: el título se monta sobre la hoja`);
      // hub (retos y juego en familia)
      if ([6, 13, 14, 19].includes(n)) {
        await p.evaluate(async (n) => { const c = await import('/js/core.js'); c.go('hub', { day: n }, 'none'); }, n); await p.waitForTimeout(600);
        const u = await p.evaluate(() => { const L = document.querySelector('#viewport .layer:last-child'); const tit = [...L.querySelectorAll('div')].find(d => d.style.fontSize === '24px'); const card = L.querySelector('.hub-pasos'); const R = el => el && el.getBoundingClientRect().toJSON(); return { tit: R(tit?.parentElement), card: R(card), over: card ? card.scrollHeight > card.clientHeight + 1 : false }; });
        if (cruza(u.tit, u.card)) errs.push(`hub día ${n}: el título se monta sobre los pasos`);
        if (u.over) errs.push(`hub día ${n}: los pasos no caben en la tarjeta`);
      }
    }
  },
  async teodoro() { await tap('Teodoro'); await shot('tab'); await tap('Ver mis mundos'); await shot('mundos'); await tap('Adviento'); await shot('mapa'); },
};
for (const name of scen.split(',')) {
  // el panel de controles del prototipo no debe quedar abierto de un recorrido a otro
  await p.evaluate(() => { const b = document.getElementById('panelBtn'); if (b?.getAttribute('aria-expanded') === 'true') b.click(); });
  try { if (name === 'inicio' || name === 'completo') { await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200); } else await base(); await flows[name](); } catch (e) { errs.push(name + ': ' + e.message); }
}
console.log(errs.length ? errs.join('\n') : 'OK sin errores');
await b.close();
