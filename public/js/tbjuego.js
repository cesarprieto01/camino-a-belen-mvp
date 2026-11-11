// TheoBox en juego (propuesta 11-nov-2026, artefacto «TheoBox en juego»): que los niños vean, sin salir del camino, que si completan
// cada día pueden ganar una TheoBox. Se prende y apaga en el panel (S.tbJuego) y se elige el mercado (S.mercado):
//  · USA: una TheoBox en cada ruleta (días 4, 11, 18 y 24) para quien llega con la semana completa. Una por familia.
//  · LATAM: una sola, en un sorteo al cerrar el camino, para quien completa las 4 semanas.
// Piezas: la insignia del mapa y su panel (crece desde ella), la web dentro de la app («Conócela»), la TheoBox dibujada en las
// ruletas y en Belén, la lámina del inicio (carrusel de Hoy y card deslizable del tab Teodoro) y la card «Para papás» bajo el premio.
// Regla de la barra (cualquier orden): cada tramo es un día fijo (USA) o una semana (LATAM); se llena cuando ese día está hecho,
// a tiempo o recuperado; solo cuenta al girar (o al cierre del sorteo). Quién gana lo decide el servidor; aquí no hay azar.
import { S, go, toast, nota, dark, reduced, fase, contentDone, puedeDia } from './core.js';
import { RULES } from './data.js';

const IMG = { real: 'assets/theobox/juego/real.webp', sola: 'assets/theobox/juego/sola.webp', dibujada: 'assets/theobox/juego/dibujada.webp', coloca: 'assets/theobox/juego/coloca.webp', escenaDia: 'assets/theobox/juego/escena-dia.webp' };
// Escena de las láminas: de día, Teodoro escucha la TheoBox (aprobada por César el 11-nov; ya trae la TheoBox). De noche, mientras se
// aprueba su versión, la escena aprobada de Teodoro saltando con la TheoBox real encima (sobre = true).
const escena = () => (dark() ? { src: 'assets/pila/reactivado-noche.webp', alt: 'Teodoro salta de alegría junto a la TheoBox', sobre: true }
  : { src: IMG.escenaDia, alt: 'Teodoro escucha la TheoBox y se balancea con la música', sobre: false });
// Cierre del sorteo de LATAM: día 26 (Belén, 24 dic). Decisión pendiente de César: el 6 de enero (día 39, fin del camino).
const SORTEO = 26;
const SEMANAS = [[1, 7], [8, 14], [15, 21], [22, 26]];
const FLECHA = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const CANDADO = '<svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';

export const mercado = () => (S.mercado === 'latam' ? 'latam' : 'usa');

/** La ruleta de esta semana (USA): la primera sin girar cuya siguiente aún no se abre (cada ruleta cierra cuando llega la siguiente). */
export function ruletaActual() {
  const R = RULES.ruleta;
  for (let i = 0; i < R.length; i++) {
    const d = R[i];
    if (S.ruletas[d]) continue;
    if (R[i + 1] && S.hoy >= R[i + 1]) continue;
    return { i, d, desde: i ? R[i - 1] + 1 : 1 };
  }
  return null;
}

/** ¿Se muestra? Prendido, inscrito, en el camino, sin haber ganado ya una TheoBox y con algo por delante. */
export function juegoActivo() {
  if (!S.tbJuego || !S.inscrito || S.theobox === 'mia' || fase() !== 'camino') return false;
  return mercado() === 'usa' ? !!ruletaActual() : S.hoy <= SORTEO;
}

/** USA: ¿la semana de la ruleta del día d está completa? (lo que el servidor mira al girar). */
export function semanaCompleta(d) {
  const R = RULES.ruleta, i = R.indexOf(d);
  if (i < 0) return false;
  for (let n = i ? R[i - 1] + 1 : 1; n <= d; n++) if (!contentDone(n)) return false;
  return true;
}

