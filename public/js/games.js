// Trivia y juegos sorpresa, armados sobre las pantallas del lienzo.
import { S, save, A, $, $$, on, find, go, register, toast, frag, seen, wait, reduced, animate, replaceText, setText, textEl,
  floaty, confetti, addPanes, dark, stars, isDone } from './core.js';
import { DAYS, TRIVIA, RULES, IMG, MEMORAMA, ADIVINANZA, DESAFIOS } from './data.js';
import { finishTrivia, openSorpresa } from './flow.js';

const F = (c, o) => dark() ? o : c;
const speak = text => {
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = 'es-MX'; u.rate = .95; speechSynthesis.speak(u);
  } catch { toast('Escuchar', 'Este navegador no lee en voz alta'); }
};
const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const toMapAfterGame = () => go('mapa', { thenCerrado: true }, 'down');

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

register('trivia', {
  file: p => { const q = TRIVIA[p.day][p.i || 0]; return isPic(q) ? F('V2-06a-Trivia-sin-elegir-claro', 'V2-06a-Trivia-sin-elegir') : F('V2-06c-Trivia-varias-claro', 'V2-06c-Trivia-varias'); },
  async mount(root, p, layer) {
    const T = await tTemplates();
    const n = p.day, i = p.i || 0, ok = p.ok || 0;
    const q = TRIVIA[n][i];
    let fallos = 0, answered = false;

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
        if (k < i) { d.style.background = dark() ? '#FFF6DD' : '#0B748A'; }
        d.style.transition = 'width .3s, background .3s';
      });
    }
    // pregunta
    const card = [...root.children].find(el => el.style.top === '262px');
    const qEl = card?.querySelector('div');
    if (qEl) qEl.textContent = q.q;
    card?.classList.add('a-rise');
    on(root, 'Escuchar', () => speak(q.q + '. ' + q.o.map(o => o.t || o).join(', ')));
    const teo = $$(root, 'img').find(im => im.src.includes(IMG.tPregunta));
    const setTeo = (id, cls) => { if (!teo) return; teo.src = A(id); teo.classList.remove('a-hop', 'a-bob', 'a-shake'); void teo.offsetWidth; cls && teo.classList.add(cls); };
    setTeo(IMG.tPregunta, 'a-bob');

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
    // 3 opciones con imagen; 4 con texto en grilla 2×2
    if (!isPic(q)) group.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
    opts.forEach((el, k) => { group.appendChild(el); el.style.animation = `rise .4s ${.08 * k}s cubic-bezier(.2,.8,.2,1) both`; });

    // pie: pista de interacción y «Comprobar»
    const hint = [...root.children].find(el => el.style.top === '700px' || el.style.top === '702px');
    const check = [...root.children].find(el => el.tagName === 'A' && /Comprobar/.test(el.textContent));
    if (!isMulti(q)) {
      check?.remove();
      if (hint && !isPic(q)) { hint.innerHTML = `<span style="height:30px;padding:0 14px;border-radius:15px;background:${dark() ? 'rgba(255,255,255,.1)' : '#E2F3F7'};font-size:14px;display:flex;align-items:center">Toca la respuesta</span>`; }
    }

    const clearFeedback = () => $$(root, '[role=status], [role=note], [data-next], [data-spark]').forEach(e => e.remove());
    const showNext = () => {
      const t = document.createElement('template'); t.innerHTML = T.next;
      const a = t.content.firstElementChild; a.dataset.next = '1'; a.removeAttribute('href');
      if (i === 4) a.textContent = 'Ver resultado';
      root.appendChild(a); a.classList.add('a-rise');
      on(root, a, () => {
        if (i < 4) go('trivia', { day: n, i: i + 1, ok: ok + (fallos === 0 ? 1 : 0) }, 'push');
        else go('triviaFin', { day: n, ok: ok + (fallos === 0 ? 1 : 0) }, 'modal');
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
      root.appendChild(st); st.classList.add('a-pop');
      const sp = document.createElement('div'); sp.dataset.spark = '1'; sp.innerHTML = T.sparkles; [...sp.children].forEach((s, k) => { s.classList.add('a-twinkle'); s.style.animationDelay = k * .2 + 's'; });
      root.append(...sp.children);
      setTeo(IMG.tCelebra, 'a-hop');
      if (fallos === 0) floaty(layer, '¡Bien!', 160, 230, null);
      showNext();
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
      if (hint) hint.style.display = 'none';
      if (isMulti(q)) { nt.style.top = '650px'; }
      root.appendChild(nt); nt.classList.add('a-rise');
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
    on(root, 'Salir de la trivia', () => go('mapa', {}, 'down'));
  },
});

