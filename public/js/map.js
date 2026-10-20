// Mapa del camino: se pinta en vivo sobre la pantalla «Camino completo» del lienzo.
import { S, save, A, $, $$, on, frag, go, toast, seen, hueco, paintEnergy, teodoroImg, activeDay, isDone, contentDone,
  lastDay, stars, wait, reduced, animate, register, replaceText, dark } from './core.js';
import { DAYS, TYPES, RULES, IMG, dateOf, iconOf } from './data.js';
import { startDay, ctaLabel } from './flow.js';

const F = { claro: 'V2-Mapa-completo-claro', oscuro: 'V2-Mapa-completo' };
const F0 = { claro: 'V2-Mapa-dia0-claro', oscuro: 'V2-Mapa-dia0' };

let tpl = null; // piezas sacadas de las plantillas, por tema
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
  const trivSheet = [...triv.children].find(el => el.style.bottom === '10px');
  const trivRows = [...trivSheet.children].filter(el => el.style.height === '58px');
  const sheet26 = [...d26.children].find(el => el.style.bottom === '10px' || /Llegamos a Belén/.test(el.textContent || '') && el.style.position === 'absolute' && parseFloat(el.style.left) <= 20);
  const node = n => full.querySelector(`a[aria-label^="Día ${n},"]`);
  const badge = n => { const s = node(n).querySelector(':scope > span[aria-hidden]'); return s ? s.outerHTML : ''; };
  const icons = {};
  for (let n = 1; n <= 26; n++) { const i = zero.querySelector(`a[aria-label^="Día ${n},"] img`); if (i) icons[n] = i.getAttribute('src'); }
  const houses = $$(full, 'a[aria-label^="Ruleta sorpresa"]').map(a => a.innerHTML);
  const sheet = [...full.children].find(el => el.style.bottom === '10px');
  const rows = [...sheet.children].filter(el => el.style.height === '58px');
  tpl = {
    key,
    done: node(1).getAttribute('style'),
    doneInner: [...node(1).childNodes].filter(c => !(c.tagName === 'SPAN' && c.getAttribute('aria-hidden'))).map(c => c.outerHTML || '').join(''),
    badges: { 3: badge(1), 2: badge(2), 1: badge(4) },
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
    const act = activeDay();
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
    const extra = document.createElement('div'); extra.style.height = '230px'; extra.style.background = root.style.background ? 'transparent' : '';
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
      teo.style.left = (cx - 25) + 'px'; teo.style.top = (cy - 24) + 'px';
    };
    if (teo) {
      teo.src = teodoroImg();
      teo.style.width = '50px'; teo.style.height = '96px';
      teo.classList.add('a-bob');
      if (focus >= 1) place(S.pasoAnimado || focus); else teo.style.display = 'none';
    }
    if (bubble) {
      const nx = (act ?? focus) + 1;
      if (nodes[nx]) {
        bubble.style.left = (nodes[nx].p.x + 72) + 'px'; bubble.style.top = (nodes[nx].p.y + 14) + 'px';
        replaceText(bubble, /¿Qué habrá.*\?/, nx > lastDay() ? '¿Qué habrá mañana?' : '¡Sigue el camino!');
        bubble.classList.add('a-rise');
      } else bubble.remove();
    }

    // 4) Casas de la ruleta (semanas 1–4)
    $$(root, 'a[aria-label^="Ruleta sorpresa"]').forEach((a, i) => {
      const d = RULES.ruleta[i];
      const img = a.querySelector('img').getAttribute('src');
      const opened = !!S.ruletas[d];
      const nextUp = !opened && RULES.ruleta.find(x => !S.ruletas[x]) === d;
      a.innerHTML = (opened ? T.houseOpen : nextUp ? T.houseNext : T.houseFuture).replace(/src="[^"]*"/, `src="${img}"`);
      const label = opened ? 'Abierta' : d <= lastDay() ? '¡Ábrela!' : nextUp ? (d - S.hoy === 1 ? 'Mañana' : `Faltan ${d - S.hoy} días`) : `Día ${d}`;
      replaceText(a, /Abierta|Faltan \d+ días|Día \d+/, label);
      a.setAttribute('aria-label', `Ruleta sorpresa de la semana ${i + 1}: ${label}`);
      if (nextUp || (d <= lastDay() && !opened)) a.querySelector('img').classList.add('a-sway');
      on(root, a, () => {
        if (opened) go('ruletaPremio', { premio: S.ruletas[d], day: d, from: 'mapa' }, 'modal');
        else if (d <= lastDay()) go('ruletaPop', { day: d, from: 'mapa' }, 'modal');
        else { animate(a, 'a-shake'); toast(`La ruleta de la semana ${i + 1}`, `Aparece al iniciar el día ${d}`); }
      });
    });

    // Casa del día 0
    const zeroBlock = [...root.children].find(el => /Día 0/.test(el.textContent || ''));
    if (zeroBlock) on(root, zeroBlock, () => {
      if (S.hoy === 0 && !isDone(0)) startDay(0);
      else toast('Día 0 · ¿Qué es el Adviento?', 'El punto de partida del camino');
    });

    // 5) Cabecera fija
    replaceText(layer, /^(\s*)9(\s*)$/, `$1${Math.max(focus, 0)}$2`);
    const chip = layer.querySelector('[aria-label^="Día 9 de 26"]');
    chip?.setAttribute('aria-label', `Día ${focus} de 26`);
    paintEnergy(layer);
    on(layer, 'Volver a Mundos', () => go(params.from === 'hoy' ? 'hoy' : 'mundos', {}, 'back'));
    const bat = layer.querySelector('[aria-label^="Energía de Teodoro"]');
    if (bat) on(layer, bat, () => toast(`Energía de Teodoro: ${S.bateria} de 5`, 'Sube al terminar el contenido (+2) y se llena con la trivia'));
    const backHoy = layer.querySelector('[aria-label="Volver a hoy"]');
    if (backHoy) {
      replaceText(backHoy, /Hoy · día \d+/, `Hoy · día ${focus}`);
      backHoy.style.display = 'none';
      on(layer, backHoy, () => scrollToNode(focus, true));
      scroller.addEventListener('scroll', () => {
        const t = nodes[focus]; if (!t) return;
        const y = parseFloat(t.el.style.top) - scroller.scrollTop;
        backHoy.style.display = (y < 40 || y > 520) ? 'flex' : 'none';
      }, { passive: true });
    }

    // 6) Hoja inferior según el estado del día
    paintSheet(layer, T);
    seen('S-03-Mapa');
    if (act != null && contentDone(act) && !isDone(act)) seen('S-03b-Mapa-trivia');
    if (focus === 0) seen('V2-Mapa-dia0-claro');
    if (focus >= 24) seen('V2-Mapa-d24-claro');

    const scrollToNode = (n, smooth) => {
      const t = nodes[n]; if (!t) { scroller.scrollTop = scroller.scrollHeight; return; }
      const top = parseFloat(t.el.style.top) - (t.el.dataset.today ? 416 : 426);
      scroller.scrollTo({ top, behavior: smooth && !reduced() ? 'smooth' : 'auto' });
    };
    if (focus < 1) scroller.scrollTop = scroller.scrollHeight; else scrollToNode(S.pasoAnimado || focus, false);

    // 7) Animación: Teodoro avanza al siguiente día
    if (S.pasoAnimado && !reduced()) {
      const from = S.pasoAnimado; S.pasoAnimado = null; save();
      await wait(450);
      const n = nodes[from];
      if (n) {
        restyle(n.el, T.done, n.p, 64);
        n.el.innerHTML = T.doneInner.replace(/>\d+</, `>${from}<`) + (T.badges[stars(from)] || '');
        delete n.el.dataset.today;
        n.el.classList.add('a-pop');
      }
      const to = act ?? null;
      if (to && nodes[to] && teo) {
        await wait(350);
        const a = { x: parseFloat(teo.style.left), y: parseFloat(teo.style.top) };
        place(to);
        const b = { x: parseFloat(teo.style.left), y: parseFloat(teo.style.top) };
        teo.classList.remove('a-bob');
        scrollToNode(to, true);
        const dx = a.x - b.x, dy = a.y - b.y;
        await teo.animate([
          { transform: `translate(${dx}px,${dy}px)` },
          { transform: `translate(${dx * .66}px,${dy * .66 - 18}px)`, offset: .33 },
          { transform: `translate(${dx * .33}px,${dy * .33}px)`, offset: .5 },
          { transform: `translate(${dx * .15}px,${dy * .15 - 14}px)`, offset: .75 },
          { transform: 'translate(0,0)' },
        ], { duration: 1300, easing: 'ease-in-out' }).finished;
        teo.classList.add('a-bob');
        nodes[to].el.classList.add('a-pop');
      }
      if (params.thenCerrado && activeDay() == null && S.hoy < 27) { await wait(900); go('cerrado', {}, 'up'); }
    } else if (params.thenCerrado && activeDay() == null && S.hoy < 27) {
      await wait(700); go('cerrado', {}, 'up');
    }

    // anillo que respira en el día de hoy
    const todayEl = root.querySelector('[data-today]');
    if (todayEl) { const ring = document.createElement('span'); ring.className = 'a-pulse'; ring.style.cssText = 'position:absolute;inset:-5px;border-radius:50%;pointer-events:none'; todayEl.appendChild(ring); }
  },
});

