// Trivia y juegos sorpresa, armados sobre las pantallas del lienzo.
import { S, save, A, $, $$, on, find, go, back, register, toast, nota, frag, seen, wait, reduced, animate, replaceText, setText, textEl,
  floaty, confetti, addPanes, dark, stars, _stack, cur } from './core.js';
import { DAYS, TRIVIA, RULES, IMG, MEMORAMA, ADIVINANZA, DESAFIOS, hasTrivia, TYPES } from './data.js';
import { finishTrivia, finishContent, openSorpresa } from './flow.js';
import { bindMute } from './musica.js';
// botón de música de la cabecera (trivia y su resultado)
const muteBtn = root => bindMute(root.querySelector('button[aria-label^="Música de fondo"]'));

const F = (c, o) => dark() ? o : c;
const speak = (text, onEnd) => {
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = 'es-MX'; u.rate = .95;
    if (onEnd) { u.onend = onEnd; u.onerror = onEnd; }
    speechSynthesis.speak(u); return true;
  } catch { nota('Escuchar', 'Este navegador no lee en voz alta'); return false; }
};
const callar = () => { try { speechSynthesis.cancel(); } catch { /* sin voz */ } };
// botón «Escuchar» que, mientras lee, pasa a «Parar» para cortar la lectura
const ICO_ESCUCHAR = '<path d="M4 9v6h4l5 4V5L8 9z"></path><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"></path>';
const ICO_PARAR = '<rect x="6.5" y="6.5" width="11" height="11" rx="2.2" fill="currentColor" stroke="none"></rect>';
function listenButton(root, layer, text) {
  const btn = find(root, 'Escuchar'); if (!btn) return;
  const svg = btn.querySelector('svg'), label = [...btn.childNodes].find(c => c.nodeType === 3 && c.nodeValue.trim());
  let leyendo = false;
  const pintar = v => {
    leyendo = v;
    if (svg) { svg.innerHTML = v ? ICO_PARAR : ICO_ESCUCHAR; svg.style.color = svg.getAttribute('stroke'); }
    if (label) label.nodeValue = v ? 'Parar' : 'Escuchar';
    btn.setAttribute('aria-label', v ? 'Parar la lectura' : 'Escuchar la pregunta');
    btn.setAttribute('aria-pressed', String(v));
  };
  on(root, btn, () => { if (leyendo) { callar(); pintar(false); return; } if (speak(text, () => layer.isConnected && pintar(false))) pintar(true); });
  // al salir de la pantalla, deja de leer
  const mo = new MutationObserver(() => { if (!layer.isConnected) { if (leyendo) callar(); mo.disconnect(); } });
  mo.observe(document.getElementById('viewport') || document.body, { childList: true });
}
const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
// al mapa; «Mañana seguimos» solo si ya no queda nada del día (ni la sorpresa)
const toMapAfterGame = (n) => go('mapa', { thenCerrado: !(n != null && RULES.sorpresa[n] && S.sorpresas[n] !== 'hecha') }, 'down', { replace: true });

// ================= TRIVIA =================
const isMulti = q => Array.isArray(q.a);
const isPic = q => typeof q.o[0] === 'object';
let triviaTpl = null;
async function tTemplates() {
  const k = dark() ? 'o' : 'c';
  if (triviaTpl?.k === k) return triviaTpl;
  const ok = await frag(F('V2-07-Correcto-claro', 'V2-07-Correcto'));
  const bad = await frag(F('V2-08-Pista-claro', 'V2-08-Pista'));
  const multi = await frag(F('V2-06c-Trivia-varias-claro', 'V2-06c-Trivia-varias'));
  const g = ok.querySelector('[role=group]').children;
  const gb = bad.querySelector('[role=group]').children;
  const mc = multi.querySelector('[role=group]').children;
  triviaTpl = {
    k,
    picOk: g[0].outerHTML, picDim: g[1].getAttribute('style'),
    picBad: gb[1].outerHTML,
    status: ok.querySelector('[role=status]').outerHTML,
    note: bad.querySelector('[role=note]').outerHTML,
    next: [...ok.children].find(el => el.tagName === 'A' && /Siguiente/.test(el.textContent)).outerHTML,
    sparkles: [...ok.children].filter(el => el.tagName === 'svg' && el.style.position === 'absolute').map(s => s.outerHTML).join(''),
    txtOn: mc[0].outerHTML, txtOff: mc[2].outerHTML,
    imgCelebra: IMG.tCelebra, imgFarol: IMG.tFarol, imgPregunta: IMG.tPregunta,
  };
  return triviaTpl;
}

// si cerraron la trivia a medias, se retoma en la pregunta donde iban (con lo ya respondido)
const resume = p => (p.replay || p.i != null || !S.triviaProgreso?.[p.day]) ? p : { ...p, ...S.triviaProgreso[p.day] };
const keep = (n, prog) => { (S.triviaProgreso ||= {})[n] = prog; save(); };
// las ilustraciones de cabecera se funden con el fondo, sin línea donde terminan
export function softHead(root) {
  [...root.children].slice(0, 6).filter(el => el.style.top === '0px' && parseFloat(el.style.height) >= 280 && (el.tagName === 'IMG' || /linear-gradient/.test(el.style.background))).forEach(el => el.classList.add('soft-head'));
}

// solo los días del cronograma tienen trivia; en los demás no se abre (enlace viejo, repetir un día pasado…)
const sinTrivia = n => { if (hasTrivia(n)) return false; go('mapa', {}, 'down', { replace: true }); return true; };

