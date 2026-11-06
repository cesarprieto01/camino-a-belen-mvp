// Modo developer · el inspector del panel (solo prototipo, solo lo de Adviento).
// Sin capa elegida: la pantalla, su paquete para Xcode, sus assets y sus capas. Con una capa: arriba qué es y dónde está; luego
// lo que la define (asset, animación o texto), sus medidas, todos los estados de su componente, sus colores y lo demás plegado.
// Cada valor se copia con un clic, como valor o como SwiftUI. Nombres y PNG salen de Drive («01 PARA LA APP», copiado en dev/app/);
// los estados, de dev/componentes.json; lo que no es de Adviento, de dev/fuera.json y del catálogo.
import { ponerFuera, ficha, nombreDe, nombreTipo, tipo, assetsDe, lottieInfo, descLottie, swift, pt, token, hijosCapa, padreCapa, cajaPantalla, bajar, traer, png, svgTexto, zip, reiniciarTokens, swiftColor, swiftFuente, swiftSombra, postscript } from './dev-motor.js';
import { elegida, elegir, resaltar, usandoApp, usar, subir, bajarA, tocarElegida, pantallaActual, reconocer } from './dev.js';
import { manifest, logical, S, save, cur } from './core.js';
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
  : `<button class="dv-sasset" data-xcode="${esc(r)}" title="Descargar imagen">${miniatura(r)}<span>${esc(infoAsset(r).nombre)}</span></button>`;
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

