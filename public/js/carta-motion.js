// Coreografía de movimiento y sonido de «La carta de Teodoro» (carta.js la conecta a sus pantallas).
// Reglas: solo transform (translate/scale/rotate sueltos) y opacidad con Web Animations; resortes al estilo de Apple
// (amortiguación + respuesta); todo sale del valor que está en pantalla, un toque lleva al estado final sin saltos, y si la
// pantalla se desmonta se cancela todo. Sonidos solo de musica.js; la vibración, solo en los golpes con causa.
// Teodoro reacciona solo con su voz (eso lo pone carta.js): aquí no hay globos ni textos de reacción.
import { confetti, reduced, dark } from './core.js';
import { sonido, motivo } from './musica.js';
import { goldRain } from './flow.js';

// ---------- Resortes ----------
const LINEAR = (() => { try { return CSS.supports('animation-timing-function', 'linear(0, 1)'); } catch { return false; } })();
const memo = new Map();
/** Respuesta de un resorte que sale de 0 y llega a 1 (z = amortiguación, w = 2π / respuesta). */
function paso(z, w) {
  if (z < 1) { const wd = w * Math.sqrt(1 - z * z); return t => 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t)); }
  if (z === 1) return t => 1 - Math.exp(-w * t) * (1 + w * t);
  const s = w * Math.sqrt(z * z - 1), a = -z * w + s, b = -z * w - s;
  return t => 1 - (b * Math.exp(a * t) - a * Math.exp(b * t)) / (b - a);
}
/** Un empujón: sale de 0, sube a 1 (su pico) y vuelve a 0 con resorte. Para un pop, un latido o un golpe. */
function golpecito(z, w) {
  const f = z < 1 ? (wd => t => Math.exp(-z * w * t) * Math.sin(wd * t))(w * Math.sqrt(1 - z * z)) : t => t * Math.exp(-w * t);
  let pico = 0; for (let t = 0; t < 2; t += .001) pico = Math.max(pico, f(t));
  return t => f(t) / pico;
}
function curva(clave, f, fin, cola) {
  if (memo.has(clave)) return memo.get(clave);
  let ultimo = 0; for (let t = 0; t <= 4; t += .002) if (Math.abs(fin - f(t)) > cola) ultimo = t;
  const dur = Math.max(.12, ultimo + .004);
  let easing;
  if (LINEAR) {
    const n = Math.min(80, Math.max(16, Math.round(dur / .014))), p = [];
    for (let i = 0; i <= n; i++) p.push(i === n ? fin : +f(dur * i / n).toFixed(4));
    easing = `linear(${p.join(', ')})`;
  } else easing = fin === 0 ? 'cubic-bezier(.3,1.6,.5,1)' : clave.startsWith('m1|') ? 'cubic-bezier(.2,.9,.25,1)' : 'cubic-bezier(.34,1.45,.64,1)';
  const r = { easing, duration: Math.round(dur * 1000) };
  memo.set(clave, r); return r;
}
/** { easing, duration } de un resorte: amortiguación 1 = sin rebote; ~.8 = un rebote leve (solo donde hay impulso). */
export function muelle({ amortiguacion = 1, respuesta = .4 } = {}) {
  const z = Math.max(.05, amortiguacion), r = Math.max(.05, respuesta);
  return curva(`m${z}|${r}`, paso(z, 2 * Math.PI / r), 1, .0015);
}
/** El easing linear(…) que aproxima ese resorte (para Web Animations; su duración sale de muelle()). */
export const resorte = o => muelle(o).easing;
/** { easing, duration } de un empujón con resorte: el valor final de los keyframes es el PICO y la animación vuelve al inicial. */
export function impulso({ amortiguacion = .5, respuesta = .32 } = {}) {
  const z = Math.max(.05, amortiguacion), r = Math.max(.05, respuesta);
  return curva(`i${z}|${r}`, golpecito(z, 2 * Math.PI / r), 0, .003);
}

/** Keyframes y opciones de un empujón en `prop` (de reposo al pico y de vuelta). Sin linear(): tres keyframes con curvas. */
function empuje(prop, reposo, pico, r) {
  if (LINEAR) return { kf: [{ [prop]: reposo }, { [prop]: pico }], o: { ...impulso(r), final: { [prop]: reposo } } };
  const { duration } = impulso(r);
  return { kf: [{ [prop]: reposo, easing: 'cubic-bezier(.2,.8,.3,1)' }, { [prop]: pico, offset: .28, easing: 'cubic-bezier(.4,0,.3,1)' }, { [prop]: reposo }], o: { duration: Math.round(duration * .7), final: { [prop]: reposo } } };
}