register('trivia', {
  file: p => { p = resume(p); const q = TRIVIA[p.day]?.[p.i || 0]; if (!q) return F('V2-06c-Trivia-varias-claro', 'V2-06c-Trivia-varias'); return isPic(q) ? F('V2-06a-Trivia-sin-elegir-claro', 'V2-06a-Trivia-sin-elegir') : F('V2-06c-Trivia-varias-claro', 'V2-06c-Trivia-varias'); },
  async mount(root, p, layer) {
    if (sinTrivia(p.day)) return;
    p = resume(p);
    // ya había acertado la última y cerró antes de ver el resultado
    if (p.fin != null) { go('triviaFin', { day: p.day, ok: p.fin }, 'modal', { replace: true }); return; }
    const T = await tTemplates();
    const n = p.day, i = p.i || 0, ok = p.ok || 0;
    const q = TRIVIA[n][i];
    let fallos = p.f || 0, answered = false;
    softHead(root);
    muteBtn(root);
    const list = !isPic(q); // texto (una o varias): lista vertical
    root.classList.add(isPic(q) ? (q.o.length === 4 ? 'tv-pic4' : 'tv-pic') : isMulti(q) ? 'tv-multi' : 'tv-txt');
    if (list) root.classList.add('tv-list');

    if (!isPic(q)) seen(isMulti(q) ? 'V2-06c-Trivia-varias-claro' : 'V2-06b-Trivia-4-opciones-claro');
    if (isPic(q) && i > 0) seen('V2-06-Trivia-claro');
    // progreso (5 puntitos)
    const bar = root.querySelector('[role=progressbar]');
    if (bar) {
      bar.setAttribute('aria-label', `Pregunta ${i + 1} de 5`);
      const dots = [...bar.children];
      const cur = dots[0].getAttribute('style'), pend = dots[1].getAttribute('style');
      dots.forEach((d, k) => {
        d.setAttribute('style', k === i ? cur : pend);
        // hechas: color lleno si salió a la primera, ámbar si fue al reintento
        if (k < i) { d.style.background = (p.h || '')[k] === '0' ? '#E8A33D' : (dark() ? '#FFF6DD' : '#0B748A'); }
        d.style.transition = 'width .3s, background .3s';
      });
    }
    // pregunta
    const card = [...root.children].find(el => el.style.top === '262px');
    const qEl = card?.querySelector('div');
    if (qEl) qEl.textContent = q.q;
    card?.classList.add('a-rise');
    listenButton(root, layer, q.q + '. ' + q.o.map(o => o.t || o).join(', '));
    const teo = $$(root, 'img').find(im => im.src.includes(IMG.tPregunta));
    const setTeo = (id, cls) => { if (!teo) return; teo.src = A(id); teo.classList.remove('a-hop', 'a-bob', 'a-shake'); void teo.offsetWidth; cls && teo.classList.add(cls); };
    setTeo(IMG.tPregunta, 'a-bob');
    // en lista (o con pregunta de 3 líneas), Teodoro un poco más chico y la pregunta más arriba: caben las opciones y el aviso
    if (card && (list || card.offsetHeight > 160)) { card.style.top = '222px'; teo?.classList.add('tv-teo-sm'); }

    const group = root.querySelector('[role=group]');
    const tplOpt = group.children[0].outerHTML;
    const tplPicNeutral = isPic(q) ? tplOpt : null;
    group.innerHTML = '';
    const opts = q.o.map((o, k) => {
      const t = document.createElement('template');
      if (isPic(q)) {
        t.innerHTML = tplPicNeutral; const el = t.content.firstElementChild;
        el.removeAttribute('href'); el.setAttribute('role', 'button');
        el.querySelector('img').src = A(o.img); el.querySelector('span').textContent = o.t;
        el.setAttribute('aria-label', o.t);
        return el;
      }
      t.innerHTML = T.txtOff; const el = t.content.firstElementChild;
      el.querySelector('div').textContent = o;
      el.setAttribute('role', isMulti(q) ? 'checkbox' : 'button');
      el.setAttribute('aria-label', o);
      return el;
    });
    // texto: lista, una debajo de la otra; 4 imágenes: 2×2 compacto
    if (list) group.style.gridTemplateColumns = '1fr';
    else if (q.o.length === 4) { group.style.display = 'grid'; group.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))'; group.style.gap = '12px'; group.classList.add('pic4'); root.classList.add('trivia-pic4'); }
    opts.forEach((el, k) => { group.appendChild(el); el.style.animation = `rise .4s ${.08 * k}s cubic-bezier(.2,.8,.2,1) both`; });
    // preguntas de 3 líneas: las opciones empiezan debajo de la pregunta
    if (card) group.style.setProperty('top', (list ? card.offsetTop + card.offsetHeight + 12 : Math.max(group.offsetTop, card.offsetTop + card.offsetHeight + 12)) + 'px', 'important');

    // pie: pista de interacción y «Comprobar»
    const hint = [...root.children].find(el => el.style.top === '700px' || el.style.top === '702px');
    const check = [...root.children].find(el => el.tagName === 'A' && /Comprobar/.test(el.textContent));
    if (!isMulti(q)) check?.remove();
    else if (check) { check.style.top = 'auto'; check.style.bottom = '24px'; }
    if (hint) hint.innerHTML = `<span class="tv-pill">${isMulti(q) ? 'Elige todas las correctas' : 'Toca la respuesta'}</span>`;
    // avisos, pista y «Toca la respuesta» van en su propio espacio, debajo de las opciones (nunca encima)
    const place = el => el?.style.setProperty('top', (group.offsetTop + group.offsetHeight + 14) + 'px', 'important');
    place(hint);
    // si el aviso no cabe sobre el botón de abajo: la lista ya respondida se compacta y el botón baja un poco
    const fit = (fb, btn, tight) => {
      if (!fb || !btn) return;
      const over = () => fb.offsetTop + fb.offsetHeight + 12 - btn.offsetTop;
      if (over() > 0 && tight) { group.classList.add('tv-tight'); place(fb); }
      if (over() > 0) btn.style.bottom = Math.max(14, parseFloat(getComputedStyle(btn).bottom) - over()) + 'px';
    };
    fit(hint, check);

    const clearFeedback = () => $$(root, '[role=status], [role=note], [data-next], [data-spark]').forEach(e => e.remove());
    const showNext = () => {
      const t = document.createElement('template'); t.innerHTML = T.next;
      const a = t.content.firstElementChild; a.dataset.next = '1'; a.removeAttribute('href');
      if (i === 4) a.textContent = 'Ver resultado';
      root.appendChild(a); a.classList.add('a-rise');
      on(root, a, () => {
        if (!p.replay && i < 4) { (S.triviaProgreso ||= {})[n] = { i: i + 1, ok: ok + (fallos === 0 ? 1 : 0), h: (p.h || '') + (fallos === 0 ? '1' : '0') }; save(); }
        if (i < 4) go('trivia', { day: n, i: i + 1, ok: ok + (fallos === 0 ? 1 : 0), h: (p.h || '') + (fallos === 0 ? '1' : '0'), replay: p.replay }, 'push', { replace: true });
        else go('triviaFin', { day: n, ok: ok + (fallos === 0 ? 1 : 0), replay: p.replay }, 'modal', { replace: true });
      });
    };
    const correct = (picked) => {
      answered = true;
      seen(fallos ? 'V2-08b-Reintento-claro' : 'V2-07-Correcto-claro');
      clearFeedback(); hint && (hint.style.display = 'none'); check && (check.style.display = 'none');
      opts.forEach((el, k) => {
        const right = isMulti(q) ? q.a.includes(k) : k === q.a;
        if (right) {
          if (isPic(q)) {
            const t = document.createElement('template'); t.innerHTML = T.picOk; const c = t.content.firstElementChild;
            c.querySelector('img').src = el.querySelector('img').src; c.querySelector(':scope > span:last-child').textContent = el.querySelector('span').textContent;
            c.setAttribute('aria-label', el.getAttribute('aria-label') + ': correcta');
            el.replaceWith(c); opts[k] = c; c.classList.add('a-pop');
          } else {
            const t = document.createElement('template'); t.innerHTML = T.txtOn; const c = t.content.firstElementChild;
            c.querySelector('div').textContent = el.querySelector('div').textContent; c.style.transform = '';
            el.replaceWith(c); opts[k] = c; c.classList.add('a-pop');
          }
        } else if (!el.dataset.bad) { el.style.opacity = '.45'; el.style.filter = 'grayscale(.4)'; }
      });
      const t = document.createElement('template'); t.innerHTML = T.status; const st = t.content.firstElementChild;
      const spans = st.querySelectorAll(':scope > span'); spans[spans.length - 1].textContent = q.ok;
      st.classList.add('tv-status'); root.appendChild(st); place(st); st.classList.add('a-pop');
      // 4 imágenes con pregunta larga: la grilla se encoge lo justo para que el aviso quepa sobre «Siguiente»
      if (group.classList.contains('pic4')) {
        const h = Math.min(124, Math.floor((752 - 12 - st.offsetHeight - 14 - group.offsetTop - 10) / 2));
        if (h < 124) { group.style.setProperty('--tile', Math.max(h, 84) + 'px'); group.classList.add('pic4-fit'); place(st); }
      }
      // si cierran ahora, al volver siguen en la próxima pregunta (o ven el resultado)
      const okN = ok + (fallos === 0 ? 1 : 0);
      if (!p.replay) keep(n, i < 4 ? { i: i + 1, ok: okN, h: (p.h || '') + (fallos === 0 ? '1' : '0') } : { i, fin: okN });
      const sp = document.createElement('div'); sp.dataset.spark = '1'; sp.innerHTML = T.sparkles; [...sp.children].forEach((s, k) => { s.classList.add('a-twinkle'); s.style.animationDelay = k * .2 + 's'; });
      root.append(...sp.children);
      setTeo(IMG.tCelebra, 'a-hop');
      if (fallos === 0) floaty(layer, '¡Bien!', 160, 230, null);
      showNext();
      fit(st, root.querySelector('[data-next]'), list);
    };
    const wrong = (k, el) => {
      fallos++;
      seen('V2-08-Pista-claro');
      clearFeedback();
      if (isPic(q) && el) {
        const t = document.createElement('template'); t.innerHTML = T.picBad; const c = t.content.firstElementChild;
        c.querySelector('img').src = el.querySelector('img').src; c.querySelector(':scope > span:last-child').textContent = el.querySelector('span').textContent;
        c.dataset.bad = '1'; el.replaceWith(c); opts[k] = c; animate(c, 'a-shake');
      } else if (el) { el.dataset.bad = '1'; el.style.opacity = '.5'; el.style.filter = 'grayscale(1)'; animate(el, 'a-shake'); }
      const t = document.createElement('template'); t.innerHTML = T.note; const nt = t.content.firstElementChild;
      const b = nt.querySelector('b'); if (b) b.nextSibling.nodeValue = ' ' + q.pista;
      nt.setAttribute('aria-label', 'Casi. Pista: ' + q.pista);
      nt.classList.add('tv-note');
      if (hint) hint.style.display = 'none';
      // varias correctas: solo la pista, para no chocar con «Comprobar»
      if (isMulti(q)) nt.querySelector(':scope > span:last-child')?.remove();
      root.appendChild(nt); place(nt); nt.classList.add('a-rise');
      fit(nt, check);
      // el fallo cuenta aunque cierren y vuelvan
      if (!p.replay) keep(n, { i, ok, h: p.h || '', f: fallos });
      setTeo(IMG.tFarol, 'a-bob');
    };

    if (isMulti(q)) {
      const sel = new Set();
      // delegación: las opciones se reemplazan al marcarlas
      group.addEventListener('click', ev => {
        const c = ev.target.closest('[role=checkbox]'); if (!c || answered) return;
        const k = opts.indexOf(c); if (k < 0) return;
        sel.has(k) ? sel.delete(k) : sel.add(k);
        const t = document.createElement('template'); t.innerHTML = sel.has(k) ? T.txtOn : T.txtOff;
        const nc = t.content.firstElementChild; nc.querySelector('div').textContent = c.querySelector('div').textContent;
        nc.setAttribute('role', 'checkbox'); nc.setAttribute('aria-checked', sel.has(k)); nc.dataset.bound = '1';
        c.replaceWith(nc); opts[k] = nc; animate(nc, 'a-pop');
      });
      opts.forEach(el => { el.dataset.bound = '1'; el.style.cursor = 'pointer'; el.tabIndex = 0; });
      if (check) on(root, check, () => {
        if (answered) return;
        const want = new Set(q.a);
        const good = sel.size === want.size && [...sel].every(k => want.has(k));
        if (good) correct();
        else { [...sel].filter(k => !want.has(k)).forEach(k => animate(opts[k], 'a-shake')); wrong(-1, null); }
      });
    } else {
      opts.forEach((el, k) => on(root, el, () => {
        if (answered || opts[k].dataset.bad) return;
        k === q.a ? correct(k) : wrong(k, opts[k]);
      }));
    }
    on(root, 'Salir de la trivia', () => go('mapa', {}, 'down', { replace: true }));
  },
});

