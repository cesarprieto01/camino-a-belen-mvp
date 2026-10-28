// Flujo del camino: qué pasa al tocar cada cosa y qué pantalla del lienzo se ve.
import { S, save, A, $, $$, on, find, go, back, register, seen, toast, nota, hueco, paintEnergy, teodoroImg, activeDay, walkDay, isDone, contentDone,
  lastDay, pendientes, fase, dark, stars, wait, reduced, animate, replaceText, setText, textEl, swapImg, floaty, confetti,
  addPanes, setBateria, doneCount, frag, racha, vistos, cuentaGracia, GRACIA_FIN, puedeDia, conTodo } from './core.js';
import { DAYS, TYPES, RULES, PRENDAS, IMG, dateOf, iconOf, hasTrivia, usaHub, BATTERY_IDS } from './data.js';
import './musica.js'; // música de fondo del mapa y la trivia
import { rateRow } from './games.js';

const F = (claro, oscuro) => [claro, oscuro];
const premium = conTodo; // Theo Premium o Pase de Adviento
export const panesContenido = () => premium() ? RULES.panes.contenidoPremium : RULES.panes.contenidoFree;

// ---------- Reglas del día ----------
/** Empieza (o retoma) el día n desde el mapa. */
export function startDay(n) {
  const d = DAYS[n];
  // desde el 7 de enero: lo hecho se vuelve a ver; lo que faltó ya no se abre (el nacimiento siempre)
  if (fase() === 'recuerdo' && n < 26 && !contentDone(n)) { toast('El camino de este año terminó', 'Nos vemos en Adviento'); return; }
  if (!puedeDia(n)) { go('free', { back: 'mapa', dia: n }, 'page'); return; }
  if (n === 26) { go(contentDone(26) ? 'final' : 'reproductor', { day: 26, nacimiento: !contentDone(26) }, contentDone(26) ? 'fade' : 'up'); return; }
  if (!contentDone(n)) {
    go(usaHub(n) ? 'hub' : 'reproductor', { day: n }, 'up');
    return;
  }
  if (!isDone(n)) { go('trivia', { day: n, ...(S.triviaProgreso?.[n] || {}) }, 'push'); return; }
  if (RULES.sorpresa[n] && S.sorpresas[n] !== 'hecha') { openSorpresa(n); return; }
  go('cerrado', {}, 'sheet');
}
export function openSorpresa(n) {
  const g = RULES.sorpresa[n];
  go({ memorama: 'memoramaReglas', adivinanza: 'adivinanzaIntro', desafio: 'desafioIntro' }[g], { day: n }, 'fade');
}
/** Texto y acción del botón principal de la hoja del mapa. */
export function ctaLabel(n) {
  const d = DAYS[n];
  const verbo = TYPES[d.type].verbo;
  if (!puedeDia(n)) return { text: 'Desbloquear el día', go: () => startDay(n) };
  if (n === 26 && !contentDone(26)) return fase() === 'recuerdo' ? { text: 'Ver el nacimiento', play: true, go: () => go('reproductor', { day: 26, nacimiento: true, replay: true }, 'up') } : { text: 'Comenzar', play: true, go: () => startDay(26) };
  if (!contentDone(n)) return { text: verbo, play: true, go: () => startDay(n) };
  if (n === 0) return { text: 'Invitar a un amigo', go: () => go('invitacion', {}, 'push') };
  if (!isDone(n)) return { text: 'Jugar la trivia', go: () => startDay(n) };
  if (RULES.sorpresa[n] && S.sorpresas[n] !== 'hecha') return { text: 'Ir al juego sorpresa', go: () => openSorpresa(n) };
  const a = activeDay();
  if (a != null) return { text: `Seguir al día ${a}`, go: () => startDay(a) };
  if (S.hoy >= 26) return { text: 'Ver el nacimiento', go: () => go('final', { day: 26 }, 'fade') };
  return { text: 'Hasta mañana', go: () => go('hoy', {}, 'down', { tab: true }) };
}
/** Termina el contenido del día: suma batería y panes. */
export function finishContent(n) {
  if (fase() === 'recuerdo') return false; // el camino ya cerró: volver a ver no suma
  const first = !contentDone(n);
  S.completos[n] = { ...(S.completos[n] || {}), contenido: true };
  // terminar un cuento (o cualquier contenido del día) deja a Teodoro al 100%
  if (n > 0) { setBateria(5); S.sinCaminar = 0; S.regresoAvisado = false; }
  if (first && n > 0) addPanes(panesContenido());
  if (first && n > 0) S.pasoAnimado = n; // Teodoro avanza en el mapa al ver la historia
  S.ultimoJugado = S.hoy;
  save();
  return first;
}
export function finishTrivia(n, aciertos, replay = false) {
  const est = aciertos >= 5 ? 3 : aciertos >= 3 ? 2 : 1;
  if (fase() === 'recuerdo') return { est, first: false, gana: false, mejoro: false }; // el camino terminó: se juega, pero nada suma
  const first = !isDone(n);
  const prev = stars(n);
  S.completos[n] = { ...(S.completos[n] || {}), contenido: true, trivia: true, estrellas: Math.max(est, prev), aciertos };
  // primera vez: llena la batería y suma; al repetir solo suma si mejora las estrellas
  const gana = first || (replay && est > prev);
  if (first) { setBateria(5); S.pasoAnimado = n; }
  if (gana) addPanes(RULES.panes.trivia);
  save();
  return { est, first, gana, mejoro: replay && est > prev };
}

