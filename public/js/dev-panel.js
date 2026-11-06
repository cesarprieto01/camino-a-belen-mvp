// Modo developer · el inspector del panel (solo prototipo, solo lo de Adviento).
// Sin capa elegida: la pantalla, su paquete (imágenes y animaciones), sus assets y sus capas. Con una capa: arriba qué es y dónde está; luego
// lo que la define (asset, animación o texto), sus medidas, todos los estados de su componente, sus colores y lo demás plegado.
// Cada valor se copia con un clic, como valor o como SwiftUI. Nombres y PNG salen de Drive («01 PARA LA APP», copiado en dev/app/);
// los estados, de dev/componentes.json; lo que no es de Adviento, de dev/fuera.json y del catálogo.
import { ponerFuera, ficha, nombreDe, nombreTipo, tipo, assetsDe, lottieInfo, descLottie, swift, pt, token, hijosCapa, padreCapa, cajaPantalla, bajar, traer, png, svgTexto, zip, reiniciarTokens, swiftColor, swiftFuente, swiftSombra, postscript, esPieza, piezaDe, piezaPng, giroDe, textoFijo, vaEnCodigo, VP } from './dev-motor.js';
import { elegida, elegir, resaltar, usandoApp, usar, subir, bajarA, tocarElegida, pantallaActual, reconocer } from './dev.js';
import { manifest, logical, html, S, save, cur } from './core.js';
import { miniatura as miniaturaLottie } from './teo-anim.js';
import { logicaDe, corto } from './dev-logica.js';