register('triviaFin', {
  file: p => {
    const g = !p.replay && S.sorpresas[p.day] !== 'hecha' && RULES.sorpresa[p.day];
    if (!g) return F('V2-Trivia-fin-claro', 'V2-Trivia-fin');
    return { memorama: F('V2-Trivia-fin-sorpresa-claro', 'V2-Trivia-fin-sorpresa'), adivinanza: F('V2-Trivia-fin-sorpresa-adivinanza-claro', 'V2-Trivia-fin-sorpresa-adivinanza'), desafio: F('V2-Trivia-fin-sorpresa-desafio-claro', 'V2-Trivia-fin-sorpresa-desafio') }[g];
  },
  async mount(root, p, layer) {
    const n = p.day;
    if (sinTrivia(n)) return;
    muteBtn(root);
    const { est, first, gana, mejoro } = finishTrivia(n, p.ok, p.replay);
    setText(root, /^\d de 5$/, `${p.ok} de 5`);
    replaceText(root, /respuestas correctas/, 'a la primera');
    if (S.triviaProgreso) delete S.triviaProgreso[n];
    setText(root, '¡Gran trivia!', est === 3 ? '¡Trivia perfecta!' : est === 2 ? '¡Gran trivia!' : '¡Buen intento!');
    const starsBox = root.querySelector('[role=img][aria-label^="Ganaste"]');
    if (starsBox) {
      starsBox.setAttribute('aria-label', `Ganaste ${est} de 3 estrellas`);
      const svgs = $$(starsBox, 'svg');
      const gold = svgs.find(s => s.innerHTML.includes('#F7C948') || s.innerHTML.includes('#F5C')) ;
      const grey = svgs.find(s => !s.innerHTML.includes('#F7C948'));
      svgs.forEach((s, k) => {
        const src = (k < est ? gold : grey) || s;
        if (src !== s) { const c = src.cloneNode(true); c.setAttribute('style', s.getAttribute('style')); s.replaceWith(c); s = c; }
        s.style.animation = `pop .5s ${.35 + k * .22}s cubic-bezier(.2,.9,.3,1.4) both`;
      });
    }
    const chip = root.querySelector('[aria-label^="Ganaste 10 panes"]');
    if (mejoro) setTimeout(() => toast('¡Mejoraste tus estrellas!', `+${RULES.panes.trivia} panes`), 600);
    if (!gana && chip) chip.style.visibility = 'hidden';
    else if (chip) { chip.classList.add('a-pop'); floaty(layer, `+${RULES.panes.trivia}`, 230, 430); }
    const dlg = root.querySelector('[role=dialog]'); dlg?.classList.add('a-rise');
    $$(root, 'img').filter(i => i.src.includes(IMG.tCelebra)).slice(-1).forEach(i => i.classList.add('a-hop'));
    if (est >= 2) confetti(layer, 195, 300, est === 3 ? 60 : 30);
    on(root, 'Volver al camino', () => p.replay ? go('mapa', {}, 'down', { replace: true }) : toMapAfterGame(n));
    const vc = find(root, 'Volver al camino'); if (vc) vc.dataset.back = '1';
    on(root, 'Jugar otra vez', () => go('trivia', { day: n, i: 0, ok: 0, replay: true }, 'fade'));
    on(root, 'Ir al juego sorpresa', () => openSorpresa(n));
    // el aviso de la sorpresa muestra cartas de juego, no un regalo (no es un premio)
    const aviso = textEl(root, '¡Hoy hay juego sorpresa!')?.closest('div[style*="border-radius"]');
    aviso?.querySelectorAll('img').forEach(i => { i.src = A(IMG.dorso); i.style.objectFit = 'contain'; });
    on(root, 'Ahora no', () => { S.sorpresas[n] = 'luego'; save(); toMapAfterGame(n); });
  },
});

