// Música de fondo del camino: «Burrito Sabanero» (piano, versión en loop), al 75 % del volumen original.
// Suena en el mapa y en la trivia; en lo demás se apaga con fundido.
import { S, save, cur, onChange } from './core.js';

const VOL = 0.75; // 25 % menos que el original
const ARCHIVO = 'audio/burrito-sabanero.m4a';
const FRAMES = 2499000; // largo exacto del loop original (56,67 s a 44,1 kHz)
// primeras 256 muestras del original: con ellas se encuentra dónde empieza el loop tras el relleno del AAC (sin clic al repetir)
const HUELLA = [-0.0144,-0.0117,-0.0091,-0.0064,-0.0038,-0.001,0.002,0.0052,0.0086,0.0124,0.0165,0.0209,0.0255,0.0302,0.0347,0.039,0.0428,0.046,0.0484,0.0497,0.0499,0.0489,0.047,0.0445,0.0418,0.039,0.0365,0.0344,0.0329,0.032,0.0316,0.0318,0.0322,0.0325,0.0325,0.0322,0.0317,0.0311,0.0306,0.0303,0.0305,0.031,0.0318,0.0328,0.0337,0.0343,0.0344,0.0341,0.0334,0.0326,0.0318,0.0315,0.0319,0.033,0.0348,0.0368,0.0389,0.0405,0.0415,0.0419,0.0417,0.0409,0.0395,0.0374,0.0346,0.0312,0.0273,0.0231,0.0188,0.0146,0.0107,0.0071,0.004,0.0014,-0.0007,-0.0023,-0.0035,-0.0043,-0.0047,-0.0046,-0.0041,-0.0033,-0.0022,-0.0012,-0.0004,-0.0001,-0.0003,-0.0012,-0.0028,-0.0051,-0.0081,-0.0119,-0.0164,-0.0214,-0.0269,-0.0326,-0.038,-0.0429,-0.0468,-0.0494,-0.0507,-0.0505,-0.0491,-0.0466,-0.0433,-0.0393,-0.0348,-0.0298,-0.0247,-0.0194,-0.0141,-0.0088,-0.0035,0.0018,0.007,0.0118,0.0164,0.0206,0.0246,0.028,0.0308,0.0329,0.0339,0.0342,0.0337,0.0327,0.0314,0.0297,0.0275,0.0248,0.0215,0.0175,0.013,0.0083,0.0035,-0.0009,-0.005,-0.0086,-0.0118,-0.0145,-0.0169,-0.0191,-0.0212,-0.0233,-0.0256,-0.0278,-0.0298,-0.0311,-0.0316,-0.0313,-0.0304,-0.0292,-0.0282,-0.0277,-0.0278,-0.0287,-0.0305,-0.0331,-0.0363,-0.0399,-0.0438,-0.0477,-0.0515,-0.0551,-0.0586,-0.0622,-0.0658,-0.0695,-0.0732,-0.0768,-0.0799,-0.0825,-0.0842,-0.085,-0.0846,-0.083,-0.0802,-0.0761,-0.071,-0.0649,-0.0581,-0.051,-0.0437,-0.0365,-0.0297,-0.0236,-0.0181,-0.0137,-0.0104,-0.0086,-0.0084,-0.0097,-0.0124,-0.0161,-0.0205,-0.0254,-0.0304,-0.0352,-0.0396,-0.0433,-0.0464,-0.0488,-0.0505,-0.0516,-0.0518,-0.0511,-0.0494,-0.0468,-0.0434,-0.0394,-0.0348,-0.0299,-0.0246,-0.0189,-0.0129,-0.0064,0.0004,0.0073,0.0143,0.0213,0.0284,0.0356,0.0428,0.05,0.0569,0.0631,0.0682,0.072,0.0742,0.0749,0.0743,0.0728,0.0707,0.0688,0.0676,0.0673,0.0679,0.0692,0.0705,0.0711,0.0708,0.0691,0.0663,0.0625,0.0583,0.0541,0.0504,0.0476,0.0462,0.0463,0.0478,0.0506,0.0543,0.0584,0.0625,0.0664];
// dónde suena: el mapa, la trivia y los pop-ups que salen sobre ellos
const PANTALLAS = new Set(['mapa', 'trivia', 'triviaFin', 'cerrado', 'ruletaPop', 'ruletaPremio', 'premioCuarto']);

let ctx = null, master = null, buffer = null, cargando = null, fuente = null, sonando = false, parar = null;

function montar() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0;
  master.connect(ctx.destination);
}

/** Dónde empieza el loop dentro del audio decodificado (el AAC agrega unas muestras de relleno al inicio). */
function inicioDelLoop(buf) {
  const d = buf.getChannelData(0); let mejor = 0, err = Infinity;
  for (let o = 0; o < 4096 && o + HUELLA.length < d.length; o++) {
    let e = 0; for (let i = 0; i < HUELLA.length; i++) { const x = d[o + i] - HUELLA[i]; e += x * x; if (e > err) break; }
    if (e < err) { err = e; mejor = o; }
  }
  return mejor;
}

function cargar() {
  if (buffer || cargando) return cargando;
  cargando = fetch(ARCHIVO).then(r => r.arrayBuffer()).then(ab => new Promise((ok, mal) => ctx.decodeAudioData(ab, ok, mal)))
    .then(b => { buffer = b; }).catch(e => { console.warn('música', e); cargando = null; });
  return cargando;
}

function sonar() {
  if (fuente || !buffer) return;
  const sr = buffer.sampleRate, k = sr / 44100, o = inicioDelLoop(buffer);
  fuente = ctx.createBufferSource(); fuente.buffer = buffer; fuente.loop = true;
  fuente.loopStart = o / sr; fuente.loopEnd = Math.min(buffer.duration, (o + FRAMES * k) / sr);
  fuente.connect(master); fuente.start(0, fuente.loopStart);
}

async function arrancar() {
  montar(); if (!ctx) return;
  if (parar) { clearTimeout(parar); parar = null; }
  sonando = true;
  ctx.resume?.();
  await cargar();
  if (!sonando) return; // se fue de la pantalla mientras cargaba
  sonar();
  const g = master.gain; g.cancelScheduledValues(ctx.currentTime); g.setValueAtTime(g.value, ctx.currentTime); g.linearRampToValueAtTime(VOL, ctx.currentTime + 1.2);
}
function apagar() {
  if (!ctx || !sonando) return;
  sonando = false;
  const g = master.gain; g.cancelScheduledValues(ctx.currentTime); g.setValueAtTime(g.value, ctx.currentTime); g.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
  parar = setTimeout(() => { try { fuente?.stop(); } catch { /* ya parada */ } fuente = null; parar = null; ctx.suspend?.(); }, 700);
}

let desbloqueado = false;
/** Suena o no según la pantalla. Lo llama la navegación (onChange de core) cada vez que cambia la pantalla. */
export function musicaPara(nombre = cur?.name) {
  const quiere = S.musica !== false && PANTALLAS.has(nombre) && !document.hidden;
  if (quiere && desbloqueado) arrancar(); else apagar();
}

// el navegador no deja sonar nada hasta el primer toque
const desbloquear = () => {
  if (desbloqueado) return;
  desbloqueado = true; montar(); ctx?.resume?.(); if (ctx) cargar();
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
export const estadoMusica = () => ({ sonando, audio: ctx?.state || 'sin crear', volumen: master ? +master.gain.value.toFixed(3) : 0, cargada: !!buffer, loop: fuente ? [+fuente.loopStart.toFixed(4), +fuente.loopEnd.toFixed(4)] : null });
