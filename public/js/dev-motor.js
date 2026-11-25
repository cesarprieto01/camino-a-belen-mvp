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
  if (cs.backgroundImage !== 'none' || !transparente(cs.backgroundColor) || cs.boxShadow !== 'none' || ['Top', 'Right', 'Bottom', 'Left'].some(s => parseFloat(cs[`border${s}Width`]) > 0 && !/none|hidden/.test(cs[`border${s}Style`]))) return true;
  // también lo que cambia cómo se ve lo de adentro: filtro, vidrio, máscara, contorno, opacidad, giro o escala, animación en bucle o un ::before/::after que pinta
  return cs.filter !== 'none' || [cs.backdropFilter, cs.webkitBackdropFilter, cs.maskImage, cs.webkitMaskImage].some(v => v && v !== 'none') || (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0)
    || cs.clipPath !== 'none' || cs.mixBlendMode !== 'normal' || +cs.opacity < .999 || !!transformDe(cs, el.offsetWidth, el.offsetHeight)
    || el.getAnimations().some(a => a.effect?.target === el && !a.effect.pseudoElement && a.effect.getComputedTiming().iterations === Infinity) || pintaPseudo(el);
}
const pintaPseudo = el => ['::before', '::after'].some(p => { const s = getComputedStyle(el, p); return !!s.content && !/^(none|normal)$/.test(s.content) && s.display !== 'none' && (s.backgroundImage !== 'none' || !transparente(s.backgroundColor) || s.boxShadow !== 'none' || parseFloat(s.borderTopWidth) > 0 || !/^(""|'')$/.test(s.content)); });
// un envoltorio sin tamaño (0 × 0, o de alto 0) igual puede tener adentro cosas que se ven
const dejaVer = el => { const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > .02; };
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
    if (esCapa(h) && visible(h)) out.push(h); else if (visible(h) || dejaVer(h)) out.push(...hijosCapa(h));
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
/** El nombre PostScript verificado de la cara que se ve; '' si no está en la tabla */
export const postscript = fu => fu?.ps?.[0] || '';
const PESO_SWIFT = { 100: 'ultraLight', 200: 'thin', 300: 'light', 400: 'regular', 500: 'medium', 600: 'semibold', 700: 'bold', 800: 'heavy', 900: 'black' };
const pesoSwift = w => PESO_SWIFT[Math.min(900, Math.max(100, Math.round(w / 100) * 100))];
/** .font(…) con la cara que se VE: su PostScript verificado; si no lo hay, lo dice en un comentario en vez de inventarlo */
export function swiftFuente(fu) {
  const t = n3(fu.tam), nota = [fu.negritaSimulada && 'el navegador simula la negrita', fu.cursivaSimulada && 'el navegador simula la cursiva'].filter(Boolean);
  let s;
  if (fu.ps) s = `.font(.custom("${fu.ps[0]}", size: ${t}))`;
  else if (fu.tipo === 'web' || fu.tipo === 'local') { s = `.font(.custom("${fu.fam}", size: ${t}))`; nota.unshift(`nombre PostScript sin verificar (${fu.fam} ${fu.peso}${fu.estilo !== 'normal' ? ' italic' : ''})`); }
  else { s = `.font(.system(size: ${t}, weight: .${pesoSwift(fu.peso)}))`; if (fu.tipo !== 'sistema') nota.unshift('en la web se ve una fuente genérica del navegador'); }
  return s + (nota.length ? ` // ${nota.join('; ')}` : '');
}

