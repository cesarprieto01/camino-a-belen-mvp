// Capturas del MVP para el lienzo: node tools/lienzo.mjs <out-dir> [solo,estas]
import { chromium } from 'playwright';
import fs from 'fs';
const [dir = 'tmp/lienzo', only] = process.argv.slice(2);
fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ executablePath: '/Users/ces/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const [VW, VH] = (process.env.VP || '390x844').split('x').map(Number); // VP=375x667 para el celular chico
const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
await p.goto('http://localhost:5190/app.html');
await p.evaluate(() => localStorage.clear());
await p.reload(); await p.waitForTimeout(1200);
await p.addStyleTag({ content: '#panelBtn,.toast,.nota{display:none!important}' });

// estado: hoy, hechos hasta «upto», más campos; luego abre «scr»
let TEMA = 'claro';
const setup = (o) => p.evaluate(async (o) => {
  const c = await import('/js/core.js');
  c.reset({ hoy: o.hoy, inscrito: o.inscrito ?? true, teaserVisto: o.teaserVisto ?? true, tema: o.tema, panes: o.panes ?? 120, ...(o.extra || {}) });
  c.S.completos = {};
  if (o.upto != null) { c.S.completos[0] = { contenido: true }; for (let n = 1; n <= o.upto; n++) c.S.completos[n] = { contenido: true, trivia: true, estrellas: [2, 3, 2, 3, 1, 3, 2, 2, 3][n % 9] }; }
  Object.assign(c.S.completos, o.completos || {});
  Object.assign(c.S, o.S || {});
  c.save(); c.clearHistory(); c.go(o.scr || 'hoy', o.params || {}, 'none', { tab: true });
}, { ...o, tema: TEMA });
const tap = (q) => p.evaluate((q) => {
  const L = document.querySelector('#viewport .layer:last-child');
  const norm = s => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const els = [...L.querySelectorAll('a,button,[role=button],[aria-label]')];
  const el = els.find(e => norm(e.getAttribute('aria-label')).startsWith(norm(q))) || els.find(e => norm(e.textContent) === norm(q)) || els.find(e => norm(e.textContent).startsWith(norm(q)));
  if (el) { el.scrollIntoView({ block: 'center' }); el.click(); }
  return !!el;
}, q).then(async ok => { if (!ok) errs.push('NO ENCONTRADO ' + q); await p.waitForTimeout(700); });
const js = (f, a) => p.evaluate(f, a);