function tapNode(n, el, layer) {
  const act = activeDay();
  const d = DAYS[n];
  if (n === act) { if (layer.dataset.past) { go('mapa', {}, 'none'); return; } startDay(n); return; }
  if (isDone(n)) { showPast(layer, n, el); return; }
  if (n <= lastDay()) { animate(el, 'a-shake'); toast(`Primero el día ${act}`, `El día ${n} te espera justo después`); return; }
  animate(el, 'a-shake');
  const f = dateOf(n);
  toast(`Día ${n} · ${TYPES[d.type].label}`, `Se abre el ${f.dow.toLowerCase()} ${f.dd} de ${f.mes.toLowerCase()}`);
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
  const s2 = r2.querySelector(':scope > div').children[1]; if (st === 3) s2.textContent = '¡Ya tienes las 3 estrellas!';
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
  const act = activeDay();
  if (act === 26 && !contentDone(26) && T.sheet26) {
    const t = document.createElement('template'); t.innerHTML = T.sheet26;
    const s26 = t.content.firstElementChild; s26.dataset.sheet = '1'; sheet.replaceWith(s26); sheet = s26;
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
  if (n !== 0 && n !== 26) {
    const trivOn = contentDone(n) && !isDone(n);
    list.push(build(trivOn, 'Trivia', isDone(n) ? 'Ya la jugaste' : contentDone(n) ? 'Gana hasta 3 estrellas' : `Se abre al terminar ${CONT[2]}`, isDone(n) ? 'stars' : trivOn ? 'now' : 'lock', T.trivIcon));
    const sorp = RULES.sorpresa[n];
    if (sorp && isDone(n) && S.sorpresas[n] !== 'hecha') list.push(build(true, '¡Hoy hay sorpresa!', 'Un juego extra que da panes', 'now', A(IMG.regalo)));
  }
  list.forEach(r => cta.before(r));
  if (list.length > 2) { sheet.style.height = 'auto'; }

  // Botón principal
  const label = ctaLabel(n);
  const txt = [...cta.childNodes].find(c => c.nodeType === 3 && c.nodeValue.trim());
  if (txt) txt.nodeValue = label.text;
  const icon = cta.querySelector('svg');
  if (icon && !label.play) icon.style.display = 'none';
  on(layer, cta, label.go);
  sheet.classList.add('in-up');
}