register('triviaFin', {
  file: p => RULES.sorpresa[p.day] && S.sorpresas[p.day] !== 'hecha' ? F('V2-Trivia-fin-sorpresa-claro', 'V2-Trivia-fin-sorpresa') : F('V2-Trivia-fin-claro', 'V2-Trivia-fin'),
  async mount(root, p, layer) {
    const n = p.day;
    const { est, first } = finishTrivia(n, p.ok);
    setText(root, /^\d de 5$/, `${p.ok} de 5`);
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
    if (!first && chip) chip.style.visibility = 'hidden';
    else if (chip) { chip.classList.add('a-pop'); floaty(layer, `+${RULES.panes.trivia}`, 230, 430); }
    const dlg = root.querySelector('[role=dialog]'); dlg?.classList.add('a-rise');
    $$(root, 'img').filter(i => i.src.includes(IMG.tCelebra)).slice(-1).forEach(i => i.classList.add('a-hop'));
    if (est >= 2) confetti(layer, 195, 300, est === 3 ? 60 : 30);
    on(root, 'Volver al camino', () => toMapAfterGame());
    on(root, 'Jugar otra vez', () => go('trivia', { day: n, i: 0, ok: 0 }, 'fade'));
    on(root, 'Abrir la sorpresa', () => openSorpresa(n));
    on(root, 'Ahora no', () => { S.sorpresas[n] = 'luego'; save(); toMapAfterGame(); });
  },
});

// Final común de los juegos sorpresa: +15 panes, una sola vez
function sorpresaHecha(n, layer) {
  const first = S.sorpresas[n] !== 'hecha';
  if (first) { S.sorpresas[n] = 'hecha'; addPanes(RULES.panes.sorpresa); save(); }
  return first;
}
function paintFin(root, layer, n, first) {
  replaceText(root, /guardadas en el día \d+/, `guardadas en el día ${n}`);
  const s = stars(n);
  const box = textEl(root, /guardadas en el día/)?.parentElement;
  if (box) $$(box, 'svg').forEach((sv, k) => sv.querySelectorAll('path').forEach(pt => pt.setAttribute('fill', k < s ? '#F7C948' : '#D3DDE5')));
  const bread = $$(root, 'img').find(i => i.src.includes(IMG.pan) && parseFloat(i.style.width) > 60);
  bread?.parentElement?.classList.add('a-pop');
  if (first) floaty(layer, `+${RULES.panes.sorpresa}`, 230, 380); else setText(root, /Ganaste \d+ panes/, 'Ya ganaste estos panes');
  $$(root, 'img').filter(i => i.src.includes(IMG.tCelebra)).forEach(i => i.classList.add('a-hop'));
  confetti(layer, 195, 260, 44);
  on(root, 'Volver al camino', toMapAfterGame); on(root, 'Cerrar', toMapAfterGame);
}
const later = n => () => { S.sorpresas[n] = 'luego'; save(); toMapAfterGame(); };

