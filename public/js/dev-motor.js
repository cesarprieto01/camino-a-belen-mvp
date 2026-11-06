// Modo developer · motor (solo prototipo): qué capa hay bajo el cursor, sus medidas en pt, colores, texto, assets y descargas.
// El teléfono es un #viewport de 390 × 844 escalado con --s: 1 px del viewport = 1 pt de la app.
import { MAPA, MAPA_PIENSA, FAROL, FESTEJA, CAMINA, CELEBRA, MAPA_A_FAROL, FAROL_A_MAPA, MAPA_A_FESTEJA, FAROL_A_FESTEJA, FESTEJA_A_MAPA } from './teo-anim.js';

export const VP = () => document.getElementById('viewport');
export const capaArriba = () => [...(VP()?.querySelectorAll(':scope > .layer') || [])].pop() || null;
const escala = () => VP().getBoundingClientRect().width / 390;

// ---------- Qué es una capa ----------
const TEXTO = el => [...el.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim());
// lo que no es de Adviento (la barra de pestañas y lo de Theo en Hoy, Teodoro y Mundos) no existe para el modo developer
let FUERA = '.theo-tabbar';
export const ponerFuera = (sels = []) => { FUERA = ['.theo-tabbar', ...sels].join(', '); };
// la barra de estado del iPhone (9:41, señal, batería) es del teléfono simulado, no de la app
const barraEstado = el => { for (let e = el, i = 0; e && i < 5; e = e.parentElement, i++) if (e.style?.top === '0px' && e.offsetHeight <= 60 && /^\s*9:41/.test(e.textContent)) return true; return false; };
export const esFuera = el => { try { return !!el.closest(FUERA) || barraEstado(el); } catch { return false; } };
const transparente = c => !c || c === 'transparent' || /rgba\([^)]*,\s*0\)$/.test(c);
/** Lo que un developer reconoce como capa: imagen, ícono, animación, botón, texto o un contenedor que se ve (fondo, borde, sombra). */
export function esCapa(el) {
  if (!(el instanceof Element) || el.closest('#dev-ov') || esFuera(el)) return false;
  if (el.matches('img, svg, video, canvas, .teo-anim, button, a, [role=button], [role=img], input, textarea, select')) return true;
  if (TEXTO(el)) return true;
  const cs = getComputedStyle(el);
  return cs.backgroundImage !== 'none' || !transparente(cs.backgroundColor) || parseFloat(cs.borderTopWidth) > 0 || cs.boxShadow !== 'none';
}
// dentro de un SVG o de una animación, la capa es el todo
const normaliza = el => el.closest('.teo-anim') || (el instanceof SVGElement ? el.closest('svg:not(svg svg)') || el : el);
export const visible = el => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && +cs.opacity > 0.02; };

