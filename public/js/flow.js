// Flujo del camino: qué pasa al tocar cada cosa y qué pantalla del lienzo se ve.
import { S, save, A, $, $$, on, find, go, back, register, seen, toast, nota, hueco, paintEnergy, teodoroImg, activeDay, walkDay, isDone, contentDone,
  lastDay, pendientes, fase, dark, stars, wait, reduced, animate, replaceText, setText, textEl, swapImg, floaty, confetti,
  addPanes, setBateria, doneCount, frag, racha } from './core.js';
import { DAYS, TYPES, RULES, PRENDAS, IMG, dateOf, iconOf } from './data.js';

const F = (claro, oscuro) => [claro, oscuro];
const premium = () => S.plan === 'premium';
export const panesContenido = () => premium() ? RULES.panes.contenidoPremium : RULES.panes.contenidoFree;

// ---------- Reglas del día ----------
/** Empieza (o retoma) el día n desde el mapa. */
export function startDay(n) {
  const d = DAYS[n];
  if (n === 26) { go(contentDone(26) ? 'final' : 'reproductor', { day: 26, nacimiento: !contentDone(26) }, contentDone(26) ? 'fade' : 'up'); return; }
  if (!contentDone(n)) {
    if (RULES.ruleta.includes(n) && !S.ruletas[n] && !S.ruletaPendiente[n]) { go('ruletaPop', { day: n }, 'modal'); return; }
    go(d.type === 'reto' ? 'hub' : 'reproductor', { day: n }, 'up');
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
  const verbo = { domingo: 'Escuchar el Evangelio', meditacion: 'Ver historia', cuento: 'Ver historia', amigos: 'Ver historia', cancion: 'Escuchar canción', reto: 'Ver el reto', juego: 'Jugar con Teodoro', video: 'Ver video', intro: 'Ver historia', nochebuena: 'Comenzar' }[d.type];
  if (n === 26 && !contentDone(26)) return { text: 'Comenzar', play: true, go: () => startDay(26) };
  if (!contentDone(n)) return { text: verbo, play: true, go: () => startDay(n) };
  if (n === 0) return { text: 'Invitar a un amigo', go: () => go('invitacion', {}, 'push') };
  if (RULES.ruleta.includes(n) && S.ruletaPendiente[n] && !S.ruletas[n]) return { text: 'Girar la ruleta', go: () => go('ruletaPop', { day: n, from: 'mapa' }, 'modal') };
  if (!isDone(n)) return { text: 'Jugar la trivia', go: () => startDay(n) };
  if (RULES.sorpresa[n] && S.sorpresas[n] !== 'hecha') return { text: 'Abrir la sorpresa', go: () => openSorpresa(n) };
  const a = activeDay();
  if (a != null) return { text: `Seguir al día ${a}`, go: () => startDay(a) };
  if (S.hoy >= 26) return { text: 'Ver el nacimiento', go: () => go('final', { day: 26 }, 'fade') };
  return { text: 'Hasta mañana', go: () => go('hoy', {}, 'down', { tab: true }) };
}
/** Termina el contenido del día: suma batería y panes. */
function finishContent(n) {
  const first = !contentDone(n);
  S.completos[n] = { ...(S.completos[n] || {}), contenido: true };
  // terminar un cuento (o cualquier contenido del día) deja a Teodoro al 100%
  if (n > 0) setBateria(5);
  if (first && n > 0) addPanes(panesContenido());
  if (first && n > 0) S.pasoAnimado = n; // Teodoro avanza en el mapa al ver la historia
  S.ultimoJugado = S.hoy;
  save();
  return first;
}
export function finishTrivia(n, aciertos, replay = false) {
  const est = aciertos >= 5 ? 3 : aciertos >= 3 ? 2 : 1;
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
  on(root, 'Hoy', () => go('hoy', {}, 'none', { tab: true }));
  on(root, 'Teodoro', () => go('teodoro', {}, 'none', { tab: true }));
  ['Explorar', 'Música', 'Favoritos'].forEach(t => on(root, t, () => nota(`Pestaña «${t}» de Theo`, 'Ya existe en la app; fuera del reto')));
  on(root, 'Ajustes', () => nota('Ajustes de Theo', 'Ya existen en la app'));
}
function appContent(root) {
  ['Villancicos', 'Oración de la noche', 'Evangelio del día', 'El cuento de hoy', 'La afirmación de hoy', 'PARA REZAR EN FAMILIA', 'Los peces en el río', 'Ven, Señor Jesús', 'Noche de paz', 'Ver todo']
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
  if (!S.inscrito) return { key: 4, title: '¡Ya salimos! ¿Vienes?', sub: 'Aún llegas a Belén', cta: 'Unirme gratis' };
  if (S.hoy >= 27) {
    const faltan = 26 - doneCount();
    return faltan ? { key: 6, title: '¡Feliz Navidad!', sub: `Te faltan ${faltan} días · puedes seguir hasta Reyes`, cta: 'Seguir caminando' }
      : { key: 5, title: '¡Feliz Navidad!', sub: '¡Llegaste a Belén! 26 de 26 días', cta: 'Ver el nacimiento' };
  }
  const h = Math.min(S.hoy, 26);
  if (act == null && RULES.sorpresa[h] && isDone(h) && S.sorpresas[h] !== 'hecha') return { key: 3, sorpresa: true };
  return { key: 3, done: act == null };
}
/** Inscribirse antes del 29: el botón se vuelve ✓ «¡Listo!» y se abre la espera (hoja). Sin pantalla intermedia. */
export function inscribir(btn) {
  if (S.inscrito) return go('espera', {}, 'page');
  S.inscrito = true; save();
  seen('V2-Confirmacion-claro');
  navigator.vibrate?.(20);
  if (btn) {
    btn.style.transition = 'background .2s, transform .2s cubic-bezier(.23,1,.32,1)';
    btn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" style="stroke-dasharray:40;stroke-dashoffset:40;animation:drawCheck .35s ease-out forwards"/></svg>¡Listo!';
    btn.style.display = 'flex'; btn.style.alignItems = 'center'; btn.style.justifyContent = 'center'; btn.style.gap = '8px';
    btn.style.pointerEvents = 'none'; animate(btn, 'a-pop');
  }
  setTimeout(() => go('espera', { nueva: true }, 'page'), 750);
}
/** Unirse al camino cuando ya empezó (una sola puerta: Hoy, Teodoro y Mundos). */
export function unirse(from) {
  S.inscrito = true; save();
  toast('¡Ya estás dentro!', 'Empieza por el día 1, a tu ritmo');
  go('mapa', { from }, 'push');
}
/** Entrar al camino desde Hoy, Teodoro o Mundos. */
export function entrar(from) {
  if (!S.inscrito) return fase() === 'antes' ? go('teaser', {}, 'modal') : unirse(from);
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
  // los tres números del lienzo (09 · 14 · 32)
  const cells = [...layer.querySelectorAll('*')].filter(el => el.childElementCount === 0 && /^(09|9|14|32)$/.test(el.textContent.trim()));
  cells.forEach(el => { el.dataset.cd = el.textContent.trim(); });
  const tick = () => {
    const ms = Math.max(0, target - new Date());
    const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60;
    const vals = { '09': String(d).padStart(2, '0'), '9': String(d), '14': String(h), '32': String(m).padStart(2, '0') };
    cells.forEach(el => roll(el, vals[el.dataset.cd]));
  };
  tick();
  const iv = setInterval(() => { if (!layer.isConnected) clearInterval(iv); else tick(); }, 1000);
}

// ---------- Hoy ----------
register('hoy', {
  h1: /^(Buenos días|Buenas tardes|Buenas noches|¡Feliz Navidad),/,
  file() {
    const t = dark() ? 1 : 0;
    if (fase() === 'antes') return (S.inscrito ? F('V2-Pre-Hoy-dentro-claro', 'V2-Pre-Hoy-dentro') : F('V2-Pre-Hoy-claro', 'V2-Pre-Hoy'))[t];
    if (S.regreso && S.inscrito) return F('V2-10-Regreso', 'V2-10-Regreso-oscuro')[t];
    if (S.inscrito && pendientes() > 1) return F('S-01-Hoy-atrasado', 'S-01-Hoy-atrasado-oscuro')[t];
    return F('V2-01-Hoy-completo', 'V2-01-Hoy-completo-oscuro')[t];
  },
  async mount(root, p, layer) {
    tabs(root); appContent(root);
    if (fase() !== 'antes') seen('S-01-Hoy', 'S-01-Energia');
    const now = fase() === 'antes' ? new Date() : null;
    const f = now ? { label: `${['DOMINGO','LUNES','MARTES','MIÉRCOLES','JUEVES','VIERNES','SÁBADO'][now.getDay()]} ${now.getDate()} DE ${['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'][now.getMonth()]}` } : dateOf(Math.min(Math.max(S.hoy, 1), 26));
    if (S.hoy >= 27) f.label = 'VIERNES 25 DE DICIEMBRE';
    replaceText(root, /^(LUNES|MARTES|MIÉRCOLES|JUEVES|VIERNES|SÁBADO|DOMINGO) \d+ DE [A-ZÉ]+$/, f.label);
    replaceText(root, /Lucía/g, S.nombre);
    replaceText(root, /^Misiones Diarias$/, 'Misiones diarias');
    const hr = new Date().getHours();
    replaceText(root, /Buenas noches/, S.hoy >= 27 ? '¡Feliz Navidad' : hr < 12 ? 'Buenos días' : hr < 19 ? 'Buenas tardes' : 'Buenas noches');
    if (S.hoy >= 27) replaceText(root, /^¡Feliz Navidad, (.+)$/, '¡Feliz Navidad, $1!');
    paintEnergy(root);
    const rp = root.querySelector('[aria-label^="Racha"]');
    if (rp) { const tn = [...rp.childNodes].find(c => c.nodeType === 3 && /\d/.test(c.nodeValue)); if (tn) tn.nodeValue = String(racha()); rp.setAttribute('aria-label', `Racha: ${racha()} días seguidos`); }
    on(root, 'Perfil', () => nota('Perfil de Theo', 'Ya existe en la app'));
    on(root, 'Racha', () => nota('Racha de la app', 'Hacer Adviento suma a esta racha'));

    if (fase() === 'antes') {
      startCountdown(root);
      on(root, 'Toca para descubrir', () => go('teaser', {}, 'modal'));
      on(root, 'Inscribirme', (ev, el) => inscribir(el)); on(root, 'Unirme gratis', (ev, el) => inscribir(el));
      on(root, 'Ver Camino a Belén', () => go('espera', {}, 'page'));
      on(root, 'Invitar', () => go('invitacion', {}, 'push'));
      on(root, 'Entrar', () => entrar('hoy'));
      if (!S.inscrito && !S.teaserVisto) { S.teaserVisto = true; save(); await wait(900); if (layer.isConnected) go('teaser', {}, 'modal'); }
      return;
    }

    const n = walkDay() ?? Math.min(lastDay(), 26); // donde va Teodoro
    const card = root.querySelector('[role=group][aria-label^="Camino a Belén"]') || root;
    const { st, toMap } = paintCaminoCard(card, 'hoy');
    // ya salió el camino y no está inscrito: la invitación a unirse queda a la vista
    if (st.key === 4 && card !== root) setTimeout(() => { if (layer.isConnected) layer.scrollTo({ top: Math.max(0, card.offsetTop - 150), behavior: reduced() ? 'auto' : 'smooth' }); }, 350);
    // durante el camino la tarjeta va arriba, a la vista; «Tu día con Dios» pasa debajo
    if (card !== root && card.style.top === '468px') {
      const kids = [...card.parentElement.children];
      const tit = kids.find(el => el.style.top === '176px'), list = kids.find(el => el.style.top === '212px');
      if (tit && list) { card.style.top = '176px'; tit.style.top = (176 + card.offsetHeight + 22) + 'px'; list.style.top = (176 + card.offsetHeight + 58) + 'px'; }
    }
    on(root, 'Energía de Teodoro', () => toast(`Energía: ${S.bateria} de 5`, ['Dormido', 'Cabeceando', 'Agotado', 'Tranquilo', 'Travieso', 'Feliz'][S.bateria]));

    // Modal de regreso (una semana o más sin caminar)
    if (S.regreso) {
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
      setText(root, /Empezar por el día \d+/, `Empezar por el día ${n}`);
      on(root, 'Ver el mapa', () => { close(); go('mapa', { from: 'hoy', despierta: true }, 'push'); });
      on(root, 'Cerrar', () => { close(); go('hoy', {}, 'fade', { replace: true }); });
      const teo = $$(root, 'img').find(i => i.src.includes(IMG.tCelebra));
      teo?.classList.add('a-hop');
    }
  },
});

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
  const bar = prog && $$(prog, 'div').find(el => /%/.test(el.style.width));
  if (bar) {
    const pct = (doneCount() / 26 * 100).toFixed(1) + '%';
    const head = bar.nextElementSibling;
    bar.style.transition = 'width 1s cubic-bezier(.2,.8,.2,1)'; bar.style.width = '0%';
    if (head?.style.left) { head.style.transition = 'left 1s cubic-bezier(.2,.8,.2,1)'; head.style.left = 'calc(0% - 14px)'; }
    requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = pct; if (head?.style.left) head.style.left = `calc(${pct} - 14px)`; }));
    prog.setAttribute('aria-label', `Día ${n} de 26: ${doneCount()} hechos, faltan ${26 - doneCount()} para Belén`);
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
  card.setAttribute('aria-label', `Camino a Belén, día ${n} de 26`);
  // el botón dice lo que hará
  const btn = [...card.querySelectorAll('a')].find(a => /Continuar la Aventura/i.test(a.textContent));
  const label = st.key === 4 ? 'Unirme gratis' : st.key === 5 ? 'Ver el nacimiento' : st.sorpresa ? 'Abrir la sorpresa' : st.done ? 'Ver el camino' : 'Continuar la aventura';
  const span = btn?.querySelector('span'); if (span) span.textContent = label; else if (btn) setText(btn, /Continuar la Aventura/i, label);
  // Navidad: el pesebre en la tarjeta
  if (S.hoy >= 27 && scene) {
    const land = $$(scene, 'img').find(i => !/^Teodoro/i.test(i.alt || ''));
    if (land) { land.src = A(IMG.nacimiento); land.alt = 'El nacimiento de Jesús'; Object.assign(land.style, { left: '0', top: '0', width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 35%' }); }
    if (teo) teo.style.display = 'none';
    $$(scene, 'span').forEach(sp => { sp.style.display = 'none'; });
  }
  const toMap = () => st.key === 5 ? go('reproductor', { day: 26, nacimiento: true, replay: true }, 'up') : st.sorpresa ? openSorpresa(Math.min(S.hoy, 26)) : entrar(from);
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
  if (land?.tagName === 'IMG' && !/nacimiento/i.test(land.alt || '') && S.hoy < 27) {
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
  files: F('V2-Teaser-claro', 'V2-Teaser'),
  mount(root, p = {}) {
    startCountdown(root);
    // desde la invitación: es la vista de tu amigo; tú ya estás inscrito
    const reg = find(root, 'Unirme gratis') || find(root, 'Inscribirme');
    if (p.preview) on(root, reg, () => { nota('Aquí tu amigo se inscribe', 'Tú ya estás dentro'); back('invitacion', 'fade'); });
    else on(root, reg, (ev, el) => inscribir(el));
    on(root, 'Ahora no', () => back('hoy', 'fade'));
    on(root, 'Cerrar', () => back('hoy', 'fade'));
    tabs(root); appContent(root);
    ['Ver el camino', 'Ir al camino'].forEach(t => on(root, t, () => toast('Primero inscríbete')));
    const hero = $$(root, 'img').find(i => i.src.includes(IMG.t5) || /Teodoro/.test(i.alt));
    hero?.classList.add('a-bob');
  },
});
register('confirmacion', {
  files: F('V2-Confirmacion-claro', 'V2-Confirmacion'),
  async mount(root, p, layer) {
    S.inscrito = true; save();
    const check = root.querySelector('svg path[d^="M"]');
    const circle = check?.closest('div');
    circle?.classList.add('a-pop');
    if (check) { check.style.strokeDasharray = 40; check.style.strokeDashoffset = 40; check.style.animation = 'drawCheck .5s .35s ease-out forwards'; }
    sparkles(root);
    confetti(layer, 195, 330, 28);
    on(root, '¡Listo, te inscribiste!', () => next());
    let done = false;
    const next = () => { if (done) return; done = true; fase() === 'antes' ? go('espera', {}, 'fade', { replace: true }) : go('mapa', {}, 'fade', { replace: true }); };
    setTimeout(() => { if (layer.isConnected) next(); }, 1600);
  },
});
register('espera', {
  h1: 'Tu camino ya está listo',
  files: F('V2-Espera-claro', 'V2-Espera'),
  mount(root, p, layer) {
    startCountdown(root);
    on(root, 'Ver tu camino a Belén', () => go('mapa', { from: 'espera' }, 'push'));
    // lo único que se puede hacer antes del 29 es el día 0: va primero; invitar, debajo
    const inv = find(root, 'Invitar a un amigo');
    const verDia0 = () => go('mapa', { from: 'espera' }, 'push');
    if (inv) {
      on(root, inv, verDia0);
      const ico = inv.querySelector('svg'); if (ico) ico.outerHTML = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5Z" fill="#0B748A"/></svg>';
      setText(inv, 'Invitar a un amigo', isDone(0) ? 'Ver mi camino' : 'Ver el día 0');
    }
    // vuelve a donde estaba (Hoy o Teodoro), sin pasar otra vez por el teaser
    const ahoraNo = find(root, 'Ahora no');
    if (ahoraNo) { setText(ahoraNo, 'Ahora no', 'Invitar a un amigo'); on(root, ahoraNo, () => go('invitacion', {}, 'push')); }
    on(root, 'Cerrar', () => back('hoy', 'down', ['teaser', 'confirmacion']));
    // «2.418 familias ya se unieron»: el número cuenta hasta su valor; la frase se cambia una sola vez
    const fam = textEl(root, /2\.418 familias/);
    if (fam) {
      const tail = [...(fam.parentElement?.childNodes || [])].find(c => c.nodeType === 3 && /ya caminan/.test(c.nodeValue));
      if (tail) tail.nodeValue = ' ya se unieron';
      const fmt = v => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      const put = v => { fam.textContent = fmt(v) + ' familias'; };
      if (reduced()) put(2418);
      else { let v = 1800; put(v); const iv = setInterval(() => { v = Math.min(2418, v + 37); put(v); if (v >= 2418 || !layer.isConnected) clearInterval(iv); }, 30); }
    }
    $$(root, 'img').find(i => i.src.includes(IMG.t5))?.classList.add('a-bob');
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
    on(root, flecha, () => back(fase() === 'antes' ? 'espera' : 'hoy'));
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
  mount(root) {
    tabs(root);
    const n = walkDay() ?? Math.min(lastDay(), 26);
    replaceText(root, /Día 9 de 26/, `Día ${n} de 26`);
    replaceText(root, /^Día 9$/, `Día ${n}`);
    const isla = root.querySelector('a[aria-label^="Adviento:"]'); // se toma antes de tocar etiquetas
    const tCard = root.querySelector('a[aria-label="Ver el camino"]')?.parentElement;
    const { st, toMap } = tCard && fase() !== 'antes' ? paintCaminoCard(tCard, 'teodoro') : { st: cardState(), toMap: () => entrar('teodoro') };
    replaceText(root, /^Misiones Diarias$/, 'Misiones diarias');
    paintEnergy(root);
    patchCuarto(root);
    if (fase() === 'antes') startCountdown(root);
    // la isla del cuarto lleva a los mundos de Teodoro; el botón de la tarjeta, al camino
    if (isla) {
      isla.setAttribute('aria-label', 'Mundos de Teodoro: Adviento'); on(root, isla, () => go('mundos', {}, 'push'));
      isla.querySelectorAll('span').forEach(sp => { if (/Día/.test(sp.textContent)) sp.style.display = 'none'; });
      isla.classList.add('a-bob');
    }
    on(root, 'Ver mis mundos', () => go('mundos', {}, 'push'));
    on(root, 'Toca para descubrir', () => go('teaser', {}, 'modal'));
    on(root, 'Inscribirme', (ev, el) => inscribir(el)); on(root, 'Unirme gratis', (ev, el) => inscribir(el));
    on(root, 'Ver Camino a Belén', () => go('espera', {}, 'page'));
    on(root, 'Invitar', () => go('invitacion', {}, 'push'));
    on(root, 'Entrar', () => entrar('teodoro'));
    $$(root, 'img').filter(i => /Teodoro/.test(i.alt || '')).slice(0, 1).forEach(i => i.classList.add('a-bob'));
    // prendas ganadas en la ruleta, visibles en el cuarto
    if (S.prendas.length > (S.prendasVistas || 0)) { S.prendasVistas = S.prendas.length; save(); toast('Tu cuarto', `Prendas ganadas: ${S.prendas.map(id => PRENDAS.find(p => p.id === id)?.nombre.replace(/^un[a]? /, '')).join(', ')}`); }
  },
});
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
    'left:206px;top:55px;width:74px;height:44px;border-radius:22px;background:#37ABC4;display:flex;align-items:center;justify-content:center;gap:4px;color:#FFFFFF;font:700 18px "Neue Montreal",Mulish,sans-serif;box-shadow:0 4px 12px rgba(0,8,43,.12)')
    .setAttribute('aria-label', `Racha: ${racha()} días seguidos`);
  // prendas ganadas en la ruleta: Teodoro las lleva puestas (la cama de paja va en el suelo)
  ponerPrendas();
  add(String(S.panes), 'left:336px;top:520px;width:40px;height:24px;background:rgb(251,242,229);color:#4A2E14;display:grid;place-items:center;font:800 15px Mulish,sans-serif')
    .setAttribute('aria-label', `${S.panes} panes`);
}
register('mundos', {
  files: F('V2-02-Mundos-claro', 'V2-02-Mundos'),
  mount(root) {
    tabs(root);
    const n = walkDay() ?? Math.min(lastDay(), 26);
    replaceText(root, /Día 9 de 26/, `Día ${n} de 26`);
    root.querySelector('a[aria-label^="Adviento:"]')?.setAttribute('aria-label', `Adviento: Camino a Belén, día ${n} de 26. Entrar al camino`);
    on(root, 'Adviento', () => entrar('mundos'));
    on(root, 'Volver al cuarto de Teodoro', () => back('teodoro'));
    on(root, 'Enero', () => toast('Enero', 'El próximo mundo: pronto'));
  },
});

// ---------- Contenido del día ----------
register('reproductor', {
  files: F('S-05-Reproductor', 'S-05-Reproductor-oscuro'),
  mount(root, p, layer) {
    const n = p.day; const d = DAYS[n];
    setText(root, /Meditación de la Escucha/, p.nacimiento ? 'El nacimiento de Jesús' : p.extra === 'cancion' ? 'Canción para cantar en familia' : n === 0 ? '¿Qué es el Adviento?' : d.title);
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
      if (p.replay) { setBateria(5); S.ultimoJugado = S.hoy; save(); toast('¡Otra vez con Teodoro!', 'Teodoro quedó al 100%'); go('mapa', {}, 'down', { replace: true }); return; }
      finishContent(n);
      if (n === 0) { toast('¡Listo para salir!', 'Te avisamos el 29 de noviembre'); go('mapa', {}, 'down', { replace: true }); return; }
      go('completado', { day: n }, 'fade', { replace: true });
    };
    on(root, play, () => setPlaying(!playing));
    on(root, 'Retroceder 10 segundos', () => { t = Math.max(0, t - 1000); paint(); });
    on(root, 'Adelantar 10 segundos', () => { t = Math.min(DUR, t + 1000); paint(); });
    if (slider) on(root, slider, ev => { const r = slider.getBoundingClientRect(); t = DUR * Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)); paint(); });
    ['Texto', 'Voz', 'Repetir'].forEach(k => on(root, k, (ev, el) => { const s = el.querySelector('span'); if (s) s.style.background = s.style.background.includes('255,255,255,.2') || s.style.background.includes('0.2') ? '#FFFFFF' : 'rgba(255,255,255,.2)'; nota(k, 'Control del reproductor de Theo (ya existe)'); }));
    const cerrar = () => { cancelAnimationFrame(raf); if (p.nacimiento || p.extra === 'cancion') back('mapa', 'down'); else go('mapa', {}, 'down', { replace: true }); };
    on(root, 'Bajar el reproductor', cerrar);
    const x = document.createElement('button');
    x.type = 'button'; x.setAttribute('aria-label', 'Cerrar');
    x.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
    x.style.cssText = 'position:absolute;left:14px;top:54px;width:44px;height:44px;border-radius:22px;border:0;background:rgba(0,8,43,.35);display:grid;place-items:center;cursor:pointer;z-index:6';
    root.appendChild(x); on(root, x, cerrar);
    if (slider) { slider.style.paddingBlock = '15px'; slider.style.marginTop = '-15px'; slider.style.backgroundClip = 'content-box'; }
  },
});

