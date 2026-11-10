// Sonido del reto (propuesta de diseño sonoro aprobada por César el 4-nov-2026; Drive «Adviento 2026/05 MUSICA/Propuesta logica sonora…»):
// la canción de Teodoro en el mapa y la ambiental en las actividades, que se pasan la una a la otra y se apartan cuando algo importa, las reacciones de voz de Teodoro con sus reglas,
// efectos sintetizados en Sol pentatónico y el motivo de Adviento. Todo en Web Audio, sin librerías.
import { S, save, cur, onChange, reduced } from './core.js';

const PISTAS = {
  // «Burrito Sabanero» de Teodoro (master del 6-nov-2026, recortado a 141,08 s: el mismo final de la versión con Eduardo, sin el silencio de cola).
  // Va siempre en el mapa, igual de día y de noche. Volumen: César la pidió al 25 % del master y luego a la mitad («debe sentirse muy ambiental»),
  // con el mismo EQ que tenía la versión con Eduardo (le quita el cuerpo que la hacía pesada).
  // Es la misma mezcla de la versión con Eduardo 0,188 s antes, así que los tiempos son los de entonces corridos: tiene voz casi todo el tiempo
  // y diálogos hablados; las vueltas empiezan en el hueco antes de «Soy el burrito sabanero» (7 s), así el saludo «¡Hola, amigos!» suena solo
  // la primera vez; las puertas son comienzos de frase cantada y en los tramos hablados Teodoro nunca habla encima
  burrito: { archivo: 'audio/burrito-sabanero-teodoro.m4a', vol: 0.125, bucle: 7, conVoz: true,
    puertas: [7, 17.31, 35.41, 44.41, 58.41, 81.61, 90.41, 113.41], delDia: [7, 81.61], reposo: [45, 150], cierre: [134.81, 141.08],
    hablado: [[0, 7.21], [26.61, 35.61], [72.61, 81.81], [101.61, 108.81], [127.61, 141.08]],
    eq: { type: 'peaking', frequency: 250, Q: 1, gain: -3 } },
  // «Quiet Snow Village», ambiental (trivias, juegos y actividades): sin los silencios de las puntas y con la cola final (se apaga en 3,5 s)
  // sonando sobre el comienzo, que entra suave; la vuelta dura 6977266 muestras a 48 kHz y el archivo trae 1 s más del comienzo, así se repite
  // de 0,5 s a 0,5 s + vuelta y el relleno del AAC nunca suena. Volumen: se igualó a la canción con Eduardo (0,17) y César la pidió un 25 % más baja
  nieve: { archivo: 'audio/quiet-snow-village.m4a', vol: 0.1275, desde: 0.5, vuelta: 6977266 / 48000,
    puertas: [0.5, 10.4, 37.8, 90.9], delDia: [0.5, 10.4, 37.8, 90.9], reposo: [75, 240],
    eq: { type: 'lowshelf', frequency: 180, gain: -4 } },
};
// el mapa y los pop-ups que salen sobre él
const CAMINO = new Set(['mapa', 'cerrado', 'ruletaPop', 'ruletaPremio', 'premioCuarto', 'tbGano', 'tbDatos', 'tbDireccion', 'tbEnCamino', 'tbCompartir', 'tbMiTheobox']);
// trivias, juegos y actividades del día, y Nochebuena. No suena en la adivinanza ni en «Busquen la estrella»: ahí habla la familia (César);
// tampoco en los videos y canciones (traen su sonido), en el paywall ni en las pantallas de Theo
const ACTIVIDADES = new Set(['trivia', 'triviaFin', 'completado', 'calificacion', 'hub', 'juegoIntro', 'juegoPasos', 'juegoFin',
  'memoramaReglas', 'memorama', 'memoramaFin', 'adivinanzaIntro', 'adivinanzaFin', 'desafioIntro', 'desafio', 'desafioFin', 'final', 'finalCompartir']);