// ---------- Tipografía: la cara que se DIBUJA, no la que declara el CSS ----------
// Nombres PostScript leídos del name table (nameID 6) de los archivos reales, 19-nov-2026:
//  · Neue Montreal: los OTF de public/assets que carga fonts.css.
//  · Mulish, Nunito y Fredoka: los estáticos oficiales de Google Fonts (fonts.google.com/download/list → static/*.ttf, los del zip).
//    A la web Google les sirve las variables; ahí la instancia nombrada (postScriptNameID de fvar) a veces se llama distinto: 3.er valor.
// familia|peso|estilo → [PostScript, estilo (nameID 17 o 2), PostScript de la instancia en la variable si cambia]
const PS = Object.fromEntries(Object.entries({
  'Neue Montreal|400|normal': ['NeueMontreal-Regular', 'Regular'], 'Neue Montreal|500|normal': ['NeueMontreal-Medium', 'Medium'],
  'Neue Montreal|700|normal': ['NeueMontreal-Bold', 'Bold'], 'Neue Montreal|500|italic': ['NeueMontreal-MediumItalic', 'Medium Italic'],
  'Mulish|200|normal': ['Mulish-ExtraLight', 'ExtraLight', 'MulishRoman-ExtraLight'], 'Mulish|300|normal': ['Mulish-Light', 'Light', 'MulishRoman-Light'],
  'Mulish|400|normal': ['Mulish-Regular', 'Regular', 'MulishRoman-Regular'], 'Mulish|500|normal': ['Mulish-Medium', 'Medium', 'MulishRoman-Medium'],
  'Mulish|600|normal': ['Mulish-SemiBold', 'SemiBold', 'MulishRoman-SemiBold'], 'Mulish|700|normal': ['Mulish-Bold', 'Bold', 'MulishRoman-Bold'],
  'Mulish|800|normal': ['Mulish-ExtraBold', 'ExtraBold', 'MulishRoman-ExtraBold'], 'Mulish|900|normal': ['Mulish-Black', 'Black', 'MulishRoman-Black'],
  'Mulish|200|italic': ['Mulish-ExtraLightItalic', 'ExtraLight Italic', 'MulishItalic-ExtraLight'], 'Mulish|300|italic': ['Mulish-LightItalic', 'Light Italic', 'MulishItalic-Light'],
  'Mulish|400|italic': ['Mulish-Italic', 'Italic', 'MulishItalic-Regular'], 'Mulish|500|italic': ['Mulish-MediumItalic', 'Medium Italic', 'MulishItalic-Medium'],
  'Mulish|600|italic': ['Mulish-SemiBoldItalic', 'SemiBold Italic', 'MulishItalic-SemiBold'], 'Mulish|700|italic': ['Mulish-BoldItalic', 'Bold Italic', 'MulishItalic-Bold'],
  'Mulish|800|italic': ['Mulish-ExtraBoldItalic', 'ExtraBold Italic', 'MulishItalic-ExtraBold'], 'Mulish|900|italic': ['Mulish-BlackItalic', 'Black Italic', 'MulishItalic-Black'],
  'Nunito|200|normal': ['Nunito-ExtraLight', 'ExtraLight'], 'Nunito|300|normal': ['Nunito-Light', 'Light'], 'Nunito|400|normal': ['Nunito-Regular', 'Regular'],
  'Nunito|500|normal': ['Nunito-Medium', 'Medium'], 'Nunito|600|normal': ['Nunito-SemiBold', 'SemiBold'], 'Nunito|700|normal': ['Nunito-Bold', 'Bold'],
  'Nunito|800|normal': ['Nunito-ExtraBold', 'ExtraBold'], 'Nunito|900|normal': ['Nunito-Black', 'Black'],
  'Nunito|200|italic': ['Nunito-ExtraLightItalic', 'ExtraLight Italic', 'NunitoItalic-ExtraLight'], 'Nunito|300|italic': ['Nunito-LightItalic', 'Light Italic', 'NunitoItalic-Light'],
  'Nunito|400|italic': ['Nunito-Italic', 'Italic', 'NunitoItalic-Regular'], 'Nunito|500|italic': ['Nunito-MediumItalic', 'Medium Italic', 'NunitoItalic-Medium'],
  'Nunito|600|italic': ['Nunito-SemiBoldItalic', 'SemiBold Italic', 'NunitoItalic-SemiBold'], 'Nunito|700|italic': ['Nunito-BoldItalic', 'Bold Italic', 'NunitoItalic-Bold'],
  'Nunito|800|italic': ['Nunito-ExtraBoldItalic', 'ExtraBold Italic', 'NunitoItalic-ExtraBold'], 'Nunito|900|italic': ['Nunito-BlackItalic', 'Black Italic', 'NunitoItalic-Black'],
  'Fredoka|300|normal': ['Fredoka-Light', 'Light'], 'Fredoka|400|normal': ['Fredoka-Regular', 'Regular'], 'Fredoka|500|normal': ['Fredoka-Medium', 'Medium'],
  'Fredoka|600|normal': ['Fredoka-SemiBold', 'SemiBold'], 'Fredoka|700|normal': ['Fredoka-Bold', 'Bold'],
}).map(([k, v]) => [k.toLowerCase(), v]));
const GENERICA = /^(serif|sans-serif|monospace|cursive|fantasy|math|emoji|fangsong)$/i;
const SISTEMA = /^(system-ui|-apple-system|BlinkMacSystemFont|ui-sans-serif|ui-serif|ui-monospace|ui-rounded)$/i;
const sinComillas = s => String(s).trim().replace(/^(["'])(.*)\1$/, '$2').trim();
/** «"Neue Montreal", Mulish, sans-serif» → ['Neue Montreal', 'Mulish', 'sans-serif'] */
export const familias = s => (String(s).match(/"[^"]*"|'[^']*'|[^,]+/g) || []).map(sinComillas).filter(Boolean);
const cssFam = n => GENERICA.test(n) || SISTEMA.test(n) ? n : `"${n.replace(/["\\]/g, '\\$&')}"`;
const tipoEstilo = s => /^italic/.test(s) ? 'italic' : /^oblique/.test(s) ? 'oblique' : 'normal';
const pesoNum = v => v === 'normal' ? 400 : v === 'bold' ? 700 : parseFloat(v);
const ANCHOS = { 'ultra-condensed': 50, 'extra-condensed': 62.5, condensed: 75, 'semi-condensed': 87.5, normal: 100, 'semi-expanded': 112.5, expanded: 125, 'extra-expanded': 150, 'ultra-expanded': 200 };
const anchoNum = v => ANCHOS[v] ?? parseFloat(v);
/** «500» → [500, 500]; «100 900» (variable) → [100, 900] */
const extremos = (s, num) => { const v = String(s).trim().split(/\s+/).map(num); return [v[0], v[1] ?? v[0]]; };
const rangos = s => String(s || 'U+0-10FFFF').split(',').map(r => { const m = r.trim().replace(/^U\+/i, ''); if (m.includes('?')) return [parseInt(m.replace(/\?/g, '0'), 16), parseInt(m.replace(/\?/g, 'F'), 16)]; const [a, b = a] = m.split('-').map(h => parseInt(h, 16)); return [a, b]; });
const deRangos = new WeakMap();
const cubre = (cara, cp) => { let r = deRangos.get(cara); if (!r) deRangos.set(cara, r = rangos(cara.unicodeRange)); return r.some(([a, b]) => cp >= a && cp <= b); };
// CSS Fonts 4 §5.2: entre las caras de una familia decide el ancho, luego el estilo y luego el peso, cada uno con su orden de búsqueda;
// lo que queda son los tramos (unicode-range) de una misma cara. Oblicua sin ángulos: va entre cursiva y normal.
const lejos = (v, [a, b], abajoPrimero) => { if (a <= v && v <= b) return [0, 0]; const x = b < v ? b : a; return abajoPrimero ? (x < v ? [1, -x] : [2, x]) : (x > v ? [1, x] : [2, -x]); };
const clavePeso = (w, r) => { if (w < 400 || w > 500) return lejos(w, r, w < 400); const [a, b] = r; if (a <= w && w <= b) return [0, 0]; const x = b < w ? b : a; return x > w && x <= 500 ? [1, x] : x < w ? [2, -x] : [3, x]; };
const ORDEN_ESTILO = { italic: ['italic', 'oblique', 'normal'], oblique: ['oblique', 'italic', 'normal'], normal: ['normal', 'oblique', 'italic'] };
const menor = (p, q) => { for (let i = 0; i < p.length; i++) if (p[i] !== q[i]) return p[i] < q[i]; return false; };
const lasMejores = (caras, clave) => { let k = null, out = []; for (const c of caras) { const x = clave(c); if (!k || menor(x, k)) { k = x; out = [c]; } else if (!menor(k, x)) out.push(c); } return out; };
const caraDe = (caras, w, est, st) => lasMejores(lasMejores(lasMejores(caras, c => lejos(st, extremos(c.stretch, anchoNum), st <= 100)), c => [ORDEN_ESTILO[tipoEstilo(est)].indexOf(tipoEstilo(c.style))]), c => clavePeso(w, extremos(c.weight, pesoNum)));
// una familia que no es web (instalada, del sistema o con nombre propio del navegador) existe si la medida cambia frente a dos genéricas
let lienzo = null;
const PRUEBA = 'mmmmmmmmmmlli1WQ@&gyÁñ';
const ancho = (fuente, t) => { const x = lienzo ??= document.createElement('canvas').getContext('2d'); x.font = fuente; return x.measureText(t).width; };
const existe = (n, w, est) => { const p = `${tipoEstilo(est) === 'normal' ? '' : 'italic '}${w} 40px `; return ['monospace', 'serif'].some(g => ancho(`${p}${cssFam(n)}, ${g}`, PRUEBA) !== ancho(p + g, PRUEBA)); };
const MOTIVO = { loading: 'está cargando', unloaded: 'aún no se pidió', error: 'no se pudo cargar' };
/** La cara que el navegador dibuja de verdad para el texto propio de un elemento (CSS Fonts 4 §5): recorre la lista de font-family;
 *  una familia web cuenta si su cara (elegida por ancho, estilo y peso) está cargada y cubre los caracteres; una local o del
 *  sistema, si existe; una genérica, siempre. Dice si el navegador simula la negrita o la cursiva y por qué no se ve lo declarado. */
export function fuenteDibujada(el, cs = getComputedStyle(el)) {
  const lista = familias(cs.fontFamily), w = pesoNum(cs.fontWeight) || 400, est = cs.fontStyle, st = anchoNum(cs.fontStretch) || 100;
  const propio = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.nodeValue).join('');
  let txt = propio.trim() ? propio : el.textContent;
  if (cs.textTransform === 'uppercase') txt = txt.toUpperCase(); else if (cs.textTransform === 'lowercase') txt = txt.toLowerCase();
  let faltan = [...new Set(txt.replace(/\s/g, ''))].map(c => c.codePointAt(0)); if (!faltan.length) faltan = [97];
  const web = new Map(); document.fonts.forEach(f => { const k = sinComillas(f.family).toLowerCase(); (web.get(k) || web.set(k, []).get(k)).push(f); });
  const tramos = [], saltadas = [], espera = [];
  for (const fam of lista) {
    if (!faltan.length) break;
    const caras = web.get(fam.toLowerCase());
    if (caras) {
      // con @font-face no cuenta la instalada del mismo nombre: o su cara está cargada o se pasa a la siguiente familia
      const cara = caraDe(caras, w, est, st), usadas = new Set(), mios = [];
      let motivo = 'no trae estos caracteres';
      for (const cp of faltan) {
        const seg = cara.filter(c => cubre(c, cp)).pop(); if (!seg) continue; // donde dos @font-face se pisan, gana el último
        if (seg.status === 'loaded') { mios.push(cp); usadas.add(seg); } else { motivo = MOTIVO[seg.status] || motivo; if (seg.status !== 'error' && !espera.includes(seg)) espera.push(seg); }
      }
      if (mios.length) { tramos.push({ fam, tipo: 'web', cara: cara[0], caras: [...usadas], n: mios.length }); faltan = faltan.filter(cp => !mios.includes(cp)); }
      else saltadas.push({ fam, motivo });
    } else if (GENERICA.test(fam)) { tramos.push({ fam, tipo: 'generica', n: faltan.length }); faltan = []; }
    else if (existe(fam, w, est)) { tramos.push({ fam, tipo: SISTEMA.test(fam) ? 'sistema' : 'local', n: faltan.length }); faltan = []; }
    else saltadas.push({ fam, motivo: SISTEMA.test(fam) ? 'este navegador no la reconoce' : 'no está cargada' });
  }
  if (faltan.length) tramos.push({ fam: '', tipo: 'respaldo', n: faltan.length });
  const t = tramos.reduce((a, b) => b.n > a.n ? b : a), decl = { fam: lista[0] || '', peso: w, estilo: tipoEstilo(est) };
  const r = { fam: t.fam, tipo: t.tipo, familia: { web: t.fam, local: t.fam, sistema: 'Fuente del sistema', generica: 'Genérica del navegador', respaldo: 'Respaldo del navegador' }[t.tipo],
    peso: w, estilo: decl.estilo, verificada: t.tipo === 'web', caras: t.caras || [], ps: null, negritaSimulada: false, cursivaSimulada: false,
    declarada: decl, espera, otras: tramos.filter(x => x !== t).map(x => x.fam || 'respaldo del navegador'), css: t.tipo === 'respaldo' ? cs.fontFamily : cssFam(t.fam) };
  if (t.tipo === 'web') {
    const [a, b] = extremos(t.cara.weight, pesoNum), ec = tipoEstilo(t.cara.style);
    r.peso = Math.min(b, Math.max(a, w)); r.estilo = ec; // una variable se dibuja al peso pedido dentro de su rango
    // como Chrome: negrita simulada si se pide 600 o más y la cara no llega a 600; cursiva simulada si se pide y la cara es normal
    r.negritaSimulada = w >= 600 && b < 600 && cs.fontSynthesisWeight !== 'none';
    r.cursivaSimulada = decl.estilo !== 'normal' && ec === 'normal' && cs.fontSynthesisStyle !== 'none';
    r.ps = PS[`${t.fam}|${r.peso}|${ec}`.toLowerCase()] || null;
  }
  // por qué no se ve lo declarado
  r.difiere = t.fam.toLowerCase() !== decl.fam.toLowerCase() || r.peso !== w || r.estilo !== decl.estilo;
  const s0 = saltadas.find(x => x.fam === decl.fam);
  r.motivo = s0 ? s0.motivo : [
    r.peso !== w && `la familia no trae ${w}: se usa la ${r.peso}${r.negritaSimulada ? ' y el navegador la engrosa' : ''}`,
    r.estilo !== decl.estilo && (decl.estilo === 'normal' ? 'solo trae cursiva' : r.cursivaSimulada ? 'no trae cursiva: el navegador la inclina' : 'no trae cursiva'),
  ].filter(Boolean).join(' · ');
  return r;
}
/** «Mulish SemiBold 600», «Neue Montreal Bold 700», «Mulish Italic 400 + negrita simulada», «Fuente del sistema (system-ui) 600» */
export function nombreCara(fu) {
  const sim = [fu.negritaSimulada && 'negrita simulada', fu.cursivaSimulada && 'cursiva simulada'].filter(Boolean).join(' y ');
  if (fu.tipo === 'web') return `${fu.fam} ${fu.ps ? fu.ps[1] : fu.estilo !== 'normal' ? 'Italic' : ''} ${fu.peso}`.replace(/\s+/g, ' ') + (sim ? ` + ${sim}` : '');
  if (fu.tipo === 'respaldo') return fu.familia;
  return `${fu.familia}${fu.tipo !== 'local' ? ` (${fu.fam})` : ''} ${fu.peso}${fu.estilo !== 'normal' ? ' Italic' : ''}`;
}
/** «Fredoka 600», «Mulish 700 italic» */
export const nombreDeclarada = d => `${d.fam} ${d.peso}${d.estilo !== 'normal' ? ' ' + d.estilo : ''}`;
export const reiniciarTokens = () => { mapaTokens = null; }; // al cambiar de tema
const coloresDe = s => [...String(s).matchAll(/rgba?\([^)]+\)/g)].map(m => color(m[0])).filter(Boolean);

// ---------- Efectos: lo que pinta el CSS, leído exacto, y cómo se hace igual en SwiftUI ----------
// Medido con ImageRenderer (macOS 27, el mismo SwiftUI) contra Chrome, a escala 3, el 20-nov-2026:
//  · box-shadow con blur B (exterior e interior): σ = B/2 → .shadow(radius: B/2); con .blur, radius = 1.07 · B/2
//  · filter: drop-shadow(… N): σ = N, no N/2 → .shadow(radius: N) · filter: blur(N): σ = N → .blur(radius: 1.07 · N)
//    (.shadow de SwiftUI da σ ≈ radius; .blur da σ ≈ 0.94 · radius)
//  · degradados: CSS interpola en sRGB; SwiftUI, por defecto, en un espacio perceptual → Gradient(…).colorSpace(.device)
//  · opacidad: la de CSS es del grupo; la de SwiftUI va hoja por hoja → .compositingGroup() antes de .opacity
const KB = 1.07;
const n2 = v => +(+v).toFixed(2);
/** Divide por las comas de arriba (no las de dentro de rgba(…)) */
export const partir = s => { const out = []; let d = 0, cur = ''; for (const ch of String(s)) { if (ch === '(') d++; else if (ch === ')') d--; if (ch === ',' && !d) { out.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; };
/** Una longitud de CSS en px; los % sobre «ref» */
const largo = (v, ref = 0) => { v = String(v ?? '').trim(); let m; if ((m = v.match(/^(-?[\d.]+(?:e-?\d+)?)px$/))) return +m[1]; if ((m = v.match(/^(-?[\d.]+)%$/))) return ref * m[1] / 100; if (/^-?0$/.test(v)) return 0; if ((m = v.match(/^calc\((-?[\d.]+)% ([+-]) (-?[\d.]+)px\)$/))) return ref * m[1] / 100 + (m[2] === '-' ? -1 : 1) * m[3]; return NaN; };
const grados = v => { const m = String(v).trim().match(/^(-?[\d.]+)(deg|turn|rad|grad)?$/); if (!m) return NaN; const x = +m[1]; return { turn: x * 360, rad: x * 180 / Math.PI, grad: x * .9 }[m[2]] ?? x; };
const rgbDe = c => [1, 3, 5].map(i => parseInt(c.hex.slice(i, i + 2), 16));
/** Mezcla premultiplicada (como CSS y SwiftUI entre dos paradas) */
const mezcla = (a, b, t) => { const A = rgbDe(a), B = rgbDe(b), al = a.alfa + (b.alfa - a.alfa) * t; if (al <= 0) return { hex: a.hex, alfa: 0 }; const ch = i => (A[i] * a.alfa + (B[i] * b.alfa - A[i] * a.alfa) * t) / al; return { hex: hexDe(ch(0), ch(1), ch(2)), alfa: +al.toFixed(3) }; };
const opaco = c => !!c && c.alfa >= .999;

// ---- paradas (CSS Images 3 §3.5.2): se completan, se ordenan y se reparten; una pista de color se aproxima con 7 paradas ----
function paradas(args, aPos) {
  const st = [];
  args.forEach(a => { const m = a.match(/rgba?\([^)]*\)/); if (!m) return st.push({ pista: aPos(a) }); const ps = a.replace(m[0], ' ').trim().split(/\s+/).filter(Boolean).map(aPos); if (!ps.length) st.push({ c: color(m[0]), p: null }); else ps.forEach(p => st.push({ c: color(m[0]), p })); });
  const cs = st.filter(x => x.c); if (!cs.length) return { st: [], aprox: false };
  if (cs[0].p == null) cs[0].p = 0; if (cs.at(-1).p == null) cs.at(-1).p = 1;
  let mx = -Infinity; cs.forEach(x => { if (x.p != null) { x.p = Math.max(x.p, mx); mx = x.p; } });
  for (let i = 1; i < cs.length; i++) if (cs[i].p == null) { let j = i; while (cs[j].p == null) j++; for (let k = i; k < j; k++) cs[k].p = cs[i - 1].p + (cs[j].p - cs[i - 1].p) * (k - i + 1) / (j - i + 1); i = j; }
  const out = []; let aprox = false;
  st.forEach((x, i) => {
    if (x.c) return out.push({ c: x.c, p: x.p });
    const a = out.at(-1), b = st.slice(i + 1).find(y => y.c); if (!a || !b) return;
    const m = (Math.min(Math.max(x.pista, a.p), b.p) - a.p) / ((b.p - a.p) || 1); if (Math.abs(m - .5) < 1e-3) return;
    aprox = true; for (let k = 1; k < 8; k++) { const t = k / 8; out.push({ c: mezcla(a.c, b.c, m <= 0 ? 1 : m >= 1 ? 0 : t ** (Math.log(.5) / Math.log(m))), p: a.p + (b.p - a.p) * t }); }
  });
  return { st: out, aprox };
}
const colorEn = (st, p) => { if (p <= st[0].p) return st[0].c; for (let i = 1; i < st.length; i++) if (p <= st[i].p) { const a = st[i - 1], b = st[i]; return b.p === a.p ? b.c : mezcla(a.c, b.c, (p - a.p) / (b.p - a.p)); } return st.at(-1).c; };
/** repeating-*: el patrón se copia hasta cubrir 0…1 (en los bordes, el color que toca) */
function repetir(st) {
  const per = st.at(-1).p - st[0].p; if (!(per > 1e-6)) return st;
  const todo = []; for (let k = Math.floor(-st[0].p / per) - 1; st[0].p + k * per <= 1 + per; k++) st.forEach(x => todo.push({ c: x.c, p: x.p + k * per }));
  // en un corte duro justo en 0 vale el color de la derecha; en 1, el de la izquierda
  const der = p => { let j = -1; todo.forEach((x, i) => { if (x.p <= p) j = i; }); const a = todo[j], b = todo[j + 1]; return !b || a.p === p ? a.c : mezcla(a.c, b.c, (p - a.p) / (b.p - a.p)); };
  const izq = p => { const j = todo.findIndex(x => x.p >= p), a = todo[j - 1], b = todo[j]; return !a || b.p === p ? b.c : mezcla(a.c, b.c, (p - a.p) / (b.p - a.p)); };
  return [{ c: der(0), p: 0 }, ...todo.filter(x => x.p > 0 && x.p < 1), { c: izq(1), p: 1 }];
}
// «50% 32%», «center top», «left 10px top 20px» → [x, y] en px del área
function posicion(s, W, H) {
  const t = String(s || '').trim().split(/\s+/).filter(Boolean); if (!t.length) return [W / 2, H / 2];
  const K = { left: 0, center: 50, right: 100, top: 0, bottom: 100 }, val = (v, ref) => v in K ? ref * K[v] / 100 : largo(v, ref);
  if (t.length === 1) return /^(top|bottom)$/.test(t[0]) ? [W / 2, val(t[0], H)] : [val(t[0], W), H / 2];
  if (t.length === 2) { let [a, b] = t; if (/^(top|bottom)$/.test(a) || /^(left|right)$/.test(b)) [a, b] = [b, a]; return [val(a, W), val(b, H)]; }
  let x = W / 2, y = H / 2; for (let i = 0; i < t.length; i += 2) { const k = t[i], d = largo(t[i + 1], /^(left|right)$/.test(k) ? W : H) || 0; if (k === 'left') x = d; else if (k === 'right') x = W - d; else if (k === 'top') y = d; else if (k === 'bottom') y = H - d; }
  return [x, y];
}
/** Una capa de background-image o mask-image, resuelta en px de su área (W × H): tipo, geometría y paradas en 0…1 */
function capaDe(txt, W, H) {
  const m = txt.match(/^(repeating-)?(linear|radial|conic)-gradient\(([\s\S]*)\)$/);
  if (!m) { const u = txt.match(/^url\("?([\s\S]*?)"?\)$/); return u ? { tipo: 'imagen', url: u[1], css: txt } : { tipo: 'otro', css: txt }; }
  const args = partir(m[3]), repite = !!m[1], tipo = { linear: 'lineal', radial: 'radial', conic: 'conico' }[m[2]], geo = /rgba?\(/.test(args[0]) ? '' : args.shift().trim();
  const c = { tipo, repite, css: txt, W, H };
  if (tipo === 'lineal') {
    let a = 180;
    if (geo.startsWith('to ')) { const k = geo.slice(3).split(/\s+/).sort().join(' '), e = Math.atan2(H, W) * 180 / Math.PI; a = { top: 0, right: 90, bottom: 180, left: 270, 'right top': e, 'bottom right': 180 - e, 'bottom left': 180 + e, 'left top': 360 - e }[k] ?? 180; }
    else if (geo) a = grados(geo);
    // la línea del degradado pasa por el centro y mide |W·sen θ| + |H·cos θ| (sus extremos tocan las esquinas)
    const t = a * Math.PI / 180, dx = Math.sin(t), dy = -Math.cos(t), L = Math.abs(W * dx) + Math.abs(H * dy), r = paradas(args, v => largo(v, L) / (L || 1));
    return Object.assign(c, { angulo: ((a % 360) + 360) % 360, L, ini: [W / 2 - dx * L / 2, H / 2 - dy * L / 2], fin: [W / 2 + dx * L / 2, H / 2 + dy * L / 2], st: repite ? repetir(r.st) : r.st, patron: repite ? r.st : null, aprox: r.aprox });
  }
  if (tipo === 'radial') {
    const g = geo.match(/^(.*?)\s*(?:\bat\s+(.*))?$/), [cx, cy] = posicion(g[2], W, H), t = g[1].split(/\s+/).filter(Boolean), nums = t.filter(x => /\d/.test(x));
    const circulo = t.includes('circle') || (nums.length === 1 && !t.includes('ellipse')), tam = t.find(x => /side|corner/.test(x)) || (nums.length ? null : 'farthest-corner');
    const X = [cx, W - cx].map(Math.abs), Y = [cy, H - cy].map(Math.abs); let rx, ry;
    if (tam) {
      const f = tam.startsWith('closest') ? Math.min : Math.max;
      if (tam.endsWith('side')) { if (circulo) rx = ry = f(...X, ...Y); else { rx = f(...X); ry = f(...Y); } }
      else { const ex = f(...X), ey = f(...Y); if (circulo) rx = ry = Math.hypot(ex, ey); else { rx = ex * Math.SQRT2; ry = ey * Math.SQRT2; } } // la elipse que pasa por la esquina con la proporción de los lados
    } else { rx = largo(nums[0], W); ry = circulo ? rx : largo(nums[1], H); }
    const r = paradas(args, v => largo(v, rx) / (rx || 1));
    return Object.assign(c, { circulo: circulo || Math.abs(rx - ry) < .01, cx, cy, rx, ry, st: repite ? repetir(r.st) : r.st, patron: repite ? r.st : null, aprox: r.aprox });
  }
  const g = geo.match(/^(?:from\s+(\S+))?\s*(?:at\s+(.*))?$/) || [], [cx, cy] = posicion(g[2], W, H), r = paradas(args, v => /%$/.test(v) ? parseFloat(v) / 100 : grados(v) / 360);
  return Object.assign(c, { desde: g[1] ? grados(g[1]) : 0, cx, cy, st: repite ? repetir(r.st) : r.st, patron: repite ? r.st : null, aprox: r.aprox, cada: repite && r.st.length ? (r.st.at(-1).p - r.st[0].p) * 360 : 0 });
}
/** El fondo de una caja: el color de abajo y sus capas (la primera es la de arriba, como en CSS), en su área (la caja de padding) */
function fondoDe(cs, w, h, bw) {
  const org = partir(cs.backgroundOrigin)[0], o = org === 'border-box' ? [0, 0, 0, 0] : bw, W = w - o[1] - o[3], H = h - o[0] - o[2];
  const capas = cs.backgroundImage === 'none' ? [] : partir(cs.backgroundImage).map(t => ({ ...capaDe(t, W, H), ox: o[3], oy: o[0] }));
  const T = partir(cs.backgroundSize), P = partir(cs.backgroundPosition), R = partir(cs.backgroundRepeat);
  capas.forEach((c, i) => { c.size = T[i % T.length]; c.pos = P[i % P.length]; c.rep = R[i % R.length]; });
  return { base: transparente(cs.backgroundColor) ? null : color(cs.backgroundColor), capas, texto: [cs.backgroundClip, cs.webkitBackgroundClip].some(v => /text/.test(v || '')) };
}
const fondoOpaco = fo => opaco(fo.base) || fo.capas.some(c => c.st?.length && c.st.every(x => opaco(x.c)) && /^(auto|auto auto|100% 100%)$/.test(c.size || 'auto'));

// ---- esquinas, bordes, contorno, sombras, filtros, vidrio y máscara ----
/** Radios [rx, ry] de ↖ ↗ ↘ ↙ en pt, ya reducidos como CSS cuando no caben (Backgrounds 3 §5.5) */
export function esquinasDe(cs, w, h) {
  const r = ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'].map(k => { const v = String(cs[`border${k}Radius`]).split(/\s+/); return [largo(v[0], w) || 0, largo(v[1] ?? v[0], h) || 0]; });
  const f = Math.min(1, w / ((r[0][0] + r[1][0]) || 1e-9), w / ((r[3][0] + r[2][0]) || 1e-9), h / ((r[0][1] + r[3][1]) || 1e-9), h / ((r[1][1] + r[2][1]) || 1e-9));
  return r.map(([x, y]) => [x * f, y * f]);
}
/** Las esquinas de la forma agrandada d pt (d < 0: achicada), como el spread de CSS (§7.1.1: si el radio es menor que d, la esquina se afila) */
const crecer = (r, d) => r.map(c => c.map(v => d >= 0 ? (v <= 0 ? 0 : v + d * (v < d ? 1 + (v / d - 1) ** 3 : 1)) : Math.max(0, v + d)));
const LADOS = ['Top', 'Right', 'Bottom', 'Left'];
function bordesDe(cs) {
  const l = LADOS.map(s => ({ lado: s, w: /none|hidden/.test(cs[`border${s}Style`]) ? 0 : parseFloat(cs[`border${s}Width`]) || 0, c: color(cs[`border${s}Color`]), estilo: cs[`border${s}Style`] }));
  const vis = l.filter(x => x.w > 0 && x.c && x.c.alfa > 0);
  const uni = vis.length === 4 && vis.every(x => x.w === vis[0].w && x.c.hex === vis[0].c.hex && x.c.alfa === vis[0].c.alfa && x.estilo === vis[0].estilo) ? vis[0] : null;
  return { anchos: l.map(x => x.w), lados: vis, uni };
}
const contornoDe = cs => cs.outlineStyle === 'none' || !(parseFloat(cs.outlineWidth) > 0) ? null : { w: parseFloat(cs.outlineWidth), o: parseFloat(cs.outlineOffset) || 0, c: color(cs.outlineColor), estilo: cs.outlineStyle };
/** box-shadow / text-shadow → [{ c, x, y, b (blur de CSS), s (spread), inset }] */
export const sombrasDe = v => !v || v === 'none' ? [] : partir(v).map(t => { const c = color((t.match(/rgba?\([^)]*\)/) || [])[0]) || { hex: '#000000', alfa: 1 }, n = [...t.replace(/rgba?\([^)]*\)/, '').matchAll(/(-?[\d.]+(?:e-?\d+)?)px/g)].map(m => +m[1]); return { c, x: n[0] || 0, y: n[1] || 0, b: n[2] || 0, s: n[3] || 0, inset: /\binset\b/.test(t) }; });
/** filter / backdrop-filter → [{ f, v }] (drop-shadow trae su sombra) */
export const filtrosDe = v => !v || v === 'none' ? [] : [...String(v).matchAll(/([a-z-]+)\(((?:[^()]|\([^()]*\))*)\)/g)].map(([, f, a]) => f === 'drop-shadow' ? { f, ...sombrasDe(a)[0] } : { f, v: f === 'blur' ? largo(a) : f === 'hue-rotate' ? grados(a) : /%$/.test(a.trim()) ? parseFloat(a) / 100 : +a });
const vidrioDe = cs => { const v = [cs.backdropFilter, cs.webkitBackdropFilter].find(x => x && x !== 'none'); if (!v) return null; const fs = filtrosDe(v); return { css: v, blur: fs.find(x => x.f === 'blur')?.v || 0, sat: fs.find(x => x.f === 'saturate')?.v ?? 1, otros: fs.filter(x => !/^(blur|saturate)$/.test(x.f)) }; };
function mascaraDe(cs, w, h) {
  const v = [cs.maskImage, cs.webkitMaskImage].find(x => x && x !== 'none'); if (!v) return null;
  const capas = partir(v).map(t => capaDe(t, w, h)), clips = partir(cs.maskClip || 'border-box'), comp = partir(cs.maskComposite || cs.webkitMaskComposite || 'add');
  // «linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)» con exclude: queda un aro del grosor del padding (un borde con degradado)
  const lleno = c => c.st?.length && c.st.every(x => opaco(x.c));
  const aro = capas.length === 2 && capas.every(lleno) && /content-box/.test(clips[0]) && !/content-box/.test(clips[1] || 'border-box') && /exclude|xor/.test(comp[0]);
  return { css: v, capas, aro, tam: partir(cs.maskSize || 'auto')[0], rep: partir(cs.maskRepeat || 'repeat')[0] };
}

// ---- transformación propia (transform, rotate, scale y translate): lo que se escribe en SwiftUI ----
export function transformDe(cs, w = 0, h = 0) {
  let m = new DOMMatrix();
  try {
    if (cs.translate && cs.translate !== 'none') { const [x, y = '0px'] = cs.translate.split(' '); m = m.translate(largo(x, w) || 0, largo(y, h) || 0); }
    if (cs.rotate && cs.rotate !== 'none') { const p = cs.rotate.split(' '), a = grados(p.at(-1)); m = p.length === 1 || p[0] === 'z' ? m.rotate(a) : m.rotateAxisAngle(...(p[0] === 'x' ? [1, 0, 0] : p[0] === 'y' ? [0, 1, 0] : p.slice(0, 3).map(Number)), a); }
    if (cs.scale && cs.scale !== 'none') { const [a, b = a, c = 1] = cs.scale.split(' ').map(Number); m = m.scale(a, b, c); }
    if (cs.transform && cs.transform !== 'none') m = m.multiply(new DOMMatrix(cs.transform));
  } catch { return null; }
  const es3d = Math.abs(m.m13) + Math.abs(m.m23) + Math.abs(m.m31) + Math.abs(m.m32) > 1e-6 || Math.abs(m.m33 - 1) > 1e-6;
  const { a, b, c, d } = m, det = a * d - b * c;
  if (!es3d && Math.abs(a - 1) < 1e-6 && Math.abs(b) < 1e-6 && Math.abs(c) < 1e-6 && Math.abs(d - 1) < 1e-6) return null; // solo traslación: ya está en la posición
  if (es3d) {
    // giro puro alrededor de Y o de X (las cartas que se voltean)
    const ejes = [[0, 1, 0, Math.atan2(m.m31, m.m11)], [1, 0, 0, Math.atan2(-m.m32, m.m22)]];
    for (const [x, y, z, t] of ejes) { const g = t * 180 / Math.PI, q = new DOMMatrix().rotateAxisAngle(x, y, z, g); if (['m11', 'm12', 'm13', 'm21', 'm22', 'm23', 'm31', 'm32', 'm33'].every(k => Math.abs(q[k] - m[k]) < 1e-4)) return { es3d: true, eje: [x, y, z], g: n2(g), m }; }
    return { es3d: true, eje: null, g: 0, m };
  }
  let sx = Math.hypot(a, b), giro = Math.atan2(b, a) * 180 / Math.PI, sy = det / (sx || 1);
  if (det < 0) { sx = -sx; giro = Math.atan2(-b, -a) * 180 / Math.PI; sy = det / sx; } // espejo horizontal y luego el giro
  return { es3d: false, giro: Math.round(giro * 100) / 100, sx: n3(sx), sy: n3(sy), inclina: Math.abs(a * c + b * d) > 1e-4 * Math.abs(det), m };
}
/** ¿Algún contenedor (dentro de la pantalla) la gira, la escala o la voltea? */
const transformArriba = el => { const top = capaArriba(); for (let e = el.parentElement; e && e !== top && e !== document.body; e = e.parentElement) if (transformDe(getComputedStyle(e), e.offsetWidth, e.offsetHeight)) return e; return null; };
/** El tamaño de la caja de CSS (sin transformar), con decimales; null si no tiene (un inline) */
const tamCss = (el, cs) => { const w = parseFloat(cs.width), h = parseFloat(cs.height); if (!(w >= 0 && h >= 0) || /^inline$/.test(cs.display)) return null; if (cs.boxSizing === 'border-box' || el instanceof SVGElement) return [w, h]; const p = k => parseFloat(cs[k]) || 0; return [w + p('paddingLeft') + p('paddingRight') + p('borderLeftWidth') + p('borderRightWidth'), h + p('paddingTop') + p('paddingBottom') + p('borderTopWidth') + p('borderBottomWidth')]; };

// ---- animaciones CSS y de JS (Web Animations): sus keyframes, tiempos y curvas ----
const CURVAS = { linear: [0, 0, 1, 1], ease: [.25, .1, .25, 1], 'ease-in': [.42, 0, 1, 1], 'ease-out': [0, 0, .58, 1], 'ease-in-out': [.42, 0, .58, 1] };
const curvaDe = e => CURVAS[e] || String(e).match(/cubic-bezier\(([^)]+)\)/)?.[1].split(',').map(Number) || null;
export function animacionesDe(el, pseudo = null) {
  return el.getAnimations().filter(a => a.effect?.target === el && (a.effect.pseudoElement || null) === pseudo && !(a instanceof CSSTransition) && a.playState !== 'idle').map(a => {
    const t = a.effect.getTiming(), kf = a.effect.getKeyframes();
    return { nombre: a.animationName || a.id || '', css: a instanceof CSSAnimation, dur: +t.duration || 0, delay: +t.delay || 0, it: t.iterations ?? 1, dir: t.direction || 'normal', easing: t.easing || 'linear', fill: t.fill, kf, props: [...new Set(kf.flatMap(k => Object.keys(k).filter(x => !/^(offset|computedOffset|easing|composite)$/.test(x))))] };
  });
}
/** Lo de los contenedores que cambia cómo se ve la capa: su opacidad, sus filtros y sus transformaciones */
function heredadoDe(el) {
  const out = { op: 1, de: [], filtros: [], tr: [] }, top = capaArriba();
  for (let e = el.parentElement; e && e !== top && e !== document.body; e = e.parentElement) {
    const cs = getComputedStyle(e);
    if (+cs.opacity < .999) { out.op *= +cs.opacity; out.de.push({ el: e, op: +cs.opacity }); }
    if (cs.filter !== 'none') out.filtros.push({ el: e, css: cs.filter, fs: filtrosDe(cs.filter) });
    const t = transformDe(cs, e.offsetWidth, e.offsetHeight); if (t && !e.matches('.layer')) out.tr.push({ el: e, t });
  }
  return out;
}
// los ::before/::after que pintan algo (un brillo, un aro de vidrio, una flecha)
function pseudosDe(el, w, h, bw) {
  const out = [];
  for (const p of ['::before', '::after']) {
    const cs = getComputedStyle(el, p);
    if (!cs.content || /^(none|normal)$/.test(cs.content) || cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < .02) continue;
    const pb = bordesDe(cs), pad = LADOS.map(s => parseFloat(cs[`padding${s}`]) || 0), bb = cs.boxSizing === 'border-box';
    const pw = (parseFloat(cs.width) || 0) + (bb ? 0 : pad[1] + pad[3] + pb.anchos[1] + pb.anchos[3]), ph = (parseFloat(cs.height) || 0) + (bb ? 0 : pad[0] + pad[2] + pb.anchos[0] + pb.anchos[2]);
    const fondo = fondoDe(cs, pw, ph, pb.anchos), sombras = sombrasDe(cs.boxShadow), texto = !/^(""|'')$/.test(cs.content) ? cs.content.replace(/^["']|["']$/g, '') : '';
    if (!(pw > 0 && ph > 0) || (!fondo.base && !fondo.capas.length && !pb.lados.length && !sombras.length && !texto)) continue;
    const abs = /absolute|fixed/.test(cs.position), l = parseFloat(cs.left), t = parseFloat(cs.top);
    const x = abs ? bw[3] + (Number.isFinite(l) ? l : w - bw[1] - bw[3] - (parseFloat(cs.right) || 0) - pw) : null, y = abs ? bw[0] + (Number.isFinite(t) ? t : h - bw[0] - bw[2] - (parseFloat(cs.bottom) || 0) - ph) : null;
    out.push({ p, x, y, w: pw, h: ph, abs, z: cs.zIndex, fondo, sombras, bordes: pb, pad, esq: esquinasDe(cs, pw, ph), mascara: mascaraDe(cs, pw, ph), opacidad: +cs.opacity, texto, tr: transformDe(cs, pw, ph), anim: animacionesDe(el, p) });
  }
  return out;
}
// una imagen con un filtro de color que SwiftUI no tiene (brightness > 1, sepia…): su PNG sale con esos filtros ya aplicados
const COLOR = /^(grayscale|contrast|brightness|saturate|sepia|invert|hue-rotate)$/;
const horneado = (fs, css) => { const k = fs.findIndex(x => !COLOR.test(x.f)), pre = k < 0 ? fs : fs.slice(0, k); return pre.some(x => filtroSwift(x).nota) ? (css.match(/[a-z-]+\((?:[^()]|\([^()]*\))*\)/g) || []).slice(0, pre.length).join(' ') : ''; };
/** Todo lo que pinta una capa, exacto y en pt */
export function efectosDe(el, cs = getComputedStyle(el), caja = cajaPantalla(el)) {
  const t = tamCss(el, cs), w = t?.[0] ?? caja.w, h = t?.[1] ?? caja.h, B = bordesDe(cs), bw = B.anchos, anim = animacionesDe(el);
  const animado = new Set(anim.filter(a => a.it === Infinity || a.it > 1).flatMap(a => a.props));
  return {
    w, h, bw, bordes: B, esq: esquinasDe(cs, w, h), fondo: fondoDe(cs, w, h, bw), sombras: animado.has('boxShadow') ? [] : sombrasDe(cs.boxShadow),
    vidrio: vidrioDe(cs), filtros: animado.has('filter') ? [] : filtrosDe(cs.filter), mascara: mascaraDe(cs, w, h), contorno: contornoDe(cs),
    opacidad: animado.has('opacity') ? 1 : +cs.opacity, tr: animado.has('transform') ? null : transformDe(cs, w, h), anim, animado,
    mezcla: cs.mixBlendMode !== 'normal' ? cs.mixBlendMode : '', recorte: cs.clipPath !== 'none' ? cs.clipPath : '', recorta: /hidden|clip/.test(cs.overflow),
    sombraTexto: TEXTO(el) || el.matches('button, a') ? sombrasDe(cs.textShadow) : [], pseudo: pseudosDe(el, w, h, bw), heredado: heredadoDe(el),
    img: el.matches('img') ? { fit: cs.objectFit, pos: cs.objectPosition, nat: [el.naturalWidth, el.naturalHeight] } : null,
    horneado: el.matches('img') ? horneado(filtrosDe(cs.filter), cs.filter) : '',
  };
}

// ---- SwiftUI ----
// La forma de la caja se escribe «§F» mientras se arma el código: si sale más de una vez (o es un Path), va como «let forma = …»
const PUNTOS = { '0.5,0': '.top', '0.5,1': '.bottom', '0,0.5': '.leading', '1,0.5': '.trailing', '0.5,0.5': '.center', '0,0': '.topLeading', '1,0': '.topTrailing', '0,1': '.bottomLeading', '1,1': '.bottomTrailing' };
const punto = (x, y) => PUNTOS[`${n3(x)},${n3(y)}`] || `UnitPoint(x: ${n3(x)}, y: ${n3(y)})`;
const sangra = (s, n = 4) => String(s).split('\n').map(l => l && ' '.repeat(n) + l).join('\n');
const resto = (s, n = 4) => String(s).replace(/\n/g, '\n' + ' '.repeat(n)); // las líneas que siguen, n más adentro
/** Gradient(stops:) en sRGB, como CSS */
function gradiente(st) {
  const s = st.map(x => `.init(color: ${swiftColor(x.c)}, location: ${n3(x.p)})`), k = s.length > 8 ? 2 : 1, filas = [];
  for (let i = 0; i < s.length; i += k) filas.push(s.slice(i, i + k).join(', '));
  return `Gradient(stops: [\n${sangra(filas.join(',\n'))}\n]).colorSpace(.device)`;
}
/** Una capa de degradado en SwiftUI, sobre el marco w × h: { estilo } (ShapeStyle para .fill o .strokeBorder) o { vista } */
export function capaSwift(c, w, h) {
  const ox = c.ox || 0, oy = c.oy || 0;
  if (c.tipo === 'lineal') {
    let st = c.st, [x0, y0] = c.ini, [x1, y1] = c.fin; const p0 = st[0].p, p1 = st.at(-1).p;
    // paradas antes del 0 % o después del 100 %: se alarga la línea para que vayan de 0 a 1
    if ((p0 < 0 || p1 > 1) && p1 > p0) { [x0, y0, x1, y1] = [x0 + (x1 - x0) * p0, y0 + (y1 - y0) * p0, x0 + (x1 - x0) * p1, y0 + (y1 - y0) * p1]; st = st.map(x => ({ c: x.c, p: (x.p - p0) / (p1 - p0) })); }
    return { estilo: `.linearGradient(${gradiente(st)}, startPoint: ${punto((ox + x0) / w, (oy + y0) / h)}, endPoint: ${punto((ox + x1) / w, (oy + y1) / h)})` };
  }
  // 0° de CSS es arriba; el de SwiftUI, a la derecha
  if (c.tipo === 'conico') return { estilo: `.angularGradient(${gradiente(c.st)}, center: ${punto((ox + c.cx) / w, (oy + c.cy) / h)}, startAngle: .degrees(${n2(c.desde - 90)}), endAngle: .degrees(${n2(c.desde + 270)}))` };
  let st = c.st, k = 1; const p1 = st.at(-1).p; if (p1 > 1) { k = p1; st = st.map(x => ({ c: x.c, p: x.p / k })); }
  const cen = punto((ox + c.cx) / w, (oy + c.cy) / h), rx = c.rx * k, ry = c.ry * k;
  if (c.circulo) return { estilo: `.radialGradient(${gradiente(st)}, center: ${cen}, startRadius: 0, endRadius: ${n2(rx)})` };
  if (Math.abs(rx / w - ry / h) < 1e-3) return { estilo: `.ellipticalGradient(${gradiente(st)}, center: ${cen}, startRadiusFraction: 0, endRadiusFraction: ${n3(rx / w)})` };
  // elipse de otra proporción que la caja: un radial de radio rx dibujado más alto y aplastado desde arriba hasta ry
  const q = ry / rx;
  return { vista: `Rectangle()\n    .fill(.radialGradient(${resto(gradiente(st))}, center: ${cen}, startRadius: 0, endRadius: ${n2(rx)}))\n    .frame(width: ${n2(w)}, height: ${n2(h / q)})\n    .scaleEffect(x: 1, y: ${n3(q)}, anchor: .top) // elipse de ${n2(rx)} × ${n2(ry)}\n    .frame(width: ${n2(w)}, height: ${n2(h)}, alignment: .top)` };
}
/** La forma de SwiftUI con esas esquinas. Son arcos circulares como en CSS (.circular); el .continuous de iOS es más suave y no es igual */
export function formaSwift(r, w, h) {
  const ok = (a, b) => Math.abs(a - b) < .01, [tl, tr, br, bl] = r;
  if (r.every(([x, y]) => x < .01 && y < .01)) return { s: 'Rectangle()', ins: true, txt: '' };
  const circ = r.every(([x, y]) => ok(x, y)), igual = r.every(([x, y]) => ok(x, tl[0]) && ok(y, tl[1]));
  if (igual && circ) {
    const v = tl[0];
    if (ok(w, h) && ok(v, w / 2)) return { s: 'Circle()', ins: true, txt: `círculo · radio ${n2(v)}` };
    if (v >= Math.min(w, h) / 2 - .01) return { s: 'Capsule(style: .circular)', ins: true, txt: `${n2(v)} · cápsula` };
    return { s: `RoundedRectangle(cornerRadius: ${n2(v)}, style: .circular)`, ins: true, txt: String(n2(v)), r: v };
  }
  if (igual) return ok(tl[0], w / 2) && ok(tl[1], h / 2) ? { s: 'Ellipse()', ins: true, txt: `elipse de ${n2(w)} × ${n2(h)}` } : { s: `RoundedRectangle(cornerSize: CGSize(width: ${n2(tl[0])}, height: ${n2(tl[1])}), style: .circular)`, ins: true, txt: `${n2(tl[0])} × ${n2(tl[1])} · elípticas` };
  const txt = r.map(([x, y], i) => `${'↖↗↘↙'[i]} ${n2(x)}${ok(x, y) ? '' : ` × ${n2(y)}`}`).join('  ');
  if (circ) return { s: `UnevenRoundedRectangle(topLeadingRadius: ${n2(tl[0])}, bottomLeadingRadius: ${n2(bl[0])}, bottomTrailingRadius: ${n2(br[0])}, topTrailingRadius: ${n2(tr[0])}, style: .circular)`, ins: true, txt };
  // esquinas elípticas distintas por esquina: no hay forma nativa; un Path con arcos de elipse (Bézier, error < 0.03 % del radio)
  const k = 1 - .5522847498, P = (x, y) => `CGPoint(x: ${n2(x)}, y: ${n2(y)})`;
  return { ins: false, txt: txt + ' · elípticas', s: ['Path { p in // esquinas elípticas por esquina: arcos de elipse con Bézier (error < 0.03 % del radio)',
    `    p.move(to: ${P(tl[0], 0)})`, `    p.addLine(to: ${P(w - tr[0], 0)})`, `    p.addCurve(to: ${P(w, tr[1])}, control1: ${P(w - tr[0] * k, 0)}, control2: ${P(w, tr[1] * k)})`,
    `    p.addLine(to: ${P(w, h - br[1])})`, `    p.addCurve(to: ${P(w - br[0], h)}, control1: ${P(w, h - br[1] * k)}, control2: ${P(w - br[0] * k, h)})`,
    `    p.addLine(to: ${P(bl[0], h)})`, `    p.addCurve(to: ${P(0, h - bl[1])}, control1: ${P(bl[0] * k, h)}, control2: ${P(0, h - bl[1] * k)})`,
    `    p.addLine(to: ${P(0, tl[1])})`, `    p.addCurve(to: ${P(tl[0], 0)}, control1: ${P(0, tl[1] * k)}, control2: ${P(tl[0] * k, 0)})`, '    p.closeSubpath()', '}'].join('\n') };
}
// una forma derivada (otro tamaño u otras esquinas): en línea si se puede; un Path no se rehace: se usa la de la caja (aproximación)
const derivada = (G, F, T) => G.s === F.s ? T : G.s.includes('\n') ? T : G.s;
const relleno = (T, estilo) => `${T}\n    .fill(${resto(estilo)})`;
const lineaPor = (G, T, c, lw) => G.ins ? `${T}\n    .strokeBorder(${resto(c)}, lineWidth: ${n2(lw)})` : `${T}\n    .stroke(${resto(c)}, lineWidth: ${n2(lw * 2)}) // por dentro: el doble de grueso y recortado a la forma\n    .clipShape(${T})`;
const lados4 = a => a.every(v => v === a[0]) ? `.padding(${n2(a[0])})` : `.padding(EdgeInsets(top: ${n2(a[0])}, leading: ${n2(a[3])}, bottom: ${n2(a[2])}, trailing: ${n2(a[1])}))`;
/** Una sombra exterior: { mod } si basta .shadow (sin spread, sobre lo opaco: idéntico) o { capa } para el fondo */
export function sombraSwift(s, r, w, h, opaca = false, T = '§F', bw = [0, 0, 0, 0], comoCapa = false) {
  const cc = swiftColor(s.c), F = formaSwift(r, w, h);
  if (s.inset) return sombraDentro(s, r, w, h, bw, T);
  if (!s.s && opaca && !comoCapa) return { mod: `.shadow(color: ${cc}, radius: ${n2(s.b / 2)}, x: ${n2(s.x)}, y: ${n2(s.y)})` };
  const G = formaSwift(crecer(r, s.s), w + 2 * s.s, h + 2 * s.s), M = Math.ceil(Math.abs(s.x) + Math.abs(s.y) + Math.abs(s.s) + 1.5 * s.b + 4);
  const L = [relleno(derivada(G, F, T), cc)];
  if (s.s) L.push(`    .padding(${n2(-s.s)}) // spread ${n2(s.s)}: SwiftUI no lo tiene; la forma ${s.s > 0 ? 'crece' : 'se achica'} ${n2(Math.abs(s.s))} y sus esquinas con ella`);
  if (s.x || s.y) L.push(`    .offset(x: ${n2(s.x)}, y: ${n2(s.y)})`);
  if (s.b) L.push(`    .blur(radius: ${n2(KB * s.b / 2)}) // blur ${n2(s.b)} de CSS = σ ${n2(s.b / 2)}`);
  // CSS no pinta la sombra exterior debajo de la caja: como el relleno deja ver, la máscara la quita de ahí
  if (!opaca) L.push(`    .mask { // CSS no la pinta debajo de la caja\n        Rectangle()\n            .padding(${-M})\n            .overlay(${T}.blendMode(.destinationOut))\n            .compositingGroup()\n    }`);
  return { capa: L.join('\n') };
}
/** Una sombra interior (por dentro de la caja de padding): aro → .strokeBorder; si no, el color fuera de la forma interior, desenfocado y recortado */
function sombraDentro(s, r, w, h, bw, T = '§F') {
  const cc = swiftColor(s.c), F = formaSwift(r, w, h), b = Math.max(...bw), rp = b ? crecer(r, -b) : r, pw = w - bw[1] - bw[3], ph = h - bw[0] - bw[2], P = formaSwift(rp, pw, ph), TP = derivada(P, F, T), pad = b ? `\n    ${lados4(bw)} // dentro del borde` : '';
  if (!s.x && !s.y && !s.b) return s.s > 0 ? { capa: lineaPor(P, TP, cc, s.s) + ` // sombra interior: aro de ${n2(s.s)}` + pad } : null;
  const I = formaSwift(crecer(rp, -s.s), pw - 2 * s.s, ph - 2 * s.s), TI = I.s === P.s ? TP : derivada(I, F, T), M = Math.ceil(Math.abs(s.x) + Math.abs(s.y) + Math.abs(s.s) + 1.5 * s.b + 4);
  // con .mask (un agujero con destinationOut dentro de un ZStack deja pasar un poco de color en SwiftUI)
  return { capa: [`Rectangle() // sombra interior: el color fuera de la forma de adentro${s.s ? ` (achicada ${n2(s.s)})` : ''}${s.x || s.y ? ` movida ${n2(s.x)}, ${n2(s.y)}` : ''}`, `    .fill(${cc})`, `    .padding(${-M})`,
    `    .mask {\n        Rectangle()\n            .padding(${-M})\n            .overlay(${TI}${s.s ? `.padding(${n2(s.s)})` : ''}${s.x || s.y ? `.offset(x: ${n2(s.x)}, y: ${n2(s.y)})` : ''}.blendMode(.destinationOut))\n            .compositingGroup()\n    }`,
    s.b ? `    .blur(radius: ${n2(KB * s.b / 2)}) // blur ${n2(s.b)} de CSS = σ ${n2(s.b / 2)}` : '', `    .clipShape(${TP})`].filter(Boolean).join('\n') + pad };
}
const BLEND = { multiply: 'multiply', screen: 'screen', overlay: 'overlay', darken: 'darken', lighten: 'lighten', 'color-dodge': 'colorDodge', 'color-burn': 'colorBurn', 'hard-light': 'hardLight', 'soft-light': 'softLight', difference: 'difference', exclusion: 'exclusion', hue: 'hue', saturation: 'saturation', color: 'color', luminosity: 'luminosity', 'plus-lighter': 'plusLighter' };
/** Un filtro de CSS en SwiftUI: { mod } o { nota } si no hay equivalente */
export function filtroSwift(x) {
  switch (x.f) {
    case 'blur': return { mod: `.blur(radius: ${n2(KB * x.v)}) // blur(${n2(x.v)}) de CSS = σ ${n2(x.v)}` };
    case 'drop-shadow': return { mod: `.shadow(color: ${swiftColor(x.c)}, radius: ${n2(x.b)}, x: ${n2(x.x)}, y: ${n2(x.y)}) // drop-shadow: su blur ya es σ (no se divide)` };
    case 'saturate': return { mod: `.saturation(${n3(x.v)})` };
    case 'grayscale': return { mod: `.grayscale(${n3(x.v)})` };
    case 'contrast': return { mod: `.contrast(${n3(x.v)}) // igual en lo opaco; en bordes semitransparentes SwiftUI lo aplica al color premultiplicado` };
    case 'hue-rotate': return { mod: `.hueRotation(.degrees(${n2(x.v)}))` };
    case 'opacity': return { mod: `.opacity(${n3(x.v)})` };
    case 'invert': return x.v === 1 ? { mod: '.colorInvert()' } : { nota: `invert(${x.v}): SwiftUI solo invierte del todo` };
    // brightness() de CSS multiplica; .brightness() de SwiftUI suma: hasta 1, multiplicar por un gris es lo mismo
    case 'brightness': return x.v <= 1 ? { mod: `.colorMultiply(Color(white: ${n3(x.v)})) // brightness(${x.v}) de CSS multiplica; .brightness() de SwiftUI suma` } : { nota: `brightness(${x.v}) multiplica por más de 1 y SwiftUI no lo tiene (.brightness suma)` };
    default: return { nota: `${x.f}(…): sin equivalente en SwiftUI` };
  }
}
export const notaVidrio = v => `// Vidrio (aproximación): en la web desenfoca lo de atrás con backdrop-filter: ${v.css} (σ ${n2(v.blur)}${v.sat !== 1 ? `, saturación ×${n2(v.sat)}` : ''}).\n// SwiftUI no tiene desenfoque de fondo con radio a elegir: .ultraThinMaterial es el que menos tiñe (Apple no publica su radio).\n// En iOS 26, .glassEffect() (Liquid Glass) además refracta y brilla: se ve distinto. Encima va el relleno exacto.`;
/** Lo que pinta la caja, de abajo a arriba (sombras, vidrio, fondo, sombras interiores, borde) y lo que va encima (pseudo-elementos, contorno) */
export function decoracion(E, w, h, { sinFondo = false, imagen = false, T = '§F' } = {}) {
  const r = E.esq, F = formaSwift(r, w, h), fo = sinFondo || E.fondo.texto ? { base: null, capas: [] } : E.fondo, opaca = !imagen && fondoOpaco(fo);
  const abajo = [], encima = [], notas = [], fuera = E.sombras.filter(s => !s.inset), dentro = E.sombras.filter(s => s.inset);
  const sola = fuera.length === 1 && !fuera[0].s && opaca; let iOpaca = -1;
  if (!sola) [...fuera].reverse().forEach(s => abajo.push(sombraSwift(s, r, w, h, opaca, T, undefined, true).capa)); // la última de CSS queda abajo
  if (E.vidrio) { abajo.push(`${T}\n    .fill(.ultraThinMaterial) // vidrio: aproximación (ver la nota de arriba)`); notas.push(notaVidrio(E.vidrio)); }
  if (fo.base) { if (opaco(fo.base)) iOpaca = abajo.length; abajo.push(relleno(T, swiftColor(fo.base))); }
  [...fo.capas].reverse().forEach(c => {
    if (c.st?.length) { const g = capaSwift(c, w, h); if (iOpaca < 0 && c.st.every(x => opaco(x.c))) iOpaca = abajo.length; abajo.push(g.estilo ? relleno(T, g.estilo) : `${g.vista}\n    .clipShape(${T})`); if (c.aprox) notas.push('// una pista de color (una posición sola entre dos colores) va aproximada con 7 paradas'); if (!/^(auto|auto auto)$/.test(c.size || 'auto')) notas.push(`// el degradado tiene background-size ${c.size}: aquí ocupa toda la caja`); }
    else if (c.tipo === 'imagen') abajo.push(`Image("fondo") // background-image: ${c.css.slice(0, 90)} · ajuste: ${c.size} · ${c.pos} · ${c.rep}\n    .resizable()${c.size === 'cover' ? '\n    .scaledToFill()' : c.size === 'contain' ? '\n    .scaledToFit()' : ''}\n    .frame(width: ${n2(w)}, height: ${n2(h)}${alineacion(c.pos, w, h) && alineacion(c.pos, w, h) !== '.center' ? `, alignment: ${alineacion(c.pos, w, h)}` : ''})\n    .clipShape(${T})`);
    else notas.push(`// capa de fondo sin traducir: ${c.css.slice(0, 120)}`);
  });
  if (sola) { const m = sombraSwift(fuera[0], r, w, h, true).mod; if (iOpaca >= 0) abajo[iOpaca] += `\n    ${m}`; else notas.push('// sombra: ' + m); }
  [...dentro].reverse().forEach(s => { const x = sombraDentro(s, r, w, h, E.bordes.anchos, T); if (x) abajo.push(x.capa); });
  const B = E.bordes;
  if (B.uni) abajo.push(lineaPor(F, T, swiftColor(B.uni.c), B.uni.w) + (B.uni.estilo !== 'solid' ? ` // borde ${B.uni.estilo}: aquí continuo` : ' // borde'));
  else B.lados.forEach(l => { const v = /Top|Bottom/.test(l.lado); abajo.push(`Rectangle()\n    .fill(${swiftColor(l.c)})\n    .frame(${v ? 'height' : 'width'}: ${n2(l.w)}) // borde ${{ Top: 'de arriba', Bottom: 'de abajo', Left: 'izquierdo', Right: 'derecho' }[l.lado]}\n    .frame(${v ? 'maxHeight' : 'maxWidth'}: .infinity, alignment: .${{ Top: 'top', Bottom: 'bottom', Left: 'leading', Right: 'trailing' }[l.lado]})${F.s !== 'Rectangle()' ? `\n    .clipShape(${T}) // aproximación: CSS afina el borde en la curva` : ''}`); });
  E.pseudo.forEach((p, i) => encima.push(pseudoSwift(p, i)));
  const C = E.contorno;
  if (C && C.c?.alfa > 0) { const d = C.o + C.w, O = formaSwift(r.map(c => c.map(v => v > 0 ? Math.max(0, v + d) : 0)), w + 2 * d, h + 2 * d); encima.push(lineaPor(O, d ? derivada(O, F, T) : T, swiftColor(C.c), C.w) + (d ? `\n    .padding(${n2(-d)}) // contorno a ${n2(C.o)} del borde` : ` // contorno (outline ${n2(C.w)}, offset ${n2(C.o)}): cae justo por dentro del borde`)); }
  return { F, abajo, encima, notas, opaca };
}
export function pseudoSwift(p, i) {
  const T = `§P${i}`, F = formaSwift(p.esq, p.w, p.h), D = decoracion({ ...p, fondo: p.mascara?.aro ? { base: null, capas: [], texto: false } : p.fondo, vidrio: null, contorno: null, pseudo: [] }, p.w, p.h, { T });
  const capas = [...D.abajo];
  if (p.mascara?.aro) { const g = p.fondo.capas.find(c => c.st?.length), e = g && capaSwift(g, p.w, p.h).estilo; capas.push(`${T}\n    .strokeBorder(${resto(e || swiftColor(p.fondo.base))}, lineWidth: ${n2(p.pad[0])}) // aro de ${n2(p.pad[0])} pintado con su degradado (la máscara exclude deja solo el padding)`); }
  let s = capas.length > 1 ? `ZStack { // ${p.p}\n${sangra(capas.join('\n'))}\n}` : `// ${p.p}\n${capas[0] || 'Color.clear'}`;
  if (p.texto) s += `\n    .overlay(Text("${p.texto.replace(/"/g, '\\"')}")) // el ${p.p} lleva el texto «${p.texto}»`;
  s += `\n    .frame(width: ${n2(p.w)}, height: ${n2(p.h)})`;
  if (p.tr && !p.tr.es3d) { if (p.tr.sx !== 1 || p.tr.sy !== 1) s += `\n    .scaleEffect(x: ${p.tr.sx}, y: ${p.tr.sy})`; if (p.tr.giro) s += `\n    .rotationEffect(.degrees(${p.tr.giro}))`; }
  if (p.opacidad < 1) s += `\n    .opacity(${n3(p.opacidad)})`;
  if (p.abs && (Math.abs(p.x) > .01 || Math.abs(p.y) > .01 || p.tr)) s += `\n    .position(x: ${n2(p.x + p.w / 2)}, y: ${n2(p.y + p.h / 2)})`;
  return s.split(T).join(F.s.includes('\n') ? 'Rectangle()' : F.s);
}
// object-position o background-position → una de las 9 alineaciones de SwiftUI, o null
const alineacion = (pos, w, h) => {
  const [a, b] = String(pos || '50% 50%').split(/\s+/), f = (v, ref) => /%$/.test(v) ? parseFloat(v) / 100 : largo(v, ref) === 0 ? 0 : null, x = f(a, w), y = f(b ?? '50%', h);
  const X = { 0: 'leading', 0.5: '', 1: 'trailing' }[x], Y = { 0: 'top', 0.5: '', 1: 'bottom' }[y];
  if (X == null || Y == null) return null; const n = Y + (Y && X ? X[0].toUpperCase() + X.slice(1) : X); return '.' + (n || 'center');
};
/** La imagen como la dibuja object-fit / object-position (cover: más grande y recortada; contain: entera; fill: estirada) */
function imagenSwift(E, nombre, w, h, T) {
  const im = E.img, [nw, nh] = im.nat, F = formaSwift(E.esq, w, h), L = [`Image("${nombre || 'imagen'}")`, '    .resizable()'];
  const s = !nw || !nh ? null : { cover: Math.max(w / nw, h / nh), contain: Math.min(w / nw, h / nh), none: 1, 'scale-down': Math.min(1, w / nw, h / nh) }[im.fit];
  const recorte = F.s === 'Rectangle()' ? '    .clipped()' : `    .clipShape(${T})`;
  if (im.fit === 'fill' || !s) { L.push(`    .frame(width: ${pt(w)}, height: ${pt(h)})${nw && Math.abs(nw / nh - w / h) > .02 ? ' // object-fit: fill: se estira a la caja, como en la web' : ''}`); if (F.s !== 'Rectangle()') L.push(recorte); return L; }
  const al = alineacion(im.pos, w, h), dw = nw * s, dh = nh * s;
  if (al && im.fit !== 'none' && im.fit !== 'scale-down') L.push(`    .${im.fit === 'cover' ? 'scaledToFill' : 'scaledToFit'}() // object-fit: ${im.fit}`, `    .frame(width: ${pt(w)}, height: ${pt(h)}${al !== '.center' ? `, alignment: ${al}) // object-position: ${im.pos}` : ')'}`);
  else { const [a, b = '50%'] = String(im.pos).split(/\s+/), ox = /%$/.test(a) ? (w - dw) * parseFloat(a) / 100 : largo(a), oy = /%$/.test(b) ? (h - dh) * parseFloat(b) / 100 : largo(b); L.push(`    .frame(width: ${n2(dw)}, height: ${n2(dh)}) // object-fit: ${im.fit}: se dibuja a ${n2(dw)} × ${n2(dh)}`, `    .offset(x: ${n2(ox)}, y: ${n2(oy)}) // object-position: ${im.pos}`, `    .frame(width: ${pt(w)}, height: ${pt(h)}, alignment: .topLeading)`); }
  if (im.fit === 'cover' || F.s !== 'Rectangle()' || !al) L.push(recorte);
  return L;
}
// giro total de un keyframe (sumando rotate(): 540° son 540°, la matriz los dejaría en 180°)
const giroTexto = t => { const g = [...String(t).matchAll(/rotate(?:Z)?\(([^)]+)\)/g)].map(m => grados(m[1])); return /matrix|rotate3d|rotateX|rotateY|skew/.test(t) || g.some(Number.isNaN) ? null : g.reduce((a, b) => a + b, 0); };
/** La animación en SwiftUI (iOS 17: keyframeAnimator, con la misma curva de CSS en cada tramo) o null si no se puede traducir */
export function animSwift(a, w, h, T = '§F', F = null) {
  const D = a.dur / 1000; if (!(D > 0) || a.props.some(p => !/^(transform|opacity|boxShadow)$/.test(p))) return null;
  const pistas = {}, ag = (p, o, v, e) => (pistas[p] ||= []).push({ o, v, e }); let colorS = null;
  for (const k of a.kf) {
    if (k.transform !== undefined) {
      let m; try { m = new DOMMatrix(k.transform === 'none' ? undefined : k.transform); } catch { return null; }
      const t = transformDe({ transform: k.transform }, w, h) || { giro: 0, sx: 1, sy: 1 }; if (t.es3d) return null;
      ag('x', k.offset, m.e, k.easing); ag('y', k.offset, m.f, k.easing); ag('giro', k.offset, giroTexto(k.transform) ?? t.giro, k.easing); ag('sx', k.offset, Math.abs(t.sx), k.easing); ag('sy', k.offset, t.sy, k.easing);
    }
    if (k.opacity !== undefined) ag('opacidad', k.offset, +k.opacity, k.easing);
    if (k.boxShadow !== undefined) { const s = sombrasDe(k.boxShadow)[0] || { x: 0, y: 0, b: 0, s: 0, c: { hex: '#000000', alfa: 0 } }; if (s.inset) return null; colorS ||= s.c.alfa > 0 ? s.c : null; ag('sombraX', k.offset, s.x, k.easing); ag('sombraY', k.offset, s.y, k.easing); ag('sombraBlur', k.offset, s.b, k.easing); ag('spread', k.offset, s.s, k.easing); ag('sombraAlfa', k.offset, s.c.alfa, k.easing); }
  }
  const base = { x: 0, y: 0, giro: 0, sx: 1, sy: 1, opacidad: 1, sombraX: 0, sombraY: 0, sombraBlur: 0, spread: 0, sombraAlfa: 0 };
  for (const [p, l] of Object.entries(pistas)) { if (l.every(x => Math.abs(x.v - l[0].v) < 1e-6)) { base[p] = l[0].v; delete pistas[p]; continue; } l.sort((x, y) => x.o - y.o); if (l[0].o > 0) l.unshift({ o: 0, v: base[p], e: 'ease' }); if (l.at(-1).o < 1) l.push({ o: 1, v: base[p], e: 'ease' }); }
  if (!Object.keys(pistas).length) return null;
  const vuelta = /alternate/.test(a.dir), rev = /reverse/.test(a.dir), inf = a.it === Infinity, n = inf ? 1 : Math.max(1, Math.round(a.it));
  const espejo = c => c && [1 - c[2], 1 - c[3], 1 - c[0], 1 - c[1]], atras = s => [...s].reverse().map(x => ({ v: x.desde, d: x.d, c: espejo(x.c), desde: x.v }));
  const seg = l => { let s = []; for (let i = 1; i < l.length; i++) s.push({ v: l[i].v, d: (l[i].o - l[i - 1].o) * D, c: curvaDe(l[i - 1].e), desde: l[i - 1].v }); if (rev) s = atras(s); if (vuelta) s = [...s, ...atras(s)]; return Array.from({ length: n }, () => s).flat(); };
  let sinCurva = false;
  const curva = c => { if (!c) { sinCurva = true; return ''; } return c.join() === '0,0,1,1' ? '' : `, timingCurve: .bezier(startControlPoint: UnitPoint(x: ${n3(c[0])}, y: ${n3(c[1])}), endControlPoint: UnitPoint(x: ${n3(c[2])}, y: ${n3(c[3])}))`; };
  const nombre = 'Fotograma' + String(a.nombre || 'Anim').replace(/(^|[^a-zA-Z0-9])([a-zA-Z0-9])/g, (_, __, x) => x.toUpperCase()).replace(/[^a-zA-Z0-9]/g, '');
  const ini = p => rev ? pistas[p].at(-1).v : pistas[p][0].v, tipoDe = p => /^(x|y|spread|sombraX|sombraY|sombraBlur)$/.test(p) ? 'CGFloat' : 'Double', v = p => p in pistas ? `v.${p}` : n3(base[p]);
  const tracks = Object.keys(pistas).map(p => `    KeyframeTrack(\\.${p}) {\n${seg(pistas[p]).map(x => `        LinearKeyframe(${n3(x.v)}, duration: ${n3(x.d)}${curva(x.c)})`).join('\n')}\n    }`);
  const cuerpo = ['vista'];
  if (['spread', 'sombraAlfa', 'sombraBlur', 'sombraX', 'sombraY'].some(p => p in pistas)) {
    const Fr = F?.r != null ? `RoundedRectangle(cornerRadius: ${n2(F.r)} + ${v('spread')}, style: .circular)` : T; // en CSS las esquinas crecen con el spread
    cuerpo.push(`    .background(${Fr}.fill(${swiftColor({ hex: colorS?.hex || '#000000', alfa: 1 })}.opacity(${v('sombraAlfa')}))${'spread' in pistas || base.spread ? `.padding(-${v('spread')})` : ''}${'sombraX' in pistas || 'sombraY' in pistas || base.sombraX || base.sombraY ? `.offset(x: ${v('sombraX')}, y: ${v('sombraY')})` : ''}${'sombraBlur' in pistas || base.sombraBlur ? `.blur(radius: ${v('sombraBlur')} * ${n3(KB / 2)})` : ''}) // la box-shadow animada`);
  }
  if ('sx' in pistas || 'sy' in pistas || base.sx !== 1 || base.sy !== 1) cuerpo.push(`    .scaleEffect(x: ${v('sx')}, y: ${v('sy')})`);
  if ('giro' in pistas || base.giro) cuerpo.push(`    .rotationEffect(.degrees(${v('giro')}))`);
  if ('x' in pistas || 'y' in pistas || base.x || base.y) cuerpo.push(`    .offset(x: ${v('x')}, y: ${v('y')})`);
  if ('opacidad' in pistas || base.opacidad !== 1) cuerpo.push(`    .opacity(${v('opacidad')})`);
  const notas = [a.delay ? `// retraso de ${n3(a.delay / 1000)} s antes de empezar: keyframeAnimator no lo tiene; arrancarla con ese retraso` : '', a.easing !== 'linear' ? `// además, curva de toda la animación: ${a.easing}` : ''].filter(Boolean);
  const out = [...notas, `.keyframeAnimator(initialValue: ${nombre}(), repeating: ${inf}) { vista, v in`, sangra(cuerpo.join('\n')), '} keyframes: { _ in', tracks.join('\n'), '}'];
  if (sinCurva) out.unshift('// un tramo con steps() no tiene curva equivalente: va lineal');
  return { codigo: out.join('\n'), tipo: `struct ${nombre} { ${Object.keys(pistas).map(p => `var ${p}: ${tipoDe(p)} = ${n3(ini(p))}`).join('; ')} }` };
}
/** Lo que va sobre toda la vista, en el orden de CSS: filtros → recorte → máscara → opacidad → mezcla → transformación */
function finales(E, w, h, T, varias) {
  const L = [], notas = [], grupo = varias && (E.filtros.length || (E.mascara && !E.mascara.aro) || E.opacidad < 1 || E.mezcla);
  if (E.recorta) notas.push(`// lo de adentro va recortado a su forma: .clipShape(${T}) (overflow: hidden)`);
  if (grupo) L.push('.compositingGroup() // en CSS lo de abajo se aplica al conjunto; en SwiftUI, sin esto, va hoja por hoja');
  const hor = E.horneado ? E.horneado.match(/[a-z-]+\(/g).length : 0;
  if (hor) notas.push(`// el PNG de la imagen ya trae ${E.horneado} (SwiftUI no tiene ${E.filtros.slice(0, hor).filter(x => filtroSwift(x).nota).map(x => `${x.f}(${x.v})`).join(', ')}): no se repiten aquí`);
  E.filtros.slice(hor).forEach(x => { const s = filtroSwift(x); if (s.mod) L.push(s.mod); else notas.push('// ' + s.nota); });
  if (E.recorte) notas.push(`// clip-path: ${E.recorte}: sin traducir`);
  if (E.mascara && !E.mascara.aro) { const c = E.mascara.capas[0]; if (E.mascara.capas.length === 1 && c?.st?.length) { const g = capaSwift(c, w, h); L.push(g.estilo ? `.mask { // mask-image: degradado ${c.tipo}\n    Rectangle()\n        .fill(${resto(g.estilo, 8)})\n}` : `.mask { // mask-image\n${sangra(g.vista)}\n}`); } else notas.push(`// mask-image: ${E.mascara.css.slice(0, 100)}: sin traducir`); }
  if (E.opacidad < 1) L.push(`.opacity(${n3(E.opacidad)})`);
  if (E.mezcla) { if (BLEND[E.mezcla]) L.push(`.blendMode(.${BLEND[E.mezcla]})`); else notas.push(`// mix-blend-mode: ${E.mezcla}: sin equivalente`); }
  const t = E.tr;
  if (t?.es3d) L.push(t.eje ? `.rotation3DEffect(.degrees(${t.g}), axis: (x: ${t.eje[0]}, y: ${t.eje[1]}, z: ${t.eje[2]})) // volteo 3D: en pantalla se compone con sus contenedores` : `// transformación 3D sin traducir: ${t.m}`);
  else if (t) { if (t.sx !== 1 || t.sy !== 1) L.push(t.sx === t.sy ? `.scaleEffect(${t.sx})` : `.scaleEffect(x: ${t.sx}, y: ${t.sy})${t.sx < 0 ? ' // en espejo' : ''}`); if (t.giro) L.push(`.rotationEffect(.degrees(${t.giro}))`); if (t.inclina) notas.push('// además lleva una inclinación (skew): sin traducir'); }
  return { L, notas };
}
/** Arma el código final: la forma de la caja sale como «let forma = …» si se repite o es un Path */
function conForma(lineas, F, notas = [], tipos = []) {
  let s = lineas.join('\n'); const usos = s.split('§F').length - 1, pre = [...notas];
  const nombre = usos > 1 || (usos && F.s.includes('\n')) ? 'forma' : F.s.includes('\n') ? 'forma' : F.s;
  if (nombre === 'forma' && usos) pre.push(`let forma = ${F.s}`);
  s = s.split('§F').join(nombre);
  return [...pre.map(x => x.split('§F').join(nombre)), s, ...(tipos.length ? ['', ...tipos] : [])].join('\n');
}

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
/** Los colores que de verdad pinta un SVG (trazo o relleno de sus formas visibles), no el «color» que hereda */
export function pinturaSvg(svg) {
  const out = new Map();
  for (const n of svg.querySelectorAll('path, circle, rect, line, polyline, polygon, ellipse, text, use')) {
    const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    for (const [p, o] of [[cs.stroke, +cs.strokeOpacity * (parseFloat(cs.strokeWidth) > 0 ? 1 : 0)], [cs.fill, +cs.fillOpacity]]) { const c = color(p); if (c && c.alfa * o > 0) { const k = { hex: c.hex, alfa: +(c.alfa * o).toFixed(3) }; out.set(k.hex + k.alfa, k); } }
  }
  return [...out.values()];
}
/** Todo lo que se puede leer de una capa, en pt */
export function ficha(el) {
  const cs = getComputedStyle(el), t = tipo(el), c = cajaPantalla(el), E = efectosDe(el, cs, c);
  const texto = TEXTO(el) || (t === 'boton' && el.textContent.trim()) ? el.textContent.trim().replace(/\s+/g, ' ') : '';
  const fondo = cs.backgroundImage !== 'none' && !cs.backgroundImage.startsWith('url(') ? { degradado: cs.backgroundImage, colores: coloresDe(cs.backgroundImage) } : null;
  const relleno = !transparente(cs.backgroundColor) ? color(cs.backgroundColor) : null;
  const bw = parseFloat(cs.borderTopWidth);
  // una capa girada o escalada (ella, su animación o su contenedor) mide lo que mide su caja y va centrada donde se ve
  const gira = E.tr || E.animado.has('transform') || transformArriba(el), cx = c.x + c.w / 2, cy = c.y + c.h / 2;
  const [x, y, w, h] = gira ? [cx - E.w / 2, cy - E.h / 2, E.w, E.h] : [c.x, c.y, c.w, c.h];
  return {
    el, tipo: t, nombre: nombreDe(el, t),
    x, y, w, h, ef: E,
    radio: formaSwift(E.esq, E.w, E.h).txt,
    opacidad: E.opacidad < 1 ? Math.round(E.opacidad * 100) + ' %' : '',
    relleno, fondo,
    borde: bw > 0 ? { ancho: bw, color: color(cs.borderTopColor), estilo: cs.borderTopStyle } : null,
    sombra: cs.boxShadow !== 'none' ? cs.boxShadow : '',
    desenfoque: E.vidrio?.css || '',
    // la fuente es la que se dibuja (la caja ya forzó el layout, así que el navegador ya pidió las caras que necesita)
    texto, fuente: texto ? { ...fuenteDibujada(el, cs), tam: parseFloat(cs.fontSize), alto: cs.lineHeight === 'normal' ? null : parseFloat(cs.lineHeight), tracking: cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing), color: color(cs.color), alin: cs.textAlign } : null,
    iconoColor: t === 'svg' ? pinturaSvg(el)[0] || color(cs.color) : null, iconoColores: t === 'svg' ? pinturaSvg(el) : null,
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
/** El código SwiftUI de la capa, con todo lo que se ve. Lo que SwiftUI no tiene igual va dicho en un comentario, con los valores exactos */
// «ft»: la ficha del texto si es de un hijo (el botón cuyo texto va en un span): su fuente, su color y sus sombras
// «contenido»: lo que va encima de la caja (el ícono de un botón que solo lleva un ícono)
export function swift(f, nombreAsset, ft = f, contenido = '') {
  const E = f.ef, w = E.w, h = E.h, fr = `.frame(width: ${pt(w)}, height: ${pt(h)})`, F = formaSwift(E.esq, w, h), L = [], tipos = [];
  const medio = /^(anim|img|svg)$/.test(f.tipo), D = decoracion(E, w, h, { imagen: medio }), notas = [...D.notas];
  const fondo = D.abajo.length ? D.abajo.length === 1 ? `.background {\n${sangra(D.abajo[0])}\n}` : `.background {\n    ZStack {\n${sangra(D.abajo.join('\n'), 8)}\n    }\n}` : '';
  const encima = D.encima.length ? `.overlay {\n${sangra(D.encima.length === 1 ? D.encima[0] : `ZStack {\n${sangra(D.encima.join('\n'))}\n}`)}\n}` : '';
  let hojas = 1 + D.abajo.length + D.encima.length;
  if (f.tipo === 'anim') L.push(`LottieView(animation: .named("${f.el.dataset.anim}"))`, '    .playing(loopMode: .loop)', `    ${fr}`);
  else if (f.tipo === 'img') L.push(...imagenSwift(E, nombreAsset, w, h, '§F'));
  else if (f.tipo === 'svg') L.push(`Image("${nombreAsset || 'icono'}")`, ...(f.iconoColores?.length > 1 ? [`    .renderingMode(.original) // lleva ${f.iconoColores.length} colores: van en el SVG`] : ['    .renderingMode(.template)', `    .foregroundStyle(${swiftColor(f.iconoColor)})`]), `    ${fr}`);
  else if (f.texto) {
    const T2 = ft?.ef || E, fu = ft?.fuente || f.fuente, txt = `Text("${f.texto.replace(/"/g, '\\"')}")`, g = T2.fondo.texto && T2.fondo.capas.find(c => c.st?.length);
    const est = g ? capaSwift(g, T2.w, T2.h).estilo : null;
    L.push(txt, `    ${swiftFuente(fu)}`, `    .foregroundStyle(${est ? resto(est) : swiftColor(fu.color)})${est ? ' // background-clip: text: el texto se pinta con el degradado (medido sobre su caja)' : ''}`);
    if (g && !est) notas.push('// el texto se pinta con un degradado radial que no es de la proporción de su caja: sin traducir exacto');
    if (fu.alto) L.push(`    .lineSpacing(${pt(Math.max(0, fu.alto - fu.tam))})`);
    if (fu.tracking) L.push(`    .tracking(${pt(fu.tracking)})`);
    // text-shadow: la 1.ª con .shadow; las demás, copias desenfocadas detrás (.shadow encadenado haría la sombra de la sombra)
    T2.sombraTexto.forEach((s, i) => L.push(i === 0 ? `    .shadow(color: ${swiftColor(s.c)}, radius: ${n2(s.b / 2)}, x: ${n2(s.x)}, y: ${n2(s.y)}) // text-shadow (blur ${n2(s.b)} de CSS = σ ${n2(s.b / 2)})`
      : `    .background { // ${i + 1}.ª sombra del texto\n        ${txt}\n            ${swiftFuente(fu)}\n            .foregroundStyle(${swiftColor(s.c)})${fu.tracking ? `\n            .tracking(${pt(fu.tracking)})` : ''}\n            .offset(x: ${n2(s.x)}, y: ${n2(s.y)})${s.b ? `\n            .blur(radius: ${n2(KB * s.b / 2)})` : ''}\n    }`));
    if (fondo || encima) L.push(`    ${fr}`);
  } else {
    const todas = [...D.abajo, ...D.encima]; hojas = todas.length;
    if (!todas.length) L.push('Color.clear // no pinta nada propio: lo que se ve es lo de adentro', `    ${fr}`);
    else L.push(todas.length === 1 ? todas[0] : `ZStack {\n${sangra(todas.join('\n'))}\n}`, `    ${fr}`);
    if (contenido) { L.push(sangra(`.overlay {\n${sangra(contenido)}\n}`)); hojas++; }
  }
  if (medio || f.texto) { if (fondo) L.push(sangra(fondo)); if (encima) L.push(sangra(encima)); }
  if (E.pseudo.some(p => p.anim.length)) notas.push(`// el ${E.pseudo.find(p => p.anim.length).p} se anima: ver «Animación» en el panel`);
  const fin = finales(medio ? { ...E, recorta: false } : E, w, h, '§F', hojas > 1); notas.push(...fin.notas); L.push(...fin.L.map(x => sangra(x)));
  E.anim.forEach(a => { const s = animSwift(a, w, h, '§F', F); if (s) { L.push(sangra(s.codigo)); tipos.push(s.tipo); } else notas.push(`// animación «${a.nombre || 'de JS'}»: sin traducir (ver sus keyframes en el panel)`); });
  if ((E.filtros.length || E.opacidad < 1 || E.tr || E.anim.length || (E.mascara && !E.mascara.aro)) && f.el.children.length && !medio) notas.push('// lo de adentro va dentro de esta vista: estos efectos también lo afectan');
  const H = E.heredado; if (H.de.length || H.filtros.length) notas.push(`// en pantalla también la afecta su contenedor: ${[H.de.length && `se ve al ${Math.round(H.op * 100)} %`, H.filtros.length && H.filtros.map(x => x.css).join(' ')].filter(Boolean).join(' · ')} (va en el contenedor)`);
  return conForma(L, F, notas, tipos);
}
/** Una card que se entrega como PNG: la imagen y lo que va en código (sombras de afuera, filtros, opacidad, giro). Las sombras interiores ya vienen en el PNG */
export function swiftPieza(f, arch) {
  const E = f.ef, w = E.w, h = E.h, F = formaSwift(E.esq, w, h), fuera = E.sombras.filter(s => !s.inset), opaca = fondoOpaco(E.fondo), sola = fuera.length === 1 && !fuera[0].s && opaca;
  const L = [`Image("${arch}")`, '    .resizable()', `    .frame(width: ${pt(w)}, height: ${pt(h)})`], notas = [];
  if (sola) L.push('    ' + sombraSwift(fuera[0], E.esq, w, h, true).mod);
  else if (fuera.length) { const c = [...fuera].reverse().map(s => sombraSwift(s, E.esq, w, h, opaca, '§F', undefined, true).capa); L.push(sangra(`.background {\n${sangra(c.length === 1 ? c[0] : `ZStack {\n${sangra(c.join('\n'))}\n}`)}\n}`)); }
  if (E.sombras.some(s => s.inset)) notas.push('// sus sombras interiores ya vienen en el PNG');
  if (F.s !== 'Rectangle()') notas.push('// sus esquinas ya vienen recortadas en el PNG (lo de afuera es transparente)');
  // el contorno (outline) va en código: el PNG sale sin él
  const C = decoracion({ ...E, fondo: { base: null, capas: [], texto: false }, sombras: [], vidrio: null, bordes: { anchos: [0, 0, 0, 0], lados: [], uni: null }, pseudo: [] }, w, h).encima;
  if (C.length) L.push(sangra(`.overlay {\n${sangra(C[0])}\n}`));
  const fin = finales({ ...E, mascara: null, recorta: false }, w, h, '§F', (fuera.length > 0 && !sola) || C.length > 0); notas.push(...fin.notas); L.push(...fin.L.map(x => sangra(x)));
  const tipos = []; E.anim.forEach(a => { const x = animSwift(a, w, h, '§F', F); if (x) { L.push(sangra(x.codigo)); tipos.push(x.tipo); } else notas.push(`// animación «${a.nombre || 'de JS'}»: sin traducir (ver sus keyframes en el panel)`); });
  const H = E.heredado; if (H.de.length || H.filtros.length) notas.push(`// en pantalla también la afecta su contenedor: ${[H.de.length && `se ve al ${Math.round(H.op * 100)} %`, H.filtros.length && H.filtros.map(x => x.css).join(' ')].filter(Boolean).join(' · ')} (va en el contenedor; el PNG no lo trae)`);
  return conForma(L, F, notas, tipos);
}
/** Para un código hecho a mano (el SF Symbol sugerido): filtros, opacidad, giro y animación de la capa */
export function finalesSwift(E) { const fin = finales({ ...E, recorta: false }, E.w, E.h, formaSwift(E.esq, E.w, E.h).s, false), an = E.anim.map(a => animSwift(a, E.w, E.h, 'Rectangle()')).filter(Boolean); return { L: [...fin.L, ...an.map(a => a.codigo)], notas: fin.notas, tipos: an.map(a => a.tipo) }; }

// ---------- Descargas ----------
export function bajar(blob, nombre) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
export const traer = async r => { const res = await fetch(r); if (!res.ok) throw new Error(r); return res.blob(); };
const cargarImagen = src => new Promise((ok, mal) => { const im = new Image(); im.onload = () => ok(im); im.onerror = mal; im.src = src; });
/** PNG a la escala pedida para un ancho en pt, siempre con la proporción del original (estirarla a la caja la deformaría:
 *  con object-fit cover o contain la caja no tiene su forma); si el original no alcanza, sale a su tamaño */
export async function png(src, ptW, ptH, k, filtro = '') { // eslint-disable-line no-unused-vars
  const im = await cargarImagen(src);
  const ancho = Math.round(ptW * k), alto = Math.round(ancho * im.naturalHeight / im.naturalWidth);
  const corto = ancho > im.naturalWidth * 1.02;
  const w = corto ? im.naturalWidth : ancho, h = corto ? im.naturalHeight : alto;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const x = cv.getContext('2d'); x.imageSmoothingQuality = 'high'; if (filtro) x.filter = filtro; x.drawImage(im, 0, 0, w, h); // el filtro del canvas es el mismo de CSS
  return { blob: await new Promise(ok => cv.toBlob(ok, 'image/png')), w, h, corto };
}
// lo que pinta cada nodo del SVG; el CSS de la página se pasa a atributos para que el archivo suelto se vea igual
const PINTA = ['fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset', 'opacity', 'display', 'visibility', 'filter', 'transform', 'mix-blend-mode'];
const LETRA = ['font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'letter-spacing'];
/** El SVG tal como se ve: currentColor resuelto y los estilos del CSS como atributos. Lo de la raíz (opacidad, filtro, giro) va en el código */
export function svgTexto(el) {
  const c = el.cloneNode(true), col = getComputedStyle(el).color, r = el.getBoundingClientRect(), s = escala();
  c.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  if (!c.getAttribute('viewBox')) c.setAttribute('viewBox', `0 0 ${r.width / s} ${r.height / s}`);
  const a = [el, ...el.querySelectorAll('*')], b = [c, ...c.querySelectorAll('*')];
  a.forEach((o, i) => {
    const cs = getComputedStyle(o), d = b[i]; if (!d) return;
    d.removeAttribute('style'); d.removeAttribute('class');
    for (const p of [...PINTA, ...(/^(text|tspan|textPath)$/.test(o.tagName) ? LETRA : [])]) {
      if (i === 0 && /^(opacity|filter|transform|mix-blend-mode|display|visibility)$/.test(p)) continue;
      const v = cs.getPropertyValue(p).trim();
      if (!v || (v === 'none' && /^(filter|transform|stroke-dasharray)$/.test(p)) || (p === 'display' && v !== 'none') || (p === 'visibility' && v === 'visible') || (p === 'mix-blend-mode' && v === 'normal')) continue;
      d.setAttribute(p, v.replace(/url\("(#[^"]+)"\)/g, 'url($1)'));
    }
  });
  if (!c.getAttribute('width')) { c.setAttribute('width', String(n2(r.width / s))); c.setAttribute('height', String(n2(r.height / s))); }
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
export const giroDe = el => { const t = transformDe(getComputedStyle(el), el.offsetWidth, el.offsetHeight); return t && !t.es3d ? t.giro : 0; }; // transform y la propiedad rotate; un volteo 3D no es un giro

let h2i = null;
const libreria = () => h2i ??= new Promise((ok, mal) => {
  if (window.htmlToImage) return ok(window.htmlToImage);
  const s = document.createElement('script'); s.src = 'vendor/html-to-image.min.js'; s.onload = () => ok(window.htmlToImage); s.onerror = mal; document.head.append(s);
});
// fuentes: solo las que usa la pieza, y de Google solo el subconjunto latino (la librería bajaría todas las variantes)
const hojas = new Map(), datosFuente = new Map();
const hoja = href => { if (!hojas.has(href)) hojas.set(href, fetch(href).then(r => r.text()).catch(() => '')); return hojas.get(href); };
const aDatos = url => { if (!datosFuente.has(url)) datosFuente.set(url, fetch(url).then(r => r.blob()).then(b => new Promise(ok => { const f = new FileReader(); f.onload = () => ok(f.result); f.readAsDataURL(b); }))); return datosFuente.get(url); };
// una cara se reconoce igual en document.fonts y en el texto de la hoja: familia, peso y estilo de su @font-face y su unicode-range
const claveCara = (fam, peso, estilo, rango) => [sinComillas(fam).toLowerCase(), extremos(peso, pesoNum).join('-'), tipoEstilo(estilo), rangos(rango).map(r => r.join('-')).join(',')].join('|');
export async function fuentesDe(el) {
  // solo las caras que se DIBUJAN y solo los tramos que cubren su texto: si el CSS pide 600 y se ve la 700, va la 700
  const usadas = new Set(); [el, ...el.querySelectorAll('*')].forEach(e => { if (TEXTO(e)) fuenteDibujada(e).caras.forEach(c => usadas.add(claveCara(c.family, c.weight, c.style, c.unicodeRange))); });
  if (!usadas.size) return '';
  const css = (await Promise.all([...document.querySelectorAll('link[rel=stylesheet]')].map(l => hoja(l.href).then(t => ({ t, base: l.href }))))), out = [];
  for (const { t, base } of css) for (const [regla] of t.matchAll(/@font-face\s*{[^}]*}/g)) {
    const fam = regla.match(/font-family:\s*([^;}]+)/)?.[1] || '', peso = regla.match(/font-weight:\s*([^;}]+)/)?.[1] || '400', estilo = regla.match(/font-style:\s*([^;}]+)/)?.[1] || 'normal';
    const rango = regla.match(/unicode-range:\s*([^;}]+)/)?.[1], url = regla.match(/url\(["']?([^"')]+)/)?.[1];
    if (!url || !usadas.has(claveCara(fam, peso.trim(), estilo.trim(), rango))) continue;
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
  // recta y sin lo que va en código (sombras de afuera, filtros); las sombras interiores sí van: están dentro de la card
  const quieta = comoSeVe ? {} : { transform: 'none', rotate: 'none', translate: 'none', scale: 'none', boxShadow: partir(cs.boxShadow).filter(x => /\binset\b/.test(x)).join(', ') || 'none', filter: 'none', outline: 'none' };
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