register('hub', {
  files: F('S-04-Hub-familia', 'S-04-Hub-familia-oscuro'),
  mount(root, p, layer) {
    const n = p.day; const d = DAYS[n];
    replaceText(root, /^DÍA 13$/, `DÍA ${n}`);
    setText(root, 'Pesebre', d.title);
    setText(root, 'Coloréalo con tu familia', d.reto || 'Un reto para hacer juntos');
    setText(root, /Al terminar ganas \d+ panes/, `Al terminar ganas ${panesContenido()} panes`);
    setText(root, 'Pesebre para colorear', d.retoSub || 'Para hacer en casa');
    $$(root, 'img').filter(i => /Teodoro/.test(i.alt || '')).forEach(i => i.classList.add('a-bob'));
    sparkles(root);
    on(root, 'Volver al mapa', () => go('mapa', {}, 'down', { replace: true }));
    on(root, 'Escuchar a Teodoro', () => nota('Teodoro explica el reto', 'Audio por grabar'));
    on(root, 'Reto en familia', () => go('desafioIntro', { day: n, fromHub: true }, 'fade'));
    on(root, '¡Lo hicimos!', (ev, el) => { if (p.replay) { toast('¡Otra vez en familia!'); go('mapa', {}, 'down', { replace: true }); return; } finishContent(n); animate(el, 'a-pop'); setTimeout(() => go('completado', { day: n }, 'fade', { replace: true }), 260); });
    // los extras del reto son descargables: con free piden Premium (y lo dicen antes de tocarlos)
    if (!premium()) ['Imprimible', 'Canción'].forEach(t => { const el = find(root, t); if (!el || el.querySelector('.pill-premium')) return; const pl = document.createElement('span'); pl.className = 'pill-premium'; pl.textContent = 'Premium'; el.style.position ||= 'relative'; el.appendChild(pl); });
    on(root, 'Imprimible', () => premium() ? go('imprimible', { day: n }, 'push') : go('free', { back: 'hub', day: n }, 'page'));
    on(root, 'Canción', () => premium() ? go('reproductor', { day: n, extra: 'cancion' }, 'up') : go('free', { back: 'hub', day: n }, 'page'));
  },
});