// ---------- La capa elegida ----------
let cadenaEls = [];
function capaHtml(el) {
  if (el !== selAnterior) { estadoSel = -1; selAnterior = el; }
  const f = ficha(el), m = componenteDe(el), padre = padreCapa(el);
  const generico = e => nombreDe(e) === nombreTipo(tipo(e));
  const cadena = []; let p = padre; while (p && cadena.length < 3) { if (!generico(p)) cadena.unshift(p); p = padreCapa(p); }
  cadenaEls = cadena;
  const img = f.assets.find(a => a.tipo !== 'svg' && a.tipo !== 'lottie' && !a.quieto && deAdviento(a.ruta));
  const lot = f.assets.find(a => a.tipo === 'lottie'), quieto = f.assets.find(a => a.quieto && deAdviento(a.ruta));
  // un botón que solo lleva un ícono se lee como el ícono (su SF Symbol, su color y su tamaño)
  const svgEl = f.tipo === 'svg' ? el : el.matches('button, a, [role=button]') && !el.textContent.trim() ? el.querySelector('svg') : null;
  const fi = svgEl && svgEl !== el ? ficha(svgEl) : f;
  const sf = svgEl ? sfSymbol(svgEl) : '', i = img && infoAsset(img.ruta), L = lot && lottieInfo(lot.el), d = lot && descLottie(lot.el.dataset.anim);
  const raizComp = m && m.d === 0;
  const titulo = raizComp ? m.c.nombre : f.nombre;
  const voz = el.getAttribute('aria-label') || el.getAttribute('alt') || '';
  const tipoTxt = lot ? 'Animación' : sf ? (svgEl !== el ? 'Botón con ícono del sistema' : 'Ícono del sistema') : img ? (img.tipo === 'fondo' ? 'Fondo' : 'Imagen') : raizComp ? 'Componente' : nombreTipo(f.tipo);
  const primera = !img && !lot ? [...el.querySelectorAll('img')].find(x => x.currentSrc && x.getClientRects().length && deAdviento(decodeURIComponent(new URL(x.currentSrc).pathname.replace(/^\/+/, ''))))?.getAttribute('src') : null;
  // 1 · qué se construye (con una sola acción principal; el formato va en gris)
  let obra = '';
  if (lot) {
    const como = d && (d.tramo || d.vel || d.inicio || d.salidas) ? [d.tramo && `Se juegan los cuadros ${d.tramo[0]} a ${d.tramo[1] - 1}${d.vel ? ` a ${d.vel}×` : ''}, una vez.`, d.inicio && `El bucle entra en el cuadro ${d.inicio}.`, d.salidas && `Pasa a otra animación en los cuadros ${d.salidas.map(([x, y]) => `${x}–${y - 1}`).join(', ')}.`, d.reposo && `Repite los cuadros 0 a ${d.reposo.hasta - 1} ${d.reposo.vueltas} veces antes de la actuación completa.`].filter(Boolean).join(' ') : '';
    obra = `<div class="dv-escena"><span class="dv-mini" data-mini="${esc(lot.el.dataset.anim)}"></span></div>
      <p class="dv-dato">Lottie · ${d?.tramo ? 'transición, una vez' : L?.enBucle ? 'bucle' : 'una vez'}${L ? ` · ${pt(L.segundos)} s · ${L.fps} fps` : ''} · ajustar sin recortar</p>
      <button class="dv-btn main dv-wide" data-bajar="${esc(lot.ruta)}">${ico(I.bajar)}Descargar animación</button><p class="dv-pie">${esc(lot.el.dataset.anim)}.json para lottie-ios${/^teo-trivia-/.test(lot.el.dataset.anim) ? ' · <button class="dv-link" data-trivia8>las 8 de la trivia</button>' : ''}</p>
      ${cuandoSale(lot.el.dataset.anim)}
      ${como ? `<details class="dv-mas"><summary>Cómo se reproduce</summary><p>${esc(como)}</p></details>` : ''}
      ${quieto ? `<div class="dv-quieto"><h3>Sin animación</h3><div class="dv-fila-asset">${miniatura(quieto.ruta)}<span><b>${esc(infoAsset(quieto.ruta).nombre)}</b><small>Se ve con «Reducir movimiento» y mientras carga la animación. Mismos pies y alto de Teodoro que la animación.</small></span></div><button class="dv-link" data-xcode="${esc(quieto.ruta)}">Descargar imagen</button></div>` : ''}`;
  } else if (img) {
    const noche = parNoche(img.ruta), corto = i.px && i.pt && i.px[0] < i.pt[0] * 3 - 2 ? ` · el original alcanza hasta @${Math.max(1, Math.floor(i.px[0] / i.pt[0]))}x` : '';
    obra = `<button class="dv-btn main dv-wide" data-xcode="${esc(img.ruta)}">${ico(I.bajar)}Descargar imagen</button><p class="dv-pie">${esc(i.nombre)} · @2x y @3x${noche ? ' · día y noche' : ''}${corto} · <button class="dv-link" data-png="${esc(img.ruta)}" data-k="3">PNG @3x</button></p>`;
  } else if (sf) {
    obra = `<button class="dv-btn main dv-wide" data-copia="${sf}">${ico(I.copiar)}Copiar «${sf}»</button><p class="dv-pie">SF Symbol · ${pt(fi.h)} pt · ${pesoSF(svgEl)}</p>`;
  } else if (svgEl) {
    obra = `<button class="dv-btn main dv-wide" data-dl="svg">${ico(I.bajar)}Descargar ícono</button><p class="dv-pie">SVG vectorial · ${pt(f.w)} × ${pt(f.h)} pt</p>`;
  } else {
    // un componente que lleva imágenes adentro (el día del mapa con su ícono): lo importante es descargarlas
    const dentro = [...new Map(todas(el).flatMap(h => assetsDe(h)).filter(x => x.tipo !== 'svg' && !x.quieto && deAdviento(x.ruta)).map(x => [x.ruta, x])).values()];
    if (dentro.length) obra = `${dentro.length === 1 ? `<button class="dv-btn main dv-wide" ${dentro[0].tipo === 'lottie' ? 'data-bajar' : 'data-xcode'}="${esc(dentro[0].ruta)}">${ico(I.bajar)}Descargar ${dentro[0].tipo === 'lottie' ? 'animación' : 'imagen'}</button><p class="dv-pie">${esc(dentro[0].tipo === 'lottie' ? dentro[0].el.dataset.anim : infoAsset(dentro[0].ruta).nombre)} · @2x y @3x</p>` : `<p class="dv-pie dv-pie-top">Lleva ${dentro.length} imágenes</p>`}${dentro.length > 1 ? `<div class="dv-sassets">${dentro.map(x => assetChip(x.ruta)).join('')}</div>` : ''}`;
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
    ref('Tamaño', `${pt(f.w)} × ${pt(f.h)}`),
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
  const codigo = sf ? `Image(systemName: "${sf}")\n    .font(.system(size: ${pt(fi.h)}, weight: .${pesoSF(svgEl)}))\n    .foregroundStyle(${swiftColor(fi.iconoColor)})${svgEl !== el ? `\n    .frame(width: ${pt(f.w)}, height: ${pt(f.h)})` : ''}` : swift(f, i?.nombre || slug(f.nombre));
  return `<nav class="dv-crumbs" aria-label="Ruta"><button class="dv-link" data-ir="pantalla">${esc(pantallaNombre)}</button>${cadena.map((c, k) => `<span aria-hidden="true">›</span><button class="dv-link" data-ir="c${k}">${esc(nombreDe(c).slice(0, k === cadena.length - 1 ? 40 : 18))}</button>`).join('')}</nav>
  <div class="dv-hero">${!lot ? `<div class="dv-prev">${img ? miniatura(img.ruta) : primera ? miniatura(primera) : svgEl ? `<span class="dv-svgprev">${svgTexto(svgEl)}</span>` : fu ? `<span class="dv-aa" style="font-family:${esc(fu.familia)};font-weight:${fu.peso};color:${fu.color?.hex}">Aa</span>` : `<span class="dv-caja" style="background:${f.relleno?.hex || 'transparent'};border-radius:${Math.min(parseFloat(String(f.radio)) || 0, 16)}px"></span>`}</div>` : ''}
    <div class="dv-ident"><h2>${esc(titulo)}</h2><p>${tipoTxt} · ${pt(f.w)} × ${pt(f.h)} pt${oscuro() ? ' · noche' : ''}</p></div></div>
  ${obra ? `<div class="dv-obra">${obra}</div>` : ''}
  ${m ? estadosHtml(m) : ''}
  ${grupo('Medidas', medidas)}
  ${grupo('Texto', texto)}
  ${grupo('Estilo', estilo)}
  ${voz && voz !== titulo ? grupo('VoiceOver', ref('Etiqueta', esc(voz), voz)) : ''}
  <details class="dv-mas"><summary>Código SwiftUI</summary><pre class="dv-code">${esc(codigo)}</pre><button class="dv-link" data-copia-code>Copiar código</button></details>`;
}

// ---------- La pantalla ----------
let pantallaNombre = 'Pantalla', assetsEls = [], compsEls = [], minis = [];
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
  const assets = assetsEls = assetsPantalla(), comps = componentesPantalla();
  compsEls = comps.map(x => x.els[0]);
  return `<p class="dv-guia">${ico(I.cursor, 18)}<span>Elige algo en el teléfono.</span></p>
  <div class="dv-hero dv-hero-p"><div class="dv-ident"><h2>${esc(info.nombre)}</h2><p>${comps.length ? `${comps.length} componentes · ` : ''}${assets.length} ${assets.length === 1 ? 'imagen o animación' : 'imágenes y animaciones'}</p></div></div>
  ${assets.length ? `<div class="dv-obra"><button class="dv-btn main dv-wide" data-zip>${ico(I.bajar)}Descargar pantalla</button><p class="dv-pie">.zip para Xcode: imágenes @2x y @3x, animaciones y medidas de cada capa</p></div>` : ''}
  ${comps.length ? `<section class="dv-grupo"><h3>Componentes</h3><ul class="dv-comps">${comps.map((x, k) => `<li><button data-comp="${k}"><span>${esc(x.c.nombre)}${x.els.length > 1 ? ` <small>×${x.els.length}</small>` : ''}</span><small>${(x.c.estados || []).length > 1 ? `${x.c.estados.length} estados` : ''}</small></button></li>`).join('')}</ul></section>` : ''}
  ${assets.length ? `<section class="dv-grupo"><h3>Imágenes y animaciones</h3><div class="dv-agrid">${assets.map((a, k) => `<button class="dv-acard" data-ver-asset="${k}" title="${esc(a.nombre)}">${a.tipo === 'lottie' ? `<span class="dv-mini" data-mini="${esc(a.el.dataset.anim)}"></span><i class="dv-badge">Lottie</i>` : miniatura(a.ruta)}<span>${esc(a.nombre)}</span></button>`).join('')}</div></section>` : ''}
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
    const r = componenteDe(el)?.raiz, b = el.closest('button, a, [role=button], [role=checkbox], [role=radio]');
    const chico = x => { const c = x?.getBoundingClientRect(), v = document.getElementById('viewport').getBoundingClientRect(); return x && c.width * c.height < v.width * v.height * .5; };
    const cands = [chico(r) && r, b].filter(Boolean);
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
  cont.onclick = ev => clic(ev, cont, info);
  cont.onmouseover = ev => { const b = ev.target.closest('[data-capa], [data-ver-asset], [data-comp], [data-ir^="c"]'); if (!b) return; resaltar(b._el || (b.dataset.verAsset ? assetsEls[+b.dataset.verAsset]?.sel : b.dataset.comp ? compsEls[+b.dataset.comp] : cadenaEls[+b.dataset.ir.slice(1)])); };
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
  const antes = b.innerHTML; b.disabled = true; b.textContent = 'Preparando…';
  try { const r = await fn(t => { b.textContent = t; }); b.textContent = r || 'Listo'; setTimeout(() => { if (b.isConnected) { b.innerHTML = antes; b.disabled = false; } }, 1600); }
  catch (e) { console.warn(e); b.innerHTML = antes; b.disabled = false; b.textContent = 'No se pudo · Reintentar'; }
}

/** PNG @k: el de Drive si existe (la calidad de la entrega), si no, sale del archivo del MVP a su tamaño en pt */
async function pngDe(r, k, el) {
  const i = infoAsset(r), d = drive(i, k);
  if (d) { try { return { blob: await traer(d), nombre: `${i.nombre}@${k}x.png` }; } catch { /* sigue con el del MVP */ } }
  const f = el && ficha(el), [w, h] = i.pt || (f ? [f.w, f.h] : [0, 0]);
  const out = await png(r, w, h, k); return { blob: out.blob, nombre: `${i.nombre}@${k}x.png`, corto: out.corto, w: out.w };
}
// la variante de noche de una imagen de día (mismo nombre con -oscuro), para el imageset con apariencia oscura
const parNoche = r => { const i = infoAsset(r); if (!/-claro$/.test(i.nombre)) return null; const n = i.nombre.replace(/-claro$/, '-oscuro'); return Object.keys(CAT || {}).find(k => CAT[k].nombre === n) || null; };
/** Un imageset de Xcode: @2x y @3x (y de noche si la hay) con su Contents.json */
async function imagesetDe(r, el) {
  const noche = parNoche(r), n = noche ? infoAsset(r).nombre.replace(/-claro$/, '') : infoAsset(r).nombre; // con par de noche, un solo imageset con las dos apariencias
  const archivos = [], images = [{ idiom: 'universal', scale: '1x' }];
  for (const k of [2, 3]) { const p = await pngDe(r, k, el); const fn = `${n}@${k}x.png`; archivos.push({ nombre: `${n}.imageset/${fn}`, datos: p.blob }); images.push({ filename: fn, idiom: 'universal', scale: `${k}x` }); }
  if (noche) for (const k of [2, 3]) { const p = await pngDe(noche, k, null); const fn = `${n}-oscuro@${k}x.png`; archivos.push({ nombre: `${n}.imageset/${fn}`, datos: p.blob }); images.push({ appearances: [{ appearance: 'luminosity', value: 'dark' }], filename: fn, idiom: 'universal', scale: `${k}x` }); }
  archivos.push({ nombre: `${n}.imageset/Contents.json`, datos: JSON.stringify({ images, info: { author: 'xcode', version: 1 } }, null, 2) });
  return { n, archivos };
}
const svgImageset = (n, s) => [{ nombre: `${n}.imageset/${n}.svg`, datos: s }, { nombre: `${n}.imageset/Contents.json`, datos: JSON.stringify({ images: [{ filename: `${n}.svg`, idiom: 'universal' }], info: { author: 'xcode', version: 1 }, properties: { 'preserves-vector-representation': true, 'template-rendering-intent': 'template' } }, null, 2) }];

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
    else if (/^c\d+$/.test(b.dataset.ir)) elegir(cadenaEls[+b.dataset.ir.slice(1)]);
    return;
  }
  if ('capa' in b.dataset && b._el) { ev.preventDefault(); elegir(b._el); return; }
  if (b.dataset.hijo) { elegir(contieneEls[+b.dataset.hijo]); return; }
  if (b.dataset.verAsset) { elegir(assetsEls[+b.dataset.verAsset]?.sel); return; }
  const el = elegida();
  if (b.dataset.bajar) return conBoton(b, async () => { const r = b.dataset.bajar; bajar(await traer(r), `${infoAsset(r).nombre}.${ext(r)}`); });
  if (b.dataset.png) return conBoton(b, async () => { const p = await pngDe(b.dataset.png, +b.dataset.k, el); bajar(p.blob, p.nombre); return p.corto ? `Descargado a ${p.w} px` : 'Descargado'; });
  if (b.dataset.xcode) return conBoton(b, async () => { const { n, archivos } = await imagesetDe(b.dataset.xcode, el); bajar(await zip(archivos), `${n}.imageset.zip`); });
  if (b.dataset.dl === 'svg' && el) return conBoton(b, async () => { const sv = el.matches('svg') ? el : el.querySelector('svg'); bajar(new Blob([svgTexto(sv)], { type: 'image/svg+xml' }), `${slug(nombreDe(el))}.svg`); });
  if (b.dataset.dl === 'svg-xcode' && el) return conBoton(b, async () => { const n = slug(nombreDe(el)); bajar(await zip(svgImageset(n, svgTexto(el))), `${n}.imageset.zip`); });
  if (b.dataset.dl === 'svg-png' && el) return conBoton(b, async () => { const k = +b.dataset.k, f = ficha(el), u = URL.createObjectURL(new Blob([svgTexto(el)], { type: 'image/svg+xml' })); const out = await png(u, f.w, f.h, k); URL.revokeObjectURL(u); bajar(out.blob, `${slug(nombreDe(el))}@${k}x.png`); });
  if ('trivia8' in b.dataset) return conBoton(b, async () => { const ns = ['mapa', 'farol', 'celebra', 'mapa-a-farol', 'farol-a-mapa', 'mapa-a-celebra', 'farol-a-celebra', 'celebra-a-mapa'].map(x => `teo-trivia-${x}`); bajar(await zip(await Promise.all(ns.map(async n => ({ nombre: `teo-trivia/${n}.json`, datos: await traer(`anim/${n}.json`) })))), 'teo-trivia.zip'); });
  if ('zip' in b.dataset) return conBoton(b, set => paquete(info, set));
}

// ---------- El paquete de la pantalla ----------
async function paquete(info, avance) {
  const assets = assetsPantalla(), base = 'adviento-' + slug(info.nombre), archivos = [], usados = new Set(), faltan = [];
  const unico = n => { let x = n, k = 2; while (usados.has(x)) x = `${n}-${k++}`; usados.add(x); return x; };
  const capas = todas().map(el => { const f = ficha(el), m = componenteDe(el); return { nombre: f.nombre, tipo: nombreTipo(f.tipo), x: +f.x.toFixed(1), y: +f.y.toFixed(1), ancho: +f.w.toFixed(1), alto: +f.h.toFixed(1), radio: f.radio || undefined, relleno: f.relleno?.hex, borde: f.borde ? `${f.borde.ancho} ${f.borde.color?.hex}` : undefined, sombra: f.sombra || undefined, texto: f.texto || undefined, fuente: f.fuente ? { postscript: postscript(f.fuente.familia, f.fuente.peso), tamano: f.fuente.tam, interlineado: f.fuente.alto, tracking: f.fuente.tracking || undefined, color: f.fuente.color?.hex } : undefined, asset: f.assets.filter(a => a.tipo !== 'svg' && deAdviento(a.ruta)).map(a => a.tipo === 'lottie' ? a.el.dataset.anim : infoAsset(a.ruta).nombre).join(', ') || undefined, sfSymbol: f.tipo === 'svg' ? sfSymbol(el) || 'ícono propio' : undefined, componente: m && !m.d ? m.c.id : undefined }; });
  const lista = [];
  for (const [i, a] of assets.entries()) {
    avance(`Preparando ${i + 1} de ${assets.length}…`);
    try {
      if (a.tipo === 'lottie') { const n = unico(a.el.dataset.anim); archivos.push({ nombre: `Lottie/${n}.json`, datos: await traer(a.ruta) }); lista.push({ archivo: `Lottie/${n}.json`, descripcion: infoAsset(a.ruta).descripcion, cuandoSale: logicaDe(a.el.dataset.anim, cur?.name).map(l => ({ donde: l.titulo, filas: l.filas.map(f => ({ si: f.si, clips: f.clips, nota: f.nota })), reglas: l.reglas })) }); continue; }
      if (a.tipo === 'svg') { const n = unico(slug(a.nombre)); svgImageset(n, svgTexto(a.el)).forEach(x => archivos.push({ ...x, nombre: `Assets.xcassets/${x.nombre}` })); lista.push({ archivo: `${n}.imageset`, pt: [+a.w.toFixed(1), +a.h.toFixed(1)] }); continue; }
      const { n, archivos: set } = await imagesetDe(a.ruta, a.el); if (usados.has(n)) continue; usados.add(n);
      set.forEach(x => archivos.push({ ...x, nombre: `Assets.xcassets/${x.nombre}` }));
      const inf = infoAsset(a.ruta); lista.push({ archivo: `${n}.imageset`, descripcion: inf.descripcion, pt: inf.pt || [+a.w.toFixed(1), +a.h.toFixed(1)], drive: inf.drive || undefined });
    } catch (e) { console.warn('paquete', a, e); faltan.push(a.nombre); }
  }
  const comps = (COMP || []).filter(c => { try { return pantallaActual()?.querySelector(c.selector) || pantallaActual()?.matches(c.selector); } catch { return false; } });
  archivos.push({ nombre: 'Assets.xcassets/Contents.json', datos: JSON.stringify({ info: { author: 'xcode', version: 1 } }, null, 2) });
  archivos.push({ nombre: 'manifest.json', datos: JSON.stringify({ pantalla: info.nombre, lienzo: info.archivo, tema: oscuro() ? 'noche' : 'día', tamano_pt: [390, 844], assets: lista, componentes: comps, capas }, null, 1) });
  if (faltan.length) archivos.push({ nombre: 'FALTAN.txt', datos: `No se pudieron preparar:\n${faltan.map(x => '- ' + x).join('\n')}\n` });
  archivos.push({ nombre: 'LEEME.md', datos: `# Adviento · ${info.nombre}\n\nExportado del MVP (modo developer) el ${new Date().toLocaleString('es')}, tema ${oscuro() ? 'noche' : 'día'}.\n\n- **Assets.xcassets/**: arrastra la carpeta a Xcode. Cada imagen trae @2x y @3x (los mismos PNG de «01 PARA LA APP» del Drive) y, si existe, su variante de noche. Los íconos de interfaz no van: son SF Symbols (el manifest dice cuál).\n- **Lottie/**: las animaciones (lottie-ios).\n- **manifest.json**: cada capa con posición y tamaño en pt (pantalla de 390 × 844), colores, fuente (nombre PostScript) y su componente; y los componentes de la pantalla con todos sus estados.\n\nTodo en pt. Ver en vivo: https://camino-a-belen-mvp.vercel.app/app.html (⇧D abre el modo developer).\n` });
  bajar(await zip(archivos), `${base}${oscuro() ? '-noche' : ''}.zip`);
  return faltan.length ? `Descargado · faltan ${faltan.length}` : 'Descargado';
}