const SHOTS = {
  // ---- estados de cada objeto ----
  ...Object.fromEntries([0, 1, 2, 3, 4, 5].map(k => [`hoy-bat${k}`, async () => { await setup({ hoy: 9, upto: 8, S: { bateria: k } }); }])),
  'regreso': async () => { await setup({ hoy: 16, upto: 8, S: { bateria: 0, regreso: true } }); },
  'post-incompleto': async () => { await setup({ hoy: 27, upto: 21 }); },
  'se-une-tarde': async () => { await setup({ hoy: 5, inscrito: false }); },
  'mapa-energia': async () => { await setup({ hoy: 9, upto: 8, scr: 'mapa', S: { bateria: 2 } }); await p.waitForTimeout(900); await tap('Energía de Teodoro'); },
  'mapa-musica-off': async () => { await setup({ hoy: 9, upto: 8, scr: 'mapa' }); await p.waitForTimeout(900); await js(() => { const b = document.querySelector('#viewport .layer:last-child button[aria-label^="Música de fondo"]'); b?.click(); }); },
  'ruleta-girada': async () => { await setup({ hoy: 11, upto: 10, scr: 'mapa', S: { ruletas: { 4: 'gorro', 11: 'bufanda' }, prendas: ['gorro', 'bufanda'] } }); await p.waitForTimeout(900); await js(() => document.querySelector('#viewport .layer:last-child .sheet-min')?.click()); },
  'mapa-dia-libre': async () => { await setup({ hoy: 12, upto: 10, scr: 'mapa' }); },
  'trivia-correcto': async () => { await SHOTS['trivia-texto'](); await p.waitForTimeout(500); const t = await js(async () => { const { TRIVIA } = await import('/js/data.js'); const { cur } = await import('/js/core.js'); const q = TRIVIA[cur.params.day][cur.params.i || 0]; return q.o[q.a].t || q.o[q.a]; }); await tap(t); },
  'trivia-pista': async () => { await SHOTS['trivia-texto'](); await p.waitForTimeout(500); const t = await js(async () => { const { TRIVIA } = await import('/js/data.js'); const { cur } = await import('/js/core.js'); const q = TRIVIA[cur.params.day][cur.params.i || 0]; const k = q.o.findIndex((_, i) => i !== q.a); return q.o[k].t || q.o[k]; }); await tap(t); },
  'trivia-reintento': async () => { await SHOTS['trivia-pista'](); await p.waitForTimeout(400); const t = await js(async () => { const { TRIVIA } = await import('/js/data.js'); const { cur } = await import('/js/core.js'); const q = TRIVIA[cur.params.day][cur.params.i || 0]; return q.o[q.a].t || q.o[q.a]; }); await tap(t); },
  'trivia-varias-sel': async () => { await SHOTS['trivia-varias'](); await p.waitForTimeout(500); const ts = await js(async () => { const { TRIVIA } = await import('/js/data.js'); const { cur } = await import('/js/core.js'); const q = TRIVIA[cur.params.day][cur.params.i || 0]; return q.a.map(i => q.o[i].t || q.o[i]); }); for (const t of ts) await tap(t); },
  'trivia-imagenes-ok': async () => { await SHOTS['trivia-imagenes'](); await p.waitForTimeout(500); const t = await js(async () => { const { TRIVIA } = await import('/js/data.js'); const { cur } = await import('/js/core.js'); const q = TRIVIA[cur.params.day][cur.params.i || 0]; return q.o[q.a].t || q.o[q.a]; }); await tap(t); },
  'trivia-fin-2': async () => { await setup({ hoy: 2, upto: 1, completos: { 2: { contenido: true, trivia: true, estrellas: 2 } } }); await js(async () => { const c = await import('/js/core.js'); c.go('triviaFin', { day: 2, ok: 4 }, 'none'); }); },
  'trivia-fin-1': async () => { await setup({ hoy: 2, upto: 1, completos: { 2: { contenido: true, trivia: true, estrellas: 1 } } }); await js(async () => { const c = await import('/js/core.js'); c.go('triviaFin', { day: 2, ok: 2 }, 'none'); }); },
  'calificar-4': async () => { await SHOTS['completado-9'](); await p.waitForTimeout(700); await js(() => { const st = [...document.querySelectorAll('#viewport .layer:last-child [role=radio], #viewport .layer:last-child button[aria-label*="estrella"]')]; st[3]?.click(); }); },
  'premio-manzana': async () => { await setup({ hoy: 11, upto: 10, scr: 'mapa', S: { ruletas: { 4: 'gorro' } } }); await p.waitForTimeout(900); await js(async () => { const c = await import('/js/core.js'); c.go('ruletaPremio', { day: 11, premio: 'manzana' }, 'modal'); }); await p.waitForTimeout(600); },
  'memorama-reglas': async () => { await setup({ hoy: 3, upto: 2, completos: { 3: { contenido: true, trivia: true, estrellas: 2 } } }); await js(async () => { const c = await import('/js/core.js'); c.go('memoramaReglas', { day: 3 }, 'none'); }); },
  'memorama-fin': async () => { await setup({ hoy: 3, upto: 2, completos: { 3: { contenido: true, trivia: true, estrellas: 2 } } }); await js(async () => { const c = await import('/js/core.js'); c.go('memoramaFin', { day: 3 }, 'none'); }); },
  'adivinanza-intro': async () => { await setup({ hoy: 7, upto: 6 }); await js(async () => { const c = await import('/js/core.js'); c.go('adivinanzaIntro', { day: 6 }, 'none'); }); },
  'adivinanza-juego': async () => { await SHOTS['adivinanza-listos'](); await p.waitForTimeout(500); await tap('¿Listos?'); },
  'adivinanza-tiempo': async () => { await setup({ hoy: 7, upto: 6 }); await js(async () => { const c = await import('/js/core.js'); c.go('adivinanzaTiempo', { day: 6, ok: 3 }, 'none'); }); },
  'adivinanza-fin': async () => { await setup({ hoy: 7, upto: 6 }); await js(async () => { const c = await import('/js/core.js'); c.go('adivinanzaFin', { day: 6, ok: 4 }, 'none'); }); },
  'desafio-otra': async () => { await SHOTS['desafio'](); await p.waitForTimeout(500); await tap('Sacar otra carta'); },
  'desafio-fin': async () => { await setup({ hoy: 9, upto: 8, completos: { 9: { contenido: true, trivia: true, estrellas: 2 } } }); await js(async () => { const c = await import('/js/core.js'); c.go('desafioFin', { day: 9 }, 'none'); }); },
  'invitacion': async () => { await setup({ hoy: 0 }); await js(async () => { const c = await import('/js/core.js'); c.go('invitacion', {}, 'none'); }); },
  'final-compartir': async () => { await setup({ hoy: 26, upto: 25, scr: 'finalCompartir', params: { day: 26 } }); },
  'teodoro-prendas': async () => { await setup({ hoy: 19, upto: 18, scr: 'teodoro', S: { ruletas: { 4: 'gorro', 11: 'bufanda', 18: 'bolso' }, prendas: ['gorro', 'bufanda', 'bolso'], prendasVistas: 3 } }); },
  'hub-cancion': async () => { await setup({ hoy: 13, upto: 12, scr: 'hub', params: { day: 13 } }); await p.waitForTimeout(400); await js(() => document.querySelector('#viewport .layer:last-child')?.scrollTo?.(0, 400)); },
  'completado-9': async () => { await setup({ hoy: 9, upto: 8, completos: { 9: { contenido: true } }, scr: 'completado', params: { day: 9 } }); },
  'ruleta-mapa': async () => { await setup({ hoy: 11, upto: 10, scr: 'mapa' }); await p.waitForTimeout(900); await js(() => document.querySelector('#viewport .layer:last-child .sheet-min')?.click()); },
  'trivia-varias': async () => { await setup({ hoy: 1, upto: 0, completos: { 1: { contenido: true } } }); const i = await js(async () => { const { TRIVIA } = await import('/js/data.js'); return TRIVIA[1].findIndex(q => Array.isArray(q.a)); }); await js(async (i) => { const c = await import('/js/core.js'); c.go('trivia', { day: 1, i: Math.max(i, 0), ok: 0 }, 'none'); }, i); },
  'trivia-fin': async () => { await setup({ hoy: 9, upto: 8, completos: { 9: { contenido: true } } }); await js(async () => { const c = await import('/js/core.js'); c.S.completos[9] = { contenido: true, trivia: true, estrellas: 3 }; c.save(); c.go('triviaFin', { day: 9, ok: 5 }, 'none'); }); },
  'memorama': async () => { await setup({ hoy: 3, upto: 2, completos: { 3: { contenido: true, trivia: true, estrellas: 2 } } }); await js(async () => { const c = await import('/js/core.js'); c.go('memorama', { day: 3 }, 'none'); }); },
  'desafio': async () => { await setup({ hoy: 9, upto: 8, completos: { 9: { contenido: true, trivia: true, estrellas: 2 } } }); await js(async () => { const c = await import('/js/core.js'); c.go('desafio', { day: 9 }, 'none'); }); },
  'manana': async () => { await setup({ hoy: 10, upto: 10, scr: 'mapa', params: { thenCerrado: true } }); await p.waitForTimeout(2600); },
  'pre-hoy': async () => { await setup({ hoy: 0, inscrito: false, teaserVisto: true }); },
  'teaser': async () => { await setup({ hoy: 0, inscrito: false, teaserVisto: true }); await js(async () => { const c = await import('/js/core.js'); c.go('teaser', {}, 'modal'); }); },
  'listo': async () => { await setup({ hoy: 0, inscrito: false, teaserVisto: true }); await tap('Unirme gratis'); await p.waitForTimeout(400); await tap('Unirme gratis'); },
  'espera': async () => { await setup({ hoy: 0 }); await tap('Ver el camino'); await p.waitForTimeout(400); if (await js(() => document.querySelector('#viewport .layer:last-child').dataset.screen) !== 'espera') await js(async () => { const c = await import('/js/core.js'); c.go('espera', {}, 'page'); }); },
  'pre-hoy-dentro': async () => { await setup({ hoy: 0 }); },
  'pre-mapa': async () => { await setup({ hoy: 0, scr: 'mapa' }); },
  'hoy': async () => { await setup({ hoy: 9, upto: 8 }); },
  'hoy-atrasado': async () => { await setup({ hoy: 11, upto: 8, S: { bateria: 3 } }); },
  'hoy-domingo': async () => { await setup({ hoy: 15, upto: 14 }); },
  'hoy-navidad': async () => { await setup({ hoy: 27, upto: 26 }); },
  'mapa': async () => { await setup({ hoy: 9, upto: 8, scr: 'mapa' }); },
  'mapa-mini': async () => { await setup({ hoy: 9, upto: 8, scr: 'mapa' }); await p.waitForTimeout(900); await js(() => document.querySelector('#viewport .layer:last-child .sheet-min')?.click()); },
  'mapa-pendientes': async () => { await setup({ hoy: 6, completos: { 0: { contenido: true }, 1: { contenido: true }, 2: { contenido: true }, 3: { contenido: true } }, scr: 'mapa' }); },
  'mapa-dia-elegido': async () => { await setup({ hoy: 10, completos: { 0: { contenido: true }, 1: { contenido: true, trivia: true, estrellas: 3 }, 2: { contenido: true }, 3: { contenido: true } }, scr: 'mapa', params: { dia: 10 } }); },
  'mapa-dia-pendiente': async () => { await setup({ hoy: 10, completos: { 0: { contenido: true }, 1: { contenido: true, trivia: true, estrellas: 3 }, 2: { contenido: true }, 3: { contenido: true } }, scr: 'mapa', params: { dia: 2 } }); },
  'ruleta-pop': async () => { await setup({ hoy: 11, upto: 10, scr: 'mapa' }); await p.waitForTimeout(900); await js(async () => { const c = await import('/js/core.js'); c.go('ruletaPop', { day: 11, from: 'mapa' }, 'modal'); }); await p.waitForTimeout(600); },
  'premio-panes': async () => { await setup({ hoy: 11, upto: 10, scr: 'mapa', S: { ruletas: { 4: 'gorro' } } }); await p.waitForTimeout(900); await js(async () => { const c = await import('/js/core.js'); c.go('ruletaPremio', { day: 11, premio: 'panes' }, 'modal'); }); await p.waitForTimeout(600); },
  'premio-prenda': async () => { await setup({ hoy: 11, upto: 10, scr: 'mapa', S: { ruletas: { 4: 'gorro' } } }); await p.waitForTimeout(900); await js(async () => { const c = await import('/js/core.js'); c.go('ruletaPremio', { day: 11, premio: 'bufanda' }, 'modal'); }); await p.waitForTimeout(600); },
  'premio-cuarto': async () => { await setup({ hoy: 11, upto: 10, scr: 'mapa', S: { ruletas: { 4: 'gorro', 11: 'cuarto' } } }); await p.waitForTimeout(900); await js(async () => { const c = await import('/js/core.js'); c.go('premioCuarto', { day: 11, premio: 'cuarto' }, 'modal'); }); await p.waitForTimeout(600); },
  'trivia-imagenes': async () => { await setup({ hoy: 9, upto: 8, completos: { 9: { contenido: true } } }); const i = await js(async () => { const { TRIVIA } = await import('/js/data.js'); return TRIVIA[9].findIndex(q => q.o.some(o => o.img)); }); await js(async (i) => { const c = await import('/js/core.js'); c.go('trivia', { day: 9, i: Math.max(i, 0), ok: 0 }, 'none'); }, i); },
  'trivia-texto': async () => { await setup({ hoy: 9, upto: 8, completos: { 9: { contenido: true } } }); const i = await js(async () => { const { TRIVIA } = await import('/js/data.js'); return TRIVIA[9].findIndex(q => !q.o.some(o => o.img)); }); await js(async (i) => { const c = await import('/js/core.js'); c.go('trivia', { day: 9, i: Math.max(i, 0), ok: 0 }, 'none'); }, i); },
  'adivinanza-listos': async () => { await setup({ hoy: 7, upto: 6 }); await js(async () => { const c = await import('/js/core.js'); c.go('adivinanzaIntro', { day: 6 }, 'none'); }); await p.waitForTimeout(600); await tap('¡A jugar!'); },
  'desafio-cartas': async () => { await setup({ hoy: 10, upto: 9 }); await js(async () => { const c = await import('/js/core.js'); c.go('desafioIntro', { day: 9 }, 'none'); }); },
  'free': async () => { await setup({ hoy: 13, upto: 12, extra: { plan: 'free' } }); await js(async () => { const c = await import('/js/core.js'); c.go('hub', { day: 13 }, 'none'); }); await p.waitForTimeout(600); await tap('Pesebre para colorear'); },
  'teodoro': async () => { await setup({ hoy: 9, upto: 8, scr: 'teodoro' }); },
  'hoy-dia1': async () => { await setup({ hoy: 1 }); },
  'completado-1': async () => { await setup({ hoy: 1, upto: 0, completos: { 1: { contenido: true } }, scr: 'completado', params: { day: 1 } }); },
  'completado-15': async () => { await setup({ hoy: 15, upto: 14, completos: { 15: { contenido: true } }, scr: 'completado', params: { day: 15 } }); },
  'imprimible-1': async () => { await setup({ hoy: 1, upto: 0, scr: 'imprimible', params: { day: 1 } }); },
  'compartir-15': async () => { await setup({ hoy: 15, upto: 15, scr: 'compartir', params: { day: 15 } }); },
  'final-26': async () => { await setup({ hoy: 26, upto: 25, scr: 'final', params: { day: 26 } }); },
  'rep-1': async () => { await setup({ hoy: 1, upto: 0, scr: 'reproductor', params: { day: 1 } }); },
  'rep-15': async () => { await setup({ hoy: 15, upto: 14, scr: 'reproductor', params: { day: 15 } }); },
  'rep-26': async () => { await setup({ hoy: 26, upto: 25, scr: 'reproductor', params: { day: 26 } }); },
  'hoja-1': async () => { await setup({ hoy: 1, upto: 0, scr: 'mapa' }); },
  'hoja-22': async () => { await setup({ hoy: 22, upto: 21, scr: 'mapa' }); },
  'hoja-video': async () => { await setup({ hoy: 10, upto: 9, scr: 'mapa' }); },
  'hoja-cancion': async () => { await setup({ hoy: 12, upto: 11, scr: 'mapa' }); },
  'hoja-reto-accion': async () => { await setup({ hoy: 6, upto: 5, scr: 'mapa' }); },
  'hoja-reto-imprimible': async () => { await setup({ hoy: 13, upto: 12, scr: 'mapa' }); },
  'hoja-juego': async () => { await setup({ hoy: 14, upto: 13, scr: 'mapa' }); },
  'hoja-domingo': async () => { await setup({ hoy: 15, upto: 14, scr: 'mapa' }); },
  'hub-6': async () => { await setup({ hoy: 6, upto: 5 }); await js(async () => { const c = await import('/js/core.js'); c.go('hub', { day: 6 }, 'none'); }); },
  'hub-13': async () => { await setup({ hoy: 13, upto: 12 }); await js(async () => { const c = await import('/js/core.js'); c.go('hub', { day: 13 }, 'none'); }); },
  'hub-14': async () => { await setup({ hoy: 14, upto: 13 }); await js(async () => { const c = await import('/js/core.js'); c.go('hub', { day: 14 }, 'none'); }); },
  'hub-19': async () => { await setup({ hoy: 19, upto: 18 }); await js(async () => { const c = await import('/js/core.js'); c.go('hub', { day: 19 }, 'none'); }); },
  'completado-sin-trivia': async () => { await setup({ hoy: 10, upto: 9, completos: { 10: { contenido: true } }, scr: 'completado', params: { day: 10 } }); },
  'completado-sorpresa': async () => { await setup({ hoy: 12, upto: 11, completos: { 12: { contenido: true } }, scr: 'completado', params: { day: 12 } }); },
  'imprimible-dia': async () => { await setup({ hoy: 10, upto: 9, scr: 'mapa' }); await p.waitForTimeout(600); await js(async () => { const f = await import('/js/flow.js'); f.abrirDescargable(10); }); },
  'mundos': async () => { await setup({ hoy: 9, upto: 8, scr: 'mundos' }); },
  'mundos-pre': async () => { await setup({ hoy: 0, scr: 'mundos' }); },
  'pre-teodoro': async () => { await setup({ hoy: 0, inscrito: false, scr: 'teodoro' }); },
  'pre-teodoro-dentro': async () => { await setup({ hoy: 0, scr: 'teodoro' }); },
  'teodoro-nazaret': async () => { await setup({ hoy: 9, upto: 8, scr: 'teodoro', S: { cuartoNuevo: true } }); },
};
const names = only ? only.split(',') : Object.keys(SHOTS);
for (const tema of ['claro', 'oscuro']) {
  TEMA = tema;
  for (const n of names) {
    try {
      // cada pantalla parte de la app recién cargada: nada de la anterior queda encima
      await p.reload(); await p.waitForTimeout(900); await p.addStyleTag({ content: '#panelBtn,.toast,.nota{display:none!important}' });
      await SHOTS[n].call(null, tema);
      await p.evaluate(async (tema) => { const c = await import('/js/core.js'); if (c.S.tema !== tema) { c.S.tema = tema; c.save(); } }, tema);
      await p.waitForTimeout(n === 'listo' ? 250 : 1400);
      await js(() => document.querySelectorAll('.nota').forEach(t => t.remove()));
      await p.locator('#viewport').screenshot({ path: `${dir}/${n}-${tema}.jpg`, type: 'jpeg', quality: 84 });
      if (process.env.HTML) fs.writeFileSync(`${dir}/${n}-${tema}.html`, await p.evaluate(fs.readFileSync('tools/serializar.js', 'utf8')));
      const s = await js(() => [...document.querySelectorAll('#viewport .layer')].map(l => l.dataset.screen).join('>'));
      console.log(tema, n, '→', s);
    } catch (e) { errs.push(n + ': ' + e.message); }
  }
}
console.log(errs.length ? errs.join('\n') : 'OK sin errores');
await b.close();
