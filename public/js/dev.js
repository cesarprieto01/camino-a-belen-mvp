// Modo developer (solo prototipo), como el modo Dev de Figma sobre el teléfono: al pasar el cursor se ve cada capa con su tamaño;
// al hacer clic queda elegida y el panel muestra lo que hace falta para construirla (medidas, estilo, texto, asset, estados y código).
// Con una capa elegida, pasar sobre otra muestra las distancias en rojo. «Usar la app» deja tocar la app sin salir del modo.
import { VP, capaArriba, capaEn, capasEn, cajaVista, hijosCapa, padreCapa, pt, visible, nombreDe, tipo, nombreTipo } from './dev-motor.js';

const E = { on: false, usar: false, sel: null, hover: null, alCambiar: () => {} };
try { E.on = localStorage.getItem('cab-dev') === '1'; } catch { /* sin storage */ }
export const devActivo = () => E.on;
export const usandoApp = () => E.usar;
export const elegida = () => (E.sel?.isConnected ? E.sel : null);
/** El panel avisa aquí para repintarse cuando cambia la selección */
export const alCambiar = fn => { E.alCambiar = fn; };

export function activar(on = !E.on) {
  if (on && innerWidth <= 760) return; // en un celular no hay modo developer: no hay cursor ni lugar para el inspector
  E.on = on; E.usar = false; E.sel = E.hover = null; cerrarMenu();
  try { localStorage.setItem('cab-dev', on ? '1' : '0'); } catch { /* */ }
  document.body.classList.toggle('dev-on', on); sincronizar(); dibujar(); E.alCambiar();
}
export function usar(si = !E.usar) { E.usar = si; E.hover = null; sincronizar(); dibujar(); E.alCambiar(); }
export function elegir(el) { E.sel = el && el.isConnected ? el : null; E.hover = null; dibujar(); E.alCambiar(); }
export const subir = () => { const p = elegida() && padreCapa(E.sel); if (p) elegir(p); };
export const bajarA = () => { const h = elegida() && hijosCapa(E.sel)[0]; if (h) elegir(h); };
/** La capa hermana siguiente (o anterior), dando la vuelta */
export function hermana(paso = 1) {
  const el = elegida(); if (!el) return;
  const her = hijosCapa(padreCapa(el) || capaArriba()), i = her.indexOf(el);
  if (her.length > 1 && i >= 0) elegir(her[(i + paso + her.length) % her.length]);
}
/** «Tocar»: el toque llega a la app sin salir de Inspeccionar */
export function tocarElegida() { const el = elegida(); if (!el) return; E.pasar = true; try { el.click(); } finally { E.pasar = false; } }
export const resaltar = el => { E.hover = el; dibujar(); };
// como en Figma: el clic elige el componente (la opción de respuesta, el botón de música), el doble clic entra a lo de adentro.
// El panel pone aquí cómo se reconoce un componente (su registro de estados); sin él, el botón o el enlace que lo contiene
let alComponente = el => el?.closest('button, a, [role=button], [role=checkbox], [role=radio]') || el;
export const reconocer = fn => { alComponente = fn; };
const enComponente = el => { if (!el) return null; const c = alComponente(el); return c && capaArriba()?.contains(c) && visible(c) ? c : el; };
const sincronizar = () => document.body.classList.toggle('dev-inspect', E.on && !E.usar);