// ---------- Escena: un reloj, las animaciones vivas y las señales (sonidos, vibración) en el mismo cuadro ----------
const limpio = kf => { const { offset, easing, composite, ...v } = kf; return v; };
function escena(root) {
  const T0 = performance.now(), vivas = new Set(), tareas = new Set(), cues = [], limpiezas = [];
  let raf = 0, cerrada = false, enCuadro = null, resolver;
  const terminado = new Promise(r => { resolver = r; });
  const latir = () => { if (!raf && !cerrada) raf = requestAnimationFrame(tick); };
  const terminar = reg => {
    const { a, el } = reg;
    if (reg.alTerminar === 'fijar') { try { a.commitStyles(); } catch { for (const k in reg.final) el.style[k] = reg.final[k]; } a.cancel(); }
    else if (reg.alTerminar === 'soltar') a.cancel();
    reg.despues?.();
  };
  function tick(ts) {
    raf = 0;
    if (!root?.isConnected) { e.cerrar(); return; }
    enCuadro = ts - T0;
    while (cues.length && cues[0].at <= enCuadro) {
      const c = cues.shift();
      if (c.sonido && enCuadro - c.at > 250) continue; // llegó tarde (pestaña oculta): no se amontonan sonidos
      try { c.fn(); } catch (err) { console.warn('carta-motion', err); }
    }
    for (const t of [...tareas]) { let sigue = false; try { sigue = t.cuadro(enCuadro); } catch (err) { console.warn('carta-motion', err); } if (!sigue) tareas.delete(t); }
    enCuadro = null;
    if (cues.length || vivas.size || tareas.size) latir();
  }
  const e = {
    T0, terminado,
    get cerrada() { return cerrada; },
    /** Tiempo de la escena (ms). Dentro de un cuadro, el del cuadro: lo que se lanza ahí empieza junto. */
    t: () => enCuadro ?? performance.now() - T0,
    /** Anima con fill 'both' empezando en `en` (ms de la escena). alTerminar: soltar (vuelve a su estilo) · fijar (lo deja escrito) · mantener. */
    anima(el, kf, { en, alTerminar = 'soltar', final, efimera = false, diferible = false, despues, ...o } = {}) {
      if (!el || cerrada) return null;
      let a; try { a = el.animate(kf, { fill: 'both', easing: 'linear', ...o }); } catch (err) { console.warn('carta-motion', err); return null; }
      a.startTime = T0 + (en ?? e.t());
      const reg = { a, el, alTerminar, efimera, diferible, despues, final: efimera ? null : (final ?? limpio(kf[kf.length - 1])) };
      vivas.add(reg);
      a.finished.then(() => { if (vivas.delete(reg)) terminar(reg); }, () => vivas.delete(reg));
      latir();
      return a;
    },
    /** Algo que pasa en un cuadro exacto (sonido, vibración, confeti, cambio de texto). clave: sobrevive a un toque. */
    en(ms, fn, { clave = false, sonido: s = false } = {}) { if (cerrada) return; cues.push({ at: ms, fn, clave, sonido: s }); cues.sort((x, y) => x.at - y.at); latir(); },
    tarea(t) { if (!cerrada) { tareas.add(t); latir(); } return t; },
    /** Un toque: se olvida lo que aún no pasó (menos lo clave) y todo lo que se mueve va a su destino con un resorte corto. */
    apurar(respuesta = .34) {
      for (let i = cues.length - 1; i >= 0; i--) if (!cues[i].clave) cues.splice(i, 1);
      const m = muelle({ amortiguacion: 1, respuesta }), planes = [];
      for (const reg of vivas) {
        if (reg.diferible) continue;
        const cs = getComputedStyle(reg.el);
        if (reg.efimera) planes.push({ reg, desde: { opacity: cs.opacity } });
        else if (reg.final) { const desde = {}; for (const k in reg.final) desde[k] = cs[k]; planes.push({ reg, desde }); }
        else planes.push({ reg });
      }
      for (const { reg, desde } of planes) {
        vivas.delete(reg);
        if (reg.efimera) { reg.a.pause(); e.anima(reg.el, [desde, { opacity: 0 }], { duration: 160, easing: 'ease-out', efimera: true, despues: () => { reg.a.cancel(); reg.despues?.(); } }); continue; }
        if (!desde) { reg.a.finish(); terminar(reg); continue; }
        reg.a.cancel();
        e.anima(reg.el, [desde, reg.final], { ...m, final: reg.final, alTerminar: reg.alTerminar, despues: reg.despues });
      }
      for (const t of tareas) t.apurar?.();
      tareas.clear();
    },
    alCerrar(fn) { limpiezas.push(fn); },
    /** La escena terminó bien (no cancela nada de lo que siga moviéndose). */
    listo() { limpiezas.splice(0).forEach(f => f()); resolver(); },
    cerrar() {
      if (cerrada) return; cerrada = true; cancelAnimationFrame(raf); cues.length = 0;
      vivas.forEach(r => r.a.cancel()); vivas.clear(); tareas.forEach(t => t.cancelar?.()); tareas.clear();
      limpiezas.splice(0).forEach(f => f()); resolver();
    },
  };
  return e;
}
/** Controlador que devuelve cada coreografía: saltar() = como un toque; cancelar(); terminado (promesa). */
const control = (e, saltar) => ({ saltar, cancelar: () => e.cerrar(), terminado: e.terminado });
/** Un toque (o Enter / espacio) en cualquier parte salta al final. */
function tocarParaSaltar(e, root, saltar) {
  const toque = () => saltar();
  const tecla = ev => { if (ev.key === 'Enter' || ev.key === ' ') saltar(); };
  root.addEventListener('pointerdown', toque, { capture: true });
  document.addEventListener('keydown', tecla, { capture: true });
  e.alCerrar(() => { root.removeEventListener('pointerdown', toque, { capture: true }); document.removeEventListener('keydown', tecla, { capture: true }); });
}
const vibrar = p => { try { navigator.vibrate?.(p); } catch { /* sin vibración */ } };

// ---------- Geometría (px del lienzo de 390 × 844, sin la escala del teléfono) ----------
function rel(root, el) {
  const r = el.getBoundingClientRect(), rr = root.getBoundingClientRect(), k = rr.width / (root.offsetWidth || rr.width) || 1;
  return { x: (r.left - rr.left) / k, y: (r.top - rr.top) / k, w: r.width / k, h: r.height / k };
}
/** Lo que de verdad ocupa el dibujo de una imagen (object-fit: contain deja bandas). */
function dibujo(root, img) {
  const b = rel(root, img), nw = img.naturalWidth, nh = img.naturalHeight;
  if (!nw || !nh || getComputedStyle(img).objectFit !== 'contain') return b;
  const s = Math.min(b.w / nw, b.h / nh), w = nw * s, h = nh * s;
  return { x: b.x + (b.w - w) / 2, y: b.y + (b.h - h) / 2, w, h };
}
// puntos de las ilustraciones, como fracción de su dibujo (medidos sobre las imágenes)
const PESEBRE = { estrella: [.535, .08], nino: [.611, .6], ninoIzq: .43, luz: [.5, .6] };
const TEO_ESPALDAS = { mano: [.888, .45], oreja: .83 };
const TEO_FRENTE = { carta: [.274, .558] };
const CHISPA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#FFFFFF" d="M12 0c.9 6.6 4.8 10.6 12 12-7.2 1.4-11.1 5.4-12 12-.9-6.6-4.8-10.6-12-12C7.2 10.6 11.1 6.6 12 0Z"/></svg>';
const div = (cls, padre, antes = null, css = '') => { const d = document.createElement('div'); d.className = cls; d.setAttribute('aria-hidden', 'true'); if (css) d.style.cssText = css; padre.insertBefore(d, antes); return d; };