// Final común de los juegos sorpresa: +15 panes, una sola vez
function sorpresaHecha(n, layer) {
  const first = S.sorpresas[n] !== 'hecha';
  if (first) { S.sorpresas[n] = 'hecha'; addPanes(RULES.panes.sorpresa); save(); }
  return first;
}
function paintFin(root, layer, n, first, bind = true) {
  replaceText(root, /guardadas en el día \d+/, `Tus estrellas del día ${n}`);
  // días sin trivia: no hay estrellas que mostrar
  if (!hasTrivia(n)) root.querySelector('[role=img][aria-label^="Tus "]')?.remove();
  const s = stars(n);
  const box = textEl(root, /estrellas del día/)?.parentElement;
  if (box) $$(box, 'svg').forEach((sv, k) => sv.querySelectorAll('path').forEach(pt => pt.setAttribute('fill', k < s ? '#F7C948' : '#D3DDE5')));
  const bread = $$(root, 'img').find(i => i.src.includes(IMG.pan) && parseFloat(i.style.width) > 60);
  bread?.parentElement?.classList.add('a-pop');
  // el «+15» sale del pan y no tapa el marcador
  const br = bread?.parentElement;
  if (first) floaty(layer, `+${RULES.panes.sorpresa}`, br ? br.offsetLeft + br.offsetWidth - 20 : 230, br ? br.offsetTop + 10 : 380); else setText(root, /Ganaste \d+ panes/, 'Ya ganaste estos panes');
  $$(root, 'img').filter(i => i.src.includes(IMG.tCelebra)).forEach(i => i.classList.add('a-hop'));
  confetti(layer, 195, 260, 44);
  if (bind) { on(root, 'Volver al camino', toMapAfterGame); on(root, 'Cerrar', toMapAfterGame); }
}
const later = n => () => { S.sorpresas[n] = 'luego'; save(); toMapAfterGame(n); };