// cuánto suena cada pantalla respecto a su pista (dB; el mapa en 0) y su filtro (Hz): en los pop-ups se oye a través del velo
const NIVEL = { cerrado: -6, ruletaPop: -5, ruletaPremio: -5, premioCuarto: -5, tbGano: -5, tbDatos: -10, tbDireccion: -10, tbEnCamino: -6, tbCompartir: -6, tbMiTheobox: -10, completado: -3, triviaFin: -3, memoramaFin: -3, adivinanzaFin: -3,
  desafioFin: -3, juegoFin: -3, trivia: -6, memoramaReglas: -6, memorama: -6, adivinanzaIntro: -6, desafioIntro: -6, juegoIntro: -6, juegoPasos: -6,
  final: -6, hub: -8, calificacion: -8, finalCompartir: -8, desafio: -10 };
const FILTRO = { ruletaPop: 3000, ruletaPremio: 3000, premioCuarto: 3000, cerrado: 1800 };
// reposo: a los [baja] s sin tocar nada baja 6 dB y a los [calla] s se calla (en el reto en familia se fueron a hacerlo)
const REPOSO_PANTALLA = { cerrado: [10, 25], hub: [30, 60], desafio: [30, 60] };
// al irse a estas pantallas Teodoro deja de hablar enseguida
const CORTA_VOZ = new Set(['reproductor', 'hoy', 'teodoro', 'mundos']);
const RULETA = new Set(['ruletaPop', 'ruletaPremio', 'premioCuarto']);
const dB = d => 10 ** (d / 20);
// la voz de Teodoro: César la pidió un 35 % más baja que el -20 LUFS de la propuesta
const VOZ = 0.65;
const noche = () => S.tema === 'oscuro' || new Date().getHours() + new Date().getMinutes() / 60 >= 19.5;

// en «Mañana seguimos» la canción se despide con su final («Tuki por aquí… Hasta mañana») y queda en silencio
const pistaDe = nombre => nombre === 'cerrado' ? 'cierre' : CAMINO.has(nombre) ? 'burrito' : ACTIVIDADES.has(nombre) ? 'nieve' : null;

// ---------- El motor ----------
// pistas → EQ → cruce → filtro → nivel de pantalla → evento (ruleta, voz que lee) → voz de Teodoro → hueco para su voz → reposo → salida
let ctx = null, lp, hueco, gNivel, gEvento, gVozDuck, gReposo, busVoz, busSfx, actual = null, dormir = null;
const est = {};
function montar() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  const filtro = (type, o) => { const n = ctx.createBiquadFilter(); n.type = type; for (const k in o) n[k].value = o[k]; return n; };
  const gan = (v = 1) => { const g = ctx.createGain(); g.gain.value = v; return g; };
  lp = filtro('lowpass', { frequency: 20000, Q: -3 });
  hueco = filtro('peaking', { frequency: 2000, Q: 0.8, gain: 0 }); // se abre solo si Teodoro habla sobre la canción con voz
  [gNivel, gEvento, gVozDuck, gReposo, busVoz, busSfx] = [gan(), gan(), gan(), gan(), gan(), gan()];
  lp.connect(gNivel); gNivel.connect(gEvento); gEvento.connect(gVozDuck); gVozDuck.connect(hueco); hueco.connect(gReposo); gReposo.connect(ctx.destination);
  busVoz.gain.value = VOZ; busVoz.connect(ctx.destination); busSfx.connect(ctx.destination);
  for (const id in PISTAS) {
    const { type, ...o } = PISTAS[id].eq, eq = filtro(type, o), g = gan(0);
    eq.connect(g); g.connect(lp);
    est[id] = { eq, g, buffer: null, cargando: null, fuente: null, parar: null, pos: null, en: 0, t0: 0, p0: 0 };
  }
  // la despedida de «Mañana seguimos» comparte el audio de la canción pero suena aparte, una sola vez
  est.cierre = { g: gan(0), fuente: null, parar: null };
  est.cierre.g.connect(lp);
}
const ir = (p, v, tau, t = ctx.currentTime) => { p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); p.setTargetAtTime(v, t, tau); };

function cargar(id) {
  const e = est[id];
  if (e.buffer || e.cargando) return e.cargando;
  e.cargando = fetch(PISTAS[id].archivo).then(r => r.arrayBuffer()).then(ab => new Promise((ok, mal) => ctx.decodeAudioData(ab, ok, mal)))
    .then(b => { e.buffer = b; }).catch(err => { console.warn('música', id, err); e.cargando = null; });
  return e.cargando;
}

