// Mapa del camino: se pinta en vivo sobre la pantalla «Camino completo» del lienzo.
import { S, save, A, $, $$, on, frag, go, back, clearHistory, walkDay, toast, seen, hueco, paintEnergy, teodoroImg, activeDay, isDone, contentDone,
  lastDay, stars, wait, reduced, animate, register, replaceText, dark } from './core.js';
import { DAYS, TYPES, RULES, IMG, dateOf, iconOf, SORPRESA_NOMBRE } from './data.js';
import { startDay, ctaLabel } from './flow.js';

const F = { claro: 'V2-Mapa-completo-claro', oscuro: 'V2-Mapa-completo' };
const F0 = { claro: 'V2-Mapa-dia0-claro', oscuro: 'V2-Mapa-dia0' };

let tpl = null; // piezas sacadas de las plantillas, por tema
let mapOrigin = null; // pantalla desde la que se entró al camino
async function templates() {
  const key = dark() ? 'oscuro' : 'claro';
  if (tpl?.key === key) return tpl;
  const full = await frag(F[key]);
  const zero = await frag(F0[key]);
  const triv = await frag(key === 'claro' ? 'S-03b-Mapa-trivia' : 'S-03b-Mapa-trivia-oscuro');
  const d26 = await frag(key === 'claro' ? 'V2-Mapa-d24-claro' : 'V2-Mapa-oscuro');
  const past = await frag(key === 'claro' ? 'S-03c-Mapa-dia-pasado' : 'S-03c-Mapa-dia-pasado-oscuro');
  const pastSheet = [...past.children].find(el => el.style.bottom === '10px');
  const pastNode = past.querySelector('a[aria-label*="elegido"]');
  const closed = await frag(key === 'claro' ? 'S-03d-Mapa-dia-cerrado' : 'S-03d-Mapa-dia-cerrado-oscuro');
  const bubble = closed.querySelector('[role=status]');
  const energy = await frag(key === 'claro' ? 'S-03e-Mapa-energia' : 'S-03e-Mapa-energia-oscuro');
  const energySheet = [...energy.children].find(el => el.style.bottom === '10px');
  const d11 = await frag(key === 'claro' ? 'S-03f-Mapa-dia11' : 'S-03f-Mapa-dia11-oscuro');
  const d11Rows = [...[...d11.children].find(el => el.style.bottom === '10px').children].filter(el => el.style.height === '58px');
  const trivSheet = [...triv.children].find(el => el.style.bottom === '10px');
  const trivRows = [...trivSheet.children].filter(el => el.style.height === '58px');
  const sheet26 = [...d26.children].find(el => el.style.bottom === '10px' || /Llegamos a Belén/.test(el.textContent || '') && el.style.position === 'absolute' && parseFloat(el.style.left) <= 20);
  const node = n => full.querySelector(`a[aria-label^="Día ${n},"]`);
  const badge = n => { const s = node(n).querySelector(':scope > span[aria-hidden]'); return s ? s.outerHTML : ''; };
  const icons = {};
  for (let n = 1; n <= 26; n++) { const i = zero.querySelector(`a[aria-label^="Día ${n},"] img`); if (i) icons[n] = i.getAttribute('src'); }
  const houses = $$(full, '[aria-label^="Ruleta sorpresa"]').map(a => a.innerHTML);
  const sheet = [...full.children].find(el => el.style.bottom === '10px');
  const rows = [...sheet.children].filter(el => el.style.height === '58px');
  tpl = {
    key,
    done: node(1).getAttribute('style'),
    doneInner: [...node(1).childNodes].filter(c => !(c.tagName === 'SPAN' && c.getAttribute('aria-hidden'))).map(c => c.outerHTML || '').join(''),
    badges: { 3: badge(1), 2: badge(2), 1: badge(4), 0: badge(1).replace(/(fill|stroke)="#(?!fff|FFF)[0-9A-Fa-f]{3,6}"/g, '$1="#C9D6DF"').replace(/(fill|stroke): ?#(?!fff|FFF)[0-9A-Fa-f]{3,6}/g, '$1: #C9D6DF') },
    today: node(9).getAttribute('style'),
    todayInner: node(9).innerHTML,
    locked: node(10).getAttribute('style'),
    lockedInner: node(10).innerHTML,
    last: node(26).getAttribute('style'),
    icons,
    houseOpen: houses[0], houseNext: houses[1], houseFuture: houses[2],
    rowOn: rows[0].outerHTML, rowOff: rows[1].outerHTML,
    doneBadge: trivRows[0].lastElementChild.outerHTML,
    trivIcon: rows[1].querySelector('img')?.getAttribute('src'),
    sheet26: sheet26 ? sheet26.outerHTML : null,
    pastSheet: pastSheet?.outerHTML, selShadow: pastNode?.style.boxShadow,
    bubble: bubble?.outerHTML, bubbleArrow: bubble?.nextElementSibling?.outerHTML,
    energySheet: energySheet?.outerHTML, ruletaRow: d11Rows[1]?.outerHTML,
  };
  return tpl;
}

const pos = el => ({ x: parseFloat(el.style.left), y: parseFloat(el.style.top), w: parseFloat(el.style.width) });
const restyle = (el, style, p, size) => {
  el.setAttribute('style', style);
  const off = (size - p.w) / 2;
  el.style.left = (p.x - off) + 'px'; el.style.top = (p.y - off) + 'px';
};

register('mapa', {
  files: [F.claro, F.oscuro],
  noScroll: true,
  async mount(root, params, layer) {
    const T = await templates();
    const trivAct = activeDay();          // primera trivia pendiente
    const act = walkDay();                // donde va Teodoro (primera historia sin ver)
    const focus = act ?? Math.min(lastDay(), 26);

    // 1) La vista: el mapa largo va en un scroller; cabecera y hoja quedan fijas
    const scroller = document.createElement('div');
    scroller.style.cssText = 'position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;overscroll-behavior:contain';
    const fixed = [...root.children].filter(el => {
      const s = el.style;
      return (s.top === '0px' && (s.height === '112px' || s.height === '50px')) || s.top === '52px' || s.bottom === '10px' || el.getAttribute('aria-label') === 'Volver a hoy';
    });
    root.parentElement.replaceWith(scroller);
    const pad = document.createElement('div'); pad.style.height = '0';
    scroller.append(root);
    root.style.marginBottom = '0';
    fixed.forEach(el => layer.appendChild(el));
    // el final del mapa sigue el color del mapa (nunca se ve el fondo negro al hacer scroll)
    const mapBg = getComputedStyle(root).backgroundColor;
    scroller.style.background = mapBg && mapBg !== 'rgba(0, 0, 0, 0)' ? mapBg : (dark() ? '#0A2340' : '#F3EEE3');
    const extra = document.createElement('div'); extra.style.height = '230px';
    scroller.appendChild(extra);

    // 2) Nodos de cada día
    const nodes = {};
    for (let n = 1; n <= 26; n++) {
      const el = root.querySelector(`a[aria-label^="Día ${n},"]`);
      if (!el) continue;
      const p = pos(el); nodes[n] = { el, p };
      const d = DAYS[n];
      const icon = T.icons[n] ? `<img src="${T.icons[n]}" alt="" style="width: 30px; height: 24px; object-fit: contain; opacity: .55">` : '';
      if (isDone(n) && !(S.pasoAnimado === n && !reduced())) {
        restyle(el, T.done, p, 64);
        el.innerHTML = T.doneInner.replace(/>\d+</, `>${n}<`) + (T.badges[stars(n)] || '');
        el.setAttribute('aria-label', `Día ${n}, ${d.title}, completado${stars(n) ? `, ${stars(n)} de 3 estrellas` : ''}`);
      } else if (contentDone(n) && n !== act && !(S.pasoAnimado === n && !reduced())) {
        // vio la historia pero no jugó la trivia: Teodoro ya pasó, sin estrellas todavía
        restyle(el, T.done, p, 64);
        el.innerHTML = T.doneInner.replace(/>\d+</, `>${n}<`) + (T.badges[0] || '');
        el.setAttribute('aria-label', `Día ${n}, ${d.title}: historia vista, trivia pendiente, 0 estrellas`);
      } else if (n === act || (S.pasoAnimado && n === S.pasoAnimado)) {
        restyle(el, T.today, p, 84);
        el.innerHTML = T.todayInner.replace(/>\d+</, `>${n}<`);
        el.setAttribute('aria-label', `Día ${n}, hoy: ${d.title}`);
        el.dataset.today = '1';
      } else if (n <= lastDay()) {
        restyle(el, n === 26 ? T.last : T.locked, p, n === 26 ? 88 : 64);
        el.innerHTML = T.lockedInner.replace(/<img[^>]*>/, icon.replace('opacity: .55', 'opacity: 1')).replace(/>\d+</, `>${n}<`);
        el.style.outline = '3px dashed #F5DB78'; el.style.outlineOffset = '3px';
        el.setAttribute('aria-label', `Día ${n}, ${d.title}, pendiente`);
      } else {
        restyle(el, n === 26 ? T.last : T.locked, p, n === 26 ? 88 : 64);
        el.innerHTML = T.lockedInner.replace(/<img[^>]*>/, icon).replace(/>\d+</, `>${n}<`);
        el.setAttribute('aria-label', `Día ${n}, ${d.title}, cerrado`);
      }
      on(root, el, () => tapNode(n, el, layer));
    }

    // 3) Teodoro y la burbuja de curiosidad
    const teo = $$(root, 'img').find(i => (i.alt || '').startsWith('Teodoro'));
    const bubble = root.querySelector('[data-curiosidad]');
    const place = n => {
      const t = nodes[n]; if (!t || !teo) return;
      const size = t.el.dataset.today ? 84 : 64;
      const cx = parseFloat(t.el.style.left) + size / 2, cy = parseFloat(t.el.style.top);
      // Teodoro protagonista: grande, centrado y parado sobre su día
      teo.style.left = (cx - 46) + 'px'; teo.style.top = (cy + size * .82 - 118) + 'px';
    };
    if (teo) {
      teo.src = teodoroImg();
      teo.style.width = '92px'; teo.style.height = '118px'; teo.style.objectFit = 'contain'; teo.style.objectPosition = '50% 100%'; teo.style.zIndex = '2'; teo.style.pointerEvents = 'none';
      teo.style.filter = 'drop-shadow(0 6px 8px rgba(8,93,111,.25))';
      teo.classList.add('a-bob');
      if (focus >= 1) place(S.pasoAnimado || focus); else teo.style.display = 'none';
      // volvió tras días sin caminar: Teodoro despierta al verlos
      if (params.despierta && !reduced()) { teo.classList.remove('a-bob'); setTimeout(() => { teo.src = teodoroImg(Math.max(S.bateria, 3)); animate(teo, 'a-hop'); }, 500); }
    }
    if (bubble) {
      const nx = (act ?? focus) + 1;
      if (nodes[nx]) {
        bubble.style.top = (nodes[nx].p.y + 14) + 'px'; bubble.style.zIndex = '1';
        replaceText(bubble, /¿Qué habrá.*\?/, S.hoy <= 0 ? '¡Nos vemos el 29!' : nx > lastDay() ? '¿Qué habrá mañana?' : '¡Sigue el camino!');
        const w = bubble.offsetWidth || 162;
        bubble.style.left = Math.min(390 - 12 - w, nodes[nx].p.x + 72) + 'px';
        bubble.classList.add('a-rise');
      } else bubble.remove();
    }

    // 4) Casas de la ruleta (semanas 1–4)
    $$(root, '[aria-label^="Ruleta sorpresa"]').forEach((a, i) => {
      const d = RULES.ruleta[i];
      const img = a.querySelector('img').getAttribute('src');
      const opened = !!S.ruletas[d];
      const nextUp = !opened && RULES.ruleta.find(x => !S.ruletas[x]) === d;
      a.innerHTML = (opened ? T.houseOpen : nextUp ? T.houseNext : T.houseFuture).replace(/src="[^"]*"/, `src="${img}"`);
      const label = S.hoy <= 0 ? `Día ${d}` : opened ? 'Abierta' : d === lastDay() ? 'Hoy' : d < lastDay() ? 'Pendiente' : nextUp ? (d - S.hoy === 1 ? 'Mañana' : `Faltan ${d - S.hoy} días`) : `Día ${d}`;
      replaceText(a, /Abierta|Faltan \d+ días|Día \d+/, label);
      // el candado solo en lo que aún no llega
      if (/^(Hoy|Pendiente)$/.test(label)) a.querySelectorAll('span svg').forEach(s => s.remove());
      if (nextUp || (d <= lastDay() && !opened)) a.querySelector('img').classList.add('a-sway');
      // lienzo: la casa ya no es un botón; solo la abierta deja ver su premio
      a.setAttribute('aria-label', opened ? `Ruleta sorpresa de la semana ${i + 1}: ya la abriste. Ver tu premio` : `Ruleta sorpresa de la semana ${i + 1}: aparece al iniciar el día ${d}`);
      if (opened) on(root, a, () => go(S.ruletas[d] === 'cuarto' ? 'premioCuarto' : 'ruletaPremio', { premio: S.ruletas[d], day: d, from: 'mapa' }, 'modal'));
      else if (d <= lastDay() && S.ruletaPendiente[d] && S.hoy > 0) { a.setAttribute('aria-label', `Ruleta de la semana ${i + 1}: la dejaste para después. Girar`); on(root, a, () => go('ruletaPop', { day: d, from: 'mapa' }, 'modal')); }
      else { a.removeAttribute('href'); a.dataset.bound = '1'; a.setAttribute('role', 'img'); a.style.cursor = 'default'; }
    });

    // Casa del día 0
    const zeroBlock = [...root.children].find(el => /Día 0/.test(el.textContent || ''));
    if (zeroBlock) on(root, zeroBlock, () => {
      if (S.hoy === 0 && !isDone(0)) startDay(0);
      else toast('Día 0 · ¿Qué es el Adviento?', 'El punto de partida del camino');
    });

    // 5) Cabecera fija
    const chip = layer.querySelector('[aria-label^="Día 9 de 26"]');
    if (chip) replaceText(chip, /^(\s*)9(\s*)$/, `$1${Math.max(focus, 0)}$2`);
    chip?.setAttribute('aria-label', `Día ${focus} de 26`);
    paintEnergy(layer);
    // el mapa recuerda desde dónde se entró al camino (Hoy, Teodoro, Mundos o la espera)
    if (params.from) mapOrigin = params.from;
    const volver = on(layer, 'Volver a Mundos', leaveMap);
    volver?.setAttribute('aria-label', 'Atrás');
    const bat = layer.querySelector('[aria-label^="Energía de Teodoro"]');
    if (bat) on(layer, bat, () => showEnergy(layer));
    const backHoy = layer.querySelector('[aria-label="Volver a hoy"]');
    if (backHoy) {
      // píldora flotante encima de la hoja: aparece cuando tu día sale de la vista
      replaceText(backHoy, /Hoy · día \d+/, `Tu día ${focus}`);
      layer.appendChild(backHoy);
      backHoy.classList.add('back-hoy');
      backHoy.querySelectorAll('svg').forEach(s => s.remove());
      const arrow = document.createElement('span'); arrow.className = 'bh-arrow'; arrow.setAttribute('aria-hidden', 'true'); backHoy.prepend(arrow);
      on(layer, backHoy, () => scrollToNode(focus, true));
      const sync = () => {
        const t = nodes[focus]; if (!t) return;
        const y = parseFloat(t.el.style.top) - scroller.scrollTop;
        const sh = layer.querySelector('[data-sheet]');
        const limit = sh ? sh.getBoundingClientRect().top - layer.getBoundingClientRect().top : 700;
        const out = y < 60 || y + 40 > limit;
        backHoy.classList.toggle('on', out);
        arrow.textContent = y < 60 ? '↑' : '↓';
        backHoy.style.top = Math.max(110, limit - 58) + 'px';
      };
      scroller.addEventListener('scroll', sync, { passive: true });
      layer._syncBackHoy = sync;
    }

    // 6) Hoja inferior según el estado del día
    paintSheet(layer, T);
    sheetDrag(layer);
    seen('S-03-Mapa');
    if (act != null && contentDone(act) && !isDone(act)) seen('S-03b-Mapa-trivia');
    if (focus === 0) seen('V2-Mapa-dia0-claro');
    if (focus >= 24) seen('V2-Mapa-d24-claro');

    const scrollToNode = (n, smooth) => {
      const t = nodes[n]; if (!t) { scroller.scrollTop = scroller.scrollHeight; return; }
      // el día queda a la vista, por encima de la hoja (mida lo que mida)
      const sh = layer.querySelector('[data-sheet]');
      const sheetTop = sh ? 844 - 10 - sh.offsetHeight : 600; // sin contar la animación de entrada de la hoja
      const top = parseFloat(t.el.style.top) - Math.max(170, sheetTop - 150);
      scroller.scrollTo({ top, behavior: smooth && !reduced() ? 'smooth' : 'auto' });
    };
    if (focus < 1) scroller.scrollTop = scroller.scrollHeight; else scrollToNode(S.pasoAnimado || focus, false);

    // 7) Animación: Teodoro avanza al siguiente día
    if (S.pasoAnimado && !reduced()) {
      const from = S.pasoAnimado; S.pasoAnimado = null; save();
      await wait(450);
      const n = nodes[from];
      if (n && isDone(from)) {
        restyle(n.el, T.done, n.p, 64);
        n.el.innerHTML = T.doneInner.replace(/>\d+</, `>${from}<`) + (T.badges[stars(from)] || '');
        delete n.el.dataset.today;
        n.el.classList.add('a-pop');
      } else if (n) {
        // solo vio la historia: queda con la trivia pendiente y 0 estrellas
        restyle(n.el, T.done, n.p, 64);
        n.el.innerHTML = T.doneInner.replace(/>\d+</, `>${from}<`) + (T.badges[0] || '');
        delete n.el.dataset.today;
        n.el.classList.add('a-pop');
        n.el.classList.add('a-pop');
      }
      const to = act ?? null;
      if (to == null && nodes[from + 1] && teo && S.hoy < 26) {
        await wait(300);
        const a = { x: parseFloat(teo.style.left), y: parseFloat(teo.style.top) };
        place(from + 1);
        const b = { x: parseFloat(teo.style.left), y: parseFloat(teo.style.top) };
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        teo.style.left = mid.x + 'px'; teo.style.top = mid.y + 'px';
        teo.classList.remove('a-bob');
        const dx = a.x - mid.x, dy = a.y - mid.y;
        teo.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 900, easing: 'cubic-bezier(.65,0,.35,1)' });
        await teo.animate([{ translate: '0 0' }, { translate: '0 -14px', offset: .25 }, { translate: '0 0', offset: .5 }, { translate: '0 -10px', offset: .75 }, { translate: '0 0' }], { duration: 900 }).finished;
        teo.animate([{ scale: '1' }, { scale: '1.06 .94' }, { scale: '1' }], { duration: 220, easing: 'cubic-bezier(.23,1,.32,1)' });
        teo.classList.add('a-bob');
      }
      if (to && nodes[to] && teo) {
        await wait(350);
        const a = { x: parseFloat(teo.style.left), y: parseFloat(teo.style.top) };
        place(to);
        const b = { x: parseFloat(teo.style.left), y: parseFloat(teo.style.top) };
        teo.classList.remove('a-bob');
        scrollToNode(to, true);
        const dx = a.x - b.x, dy = a.y - b.y;
        teo.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 1100, easing: 'cubic-bezier(.65,0,.35,1)' });
        await teo.animate([{ translate: '0 0' }, { translate: '0 -16px', offset: .25 }, { translate: '0 0', offset: .5 }, { translate: '0 -12px', offset: .75 }, { translate: '0 0' }], { duration: 1100 }).finished;
        teo.animate([{ scale: '1' }, { scale: '1.06 .94' }, { scale: '1' }], { duration: 220, easing: 'cubic-bezier(.23,1,.32,1)' });
        teo.classList.add('a-bob');
        nodes[to].el.classList.add('a-pop');
      }
      if (params.thenCerrado && activeDay() == null && S.hoy < 27) { await wait(600); if (layer.isConnected) go('cerrado', {}, 'sheet'); }
    } else if (params.thenCerrado && activeDay() == null && S.hoy < 27) {
      await wait(700); if (layer.isConnected) go('cerrado', {}, 'sheet');
    }

    // anillo que respira en el día de hoy
    const todayEl = root.querySelector('[data-today]');
    if (todayEl) { const ring = document.createElement('span'); ring.className = 'a-pulse'; ring.style.cssText = 'position:absolute;inset:-5px;border-radius:50%;pointer-events:none'; todayEl.appendChild(ring); }
  },
});

