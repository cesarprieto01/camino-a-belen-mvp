/* Firma con el dedo · «La carta de Teodoro» (Adviento, pantalla B2.5 «¡Ahora firma tú!»)
   Dibuja dentro de la caja punteada «Firma de …» del lienzo. Sin dependencias.

   Cómo se siente:
   · Responde en pointerdown: la tinta sale en el mismo frame del toque (un toque quieto deja un punto).
   · Seguimiento 1:1: cada pointermove pinta dentro de su handler, sin rAF ni temporizadores. Usa los
     eventos coalescidos para no perder curva y los predichos para acortar la distancia al dedo.
   · Tinta: cuadráticas por puntos medios; el grosor sigue a la velocidad (lento = grueso, rápido = fino),
     filtrado para que no tiemble. Con lápiz suma la presión.
   · Dos capas: «lienzo» guarda la tinta asentada (solo se le añade) y «vivo» rehace en cada evento el
     último tramo hasta el dedo, así nunca hay que esperar al siguiente punto para dibujar.
   · Borrar y deshacer cambian los datos al instante; la tinta que se va sale en una capa aparte que se
     desvanece, y se puede volver a firmar encima sin esperar a que termine.
   · prefers-reduced-motion: esas salidas son solo de opacidad, sin escala ni desenfoque. */

export const COLORES = [
  { nombre: 'azul marino', valor: '#06325A' },
  { nombre: 'azul agua', valor: '#1E8DA5' },
  { nombre: 'verde', valor: '#0A8445' },
  { nombre: 'amarillo', valor: '#E2B33C' },
  { nombre: 'naranja', valor: '#F0A04B' },
];

// Tinta, en px CSS. Referencia: el corazón del diseño tiene trazo de 4,4 px (2,4 en 24 → 44 px).
const TINTA = {
  fino: 3.2,       // a toda velocidad
  grueso: 6.4,     // muy despacio
  inicio: 5.4,     // al apoyar el dedo
  rapido: 1.6,     // px/ms desde los que ya es «fino»
  paso: 1.5,       // distancia mínima entre puntos guardados: quita el temblor del dedo
  prediccion: 6,   // lo máximo que se adelanta el trazo con los eventos predichos
};
const RADIO_PUNTO = 0.58;               // un toque sin moverse: punto un poco más gordo que el trazo
const SALIDA = 'cubic-bezier(.23,1,.32,1)';
const VUELTA = 6.283185307179586;
const quieto = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function normalizar(colores) {
  const lista = Array.isArray(colores) && colores.length ? colores : COLORES;
  return lista.map((c, i) => {
    const valor = typeof c === 'string' ? c : (c.valor || c.color || c.hex);
    const conocido = COLORES.find(k => k.valor.toLowerCase() === String(valor).toLowerCase());
    const nombre = (typeof c === 'object' && (c.nombre || c.name)) || (conocido ? conocido.nombre : String(i + 1));
    return { nombre, valor };
  });
}

function conAlfa(color, a) {
  const h = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color);
  if (!h) return `color-mix(in srgb, ${color} ${Math.round(a * 100)}%, transparent)`;
  const s = h[1].length === 3 ? h[1].replace(/./g, x => x + x) : h[1];
  const n = parseInt(s, 16);
  return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
}

/* ---------- Geometría del trazo ----------
   Puntos P0…Pn. Tramo 1: recta de P0 al medio de P0P1. Tramo i (2…n): cuadrática del medio de P(i-2)P(i-1)
   al medio de P(i-1)Pi con control en P(i-1). Cola: recta del último medio a Pn.
   Cada tramo i existe en cuanto se guarda Pi, por eso el lienzo se pinta al vuelo sin rehacer nada,
   y repintar desde los datos da exactamente los mismos píxeles. */
const medio = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, w: (a.w + b.w) / 2 });
const recta = (a, b, wa, wb) => [a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2, b.x, b.y, wa, wb];

function tramoN(p, i) {
  if (i === 1) { const m = medio(p[0], p[1]); return recta(p[0], m, p[0].w, m.w); }
  const a = medio(p[i - 2], p[i - 1]), b = medio(p[i - 1], p[i]);
  return [a.x, a.y, p[i - 1].x, p[i - 1].y, b.x, b.y, a.w, b.w];
}
function tramoCola(p) { const n = p.length - 1, m = medio(p[n - 1], p[n]); return recta(m, p[n], m.w, p[n].w); }
function tramos(p) { const s = []; for (let i = 1; i < p.length; i++) s.push(tramoN(p, i)); s.push(tramoCola(p)); return s; }

