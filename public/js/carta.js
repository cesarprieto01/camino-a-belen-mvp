// La carta de Teodoro: el gran final del reto (lienzo «Gran final · 26 días», opción B). Reemplaza al final de 3 pasos.
// Dos momentos:
//  1 · La firma: la primera vez que el niño termina el cuento del día 26 (Nochebuena), aunque le falten días. Teodoro trae
//      una carta SECRETA (no se dice para quién es) y el niño la firma sin leerla: todavía no hay números que contar.
//  2 · La sorpresa: justo al terminar el último cuento que le falte, el día que sea (no tiene que volver al 26), o desde el
//      7 de enero con lo que haya hecho. Teodoro entrega la carta al Niño Jesús («¡Era una carta para Jesús!») y se lee,
//      con sus números y su firma; se puede imprimir (A4) o compartir (historia 9:16).
// Entre los dos, el ícono de la carta vive arriba en el mapa, junto a la batería, y cuenta los días del reto por completar.
import { S, save, A, $$, on, find, go, register, cur, toast, nota, dark, reduced, textEl, replaceText, confetti, vistos, contentDone, stars, fase } from './core.js';
import { DAYS, TYPES, RULES, JUEGOS, IMG, iconOf, hasTrivia } from './data.js';
import { sparkles, goldRain } from './flow.js';
import { teoDice, sonido, motivo, retener, soltarTrasVoz } from './musica.js';
import { entradaSecreta, botonListo, selloCarta, coreografiaSorpresa, abrirCartaAnim, presionable } from './carta-motion.js'; // coreografía de logro

// ---------- Estado ----------
const C = () => (S.carta ||= { vista: false, firma: null, color: 1, firmadaDia: null, pospuesta: false, saltoFirma: false, abierta: false });
const completa = () => vistos() >= 26;
/** Desde el 7 de enero la carta se abre con lo que haya hecho: nadie pierde la carta que firmó. */
const seAbre = () => completa() || fase() === 'recuerdo';
/** Días del reto que le faltan por completar (cuentos sin ver), en orden. */
export const diasPendientes = () => { const p = []; for (let n = 1; n <= 26; n++) if (!contentDone(n)) p.push(n); return p; };
/** Estado del ícono de arriba: oculto (aún no llega el día 26) · firmar · faltan · lista · abierta. */
export function estadoCarta() {
  const c = C();
  if (!c.vista) return 'oculto';
  if (c.abierta) return 'abierta';
  if (seAbre()) return 'lista';
  return c.firma ? 'faltan' : 'firmar';
}

