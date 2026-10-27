// QA visual: cada pantalla del lienzo junto a la misma pantalla en la app.
// node tools/qa.mjs <claro|oscuro> <out-dir> [filtro]
import { chromium } from 'playwright';
import fs from 'fs';
const [tema = 'claro', dir = 'tmp/qa', only] = process.argv.slice(2);
fs.mkdirSync(dir, { recursive: true });
const O = tema === 'oscuro';
// [nombre, archivo claro, archivo oscuro, preparación en la app]
const D9 = `fill(8,9)`;
const CASES = [
  ['hoy', 'V2-01-Hoy-completo', 'V2-01-Hoy-completo-oscuro', `${D9}; go('hoy')`],
  ['mapa', 'S-03-Mapa', 'S-03-Mapa-oscuro', `${D9}; go('mapa')`],
  ['mapa-trivia', 'S-03b-Mapa-trivia', 'S-03b-Mapa-trivia-oscuro', `${D9}; S.completos[9]={contenido:true}; go('mapa')`],
  ['reproductor', 'S-05-Reproductor', 'S-05-Reproductor-oscuro', `${D9}; go('reproductor',{day:9})`],
  ['completado', 'S-06-Completado', 'S-06-Completado-oscuro', `${D9}; S.completos[9]={contenido:true}; go('completado',{day:9})`],
  ['trivia', 'V2-06a-Trivia-sin-elegir-claro', 'V2-06a-Trivia-sin-elegir', `${D9}; go('trivia',{day:9,i:0,ok:0})`],
  ['trivia-ok', 'V2-07-Correcto-claro', 'V2-07-Correcto', `${D9}; await go('trivia',{day:9,i:0,ok:0}); await wait(900); tap('José')`],
  ['trivia-pista', 'V2-08-Pista-claro', 'V2-08-Pista', `${D9}; await go('trivia',{day:9,i:1,ok:1}); await wait(900); tap('José')`],
  ['trivia-reintento', 'V2-08b-Reintento-claro', 'V2-08b-Reintento', `${D9}; await go('trivia',{day:9,i:1,ok:1}); await wait(900); tap('José'); await wait(600); tap('Gabriel')`],
  ['trivia-varias', 'V2-06c-Trivia-varias-claro', 'V2-06c-Trivia-varias', `${D9}; go('trivia',{day:1,i:4,ok:4})`],
  ['trivia-fin', 'V2-Trivia-fin-claro', 'V2-Trivia-fin', `fill(9,10); S.completos[10]={contenido:true}; go('triviaFin',{day:10,ok:4})`],
  ['trivia-fin-sorpresa', 'V2-Trivia-fin-sorpresa-claro', 'V2-Trivia-fin-sorpresa', `fill(2,3); S.completos[3]={contenido:true}; go('triviaFin',{day:3,ok:4})`],
  ['cerrado', 'V2-Cerrado', 'V2-Cerrado-oscuro', `fill(9,9); go('cerrado')`],
  ['calificacion', 'V2-Calificacion-claro', 'V2-Calificacion', `${D9}; go('calificacion',{back:'completado',day:9})`],
  ['hub', 'S-04-Hub-familia', 'S-04-Hub-familia-oscuro', `fill(12,13); go('hub',{day:13})`],
  ['free', 'V2-24-Dia-completo-claro', 'V2-24-Dia-completo', `fill(12,13); S.plan='free'; go('free',{day:13})`],
  ['ruleta', 'S-05b-Ruleta-pop', 'S-05b-Ruleta-pop-oscuro', `fill(10,11); go('ruletaPop',{day:11})`],
  ['ruleta-premio', 'S-05c-Ruleta-premio', 'S-05c-Ruleta-premio-oscuro', `fill(10,11); S.ruletas[11]='gorro'; go('ruletaPremio',{premio:'gorro',day:11})`],
  ['premio-cuarto', 'S-09-Premio-cuarto', 'S-09-Premio-cuarto-oscuro', `fill(10,11); S.ruletas[11]='cuarto'; go('premioCuarto',{premio:'cuarto',day:11})`],
  ['teodoro', 'V3-Teodoro', 'V3-Teodoro-oscuro', `${D9}; go('teodoro')`],
  ['teodoro-nazaret', 'V3-Teodoro-nazaret', 'V3-Teodoro-nazaret-oscuro', `${D9}; S.cuartoNuevo=true; go('teodoro')`],
  ['mundos', 'V2-02-Mundos-claro', 'V2-02-Mundos', `${D9}; go('mundos')`],
  ['memorama-reglas', 'V2-Memorama-reglas-claro', 'V2-Memorama-reglas', `${D9}; go('memoramaReglas',{day:14})`],
  ['memorama', 'V2-Memorama-claro', 'V2-Memorama', `${D9}; go('memorama',{day:14})`],
  ['memorama-fin', 'V2-Memorama-fin-claro', 'V2-Memorama-fin', `${D9}; go('memoramaFin',{day:9,moves:14})`],
  ['adivinanza-intro', 'V2-Adivinanza-intro-claro', 'V2-Adivinanza-intro', `${D9}; go('adivinanzaIntro',{day:7})`],
  ['adivinanza', 'V2-Adivinanza-claro', 'V2-Adivinanza', `${D9}; go('adivinanza',{day:7,words:ADIV.slice(0,5),k:1,res:[{w:'MARÍA',ok:true}]})`],
  ['adivinanza-tiempo', 'V2-Adivinanza-tiempo-claro', 'V2-Adivinanza-tiempo', `${D9}; go('adivinanzaTiempo',{day:7,words:ADIV.slice(0,5),k:0,res:[]})`],
  ['adivinanza-fin', 'V2-Adivinanza-fin-claro', 'V2-Adivinanza-fin', `${D9}; go('adivinanzaFin',{day:9,res:[{w:'ESTRELLA',ok:true},{w:'MARÍA',ok:true},{w:'PASTOR',ok:true},{w:'OVEJA',ok:true},{w:'JOSÉ',ok:false}]})`],
  ['desafio-intro', 'V2-Desafio-intro-claro', 'V2-Desafio-intro', `${D9}; go('desafioIntro',{day:9})`],
  ['desafio', 'V2-Desafio-claro', 'V2-Desafio', `${D9}; go('desafio',{day:9,c:0})`],
  ['desafio-fin', 'V2-Desafio-fin-claro', 'V2-Desafio-fin', `${D9}; go('desafioFin',{day:9,c:0})`],
  ['regreso', 'V2-10-Regreso', 'V2-10-Regreso-oscuro', `fill(5,7); S.regreso=true; S.bateria=0; go('hoy')`],
  ['atrasado', 'S-01-Hoy-atrasado', 'S-01-Hoy-atrasado-oscuro', `fill(8,11); S.bateria=3; go('hoy')`],
  ['pre-hoy', 'P-Hoy-antes-d', 'P-Hoy-antes-d-oscuro', `reset({hoy:0,inscrito:false,teaserVisto:true}); S.completos={}; go('hoy')`],
  ['pre-hoy-dentro', 'P-Hoy-despues-d', 'P-Hoy-despues-d-oscuro', `reset({hoy:0,inscrito:true}); S.completos={}; go('hoy')`],
  ['pre-teodoro', 'V2-Pre-Teodoro-claro', 'V2-Pre-Teodoro', `reset({hoy:0,inscrito:false,teaserVisto:true}); S.completos={}; go('teodoro')`],
  ['pre-teodoro-dentro', 'V2-Pre-Teodoro-dentro-claro', 'V2-Pre-Teodoro-dentro', `reset({hoy:0,inscrito:true}); S.completos={}; go('teodoro')`],
  ['teaser', 'P-Teaser-a', 'P-Teaser-a-oscuro', `reset({hoy:0,inscrito:false,teaserVisto:true}); go('teaser')`],
  ['listo', 'P-Listo-a', 'P-Listo-a-oscuro', `reset({hoy:0,inscrito:true}); go('listo')`],
  ['invitacion', 'V2-Invitacion-claro', 'V2-Invitacion', `reset({hoy:0,inscrito:true}); go('invitacion')`],
  ['mapa-cerrado', 'S-03d-Mapa-dia-cerrado', 'S-03d-Mapa-dia-cerrado-oscuro', `${D9}; await go('mapa'); await wait(900); document.querySelector('#viewport .layer:last-child a[aria-label^="Día 11,"]').click()`],
  ['mapa-energia', 'S-03e-Mapa-energia', 'S-03e-Mapa-energia-oscuro', `${D9}; await go('mapa'); await wait(900); tap('Energía de Teodoro')`],
  ['mapa-dia11', 'S-03f-Mapa-dia11', 'S-03f-Mapa-dia11-oscuro', `fill(10,11); go('mapa')`],
  ['imprimible', 'S-04c-Imprimible', 'S-04c-Imprimible-oscuro', `fill(12,13); go('imprimible',{day:13})`],
  ['desafio-carta2', 'V2-Desafio-carta2-claro', 'V2-Desafio-carta2', `${D9}; go('desafio',{day:9,c:1})`],
  ['final-compartir', 'V2-Final-compartir-claro', 'V2-Final-compartir', `fill(25,26); S.completos[26]={contenido:true}; go('finalCompartir')`],
  ['fin-sorpresa-adiv', 'V2-Trivia-fin-sorpresa-adivinanza-claro', 'V2-Trivia-fin-sorpresa-adivinanza', `fill(5,6); S.completos[6]={contenido:true}; go('triviaFin',{day:6,ok:4})`],
  ['fin-sorpresa-desafio', 'V2-Trivia-fin-sorpresa-desafio-claro', 'V2-Trivia-fin-sorpresa-desafio', `fill(8,9); S.completos[9]={contenido:true}; go('triviaFin',{day:9,ok:4})`],
  ['mapa-d26', 'V2-Mapa-d24-claro', 'V2-Mapa-oscuro', `fill(25,26); go('mapa')`],
  ['final', 'V2-Final-claro', 'V2-Final', `fill(25,26); go('final',{day:26})`],
];
const exe = '/Users/ces/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b = await chromium.launch({ executablePath: exe });
const d = await b.newPage({ viewport: { width: 390, height: 844 } });
const a = await b.newPage({ viewport: { width: 390, height: 844 } });
const errs = [];
a.on('pageerror', e => errs.push(e.message));
await a.goto('http://localhost:5190/app.html'); await a.waitForTimeout(1200);
for (const [name, fc, fo, setup] of CASES) {
  if (only && !name.includes(only)) continue;
  const file = O ? fo : fc;
  await d.goto('http://localhost:5190/raw.html?s=' + file); await d.waitForTimeout(700);
  await d.screenshot({ path: `${dir}/${name}-a-lienzo.png`, clip: { x: 0, y: 0, width: 390, height: 844 } });
  await a.evaluate(async ([setup, tema]) => {
    const c = await import('/js/core.js'); const data = await import('/js/data.js');
    const { go, reset, save, wait } = c; const ADIV = data.ADIVINANZA;
    const fill = (upto, hoy) => { reset({ hoy }); const S = c.S; S.completos = { 0: { contenido: true } }; for (let n = 1; n <= upto; n++) S.completos[n] = { contenido: true, trivia: true, estrellas: [3, 2, 3, 1, 3, 2, 3, 3, 2, 3, 1, 3, 2, 3, 3, 2, 3, 3, 1, 3, 2, 3, 3, 2, 3][n - 1] || 3 }; S.ruletas = {}; [4, 11, 18, 24].forEach((d, i) => { if (d <= upto) S.ruletas[d] = ['gorro', 'bufanda', 'bolso', 'paja'][i]; }); S.sorpresas = {}; [3, 6, 9, 12, 15, 18, 21, 24].forEach(d => { if (d <= upto) S.sorpresas[d] = 'hecha'; }); S.tema = tema; S.pasoAnimado = null; S.bateria = 5; S.plan = 'premium'; S.cuartoNuevo = false; S.regreso = false; };
    const tap = q => { const L = document.querySelector('#viewport .layer:last-child'); const el = [...L.querySelectorAll('[aria-label],a,button')].find(e => (e.getAttribute('aria-label') || e.textContent || '').trim().startsWith(q)); el?.click(); };
    window.__qa = { get S() { return c.S; }, go, reset, save, wait, fill, tap, ADIV };
    // eslint-disable-next-line no-new-func
    await (new Function('ctx', `with (ctx) { return (async () => { S.tema='${tema}'; ${setup}; save(); })(); }`))(window.__qa);
  }, [setup.replace(/\bgo\(/g, 'await go(').replace(/await await/g, 'await'), tema]);
  await a.waitForTimeout(2200);
  await a.screenshot({ path: `${dir}/${name}-b-app.png` });
}
console.log(errs.length ? errs.join('\n') : 'sin errores');
await b.close();
