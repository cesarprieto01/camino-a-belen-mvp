// Núcleo del MVP: estado del camino, carga de pantallas del lienzo,
// navegación con transiciones y utilidades para «vestir» las pantallas.
import { FILES } from './assets.js';
import { DAYS, RULES, BATTERY_IDS, TEODORO_IDS, IMG } from './data.js';

export const A = id => 'assets/' + (FILES[id] || id);
export const $ = (r, s) => r.querySelector(s);
export const $$ = (r, s) => [...r.querySelectorAll(s)];
export const wait = ms => new Promise(r => setTimeout(r, ms));
export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Estado ----------
const KEY = 'cab-mvp-v1';
export const DEFAULT = () => ({
  tema: 'claro', plan: 'premium', nombre: 'Lucía',
  hoy: 9,              // día del calendario: 0 = antes del 29 nov · 1..26 · 27 = 25 dic–6 ene
  inscrito: true,
  completos: {},       // día -> { contenido: true, estrellas: 0..3, trivia: true }
  bateria: 5, panes: 120,
  ruletas: {},         // día -> premio id
  ruletaPendiente: {}, // día -> true si dijo «Más tarde»
  sorpresas: {},       // día -> 'hecha' | 'luego'
  prendas: [], cuartoNuevo: false,
  regreso: false, teaserVisto: false, ultimoJugado: 9,
  pasoAnimado: null,   // día recién completado (animación en el mapa)
  forzarPremio: '',    // panel: forzar casilla de la ruleta
  notas: {}, huecos: [], vistas: {},
});
export let S = load();
function load() {
  try {
    const url = new URLSearchParams(location.hash.slice(1)).get('estado');
    if (url) return { ...DEFAULT(), ...JSON.parse(decodeURIComponent(escape(atob(url)))) };
  } catch { /* enlace dañado: arranca limpio */ }
  try { return { ...DEFAULT(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return DEFAULT(); }
}
export function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* navegador privado */ } emit(); }
export function reset(over = {}) { const keep = { notas: S.notas, huecos: S.huecos, tema: S.tema, vistas: S.vistas }; S = Object.assign(DEFAULT(), keep, over); save(); }
export function shareURL() {
  const { notas, huecos, ...rest } = S;
  return location.origin + location.pathname + '#estado=' + btoa(unescape(encodeURIComponent(JSON.stringify(rest)))) + '&pantalla=' + (cur?.name || 'hoy');
}
const subs = new Set();
export const onChange = fn => subs.add(fn);
function emit() { subs.forEach(f => f()); }

// Derivados del estado
export const day = n => DAYS[n];
export const isDone = n => !!S.completos[n]?.trivia || (n === 0 && !!S.completos[0]?.contenido) || (n === 26 && !!S.completos[26]?.contenido);
export const contentDone = n => !!S.completos[n]?.contenido;
export const lastDay = () => Math.min(S.hoy, 26);
/** Día que toca jugar: el primero sin terminar hasta hoy. null si ya está todo hecho. */
export function activeDay() {
  if (S.hoy <= 0) return S.inscrito ? (isDone(0) ? null : 0) : null;
  for (let n = 1; n <= lastDay(); n++) if (!isDone(n)) return n;
  return null;
}
export const doneCount = () => Object.keys(S.completos).filter(n => +n >= 1 && isDone(+n)).length;
export const pendientes = () => { const a = activeDay(); return a == null || a < 1 ? 0 : lastDay() - a + 1; };
export const fase = () => S.hoy <= 0 ? 'antes' : S.hoy >= 27 ? 'despues' : 'camino';
export const dark = () => S.tema === 'oscuro';
export const stars = n => S.completos[n]?.estrellas || 0;

export function addPanes(n) { S.panes += n; }
export function setBateria(v) { S.bateria = Math.max(0, Math.min(5, v)); }