// ================= MEMORAMA =================
register('memoramaReglas', {
  file: () => F('V2-Memorama-reglas-claro', 'V2-Memorama-reglas'),
  mount(root, p) {
    on(root, '¡A jugar!', () => go('memorama', { day: p.day }, 'fade'));
    on(root, 'Ahora no', later(p.day)); on(root, 'Cerrar', later(p.day));
    $$(root, 'img').forEach((i, k) => { if (/Teodoro/.test(i.alt || '') || k === 2) i.classList.add('a-bob'); });
    $$(root, '[style*="rotate"]').forEach(c => c.classList.add('a-sway'));
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
    const paint = () => { if (pairsEl) pairsEl.nodeValue = `${found} de 6`; if (movesEl) movesEl.nodeValue = String(moves); };
    paint();
    deck.forEach((k, idx) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'mm-card'; b.dataset.bound = '1';
      b.setAttribute('aria-label', 'Carta boca abajo');
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
          found++; paint(); a.b.classList.add('done'); c.b.classList.add('done');
          if (hintEl) hintEl.textContent = found === 6 ? '¡Encontraste todas!' : `¡Pareja! ${NAMES[k]}`;
          lock = false;
          if (found === 6) { confetti(layer, 195, 400, 50); await wait(900); go('memoramaFin', { day: n, moves }, 'fade'); }
        } else {
          await wait(850);
          a.b.classList.remove('up'); c.b.classList.remove('up');
          a.b.setAttribute('aria-label', 'Carta boca abajo'); c.b.setAttribute('aria-label', 'Carta boca abajo');
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
    setText(root, /^\d+ movimientos$/, `${p.moves} movimientos`);
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
    $$(root, '[style*="rotate"]').forEach(c => c.classList.add('a-sway'));
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
      const fill = prog.querySelector('div > div'); if (fill) fill.style.width = (k / 5 * 100) + '%';
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
    const tFill = timer?.querySelector('div > div'), tTxt = timer && textEl(timer, /\d+s/);
    let left = SECS, done = false;
    const t0 = performance.now();
    const tick = () => {
      if (done || !layer.isConnected) return;
      left = Math.max(0, SECS - (performance.now() - t0) / 1000);
      if (tFill) { tFill.style.width = (left / SECS * 100) + '%'; tFill.style.background = left < 10 ? 'linear-gradient(90deg,#E0565B,#F5A35B)' : ''; }
      if (tTxt) tTxt.textContent = Math.ceil(left) + 's';
      if (left <= 0) { done = true; go('adivinanzaTiempo', { ...p, res: [...res, { w: w.w, ok: false }] }, 'modal'); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    const next = (ok) => {
      if (done) return; done = true;
      const r = [...res, { w: w.w, ok }];
      if (card) card.animate([{ transform: 'none', opacity: 1 }, { transform: `translateX(${ok ? 420 : -420}px) rotate(${ok ? 12 : -12}deg)`, opacity: 0 }], { duration: 320, easing: 'ease-in', fill: 'forwards' });
      seen(ok ? 'V2-Adivinanza-siguiente-claro' : 'V2-Adivinanza-pasar-claro');
      if (ok) floaty(layer, '¡Sí!', 170, 300, null);
      setTimeout(() => k < 4 ? go('adivinanza', { ...p, k: k + 1, res: r }, 'none') : go('adivinanzaFin', { day: n, res: r }, 'fade'), 330);
    };
    on(root, '¡La adivinaron!', () => next(true));
    on(root, 'Pasar a otra palabra', () => next(false));
    on(root, 'Salir', () => { done = true; later(n)(); });
    ['Haz mímica', 'Haz sonidos', 'Descríbela'].forEach(t => { const el = textEl(root, t)?.parentElement; if (el) on(root, el, () => { animate(el, 'a-pop'); toast(t, 'Una idea para dar pistas'); }); });
  },
});
register('adivinanzaTiempo', {
  file: () => F('V2-Adivinanza-tiempo-claro', 'V2-Adivinanza-tiempo'),
  mount(root, p) {
    const w = p.words[p.k];
    setText(root, 'ESTRELLA', w.w);
    const img = $$(root, 'img').find(i => i.src.includes(IMG.estrella)); if (img) img.src = A(IMG[w.img]);
    const dlg = [...root.children].reverse().find(el => el.style.background === 'rgb(255, 255, 255)' || el.getAttribute('role') === 'dialog');
    dlg?.classList.add('a-rise');
    $$(root, 'div').filter(el => el.style.borderRadius === '50%').slice(-1).forEach(el => el.classList.add('a-sway'));
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
    on(root, '¡Vamos!', () => go('desafio', { day: p.day, c: Math.floor(Math.random() * DESAFIOS.length) }, 'fade'));
    on(root, 'Ahora no', later(p.day)); on(root, 'Cerrar', later(p.day));
    $$(root, 'img').forEach(i => /Teodoro/.test(i.alt || '') && i.classList.add('a-bob'));
    $$(root, '[style*="rotate"]').forEach(c => c.classList.add('a-sway'));
  },
});
register('desafio', {
  file: () => F('V2-Desafio-claro', 'V2-Desafio'),
  mount(root, p, layer) {
    let c = p.c ?? 0;
    const scroll = [...root.children].find(el => el.style.top === '360px');
    const tx = $$(scroll, 'div, span').filter(el => el.childElementCount === 0 && el.textContent.trim());
    const paint2 = () => { const d = DESAFIOS[c]; if (tx[0]) tx[0].textContent = d.t; if (tx[1]) tx[1].textContent = d.sub; };
    paint2();
    // el ícono del lienzo no carga: se usa el corazón del reto en familia
    $$(scroll, 'img').forEach(i => { if (!i.complete || i.naturalWidth === 0) i.onerror = () => { i.src = A(IMG.corona); }; });
    scroll.style.animation = 'pop .5s cubic-bezier(.2,.9,.3,1.2) both';
    $$(root, 'img').forEach(i => /Teodoro/.test(i.alt || '') && i.classList.add('a-bob'));
    on(root, 'Sacar otra carta', async () => {
      await scroll.animate([{ transform: 'none' }, { transform: 'rotateY(90deg) scale(.9)' }], { duration: 200, easing: 'ease-in', fill: 'forwards' }).finished;
      c = (c + 1 + Math.floor(Math.random() * (DESAFIOS.length - 1))) % DESAFIOS.length; paint2();
      scroll.animate([{ transform: 'rotateY(-90deg) scale(.9)' }, { transform: 'none' }], { duration: 260, easing: 'ease-out', fill: 'forwards' });
    });
    on(root, '¡Lo hicimos!', () => { confetti(layer, 195, 520, 30); setTimeout(() => go('desafioFin', { day: p.day, c }, 'fade'), 500); });
    on(root, 'Salir', later(p.day));
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
    on(root, 'Califícanos', () => go('calificacion', { back: 'desafioFin', day: p.day, c: p.c }, 'up'));
    const first = sorpresaHecha(p.day, layer);
    paintFin(root, layer, p.day, first);
  },
});
