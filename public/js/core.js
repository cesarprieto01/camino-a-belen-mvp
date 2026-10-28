// Núcleo del MVP: estado del camino, carga de pantallas del lienzo,
// navegación con transiciones y utilidades para «vestir» las pantallas.
import { FILES } from './assets.js';
import { DAYS, RULES, BATTERY_IDS, TEODORO_IDS, IMG, hasTrivia } from './data.js';
import { tabBar } from './tabbar.js';

export const A = id => 'assets/' + (FILES[id] || id);
export const $ = (r, s) => r.querySelector(s);
export const $$ = (r, s) => [...r.querySelectorAll(s)];
export const wait = ms => new Promise(r => setTimeout(r, ms));
export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Estado ----------
const KEY = 'cab-mvp-v2'; // v2: todos empiezan desde cero (antes del 29, sin inscribirse)
export const DEFAULT = () => ({
  tema: 'claro', plan: 'premium', nombre: 'Lucía',
  mascota: true,       // tiene la mascota (tab Teodoro) en Theo; sin ella el camino se abre desde Hoy
  hoy: 0,              // día del calendario: 0 = antes del 29 nov · 1..26 · 27 = 25 dic–6 ene
  inscrito: false,
  completos: {},       // día -> { contenido: true, estrellas: 0..3, trivia: true }
  bateria: 5, panes: 0,
  ruletas: {},         // día -> premio id
  ruletaPendiente: {}, // día -> true si dijo «Más tarde»
  sorpresas: {},       // día -> 'hecha' | 'luego'
  prendas: [], cuartoNuevo: false,
  regreso: false, regresoAvisado: false, teaserVisto: false, sinCaminar: 0, diaGuardado: {}, // diaGuardado: cómo estaba Teodoro cada día (para volver atrás en el panel)
  ultimoJugado: null, // día del calendario en que terminó un contenido
  pasoAnimado: null,   // día recién completado (animación en el mapa)
  forzarPremio: '',    // panel: forzar casilla de la ruleta
  musica: true,        // música de fondo del mapa y la trivia (on/off)
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
export function reset(over = {}) { const keep = { notas: S.notas, huecos: S.huecos, tema: S.tema, vistas: S.vistas, musica: S.musica }; S = Object.assign(DEFAULT(), keep, over); save(); }
export function shareURL() {
  const { notas, huecos, ...rest } = S;
  return location.origin + location.pathname + '#estado=' + btoa(unescape(encodeURIComponent(JSON.stringify(rest)))) + '&pantalla=' + (cur?.name || 'hoy');
}
const subs = new Set();
export const onChange = fn => subs.add(fn);
function emit() { subs.forEach(f => f()); }

// Derivados del estado
export const day = n => DAYS[n];
export const contentDone = n => !!S.completos[n]?.contenido;
/** LA regla del día completo (úsenla todos): vio el contenido y, solo si ese día tiene trivia, la terminó. */
export const isDone = n => hasTrivia(n) ? !!S.completos[n]?.trivia : contentDone(n);
export const dayDone = isDone;
/** Vio el contenido pero le falta la trivia (solo en los días que tienen). */
export const triviaPendiente = n => hasTrivia(n) && contentDone(n) && !S.completos[n]?.trivia;
export const lastDay = () => Math.min(S.hoy, 26);
/** Día que toca jugar: el primero sin terminar hasta hoy. null si ya está todo hecho. */
export function activeDay() {
  if (S.hoy <= 0 || S.hoy > GRACIA_FIN) return null; // antes del 29 aún no empieza; desde el 7 de enero queda como recuerdo
  for (let n = 1; n <= lastDay(); n++) if (!isDone(n)) return n;
  return null;
}
/** Día donde está Teodoro: durante el camino, el día del calendario (aunque la familia vaya atrasada); nunca camina hacia atrás. */
export const teoDay = () => S.hoy <= 0 ? null : S.hoy >= 27 ? (primerSinVer() ?? 26) : Math.min(lastDay(), 26);
/** Después de Nochebuena Teodoro espera donde la familia se quedó: el primer cuento sin ver (o Belén si los vio todos). */
const primerSinVer = () => { for (let n = 1; n <= 26; n++) if (!contentDone(n)) return n; return null; };
/** Día que se propone hacer: el de hoy si falta; si no, el primero pendiente (historia o trivia).
 *  En la gracia (25 dic – 6 ene) se sigue en orden: el primer cuento sin ver. */
export function walkDay() {
  const h = teoDay();
  if (h == null || S.hoy > GRACIA_FIN) return activeDay();
  if (S.hoy >= 27) return primerSinVer() ?? activeDay();
  return isDone(h) ? activeDay() : h;
}
/** 6 de enero (Reyes): último día para terminar el camino; el 25 de diciembre es el 27. */
export const GRACIA_FIN = 39;
/** Cuentos vistos (el check del mapa): lo que cuenta para llegar a Belén. */
export const vistos = () => { let v = 0; for (let n = 1; n <= 26; n++) if (contentDone(n)) v++; return v; };
/** Contador de la gracia: cuánto queda para terminar el camino (contando hoy). Corto para la cabecera del mapa. */
export function cuentaGracia(corto = false) {
  const q = GRACIA_FIN - S.hoy + 1;
  if (q <= 1) return corto ? 'Último día' : 'Último día para llegar a Belén';
  return corto ? `Quedan ${q} días` : `Quedan ${q} días para llegar a Belén`;
}
export const doneCount = () => Object.keys(S.completos).filter(n => +n >= 1 && isDone(+n)).length;
export const pendientes = () => { const a = activeDay(); return a == null || a < 1 ? 0 : lastDay() - a + 1; };
/** Plan: Theo Premium y el Pase de Adviento abren todo; free tiene la entrada y 2 ganchos por semana (domingo y miércoles). */
export const DIAS_GRATIS = new Set([0, 1, 4, 8, 11, 15, 18, 22, 25, 26]);
export const conTodo = () => S.plan !== 'free';
export const puedeDia = n => conTodo() || DIAS_GRATIS.has(n);
export const fase = () => S.hoy <= 0 ? 'antes' : S.hoy <= 26 ? 'camino' : S.hoy <= GRACIA_FIN ? 'gracia' : 'recuerdo';
export const dark = () => S.tema === 'oscuro';
export const stars = n => hasTrivia(n) ? S.completos[n]?.estrellas || 0 : 0; // sin trivia no hay estrellas

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
}
const TAB_OF = { teodoro: 'teodoro', mundos: 'teodoro' };
/** Cambia cualquier barra de pestañas por la estándar, con la pestaña activa correcta. */
function unifyNav(root, name, params = {}) {
  const old = root.querySelector('nav');
  if (!old) return;
  // la barra de Theo (tabbar.js): igual en todas las pantallas y en los dos temas; sin mascota no hay pestaña Teodoro
  const activa = name === 'mundos' && params.from === 'hoy' ? 'hoy' : TAB_OF[name] || 'hoy';
  const nav = tabBar(activa, k => {
    if (k === 'hoy' || k === 'teodoro') go(k, {}, 'none', { tab: true });
    else nota('Fuera de Theo Quest', `«${{ explorar: 'Explorar', musica: 'Música', favoritos: 'Favoritos' }[k]}» ya existe en Theo`);
  }, S.mascota === false);
  old.replaceWith(nav);
  // el indicador de inicio del lienzo sobra: la barra trae el suyo
  [...root.children].filter(el => el.style.width === '134px' && el.style.height === '5px').forEach(e => e.remove());
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

// Historial: para que «volver», «Ahora no» y cerrar regresen a donde estaba la familia
const stack = []; export const _stack = stack;
const TABS = ['hoy', 'teodoro', 'mundos'];
/** Ir a una pantalla. opts.replace: no deja la actual en el historial (pasos automáticos). opts.scrollTop: abre en ese punto del scroll. */
// Pantallas de paso: celebraciones, pasos automáticos y juegos en curso. «Volver» nunca regresa a ellas.
export const DE_PASO = new Set(['completado', 'triviaFin', 'trivia', 'ruletaPop', 'ruletaPremio', 'premioCuarto',
  'memoramaReglas', 'memorama', 'memoramaFin', 'adivinanzaIntro', 'adivinanza', 'adivinanzaTiempo', 'adivinanzaFin',
  'desafioIntro', 'desafio', 'desafioFin', 'juegoPasos', 'juegoCarta', 'juegoFin', 'cerrado', 'calificacion', 'estatica', 'compartir']);
const dePaso = name => DE_PASO.has(name) || (name === 'teaser' && S.inscrito);
export function go(name, params = {}, anim = 'push', opts = {}) {
  if (name === 'teodoro' && S.mascota === false) name = 'hoy'; // sin mascota el camino vive en Hoy
  if (inFlight === name) return busy; // doble toque
  if (cur && !opts.fromBack && !opts.replace && !dePaso(cur.name)) {
    const { thenCerrado, ...keep } = cur.params || {}; // lo de un solo uso no vuelve al regresar
    stack.push({ name: cur.name, params: keep });
    if (stack.length > 60) stack.shift();
  }
  // las pestañas principales empiezan un historial nuevo
  if (TABS.includes(name) && !opts.fromBack && opts.keepStack !== true && opts.tab) stack.length = 0;
  inFlight = name;
  busy = busy.then(() => _go(name, params, anim, opts)).catch(e => { console.error(e); nota('Algo falló al abrir la pantalla', e.message); }).finally(() => { inFlight = null; });
  return busy;
}
/** Volver a la pantalla anterior (o a fallback si no hay historial). Salta las que se indiquen. */
export function back(fallback = 'hoy', anim = 'back', skip = []) {
  let prev = stack.pop();
  while (prev && (skip.includes(prev.name) || prev.name === cur?.name || dePaso(prev.name))) prev = stack.pop();
  if (prev) return go(prev.name, prev.params, anim, { fromBack: true });
  return go(fallback, {}, anim, { fromBack: true });
}
export const clearHistory = () => { stack.length = 0; };
// «Atrás» del sistema (gesto en iPhone, botón en Android, flecha del navegador): hace lo mismo que «Volver».
// Se mantiene siempre una entrada de más en el historial para atraparlo sin salir de la app.
try { history.replaceState({ cab: 0 }, ''); history.pushState({ cab: 1 }, ''); } catch { /* */ }
addEventListener('popstate', () => { try { history.pushState({ cab: 1 }, ''); } catch { /* */ } sysBack(); });
// Escape (teclado) hace lo mismo que el atrás del sistema
addEventListener('keydown', ev => { if (ev.key === 'Escape' && !ev.target.closest?.('#panel')) sysBack(); });
function sysBack() {
  const L = document.querySelector('#viewport .layer:last-child');
  // primero se cierra lo que esté abierto encima (hoja, globo, menú)
  const close = L && [...L.querySelectorAll('[data-dismiss]')].pop();
  if (close) { close.click(); return; }
  // en el mapa: hoja de un día pasado o de la energía → vuelve a la hoja de hoy
  if (L?.classList.contains('ov-page')) { back('hoy', 'down'); return; }
  // pop-up sin cerrar (premio, final de trivia…): «atrás» hace lo mismo que su botón de seguir
  if (L?.classList.contains('overlay')) { L.querySelector('[data-back]')?.click(); return; }
  if (L?.dataset.past != null) { go(cur.name, cur.params, 'none', { replace: true }); return; }
  if (!stack.length && TABS.includes(cur?.name)) return;
  back(TABS.includes(cur?.name) ? cur.name : 'hoy');
}
// Pop-ups de verdad: con 'modal' u 'sheet', la pantalla de abajo sigue montada y quieta;
// encima entran un velo y el diálogo (u hoja). Al cerrar se destapa sin volver a montarla.
const OVERLAY = new Set(['modal', 'sheet', 'page']);
const snap = () => JSON.stringify([S.hoy, S.inscrito, S.completos, S.bateria, S.panes, S.prendas, S.plan, S.cuartoNuevo, S.tema, S.ruletas, S.regreso]);
const sameParams = (a = {}, b = {}) => { const s = ({ thenCerrado, ...x }) => JSON.stringify(x); return s(a) === s(b); };
let inFlight = null;
/** Deja del lienzo solo el velo y el diálogo: lo de antes del velo era un fondo de muestra. */
function asOverlay(layer, root, anim) {
  const kids = [...root.children];
  const isScrim = el => /rgba\(/.test(el.style.background) && el.style.top === '0px' && el.style.bottom === '0px' && el.style.left === '0px' && !el.children.length;
  const i = kids.findIndex(isScrim);
  if (i < 0) return false;
  kids.slice(0, i).forEach(el => el.remove());
  root.style.background = 'transparent'; root.style.backgroundImage = 'none';
  kids.slice(i + 1).filter(el => el.style.top === '0px' && /^\s*9:41/.test(el.textContent)).forEach(el => el.remove());
  const scrim = kids[i]; scrim.classList.add('ov-scrim');
  const dismiss = SCREENS[layer.dataset.screen]?.dismiss;
  if (dismiss) { scrim.dataset.dismiss = ''; scrim.addEventListener('click', () => dismiss()); scrim.style.cursor = 'pointer'; }
  const body = document.createElement('div'); body.className = 'ov-body';
  kids.slice(i + 1).filter(el => el.isConnected).forEach(el => body.appendChild(el));
  root.appendChild(body);
  layer.classList.add('overlay', anim === 'sheet' ? 'ov-sheet' : 'ov-modal');
  return true;
}
function asPage(layer, root) {
  [...root.children].filter(el => el.style.top === '0px' && /^\s*9:41/.test(el.textContent)).forEach(el => el.remove());
  layer.classList.add('overlay', 'ov-page');
  const grab = document.createElement('span'); grab.className = 'page-grab'; grab.setAttribute('aria-hidden', 'true'); layer.appendChild(grab);
  // deslizar hacia abajo desde la parte de arriba la cierra (como «Volver»)
  let y0 = null, dy = 0;
  // (sin capturar el toque si empieza en un botón: la X de arriba tiene que seguir funcionando)
  layer.addEventListener('pointerdown', ev => { if (ev.target.closest?.('a, button, [role=button]')) return; const r = layer.getBoundingClientRect(); const k = r.height / layer.offsetHeight || 1; if ((ev.clientY - r.top) / k < 70) { y0 = ev.clientY; dy = 0; layer.setPointerCapture?.(ev.pointerId); } });
  layer.addEventListener('pointermove', ev => { if (y0 == null) return; const k = layer.getBoundingClientRect().height / layer.offsetHeight || 1; dy = Math.max(0, (ev.clientY - y0) / k); layer.style.animation = 'none'; layer.style.transform = `translateY(${dy}px)`; });
  const end = () => { if (y0 == null) return; y0 = null; layer.style.transition = 'transform .28s cubic-bezier(.32,.72,0,1)'; if (dy > 110) back('hoy', 'down'); else layer.style.transform = ''; setTimeout(() => { layer.style.transition = ''; }, 300); };
  layer.addEventListener('pointerup', end); layer.addEventListener('pointercancel', end);
  return true;
}
function closeOverlay(ov, keepBase) {
  ov.layer.inert = true;
  ov.layer.classList.add('ov-out');
  setTimeout(() => ov.layer.remove(), 260);
  if (keepBase) { ov.base.layer.inert = false; ov.base.layer.classList.remove('under', 'under-page'); }
}
async function _go(name, params, anim, opts = {}) {
  const def = SCREENS[name];
  if (!def) { hueco(`Pantalla «${name}» sin definir`); return; }
  const prev = cur;
  // cerrar un pop-up y volver a la pantalla de abajo tal cual estaba
  // se destapa tal cual solo si nada cambió desde que se dibujó la pantalla de abajo
  if (prev?.base && prev.base.name === name && sameParams(prev.base.params, params) && prev.base.rsnap === snap()) {
    closeOverlay(prev, true); cur = prev.base; history.replaceState(null, '', '#pantalla=' + name); emit(); return;
  }
  const file = typeof def.file === 'function' ? def.file(params) : def.files[dark() ? 1 : 0];
  let markup = await html(file);
  // una pantalla que redibuja su contenido quita antes lo que no usa (en una plantilla inerte: así no se piden sus imágenes)
  if (def.limpiar) { const t = document.createElement('template'); t.innerHTML = markup; def.limpiar(t.content.firstElementChild); markup = t.innerHTML; }
  const layer = document.createElement('div');
  layer.className = 'layer';
  layer.dataset.screen = name;
  layer.innerHTML = '<div class="root">' + markup + '</div>';
  const root = layer.firstElementChild.firstElementChild;
  let h = MAN[file]?.h || 844;
  // 'page': hoja de página (como en iOS): la pantalla entera sube como tarjeta y la de abajo se queda detrás
  // una pantalla del lienzo hecha a pantalla completa puede rearmarse como pop-up antes de montarse
  if (OVERLAY.has(anim) && prev) def.prepare?.(root, params);
  const isOv = OVERLAY.has(anim) && prev && (anim === 'page' ? asPage(layer, root) : asOverlay(layer, root, anim));
  // la pantalla que se va: si era un pop-up, también se va lo que tenía debajo
  const leaving = prev ? (prev.base ? [prev, prev.base] : [prev]) : [];
  cur = { name, layer, params, file };
  if (isOv) { cur.base = prev.base || prev; cur.snap = snap(); }
  // volver a la pantalla de abajo con el estado cambiado: se monta debajo y el pop-up se va encima
  const underOv = !isOv && prev?.base && prev.base.name === name;
  if (underOv) vp().insertBefore(layer, prev.layer); else vp().appendChild(layer);
  unifyNav(root, name, params);
  if (name !== 'estatica') seen(file);
  // la transición no espera las animaciones internas del mount (p. ej. Teodoro caminando): solo lo que pinta la pantalla
  try {
    const m = def.mount?.(root, params, layer);
    if (m?.then) await Promise.race([m.catch(e => { console.error(e); nota('Error en ' + name, e.message); }), new Promise(r => setTimeout(r, 120))]);
  } catch (e) { console.error(e); nota('Error en ' + name, e.message); }
  // algunas mesas del lienzo miden menos que su contenido: la altura real sale del contenido
  // (las que llevan su propio scroll, como el mapa, ya traen su alto exacto: sin aire extra abajo)
  if (!isOv && !def.noScroll && (h > 844 || def.scrollAuto)) {
    const bottom = Math.max(...[...root.children].filter(el => !el.matches('nav, [data-home]') && getComputedStyle(el).position === 'absolute')
      .map(el => (parseFloat(el.style.top) || 0) + el.offsetHeight));
    if (bottom + 110 > h) { h = bottom + 110; root.style.height = h + 'px'; root.style.minHeight = h + 'px'; }
  }
  if (h > 844 && !def.noScroll && !isOv) { layer.classList.add('scroll'); pinBottom(layer, root, h); }
  if (opts.scrollTop && layer.classList.contains('scroll')) layer.scrollTop = opts.scrollTop; // el panel repinta en el mismo punto (antes de la transición: sin salto)
  bindFallback(layer, layer);
  cur.rsnap = snap(); // estado con el que se dibujó
  // el botón de registro dice lo mismo en toda la app (después de conectar los botones)
  root.querySelectorAll('a, button').forEach(el => {
    const tn = [...el.querySelectorAll('*'), el].flatMap(e => [...e.childNodes]).find(c => c.nodeType === 3 && c.nodeValue.trim() === 'Inscribirme');
    if (tn) { tn.nodeValue = tn.nodeValue.replace('Inscribirme', 'Unirme gratis'); if (el.getAttribute('aria-label') === 'Inscribirme') el.setAttribute('aria-label', 'Unirme gratis'); }
  });
  // un título principal por pantalla para el lector de pantalla
  if (def.h1) { const t = textEl(root, def.h1); if (t) { t.setAttribute('role', 'heading'); t.setAttribute('aria-level', '1'); } }
  if (isOv) {
    const base = cur.base;
    if (prev.base) closeOverlay(prev, false); // un pop-up reemplaza a otro
    base.layer.inert = true; base.layer.classList.add('under'); if (anim === 'page') base.layer.classList.add('under-page');
  } else if (prev) {
    const a = reduced() ? 'fade' : (underOv ? 'none' : anim);
    const inC = { push: 'in-push', back: 'in-back', fade: 'in-fade', modal: 'in-modal', sheet: 'in-up', up: 'in-up', down: 'in-under', none: '' }[a];
    const outC = { push: 'out-push', back: 'out-back', fade: 'out-stay', modal: 'out-stay', sheet: 'out-stay', up: 'out-under', down: 'out-down', none: '' }[a];
    if (a === 'back' || a === 'down') prev.layer.style.zIndex = 3;
    inC && layer.classList.add(inC);
    leaving.forEach(l => { l.layer.inert = true; SCREENS[l.name]?.unmount?.(l); });
    if (prev.base) { closeOverlay(prev, false); setTimeout(() => prev.base.layer.remove(), underOv ? 0 : 420); if (!underOv && outC) prev.base.layer.classList.add(outC); }
    else { outC && prev.layer.classList.add(outC); setTimeout(() => prev.layer.remove(), a === 'none' ? 0 : 420); }
  }
  layer.addEventListener('animationend', () => layer.classList.remove('in-push', 'in-back', 'in-fade', 'in-modal', 'in-up', 'in-under'), { once: true });
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
/** Racha de la app: la que traía en Theo (3) + los días seguidos del camino; si se saltó días, cuenta desde el último hueco. */
export function racha() {
  if (S.hoy < 1) return 3;
  let r = 0, roto = false;
  for (let d = Math.min(S.hoy, 26); d >= 1; d--) {
    if (S.completos[d]?.contenido) r++;
    else if (d === S.hoy) continue; // hoy todavía puede caminar
    else { roto = true; break; }
  }
  return roto ? r : 3 + r;
}
export function teodoroImg(level = S.bateria) { return A(TEODORO_IDS[level]); }

// ---------- Avisos y huecos ----------
let tT;
export function toast(msg, sub = '', kind = '') {
  const t = document.getElementById('toast');
  t.classList.remove('on');
  t.innerHTML = msg + (sub ? `<small>${sub}</small>` : '');
  const L = document.querySelector('#viewport .layer:last-child');
  t.className = (kind ? kind + ' ' : '') + (L?.querySelector('nav') ? '' : 'top');
  t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite');
  void t.offsetWidth; t.classList.add('on');
  clearTimeout(tT); tT = setTimeout(() => t.classList.remove('on'), 2600);
}
/** Nota para el equipo (lo que en la app real ya existe o se simula). */
export const nota = (msg, sub = '') => toast(msg, sub, 'nota');
/** Algo que se tocó y no tiene diseño ni regla todavía: se avisa y se apunta en «Huecos». */
export function hueco(label, el) {
  const where = cur?.name || '—';
  if (el) { el.classList.add('hueco-ring'); setTimeout(() => el.classList.remove('hueco-ring'), 1400); }
  nota('Aún sin diseño', label);
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
    setTimeout(() => c.remove(), 1800);
  }
}
export function animate(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

export { RULES, DAYS };