/** Tramos de la barra y conteos. Estado de cada tramo: '' (hecho o por venir, según su relleno), 'a' (hoy), 'r' (día pasado sin hacer). */
export function progreso() {
  const hoy = S.hoy;
  if (mercado() === 'usa') {
    const r = ruletaActual();
    if (!r) return null;
    const dias = [];
    for (let n = r.desde; n <= r.d; n++) dias.push(n);
    const tramos = dias.map(n => ({ cls: contentDone(n) ? '' : n === hoy ? 'a' : n < hoy ? 'r' : '', pct: contentDone(n) ? 100 : 0 }));
    const hechos = dias.filter(contentDone).length;
    return { usa: true, r, tramos, hechos, total: dias.length, faltan: dias.filter(n => n < hoy && !contentDone(n) && puedeDia(n)), falta: r.d - hoy, completa: hechos === dias.length };
  }
  const tramos = SEMANAS.map(([a, z]) => {
    let h = 0, rec = false;
    for (let d = a; d <= z; d++) { if (contentDone(d)) h++; else if (d < hoy) rec = true; }
    return { cls: hoy >= a && hoy <= z ? 'a' : rec ? 'r' : '', pct: h / (z - a + 1) * 100 };
  });
  let hechos = 0;
  const faltan = [];
  for (let d = 1; d <= 26; d++) { if (contentDone(d)) hechos++; else if (d < Math.min(hoy, 27) && puedeDia(d)) faltan.push(d); }
  return { usa: false, tramos, hechos, total: 26, faltan, falta: SORTEO - hoy, semana: SEMANAS.findIndex(([a, z]) => hoy >= a && hoy <= z) + 1, completa: hechos === 26 };
}

/** Copys (redactor experto, 11-nov): la oportunidad en el titular; «podrías» porque es un sorteo; nada de «racha». */
export function textos(p = progreso()) {
  if (!p) return null;
  const nombra = l => (l.length === 1 ? `Recupera el día ${l[0]}` : `Recupera los días ${l[0]} y ${l[1]}`);
  const recupera = p.completa || !p.faltan.length ? '' : p.faltan.length <= 2 ? nombra(p.faltan) : p.usa ? `Recupera ${p.faltan.length} días` : 'Aún puedes ponerte al día';
  const que = p.usa ? 'Ruleta' : 'Sorteo';
  const pendiente = p.usa && p.falta < 0 && !contentDone(p.r.d); // pasó el día de la ruleta y aún no ve su cuento
  const ojo = pendiente ? `Termina el día ${p.r.d}` : p.falta > 1 ? `${que} en ${p.falta} días` : p.falta === 1 ? `${que} mañana` : p.falta === 0 ? `${que} hoy` : 'Ruleta abierta';
  const ins = pendiente ? `Día ${p.r.d}` : p.falta > 1 ? `En ${p.falta} días` : p.falta === 1 ? 'Mañana' : p.usa ? 'Gira hoy' : 'Sorteo hoy';
  const cab = p.completa ? (p.usa ? `${p.total} de ${p.total} · ¡Ya giras por la TheoBox!` : '26 de 26 · ¡Ya participas por la TheoBox!')
    : recupera ? `${p.hechos} de ${p.total} · ${recupera}` : `${p.hechos} de ${p.total} días`;
  return {
    ojo, ins, cab, recupera,
    semana: p.usa || recupera ? '' : `Semana ${p.semana} de 4`,
    art: p.usa ? 'una' : 'la',
    regla: p.usa ? 'Completa la semana para girar por la TheoBox' : 'Completa las 4 semanas para participar',
    una: p.usa ? 'Muchos giran, solo uno gana la TheoBox' : 'Muchos participan, solo uno gana',
    lector: p.usa ? `Llevas ${p.hechos} de ${p.total} días de la semana. Al completarla, giras la ruleta y podrías ganar una TheoBox.`
      : `Llevas ${p.hechos} de 26 días del camino, en la semana ${p.semana} de 4. Al completar las 4 semanas, entras al sorteo de la TheoBox.`,
  };
}

const el = (tag, cls, html = '') => { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; };
/** Marca botones y enlaces como conectados: así el MVP no los trata como «sin diseño». */
const atar = n => { [n, ...n.querySelectorAll('a, button')].forEach(x => { x.dataset.bound = '1'; }); return n; };