// entra desde `desde` (translate/scale/rotate) con un resorte y un fundido corto aparte
function aparecer(e, el, { en = 0, desde = {}, resorte: r = { amortiguacion: 1, respuesta: .5 }, fundido = 220 } = {}) {
  if (!el) return;
  const NEUTRO = { translate: '0px 0px', scale: '1', rotate: '0deg' }, hasta = {};
  for (const k in desde) hasta[k] = NEUTRO[k];
  if (Object.keys(desde).length) e.anima(el, [desde, hasta], { en, ...muelle(r) });
  e.anima(el, [{ opacity: 0 }, { opacity: 1 }], { en, duration: fundido, easing: 'cubic-bezier(.2,.7,.3,1)' });
}
/** Un latido: crece a `pico` y vuelve con resorte (el valor de reposo es 1). */
const latido = (e, el, en, pico = 1.045, r = { amortiguacion: .5, respuesta: .34 }) => { if (!el) return; const { kf, o } = empuje('scale', '1', String(pico), r); e.anima(el, kf, { en, ...o }); };
/** La firma se escribe sola: una máscara de borde suave barre de izquierda a derecha. */
function escribir(e, img, en, dur = 650) {
  if (!img) return;
  const st = img.style, mask = 'linear-gradient(90deg, #000 0%, #000 45%, transparent 55%, transparent 100%)';
  st.webkitMaskImage = st.maskImage = mask; st.webkitMaskSize = st.maskSize = '250% 100%'; st.webkitMaskRepeat = st.maskRepeat = 'no-repeat';
  const limpiar = () => { st.webkitMaskImage = st.maskImage = st.webkitMaskSize = st.maskSize = st.webkitMaskRepeat = st.maskRepeat = ''; };
  e.anima(img, [{ maskPosition: '100% 0%', webkitMaskPosition: '100% 0%' }, { maskPosition: '0% 0%', webkitMaskPosition: '0% 0%' }],
    { en, duration: dur, easing: 'cubic-bezier(.42,.08,.38,1)', despues: limpiar });
}

// ---------- 1 · La carta secreta ----------
/** Teodoro sube con la carta sellada y se asienta; la carta brilla y el botón «Firmar la carta» late: de la carta al botón. */
export function entradaSecreta({ root, layer, titulo, teo, boton, primera = false } = {}) {
  const e = escena(root);
  if (!root) return control(e, () => {});
  if (reduced()) { [titulo, teo, boton].forEach(el => aparecer(e, el, { fundido: 200 })); e.listo(); return control(e, () => {}); }
  const T = teo ? dibujo(root, teo) : null; // antes de animar: sin transformaciones
  aparecer(e, titulo, { en: 80, desde: { translate: '0px 14px' } });
  if (teo) {
    teo.style.transformOrigin = '50% 100%';
    // sube, se pasa un poquito y baja a su sitio; al tocar el suelo se aplasta apenas y rebota
    e.anima(teo, [{ translate: '0px 46px', scale: '.94', easing: 'cubic-bezier(.2,.75,.35,1)' }, { translate: '0px -7px', scale: '1', offset: .56, easing: 'cubic-bezier(.45,0,.55,1)' }, { translate: '0px 0px', scale: '1' }], { en: 220, duration: 640 });
    e.anima(teo, [{ opacity: 0 }, { opacity: 1 }], { en: 220, duration: 240, easing: 'ease-out' });
    { const { kf, o } = empuje('transform', 'scale(1, 1)', 'scale(1.025, .965)', { amortiguacion: .55, respuesta: .36 }); e.anima(teo, kf, { en: 820, ...o, final: { transform: 'none' } }); }
    e.en(1300, () => teo.classList.add('a-bob')); // el vaivén de siempre, ya quieto
  }
  if (primera) e.en(500, () => layer?.isConnected && goldRain(layer));
  aparecer(e, boton, { en: 700, desde: { translate: '0px 18px' } });
  // el guiño: un destello sobre la carta y, enseguida, el botón late y la pluma se mece
  if (T) {
    const ch = div('cm-chispa', root, null, `left: ${T.x + T.w * TEO_FRENTE.carta[0]}px; top: ${T.y + T.h * TEO_FRENTE.carta[1]}px`); ch.innerHTML = CHISPA;
    e.anima(ch, [{ opacity: 0, scale: '.2', rotate: '-30deg' }, { opacity: 1, scale: '1.05', rotate: '15deg', offset: .45 }, { opacity: 0, scale: '.4', rotate: '60deg' }], { en: 1200, duration: 720, easing: 'cubic-bezier(.3,.6,.4,1)', efimera: true, despues: () => ch.remove() });
  }
  if (boton) {
    latido(e, boton, 1420);
    const pluma = boton.querySelector('svg');
    if (pluma) { pluma.style.transformOrigin = '15% 85%'; const { kf, o } = empuje('rotate', '0deg', '-16deg', { amortiguacion: .4, respuesta: .32 }); e.anima(pluma, kf, { en: 1420, ...o }); }
  }
  e.en(2200, () => e.listo(), { clave: true });
  const saltar = () => { if (!e.cerrada) { e.apurar(); teo?.classList.add('a-bob'); e.listo(); } };
  tocarParaSaltar(e, root, saltar);
  return control(e, saltar);
}

// ---------- 1 · El botón de la firma ----------
const estadoBoton = new WeakMap();
/** Apagado ↔ encendido. Al encenderse (la firma dejó de estar vacía) da un pop corto; al apagarse, solo baja. Pone aria-disabled y bloquea el toque. */
export function botonListo(boton, listo) {
  if (!boton) return;
  listo = !!listo;
  boton.setAttribute('aria-disabled', String(!listo)); boton.style.pointerEvents = listo ? '' : 'none';
  const antes = estadoBoton.get(boton); if (antes === listo) return;
  estadoBoton.set(boton, listo);
  const op = getComputedStyle(boton).opacity;
  boton.style.opacity = listo ? '1' : '.5';
  if (antes === undefined) return; // el primer estado se pinta sin animar
  boton.animate([{ opacity: op }, { opacity: listo ? 1 : .5 }], { duration: listo ? 140 : 180, easing: 'ease-out' });
  if (listo && !reduced()) { const { kf, o: { final, ...o } } = empuje('scale', '1', '1.05', { amortiguacion: .45, respuesta: .3 }); boton.animate(kf, o); }
}

