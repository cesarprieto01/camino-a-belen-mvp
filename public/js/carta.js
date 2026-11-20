// La carta de Teodoro: el gran final del reto (lienzo «Gran final · 26 días», opción B). Reemplaza al final de 3 pasos.
// Dos momentos:
//  1 · La firma: la primera vez que el niño termina el cuento del día 26 (Nochebuena), aunque le falten días. Teodoro trae
//      una carta SECRETA (no se dice para quién es) y el niño la firma sin leerla: todavía no hay números que contar.
//  2 · La sorpresa: justo al terminar el último cuento que le falte, el día que sea (no tiene que volver al 26), o desde el
//      7 de enero con lo que haya hecho. Teodoro entrega la carta al Niño Jesús («¡Era una carta para Jesús!») y se lee,
//      con sus números y su firma; se puede imprimir (A4) o compartir (historia 9:16).
// Entre los dos, el ícono de la carta vive arriba en el mapa, junto a la batería, y cuenta los días del reto por completar.
import { S, save, A, $$, on, find, go, register, toast, nota, dark, reduced, textEl, replaceText, confetti, vistos, contentDone, stars, fase } from './core.js';
import { DAYS, TYPES, RULES, JUEGOS, IMG, iconOf, hasTrivia } from './data.js';
import { sparkles, goldRain } from './flow.js';
import { teoDice, sonido, motivo, retener, soltarTrasVoz } from './musica.js';

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
    firmaT: n => `¡Ahora firma tú, ${n}!`, firmaSub: 'Escribe tu nombre con el dedo', firmaCaja: n => `Firma de ${n}`, borrar: 'Borrar', listo: '¡Listo, firmé!', ahoraNo: 'Ahora no',
    guardadaT: '¡Carta firmada!', guardadaSub: (k, dia) => k === 1 ? `Completa el día ${dia} y descubre para quién es` : `Completa ${k} días más y descubre para quién es`,
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
    sinShare: ['Guardamos la imagen', 'En el celular se abre el menú para compartir'],
    toastPospuesta: ['Tu carta te espera arriba', 'Fírmala cuando quieras'],
    diaCompleto: (n, k, sig) => [`¡Día ${n} completo!`, k === 1 ? `Solo te falta el día ${sig}` : `Te quedan ${k} días por completar`],
    icono: { firmar: 'Carta secreta. Falta tu firma', faltan: (k, dia) => k === 1 ? `Carta firmada. Completa el día ${dia} y descubre para quién es` : `Carta firmada. Completa ${k} días más y descubre para quién es`, lista: 'Carta lista. Descubre para quién es', abierta: 'Tu carta para Jesús. Leerla otra vez' },
    globo: '¡Tu carta está lista!',
  },
  en: {
    secreta: ['Theodore brings you', 'a secret letter'], altSecreta: 'Theodore holds a sealed letter', firmarBtn: 'Sign the letter',
    firmaT: n => `Now you sign, ${n}!`, firmaSub: 'Write your name with your finger', firmaCaja: n => `${n}’s signature`, borrar: 'Clear', listo: 'I signed it!', ahoraNo: 'Not now',
    guardadaT: 'Letter signed!', guardadaSub: (k, dia) => k === 1 ? `Complete day ${dia} to find out who it’s for` : `Complete ${k} more days to find out who it’s for`,
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
    sinShare: ['Image saved', 'On the phone, the share menu opens'],
    toastPospuesta: ['Your letter is waiting up top', 'Sign it whenever you like'],
    diaCompleto: (n, k, sig) => [`Day ${n} done!`, k === 1 ? `Only day ${sig} left` : `${k} more days to complete`],
    icono: { firmar: 'Secret letter. It needs your signature', faltan: (k, dia) => k === 1 ? `Signed letter. Complete day ${dia} to find out who it’s for` : `Signed letter. Complete ${k} more days to find out who it’s for`, lista: 'Your letter is ready. Find out who it’s for', abierta: 'Your letter to Jesus. Read it again' },
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
const cerrarX = root => { const x = find(root, 'Cerrar'); if (x) { x.setAttribute('aria-label', tx().cerrar); on(root, x, alMapa); } };

// ---------- 1 · La carta secreta (B2) ----------
register('cartaSecreta', {
  file: () => dark() ? 'CARTA-2-oscuro' : 'CARTA-2',
  noScroll: true,
  mount(root, p, layer) {
    const c = C(), t = tx(), primera = !c.vista;
    c.vista = true; save();
    const titulo = [...root.querySelectorAll('div')].find(d => /Teodoro le trae/.test(d.textContent) && d.children.length <= 3);
    ponerTitulo(titulo, t.secreta);
    const teo = imgAlt(root, /^Teodoro/); if (teo) teo.alt = t.altSecreta;
    const b = boton(root, 'Leer la carta', t.firmarBtn);
    // el ícono del botón: una pluma, no un sobre (aquí se firma, no se lee)
    const svg = b?.querySelector('svg'); if (svg) svg.innerHTML = '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>';
    if (b) on(root, b, () => go('cartaFirma', {}, 'push'));
    cerrarX(root);
    sparkles(root);
    if (primera && p.nochebuena && fase() !== 'recuerdo') { retener(12000); teoDice('nochebuena', { tras: motivo('nochebuena', 1.2) + 0.2 }); soltarTrasVoz(800); }
    if (reduced()) return;
    entra(titulo, { delay: 120 });
    entra(teo, { de: 'translateY(40px) scale(.94)', ms: 800, delay: 250 });
    setTimeout(() => teo?.isConnected && teo.classList.add('a-bob'), 1100);
    entra(b, { delay: 700 });
    if (primera) setTimeout(() => layer.isConnected && goldRain(layer), 500);
  },
});

// ---------- 1 · La firma (B2.5) ----------
register('cartaFirma', {
  file: () => dark() ? 'CARTA-3-oscuro' : 'CARTA-3',
  noScroll: true,
  async mount(root, p, layer) {
    const c = C(), t = tx();
    const titulo = textEl(root, /^¡Ahora firma tú/); if (titulo) titulo.textContent = t.firmaT(S.nombre);
    const sub = textEl(root, /^Con tu dedo/); if (sub) sub.textContent = t.firmaSub;
    const cariño = textEl(root, /^Con cariño,$/); if (cariño && S.finalIdioma !== 'es') cariño.textContent = 'With love,';
    const etiqueta = textEl(root, /^Firma de /); if (etiqueta) etiqueta.textContent = t.firmaCaja(S.nombre);
    const caja = etiqueta?.parentElement;
    const listo = boton(root, '¡Listo, firmé!', t.listo), no = boton(root, 'Ahora no', t.ahoraNo);
    cerrarX(root);
    const habilitar = si => { if (!listo) return; listo.setAttribute('aria-disabled', String(!si)); listo.style.opacity = si ? '1' : '.5'; listo.style.pointerEvents = si ? '' : 'none'; };
    habilitar(false);
    let f = null;
    try {
      const m = await import('./firma.js');
      // la muestra pintada del lienzo (el nombre escrito, el corazón y el punto) sale: ahí firma el niño
      // fuera la muestra del lienzo: el nombre escrito, el corazón y el punto (quedan la línea base y el rótulo)
      [...(caja?.children || [])].forEach(el => { if (el === etiqueta) return; const st = el.getAttribute('style') || ''; if (/Gloria Hallelujah/.test(st) || el.querySelector?.('svg') || el.tagName.toLowerCase() === 'svg' || /border-radius: 50%/.test(st)) el.remove(); });
      const controles = find(root, 'Borrar')?.parentElement;
      f = m.crearFirma(caja, { color: c.color ?? 1, oscuro: dark(), nombre: S.nombre, onCambio: vacia => habilitar(!vacia) });
      if (controles && m.pintarControles) { controles.innerHTML = ''; controles.style.justifyContent = 'stretch'; const k = m.pintarControles(controles, f); const lb = k?.raiz?.querySelector('.firma-borrar span'); if (lb) lb.textContent = t.borrar; }
    } catch (e) { console.warn('firma', e); nota('Firma', 'El lienzo de firma no cargó'); habilitar(true); }
    if (listo) on(root, listo, () => {
      if (f && f.vacia()) return;
      c.firma = f ? f.png({ recorte: true }) : null; c.firmadaDia = Math.min(S.hoy, 39); c.pospuesta = false; save();
      sonido('acierto'); try { navigator.vibrate?.(20); } catch { /* */ }
      seAbre() ? go('cartaSorpresa', {}, 'fade', { replace: true }) : go('cartaGuardada', { recien: true }, 'fade', { replace: true });
    });
    if (no) on(root, no, () => {
      if (seAbre()) { c.saltoFirma = true; save(); go('cartaSorpresa', {}, 'fade', { replace: true }); return; }
      c.pospuesta = true; save(); alMapa(); const [a, b] = t.toastPospuesta; setTimeout(() => toast(a, b), 500);
    });
    if (layer) layer.addEventListener('transitionend', () => {}, { once: true });
    root.__firma = f;
  },
  dismiss: () => alMapa(),
});

// ---------- 1 · Carta guardada: faltan días del reto (pantalla nueva, con el sistema de la firma) ----------
register('cartaGuardada', {
  file: () => dark() ? 'CARTA-3-oscuro' : 'CARTA-3',
  noScroll: true,
  mount(root, p, layer) {
    const c = C(), t = tx(), pend = diasPendientes(), k = pend.length;
    const titulo = textEl(root, /^¡Ahora firma tú/); if (titulo) titulo.textContent = t.guardadaT;
    const sub = textEl(root, /^Con tu dedo/); if (sub) { sub.textContent = t.guardadaSub(k, pend[0]); sub.style.fontWeight = '500'; }
    const cariño = textEl(root, /^Con cariño,$/); if (cariño && S.finalIdioma !== 'es') cariño.textContent = 'With love,';
    const etiqueta = textEl(root, /^Firma de /); const caja = etiqueta?.parentElement;
    // en la caja de la firma: su firma real, sin la línea punteada (ya está firmada)
    if (caja) {
      caja.innerHTML = c.firma ? `<img alt="${esc(t.firmaCaja(S.nombre))}" src="${c.firma}" style="position: absolute; inset: 14px 18px 30px; width: calc(100% - 36px); height: calc(100% - 44px); object-fit: contain; object-position: left center">` : '';
      caja.style.borderStyle = 'solid'; caja.style.borderColor = 'transparent'; caja.style.background = 'transparent'; caja.style.height = '96px'; caja.style.marginTop = '2px';
    }
    // el sello: la huella de Teodoro (la del lienzo) cierra la carta hasta que la abra
    const tarjeta = caja?.closest('div[style*="box-shadow"]') || caja?.parentElement;
    if (tarjeta && caja) { tarjeta.style.height = '228px'; caja.style.top = '100px'; } // sin la caja punteada, la carta queda justa
    if (tarjeta) {
      tarjeta.style.position = tarjeta.style.position || 'absolute';
      const sello = document.createElement('div'); sello.className = 'carta-sello'; sello.setAttribute('aria-hidden', 'true');
      sello.innerHTML = '<svg width="34" height="34" viewBox="0 0 24 24" fill="#FFF6DD"><ellipse cx="5.2" cy="10.2" rx="2.1" ry="2.7" transform="rotate(-20 5.2 10.2)"/><ellipse cx="9.3" cy="5.6" rx="2.2" ry="2.9" transform="rotate(-8 9.3 5.6)"/><ellipse cx="14.7" cy="5.6" rx="2.2" ry="2.9" transform="rotate(8 14.7 5.6)"/><ellipse cx="18.8" cy="10.2" rx="2.1" ry="2.7" transform="rotate(20 18.8 10.2)"/><path d="M12 11c-3 0-6 3.6-6 6.6 0 1.9 1.4 3 3.2 3 1.2 0 1.8-.6 2.8-.6s1.6.6 2.8.6c1.8 0 3.2-1.1 3.2-3 0-3-3-6.6-6-6.6Z"/></svg>';
      tarjeta.appendChild(sello);
    }
    // los días que faltan, con su ícono del mapa: se lee «días por completar», no «días por esperar»
    const controles = find(root, 'Borrar')?.parentElement;
    if (controles) {
      const muestra = k > 6 ? pend.slice(0, 5) : pend;
      controles.className = 'carta-pendientes'; controles.setAttribute('role', 'list'); controles.setAttribute('aria-label', t.guardadaSub(k, pend[0]));
      controles.innerHTML = muestra.map(n => `<span role="listitem" class="carta-dia" aria-label="Día ${n}"><img alt="" src="${iconOf(n, dark()) ? 'assets/' + iconOf(n, dark()) : A(IMG.estrella)}"><b>${n}</b></span>`).join('') + (k > muestra.length ? `<span role="listitem" class="carta-dia carta-mas" aria-label="${k - muestra.length} días más"><b>${t.mas(k - muestra.length)}</b></span>` : '');
      controles.removeAttribute('style'); controles.style.cssText = 'position: absolute; left: 20px; right: 20px; top: 610px;';
      requestAnimationFrame(() => { if (tarjeta && controles.isConnected) controles.style.top = Math.round(tarjeta.offsetTop + tarjeta.offsetHeight + 56) + 'px'; });
    }
    const sig = pend[0];
    const listo = boton(root, '¡Listo, firmé!', sig ? t.seguir(sig) : t.cerrar);
    if (listo) { listo.querySelector('svg')?.remove(); on(root, listo, () => go('mapa', sig ? { dia: sig } : {}, 'down', { replace: true })); }
    const no = boton(root, 'Ahora no', t.ahoraNo); if (no) on(root, no, alMapa);
    cerrarX(root);
    if (reduced()) return;
    entra(tarjeta, { de: 'translateY(24px) scale(.97)', ms: 600, delay: 100 });
    const sello = root.querySelector('.carta-sello');
    sello?.animate([{ opacity: 0, transform: 'rotate(-14deg) scale(1.8)' }, { opacity: 1, transform: 'rotate(-14deg) scale(.92)', offset: .7 }, { opacity: 1, transform: 'rotate(-14deg) scale(1)' }], { duration: 520, delay: p.recien ? 450 : 200, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'backwards' });
    if (p.recien) setTimeout(() => { sonido('tic'); try { navigator.vibrate?.(12); } catch { /* */ } }, 800);
    $$(root, '.carta-dia').forEach((d, i) => entra(d, { de: 'translateY(10px) scale(.9)', ms: 420, delay: 500 + i * 60 }));
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
    const t = tx();
    const titulo = textEl(root, /^¡Mira, Lucía!$/), sub = textEl(root, /^Jesús ya nació en Belén$/);
    const todo = completa();
    if (titulo) { titulo.textContent = todo ? t.logro(S.nombre) : t.momento(S.nombre); caber(titulo); }
    if (sub) sub.textContent = todo ? t.logroSub(vistos()) : t.momentoSub(vistos());
    const teo = imgAlt(root, /^Teodoro de espaldas/), pesebre = imgAlt(root, /^El pesebre/);
    if (teo) teo.alt = t.altCamina; // no dice adónde va la carta hasta la revelación
    const b = boton(root, '¡Vamos a verlo!', t.leer);
    const svg = b?.querySelector('svg'); if (svg) svg.innerHTML = '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>';
    if (b) on(root, b, () => go('carta', { nueva: true }, 'fade', { replace: true }));
    cerrarX(root);
    const revelar = () => {
      if (!root.isConnected) return;
      if (teo) teo.alt = t.altEntrega;
      if (titulo) { titulo.textContent = t.era; caber(titulo); titulo.animate?.([{ opacity: 0, transform: 'scale(.85)' }, { opacity: 1, transform: 'scale(1.06)', offset: .6 }, { opacity: 1, transform: 'none' }], { duration: 620, easing: 'cubic-bezier(.34,1.56,.64,1)' }); }
      if (sub) sub.textContent = t.eraSub;
      if (b) { b.style.visibility = ''; entra(b, { delay: 250 }); }
      if (!reduced()) { confetti(layer, 195, 300, 60); setTimeout(() => layer.isConnected && confetti(layer, 120, 360, 30), 160); setTimeout(() => layer.isConnected && confetti(layer, 270, 360, 30), 280); }
      sonido('llena'); try { navigator.vibrate?.([20, 40, 30]); } catch { /* */ }
    };
    sparkles(root);
    if (reduced() || !teo) { revelar(); return; }
    if (b) b.style.visibility = 'hidden';
    goldRain(layer); sonido('acierto');
    entra(titulo, { t: '', de: 'translateY(14px) scale(.96)', ms: 560, delay: 80 });
    entra(sub, { delay: 260 });
    // provisional mientras llega el JSON: Teodoro camina al pesebre, se inclina y la carta queda a los pies del Niño Jesús
    const anim = teo.animate([
      { transform: 'translate(0, 0) scale(1)', offset: 0 },
      { transform: 'translate(10px, -10px) scale(.97) rotate(1.5deg)', offset: .3 },
      { transform: 'translate(22px, -20px) scale(.94) rotate(-1.5deg)', offset: .6 },
      { transform: 'translate(26px, -22px) scale(.93) rotate(7deg)', offset: .82 },
      { transform: 'translate(26px, -22px) scale(.93) rotate(0deg)', offset: 1 },
    ], { duration: 2600, delay: 700, easing: 'cubic-bezier(.45,0,.25,1)', fill: 'forwards' });
    pesebre?.animate([{ filter: 'drop-shadow(0 0 0 rgba(255,226,140,0))' }, { filter: 'drop-shadow(0 0 26px rgba(255,226,140,.95))' }, { filter: 'drop-shadow(0 0 12px rgba(255,226,140,.6))' }], { duration: 1400, delay: 2900, fill: 'forwards' });
    anim.onfinish = () => setTimeout(revelar, 250);
    if (ENTREGA) nota('Animación', 'Aquí va la entrega de la carta (JSON)');
  },
  dismiss: () => alMapa(),
});

// ---------- 2 · La carta (B3) ----------
register('carta', {
  file: () => dark() ? 'CARTA-4-oscuro' : 'CARTA-4',
  noScroll: true,
  mount(root, p, layer) {
    const c = C(), t = tx();
    if (!c.abierta) { c.abierta = true; save(); }
    vestirCarta(root, { px: 28, fs: 15.5, num: 19, gap: 4, firmaAlto: 38 });
    const papel = [...root.children].find(el => /rotate\(-1deg\)/.test(el.style.transform || ''));
    const imp = boton(root, 'Imprimir', t.imprimir), com = boton(root, 'Compartir', t.compartir), no = boton(root, 'Ahora no', t.ahoraNo);
    if (imp) on(root, imp, () => go('cartaImprimir', {}, 'push'));
    if (com) on(root, com, () => go('cartaCompartir', {}, 'push'));
    if (no) on(root, no, alMapa);
    cerrarX(root);
    if (!p.nueva || reduced()) return;
    papel?.animate([{ opacity: 0, transform: 'rotate(-1deg) translateY(40px) scale(.92)' }, { opacity: 1, transform: 'rotate(-1deg)' }], { duration: 720, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'backwards' });
    $$(root, '.carta-fila').forEach((f, i) => entra(f, { de: 'translateX(-12px)', ms: 420, delay: 500 + i * 110 }));
    setTimeout(() => { if (!layer.isConnected) return; sparkles(root); confetti(layer, 195, 220, 40); }, 1100);
  },
  dismiss: () => alMapa(),
});

// ---------- Compartir (historia 9:16) e imprimir (A4) ----------
let h2i = null;
const libreria = () => h2i ??= new Promise((ok, mal) => {
  if (window.htmlToImage) return ok(window.htmlToImage);
  const s = document.createElement('script'); s.src = 'vendor/html-to-image.min.js'; s.onload = () => ok(window.htmlToImage); s.onerror = mal; document.head.append(s);
});
async function pieza(file) {
  const html = await (await fetch(`screens/${file}.html`)).text();
  const box = document.createElement('div'); box.innerHTML = html;
  const el = box.firstElementChild; vestirCarta(el, { px: 22, fs: 12.5, num: 15, gap: 3, firmaAlto: 26 });
  return el;
}
async function aPng(el) {
  const lib = await libreria();
  let fontEmbedCSS; try { fontEmbedCSS = await (await import('./dev-motor.js')).fuentesDe(el); } catch { /* sin fuentes incrustadas */ }
  const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:-10000px;top:0;pointer-events:none'; host.append(el); document.body.append(host);
  try { await document.fonts.ready; return await lib.toPng(el, { pixelRatio: 3, fontEmbedCSS, cacheBust: false, style: { transform: 'none', boxShadow: 'none', borderRadius: '0' } }); } finally { host.remove(); }
}
function vista(root, layer, { titulo, file, ancho, alto, escala, botones }) {
  const L = root;
  const h = document.createElement('div'); h.className = 'carta-vista-t'; h.textContent = titulo; L.append(h);
  const marco = document.createElement('div'); marco.className = 'carta-vista-marco'; marco.style.cssText = `width:${ancho * escala}px;height:${alto * escala}px`; L.append(marco);
  pieza(file).then(el => { const c = el.cloneNode(true); c.style.transform = `scale(${escala})`; c.style.transformOrigin = '0 0'; marco.append(c); entra(marco, { de: 'translateY(20px) scale(.97)', ms: 560 }); });
  const fila = document.createElement('div'); fila.className = 'carta-vista-botones'; L.append(fila);
  botones.forEach(([txt, prim, fn, ico]) => { const b = document.createElement('button'); b.type = 'button'; b.className = prim ? 'carta-btn prim' : 'carta-btn'; b.innerHTML = (ico || '') + `<span>${esc(txt)}</span>`; fila.append(b); on(root, b, fn); });
}
const ICO = {
  compartir: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
  guardar: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></svg>',
  imprimir: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/></svg>',
};
const bajar = (url, nombreArchivo) => { const a = document.createElement('a'); a.href = url; a.download = nombreArchivo; document.body.append(a); a.click(); a.remove(); };
register('cartaCompartir', {
  file: () => dark() ? 'CARTA-4-oscuro' : 'CARTA-4',
  noScroll: true,
  mount(root, p, layer) {
    const t = tx(), file = dark() ? 'CARTA-HIST-oscuro' : 'CARTA-HIST';
    limpiarBase(root);
    const archivo = `${t.archivo(S.nombre || 'Teodoro')}.png`;
    const compartir = async () => {
      try {
        const url = await aPng(await pieza(file));
        const blob = await (await fetch(url)).blob(), f = new File([blob], archivo, { type: 'image/png' });
        if (navigator.canShare?.({ files: [f] })) await navigator.share({ files: [f], title: t.shareTitulo, text: t.shareTxt(S.nombre, vistos(), completa()) });
        else { bajar(url, archivo); nota(...t.sinShare); }
      } catch (e) { if (e?.name !== 'AbortError') nota('Compartir', 'No se pudo armar la imagen'); }
    };
    const guardar = async () => { try { bajar(await aPng(await pieza(file)), archivo); } catch { nota('Guardar', 'No se pudo armar la imagen'); } };
    vista(root, layer, { titulo: t.compartirT, file, ancho: 390, alto: 693, escala: .78, botones: [[t.guardarImg, false, guardar, ICO.guardar], [t.compartirBtn, true, compartir, ICO.compartir]] });
  },
});
register('cartaImprimir', {
  file: () => dark() ? 'CARTA-4-oscuro' : 'CARTA-4',
  noScroll: true,
  mount(root, p, layer) {
    const t = tx(), file = dark() ? 'CARTA-A4-oscuro' : 'CARTA-A4';
    limpiarBase(root);
    const imprimir = async () => {
      const el = await pieza(file);
      const fr = document.createElement('iframe'); fr.style.cssText = 'position:fixed;width:0;height:0;border:0;left:-100px'; document.body.append(fr);
      const fuentes = [...document.querySelectorAll('link[rel=stylesheet]')].map(l => `<link rel="stylesheet" href="${l.href}">`).join('');
      fr.contentDocument.write(`<!doctype html><html><head><meta charset="utf-8"><base href="${location.href}">${fuentes}<style>@page{size:A4;margin:0}html,body{margin:0}body{width:210mm;height:297mm;overflow:hidden}.hoja{transform:scale(${(210 / 25.4 * 96 / 420).toFixed(4)});transform-origin:0 0;box-shadow:none!important}</style></head><body><div class="hoja">${el.outerHTML}</div></body></html>`);
      fr.contentDocument.close();
      await new Promise(r => setTimeout(r, 600)); try { await fr.contentDocument.fonts?.ready; } catch { /* */ }
      fr.contentWindow.focus(); fr.contentWindow.print(); setTimeout(() => fr.remove(), 2000);
    };
    const guardar = async () => { try { bajar(await aPng(await pieza(file)), `${t.archivo(S.nombre || 'Teodoro')} (A4).png`); } catch { nota('Guardar', 'No se pudo armar la imagen'); } };
    vista(root, layer, { titulo: t.imprimirT, file, ancho: 420, alto: 594, escala: .8, botones: [[t.guardarImg, false, guardar, ICO.guardar], [t.imprimirBtn, true, imprimir, ICO.imprimir]] });
  },
});
/** Las vistas de compartir e imprimir usan el fondo de la carta (rayos y cielo) sin la carta ni sus botones, con la X de cerrar → atrás. */
function limpiarBase(root) {
  const L = root;
  [...L.children].forEach(el => { const s = el.getAttribute('style') || ''; if (/rotate\(-1deg\)/.test(s) || el.tagName === 'A' && !/Cerrar/.test(el.getAttribute('aria-label') || '')) el.remove(); });
  const x = find(root, 'Cerrar'); if (x) { const trazo = x.querySelector('svg')?.getAttribute('stroke') || '#00516D'; x.setAttribute('aria-label', tx().volver); x.innerHTML = `<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${trazo}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>`; on(root, x, () => go('carta', {}, 'back', { replace: true })); }
}

// ---------- Panel: estados de prueba ----------
/** Deja la carta en un estado (recorridos del panel); si ya firmó y no hay trazo, una firma de muestra con su nombre. */
export function cartaDemo(estado = {}) {
  S.carta = { ...C(), ...estado };
  if (estado.vista && estado.firma === undefined && !S.carta.firma && estado.sinFirma !== true) S.carta.firma = firmaMuestra();
  save();
}
function firmaMuestra() {
  const cv = document.createElement('canvas'); cv.width = 720; cv.height = 240;
  const x = cv.getContext('2d'); x.fillStyle = '#1E8DA5'; x.font = '120px "Gloria Hallelujah", "Comic Sans MS", cursive'; x.textBaseline = 'middle';
  x.save(); x.translate(30, 130); x.rotate(-.06); x.fillText(S.nombre || 'Lucía', 0, 0); x.restore();
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