/** La web de la TheoBox dentro de la app (simulada, como en el carrusel «Meet TheoBox»). No cierra lo que haya debajo. */
export function abrirWeb(layer) {
  let web = layer.querySelector(':scope > .tbj-web'), velo = layer.querySelector(':scope > .tbj-velo');
  if (!web) {
    velo = el('div', 'tbj-velo'); velo.hidden = true;
    web = el('div', 'tbj-web', `<div class="tbj-web-barra"><button type="button" class="tbj-web-listo">Listo</button><span>audiobox.theopray.com</span><span></span></div>
      <div class="tbj-web-cuerpo"><img src="${IMG.coloca}" alt="Un niño coloca la figura de Jesús sobre la TheoBox"><div class="tbj-web-in"><small>TheoBox</small><h4>Coloca un Theoling y empieza su historia</h4><p>9 figuras de la Biblia para escuchar en familia.</p></div></div>`);
    web.hidden = true; web.setAttribute('role', 'dialog'); web.setAttribute('aria-label', 'TheoBox en la web');
    layer.append(velo, atar(web));
    const cerrar = ev => {
      ev?.stopPropagation();
      const a = web.animate(reduced() ? [{ opacity: 1 }, { opacity: 0 }] : [{ transform: 'translateY(0)' }, { transform: 'translateY(100%)' }], { duration: reduced() ? 150 : 280, easing: 'cubic-bezier(.4,0,.8,.4)' });
      const v = velo.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduced() ? 150 : 280, fill: 'forwards' });
      a.onfinish = () => { web.hidden = true; velo.hidden = true; v.cancel(); listo.removeAttribute('data-dismiss'); };
    };
    const listo = web.querySelector('.tbj-web-listo');
    listo.addEventListener('click', cerrar);
    web.addEventListener('click', ev => ev.stopPropagation());
    velo.addEventListener('click', cerrar);
  }
  web.hidden = false; velo.hidden = false;
  web.querySelector('.tbj-web-listo').dataset.dismiss = '1'; // el atrás del sistema (o Escape) la cierra
  nota('Web simulada de la TheoBox', 'En la app va detrás de la verificación para padres');
  web.animate(reduced() ? [{ opacity: 0 }, { opacity: 1 }] : [{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: reduced() ? 180 : 380, easing: 'cubic-bezier(.2,.8,.2,1)' });
  velo.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
}