// ---------- Dibujo sobre el teléfono ----------
let ov = null;
function capa() {
  if (ov?.isConnected) return ov;
  ov = document.createElement('div'); ov.id = 'dev-ov'; ov.setAttribute('aria-hidden', 'true');
  document.getElementById('phone')?.appendChild(ov);
  return ov;
}
const caja = (c, cls, etiqueta = '') => `<div class="dv-box ${cls}" style="left:${c.x}px;top:${c.y}px;width:${c.w}px;height:${c.h}px">${etiqueta ? `<span class="dv-tag">${etiqueta}</span>` : ''}</div>`;
const medida = c => `${pt(c.w)} × ${pt(c.h)}`;
// línea de distancia (en pt del viewport) con su etiqueta
const linea = (x1, y1, x2, y2) => {
  const hor = y1 === y2, largo = hor ? x2 - x1 : y2 - y1; if (largo < 0.5) return '';
  return `<div class="dv-line ${hor ? 'h' : 'v'}" style="left:${x1}px;top:${y1}px;${hor ? `width:${largo}px` : `height:${largo}px`}"><span>${pt(largo)}</span></div>`;
};
/** Distancias entre la capa elegida (a) y otra (b), como en Figma */
function distancias(a, b) {
  const out = [];
  const dentro = (p, q) => p.x >= q.x - .5 && p.y >= q.y - .5 && p.x + p.w <= q.x + q.w + .5 && p.y + p.h <= q.y + q.h + .5;
  if (dentro(a, b) || dentro(b, a)) {
    const [i, o] = dentro(a, b) ? [a, b] : [b, a], cx = i.x + i.w / 2, cy = i.y + i.h / 2;
    out.push(linea(cx, o.y, cx, i.y), linea(cx, i.y + i.h, cx, o.y + o.h), linea(o.x, cy, i.x, cy), linea(i.x + i.w, cy, o.x + o.w, cy));
    return out.join('');
  }
  const midY = (Math.max(a.y, b.y) + Math.min(a.y + a.h, b.y + b.h)) / 2, midX = (Math.max(a.x, b.x) + Math.min(a.x + a.w, b.x + b.w)) / 2;
  const solapaY = Math.min(a.y + a.h, b.y + b.h) > Math.max(a.y, b.y), solapaX = Math.min(a.x + a.w, b.x + b.w) > Math.max(a.x, b.x);
  if (b.x >= a.x + a.w) out.push(linea(a.x + a.w, solapaY ? midY : a.y + a.h / 2, b.x, solapaY ? midY : a.y + a.h / 2));
  else if (a.x >= b.x + b.w) out.push(linea(b.x + b.w, solapaY ? midY : a.y + a.h / 2, a.x, solapaY ? midY : a.y + a.h / 2));
  if (b.y >= a.y + a.h) out.push(linea(solapaX ? midX : a.x + a.w / 2, a.y + a.h, solapaX ? midX : a.x + a.w / 2, b.y));
  else if (a.y >= b.y + b.h) out.push(linea(solapaX ? midX : a.x + a.w / 2, b.y + b.h, solapaX ? midX : a.x + a.w / 2, a.y));
  return out.join('');
}
let pendiente = 0;
export function dibujar() {
  cancelAnimationFrame(pendiente);
  pendiente = requestAnimationFrame(() => {
    const o = capa(); if (!o) return;
    if (!E.on) { o.innerHTML = ''; return; }
    const sel = elegida(), hv = !E.usar && E.hover?.isConnected && visible(E.hover) ? E.hover : null;
    let html = '';
    if (sel && visible(sel)) { const c = cajaVista(sel); html += caja(c, 'sel', medida(c)); }
    if (hv && hv !== sel) {
      const c = cajaVista(hv); html += caja(c, 'hov', sel ? '' : medida(c));
      if (sel && visible(sel)) html += distancias(cajaVista(sel), c);
    }
    o.innerHTML = html;
  });
}

// ---------- «Capas aquí» (clic derecho): todo lo que hay bajo el punto, también lo oculto ----------
let menu = null;
export function cerrarMenu() { menu?.remove(); menu = null; }
function abrirMenu(ev) {
  cerrarMenu();
  const lista = capasEn(ev.clientX, ev.clientY); if (!lista.length) return;
  const v = VP().getBoundingClientRect(), k = v.width / 390;
  menu = document.createElement('div'); menu.className = 'dv-menu'; menu.setAttribute('role', 'menu'); menu.setAttribute('aria-label', 'Capas aquí');
  menu.style.left = Math.min((ev.clientX - v.left) / k, 390 - 230) + 'px'; menu.style.top = Math.min((ev.clientY - v.top) / k, 844 - 40 - lista.length * 34) + 'px';
  menu.innerHTML = '<p>Capas aquí</p>' + lista.slice(0, 10).map((el, i) => `<button role="menuitem" data-i="${i}"><span>${nombreTipo(tipo(el))}</span>${nombreDe(el).replace(/</g, '&lt;')}${visible(el) ? '' : ' <small>Oculto</small>'}</button>`).join('');
  menu.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) { elegir(lista[+b.dataset.i]); cerrarMenu(); } });
  menu.addEventListener('mouseover', e => { const b = e.target.closest('[data-i]'); if (b) resaltar(lista[+b.dataset.i]); });
  capa().append(menu); menu.querySelector('button')?.focus();
}

