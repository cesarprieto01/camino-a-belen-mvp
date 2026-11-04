// Teodoro animado con Lottie (secuencias de dibujos): camina por el mapa al llegar un día nuevo, celebra en bucle donde ya celebraba
// y piensa con su mapa donde estaba ese dibujo; en la trivia, al fallar, pasa del mapa al farol con una transición.
// lottie-web 5.12.2 (versión light, solo SVG) se carga la primera vez que hace falta.
import { $$, reduced } from './core.js';
import { IMG } from './data.js';

const LIB = 'vendor/lottie_light.min.js';
// el lienzo de cada animación y lo que mide Teodoro de pie dentro de él (los pies tocan el borde de abajo)
export const CAMINA = { nombre: 'teo-caminando', w: 324, h: 600, pie: 592 }; // mira a la derecha: hacia la izquierda se voltea
export const CELEBRA = { nombre: 'teo-celebra', w: 875, h: 1522, pie: 1167 }; // recortado a Teodoro con sus saltos, centrado en él de pie
// con su mapa, pensando: el mismo dibujo que IMG.tPregunta. «salidas»: tramos [desde, hasta) del bucle con la pose donde empieza la transición
export const MAPA = { nombre: 'teo-mapa', w: 292, h: 482, pie: 472, salidas: [[0, 29], [114, 121]] };
// encadenadas con el mapa en la trivia: cada una salió con su propio recorte, así que llevan dónde quedan los pies de Teodoro
// («x», «suelo») y lo que mide de pie, medidos superponiendo los cuadros donde se unen
export const MAPA_A_FAROL = { nombre: 'teo-mapa-a-farol', w: 434, h: 600, pie: 587.5, x: 271.7, suelo: 593.9 }; // guarda el mapa y saca el farol (1,5 s)
export const FAROL = { nombre: 'teo-farol', w: 294, h: 393, pie: 386.3, x: 190.5, suelo: 389.2 }; // con el farol, animando (bucle de 5 s)

let lib = null;
const textos = {};
function cargarLib() {
  lib ??= new Promise((ok, mal) => {
    if (window.lottie) return ok(window.lottie);
    const s = document.createElement('script'); s.src = LIB;
    s.onload = () => ok(window.lottie); s.onerror = () => { lib = null; mal(new Error('lottie')); };
    document.head.append(s);
  });
  return lib;
}
// se guarda el texto y se convierte en cada uso: lottie-web modifica los datos que recibe
const texto = nombre => (textos[nombre] ??= fetch(`anim/${nombre}.json`).then(r => r.ok ? r.text() : Promise.reject(new Error(nombre))).catch(e => { delete textos[nombre]; throw e; }));
/** Baja la librería y la animación antes de usarlas (el paso del mapa no espera). */
export const precargar = anim => Promise.all([cargarLib(), texto(anim.nombre)]).catch(() => {});

/** Una caja con Teodoro animado: los pies en (cx, pies) y «alto» lo que mide él de pie. Devuelve { caja, anim } ya pintado, o null.
 *  Sin «autoplay» queda cargada e invisible, lista para mostrarla y darle play. */
export async function teoAnimado(padre, anim, { cx, pies, alto, loop = true, clase = '', autoplay = true }) {
  try {
    const [L, t] = await Promise.all([cargarLib(), texto(anim.nombre)]);
    const k = alto / anim.pie, w = anim.w * k, h = anim.h * k; // por defecto Teodoro va centrado con los pies en el borde de abajo
    const caja = document.createElement('div'); caja.className = `teo-anim ${clase}`.trim(); caja.setAttribute('aria-hidden', 'true');
    caja.style.cssText = `left:${cx - (anim.x ?? anim.w / 2) * k}px;top:${pies - (anim.suelo ?? anim.h) * k}px;width:${w}px;height:${h}px;opacity:0`;
    padre.append(caja);
    const a = L.loadAnimation({ container: caja, renderer: 'svg', loop, autoplay, animationData: JSON.parse(t), rendererSettings: { preserveAspectRatio: 'xMidYMax meet' } });
    await new Promise(ok => a.isLoaded ? ok() : a.addEventListener('DOMLoaded', ok));
    if (!caja.isConnected) { a.destroy(); return null; }
    if (autoplay) caja.style.opacity = '';
    return { caja, anim: a };
  } catch (e) { console.warn('animación', anim.nombre, e); return null; }
}

// lo que hay encima de cada dibujo quieto: la animación que se ve («actual»), todas las cargadas, dónde va, su estilo
// y el bucle en el que está (o al que va), para encadenarlas o quitarlas
const encima = new WeakMap();
const fuera = (e, r) => { if (!e.todas.delete(r)) return; r.anim.destroy(); r.caja.remove(); };
/** Pone la animación en bucle encima del dibujo quieto (mismos pies y mismo alto de pie) y lo esconde.
 *  El dibujo llena el alto de su caja y apoya los pies abajo. «sigue» dice si el dibujo es el mismo cuando la animación termina de cargar. */
