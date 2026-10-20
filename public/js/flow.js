// Flujo del camino: qué pasa al tocar cada cosa y qué pantalla del lienzo se ve.
import { S, save, A, $, $$, on, find, go, register, seen, toast, hueco, paintEnergy, teodoroImg, activeDay, isDone, contentDone,
  lastDay, pendientes, fase, dark, stars, wait, reduced, animate, replaceText, setText, textEl, swapImg, floaty, confetti,
  addPanes, setBateria, doneCount, frag } from './core.js';
import { DAYS, TYPES, RULES, PRENDAS, IMG, dateOf, iconOf } from './data.js';

const F = (claro, oscuro) => [claro, oscuro];
const premium = () => S.plan === 'premium';
export const panesContenido = () => premium() ? RULES.panes.contenidoPremium : RULES.panes.contenidoFree;

// ---------- Reglas del día ----------
/** Empieza (o retoma) el día n desde el mapa. */
export function startDay(n) {
  const d = DAYS[n];
  if (n === 26) { go('final', { day: 26 }, 'fade'); return; }
  if (!contentDone(n)) {
    if (RULES.ruleta.includes(n) && !S.ruletas[n] && !S.ruletaPendiente[n]) { go('ruletaPop', { day: n }, 'modal'); return; }
    go(d.type === 'reto' ? 'hub' : 'reproductor', { day: n }, 'up');
    return;
  }
  if (!isDone(n)) { go('trivia', { day: n }, 'push'); return; }
  if (RULES.sorpresa[n] && S.sorpresas[n] !== 'hecha') { openSorpresa(n); return; }
  go('cerrado', {}, 'up');
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
  if (n === 0) return { text: 'Te avisamos el 29 de noviembre', go: () => go('hoy', {}, 'back') };
  if (!isDone(n)) return { text: 'Jugar la trivia', go: () => startDay(n) };
  if (RULES.sorpresa[n] && S.sorpresas[n] !== 'hecha') return { text: 'Abrir la sorpresa', go: () => openSorpresa(n) };
  const a = activeDay();
  if (a != null) return { text: `Seguir al día ${a}`, go: () => startDay(a) };
  if (S.hoy >= 26) return { text: 'Ver el nacimiento', go: () => go('final', { day: 26 }, 'fade') };
  return { text: 'Mañana seguimos', go: () => go('cerrado', {}, 'up') };
}
/** Termina el contenido del día: suma batería y panes. */
function finishContent(n) {
  const first = !contentDone(n);
  S.completos[n] = { ...(S.completos[n] || {}), contenido: true };
  if (first && n > 0) { setBateria(S.bateria + RULES.bateria.contenido); addPanes(panesContenido()); }
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
  on(root, 'Hoy', () => go('hoy', {}, 'fade'));
  on(root, 'Teodoro', () => go('teodoro', {}, 'fade'));
  ['Explorar', 'Música', 'Favoritos'].forEach(t => on(root, t, () => toast(`Pestaña «${t}» de Theo`, 'Ya existe en la app; fuera del reto')));
  on(root, 'Ajustes', () => toast('Ajustes de Theo', 'Ya existen en la app'));
}
function appContent(root) {
  ['Villancicos', 'Oración de la noche', 'Evangelio del día', 'El cuento de hoy', 'La afirmación de hoy', 'PARA REZAR EN FAMILIA', 'Los peces en el río', 'Ven, Señor Jesús', 'Noche de paz', 'Ver todo']
    .forEach(t => on(root, t, () => toast('Contenido de Theo', 'Ya existe en la app; aquí no cambia')));
}
/** Destellos decorativos del lienzo (estrellitas sueltas): titilan. Nunca íconos de botones. */
export function sparkles(root) {
  $$(root, 'svg').filter(s => s.style.position === 'absolute' && !s.closest('a, button, nav') && /#F5D|#F5C|#FFF3|#F7C/i.test(s.innerHTML))
    .forEach((s, i) => { s.classList.add('a-twinkle'); s.style.animationDelay = (i * .35) + 's'; });
}
const dayLine = n => n === 0 ? 'Día 0 · ¿Qué es el Adviento?' : `Día ${n} · ${DAYS[n].title}`;

// Cuenta regresiva real hasta el 29 de noviembre de 2026
function startCountdown(layer) {
  const target = new Date(2026, 10, 29, 0, 0, 0);
  const tick = () => {
    const ms = Math.max(0, target - new Date());
    const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60;
    const pad = v => String(v).padStart(2, '0');
    // los tres números del lienzo (09 · 14 · 32)
    const cells = [...layer.querySelectorAll('*')].filter(el => el.childElementCount === 0 && /^(09|9|14|32)$/.test(el.textContent.trim()));
    const vals = { '09': pad(d), '9': String(d), '14': String(h), '32': pad(m) };
    cells.forEach(el => { el.dataset.cd ??= el.textContent.trim(); el.textContent = vals[el.dataset.cd]; });
  };
  tick();
  const iv = setInterval(() => { if (!layer.isConnected) clearInterval(iv); else tick(); }, 15000);
}

// ---------- Hoy ----------
register('hoy', {
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
    paintEnergy(root);
    on(root, 'Perfil', () => toast('Perfil de Theo', 'Ya existe en la app'));
    on(root, 'Racha', () => toast('Racha de la app', 'Hacer Adviento suma a esta racha'));

    if (fase() === 'antes') {
      startCountdown(root);
      on(root, 'Toca para descubrir', () => go('teaser', {}, 'modal'));
      on(root, 'Inscribirme', () => go('confirmacion', {}, 'fade'));
      on(root, 'Ver Camino a Belén', () => go('espera', {}, 'up'));
      on(root, 'Invitar', () => go('invitacion', {}, 'push'));
      on(root, 'Entrar', () => go('espera', {}, 'up'));
      if (!S.inscrito && !S.teaserVisto) { S.teaserVisto = true; save(); await wait(900); if (layer.isConnected) go('teaser', {}, 'modal'); }
      return;
    }

    const act = activeDay();
    const n = act ?? Math.min(lastDay(), 26);
    const card = root.querySelector('[role=group][aria-label^="Camino a Belén"]') || root;
    const sub = textEl(card, /Día \d+ · /);
    if (sub) sub.textContent = dayLine(n);
    // barra de progreso: Teodoro avanza por los 26 días
    const bar = $$(card, 'div').find(el => /%/.test(el.style.width) && el.style.background.includes('gradient'));
    if (bar) {
      const pct = (Math.max(doneCount(), 0) / 26 * 100).toFixed(1) + '%';
      bar.style.transition = 'width 1s cubic-bezier(.2,.8,.2,1)'; const head = bar.nextElementSibling;
      bar.style.width = '0%'; if (head?.style.left) head.style.transition = 'left 1s cubic-bezier(.2,.8,.2,1)';
      requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = pct; if (head?.style.left?.includes('calc')) head.style.left = `calc(${pct} - 14px)`; }));
    }
    const walk = $$(card, 'img').find(i => /Teodoro camina/.test(i.alt));
    walk?.classList.add('a-bob');
    // tarjeta del camino según el estado (lienzo: «Estados de la tarjeta del reto»)
    const btn = find(card, 'Continuar la Aventura');
    const btnText = btn && [...btn.querySelectorAll('*'), btn].map(e => [...e.childNodes]).flat().find(c => c.nodeType === 3 && c.nodeValue.trim());
    const title = textEl(card, 'Camino a Belén');
    if (!S.inscrito) {
      if (title) title.textContent = '¡Ya salimos! ¿Vienes?';
      if (sub) sub.textContent = 'Camino a Belén · Aún llegas a Belén';
      if (btnText) btnText.nodeValue = 'Unirme al camino';
    } else if (S.hoy >= 27) {
      const faltan = 26 - doneCount();
      if (title) title.textContent = faltan ? `Te faltan ${faltan} días` : '¡Llegaste a Belén!';
      if (sub) sub.textContent = faltan ? 'Hasta el 6 de enero' : '26 de 26 días';
      if (btnText) btnText.nodeValue = faltan ? 'Seguir caminando' : 'Ver mi camino';
    } else if (act == null) {
      if (sub) sub.textContent = `Día ${n} · ¡Listo! Mañana seguimos`;
    }
    // pastillas «días que te esperan» (pantalla atrasado)
    const pills = $$(card, '[style*="border-radius: 50%"]').filter(el => /^\d+$/.test(el.textContent.trim()));
    pills.forEach((el, i) => { el.textContent = String(n + 1 + i); });

    const toMap = () => S.inscrito ? go('mapa', { from: 'hoy' }, 'push') : go('confirmacion', { late: true }, 'fade');
    on(root, 'Ver el camino', toMap);
    on(root, 'Continuar la Aventura', toMap);
    on(root, 'Energía de Teodoro', () => toast(`Energía: ${S.bateria} de 5`, ['Dormido', 'Cabeceando', 'Agotado', 'Tranquilo', 'Travieso', 'Feliz'][S.bateria]));

    // Modal de regreso (una semana o más sin caminar)
    if (S.regreso) {
      const nums = [...root.children].filter(el => el.style.top === '528px');
      const boxes = [...root.children].filter(el => el.style.top === '482px' && el.querySelector('img'));
      const more = [...root.children].find(el => /^\+\d+$/.test(el.textContent.trim()));
      const pend = pendientes();
      nums.forEach((el, i) => { el.textContent = String(n + i); el.style.visibility = n + i <= lastDay() ? '' : 'hidden'; });
      boxes.forEach((el, i) => { const ic = iconOf(n + i, dark()); const im = el.querySelector('img'); if (ic && im) im.src = A(ic); el.style.visibility = n + i <= lastDay() ? '' : 'hidden'; el.style.animation = `pop .45s ${.3 + i * .15}s cubic-bezier(.2,.9,.3,1.3) both`; });
      if (more) { if (pend > 3) more.textContent = `+${pend - 3}`; else more.style.visibility = 'hidden'; }
      root.querySelector('[role=dialog]')?.setAttribute('aria-label', `Volviste. Te guardé el camino: te esperan ${pend} días`);
      const close = () => { S.regreso = false; save(); };
      on(root, /Empezar por el día/.source ? 'Empezar por el día' : '', () => { close(); go('mapa', { from: 'hoy' }, 'push'); });
      setText(root, /Empezar por el día \d+/, `Empezar por el día ${n}`);
      on(root, 'Ver el mapa', () => { close(); go('mapa', { from: 'hoy' }, 'push'); });
      on(root, 'Cerrar', () => { close(); go('hoy', {}, 'fade'); });
      const teo = $$(root, 'img').find(i => i.src.includes(IMG.tCelebra));
      teo?.classList.add('a-hop');
    }
  },
});