// ---------- Eventos sobre el teléfono ----------
const enTelefono = ev => VP()?.contains(ev.target);
function mover(ev) {
  if (!E.on || E.usar || !enTelefono(ev)) return;
  const raw = capaEn(ev.clientX, ev.clientY), comp = enComponente(raw), sel = elegida();
  const el = sel && (comp === sel || sel.contains(raw)) ? raw : comp; // dentro de lo elegido se ve la pieza; fuera, el componente
  if (el !== E.hover) { E.hover = el; dibujar(); }
}
// al inspeccionar, el toque elige la capa y no llega a la app («Tocar» deja pasar uno)
function tocar(ev) {
  if (!E.on || E.usar || E.pasar || !enTelefono(ev) || ev.target.closest?.('.dv-menu')) return;
  ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
  if (ev.type === 'click' && ev.detail < 2) { cerrarMenu(); const raw = capaEn(ev.clientX, ev.clientY), comp = enComponente(raw); elegir(elegida() && comp === elegida() ? raw : comp); }
  if (ev.type === 'dblclick') { cerrarMenu(); elegir(capaEn(ev.clientX, ev.clientY)); }
  if (ev.type === 'contextmenu') abrirMenu(ev);
}
addEventListener('pointermove', mover, { capture: true, passive: true });
['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'touchstart', 'touchend', 'dblclick', 'contextmenu'].forEach(t => addEventListener(t, tocar, { capture: true }));
VP()?.addEventListener('pointerleave', () => { if (E.hover) { E.hover = null; dibujar(); } });
addEventListener('scroll', () => E.on && dibujar(), { capture: true, passive: true });
addEventListener('resize', () => E.on && dibujar());
// teclado (en captura, antes que el atrás de la app): ⇧D entra o sale · I inspeccionar · U usar la app · T tocar ·
// Enter adentro · ⇧Enter contenedor · Tab hermana · Esc suelta la capa (nunca saca del modo ni navega atrás)
addEventListener('keydown', ev => {
  if (ev.target.closest?.('input, textarea, select, [contenteditable]') || ev.metaKey || ev.ctrlKey || ev.altKey) return;
  const k = ev.key.toLowerCase(), corta = () => { ev.preventDefault(); ev.stopImmediatePropagation(); };
  if (k === 'd' && ev.shiftKey) { activar(); corta(); return; }
  if (!E.on) return;
  if (k === 'i') { usar(false); corta(); }
  else if (k === 'u') { usar(true); corta(); }
  else if (E.usar) return;
  else if (ev.key === 'Escape') { corta(); if (menu) cerrarMenu(); else if (elegida()) elegir(null); }
  else if (k === 't' && elegida()) { corta(); tocarElegida(); }
  else if (ev.key === 'Enter' && elegida()) { corta(); ev.shiftKey ? subir() : bajarA(); }
  else if (ev.key === 'Tab' && elegida() && !ev.target.closest?.('#panel')) { corta(); hermana(ev.shiftKey ? -1 : 1); }
}, { capture: true });
// al cambiar de pantalla, lo elegido ya no existe
new MutationObserver(() => { if (!E.on) return; if (E.sel && !E.sel.isConnected) { E.sel = null; E.alCambiar(); } dibujar(); }).observe(document.getElementById('viewport') || document.body, { childList: true });
document.body.classList.toggle('dev-on', E.on); sincronizar();
export const pantallaActual = capaArriba;