/** Insignia del mapa (arriba a la izquierda, bajo «Atrás») y su panel: crece desde la insignia y vuelve a ella. abrir = llega desde «Ir al camino». */
export function juegoMapa(layer, abrir = false) {
  layer.querySelectorAll(':scope > .tbj-ins, :scope > .tbj-panel').forEach(e => e.remove());
  if (!juegoActivo()) return;
  const p = progreso(), t = textos(p);
  const ins = el('button', 'tbj-ins', `<span class="tbj-luz"></span><img src="${IMG.real}" alt=""><b>${t.ins}</b>`);
  ins.type = 'button'; ins.setAttribute('aria-expanded', 'false');
  ins.setAttribute('aria-label', `TheoBox: ${p.usa ? 'ruleta' : 'sorteo'} ${t.ins.toLowerCase()}`);
  const tramos = p.tramos.map(x => `<i class="${x.cls}"><b style="width:${x.pct.toFixed(1)}%"></b></i>`).join('');
  const panel = el('div', 'tbj-panel', `
    <div class="tbj-grid">
      <div class="tbj-txt">
        <p class="tbj-ojo">${t.ojo}</p>
        <h3 class="tbj-tit">Podrías ganar ${t.art} <b>TheoBox</b></h3>
        <button type="button" class="tbj-boton">Conócela${FLECHA}</button>
      </div>
      <div class="tbj-prod"><span class="tbj-prod-luz"></span><img src="${IMG.real}" alt="TheoBox"></div>
    </div>
    <div class="tbj-dias">
      <div class="tbj-dias-cab"><b>${t.cab}</b>${t.semana ? `<span>${t.semana}</span>` : ''}</div>
      <div class="tbj-fila"><div class="tbj-tramos${p.usa ? '' : ' semanas'}" role="img" aria-label="${t.lector}">${tramos}</div>
        <span class="tbj-meta${p.completa ? ' abierta' : ''}" aria-hidden="true"><img src="${IMG.sola}" alt="">${p.completa ? '' : `<i>${CANDADO}</i>`}</span></div>
    </div>
    <p class="tbj-legal">${t.regla} · ${t.una} · <button type="button" class="tbj-bases">Bases del premio</button></p>
    <button type="button" class="tbj-recoger" aria-label="Recoger"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg></button>`);
  panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', `Podrías ganar ${t.art} TheoBox`);
  layer.append(atar(ins), atar(panel));

  let abierto = false, anim = null;
  const recoger = panel.querySelector('.tbj-recoger');
  const hacia = () => {
    const pcx = panel.offsetLeft + panel.offsetWidth / 2, pcy = panel.offsetTop + panel.offsetHeight / 2;
    const bcx = ins.offsetLeft + ins.offsetWidth / 2, bcy = ins.offsetTop + ins.offsetHeight / 2;
    return `translate(${bcx - pcx}px, ${bcy - pcy}px) scale(${ins.offsetWidth / panel.offsetWidth})`;
  };
  const abrirPanel = () => {
    if (abierto) return;
    anim?.cancel(); panel.hidden = false; abierto = true; ins.setAttribute('aria-expanded', 'true'); recoger.dataset.dismiss = '1';
    anim = panel.animate(reduced() ? [{ opacity: 0 }, { opacity: 1 }] : [{ transform: hacia(), opacity: 0, borderRadius: '80px' }, { opacity: 1, offset: 0.3 }, { transform: 'none', opacity: 1, borderRadius: '30px' }],
      { duration: reduced() ? 200 : 440, easing: 'cubic-bezier(.2,.9,.25,1)' });
  };
  const cerrarPanel = () => {
    if (!abierto) return;
    anim?.cancel(); abierto = false; ins.setAttribute('aria-expanded', 'false'); recoger.removeAttribute('data-dismiss');
    anim = panel.animate(reduced() ? [{ opacity: 1 }, { opacity: 0 }] : [{ transform: 'none', opacity: 1, borderRadius: '30px' }, { transform: hacia(), opacity: 0, borderRadius: '80px' }],
      { duration: reduced() ? 160 : 340, easing: 'cubic-bezier(.5,0,.75,0)' });
    anim.onfinish = () => { panel.hidden = true; if (!reduced()) ins.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 360, easing: 'cubic-bezier(.2,.9,.3,1)' }); };
  };
  ins.addEventListener('click', ev => { ev.stopPropagation(); abierto ? cerrarPanel() : abrirPanel(); });
  panel.addEventListener('click', ev => ev.stopPropagation());
  recoger.addEventListener('click', cerrarPanel);
  panel.querySelector('.tbj-boton').addEventListener('click', () => abrirWeb(layer));
  panel.querySelector('.tbj-bases').addEventListener('click', () => toast('Bases del premio', 'Muy pronto aquí'));
  // con el panel abierto, el primer toque en el mapa solo lo recoge
  layer.addEventListener('click', ev => {
    if (!abierto || panel.contains(ev.target) || ins.contains(ev.target) || ev.target.closest('.tbj-web, .tbj-velo')) return;
    ev.stopPropagation(); ev.preventDefault(); cerrarPanel();
  }, true);
  if (abrir) setTimeout(abrirPanel, reduced() ? 0 : 450);
}

/** USA: la TheoBox dibujada sobre la base de cada ruleta que aún no giran. Cerrada: entera, con menos color y el candado del mapa. */
export function decorarRuleta(a, d, { bloqueada, pie }) {
  if (!juegoActivo() || mercado() !== 'usa') return;
  const r = ruletaActual();
  if (!r || d < r.d) return;
  const enJuego = d === r.d && !bloqueada && semanaCompleta(d); // si no, entera pero con candado
  const x = `calc(50% ${parseFloat(a.style.left) > 195 ? '-' : '+'} 14px)`;
  a.insertAdjacentHTML('beforeend', (enJuego ? `<span class="tbj-base-luz" style="bottom:${pie ? 4 : 3}%;left:${x}"></span>` : '')
    + `<span class="tbj-caja${enJuego ? '' : ' bloq'}" style="width:${pie ? 40 : 44}%;bottom:${pie ? 8 : 7}%;left:${x}"><img src="${IMG.dibujada}" alt="">${enJuego ? '' : '<img class="tbj-candado" src="assets/candado.webp" alt="">'}</span>`);
  a.setAttribute('aria-label', `${a.getAttribute('aria-label')}. ${enJuego ? 'Podrías ganar una TheoBox' : 'TheoBox con candado: completa la semana'}`);
}