register('completado', {
  files: F('S-06-Completado', 'S-06-Completado-oscuro'),
  mount(root, p, layer) {
    const n = p.day; const d = DAYS[n];
    const que = { domingo: '¡Escuchaste el Evangelio!', meditacion: '¡Terminaste la meditación!', cuento: '¡Terminaste el cuento!', amigos: '¡Terminaste la historia!', cancion: '¡Cantaste la canción!', reto: '¡Hicieron el reto!', juego: '¡Jugaste con Teodoro!', video: '¡Viste el video!' }[d.type];
    setText(root, '¡Terminaste el cuento!', que);
    setText(root, /sobre el cuento de hoy/, d.type === 'reto' ? 'sobre el reto de hoy' : 'sobre lo de hoy');
    const chip = find(root, 'Ganaste 20 panes');
    if (chip) { replaceText(chip, /\+20/, '+' + panesContenido()); chip.setAttribute('aria-label', `Ganaste ${panesContenido()} panes`); chip.classList.add('a-pop'); }
    floaty(layer, '+' + panesContenido(), 290, 110);
    const q = textEl(root, '?')?.parentElement; q?.classList.add('a-pop');
    $$(root, '[style*="rotate(-12deg)"], [style*="rotate(12deg)"]').forEach((c, i) => { c.style.setProperty('--r', i ? '12deg' : '-12deg'); c.style.animation = `popRot .55s ${.15 + i * .1}s cubic-bezier(.2,.9,.3,1.3) both`; });
    $$(root, 'img').find(i => i.src.includes(IMG.tPregunta))?.classList.add('a-bob');
    confetti(layer, 195, 260, 30);
    on(root, '¡A jugar!', () => go('trivia', { day: n }, 'push', { replace: true }));
    const cal = find(root, 'Califícanos'); if (cal) cal.style.display = 'none';
    if (chip) { chip.style.pointerEvents = 'none'; chip.removeAttribute('role'); }
    const out = () => go('mapa', {}, 'down', { replace: true });
    on(root, 'Ahora no', out); on(root, 'Cerrar', out);
  },
});