// ---------- Antes del 29 ----------
register('teaser', {
  files: F('V2-Teaser-claro', 'V2-Teaser'),
  mount(root) {
    startCountdown(root);
    on(root, 'Inscribirme', () => go('confirmacion', {}, 'fade'));
    on(root, 'Ahora no', () => go('hoy', {}, 'fade'));
    on(root, 'Cerrar', () => go('hoy', {}, 'fade'));
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
    const next = () => { if (done) return; done = true; fase() === 'antes' ? go('espera', {}, 'fade') : go('mapa', { from: 'hoy' }, 'fade'); };
    await wait(2000); if (layer.isConnected) next();
  },
});
register('espera', {
  files: F('V2-Espera-claro', 'V2-Espera'),
  mount(root) {
    startCountdown(root);
    on(root, 'Ver tu camino a Belén', () => go('mapa', { from: 'espera' }, 'push'));
    on(root, 'Invitar a un amigo', () => go('invitacion', {}, 'push'));
    on(root, 'Ahora no', () => go('hoy', {}, 'down'));
    on(root, 'Cerrar', () => go('hoy', {}, 'down'));
    const fam = textEl(root, /2\.418 familias/);
    if (fam && !reduced()) {
      const fmt = v => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      let v = 1800; const iv = setInterval(() => { v = Math.min(2418, v + 37); fam.textContent = fam.textContent.replace(/[\d.]+ familias/, fmt(v) + ' familias'); if (v >= 2418) clearInterval(iv); }, 30);
    }
    $$(root, 'img').find(i => i.src.includes(IMG.t5))?.classList.add('a-bob');
  },
});
register('invitacion', {
  files: F('V2-Invitacion-claro', 'V2-Invitacion'),
  mount(root) {
    seen('Invitacion-imagen');
    on(root, 'Vista previa del enlace', () => { toast('Así lo ve tu amigo al tocar el enlace'); go('teaser', {}, 'modal'); });
    const back = $$(root, 'a, button')[0];
    if (back && !back.dataset.bound) on(root, back, () => go(fase() === 'antes' ? 'espera' : 'hoy', {}, 'back'));
    on(root, 'Mensaje', () => toast('Chat de ejemplo', 'Simula WhatsApp/iMessage'));
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
    const n = activeDay() ?? Math.min(lastDay(), 26);
    replaceText(root, /Día 9 de 26/, `Día ${n} de 26`);
    replaceText(root, /^Día 9$/, `Día ${n}`);
    paintEnergy(root);
    const toMap = () => S.inscrito || fase() !== 'antes' ? (S.inscrito ? go('mapa', { from: 'teodoro' }, 'push') : go('confirmacion', { late: true }, 'fade')) : go('teaser', {}, 'modal');
    on(root, 'Adviento', toMap);
    on(root, 'Entrar al camino', toMap);
    on(root, 'Ver mis mundos', () => go('mundos', {}, 'push'));
    on(root, 'Toca para descubrir', () => go('teaser', {}, 'modal'));
    on(root, 'Inscribirme', () => go('confirmacion', {}, 'fade'));
    on(root, 'Ver Camino a Belén', () => go('espera', {}, 'up'));
    on(root, 'Invitar', () => go('invitacion', {}, 'push'));
    on(root, 'Entrar', () => go('espera', {}, 'up'));
    $$(root, 'img').filter(i => /Teodoro/.test(i.alt || '')).slice(0, 1).forEach(i => i.classList.add('a-bob'));
    // prendas ganadas en la ruleta, visibles en el cuarto
    if (S.prendas.length) toast('Tu cuarto', `Prendas ganadas: ${S.prendas.map(id => PRENDAS.find(p => p.id === id)?.nombre.replace(/^un[a]? /, '')).join(', ')}`);
  },
});
register('mundos', {
  files: F('V2-02-Mundos-claro', 'V2-02-Mundos'),
  mount(root) {
    tabs(root);
    const n = activeDay() ?? Math.min(lastDay(), 26);
    replaceText(root, /Día 9 de 26/, `Día ${n} de 26`);
    on(root, 'Adviento', () => go('mapa', { from: 'mundos' }, 'push'));
    on(root, 'Volver al cuarto de Teodoro', () => go('teodoro', {}, 'back'));
    on(root, 'Enero', () => toast('Enero', 'El próximo mundo: pronto'));
    $$(root, 'img').forEach((i, k) => { if (k % 3 === 0) i.classList.add('a-bob'); });
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
      else { scene.style.opacity = '.25'; const ph = document.createElement('div'); ph.textContent = 'Falta ilustración del día ' + n; ph.style.cssText = 'position:absolute;left:40px;right:40px;top:290px;text-align:center;color:#fff;font:700 18px Mulish;padding:14px;border:2px dashed rgba(255,255,255,.7);border-radius:18px'; root.appendChild(ph); }
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
      if (p.nacimiento) { go('final', { day: 26 }, 'down'); return; }
      if (p.extra === 'cancion') { toast('¡Qué bonito cantan!'); go('hub', { day: n }, 'down'); return; }
      if (p.replay) { toast('¡Otra vez con Teodoro!', 'Repetir no cambia tus panes'); go('mapa', {}, 'down'); return; }
      finishContent(n);
      if (n === 0) { toast('¡Listo para salir!', 'Te avisamos el 29 de noviembre'); go('mapa', { from: 'hoy' }, 'down'); return; }
      go('completado', { day: n }, 'fade');
    };
    on(root, play, () => setPlaying(!playing));
    on(root, 'Retroceder 10 segundos', () => { t = Math.max(0, t - 1000); paint(); });
    on(root, 'Adelantar 10 segundos', () => { t = Math.min(DUR, t + 1000); paint(); });
    if (slider) on(root, slider, ev => { const r = slider.getBoundingClientRect(); t = DUR * Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)); paint(); });
    ['Texto', 'Voz', 'Repetir'].forEach(k => on(root, k, (ev, el) => { const s = el.querySelector('span'); if (s) s.style.background = s.style.background.includes('255,255,255,.2') || s.style.background.includes('0.2') ? '#FFFFFF' : 'rgba(255,255,255,.2)'; toast(k, 'Control del reproductor de Theo (ya existe)'); }));
    on(root, 'Bajar el reproductor', () => { cancelAnimationFrame(raf); go(p.nacimiento ? 'final' : p.extra === 'cancion' ? 'hub' : 'mapa', { day: n }, 'down'); });
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
    on(root, 'Volver al mapa', () => go('mapa', {}, 'down'));
    on(root, 'Escuchar a Teodoro', () => toast('Teodoro explica el reto', 'Audio por grabar'));
    on(root, 'Reto en familia', () => go('desafioIntro', { day: n, fromHub: true }, 'fade'));
    on(root, '¡Lo hicimos!', (ev, el) => { if (p.replay) { toast('¡Otra vez en familia!'); go('mapa', {}, 'down'); return; } finishContent(n); confetti(layer, 195, 540); setTimeout(() => go('completado', { day: n }, 'fade'), 700); });
    // los extras del reto son descargables: con free piden Premium
    on(root, 'Imprimible', () => premium() ? go('imprimible', { day: n }, 'push') : go('free', { back: 'hub', day: n }, 'up'));
    on(root, 'Canción', () => premium() ? go('reproductor', { day: n, extra: 'cancion' }, 'up') : go('free', { back: 'hub', day: n }, 'up'));
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
    on(root, '¡A jugar!', () => go('trivia', { day: n }, 'push'));
    on(root, 'Califícanos', () => go('calificacion', { back: 'completado', day: n }, 'up'));
    const out = () => go('mapa', {}, 'down');
    on(root, 'Ahora no', out); on(root, 'Cerrar', out); on(root, chip, out);
  },
});