// ---------- 1 · ¡Carta firmada! ----------
/** La carta entra, la firma se escribe sola, el sello cae y se aplasta (en su impacto: «sello» + vibración) y luego el rótulo y los días. */
export function selloCarta({ root, layer, tarjeta, sello, firma, kicker, dias = [], recien = false } = {}) {
  const e = escena(root); dias = [...(dias || [])];
  if (!root) return control(e, () => {});
  if (reduced()) { [tarjeta, (kicker || dias[0])?.closest('.carta-panel') || kicker, ...dias].forEach(el => aparecer(e, el, { fundido: 200 })); if (recien) { sonido('sello'); vibrar(14); } e.listo(); return control(e, () => {}); }
  aparecer(e, tarjeta, { en: 40, desde: { translate: '0px 26px', scale: '.97' }, fundido: 260 });
  let golpe = 0, golpeo = false;
  if (recien) {
    escribir(e, firma, 330, 650);
    golpe = 1040 + Math.round(560 * .58); // el cuadro del impacto
    if (sello) {
      // cae acelerando (estirado, girando), se aplasta al tocar el papel y rebota hasta quedar quieto
      e.anima(sello, [
        { translate: '0px -54px', scale: '1.5', rotate: '12deg', easing: 'cubic-bezier(.55,0,.9,.45)' },
        { translate: '0px 0px', scale: '1.1 .88', rotate: '0deg', offset: .58, easing: 'cubic-bezier(.2,.8,.3,1)' },
        { translate: '0px 0px', scale: '.97 1.03', rotate: '0deg', offset: .8, easing: 'cubic-bezier(.4,0,.4,1)' },
        { translate: '0px 0px', scale: '1', rotate: '0deg' },
      ], { en: 1040, duration: 560 });
      e.anima(sello, [{ opacity: 0 }, { opacity: 1 }], { en: 1040, duration: 150, easing: 'ease-out' });
    }
    const impacto = () => {
      if (golpeo) return; golpeo = true;
      sonido('sello'); vibrar(14);
      if (tarjeta) { const { kf, o } = empuje('translate', '0px 0px', '0px 3px', { amortiguacion: .55, respuesta: .3 }); e.anima(tarjeta, kf, o); }
      if (sello?.parentElement) {
        const cs = getComputedStyle(sello);
        const onda = div('cm-onda', sello.parentElement, sello, `right: ${cs.right}; top: ${cs.top}; width: ${cs.width}; height: ${cs.height}`);
        e.anima(onda, [{ opacity: .9, scale: '.85' }, { opacity: 0, scale: '1.9' }], { duration: 560, easing: 'cubic-bezier(.2,.7,.3,1)', efimera: true, despues: () => onda.remove() });
      }
    };
    e.en(golpe - 16, impacto, { sonido: true }); // un cuadro antes: el audio tarda un poco en salir
  } else if (sello) {
    aparecer(e, sello, { en: 150, desde: { scale: '1.12' }, resorte: { amortiguacion: 1, respuesta: .35 } });
  }
  const t0 = recien ? golpe + 220 : 200;
  // si los días viven en un panel (de vidrio), el panel entra con ellos: nunca se ve vacío esperando
  const panel = (kicker || dias[0])?.closest('.carta-panel');
  if (panel) aparecer(e, panel, { en: t0 - 60, desde: { translate: '0px 10px', scale: '.98' }, resorte: { amortiguacion: 1, respuesta: .45 }, fundido: 240 });
  aparecer(e, kicker, { en: t0, desde: { translate: '0px 8px' }, resorte: { amortiguacion: 1, respuesta: .45 } });
  dias.forEach((d, i) => aparecer(e, d, { en: t0 + 60 + i * 40, desde: { translate: '0px 12px', scale: '.86' }, resorte: { amortiguacion: .75, respuesta: .42 }, fundido: 180 }));
  e.en(t0 + 60 + dias.length * 40 + 500, () => e.listo(), { clave: true });
  const saltar = () => {
    if (e.cerrada) return;
    const falta = recien && !golpeo && sello;
    e.apurar();
    if (falta) e.en(e.t() + 120, () => { if (!golpeo) { golpeo = true; sonido('sello'); vibrar(14); } }, { clave: true }); // tocar también sella
    e.en(e.t() + 500, () => e.listo(), { clave: true });
  };
  tocarParaSaltar(e, root, saltar);
  return control(e, saltar);
}