// ---------- Pantallas del lienzo ----------
let MAN = {};
let SECS = [];
/** Secciones del lienzo, leídas de sus notas «N · …» */
export const sections = () => SECS;
const cache = new Map();
export async function boot() {
  MAN = await (await fetch('screens/manifest.json')).json();
  try { SECS = await (await fetch('screens/sections.json')).json(); } catch { SECS = []; }
  // Barra de pestañas: la del tab Teodoro (la más reciente del lienzo) para toda la app
  for (const [k, f] of [['c', 'V3-Teodoro'], ['o', 'V3-Teodoro-oscuro']]) NAV[k] = (await frag(f)).querySelector('nav').outerHTML;
}
const NAV = {};
const TAB_OF = { teodoro: 'Teodoro', mundos: 'Teodoro' };
/** Cambia cualquier barra de pestañas por la estándar, con la pestaña activa correcta. */
function unifyNav(root, name) {
  const old = root.querySelector('nav');
  if (!old || !NAV.c) return;
  const dk = dark();
  const t = document.createElement('template');
  t.innerHTML = NAV[dk ? 'o' : 'c'];
  const nav = t.content.firstElementChild;
  nav.style.top = ''; nav.style.bottom = '0'; nav.style.zIndex = '20';
  nav.setAttribute('aria-label', 'Pestañas de Theo');
  const active = TAB_OF[name] || 'Hoy';
  nav.querySelectorAll('a').forEach(a => {
    const label = a.textContent.trim();
    const on = label === active;
    a.removeAttribute('href');
    a.setAttribute('aria-label', label);
    on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
    a.style.color = on ? (dk ? '#FFFFFF' : '#1E8DA5') : (dk ? '#C3CCDA' : '#5F5F5F');
    a.style.fontWeight = on ? '900' : '700';
  });
  old.replaceWith(nav);
  // indicador de inicio del iPhone, en el color del tema
  [...root.children].filter(el => el.style.width === '134px' && el.style.height === '5px').forEach(e => e.remove());
  const hi = document.createElement('div');
  hi.setAttribute('aria-hidden', 'true'); hi.dataset.home = '1';
  hi.style.cssText = `position:absolute;left:50%;bottom:8px;width:134px;height:5px;margin-left:-67px;border-radius:3px;background:${dk ? '#FFFFFF' : '#111111'};z-index:21`;
  root.appendChild(hi);
}

// ---------- Cobertura: qué pantallas del lienzo ya se vieron en el flujo ----------
export const logical = file => (MAN[file]?.title || file).replace(/\s*·\s*[☀☾]\s*(claro|oscuro)/g, '').trim();
export function seen(...files) {
  let changed = false;
  S.vistas ||= {};
  files.forEach(f => { const k = logical(f); if (MAN[f] && !S.vistas[k]) { S.vistas[k] = true; changed = true; } });
  if (changed) { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* */ } }
}
/** Pantallas del lienzo que forman el flujo (secciones 1 a 8). */
export function flowScreens() {
  const keys = new Map();
  const from = SECS.find(s => s.n === 1)?.y ?? 3380, to = SECS.find(s => s.n === 9)?.y ?? 31163;
  Object.entries(MAN).forEach(([f, m]) => { if (m.y >= from && m.y < to) keys.set(logical(f), { file: f, y: m.y, x: m.x }); });
  return keys;
}
export const manifest = () => MAN;
export async function html(file) {
  if (!cache.has(file)) {
    // si falla la red, no se queda guardado el error: el próximo intento vuelve a pedirla
    const p = fetch('screens/' + file + '.html').then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); });
    p.catch(() => cache.delete(file));
    cache.set(file, p);
  }
  return cache.get(file);
}
export function prefetch(files) { files.forEach(f => html(f).catch(() => { /* se reintenta al abrirla */ })); }

/** Fragmento DOM de una pantalla (para sacarle piezas como plantilla). */
export async function frag(file) {
  const t = document.createElement('template');
  t.innerHTML = await html(file);
  return t.content.firstElementChild;
}

// ---------- Navegación ----------
const vp = () => document.getElementById('viewport');
export let cur = null;          // { name, layer, params }
const SCREENS = {};             // name -> { files:[claro, oscuro], mount(root, params, layer) }
export const register = (name, def) => { SCREENS[name] = def; };
export const screens = () => SCREENS;
let busy = Promise.resolve();