// Barra de pestañas de la app (igual en todas)
function tabs(root) {
  // la barra de pestañas la pone y la conecta core.js (tabbar.js) en todas las pantallas
  on(root, 'Ajustes', () => nota('Ajustes de Theo', 'Ya existen en la app'));
}
function appContent(root) {
  // domingo con el camino: el «Evangelio del día» es el del camino (lleva allá, no se hace dos veces)
  const hd = Math.min(Math.max(S.hoy, 0), 26);
  const evCamino = fase() !== 'antes' && S.inscrito && DAYS[hd]?.type === 'domingo';
  if (evCamino) on(root, 'Evangelio del día', () => entrar('hoy'));
  [...(evCamino ? [] : ['Evangelio del día']), 'Villancicos', 'Oración de la noche', 'El cuento de hoy', 'La afirmación de hoy', 'PARA REZAR EN FAMILIA', 'Los peces en el río', 'Ven, Señor Jesús', 'Noche de paz', 'Ver todo']
    .forEach(t => on(root, t, () => nota('Contenido de Theo', 'Ya existe en la app; aquí no cambia')));
}
/** Destellos decorativos del lienzo (estrellitas sueltas): titilan. Nunca íconos de botones. */
export function sparkles(root) {
  $$(root, 'svg').filter(s => s.style.position === 'absolute' && !s.closest('a, button, nav') && /#F5D|#F5C|#FFF3|#F7C/i.test(s.innerHTML))
    .forEach((s, i) => { s.classList.add('a-twinkle'); s.style.animationDelay = (i * .35) + 's'; });
}
/** Estado de la tarjeta del reto (lienzo «Estados del reto»), igual en Hoy y en el tab Teodoro. */
export function cardState() {
  const act = activeDay();
  if (fase() === 'antes') return S.inscrito ? { key: 2 } : { key: 1 };
  if (S.hoy >= 27) {
    // gracia (25 dic – 6 ene): se invita a terminar, con el contador de días que quedan; desde el 7 de enero, recuerdo
    const v = vistos(), recuerdo = fase() === 'recuerdo';
    if (!S.inscrito) return recuerdo ? { key: 7, title: 'Camino a Belén', sub: 'Nos vemos en Adviento', cta: 'Ver el nacimiento' }
      : { key: 4, title: '¡Aún llegas a Belén!', sub: cuentaGracia(true), cta: 'Unirme gratis', cuenta: true };
    if (v >= 26) return { key: 5, title: S.hoy === 27 ? '¡Feliz Navidad!' : 'Camino a Belén', sub: '¡Llegaste a Belén!', cta: 'Ver el nacimiento' }; // «¡Feliz Navidad!» solo el 25
    if (recuerdo) return v ? { key: 8, title: 'Camino a Belén', sub: `Caminaste ${v} ${v === 1 ? 'día' : 'días'} con Teodoro`, cta: 'Ver tu camino' }
      : { key: 7, title: 'Camino a Belén', sub: 'Nos vemos en Adviento', cta: 'Ver el nacimiento' };
    return { key: 6, title: 'Camino a Belén', sub: cuentaGracia(true).replace('Último día', '¡Último día!'), cuenta: true }; // mismo diseño que en el camino: barra y «Continuar la aventura»
  }
  if (!S.inscrito) return { key: 4, title: '¡Ya salimos! ¿Vienes?', sub: 'Aún llegas a Belén', cta: 'Unirme gratis' };
  const h = Math.min(S.hoy, 26);
  if (act == null && RULES.sorpresa[h] && isDone(h) && S.sorpresas[h] !== 'hecha') return { key: 3, sorpresa: true };
  return { key: 3, done: act == null };
}
/** Inscribirse antes del 29: el botón se vuelve ✓ «¡Listo!» y se abre «¡Ya estás dentro!» (flujo 1 del pre registro). */
/** from: desde dónde se une (hoy o teodoro); «¡Ya estás dentro!» vuelve allá. */
export function inscribir(btn, from = 'hoy') {
  if (S.inscrito) return go('listo', {}, 'push');
  S.inscrito = true; save();
  navigator.vibrate?.(20);
  if (btn) {
    btn.style.transition = 'background .2s, transform .2s cubic-bezier(.23,1,.32,1)';
    btn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" style="stroke-dasharray:40;stroke-dashoffset:40;animation:drawCheck .35s ease-out forwards"/></svg>¡Listo!';
    btn.style.display = 'flex'; btn.style.alignItems = 'center'; btn.style.justifyContent = 'center'; btn.style.gap = '8px';
    btn.style.pointerEvents = 'none'; animate(btn, 'a-pop');
  }
  setTimeout(() => go('listo', { nueva: true, from }, 'fade'), 750);
}
/** Unirse al camino cuando ya empezó (una sola puerta: Hoy, Teodoro y Mundos). */
export function unirse(from) {
  S.inscrito = true; save();
  toast('¡Ya estás dentro!', 'Empieza por hoy, a tu ritmo');
  go('mapa', { from }, 'push');
}
/** Entrar al camino desde Hoy, Teodoro o Mundos. */
export function entrar(from) {
  if (!S.inscrito) return fase() === 'antes' ? go('teaser', {}, 'modal') : fase() === 'recuerdo' ? toast('El camino de este año terminó', 'Nos vemos en Adviento') : unirse(from);
  // antes del 29 nadie ve el mapa: se entra a los mundos, con Adviento cerrado y su cuenta regresiva
  if (fase() === 'antes') return from === 'mundos' ? toast('Empieza el 29 de noviembre') : go('mundos', {}, 'push');
  go('mapa', { from }, 'push');
}
const dayLine = n => n === 0 ? 'Día 0 · ¿Qué es el Adviento?' : `Día ${n} · ${DAYS[n].title}`;

// Cuenta regresiva real hasta el 29 de noviembre de 2026
// cuenta regresiva en vivo: revisa cada segundo y el número rueda cuando cambia
function roll(el, v) {
  if (el.textContent === v) return;
  el.textContent = v;
  el.style.display ||= 'inline-block';
  el.animate([{ transform: 'translateY(-45%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.2,.9,.3,1.2)' });
}
function startCountdown(layer) {
  const target = new Date(2026, 10, 29, 0, 0, 0);
  // cada número del lienzo va seguido de su unidad (días · h/horas · min): así se encuentran todos los contadores
  const unit = el => (el.nextElementSibling?.textContent || el.nextSibling?.nodeValue || '').trim().toLowerCase();
  const cells = [...layer.querySelectorAll('*')].filter(el => el.childElementCount === 0 && /^\d{1,2}$/.test(el.textContent.trim()) && /^(días|h|horas|min|minutos)$/.test(unit(el)));
  cells.forEach(el => { el.dataset.cd = unit(el); el.dataset.pad = el.textContent.trim().length; });
  const tick = () => {
    const ms = Math.max(0, target - new Date());
    const v = { días: Math.floor(ms / 864e5), h: Math.floor(ms / 36e5) % 24, horas: Math.floor(ms / 36e5) % 24, min: Math.floor(ms / 6e4) % 60, minutos: Math.floor(ms / 6e4) % 60 };
    cells.forEach(el => roll(el, String(v[el.dataset.cd]).padStart(+el.dataset.pad, '0')));
    const d = v.días;
    $$(layer, '[role=img][aria-label^="Empieza en"], [role=timer][aria-label^="Empieza en"]').forEach(g => g.setAttribute('aria-label', `Empieza en ${d} días, ${v.h} horas y ${v.min} minutos`));
  };
  tick();
  const iv = setInterval(() => { if (!layer.isConnected) clearInterval(iv); else tick(); }, 1000);
}

/** Recién unido: el vidrio empañado de la card se limpia y aparece Teodoro de espaldas mirando el pesebre.
 *  modo 'dedo': ya lo limpiaron con el dedo; solo se baja a la card y Teodoro aparece. */
function vidrio(root, modo) {
  const card = root.querySelector('[role=group][aria-label^="Camino a Belén: ya estás dentro, empieza"] a');
  if (!card || reduced()) return;
  const teo = $$(card, 'img').find(i => /de espaldas/.test(i.alt));
  // la card queda bajo el pliegue: primero se baja hasta ella y ahí se limpia el vidrio
  const capa = root.closest('.layer');
  if (capa) setTimeout(() => capa.scrollTo({ top: Math.max(0, card.getBoundingClientRect().top - capa.getBoundingClientRect().top + capa.scrollTop - 160), behavior: 'smooth' }), 250);
  if (modo === 'dedo') { teo?.animate([{ opacity: .4, transform: 'translateY(10px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: 600, easing: 'cubic-bezier(.2,.9,.3,1.1)', fill: 'backwards' }); return; }
  const v = document.createElement('img');
  v.src = A('ffc14384b753c2d8d87872f172d05946'); v.alt = ''; v.setAttribute('aria-hidden', 'true');
  v.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;pointer-events:none;z-index:2';
  card.appendChild(v);
  v.animate([{ opacity: 1, filter: 'blur(0)' }, { opacity: 0, filter: 'blur(6px)' }], { duration: 1400, delay: 1000, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).finished.then(() => v.remove());
  teo?.animate([{ opacity: .4, transform: 'translateY(10px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: 1500, easing: 'cubic-bezier(.2,.9,.3,1.1)', fill: 'backwards' });
}
/** Antes de unirse: el vidrio empañado se limpia con el dedo y deja ver la escena de la card «ya dentro».
 *  Al despejar ~42 % se revela todo, la familia queda unida y se abre «¡Ya estás dentro!» (igual que «Únete al reto»).
 *  Tocar sin arrastrar sigue abriendo el teaser.
 *  Referencia nativa para el equipo: ios/VidrioEmpanado.swift (mismos números). */
async function vidrioConDedo(root, origen) {
  const a = root.querySelector('a[aria-label="Camino a Belén: se revela al unirte al reto"]');
  const img = a && $$(a, 'img').find(i => i.src.includes('ffc14384'));
  if (!img) return;
  // debajo del vidrio, la misma escena de la card «ya dentro»: fondo + Teodoro de espaldas
  const f = await frag(F('P-Hoy-despues-d', 'P-Hoy-despues-d-oscuro')[dark() ? 1 : 0]);
  const escena = [...f.querySelectorAll('a[aria-label="Ver el camino"]')].pop();
  await img.decode().catch(() => {});
  if (!a.isConnected || !escena || !img.naturalWidth) return; // imagen rota (red mala): la card queda como está
  const W = 358, H = 201, R = 24, COLS = 14, FILAS = 8, META = 47; // 47 de 112 celdas ≈ 42 %
  const dpr = Math.min(devicePixelRatio || 1, 3);
  const cv = document.createElement('canvas');
  cv.width = W * dpr; cv.height = H * dpr; cv.className = 'vidrio-dedo'; cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = `position:absolute;left:0;top:0;width:${W}px;height:${H}px;pointer-events:none`;
  const ctx = cv.getContext('2d');
  ctx.drawImage(img, 0, 0, cv.width, cv.height);
  $$(escena, 'img').forEach(i => a.insertBefore(i, img));
  img.replaceWith(cv);
  // zona de toque libre: el vidrio, el degradado de abajo y los bordes de la pantalla a los lados.
  // El dedo puede arrancar donde sea (también fuera del vidrio) e ir en cualquier dirección.
  const grupo = a.closest('[role=group]');
  const zona = document.createElement('span');
  zona.className = 'vidrio-zona'; zona.setAttribute('aria-hidden', 'true');
  grupo.after(zona);
  const ref = zona.offsetParent || grupo.parentElement, capaV = root.closest('.layer') || ref;
  const rr = ref.getBoundingClientRect(), rv = cv.getBoundingClientRect(), rl = capaV.getBoundingClientRect(), kz = rr.width / ref.offsetWidth || 1;
  Object.assign(zona.style, { left: (rl.left - rr.left) / kz + 'px', width: rl.width / kz + 'px', top: (rv.top - rr.top) / kz - 10 + 'px', height: rv.height / kz + 10 + 'px' });
  // pincel de borde suave: el halo de la sombra también borra
  ctx.scale(dpr, dpr);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineCap = ctx.lineJoin = 'round'; ctx.lineWidth = R * 1.4;
  ctx.shadowColor = '#000'; ctx.shadowBlur = R * .9 * dpr;
  const trazo = (x0, y0, x1, y1, alfa = 1) => { ctx.globalAlpha = alfa; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };
  const celdas = new Set();
  const marcar = (x, y) => {
    const cw = W / COLS, ch = H / FILAS;
    for (let cx = 0; cx < COLS; cx++) for (let cy = 0; cy < FILAS; cy++)
      if (Math.hypot((cx + .5) * cw - x, (cy + .5) * ch - y) <= R) celdas.add(cy * COLS + cx);
  };
  const punto = ev => { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) * W / r.width, (ev.clientY - r.top) * H / r.height]; };
  const dentro = ([x, y]) => x >= 0 && x <= W && y >= 0 && y <= H;
  let ult = null, recorrido = 0, unido = false, pista = null;
  const sinPista = () => { if (pista) { pista.parar(); pista = null; } };
  zona.addEventListener('pointerdown', ev => { if (unido) return; ev.preventDefault(); sinPista(); ult = punto(ev); recorrido = 0; zona.setPointerCapture?.(ev.pointerId); });
  zona.addEventListener('pointermove', ev => {
    if (!ult || unido) return;
    const juntos = ev.getCoalescedEvents?.();
    for (const e of juntos?.length ? juntos : [ev]) {
      const [x, y] = punto(e), d = Math.hypot(x - ult[0], y - ult[1]);
      if (d < 1) continue;
      trazo(ult[0], ult[1], x, y);
      const antes = celdas.size;
      for (let s = 0; s <= d; s += 6) marcar(ult[0] + (x - ult[0]) * s / d, ult[1] + (y - ult[1]) * s / d);
      marcar(x, y);
      if (Math.floor(celdas.size / 6) > Math.floor(antes / 6)) navigator.vibrate?.(4);
      recorrido += d; ult = [x, y];
    }
    if (celdas.size >= META) completar();
  });
  // un toque sin arrastrar sobre el vidrio abre el teaser (como antes); un arrastre no
  zona.addEventListener('pointerup', ev => { const toque = ult && recorrido < 10 && dentro(punto(ev)); ult = null; if (toque && !unido) a.click(); });
  zona.addEventListener('pointercancel', () => { ult = null; });
  function completar() {
    unido = true; ult = null; sinPista();
    S.inscrito = true; save();
    navigator.vibrate?.([12, 40, 18]);
    const suave = !reduced();
    cv.animate(suave ? [{ opacity: 1, filter: 'blur(0)' }, { opacity: 0, filter: 'blur(8px)' }] : [{ opacity: 1 }, { opacity: 0 }], { duration: 700, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
    if (suave) $$(a, 'img').find(i => /de espaldas/.test(i.alt))?.animate([{ transform: 'translateY(6px) scale(.97)' }, { transform: 'none' }], { duration: 800, delay: 150, easing: 'cubic-bezier(.2,.9,.3,1.1)', fill: 'backwards' });
    // revelado todo: la misma pantalla que «Únete al reto» («¡Ya estás dentro!» con confeti)
    const capa = root.closest('.layer');
    setTimeout(() => { if (capa?.isConnected) go('listo', { nueva: true, from: origen, conDedo: true }, 'fade'); }, 950);
  }
  // pista sin palabras: si nadie lo toca, un dedo fantasma limpia una franja tenue (no cuenta para unirse)
  if (reduced() || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(([e]) => {
    if (e.intersectionRatio < .6) return;
    io.disconnect();
    const t = setTimeout(() => { if (cv.isConnected && !unido && !recorrido) pista = fantasma(); }, 900);
    pista = { parar: () => clearTimeout(t) };
  }, { threshold: [.6] });
  io.observe(cv);
  function fantasma() {
    const dedo = document.createElement('span');
    dedo.className = 'vidrio-pista'; dedo.setAttribute('aria-hidden', 'true');
    a.appendChild(dedo);
    const ruta = t => [70 + 218 * t, 104 + 28 * Math.sin(t * Math.PI * 2)];
    let t0 = null, prev = ruta(0), raf;
    const paso = now => {
      t0 ??= now;
      const t = Math.min(1, (now - t0) / 1500), e = t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      const [x, y] = ruta(e);
      trazo(prev[0], prev[1], x, y, .45); prev = [x, y];
      dedo.style.transform = `translate(${x - 20}px, ${y - 20}px)`;
      if (t < 1) raf = requestAnimationFrame(paso); else parar();
    };
    dedo.animate([{ opacity: 0, scale: .7 }, { opacity: 1, scale: 1 }], { duration: 220, easing: 'ease-out' });
    raf = requestAnimationFrame(paso);
    function parar() { cancelAnimationFrame(raf); dedo.animate([{ opacity: 1 }, { opacity: 0, scale: 1.15 }], { duration: 260, easing: 'ease-in', fill: 'forwards' }).finished.then(() => dedo.remove()); }
    return { parar };
  }
}
/** Antes del 29: «¡Ya casi salimos!» solo en la última semana; antes, «¡Prepárate para salir!». */
function ánimo(root) {
  const dias = Math.ceil((new Date(2026, 10, 29) - new Date()) / 864e5);
  if (dias > 7) replaceText(root, /¡Ya casi salimos!/, '¡Prepárate para salir!');
}
/** Avatares apilados de «familias ya se unieron»: menos solape para que se lean las iniciales. */
function juntarAvatares(root) {
  $$(root, 'span').filter(sp => /^-\d+px$/.test(sp.style.marginLeft) && sp.style.borderRadius === '50%' && /^[A-ZÁÉÍÓÚÑ]$/.test(sp.textContent.trim()))
    .forEach(sp => { sp.style.marginLeft = '-4px'; });
  // y un poco de aire entre los avatares y el número, para que el último no lo tape
  $$(root, 'span').filter(sp => sp.style.display === 'flex' && [...sp.children].length >= 2 && [...sp.children].every(c => c.style.borderRadius === '50%'))
    .forEach(sp => { sp.style.marginRight = '6px'; });
}

// ---------- Hoy ----------
/** Filas del inicio de Theo que siguen de lado (misiones, cuentos, top 10): en el lienzo se salen de los 390 px.
 *  Se agrupan en un carrusel horizontal con imán, sin mover nada de su sitio. */
function carruseles(root) {
  const fila = new Map();
  [...root.children].forEach(el => {
    const l = parseFloat(el.style.left), t = parseFloat(el.style.top);
    if (el.tagName === 'NAV' || isNaN(l) || isNaN(t) || el.getAttribute('role') === 'group') return;
    if (/^(A|SPAN)$/.test(el.tagName) && el.offsetWidth < 380 && t > 450) (fila.get(t) || fila.set(t, []).get(t)).push(el);
  });
  // el top 10 trae número, portada y textos con tops distintos: van con la fila cuyo título está justo encima
  const filas = [...fila.entries()].filter(([, els]) => els.some(e => parseFloat(e.style.left) + e.offsetWidth > 392));
  const yDe = re => parseFloat([...root.children].find(el => re.test(el.textContent.trim()))?.style.top);
  const t0 = yDe(/^Top 10/), t1 = yDe(/^Tu racha$/);
  const enTop = t => t > t0 && t < t1;
  const top10 = [...fila.entries()].filter(([t]) => enTop(t)).flatMap(([, els]) => els);
  const grupos = filas.filter(([t]) => !enTop(t)).map(([, els]) => els);
  if (top10.length) grupos.push(top10);
  grupos.forEach(els => {
    const top = Math.min(...els.map(e => parseFloat(e.style.top)));
    const bottom = Math.max(...els.map(e => parseFloat(e.style.top) + e.offsetHeight));
    const right = Math.max(...els.map(e => parseFloat(e.style.left) + e.offsetWidth));
    const box = document.createElement('div'); box.className = 'theo-fila';
    Object.assign(box.style, { position: 'absolute', left: '0', top: (top - 12) + 'px', width: '100%', height: (bottom - top + 24) + 'px', zIndex: 2 });
    const pista = document.createElement('div');
    Object.assign(pista.style, { position: 'relative', width: (right + 16) + 'px', height: '100%' });
    els[0].before(box); box.appendChild(pista);
    els.forEach(e => { e.style.top = (parseFloat(e.style.top) - top + 12) + 'px'; pista.appendChild(e); });
  });
}

/** Héroe del inicio: los destacados de Theo se deslizan de lado (tres tarjetas, la del centro grande y las de los lados asomando).
 *  En el lienzo es una foto fija con dos tarjetas cortadas; aquí son tarjetas completas. */
function heroe(root) {
  const card = root.querySelector('[role=group][aria-label^="Camino a Belén"]');
  if (!card || parseFloat(card.style.top) > 200) return;
  const W = 256, H = 330, top = parseFloat(card.style.top);
  ['Destacado anterior', 'Evangelio del día,'].forEach(l => root.querySelector(`a[aria-label^="${l}"]`)?.remove());
  const box = document.createElement('div'); box.className = 'theo-heroe';
  box.setAttribute('role', 'region'); box.setAttribute('aria-roledescription', 'carrusel'); box.setAttribute('aria-label', 'Destacados');
  Object.assign(box.style, { position: 'absolute', left: '0', top: (top - 10) + 'px', width: '100%', height: (H + 30) + 'px', zIndex: 2 });
  const pista = document.createElement('div'); pista.className = 'theo-heroe-pista';
  pista.style.padding = `10px ${(390 - W) / 2}px 20px`;
  const tarjeta = (label, inner) => { const a = document.createElement('a'); a.href = '#'; a.className = 'theo-heroe-t'; a.setAttribute('aria-label', label); a.innerHTML = inner; return a; };
  const lampara = tarjeta('Destacado: Lámpara para mis pasos, afirmación',
    `<img src="assets/miniaturas.webp" alt="" style="position:absolute;left:-1405px;top:-4px;width:2707px;height:337px;max-width:none">
     <span class="theo-heroe-pie" style="background:linear-gradient(180deg,rgba(74,52,18,0),rgba(74,52,18,.92) 46%)"><b>Lámpara para mis pasos</b><i>Afirmación · Tu palabra es luz en mi camino</i></span>`);
  const evangelio = tarjeta('Destacado: Evangelio del día',
    `<img src="assets/evangelio.webp" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 0">`);
  card.style.position = 'relative'; card.style.left = card.style.top = '0'; card.style.flex = 'none';
  card.before(box); box.appendChild(pista);
  pista.append(lampara, card, evangelio);
  // las de los lados se ven más pequeñas, pegadas hacia el centro (como en Theo)
  const slides = [lampara, card, evangelio];
  const pinta = () => {
    const c = pista.scrollLeft + pista.clientWidth / 2;
    slides.forEach(sl => {
      const d = (sl.offsetLeft + W / 2 - c) / (W + 16); const k = 1 - Math.min(Math.abs(d), 1) * .285;
      sl.style.transformOrigin = d < 0 ? '100% 50%' : '0% 50%'; sl.style.transform = `scale(${k})`;
      const lado = Math.abs(d) > .5;
      sl.setAttribute('aria-hidden', lado ? 'true' : 'false'); sl.classList.toggle('lado', lado);
      $$(sl, 'a').concat(sl.tagName === 'A' ? [sl] : []).forEach(a => { a.tabIndex = lado ? -1 : 0; });
    });
  };
  let raf = 0; pista.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(pinta); }, { passive: true });
  pista.scrollLeft = card.offsetLeft - (390 - W) / 2; pinta();
  // tocar una tarjeta del lado la trae al centro; la del centro se abre
  slides.forEach(sl => sl.addEventListener('click', ev => {
    if (sl.getAttribute('aria-hidden') === 'true') { ev.preventDefault(); ev.stopImmediatePropagation(); pista.scrollTo({ left: sl.offsetLeft - (390 - W) / 2, behavior: reduced() ? 'auto' : 'smooth' }); }
  }, true));
  return { lampara, evangelio };
}

/** Póster de la temporada: del 29 nov al 6 ene el destacado cambia cada semana (solo el kicker; el título sigue).
 *  Teodoro va encima con su recorte original; los claros se oscurecen un poco para la noche. Las poses y la batería
 *  siguen en la pieza grande de Hoy y en la tab Teodoro. `hasta` = último día del calendario (S.hoy) de cada póster. */
const NAVIDAD = { fondo: 'navidad', abajo: true, alt: 'Teodoro celebra junto al Niño Jesús en el pesebre, con María y José', teo: 'a98be2e11e018975563512bddc52be5a', claro: true, teoCss: 'left:24%;top:21%;height:37%', sombra: 'left:12%;top:56.6%;width:24%' };
const POSTERS = [
  { hasta: 7, kicker: '1.ª semana · Esperanza', fondo: 's1-estela', alt: 'La estrella de Belén enciende el farol de Teodoro', teo: 'c0b753e9a2d8d857108e5116baf8e8cc', teoCss: 'left:71%;top:14.5%', sombra: 'left:57%;top:56.6%' },
  { hasta: 14, kicker: '2.ª semana · Paz', fondo: 's2-mapa', abajo: true, alt: 'Teodoro con su mapa y un camino de piedras doradas hasta Belén', teo: '2a0a0137c06293e31b84c587a73c958c', claro: true, teoCss: 'left:27%', sombra: 'left:12%;top:57.8%' },
  { hasta: 21, kicker: '3.ª semana · Alegría', fondo: 's3-pastores', alt: 'Teodoro celebra entre ovejitas que saltan en el campo de los pastores', teo: 'ceb3307f345f840e51bb2c383aae1f04', sombra: 'left:36%;top:57.8%' },
  { hasta: 25, kicker: '4.ª semana · Amor', fondo: 's4-puerta', abajo: true, alt: 'Teodoro llega a la puerta de Belén detrás de María y José', teo: '57acbcf795f5e41b9eee8c841c7e2fcc', teoCss: 'left:27%', sombra: 'left:13%;top:57.8%' },
  { hasta: 26, kicker: 'Nochebuena', fondo: 'nochebuena', alt: 'Teodoro mira la luz que sale del portal de Belén', teo: 'cd7abd57ac6154597b18285ae710d7ba', claro: true, teoCss: 'left:73%', sombra: 'left:59%;top:57.8%' },
  { hasta: 27, kicker: '¡Feliz Navidad!', ...NAVIDAD }, // solo el 25 de diciembre
  { hasta: 33, kicker: 'Tiempo de Navidad', ...NAVIDAD },
  { hasta: GRACIA_FIN, kicker: 'Tiempo de Navidad', fondo: 'enero', alt: 'Teodoro con su mapa sigue la estrella de Belén', teo: '42fcde792c2c52338da55536a09cafd0', claro: true, teoCss: 'left:73%', sombra: 'left:59%;top:57.8%' },
];
const posterDeHoy = () => ['camino', 'gracia'].includes(fase()) ? POSTERS.find(p => S.hoy <= p.hasta) : null;

/** Destacado del carrusel (lienzo «Inicio real»): fondo de Belén de noche con degradado abajo, Teodoro con el farol,
 *  «Adviento en familia», «Camino a Belén» y un botón amarillo. Igual en modo claro y oscuro.
 *  Los botones de siempre siguen debajo, ocultos: el nuevo los toca para no cambiar lo que hace cada uno. */
async function heroeNuevo(root) {
  const card = root.querySelector('.theo-heroe [role=group][aria-label^="Camino a Belén"]');
  if (!card || card.querySelector('.heroe-pre')) return;
  const st = cardState(), antes = fase() === 'antes';
  const unirse = !S.inscrito;
  // sin empezar (sin unirse, antes del 29 o sin ningún cuento visto): invitación que cambia cada día entre el farol y la fiesta
  const sinEmpezar = unirse || antes || vistos() === 0;
  const recuerdo = fase() === 'recuerdo' && sinEmpezar; // ya no hay a qué unirse: el regalo es el nacimiento
  const texto = recuerdo ? 'Ver el nacimiento' : unirse ? 'Unirme gratis' : (!antes && vistos() === 0) ? 'Iniciar la aventura' : (!antes && st.cta && !/^Unirme/.test(st.cta)) ? st.cta : 'Seguir la aventura';
  const tema = dark() ? 'noche' : 'dia';
  const recarga = S.pilaVista != null && S.bateria > S.pilaVista;
  const escena = sinEmpezar
    ? (((S.hoy % 2) + 2) % 2 === 0 ? null : `assets/pila/dias-0-${tema}.webp`) // días pares: farol; impares: felicidad explosiva
    : `assets/pila/${recarga ? 'reactivado' : `dias-${pasoTeodoro()}`}-${tema}.webp`;
  const original = antes ? find(card, S.inscrito ? 'Entrar' : 'Unirme gratis') : [...card.querySelectorAll('a')].find(x => x.getAttribute('aria-label') !== 'Ver el camino' && !/Energía/.test(x.getAttribute('aria-label') || ''));
  const ver = card.querySelector('a[aria-label="Ver el camino"]');
  const accion = () => { if (recuerdo) { go('reproductor', { day: 26, nacimiento: true, replay: true }, 'up'); return; } if (antes && S.inscrito) { go('listo', {}, 'push'); return; } (original || ver)?.click(); };
  const capa = document.createElement('div'); capa.className = 'heroe-pre';
  const flecha = unirse && !recuerdo ? '' : '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const destello = '<svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24"><path fill="#F5DB78" d="M12 0c.9 6.6 4.8 10.6 12 12-7.2 1.4-11.1 5.4-12 12-.9-6.6-4.8-10.6-12-12C7.2 10.6 11.1 6.6 12 0Z"/></svg>';
  const poster = posterDeHoy();
  // hasta que la familia empieza el reto (sin unirse, o unida sin ningún cuento visto) el destacado es el póster del evento:
  // es su publicidad, con el logo; ya en camino, el póster de la temporada
  const evento = sinEmpezar && poster ? await posterEvento() : '';
  const boton = `<a href="#" class="hp-boton"><span>${texto}</span>${flecha}</a>`;
  if (!card.isConnected || card.querySelector('.heroe-pre')) return;
  capa.innerHTML = evento ? evento + boton : (poster
      ? `<img class="hp-fondo${poster.abajo ? ' hp-abajo' : ''}" src="assets/poster/${poster.fondo}.webp" alt="${poster.alt}">`
        + (poster.sombra ? `<span class="hp-sombra" style="${poster.sombra}" aria-hidden="true"></span>` : '')
        + `<img class="hp-teo${poster.claro ? ' hp-claro' : ''}" src="${A(poster.teo)}" style="${poster.teoCss || ''}" alt="">`
      : escena
      ? `<img class="hp-fondo hp-escena${(sinEmpezar || recarga || [0, 1, 2, 3, 4, 6, 7, 8, 9].includes(pasoTeodoro())) ? ' hp-baja' : ''}" src="${escena}" alt="${sinEmpezar ? 'Teodoro salta de alegría' : `Teodoro ${recarga ? 'recargándose de golpe' : ESCENA_ALT[pasoTeodoro()]}`}">`
      : `<img class="hp-fondo" src="assets/inicio/card-superior-noche.webp" alt=""><img class="hp-teo" src="${A('c0b753e9a2d8d857108e5116baf8e8cc')}" alt="Teodoro con su farol">`)
    + (sinEmpezar || poster ? '' : `<img class="hp-bateria" src="${A(BATTERY_IDS[S.bateria])}" alt="Energía de Teodoro: ${S.bateria} de 5">`) + `
    <span class="hp-degradado" aria-hidden="true"></span>
    <div class="hp-texto"><span class="hp-kicker">${destello}<span>${poster ? poster.kicker : recuerdo ? 'Nos vemos en Adviento' : 'Adviento en familia'}</span>${destello}</span><b class="hp-titulo">Camino a Belén</b></div>
    ${boton}`;
  card.appendChild(capa);
  capa.querySelector('.hp-boton').addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); accion(); });
  capa.addEventListener('click', ev => { if (ev.target.closest('.hp-boton')) return; ev.preventDefault(); accion(); });
  card.setAttribute('aria-label', `Camino a Belén, ${evento ? 'El Adviento más grande del mundo' : poster ? poster.kicker : 'Adviento en familia'}:${recuerdo ? 'ver el nacimiento' : unirse ? 'únete gratis' : antes ? 'ya estás dentro, empieza el 29 de noviembre' : texto.toLowerCase()}`);
}

/** Póster del evento («El Adviento más grande del mundo», tablero del pre registro) sin su botón: la publicidad del reto. */
async function posterEvento() {
  const f = await frag(F('P-Hoy-antes-d', 'P-Hoy-antes-d-oscuro')[dark() ? 1 : 0]);
  const g = f.querySelector('[role=group][aria-label^="El Adviento más grande del mundo"]');
  if (!g) return '';
  const c = g.cloneNode(true);
  if (c.lastElementChild?.matches('a')) c.lastElementChild.remove(); // el botón lo pone el destacado
  // los enlaces del tablero quedan como piezas: el destacado entero es el que se toca
  c.querySelectorAll('a').forEach(a => { const sp = document.createElement('span'); sp.style.cssText = a.style.cssText; sp.append(...a.childNodes); a.replaceWith(sp); });
  return c.innerHTML;
}
/** El destacado dice qué es y en qué va la familia (antes solo había escena y botón). */
function tituloHeroe(root) {
  const card = root.querySelector('.theo-heroe [role=group][aria-label^="Camino a Belén"]');
  const panel = card && $$(card, 'div').find(d => /blur/.test(d.style.backdropFilter || d.style.webkitBackdropFilter || ''));
  if (!panel) return;
  const st = cardState(), n = walkDay() ?? Math.min(lastDay(), 26);
  const sub = fase() === 'antes' ? 'Empieza el 29 de noviembre' : st.sub || `Día ${n} de 26`;
  const t = document.createElement('div'); t.className = 'heroe-titulo';
  t.innerHTML = `<b>${st.title || 'Camino a Belén'}</b><span>${sub}</span>`;
  panel.prepend(t);
  // el panel creció con el título: Teodoro y su sombra suben para que no le tape las patas
  const escena = card.querySelector('a[aria-label="Ver el camino"]');
  if (escena) $$(escena, ':scope > img, :scope > span').filter(el => /^Teodoro/.test(el.alt || '') || el.tagName === 'SPAN').forEach(el => { el.style.top = (parseFloat(el.style.top) - 30) + 'px'; });
  // antes del 29 la etiqueta «EMPIEZA EN» sobra: el título ya lo dice
  const lab = $$(panel, 'span').find(sp => /^EMPIEZA EN$/.test(sp.textContent.trim())); if (lab) lab.style.display = 'none';
  // sin unirse con el camino ya en marcha: una barra vacía parece un fallo; y el botón no lleva flecha (es empezar, no seguir)
  if (st.key === 4 || (S.hoy >= 27 && st.key !== 6)) {
    const bar = panel.querySelector('[role=img][aria-label^="Día "]'); if (bar) bar.style.display = 'none';
    $$(panel, 'a svg').forEach(sv => { sv.style.display = 'none'; });
    card.querySelector('img[alt^="Energía de Teodoro"]')?.style.setProperty('display', 'none');
  }
  if (S.hoy >= 27 && st.key !== 6) card.querySelector('img[alt^="Energía de Teodoro"]')?.style.setProperty('display', 'none'); // en la gracia la energía sigue
}

/** «Mundos» en Misiones Diarias aparece al unirse al reto (antes o durante el camino); sin unirse no está. */
async function misionMundos(root) {
  const fila = () => [...root.children].filter(el => el.tagName === 'A' && el.style.top === '512px');
  let m = root.querySelector('a[aria-label^="Mundos"]');
  if (!S.inscrito && m) {
    const x = parseFloat(m.style.left); m.remove();
    fila().forEach(a => { const l = parseFloat(a.style.left); if (l > x) a.style.left = (l - 248) + 'px'; });
  } else if (S.inscrito && !m) {
    const f = await frag(F('R-Misiones', 'R-Misiones-oscuro')[dark() ? 1 : 0]);
    m = f.querySelector('a[aria-label^="Mundos"]');
    const primera = fila()[0];
    if (!m || !primera) return;
    fila().forEach(a => { a.style.left = (parseFloat(a.style.left) + 248) + 'px'; });
    m.style.left = '16px'; m.style.top = '512px';
    primera.before(m);
  }
}

register('hoy', {
  h1: /^Misiones Diarias$/, // el inicio de Theo no tiene título propio: la primera sección hace de encabezado
  file() {
    const t = dark() ? 1 : 0;
    // antes del 29: flujo 1 del lienzo «Pre registro · artes» (vidrio empañado antes de unirse; limpio después)
    if (fase() === 'antes') return (S.inscrito ? F('P-Hoy-despues-d', 'P-Hoy-despues-d-oscuro') : F('P-Hoy-antes-d', 'P-Hoy-antes-d-oscuro'))[t];
    if (S.regreso && S.inscrito) return F('V2-10-Regreso', 'V2-10-Regreso-oscuro')[t];
    return F('R-Hoy-completo', 'R-Hoy-completo-oscuro')[t];
  },
  async mount(root, p, layer) {
    tabs(root);
    if (fase() !== 'antes') seen('S-01-Hoy', 'S-01-Energia');
    await misionMundos(root);
    carruseles(root);
    const destacados = heroe(root);
    // antes del 29 el destacado es el póster del lienzo («El Adviento más grande del mundo»): sin unirse «Únete al reto»,
    // ya dentro «Seguir la aventura»; después, heroeNuevo (póster del evento hasta que la familia empieza el reto)
    if (fase() !== 'antes') { tituloHeroe(root); await heroeNuevo(root); }
    replaceText(root, /^Ces$/, S.nombre);
    root.querySelector('img[alt="Perfil de Ces"]')?.setAttribute('alt', `Perfil de ${S.nombre}`);
    paintEnergy(root);
    const r = racha();
    $$(root, '[aria-label^="Racha"]').forEach(el => {
      const num = $$(el, 'span').find(sp => sp.childElementCount === 0 && /^\d+( días)?$/.test(sp.textContent.trim()));
      if (num) num.textContent = /días/.test(num.textContent) ? `${r} ${r === 1 ? 'día' : 'días'}` : String(r);
      el.setAttribute('aria-label', `Racha de ${r} ${r === 1 ? 'día' : 'días'}`);
    });
    const perfil = root.querySelector(`img[alt="Perfil de ${S.nombre}"]`)?.parentElement;
    if (perfil) on(root, perfil, () => nota('Perfil de Theo', 'Ya existe en la app'));
    on(root, root.querySelector('[role=img][aria-label^="Racha"]'), () => nota('Racha de la app', 'Hacer Adviento suma a esta racha'));
    // lo que ya existe en Theo y aquí no cambia
    const theo = () => nota('Contenido de Theo', 'Ya existe en la app; aquí no cambia');
    if (destacados) Object.values(destacados).forEach(el => on(root, el, theo));
    ['El Cuento de hoy', 'La Afirmación de hoy', 'Compartir', 'Regalar Theo'].forEach(t => on(root, t, theo));
    $$(root, '.theo-fila a').filter(a => !a.dataset.bound && !/^Mundos/.test(a.getAttribute('aria-label') || '')).forEach(a => on(root, a, theo));
    // domingo con el camino: el «Evangelio del Día» de Theo es el mismo del camino → una sola vez, y lleva allá
    const hd = Math.min(Math.max(S.hoy, 0), 26);
    const ev = root.querySelector('a[aria-label="Evangelio del Día"]');
    if (ev && fase() !== 'antes' && S.inscrito && DAYS[hd]?.type === 'domingo') {
      const tag = textEl(ev, 'Gratis'); if (tag) tag.textContent = contentDone(hd) ? '✓ Hecho' : `Adviento · Día ${hd}`;
      ev.setAttribute('aria-label', `Evangelio del Día: es el del Camino a Belén, día ${hd}`);
      on(root, ev, () => entrar('hoy'));
    } else if (ev) on(root, ev, theo);

    if (fase() === 'antes') {
      startCountdown(root);
      juntarAvatares(root);
      // sin unirse: «Únete al reto» (póster y card) → «¡Ya estás dentro!»; ya dentro: «Seguir la aventura» abre Mundos con la cuenta regresiva
      on(root, 'Únete al reto', (ev, el) => inscribir(el));
      on(root, 'Seguir la aventura', () => go('mundos', {}, 'push'));
      on(root, 'Ver el camino', () => S.inscrito ? go('mundos', {}, 'push') : go('teaser', {}, 'modal'));
      on(root, 'Camino a Belén: se revela al unirte al reto', () => go('teaser', {}, 'modal'));
      on(root, root.querySelector('a[aria-label^="Mundos"]'), () => go('mundos', {}, 'push'));
      if (S.inscrito && p.limpiar) vidrio(root, p.limpiar);
      if (!S.inscrito) vidrioConDedo(root, 'hoy');
      if (!S.inscrito && !S.teaserVisto) { S.teaserVisto = true; save(); await wait(900); if (layer.isConnected) go('teaser', {}, 'modal'); }
      return;
    }

    if (!S.inscrito && !S.tardeVisto && S.hoy >= 1 && S.hoy <= GRACIA_FIN) { S.tardeVisto = true; save(); setTimeout(async () => { const c = await import('./core.js'); if (!S.inscrito && c.cur?.name === 'hoy' && c.cur.layer === layer) go('teaser', { tarde: true }, 'modal'); }, 900); }
    const n = walkDay() ?? Math.min(lastDay(), 26); // donde va Teodoro
    // la tarjeta del camino sale dos veces (destacado y tarjeta grande): las dos con el mismo estado
    const cards = $$(root, '[role=group][aria-label^="Camino a Belén"]');
    const { st } = cards.length ? cards.map(c => paintCaminoCard(c, 'hoy'))[0] : { st: cardState() };
    // Misiones Diarias: Mundos va primero del 29 nov al 26 dic; al terminar el día queda hecha
    const mundos = root.querySelector('a[aria-label^="Mundos"]');
    if (mundos) {
      const hecha = st.done || st.key === 5;
      const tag = textEl(mundos, 'Descúbrelo');
      // el chip es la lista de pendientes de los niños: cambia con el día
      if (tag) {
        if (hecha) { tag.textContent = '✓ Hecha'; Object.assign(tag.style, { background: '#0A8445', color: '#FFFFFF' }); }
        else if (st.key === 4) tag.textContent = 'Descúbrelo';
        else if (st.key === 7 || st.key === 8) tag.textContent = 'Volver a ver';
        else if (st.key === 6) tag.textContent = `Día ${n}`;
        else if (st.sorpresa) tag.textContent = 'Juego sorpresa';
        else tag.textContent = `Día ${n}`;
      }
      mundos.setAttribute('aria-label', `Mundos: Adviento, día ${n} de 26${hecha ? ' · hecha' : ''}`);
      on(root, mundos, () => go('mundos', { from: 'hoy' }, 'push'));
    }
    on(root, 'Energía de Teodoro', () => toast(`Energía: ${S.bateria} de 5`, ['Dormido', 'Cabeceando', 'Agotado', 'Tranquilo', 'Travieso', 'Feliz'][S.bateria]));

    // Modal de regreso (una semana o más sin caminar)
    if (S.regreso && fase() !== 'recuerdo') {
      const nums = [...root.children].filter(el => el.style.top === '528px');
      const boxes = [...root.children].filter(el => el.style.top === '482px' && el.querySelector('img'));
      const more = [...root.children].find(el => /^\+\d+$/.test(el.textContent.trim()));
      const pend = pendientes();
      nums.forEach((el, i) => { el.textContent = String(n + i); el.style.visibility = n + i <= lastDay() ? '' : 'hidden'; });
      boxes.forEach((el, i) => { const ic = iconOf(n + i, dark()); const im = el.querySelector('img'); if (ic && im) im.src = A(ic); el.style.visibility = n + i <= lastDay() ? '' : 'hidden'; el.style.animation = `pop .45s ${.3 + i * .15}s cubic-bezier(.2,.9,.3,1.3) both`; });
      if (more) { if (pend > 3) { more.textContent = `+${pend - 3}`; more.setAttribute('aria-label', `y ${pend - 3} días más`); } else more.style.visibility = 'hidden'; }
      root.querySelector('[role=dialog]')?.setAttribute('aria-label', `Volviste. Te guardé el camino: te esperan ${pend} días`);
      const close = () => { S.regreso = false; save(); };
      on(root, 'Empezar por el día', () => { close(); go('mapa', { from: 'hoy', despierta: true }, 'push'); });
      setText(root, /Empezar por el día \d+/, n === Math.min(S.hoy, 26) ? 'Empezar por hoy' : `Seguir al día ${n}`); // se empieza por hoy, donde está Teodoro
      on(root, 'Ver el mapa', () => { close(); go('mapa', { from: 'hoy', despierta: true }, 'push'); });
      on(root, 'Cerrar', () => { close(); go('hoy', {}, 'fade', { replace: true }); });
      const teo = $$(root, 'img').find(i => i.src.includes(IMG.tCelebra));
      teo?.classList.add('a-hop');
    }
  },
});

/** Escena de Teodoro según los días sin caminar (0 a 10): de la fiesta a una tragedia chistosa que termina congelado.
 *  Con pila: paso = 5 − pila (0–4); con la pila en 0: los días sin caminar (5–10). «Reactivado» la primera vez que la pila sube.
 *  Una imagen cuadrada por paso, de día y de noche; cada pieza recorta su parte (Teodoro arriba, sobre el panel). */
const ESCENA_ALT = ['feliz a reventar', 'en marcha hacia la aventura', 'listo para salir', 'tomando café, serio, esperándote', 'impaciente, mirando el reloj',
  'dormido en el suelo, sin energía', 'envuelto en telarañas de tanto esperar', 'cubierto de musgo de tanto esperar', 'atrapado en una ventisca', 'lleno de carámbanos', 'congelado en un bloque de hielo'];
export const pasoTeodoro = () => S.bateria > 0 ? 5 - S.bateria : Math.max(5, Math.min(10, S.sinCaminar || 0));
// solo los pasos con imagen aprobada por César; el resto conserva la ilustración original de Teodoro
const APROBADAS = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 'R']); // aprobadas por César (23-oct-2026)
let pilaRecarga = null; // se decide una vez por pantalla: las dos piezas de Hoy muestran lo mismo
function escenaPila(card, scene) {
  const imgs = $$(scene, 'img'), land = imgs.find(i => !/^Teodoro/i.test(i.alt || ''));
  if (!land) return;
  if (pilaRecarga == null) { pilaRecarga = S.pilaVista != null && S.bateria > S.pilaVista; setTimeout(() => { S.pilaVista = S.bateria; save(); pilaRecarga = null; }, 0); }
  const tema = dark() ? 'noche' : 'dia';
  const paso = pilaRecarga ? 'R' : pasoTeodoro();
  if (!APROBADAS.has(paso)) return;
  const antes = { src: land.getAttribute('src'), style: land.getAttribute('style'), alt: land.alt };
  const otros = [...imgs.filter(i => i !== land), ...$$(scene, ':scope > span')];
  // si la imagen no carga, la ilustración de siempre
  land.onerror = () => {
    land.onerror = null; land.setAttribute('src', antes.src); land.setAttribute('style', antes.style); land.alt = antes.alt; otros.forEach(o => { o.style.display = ''; });
  };
  otros.forEach(o => { o.style.display = 'none'; });
  const destacado = !!card.closest('.theo-heroe'); // la pieza más estrecha: la escena sube un poco para que el panel no tape a Teodoro
  Object.assign(land.style, { left: '0', top: destacado ? '-22px' : '0', width: '100%', height: destacado ? 'calc(100% + 22px)' : '100%', objectFit: 'cover', objectPosition: '50% 0%', transform: 'none', maxWidth: 'none' });
  land.alt = `Teodoro ${pilaRecarga ? 'recargándose de golpe' : ESCENA_ALT[paso]}`;
  land.src = `assets/pila/${pilaRecarga ? 'reactivado' : `dias-${paso}`}-${tema}.webp`;
}

/** Tarjeta del camino (la misma en Hoy y en el tab Teodoro): paisaje con Teodoro, energía,
 *  barra de progreso (o pasitos si va atrasado) y un botón. Pinta el estado y conecta los toques. */
export function paintCaminoCard(card, from) {
  const st = cardState();
  const n = walkDay() ?? Math.min(lastDay(), 26);
  const pose = ['dormido', 'cabeceando', 'agotado', 'tranquilo', 'travieso', 'feliz'][S.bateria];
  const scene = card.querySelector('a[aria-label="Ver el camino"]');
  // Teodoro con la pose de su energía
  const teo = $$(scene || card, 'img').find(i => /^Teodoro/i.test(i.alt || ''));
  if (teo) { teo.src = teodoroImg(); teo.alt = `Teodoro ${pose}`; teo.classList.add('a-bob'); }
  paintEnergy(card);
  // progreso: días con trivia hechos de 26
  const prog = card.querySelector('[role=img][aria-label^="Día "]');
  // el relleno viene con el ancho en px del lienzo: se busca por su degradado y se pasa a %
  const bar = prog && ($$(prog, 'div').find(el => /%/.test(el.style.width)) || $$(prog, 'div').find(el => el.style.position === 'absolute' && /gradient/.test(el.style.backgroundImage)));
  if (bar) {
    const pct = (vistos() / 26 * 100).toFixed(1) + '%';
    const head = bar.nextElementSibling;
    // el avatar de Teodoro nunca se sale de la barra (en 0 % queda al inicio, en 100 % al final)
    const headAt = p => `clamp(0px, calc(${p} - 14px), calc(100% - 28px))`;
    bar.style.transition = 'width 1s cubic-bezier(.2,.8,.2,1)'; bar.style.width = '0%';
    if (head?.style.left) { head.style.transition = 'left 1s cubic-bezier(.2,.8,.2,1)'; head.style.left = headAt('0%'); }
    requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = pct; if (head?.style.left) head.style.left = headAt(pct); }));
    prog.setAttribute('aria-label', `Día ${n} de 26: ${vistos()} hechos, faltan ${26 - vistos()} para Belén`);
  }
  // atrasado: pasitos (✓ último hecho · Teodoro en su día · pendientes · hoy en dorado)
  const pasos = card.querySelector('[role=img][aria-label^="Vas en el día"]');
  if (pasos) {
    const nums = $$(pasos, 'span').filter(sp => /^\d+$/.test(sp.textContent.trim()));
    const hoy = Math.min(S.hoy, 26);
    if (nums.length >= 2) {
      const [pend, gold] = [nums[0], nums[nums.length - 1]];
      gold.textContent = String(hoy);
      if (n + 1 < hoy) pend.textContent = String(n + 1);
      else { pend.style.display = 'none'; if (pend.previousElementSibling) pend.previousElementSibling.style.display = 'none'; }
    }
    pasos.setAttribute('aria-label', `Vas en el día ${n} y hoy es el día ${hoy}: te esperan ${hoy - n + 1} días`);
  }
  if (st.key === 4) [card.querySelector('a[aria-label^="Energía de Teodoro"]'), prog, pasos].forEach(el => el?.style.setProperty('display', 'none'));
  card.setAttribute('aria-label', `Camino a Belén, día ${n} de 26`);
  // el botón dice lo que hará
  const btn = [...card.querySelectorAll('a')].find(a => /Continuar la Aventura/i.test(a.textContent));
  const primerDia = vistos() === 0; // aún no ha visto ningún cuento (no ha empezado)
  const label = st.cta ? st.cta : st.sorpresa ? 'Ir al juego sorpresa' : st.done ? 'Ver el camino' : primerDia ? 'Iniciar la aventura' : 'Continuar la aventura';
  const span = btn?.querySelector('span'); if (span) span.textContent = label; else if (btn) setText(btn, /Continuar la Aventura/i, label);
  // Navidad: el pesebre en la tarjeta
  if (S.hoy >= 27 && scene && st.key !== 6 && st.key !== 4 && st.key !== 8) {
    const land = $$(scene, 'img').find(i => !/^Teodoro/i.test(i.alt || ''));
    if (land) { land.src = A(IMG.nacimiento); land.alt = 'El nacimiento de Jesús'; Object.assign(land.style, { left: '0', top: '0', width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 35%' }); }
    if (teo) teo.style.display = 'none';
    $$(scene, 'span').forEach(sp => { sp.style.display = 'none'; });
  }
  const pesebre = S.hoy >= 27 && st.key !== 6 && st.key !== 4 && st.key !== 8;
  if (scene && !pesebre && fase() !== 'antes') escenaPila(card, scene);
  // pieza grande (Hoy y tab Teodoro, la misma): título del evento y en qué día va
  if (!card.closest('.theo-heroe') && fase() !== 'antes' && !card.querySelector('.card-titulo')) {
    const panel = $$(card, 'div').find(d => /blur/.test(d.style.backdropFilter || d.style.webkitBackdropFilter || ''));
    if (panel) {
      const t = document.createElement('div'); t.className = 'card-titulo';
      t.innerHTML = `<b>Camino a Belén</b><span>${st.key === 3 || st.key === undefined ? `Día ${n} de 26` : (st.sub || `Día ${n} de 26`)}</span>`;
      panel.prepend(t);
      // el panel crece hacia arriba lo que ocupa el título (si no, aplasta el botón)
      const h = parseFloat(panel.style.height), tp = parseFloat(panel.style.top);
      if (h) panel.style.height = (h + 34) + 'px';
      if (!isNaN(tp)) panel.style.top = (tp - 34) + 'px';
    }
  }
  const toMap = () => st.key === 5 || st.key === 7 ? go('reproductor', { day: 26, nacimiento: true, replay: true }, 'up') : st.sorpresa ? openSorpresa(Math.min(S.hoy, 26)) : entrar(from);
  if (scene) on(card, scene, toMap);
  if (btn) on(card, btn, toMap);
  const en = card.querySelector('a[aria-label^="Energía de Teodoro"]');
  if (en) on(card, en, () => toast(`Energía de Teodoro: ${S.bateria} de 5`, `Está ${pose}. Cada día que caminan juntos lo llena.`));
  return { st, toMap };
}

/** Tarjeta del camino en Hoy: menos información y más protagonismo visual. */
function simplifyCard(card) {
  if (!card || card.dataset.simple) return;
  const hero = [...card.children].find(el => el.style.top === '0px' && el.style.height === '200px');
  const body = [...card.children].find(el => el.style.top === '200px');
  if (!hero || !body) return;
  card.dataset.simple = '1';
  const H = 252, dy = H - 200;
  hero.style.height = H + 'px'; body.style.top = H + 'px';
  const [land, shadow, teo] = [...hero.children];
  // el paisaje crece en proporción y conserva el mismo encuadre (la imagen trae otro Teodoro fuera de cuadro)
  if (land?.tagName === 'IMG' && !/nacimiento/i.test(land.alt || '')) {
    const k = (260 + dy) / 260, l0 = parseFloat(land.style.left) || -263;
    land.style.width = (621 * k) + 'px'; land.style.height = (260 * k) + 'px'; land.style.left = (l0 * k) + 'px'; land.style.top = (-26 * k) + 'px';
  }
  [shadow, teo].forEach(el => { if (el) el.style.top = (parseFloat(el.style.top) + dy * .8) + 'px'; });
  if (teo) { teo.style.transform = 'scale(1.12)'; teo.style.transformOrigin = '50% 100%'; }
  const [headRow, progress] = [...body.children];
  if (progress && progress.tagName !== 'A') progress.style.display = 'none';
  const tile = headRow?.firstElementChild;
  if (tile && tile.querySelector('img') && !/Camino a Belén/.test(tile.textContent)) tile.style.display = 'none';
}

// ---------- Antes del 29 ----------
register('teaser', {
  h1: 'Camino a Belén',
  dismiss: () => back('hoy', 'fade'),
  files: F('P-Teaser-a', 'P-Teaser-a-oscuro'),
  mount(root, p = {}) {
    startCountdown(root);
    // desde la invitación: es la vista de tu amigo; tú ya estás inscrito
    const reg = find(root, 'Únete al reto') || find(root, 'Unirme gratis');
    if (p.preview) on(root, reg, () => { nota('Aquí tu amigo se inscribe', 'Tú ya estás dentro'); back('invitacion', 'fade'); });
    else if (p.tarde) on(root, reg, () => entrar('hoy'));
    else on(root, reg, (ev, el) => inscribir(el, p.from));
    // el camino ya salió y la familia no se ha unido: la misma ventana, como invitación a subirse en marcha
    if (p.tarde) {
      const caja = root.querySelector('[role=dialog]') || root.querySelector('[aria-label^="Camino a Belén empieza"]') || root;
      const tit = $$(caja, '*').find(el => el.childElementCount === 0 && el.textContent.trim() === 'Camino a Belén');
      if (tit) tit.textContent = S.hoy >= 27 ? '¡Aún llegas a Belén!' : '¡Ya salimos! ¿Vienes?';
      caja.setAttribute('aria-label', 'Camino a Belén ya salió: aún llegas');
      // fuera la cuenta regresiva: la caja más pequeña que tiene «EMPIEZA EN» y los minutos
      let cd = caja.querySelector('[aria-label^="Empieza en"]') || textEl(caja, /EMPIEZA EN/i); while (cd && cd !== caja && !/MINUTOS|min/i.test(cd.textContent)) cd = cd.parentElement;
      if (cd && cd !== caja) {
        const alto = cd.offsetHeight + (parseFloat(getComputedStyle(cd.parentElement).rowGap) || 0);
        cd.style.display = 'none';
        // la ventana se acorta lo mismo que medía la cuenta regresiva (sin hueco abajo)
        for (let el = cd.parentElement; el && el !== root.parentElement; el = el.parentElement) { const h = parseFloat(el.style.height); if (h > 300) { el.style.height = (h - alto) + 'px'; break; } }
      }
      // el texto trae negritas adentro: se cambia el párrafo entero
      const acomp = $$(caja, '*').filter(el => /^Acompaña a Teodoro 26 días/.test(el.textContent.trim())).pop();
      if (acomp) acomp.textContent = S.hoy >= 27 ? `${cuentaGracia(true)}. Teodoro te espera en el camino.` : 'Aún llegas a Belén. Teodoro te espera en el camino.';
    }
    on(root, 'Ahora no', () => back('hoy', 'fade'));
    on(root, 'Cerrar', () => back('hoy', 'fade'));
    tabs(root); appContent(root);
    ['Ver el camino', 'Ir al camino'].forEach(t => on(root, t, () => toast('Primero únete')));
    const hero = $$(root, 'img').find(i => i.src.includes(IMG.t5) || /Teodoro/.test(i.alt));
    hero?.classList.add('a-bob');
  },
});
// «¡Ya estás dentro!» (flujo 1 del pre registro): al unirse y cuando ya está dentro antes del 29
register('listo', {
  h1: '¡Ya estás dentro!',
  files: F('P-Listo-a', 'P-Listo-a-oscuro'),
  mount(root, p, layer) {
    startCountdown(root);
    if (p.nueva) { sparkles(root); confetti(layer, 195, 470, 28); }
    // vuelve a donde se unió (inicio o cuarto de Teodoro) y ahí el vidrio de la card se limpia
    const origen = p.from === 'teodoro' ? 'teodoro' : 'hoy';
    const volver = find(root, 'Volver al inicio');
    if (volver && origen === 'teodoro') { setText(volver, 'Volver al inicio', 'Volver al cuarto de Teodoro'); volver.setAttribute('aria-label', 'Volver al cuarto de Teodoro'); }
    on(root, volver, () => go(origen, { limpiar: p.nueva ? (p.conDedo ? 'dedo' : true) : false }, 'fade', { tab: true }));
    on(root, 'Invitar a la familia', () => go('invitacion', {}, 'push'));
  },
});
register('invitacion', {
  files: F('V2-Invitacion-claro', 'V2-Invitacion'),
  mount(root) {
    seen('Invitacion-imagen');
    on(root, 'Vista previa del enlace', () => { nota('Así lo ve tu amigo al tocar el enlace'); go('teaser', { preview: true }, 'modal'); });
    const flecha = document.createElement('button');
    flecha.type = 'button'; flecha.setAttribute('aria-label', 'Volver');
    flecha.style.cssText = 'position:absolute;left:4px;top:52px;width:48px;height:48px;border:0;background:transparent;cursor:pointer;z-index:5';
    root.appendChild(flecha);
    on(root, flecha, () => back(fase() === 'antes' ? 'listo' : 'hoy'));
    $$(root, '[style*="border-radius"]').slice(-3).forEach((el, i) => { el.classList.add('a-rise'); el.style.animationDelay = (.25 + i * .25) + 's'; });
  },
});

// ---------- Tab Teodoro y Mundos ----------
register('teodoro', {
  file() {
    const t = dark() ? 1 : 0;
    if (fase() === 'antes') return (S.inscrito ? F('V2-Pre-Teodoro-dentro-claro', 'V2-Pre-Teodoro-dentro') : F('V2-Pre-Teodoro-claro', 'V2-Pre-Teodoro'))[t];
    return (S.cuartoNuevo ? F('V3-Teodoro-nazaret', 'V3-Teodoro-nazaret-oscuro') : F('V3-Teodoro', 'V3-Teodoro-oscuro'))[t];
  },
  async mount(root, p = {}) {
    tabs(root);
    const n = walkDay() ?? Math.min(lastDay(), 26);
    replaceText(root, /Día 9 de 26/, `Día ${n} de 26`);
    replaceText(root, /^Día 9$/, `Día ${n}`);
    root.querySelector('a[aria-label^="Adviento:"]')?.remove(); // la isla vieja del cuarto: el lienzo ahora pone el ícono de Mundos
    const isla = S.inscrito ? islaAdviento(root) : null; // la puerta a Mundos aparece al unirse al reto
    quitarCorona(root);
    // la card de Adviento del tab Teodoro es SIEMPRE la misma del inicio (antes del 29: la del flujo 1 del pre registro)
    if (fase() === 'antes') await cardDelInicio(root);
    juntarAvatares(root);
    const tCard = root.querySelector('a[aria-label="Ver el camino"]')?.parentElement;
    // la pieza del camino es la misma que la de Hoy: igual de alta (402), y lo que va debajo baja lo mismo
    if (tCard && fase() !== 'antes') {
      const h0 = parseFloat(tCard.style.height), t0 = parseFloat(tCard.style.top), dh = 402 - h0;
      if (h0 && dh > 0) {
        [...tCard.parentElement.children].forEach(el => { const t = parseFloat(el.style.top); if (el !== tCard && !isNaN(t) && t > t0) el.style.top = (t + dh) + 'px'; });
        tCard.style.height = '402px';
        const pa = tCard.parentElement, ph = parseFloat(pa.style.height); if (ph) pa.style.height = (ph + dh) + 'px';
        const sc = tCard.querySelector('a[aria-label="Ver el camino"]'); if (sc && parseFloat(sc.style.height)) sc.style.height = (parseFloat(sc.style.height) + dh) + 'px';
      }
    }
    const { st, toMap } = tCard && fase() !== 'antes' ? paintCaminoCard(tCard, 'teodoro') : { st: cardState(), toMap: () => entrar('teodoro') };
    replaceText(root, /^Misiones Diarias$/, 'Misiones diarias');
    paintEnergy(root);
    patchCuarto(root);
    if (fase() === 'antes') { startCountdown(root); ánimo(root); }
    if (fase() === 'antes' && !dark()) { const mt = [...(root.firstElementChild?.children || [])].find(el => el.style.top === '574px') || textEl(root, 'Mundos')?.parentElement;
      if (mt) { mt.style.color = '#02254F'; $$(mt, '*').forEach(x => { x.style.color = '#02254F'; x.style.textShadow = 'none'; x.style.opacity = '1'; }); } }
    // antes del 29: el mundo Enero bloqueado sobra en el cuarto (se ve en Mundos); las misiones suben a su sitio
    const enero = textEl(root, 'Enero')?.closest('div[style*="top: 1064px"]');
    if (enero) {
      const cont = enero.parentElement, y = parseFloat(enero.style.top);
      enero.remove();
      // lo de abajo queda a 28 px de la tarjeta del camino (en oscuro el título de las misiones ya se montaba encima)
      const card = [...cont.children].find(el => el.getAttribute('role') === 'group' && /^Camino a Belén/.test(el.getAttribute('aria-label') || ''));
      const abajo = [...cont.children].filter(el => parseFloat(el.style.top) > y);
      const tope = Math.min(...abajo.map(el => parseFloat(el.style.top)));
      const dy = card ? tope - (parseFloat(card.style.top) + card.offsetHeight + 28) : 224;
      abajo.forEach(el => { el.style.top = (parseFloat(el.style.top) - dy) + 'px'; });
      for (let el = cont, h0 = parseFloat(cont.style.height); el && el !== root.parentElement; el = el.parentElement) if (parseFloat(el.style.height) === h0) el.style.height = (h0 - dy) + 'px';
    }
    // la isla del cuarto lleva a los mundos de Teodoro; el botón de la tarjeta, al camino
    if (isla) {
      on(root, isla, () => go('mundos', {}, 'push'));
      isla.querySelectorAll('span').forEach(sp => { if (/Día/.test(sp.textContent)) sp.style.display = 'none'; });
      isla.classList.add('a-bob');
    }
    // la puerta a Mundos siempre lleva el ícono de Mundos (el planeta), nunca la isla
    $$(root, 'a[aria-label="Ver mis mundos"] img').slice(0, 1).forEach(i => { i.src = 'assets/mundos.webp'; i.style.objectFit = 'contain'; });
    on(root, 'Ver mis mundos', () => go('mundos', {}, 'push'));
    if (fase() === 'antes') {
      // los mismos botones que la card del inicio
      on(root, 'Únete al reto', (ev, el) => inscribir(el, 'teodoro'));
      on(root, 'Seguir la aventura', () => go('mundos', {}, 'push'));
      on(root, 'Ver el camino', () => S.inscrito ? go('mundos', {}, 'push') : go('teaser', { from: 'teodoro' }, 'modal'));
      on(root, 'Camino a Belén: se revela al unirte al reto', () => go('teaser', { from: 'teodoro' }, 'modal'));
      if (S.inscrito && p.limpiar) vidrio(root, p.limpiar); // recién unido desde el cuarto: el vidrio se limpia aquí
      if (!S.inscrito) vidrioConDedo(root, 'teodoro'); // la misma card que el inicio: también se limpia con el dedo
    }
    on(root, 'Toca para descubrir', () => go('teaser', { from: 'teodoro' }, 'modal'));
    on(root, 'Inscribirme', (ev, el) => inscribir(el, 'teodoro')); on(root, 'Unirme gratis', (ev, el) => inscribir(el, 'teodoro'));
    on(root, 'Ver Camino a Belén', () => go('listo', {}, 'push'));
    on(root, 'Invitar', () => go('invitacion', {}, 'push'));
    on(root, 'Entrar', () => entrar('teodoro'));
    $$(root, 'img').filter(i => /Teodoro/.test(i.alt || '')).slice(0, 1).forEach(i => i.classList.add('a-bob'));
    // prendas ganadas en la ruleta, visibles en el cuarto
    if (S.prendas.length > (S.prendasVistas || 0)) { S.prendasVistas = S.prendas.length; save(); toast('Tu cuarto', `Prendas ganadas: ${S.prendas.map(id => PRENDAS.find(p => p.id === id)?.nombre.replace(/^un[a]? /, '')).join(', ')}`); }
  },
});
/** Antes del 29 la card del tab Teodoro se trae del tablero del inicio (vidrio empañado sin unirse; Teodoro de espaldas ya dentro) y va en el mismo sitio. */
async function cardDelInicio(root) {
  const vieja = root.querySelector('[role=group][aria-label^="Camino a Belén"]');
  if (!vieja) return;
  const f = await frag((S.inscrito ? F('P-Hoy-despues-d', 'P-Hoy-despues-d-oscuro') : F('P-Hoy-antes-d', 'P-Hoy-antes-d-oscuro'))[dark() ? 1 : 0]);
  const nueva = [...f.querySelectorAll('[role=group][aria-label^="Camino a Belén"]')].pop(); // la de abajo: la primera (ya dentro) es el póster
  if (!nueva) return;
  const t0 = parseFloat(vieja.style.top), h0 = vieja.offsetHeight || parseFloat(vieja.style.height), h1 = parseFloat(nueva.style.height);
  nueva.style.top = vieja.style.top; nueva.style.left = vieja.style.left;
  const pa = vieja.parentElement;
  vieja.replaceWith(nueva);
  // si cambia el alto, lo de abajo se corre lo mismo
  const dh = h1 - h0;
  if (dh && !isNaN(dh)) {
    [...pa.children].forEach(el => { const t = parseFloat(el.style.top); if (el !== nueva && !isNaN(t) && t > t0) el.style.top = (t + dh) + 'px'; });
    for (let el = pa; el && el !== root.parentElement; el = el.parentElement) { const h = parseFloat(el.style.height); if (h) el.style.height = (h + dh) + 'px'; }
  }
}
/** El acceso a Mundos en el cuarto de Teodoro: el mismo ícono de Mundos de Misiones Diarias, junto a la cama (lienzo «Tab Teodoro»). */
function islaAdviento(root) {
  const cuarto = $$(root, 'img').find(i => /^Tab Teodoro|^Cuarto de Nazaret/.test(i.alt || ''));
  if (!cuarto) return null;
  const a = document.createElement('a');
  a.setAttribute('aria-label', 'Mundos de Teodoro');
  // 48 px de ícono con 44 px de toque mínimo garantizado
  a.style.cssText = 'position:absolute;left:332px;top:194px;width:48px;height:48px;display:block;text-decoration:none;z-index:7';
  a.innerHTML = '<img alt="" src="assets/mundos.webp" style="position:absolute;left:0;top:0;width:48px;height:48px;filter:drop-shadow(0 8px 10px rgba(0,8,43,.3))">';
  root.appendChild(a);
  return a;
}
/** La corona de Adviento con velas sobre la mesa de noche (dibujada en el adorno del cuarto): fuera. */
function quitarCorona(root) {
  const deco = $$(root, 'svg').find(s => s.getAttribute('width') === '390' && s.style.pointerEvents === 'none');
  if (!deco) return;
  [...deco.querySelectorAll('circle, rect, path, ellipse')].forEach(el => {
    if (el.closest('defs')) return;
    let b; try { b = el.getBBox(); } catch { return; }
    const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
    if (!el.closest('g[transform]') && cx > 290 && cx < 372 && cy > 150 && cy < 216) el.remove();
  });
}
/** El cuarto de Teodoro trae nombre, racha y panes pintados en la imagen: se tapan con los datos reales (mismo estilo que Hoy). */
function patchCuarto(root) {
  const bg = $$(root, 'img').find(i => /^Tab Teodoro/.test(i.alt || ''));
  const POS = { gorro: 'left:150px;top:96px;width:84px;transform:rotate(-8deg)', bufanda: 'left:140px;top:222px;width:102px', bolso: 'left:236px;top:268px;width:62px;transform:rotate(10deg)', paja: 'left:268px;top:312px;width:100px' };
  // de pie (3 a 5 de energía) lleva gorro y bufanda; cansado o dormido, el bolso queda en el piso
  const dePie = S.bateria >= 3 || !!bg;
  if (!dePie) POS.bolso = 'left:262px;top:330px;width:58px;transform:rotate(-6deg)';
  const ponerPrendas = () => S.prendas.forEach(id => { const pr = PRENDAS.find(x => x.id === id); if (!pr || !POS[id] || (!dePie && (id === 'gorro' || id === 'bufanda'))) return; const im = document.createElement('img'); im.src = A(pr.img); im.alt = `Teodoro lleva ${pr.nombre}`; im.className = 'cuarto-patch prenda'; im.style.cssText = POS[id] + ';height:auto;z-index:' + (id === 'paja' ? 1 : 5); root.appendChild(im); });
  if (!bg) {
    // Cuarto de Nazaret: los datos son texto y Teodoro va suelto (su pose sigue a la batería)
    replaceText(root, /^Ces$/, S.nombre);
    // las píldoras de arriba eran texto blanco sobre beige translúcido (no se leían): fondo azul noche translúcido
    [...root.children].filter(el => { const t = parseFloat(el.style.top); return t >= 40 && t <= 62 && el.offsetHeight <= 52; })
      .flatMap(el => el.style.display === 'flex' && !el.style.background ? [...el.children] : [el])
      .forEach(el => { Object.assign(el.style, { background: 'rgba(14,42,72,.62)', backdropFilter: 'blur(10px)', webkitBackdropFilter: 'blur(10px)', color: '#FFFFFF' });
        const av = $$(el, 'span, div').find(x => x.style.borderRadius === '50%' && !x.textContent.trim() && !x.querySelector('img'));
        if (av) { av.textContent = S.nombre[0]; Object.assign(av.style, { display: 'grid', placeItems: 'center', color: '#FFFFFF', font: '700 16px Mulish, sans-serif' }); } });
    const rp = root.querySelector('[aria-label^="Racha"]');
    if (rp) { const tn = [...rp.querySelectorAll('*'), rp].flatMap(e => [...e.childNodes]).find(c => c.nodeType === 3 && /^\s*\d+\s*$/.test(c.nodeValue)); if (tn) tn.nodeValue = String(racha()); rp.setAttribute('aria-label', `Racha: ${racha()} días`); }
    const teo = $$(root, 'img').find(i => /^Teodoro en su Cuarto/.test(i.alt || ''));
    if (teo && S.bateria < 5) teo.src = teodoroImg();
    ponerPrendas();
    const pn = document.createElement('div'); pn.className = 'cuarto-patch'; pn.textContent = String(S.panes); pn.setAttribute('aria-label', `${S.panes} panes`);
    pn.style.cssText = 'left:336px;top:524px;width:40px;height:24px;background:rgb(251,242,229);color:#4A2E14;display:grid;place-items:center;font:800 15px Mulish,sans-serif';
    root.appendChild(pn);
    return;
  }
  const add = (html, css) => { const d = document.createElement('div'); d.className = 'cuarto-patch'; d.style.cssText = css; d.innerHTML = html; root.appendChild(d); return d; };
  add(`<span aria-hidden="true" style="width:35px;height:35px;border-radius:50%;background:linear-gradient(135deg,#F5D46A,#E2BE55);display:grid;place-items:center;color:#FFFFFF;font-size:16px">${S.nombre[0]}</span>${S.nombre}`,
    'left:16px;top:54px;height:46px;padding:0 18px 0 5px;border-radius:40px;background:#FFFFFF;box-shadow:inset 0 0 0 3px #F4E291,0 4px 12px rgba(0,8,43,.12);color:#1E8DA5;display:flex;align-items:center;gap:8px;font:700 18px "Neue Montreal",Mulish,sans-serif;letter-spacing:.6px')
    .setAttribute('aria-label', `Perfil: ${S.nombre}`);
  add(`${racha()}<svg aria-hidden="true" width="16" height="20" viewBox="0 0 24 30"><path d="M12 1C13 8 21 11 21 19a9 9 0 0 1-18 0c0-5 3-7 4-11 2 3 3 4 3 6 1-4 2-8 2-13Z" fill="#F28C28"/><path d="M12 14c1 4 5 5 5 9a5 5 0 0 1-10 0c0-3 2-4 2-6 1 1 2 2 2 3 0-2 1-4 1-6Z" fill="#FFC94A"/></svg>`,
    'left:206px;top:55px;width:74px;height:44px;border-radius:22px;background:#1F7F95;display:flex;align-items:center;justify-content:center;gap:4px;color:#FFFFFF;font:700 18px "Neue Montreal",Mulish,sans-serif;box-shadow:0 4px 12px rgba(0,8,43,.12)')
    .setAttribute('aria-label', `Racha: ${racha()} días seguidos`);
  // prendas ganadas en la ruleta: Teodoro las lleva puestas (la cama de paja va en el suelo)
  ponerPrendas();
  add(String(S.panes), 'left:336px;top:520px;width:40px;height:24px;background:rgb(251,242,229);color:#4A2E14;display:grid;place-items:center;font:800 15px Mulish,sans-serif')
    .setAttribute('aria-label', `${S.panes} panes`);
}
register('mundos', {
  // antes del 29: Enero y Adviento con candado y la cuenta regresiva sobre Adviento
  // desde Hoy (sin mascota): Mundos con «volver a Hoy» y la pestaña Hoy encendida
  file(p = {}) {
    if (p.from === 'hoy' && fase() !== 'antes') return F('R-Mundos', 'R-Mundos-oscuro')[dark() ? 1 : 0];
    return (fase() === 'antes' ? F('V2-02-Mundos-pre-claro', 'V2-02-Mundos-pre') : F('V2-02-Mundos-claro', 'V2-02-Mundos'))[dark() ? 1 : 0];
  },
  mount(root, p = {}) {
    tabs(root);
    on(root, 'Volver a Hoy', () => back('hoy'));
    const adv = root.querySelector('a[aria-label^="Adviento:"]');
    // Adviento más grande y centrado; Enero se sigue viendo detrás, con su etiqueta encima (estilos en el bloque «mapa» de app.css)
    root.classList.add('mundos-v'); if (fase() === 'antes') root.classList.add('mundos-pre');
    if (fase() === 'antes') {
      startCountdown(root);
      // debajo del contador: volver al inicio (como en la espera)
      const vuelta = document.createElement('button'); vuelta.type = 'button'; vuelta.className = 'mundos-volver';
      vuelta.innerHTML = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10v9h11v-9"/></svg><span>Volver al inicio</span>';
      root.appendChild(vuelta); on(root, vuelta, () => go('hoy', {}, 'down', { tab: true }));
      const ms = Math.max(0, new Date(2026, 10, 29) - new Date());
      adv?.setAttribute('aria-label', `Adviento: empieza el 29 de noviembre. Faltan ${Math.floor(ms / 864e5)} días`);
      // sin unirse abre la invitación; ya dentro, solo recuerda cuándo se sale
      on(root, adv, () => S.inscrito ? toast('Empieza el 29 de noviembre') : go('teaser', {}, 'modal'));
    } else {
      const n = walkDay() ?? Math.min(lastDay(), 26);
      replaceText(root, /Día 9 de 26/, `Día ${n} de 26`);
      adv?.setAttribute('aria-label', `Adviento: Camino a Belén, día ${n} de 26. Entrar al camino`);
      on(root, adv, () => entrar('mundos'));
      adv?.querySelector('img[alt^="Teodoro"]')?.classList.add('a-bob');
    }
    on(root, 'Volver al cuarto de Teodoro', () => back('teodoro'));
    on(root, root.querySelector('[aria-label^="Mundo Enero"]'), () => toast('Enero', 'El próximo mundo: pronto'));
  },
});

// ---------- Contenido del día ----------
register('reproductor', {
  files: F('S-05-Reproductor', 'S-05-Reproductor-oscuro'),
  mount(root, p, layer) {
    const n = p.day; const d = DAYS[n];
    setText(root, /Meditación de la Escucha/, p.nacimiento ? 'El nacimiento de Jesús' : p.extra === 'cancion' ? 'Canción para cantar en familia' : n === 0 ? '¿Qué es el Adviento?' : d.title);
    // una línea bajo el título: de qué trata el día (del cronograma)
    const tituloRep = textEl(root, p.nacimiento ? 'El nacimiento de Jesús' : p.extra === 'cancion' ? 'Canción para cantar en familia' : n === 0 ? '¿Qué es el Adviento?' : d.title);
    if (tituloRep && (d.cita || d.sub) && !p.nacimiento && !p.extra) { const sb = document.createElement('span'); sb.className = 'rep-sub'; sb.textContent = d.cita || d.sub; tituloRep.appendChild(sb); } // la cita (domingos) o de qué trata el día
    // el bloque del título crece hacia arriba: siempre 12px sobre la barra de avance, tenga 1 o 2 líneas y subtítulo
    const barraRep = root.querySelector('[role=slider]');
    const bloqueTit = barraRep?.previousElementSibling;
    // se mide después de pintar: el alto real de la pantalla puede no ser 844
    if (bloqueTit && barraRep) requestAnimationFrame(() => { bloqueTit.style.top = 'auto'; bloqueTit.style.bottom = bloqueTit.offsetParent.clientHeight - barraRep.offsetTop + 12 + 'px'; });
    const scene = $$(root, 'img').find(i => i.alt && i.alt.length > 10);
    if (scene) {
      if (p.nacimiento) { scene.src = A(IMG.nacimiento); scene.alt = 'El nacimiento de Jesús'; }
      else if (d.scene) { scene.src = A(d.scene); scene.alt = d.title; }
      // sin escena propia (día 0, 1 y 2 en el lienzo): Teodoro camina hacia Belén
      else { scene.src = A('67947142d31d9fb5442ef113320694e6'); scene.alt = 'Teodoro camina hacia Belén bajo la estrella'; }
      scene.style.transition = 'transform 9s linear'; requestAnimationFrame(() => { scene.style.transform = 'scale(1.06)'; });
    }
    // reproducción simulada: 9 s = el contenido completo
    const DUR = 9000;
    const slider = root.querySelector('[role=slider]');
    const fill = slider?.children[1], knob = slider?.children[2];
    const play = find(root, 'Reproducir');
    let t = 0, playing = true, last = performance.now(), raf;
    const playIcon = play?.innerHTML;
    const pauseIcon = '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="#0B748A"><rect x="6" y="5" width="4" height="14" rx="1.5"/><rect x="14" y="5" width="4" height="14" rx="1.5"/></svg>';
    const paint = () => {
      const pct = Math.min(100, t / DUR * 100);
      if (fill) fill.style.width = pct + '%';
      if (knob) knob.style.left = `calc(${pct}% - 7px)`;
      if (slider) { slider.setAttribute('aria-valuenow', String(Math.round(pct))); slider.setAttribute('aria-valuetext', Math.round(pct) + ' %'); }
    };
    const loop = now => {
      if (!layer.isConnected) return;
      if (playing) t += now - last;
      last = now; paint();
      if (t >= DUR) { end(); return; }
      raf = requestAnimationFrame(loop);
    };
    const setPlaying = v => { playing = v; if (play) play.innerHTML = v ? pauseIcon : playIcon; play?.setAttribute('aria-label', v ? 'Pausar' : 'Reproducir'); };
    setPlaying(true);
    raf = requestAnimationFrame(loop);
    let ended = false;
    const end = () => {
      if (ended) return; ended = true; cancelAnimationFrame(raf);
      if (p.nacimiento) { if (p.replay) back('hoy', 'down'); else go('final', { day: 26 }, 'fade', { replace: true }); return; }
      if (p.extra === 'cancion') { toast('¡Qué bonito cantan!'); go('hub', { day: n }, 'down', { replace: true }); return; }
      if (p.replay) { const suma = fase() !== 'recuerdo'; if (suma) { setBateria(5); S.sinCaminar = 0; S.regresoAvisado = false; S.ultimoJugado = S.hoy; save(); } toast('¡Otra vez con Teodoro!', suma ? 'Teodoro quedó al 100%' : ''); go('mapa', {}, 'down', { replace: true }); return; }
      finishContent(n);
      if (n === 0) { toast('¡Listo para salir!', 'Te avisamos el 29 de noviembre'); go('mapa', {}, 'down', { replace: true }); return; }
      go('completado', { day: n }, 'fade', { replace: true });
    };
    on(root, play, () => setPlaying(!playing));
    on(root, 'Retroceder 10 segundos', () => { t = Math.max(0, t - 1000); paint(); });
    on(root, 'Adelantar 10 segundos', () => { t = Math.min(DUR, t + 1000); paint(); });
    if (slider) {
      on(root, slider, ev => { if (ev.clientX == null) return; const r = slider.getBoundingClientRect(); t = DUR * Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)); paint(); });
      slider.addEventListener('keydown', ev => { if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') { ev.preventDefault(); t = Math.min(DUR, Math.max(0, t + (ev.key === 'ArrowRight' ? 1000 : -1000))); paint(); } });
    }
    // Texto / Voz / Repetir: activo = círculo blanco con ícono azul; inactivo = círculo translúcido con ícono blanco (antes el ícono desaparecía)
    const pintaCtl = (el, on) => { const s = el.querySelector('span'); if (s) s.style.background = on ? '#FFFFFF' : 'rgba(255,255,255,.2)';
      el.querySelectorAll('svg, svg [stroke]').forEach(n => { if (n.getAttribute('stroke') && n.getAttribute('stroke') !== 'none') n.setAttribute('stroke', on ? '#0B748A' : '#FFFFFF'); });
      el.setAttribute('aria-pressed', String(on)); el.dataset.on = on ? '1' : ''; };
    ['Texto', 'Voz', 'Repetir'].forEach(k => { const el = find(root, k); if (el) pintaCtl(el, k === 'Voz'); });
    ['Texto', 'Voz', 'Repetir'].forEach(k => on(root, k, (ev, el) => { pintaCtl(el, !el.dataset.on); nota(k, 'Control del reproductor de Theo (ya existe)'); }));
    const cerrar = () => { cancelAnimationFrame(raf); if (p.nacimiento || p.extra === 'cancion') back('mapa', 'down'); else go('mapa', {}, 'down', { replace: true }); };
    const barrita = root.querySelector('a[aria-label="Bajar el reproductor"]');
    if (barrita) { on(root, barrita, cerrar); barrita.setAttribute('aria-hidden', 'true'); barrita.tabIndex = -1; }
    const x = document.createElement('button');
    x.type = 'button'; x.setAttribute('aria-label', 'Bajar el reproductor');
    x.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
    x.style.cssText = 'position:absolute;left:14px;top:54px;width:44px;height:44px;border-radius:22px;border:0;background:rgba(0,8,43,.55);display:grid;place-items:center;cursor:pointer;z-index:6';
    root.appendChild(x); on(root, x, cerrar);
    if (slider) { slider.style.paddingBlock = '15px'; slider.style.marginTop = '-15px'; slider.style.backgroundClip = 'content-box'; }
  },
});

register('hub', {
  files: F('S-04-Hub-familia', 'S-04-Hub-familia-oscuro'),
  mount(root, p, layer) {
    const n = p.day; const d = DAYS[n];
    replaceText(root, /^DÍA 13$/, `DÍA ${n}`);
    const tit = setText(root, 'Pesebre', d.title); if (tit) tit.style.whiteSpace = 'normal';
    setText(root, 'Coloréalo con tu familia', d.reto || d.sub || 'Un reto para hacer juntos');
    setText(root, /Al terminar ganas \d+ panes/, `Al terminar ganas ${panesContenido()} panes`);
    // el reto (o el juego en familia) en 2–3 pasos cortos, en lugar de la ilustración
    // títulos largos: más angostos para no chocar con los árboles de los lados
    if (d.title.length > 22) { const tt = textEl(root, d.title); if (tt) Object.assign(tt.style, { maxWidth: '278px', marginLeft: 'auto', marginRight: 'auto', fontSize: '24px', lineHeight: '1.15' }); }
    const card = root.querySelector('a[aria-label^="Reto en familia"]');
    if (card && d.pasos) {
      const tipo = d.type === 'juego' ? 'Juego en familia' : 'Reto en familia';
      const div = document.createElement('div'); div.className = 'hub-pasos'; div.setAttribute('style', card.getAttribute('style'));
      Object.assign(div.style, { display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: '24px', gap: '14px', boxShadow: '' });
      div.setAttribute('role', 'group'); div.setAttribute('aria-label', `${tipo}: ${d.pasos.length} pasos`);
      div.innerHTML = `<span class="hp-tag">${tipo} · ${TYPES[d.type].min} min</span><ol>${d.pasos.map(t => `<li>${t}</li>`).join('')}</ol>`;
      card.replaceWith(div);
    }
    // la fila del descargable: el del día; en los retos de acción no se repite (el reto es esta pantalla)
    const imp = find(root, 'Imprimible');
    if (imp) {
      if (d.descarga.accion) {
        // sin imprimible, la fila de la canción sube a su sitio (antes quedaba un hueco)
        const can = find(root, 'Canción'), y = parseFloat(imp.style.top);
        if (can && !isNaN(y) && parseFloat(can.style.top) > y) can.style.top = y + 'px';
        imp.style.display = 'none';
      }
      else { setText(imp, 'Pesebre para colorear', d.descarga.s); setText(imp, 'Imprimible', d.descarga.t); imp.setAttribute('aria-label', `${d.descarga.t}: ${d.descarga.s}`); }
    }
    $$(root, 'img').filter(i => /Teodoro/.test(i.alt || '')).forEach(i => i.classList.add('a-bob'));
    sparkles(root);
    on(root, 'Volver al mapa', () => go('mapa', {}, 'down', { replace: true }));
    on(root, 'Escuchar a Teodoro', () => nota('Teodoro explica el reto', 'Audio por grabar'));
    if (!d.pasos) on(root, 'Reto en familia', () => go('desafioIntro', { day: n, fromHub: true, replay: p.replay }, 'fade'));
    on(root, '¡Lo hicimos!', (ev, el) => { if (p.replay) { toast('¡Otra vez en familia!'); go('mapa', {}, 'down', { replace: true }); return; } finishContent(n); animate(el, 'a-pop'); setTimeout(() => go('completado', { day: n }, 'fade', { replace: true }), 260); });
    // los extras del reto son descargables: con free piden Premium (y lo dicen antes de tocarlos)
    if (!premium()) [d.descarga.t, 'Canción'].forEach(t => { const el = find(root, t); if (!el || el.querySelector('.pill-premium')) return; const pl = document.createElement('span'); pl.className = 'pill-premium'; pl.textContent = 'Premium'; el.style.position ||= 'relative'; el.appendChild(pl); });
    if (imp) on(root, imp, () => abrirDescargable(n, 'hub'));
    on(root, 'Canción', () => premium() ? go('reproductor', { day: n, extra: 'cancion' }, 'up') : go('free', { back: 'hub', day: n }, 'page'));
  },
});

register('completado', {
  files: F('S-06-Completado', 'S-06-Completado-oscuro'),
  mount(root, p, layer) {
    const n = p.day; const d = DAYS[n];
    const que = TYPES[d.type].fin;
    setText(root, '¡Terminaste el cuento!', que);
    setText(root, /sobre el cuento de hoy/, usaHub(n) ? 'sobre el reto de hoy' : 'sobre el video de hoy');
    const chip = find(root, 'Ganaste 20 panes');
    if (chip) { replaceText(chip, /\+20/, '+' + panesContenido()); chip.setAttribute('aria-label', `Ganaste ${panesContenido()} panes`); chip.classList.add('a-pop'); }
    floaty(layer, '+' + panesContenido(), 290, 110);
    const q = textEl(root, '?')?.parentElement; q?.classList.add('a-pop');
    $$(root, '[style*="rotate(-12deg)"], [style*="rotate(12deg)"]').forEach((c, i) => { c.style.setProperty('--r', i ? '12deg' : '-12deg'); c.style.animation = `popRot .55s ${.15 + i * .1}s cubic-bezier(.2,.9,.3,1.3) both`; });
    $$(root, 'img').find(i => i.src.includes(IMG.tPregunta))?.classList.add('a-bob');
    confetti(layer, 195, 260, 30);
    const cal = find(root, 'Califícanos'); if (cal) cal.style.display = 'none';
    if (chip) { chip.style.pointerEvents = 'none'; chip.removeAttribute('role'); }
    const out = () => go('mapa', {}, 'down', { replace: true });
    on(root, 'Ahora no', out); on(root, 'Cerrar', out);
    // calificar el video o la canción (no el reto): fila discreta sobre el botón
    if (hasTrivia(n)) { on(root, '¡A jugar!', () => go('trivia', { day: n }, 'push', { replace: true })); if (!usaHub(n)) rateRow(root, n); return; }
    // día sin trivia: el día ya quedó completo; si toca sorpresa se abre aquí, si no, Teodoro camina en el mapa
    const sorpresa = RULES.sorpresa[n] && S.sorpresas[n] !== 'hecha';
    const titulo = textEl(root, /¿Jugamos/);
    if (titulo) titulo.innerHTML = sorpresa ? `Hoy toca<br>${{ memorama: 'Memorama', adivinanza: 'Adivinanza', desafio: 'Desafío' }[RULES.sorpresa[n]]}` : 'Un paso más<br>hacia Belén';
    const sub = textEl(root, /sobre el video de hoy|sobre el reto de hoy/);
    if (sub) { if (sorpresa) sub.textContent = 'Un juego sorpresa para hoy'; else sub.style.display = 'none'; }
    if (!sorpresa) { if (q) q.style.display = 'none'; $$(root, '[style*="rotate(-12deg)"], [style*="rotate(12deg)"]').forEach(c => { c.style.display = 'none'; }); }
    const btn = find(root, '¡A jugar!');
    if (btn) { setText(btn, '¡A jugar!', sorpresa ? 'Ir al juego sorpresa' : 'Volver al camino'); on(root, btn, () => sorpresa ? openSorpresa(n) : go('mapa', { thenCerrado: true }, 'down', { replace: true })); }
    if (!sorpresa) {
      const no = find(root, 'Ahora no'); if (no) no.style.display = 'none';
      // sin subtítulo ni segunda fila: Teodoro baja un poco y el botón sube, para que no quede un hueco
      const teo = $$(root, 'img').find(i => i.src.includes(IMG.tPregunta)); if (teo) teo.style.top = parseFloat(teo.style.top) + 40 + 'px';
      if (btn) btn.style.top = '636px';
    }
    if (!usaHub(n)) rateRow(root, n);
  },
});

register('calificacion', {
  h1: '¿Te gustó?',
  files: F('V2-Calificacion-claro', 'V2-Calificacion'),
  mount(root, p) {
    // sin «Enviar»: el bloque de la pregunta y las caritas baja al centro y «Ahora no» sube cerca
    const DY = 70;
    $$(root, '*').filter(el => el.style.position === 'absolute' && el.parentElement?.closest('[role=radio]') == null && (t => t >= 140 && t <= 470)(parseFloat(el.style.top)))
      .forEach(el => { el.style.top = parseFloat(el.style.top) + DY + 'px'; });
    const enviar = find(root, 'Enviar'); if (enviar) enviar.style.display = 'none';
    const ahoraNo = find(root, 'Ahora no'); if (ahoraNo) ahoraNo.style.top = '610px';
    // en claro, el texto blanco sobre el cielo no se lee: píldora oscura
    if (!dark()) {
      const pill = 'display:inline-block;padding:4px 12px;border-radius:14px;background:#0B4F6C;color:#FFFFFF;text-shadow:none';
      [...['Poco', 'Más o menos', '¡Mucho!'].map(t => textEl(root, t)), ahoraNo].filter(Boolean).forEach(el => {
        const t = [...el.childNodes].find(c => c.nodeType === 3 && c.nodeValue.trim()); if (!t) return;
        const s = document.createElement('span'); s.style.cssText = pill; s.textContent = t.nodeValue.trim(); t.replaceWith(s);
      });
    }
    // las 3 caritas empiezan sin elegir; tocar una la dora y envía
    const opts = $$(root, '[role=radio]');
    const badge = $$(root, 'span').find(sp => sp.style.borderRadius === '50%' && sp.querySelector('svg path[d^="M5 12.5"]'));
    const geo = opts.map(o => ({ cx: parseFloat(o.style.left) + parseFloat(o.style.width) / 2, cy: parseFloat(o.style.top) + parseFloat(o.style.height) / 2 }));
    const paintFace = (o, k, on) => {
      const s = on ? 124 : 96, g = geo[k];
      Object.assign(o.style, { left: g.cx - s / 2 + 'px', top: g.cy - s / 2 + 'px', width: s + 'px', height: s + 'px', background: on ? '#FFF8DC' : '#FFFFFF',
        boxShadow: on ? '0 0 0 5px #F5DB78, 0 0 0 12px rgba(245,219,120,.35), 0 14px 30px rgba(0,8,43,.35)' : '0 10px 24px rgba(0,8,43,.25)',
        transition: 'all .26s cubic-bezier(.23,1,.32,1)', cursor: 'pointer' });
      const im = o.querySelector('img'); if (im) Object.assign(im.style, { left: (on ? 11 : 8) + 'px', top: (on ? 11 : 8) + 'px', width: s - (on ? 22 : 16) + 'px', height: s - (on ? 22 : 16) + 'px', transition: 'all .26s cubic-bezier(.23,1,.32,1)' });
      o.setAttribute('aria-checked', String(on));
      if (on && badge) { badge.style.display = 'grid'; badge.style.left = g.cx + s / 2 - 30 + 'px'; badge.style.top = g.cy - s / 2 - 4 + 'px'; animate(badge, 'a-pop'); }
    };
    opts.forEach((o, k) => paintFace(o, k, false));
    if (badge) badge.style.display = 'none';
    S._voto = null;
    const volver = () => back(p.back || 'mapa', 'down');
    opts.forEach((el, k) => on(root, el, () => {
      if (S._voto) return;
      opts.forEach((o, j) => paintFace(o, j, j === k));
      S._voto = el.getAttribute('aria-label'); navigator.vibrate?.(10);
      toast('¡Gracias!');
      setTimeout(volver, 400);
    }));
    // solo las caritas: un niño no tiene que escribir
    const lq = textEl(root, /Lo que más te gustó/);
    const box = lq?.closest('[style*="border-radius"]');
    if (box && box !== root) box.style.display = 'none';
    const pide = textEl(root, /Quieres contarnos algo/); if (pide && pide !== root) pide.style.display = 'none';
    on(root, 'Ahora no', volver); on(root, 'Cerrar', volver);
  },
});

register('free', {
  files: F('V2-24-Dia-completo-claro', 'V2-24-Dia-completo'),
  mount(root, p) {
    const volver = () => back(p.back || 'mapa', 'down');
    // compra simulada: el MVP no cobra; cambia el plan y abre el día que se quería hacer
    const comprar = (plan, t, s) => { S.plan = plan; save(); toast(t, s); nota('Compra simulada', 'En la app real abre el pago de la tienda'); volver(); if (p.dia != null) setTimeout(() => startDay(p.dia), 450); };
    ['Ver Theo Premium', 'Hazte Premium'].forEach(t => on(root, t, () => p.dia != null ? comprar('premium', '¡Ya eres Premium!', 'Los 26 días son tuyos') : nota('Paywall de Theo Premium', 'Ya existe en la app')));
    on(root, 'Volver al mapa', volver); on(root, 'Ahora no', volver); on(root, 'Cerrar', volver);
    setText(root, 'Volver al mapa', 'Ahora no');
    // día de pago del camino: el mismo paywall, con el Pase de Adviento como segunda opción
    if (p.dia != null) {
      const txt = textEl(root, /Imprimibles y más actividades/);
      if (txt) { txt.innerHTML = 'Los 26 días de Adviento con Teodoro,<br>y <span style="color: inherit; font-weight: 500">todo Theo</span> para tu familia'; const acento = txt.querySelector('span'); if (acento) acento.style.color = getComputedStyle(find(root, 'Hazte Premium') || txt).color; txt.style.top = '584px'; }
      const prem = find(root, 'Hazte Premium'), no = find(root, 'Ahora no');
      if (prem) { prem.style.top = '644px'; prem.style.height = '60px'; }
      if (prem) {
        const pase = prem.cloneNode(true);
        pase.textContent = 'Pase de Adviento · US$19,99';
        Object.assign(pase.style, { top: '716px', height: '56px', background: 'transparent', boxShadow: 'none', border: '2px solid currentColor', fontSize: '19px' });
        if (dark()) pase.style.color = '#FFFFFF';
        prem.after(pase);
        on(root, pase, () => comprar('pase', '¡Tu Pase de Adviento está listo!', 'Los 26 días, hasta el 6 de enero'));
      }
      if (no) no.style.top = '780px';
      seen('V2-24-Dia-completo-claro');
    }
  },
});

register('cerrado', {
  h1: 'Mañana seguimos',
  dismiss: () => back('mapa', 'down'),
  files: F('V2-Cerrado', 'V2-Cerrado-oscuro'),
  mount(root, p, layer) {
    const n = Math.min(lastDay(), 26);
    const next = n + 1;
    const fd = dateOf(Math.min(next, 26));
    // calendario con la fecha del día que se abre
    const cal = root.querySelector('[aria-label$="de diciembre"], [aria-label$="de noviembre"]');
    if (cal) { cal.setAttribute('aria-label', `${fd.dd} de ${fd.mes.toLowerCase()}`); setText(cal, 'DIC', fd.mes.slice(0, 3)); setText(cal, /^\d+$/, String(fd.dd)); cal.classList.add('a-pop'); }
    setText(root, /El día \d+ se abre a medianoche\./, next > 26 ? '¡Llegamos a Belén! Mañana es Navidad.' : `El día ${next} se abre a medianoche.`);

    // cuenta regresiva real hasta medianoche
    const cdEl = textEl(root, /Faltan \d+ h \d+ min/);
    const cd = cdEl && [...cdEl.childNodes].find(c => c.nodeType === 3 && /Faltan/.test(c.nodeValue));
    const tick = () => { const now = new Date(); const mid = new Date(now); mid.setHours(24, 0, 0, 0); const ms = mid - now; if (cd) cd.nodeValue = `Faltan ${Math.floor(ms / 36e5)} h ${Math.floor(ms / 6e4) % 60} min`; };
    tick(); const iv = setInterval(() => layer.isConnected ? tick() : clearInterval(iv), 1000);
    $$(root, 'span').filter(s => s.textContent.trim() === 'z').forEach((z, i) => { z.style.display = 'inline-block'; z.style.animation = `zz 2.4s ${i * .8}s ease-out infinite`; });
    $$(root, 'img').find(i => /duerme/.test(i.alt || ''))?.classList.add('a-bob');
    const ok = find(root, 'Entendido');
    if (ok) { setText(ok, 'Entendido', 'Hasta mañana'); on(root, ok, () => go('hoy', {}, 'down', { tab: true })); }
  },
});

// ---------- Ruleta (días 4, 11, 18 y 24) ----------
// 8 casillas (45° cada una), desde arriba en el sentido del reloj: el «?» dorado es el fondo nuevo para Teodoro (cuarto);
// el regalo trae una prenda al azar; «prenda» es la de la semana; «otra» da un segundo giro. Panes alternados para que quede simétrica.
const SEGMENTS = ['cuarto', 'panes', 'regalo', 'panes', 'prenda', 'panes', 'otra', 'panes'];
const SEG = 360 / SEGMENTS.length;
register('ruletaPop', {
  files: F('S-05b-Ruleta-pop', 'S-05b-Ruleta-pop-oscuro'),
  mount(root, p, layer) {
    const n = p.day;
    // la ruleta se juega al tocarla en el mapa, no al empezar el día
    const antes = textEl(root, /Antes del cuento…/); if (antes) antes.textContent = `Semana ${RULES.ruleta.indexOf(n) + 1}`;
    // velo más firme: el mapa de atrás no compite con la ruleta
    const sc = root.querySelector('.ov-scrim'); if (sc) { sc.style.background = 'rgba(0,20,50,.8)'; sc.style.backdropFilter = 'blur(6px)'; sc.style.webkitBackdropFilter = 'blur(6px)'; }
    const wheel = root.querySelector('[role=img][aria-label^="Ruleta"] > div');
    wheel?.parentElement.classList.add('a-pop');
    const pointer = $$(root, 'img').find(i => i.src.includes('3fdb655b'));
    // la rueda de 8 casillas y sus iconos (la del lienzo trae 10)
    const week0 = RULES.ruleta.indexOf(n);
    if (wheel) {
      const base = wheel.querySelector(':scope > img'); if (base) base.src = 'assets/ruleta/rueda8.webp';
      [...wheel.children].filter(c => c.tagName === 'DIV').forEach(c => c.remove());
      const ico = { cuarto: 'assets/ruleta/sorpresa.webp', panes: A(IMG.pan), regalo: A(IMG.regalo), prenda: A(PRENDAS[week0]?.img || IMG.regalo), otra: 'assets/ruleta/otra-vez.webp' };
      const box = base ? parseFloat(base.style.width) || 330 : 330, cx = box / 2, r = box * .262, s = box * .14;
      SEGMENTS.forEach((id, i) => {
        const d = document.createElement('div');
        d.style.cssText = `position:absolute;left:${cx}px;top:${cx}px;width:0;height:0;transform:rotate(${i * SEG}deg)`;
        const k = id === 'cuarto' ? 1.3 : 1, z = s * k; // el premio especial, el más grande
        const sombra = id === 'cuarto' ? 'drop-shadow(0 0 1.5px #7A3B0A) drop-shadow(0 2px 3px rgba(122,59,10,.45))' : 'drop-shadow(0 2px 3px rgba(8,93,111,.18))';
        d.innerHTML = `<img src="${ico[id]}" alt="" style="position:absolute;left:${-z / 2}px;top:${-r - z / 2}px;width:${z}px;height:${z}px;object-fit:contain;filter:${sombra}">`;
        wheel.appendChild(d);
      });
      wheel.style.transformOrigin = `${cx}px ${cx}px`;
      wheel.parentElement.setAttribute('aria-label', 'Ruleta sorpresa con 8 casillas: sorpresa dorada, panes, regalo, panes, prenda de la semana, panes, gira otra vez, panes');
    }
    let spun = false, giro = 0, giros = 0; // giros: el premio elegido en el panel solo decide el primero // giro: dónde quedó la rueda (para volver a girar)
    on(root, '¡Girar!', async (ev, btn) => {
      if (spun) return; spun = true;
      root.querySelector('.gira-otra')?.remove();
      btn.style.opacity = '.6'; btn.style.pointerEvents = 'none';
      const tarde = find(root, 'Más tarde'); if (tarde) tarde.style.visibility = 'hidden'; layer.querySelector('.pop-x')?.remove();
      // premio: el forzado en el panel o al azar (todas las casillas ganan)
      const forced = giros === 0 ? S.forzarPremio : ''; // el giro extra de «otra oportunidad» siempre es al azar
      const weekId = PRENDAS[RULES.ruleta.indexOf(n)]?.id;
      const pick = () => {
        if (weekId && !S.prendas.includes(weekId) && Math.random() < .35) return SEGMENTS.indexOf('prenda');
        let i = Math.floor(Math.random() * SEGMENTS.length);
        if (giros > 0) while (SEGMENTS[i] === 'otra') i = Math.floor(Math.random() * SEGMENTS.length); // la segunda vuelta no repite «otra oportunidad»
        if (SEGMENTS[i] === 'cuarto' && S.cuartoNuevo) i = SEGMENTS.indexOf('regalo');
        return i;
      };
      let idx = forced ? SEGMENTS.indexOf(forced) : pick();
      giros++;
      if (idx < 0) idx = 0;
      let premio = SEGMENTS[idx];
      const vuelta = ((360 - idx * SEG - giro) % 360 + 360) % 360;
      const target = giro + 360 * 6 + vuelta + (Math.random() * 20 - 10);
      giro = target;
      if (wheel) {
        // anticipación: la rueda se echa un poquito atrás antes de salir
        if (!reduced()) await wheel.animate([{ rotate: '0deg' }, { rotate: '-10deg' }], { duration: 180, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'forwards' }).finished;
        wheel.style.transition = ''; // tras un giro quedó en «none»: sin esto el segundo giro saltaba sin moverse
        wheel.classList.add('wheel-spin');
        if (reduced()) wheel.style.transition = 'transform .3s';
        wheel.getAnimations().forEach(a => a.cancel());
        wheel.style.transform = `rotate(${target}deg)`;
        // el puntero golpea cada vez que pasa una casilla, al ritmo real de la rueda
        if (pointer && !reduced()) {
          let lastSeg = 0, lastT = performance.now(), turns = 0, prevA = 0;
          const tickP = now => {
            if (!layer.isConnected || !wheel.classList.contains('wheel-spin')) return;
            const m = new DOMMatrix(getComputedStyle(wheel).transform);
            let ang = Math.atan2(m.b, m.a) * 180 / Math.PI; if (ang < 0) ang += 360;
            if (ang < prevA - 180) turns++; prevA = ang;
            const seg = Math.floor((turns * 360 + ang) / SEG);
            if (seg !== lastSeg) { pointer.animate([{ rotate: '0deg' }, { rotate: '-16deg' }, { rotate: '0deg' }], { duration: Math.min(160, now - lastT), easing: 'cubic-bezier(.23,1,.32,1)' }); lastSeg = seg; lastT = now; }
            requestAnimationFrame(tickP);
          };
          requestAnimationFrame(tickP);
        }
        await wait(reduced() ? 400 : 4400);
        wheel.classList.remove('wheel-spin'); wheel.style.transition = 'none';
        if (!layer.isConnected) return;
      }
      const week = RULES.ruleta.indexOf(n);
      // «¡Gira otra vez!»: un segundo giro, sin premio todavía
      if (premio === 'otra') {
        navigator.vibrate?.(20);
        const zona = wheel.parentElement.parentElement;
        zona.querySelector('.gira-otra')?.remove();
        const cartel = document.createElement('div'); cartel.className = 'gira-otra'; cartel.setAttribute('role', 'status');
        cartel.innerHTML = '<b>¡Otra oportunidad!</b><span>Gira de nuevo</span>';
        zona.appendChild(cartel);
        spun = false; btn.style.opacity = ''; btn.style.pointerEvents = ''; animate(btn, 'a-pop');
        const masTarde = find(root, 'Más tarde'); if (masTarde) masTarde.style.visibility = ''; // pueden girar ahora o dejarlo para después
        return;
      }
      // el regalo trae una prenda al azar que aún no tiene (no la de la semana); si ya las tiene todas, panes
      const libres = PRENDAS.filter(x => x.id !== PRENDAS[week]?.id && !S.prendas.includes(x.id));
      const sorpresa = premio === 'regalo' ? libres[Math.floor(Math.random() * libres.length)] || null : null;
      if (premio === 'regalo' && !sorpresa) premio = 'panes';
      const prize = premio === 'prenda' ? PRENDAS[week].id : sorpresa ? sorpresa.id : premio;
      if (sorpresa) S.prendas.push(sorpresa.id);
      S.ruletas[n] = prize;
      if (premio === 'panes') addPanes(RULES.panes.ruleta);
      if (premio === 'prenda') S.prendas.push(PRENDAS[week].id);
      if (premio === 'cuarto') S.cuartoNuevo = true;
      // con la energía llena, Teodoro la guarda para mañana (no se pierde el premio)
      if (premio === 'manzana') { S.manzanaLlena = S.bateria >= 5; if (S.manzanaLlena) S.manzana = true; else setBateria(S.bateria + 1); }
      save();
      navigator.vibrate?.(30);
      await wait(300);
      go(premio === 'cuarto' ? 'premioCuarto' : 'ruletaPremio', { premio: prize, day: n }, 'modal', { replace: true });
    });
    const tarde0 = find(root, 'Más tarde'); if (tarde0) tarde0.dataset.back = '1';
    // una X para cerrar (igual que «Más tarde»: solo cierra; la ruleta sigue en el mapa)
    const x = document.createElement('button'); x.type = 'button'; x.className = 'pop-x'; x.setAttribute('aria-label', 'Cerrar');
    x.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
    (root.querySelector('.ov-body') || root).appendChild(x);
    x.addEventListener('click', () => tarde0?.click());
    on(root, 'Más tarde', () => go('mapa', {}, 'down', { replace: true }));
  },
});
register('ruletaPremio', {
  files: F('S-05c-Ruleta-premio', 'S-05c-Ruleta-premio-oscuro'),
  mount(root, p, layer) {
    const n = p.day;
    const prenda = PRENDAS.find(x => x.id === p.premio);
    const info = prenda ? { img: prenda.img, t1: '¡Ganaste', t2: prenda.nombre + '!', sub: true }
      : p.premio === 'manzana' ? { img: IMG.manzana, t1: '¡Ganaste', t2: 'una manzana!', sub: true }
      : p.premio === 'cuarto' ? { img: IMG.cuarto, t1: '¡Ganaste un', t2: 'cuarto nuevo!', sub: true }
      : { img: IMG.pan, t1: '¡Ganaste', t2: `${RULES.panes.ruleta} panes!`, sub: false };
    const pic = $$(root, 'img').find(i => i.src.includes(IMG.gorro));
    if (pic) { pic.src = A(info.img); pic.alt = info.t2; pic.style.animation = 'spinIn .7s cubic-bezier(.2,.9,.3,1.2) both, bob 2.4s .8s ease-in-out infinite'; }
    setText(root, '¡Ganaste', info.t1); setText(root, 'un gorro!', info.t2);
    const subEl = textEl(root, 'Ya está en el');
    if (!info.sub && subEl) subEl.textContent = 'Ya están en la canasta de Teodoro';
    else if (p.premio === 'manzana' && subEl) subEl.textContent = S.manzanaLlena ? 'Teodoro la guardó para mañana' : 'Teodoro se la comió: ¡más energía!';
    else if (prenda && subEl) subEl.textContent = prenda.sub; // el enlace al cuarto va aparte, no dos veces
    // halo del premio: en oscuro, luz azul clara (el dorado sobre azul se veía color barro)
    if (dark()) $$(root, 'div[aria-hidden="true"]').filter(d => /radial-gradient/.test(d.style.background) && /245,\s*219,\s*120/.test(d.style.background)).forEach(d => { d.style.background = 'radial-gradient(closest-side, rgba(255,246,221,.22), rgba(255,246,221,0))'; });
    if (p.premio === 'panes' || prenda) floaty(layer, p.premio === 'panes' ? `+${RULES.panes.ruleta}` : '¡Nuevo!', 250, 210, p.premio === 'panes' ? IMG.pan : null);
    confetti(layer, 195, 300, 36);
    const alMapa = () => go('mapa', {}, 'down', { replace: true });
    const seguir = on(root, 'Empezar el cuento', alMapa); if (seguir) seguir.dataset.back = '1';
    setText(root, 'Empezar el cuento', 'Volver al camino');
    // la ilustración del botón (▶ de «empezar») ya no aplica
    find(root, 'Volver al camino')?.querySelector('svg')?.remove();
    const ver = find(root, 'Ver a Teodoro');
    if (ver) { if (prenda) {
      setText(ver, 'Ver a Teodoro', 'Ver el cuarto de Teodoro'); on(root, ver, () => go('teodoro', {}, 'fade', { tab: true }));
      // dentro de la ventana, no flotando sobre el mapa
      const dlg = root.querySelector('[role=dialog]'); if (dlg) dlg.style.height = '548px';
      Object.assign(ver.style, { top: '654px', left: '40px', right: '40px', height: '44px', color: dark() ? '#FFFFFF' : '#0B748A', zIndex: 5 });
    } else ver.style.display = 'none'; }
    xEnTarjeta(root, alMapa);
  },
});
/** X dentro de la tarjeta del premio (arriba a la derecha). */
function xEnTarjeta(root, fn, left = 314, top = 186) {
  const x = document.createElement('button'); x.type = 'button'; x.className = 'premio-x'; x.setAttribute('aria-label', 'Cerrar');
  x.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  x.style.left = left + 'px'; x.style.top = top + 'px';
  (root.querySelector('.ov-body') || root).appendChild(x);
  on(root, x, fn);
  return x;
}
register('premioCuarto', {
  files: F('S-09-Premio-cuarto', 'S-09-Premio-cuarto-oscuro'),
  dismiss: () => go('mapa', {}, 'down', { replace: true }),
  // el lienzo lo trae a pantalla completa: se rearma como tarjeta sobre el mapa (velo + tarjeta de 350)
  prepare(root) {
    const kids = [...root.children];
    kids.filter(el => el.style.top === '0px' && /^\s*9:41/.test(el.textContent) || el.style.bottom === '8px').forEach(el => el.remove());
    const T = 120, Y = 82, H = 680;
    const card = document.createElement('div'); card.className = 'premio-card';
    card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', 'Premio de la ruleta: cuarto nuevo');
    card.style.cssText = `position:absolute;left:20px;top:${Y}px;width:350px;height:${H}px;border-radius:32px;overflow:hidden;background:${root.style.background};box-shadow:${dark() ? '0 0 0 1px rgba(255,255,255,.12), 0 24px 60px rgba(0,8,43,.5)' : '0 24px 60px rgba(0,8,43,.4)'}`;
    const inner = document.createElement('div'); inner.style.cssText = `position:absolute;left:-20px;top:-${T}px;width:390px;height:844px`;
    kids.filter(el => el.parentElement === root).forEach(el => inner.appendChild(el)); // (aún no está en el documento)
    card.appendChild(inner);
    const scrim = document.createElement('div'); scrim.setAttribute('aria-hidden', 'true');
    scrim.style.cssText = `position:absolute;top:0;bottom:0;left:0;right:0;background:${dark() ? 'rgba(0,8,43,.66)' : 'rgba(2,37,79,.64)'}`;
    root.append(scrim, card);
  },
  mount(root, p, layer) {
    const n = p.day;
    confetti(layer, 195, 300, 50);
    const room = $$(root, 'img').find(i => i.src.includes(IMG.cuarto)) || $$(root, 'img')[1];
    room?.parentElement?.classList.add('a-pop');
    const nextW = RULES.ruleta.find(x => !S.ruletas[x]);
    const prox = textEl(root, /La próxima ruleta.*/);
    if (nextW) setText(root, /La próxima ruleta.*/, `La próxima ruleta, el día ${nextW}`);
    const proxBox = prox?.closest('div[style*="top: 712px"]'); if (proxBox) { if (nextW) proxBox.style.top = '750px'; else proxBox.style.display = 'none'; }
    const alMapa = () => go('mapa', {}, 'down', { replace: true });
    // la X del lienzo pasa adentro de la tarjeta, arriba a la derecha
    const salir = find(root, 'Salir de la ruleta');
    if (salir) { Object.assign(salir.style, { left: '312px', top: '136px' }); on(root, salir, alMapa); }
    on(root, 'Cerrar', alMapa);
    const btn = find(root, 'Ver su cuarto nuevo'); // se toma antes de cambiarle el texto
    if (btn) { on(root, btn, alMapa); btn.dataset.back = '1'; setText(btn, 'Ver su cuarto nuevo', 'Volver al camino'); btn.querySelector('svg')?.remove(); }
    // márgenes de tarjeta: el botón y el texto no tocan los bordes
    if (btn) Object.assign(btn.style, { left: '40px', right: '40px' });
    const txt = textEl(root, /¡Ganaste un cuarto nuevo!/)?.parentElement; if (txt) Object.assign(txt.style, { left: '40px', right: '40px' });
    const box = btn?.parentElement;
    if (box) {
      const ver = document.createElement('a'); ver.className = 'premio-link'; ver.textContent = 'Ver el cuarto de Teodoro';
      ver.style.cssText = 'position:absolute;left:20px;right:20px;top:704px;height:40px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;text-decoration:none;color:inherit;cursor:pointer';
      box.appendChild(ver); on(root, ver, () => go('teodoro', {}, 'fade', { tab: true }));
    }
  },
});

// ---------- Nochebuena ----------
/** Lluvia dorada: la llegada a Belén no es un festejo más. */
function goldRain(layer) {
  const box = document.createElement('div'); box.className = 'gold-rain'; box.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 34; i++) {
    const s = document.createElement('i');
    s.style.left = (Math.random() * 100) + '%';
    s.style.background = ['#F5DB78', '#F5D46A', '#FFF6DD'][i % 3];
    s.style.animationDelay = (Math.random() * .9) + 's';
    s.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px');
    box.appendChild(s);
  }
  layer.appendChild(box); setTimeout(() => box.remove(), 3600);
}
register('final', {
  files: F('V2-Final-claro', 'V2-Final'),
  async mount(root, p, layer) {
    const first = !contentDone(26);
    if (first && fase() !== 'recuerdo') { finishContent(26); S.pasoAnimado = null; save(); } // como cualquier día: energía, panes y caminar
    // la llegada a Belén se celebra con los 26 cuentos; si faltan, Teodoro espera en el primero sin ver
    if (vistos() < 26) {
      const sig = walkDay();
      setTimeout(() => toast('¡Jesús nació!', sig && fase() !== 'recuerdo' ? `Teodoro te espera en el día ${sig}` : 'Nos vemos en Adviento'), 300);
      go('mapa', {}, 'fade', { replace: true }); return;
    }
    replaceText(root, /Lucía/g, S.nombre);
    setText(root, /^26$/, String(vistos())); // cuentos vistos: al llegar a Belén siempre son 26
    const scene = $$(root, 'img')[0];
    if (first && !reduced()) {
      scene?.animate([{ opacity: 0, transform: 'scale(1.04)' }, { opacity: 1, transform: 'none' }], { duration: 1200, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
      $$(root, 'a').filter(a => a.getAttribute('aria-label') !== 'Cerrar').forEach(a => a.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: 600, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'backwards' }));
      setTimeout(() => layer.isConnected && goldRain(layer), 600);
      setTimeout(() => layer.isConnected && goldRain(layer), 1400);
    }
    sparkles(root);
    on(root, 'Ver el nacimiento', () => go('reproductor', { day: 26, nacimiento: true }, 'up'));
    on(root, 'Compartir con la familia', () => go('finalCompartir', {}, 'push'));
    on(root, 'Cerrar', () => go('mapa', {}, 'down', { replace: true }));
  },
});

register('finalCompartir', {
  files: F('V2-Final-compartir-claro', 'V2-Final-compartir'),
  mount(root, p, layer) {
    const dias = vistos();
    const estrellas = Object.keys(S.completos).reduce((s, k) => s + stars(+k), 0); // solo los días con trivia tienen estrellas
    replaceText(root, /Lucía/g, S.nombre);
    textEl(root, 'Así la verá tu familia')?.style.setProperty('visibility', 'hidden'); // explicaba la pantalla
    const card = root.querySelector('[role=img][aria-label^="Tarjeta"]');
    if (card) {
      card.setAttribute('aria-label', `Tarjeta: Llegamos a Belén con Teodoro. ${dias} días y ${estrellas} estrellas`);
      const nums = [...card.querySelectorAll('div')].filter(x => x.childElementCount === 0 && /^\d+$/.test(x.textContent.trim()));
      if (nums[0]) nums[0].textContent = String(dias);
      if (nums[1]) nums[1].textContent = String(estrellas);
      card.classList.add('a-pop');
    }
    sparkles(root);
    on(root, 'Compartir', async () => {
      try { if (navigator.share) await navigator.share({ title: '¡Llegamos a Belén!', text: `${S.nombre} caminó ${dias} días con Teodoro hasta Belén y ganó ${estrellas} estrellas.` }); else nota('Compartir', 'En el celular se abre el menú para compartir'); } catch { /* cancelado */ }
    });
    on(root, 'Ahora no', () => back('final'));
    on(root, 'Volver', () => back('final'));
  },
});

/** Descargable del día (todos los días tienen uno): premium lo abre; free ve la hoja de Premium. */
export function abrirDescargable(n, from = 'mapa') {
  // en los retos de acción, el «descargable» son los pasos del reto
  if (DAYS[n]?.descarga?.accion) { go('hub', { day: n, replay: contentDone(n) }, 'up'); return; }
  if (premium()) go('imprimible', { day: n, back: from }, 'push');
  else go('free', { back: from, day: n }, 'page');
}
register('imprimible', {
  files: F('S-04c-Imprimible', 'S-04c-Imprimible-oscuro'),
  mount(root, p) {
    const d = DAYS[p.day];
    if (d) {
      // el descargable del día: con nombre propio (corona, pesebre) o «Imprimible del día» con el título del día
      const propio = d.descarga.t !== 'Imprimible del día';
      setText(root, 'Pesebre para colorear', propio ? d.descarga.t : d.title);
      const sub = textEl(root, /Imprímelo y coloréalo/); if (sub) sub.textContent = propio ? d.descarga.s : 'Para colorear en familia';
      const im = $$(root, 'img').find(i => /para colorear/.test(i.alt || ''));
      if (im) { if (d.imprimible) im.src = A(d.imprimible); im.alt = `Vista previa para colorear: ${d.title}`; }
    }
    const sheet = [...root.querySelectorAll('div, img')].find(x => x.style.transform && /rotate/.test(x.style.transform));
    sheet?.classList.add('a-pop');
    on(root, 'Volver', () => back(p.back || 'mapa'));
    // un solo botón: «Descargar» (en la app abre el PDF del día con el menú del teléfono)
    find(root, 'Guardar')?.remove();
    textEl(root, /^Abre las opciones del teléfono/)?.remove();
    const desc = find(root, 'Imprimir');
    if (desc) { desc.innerHTML = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px;vertical-align:-3px"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>Descargar'; desc.setAttribute('aria-label', 'Descargar'); on(root, desc, () => nota('Descargar', 'En la app se descarga el PDF del día')); }
  },
});

// ---------- Vista estática (galería del panel) ----------
register('estatica', {
  file: p => p.file,
  mount(root, p, layer) {
    const tag = document.createElement('button');
    tag.type = 'button';
    tag.textContent = 'Vista del lienzo · toca para volver al flujo';
    tag.style.cssText = 'position:absolute;left:50%;top:8px;transform:translateX(-50%);z-index:99;height:30px;padding:0 12px;border-radius:15px;border:0;background:#E0565B;color:#fff;font:700 12px Mulish,sans-serif;white-space:nowrap;cursor:pointer';
    tag.dataset.bound = '1';
    tag.onclick = () => go(p.back || 'hoy', p.backParams || {}, 'fade');
    layer.appendChild(tag);
    $$(root, 'a, button').forEach(el => { el.dataset.bound = '1'; el.addEventListener('click', e => { e.preventDefault(); nota('Vista estática', 'Para interactuar, usa el flujo'); }); });
  },
});