// ---------- 2 · La sorpresa: Teodoro entrega la carta al Niño Jesús ----------
// (a) 0–0,9 s «¡Lo lograste!» + confeti + motivo largo · (b) 0,9–2,7 s camina con un «paso» en cada pisada · (c) 2,5–3,5 s la luz del
// pesebre crece, la estrella titila y una lucecita viaja de su mano al Niño · (d) 3,65 s destello, «¡La carta era para Jesús!», confeti,
// «llena» y vibración en el mismo cuadro · (e) 4,07 s sube «Leer la carta». Un toque salta a (d) desde donde esté todo.
const T_PASOS = 900, DUR_PASOS = 1500, N_PASOS = 4, ASIENTA = 320;
/** Hacia dónde camina: al fondo (sube y se achica) hasta el borde del pesebre, con su oreja siempre a la izquierda del Niño. */
function destinoTeo(T, P) {
  const s1 = .86, cx = T.x + T.w / 2, oreja = T.x + T.w * TEO_ESPALDAS.oreja, nino = P.x + P.w * PESEBRE.ninoIzq;
  const dx = Math.max(0, Math.min(nino - 6 - (cx + (oreja - cx) * s1), T.w * .12)), dy = -T.h * .13;
  const piso = T.y + T.h, mx = T.x + T.w * TEO_ESPALDAS.mano[0], my = T.y + T.h * TEO_ESPALDAS.mano[1];
  return { s1, dx, dy, mano: { x: cx + (mx - cx) * s1 + dx, y: piso + (my - piso) * s1 + dy } };
}
/** Los cuadros del caminar: avance suave, un saltito y un vaivén por pisada; al parar, se asienta. */
function caminar({ dx, dy, s1 }) {
  const total = DUR_PASOS + ASIENTA, asienta = golpecito(.5, 2 * Math.PI / .3), kf = [], M = Math.ceil(total / 25);
  for (let i = 0; i <= M; i++) {
    const t = Math.min(i * 25, total);
    let x = dx, y = dy, r = 0, sx = s1, sy = s1;
    if (t <= DUR_PASOS) {
      const u = t / DUR_PASOS, p = .5 - .5 * Math.cos(Math.PI * u), f = u * N_PASOS, s = 1 + (s1 - 1) * p;
      x = dx * p; y = dy * p - Math.sin(Math.PI * (f % 1)) * 5 * s; r = 1.8 * Math.sin(Math.PI * f); sx = sy = s;
    } else { const q = asienta((t - DUR_PASOS) / 1000); sx = s1 * (1 + .025 * q); sy = s1 * (1 - .035 * q); }
    kf.push({ offset: t / total, translate: `${x.toFixed(2)}px ${y.toFixed(2)}px`, rotate: `${r.toFixed(2)}deg`, scale: `${sx.toFixed(4)} ${sy.toFixed(4)}` });
    if (t === total) break;
  }
  return { kf, total };
}
/**
 * EL MOMENTO GRANDE. textos: { era, eraSub, altEntrega }. onRevelar({ titulo, sub }) se llama en (d) justo después de cambiar
 * los textos y antes de animarlos (ahí se puede reajustar el título). animacionEntrega (opcional): ({ teo, pesebre, root, layer })
 * → Promise | Animation | { finished, saltar() }; si viene, reemplaza el caminar y la lucecita (el resto sigue igual).
 */