function tapNode(n, el, layer) {
  const act = activeDay();
  const d = DAYS[n];
  if (n === act || n === walkDay()) { startDay(n); return; }
  if (isDone(n)) { showPast(layer, n, el); return; }
  if (n <= lastDay()) {
    // si ya vio las historias de los días anteriores, puede seguir con esta (la trivia queda pendiente)
    const libre = Array.from({ length: n - 1 }, (_, i) => i + 1).every(contentDone);
    if (libre) { startDay(n); return; }
    const falta = Array.from({ length: n - 1 }, (_, i) => i + 1).find(d => !contentDone(d));
    animate(el, 'a-shake'); toast(`Primero la historia del día ${falta}`, `El día ${n} te espera justo después`); return;
  }
  showBubble(layer, n, el);
}

/** Día cerrado: globo «Se abre el 9 de diciembre» encima del nodo (lienzo 03d). */
function showBubble(layer, n, el) {
  const T = tpl; const root = el.parentElement;
  root.querySelectorAll('[data-bubble]').forEach(x => x.remove());
  const f = dateOf(n);
  const t = document.createElement('template'); t.innerHTML = T.bubble + (T.bubbleArrow || '');
  const [b, arrow] = t.content.children;
  b.dataset.bubble = '1'; if (arrow) arrow.dataset.bubble = '1';
  const strong = b.querySelector('span'); if (strong) strong.textContent = `${f.dd} de ${f.mes.toLowerCase()}`;
  b.setAttribute('aria-label', `Día ${n}: se abre el ${f.dd} de ${f.mes.toLowerCase()}`);
  root.append(b); if (arrow) root.append(arrow);
  const size = parseFloat(el.style.width) || 64, cx = parseFloat(el.style.left) + size / 2, top = parseFloat(el.style.top);
  b.style.left = Math.max(12, Math.min(390 - 12 - b.offsetWidth, cx - b.offsetWidth / 2)) + 'px';
  b.style.top = (top - 64) + 'px';
  if (arrow) { arrow.style.left = (cx - 11) + 'px'; arrow.style.top = (top - 18) + 'px'; }
  [b, arrow].forEach(x => x && x.animate([{ opacity: 0, transform: 'translateY(6px) scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.2,.9,.3,1.2)' }));
  animate(el, 'a-shake');
  seen('S-03d-Mapa-dia-cerrado');
  clearTimeout(showBubble.t);
  showBubble.t = setTimeout(() => [b, arrow].forEach(x => x?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards' }).finished.then(() => x.remove())), 2600);
}

const ENERGY_TITLE = ['Teodoro se quedó dormido', 'Teodoro se está durmiendo', 'Teodoro está cansadito', 'Teodoro está tranquilo', 'Teodoro está travieso y con ganas', 'Teodoro está feliz y con ganas'];
/** Tocar la batería: cómo está Teodoro (lienzo 03e). */
function showEnergy(layer) {
  const T = tpl; if (!T?.energySheet) return;
  const old = layer.querySelector('[data-sheet]');
  const t = document.createElement('template'); t.innerHTML = T.energySheet;
  const sheet = t.content.firstElementChild; sheet.dataset.sheet = '1';
  old.replaceWith(sheet);
  layer.dataset.past = 'energia';
  const title = [...sheet.querySelectorAll('div')].find(x => x.childElementCount === 0 && /Teodoro está/.test(x.textContent));
  if (title) title.textContent = ENERGY_TITLE[S.bateria];
  const imgs = sheet.querySelectorAll('img');
  if (imgs[0]) { imgs[0].src = teodoroImg(); imgs[0].classList.add('a-bob'); }
  paintEnergy(sheet);
  [...sheet.querySelectorAll('div')].filter(x => x.childElementCount === 0 && /le dan energía|energía/.test(x.textContent) && x.textContent.length > 30)
    .forEach(x => { x.textContent = 'Cada día que caminan juntos lo llena. Si pasan días sin caminar, se cansa.'; });
  const cta = [...sheet.querySelectorAll('a')].pop();
  const act = walkDay();
  if (act != null && cta) { const lbl = ctaLabel(act); const tn = [...cta.querySelectorAll('*'), cta].flatMap(e => [...e.childNodes]).find(c => c.nodeType === 3 && c.nodeValue.trim()); if (tn) tn.nodeValue = lbl.text; on(layer, cta, lbl.go); }
  else on(layer, cta, () => go('mapa', {}, 'none', { replace: true }));
  sheet.classList.add('in-up');
  seen('S-03e-Mapa-energia');
}

/** Lo que se ve al tocar un día ya hecho (lienzo: «Mapa · tocar un día ya hecho»). */
function showPast(layer, n, el) {
  const T = tpl; if (!T?.pastSheet) return;
  const d = DAYS[n];
  layer.querySelectorAll('[data-sel]').forEach(x => { x.style.boxShadow = x.dataset.sel; delete x.dataset.sel; });
  el.dataset.sel = el.style.boxShadow; el.style.boxShadow = T.selShadow; animate(el, 'a-pop');
  const sc = layer.firstElementChild; if (sc) sc.scrollTo({ top: parseFloat(el.style.top) - 330, behavior: reduced() ? 'auto' : 'smooth' });
  layer.dataset.past = n;
  const old = layer.querySelector('[data-sheet]');
  const t = document.createElement('template'); t.innerHTML = T.pastSheet;
  const sheet = t.content.firstElementChild; sheet.dataset.sheet = '1';
  old.replaceWith(sheet);
  const head = [...sheet.children].find(x => /YA LO HICISTE/.test(x.textContent));
  head.children[0].textContent = `YA LO HICISTE · DÍA ${n}`;
  head.children[1].textContent = d.type === 'domingo' ? `Domingo · ${d.vela}.ª velita` : d.title;
  const [r1, r2] = [...sheet.children].filter(x => x.style.height === '58px');
  const C = contOf(d.type);
  const ic = iconOf(n, dark()); if (ic) r1.querySelector('img').src = A(ic);
  const [t1, s1] = r1.querySelector(':scope > div').children; t1.textContent = C[0]; s1.textContent = C[1];
  on(layer, r1.querySelector('a'), () => go(d.type === 'reto' ? 'hub' : 'reproductor', { day: n, replay: true }, 'up'));
  const st = stars(n);
  r2.querySelectorAll('[role=img] svg path').forEach((p, i) => p.setAttribute('fill', i < st ? '#F7C948' : (dark() ? 'rgba(255,255,255,.28)' : '#D3DDE5')));
  r2.querySelector('[role=img]')?.setAttribute('aria-label', `${st} de 3 estrellas`);
  const s2 = r2.querySelector(':scope > div').children[1]; s2.textContent = st === 3 ? '¡Ya tienes las 3 estrellas!' : `+${RULES.panes.trivia} panes si mejoras tus estrellas`;
  if (t1.textContent.trim() === head.children[1].textContent.trim()) t1.textContent = C[0] === d.title ? 'Actividad' : C[0];
  const cta = [...sheet.children].find(x => x.tagName === 'A');
  on(layer, cta, () => go('trivia', { day: n, i: 0, ok: 0, replay: true }, 'push'));
  sheet.classList.add('in-up');
  seen('S-03c-Mapa-dia-pasado');
}
export function contOf(type) {
  return {
    meditacion: ['Historia', 'Ya la viste', 'la historia'], cuento: ['Historia', 'Ya la viste', 'la historia'], amigos: ['Historia', 'Ya la viste', 'la historia'],
    intro: ['Historia', 'Ya la viste', 'la historia'], domingo: ['Evangelio', 'Ya lo escuchaste', 'el Evangelio'], cancion: ['Canción', 'Ya la cantaste', 'la canción'],
    reto: ['Reto en familia', 'Ya lo hicieron', 'el reto'], juego: ['Juego con Teodoro', 'Ya jugaste', 'el juego'], video: ['Video', 'Ya lo viste', 'el video'],
    nochebuena: ['Actividad final', 'Ya llegaste', 'la actividad'],
  }[type];
}

function paintSheet(layer, T) {
  let sheet = [...layer.children].find(el => el.style.bottom === '10px');
  if (!sheet) return;
  sheet.dataset.sheet = '1';
  const act = walkDay();
  if (act === 26 && !contentDone(26) && T.sheet26) {
    const t = document.createElement('template'); t.innerHTML = T.sheet26;
    const s26 = t.content.firstElementChild; s26.dataset.sheet = '1'; sheet.replaceWith(s26); sheet = s26;
    replaceText(sheet, /¡Llegamos a Belén!/, 'Hoy nace Jesús');
    const a = sheet.querySelector('a'); if (a) on(layer, a, () => startDay(26));
    sheet.classList.add('in-up');
    return;
  }
  const n = act ?? Math.min(lastDay(), 26);
  const d = DAYS[n];
  const head = [...sheet.children].find(el => /HOY · DÍA/.test(el.textContent));
  const rows = [...sheet.children].filter(el => el.style.height === '58px');
  const cta = sheet.querySelector('a');
  rows.forEach(r => r.remove());

  let kicker = `HOY · DÍA ${n}`;
  if (act != null && act < lastDay()) kicker = `TE ESPERA · DÍA ${n}`;
  if (act == null) kicker = S.hoy >= 27 ? 'CAMINO TERMINADO' : `DÍA ${n} · LISTO`;
  if (n === 0) kicker = 'DÍA 0 · ANTES DE SALIR';
  if (head) {
    head.children[0].textContent = kicker;
    head.children[1].textContent = n === 0 ? '¿Qué es el Adviento?' : d.title;
  }

  const build = (on, title, sub, badge, icon) => {
    const t = document.createElement('template');
    t.innerHTML = on ? T.rowOn : T.rowOff;
    const r = t.content.firstElementChild;
    if (icon) { const im = r.querySelector('img'); if (im) im.src = icon; }
    const [tt, st] = r.querySelector(':scope > div').children;
    tt.textContent = title; st.textContent = sub;
    const b = r.lastElementChild;
    if (badge === 'lock') r.dataset.lock = '1';
    if (badge === 'ok') {
      r.style.opacity = '1'; r.style.boxShadow = 'none';
      b.outerHTML = T.doneBadge;
    } else if (badge === 'stars') {
      r.style.opacity = '1'; r.style.boxShadow = 'none';
      const s = stars(n);
      b.outerHTML = `<span aria-label="${s} de 3 estrellas" style="flex:none;display:flex;gap:1px;font-size:17px;line-height:1;color:#F5C33B">${'★'.repeat(s)}<span style="color:${dark() ? 'rgba(255,255,255,.25)' : '#C9D6DF'}">${'★'.repeat(3 - s)}</span></span>`;
    }
    return r;
  };
  const CONT = contOf(d.type);
  const ty = TYPES[d.type];
  const rowIcon = iconOf(n, dark()) ? A(iconOf(n, dark())) : null;
  const list = [];
  list.push(build(!contentDone(n), CONT[0], contentDone(n) ? CONT[1] : `${ty.min} min`, contentDone(n) ? 'ok' : 'now', rowIcon));
  const ruletaHoy = RULES.ruleta.includes(n) && !S.ruletas[n] && !contentDone(n) && T.ruletaRow;
  if (ruletaHoy) {
    const t = document.createElement('template'); t.innerHTML = T.ruletaRow;
    list.push(t.content.firstElementChild);
    seen('S-03f-Mapa-dia11');
  } else if (n !== 0 && n !== 26) {
    const trivOn = contentDone(n) && !isDone(n);
    list.push(build(trivOn, 'Trivia', isDone(n) ? 'Ya la jugaste' : contentDone(n) ? 'Gana hasta 3 estrellas' : `Se abre al terminar ${CONT[2]}`, isDone(n) ? 'stars' : trivOn ? 'now' : 'lock', T.trivIcon));
    const sorp = RULES.sorpresa[n];
    if (sorp && isDone(n) && S.sorpresas[n] !== 'hecha') list.push(build(true, '¡Hoy hay sorpresa!', `Hoy toca ${SORPRESA_NOMBRE[sorp]}`, 'now', A(IMG.regalo)));
  }
  list.forEach(r => cta.before(r));
  list.filter(r => r.dataset.lock).forEach(r => {
    r.style.cursor = 'pointer'; r.setAttribute('role', 'button');
    on(layer, r, () => S.plan === 'free' ? go('free', { back: 'mapa' }, 'page')
      : (animate(r, 'a-shake'), toast(`Primero ${CONT[2]}`, 'La trivia se abre al terminarla')));
  });
  if (list.length > 2) { sheet.style.height = 'auto'; }

  // Botón principal
  const label = ctaLabel(n);
  const txt = [...cta.childNodes].find(c => c.nodeType === 3 && c.nodeValue.trim());
  if (txt) txt.nodeValue = label.text;
  const icon = cta.querySelector('svg');
  if (icon && !label.play) icon.style.display = 'none';
  on(layer, cta, label.go);
  // trivias que quedaron pendientes al seguir con las historias: a un toque
  const trivAct = activeDay();
  const pendTriv = Array.from({ length: Math.min(lastDay(), 26) }, (_, i) => i + 1).filter(d => contentDone(d) && !isDone(d) && d !== n);
  const addAlt = (txt, fn) => { const alt = document.createElement('button'); alt.type = 'button'; alt.className = 'sheet-alt'; alt.textContent = txt; cta.after(alt); on(layer, alt, fn); };
  if (n > 0 && pendTriv.length) addAlt(pendTriv.length === 1 ? `Jugar la trivia del día ${pendTriv[0]}` : `Tienes ${pendTriv.length} trivias pendientes · empezar por el día ${pendTriv[0]}`, () => startDay(pendTriv[0]));
  // día 0 visto: volver al inicio sin buscar la flecha
  if (n === 0 && contentDone(0)) addAlt('Volver al inicio', () => back(mapOrigin || 'hoy', 'back'));
  sheet.style.height = 'auto';
  sheet.classList.add('in-up');
}
/** La rayita de la hoja funciona: arrastra hacia abajo para ver el mapa, hacia arriba (o toca) para abrirla. */
function sheetDrag(layer) {
  layer.querySelectorAll('[data-sheet]').forEach(s => { s.style.zIndex = '30'; });
  let y0 = null, dy = 0, sheet = null, collapsed = false, max = 0;
  const peek = 118;
  const set = (v, anim) => { sheet.classList.remove('in-up'); sheet.style.animation = 'none'; sheet.style.transition = anim ? 'transform .34s cubic-bezier(.32,.72,0,1)' : 'none'; sheet.style.transform = v ? `translateY(${v}px)` : ''; sheet.querySelector('.sheet-min')?.setAttribute('aria-expanded', String(!v)); };
  // botón para minimizar / abrir (además de arrastrar la rayita)
  const addMin = s => {
    if (!s || s.querySelector('.sheet-min')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'sheet-min'; b.dataset.bound = '1'; b.setAttribute('aria-label', 'Minimizar'); b.setAttribute('aria-expanded', 'true');
    b.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
    s.appendChild(b);
    b.addEventListener('click', ev => { ev.stopPropagation(); sheet = s; max = s.offsetHeight - peek; collapsed = !collapsed; set(collapsed ? max : 0, true); b.setAttribute('aria-label', collapsed ? 'Abrir' : 'Minimizar'); after(); });
    b.addEventListener('pointerdown', ev => ev.stopPropagation());
  };
  addMin(layer.querySelector('[data-sheet]'));
  new MutationObserver(() => { const s = layer.querySelector('[data-sheet]'); if (s) { s.style.zIndex = '30'; addMin(s); collapsed = false; } }).observe(layer, { childList: true });
  const after = () => setTimeout(() => layer._syncBackHoy?.(), 360);
  layer.addEventListener('pointerdown', ev => {
    sheet = ev.target.closest('[data-sheet]'); if (!sheet) return;
    const top = sheet.getBoundingClientRect().top;
    const scale = sheet.getBoundingClientRect().height / sheet.offsetHeight || 1;
    if ((ev.clientY - top) / scale > 56 && !collapsed) { sheet = null; return; } // solo desde la parte de arriba
    y0 = ev.clientY; dy = 0; max = sheet.offsetHeight - peek; sheet.setPointerCapture?.(ev.pointerId);
  });
  layer.addEventListener('pointermove', ev => {
    if (y0 == null || !sheet) return;
    const scale = sheet.getBoundingClientRect().height / sheet.offsetHeight || 1;
    dy = (ev.clientY - y0) / scale;
    const base = collapsed ? max : 0;
    set(Math.min(max, Math.max(0, base + dy)), false);
  });
  const end = () => {
    if (y0 == null || !sheet) return;
    y0 = null;
    if (Math.abs(dy) < 6) { if (collapsed) { collapsed = false; set(0, true); after(); } return; } // un toque en la hoja recogida la abre
    collapsed = collapsed ? dy < -40 ? false : true : dy > 60;
    set(collapsed ? max : 0, true); after();
    sheet.setAttribute('aria-expanded', String(!collapsed));
  };
  layer.addEventListener('pointerup', end); layer.addEventListener('pointercancel', end);
}
function leaveMap() { back(mapOrigin || 'hoy', 'back'); }