// el tramo que se repite y dónde va la pista (también si arrancó antes del comienzo del loop: la primera vez, con el saludo)
const tramo = id => { const p = PISTAS[id]; return [p.bucle ?? p.desde ?? 0, p.vuelta ? (p.desde || 0) + p.vuelta : est[id].buffer.duration]; };
function donde(id) {
  const e = est[id], [ini, fin] = tramo(id), t = e.p0 + ctx.currentTime - e.t0;
  return t < fin ? t : ini + ((t - fin) % (fin - ini));
}
// por dónde entra: la primera vez en la vida desde el comienzo; cada día, una entrada distinta; si volvió enseguida, donde iba;
// si pasó un rato, al comienzo de la frase siguiente (nunca a mitad de palabra ni en un diálogo)
const MEM = 'cab-musica';
function desdeDonde(id) {
  const p = PISTAS[id], e = est[id];
  let m; try { m = JSON.parse(localStorage.getItem(MEM)) || {}; } catch { m = {}; }
  if (m[id] !== S.hoy) {
    const estreno = m[id] == null; m[id] = S.hoy;
    try { localStorage.setItem(MEM, JSON.stringify(m)); } catch { /* navegador privado */ }
    return estreno ? (p.desde || 0) : p.delDia[Math.abs(S.hoy) % p.delDia.length];
  }
  if (e.pos != null && Date.now() - e.en < 30000) return e.pos;
  return p.puertas.find(x => x > (e.pos ?? 0) + 5) ?? p.puertas[0];
}

let estrenoT = null;
async function subir(id) {
  const e = est[id];
  if (e.parar) { clearTimeout(e.parar); e.parar = null; } // volvió antes de que se apagara: sigue donde iba
  if (id === 'cierre') return despedir();
  await cargar(id);
  if (actual !== id || !e.buffer) return; // se fue de la pantalla mientras cargaba
  let tau = 0.4; // 1,2 s al retomar
  if (!e.fuente) {
    const desde = desdeDonde(id), [ini, fin] = tramo(id);
    if (desde !== e.pos) tau = PISTAS[id].conVoz ? 0.2 : 0.65; // por una puerta: la canción en 0,6 s (no tapa la primera palabra); la ambiental en 2 s
    e.fuente = ctx.createBufferSource(); e.fuente.buffer = e.buffer;
    e.fuente.loop = true; e.fuente.loopStart = ini; e.fuente.loopEnd = fin;
    e.fuente.connect(e.eq); e.fuente.start(0, desde); e.t0 = ctx.currentTime; e.p0 = desde;
    // el estreno: la primera vez en la vida la canción pregunta «¿Listos para un momento Theo de Navidad?», se detiene y Teodoro responde
    if (id === 'burrito' && desde === 0) {
      clearTimeout(estrenoT);
      estrenoT = setTimeout(() => {
        if (actual !== 'burrito' || !e.fuente || e.p0 !== 0) return;
        try { e.fuente.stop(); } catch { /* ya parada */ }
        e.fuente = null; e.pos = PISTAS.burrito.bucle; e.en = Date.now(); e.g.gain.value = 0;
        const d = teoDice('estreno');
        setTimeout(() => { if (actual === 'burrito') subir('burrito'); }, (d + 0.15) * 1000);
      }, 7000);
    }
  }
  ir(e.g.gain, PISTAS[id].vol, tau);
}
function bajar(id, tau = 0.2) {
  const e = est[id];
  if (!e?.fuente || e.parar) return;
  ir(e.g.gain, 0, tau);
  e.parar = setTimeout(() => {
    if (id !== 'cierre') { e.pos = donde(id); e.en = Date.now(); }
    try { e.fuente.stop(); } catch { /* ya parada */ }
    e.fuente = null; e.parar = null;
  }, tau * 5000);
}
// «Mañana seguimos»: cruce de 0,8 s al final de la canción, una vez, y después silencio (Teodoro se duerme)
async function despedir() {
  const e = est.cierre, b = est.burrito;
  if (e.fuente) { ir(e.g.gain, PISTAS.burrito.vol, 0.27); return; } // volvió mientras se apagaba
  await cargar('burrito');
  if (actual !== 'cierre' || !b.buffer || e.fuente) return;
  const [a, z] = PISTAS.burrito.cierre;
  e.fuente = ctx.createBufferSource(); e.fuente.buffer = b.buffer; e.fuente.connect(e.g);
  e.fuente.start(0, a, z - a);
  e.fuente.onended = () => { if (est.cierre.fuente === e.fuente) est.cierre.fuente = null; };
  e.g.gain.value = 0; ir(e.g.gain, PISTAS.burrito.vol, 0.27);
}