async function sobreDibujo(img, anim, { alto = 1, dx = 0, estilo = { filter: img.style.filter }, sigue = () => true } = {}) {
  const P = img.offsetParent; // las medidas offset* son respecto a él
  const donde = { cx: img.offsetLeft + img.offsetWidth / 2 + dx, pies: img.offsetTop + img.offsetHeight, alto: img.offsetHeight * alto };
  const r = await teoAnimado(P, anim, donde);
  if (!r) return;
  if (!sigue()) { r.anim.destroy(); r.caja.remove(); return; }
  Object.assign(r.caja.style, estilo);
  if (img.alt) { r.caja.setAttribute('role', 'img'); r.caja.setAttribute('aria-label', img.alt); r.caja.removeAttribute('aria-hidden'); }
  if (img.parentElement === P) img.after(r.caja); // queda en el mismo orden que la imagen (lo que la tapaba la sigue tapando)
  img.style.visibility = 'hidden';
  encima.set(img, { actual: r, todas: new Set([r]), donde, estilo, bucle: anim });
}
/** Quita las animaciones de encima del dibujo y lo vuelve a mostrar (la trivia cambia a Teodoro al acertar). */
export function quieto(img) {
  const e = encima.get(img); if (!e) return;
  encima.delete(img); [...e.todas].forEach(r => fuera(e, r));
  img.style.visibility = '';
}
/** ¿Lo que hay sobre el dibujo es este bucle (o va hacia él)? */
export const animadoCon = (img, bucle) => encima.get(img)?.bucle === bucle;

/** Teodoro cambia de estado donde está su animación: la transición una vez y después el bucle nuevo, sin saltos porque
 *  empiezan y terminan en la misma pose. Sale del bucle de ahora en una de sus «salidas»: si está en una, ya; si la próxima
 *  está a 0,25 s o menos, la espera; si no, funde 0,12 s. Si algo no carga, queda el dibujo quieto. */
export async function pasarA(img, transicion, bucle) {
  const e = encima.get(img); if (!e) return;
  const antes = e.actual, de = e.bucle; e.bucle = bucle;
  const P = antes.caja.parentElement;
  const nueva = async (anim, loop) => {
    const r = await teoAnimado(P, anim, { ...e.donde, loop, autoplay: false });
    if (!r) return null;
    if (encima.get(img) !== e) { r.anim.destroy(); r.caja.remove(); return null; }
    Object.assign(r.caja.style, e.estilo); antes.caja.before(r.caja); e.todas.add(r); // debajo de la que se va, para el fundido
    return r;
  };
  const tP = nueva(transicion, false), bP = nueva(bucle, true); // el bucle carga mientras corre la transición
  const t = await tP;
  if (encima.get(img) !== e) return;
  if (!t) { quieto(img); return; }
  const a = antes.anim, n = a.totalFrames, fr = a.currentFrame, s = de.salidas || [[0, 1]];
  const ya = s.some(([desde, hasta]) => fr >= desde && fr < hasta);
  const falta = ya ? 0 : Math.min(...s.map(([desde]) => (desde - fr + n) % n)) / a.frameRate;
  const espera = !ya && falta <= .25;
  if (espera) await new Promise(ok => setTimeout(ok, falta * 1000));
  if (encima.get(img) !== e) return;
  t.caja.style.opacity = ''; t.anim.goToAndPlay(0, true);
  antes.caja.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ya || espera ? 80 : 120, easing: 'ease-out' }).finished.then(() => fuera(e, antes), () => fuera(e, antes));
  e.actual = t;
  await new Promise(ok => t.anim.addEventListener('complete', ok));
  const b = await bP;
  if (encima.get(img) !== e) return;
  if (!b) { quieto(img); return; }
  b.caja.style.opacity = ''; b.anim.goToAndPlay(0, true);
  fuera(e, t); e.actual = b;
}

/** Cambia el Teodoro quieto que celebra (alt «Teodoro celebra…») por el que salta, en bucle: mismos pies y mismo alto de pie. */
export function celebrar(root, cual = img => /^Teodoro celebra/.test(img.alt || '')) {
  if (reduced()) return;
  $$(root, 'img').filter(i => cual(i) && i.offsetParent && i.offsetHeight).forEach(img => sobreDibujo(img, CELEBRA, { alto: .96 }));
}

/** Cambia a Teodoro con su mapa, pensando (IMG.tPregunta), por el que se mueve en bucle: trivia, «¿Jugamos?», el juego del teléfono
 *  y el póster de Nochebuena. Copia la sombra, el brillo y la capa del dibujo; el póster lo centra con translateX(-50%). */
export function pensar(root) {
  if (reduced()) return;
  const es = img => img.src.includes(IMG.tPregunta);
  $$(root, 'img').filter(i => es(i) && i.offsetParent).forEach(async img => {
    await img.decode().catch(() => {}); // el póster saca el ancho de la imagen
    if (!img.offsetHeight || encima.has(img) || !es(img)) return;
    const cs = getComputedStyle(img);
    sobreDibujo(img, MAPA, { dx: cs.transform === 'none' ? 0 : new DOMMatrix(cs.transform).e, estilo: { filter: cs.filter, zIndex: cs.zIndex }, sigue: () => es(img) && img.isConnected });
  });
}
