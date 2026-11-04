// Teodoro animado con Lottie (secuencias de dibujos): camina por el mapa al llegar un día nuevo y celebra, en bucle, donde ya celebraba.
// lottie-web 5.12.2 (versión light, solo SVG) se carga la primera vez que hace falta.
import { $$, reduced } from './core.js';

const LIB = 'vendor/lottie_light.min.js';
// el lienzo de cada animación y lo que mide Teodoro de pie dentro de él (los pies tocan el borde de abajo)
export const CAMINA = { nombre: 'teo-caminando', w: 324, h: 600, pie: 592 }; // mira a la derecha: hacia la izquierda se voltea
export const CELEBRA = { nombre: 'teo-celebra', w: 875, h: 1522, pie: 1167 }; // recortado a Teodoro con sus saltos, centrado en él de pie

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

/** Una caja con Teodoro animado: los pies en (cx, pies) y «alto» lo que mide él de pie. Devuelve { caja, anim } ya pintado, o null. */
export async function teoAnimado(padre, anim, { cx, pies, alto, loop = true, clase = '' }) {
  try {
    const [L, t] = await Promise.all([cargarLib(), texto(anim.nombre)]);
    const h = alto * anim.h / anim.pie, w = h * anim.w / anim.h;
    const caja = document.createElement('div'); caja.className = `teo-anim ${clase}`.trim(); caja.setAttribute('aria-hidden', 'true');
    caja.style.cssText = `left:${cx - w / 2}px;top:${pies - h}px;width:${w}px;height:${h}px;opacity:0`;
    padre.append(caja);
    const a = L.loadAnimation({ container: caja, renderer: 'svg', loop, autoplay: true, animationData: JSON.parse(t), rendererSettings: { preserveAspectRatio: 'xMidYMax meet' } });
    await new Promise(ok => a.isLoaded ? ok() : a.addEventListener('DOMLoaded', ok));
    if (!caja.isConnected) { a.destroy(); return null; }
    caja.style.opacity = '';
    return { caja, anim: a };
  } catch (e) { console.warn('animación', anim.nombre, e); return null; }
}

/** Cambia el Teodoro quieto que celebra (alt «Teodoro celebra…») por el que salta, en bucle: mismos pies y mismo alto de pie.
 *  El dibujo quieto llena el alto de su caja y apoya los pies abajo. */
export function celebrar(root, cual = img => /^Teodoro celebra/.test(img.alt || '')) {
  if (reduced()) return;
  $$(root, 'img').filter(i => cual(i) && i.offsetParent && i.offsetHeight).forEach(async img => {
    const P = img.offsetParent; // las medidas offset* son respecto a él
    const r = await teoAnimado(P, CELEBRA, { cx: img.offsetLeft + img.offsetWidth / 2, pies: img.offsetTop + img.offsetHeight, alto: img.offsetHeight * .96 });
    if (!r) return;
    r.caja.style.filter = img.style.filter; r.caja.setAttribute('role', 'img'); r.caja.setAttribute('aria-label', img.alt); r.caja.removeAttribute('aria-hidden');
    if (img.parentElement === P) img.after(r.caja); // queda en el mismo orden que la imagen (lo que la tapaba la sigue tapando)
    img.style.visibility = 'hidden';
  });
}