export function go(name, params = {}, anim = 'push') {
  busy = busy.then(() => _go(name, params, anim)).catch(e => { console.error(e); toast('Algo falló al abrir la pantalla', e.message); });
  return busy;
}
async function _go(name, params, anim) {
  const def = SCREENS[name];
  if (!def) { hueco(`Pantalla «${name}» sin definir`); return; }
  const file = typeof def.file === 'function' ? def.file(params) : def.files[dark() ? 1 : 0];
  const markup = await html(file);
  const layer = document.createElement('div');
  layer.className = 'layer';
  layer.dataset.screen = name;
  layer.innerHTML = '<div class="root">' + markup + '</div>';
  const root = layer.firstElementChild.firstElementChild;
  const h = MAN[file]?.h || 844;
  const prev = cur;
  cur = { name, layer, params, file };
  vp().appendChild(layer);
  unifyNav(root, name);
  if (name !== 'estatica') seen(file);
  try { await def.mount?.(root, params, layer); } catch (e) { console.error(e); toast('Error en ' + name, e.message); }
  if (h > 844 && !def.noScroll) { layer.classList.add('scroll'); pinBottom(layer, root, h); }
  bindFallback(layer, layer);
  const a = reduced() ? 'fade' : anim;
  if (prev) {
    const inC = { push: 'in-push', back: 'in-back', fade: 'in-fade', modal: 'in-modal', up: 'in-up', down: 'in-fade', none: '' }[a];
    const outC = { push: 'out-push', back: 'out-back', fade: 'out-fade', modal: 'out-stay', up: 'out-stay', down: 'out-down', none: '' }[a];
    if (a === 'back' || a === 'down') { prev.layer.style.zIndex = 3; }
    inC && layer.classList.add(inC);
    outC && prev.layer.classList.add(outC);
    prev.def?.unmount?.();
    SCREENS[prev.name]?.unmount?.(prev);
    setTimeout(() => prev.layer.remove(), a === 'none' ? 0 : 420);
  }
  layer.addEventListener('animationend', () => layer.classList.remove('in-push', 'in-back', 'in-fade', 'in-modal', 'in-up'), { once: true });
  history.replaceState(null, '', '#pantalla=' + name);
  emit();
}

/** En pantallas largas (Hoy, Teodoro, mapa) la barra de pestañas va fija abajo. */
function pinBottom(layer, root, h) {
  const kids = [...root.children].filter(el => {
    const st = el.style; const top = parseFloat(st.top); const bottom = st.bottom;
    return el.matches('nav, [data-home]') || (bottom !== '' && parseFloat(bottom) < 40 && !el.matches('img')) || (top > h - 130 && el.offsetHeight < 140);
  });
  if (!kids.length) return;
  // Un ancla «sticky» al final del scroll mantiene la barra pegada abajo
  const holder = document.createElement('div');
  holder.style.cssText = 'position:sticky;bottom:0;height:0;z-index:30';
  const inner = document.createElement('div');
  inner.style.cssText = 'position:absolute;left:0;bottom:0;width:390px;height:844px;pointer-events:none';
  kids.forEach(el => {
    const top = parseFloat(el.style.top);
    if (!isNaN(top) && el.style.top) el.style.top = (844 - (h - top)) + 'px';
    el.style.pointerEvents = 'auto';
    inner.appendChild(el);
  });
  holder.appendChild(inner);
  layer.appendChild(holder);
}

/** Enlaces del lienzo que nadie conectó: si apuntan a otra pantalla se siguen; si no, se registran como hueco. */
function bindFallback(layer, root) {
  $$(root, 'a, button').forEach(el => {
    if (el.dataset.bound) return;
    el.addEventListener('click', ev => {
      ev.preventDefault();
      const label = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);
      hueco(label || 'Elemento sin nombre', el);
    });
  });
}

/** Conecta un elemento a una acción. Acepta un elemento o texto/aria-label a buscar. */
export function on(root, target, fn) {
  const els = typeof target === 'string' ? findAll(root, target) : (target ? [target] : []);
  els.forEach(el => {
    el.dataset.bound = '1';
    el.style.cursor = 'pointer';
    if (el.tagName === 'DIV' || el.tagName === 'SPAN' || el.tagName === 'IMG') { el.setAttribute('role', el.getAttribute('role') || 'button'); el.tabIndex = 0; }
    el.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); fn(ev, el); });
    el.addEventListener('keydown', ev => { if (ev.key === 'Enter' && el.tagName !== 'A' && el.tagName !== 'BUTTON') fn(ev, el); });
  });
  return els[0];
}
/** Busca <a>/<button>/[aria-label] por su aria-label (empieza con) o su texto exacto. */
export function findAll(root, q) {
  const all = $$(root, 'a, button, [aria-label], [role=img], [role=dialog] *');
  const norm = s => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const n = norm(q);
  const hits = all.filter(el => norm(el.getAttribute('aria-label')).startsWith(n));
  if (hits.length) return hits;
  return $$(root, 'a, button').filter(el => norm(el.textContent) === n || norm(el.textContent).startsWith(n));
}
export const find = (root, q) => findAll(root, q)[0];