// ================= MEMORAMA =================
register('memoramaReglas', {
  file: () => F('V2-Memorama-reglas-claro', 'V2-Memorama-reglas'),
  mount(root, p) {
    on(root, '¡A jugar!', () => go('memorama', { day: p.day }, 'fade'));
    on(root, 'Ahora no', later(p.day)); on(root, 'Cerrar', later(p.day));
    $$(root, 'img').forEach((i, k) => { if (/Teodoro/.test(i.alt || '') || k === 2) i.classList.add('a-bob'); });
  },
});
register('memorama', {
  file: () => F('V2-Memorama-claro', 'V2-Memorama'),
  mount(root, p, layer) {
    const n = p.day;
    const grid = [...root.children].find(el => el.style.top === '172px');
    const faceTpl = grid.querySelector('div[aria-label]');
    const faceStyle = faceTpl.getAttribute('style');
    const deck = shuffle([...MEMORAMA, ...MEMORAMA]);
    const NAMES = { maria: 'María', jose: 'José', teodoro: 'Teodoro', oveja: 'Oveja', estrella: 'Estrella', gabriel: 'Gabriel' };
    grid.innerHTML = '';
    const counters = $$(root, 'div').filter(el => el.style.height === '36px');
    // solo el nodo de texto, para no borrar los íconos de los contadores
    const textNode = (el, re) => { if (!el) return null; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let t; while ((t = w.nextNode())) if (re.test(t.nodeValue.trim())) return t; return null; };
    const pairsEl = textNode(counters[0], /de 6/);
    const movesEl = textNode(counters[1], /^\d+$/);
    const hintEl = textEl(root, /¿Dónde está/);
    let open = [], found = 0, moves = 0, lock = false;
    if (counters[1]) counters[1].style.display = 'none'; // los movimientos no le dicen nada a un niño: solo «N de 6»
    const paint = () => { if (pairsEl) pairsEl.nodeValue = `${found} de 6`; };
    paint();
    deck.forEach((k, idx) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'mm-card'; b.dataset.bound = '1';
      b.setAttribute('aria-label', `Carta ${idx + 1}, boca abajo`);
      b.innerHTML = `<span class="mm-in"><span class="mm-face"><img src="${A(IMG.dorso)}" alt="" style="width:100%;height:100%;object-fit:cover"></span><span class="mm-face mm-back" style="${faceStyle};position:absolute;inset:0;width:auto;height:auto;display:grid;place-items:center;transform:rotateY(180deg)"><img src="${A(IMG[k])}" alt="" style="width:84px;height:${k === 'teodoro' ? 108 : 100}px;object-fit:contain"></span></span>`;
      b.style.animation = `pop .4s ${idx * .035}s cubic-bezier(.2,.9,.3,1.3) both`;
      b.addEventListener('click', async () => {
        if (lock || b.classList.contains('up')) return;
        b.classList.add('up'); b.setAttribute('aria-label', NAMES[k]);
        open.push({ b, k });
        if (open.length === 1) { if (hintEl) hintEl.textContent = `¿Dónde está ${k === 'oveja' || k === 'estrella' ? 'la otra' : 'el otro'} ${NAMES[k]}?`; return; }
        moves++; paint(); lock = true;
        const [a, c] = open; open = [];
        if (a.k === c.k) {
          found++; paint(); a.b.classList.add('done'); c.b.classList.add('done'); navigator.vibrate?.(20);
          if (hintEl) hintEl.textContent = found === 6 ? '¡Encontraste todas!' : `¡Pareja! ${NAMES[k]}`;
          lock = false;
          if (found === 6) { await wait(700); go('memoramaFin', { day: n, moves }, 'fade'); }
        } else {
          await wait(850);
          a.b.classList.remove('up'); c.b.classList.remove('up');
          a.b.setAttribute('aria-label', 'Carta boca abajo'); c.b.setAttribute('aria-label', 'Carta boca abajo'); navigator.vibrate?.(8);
          if (hintEl) hintEl.textContent = 'Casi… ¡otra vez!';
          lock = false;
        }
      });
      grid.appendChild(b);
    });
    grid.style.display = 'grid'; grid.style.gridTemplateColumns = 'repeat(3, 96px)'; grid.style.gap = '12px';
    on(root, 'Salir', later(n));
    on(root, 'Escuchar instrucciones', () => speak('Voltea dos cartas y encuentra las seis parejas'));
  },
});
register('memoramaFin', {
  file: () => F('V2-Memorama-fin-claro', 'V2-Memorama-fin'),
  mount(root, p, layer) {
    replaceText(root, /Lo lograste en/, 'Encontraste');
    setText(root, /^\d+ movimientos$/, 'las 6 parejas');
    replaceText(root, /\b14\b/, String(p.moves));
    const first = sorpresaHecha(p.day, layer);
    paintFin(root, layer, p.day, first);
  },
});