function arrancar(id, nombre) {
  montar(); if (!ctx) return;
  if (dormir) { clearTimeout(dormir); dormir = null; }
  ctx.resume?.();
  actual = id;
  // nivel de la pantalla (igual de día y de noche); con menos movimiento, 3 dB más baja
  ir(gNivel.gain, dB((NIVEL[nombre] ?? 0) + (reduced() ? -3 : 0)), 0.15);
  ir(lp.frequency, FILTRO[nombre] || 20000, 0.13);
  for (const otra in est) if (otra !== id) bajar(otra, otra === 'burrito' && id === 'cierre' ? 0.27 : 0.2);
  subir(id);
}
function apagar(rapido) {
  if (!ctx || !actual) return;
  actual = null; clearTimeout(estrenoT);
  for (const id in est) bajar(id, rapido ? 0.17 : 0.3); // 0,5 s al video; 0,9 s el resto
  quizaDormir();
}
// el audio se suspende cuando no suena nada (ni música, ni voz, ni efecto)
let ultimoSonido = 0;
function quizaDormir() {
  clearTimeout(dormir);
  dormir = setTimeout(() => { dormir = null; if (!actual && !vozActual && performance.now() - ultimoSonido > 2500) ctx.suspend?.(); }, 3000);
}

let desbloqueado = false, retenida = false, retenidaEn = null, dormida = false, tRet = null;
/** Suena o no, y cuál pista, según la pantalla. Lo llama la navegación (onChange de core) cada vez que cambia la pantalla. */
export function musicaPara(nombre = cur?.name) {
  // iPhone: el interruptor de silencio calla el reto (y no corta el pódcast del papá); los videos siguen como siempre
  try { if (navigator.audioSession) navigator.audioSession.type = nombre === 'reproductor' ? 'auto' : 'ambient'; } catch { /* Safari viejo */ }
  const id = desbloqueado && S.musica !== false && !document.hidden && !retenida && !dormida ? pistaDe(nombre) : null;
  if (id) arrancar(id, nombre); else apagar(nombre === 'reproductor');
}
/** La música espera (el ritual del mapa, Nochebuena). Se suelta sola a los maxMs por si algo sale mal. */
export function retener(maxMs = 10000) { retenida = true; retenidaEn = cur?.layer; clearTimeout(tRet); tRet = setTimeout(() => soltar(), maxMs); musicaPara(); }
export function soltar(ms = 0) { clearTimeout(tRet); tRet = setTimeout(() => { retenida = false; musicaPara(); }, ms); }
/** Suelta la música cuando Teodoro termine de hablar (y ms después). */
export function soltarTrasVoz(ms = 600) { soltar(Math.max(0, finVoz - performance.now()) + ms); }

