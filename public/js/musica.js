// Música de fondo del reto, en dos pistas que se pasan la una a la otra con fundido y retoman donde iban: la del mapa del camino
// (y los pop-ups que salen sobre él) y la de las trivias, juegos y actividades del día. En lo demás se apaga con fundido.
import { S, save, cur, onChange } from './core.js';

const PISTAS = {
  // «Burrito Sabanero» con Eduardo (master final V6), la canción entera repetida. Recortada a 1,8–143,0 s del master: quedan ~0,35 s de silencio
  // en cada punta, así al repetirse hay una pausa corta y el relleno del AAC cae en silencio (sin clic). Volumen: suena 2,7 dB más fuerte que
  // el piano de antes (-10,6 frente a -13,3 LUFS); se igualó en 0,275, César la pidió a la mitad (sonaba muy dura) y luego un 25 % menos
  burrito: { archivo: 'audio/burrito-sabanero-eduardo.m4a', vol: 0.103 },
  // «Quiet Snow Village», ambiental: sin los silencios de las puntas y con la cola final (se apaga en 3,5 s) sonando sobre el comienzo, que entra
  // suave; la vuelta dura 6977266 muestras a 48 kHz. El archivo trae 1 s más del comienzo al final, así se repite de 0,5 s a 0,5 s + vuelta y el
  // relleno que agrega el AAC en las puntas nunca suena. Volumen: se igualó a la canción con Eduardo (0,17) y César la pidió un 25 % más baja
  nieve: { archivo: 'audio/quiet-snow-village.m4a', vol: 0.1275, desde: 0.5, vuelta: 6977266 / 48000 },
};
// el mapa y los pop-ups que salen sobre él: la canción original (opción 1) o, para comparar, la de las actividades (opción 2; panel › Avanzado)
const CAMINO = new Set(['mapa', 'cerrado', 'ruletaPop', 'ruletaPremio', 'premioCuarto']);
// trivias, juegos y actividades del día (no los videos ni las canciones, que traen su sonido)
const ACTIVIDADES = new Set(['trivia', 'triviaFin', 'completado', 'calificacion', 'hub', 'juegoIntro', 'juegoPasos', 'juegoCarta', 'juegoFin',
  'memoramaReglas', 'memorama', 'memoramaFin', 'adivinanzaIntro', 'adivinanza', 'adivinanzaTiempo', 'adivinanzaFin', 'desafioIntro', 'desafio', 'desafioFin']);
const delMapa = () => S.cancionMapa === 2 ? 'nieve' : 'burrito';
const pistaDe = nombre => CAMINO.has(nombre) ? delMapa() : ACTIVIDADES.has(nombre) ? 'nieve' : null;

let ctx = null, actual = null, dormir = null;
// por pista: su volumen (con fundidos), el audio decodificado, la fuente que suena y dónde iba
const est = {};

function montar() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  for (const id in PISTAS) {
    const g = ctx.createGain(); g.gain.value = 0; g.connect(ctx.destination);
    est[id] = { g, buffer: null, cargando: null, fuente: null, parar: null, pos: PISTAS[id].desde || 0, t0: 0, p0: 0 };
  }
}

function cargar(id) {
  const e = est[id];
  if (e.buffer || e.cargando) return e.cargando;
  e.cargando = fetch(PISTAS[id].archivo).then(r => r.arrayBuffer()).then(ab => new Promise((ok, mal) => ctx.decodeAudioData(ab, ok, mal)))
    .then(b => { e.buffer = b; }).catch(err => { console.warn('música', id, err); e.cargando = null; });
  return e.cargando;
}

// el tramo que se repite (la canción entera o el loop sin pausas) y dónde va ahora la pista, para retomarla ahí
const tramo = id => { const p = PISTAS[id], ini = p.desde || 0; return [ini, p.vuelta ? ini + p.vuelta : est[id].buffer.duration]; };
function donde(id) {
  const e = est[id], [ini, fin] = tramo(id), largo = fin - ini;
  return ini + ((e.p0 - ini + ctx.currentTime - e.t0) % largo + largo) % largo;
}
const rampa = (g, v, s) => { g.cancelScheduledValues(ctx.currentTime); g.setValueAtTime(g.value, ctx.currentTime); g.linearRampToValueAtTime(v, ctx.currentTime + s); };