// ================= ADIVINANZA =================
register('adivinanzaIntro', {
  file: () => F('V2-Adivinanza-intro-claro', 'V2-Adivinanza-intro'),
  mount(root, p) {
    on(root, '¡A jugar!', () => go('adivinanza', { day: p.day, words: shuffle(ADIVINANZA).slice(0, 5), k: 0, res: [] }, 'fade'));
    on(root, 'Ahora no', later(p.day)); on(root, 'Cerrar', later(p.day));
    $$(root, 'img').forEach(i => /Teodoro/.test(i.alt || '') && i.classList.add('a-bob'));
  },
});
const SECS = 45;
register('adivinanza', {
  file: () => F('V2-Adivinanza-claro', 'V2-Adivinanza'),
  mount(root, p, layer) {
    const { day: n, words, k, res } = p;
    const w = words[k];
    const card = [...root.children].find(el => el.style.top === '282px');
    const prog = root.querySelector('[role=progressbar]');
    if (prog) {
      prog.setAttribute('aria-label', `Palabra ${k + 1} de 5`);
      const fill = prog.querySelector(':scope > div > div') || prog.querySelector('div > div'); if (fill) fill.style.width = (k / 5 * 100) + '%'; prog.setAttribute('aria-valuenow', String(k));
      setText(prog, /^\d\/5$/, `${k + 1}/5`);
    }
    const okCount = res.filter(r => r.ok).length;
    const okChip = root.querySelector('[aria-label$="adivinada"], [aria-label$="adivinadas"]');
    if (okChip) { setText(okChip, /^\d+$/, String(okCount)); okChip.setAttribute('aria-label', `${okCount} adivinadas`); }
    if (card) {
      const img = card.querySelector('img'); if (img) img.src = A(IMG[w.img]);
      setText(card, 'ESTRELLA', w.w);
      const chips = $$(card, 'span').filter(s => /^(luz|cielo)$/.test(s.textContent.trim()));
      chips.forEach((c, i) => c.textContent = w.no[i] || '');
      card.style.animation = k ? 'inPush .35s cubic-bezier(.2,.8,.2,1) both' : 'pop .45s cubic-bezier(.2,.9,.3,1.2) both';
    }
    $$(root, '[style*="rotate(1.6deg)"], [style*="rotate(-1.6deg)"]').forEach((c, i) => c.style.opacity = k < 4 - i ? '1' : '0');
    // temporizador
    const timer = root.querySelector('[aria-label^="Quedan"]');
    const tFill = timer?.querySelector(':scope > div > div') || timer?.querySelector('div > div'), tTxt = timer && textEl(timer, /\d+s/);
    let left = SECS, done = false, t0 = null;
    softHead(root);
    // las formas de dar pistas son ayuda, no botones: texto con ícono sobre el fondo
    textEl(root, 'Haz mímica')?.closest('[style*="grid-template-columns"]')?.classList.add('adv-tips');
    const acts = [find(root, '¡La adivinaron!'), find(root, 'Pasar a otra palabra')].filter(Boolean);
    // «¿Listos?»: la palabra se tapa hasta que quien da las pistas toma el celular; ahí arranca el reloj
    if (card) {
      const gate = document.createElement('button');
      gate.type = 'button'; gate.className = 'adv-gate';
      gate.innerHTML = `<b>¿Listos?</b><span>${k ? 'Pásale el celular a quien da las pistas' : 'Que solo mire quien da las pistas'}</span><i>Toca para ver la palabra</i>`;
      // medidas sin la animación de entrada de la carta
      gate.style.cssText = `left:${card.offsetLeft}px;top:${card.offsetTop}px;width:${card.offsetWidth}px;height:${card.offsetHeight}px`;
      if (tFill) tFill.style.width = '100%'; if (tTxt) tTxt.textContent = SECS + 's';
      root.appendChild(gate);
      // mientras está la tapa, los botones de la palabra esperan
      acts.forEach(a => { a.classList.add('adv-wait'); a.setAttribute('aria-disabled', 'true'); });
      on(root, gate, () => {
        acts.forEach(a => { a.classList.remove('adv-wait'); a.removeAttribute('aria-disabled'); });
        if (reduced()) gate.remove(); else { gate.classList.add('off'); setTimeout(() => gate.remove(), 260); }
        t0 = performance.now(); requestAnimationFrame(tick);
      });
    } else t0 = performance.now();
    const tick = () => {
      if (done || !layer.isConnected || t0 == null) return;
      left = Math.max(0, SECS - (performance.now() - t0) / 1000);
      if (tFill) { tFill.style.width = (left / SECS * 100) + '%'; tFill.style.background = left < 10 ? 'linear-gradient(90deg,#E0565B,#F5A35B)' : ''; }
      if (tTxt) tTxt.textContent = Math.ceil(left) + 's';
      if (left <= 0) { done = true; go('adivinanzaTiempo', { ...p, res: [...res, { w: w.w, ok: false }] }, 'modal'); return; }
      requestAnimationFrame(tick);
    };
    if (t0 != null) requestAnimationFrame(tick);
    const next = (ok) => {
      if (done || t0 == null) return; done = true; // antes de «¿Listos?» no cuenta
      const r = [...res, { w: w.w, ok }];
      if (card) card.animate([{ transform: 'none', opacity: 1 }, { transform: `translateX(${ok ? 420 : -420}px) rotate(${ok ? 12 : -12}deg)`, opacity: 0 }], { duration: 320, easing: 'ease-in', fill: 'forwards' });
      seen(ok ? 'V2-Adivinanza-siguiente-claro' : 'V2-Adivinanza-pasar-claro');
      if (ok) { floaty(layer, '¡Sí!', 170, 300, null); navigator.vibrate?.(20); }
      setTimeout(() => k < 4 ? go('adivinanza', { ...p, k: k + 1, res: r }, 'none') : go('adivinanzaFin', { day: n, res: r }, 'fade'), 330);
    };
    if (timer) { timer.removeAttribute('role'); timer.style.cursor = 'default'; }
    on(root, '¡La adivinaron!', () => next(true));
    on(root, 'Pasar a otra palabra', () => next(false));
    on(root, 'Salir', () => { done = true; later(n)(); });
  },
});
register('adivinanzaTiempo', {
  file: () => F('V2-Adivinanza-tiempo-claro', 'V2-Adivinanza-tiempo'),
  mount(root, p) {
    softHead(root);
    const w = p.words[p.k];
    setText(root, 'ESTRELLA', w.w);
    const img = $$(root, 'img').find(i => i.src.includes(IMG.estrella)); if (img) img.src = A(IMG[w.img]);
    const dlg = [...root.children].reverse().find(el => el.style.background === 'rgb(255, 255, 255)' || el.getAttribute('role') === 'dialog');
    dlg?.classList.add('a-rise');
    const sg = find(root, 'Siguiente'); if (sg) sg.dataset.back = '1';
    on(root, 'Siguiente', () => p.k < 4 ? go('adivinanza', { ...p, k: p.k + 1 }, 'fade') : go('adivinanzaFin', { day: p.day, res: p.res }, 'fade'));
  },
});
register('adivinanzaFin', {
  file: () => F('V2-Adivinanza-fin-claro', 'V2-Adivinanza-fin'),
  mount(root, p, layer) {
    const okN = p.res.filter(r => r.ok).length;
    setText(root, /^\d$/, String(okN));
    setText(root, '¡Qué buen equipo!', okN >= 4 ? '¡Qué buen equipo!' : okN >= 2 ? '¡Bien jugado!' : '¡Buen intento!');
    // fichas de palabras: con ✓ las adivinadas, con → las que pasaron
    const okTpl = $$(root, 'span').find(s => s.textContent.trim() === 'ESTRELLA')?.closest('span[style*="border-radius"]');
    const skipTpl = $$(root, 'span').find(s => s.textContent.trim() === 'JOSÉ')?.closest('span[style*="border-radius"]');
    const box = okTpl?.parentElement;
    if (box && okTpl && skipTpl) {
      const a = okTpl.outerHTML, b = skipTpl.outerHTML;
      box.innerHTML = '';
      p.res.forEach((r, i) => {
        const t = document.createElement('template'); t.innerHTML = r.ok ? a : b;
        const el = t.content.firstElementChild;
        const txt = [...el.querySelectorAll('*'), el].map(e => [...e.childNodes]).flat().find(c => c.nodeType === 3 && c.nodeValue.trim());
        if (txt) txt.nodeValue = r.w;
        el.style.animation = `pop .4s ${.2 + i * .12}s cubic-bezier(.2,.9,.3,1.3) both`;
        box.appendChild(el);
      });
      box.style.flexWrap = 'wrap';
    }
    const first = sorpresaHecha(p.day, layer);
    paintFin(root, layer, p.day, first);
  },
});