// reposo: baja sola si nadie toca y vuelve al tocar
let ultimo = performance.now(), bajada = false;
function tocar() {
  ultimo = performance.now();
  if (!bajada && !dormida) return;
  const despierta = dormida; bajada = dormida = false;
  if (ctx) ir(gReposo.gain, 1, 0.6);
  if (despierta) musicaPara();
}
['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, tocar, { capture: true, passive: true }));
setInterval(() => {
  if (!actual || actual === 'cierre') return;
  const [baja, calla] = REPOSO_PANTALLA[cur?.name] || PISTAS[actual].reposo, s = (performance.now() - ultimo) / 1000;
  if (s > calla && !dormida) { dormida = true; ir(gReposo.gain, 0, 4); setTimeout(() => { if (dormida) apagar(); }, 12000); }
  else if (s > baja && !bajada) { bajada = true; ir(gReposo.gain, dB(-6), 2.7); }
}, 5000);

// la música se aparta por un evento (la ruleta, la voz que lee): gana el más profundo
const agachados = new Map();
const aplicar = tau => ir(gEvento.gain, dB(Math.min(0, ...agachados.values())), tau);
export function agacha(id, d, tau = 0.05) { if (!ctx) return; agachados.set(id, d); aplicar(tau); }
export function levanta(id, tau = 0.2) { if (ctx && agachados.delete(id)) aplicar(tau); }

// ---------- Teodoro habla ----------
// i/f: dónde empieza y termina su voz en el archivo (s, los mp3 traen ~0,6 s de silencio); g: lo deja en -20 LUFS (las 9 variaban 5,5 dB)
const VOCES = {
  73: { t: '¡Yujú!', i: 0.57, f: 1.92, g: 0.676 }, 74: { t: '¡Vamos a la aventura!', i: 0.53, f: 2.57, g: 0.610 },
  75: { t: '¡Hagámoslo!', i: 0.57, f: 1.80, g: 0.902 }, 76: { t: '¡Qué buen trabajo!', i: 0.59, f: 2.36, g: 1.148 },
  77: { t: '¡Inténtalo de nuevo!', i: 0.55, f: 2.36, g: 0.891 }, 78: { t: '¡Bien hecho!', i: 0.58, f: 1.88, g: 1.109 },
  79: { t: '¡Gran aventura!', i: 0.58, f: 2.31, g: 0.881 }, 80: { t: '¡Tú puedes!', i: 0.60, f: 2.03, g: 0.813 },
  81: { t: '¡Increíble!', i: 0.50, f: 2.30, g: 0.871 },
};
// p: 1 hito · 2 importante · 3 de paso; dia: cuántas veces al día como máximo; hueco: segundos mínimos desde la voz anterior (8 si no dice);
// sinTope: no cuenta para las 6 de paso al día. «¡Increíble!» solo en hitos y «¡Gran aventura!» solo al cerrar un recorrido.
// En la trivia habla en CADA error (César): ánimo tranquilo que alterna, siempre con el farol y la pista; acertar después de fallar siempre
// dice «¡Qué buen trabajo!» (vale la pena intentar); los demás aciertos solo suenan y saltan (fallar nunca es más divertido que acertar)
const MOMENTOS = {
  estreno: { ids: [74], p: 1 }, unirse: { ids: [75], p: 2 }, diaNuevo: { ids: [74], p: 2, dia: 1 }, belen: { ids: [81], p: 1 },
  celebraDia: { ids: [73, 78], p: 2, dia: 1 }, empezar: { ids: [75, 80], p: 3, dia: 1 },
  aciertoPrimero: { ids: [78], p: 3, dia: 1 }, aciertoTrasFallo: { ids: [76], p: 3, hueco: 4, sinTope: true },
  fallo: { ids: [77, 80], p: 3, hueco: 4, sinTope: true },
  triviaPerfecta: { ids: [81], p: 1 }, triviaBien: { ids: [78, 76], p: 2 }, triviaIntento: { ids: [80], p: 2 },
  otraOportunidad: { ids: [80], p: 2 }, premio: { ids: [73], p: 2 }, premioGrande: { ids: [81], p: 1 },
  finJuego: { ids: [73, 78], p: 2 }, finSemana: { ids: [79], p: 1 }, retoHecho: { ids: [76], p: 2 }, sello: { ids: [76], p: 2 },
  encontrada: { ids: [73, 78], p: 3, dia: 2 }, nochebuena: { ids: [79], p: 1 },
};
const voz = {};
let cargandoVoces = null, vozActual = null, ultimaVoz = -1e9, finVoz = 0;
function cargarVoces() {
  cargandoVoces ??= Promise.all(Object.keys(VOCES).map(n => fetch(`audio/teo/${n}.mp3`).then(r => r.arrayBuffer())
    .then(ab => new Promise((ok, mal) => ctx.decodeAudioData(ab, ok, mal))).then(b => { voz[n] = b; }).catch(() => {})));
  return cargandoVoces;
}
const suenaConVoz = () => !!actual && !!PISTAS[actual]?.conVoz && !!est[actual].fuente;
// ¿la canción tiene un diálogo en los próximos seg segundos?
function pisaHablado(seg) {
  if (!suenaConVoz()) return false;
  const a = donde(actual), b = a + seg;
  return PISTAS[actual].hablado.some(([x, y]) => a < y && b > x);
}
/** Cuánto le falta a Teodoro para terminar de hablar (ms). */
export const restoVoz = () => Math.max(0, finVoz - performance.now());
/** Teodoro reacciona. Devuelve cuánto falta para que termine (s), o 0 si esta vez se calla.
 *  Reglas: una a la vez, 8 s entre voces, 6 de paso al día, nunca la misma dos veces seguidas, nunca encima de un diálogo de la canción. */
export function teoDice(momento, { tras = 0 } = {}) {
  const m = MOMENTOS[momento]; if (!m || !ctx || !desbloqueado || S.musica === false) return 0; // silenciada la música, Teodoro también calla
  let e; try { e = JSON.parse(localStorage.getItem('cab-voces')) || {}; } catch { e = {}; }
  if (e.dia !== S.hoy) e = { dia: S.hoy, n: 0, por: {}, rot: {}, ult: e.ult, inc: e.inc };
  const ahora = performance.now();
  if (m.p > 1 && (vozActual || ahora - ultimaVoz < (m.hueco ?? 8) * 1000 || (!m.sinTope && e.n >= 6))) return 0;
  if (m.dia && (e.por[momento] || 0) >= m.dia) return 0;
  const k = e.rot[momento] || 0; let id = m.ids[k % m.ids.length];
  if (id === e.ult) id = m.ids.length > 1 ? m.ids[(k + 1) % m.ids.length] : (m.p === 3 ? null : id);
  if (id == null || (id === 81 && e.inc === S.hoy) || !voz[id]) return 0;
  const v = VOCES[id], dur = v.f - v.i, capa = cur?.layer;
  const choca = pisaHablado(tras + dur + 0.3);
  if (choca && m.p > 1) return 0;
  const hondo = choca ? -20 : suenaConVoz() ? -14 : -6; // sobre una canción con voz se aparta mucho más
  e.rot[momento] = k + 1; e.por[momento] = (e.por[momento] || 0) + 1; e.ult = id;
  if (m.p !== 1 && !m.sinTope) e.n++;
  if (id === 81) e.inc = S.hoy;
  try { localStorage.setItem('cab-voces', JSON.stringify(e)); } catch { /* */ }
  ultimaVoz = ahora + tras * 1000; finVoz = ultimaVoz + dur * 1000 + 80;
  const decir = () => {
    if (capa && !capa.isConnected) return; // ya se fue de la pantalla
    ctx.resume?.(); if (m.p === 1) vozActual?.cortar();
    const t = ctx.currentTime + 0.08, src = ctx.createBufferSource(), g = ctx.createGain(), gv = v.g * (noche() ? 0.79 : 1);
    src.buffer = voz[id]; src.connect(g); g.connect(busVoz);
    g.gain.setValueAtTime(gv, t); g.gain.setValueAtTime(gv, t + dur - 0.06); g.gain.linearRampToValueAtTime(0, t + dur);
    src.start(t, v.i, dur);
    ir(gVozDuck.gain, dB(hondo), 0.04); gVozDuck.gain.setTargetAtTime(1, t + dur, 0.2); // la música se aparta
    if (suenaConVoz()) { ir(hueco.gain, -6, 0.04); hueco.gain.setTargetAtTime(0, t + dur, 0.2); } // y le abre espacio a su voz en 2 kHz
    const yo = { cortar: () => {
      const n = ctx.currentTime; g.gain.cancelScheduledValues(n); g.gain.setTargetAtTime(0, n, 0.04);
      try { src.stop(n + 0.15); } catch { /* */ }
      ir(gVozDuck.gain, 1, 0.2); ir(hueco.gain, 0, 0.2); finVoz = performance.now();
    } };
    vozActual = yo; ultimoSonido = performance.now();
    src.onended = () => { if (vozActual === yo) vozActual = null; if (!actual) quizaDormir(); };
  };
  tras > 0 ? setTimeout(decir, tras * 1000) : decir();
  return tras + dur;
}
// ---------- Efectos y motivo (sintetizados, en Sol pentatónico: suenan bien sobre las dos pistas) ----------
const HZ = { G3: 196, G4: 392, B4: 493.88, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, B5: 987.77, D6: 1174.66, G6: 1567.98 };
// celesta / caja de música: la nota y dos parciales que se apagan antes
function campanita(nota, t, vol = 0.06, dur = 1) {
  [[1, 1, 1], [2, 0.25, 0.5], [3.01, 0.08, 0.25]].forEach(([k, a, d]) => {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = HZ[nota] * k; o.connect(g); g.connect(busSfx);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * a, t + 0.004); g.gain.setTargetAtTime(0, t + 0.004, dur * d / 5);
    o.start(t); o.stop(t + dur * d + 0.05);
  });
}
// madera: un golpecito de ruido filtrado (el tic de la ruleta, los cascos de Teodoro)
let ruido = null;
function madera(t, f, q, dur, vol) {
  ruido ??= (() => { const b = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.05), ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; })();
  const s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = ruido; bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
  s.connect(bp); bp.connect(g); g.connect(busSfx);
  g.gain.setValueAtTime(vol, t); g.gain.setTargetAtTime(0, t, dur / 4);
  s.start(t); s.stop(t + dur + 0.02);
}
// fieltro: un golpe sordo que baja de 110 a 60 Hz (el sello «Hecho en familia»)
function golpe(t, vol = 0.3) {
  const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.15);
  o.connect(g); g.connect(busSfx); g.gain.setValueAtTime(vol, t); g.gain.setTargetAtTime(0, t, 0.05); o.start(t); o.stop(t + 0.3);
}
let ultimoTic = 0;
/** Un efecto: rayita (n 1–5), llena, acierto, estrella (k 0–2), tic, paso, sello, tiempo, casi. Con menos movimiento, sin tics ni pasos. */
export function sonido(nombre, n = 0, tras = 0) {
  if (!ctx || !desbloqueado) return;
  if (reduced() && (nombre === 'tic' || nombre === 'paso')) return;
  ctx.resume?.(); ultimoSonido = performance.now();
  const t = ctx.currentTime + 0.01 + tras;
  if (nombre === 'rayita') campanita(['D5', 'E5', 'G5', 'A5', 'B5'][Math.max(0, Math.min(4, n - 1))], t, 0.05, 0.4);
  else if (nombre === 'llena') { campanita('D6', t, 0.05, 0.9); campanita('G6', t + 0.08, 0.035, 0.9); }
  else if (nombre === 'acierto') { campanita('B5', t, 0.055, 0.5); campanita('D6', t + 0.15, 0.055, 0.6); }
  else if (nombre === 'estrella') campanita(['G5', 'B5', 'D6'][n] || 'G5', t, 0.05, 0.5);
  else if (nombre === 'tic') {
    if (performance.now() - ultimoTic < 45) return; ultimoTic = performance.now();
    madera(t, 2500 * (0.97 + Math.random() * 0.06), 4, 0.012, 0.09);
  } else if (nombre === 'paso') { madera(t, 500, 6, 0.04, 0.12); madera(t + 0.09, 420, 6, 0.04, 0.09); } // «toc-toc», como cascos sobre piedra
  else if (nombre === 'sello') golpe(t);
  else if (nombre === 'tiempo') campanita('G4', t, 0.08, 1.2); // campanita de mano: quien da las pistas no mira la pantalla
  else if (nombre === 'casi') { // una nota grave y apagada, que no baja de tono
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = HZ.G3;
    f.type = 'lowpass'; f.frequency.value = 600; o.connect(f); f.connect(g); g.connect(busSfx);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.06, t + 0.01); g.gain.setTargetAtTime(0, t + 0.01, 0.06); o.start(t); o.stop(t + 0.3);
  }
}
// «La estrella de Teodoro», a 105 pulsos: corto = el trote del burrito («ta-ta-TÁ») que llega a Sol; largo = sube a la estrella y queda abierto
// (la espera del Adviento); Nochebuena = gira a la primera frase de «Noche de paz» y se resuelve en Sol
const MOTIVO = {
  corto: [['D5', 0, 0.5], ['E5', 0.286, 0.5], ['G5', 0.571, 0.9]],
  largo: [['D5', 0, 0.5], ['E5', 0.286, 0.5], ['G5', 0.571, 0.7], ['B5', 1.143, 0.5], ['D6', 1.429, 1.4], ['G6', 1.429, 1.4, 0.25]],
  nochebuena: [['D5', 0, 0.9], ['E5', 0.8, 0.4], ['D5', 1.07, 0.7], ['B4', 1.6, 1.8], ['G4', 3.2, 2.5], ['B4', 3.2, 2.5], ['D5', 3.2, 2.5]],
};
/** El motivo de Adviento. Devuelve cuánto dura (s). */
export function motivo(cual, tras = 0) {
  if (!ctx || !desbloqueado || !MOTIVO[cual]) return 0;
  ctx.resume?.(); ultimoSonido = performance.now();
  const t0 = ctx.currentTime + 0.02 + tras;
  MOTIVO[cual].forEach(([nota, t, d, a = 1]) => campanita(nota, t0 + t, 0.055 * a, d * 1.6));
  return tras + Math.max(...MOTIVO[cual].map(([, t, d]) => t + d));
}