/** Elemento hoja cuyo texto coincide (para cambiar copys). */
export function textEl(root, match) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    const t = n.nodeValue.replace(/ /g, ' ');
    if (typeof match === 'string' ? t.trim() === match : match.test(t)) return n.parentElement;
  }
  return null;
}
/** Reemplaza texto en todos los nodos de texto. */
export function replaceText(root, re, to) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = []; let n;
  while ((n = walker.nextNode())) nodes.push(n);
  nodes.forEach(t => {
    const v = t.nodeValue.replace(/ /g, ' ');
    if (re.test(v)) t.nodeValue = v.replace(re, to);
    re.lastIndex = 0;
  });
}
export function setText(root, match, to) { const el = textEl(root, match); if (el) { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let t; while ((t = w.nextNode())) { const v = t.nodeValue.replace(/ /g, ' '); if (typeof match === 'string' ? v.trim() === match : match.test(v)) { t.nodeValue = typeof match === 'string' ? to : v.replace(match, to); break; } } } return el; }

/** Cambia una imagen por id de asset en todo el árbol. */
export function swapImg(root, fromId, toId) { $$(root, `img[src*="${fromId}"]`).forEach(i => { i.src = A(toId); }); }
export const imgs = (root, id) => $$(root, `img[src*="${id}"]`);

/** Batería y Teodoro según la energía actual, donde aparezcan. */
export function paintEnergy(root) {
  BATTERY_IDS.forEach(id => $$(root, `img[src*="${id}"]`).forEach(i => { i.src = A(BATTERY_IDS[S.bateria]); }));
  $$(root, '[aria-label^="Energía de Teodoro"]').forEach(el => el.setAttribute('aria-label', `Energía de Teodoro: ${S.bateria} de 5`));
}
export function teodoroImg(level = S.bateria) { return A(TEODORO_IDS[level]); }

// ---------- Avisos y huecos ----------
let tT;
export function toast(msg, sub = '') {
  const t = document.getElementById('toast');
  t.innerHTML = msg + (sub ? `<small>${sub}</small>` : '');
  t.classList.add('on');
  clearTimeout(tT); tT = setTimeout(() => t.classList.remove('on'), 2600);
}
/** Algo que se tocó y no tiene diseño ni regla todavía: se avisa y se apunta en «Huecos». */
export function hueco(label, el) {
  const where = cur?.name || '—';
  if (el) { el.classList.add('hueco-ring'); setTimeout(() => el.classList.remove('hueco-ring'), 1400); }
  toast('Aún sin diseño', label);
  const key = where + '|' + label;
  if (!S.huecos.some(h => h.key === key)) { S.huecos.unshift({ key, where, label, at: new Date().toISOString() }); save(); }
}

// ---------- Efectos ----------
export function floaty(layer, text, x, y, icon = IMG.pan) {
  const f = document.createElement('div');
  f.className = 'floaty';
  f.innerHTML = (icon ? `<img src="${A(icon)}" alt="">` : '') + text;
  f.style.left = x + 'px'; f.style.top = y + 'px';
  layer.appendChild(f);
  setTimeout(() => f.remove(), 1500);
}
export function confetti(layer, x = 195, y = 300, n = 36) {
  if (reduced()) return;
  const colors = ['#F5DB78', '#1E8DA5', '#E0565B', '#8FD0A3', '#F5D46A', '#37ABC4'];
  for (let i = 0; i < n; i++) {
    const c = document.createElement('i');
    c.className = 'confetti';
    const ang = Math.random() * Math.PI * 2, dist = 90 + Math.random() * 200;
    c.style.cssText = `left:${x}px;top:${y}px;background:${colors[i % colors.length]};--dx:${Math.cos(ang) * dist}px;--dy:${Math.sin(ang) * dist + 160}px;--rot:${Math.random() * 720 - 360}deg;animation-delay:${Math.random() * .12}s`;
    layer.appendChild(c);
    setTimeout(() => c.remove(), 1700);
  }
}
export function animate(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

export { RULES, DAYS };