// ================= DESAFÍO EN FAMILIA =================
register('desafioIntro', {
  file: () => F('V2-Desafio-intro-claro', 'V2-Desafio-intro'),
  mount(root, p) {
    const salir = p.fromHub ? () => back('hub') : later(p.day);
    on(root, '¡Vamos!', () => go('desafio', { day: p.day, fromHub: p.fromHub, replay: p.replay }, 'fade'));
    on(root, 'Ahora no', salir); on(root, 'Cerrar', salir);
    $$(root, 'img').forEach(i => /Teodoro/.test(i.alt || '') && i.classList.add('a-bob'));
  },
});
register('desafio', {
  file: () => F('V2-Desafio-claro', 'V2-Desafio'),
  mount(root, p, layer) {
    softHead(root);
    // cada día de desafío empieza en otra carta del mazo
    let c = p.c ?? (Math.floor(p.day / 3) * 2) % DESAFIOS.length;
    const scroll = [...root.children].find(el => el.style.top === '360px');
    const tx = $$(scroll, 'div, span').filter(el => el.childElementCount === 0 && el.textContent.trim());
    // el ícono pequeño de la carta (no el pergamino de fondo)
    const ico = $$(scroll, 'img').filter(i => (parseFloat(i.style.width) || i.offsetWidth) < 90).sort((a, b) => a.offsetWidth - b.offsetWidth)[0];
    const paint2 = () => { const d = DESAFIOS[c]; if (tx[0]) tx[0].textContent = d.t; if (tx[1]) tx[1].textContent = d.sub; if (ico && d.icon && IMG[d.icon]) { ico.src = A(IMG[d.icon]); ico.style.objectFit = 'contain'; } };
    paint2();
    // el ícono del lienzo no carga: se usa el corazón del reto en familia
    $$(scroll, 'img').forEach(i => { if (!i.complete || i.naturalWidth === 0) i.onerror = () => { i.src = A(IMG.corona); }; });
    scroll.style.animation = 'pop .5s cubic-bezier(.2,.9,.3,1.2) both';
    $$(root, 'img').forEach(i => /Teodoro/.test(i.alt || '') && i.classList.add('a-bob'));
    on(root, 'Sacar otra carta', async () => {
      await scroll.animate([{ transform: 'none' }, { transform: 'rotateY(90deg) scale(.9)' }], { duration: 200, easing: 'ease-in', fill: 'forwards' }).finished;
      c = (c + 1) % DESAFIOS.length; paint2(); seen('V2-Desafio-carta2-claro');
      scroll.animate([{ transform: 'rotateY(-90deg) scale(.9)' }, { transform: 'none' }], { duration: 260, easing: 'ease-out', fill: 'forwards' });
    });
    on(root, '¡Lo hicimos!', (ev, el) => {
      animate(el, 'a-pop'); navigator.vibrate?.(20);
      if (!p.fromHub) { setTimeout(() => go('desafioFin', { day: p.day, c }, 'fade'), 260); return; }
      // abierto desde el reto: este «¡Lo hicimos!» cierra el reto (sin volver a confirmarlo en el hub)
      if (_stack.at(-1)?.name === 'hub') _stack.pop();
      if (p.replay) { toast('¡Otra vez en familia!'); setTimeout(() => go('mapa', {}, 'down', { replace: true }), 260); return; }
      finishContent(p.day);
      setTimeout(() => go('completado', { day: p.day }, 'fade', { replace: true }), 260);
    });
    on(root, 'Salir', p.fromHub ? () => go('hub', { day: p.day }, 'back') : later(p.day));
  },
});
register('desafioFin', {
  file: () => F('V2-Desafio-fin-claro', 'V2-Desafio-fin'),
  mount(root, p, layer) {
    const d = DESAFIOS[p.c ?? 0];
    setText(root, 'Ayuda a alguien en casa hoy', d.t);

    setText(root, /^Como María, que fue de prisa a ayudar a Isabel\.?$/, d.sub + '.');
    const stamp = $$(root, '*').find(el => /HECHO EN/.test(el.textContent) && el.childElementCount <= 3 && el.style.borderRadius === '50%');
    if (stamp) stamp.style.animation = 'popRot .6s .4s cubic-bezier(.2,.9,.3,1.4) both';
    $$(root, 'img').forEach(i => { i.addEventListener('error', () => { i.src = A(IMG.corona); }, { once: true }); if (i.complete && !i.naturalWidth) i.src = A(IMG.corona); });
    const cal = find(root, 'Califícanos'); if (cal) cal.style.display = 'none';
    const first = sorpresaHecha(p.day, layer);
    paintFin(root, layer, p.day, first);
  },
});