// el navegador no deja sonar nada hasta el primer toque
const desbloquear = () => {
  if (desbloqueado) return;
  desbloqueado = true; montar(); ctx?.resume?.();
  if (ctx) { cargar(pistaDe(cur?.name) === 'nieve' ? 'nieve' : 'burrito'); cargarVoces(); }
  removeEventListener('pointerdown', desbloquear, true); removeEventListener('keydown', desbloquear, true);
  musicaPara();
};
addEventListener('pointerdown', desbloquear, true);
addEventListener('keydown', desbloquear, true);
let antes = null;
onChange(() => {
  if (cur?.name !== antes) {
    antes = cur?.name;
    if (retenida && cur?.layer !== retenidaEn) soltar(); // el ritual no sigue si se fue de la pantalla (se retiene mientras se monta)
    if (CORTA_VOZ.has(antes)) vozActual?.cortar();
    if (!RULETA.has(antes)) levanta('ruleta');
  }
  musicaPara();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) vozActual?.cortar(); musicaPara(); });

const ICO_ON = '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg>';
const ICO_OFF = '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>';

/** Conecta el botón de música de una pantalla: alterna (también la voz de Teodoro), guarda y cambia ícono y etiqueta. */
export function bindMute(btn) {
  if (!btn) return;
  const pintar = () => {
    const on = S.musica !== false;
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? 'Música de fondo y voz de Teodoro activadas. Toca para silenciarlas' : 'Música de fondo y voz de Teodoro silenciadas. Toca para activarlas');
    const old = btn.querySelector('svg');
    const tpl = document.createElement('template'); tpl.innerHTML = on ? ICO_ON : ICO_OFF;
    const ico = tpl.content.firstElementChild;
    // conserva el color del ícono del lienzo (se lee una vez: al alternar, el ícono ya es el nuestro, en currentColor)
    const color = btn.dataset.color ??= (old && (old.getAttribute('stroke') || old.querySelector('[stroke]:not([stroke=none])')?.getAttribute('stroke') || old.querySelector('[fill]:not([fill=none])')?.getAttribute('fill'))) || '';
    if (color && color !== 'currentColor') ico.style.color = color;
    if (old) { ico.setAttribute('width', old.getAttribute('width') || '22'); ico.setAttribute('height', old.getAttribute('height') || '22'); old.replaceWith(ico); } else btn.prepend(ico);
  };
  btn.dataset.bound = '1'; btn.style.cursor = 'pointer';
  btn.addEventListener('click', ev => {
    ev.preventDefault(); ev.stopPropagation();
    S.musica = S.musica === false; save();
    if (S.musica === false) vozActual?.cortar();
    desbloquear(); pintar(); musicaPara();
  });
  pintar();
}
/** Para pruebas: si está sonando y el estado del audio. */
export const estadoMusica = () => {
  const e = actual && est[actual];
  return { sonando: !!actual, pista: actual, audio: ctx?.state || 'sin crear', volumen: e ? +e.g.gain.value.toFixed(3) : 0, cargada: !!(e?.buffer ?? est.burrito?.buffer),
    loop: e?.fuente?.loop ? [+e.fuente.loopStart.toFixed(4), +e.fuente.loopEnd.toFixed(4)] : null, va: e?.fuente && actual !== 'cierre' ? +donde(actual).toFixed(1) : null,
    nivel: gNivel ? +gNivel.gain.value.toFixed(3) : null, evento: gEvento ? +gEvento.gain.value.toFixed(3) : null, vozDuck: gVozDuck ? +gVozDuck.gain.value.toFixed(3) : null,
    reposo: gReposo ? +gReposo.gain.value.toFixed(3) : null, filtro: lp ? Math.round(lp.frequency.value) : null, retenida, dormida, habla: !!vozActual, voces: Object.keys(voz).length };
};