// Añade al path círculos a lo largo del tramo con el grosor de wa a wb (un solo fill por lote: bordes limpios).
function sellar(ctx, [ax, ay, cx, cy, bx, by, wa, wb], desdeA) {
  const largo = Math.hypot(cx - ax, cy - ay) + Math.hypot(bx - cx, by - cy);
  const n = Math.max(1, Math.ceil(largo / 0.75));
  for (let k = desdeA ? 0 : 1; k <= n; k++) {
    const t = k / n, u = 1 - t;
    const x = u * u * ax + 2 * u * t * cx + t * t * bx;
    const y = u * u * ay + 2 * u * t * cy + t * t * by;
    const r = (wa + (wb - wa) * t) / 2;
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, VUELTA);
  }
}
function sellarPunto(ctx, q) { const r = q.w * RADIO_PUNTO; ctx.moveTo(q.x + r, q.y); ctx.arc(q.x, q.y, r, 0, VUELTA); }

// Un relleno por tramo, igual que al pintar en vivo: repintar (deshacer, cambio de tamaño) da los mismos bordes.
function rellenar(ctx, s, desdeA) { ctx.beginPath(); sellar(ctx, s, desdeA); ctx.fill(); }
function pintarTrazo(ctx, t) {
  const p = t.puntos;
  ctx.fillStyle = t.color;
  if (p.length === 1) { ctx.beginPath(); sellarPunto(ctx, p[0]); ctx.fill(); return; }
  tramos(p).forEach((s, j) => rellenar(ctx, s, j === 0));
}