// un contenedor «tapa» lo de abajo si tiene un fondo sólido o una imagen; un degradado o un borde dejan ver
const tapa = el => { const cs = getComputedStyle(el), c = color(cs.backgroundColor); return (c && c.alfa > .85) || /url\(/.test(cs.backgroundImage); };
/** Todas las capas bajo el punto, de la de arriba a la de abajo (sin repetir) */
export function capasEn(x, y) {
  const top = capaArriba(), out = []; if (!top) return out;
  for (const el of document.elementsFromPoint(x, y)) {
    if (!top.contains(el) || el === top) continue;
    if (esFuera(el)) { if (!out.length) return out; continue; } // lo de arriba no es de Adviento: no se elige lo de debajo
    let e = normaliza(el);
    while (e && e !== top && !esCapa(e)) e = e.parentElement;
    if (e && e !== top && !e.matches('.root, .ov-body') && !out.includes(e)) out.push(e);
  }
  return out;
}
/** La capa que un developer espera al hacer clic: la más alta con algo propio; si encima hay un contenedor
 *  transparente (un degradado, un envoltorio), lo que se ve debajo. */
export function capaEn(x, y) {
  const lista = capasEn(x, y).filter(visible);
  if (lista.some(esFuera)) return null;
  let reserva = null;
  for (const e of lista) {
    if (tipo(e) !== 'caja' || tapa(e)) return e;
    reserva ??= e;
  }
  return reserva;
}
/** Hijos que son capas (salta los envoltorios que no se ven). */
export function hijosCapa(el) {
  const out = [];
  for (const h of el.children) {
    if (h.closest('#dev-ov') || h.matches('script, style, template') || esFuera(h)) continue;
    if (h.matches('.teo-anim') || h instanceof SVGElement) { if (visible(h)) out.push(h); continue; }
    if (esCapa(h) && visible(h)) out.push(h); else if (visible(h) || getComputedStyle(h).display === 'contents') out.push(...hijosCapa(h));
  }
  return out;
}
/** La capa padre (el contenedor visible más cercano); null si ya es la pantalla. */
export function padreCapa(el) {
  const top = capaArriba(); let e = el.parentElement;
  while (e && e !== top && !(esCapa(e) && visible(e))) e = e.parentElement;
  return e && e !== top && !e.matches('.root, .ov-body') ? e : null;
}

// ---------- Medidas ----------
/** Caja en pt relativa al viewport (lo que se ve) */
export function cajaVista(el) { const v = VP().getBoundingClientRect(), r = el.getBoundingClientRect(), s = escala(); return { x: (r.left - v.left) / s, y: (r.top - v.top) / s, w: r.width / s, h: r.height / s }; }
/** Caja en pt relativa a la pantalla (con su scroll), como se diseñó */
export function cajaPantalla(el) {
  const raiz = capaArriba()?.querySelector('.root') || capaArriba(), v = raiz.getBoundingClientRect(), r = el.getBoundingClientRect(), s = escala();
  return { x: (r.left - v.left) / s, y: (r.top - v.top) / s, w: r.width / s, h: r.height / s };
}
/** Medida en pt, redondeada a 0.5 y con punto: se copia tal cual a Swift */
export const pt = n => String(Math.round(n * 2) / 2);

// ---------- Colores ----------
const TOKENS = ['ink', 'teal', 'honey', 'gold', 'mist', 'muted', 'line', 'card', 'bg', 'night', 'slate', 'cream', 'chip', 'chip-ink'];
let mapaTokens = null;
const hexDe = (r, g, b) => '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
/** «rgb(…)» → { hex, alfa } */
export function color(c) {
  const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return null;
  const [r, g, b, a = 1] = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
  return { hex: hexDe(r, g, b), alfa: +a };
}
/** Nombre del token de la app si el color es uno de ellos (y solo uno: #0B748A es «ink» y «chip-ink», así que ahí va solo el hex) */
export function token(hex) {
  if (!mapaTokens) {
    mapaTokens = {}; const cs = getComputedStyle(document.documentElement);
    TOKENS.forEach(t => { const v = cs.getPropertyValue('--' + t).trim().toUpperCase(); if (/^#[0-9A-F]{6}$/.test(v)) mapaTokens[v] = v in mapaTokens ? '' : t; });
  }
  return mapaTokens[hex] || '';
}
// ---------- Valores en SwiftUI (para «Copiar como SwiftUI») ----------
const n3 = v => +(+v).toFixed(3);
export const swiftColor = c => !c ? '' : `Color(red: ${n3(parseInt(c.hex.slice(1, 3), 16) / 255)}, green: ${n3(parseInt(c.hex.slice(3, 5), 16) / 255)}, blue: ${n3(parseInt(c.hex.slice(5, 7), 16) / 255)})${c.alfa < 1 ? `.opacity(${n3(c.alfa)})` : ''}`;
const NOMBRE_PESO = { 100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black' };
/** Nombre PostScript de la fuente (Mulish 800 → Mulish-ExtraBold) */
export const postscript = (familia, peso) => `${familia.replace(/\s+/g, '')}-${NOMBRE_PESO[peso] || 'Regular'}`;
export const swiftFuente = fu => `.font(.custom("${postscript(fu.familia, fu.peso)}", size: ${n3(fu.tam)}))`;
/** «rgba(0, 8, 43, 0.15) 0px 2px 6px 0px» → .shadow(…): el blur de CSS es el doble del radio de SwiftUI */
export function swiftSombra(s) {
  const m = String(s).match(/(rgba?\([^)]+\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px/); if (!m) return '';
  return `.shadow(color: ${swiftColor(color(m[1]))}, radius: ${n3(m[4] / 2)}, x: ${n3(m[2])}, y: ${n3(m[3])})`;
}
export const reiniciarTokens = () => { mapaTokens = null; }; // al cambiar de tema
const coloresDe = s => [...String(s).matchAll(/rgba?\([^)]+\)/g)].map(m => color(m[0])).filter(Boolean);

// ---------- Ficha de una capa ----------
const TIPOS = { img: 'Imagen', svg: 'Ícono', anim: 'Animación', texto: 'Texto', boton: 'Botón', caja: 'Contenedor' };
export function tipo(el) {
  if (el.matches('.teo-anim')) return 'anim';
  if (el.matches('img')) return 'img';
  if (el instanceof SVGElement) return 'svg';
  if (el.matches('button, a, [role=button]')) return 'boton';
  if (TEXTO(el) && !getComputedStyle(el).backgroundImage.includes('url(')) return 'texto';
  return 'caja';
}
export const nombreTipo = t => TIPOS[t];
const ruta = src => { try { return decodeURIComponent(new URL(src, location.href).pathname.replace(/^\/+/, '')); } catch { return src; } };
/** Los assets que usa la capa: imagen, fondos con url(), Lottie */
export function assetsDe(el) {
  const out = [];
  if (el.matches('img') && el.currentSrc) out.push({ ruta: ruta(el.currentSrc), tipo: 'imagen', el });
  if (el.matches('.teo-anim') && el.dataset.anim) {
    out.push({ ruta: `anim/${el.dataset.anim}.json`, tipo: 'lottie', el });
    // el dibujo quieto que la animación tapa: la app lo muestra sin animación (movimiento reducido) o mientras carga
    const quieto = el.previousElementSibling;
    if (quieto?.matches('img') && quieto.currentSrc) out.push({ ruta: ruta(quieto.currentSrc), tipo: 'imagen', el: quieto, quieto: true });
  }
  const bg = getComputedStyle(el).backgroundImage;
  [...bg.matchAll(/url\("?([^")]+)"?\)/g)].forEach(m => out.push({ ruta: ruta(m[1]), tipo: 'fondo', el }));
  if (el instanceof SVGSVGElement) out.push({ ruta: null, tipo: 'svg', el });
  return out;
}
/** Todo lo que se puede leer de una capa, en pt */
export function ficha(el) {
  const cs = getComputedStyle(el), t = tipo(el), c = cajaPantalla(el);
  const texto = TEXTO(el) || (t === 'boton' && el.textContent.trim()) ? el.textContent.trim().replace(/\s+/g, ' ') : '';
  const fondo = cs.backgroundImage !== 'none' && !cs.backgroundImage.startsWith('url(') ? { degradado: cs.backgroundImage, colores: coloresDe(cs.backgroundImage) } : null;
  const relleno = !transparente(cs.backgroundColor) ? color(cs.backgroundColor) : null;
  const bw = parseFloat(cs.borderTopWidth);
  return {
    el, tipo: t, nombre: nombreDe(el, t),
    x: c.x, y: c.y, w: c.w, h: c.h,
    radio: cs.borderRadius === '0px' ? '' : cs.borderRadius.split(' ').map(v => v.endsWith('%') ? v : pt(parseFloat(v))).join(' '),
    opacidad: +cs.opacity < 1 ? Math.round(+cs.opacity * 100) + ' %' : '',
    relleno, fondo,
    borde: bw > 0 ? { ancho: bw, color: color(cs.borderTopColor), estilo: cs.borderTopStyle } : null,
    sombra: cs.boxShadow !== 'none' ? cs.boxShadow : '',
    desenfoque: cs.backdropFilter && cs.backdropFilter !== 'none' ? cs.backdropFilter : '',
    texto, fuente: texto ? { familia: cs.fontFamily.split(',')[0].replace(/["']/g, '').trim(), peso: cs.fontWeight, tam: parseFloat(cs.fontSize), alto: cs.lineHeight === 'normal' ? null : parseFloat(cs.lineHeight), tracking: cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing), color: color(cs.color), alin: cs.textAlign } : null,
    iconoColor: t === 'svg' ? color(cs.color) : null,
    assets: assetsDe(el),
  };
}
export function nombreDe(el, t = tipo(el)) {
  // un ícono sin nombre propio toma el del botón que lo lleva («Escuchar», «Salir de la trivia»)
  const del = t === 'svg' || t === 'img' ? el.closest('button, a, [role=button]') : null;
  const n = el.getAttribute('aria-label') || el.getAttribute('alt') || (t === 'anim' ? el.dataset.anim : '') || (t !== 'caja' && t !== 'svg' && t !== 'img' ? el.textContent.trim().replace(/\s+/g, ' ') : '') || el.getAttribute('title') || del?.getAttribute('aria-label') || del?.textContent.trim().replace(/\s+/g, ' ') || '';
  const corto = n.length > 28 && n.includes('.') ? n.slice(0, n.indexOf('.')) : n; // «Música de fondo activada. Toca para…» → «Música de fondo activada»
  return corto.slice(0, 60) || nombreTipo(t);
}

// ---------- Lottie ----------
const DESC = Object.fromEntries([MAPA, MAPA_PIENSA, FAROL, FESTEJA, CAMINA, CELEBRA, MAPA_A_FAROL, FAROL_A_MAPA, MAPA_A_FESTEJA, FAROL_A_FESTEJA, FESTEJA_A_MAPA].map(d => [d.nombre, d]));
export const descLottie = nombre => DESC[nombre] || null;
export function lottieInfo(el) {
  const a = window.lottie?.getRegisteredAnimations().find(x => x.wrapper === el);
  if (!a) return null;
  const d = a.animationData || {};
  return { fps: d.fr, cuadros: d.op - d.ip, w: d.w, h: d.h, segundos: (d.op - d.ip) / d.fr, enBucle: !!a.loop, cuadro: Math.round(a.currentFrame) };
}

// ---------- Código ----------
/** Un punto de partida en SwiftUI (sin extensiones: Color(red:green:blue:) y nombres PostScript de las fuentes) */
export function swift(f, nombreAsset) {
  const fr = `.frame(width: ${pt(f.w).replace(',', '.')}, height: ${pt(f.h).replace(',', '.')})`;
  if (f.tipo === 'anim') return `LottieView(animation: .named("${f.el.dataset.anim}"))\n    .playing(loopMode: .loop)\n    ${fr}`;
  if (f.tipo === 'img') return `Image("${nombreAsset || 'imagen'}")\n    .resizable()\n    .scaledToFit()\n    ${fr}`;
  if (f.tipo === 'svg') return `Image("${nombreAsset || 'icono'}")\n    .renderingMode(.template)\n    .foregroundStyle(${swiftColor(f.iconoColor)})\n    ${fr}`;
  const lineas = [];
  if (f.texto) {
    const fu = f.fuente;
    lineas.push(`Text("${f.texto.replace(/"/g, '\\"')}")`, `    ${swiftFuente(fu)}`, `    .foregroundStyle(${swiftColor(fu.color)})`);
    if (fu.alto) lineas.push(`    .lineSpacing(${pt(Math.max(0, fu.alto - fu.tam)).replace(',', '.')})`);
    if (fu.tracking) lineas.push(`    .tracking(${pt(fu.tracking).replace(',', '.')})`);
    if (f.relleno || f.borde || f.radio) lineas.push(`    ${fr}`);
  }
  if (f.relleno || f.borde || f.radio || !f.texto) {
    const r = parseFloat(String(f.radio).replace(',', '.')) || 0;
    const forma = r ? `RoundedRectangle(cornerRadius: ${String(r)}, style: .continuous)` : 'Rectangle()';
    if (f.texto) lineas.push(`    .background(${forma}.fill(${swiftColor(f.relleno) || 'Color.clear'}))`);
    else lineas.push(`${forma}`, `    .fill(${swiftColor(f.relleno) || 'Color.clear'})`, `    ${fr}`);
    if (f.borde) lineas.push(`    .overlay(${forma}.stroke(${swiftColor(f.borde.color)}, lineWidth: ${pt(f.borde.ancho).replace(',', '.')}))`);
  }
  return lineas.join('\n');
}

// ---------- Descargas ----------
export function bajar(blob, nombre) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
export const traer = async r => { const res = await fetch(r); if (!res.ok) throw new Error(r); return res.blob(); };
const cargarImagen = src => new Promise((ok, mal) => { const im = new Image(); im.onload = () => ok(im); im.onerror = mal; im.src = src; });
/** PNG a la escala pedida para un tamaño en pt; si el original no alcanza, sale a su tamaño (sin estirarla) */
export async function png(src, ptW, ptH, k) {
  const im = await cargarImagen(src);
  const ancho = Math.round(ptW * k), alto = Math.round((ptH || ptW * im.naturalHeight / im.naturalWidth) * k);
  const corto = ancho > im.naturalWidth * 1.02;
  const w = corto ? im.naturalWidth : ancho, h = corto ? im.naturalHeight : alto;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const x = cv.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, 0, w, h);
  return { blob: await new Promise(ok => cv.toBlob(ok, 'image/png')), w, h, corto };
}
/** El SVG tal como se ve (currentColor resuelto) */
export function svgTexto(el) {
  const c = el.cloneNode(true), col = getComputedStyle(el).color;
  c.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  if (!c.getAttribute('viewBox')) c.setAttribute('viewBox', `0 0 ${el.getBoundingClientRect().width} ${el.getBoundingClientRect().height}`);
  c.removeAttribute('style'); c.removeAttribute('class');
  return new XMLSerializer().serializeToString(c).replace(/currentColor/g, col);
}

// ---------- Piezas de diseño: una card que se entrega como una sola imagen ----------
// Un contenedor con marco (esquinas, borde o sombra) y arte adentro sale en un PNG con todo lo suyo: el developer la pone como imagen.
// No va en la imagen lo que se arma en código: un botón de texto o de ícono y el vidrio (en iOS es un material; una imagen no lo copia).
// No se une lo que es casi todo texto, lo que ocupa media pantalla o más, lo que es de vidrio (el día del mapa), lo que lleva algo
// que se mueve por su cuenta (un Lottie, una animación en bucle) o un dibujo a mano (el vidrio que se limpia con el dedo) ni lo
// marcado «por capas» (Mundos: las islas y su card se animan por separado).
const POR_CAPAS = '.mundos-v';
const CONTROL = 'button, a, [role=button], input, select, textarea';
const conMarco = cs => parseFloat(cs.borderTopLeftRadius) > 0 || parseFloat(cs.borderTopWidth) > 0 || cs.boxShadow !== 'none';
const vidrio = e => { const cs = getComputedStyle(e); return [cs.backdropFilter, cs.webkitBackdropFilter].some(v => v && v !== 'none'); };
/** Lo de adentro de la card que no va en su imagen: se arma en código (un botón con arte sí va) */
export const vaEnCodigo = (e, raiz) => e !== raiz && ((e.matches(CONTROL) && !e.querySelector('img')) || vidrio(e));
const fueraDeLaImagen = (e, raiz) => vaEnCodigo(e, raiz) || e.matches('#dev-ov, script, style') || esFuera(e);
const apartado = (x, raiz) => { for (let e = x; e && e !== raiz; e = e.parentElement) if (fueraDeLaImagen(e, raiz)) return true; return false; };
export function textoFijo(el) {
  let t = ''; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) if (!apartado(n.parentElement, el)) t += n.nodeValue;
  return t.replace(/\s+/g, ' ').trim();
}
const seMueve = el => !!el.querySelector('.teo-anim') || el.getAnimations({ subtree: true }).some(a => a.effect?.target !== el && a.effect?.getComputedTiming().iterations === Infinity);
export function esPieza(el) {
  if (!(el instanceof HTMLElement) || el.matches('.teo-anim, .root, .ov-body') || esFuera(el) || el.closest(POR_CAPAS) || !visible(el)) return false;
  const c = cajaVista(el);
  if (c.w < 48 || c.h < 48 || c.w * c.h > 390 * 844 * .5) return false;
  const cs = getComputedStyle(el);
  if (!conMarco(cs) || vidrio(el)) return false;
  const arte = el.matches('img') || /url\(/.test(cs.backgroundImage) || [...el.querySelectorAll('*')].some(x => (x.matches('img') || /url\(/.test(getComputedStyle(x).backgroundImage)) && visible(x) && !apartado(x, el));
  return arte && textoFijo(el).length <= 40 && !seMueve(el) && !el.querySelector('canvas');
}
/** La pieza que contiene a la capa (ella misma o la más cercana hacia arriba) */
export function piezaDe(el) { for (let e = el; e && e !== capaArriba(); e = e.parentElement) if (esPieza(e)) return e; return null; }
/** El giro de la pieza en grados (rotate del CSS) */
export const giroDe = el => { const m = new DOMMatrix(getComputedStyle(el).transform); return Math.round(Math.atan2(m.b, m.a) * 180 / Math.PI * 10) / 10; };

let h2i = null;
const libreria = () => h2i ??= new Promise((ok, mal) => {
  if (window.htmlToImage) return ok(window.htmlToImage);
  const s = document.createElement('script'); s.src = 'vendor/html-to-image.min.js'; s.onload = () => ok(window.htmlToImage); s.onerror = mal; document.head.append(s);
});
// fuentes: solo las que usa la pieza, y de Google solo el subconjunto latino (la librería bajaría todas las variantes)
const hojas = new Map(), datosFuente = new Map();
const hoja = href => { if (!hojas.has(href)) hojas.set(href, fetch(href).then(r => r.text()).catch(() => '')); return hojas.get(href); };
const aDatos = url => { if (!datosFuente.has(url)) datosFuente.set(url, fetch(url).then(r => r.blob()).then(b => new Promise(ok => { const f = new FileReader(); f.onload = () => ok(f.result); f.readAsDataURL(b); }))); return datosFuente.get(url); };
async function fuentesDe(el) {
  const usadas = new Set(); [el, ...el.querySelectorAll('*')].forEach(e => { if (TEXTO(e)) { const cs = getComputedStyle(e); usadas.add(`${cs.fontFamily.split(',')[0].replace(/["']/g, '').trim()}|${cs.fontWeight}|${cs.fontStyle}`); } });
  if (!usadas.size) return '';
  const css = (await Promise.all([...document.querySelectorAll('link[rel=stylesheet]')].map(l => hoja(l.href).then(t => ({ t, base: l.href }))))), out = [];
  for (const { t, base } of css) for (const [regla] of t.matchAll(/@font-face\s*{[^}]*}/g)) {
    const fam = regla.match(/font-family:\s*["']?([^;"']+)/)?.[1].trim(), peso = regla.match(/font-weight:\s*(\d+)/)?.[1] || '400', estilo = regla.match(/font-style:\s*(\w+)/)?.[1] || 'normal';
    const rango = regla.match(/unicode-range:\s*([^;]+)/)?.[1], url = regla.match(/url\(["']?([^"')]+)/)?.[1];
    if (!url || !usadas.has(`${fam}|${peso}|${estilo}`) || (rango && !/U\+0000-00FF/i.test(rango))) continue;
    out.push(regla.replace(/src:[^;]+;?/, `src: url(${await aDatos(new URL(url, base).href)});`));
  }
  return out.join('\n');
}
/** Recorta lo transparente de los bordes (la sombra y el giro dejan aire) */
function recortar(cv) {
  const x = cv.getContext('2d'), { data } = x.getImageData(0, 0, cv.width, cv.height); let t = cv.height, b = -1, l = cv.width, r = -1;
  for (let y = 0; y < cv.height; y++) for (let i = 0; i < cv.width; i++) if (data[(y * cv.width + i) * 4 + 3] > 2) { if (y < t) t = y; if (y > b) b = y; if (i < l) l = i; if (i > r) r = i; }
  if (b < 0) return cv;
  const o = document.createElement('canvas'); o.width = r - l + 1; o.height = b - t + 1; o.getContext('2d').drawImage(cv, -l, -t); return o;
}
/** La pieza en PNG @k. Por defecto al tamaño de su caja, derecha y sin sombra (la sombra y el giro van en SwiftUI);
 *  «comoSeVe»: con su sombra y su giro, recortada a lo que se ve. */
export async function piezaPng(el, { k = 3, comoSeVe = false } = {}) {
  const lib = await libreria(), w = el.offsetWidth, h = el.offsetHeight, cs = getComputedStyle(el);
  let pad = 0;
  if (comoSeVe) {
    const sombras = [...cs.boxShadow.matchAll(/(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px(?:\s+(-?[\d.]+)px)?/g)].map(m => Math.abs(+m[1]) + Math.abs(+m[2]) + 2 * +m[3] + Math.max(0, +(m[4] || 0)));
    const m = new DOMMatrix(cs.transform);
    pad = Math.ceil(Math.max(0, ...sombras) + Math.hypot(w, h) / 2 - Math.min(w, h) / 2 + Math.abs(m.e) + Math.abs(m.f) + 4);
  }
  const quieta = comoSeVe ? {} : { transform: 'none', rotate: 'none', translate: 'none', scale: 'none', boxShadow: 'none' };
  const opciones = {
    pixelRatio: k, width: w + 2 * pad, height: h + 2 * pad, fontEmbedCSS: await fuentesDe(el), cacheBust: false,
    style: { ...quieta, width: w + 'px', height: h + 'px', margin: '0', position: el.matches('img') ? 'absolute' : cs.position === 'static' ? 'relative' : cs.position, left: pad + 'px', top: pad + 'px', right: 'auto', bottom: 'auto', opacity: '1' },
    filter: n => !(n instanceof Element) || !fueraDeLaImagen(n, el),
  };
  // si una imagen no llegó (la red se cortó), se arma de nuevo una vez
  const cv = await lib.toCanvas(el, opciones).catch(() => lib.toCanvas(el, opciones));
  const fin = comoSeVe ? recortar(cv) : cv;
  return { blob: await new Promise(ok => fin.toBlob(ok, 'image/png')), w: fin.width, h: fin.height, url: () => fin.toDataURL('image/png') };
}

// ---------- .zip sin dependencias (solo guardar, sin comprimir: las imágenes ya vienen comprimidas) ----------
const TABLA = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = u8 => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = TABLA[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
const FECHA = ((2026 - 1980) << 9) | (11 << 5) | 5; // 5 nov 2026
/** archivos: [{ nombre: 'carpeta/archivo.png', datos: Blob | Uint8Array | string }] */
export async function zip(archivos) {
  const enc = new TextEncoder(), partes = [], central = []; let off = 0;
  for (const f of archivos) {
    const n = enc.encode(f.nombre);
    const d = typeof f.datos === 'string' ? enc.encode(f.datos) : f.datos instanceof Blob ? new Uint8Array(await f.datos.arrayBuffer()) : f.datos;
    const c = crc32(d);
    const h = new DataView(new ArrayBuffer(30));
    [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x0800, 2], [8, 0, 2], [10, 0, 2], [12, FECHA, 2], [14, c, 4], [18, d.length, 4], [22, d.length, 4], [26, n.length, 2], [28, 0, 2]]
      .forEach(([o, v, b]) => b === 4 ? h.setUint32(o, v, true) : h.setUint16(o, v, true));
    partes.push(new Uint8Array(h.buffer), n, d);
    const cd = new DataView(new ArrayBuffer(46));
    [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x0800, 2], [10, 0, 2], [12, 0, 2], [14, FECHA, 2], [16, c, 4], [20, d.length, 4], [24, d.length, 4], [28, n.length, 2], [30, 0, 2], [32, 0, 2], [34, 0, 2], [36, 0, 2], [38, 0, 4], [42, off, 4]]
      .forEach(([o, v, b]) => b === 4 ? cd.setUint32(o, v, true) : cd.setUint16(o, v, true));
    central.push(new Uint8Array(cd.buffer), n);
    off += 30 + n.length + d.length;
  }
  const tam = central.reduce((s, p) => s + p.length, 0), fin = new DataView(new ArrayBuffer(22));
  fin.setUint32(0, 0x06054b50, true); fin.setUint16(8, archivos.length, true); fin.setUint16(10, archivos.length, true); fin.setUint32(12, tam, true); fin.setUint32(16, off, true);
  return new Blob([...partes, ...central, new Uint8Array(fin.buffer)], { type: 'application/zip' });
}
/** Contents.json de un imageset de Xcode */
export const imageset = n => JSON.stringify({ images: [{ idiom: 'universal', scale: '1x' }, { filename: `${n}@2x.png`, idiom: 'universal', scale: '2x' }, { filename: `${n}@3x.png`, idiom: 'universal', scale: '3x' }], info: { author: 'xcode', version: 1 } }, null, 2);
