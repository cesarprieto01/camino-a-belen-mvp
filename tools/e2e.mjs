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
let k = 0;
const shot = async (name) => { await p.waitForTimeout(700); await p.locator('#viewport').screenshot({ path: `${dir}/${String(++k).padStart(2, '0')}-${name}.png` }); };
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
  return ok;
};
const scenario = async (i) => { await p.evaluate(() => document.querySelector(`[data-tab="rec"]`)?.click()); await p.waitForTimeout(150); await p.evaluate(t => [...document.querySelectorAll('[data-scen]')].find(b => b.querySelector('b')?.textContent.trim() === t)?.click(), i); await p.waitForTimeout(900); };
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
    await p.waitForTimeout(2500); await shot('cerrado');
    await tap('Entendido'); await shot('hoy-fin');
  },
  async ruleta() {
    await scenario('Día de ruleta'); await shot('mapa');
    await tap('Ver historia'); await shot('ruleta');
    await tap('¡Girar!'); await p.waitForTimeout(5200); await shot('premio');
    await tap('Empezar el cuento'); await shot('reproductor');
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
    await shot('intro'); await tap('¡A jugar!'); await shot('juego');
    await tap('¡La adivinaron!'); await shot('w2'); await tap('Pasar a otra palabra'); await tap('¡La adivinaron!'); await tap('¡La adivinaron!'); await tap('¡La adivinaron!');
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
  async teodoro() { await tap('Teodoro'); await shot('tab'); await tap('Ver mis mundos'); await shot('mundos'); await tap('Adviento'); await shot('mapa'); },
};
for (const name of scen.split(',')) {
  try { await flows[name](); } catch (e) { errs.push(name + ': ' + e.message); }
}
console.log(errs.length ? errs.join('\n') : 'OK sin errores');
await b.close();
