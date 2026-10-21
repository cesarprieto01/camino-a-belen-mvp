// Música de fondo del camino: «Veni, veni, Emmanuel» (dominio público) como caja de música,
// sintetizada con Web Audio (sin archivos). Suena en el mapa y en la trivia; en lo demás se apaga con fundido.
import { S, save, cur, onChange } from './core.js';

const VOL = 0.08;
const BEAT = 0.5; // segundos por tiempo
// dónde suena: el mapa, la trivia y los pop-ups que salen sobre ellos
const PANTALLAS = new Set(['mapa', 'trivia', 'triviaFin', 'cerrado', 'ruletaPop', 'ruletaPremio', 'premioCuarto']);

// Melodía en mi menor, una octava arriba (caja de música): [nota, tiempos]
const N = { D4: 293.66, E4: 329.63, Fs4: 369.99, G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33 };
const VERSO = [['E4', 1], ['G4', 1], ['B4', 1], ['B4', 1], ['B4', 1], ['A4', 1], ['C5', 1], ['B4', 1], ['A4', 1], ['G4', 3]];
const CIERRE = [['A4', 1], ['B4', 1], ['G4', 1], ['E4', 1], ['G4', 1], ['A4', 1], ['Fs4', 1], ['E4', 1], ['D4', 1], ['E4', 3]];
const MEDIO = [['A4', 1], ['A4', 1], ['E4', 1], ['E4', 1], ['Fs4', 1], ['G4', 1], ['Fs4', 1], ['E4', 3]];
const ESTRIBILLO = [['D5', 2], ['B4', 2], ['B4', 2], ['A4', 1], ['B4', 1], ['C5', 1], ['B4', 1], ['A4', 1], ['G4', 3]];
const MELODIA = [...VERSO, ...CIERRE, ...MEDIO, ...VERSO, ...CIERRE, ...ESTRIBILLO, ...CIERRE, [null, 4]];

let ctx = null, master = null, wet = null, timer = null, idx = 0, next = 0, sonando = false, parar = null;

function montar() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0;
  master.connect(ctx.destination);
  // eco suave: un retardo que se repite apagándose, con los agudos recortados
  const delay = ctx.createDelay(1); delay.delayTime.value = 0.32;
  const fb = ctx.createGain(); fb.gain.value = 0.32;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
  wet = ctx.createGain(); wet.gain.value = 0.35;
  wet.connect(delay); delay.connect(lp); lp.connect(fb); fb.connect(delay); lp.connect(master);
}

/** Una nota de caja de música: ataque corto, cola larga y un armónico agudo que se apaga antes. */
function nota(f, t, dur) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.9, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.001, t + Math.max(1.4, dur * 1.6));
  g.connect(master); g.connect(wet);
  [[f * 2, 'sine', 1], [f * 4, 'sine', 0.22], [f * 6.02, 'triangle', 0.06]].forEach(([fr, type, a], k) => {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = fr;
    const og = ctx.createGain(); og.gain.setValueAtTime(a, t);
    if (k) og.gain.exponentialRampToValueAtTime(0.0005, t + 0.5);
    o.connect(og); og.connect(g);
    o.start(t); o.stop(t + Math.max(1.5, dur * 1.7));
  });
}

function programar() {
  while (next < ctx.currentTime + 0.4) {
    const [n, b] = MELODIA[idx];
    if (n && b) nota(N[n], next, b * BEAT);
    next += b * BEAT;
    idx = (idx + 1) % MELODIA.length;
  }
}

function arrancar() {
  montar(); if (!ctx) return;
  if (parar) { clearTimeout(parar); parar = null; }
  ctx.resume?.();
  if (!timer) { idx = 0; next = ctx.currentTime + 0.15; timer = setInterval(programar, 100); programar(); }
  const g = master.gain; g.cancelScheduledValues(ctx.currentTime); g.setValueAtTime(g.value, ctx.currentTime); g.linearRampToValueAtTime(VOL, ctx.currentTime + 1.2);
  sonando = true;
}
function apagar() {
  if (!ctx || !sonando) return;
  sonando = false;
  const g = master.gain; g.cancelScheduledValues(ctx.currentTime); g.setValueAtTime(g.value, ctx.currentTime); g.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
  parar = setTimeout(() => { clearInterval(timer); timer = null; parar = null; ctx.suspend?.(); }, 700);
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
  desbloqueado = true; montar(); ctx?.resume?.();
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
export const estadoMusica = () => ({ sonando, audio: ctx?.state || 'sin crear', volumen: master ? +master.gain.value.toFixed(3) : 0 });