// ---------- Textos (inglés por defecto, como el final anterior: panel › Ajustes › Gran final) ----------
// Regla de César: lo que le falta al niño se dice como días DEL RETO POR COMPLETAR («Completa 4 días más», «Completa el día 11»),
// nunca como espera («te faltan 4 días» se lee «en 4 días se abre»). El texto de la carta es el del lienzo (opción B).
const TXT = {
  es: {
    secreta: ['Teodoro te trae', 'una carta secreta'], altSecreta: 'Teodoro sostiene una carta sellada', firmarBtn: 'Firmar la carta',
    firmaT: n => `¡Ahora firma tú, ${n}!`, firmaSub: 'Escribe tu nombre con el dedo', firmaOtra: n => `Firma de nuevo, ${n}`, cambiarFirma: 'Firmar de nuevo', firmaCaja: n => `Firma de ${n}`, borrar: 'Borrar', listo: '¡Listo, firmé!', ahoraNo: 'Ahora no',
    guardadaT: '¡Carta firmada!', guardadaSub: (k, dia) => k === 1 ? `Termina el día ${dia} y descubre la sorpresa que Teodoro te tiene` : `Termina los ${k} días que te faltan y descubre la sorpresa que Teodoro te tiene`,
    faltanKicker: k => k === 1 ? '✦ TE FALTA ESTE DÍA ✦' : '✦ TE FALTAN ESTOS DÍAS ✦', preparando: 'Preparando…',
    seguir: n => `Seguir con el día ${n}`, mas: k => `+${k}`,
    logro: n => `¡Lo lograste, ${n}!`, logroSub: d => `Caminaste los ${d} días con Teodoro`,
    momento: n => `¡Llegó el momento, ${n}!`, momentoSub: d => d === 1 ? 'Caminaste 1 día con Teodoro' : `Caminaste ${d} días con Teodoro`,
    altCamina: 'Teodoro, de espaldas, mira el pesebre', altEntrega: 'Teodoro le entrega la carta al Niño Jesús en el pesebre',
    era: '¡La carta era para Jesús!', eraSub: 'Léela en familia', leer: 'Leer la carta',
    querido: 'Querido Jesús:',
    cuerpo: (n, d, llego) => `${n} caminó conmigo <b style="font-weight: 700">${d} ${d === 1 ? 'día' : 'días'}</b> ${llego ? 'hasta' : 'hacia'} Belén para prepararte el corazón. Soy testigo de todo lo que hizo:`,
    filas: { cuentos: v => [v, v === 1 ? 'historia de la Biblia' : 'historias de la Biblia'], juegos: v => [v, v === 1 ? 'juego en familia' : 'juegos en familia'], estrellas: v => [v, v === 1 ? 'estrella ganada' : 'estrellas ganadas'], panes: v => [v, v === 1 ? 'pan para mí en el camino' : 'panes para mí en el camino'], tiempo: v => [v, 'juntos'] },
    cierre: 'Esta Navidad, ilumina nuestros corazones con tu presencia.', cariño: 'Con cariño,', y: 'y',
    histT: (n, d, llego) => llego ? `¡${n} caminó ${d} días hasta Belén!` : `¡${n} caminó ${d} ${d === 1 ? 'día' : 'días'} con Teodoro!`,
    a4: 'CARTA AL NIÑO JESÚS', dibujo: 'Haz aquí un dibujo para Jesús', pie: ['El Adviento más grande del mundo', 'en la app Theo'],
    imprimir: 'Imprimir', compartir: 'Compartir', cerrar: 'Cerrar', volver: 'Volver',
    compartirT: 'Comparte tu carta', imprimirT: 'Imprime tu carta', compartirBtn: 'Compartir', guardarImg: 'Guardar', imprimirBtn: 'Imprimir',
    shareTitulo: 'Una carta para Jesús', shareTxt: (n, d, llego) => llego ? `${n} caminó ${d} días con Teodoro hasta Belén y firmó una carta para Jesús.` : `${n} caminó ${d} días con Teodoro y firmó una carta para Jesús.`,
    archivo: n => `Carta para Jesús - ${n}`,
    guardada: ['Imagen guardada', 'Ya puedes compartirla'],
    toastPospuesta: ['Tu carta te espera arriba', 'Fírmala cuando quieras'],
    diaCompleto: (n, k, sig) => [`¡Día ${n} completo!`, k === 1 ? `Solo te falta el día ${sig}` : `Te quedan ${k} días por completar`],
    icono: { firmar: 'Carta secreta. Falta tu firma', faltan: (k, dia) => k === 1 ? `Carta firmada. Termina el día ${dia} y descubre la sorpresa que Teodoro te tiene` : `Carta firmada. Termina los ${k} días que te faltan y descubre la sorpresa que Teodoro te tiene`, lista: 'Carta lista. Descubre para quién es', abierta: 'Tu carta para Jesús. Leerla otra vez' },
    globo: '¡Tu carta está lista!',
  },
  en: {
    secreta: ['Theodore brings you', 'a secret letter'], altSecreta: 'Theodore holds a sealed letter', firmarBtn: 'Sign the letter',
    firmaT: n => `Now you sign, ${n}!`, firmaSub: 'Write your name with your finger', firmaOtra: n => `Sign again, ${n}`, cambiarFirma: 'Sign again', firmaCaja: n => `${n}’s signature`, borrar: 'Clear', listo: 'I signed it!', ahoraNo: 'Not now',
    guardadaT: 'Letter signed!', guardadaSub: (k, dia) => k === 1 ? `Finish day ${dia} to discover the surprise Theodore has for you` : `Finish the ${k} days you have left to discover the surprise Theodore has for you`,
    faltanKicker: k => k === 1 ? '✦ ONE DAY LEFT TO FINISH ✦' : '✦ DAYS LEFT TO FINISH ✦', preparando: 'Getting it ready…',
    seguir: n => `Continue with day ${n}`, mas: k => `+${k}`,
    logro: n => `You did it, ${n}!`, logroSub: d => `You walked all ${d} days with Theodore`,
    momento: n => `It’s time, ${n}!`, momentoSub: d => d === 1 ? 'You walked 1 day with Theodore' : `You walked ${d} days with Theodore`,
    altCamina: 'Theodore, seen from behind, looks at the manger', altEntrega: 'Theodore gives the letter to Baby Jesus in the manger',
    era: 'The letter was for Jesus!', eraSub: 'Read it together', leer: 'Read the letter',
    querido: 'Dear Jesus,',
    cuerpo: (n, d, llego) => `${n} walked with me for <b style="font-weight: 700">${d} ${d === 1 ? 'day' : 'days'}</b> ${llego ? 'to' : 'on the way to'} Bethlehem to get ready for you. I saw everything ${n} did:`,
    filas: { cuentos: v => [v, v === 1 ? 'Bible story' : 'Bible stories'], juegos: v => [v, v === 1 ? 'family game' : 'family games'], estrellas: v => [v, v === 1 ? 'star earned' : 'stars earned'], panes: v => [v, v === 1 ? 'bread roll for me along the way' : 'bread rolls for me along the way'], tiempo: v => [v, 'together'] },
    cierre: 'This Christmas, light up our hearts with your presence.', cariño: 'With love,', y: 'and',
    histT: (n, d, llego) => llego ? `${n} walked ${d} days to Bethlehem!` : `${n} walked ${d} ${d === 1 ? 'day' : 'days'} with Theodore!`,
    a4: 'A LETTER TO BABY JESUS', dibujo: 'Draw a picture for Jesus here', pie: ['The Biggest Advent in the World', 'on the Theo app'],
    imprimir: 'Print', compartir: 'Share', cerrar: 'Close', volver: 'Back',
    compartirT: 'Share your letter', imprimirT: 'Print your letter', compartirBtn: 'Share', guardarImg: 'Save', imprimirBtn: 'Print',
    shareTitulo: 'A letter to Jesus', shareTxt: (n, d, llego) => llego ? `${n} walked ${d} days to Bethlehem with Theodore and signed a letter to Jesus.` : `${n} walked ${d} days with Theodore and signed a letter to Jesus.`,
    archivo: n => `Letter to Jesus - ${n}`,
    guardada: ['Image saved', 'Now you can share it'],
    toastPospuesta: ['Your letter is waiting up top', 'Sign it whenever you like'],
    diaCompleto: (n, k, sig) => [`Day ${n} done!`, k === 1 ? `Only day ${sig} left` : `${k} more days to complete`],
    icono: { firmar: 'Secret letter. It needs your signature', faltan: (k, dia) => k === 1 ? `Signed letter. Finish day ${dia} to discover Theodore’s surprise` : `Signed letter. Finish the ${k} days you have left to discover Theodore’s surprise`, lista: 'Your letter is ready. Find out who it’s for', abierta: 'Your letter to Jesus. Read it again' },
    globo: 'Your letter is ready!',
  },
};
const tx = () => TXT[S.finalIdioma === 'es' ? 'es' : 'en'];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nombre = () => esc(S.nombre || 'Lucía');