/* ---------- crearFirma ---------- */
export function crearFirma(caja, opciones = {}) {
  if (!caja) throw new Error('crearFirma: falta la caja');
  const colores = normalizar(opciones.colores);
  let indice = Math.min(colores.length - 1, Math.max(0, Number.isInteger(opciones.color) ? opciones.color : 1));
  const conPunta = opciones.punta !== false;
  const oyentes = new Set();
  const trazos = [];
  const fantasmas = new Set();
  let actual = null, activo = null, est = null;     // trazo en curso, pointerId que dibuja, estado del dedo
  let rect = null, k = 1, borde = { x: 0, y: 0 };   // medidas de la caja (k: px de layout por px de pantalla)
  let ancho = 0, alto = 0, r = 1, rx = 1, ry = 1;   // tamaño CSS del área y resolución de los lienzos

  // La caja
  const antes = {
    css: caja.getAttribute('style'),
    role: caja.getAttribute('role'),
    label: caja.getAttribute('aria-label'),
  };
  Object.assign(caja.style, { touchAction: 'none', userSelect: 'none', webkitUserSelect: 'none', webkitTouchCallout: 'none' });
  if (getComputedStyle(caja).position === 'static') caja.style.position = 'relative';
  caja.classList.add('firma-caja');
  caja.setAttribute('role', 'img');

  const radio = () => Math.max(0, (parseFloat(getComputedStyle(caja).borderTopLeftRadius) || 0) - caja.clientTop) + 'px';
  const capa = clase => {
    const c = document.createElement('canvas');
    c.className = clase;
    c.setAttribute('aria-hidden', 'true');
    Object.assign(c.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', pointerEvents: 'none', borderRadius: radio() });
    return c;
  };
  const lienzo = capa('firma-lienzo');   // tinta asentada
  const vivo = capa('firma-vivo');       // el tramo que va con el dedo
  const ctxL = lienzo.getContext('2d');
  const ctxV = vivo.getContext('2d');

  // La punta: halo de 30 px con la yema de 12 px, como el punto del diseño. Solo mientras se dibuja.
  const punta = document.createElement('div');
  const halo = document.createElement('div');
  const yema = document.createElement('span');
  punta.className = 'firma-punta';
  punta.setAttribute('aria-hidden', 'true');
  Object.assign(punta.style, { position: 'absolute', left: '0', top: '0', width: '30px', height: '30px', margin: '-15px 0 0 -15px', pointerEvents: 'none', willChange: 'transform' });
  Object.assign(halo.style, { width: '100%', height: '100%', borderRadius: '50%', display: 'grid', placeItems: 'center', opacity: '0' });
  Object.assign(yema.style, { width: '12px', height: '12px', borderRadius: '50%' });
  halo.appendChild(yema);
  punta.appendChild(halo);
  caja.append(lienzo, vivo, punta);

  /* ---------- Medidas ---------- */
  function medir() {
    rect = caja.getBoundingClientRect();
    k = rect.width > 0 ? caja.offsetWidth / rect.width : 1;
    borde = { x: caja.clientLeft, y: caja.clientTop };
    const w = caja.clientWidth, h = caja.clientHeight;
    const nr = Math.min(4, Math.max(1, (window.devicePixelRatio || 1) / k));
    if (w !== ancho || h !== alto || Math.abs(nr - r) > 0.01) {
      ancho = w; alto = h; r = nr;
      for (const c of [lienzo, vivo]) { c.width = Math.max(1, Math.round(ancho * r)); c.height = Math.max(1, Math.round(alto * r)); }
      rx = ancho ? lienzo.width / ancho : r;
      ry = alto ? lienzo.height / alto : r;
      redibujar();
      pintarVivo();
    }
  }
  const local = e => ({
    x: (e.clientX - rect.left) * k - borde.x,
    y: (e.clientY - rect.top) * k - borde.y,
    t: e.timeStamp,
    p: e.pointerType === 'pen' && e.pressure > 0 ? e.pressure : null,
  });
  const conPresion = (w, q) => (q.p == null ? w : w * (0.55 + 0.9 * q.p));

  function limpiar(ctx, c) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height); ctx.setTransform(rx, 0, 0, ry, 0, 0); }
  function redibujar() { limpiar(ctxL, lienzo); for (const t of trazos) pintarTrazo(ctxL, t); }

  // El último tramo (y el adelanto predicho) hasta el dedo; se rehace entero en cada evento.
  function pintarVivo() {
    limpiar(ctxV, vivo);
    if (!actual) return;
    const p = actual.puntos, n = p.length - 1, c = est.c, w = p[n].w;
    ctxV.fillStyle = actual.color;
    ctxV.beginPath();
    if (n === 0) sellarPunto(ctxV, p[0]);
    else sellar(ctxV, tramoCola(p), false);
    if (c !== p[n]) sellar(ctxV, recta(p[n], c, w, w), false);
    if (est.pred) sellar(ctxV, recta(c, est.pred, w, w * 0.9), false);
    ctxV.fill();
  }

  /* ---------- Punta ---------- */
  function colorPunta() { const c = colores[indice].valor; halo.style.background = conAlfa(c, 0.18); yema.style.background = c; }
  function moverPunta(q) { punta.style.transform = `translate3d(${q.x}px,${q.y}px,0)`; }
  function verPunta(ver) {
    const desde = getComputedStyle(halo).opacity;   // valor en pantalla: si se interrumpe, sigue desde ahí
    halo.getAnimations?.().forEach(a => a.cancel());
    halo.style.opacity = ver ? '1' : '0';
    if (!halo.animate) return;
    if (ver && !quieto()) halo.animate([{ opacity: desde, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 120, easing: SALIDA });
    else halo.animate([{ opacity: desde }, { opacity: ver ? 1 : 0 }], { duration: ver ? 100 : 160, easing: SALIDA });
  }

  /* ---------- Texto de ayuda dentro de la caja (si lo hay) ---------- */
  const opacidadOriginal = new WeakMap();
  function ayudas() {
    const a = opciones.ayuda ?? '[data-firma-ayuda], .firma-ayuda';
    return typeof a === 'string' ? [...caja.querySelectorAll(a)] : [].concat(a).filter(Boolean);
  }
  function ayuda(ver) {
    for (const el of ayudas()) {
      const desde = getComputedStyle(el).opacity;
      el.getAnimations?.().forEach(a => a.cancel());
      if (!opacidadOriginal.has(el)) opacidadOriginal.set(el, el.style.opacity);
      el.style.opacity = ver ? opacidadOriginal.get(el) : '0';
      const hasta = getComputedStyle(el).opacity;
      el.animate?.([{ opacity: desde }, { opacity: hasta }], { duration: ver ? 240 : 160, easing: SALIDA });
    }
  }

  /* ---------- Avisos ---------- */
  const nombre = opciones.nombre ? `Firma de ${opciones.nombre}` : 'Firma';
  function cambio() {
    const vacia = trazos.length === 0;
    caja.setAttribute('aria-label', `${nombre}: ${vacia ? 'vacía' : 'firmada'}`);
    if (typeof opciones.onCambio === 'function') opciones.onCambio(vacia);
    oyentes.forEach(fn => fn({ vacia, color: indice }));
  }

  /* ---------- Puntero ---------- */
  function alBajar(e) {
    if (activo !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;   // un dedo a la vez
    e.preventDefault();
    medir();
    try { caja.setPointerCapture(e.pointerId); } catch { /* puntero sintético */ }
    activo = e.pointerId;
    const q = local(e);
    q.w = conPresion(TINTA.inicio, q);
    const eraVacia = trazos.length === 0;
    actual = { color: colores[indice].valor, puntos: [q] };
    trazos.push(actual);
    est = { v: 0, w: q.w, c: q, pred: null };
    pintarVivo();                                     // el punto sale en este mismo frame
    if (conPunta) { moverPunta(q); verPunta(true); }
    if (eraVacia) {
      try { navigator.vibrate?.(8); } catch { /* sin vibración */ }
      ayuda(false);
      cambio();
    }
  }

  function agregar(q) {
    est.c = q;
    const p = actual.puntos, u = p[p.length - 1];
    const d = Math.hypot(q.x - u.x, q.y - u.y);
    if (d < TINTA.paso) return;
    const v = d / Math.max(1, q.t - u.t);
    est.v = est.v ? est.v * 0.6 + v * 0.4 : v;
    const meta = conPresion(TINTA.grueso - (TINTA.grueso - TINTA.fino) * suave(0.04, TINTA.rapido, est.v), q);
    est.w += (meta - est.w) * 0.35;
    q.w = est.w;
    p.push(q);
    ctxL.fillStyle = actual.color;
    rellenar(ctxL, tramoN(p, p.length - 1), p.length === 2);
  }

  function alMover(e) {
    if (e.pointerId !== activo) return;
    const juntos = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    for (const ev of (juntos.length ? juntos : [e])) agregar(local(ev));
    est.pred = null;
    const predichos = e.getPredictedEvents ? e.getPredictedEvents() : [];
    if (predichos.length) {
      const q = local(predichos[predichos.length - 1]);
      const dx = q.x - est.c.x, dy = q.y - est.c.y, d = Math.hypot(dx, dy);
      if (d > 0.5) { const f = Math.min(1, TINTA.prediccion / d); est.pred = { x: est.c.x + dx * f, y: est.c.y + dy * f }; }
    }
    pintarVivo();
    if (conPunta) moverPunta(est.c);
  }

  function soltar() {
    if (activo === null) return;
    try { if (caja.hasPointerCapture?.(activo)) caja.releasePointerCapture(activo); } catch { /* ya suelto */ }
    activo = null; actual = null; est = null;
    pintarVivo();
    if (conPunta) verPunta(false);
  }

  function terminar(e) {
    if (e.pointerId !== activo) return;
    if (e.type === 'pointerup') est.c = local(e);
    const p = actual.puntos, n = p.length - 1, c = est.c;
    let nuevo = false;
    if (c !== p[n] && Math.hypot(c.x - p[n].x, c.y - p[n].y) > 0.3) {
      c.w = est.v > 0.8 ? (est.w + TINTA.fino) / 2 : est.w;   // remate fino si se soltó deprisa
      p.push(c);
      nuevo = true;
    }
    ctxL.fillStyle = actual.color;
    if (p.length === 1) { ctxL.beginPath(); sellarPunto(ctxL, p[0]); ctxL.fill(); }
    else {
      if (nuevo) rellenar(ctxL, tramoN(p, p.length - 1), p.length === 2);
      rellenar(ctxL, tramoCola(p), false);
    }
    soltar();
    cambio();
  }

  const sinMenu = e => e.preventDefault();
  caja.addEventListener('pointerdown', alBajar);
  caja.addEventListener('pointermove', alMover);
  caja.addEventListener('pointerup', terminar);
  caja.addEventListener('pointercancel', terminar);
  caja.addEventListener('lostpointercapture', terminar);
  caja.addEventListener('touchmove', sinMenu, { passive: false });   // iOS viejo sin touch-action
  caja.addEventListener('contextmenu', sinMenu);                     // pulsación larga en Android
  window.addEventListener('resize', medir);
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => medir()) : null;
  ro?.observe(caja);

  /* ---------- Salidas: la tinta que se va se desvanece en su propia capa ---------- */
  function fantasma(dibujar) {
    const g = capa('firma-fantasma');
    g.width = lienzo.width; g.height = lienzo.height;
    const ctx = g.getContext('2d');
    ctx.setTransform(rx, 0, 0, ry, 0, 0);
    dibujar(ctx);
    const fin = () => { g.remove(); fantasmas.delete(g); };
    if (!g.animate) return;
    caja.insertBefore(g, punta);
    fantasmas.add(g);
    const q = quieto();
    const a = g.animate(q
      ? [{ opacity: 1 }, { opacity: 0 }]
      : [{ opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' }, { opacity: 0, transform: 'scale(.985)', filter: 'blur(2px)' }],
    { duration: q ? 140 : 220, easing: SALIDA, fill: 'forwards' });
    a.onfinish = fin; a.oncancel = fin;
  }

  function borrar() {
    if (!trazos.length) return;
    fantasma(ctx => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(lienzo, 0, 0); ctx.drawImage(vivo, 0, 0); });
    soltar();
    trazos.length = 0;
    limpiar(ctxL, lienzo);
    ayuda(true);
    cambio();
  }

  function deshacer() {
    if (!trazos.length) return;
    soltar();
    const t = trazos.pop();
    fantasma(ctx => pintarTrazo(ctx, t));
    redibujar();
    if (!trazos.length) ayuda(true);
    cambio();
  }

  function color(i) {
    if (i === undefined) return indice;
    const n = Math.min(colores.length - 1, Math.max(0, Math.trunc(Number(i)) || 0));
    if (n !== indice) { indice = n; colorPunta(); oyentes.forEach(fn => fn({ vacia: trazos.length === 0, color: indice })); }
    return indice;
  }

  /* ---------- Exportar ---------- */
  function limites(recorte, margen) {
    if (!recorte) return { x: 0, y: 0, w: ancho, h: alto };
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const t of trazos) {
      const f = t.puntos.length === 1 ? RADIO_PUNTO : 0.5;
      for (const q of t.puntos) {
        const h = q.w * f;
        x0 = Math.min(x0, q.x - h); y0 = Math.min(y0, q.y - h);
        x1 = Math.max(x1, q.x + h); y1 = Math.max(y1, q.y + h);
      }
    }
    x0 = Math.max(0, Math.floor(x0 - margen)); y0 = Math.max(0, Math.floor(y0 - margen));
    x1 = Math.min(ancho, Math.ceil(x1 + margen)); y1 = Math.min(alto, Math.ceil(y1 + margen));
    return x1 > x0 && y1 > y0 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
  }

  function png({ recorte = true, escala = 3, margen = 4 } = {}) {
    if (!trazos.length) return null;
    if (!ancho) medir();
    const b = limites(recorte, margen);
    if (!b) return null;
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(b.w * escala));
    c.height = Math.max(1, Math.round(b.h * escala));
    const ctx = c.getContext('2d');
    ctx.setTransform(escala, 0, 0, escala, -b.x * escala, -b.y * escala);
    for (const t of trazos) pintarTrazo(ctx, t);
    return c.toDataURL('image/png');
  }

  // Los mismos tramos como trazos SVG; los tramos seguidos de grosor parecido van en un solo <path>.
  function svg({ recorte = true, margen = 4 } = {}) {
    if (!trazos.length) return null;
    if (!ancho) medir();
    const b = limites(recorte, margen);
    if (!b) return null;
    const n = v => Math.round(v * 100) / 100;
    let cuerpo = '';
    for (const t of trazos) {
      const p = t.puntos;
      if (p.length === 1) { cuerpo += `<circle cx="${n(p[0].x)}" cy="${n(p[0].y)}" r="${n(p[0].w * RADIO_PUNTO)}" fill="${t.color}"/>`; continue; }
      let d = '', suma = 0, cuantos = 0, ref = null;
      const cerrar = () => { if (d) cuerpo += `<path d="${d}" stroke="${t.color}" stroke-width="${n(suma / cuantos)}"/>`; d = ''; suma = 0; cuantos = 0; };
      for (const [ax, ay, cx, cy, bx, by, wa, wb] of tramos(p)) {
        const w = (wa + wb) / 2;
        if (ref === null || Math.abs(w - ref) > 0.3) { cerrar(); ref = w; d = `M${n(ax)} ${n(ay)}`; }
        d += `Q${n(cx)} ${n(cy)} ${n(bx)} ${n(by)}`;
        suma += w; cuantos++;
      }
      cerrar();
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.x} ${b.y} ${b.w} ${b.h}" width="${b.w}" height="${b.h}">`
      + `<g fill="none" stroke-linecap="round" stroke-linejoin="round">${cuerpo}</g></svg>`;
  }

  function destruir() {
    soltar();
    caja.removeEventListener('pointerdown', alBajar);
    caja.removeEventListener('pointermove', alMover);
    caja.removeEventListener('pointerup', terminar);
    caja.removeEventListener('pointercancel', terminar);
    caja.removeEventListener('lostpointercapture', terminar);
    caja.removeEventListener('touchmove', sinMenu);
    caja.removeEventListener('contextmenu', sinMenu);
    window.removeEventListener('resize', medir);
    ro?.disconnect();
    for (const el of ayudas()) { el.getAnimations?.().forEach(a => a.cancel()); if (opacidadOriginal.has(el)) el.style.opacity = opacidadOriginal.get(el); }
    [lienzo, vivo, punta, ...fantasmas].forEach(el => el.remove());
    fantasmas.clear();
    oyentes.clear();
    caja.classList.remove('firma-caja');
    if (antes.css === null) caja.removeAttribute('style'); else caja.setAttribute('style', antes.css);
    if (antes.role === null) caja.removeAttribute('role'); else caja.setAttribute('role', antes.role);
    if (antes.label === null) caja.removeAttribute('aria-label'); else caja.setAttribute('aria-label', antes.label);
  }

  colorPunta();
  medir();
  caja.setAttribute('aria-label', `${nombre}: vacía`);

  return {
    colores,
    oscuro: typeof opciones.oscuro === 'boolean' ? opciones.oscuro : undefined,
    vacia: () => trazos.length === 0,
    borrar,
    deshacer,
    color,
    png,
    svg,
    escuchar(fn) { oyentes.add(fn); return () => oyentes.delete(fn); },
    destruir,
  };
}

