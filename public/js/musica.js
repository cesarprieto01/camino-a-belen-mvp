// Música de fondo del camino: «Burrito Sabanero» con Eduardo (master final V6), la canción entera repetida.
// Suena en el mapa y en la trivia; en lo demás se apaga con fundido.
import { S, save, cur, onChange } from './core.js';

// el master suena 2,7 dB más fuerte que el piano de antes (-10,6 frente a -13,3 LUFS); se igualó en 0,275 y César la pidió a la mitad (sonaba muy dura)
const VOL = 0.1375;
// recortada a 1,8–143,0 s del master: quedan ~0,35 s de silencio en cada punta, así al repetirse hay una pausa corta y el relleno del AAC cae en silencio (sin clic)
const ARCHIVO = 'audio/burrito-sabanero-eduardo.m4a';
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

function cargar() {
  if (buffer || cargando) return cargando;
  cargando = fetch(ARCHIVO).then(r => r.arrayBuffer()).then(ab => new Promise((ok, mal) => ctx.decodeAudioData(ab, ok, mal)))
    .then(b => { buffer = b; }).catch(e => { console.warn('música', e); cargando = null; });
  return cargando;
}

function sonar() {
  if (fuente || !buffer) return;
  fuente = ctx.createBufferSource(); fuente.buffer = buffer; fuente.loop = true; // la canción entera, de punta a punta
  fuente.connect(master); fuente.start(0);
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