// ================= CALIFICAR Y COMPARTIR (al terminar cada video o canción) =================
const TIPO = { intro: 'Video', domingo: 'Evangelio del día', meditacion: 'Meditación', cuento: 'Cuento', amigos: 'Amigos de la Biblia', cancion: 'Canción', video: 'Video', juego: 'Juego', reto: 'Reto en familia', nochebuena: 'Nochebuena' };
// miniatura, tipo y título del día (la misma escena del reproductor)
function paintCard(root, n, extra) {
  const d = DAYS[n];
  const img = root.querySelector('[data-thumb]');
  if (img && d.scene) { img.src = A(d.scene); img.alt = d.title; }
  const tipo = root.querySelector('[data-tipo]'); if (tipo) tipo.textContent = extra === 'cancion' ? 'Canción' : TIPO[d.type] || 'Video';
  const tit = root.querySelector('[data-titulo]'); if (tit) tit.textContent = extra === 'cancion' ? 'Canción para cantar en familia' : d.title;
  root.querySelector('[data-card]')?.classList.add('a-rise');
}
// Calificar dentro de «¡Terminaste!»: fila discreta entre Teodoro y el botón (pregunta + 5 estrellas + Compartir).
// Se llama al final del mount de 'completado' (flow.js), cuando el layout ya está puesto.
const QUE = { cancion: '¿Te gustó la canción?' };
const STAR = '<svg aria-hidden="true" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linejoin="round"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9Z"/></svg>';
const SHARE = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7.5 7.5 12 3l4.5 4.5"/><path d="M8 11H6.5A1.5 1.5 0 0 0 5 12.5v7A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5H16"/></svg>';
export function rateRow(root, n, extra) {
  const d = DAYS[n]; if (!d) return;
  // la misma palabra que el antetítulo («¡Terminaste el video!» → «¿Te gustó el video?»)
  const fin = extra === 'cancion' ? 'canción' : (TYPES[d.type]?.fin || '');
  const pregunta = /canci[oó]n/i.test(fin) ? QUE.cancion : /Evangelio/.test(fin) ? '¿Te gustó el Evangelio?' : /Jugaron/.test(fin) ? '¿Te gustó el juego?' : '¿Te gustó el video?';
  const row = document.createElement('div');
  row.className = 'rate-row';
  row.innerHTML = `<div class="rr-q" aria-live="polite">${pregunta}</div>
    <div class="rr-line"><div class="rr-stars" role="radiogroup" aria-label="${pregunta.replace(/[¿?]/g, '')}">${[1, 2, 3, 4, 5].map(k => `<button type="button" role="radio" aria-checked="false" aria-label="${k} de 5 estrellas">${STAR}</button>`).join('')}</div>
    <button type="button" class="rr-share" aria-label="Compartir">${SHARE}</button></div>`;
  root.appendChild(row);
  const q = row.querySelector('.rr-q'), stars = $$(row, '[role=radio]');
  const paint = k => stars.forEach((b, i) => { b.setAttribute('aria-checked', String(i + 1 === k)); b.classList.toggle('on', i < k); });
  const prev = (S.calificaciones || {})[n] || 0;
  paint(prev); if (prev) q.textContent = '¡Gracias!';
  stars.forEach((b, i) => on(root, b, () => {
    (S.calificaciones ||= {})[n] = i + 1; save();
    paint(i + 1); navigator.vibrate?.(12);
    if (q.textContent !== '¡Gracias!') { q.textContent = '¡Gracias!'; animate(q, 'a-pop'); }
    stars.slice(0, i + 1).forEach((s, j) => { s.style.animation = 'none'; void s.offsetWidth; s.style.animation = `pop .35s ${j * .04}s cubic-bezier(.2,.9,.3,1.4) both`; });
  }));
  const back = { ...(cur?.params || { day: n }) };
  on(root, row.querySelector('.rr-share'), () => go('compartir', { day: n, extra, back }, 'page'));
  // sitio: encima del subtítulo (si se ve) o del botón principal; Teodoro se achica/sube lo justo para no montarse
  const btn = [...root.children].find(el => el.tagName === 'A' && /^(¡A jugar!|Ir al juego sorpresa|Volver al camino)$/.test(el.textContent.trim()));
  const sub = [...root.children].find(el => el.tagName === 'DIV' && /sobre el (video|reto|cuento) de hoy|juego sorpresa/.test(el.textContent) && el.style.display !== 'none');
  // sin subtítulo, el botón vuelve a su sitio de siempre (la fila llena el hueco que antes se cerraba subiéndolo)
  if (btn && !sub && btn.offsetTop < 676) btn.style.top = '676px';
  const bt = btn ? btn.offsetTop : 676;
  // el subtítulo queda pegado al botón y la fila justo encima
  if (sub) sub.style.top = (bt - 14 - sub.offsetHeight) + 'px';
  const top = (sub ? sub.offsetTop - 8 : bt - 16) - row.offsetHeight;
  row.style.top = top + 'px';
  const teo = $$(root, 'img').find(i => i.src.includes(IMG.tPregunta));
  if (teo && teo.offsetTop + teo.offsetHeight > top - 6) {
    const h0 = teo.offsetHeight, w0 = teo.offsetWidth;
    const h = Math.max(220, Math.min(h0 * .92, top - 6 - 204));
    const w = w0 * h / h0;
    teo.style.height = h + 'px'; teo.style.width = w + 'px';
    teo.style.left = (195 - w / 2) + 'px'; teo.style.top = (top - 6 - h) + 'px';
  }
  row.classList.add('a-rise');
}
register('compartir', {
  file: () => F('Compartir-claro', 'Compartir'),
  mount(root, p) {
    paintCard(root, p.day, p.extra);
    // vuelve a la pantalla de abajo tal cual (cierra la hoja)
    const volver = () => go(p.back ? 'completado' : 'mapa', p.back || {}, 'down', { replace: true });
    on(root, 'Cerrar', volver);
    const LINK = 'https://camino-a-belen-mvp.vercel.app';
    on(root, 'Copiar link', () => { navigator.clipboard?.writeText(LINK).catch(() => {}); toast('Link copiado'); });
    on(root, 'Más', async () => {
      const d = DAYS[p.day];
      if (navigator.share) { try { await navigator.share({ title: d.title, text: `${d.title} · Camino a Belén con Teodoro`, url: LINK }); } catch { /* lo cerraron */ } }
      else nota('Compartir', 'Este navegador no tiene el menú de compartir');
    });
    ['Mensajes', 'Instagram', 'WhatsApp', 'Facebook'].forEach(k => on(root, k, () => nota('Prototipo', `Abriría ${k}`)));
  },
});