/** LATAM: la TheoBox dibujada junto al día 26 (Belén), con candado hasta completar el camino. */
export function decorarBelen(root) {
  root.querySelector(':scope > .tbj-belen')?.remove();
  if (!juegoActivo() || mercado() !== 'latam') return;
  const n = root.querySelector('[aria-label^="Día 26"]');
  if (!n) return;
  const listo = progreso()?.completa;
  const c = el('span', `tbj-caja tbj-belen${listo ? '' : ' bloq'}`, `<img src="${IMG.dibujada}" alt="">${listo ? '' : '<img class="tbj-candado" src="assets/candado.webp" alt="">'}`);
  c.style.left = `${parseFloat(n.style.left) + 114}px`; c.style.top = `${parseFloat(n.style.top) - 4}px`;
  root.appendChild(c);
}

/** Inicio: la card de la TheoBox en el carrusel de destacados de Hoy, justo después de Adviento (256 × 330). */
export function laminaHoy() {
  if (!juegoActivo()) return null;
  const t = textos(), e = escena();
  const a = el('a', 'theo-heroe-t tbj-heroe', `
    <img class="tbj-heroe-fondo" src="${e.src}" alt="${e.alt}">
    ${e.sobre ? `<span class="tbj-heroe-luz" aria-hidden="true"></span><img class="tbj-heroe-tb" src="${IMG.real}" alt="">` : ''}
    <span class="tbj-heroe-deg" aria-hidden="true"></span>
    <div class="tbj-heroe-txt"><span class="tbj-heroe-ojo">${t.ins}</span><b>Podrías ganar ${t.art} <strong>TheoBox</strong></b></div>
    <span class="tbj-heroe-boton">Ir al camino${FLECHA}</span>`);
  a.href = '#'; a.setAttribute('aria-label', `Podrías ganar ${t.art} TheoBox. ${t.ins}. Ir al camino`);
  a.addEventListener('click', ev => { ev.preventDefault(); if (a.getAttribute('aria-hidden') !== 'true') go('mapa', { theobox: true, from: 'hoy' }, 'push'); });
  return atar(a);
}