export function coreografiaSorpresa({ root, layer, teo, pesebre, titulo, sub, boton, textos = {}, onRevelar, animacionEntrega, puntos } = {}) {
  const e = escena(root);
  if (!root) return control(e, () => {});
  const P = pesebre ? dibujo(root, pesebre) : null, T = teo ? dibujo(root, teo) : null;
  const dest = T && P ? destinoTeo(T, P) : null;
  // puntos (opcional): el pesebre viene en la animación de la entrega { nino, estrella, halo: { r, antes } } en vez de una imagen
  const nino = puntos?.nino ?? (P ? { x: P.x + P.w * PESEBRE.nino[0], y: P.y + P.h * PESEBRE.nino[1] } : { x: 220, y: 430 });
  // la luz del pesebre (detrás de él) y el brillo de su estrella (encima): su estilo base es el estado final
  const halo = P ? div('cm-halo', pesebre.parentElement, pesebre, `left: ${P.x + P.w / 2 - P.w * .62}px; top: ${P.y + P.h * PESEBRE.luz[1] - P.w * .62}px; width: ${P.w * 1.24}px; height: ${P.w * 1.24}px`)
    : puntos?.halo ? div('cm-halo', root, puntos.halo.antes ?? null, `left: ${nino.x - puntos.halo.r}px; top: ${nino.y - puntos.halo.r}px; width: ${puntos.halo.r * 2}px; height: ${puntos.halo.r * 2}px`) : null;
  const posEstrella = P ? { x: P.x + P.w * PESEBRE.estrella[0], y: P.y + P.h * PESEBRE.estrella[1] } : puntos?.estrella;
  const estrella = posEstrella ? div('cm-estrella', root, null, `left: ${posEstrella.x}px; top: ${posEstrella.y}px`) : null;
  if (estrella) estrella.innerHTML = `<div class="cm-estrella-luz"></div><div class="cm-chispa cm-chispa-estrella">${CHISPA}</div>`;
  const [luzEstrella, chispaEstrella] = estrella ? [...estrella.children] : [];
  if (teo && dest) teo.style.transformOrigin = '50% 100%';
  if (boton) { boton.inert = true; boton.style.pointerEvents = 'none'; }
  let revelado = false, cuadroHecho = false, entrega = null, sale = [], inclina = null;
  const cambiarTextos = () => {
    if (titulo && textos.era) titulo.textContent = textos.era;
    if (sub && textos.eraSub) sub.textContent = textos.eraSub;
    if (teo && textos.altEntrega) teo.alt = textos.altEntrega;
    try { onRevelar?.({ titulo, sub }); } catch (err) { console.warn('onRevelar', err); }
  };
  const botonListoYa = () => { if (boton) { boton.inert = false; boton.style.pointerEvents = ''; } e.listo(); };

  if (reduced()) { // el estado final, con un fundido corto
    if (teo && dest) Object.assign(teo.style, { translate: `${dest.dx}px ${dest.dy}px`, scale: String(dest.s1) });
    cambiarTextos();
    [titulo, sub, halo, luzEstrella, boton].forEach(el => aparecer(e, el, { fundido: 220 }));
    if (chispaEstrella) chispaEstrella.style.opacity = '0';
    sonido('llena'); vibrar([18, 50, 28]); botonListoYa();
    return control(e, () => {});
  }

  // (a) el logro: el título entra con un rebote, confeti desde él y el motivo de la estrella
  aparecer(e, titulo, { en: 60, desde: { translate: '0px 16px', scale: '.9' }, resorte: { amortiguacion: .72, respuesta: .5 } });
  aparecer(e, sub, { en: 240, desde: { translate: '0px 8px' }, resorte: { amortiguacion: 1, respuesta: .45 } });
  e.en(60, () => motivo('largo'), { sonido: true });
  const ty = titulo ? rel(root, titulo) : { x: 24, y: 118, w: 342, h: 40 };
  e.en(200, () => layer?.isConnected && confetti(layer, ty.x + ty.w / 2, ty.y + ty.h / 2, 28));
  // el botón sube después de la revelación: se reprograma cuando llegue (o con el toque)
  const subeBoton = boton ? e.anima(boton, [{ translate: '0px 26px', opacity: 0 }, { translate: '0px 0px', opacity: 1 }], { en: 1e7, ...muelle({ amortiguacion: 1, respuesta: .5 }), diferible: true, despues: botonListoYa }) : null;

  // (c) la luz, (d) la revelación
  const faseLuz = (t, conLuz) => {
    if (halo) e.anima(halo, [{ opacity: 0, scale: '.72' }, { opacity: 1, scale: '1' }], { en: t, ...muelle({ amortiguacion: 1, respuesta: 1.1 }) });
    if (luzEstrella) e.anima(luzEstrella, [{ opacity: 0, scale: '.4' }, { opacity: 1, scale: '1' }], { en: t + 150, ...muelle({ amortiguacion: 1, respuesta: .6 }) });
    // la estrella titila dos veces y su destello se apaga (queda su luz): una sola animación, su estilo base es invisible
    if (chispaEstrella) e.anima(chispaEstrella, [
      { opacity: 0, scale: '.2', rotate: '-25deg', easing: 'cubic-bezier(.2,.7,.3,1)' }, { opacity: 1, scale: '1.15', rotate: '10deg', offset: .16, easing: 'cubic-bezier(.4,0,.6,1)' },
      { opacity: .8, scale: '.88', rotate: '20deg', offset: .4, easing: 'cubic-bezier(.2,.7,.3,1)' }, { opacity: 1, scale: '1.22', rotate: '35deg', offset: .55, easing: 'cubic-bezier(.4,0,.6,1)' },
      { opacity: 0, scale: '.5', rotate: '70deg' }], { en: t + 150, duration: 1500, efimera: true });
    let llega = t + 500;
    if (conLuz && dest) {
      // se inclina hacia el pesebre para ofrecer la carta
      inclina = e.anima(teo, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(2.2deg)' }], { en: t + 100, ...muelle({ amortiguacion: 1, respuesta: .55 }), alTerminar: 'mantener', final: { transform: 'none' } });
      llega = viajeLuz(t + 350, dest.mano, nino);
    }
    e.en(llega + 60, revelar, { clave: true }); // el cambio de texto cae 200 ms después de que la luz llega
  };
  // la carta entregada: una lucecita (y dos más chicas detrás) sube de la mano, hace un arco y se posa sobre el Niño
  const viajeLuz = (t, a, b) => {
    const dur = 600, c = { x: a.x + (b.x - a.x) * .25, y: Math.min(a.y, b.y) - 70 }, kf = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24, p = u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2, q = 1 - p;
      const x = q * q * a.x + 2 * q * p * c.x + p * p * b.x, y = q * q * a.y + 2 * q * p * c.y + p * p * b.y;
      kf.push({ offset: u, translate: `${x.toFixed(1)}px ${y.toFixed(1)}px`, scale: String((u < .15 ? .4 + 4 * u : u > .8 ? 1 - (u - .8) * 1.5 : 1).toFixed(3)), opacity: u < .1 ? u * 10 : u > .9 ? (1 - u) * 10 : 1 });
    }
    [[0, 1, 1], [45, .7, .6], [90, .5, .35]].forEach(([d, s, o]) => {
      const l = div('cm-luz', root, null, `width: ${18 * s}px; height: ${18 * s}px; margin: ${-9 * s}px 0 0 ${-9 * s}px`);
      e.anima(l, kf.map(k => ({ ...k, opacity: k.opacity * o })), { en: t + d, duration: dur, efimera: true, despues: () => l.remove() });
    });
    e.en(t, () => sonido('estrella', 0), { sonido: true });
    e.en(t + dur / 2, () => sonido('estrella', 1), { sonido: true });
    e.en(t + dur, () => {
      sonido('estrella', 2);
      const flor = div('cm-flor', root, null, `left: ${b.x}px; top: ${b.y}px`);
      e.anima(flor, [{ opacity: 0, scale: '.3' }, { opacity: .9, scale: '.9', offset: .25 }, { opacity: 0, scale: '1.5' }], { duration: 700, easing: 'cubic-bezier(.2,.6,.3,1)', efimera: true, despues: () => flor.remove() });
    }, { sonido: true });
    return t + dur;
  };
  const revelar = () => {
    if (revelado || e.cerrada) return; revelado = true;
    // lo de antes se va rápido (140 ms) y en el cuadro siguiente llega lo nuevo
    sale = [titulo, sub].filter(Boolean).map(el => { const o = getComputedStyle(el).opacity; return e.anima(el, [{ opacity: o }, { opacity: 0 }], { duration: 140, easing: 'cubic-bezier(.4,0,1,1)', alTerminar: 'mantener', final: { opacity: '0' } }); });
    e.en(e.t() + 140, cuadroRevelacion, { clave: true });
  };
  const cuadroRevelacion = () => {
    if (cuadroHecho || e.cerrada) return; cuadroHecho = true;
    sale.forEach(a => a?.cancel());
    cambiarTextos();
    const t = e.t();
    aparecer(e, titulo, { en: t, desde: { translate: '0px 10px', scale: '.84' }, resorte: { amortiguacion: .62, respuesta: .42 }, fundido: 160 });
    aparecer(e, sub, { en: t + 90, desde: { translate: '0px 8px' }, resorte: { amortiguacion: 1, respuesta: .45 } });
    // destello cálido, confeti, «llena» y vibración: todo en este cuadro
    const d = div('cm-destello', root, null, `background: radial-gradient(circle at ${nino.x}px ${nino.y}px, rgba(255,250,232,.95) 0, rgba(255,238,190,.5) 90px, rgba(255,238,190,0) 250px)`);
    e.anima(d, [{ opacity: 0, easing: 'cubic-bezier(.2,.7,.3,1)' }, { opacity: dark() ? .65 : .8, offset: .14, easing: 'cubic-bezier(.4,0,.6,1)' }, { opacity: 0 }], { en: t, duration: 640, efimera: true, despues: () => d.remove() });
    if (layer?.isConnected) confetti(layer, nino.x, nino.y - 10, 46);
    sonido('llena'); vibrar([18, 50, 28]);
    // Teodoro se endereza y da un saltito de alegría (sin globos: su voz la pone carta.js)
    if (teo && dest) {
      const cur = getComputedStyle(teo).transform; inclina?.cancel(); // el saltito sale desde donde está inclinado
      e.anima(teo, [{ transform: cur === 'none' ? 'translateY(0px) rotate(0deg) scale(1, 1)' : cur }, { transform: 'translateY(-11px) rotate(0deg) scale(1, 1)', offset: .34, easing: 'cubic-bezier(.5,0,.85,.45)' },
        { transform: 'translateY(0px) rotate(0deg) scale(1, 1)', offset: .66, easing: 'cubic-bezier(.2,.7,.4,1)' }, { transform: 'translateY(0px) rotate(0deg) scale(1.03, .965)', offset: .8 }, { transform: 'translateY(0px) rotate(0deg) scale(1, 1)' }],
      { en: t, duration: 620, easing: 'cubic-bezier(.2,.7,.4,1)', final: { transform: 'none' } });
    }
    e.en(t + 150, () => layer?.isConnected && confetti(layer, (P ? P.x + P.w * .15 : 90), nino.y + 30, 16));
    e.en(t + 260, () => layer?.isConnected && confetti(layer, (P ? P.x + P.w * .85 : 300), nino.y + 30, 16));
    if (subeBoton) subeBoton.startTime = e.T0 + t + 420; // (e)
    else e.en(t + 420, botonListoYa, { clave: true });
  };

  // (b) camina al pesebre (o la animación de la entrega, cuando César la pase)
  if (animacionEntrega && teo) {
    e.en(T_PASOS, () => {
      try { entrega = animacionEntrega({ teo, pesebre, root, layer }); } catch (err) { console.warn('animacionEntrega', err); }
      const fin = entrega?.finished ?? (typeof entrega?.then === 'function' ? entrega : null);
      if (fin) fin.then(() => { if (!e.cerrada && !revelado) faseLuz(e.t() + 80, false); }, () => {}); else faseLuz(e.t() + 80, false);
    }, { clave: true });
  } else if (dest) {
    const { kf, total } = caminar(dest);
    e.anima(teo, kf, { en: T_PASOS, duration: total, alTerminar: 'fijar', final: { translate: `${dest.dx}px ${dest.dy}px`, rotate: '0deg', scale: String(dest.s1) } });
    for (let k = 1; k <= N_PASOS; k++) e.en(T_PASOS + k * DUR_PASOS / N_PASOS - 16, () => sonido('paso'), { sonido: true });
    faseLuz(T_PASOS + DUR_PASOS + 100, true);
  } else faseLuz(1200, false);

  const saltar = () => {
    if (e.cerrada || (cuadroHecho && !subeBoton)) return;
    try { entrega?.saltar ? entrega.saltar() : entrega?.finish?.(); } catch { /* */ }
    if (cuadroHecho) { // ya se reveló: el botón sube ya
      if (subeBoton && subeBoton.currentTime !== null && subeBoton.currentTime < 0) subeBoton.startTime = performance.now();
      return;
    }
    e.apurar();
    if (!revelado) revelar();
  };
  tocarParaSaltar(e, root, saltar);
  return control(e, saltar);
}