register('calificacion', {
  h1: '¿Te gustó?',
  files: F('V2-Calificacion-claro', 'V2-Calificacion'),
  mount(root, p) {
    // las 3 caritas empiezan sin elegir; la elegida crece, se dora y lleva la palomita
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
    const enviar = find(root, 'Enviar');
    const lock = v => { if (enviar) { enviar.style.opacity = v ? '.45' : '1'; enviar.style.pointerEvents = v ? 'none' : ''; enviar.setAttribute('aria-disabled', String(v)); } };
    lock(true);
    opts.forEach((el, k) => on(root, el, () => {
      opts.forEach((o, j) => paintFace(o, j, j === k));
      S._voto = el.getAttribute('aria-label'); lock(false); navigator.vibrate?.(10);
    }));
    const box = $$(root, 'div').find(el => /Lo que más te gustó/.test(el.textContent) && el.childElementCount <= 3 && el.style.borderRadius);
    if (box) {
      const ta = document.createElement('textarea');
      ta.placeholder = 'Lo que más te gustó…';
      ta.setAttribute('aria-label', 'Comentario opcional');
      ta.style.cssText = 'position:absolute;inset:0;border:0;background:transparent;resize:none;padding:16px 16px 16px 44px;font:500 16px Mulish,sans-serif;color:inherit;outline:none';
      box.style.position = box.style.position || 'relative';
      [...box.childNodes].forEach(c => { if (c.nodeType === 3 || (c.tagName !== 'svg' && !c.querySelector?.('svg'))) c.remove?.(); });
      box.appendChild(ta);
    }
    const volver = () => back(p.back || 'mapa', 'down');
    on(root, 'Enviar', () => { if (!S._voto) return; toast('¡Gracias por contarnos!'); volver(); });
    on(root, 'Ahora no', volver); on(root, 'Cerrar', volver);
  },
});