let CAT = null, COMP = null, FUE = null;
const cargar = () => Promise.all([
  CAT ?? fetch('dev/assets.json').then(r => r.ok ? r.json() : {}).catch(() => ({})).then(j => { CAT = j; }),
  COMP ?? fetch('dev/componentes.json').then(r => r.ok ? r.json() : []).catch(() => []).then(j => { COMP = Array.isArray(j) ? j : []; }),
  FUE ?? fetch('dev/fuera.json').then(r => r.ok ? r.json() : {}).catch(() => ({})).then(j => { FUE = j; ponerFuera(j.selectores || []); }),
]);
const deAdviento = r => !r || CAT?.[r]?.adviento !== false;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const slug = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 48) || 'capa';
const ext = r => (r.match(/\.([a-z0-9]+)$/i)?.[1] || 'png').toLowerCase();
/** Info del catálogo para una ruta; si no está, un nombre sacado del archivo */
const infoAsset = r => CAT?.[r] || { nombre: slug(String(r).split('/').pop().replace(/\.[a-z0-9]+$/i, '')), descripcion: '' };
const drive = (i, k) => i.drive ? 'dev/app/' + encodeURI(k === 3 ? i.drive : i.drive.replace('@3x', '@2x')) : null;
const oscuro = () => document.documentElement.dataset.theme === 'dark';
const I = { copiar: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>', bajar: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>', arriba: '<path d="M6 15l6-6 6 6"/>', abajo: '<path d="M6 9l6 6 6-6"/>', ojo: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>', toque: '<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.5a6 6 0 0 1-4.6-2.2L4.3 15.6a1.6 1.6 0 0 1 2.5-2L9 16"/>', play: '<path d="M8 5.5l11 6.5-11 6.5z" fill="currentColor"/>', cursor: '<path d="M5 3.5l13 7-5.6 1.6L10 18z"/><path d="M12.4 12.1l5 5"/>', pausa: '<path d="M8 5v14M16 5v14"/>' };
const ico = (d, s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

// «Copiar como»: el valor tal cual o el modificador de SwiftUI
let comoSwift = false;
try { comoSwift = localStorage.getItem('cab-dev-copia') === 'swift'; } catch { /* */ }
/** Un valor que se copia al tocarlo. «sw»: lo que se copia en modo SwiftUI */
const val = (texto, { copia = texto, sw = '', etiqueta = '' } = {}) => `<button class="dv-val" data-copia="${esc(copia)}" ${sw ? `data-sw="${esc(sw)}"` : ''} aria-label="Copiar ${esc(etiqueta)} ${esc(copia)}">${esc(texto)}</button>`;
const fila = (k, v) => v ? `<div class="dv-row"><span>${k}</span>${v}</div>` : '';
const swatch = (c, etiqueta = 'color') => !c ? '' : `<button class="dv-val dv-color" data-copia="${c.hex}" data-sw="${esc(swiftColor(c))}" aria-label="Copiar ${etiqueta} ${c.hex}"><i style="background:${c.hex};opacity:${Math.max(c.alfa, .15)}"></i>${c.hex}${c.alfa < 1 ? ` · ${Math.round(c.alfa * 100)} %` : ''}${token(c.hex) ? ` <small>${token(c.hex)}</small>` : ''}</button>`;
const bloque = (titulo, cuerpo, abierta = true) => cuerpo ? `<details class="dv-sec" ${abierta ? 'open' : ''}><summary><h3>${titulo}</h3></summary><div class="dv-sec-b">${cuerpo}</div></details>` : '';
const miniatura = r => /\.(webp|png|jpe?g|gif|svg)$/i.test(r) ? `<img src="${esc(r)}" alt="" loading="lazy">` : `<span class="dv-ph">${ext(r).toUpperCase()}</span>`;

// ---------- Componentes y estados ----------
function componenteDe(el) {
  let mejor = null;
  for (const c of COMP || []) {
    let raiz = null; try { raiz = el.closest(c.selector); } catch { continue; }
    if (!raiz || !pantallaActual()?.contains(raiz)) continue;
    let d = 0, e = el; while (e && e !== raiz) { d++; e = e.parentElement; }
    if (!mejor || d < mejor.d) mejor = { c, raiz, d };
  }
  return mejor;
}
/** Los componentes registrados que están en la pantalla (la lista de trabajo del developer) */
function componentesPantalla() {
  const top = pantallaActual(), out = [];
  if (!top) return out;
  for (const c of COMP || []) {
    let els = []; try { els = [...top.querySelectorAll(c.selector)].filter(e => e.getClientRects().length); } catch { continue; }
    if (els.length && !out.some(o => o.c === c)) out.push({ c, els });
  }
  return out;
}
// «Ver en el diseño»: la pantalla del lienzo de ese estado, agrupada por pantalla (día · noche)
const lienzoLinks = files => {
  const g = new Map(); (files || []).filter(x => manifest()[x]).forEach(x => { const k = logical(x); (g.get(k) || g.set(k, []).get(k)).push(x); });
  return g.size ? `<p class="dv-links">Ver en el diseño: ${[...g].map(([k, fs]) => `${g.size > 1 ? `<span>${esc(k.replace(/^[A-Z0-9-]+ · /, ''))}</span> ` : ''}${fs.sort((a, b) => manifest()[a].dark - manifest()[b].dark).map(x => `<button class="dv-link" data-file="${esc(x)}">${manifest()[x].dark ? 'noche' : 'día'}</button>`).join(' · ')}`).join(' · ')}</p>` : '';
};
const assetChip = r => /\.json$/.test(r)
  ? `<button class="dv-sasset" data-bajar="${esc(r)}" title="Descargar animación"><span class="dv-mini" data-mini="${esc(r.split('/').pop().replace('.json', ''))}"></span><span>${esc(r.split('/').pop().replace('.json', ''))}</span></button>`
  : `<button class="dv-sasset" data-png="${esc(r)}" data-k="3" title="Descargar ${esc(infoAsset(r).nombre)}@3x.png">${miniatura(r)}<span>${esc(infoAsset(r).nombre)}</span></button>`;
let estadoSel = -1, selAnterior = null;
function estadosHtml(m) {
  const est = m.c.estados || []; if (est.length < 2) return '';
  const s = est[estadoSel];
  return `<section class="dv-estados" aria-label="Estados"><h3>Estados <span>${est.length}</span></h3>
    <div class="dv-tira" role="tablist">${est.map((x, i) => `<button role="tab" aria-selected="${i === estadoSel}" data-estado="${i}">${esc(x.nombre)}</button>`).join('')}</div>
    ${!s ? '' : `<div class="dv-estado">${s.cuando ? `<p><b>Cuándo</b> ${esc(s.cuando)}</p>` : ''}${s.visual ? `<p><b>Qué cambia</b> ${esc(s.visual)}</p>` : ''}
      ${(s.assets || []).filter(deAdviento).length ? `<div class="dv-sassets">${s.assets.filter(deAdviento).map(assetChip).join('')}</div>` : ''}${lienzoLinks(s.lienzo)}</div>`}
  </section>`;
}

/** Cuándo sale la animación: qué la dispara, qué clips se encadenan (el elegido resaltado) y las reglas comunes */
function cuandoSale(nombre) {
  const ls = logicaDe(nombre, cur?.name); if (!ls.length) return '';
  const clip = n => `<button class="dv-clip ${n === nombre ? 'on' : ''}" data-bajar="anim/${esc(n)}.json" title="Descargar ${esc(n)}.json">${esc(corto(n))}</button>`;
  const flujo = l => `<ol class="dv-flujo">${l.filas.map(f => `<li class="${f.clips.includes(nombre) ? 'on' : ''}"><span class="dv-si">${esc(f.si)}</span><span class="dv-seq">${f.clips.length ? f.clips.map(clip).join('<i aria-hidden="true">→</i>') : '<em>sin cambio</em>'}</span>${f.nota ? `<small>${esc(f.nota)}</small>` : ''}</li>`).join('')}</ol>`;
  // la de la pantalla donde se está, abierta; las demás (y las reglas), plegadas
  return `<section class="dv-cuando"><h3>Cuándo sale${ls.length > 1 ? ` <span>${esc(ls[0].titulo.toLowerCase())}</span>` : ''}</h3>${flujo(ls[0])}
    ${ls[0].reglas?.length ? `<details class="dv-mas dv-reglas"><summary>Reglas</summary><ul>${ls[0].reglas.map(r => `<li>${esc(r)}</li>`).join('')}</ul></details>` : ''}
    ${ls.slice(1).map(l => `<details class="dv-mas"><summary>${esc(l.titulo)}</summary>${flujo(l)}</details>`).join('')}</section>`;
}

// íconos de interfaz: en iOS se hacen con SF Symbols, no con un asset
const SF = [[/cerrar|salir/i, 'xmark'], [/silenciad/i, 'speaker.slash.fill'], [/m[uú]sica|activad/i, 'speaker.wave.2.fill'], [/escuchar/i, 'speaker.wave.2'], [/volver|atr[aá]s/i, 'chevron.left'], [/siguiente/i, 'chevron.right'], [/compartir/i, 'square.and.arrow.up'], [/favorit|me gusta/i, 'heart'], [/reproducir/i, 'play.fill'], [/pausa/i, 'pause.fill'], [/enlace/i, 'link'], [/ajustes|configur/i, 'gearshape']];
export const sfSymbol = el => { const n = nombreDe(el); return SF.find(([re]) => re.test(n))?.[1] || ''; };
const pesoSF = el => { const w = parseFloat(el.getAttribute('stroke-width') || el.querySelector('[stroke-width]')?.getAttribute('stroke-width') || 0); return w >= 2.4 ? 'semibold' : w >= 2 ? 'medium' : 'regular'; };
// estilo de Dynamic Type más cercano (tamaño de iOS por defecto)
const ESTILOS = [['largeTitle', 34], ['title', 28], ['title2', 22], ['title3', 20], ['body', 17], ['callout', 16], ['subheadline', 15], ['footnote', 13], ['caption', 12], ['caption2', 11]];
const estiloDT = fu => { const [n] = ESTILOS.reduce((a, b) => Math.abs(b[1] - fu.tam) < Math.abs(a[1] - fu.tam) ? b : a); return n === 'body' && +fu.peso >= 600 ? 'headline' : n; };

// una fila de consulta: etiqueta tranquila y valor que se copia al tocarlo
const ref = (k, texto, copia = texto) => texto === '' || texto == null ? '' : `<div><dt>${k}</dt><dd><button class="dv-cp" data-copia="${esc(copia)}" aria-label="Copiar ${esc(k)}: ${esc(copia)}">${texto}</button></dd></div>`;
const muestra = c => c ? `<i class="dv-sw" style="background:${c.hex};opacity:${Math.max(c.alfa, .2)}"></i>${c.hex}${c.alfa < 1 ? ` · ${Math.round(c.alfa * 100)} %` : ''}${token(c.hex) ? ` <small>${token(c.hex)}</small>` : ''}` : '';
const grupo = (titulo, filas) => filas ? `<section class="dv-grupo"><h3>${titulo}</h3><dl class="dv-ref">${filas}</dl></section>` : '';

// si el nombre no lo dice, la versión del otro tema se busca en el diseño: la pantalla del lienzo del otro tema se dibuja oculta
// y se toma la imagen que ocupa el mismo lugar (fondo-hub-dia ↔ fondo-trivia-noche)
const delLienzo = new Map();
function imagenesDel(file) {
  if (!delLienzo.has(file)) delLienzo.set(file, (async () => {
    const capa = document.createElement('div'); capa.className = 'layer'; capa.setAttribute('aria-hidden', 'true');
    capa.style.cssText = 'position:fixed;left:-6000px;top:0;width:390px;height:844px;visibility:hidden;pointer-events:none';
    capa.innerHTML = '<div class="root">' + await html(file) + '</div>'; document.body.append(capa);
    const raiz = capa.querySelector('.root'), v = raiz.getBoundingClientRect(), out = [];
    raiz.querySelectorAll('*').forEach(e => {
      const r = e.getBoundingClientRect(); if (!r.width || !r.height) return;
      const caja = { x: r.left - v.left, y: r.top - v.top, w: r.width, h: r.height };
      if (e.tagName === 'IMG' && e.getAttribute('src')) out.push({ caja, ruta: e.getAttribute('src') });
      const m = (e.style.backgroundImage || '').match(/url\(["']?([^"')]+)/); if (m) out.push({ caja, ruta: m[1] });
    });
    capa.remove(); return out;
  })().catch(() => []));
  return delLienzo.get(file);
}
const solape = (a, b) => { const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y); if (w <= 0 || h <= 0) return 0; const i = w * h; return i / (a.w * a.h + b.w * b.h - i); };
/** { dia, noche } de una imagen: por nombre o, si no, por el lugar que ocupa en la pantalla del otro tema */
async function parDe(r, el) {
  const p = parTema(r); if (p || !el) return p;
  const f = cur?.name === 'estatica' ? cur.params?.file : cur?.file, M = manifest(); if (!f || !M[f]) return null;
  const otro = Object.keys(M).find(k => k !== f && logical(k) === logical(f) && M[k].dark !== M[f].dark); if (!otro) return null;
  const c = cajaPantalla(el); let mejor = null, nota = 0;
  for (const x of await imagenesDel(otro)) { const s = solape(x.caja, c); if (s > nota) { nota = s; mejor = x; } }
  const otra = mejor && nota > .6 ? decodeURIComponent(mejor.ruta.replace(/^\.?\//, '')) : null;
  if (!otra || otra === r || !deAdviento(otra)) return null;
  return M[f].dark ? { dia: otra, noche: r } : { dia: r, noche: otra };
}

/** Las dos versiones de una imagen, una al lado de la otra sobre su fondo; se descargan al tocarlas */
const diaNoche = (par, actual) => `<section class="dv-temas"><h3>Día y noche</h3><div class="dv-par">${[['dia', 'Día'], ['noche', 'Noche']].map(([k, l]) => `<button class="dv-tema ${par[k] === actual ? 'on' : ''}" data-t="${k}" data-png="${esc(par[k])}" data-k="3" title="Descargar ${esc(infoAsset(par[k]).nombre)}@3x.png"><span class="dv-tthumb">${miniatura(par[k])}</span><b>${l}${par[k] === actual ? ' <small>en pantalla</small>' : ''}</b><small>${esc(infoAsset(par[k]).nombre)}@3x.png</small></button>`).join('')}</div></section>`;

// ---------- Cards: lo agrupado en una sola imagen, con sus capas a mano para bajar solo una ----------
const artePrincipal = el => [el, ...el.querySelectorAll('*')].flatMap(x => assetsDe(x)).find(x => x.tipo !== 'svg' && x.tipo !== 'lottie' && deAdviento(x.ruta));
/** El nombre de una card: el de su componente, su etiqueta, su texto corto o el de su imagen principal */
function nombrePieza(el) {
  const m = componenteDe(el); if (m && m.d === 0) return m.c.nombre;
  const n = el.getAttribute('aria-label') || (el.matches('img') ? '' : textoFijo(el)); if (n) return n;
  const a = artePrincipal(el); return a ? infoAsset(a.ruta).nombre : 'Card';
}
/** card-cuento-5-min-dia: siempre con «card» y con el tema (de día y de noche la card cambia) */
const archivoPieza = el => { let n = slug(nombrePieza(el)); if (!n.includes('card')) n = 'card-' + n; return /-(dia|noche|claro|oscuro)$/.test(n) ? n : `${n}-${oscuro() ? 'noche' : 'dia'}`; };
const nombreCapa = e => esPieza(e) ? nombrePieza(e) : nombreDe(e);
// la vista previa de la card tal como se descarga (recta, sin sombra); se guarda por card y por tema
const vistas = new WeakMap();
async function vistaCard(el) {
  const t = oscuro() ? 'n' : 'd', v = vistas.get(el);
  if (v?.t === t) return v.url;
  const url = await piezaPng(el, { k: 2 }).then(o => o.url()).catch(() => null);
  vistas.set(el, { t, url }); return url;
}
/** Las cards de la pantalla que se ven (sin las que van dentro de otra) */
function piezasPantalla() {
  const top = pantallaActual(); if (!top) return [];
  // con una ventana abierta, solo cuenta lo de la ventana (lo de atrás está tapado)
  const ambito = [...top.querySelectorAll('[role=dialog], [aria-modal=true]')].filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden').pop() || top;
  // se ve si al menos la mitad queda dentro del teléfono y de la ventana (los slides de al lado quedan fuera)
  const v = VP().getBoundingClientRect(), m = ambito.getBoundingClientRect();
  const enVista = e => { const r = e.getBoundingClientRect(), w = Math.min(r.right, v.right, m.right) - Math.max(r.left, v.left, m.left), h = Math.min(r.bottom, v.bottom, m.bottom) - Math.max(r.top, v.top, m.top); return w > 0 && h > 0 && w * h > r.width * r.height * .5; };
  const todas = [...ambito.querySelectorAll('*')].filter(e => enVista(e) && esPieza(e));
  // una card que se repite (el dorso de las cartas del memorama) sale una vez
  const vistas = new Set();
  return todas.filter(e => !todas.some(o => o !== e && o.contains(e))).filter(e => { const n = archivoPieza(e); return !vistas.has(n) && vistas.add(n); });
}
let piezaSel = null, capasCard = [];
const ICONO_SF = e => e instanceof SVGElement && !!sfSymbol(e);
const bajable = e => esPieza(e) || !!assetsDe(e).find(x => x.tipo !== 'svg' && deAdviento(x.ruta)) || (e instanceof SVGSVGElement && !ICONO_SF(e));
/** Cómo se llama una capa en la lista: la imagen como en Drive; un contenedor sin nombre, por lo que es */
function nombreEnCard(h) {
  const t = tipo(h), a = assetsDe(h).find(x => x.tipo !== 'svg' && x.tipo !== 'lottie' && deAdviento(x.ruta));
  if (a && !esPieza(h) && CAT?.[a.ruta]?.nombre) return CAT[a.ruta].nombre;
  if (t === 'caja' && nombreDe(h, t) === nombreTipo(t)) { const f = ficha(h); return f.fondo ? 'Degradado' : f.relleno ? 'Fondo de color' : nombreTipo(t); }
  return nombreCapa(h);
}
/** Lo que lleva la card, capa por capa: tocar una entra en ella; la flecha baja solo esa. Lo que va en código se lista sin entrar en él */
function capasCardHtml(pz) {
  capasCard = []; const rec = (e, n) => hijosCapa(e).forEach(h => { capasCard.push([h, n]); if (!h.matches('svg, .teo-anim, img') && !esPieza(h) && !vaEnCodigo(h, pz)) rec(h, n + 1); });
  rec(pz, 0); capasCard = capasCard.slice(0, 30);
  if (!capasCard.length) return '';
  const fila = ([h, n], k) => {
    const t = tipo(h), a = assetsDe(h).find(x => x.tipo !== 'svg' && deAdviento(x.ruta)), nom = nombreEnCard(h), codigo = vaEnCodigo(h, pz);
    const cs = getComputedStyle(h), pinta = t === 'caja' && !a && (cs.backgroundImage !== 'none' || !/rgba\([^)]*,\s*0\)$|transparent/.test(cs.backgroundColor));
    const mini = a && a.tipo !== 'lottie' ? miniatura(a.ruta) : t === 'svg' ? `<span class="dv-svgprev">${svgTexto(h)}</span>` : pinta ? `<i class="dv-csw" style="background:${esc(cs.backgroundImage !== 'none' ? cs.backgroundImage : cs.backgroundColor)}"></i>` : `<i class="dv-t dv-t-${t}"></i>`;
    return `<div class="dv-crow" style="--n:${n}"><button class="dv-crow-b" data-entrar="${k}"><span class="dv-cmini">${mini}</span><span>${esc(nom)}${codigo ? '<small>en código</small>' : ''}</span></button>${!codigo && bajable(h) ? `<button class="dv-crow-dl" data-capa-dl="${k}" aria-label="Descargar ${esc(nom)}" title="Descargar solo esta capa">${ico(I.bajar)}</button>` : ''}</div>`;
  };
  return `<section class="dv-grupo dv-ccapas"><h3>Capas <span>${capasCard.length}</span></h3><div>${capasCard.map(fila).join('')}</div></section>`;
}
async function bajarCapa(h) {
  if (esPieza(h)) { const o = await piezaPng(h, { k: 3 }); return bajar(o.blob, `${archivoPieza(h)}@3x.png`); }
  const a = assetsDe(h).find(x => x.tipo !== 'svg' && deAdviento(x.ruta));
  if (a?.tipo === 'lottie') return bajar(await traer(a.ruta), `${a.el.dataset.anim}.json`);
  if (a) { const p = await pngDe(a.ruta, 3, h); return bajar(p.blob, p.nombre); }
  const sv = h.matches('svg') ? h : h.querySelector('svg'); if (sv) bajar(new Blob([svgTexto(sv)], { type: 'image/svg+xml' }), `${slug(nombreDe(h))}.svg`);
}
const swiftCard = (el, arch, sombra, giro) => [`Image("${arch}")`, '    .resizable()', `    .frame(width: ${pt(el.offsetWidth)}, height: ${pt(el.offsetHeight)})`, sombra && swiftSombra(sombra) ? `    ${swiftSombra(sombra)}` : '', giro ? `    .rotationEffect(.degrees(${giro}))` : ''].filter(Boolean).join('\n');

// ---------- La capa elegida ----------
let cadenaEls = [];
function capaHtml(el) {
  if (el !== selAnterior) { estadoSel = -1; selAnterior = el; }
  const f = ficha(el), m = componenteDe(el), padre = padreCapa(el);
  const pz = piezaSel = piezaDe(el), esCard = pz === el;
  capasCard = [];
  const generico = e => !esPieza(e) && nombreDe(e) === nombreTipo(tipo(e));
  const cadena = []; let p = padre; while (p && cadena.length < 3) { if (!generico(p)) cadena.unshift(p); p = padreCapa(p); }
  cadenaEls = cadena;
  const img = f.assets.find(a => a.tipo !== 'svg' && a.tipo !== 'lottie' && !a.quieto && deAdviento(a.ruta));
  const lot = f.assets.find(a => a.tipo === 'lottie'), quieto = f.assets.find(a => a.quieto && deAdviento(a.ruta));
  // un botón que solo lleva un ícono se lee como el ícono (su SF Symbol, su color y su tamaño)
  const svgEl = f.tipo === 'svg' ? el : el.matches('button, a, [role=button]') && !el.textContent.trim() ? el.querySelector('svg') : null;
  const fi = svgEl && svgEl !== el ? ficha(svgEl) : f;
  const sf = svgEl ? sfSymbol(svgEl) : '', i = img && infoAsset(img.ruta), L = lot && lottieInfo(lot.el), d = lot && descLottie(lot.el.dataset.anim);
  const raizComp = m && m.d === 0;
  const titulo = esCard ? nombrePieza(el) : raizComp ? m.c.nombre : f.nombre === nombreTipo(f.tipo) && i ? i.nombre : f.nombre; // una imagen sin nombre se llama como en Drive
  const voz = el.getAttribute('aria-label') || el.getAttribute('alt') || '';
  const tipoTxt = esCard ? 'Card' : lot ? 'Animación' : sf ? (svgEl !== el ? 'Botón con ícono del sistema' : 'Ícono del sistema') : img ? (img.tipo === 'fondo' ? 'Fondo' : 'Imagen') : raizComp ? 'Componente' : nombreTipo(f.tipo);
  // una card mide lo que mide su caja (recta): la caja que se ve crece si está girada
  const tw = esCard ? el.offsetWidth : f.w, th = esCard ? el.offsetHeight : f.h, giro = esCard ? giroDe(el) : 0;
  const primera = !img && !lot ? [...el.querySelectorAll('img')].find(x => x.currentSrc && x.getClientRects().length && deAdviento(decodeURIComponent(new URL(x.currentSrc).pathname.replace(/^\/+/, ''))))?.getAttribute('src') : null;
  // 1 · qué se construye (con una sola acción principal; el formato va en gris)
  let obra = '';
  if (esCard) {
    // todo unido en un PNG al tamaño de la card, recta y sin sombra (la sombra y el giro van en SwiftUI); al lado, @2x,
    // la versión tal como se ve (con sombra y giro) y, si la card es una imagen con marco, la imagen sola
    const arch = archivoPieza(el), efecto = !!f.sombra || !!giro;
    obra = `<button class="dv-btn main dv-wide" data-card="3">${ico(I.bajar)}Descargar card</button>
      <p class="dv-pie">${esc(arch)}@3x.png · <button class="dv-link" data-card="2">@2x</button>${efecto ? ' · <button class="dv-link" data-card="3" data-vista>tal como se ve</button>' : ''}${img ? ` · <button class="dv-link" data-png="${esc(img.ruta)}" data-k="3">solo la imagen</button>` : ''}</p>`;
  } else if (lot) {
    const como = d && (d.tramo || d.vel || d.inicio || d.salidas) ? [d.tramo && `Se juegan los cuadros ${d.tramo[0]} a ${d.tramo[1] - 1}${d.vel ? ` a ${d.vel}×` : ''}, una vez.`, d.inicio && `El bucle entra en el cuadro ${d.inicio}.`, d.salidas && `Pasa a otra animación en los cuadros ${d.salidas.map(([x, y]) => `${x}–${y - 1}`).join(', ')}.`, d.reposo && `Repite los cuadros 0 a ${d.reposo.hasta - 1} ${d.reposo.vueltas} veces antes de la actuación completa.`].filter(Boolean).join(' ') : '';
    obra = `<div class="dv-escena"><span class="dv-mini" data-mini="${esc(lot.el.dataset.anim)}"></span></div>
      <p class="dv-dato">Lottie · ${d?.tramo ? 'transición, una vez' : L?.enBucle ? 'bucle' : 'una vez'}${L ? ` · ${pt(L.segundos)} s · ${L.fps} fps` : ''} · ajustar sin recortar</p>
      <button class="dv-btn main dv-wide" data-bajar="${esc(lot.ruta)}">${ico(I.bajar)}Descargar animación</button><p class="dv-pie">${esc(lot.el.dataset.anim)}.json para lottie-ios${/^teo-trivia-/.test(lot.el.dataset.anim) ? ' · <button class="dv-link" data-trivia8>las 8 de la trivia</button>' : ''}</p>
      ${cuandoSale(lot.el.dataset.anim)}
      ${como ? `<details class="dv-mas"><summary>Cómo se reproduce</summary><p>${esc(como)}</p></details>` : ''}
      ${quieto ? `<div class="dv-quieto"><h3>Sin animación</h3><div class="dv-fila-asset">${miniatura(quieto.ruta)}<span><b>${esc(infoAsset(quieto.ruta).nombre)}</b><small>Se ve con «Reducir movimiento» y mientras carga la animación. Mismos pies y alto de Teodoro que la animación.</small></span></div><button class="dv-link" data-png="${esc(quieto.ruta)}" data-k="3">Descargar imagen</button></div>` : ''}`;
  } else if (img) {
    const par = parTema(img.ruta), corto = i.px && i.pt && i.px[0] < i.pt[0] * 3 - 2 ? ` · el original alcanza hasta @${Math.max(1, Math.floor(i.px[0] / i.pt[0]))}x` : '';
    // un solo archivo: el PNG @3x; @2x y la versión de noche, al lado
    obra = `<button class="dv-btn main dv-wide" data-png="${esc(img.ruta)}" data-k="3">${ico(I.bajar)}Descargar imagen</button><p class="dv-pie">${esc(i.nombre)}@3x.png${corto} · <button class="dv-link" data-png="${esc(img.ruta)}" data-k="2">@2x</button></p>${par ? diaNoche(par, img.ruta) : `<div data-par="${esc(img.ruta)}"></div>`}`;
  } else if (sf) {
    obra = `<button class="dv-btn main dv-wide" data-copia="${sf}">${ico(I.copiar)}Copiar «${sf}»</button><p class="dv-pie">SF Symbol · ${pt(fi.h)} pt · ${pesoSF(svgEl)}</p>`;
  } else if (svgEl) {
    obra = `<button class="dv-btn main dv-wide" data-dl="svg">${ico(I.bajar)}Descargar ícono</button><p class="dv-pie">SVG vectorial · ${pt(f.w)} × ${pt(f.h)} pt</p>`;
  } else {
    // un componente que lleva imágenes adentro (el día del mapa con su ícono): lo importante es descargarlas
    const dentro = [...new Map(todas(el).flatMap(h => assetsDe(h)).filter(x => x.tipo !== 'svg' && !x.quieto && deAdviento(x.ruta)).map(x => [x.ruta, x])).values()];
    if (dentro.length) obra = `${dentro.length === 1 ? `<button class="dv-btn main dv-wide" ${dentro[0].tipo === 'lottie' ? 'data-bajar' : 'data-png'}="${esc(dentro[0].ruta)}" data-k="3">${ico(I.bajar)}Descargar ${dentro[0].tipo === 'lottie' ? 'animación' : 'imagen'}</button><p class="dv-pie">${dentro[0].tipo === 'lottie' ? `${esc(dentro[0].el.dataset.anim)}.json` : `${esc(infoAsset(dentro[0].ruta).nombre)}@3x.png · <button class="dv-link" data-png="${esc(dentro[0].ruta)}" data-k="2">@2x</button>`}</p>` : `<p class="dv-pie dv-pie-top">Lleva ${dentro.length} imágenes</p>`}${dentro.length > 1 ? `<div class="dv-sassets">${dentro.map(x => assetChip(x.ruta)).join('')}</div>` : ''}`;
  }
  // 2 · medidas para construirla en SwiftUI
  const pc = padre ? cajaPantalla(padre) : null, her = padre ? hijosCapa(padre).filter(h => h !== el).map(h => [h, cajaPantalla(h)]) : [];
  const enColumna = ([, c]) => c.x < f.x + f.w && c.x + c.w > f.x;
  const antes = her.filter(enColumna).filter(([, c]) => c.y + c.h <= f.y + .5).sort((a, b) => b[1].y + b[1].h - a[1].y - a[1].h)[0];
  const despues = her.filter(enColumna).filter(([, c]) => c.y >= f.y + f.h - .5).sort((a, b) => a[1].y - b[1].y)[0];
  const conTexto = x => [...x.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim());
  const tEl = conTexto(el) ? el : [...el.querySelectorAll('*')].find(x => conTexto(x) && x.getClientRects().length);
  const ft = tEl ? (tEl === el ? f : ficha(tEl)) : null;
  const fu = ft?.fuente, colores = [...new Map([f.relleno, ...(f.fondo?.colores || []), f.borde?.color].filter(Boolean).map(c => [c.hex + c.alfa, c])).values()];
  const medidas = [
    ref('Tamaño', `${pt(tw)} × ${pt(th)}`),
    giro ? ref('Giro', `${giro}°`, `.rotationEffect(.degrees(${giro}))`) : '',
    pc ? ref('Al contenedor', `↑ ${pt(f.y - pc.y)}  → ${pt(pc.x + pc.w - f.x - f.w)}  ↓ ${pt(pc.y + pc.h - f.y - f.h)}  ← ${pt(f.x - pc.x)}`, `top ${pt(f.y - pc.y)}, trailing ${pt(pc.x + pc.w - f.x - f.w)}, bottom ${pt(pc.y + pc.h - f.y - f.h)}, leading ${pt(f.x - pc.x)}`) : '',
    antes || despues ? ref('Separación', [antes && `${pt(f.y - antes[1].y - antes[1].h)} arriba`, despues && `${pt(despues[1].y - f.y - f.h)} abajo`].filter(Boolean).join(' · '), String(pt(antes ? f.y - antes[1].y - antes[1].h : despues[1].y - f.y - f.h))) : '',
    f.radio ? ref('Esquinas', f.radio) : '',
  ].join('');
  const texto = fu && ft.texto ? [
    ref('Contenido', esc(ft.texto.length > 80 ? ft.texto.slice(0, 80) + '…' : ft.texto), ft.texto),
    ref('Fuente', `${postscript(fu.familia, fu.peso)} · ${pt(fu.tam)}`, swiftFuente(fu)),
    ref('Línea', `${fu.alto ? pt(fu.alto) : 'normal'}${fu.tracking ? ` · letras ${pt(fu.tracking)}` : ''}`, fu.alto ? String(+(fu.alto - fu.tam).toFixed(1)) : ''),
    ref('Dynamic Type', `.${estiloDT(fu)}`, `.${estiloDT(fu)}`),
    fu.alto && ft.tipo === 'texto' ? ref('Líneas', `${Math.max(1, Math.round(ft.h / fu.alto))} · ${{ left: 'izquierda', start: 'izquierda', center: 'centro', right: 'derecha', end: 'derecha' }[fu.alin] || fu.alin}`, String(Math.max(1, Math.round(f.h / fu.alto)))) : '',
    ref('Color', muestra(fu.color), fu.color?.hex),
  ].join('') : '';
  const estilo = [
    svgEl ? ref('Ícono', muestra(fi.iconoColor), fi.iconoColor?.hex) : '',
    ...colores.map((c, k) => ref(k ? '' : f.fondo ? 'Degradado' : 'Fondo', muestra(c), c.hex)),
    f.borde ? ref('Borde', `${pt(f.borde.ancho)} · ${muestra(f.borde.color)}`, `${f.borde.ancho} ${f.borde.color?.hex}`) : '',
    f.sombra ? ref('Sombra', 'Copiar para SwiftUI', swiftSombra(f.sombra) || f.sombra) : '',
    f.opacidad ? ref('Opacidad', f.opacidad, String(parseFloat(f.opacidad) / 100)) : '',
  ].join('');
  const codigo = esCard ? swiftCard(el, archivoPieza(el), f.sombra, giro) : sf ? `Image(systemName: "${sf}")\n    .font(.system(size: ${pt(fi.h)}, weight: .${pesoSF(svgEl)}))\n    .foregroundStyle(${swiftColor(fi.iconoColor)})${svgEl !== el ? `\n    .frame(width: ${pt(f.w)}, height: ${pt(f.h)})` : ''}` : swift(f, i?.nombre || slug(f.nombre));
  // dentro de una card: la card entera a un toque (para volver a ella o bajarla toda)
  const deCard = pz && !esCard ? `<section class="dv-grupo"><h3>Card</h3><div class="dv-crow dv-crow-card"><button class="dv-crow-b" data-ir="pieza"><span class="dv-cmini" data-card-prev>${artePrincipal(pz) ? miniatura(artePrincipal(pz).ruta) : ''}</span><span>${esc(nombrePieza(pz))}<small>${pt(pz.offsetWidth)} × ${pt(pz.offsetHeight)} pt</small></span></button><button class="dv-crow-dl" data-card="3" aria-label="Descargar card" title="Descargar card">${ico(I.bajar)}</button></div></section>` : '';
  return `<nav class="dv-crumbs" aria-label="Ruta"><button class="dv-link" data-ir="pantalla">${esc(pantallaNombre)}</button>${cadena.map((c, k) => `<span aria-hidden="true">›</span><button class="dv-link" data-ir="c${k}">${esc(nombreCapa(c).slice(0, k === cadena.length - 1 ? 40 : 18))}</button>`).join('')}</nav>
  <div class="dv-hero">${!lot ? `<div class="dv-prev" ${esCard ? 'data-card-prev' : ''}>${img ? miniatura(img.ruta) : primera ? miniatura(primera) : svgEl ? `<span class="dv-svgprev">${svgTexto(svgEl)}</span>` : fu ? `<span class="dv-aa" style="font-family:${esc(fu.familia)};font-weight:${fu.peso};color:${fu.color?.hex}">Aa</span>` : `<span class="dv-caja" style="background:${f.relleno?.hex || 'transparent'};border-radius:${Math.min(parseFloat(String(f.radio)) || 0, 16)}px"></span>`}</div>` : ''}
    <div class="dv-ident"><h2>${esc(titulo)}</h2><p>${tipoTxt} · ${pt(tw)} × ${pt(th)} pt${oscuro() ? ' · noche' : ''}</p></div></div>
  ${obra ? `<div class="dv-obra">${obra}</div>` : ''}
  ${esCard ? capasCardHtml(el) : deCard}
  ${m ? estadosHtml(m) : ''}
  ${grupo('Medidas', medidas)}
  ${grupo('Texto', texto)}
  ${grupo('Estilo', estilo)}
  ${voz && voz !== titulo ? grupo('VoiceOver', ref('Etiqueta', esc(voz), voz)) : ''}
  <details class="dv-mas"><summary>Código SwiftUI</summary><pre class="dv-code">${esc(codigo)}</pre><button class="dv-link" data-copia-code>Copiar código</button></details>`;
}

// ---------- La pantalla ----------
let pantallaNombre = 'Pantalla', assetsEls = [], compsEls = [], cardsEls = [], minis = [];
function todas(raiz = pantallaActual()) { const out = []; const rec = e => hijosCapa(e).forEach(h => { out.push(h); if (!h.matches('svg, .teo-anim, img')) rec(h); }); if (raiz) rec(raiz); return out; }
/** Los assets de Adviento de la pantalla (imágenes y animaciones; los íconos de interfaz son SF Symbols), sin repetir */
function assetsPantalla() {
  const m = new Map();
  todas().forEach(el => assetsDe(el).filter(a => a.tipo !== 'svg' && deAdviento(a.ruta)).forEach(a => {
    const c = cajaPantalla(el), prev = m.get(a.ruta);
    if (!prev || c.w > prev.w) m.set(a.ruta, { ...a, sel: el, w: c.w, h: c.h, nombre: a.tipo === 'lottie' ? a.el.dataset.anim : infoAsset(a.ruta).nombre });
  }));
  return [...m.values()];
}
function capasHtml(raiz, nivel = 0) {
  return hijosCapa(raiz).slice(0, 80).map(h => {
    const hijos = h.matches('svg, .teo-anim, img') ? [] : hijosCapa(h), t = tipo(h);
    const b = `<button class="dv-layer" data-capa><i class="dv-t dv-t-${t}"></i>${esc(nombreDe(h, t))}</button>`;
    return hijos.length ? `<details class="dv-ltree" style="--n:${nivel}"><summary>${b}</summary>${capasHtml(h, nivel + 1)}</details>` : `<div class="dv-lleaf" style="--n:${nivel}">${b}</div>`;
  }).join('');
}
function pantallaHtml(info) {
  const assets = assetsEls = assetsPantalla(), comps = componentesPantalla(), cards = cardsEls = piezasPantalla();
  compsEls = comps.map(x => x.els[0]);
  return `<p class="dv-guia">${ico(I.cursor, 18)}<span>Elige algo en el teléfono.</span></p>
  <div class="dv-hero dv-hero-p"><div class="dv-ident"><h2>${esc(info.nombre)}</h2><p>${comps.length ? `${comps.length} componentes · ` : ''}${cards.length ? `${cards.length} ${cards.length === 1 ? 'card' : 'cards'} · ` : ''}${assets.length} ${assets.length === 1 ? 'imagen o animación' : 'imágenes y animaciones'}</p></div></div>
  ${assets.length || cards.length ? `<div class="dv-obra"><button class="dv-btn main dv-wide" data-zip>${ico(I.bajar)}Descargar pantalla</button><p class="dv-pie">.zip con ${cards.length ? 'las cards, ' : ''}las imágenes (@2x y @3x) y las animaciones</p></div>` : ''}
  ${cards.length ? `<section class="dv-grupo"><h3>Cards</h3><div class="dv-agrid">${cards.map((c, k) => { const a = artePrincipal(c); return `<button class="dv-acard" data-ver-card="${k}" title="${esc(nombrePieza(c))}"><span class="dv-ph dv-cardph" data-card-mini="${k}">${a ? miniatura(a.ruta) : ''}</span><span>${esc(nombrePieza(c))}</span></button>`; }).join('')}</div></section>` : ''}
  ${comps.length ? `<section class="dv-grupo"><h3>Componentes</h3><ul class="dv-comps">${comps.map((x, k) => `<li><button data-comp="${k}"><span>${esc(x.c.nombre)}${x.els.length > 1 ? ` <small>×${x.els.length}</small>` : ''}</span><small>${(x.c.estados || []).length > 1 ? `${x.c.estados.length} estados` : ''}</small></button></li>`).join('')}</ul></section>` : ''}
  ${assets.length ? `<section class="dv-grupo"><h3>Imágenes y animaciones</h3><div class="dv-agrid">${assets.map((a, k) => `<button class="dv-acard" data-ver-asset="${k}" title="${esc(a.nombre)}">${a.tipo === 'lottie' ? `<span class="dv-mini" data-mini="${esc(a.el.dataset.anim)}"></span><i class="dv-badge">Lottie</i>` : miniatura(a.ruta)}<span>${esc(a.nombre)}</span>${a.tipo !== 'lottie' && parTema(a.ruta) ? '<i class="dv-badge dv-badge-t">día · noche</i>' : ''}</button>`).join('')}</div></section>` : ''}
  <details class="dv-mas"><summary>Capas</summary><div class="dv-layers">${capasHtml(pantallaActual())}</div></details>
  <details class="dv-mas"><summary>Atajos de teclado</summary><p>Clic: elegir el componente · otro clic o doble clic: lo de adentro · clic derecho: capas aquí · Esc: soltar · Tab: el siguiente · T: tocar · I / U: inspeccionar o usar la app · ⇧D: salir</p></details>`;
}

// ---------- Pintar ----------
export async function pintarDev(cont, info) {
  if (!CAT || !COMP || !FUE) cont.innerHTML = '<p class="dv-muted">Cargando…</p>'; // la primera vez baja el catálogo y los estados
  await cargar();
  if (!cont.isConnected) return;
  // el clic elige el componente más cercano: el registrado o el botón que contiene la pieza (lo que esté más adentro);
  // un componente que ocupa media pantalla o más (un pop-up entero) no se elige de un clic: se llega con el breadcrumb
  reconocer(el => {
    if (!el) return el;
    // una card se elige entera (lo agrupado); otro clic o doble clic entra en sus capas
    const r = componenteDe(el)?.raiz, b = el.closest('button, a, [role=button], [role=checkbox], [role=radio]'), pz = piezaDe(el);
    const chico = x => { const c = x?.getBoundingClientRect(), v = document.getElementById('viewport').getBoundingClientRect(); return x && c.width * c.height < v.width * v.height * .5; };
    // un enlace que cubre toda la card (el póster entero se toca) no le gana a la card; un botón más chico adentro, sí
    const area = x => { const c = x.getBoundingClientRect(); return c.width * c.height; };
    const tapa = b && pz && pz.contains(b) && area(b) >= area(pz) * .9;
    const cands = [chico(r) && r, !tapa && b, pz].filter(Boolean);
    return cands.sort((x, y) => (x.contains(y) ? 1 : y.contains(x) ? -1 : 0))[0] || el;
  });
  reiniciarTokens();
  minis.forEach(a => a?.destroy()); minis = [];
  pantallaNombre = info.nombre;
  const el = elegida(), usando = usandoApp();
  cont.innerHTML = `${usando ? '<p class="dv-usando">Estás usando la app. Para inspeccionar, pulsa I o el botón de la flecha.</p>' : ''}
    <div class="dv-body" aria-live="polite">${el ? capaHtml(el) : pantallaHtml(info)}</div>`;
  if (!el) mapearCapas(cont);
  cont.querySelectorAll('[data-mini]').forEach(async m => minis.push(await miniaturaLottie(m, m.dataset.mini)));
  cont.querySelectorAll('[data-par]').forEach(async d => { const r = d.dataset.par, par = await parDe(r, el); if (par && d.isConnected) d.outerHTML = diaNoche(par, r); });
  // las vistas previas de las cards salen de la card misma (una a la vez: no traban la app)
  const previas = [...cont.querySelectorAll('[data-card-prev]')].map(x => [x, piezaSel]).concat([...cont.querySelectorAll('[data-card-mini]')].map(x => [x, cardsEls[+x.dataset.cardMini]]));
  (async () => { for (const [x, pz] of previas) { if (!pz || !x.isConnected) continue; const u = await vistaCard(pz); if (u && x.isConnected) x.innerHTML = `<img src="${u}" alt="">`; } })();
  cont.onclick = ev => clic(ev, cont, info);
  cont.onmouseover = ev => { const b = ev.target.closest('[data-capa], [data-ver-asset], [data-comp], [data-ir^="c"], [data-ir="pieza"], [data-entrar], [data-ver-card]'); if (!b) return; resaltar(b._el || (b.dataset.verAsset ? assetsEls[+b.dataset.verAsset]?.sel : b.dataset.comp ? compsEls[+b.dataset.comp] : b.dataset.entrar ? capasCard[+b.dataset.entrar]?.[0] : b.dataset.verCard ? cardsEls[+b.dataset.verCard] : b.dataset.ir === 'pieza' ? piezaSel : cadenaEls[+b.dataset.ir.slice(1)])); };
  cont.onmouseleave = () => resaltar(null);
}
function mapearCapas(cont) {
  const els = []; const rec = r => hijosCapa(r).slice(0, 80).forEach(h => { els.push(h); if (!h.matches('svg, .teo-anim, img')) rec(h); });
  rec(pantallaActual());
  [...cont.querySelectorAll('[data-capa]')].forEach((b, k) => { b._el = els[k]; });
}
const avisar = (cont, t) => { let x = cont.querySelector('.dv-aviso'); if (!x) { x = document.createElement('div'); x.className = 'dv-aviso'; x.setAttribute('role', 'status'); cont.append(x); } x.textContent = t; x.classList.add('on'); clearTimeout(x._t); x._t = setTimeout(() => x.classList.remove('on'), 1800); };
/** El botón dice qué está pasando: «Preparando…», «Listo» o «No se pudo · Reintentar» */
async function conBoton(b, fn) {
  // el botón de solo flecha (una capa de la card) no cambia de texto: se atenúa mientras prepara y muestra un visto al terminar
  const antes = b.innerHTML, flecha = b.classList.contains('dv-crow-dl'); b.disabled = true;
  if (flecha) b.classList.add('ocupado'); else b.textContent = 'Preparando…';
  const volver = () => { if (b.isConnected) { b.innerHTML = antes; b.disabled = false; b.classList.remove('ocupado'); } };
  try { const r = await fn(t => { if (!flecha) b.textContent = t; }); if (flecha) { b.classList.remove('ocupado'); b.innerHTML = ico('<path d="M5 12.5l4.5 4.5L19 7.5"/>'); } else b.textContent = r || 'Listo'; setTimeout(volver, 1600); }
  catch (e) { console.warn(e); volver(); if (!flecha) b.textContent = 'No se pudo · Reintentar'; }
}

/** PNG @k: el de Drive si existe (la calidad de la entrega), si no, sale del archivo del MVP a su tamaño en pt */
async function pngDe(r, k, el) {
  const i = infoAsset(r), d = drive(i, k);
  if (d) { try { return { blob: await traer(d), nombre: `${i.nombre}@${k}x.png` }; } catch { /* sigue con el del MVP */ } }
  const f = el && ficha(el), [w, h] = i.pt || (f ? [f.w, f.h] : [0, 0]);
  const out = await png(r, w, h, k); return { blob: out.blob, nombre: `${i.nombre}@${k}x.png`, corto: out.corto, w: out.w };
}
// la otra versión de una imagen (de día o de noche), por su nombre: -claro/-oscuro o -dia/-noche
const TEMAS = [['-claro', '-oscuro'], ['-dia', '-noche']];
const rutaDe = nombre => Object.keys(CAT || {}).find(k => CAT[k].nombre === nombre) || null;
/** { dia, noche } si la imagen tiene su par del otro tema; si no, null */
function parTema(r) {
  const n = infoAsset(r).nombre;
  for (const [d, o] of TEMAS) {
    if (n.endsWith(d)) { const otra = rutaDe(n.slice(0, -d.length) + o); if (otra) return { dia: r, noche: otra }; }
    if (n.endsWith(o)) { const otra = rutaDe(n.slice(0, -o.length) + d); if (otra) return { dia: otra, noche: r }; }
  }
  return null;
}

async function clic(ev, cont, info) {
  const b = ev.target.closest('button'); if (!b || b.disabled) return;
  if (b.dataset.copia != null) { navigator.clipboard?.writeText(b.dataset.copia); const antes = b.innerHTML; b.textContent = 'Copiado'; setTimeout(() => { if (b.isConnected) b.innerHTML = antes; }, 1100); return; }
  if ('copiaCode' in b.dataset) { navigator.clipboard?.writeText(cont.querySelector('.dv-code')?.textContent || ''); avisar(cont, 'Código copiado'); return; }
  if (b.dataset.como) { comoSwift = b.dataset.como === 'swift'; try { localStorage.setItem('cab-dev-copia', comoSwift ? 'swift' : 'valor'); } catch { /* */ } cont.querySelectorAll('[data-como]').forEach(x => x.setAttribute('aria-pressed', String((x.dataset.como === 'swift') === comoSwift))); return; }
  if (b.dataset.usar) { usar(b.dataset.usar === '1'); return; }
  if (b.dataset.estado) { estadoSel = estadoSel === +b.dataset.estado ? -1 : +b.dataset.estado; pintarDev(cont, info); return; }
  if (b.dataset.comp) { elegir(compsEls[+b.dataset.comp]); return; }
  if ('tocar' in b.dataset) { tocarElegida(); return; }
  if ('hueco' in b.dataset) { const el = elegida(); (S.huecos ||= []).push({ label: `Sin estados registrados: ${el ? nombreDe(el) : ''}`, where: cur?.name || 'hoy' }); save(); avisar(cont, 'Anotado en Notas'); return; }
  if ('lottie' in b.dataset) { const a = window.lottie?.getRegisteredAnimations().find(x => x.wrapper === elegida()); if (a) { a.isPaused ? a.play() : a.pause(); b.innerHTML = ico(a.isPaused ? I.play : I.pausa); b.setAttribute('aria-label', a.isPaused ? 'Reproducir' : 'Pausar'); } return; }
  if (b.dataset.ir) {
    const el = elegida(), m = el && componenteDe(el);
    if (b.dataset.ir === 'pantalla') elegir(null);
    else if (b.dataset.ir === 'arriba') subir();
    else if (b.dataset.ir === 'abajo') bajarA();
    else if (b.dataset.ir === 'comp' && m) elegir(m.raiz);
    else if (b.dataset.ir === 'pieza' && piezaSel) elegir(piezaSel);
    else if (/^c\d+$/.test(b.dataset.ir)) elegir(cadenaEls[+b.dataset.ir.slice(1)]);
    return;
  }
  if ('capa' in b.dataset && b._el) { ev.preventDefault(); elegir(b._el); return; }
  if (b.dataset.hijo) { elegir(contieneEls[+b.dataset.hijo]); return; }
  if (b.dataset.verAsset) { elegir(assetsEls[+b.dataset.verAsset]?.sel); return; }
  if (b.dataset.verCard) { elegir(cardsEls[+b.dataset.verCard]); return; }
  if (b.dataset.entrar) { elegir(capasCard[+b.dataset.entrar]?.[0]); return; }
  if (b.dataset.capaDl) return conBoton(b, () => bajarCapa(capasCard[+b.dataset.capaDl][0]));
  if (b.dataset.card) return conBoton(b, async () => {
    const pz = piezaSel, k = +b.dataset.card, vista = 'vista' in b.dataset; if (!pz) throw new Error('sin card');
    const o = await piezaPng(pz, { k, comoSeVe: vista }); bajar(o.blob, `${archivoPieza(pz)}${vista ? '-como-se-ve' : ''}@${k}x.png`);
  });
  const el = elegida();
  if (b.dataset.bajar) return conBoton(b, async () => { const r = b.dataset.bajar; bajar(await traer(r), `${infoAsset(r).nombre}.${ext(r)}`); });
  if (b.dataset.png) return conBoton(b, async () => { const p = await pngDe(b.dataset.png, +b.dataset.k, el); bajar(p.blob, p.nombre); return p.corto ? `Descargado a ${p.w} px` : 'Descargado'; });
  if (b.dataset.dl === 'svg' && el) return conBoton(b, async () => { const sv = el.matches('svg') ? el : el.querySelector('svg'); bajar(new Blob([svgTexto(sv)], { type: 'image/svg+xml' }), `${slug(nombreDe(el))}.svg`); });
  if (b.dataset.dl === 'svg-png' && el) return conBoton(b, async () => { const k = +b.dataset.k, f = ficha(el), u = URL.createObjectURL(new Blob([svgTexto(el)], { type: 'image/svg+xml' })); const out = await png(u, f.w, f.h, k); URL.revokeObjectURL(u); bajar(out.blob, `${slug(nombreDe(el))}@${k}x.png`); });
  if ('trivia8' in b.dataset) return conBoton(b, async () => { const ns = ['mapa', 'farol', 'celebra', 'mapa-a-farol', 'farol-a-mapa', 'mapa-a-celebra', 'farol-a-celebra', 'celebra-a-mapa'].map(x => `teo-trivia-${x}`); bajar(await zip(await Promise.all(ns.map(async n => ({ nombre: `teo-trivia/${n}.json`, datos: await traer(`anim/${n}.json`) })))), 'teo-trivia.zip'); });
  if ('zip' in b.dataset) return conBoton(b, set => paquete(info, set));
}

// ---------- El paquete de la pantalla: cards/ (cada card unida, PNG @2x y @3x), imagenes/ (PNG @2x y @3x) y animaciones/ (JSON de Lottie);
// carpetas sin tilde: se abren bien en cualquier descompresor ----------
async function paquete(info, avance) {
  const assets = assetsPantalla(), cards = piezasPantalla(), base = 'adviento-' + slug(info.nombre), archivos = [], usados = new Set(), faltan = [];
  const unico = n => { let x = n, k = 2; while (usados.has(x)) x = `${n}-${k++}`; usados.add(x); return x; };
  for (const [i, c] of cards.entries()) {
    avance(`Card ${i + 1} de ${cards.length}…`);
    try { const n = unico(archivoPieza(c)); for (const k of [3, 2]) archivos.push({ nombre: `cards/${n}@${k}x.png`, datos: (await piezaPng(c, { k })).blob }); }
    catch (e) { console.warn('paquete', c, e); faltan.push(nombrePieza(c)); }
  }
  for (const [i, a] of assets.entries()) {
    avance(`Preparando ${i + 1} de ${assets.length}…`);
    try {
      if (a.tipo === 'lottie') { archivos.push({ nombre: `animaciones/${unico(a.el.dataset.anim)}.json`, datos: await traer(a.ruta) }); continue; }
      // la imagen y, si la tiene, su versión del otro tema (para que no se pase ninguna)
      const par = await parDe(a.ruta, a.sel);
      for (const r of par ? [par.dia, par.noche] : [a.ruta]) {
        const n = infoAsset(r).nombre; if (usados.has(n)) continue; usados.add(n);
        for (const k of [3, 2]) archivos.push({ nombre: `imagenes/${n}@${k}x.png`, datos: (await pngDe(r, k, r === a.ruta ? a.sel : null)).blob });
      }
    } catch (e) { console.warn('paquete', a, e); faltan.push(a.nombre); }
  }
  if (faltan.length) archivos.push({ nombre: 'FALTAN.txt', datos: `No se pudieron preparar:\n${faltan.map(x => '- ' + x).join('\n')}\n` });
  bajar(await zip(archivos), `${base}${oscuro() ? '-noche' : ''}.zip`);
  return faltan.length ? `Descargado · faltan ${faltan.length}` : 'Descargado';
}