/* ---------- Controles: los 5 círculos de color y «Borrar», como el diseño ---------- */
const ICONO_BORRAR = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4l4 4-10 10H6l-2-2z"/><path d="M13 7l4 4"/><path d="M10 20h10"/></svg>';

export function pintarControles(contenedor, f, colores) {
  const lista = normalizar(colores || f.colores);
  const raiz = document.createElement('div');
  raiz.className = 'firma-controles';
  if (f.oscuro === true) raiz.classList.add('firma-oscuro');
  if (f.oscuro === false) raiz.classList.add('firma-claro');

  const grupo = document.createElement('div');
  grupo.className = 'firma-colores';
  grupo.setAttribute('role', 'group');
  grupo.setAttribute('aria-label', 'Color de la tinta');
  const botones = lista.map((c, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'firma-color';
    b.style.setProperty('--firma-c', c.valor);
    b.setAttribute('aria-label', `Color ${c.nombre}`);
    b.addEventListener('click', () => f.color(i));
    grupo.appendChild(b);
    return b;
  });

  const borrar = document.createElement('button');
  borrar.type = 'button';
  borrar.className = 'firma-borrar';
  borrar.innerHTML = `${ICONO_BORRAR}<span>Borrar</span>`;
  borrar.addEventListener('click', () => f.borrar());

  raiz.append(grupo, borrar);
  contenedor.appendChild(raiz);

  const sincronizar = () => {
    const elegido = f.color();
    botones.forEach((b, i) => b.setAttribute('aria-pressed', String(i === elegido)));
    borrar.disabled = f.vacia();
  };
  const quitar = f.escuchar(sincronizar);
  sincronizar();

  return { raiz, actualizar: sincronizar, destruir() { quitar(); raiz.remove(); } };
}