async function subir(id) {
  const e = est[id];
  if (e.parar) { clearTimeout(e.parar); e.parar = null; } // volvió antes de que se apagara: sigue sonando donde iba
  await cargar(id);
  if (actual !== id || !e.buffer) return; // se fue de la pantalla mientras cargaba
  if (!e.fuente) {
    const [ini, fin] = tramo(id);
    e.fuente = ctx.createBufferSource(); e.fuente.buffer = e.buffer;
    e.fuente.loop = true; e.fuente.loopStart = ini; e.fuente.loopEnd = fin;
    e.fuente.connect(e.g); e.fuente.start(0, e.pos); e.t0 = ctx.currentTime; e.p0 = e.pos;
  }
  rampa(e.g.gain, PISTAS[id].vol, 1.2);
}
function bajar(id) {
  const e = est[id];
  if (!e?.fuente || e.parar) return;
  rampa(e.g.gain, 0, 0.6);
  e.parar = setTimeout(() => { e.pos = donde(id); try { e.fuente.stop(); } catch { /* ya parada */ } e.fuente = null; e.parar = null; }, 700);
}

function arrancar(id) {
  montar(); if (!ctx) return;
  if (dormir) { clearTimeout(dormir); dormir = null; }
  ctx.resume?.();
  actual = id;
  for (const otra in PISTAS) if (otra !== id) bajar(otra);
  subir(id);
}
function apagar() {
  if (!ctx || !actual) return;
  actual = null;
  for (const id in PISTAS) bajar(id);
  dormir = setTimeout(() => { dormir = null; if (!actual) ctx.suspend?.(); }, 800);
}

let desbloqueado = false;
/** Suena o no, y cuál pista, según la pantalla. Lo llama la navegación (onChange de core) cada vez que cambia la pantalla. */
export function musicaPara(nombre = cur?.name) {
  const id = S.musica !== false && !document.hidden ? pistaDe(nombre) : null;
  if (id && desbloqueado) arrancar(id); else apagar();
}

// el navegador no deja sonar nada hasta el primer toque
const desbloquear = () => {
  if (desbloqueado) return;
  desbloqueado = true; montar(); ctx?.resume?.(); if (ctx) cargar(pistaDe(cur?.name) || delMapa());
  removeEventListener('pointerdown', desbloquear, true); removeEventListener('keydown', desbloquear, true);
  musicaPara();
};
addEventListener('pointerdown', desbloquear, true);
addEventListener('keydown', desbloquear, true);
document.addEventListener('visibilitychange', () => musicaPara());
onChange(() => musicaPara());

const ICO_ON = '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg>';
const ICO_OFF = '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>';

/** Conecta el botón de música de una pantalla: alterna, guarda y cambia ícono y etiqueta. */
export function bindMute(btn) {
  if (!btn) return;
  const pintar = () => {
    const on = S.musica !== false;
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? 'Música de fondo activada. Toca para silenciarla' : 'Música de fondo silenciada. Toca para activarla');
    const old = btn.querySelector('svg');
    const tpl = document.createElement('template'); tpl.innerHTML = on ? ICO_ON : ICO_OFF;
    const ico = tpl.content.firstElementChild;
    // conserva el color del ícono del lienzo
    const color = old && (old.getAttribute('stroke') || old.querySelector('[stroke]:not([stroke=none])')?.getAttribute('stroke') || old.querySelector('[fill]:not([fill=none])')?.getAttribute('fill'));
    if (color && color !== 'currentColor') ico.style.color = color;
    if (old) { ico.setAttribute('width', old.getAttribute('width') || '22'); ico.setAttribute('height', old.getAttribute('height') || '22'); old.replaceWith(ico); } else btn.prepend(ico);
  };
  btn.dataset.bound = '1'; btn.style.cursor = 'pointer';
  btn.addEventListener('click', ev => {
    ev.preventDefault(); ev.stopPropagation();
    S.musica = S.musica === false; save();
    desbloquear(); pintar(); musicaPara();
  });
  pintar();
}
/** Para pruebas: si está sonando y el estado del audio. */
export const estadoMusica = () => { const e = actual && est[actual]; return { sonando: !!actual, pista: actual, audio: ctx?.state || 'sin crear', volumen: e ? +e.g.gain.value.toFixed(3) : 0, cargada: !!e?.buffer, loop: e?.fuente ? [+e.fuente.loopStart.toFixed(4), +e.fuente.loopEnd.toFixed(4)] : null, va: e?.fuente ? +donde(actual).toFixed(1) : null }; };