// ---------- 2 · La carta abierta ----------
const horas = m => m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`;
/** Lee el número de una fila: «26» o «2 h 47 min» (el tiempo cuenta en minutos). */
function leerNumero(txt) {
  const t = txt.trim(), hm = t.match(/^(?:(\d+)\s*h)?\s*(?:(\d+)\s*min)?$/);
  if (hm && (hm[1] || hm[2])) return { v: (+hm[1] || 0) * 60 + (+hm[2] || 0), fmt: horas, txt };
  const n = parseInt(t.replace(/[^\d]/g, ''), 10);
  return isNaN(n) ? null : { v: n, fmt: String, txt };
}
/**
 * nueva: el papel se despliega desde arriba, las filas entran una a una y cada número cuenta con «tic» y cierra con una nota que
 * sube (rayita 1–5), la firma se escribe sola y un confeti suave + «acierto» cierran. Volver a abrirla: entrada corta y quieta.
 */
export function abrirCartaAnim({ root, layer, papel, filas = [], numeros, firma, nueva = false } = {}) {
  const e = escena(root); filas = [...(filas || [])];
  if (!root) return control(e, () => {});
  if (!nueva || reduced()) {
    aparecer(e, papel, { desde: reduced() ? {} : { translate: '0px 10px' }, resorte: { amortiguacion: 1, respuesta: .4 }, fundido: 220 });
    e.listo(); return control(e, () => {});
  }
  if (papel) {
    // se desenrolla: el papel se revela de arriba abajo con una curva suave (arranca despacio, acelera y aterriza lento) y por delante baja un
    // rollo de papel con su sombra, que al llegar abajo se aplana y se va
    const DUR = 1350, CURVA = 'cubic-bezier(.55,0,.18,1)', H = papel.offsetHeight, R = getComputedStyle(papel).borderRadius || '6px';
    e.anima(papel, [{ clipPath: `inset(0 0 calc(100% - 20px) 0 round ${R})`, opacity: 0 }, { clipPath: `inset(0 0 calc(100% - 20px) 0 round ${R})`, opacity: 1, offset: .08 }, { clipPath: `inset(0 0 0 0 round ${R})`, opacity: 1 }],
      { en: 0, duration: DUR, easing: CURVA, final: { clipPath: 'none' } });
    e.anima(papel, [{ translate: '0px -8px', scale: '.985' }, { translate: '0px 0px', scale: '1' }], { en: 0, duration: DUR, easing: CURVA });
    const rollo = document.createElement('div'); rollo.className = 'cm-rollo'; rollo.setAttribute('aria-hidden', 'true');
    Object.assign(rollo.style, { left: papel.offsetLeft + 'px', top: papel.offsetTop + 'px', width: papel.offsetWidth + 'px', transform: papel.style.transform || getComputedStyle(papel).transform.replace('none', ''), transformOrigin: getComputedStyle(papel).transformOrigin });
    papel.after(rollo);
    e.anima(rollo, [{ translate: '0px 0px', opacity: 0 }, { translate: '0px 6px', opacity: 1, offset: .08 }, { translate: `0px ${H - 14}px`, opacity: 1 }], { en: 0, duration: DUR, easing: CURVA, efimera: true });
    e.anima(rollo, [{ opacity: 1, scale: '1 1' }, { opacity: 0, scale: '1 .25' }], { en: DUR - 120, duration: 260, easing: 'ease-in', efimera: true, despues: () => rollo.remove() });
    e.en(DUR + 200, () => rollo.isConnected && rollo.remove());
  }
  // las filas: una tras otra; el número cuenta (más rápido si es chico) y la siguiente entra un poco antes de que cierre
  const bs = filas.map((f, i) => numeros?.[i] || f.querySelector('b'));
  const datos = bs.map(b => b && leerNumero(b.textContent));
  bs.forEach((b, i) => { // reserva el ancho final: el texto de al lado no se mueve mientras cuenta
    if (!b || !datos[i]) return;
    Object.assign(b.style, { display: 'inline-block', fontVariantNumeric: 'tabular-nums', textAlign: 'right', transformOrigin: '100% 70%' }); // crece hacia la izquierda, pegado a su texto
    b.style.minWidth = b.offsetWidth + 'px'; b.textContent = datos[i].fmt(0);
  });
  let t = 700; // las filas entran mientras el rollo pasa
  filas.forEach((f, i) => {
    const b = bs[i], d = datos[i], dur = d ? Math.round(Math.min(640, Math.max(280, 200 + 70 * Math.log2(d.v + 1)))) : 300;
    aparecer(e, f, { en: t, desde: { translate: '-10px 0px' }, resorte: { amortiguacion: 1, respuesta: .36 }, fundido: 200 });
    const ico = f.querySelector('img, svg');
    if (ico) e.anima(ico, [{ scale: '.5' }, { scale: '1' }], { en: t, ...muelle({ amortiguacion: .6, respuesta: .36 }) });
    const n = Math.min(5, i + 1);
    if (b && d) cuenta(e, b, d, t + 100, dur, () => { sonido('rayita', n); latido(e, b, e.t(), 1.14, { amortiguacion: .55, respuesta: .3 }); });
    else e.en(t + 100 + dur, () => sonido('rayita', n), { sonido: true });
    t += 100 + dur - 180;
  });
  const tf = t + 240;
  escribir(e, firma, tf, 600);
  e.en(tf + 640, () => {
    if (firma && layer?.isConnected) { const r = rel(root, firma); confetti(layer, r.x + r.w / 2, r.y + r.h / 2, 24); }
    sonido('acierto');
  }, { sonido: true });
  e.en(tf + 1200, () => e.listo(), { clave: true });
  const saltar = () => { if (!e.cerrada) { e.apurar(); e.en(e.t() + 500, () => e.listo(), { clave: true }); } };
  tocarParaSaltar(e, root, saltar);
  return control(e, saltar);
}
/** Cuenta de 0 a su valor (rápido al principio, lento al final) con un «tic» por número, como mucho uno cada 55 ms. */
function cuenta(e, b, d, en, dur, alFin) {
  let ult = 0, tic = -1e9, hecho = false;
  e.tarea({
    cuadro(t) {
      if (t < en) return true;
      const u = Math.min(1, (t - en) / dur), v = Math.round(d.v * (1 - Math.pow(1 - u, 3)));
      if (u >= 1) { hecho = true; b.textContent = d.txt; alFin?.(); return false; }
      if (v !== ult) { ult = v; b.textContent = d.fmt(v); if (t - tic > 55) { tic = t; sonido('tic'); } }
      return true;
    },
    apurar() { if (!hecho) { hecho = true; b.textContent = d.txt; } },
    cancelar() { b.textContent = d.txt; },
  });
}

// ---------- Tocar ----------
const presionados = new WeakSet();
/** Al apoyar el dedo se hunde a .97 con un resorte; vuelve al soltar o si el dedo se va (12 px de margen) y regresa si vuelve.
 *  Usa la propiedad `scale` suelta: no choca con otras animaciones de transform ni mueve el layout. */
export function presionable(el, { escala = .97 } = {}) {
  if (!el || presionados.has(el)) return el;
  presionados.add(el);
  if (!el.style.touchAction) el.style.touchAction = 'manipulation';
  let a = null, id = null, abajo = false;
  const ir = hundido => {
    if (abajo === hundido) return; abajo = hundido;
    const desde = getComputedStyle(el).scale;
    a?.cancel();
    a = el.animate([{ scale: desde === 'none' ? '1' : desde }, { scale: String(hundido ? escala : 1) }],
      { fill: 'forwards', ...(hundido ? { duration: 110, easing: 'cubic-bezier(.2,.8,.2,1)' } : reduced() ? { duration: 160, easing: 'ease-out' } : muelle({ amortiguacion: .6, respuesta: .32 })) });
    if (!hundido) { const yo = a; a.finished.then(() => { if (a === yo) { yo.cancel(); a = null; } }, () => {}); }
  };
  // sin capturar el puntero: soltar fuera del botón tiene que seguir cancelando el clic
  const fin = ev => { if (ev.pointerId !== id) return; id = null; ir(false); removeEventListener('pointerup', fin, true); removeEventListener('pointercancel', fin, true); };
  el.addEventListener('pointerdown', ev => {
    if (ev.button > 0 || el.getAttribute('aria-disabled') === 'true') return;
    id = ev.pointerId; ir(true);
    addEventListener('pointerup', fin, true); addEventListener('pointercancel', fin, true);
  });
  // con el dedo (captura implícita) llegan los movimientos aunque salga: se mide con 12 px de margen
  el.addEventListener('pointermove', ev => {
    if (ev.pointerId !== id || ev.pointerType === 'mouse') return;
    const r = el.getBoundingClientRect(), m = 12 * (r.width / (el.offsetWidth || r.width) || 1);
    ir(ev.clientX > r.left - m && ev.clientX < r.right + m && ev.clientY > r.top - m && ev.clientY < r.bottom + m);
  });
  // con el ratón: sale y vuelve
  el.addEventListener('pointerleave', ev => { if (ev.pointerId === id) ir(false); });
  el.addEventListener('pointerenter', ev => { if (ev.pointerId === id && ev.buttons) ir(true); });
  el.addEventListener('lostpointercapture', fin);
  return el;
}