register('free', {
  files: F('V2-24-Dia-completo-claro', 'V2-24-Dia-completo'),
  mount(root, p) {
    const volver = () => back(p.back || 'mapa', 'down');
    on(root, 'Ver Theo Premium', () => nota('Paywall de Theo Premium', 'Ya existe en la app'));
    on(root, 'Volver al mapa', volver); on(root, 'Cerrar', volver);
    setText(root, 'Volver al mapa', 'Ahora no');
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
    setText(root, /El día \d+ se abre a medianoche\./, next > 26 ? '¡Llegaste a Belén! Mañana es Navidad.' : `El día ${next} se abre a medianoche.`);

    // cuenta regresiva real hasta medianoche
    const cdEl = textEl(root, /Faltan \d+ h \d+ min/);
    const cd = cdEl && [...cdEl.childNodes].find(c => c.nodeType === 3 && /Faltan/.test(c.nodeValue));
    const tick = () => { const now = new Date(); const mid = new Date(now); mid.setHours(24, 0, 0, 0); const ms = mid - now; if (cd) cd.nodeValue = `Faltan ${Math.floor(ms / 36e5)} h ${Math.floor(ms / 6e4) % 60} min`; };
    tick(); const iv = setInterval(() => layer.isConnected ? tick() : clearInterval(iv), 1000);
    $$(root, 'span').filter(s => s.textContent.trim() === 'z').forEach((z, i) => { z.style.display = 'inline-block'; z.style.animation = `zz 2.4s ${i * .8}s ease-out infinite`; });
    $$(root, 'img').find(i => /duerme/.test(i.alt || ''))?.classList.add('a-bob');
    const ok = find(root, 'Entendido');
    if (ok) { setText(ok, 'Entendido', 'Hasta mañana'); on(root, ok, () => go('hoy', {}, 'down', { tab: true })); }
    // calificar el día: aquí, al cerrar, y no en el momento del premio
    const dlg = root.querySelector('[role=dialog]');
    if (dlg && S.calificado !== lastDay()) {
      const q = document.createElement('button');
      q.type = 'button'; q.className = 'cal-link'; q.textContent = '¿Les gustó hoy?';
      dlg.appendChild(q);
      on(root, q, () => { S.calificado = lastDay(); save(); go('calificacion', { back: 'mapa' }, 'page', { replace: true }); });
    }
  },
});