register('calificacion', {
  files: F('V2-Calificacion-claro', 'V2-Calificacion'),
  mount(root, p) {
    const faces = $$(root, '[role=radio], button, a').filter(el => /Poco|Más o menos|¡Mucho!/.test(el.textContent));
    const opts = faces.length ? faces : ['Poco', 'Más o menos', '¡Mucho!'].map(t => textEl(root, t)?.parentElement).filter(Boolean);
    opts.forEach(el => on(root, el, () => {
      opts.forEach(o => { o.style.opacity = o === el ? '1' : '.55'; o.style.transform = o === el ? 'scale(1.06)' : 'scale(.94)'; o.style.transition = 'all .25s'; });
      animate(el, 'a-pop'); S._voto = el.textContent.trim();
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
    const back = () => go(p.back || 'mapa', { day: p.day, c: p.c, fromHub: p.fromHub }, 'down');
    on(root, 'Enviar', () => { toast('¡Gracias!', S._voto ? `Votaste «${S._voto}»` : 'Calificación enviada'); back(); });
    on(root, 'Ahora no', back); on(root, 'Cerrar', back);
  },
});

register('free', {
  files: F('V2-24-Dia-completo-claro', 'V2-24-Dia-completo'),
  mount(root, p) {
    const back = () => go(p.back || 'mapa', { day: p.day }, 'down');
    on(root, 'Ver Theo Premium', () => toast('Paywall de Theo Premium', 'Ya existe en la app'));
    on(root, 'Volver al mapa', back); on(root, 'Cerrar', back);
    $$(root, 'img').slice(1, 2).forEach(i => i.classList.add('a-sway'));
  },
});

register('cerrado', {
  files: F('V2-Cerrado', 'V2-Cerrado-oscuro'),
  mount(root, p, layer) {
    const n = Math.min(lastDay(), 26);
    const next = n + 1;
    const fd = dateOf(Math.min(next, 26));
    // calendario con la fecha del día que se abre
    const cal = root.querySelector('[aria-label$="de diciembre"], [aria-label$="de noviembre"]');
    if (cal) { cal.setAttribute('aria-label', `${fd.dd} de ${fd.mes.toLowerCase()}`); setText(cal, 'DIC', fd.mes.slice(0, 3)); setText(cal, /^\d+$/, String(fd.dd)); cal.classList.add('a-pop'); }
    setText(root, /El día \d+ se abre a medianoche\./, next > 26 ? '¡Llegaste a Belén! Mañana es Navidad.' : `El día ${next} se abre a medianoche.`);
    // nodos del fondo
    replaceText(root, /^(\s*)9(\s*)$/, `$1${n}$2`);
    $$(root, 'a[aria-label^="Día"]').forEach(a => { const m = a.getAttribute('aria-label').match(/Día (\d+)/); if (!m) return; const shift = n - 9; const span = [...a.querySelectorAll('span')].find(s => /^\d+$/.test(s.textContent.trim())); if (span) span.textContent = String(+m[1] + shift); });
    paintEnergy(root);
    // cuenta regresiva real hasta medianoche
    const cdEl = textEl(root, /Faltan \d+ h \d+ min/);
    const cd = cdEl && [...cdEl.childNodes].find(c => c.nodeType === 3 && /Faltan/.test(c.nodeValue));
    const tick = () => { const now = new Date(); const mid = new Date(now); mid.setHours(24, 0, 0, 0); const ms = mid - now; if (cd) cd.nodeValue = `Faltan ${Math.floor(ms / 36e5)} h ${Math.floor(ms / 6e4) % 60} min`; };
    tick(); const iv = setInterval(() => layer.isConnected ? tick() : clearInterval(iv), 20000);
    $$(root, 'span').filter(s => s.textContent.trim() === 'z').forEach((z, i) => { z.style.display = 'inline-block'; z.style.animation = `zz 2.4s ${i * .8}s ease-out infinite`; });
    $$(root, 'img').find(i => /duerme/.test(i.alt || ''))?.classList.add('a-bob');
    on(root, 'Entendido', () => go('hoy', {}, 'down'));
    on(root, 'Volver a Mundos', () => go('mundos', {}, 'back'));
    $$(root, 'a[aria-label^="Día"]').forEach(a => on(root, a, () => go('mapa', {}, 'down')));
  },
});

// ---------- Ruleta (días 4, 11, 18 y 24) ----------
const SEGMENTS = ['panes', 'manzana', 'panes', 'panes', 'prenda', 'panes', 'panes', 'panes', 'panes', 'cuarto'];
register('ruletaPop', {
  files: F('S-05b-Ruleta-pop', 'S-05b-Ruleta-pop-oscuro'),
  mount(root, p, layer) {
    const n = p.day;
    const wheel = root.querySelector('[role=img][aria-label^="Ruleta"] > div');
    wheel?.parentElement.classList.add('a-pop');
    const pointer = $$(root, 'img').find(i => i.src.includes('3fdb655b'));
    let spun = false;
    on(root, '¡Girar!', async (ev, btn) => {
      if (spun) return; spun = true;
      btn.style.opacity = '.6';
      // premio: el forzado en el panel o al azar (todas las casillas ganan)
      const forced = S.forzarPremio;
      let idx = forced ? SEGMENTS.indexOf(forced) : Math.floor(Math.random() * SEGMENTS.length);
      if (idx < 0) idx = 0;
      const premio = SEGMENTS[idx];
      const target = 360 * 6 + (360 - idx * 36) + (Math.random() * 16 - 8);
      if (wheel) {
        wheel.classList.add('wheel-spin');
        if (reduced()) wheel.style.transition = 'transform .3s';
        wheel.style.transform = `rotate(${target}deg)`;
        pointer?.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-14deg)' }, { transform: 'rotate(0)' }], { duration: 160, iterations: 22 });
        await wait(reduced() ? 400 : 4400);
      }
      const week = RULES.ruleta.indexOf(n);
      const prize = premio === 'prenda' ? PRENDAS[week].id : premio;
      S.ruletas[n] = prize; delete S.ruletaPendiente[n];
      if (premio === 'panes') addPanes(RULES.panes.ruleta);
      if (premio === 'prenda') S.prendas.push(PRENDAS[week].id);
      if (premio === 'cuarto') S.cuartoNuevo = true;
      save();
      confetti(layer, 195, 410, 40);
      await wait(500);
      go(premio === 'cuarto' ? 'premioCuarto' : 'ruletaPremio', { premio: prize, day: n, from: p.from }, 'modal');
    });
    on(root, 'Más tarde', () => {
      S.ruletaPendiente[n] = true; save();
      if (p.from === 'mapa') go('mapa', {}, 'down'); else go(DAYS[n].type === 'reto' ? 'hub' : 'reproductor', { day: n }, 'fade');
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
    if (!info.sub && subEl) subEl.style.visibility = 'hidden';
    else if (p.premio === 'manzana' && subEl) subEl.textContent = 'Teodoro la guardó para su merienda';
    if (p.premio !== 'cuarto') floaty(layer, p.premio === 'panes' ? `+${RULES.panes.ruleta}` : '¡Nuevo!', 250, 210, p.premio === 'panes' ? IMG.pan : null);
    const cont = () => p.from === 'mapa' || contentDone(n) ? go('mapa', {}, 'down') : go(DAYS[n].type === 'reto' ? 'hub' : 'reproductor', { day: n }, 'fade');
    on(root, 'Empezar el cuento', cont);
    if (p.from === 'mapa' || contentDone(n)) setText(root, 'Empezar el cuento', 'Volver al camino');
    on(root, 'Ver a Teodoro', () => go('teodoro', {}, 'fade'));
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
    on(root, 'Ver su cuarto nuevo', () => go('teodoro', {}, 'fade'));
    const out = () => p.from === 'mapa' || contentDone(n) ? go('mapa', {}, 'down') : go(DAYS[n].type === 'reto' ? 'hub' : 'reproductor', { day: n }, 'fade');
    on(root, 'Salir de la ruleta', out); on(root, 'Cerrar', out);
  },
});

// ---------- Nochebuena ----------
register('final', {
  files: F('V2-Final-claro', 'V2-Final'),
  async mount(root, p, layer) {
    const first = !contentDone(26);
    if (first) { S.completos[26] = { contenido: true }; S.pasoAnimado = null; addPanes(panesContenido()); save(); }
    replaceText(root, /Lucía/g, S.nombre);
    const total = doneCount() + (isDone(26) ? 0 : 0);
    setText(root, /^26$/, String(Math.min(26, doneCount())));
    const scene = $$(root, 'img')[0]; scene?.classList.add('a-pop');
    sparkles(root);
    await wait(400); confetti(layer, 195, 220, 60);
    on(root, 'Ver el nacimiento', () => go('reproductor', { day: 26, nacimiento: true }, 'up'));
    on(root, 'Compartir con la familia', () => go('finalCompartir', {}, 'push'));
    on(root, 'Cerrar', () => go('mapa', {}, 'down'));
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
      try { if (navigator.share) await navigator.share({ title: '¡Llegamos a Belén!', text: `${S.nombre} caminó ${dias} días con Teodoro hasta Belén y ganó ${estrellas} estrellas.` }); else toast('Compartir', 'En el celular se abre el menú para compartir'); } catch { /* cancelado */ }
    });
    on(root, 'Ahora no', () => go('final', { day: 26 }, 'back'));
    on(root, 'Volver', () => go('final', { day: 26 }, 'back'));
  },
});

register('imprimible', {
  files: F('S-04c-Imprimible', 'S-04c-Imprimible-oscuro'),
  mount(root, p) {
    const sheet = [...root.querySelectorAll('div, img')].find(x => x.style.transform && /rotate/.test(x.style.transform));
    sheet?.classList.add('a-pop');
    on(root, 'Volver', () => go('hub', { day: p.day }, 'back'));
    ['Imprimir', 'Guardar'].forEach(t => on(root, t, () => toast(t, 'En el celular se abre el menú del teléfono')));
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
    $$(root, 'a, button').forEach(el => { el.dataset.bound = '1'; el.addEventListener('click', e => { e.preventDefault(); toast('Vista estática', 'Para interactuar, usa el flujo'); }); });
  },
});