/** Tab Teodoro: la card del camino se desliza a una segunda lámina con la TheoBox (la misma card, otro contenido); puntos debajo. */
export function deslizarCamino(tCard) {
  if (!juegoActivo() || !tCard || tCard.closest('.tbj-slider')) return;
  const p = progreso(), t = textos(p);
  const l2 = tCard.cloneNode(true);
  l2.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
  atar(l2);
  // la escena de la TheoBox (ver escena()): de día ya la trae; de noche, la TheoBox real encima
  const esc = [...l2.querySelectorAll('img')].find(i => /^Teodoro/.test(i.alt || ''));
  if (esc) {
    const e = escena();
    esc.src = e.src; esc.alt = e.alt; esc.classList.remove('a-bob');
    if (e.sobre) esc.parentElement.insertAdjacentHTML('beforeend', `<span class="tbj-l2-luz" aria-hidden="true"></span><img class="tbj-l2-tb" src="${IMG.real}" alt="">`);
  }
  // sin la energía de Teodoro en esta lámina
  l2.querySelectorAll('[aria-label^="Energía de Teodoro"], img[alt^="Energía de Teodoro"]').forEach(e => e.style.setProperty('visibility', 'hidden'));
  const hojas = [...l2.querySelectorAll('*')].filter(e => !e.children.length);
  hojas.forEach(e => {
    const v = e.textContent.trim();
    if (v === 'Adviento') e.textContent = `Podrías ganar ${t.art} TheoBox`;
    else if (/^Día \d+ de 26$/.test(v)) e.textContent = t.ins;
    else if (/aventura|Ver el camino|juego sorpresa|Unirme/i.test(v)) e.textContent = 'Ir al camino';
  });
  // la barra: la misma, con lo hecho esta semana (o en el camino) y la TheoBox al final en vez de la estrella
  const pct = p.hechos / p.total * 100;
  const prog = l2.querySelector('[role=img][aria-label^="Día "]');
  const fill = prog && ([...prog.querySelectorAll('div')].find(e => /%/.test(e.style.width)) || [...prog.querySelectorAll('div')].find(e => /gradient/.test(e.style.backgroundImage)));
  if (fill) {
    fill.style.transition = 'none'; fill.style.width = `${pct}%`;
    const head = fill.nextElementSibling;
    if (head?.style.left) { head.style.transition = 'none'; head.style.left = `clamp(0px, calc(${pct}% - 14px), calc(100% - 28px))`; }
    prog.setAttribute('aria-label', t.lector);
  }
  const estrella = [...l2.querySelectorAll('img')].find(i => i.src.includes('04b65469'));
  if (estrella) { estrella.src = IMG.real; estrella.style.filter = 'drop-shadow(0 0 6px rgba(255,214,90,.8))'; }
  l2.setAttribute('aria-label', `Podrías ganar ${t.art} TheoBox. ${t.ins}. Ir al camino`);
  l2.classList.add('tbj-l2');
  l2.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); go('mapa', { theobox: true, from: 'teodoro' }, 'push'); }, true);

  // el deslizador ocupa el lugar de la card; lo de abajo baja lo que miden los puntos
  const PUNTOS = 26;
  const wrap = el('div', 'tbj-slider-wrap');
  wrap.style.cssText = `position:absolute;left:${tCard.style.left};top:${tCard.style.top};width:${tCard.offsetWidth || parseFloat(tCard.style.width)}px;z-index:${tCard.style.zIndex || 1}`;
  const t0 = parseFloat(tCard.style.top);
  [...tCard.parentElement.children].forEach(e => { const tp = parseFloat(e.style.top); if (e !== tCard && !isNaN(tp) && tp > t0) e.style.top = `${tp + PUNTOS}px`; });
  const pa = tCard.parentElement, ph = parseFloat(pa.style.height); if (ph) pa.style.height = `${ph + PUNTOS}px`;
  const slider = el('div', 'tbj-slider');
  slider.setAttribute('role', 'region'); slider.setAttribute('aria-roledescription', 'carrusel'); slider.setAttribute('aria-label', 'Adviento y TheoBox');
  const puntos = el('div', 'tbj-puntos', '<i class="on"></i><i></i>'); puntos.setAttribute('aria-hidden', 'true');
  tCard.replaceWith(wrap);
  wrap.append(slider, puntos);
  [tCard, l2].forEach(c => { c.style.position = 'relative'; c.style.left = '0'; c.style.top = '0'; c.style.flex = '0 0 100%'; c.style.scrollSnapAlign = 'start'; });
  slider.append(tCard, l2);
  slider.addEventListener('scroll', () => requestAnimationFrame(() => {
    const i = Math.round(slider.scrollLeft / slider.clientWidth);
    puntos.querySelectorAll('i').forEach((pt, k) => pt.classList.toggle('on', k === i));
  }), { passive: true });
}

/** Bajo el premio de la ruleta (si no fue la TheoBox): una card pequeña «Para papás · Conócela» que abre la web. */
export function cardPapas(root, layer, premio) {
  if (!S.tbJuego || mercado() !== 'usa' || premio === 'theobox' || S.theobox === 'mia') return;
  const dlg = root.querySelector('[role=dialog]');
  if (!dlg || layer.querySelector('.tbj-papas')) return;
  // posición del diálogo dentro de la capa con offsets: no le afectan las animaciones de entrada
  let x = 0, y = 0, n = dlg;
  while (n && n !== layer) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
  if (n !== layer) return;
  const c = el('button', 'tbj-papas', `<span class="tbj-papas-img"><img src="${IMG.real}" alt=""></span><span class="tbj-papas-txt"><small>Para papás</small><b>Conócela${FLECHA}</b></span>`);
  c.type = 'button'; c.setAttribute('aria-label', 'Para papás: conoce la TheoBox');
  Object.assign(c.style, { left: `${x}px`, width: `${dlg.offsetWidth}px`, top: `${y + dlg.offsetHeight + 12}px` });
  c.addEventListener('click', ev => { ev.stopPropagation(); abrirWeb(layer); });
  layer.appendChild(atar(c));
  if (!reduced()) c.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 320, delay: 500, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
}