// ---------- Ruleta (días 4, 11, 18 y 24) ----------
const SEGMENTS = ['panes', 'manzana', 'panes', 'panes', 'prenda', 'panes', 'panes', 'panes', 'panes', 'cuarto'];
register('ruletaPop', {
  files: F('S-05b-Ruleta-pop', 'S-05b-Ruleta-pop-oscuro'),
  mount(root, p, layer) {
    const n = p.day;
    setText(root, /Antes del cuento…/, 'Antes de la historia…');
    // velo más firme: el mapa de atrás no compite con la ruleta
    const sc = root.querySelector('.ov-scrim'); if (sc) { sc.style.background = 'rgba(0,20,50,.8)'; sc.style.backdropFilter = 'blur(6px)'; sc.style.webkitBackdropFilter = 'blur(6px)'; }
    const wheel = root.querySelector('[role=img][aria-label^="Ruleta"] > div');
    wheel?.parentElement.classList.add('a-pop');
    const pointer = $$(root, 'img').find(i => i.src.includes('3fdb655b'));
    let spun = false;
    on(root, '¡Girar!', async (ev, btn) => {
      if (spun) return; spun = true;
      btn.style.opacity = '.6'; btn.style.pointerEvents = 'none';
      const tarde = find(root, 'Más tarde'); if (tarde) tarde.style.visibility = 'hidden'; layer.querySelector('.pop-x')?.remove();
      // premio: el forzado en el panel o al azar (todas las casillas ganan)
      const forced = S.forzarPremio;
      const weekId = PRENDAS[RULES.ruleta.indexOf(n)]?.id;
      const pick = () => {
        if (weekId && !S.prendas.includes(weekId) && Math.random() < .35) return SEGMENTS.indexOf('prenda');
        let i = Math.floor(Math.random() * SEGMENTS.length);
        if (SEGMENTS[i] === 'cuarto' && S.cuartoNuevo) i = SEGMENTS.indexOf('prenda');
        return i;
      };
      let idx = forced ? SEGMENTS.indexOf(forced) : pick();
      if (idx < 0) idx = 0;
      const premio = SEGMENTS[idx];
      const target = 360 * 6 + (360 - idx * 36) + (Math.random() * 16 - 8);
      if (wheel) {
        // anticipación: la rueda se echa un poquito atrás antes de salir
        if (!reduced()) await wheel.animate([{ rotate: '0deg' }, { rotate: '-10deg' }], { duration: 180, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'forwards' }).finished;
        wheel.classList.add('wheel-spin');
        if (reduced()) wheel.style.transition = 'transform .3s';
        wheel.getAnimations().forEach(a => a.cancel());
        wheel.style.transform = `rotate(${target}deg)`;
        // el puntero golpea cada vez que pasa una casilla (36°), al ritmo real de la rueda
        if (pointer && !reduced()) {
          let lastSeg = 0, lastT = performance.now(), turns = 0, prevA = 0;
          const tickP = now => {
            if (!layer.isConnected || !wheel.classList.contains('wheel-spin')) return;
            const m = new DOMMatrix(getComputedStyle(wheel).transform);
            let ang = Math.atan2(m.b, m.a) * 180 / Math.PI; if (ang < 0) ang += 360;
            if (ang < prevA - 180) turns++; prevA = ang;
            const seg = Math.floor((turns * 360 + ang) / 36);
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
      const prize = premio === 'prenda' ? PRENDAS[week].id : premio;
      S.ruletas[n] = prize; delete S.ruletaPendiente[n];
      if (premio === 'panes') addPanes(RULES.panes.ruleta);
      if (premio === 'prenda') S.prendas.push(PRENDAS[week].id);
      if (premio === 'cuarto') S.cuartoNuevo = true;
      if (premio === 'manzana') setBateria(Math.min(5, S.bateria + 1));
      save();
      navigator.vibrate?.(30);
      await wait(300);
      go(premio === 'cuarto' ? 'premioCuarto' : 'ruletaPremio', { premio: prize, day: n, from: p.from }, 'modal', { replace: true });
    });
    const tarde0 = find(root, 'Más tarde'); if (tarde0) tarde0.dataset.back = '1';
    // una X para cerrar (igual que «Más tarde»: la ruleta queda pendiente y se puede girar después)
    const x = document.createElement('button'); x.type = 'button'; x.className = 'pop-x'; x.setAttribute('aria-label', 'Cerrar');
    x.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
    (root.querySelector('.ov-body') || root).appendChild(x);
    x.addEventListener('click', () => tarde0?.click());
    on(root, 'Más tarde', () => {
      S.ruletaPendiente[n] = true; save();
      toast('La ruleta te espera', 'Gírala cuando quieras desde el mapa');
      if (p.from === 'mapa') go('mapa', {}, 'down', { replace: true }); else go(DAYS[n].type === 'reto' ? 'hub' : 'reproductor', { day: n }, 'fade', { replace: true });
    });
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
    else if (p.premio === 'manzana' && subEl) subEl.textContent = 'Teodoro se la comió: ¡más energía!';
    if (p.premio !== 'cuarto') floaty(layer, p.premio === 'panes' ? `+${RULES.panes.ruleta}` : '¡Nuevo!', 250, 210, p.premio === 'panes' ? IMG.pan : null);
    const cont = () => p.from === 'mapa' || contentDone(n) ? go('mapa', {}, 'down', { replace: true }) : go(DAYS[n].type === 'reto' ? 'hub' : 'reproductor', { day: n }, 'fade', { replace: true });
    confetti(layer, 195, 300, 36);
    const seguir = on(root, 'Empezar el cuento', cont); if (seguir) seguir.dataset.back = '1';
    setText(root, 'Empezar el cuento', p.from === 'mapa' || contentDone(n) ? 'Volver al camino' : ctaLabel(n).text);
    const ver = find(root, 'Ver a Teodoro');
    if (ver && !(p.from === 'mapa' || contentDone(n))) ver.style.display = 'none'; // primero la historia
    else on(root, 'Ver a Teodoro', () => go('teodoro', {}, 'fade', { tab: true }));
  },
});
register('premioCuarto', {
  files: F('S-09-Premio-cuarto', 'S-09-Premio-cuarto-oscuro'),
  mount(root, p, layer) {
    const n = p.day;
    confetti(layer, 195, 300, 50);
    const room = $$(root, 'img').find(i => i.src.includes(IMG.cuarto)) || $$(root, 'img')[1];
    room?.parentElement?.classList.add('a-pop');
    const nextW = RULES.ruleta.find(x => !S.ruletas[x]);
    setText(root, /La próxima ruleta.*/, nextW ? `La próxima ruleta, el día ${nextW}` : 'Ya abriste todas las ruletas');
    const out = () => p.from === 'mapa' || contentDone(n) ? go('mapa', {}, 'down', { replace: true }) : go(DAYS[n].type === 'reto' ? 'hub' : 'reproductor', { day: n }, 'fade', { replace: true });
    on(root, 'Salir de la ruleta', out); on(root, 'Cerrar', out);
    const sigue = !(p.from === 'mapa' || contentDone(n));
    const btn = find(root, 'Ver su cuarto nuevo'); // se toma antes de cambiarle el texto
    if (btn) { on(root, btn, out); btn.dataset.back = '1'; setText(btn, 'Ver su cuarto nuevo', sigue ? ctaLabel(n).text : 'Volver al camino'); }
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
    if (first) { S.completos[26] = { contenido: true }; S.pasoAnimado = null; addPanes(panesContenido()); save(); }
    replaceText(root, /Lucía/g, S.nombre);
    const total = doneCount() + (isDone(26) ? 0 : 0);
    setText(root, /^26$/, String(Math.min(26, doneCount())));
    const scene = $$(root, 'img')[0];
    if (first && !reduced()) {
      scene?.animate([{ opacity: 0, transform: 'scale(1.04)' }, { opacity: 1, transform: 'none' }], { duration: 1200, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
      $$(root, 'a').forEach(a => a.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: 1800, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'backwards' }));
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
    const dias = doneCount();
    const estrellas = Object.values(S.completos).reduce((s, c) => s + (c.estrellas || 0), 0);
    replaceText(root, /Lucía/g, S.nombre);
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

register('imprimible', {
  files: F('S-04c-Imprimible', 'S-04c-Imprimible-oscuro'),
  mount(root, p) {
    const sheet = [...root.querySelectorAll('div, img')].find(x => x.style.transform && /rotate/.test(x.style.transform));
    sheet?.classList.add('a-pop');
    on(root, 'Volver', () => back('hub'));
    ['Imprimir', 'Guardar'].forEach(t => on(root, t, () => nota(t, 'En el celular se abre el menú del teléfono')));
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