// ---------- Números de la carta ----------
/** Lo que hizo en el camino. El tiempo se calcula con la duración de cada contenido (la app real lo mide). */
export function numerosCarta() {
  let estrellas = 0, minutos = 0;
  const sorpresas = Object.keys(RULES.sorpresa).filter(d => S.sorpresas[d] === 'hecha').length;
  for (let n = 0; n <= 26; n++) {
    estrellas += stars(n);
    if (contentDone(n)) minutos += TYPES[DAYS[n]?.type]?.min || 5;
    if (hasTrivia(n) && S.completos[n]?.trivia) minutos += 3;
  }
  minutos += sorpresas * 6;
  const juegos = sorpresas + Object.keys(JUEGOS).filter(n => contentDone(+n)).length;
  return { cuentos: vistos(), juegos, estrellas, panes: S.panes, minutos };
}
const horas = m => m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`;
/** La estrella dorada del mapa (map.js), la misma que gana en cada trivia. */
const ESTRELLA = 'M7.5 1.1875 9.4125 5.25 13.8125 5.7875 10.5625 8.83125 11.4188 13.225 7.5 11.0438 3.58125 13.225 4.4375 8.83125 1.1875 5.7875 5.5875 5.25Z';
const icoEstrella = px => `<svg aria-hidden="true" width="${px}" height="${px}" viewBox="0 0 15 15" style="flex: none"><path d="${ESTRELLA}" fill="#F7C948" stroke="#E0A63A" stroke-width=".56" stroke-linejoin="round"/><path d="M7.5 2.875 8.6875 5.4375 10.3125 5.625 8.25 6.3125Z" fill="#FFF3C4" opacity=".85"/></svg>`;
// solo íconos que usa hoy el MVP: los de los días del mapa, la estrella dorada y el pan (la lámpara y el mapa viejo ya no van)
const ICONOS = { cuentos: 'assets/dia-icono/pergamino.webp', juegos: 'assets/dia-icono/rompecabezas.webp', estrellas: null, panes: () => A(IMG.pan), tiempo: 'assets/dia-icono/vela.webp' };
function filasHTML(px = 30, fs = 16, num = 20, gap = 6, color = '#06325A') {
  const v = numerosCarta(), t = tx().filas;
  return ['cuentos', 'juegos', 'estrellas', 'panes', 'tiempo'].filter(k => (k === 'tiempo' ? v.minutos : v[k]) > 0).map((k, i) => {
    const [n, txt] = t[k](k === 'tiempo' ? horas(v.minutos) : v[k]);
    const ico = k === 'estrellas' ? icoEstrella(px) : `<img alt="" src="${typeof ICONOS[k] === 'function' ? ICONOS[k]() : ICONOS[k]}" style="width: ${px}px; height: ${px}px; object-fit: contain; flex: none">`;
    return `<div class="carta-fila" style="display: flex; align-items: center; gap: 10px; margin-top: ${i ? gap : 0}px">${ico}<div style="font-size: ${fs}px; line-height: ${Math.round(fs * 1.4)}px; color: ${color}"><b style="font-weight: 700; font-size: ${num}px">${n}</b> ${txt}</div></div>`;
  }).join('');
}
/** La fecha de la carta: el día en que la firmó (24 dic = Nochebuena, 25 = Navidad). */
function fechaCarta() {
  const d = C().firmadaDia ?? Math.min(S.hoy, 26), es = S.finalIdioma === 'es';
  if (d === 26) return es ? 'Nochebuena, 2026' : 'Christmas Eve, 2026';
  if (d === 27) return es ? 'Navidad, 2026' : 'Christmas Day, 2026';
  const fecha = new Date(2026, 10, 29 + d - 1);
  const mes = fecha.toLocaleDateString(es ? 'es' : 'en', { month: 'long' });
  return es ? `${fecha.getDate()} de ${mes}, ${fecha.getFullYear()}` : `${mes[0].toUpperCase() + mes.slice(1)} ${fecha.getDate()}, ${fecha.getFullYear()}`;
}

/** Viste una carta (B3, historia o A4) con el nombre, los días, los 5 números, la fecha y la firma real. */
function vestirCarta(root, { px = 30, fs = 16, num = 20, gap = 6, firmaAlto = 40 } = {}) {
  const t = tx();
  replaceText(root, /Lucía/g, S.nombre || 'Lucía');
  const fecha = textEl(root, /Nochebuena, 2026/); if (fecha) fecha.textContent = fechaCarta();
  const querido = textEl(root, /^Querido Jesús:$/); if (querido) querido.textContent = t.querido;
  const cuerpo = [...root.querySelectorAll('div')].find(d => /caminó conmigo/.test(d.textContent) && d.querySelector('b') && d.children.length <= 2 && !d.querySelector('img'));
  if (cuerpo) cuerpo.innerHTML = t.cuerpo(nombre(), vistos(), completa());
  // las filas de números: el contenedor que tiene las filas con ícono
  const filas = [...root.querySelectorAll('div')].find(d => d.children.length >= 3 && [...d.children].every(c => c.style.display === 'flex' && c.querySelector('img')));
  if (filas) filas.innerHTML = filasHTML(px, fs, num, gap, filas.querySelector('div > div')?.style.color || '#06325A');
  const cierre = textEl(root, /^Esta Navidad, ilumina/); if (cierre) cierre.textContent = t.cierre;
  const cariño = textEl(root, /^Con cariño,$/); if (cariño) cariño.textContent = t.cariño;
  const a4 = textEl(root, /^CARTA AL NIÑO JESÚS$/); if (a4) a4.textContent = t.a4;
  const dibujo = textEl(root, /^Haz aquí un dibujo para Jesús$/); if (dibujo) dibujo.textContent = t.dibujo;
  const hist = textEl(root, /caminó \d+ días hasta Belén!$/); if (hist) hist.textContent = t.histT(S.nombre || 'Lucía', vistos(), completa());
  const pie = [...root.querySelectorAll('div')].find(d => /^El Adviento más grande del mundo/.test(d.textContent.trim()) && d.children.length <= 2);
  if (pie) pie.innerHTML = `${esc(t.pie[0])} · <b style="font-weight: 700">${esc(t.pie[1])}</b>`;
  // la firma del niño: su trazo real (si firmó) en lugar del nombre escrito
  const firma = C().firma;
  const escrito = [...root.querySelectorAll('span')].find(s => /Gloria Hallelujah/.test(s.style.fontFamily) && s.textContent.trim() === (S.nombre || 'Lucía'));
  if (firma && escrito) {
    const img = document.createElement('img'); img.src = firma; img.alt = `Firma de ${S.nombre}`;
    img.style.cssText = `height: ${firmaAlto}px; width: auto; max-width: ${firmaAlto * 3.6}px; object-fit: contain; display: block; transform: rotate(-3deg)`;
    escrito.replaceWith(img);
  }
  const y = [...root.querySelectorAll('span')].find(s => s.textContent.trim() === 'y'); if (y) y.textContent = t.y;
}

// ---------- Entrada única: decide qué momento toca ----------
export function abrirCarta(anim = 'fade', opts = {}, params = {}) {
  const c = C();
  if (!c.vista) return go('cartaSecreta', params, anim, opts);
  if (!seAbre()) return go(c.firma ? 'cartaGuardada' : 'cartaFirma', params, anim, opts);
  if (!c.firma && !c.saltoFirma) return go('cartaFirma', { ...params, antesDeAbrir: true }, anim, opts);
  return go(c.abierta ? 'carta' : 'cartaSorpresa', params, anim, opts);
}
/** Al terminar un cuento: si era el último que faltaba, se abre la sorpresa; si no, «¡Uno menos!». true = ya navegó. */
export function trasCuento(n) {
  const c = C();
  if (!c.vista || c.abierta || n === 26) return false;
  if (completa()) { abrirCarta('fade', { replace: true }); return true; }
  const pend = diasPendientes(), k = pend.length; if (k > 0 && k <= 25) { const [a, b] = tx().diaCompleto(n, k, pend[0]); setTimeout(() => toast(a, b), 900); }
  return false;
}
const alMapa = () => go('mapa', {}, 'down', { replace: true });
const entra = (el, { de = 'translateY(18px)', t = '', ms = 520, delay = 0 } = {}) => {
  if (!el || reduced()) return;
  el.animate([{ opacity: 0, transform: `${t} ${de}`.trim() }, { opacity: 1, transform: t || 'none' }], { duration: ms, delay, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'backwards' });
};
/** Un título en una sola línea: baja la letra lo justo para que quepa (nombres largos, inglés). */
function caber(el, max = 342) {
  if (!el) return; el.dataset.fs ??= el.style.fontSize || getComputedStyle(el).fontSize; // el tamaño del lienzo (34 px), una sola vez
  el.style.fontSize = el.dataset.fs; el.style.whiteSpace = 'nowrap';
  const fs = parseFloat(el.dataset.fs), w = el.scrollWidth;
  if (w > max) el.style.fontSize = Math.max(22, fs * max / w).toFixed(1) + 'px';
}
const imgAlt = (root, re) => $$(root, 'img').find(i => re.test(i.alt || ''));
const ponerTitulo = (el, lineas) => { if (!el) return; const hijos = [...el.children]; if (hijos.length >= 2 && lineas.length === 2) { hijos[0].textContent = lineas[0]; hijos[1].textContent = lineas[1]; } else el.innerHTML = lineas.map(esc).join('<br>'); el.setAttribute('aria-label', lineas.join(' ')); };
const boton = (root, txt, nuevo) => { const b = find(root, txt); const s = b && [...b.querySelectorAll('span')].pop(); if (s) s.textContent = nuevo; else if (b) b.lastChild.textContent = nuevo; b?.setAttribute('aria-label', nuevo); return b; };
/** Botones como los del resto de Adviento (medidos en el MVP): principal amarillo plano 56 px, radio 18, Neue Montreal 700 19 px
 *  en #0B748A, sin sombra; secundario transparente con aro de 1,5 px, 50 px, 16 px. Uno solo va a 727; dos, a 693 y 755. */
function estiloMVP(b, tipo, top, { left = 19, right = 19 } = {}) {
  if (!b) return;
  const d = dark(), prim = tipo === 'prim', color = prim ? '#0B748A' : d ? '#FFFFFF' : '#0B748A';
  Object.assign(b.style, { left: left + 'px', right: right + 'px', top: top + 'px', height: prim || tipo === 'par' ? '56px' : '50px', borderRadius: '18px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    background: prim ? '#F5DB78' : d ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.38)', boxShadow: prim ? 'none' : `inset 0 0 0 1.5px ${d ? 'rgba(255,255,255,.55)' : '#1E8DA5'}`,
    fontFamily: "'Neue Montreal', Mulish, system-ui, sans-serif", fontWeight: '700', fontSize: prim ? '19px' : tipo === 'par' ? '18px' : '16px', color, textDecoration: 'none' });
  b.classList.add('carta-toque'); if (!prim) b.classList.add('carta-vidrio'); presionable(b);
  b.querySelectorAll('span').forEach(x => { x.style.color = color; });
  b.querySelectorAll('svg').forEach(x => { x.setAttribute('stroke', color); x.setAttribute('width', '20'); x.setAttribute('height', '20'); });
}
// el cielo de Mundos (nubes de día; nubes y estrellas de noche) en lugar de los rayos del lienzo, con bruma arriba y abajo para leer
const CIELO = { claro: 'assets/e61f3266236935daf349df4ae724951b.webp', oscuro: 'assets/83988f1014aa164cda81619d4d403dd2.webp' };
function cielo(root) {
  const hijos = [...root.children];
  const img = hijos.find(e => e.tagName === 'IMG' && /object-fit: cover/.test(e.getAttribute('style') || ''));
  if (img) { img.src = CIELO[dark() ? 'oscuro' : 'claro']; img.alt = ''; img.style.objectPosition = '50% 50%'; }
  // fuera las capas del lienzo que tapaban el cielo (el degradado opaco y los rayos); quedan los resplandores cálidos
  hijos.forEach(e => { const st = e.getAttribute('style') || ''; if (e.getAttribute('aria-hidden') === 'true' && (/repeating-conic-gradient/.test(st) || /inset: 0/.test(st) && /#B9E6F4|#0C244C|rgba\(255,255,255,\.35\)|rgba\(0,8,43,\.15\)/.test(st))) e.remove(); });
  const bruma = document.createElement('div'); bruma.className = 'carta-bruma'; bruma.setAttribute('aria-hidden', 'true');
  if (img) img.after(bruma); else root.prepend(bruma);
}
const cerrarX = root => { const x = find(root, 'Cerrar'); if (x) { x.classList.add('carta-x', 'carta-toque'); presionable(x); x.setAttribute('aria-label', tx().cerrar); on(root, x, alMapa); } };

// ---------- 1 · La carta secreta (B2) ----------
register('cartaSecreta', {
  file: () => dark() ? 'CARTA-2-oscuro' : 'CARTA-2',
  noScroll: true,
  mount(root, p, layer) {
    const c = C(), t = tx(), primera = !c.vista;
    c.vista = true; save(); cielo(root);
    const titulo = [...root.querySelectorAll('div')].find(d => /Teodoro le trae/.test(d.textContent) && d.children.length <= 3);
    ponerTitulo(titulo, t.secreta);
    const teo = imgAlt(root, /^Teodoro/); if (teo) teo.alt = t.altSecreta;
    const b = boton(root, 'Leer la carta', t.firmarBtn);
    // el ícono del botón: una pluma, no un sobre (aquí se firma, no se lee)
    const svg = b?.querySelector('svg'); if (svg) svg.innerHTML = '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>';
    estiloMVP(b, 'prim', 727);
    if (b) on(root, b, () => go('cartaFirma', {}, 'push'));
    cerrarX(root);
    sparkles(root);
    if (primera && p.nochebuena && fase() !== 'recuerdo') { retener(12000); teoDice('nochebuena', { tras: motivo('nochebuena', 1.2) + 0.2 }); soltarTrasVoz(800); }
    entradaSecreta({ root, layer, titulo, teo, boton: b, primera });
  },
});

// ---------- 1 · La firma (B2.5) ----------
register('cartaFirma', {
  file: () => dark() ? 'CARTA-3-oscuro' : 'CARTA-3',
  noScroll: true,
  async mount(root, p, layer) {
    const c = C(), t = tx(); cielo(root);
    const titulo = textEl(root, /^¡Ahora firma tú/); if (titulo) titulo.textContent = p.rehacer ? t.firmaOtra(S.nombre) : t.firmaT(S.nombre);
    const sub = textEl(root, /^Con tu dedo/); if (sub) sub.textContent = t.firmaSub;
    const cariño = textEl(root, /^Con cariño,$/); if (cariño && S.finalIdioma !== 'es') cariño.textContent = 'With love,';
    // el rótulo de la caja punteada (no el título: «Firma de nuevo…» también empieza por «Firma de»)
    const etiqueta = [...root.querySelectorAll('div')].find(d => /^Firma de /.test(d.textContent.trim()) && /dashed/.test(d.parentElement?.getAttribute('style') || ''));
    if (etiqueta) etiqueta.textContent = t.firmaCaja(S.nombre);
    const caja = etiqueta?.parentElement;
    const listo = boton(root, '¡Listo, firmé!', t.listo), no = boton(root, 'Ahora no', t.ahoraNo);
    estiloMVP(listo, 'prim', 689); estiloMVP(no, 'sec', 755);
    cerrarX(root);
    const habilitar = si => { if (listo) botonListo(listo, si); }; // apagado → encendido con un pop corto (carta-motion.js)
    habilitar(false);
    let f = null;
    try {
      const m = await import('./firma.js');
      // la muestra pintada del lienzo (el nombre escrito, el corazón y el punto) sale: ahí firma el niño
      // fuera la muestra del lienzo: el nombre escrito, el corazón y el punto (quedan la línea base y el rótulo)
      [...(caja?.children || [])].forEach(el => { if (el === etiqueta) return; const st = el.getAttribute('style') || ''; if (/Gloria Hallelujah/.test(st) || el.querySelector?.('svg') || el.tagName.toLowerCase() === 'svg' || /border-radius: 50%/.test(st)) el.remove(); });
      const controles = find(root, 'Borrar')?.parentElement;
      const ingles = S.finalIdioma !== 'es';
      const colores = ingles ? [['navy blue', '#06325A'], ['teal', '#1E8DA5'], ['green', '#0A8445'], ['yellow', '#E2B33C'], ['orange', '#F0A04B']].map(([nombre, valor]) => ({ nombre, valor })) : undefined;
      f = m.crearFirma(caja, { colores, color: c.color ?? 1, oscuro: dark(), nombre: S.nombre, onCambio: vacia => habilitar(!vacia),
        etiqueta: v => ingles ? `${S.nombre}’s signature: ${v ? 'empty' : 'signed'}` : `Firma de ${S.nombre}: ${v ? 'vacía' : 'firmada'}` });
      f.escuchar?.(st => { if (st && c.color !== st.color) { c.color = st.color; save(); } }); // recuerda el color elegido
      if (controles && m.pintarControles) {
        controles.innerHTML = ''; controles.style.justifyContent = 'stretch';
        m.pintarControles(controles, f, colores, { textos: ingles ? { colores: 'Ink color', goma: 'Eraser', deshacer: 'Undo', borrar: 'Clear all' } : { colores: 'Color de la tinta', goma: 'Goma', deshacer: 'Deshacer', borrar: 'Borrar todo' } });
      }
    } catch (e) { console.warn('firma', e); nota('Firma', 'El lienzo de firma no cargó'); habilitar(true); }
    const volver = () => go(p.rehacer, { recien: false }, 'fade', { replace: true }); // firmar de nuevo: vuelve a la carta o a «¡Carta firmada!»
    if (p.rehacer) { const x = find(root, 'Cerrar'); if (x) { const x2 = x.cloneNode(true); x.replaceWith(x2); x2.setAttribute('aria-label', t.ahoraNo); on(root, x2, volver); } }
    if (listo) on(root, listo, () => {
      if (f && f.vacia()) return;
      c.firma = f ? f.png({ recorte: true }) : null; c.pospuesta = false; if (!p.rehacer) c.firmadaDia = Math.min(S.hoy, 39); save();
      sonido('acierto'); try { navigator.vibrate?.(20); } catch { /* */ }
      if (p.rehacer) return go(p.rehacer, { firmaNueva: true }, 'fade', { replace: true });
      seAbre() ? go('cartaSorpresa', {}, 'fade', { replace: true }) : go('cartaGuardada', { recien: true }, 'fade', { replace: true });
    });
    if (no && p.rehacer) on(root, no, volver);
    else if (no) on(root, no, () => {
      if (seAbre()) { c.saltoFirma = true; save(); go('cartaSorpresa', {}, 'fade', { replace: true }); return; }
      c.pospuesta = true; save(); alMapa(); const [a, b] = t.toastPospuesta; setTimeout(() => toast(a, b), 500);
    });
    if (layer) layer.addEventListener('transitionend', () => {}, { once: true });
    root.__firma = f;
  },
  dismiss: () => cur?.params?.rehacer ? go(cur.params.rehacer, {}, 'fade', { replace: true }) : alMapa(),
});

// ---------- 1 · Carta guardada: faltan días del reto (pantalla nueva, con el sistema de la firma) ----------
register('cartaGuardada', {
  file: () => dark() ? 'CARTA-3-oscuro' : 'CARTA-3',
  noScroll: true,
  mount(root, p, layer) {
    const c = C(), t = tx(), pend = diasPendientes(), k = pend.length, sig = pend[0], d = dark(); cielo(root);
    if (!k || seAbre()) { setTimeout(() => abrirCarta('fade', { replace: true }), 0); return; } // ya no le falta nada: directo a la sorpresa
    const titulo = textEl(root, /^¡Ahora firma tú/), sub = textEl(root, /^Con tu dedo/);
    if (titulo) titulo.textContent = t.guardadaT;
    if (sub) { sub.textContent = t.guardadaSub(k, sig); Object.assign(sub.style, { left: '30px', right: '30px', fontSize: '18px', lineHeight: '25px', fontWeight: '500' }); }
    const cariño = textEl(root, /^Con cariño,$/); if (cariño) cariño.textContent = t.cariño;
    const etiqueta = [...root.querySelectorAll('div')].find(x => /^Firma de /.test(x.textContent.trim()) && /dashed/.test(x.parentElement?.getAttribute('style') || '')), caja = etiqueta?.parentElement, tarjeta = caja?.closest('div[style*="box-shadow"]');
    // su firma, centrada en la carta (ya firmada: sin la caja punteada)
    if (caja) {
      caja.setAttribute('style', 'position: absolute; left: 20px; right: 20px; top: 92px; bottom: 20px; display: grid; place-items: center');
      caja.innerHTML = c.firma ? `<img alt="${esc(t.firmaCaja(S.nombre))}" src="${c.firma}" style="max-width: 92%; max-height: min(100%, 110px); object-fit: contain">`
        : `<span style="font-family: 'Gloria Hallelujah', cursive; font-size: 44px; line-height: 1; color: #1E8DA5; transform: rotate(-5deg)">${nombre()}</span>`;
    }
    // ¿no le gustó cómo firmó? tocar la firma (o «Firmar de nuevo») vuelve a la firma; lo demás queda como estaba
    if (caja && tarjeta) {
      caja.classList.add('carta-firma-tocable'); caja.setAttribute('role', 'button'); caja.setAttribute('aria-label', t.cambiarFirma); caja.tabIndex = 0;
      const otra = document.createElement('button'); otra.type = 'button'; otra.className = 'carta-otra-firma carta-toque'; otra.innerHTML = `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg><span>${esc(t.cambiarFirma)}</span>`;
      tarjeta.appendChild(otra);
      const rehacer = () => go('cartaFirma', { rehacer: 'cartaGuardada' }, 'fade', { replace: true });
      on(root, caja, rehacer); on(root, otra, rehacer);
    }
    // el sello: la huella de Teodoro cierra la carta hasta que la abra
    if (tarjeta) {
      const sello = document.createElement('div'); sello.className = 'carta-sello'; sello.setAttribute('aria-hidden', 'true');
      sello.innerHTML = '<svg width="34" height="34" viewBox="0 0 24 24" fill="#FFF6DD"><ellipse cx="5.2" cy="10.2" rx="2.1" ry="2.7" transform="rotate(-20 5.2 10.2)"/><ellipse cx="9.3" cy="5.6" rx="2.2" ry="2.9" transform="rotate(-8 9.3 5.6)"/><ellipse cx="14.7" cy="5.6" rx="2.2" ry="2.9" transform="rotate(8 14.7 5.6)"/><ellipse cx="18.8" cy="10.2" rx="2.1" ry="2.7" transform="rotate(20 18.8 10.2)"/><path d="M12 11c-3 0-6 3.6-6 6.6 0 1.9 1.4 3 3.2 3 1.2 0 1.8-.6 2.8-.6s1.6.6 2.8.6c1.8 0 3.2-1.1 3.2-3 0-3-3-6.6-6-6.6Z"/></svg>';
      tarjeta.appendChild(sello);
    }
    // los días que faltan, con su ícono del mapa y un rótulo como el «✦ TIEMPO DE NAVIDAD ✦» de Adviento
    const fila = find(root, 'Borrar')?.parentElement;
    let kicker = null;
    if (fila) {
      const muestra = k > 6 ? pend.slice(0, 5) : pend;
      fila.className = 'carta-pendientes'; fila.setAttribute('role', 'list'); fila.setAttribute('aria-label', t.guardadaSub(k, sig));
      // cada día se toca y lleva a ese día en el mapa (tocar = hacer)
      fila.innerHTML = muestra.map(n => `<button type="button" role="listitem" class="carta-dia carta-toque" data-dia="${n}" aria-label="Día ${n}"><img alt="" src="${iconOf(n, d) ? 'assets/' + iconOf(n, d) : A(IMG.estrella)}"><b>${n}</b></button>`).join('') + (k > muestra.length ? `<span role="listitem" class="carta-dia carta-mas" aria-label="${k - muestra.length} días más"><b>${t.mas(k - muestra.length)}</b></span>` : '');
      fila.removeAttribute('style');
      kicker = document.createElement('div'); kicker.className = 'carta-kicker'; kicker.setAttribute('aria-hidden', 'true'); kicker.textContent = t.faltanKicker(k);
      // el rótulo y los días van juntos en un panel de vidrio: se leen sobre cualquier nube del cielo
      const panel = document.createElement('div'); panel.className = 'carta-panel'; fila.replaceWith(panel); panel.append(kicker, fila);
      fila.querySelectorAll('[data-dia]').forEach(b => on(root, b, () => go('mapa', { dia: +b.dataset.dia }, 'down', { replace: true })));
    }
    const listo = boton(root, '¡Listo, firmé!', sig ? t.seguir(sig) : t.cerrar);
    if (listo) { listo.querySelector('svg')?.remove(); on(root, listo, () => go('mapa', sig ? { dia: sig } : {}, 'down', { replace: true })); }
    const no = boton(root, 'Ahora no', t.ahoraNo); if (no) on(root, no, alMapa);
    estiloMVP(listo, 'prim', 689); estiloMVP(no, 'sec', 755);
    cerrarX(root);
    // reparto vertical: el título, el texto (2 o 3 líneas), la carta, el rótulo y los días, sin hueco antes de los botones
    const ordenar = () => {
      if (!sub || !tarjeta) return;
      // la fila de días termina ~36 px sobre el botón: la carta crece lo que haga falta (entre 220 y 300)
      const y0 = sub.offsetTop + sub.offsetHeight + 22, alto = Math.max(220, Math.min(290, 689 - 24 - 118 - 24 - y0));
      tarjeta.style.top = y0 + 'px'; tarjeta.style.height = alto + 'px';
      const y1 = y0 + alto + 32;
      const panel = root.querySelector('.carta-panel'); if (panel) panel.style.top = (y1 - 8) + 'px';
    };
    ordenar(); document.fonts?.ready.then(() => root.isConnected && ordenar());
    // la firma se escribe sola, el sello cae y golpea (sonido y vibración en el impacto), y entran el panel y los días (carta-motion.js)
    const nueva = !!(p.recien || p.firmaNueva);
    selloCarta({ root, layer, tarjeta, sello: root.querySelector('.carta-sello'), firma: caja?.querySelector('img'), kicker, dias: [...root.querySelectorAll('.carta-dia')], recien: nueva });
    if (nueva) teoDice('sello', { tras: 1.7 }); // «¡Qué buen trabajo!» justo después del golpe del sello
    root.querySelectorAll('.carta-dia, .carta-otra-firma').forEach(el => presionable(el));
  },
  dismiss: () => alMapa(),
});

// ---------- 2 · La sorpresa (B1): Teodoro entrega la carta al Niño Jesús ----------
// El JSON (Lottie) de la entrega lo pasa César: cuando llegue va en ENTREGA y reemplaza a Teodoro caminando.
const ENTREGA = null; // p. ej. 'assets/lottie/teo-entrega-carta.json'
register('cartaSorpresa', {
  file: () => dark() ? 'CARTA-1-oscuro' : 'CARTA-1',
  noScroll: true,
  mount(root, p, layer) {
    const t = tx(); cielo(root);
    const titulo = textEl(root, /^¡Mira, Lucía!$/), sub = textEl(root, /^Jesús ya nació en Belén$/);
    const todo = completa();
    if (titulo) { titulo.textContent = todo ? t.logro(S.nombre) : t.momento(S.nombre); caber(titulo); }
    if (sub) sub.textContent = todo ? t.logroSub(vistos()) : t.momentoSub(vistos());
    const teo = imgAlt(root, /^Teodoro de espaldas/), pesebre = imgAlt(root, /^El pesebre/);
    if (teo) teo.alt = t.altCamina; // no dice adónde va la carta hasta la revelación
    const b = boton(root, '¡Vamos a verlo!', t.leer);
    const svg = b?.querySelector('svg'); if (svg) svg.innerHTML = '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>';
    estiloMVP(b, 'prim', 727);
    if (b) on(root, b, () => go('carta', { nueva: true }, 'fade', { replace: true }));
    cerrarX(root);
    if (b) b.querySelector('svg') && b.querySelector('svg').setAttribute('stroke', '#0B748A');
    coreografiaSorpresa({ root, layer, teo, pesebre, titulo, sub, boton: b,
      textos: { era: t.era, eraSub: t.eraSub, altEntrega: t.altEntrega },
      onRevelar: () => { caber(titulo); teoDice('premioGrande', { tras: .35 }); }, // «¡Increíble!»: la carta era para Jesús
      animacionEntrega: ENTREGA || undefined });
  },
  dismiss: () => alMapa(),
});

// ---------- 2 · La carta (B3) ----------
register('carta', {
  file: () => dark() ? 'CARTA-4-oscuro' : 'CARTA-4',
  noScroll: true,
  mount(root, p, layer) {
    const c = C(), t = tx(); cielo(root);
    if (!c.abierta) { c.abierta = true; save(); }
    vestirCarta(root, { px: 28, fs: 15.5, num: 19, gap: 4, firmaAlto: 38 });
    const papel = [...root.children].find(el => /rotate\(-1deg\)/.test(el.style.transform || ''));
    // Imprimir y Compartir lado a lado (el principal a la derecha) y debajo «Ahora no» para salir sin hacer nada; actúan de una vez
    const imp = boton(root, 'Imprimir', t.imprimir), com = boton(root, 'Compartir', t.compartir), no = boton(root, 'Ahora no', t.ahoraNo);
    estiloMVP(imp, 'par', 689, { right: 201 }); estiloMVP(com, 'prim', 689, { left: 201 });
    if (no) { no.classList.add('carta-toque'); Object.assign(no.style, { top: '755px', height: '44px', left: '19px', right: '19px' }); no.querySelector('span').style.color = dark() ? '#FFFFFF' : '#0B748A'; on(root, no, alMapa); }
    // firmar de nuevo, también después: tocar su firma en la carta
    const firmaImg = root.querySelector('img[alt^="Firma de"]'), lugar = firmaImg?.parentElement;
    if (firmaImg && lugar) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'carta-firma-boton carta-toque'; b.setAttribute('aria-label', t.cambiarFirma);
      firmaImg.replaceWith(b); b.append(firmaImg); b.insertAdjacentHTML('beforeend', `<i class="carta-lapiz" aria-hidden="true"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></i>`);
      on(root, b, () => go('cartaFirma', { rehacer: 'carta' }, 'fade', { replace: true }));
    }
    if (com) on(root, com, () => ocupado(com, t, compartirYa));
    if (imp) on(root, imp, () => ocupado(imp, t, imprimirYa));
    cerrarX(root);
    root.querySelectorAll('.carta-firma-boton').forEach(el => presionable(el));
    abrirCartaAnim({ root, layer, papel, filas: [...root.querySelectorAll('.carta-fila')], firma: root.querySelector('img[alt^="Firma de"]'), nueva: !!p.nueva });
    if (p.nueva) teoDice('finSemana', { tras: 4.4 }); // «¡Gran aventura!» al terminar de abrirse: cierra el recorrido entero
  },
  dismiss: () => alMapa(),
});

// ---------- Compartir (historia 9:16) e imprimir (A4) ----------
let h2i = null;
const libreria = () => h2i ??= new Promise((ok, mal) => {
  if (window.htmlToImage) return ok(window.htmlToImage);
  const s = document.createElement('script'); s.src = 'vendor/html-to-image.min.js'; s.onload = () => ok(window.htmlToImage); s.onerror = mal; document.head.append(s);
});
export async function pieza(file) {
  const html = await (await fetch(`screens/${file}.html`)).text();
  const box = document.createElement('div'); box.innerHTML = html;
  const el = box.firstElementChild; vestirCarta(el, { px: 22, fs: 12.5, num: 15, gap: 3, firmaAlto: 26 });
  return el;
}
// la letra de la carta (Caveat, Allura y Gloria Hallelujah) se carga antes de fotografiar la pieza, y se incrusta la que se dibuja
const LETRAS = ['700 38px Caveat', '54px Allura', '28px "Gloria Hallelujah"', '700 16px "Neue Montreal"', '500 16px "Neue Montreal"', '400 16px "Neue Montreal"'];
/** Pone la pieza en la página (fuera de la vista), espera su letra y devuelve lo que necesita html-to-image. */
async function preparar(el) {
  const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:-10000px;top:0;pointer-events:none'; host.append(el); document.body.append(host);
  try { await Promise.all(LETRAS.map(f => document.fonts.load(f, 'Querido Jesús Teodoro Lucía 0123456789'))); } catch { /* sin red: la de respaldo */ }
  await Promise.all([...el.querySelectorAll('img')].map(i => i.decode?.().catch(() => {})));
  let fontEmbedCSS; try { fontEmbedCSS = await (await import('./dev-motor.js')).fuentesDe(el); } catch { /* sin fuentes incrustadas */ }
  return { host, fontEmbedCSS, lib: await libreria() };
}
async function aPng(el) {
  const { host, fontEmbedCSS, lib } = await preparar(el);
  try { return await lib.toPng(el, { pixelRatio: 3, fontEmbedCSS, cacheBust: false, style: { transform: 'none', boxShadow: 'none', borderRadius: '0' } }); } finally { host.remove(); }
}
const bajar = (url, nombreArchivo) => { const a = document.createElement('a'); a.href = url; a.download = nombreArchivo; document.body.append(a); a.click(); a.remove(); };
/** Mientras se arma la imagen o el PDF (1–2 s): el botón dice «Preparando…» y no se puede volver a tocar. */
async function ocupado(btn, t, fn) {
  if (btn.getAttribute('aria-busy') === 'true') return;
  const lab = [...btn.querySelectorAll('span')].pop(), antes = lab?.textContent;
  btn.setAttribute('aria-busy', 'true'); btn.style.pointerEvents = 'none'; btn.style.opacity = '.7'; if (lab) lab.textContent = t.preparando;
  try { await fn(); } finally { btn.removeAttribute('aria-busy'); btn.style.pointerEvents = ''; btn.style.opacity = ''; if (lab) lab.textContent = antes; }
}
const nombreArchivo = () => tx().archivo(S.nombre || 'Teodoro');
/** Compartir: la historia 9:16 se descarga de una como imagen, lista para compartir (pedido de César). */
async function compartirYa() {
  const t = tx();
  try { bajar(await aPng(await pieza(dark() ? 'CARTA-HIST-oscuro' : 'CARTA-HIST')), nombreArchivo() + '.png'); toast(...t.guardada); }
  catch (e) { console.warn('imagen', e); nota('Compartir', 'No se pudo armar la imagen'); }
}
/** Imprimir: la hoja A4 (blanca en los dos temas, ahorra tinta) se descarga como PDF de una vez. */
async function imprimirYa() {
  try { const pdf = await pdfA4(await pieza('CARTA-A4')); const url = URL.createObjectURL(pdf); bajar(url, nombreArchivo() + '.pdf'); setTimeout(() => URL.revokeObjectURL(url), 4000); }
  catch (e) { console.warn('pdf', e); nota('Imprimir', 'No se pudo armar el PDF'); }
}
/** PDF A4 de una página con la hoja como imagen (JPEG a ~200 ppp). Sin librerías: el PDF se escribe a mano. */
async function pdfA4(el) {
  const { host, fontEmbedCSS, lib } = await preparar(el);
  let cv; try { cv = await lib.toCanvas(el, { pixelRatio: 4, fontEmbedCSS, cacheBust: false, backgroundColor: '#FFFFFF', style: { boxShadow: 'none' } }); } finally { host.remove(); }
  const jpg = Uint8Array.from(atob(cv.toDataURL('image/jpeg', .9).split(',')[1]), ch => ch.charCodeAt(0));
  const W = 595.28, H = 841.89, enc = new TextEncoder(), partes = [], offs = []; let largo = 0;
  const add = x => { const b = typeof x === 'string' ? enc.encode(x) : x; partes.push(b); largo += b.length; };
  const obj = (n, cuerpo) => { offs[n] = largo; add(`${n} 0 obj\n`); cuerpo(); add('\nendobj\n'); };
  add('%PDF-1.4\n%âãÏÓ\n');
  obj(1, () => add('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2, () => add('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'));
  obj(3, () => add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`));
  obj(4, () => { add(`<< /Type /XObject /Subtype /Image /Width ${cv.width} /Height ${cv.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`); add(jpg); add('\nendstream'); });
  const dibujo = `q ${W} 0 0 ${H} 0 0 cm /Im0 Do Q`;
  obj(5, () => add(`<< /Length ${dibujo.length} >>\nstream\n${dibujo}\nendstream`));
  const xref = largo;
  add(`xref\n0 6\n0000000000 65535 f \n${[1, 2, 3, 4, 5].map(n => String(offs[n]).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size 6 /Root 1 0 R /Info << /Title (Carta para Jesus) /Creator (Theo) >> >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(partes, { type: 'application/pdf' });
}

// ---------- Panel: estados de prueba ----------
/** Deja la carta en un estado (recorridos del panel); si ya firmó y no hay trazo, una firma de muestra con su nombre. */
export function cartaDemo(estado = {}) {
  S.carta = { ...C(), ...estado };
  if (estado.vista && estado.firma === undefined && !S.carta.firma && estado.sinFirma !== true) S.carta.firma = firmaMuestra();
  save();
}
function firmaMuestra() {
  const cv = document.createElement('canvas'); cv.width = 540; cv.height = 200;
  const x = cv.getContext('2d'); x.strokeStyle = '#1E8DA5'; x.lineWidth = 9; x.lineCap = 'round'; x.lineJoin = 'round';
  x.beginPath(); x.moveTo(30, 40); x.bezierCurveTo(28, 90, 26, 140, 34, 160); x.bezierCurveTo(70, 150, 100, 140, 120, 132); // L
  x.moveTo(140, 110); x.bezierCurveTo(130, 150, 170, 160, 182, 110); x.bezierCurveTo(180, 140, 190, 160, 205, 150); // u
  x.moveTo(262, 112); x.bezierCurveTo(230, 100, 222, 158, 258, 156); x.bezierCurveTo(268, 155, 276, 150, 282, 144); // c
  x.moveTo(305, 110); x.lineTo(300, 155); x.moveTo(300, 92); x.lineTo(318, 76); // í
  x.moveTo(380, 118); x.bezierCurveTo(340, 102, 330, 160, 365, 156); x.bezierCurveTo(380, 154, 386, 130, 384, 116); x.bezierCurveTo(382, 140, 392, 160, 420, 150); // a
  x.moveTo(40, 178); x.bezierCurveTo(160, 170, 330, 186, 500, 168); // rúbrica
  x.stroke();
  return cv.toDataURL('image/png');
}

// ---------- El ícono de la carta, arriba en el mapa (junto a la batería) ----------
export function iconoCarta(layer) {
  const est = estadoCarta(); if (est === 'oculto') return;
  const bat = layer.querySelector('[aria-label^="Energía de Teodoro"]'); if (!bat) return;
  const t = tx(), k = diasPendientes().length;
  const b = document.createElement('button'); b.type = 'button'; b.className = `carta-icono carta-${est}`;
  b.setAttribute('aria-label', est === 'faltan' ? t.icono.faltan(k, diasPendientes()[0]) : t.icono[est]); b.title = b.getAttribute('aria-label');
  b.innerHTML = `<img alt="" src="assets/dia-icono/carta.webp">${est === 'faltan' ? `<span class="carta-badge" aria-hidden="true">${k}</span>` : est === 'firmar' ? '<span class="carta-punto" aria-hidden="true"></span>' : ''}`;
  const r = bat.getBoundingClientRect(), pr = (bat.offsetParent || layer).getBoundingClientRect();
  b.style.top = (bat.offsetTop + bat.offsetHeight + 8) + 'px';
  b.style.left = (bat.offsetLeft + bat.offsetWidth / 2 - 24) + 'px';
  (bat.offsetParent || bat.parentElement).appendChild(b);
  on(layer, b, () => { b.animate?.([{ transform: 'scale(.9)' }, { transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.34,1.56,.64,1)' }); abrirCarta('fade'); });
  if (est === 'lista') {
    const g = document.createElement('div'); g.className = 'carta-globo'; g.setAttribute('role', 'status'); g.textContent = t.globo;
    g.style.top = (bat.offsetTop + bat.offsetHeight + 8 + 6) + 'px'; g.style.right = (layer.clientWidth - bat.offsetLeft + 4 - bat.offsetWidth / 2 + 24 + 10) + 'px';
    (bat.offsetParent || bat.parentElement).appendChild(g);
    on(layer, g, () => abrirCarta('fade'));
  }
  void r; void pr;
}
