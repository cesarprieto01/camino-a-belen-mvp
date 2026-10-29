// Mapa del camino (diseño «Mapa Diozen» del Figma): el paisaje ilustrado va de fondo y encima se pintan en vivo los 26 días, Teodoro y las ruletas.
import { S, save, A, $, $$, on, frag, go, back, cur, clearHistory, walkDay, teoDay, toast, seen, hueco, paintEnergy, teodoroImg, activeDay, isDone, contentDone, triviaPendiente,
  lastDay, stars, wait, reduced, animate, register, replaceText, dark, fase, vistos, cuentaGracia, puedeDia } from './core.js';
import { DAYS, TYPES, RULES, IMG, PRENDAS, BATTERY_IDS, dateOf, iconOf, SORPRESA_NOMBRE, hasTrivia, pantallaDia } from './data.js';
import { startDay, ctaLabel, openSorpresa, abrirDescargable } from './flow.js';
import { bindMute } from './musica.js';

// de la pantalla del lienzo salen la cabecera, la píldora «Tu día» y la hoja; el mapa se dibuja aquí
const F = { claro: 'V2-Mapa-completo-claro', oscuro: 'V2-Mapa-completo' };
const ALTO = 3600; // alto del mapa en el Figma; el paisaje va en 6 tiras de 600
const FONDO = { claro: ['#67C7FC', '#94907F'], oscuro: ['#013880', '#607F77'] }; // color del borde de arriba y de abajo del paisaje
// centro de cada día en el mapa del Figma (390 de ancho)
const CENTRO = { 1: [142.1, 3094], 2: [224.9, 2984], 3: [151.3, 2874], 4: [220.3, 2764], 5: [142.1, 2654], 6: [197.3, 2544], 7: [218, 2434], 8: [137.5, 2329],
  9: [218, 2201], 10: [160.5, 2089], 11: [229.5, 1989], 12: [155.9, 1881], 13: [220.3, 1773], 14: [174.3, 1665], 15: [137.5, 1557], 16: [211.1, 1449],
  17: [151.3, 1341], 18: [229.5, 1233], 19: [160.5, 1125], 20: [215.7, 1017], 21: [142.1, 909], 22: [174.3, 801], 23: [206.5, 691], 24: [149, 581], 25: [218, 471], 26: [137.5, 351] };
// ruletas de los días 4, 11, 18 y 24: dibujo, caja y etiqueta (centro y arriba). Al 90 % del Figma y ancladas hacia afuera,
// lejos del sendero (los adornos del paisaje también se achicaron y apartaron)
const RULETAS = [
  { img: 'ruleta-pie', x: 269.5, y: 2525.9, w: 121.5, h: 170.1, lx: 328.9, ly: 2690.6 },
  { img: 'ruleta-dibujada', x: 281.9, y: 1771.6, w: 107.1, h: 149.4, lx: 330.9, ly: 1915.6 },
  { img: 'ruleta-pie', x: 278.5, y: 989.9, w: 121.5, h: 170.1, lx: 331.1, ly: 1160.0 },
  { img: 'ruleta-dibujada', x: -19.7, y: 336.6, w: 107.1, h: 149.4, lx: 41.9, ly: 504.9 },
];
const CHECK = '<svg class="dz-check" width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true"><path d="M6.25 15.625 11.875 21.25 23.75 9.375" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ESTRELLA = 'M7.5 1.1875 9.4125 5.25 13.8125 5.7875 10.5625 8.83125 11.4188 13.225 7.5 11.0438 3.58125 13.225 4.4375 8.83125 1.1875 5.7875 5.5875 5.25Z';
const estrella = (llena, px) => `<svg width="${px}" height="${px}" viewBox="0 0 15 15" aria-hidden="true">${llena
  ? `<path d="${ESTRELLA}" fill="#F7C948" stroke="#E0A63A" stroke-width=".56" stroke-linejoin="round"/><path d="M7.5 2.875 8.6875 5.4375 10.3125 5.625 8.25 6.3125Z" fill="#FFF3C4" opacity=".85"/>`
  : `<path d="${ESTRELLA}" class="dz-vacia"/>`}</svg>`;
// solo los días con trivia llevan estrellas; vacías = la trivia sigue abierta
const pildoraEstrellas = n => hasTrivia(n) ? `<span class="dz-estrellas">${[15, 17, 15].map((px, i) => estrella(i < stars(n), px)).join('')}</span>` : '';
const DESTELLO = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 .58 8.52 5.48 13.42 7 8.52 8.52 7 13.42 5.48 8.52.58 7 5.48 5.48Z" fill="#E9B949"/></svg>';

let tpl = null; // piezas sacadas de las plantillas, por tema
let mapOrigin = null; // pantalla desde la que se entró al camino
async function templates() {
  const key = dark() ? 'oscuro' : 'claro';
  if (tpl?.key === key) return tpl;
  const full = await frag(F[key]);
  const triv = await frag(key === 'claro' ? 'S-03b-Mapa-trivia' : 'S-03b-Mapa-trivia-oscuro');
  const d26 = await frag(key === 'claro' ? 'V2-Mapa-d24-claro' : 'V2-Mapa-oscuro');
  const past = await frag(key === 'claro' ? 'S-03c-Mapa-dia-pasado' : 'S-03c-Mapa-dia-pasado-oscuro');
  const pastSheet = [...past.children].find(el => el.style.bottom === '10px');
  const pastNode = past.querySelector('a[aria-label*="elegido"]');
  const closed = await frag(key === 'claro' ? 'S-03d-Mapa-dia-cerrado' : 'S-03d-Mapa-dia-cerrado-oscuro');
  const bubble = closed.querySelector('[role=status]');
  const energy = await frag(key === 'claro' ? 'S-03e-Mapa-energia' : 'S-03e-Mapa-energia-oscuro');
  const energySheet = [...energy.children].find(el => el.style.bottom === '10px');
  const trivSheet = [...triv.children].find(el => el.style.bottom === '10px');
  const trivRows = [...trivSheet.children].filter(el => isRow(el));
  const sheet26 = [...d26.children].find(el => el.style.bottom === '10px' || /Llegamos a Belén/.test(el.textContent || '') && el.style.position === 'absolute' && parseFloat(el.style.left) <= 20);
  const sheet = [...full.children].find(el => el.style.bottom === '10px');
  const rows = [...sheet.children].filter(el => isRow(el));
  tpl = {
    key,
    rowOn: rows[0].outerHTML, rowOff: rows[1].outerHTML, printRow: rows.find(r => r.tagName === 'A')?.outerHTML,
    doneBadge: trivRows[0].lastElementChild.outerHTML,
    otraVez: [...(pastSheet?.children || [])].find(isRow)?.querySelector('a')?.getAttribute('style'), // píldora «Ver otra vez» de un día hecho
    trivIcon: rows[1].querySelector('img')?.getAttribute('src'),
    sheet26: sheet26 ? sheet26.outerHTML : null,
    pastSheet: pastSheet?.outerHTML, selShadow: pastNode?.style.boxShadow,
    bubble: bubble?.outerHTML, bubbleArrow: bubble?.nextElementSibling?.outerHTML,
    energySheet: energySheet?.outerHTML,
  };
  return tpl;
}

/** Pinta un día en su estado: hecho (✓ y estrellas), trivia (✓ con la trivia pendiente), hoy (dorado, Teodoro encima), abierto, cerrado o recuerdo. */
function pintarDia(el, n, estado) {
  const d = DAYS[n], [cx, cy] = CENTRO[n];
  const t = n === 26 ? 104 : estado === 'hoy' ? 96 : 76;
  el.className = `dz-dia dz-${estado}${n === 26 ? ' dz-26' : ''}`;
  el.style.cssText = `left:${cx - t / 2}px;top:${cy - t / 2}px;width:${t}px;height:${t}px`;
  delete el.dataset.today;
  if (estado === 'hecho' || estado === 'trivia') {
    el.innerHTML = CHECK + `<b class="dz-num">${n}</b>` + pildoraEstrellas(n);
    el.setAttribute('aria-label', estado === 'trivia' ? `Día ${n}: cuento visto, falta la trivia`
      : `Día ${n}, ${d.title}, completado${hasTrivia(n) && stars(n) ? `, ${stars(n)} de 3 estrellas` : ''}`);
  } else if (estado === 'hoy') {
    el.innerHTML = '';
    el.dataset.today = '1';
    el.setAttribute('aria-label', `Día ${n}, hoy: ${d.title}`);
  } else {
    const ic = iconOf(n, dark());
    // lo que aún no se abre lleva candado
    el.innerHTML = (ic ? `<img class="dz-ico" src="${A(ic)}" alt="">` : '') + `<b class="dz-num">${n}</b>` + (estado === 'cerrado' ? '<img class="node-lock" src="assets/candado.webp" alt="">' : '');
    el.setAttribute('aria-label', `Día ${n}, ${d.title}${estado === 'abierto' ? ', pendiente' : estado === 'cerrado' ? ', cerrado' : ''}`);
  }
}
// filas de la hoja (el lienzo las dibuja de 52 o 58 px); el botón principal mide 56
const isRow = el => el.style.height === '52px' || el.style.height === '58px';
/** Lo que salió en la ruleta, dicho corto. */
const premioTxt = id => {
  if (id === 'panes') return `Te tocaron ${RULES.panes.ruleta} panes`;
  if (id === 'manzana') return 'Te tocó una manzana para Teodoro';
  if (id === 'cuarto') return 'Te tocó un cuarto nuevo para Teodoro';
  const p = PRENDAS.find(x => x.id === id);
  return p ? `Te tocó ${p.nombre} para Teodoro` : '¡Ya tienes tu premio!';
};

// de la pantalla del lienzo solo se quedan la cabecera, la píldora «Volver a hoy» y la hoja
const fija = el => { const s = el.style; return (s.top === '0px' && (s.height === '112px' || s.height === '50px')) || s.top === '52px' || s.bottom === '10px' || el.getAttribute('aria-label') === 'Volver a hoy'; };

register('mapa', {
  files: [F.claro, F.oscuro],
  noScroll: true,
  limpiar: root => [...root.children].filter(el => !fija(el)).forEach(el => el.remove()),
  async mount(root, params, layer) {
    const T = await templates();
    const act = walkDay();                // el día que propone la hoja
    const teoN = teoDay();                // donde está Teodoro: siempre el día del calendario
    const focus = teoN ?? 0;
    // camina solo cuando avanza el calendario, y un paso: del día anterior al de hoy (ponerse al día no lo mueve)
    const desde = params.dia == null && teoN != null && S.teoMapa != null && S.teoMapa < teoN && !reduced() ? Math.max(S.teoMapa, teoN - 1) : null;

    // 1) La vista: el mapa largo va en un scroller; cabecera y hoja quedan fijas
    const scroller = document.createElement('div');
    scroller.style.cssText = 'position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;overscroll-behavior:contain';
    const fixed = [...root.children].filter(fija);
    root.parentElement.replaceWith(scroller);
    scroller.append(root);
    fixed.forEach(el => layer.appendChild(el));
    // cabecera por encima de Teodoro y los nodos, con un velo suave debajo
    fixed.filter(el => el.style.top === '0px' || el.style.top === '52px').forEach(el => el.classList.add(el.style.height === '112px' ? 'map-velo' : 'map-head'));

    // 1b) El paisaje del Figma; lo demás de la pantalla del lienzo se cambia por el mapa nuevo
    const tema = dark() ? 'oscuro' : 'claro';
    root.replaceChildren();
    root.className = 'dz-mapa';
    root.setAttribute('style', `height:${ALTO}px`);
    // al estirar el scroll se ve el color del borde, nunca negro
    scroller.style.background = `linear-gradient(${FONDO[tema][0]} 50%, ${FONDO[tema][1]} 50%)`;
    const yFoco = CENTRO[Math.max(focus, 1)][1];
    root.innerHTML = Array.from({ length: 6 }, (_, i) => `<img class="dz-tira" src="assets/mapa/${dark() ? 'noche' : 'dia'}-${i}.webp?v=2" alt="" style="top:${i * 600}px" decoding="async"${Math.abs(i * 600 + 300 - yFoco) > 1000 ? ' loading="lazy"' : ''}>`).join('');
    // la casa de abajo es donde sale el camino
    const casa = document.createElement('button'); casa.type = 'button'; casa.className = 'dz-casa'; casa.setAttribute('aria-label', 'Aquí empieza el camino');
    root.appendChild(casa);
    on(root, casa, () => toast('Aquí empieza el camino', 'El 29 de noviembre salimos hacia Belén'));

    // 2) Los 26 días
    const nodes = {};
    for (let n = 1; n <= 26; n++) {
      const el = document.createElement('button'); el.type = 'button';
      const animado = S.pasoAnimado === n && !reduced();
      pintarDia(el, n, isDone(n) && !animado ? 'hecho'
        : contentDone(n) && !animado ? 'trivia' // vio la historia pero no jugó la trivia: Teodoro ya pasó, sin estrellas todavía
        : n === teoN || (S.pasoAnimado && n === S.pasoAnimado) ? 'hoy'
        : n <= lastDay() ? (fase() === 'recuerdo' ? 'recuerdo' : 'abierto')
        : 'cerrado');
      // los días que vienen se ven por encima de Teodoro (como en el Figma)
      if (n > (teoN ?? 0)) el.classList.add('dz-arriba');
      root.appendChild(el);
      nodes[n] = { el };
      on(root, el, () => tapNode(n, el, layer));
    }

    // 2b) Días de pago para free: candado (Teodoro igual avanza con el calendario)
    Object.entries(nodes).forEach(([k, t]) => {
      const n = +k;
      if (n > lastDay() || puedeDia(n) || contentDone(n) || t.el.dataset.today) return;
      t.el.style.outline = 'none';
      if (!t.el.querySelector('.node-lock')) t.el.insertAdjacentHTML('beforeend', '<img class="node-lock" src="assets/candado.webp" alt="">');
      t.el.setAttribute('aria-label', `${t.el.getAttribute('aria-label')}, con Premium o el Pase de Adviento`);
    });

    // 3) Teodoro de pie sobre su día, con el número del día en una píldora a sus pies
    const teo = document.createElement('img'); teo.className = 'dz-teo'; teo.alt = '';
    const pildora = document.createElement('span'); pildora.className = 'dz-hoy-num'; pildora.setAttribute('aria-hidden', 'true');
    root.append(teo, pildora);
    const place = n => {
      const t = nodes[n]; if (!t) return;
      S.teoMapa = n; // dónde lo vio la familia la última vez
      const [cx, cy] = CENTRO[n], hoy = !!t.el.dataset.today;
      // en el Figma el dibujo mide 104 de alto con los pies 29 bajo el centro de su día dorado (96);
      // en un día de 76, en la misma proporción y con los pies encima de las estrellas
      const k = hoy ? 1 : 76 / 96, w = 108 * k, h = 104 * k;
      teo.style.width = w + 'px'; teo.style.height = h + 'px';
      teo.style.left = (cx - w / 2) + 'px'; teo.style.top = (cy + (hoy ? 29 : 28) - h) + 'px';
      pildora.hidden = !hoy; pildora.textContent = n;
      pildora.style.left = (cx - 15) + 'px'; pildora.style.top = (cy + (n === 26 ? 38 : 32)) + 'px';
    };
    // terminó el día con Teodoro cansado: se ve como estaba y la recarga se anima después
    const recargaDe = S.recarga != null && S.recarga < S.bateria && !reduced() ? S.recarga : null;
    if (S.recarga != null) { S.recarga = null; save(); }
    teo.src = teodoroImg(recargaDe ?? S.bateria);
    teo.classList.add('a-bob');
    if (focus >= 1) place(desde ?? focus); else { teo.hidden = true; pildora.hidden = true; }
    // volvió tras días sin caminar: Teodoro despierta al verlos
    if (params.despierta && !reduced()) { teo.classList.remove('a-bob'); setTimeout(() => { teo.src = teodoroImg(Math.max(S.bateria, 3)); animate(teo, 'a-hop'); }, 500); }

    // 3b) «¿Qué habrá aquí?» junto al día que viene, sin tapar una ruleta ni a Teodoro (si no cabe, no sale)
    const sig = teoN != null ? teoN + 1 : null;
    if (sig && sig <= 26 && sig > lastDay() && fase() === 'camino') {
      const [cx, cy] = CENTRO[sig], w = 144;
      const cajas = [...RULETAS.map(R => ({ x: R.x, y: R.y, w: R.w, h: R.ly + 26 - R.y })),
        { x: parseFloat(teo.style.left), y: parseFloat(teo.style.top), w: parseFloat(teo.style.width), h: parseFloat(teo.style.height) }];
      const choca = x => cajas.some(c => x < c.x + c.w && x + w > c.x && cy + 17 > c.y && cy - 17 < c.y + c.h);
      const x = [cx + 46, cx - 46 - w].find(x => x >= 8 && x + w <= 382 && !choca(x));
      if (x != null) root.insertAdjacentHTML('beforeend', `<span class="dz-que" aria-hidden="true" style="left:${x}px;top:${cy - 17}px"><svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 .5 7.3 4.7 11.5 6 7.3 7.3 6 11.5 4.7 7.3.5 6 4.7 4.7Z" fill="#F5DB78"/></svg>¿Qué habrá aquí?</span>`);
    }

    // 4) Ruletas del camino (días 4, 11, 18 y 24): solo se juegan tocándolas aquí
    const proxima = RULES.ruleta.find(d => d > lastDay());
    RULES.ruleta.forEach((d, i) => {
      const R = RULETAS[i];
      const opened = !!S.ruletas[d];
      const llego = S.hoy > 0 && d <= lastDay(); // ya llegó su día
      const cerrada = !opened && llego && fase() === 'recuerdo'; // el camino terminó: ya no se gira
      const lista = !opened && llego && !cerrada && contentDone(d); // se gana: se abre al ver el cuento de su día
      const falta = !opened && llego && !cerrada && !lista;
      const f = dateOf(d), mes = f.mes.toLowerCase();
      const faltan = d - S.hoy;
      const label = opened ? '¡Ya la giraste!' : lista ? '¡Gírala!' : cerrada ? 'Cerrada' : falta ? `Termina el día ${d}` : S.hoy > 0 && d === proxima ? (faltan === 1 ? 'Mañana' : `Faltan ${faltan} días`) : `Día ${d}`;
      const bloqueada = !opened && !lista; // aún no se puede girar: apagada y con candado, como los días cerrados
      const a = document.createElement('button'); a.type = 'button'; a.className = 'dz-ruleta' + (bloqueada ? ' rul-bloq' : '');
      a.style.cssText = `left:${R.x}px;top:${R.y}px;width:${R.w}px;height:${R.h}px`;
      const centro = R.img === 'ruleta-pie' ? 36 : 44; // centro de la rueda, en % del alto
      a.innerHTML = `<img src="assets/mapa/${R.img}.webp" alt=""${lista ? ' class="rul-pulso"' : ''}${bloqueada ? ' style="opacity:.55;filter:saturate(.35)"' : ''}>`
        + (bloqueada ? `<img class="rul-candado" src="assets/candado.webp" alt="" style="position:absolute;left:50%;top:${centro}%;width:34px;height:auto;transform:translate(-50%,-50%);pointer-events:none">` : '')
        // ya girada: insignia de vidrio como la de los días hechos, en el borde de arriba de la rueda, del lado del sendero (nunca se corta con la pantalla)
        + (opened ? `<span class="rul-hecha" aria-hidden="true" style="position:absolute;left:${R.x > 195 ? 18 : 82}%;top:${R.img === 'ruleta-pie' ? 13 : 21}%;width:40px;height:40px;box-sizing:border-box;transform:translate(-50%,-50%);border-radius:50%;background:linear-gradient(180deg,rgba(71,198,218,.95),rgba(11,116,138,.97));box-shadow:0 0 0 2.5px rgba(255,255,255,.96),0 6px 14px rgba(6,80,95,.38),inset 0 2px 3px rgba(255,255,255,.45),inset 0 -3px 5px rgba(6,80,95,.25);display:flex;align-items:center;justify-content:center;pointer-events:none"><svg width="20" height="20" viewBox="0 0 30 30" fill="none"><path d="M6.25 15.625 11.875 21.25 23.75 9.375" stroke="#FFFFFF" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`
          : `<span class="dz-etiqueta" style="left:${R.lx - R.x}px;top:${R.ly - R.y}px">${lista ? DESTELLO + label : label}</span>`);
      a.setAttribute('aria-label', opened ? `Ruleta de la semana ${i + 1}: ya la giraste` : lista ? `Ruleta de la semana ${i + 1}: ¡gírala!` : cerrada ? `Ruleta de la semana ${i + 1}: cerrada` : falta ? `Ruleta de la semana ${i + 1}: se abre al terminar el día ${d}` : `Ruleta de la semana ${i + 1}: se abre el ${f.dd} de ${mes}`);
      root.appendChild(a);
      on(root, a, () => {
        animate(a, 'a-pop');
        if (lista) go('ruletaPop', { day: d, from: 'mapa' }, 'modal');
        else if (opened) toast('Ya la giraste', premioTxt(S.ruletas[d]));
        else if (cerrada) toast('El camino de este año terminó', 'Nos vemos el próximo año');
        else if (falta) toast(`Termina el día ${d}`, 'Después la giras aquí');
        else toast(`Se abre el ${f.dd} de ${mes}`, 'Ese día la giras aquí');
      });
    });

    // 5) Cabecera fija
    const chip = layer.querySelector('[aria-label^="Día 9 de 26"]');
    chip?.classList.add('map-chip');
    if (chip) replaceText(chip, /^(\s*)9(\s*)$/, `$1${Math.max(focus, 0)}$2`);
    chip?.setAttribute('aria-label', `Día ${focus} de 26`);
    // Teodoro va atrasado: la píldora dice su día y el de hoy
    const hoyN = Math.min(lastDay(), 26);
    if (chip && S.hoy > 0 && S.hoy < 27 && focus !== hoyN) { replaceText(chip, /\/ 26/, `· hoy ${hoyN}`); chip.setAttribute('aria-label', `Día ${focus}. Hoy es el día ${hoyN}`); }
    if (chip && fase() === 'gracia' && S.inscrito && vistos() < 26) { chip.textContent = cuentaGracia(true); chip.style.whiteSpace = 'nowrap'; chip.style.fontSize = '16px'; chip.style.fontWeight = '800'; chip.style.color = dark() ? '#F5DB78' : '#0B748A'; chip.setAttribute('aria-label', cuentaGracia()); }
    if (chip && S.hoy <= 0) { chip.textContent = 'Sale el 29'; chip.style.fontWeight = '800'; chip.style.color = dark() ? '#F5DB78' : '#0B748A'; chip.setAttribute('aria-label', 'El camino sale el 29 de noviembre'); }
    paintEnergy(layer);
    if (recargaDe != null) layer.querySelectorAll(`img[src*="${BATTERY_IDS[S.bateria]}"]`).forEach(i => { i.src = A(BATTERY_IDS[recargaDe]); });
    bindMute(layer.querySelector('.map-head button[aria-label^="Música"]'));
    // el mapa recuerda desde dónde se entró al camino (Hoy, Teodoro, Mundos o la espera)
    if (params.from) mapOrigin = params.from;
    const volver = on(layer, 'Volver a Mundos', leaveMap);
    volver?.setAttribute('aria-label', 'Atrás');
    const bat = layer.querySelector('[aria-label^="Energía de Teodoro"]');
    if (bat) on(layer, bat, () => showEnergy(layer));
    // la píldora del lienzo es un enlace; dentro de la hoja va como botón (el enlace de la hoja es solo el botón principal)
    const pildoraLienzo = layer.querySelector('[aria-label="Volver a hoy"]');
    const backHoy = pildoraLienzo && document.createElement('button');
    if (backHoy) {
      backHoy.type = 'button'; backHoy.setAttribute('aria-label', 'Volver a hoy');
      backHoy.setAttribute('style', pildoraLienzo.getAttribute('style') + '; border: 0; font-family: inherit; cursor: pointer');
      backHoy.innerHTML = pildoraLienzo.innerHTML; pildoraLienzo.remove();
      // píldora flotante encima de la hoja: aparece cuando tu día sale de la vista
      replaceText(backHoy, /Hoy · día \d+/, `Tu día ${focus}`);
      backHoy.classList.add('back-hoy');
      backHoy.querySelectorAll('svg').forEach(s => s.remove());
      const arrow = document.createElement('span'); arrow.className = 'bh-arrow'; arrow.setAttribute('aria-hidden', 'true'); backHoy.prepend(arrow);
      backHoy.addEventListener('pointerdown', ev => ev.stopPropagation()); // tocarla no arrastra la hoja
      on(layer, backHoy, () => scrollToNode(focus, true));
      const sync = () => {
        const t = nodes[focus]; if (!t) return;
        const sh = layer.querySelector('[data-sheet]');
        // va dentro de la hoja, justo encima: se mueve con ella al abrirla, minimizarla o arrastrarla (nunca se queda atrás)
        if (sh && backHoy.parentElement !== sh) sh.appendChild(backHoy);
        const y = parseFloat(t.el.style.top) - scroller.scrollTop;
        const out = (y < 60 || y + 40 > (sh ? sh.offsetTop : 700)) && layer.dataset.dia == null; // con un día elegido ya está «Volver a tu día»
        backHoy.classList.toggle('on', out);
        arrow.textContent = y < 60 ? '↑' : '↓';
      };
      scroller.addEventListener('scroll', sync, { passive: true });
      layer._syncBackHoy = sync;
    }

    // 6) Hoja inferior según el estado del día
    // la hoja muestra el día que se tocó (si se tocó uno); si no, el día de Teodoro
    if (params.dia != null) layer.dataset.dia = String(params.dia);
    paintSheet(layer, T, params.dia);
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
      const top = parseFloat(t.el.style.top) - Math.max(200, sheetTop - 150); // nunca pegado a la cabecera
      scroller.scrollTo({ top, behavior: smooth && !reduced() ? 'smooth' : 'auto' });
    };
    if (params.dia != null && nodes[params.dia]) { const el = nodes[params.dia].el; el.style.boxShadow = (T.selShadow || '0 0 0 6px rgba(245,219,120,.8)'); scrollToNode(params.dia, false); }
    else if (focus < 1) scroller.scrollTop = scroller.scrollHeight; else scrollToNode(desde ?? focus, false);

    // 7) Animación: el día recién hecho se marca; Teodoro solo camina si avanzó el calendario
    const paso = S.pasoAnimado && !reduced() ? S.pasoAnimado : null;
    if (paso || desde != null) {
      S.pasoAnimado = null; save();
      await wait(450);
      const n = paso && nodes[paso];
      if (n) {
        pintarDia(n.el, paso, isDone(paso) ? 'hecho' : 'trivia'); // vio el cuento: check, con la trivia aún abierta si falta
        n.el.classList.add('a-pop');
      }
      if (paso === teoN && teo) { place(teoN); teo.classList.remove('a-bob'); animate(teo, 'a-hop'); } // a-hop sigue con el vaivén // terminó el día de hoy: celebra donde está
      if (desde != null && nodes[teoN] && teo) {
        await wait(350);
        const a = { x: parseFloat(teo.style.left), y: parseFloat(teo.style.top) };
        place(teoN);
        const b = { x: parseFloat(teo.style.left), y: parseFloat(teo.style.top) };
        teo.classList.remove('a-bob');
        scrollToNode(teoN, true);
        const dx = a.x - b.x, dy = a.y - b.y;
        teo.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 1100, easing: 'cubic-bezier(.65,0,.35,1)' });
        await teo.animate([{ translate: '0 0' }, { translate: '0 -16px', offset: .25 }, { translate: '0 0', offset: .5 }, { translate: '0 -12px', offset: .75 }, { translate: '0 0' }], { duration: 1100 }).finished;
        teo.animate([{ scale: '1' }, { scale: '1.06 .94' }, { scale: '1' }], { duration: 220, easing: 'cubic-bezier(.23,1,.32,1)' });
        teo.classList.add('a-bob');
        nodes[teoN].el.classList.add('a-pop');
      }
    } else if (recargaDe != null) await wait(450);
    if (recargaDe != null && layer.isConnected) await recargarPila(layer, (paso && nodes[paso]?.el) || teo, teo, recargaDe);
    if (params.thenCerrado && activeDay() == null && S.hoy < 27) {
      await wait(paso || desde != null || recargaDe != null ? 600 : 700);
      if (layer.isConnected && cur?.layer === layer) go('cerrado', {}, 'sheet'); // si ya se fue del mapa (p. ej. tocó «Hasta mañana»), no
    }

    // anillo que respira en el día de hoy
    const todayEl = root.querySelector('[data-today]');
    if (todayEl) { const ring = document.createElement('span'); ring.className = 'a-pulse'; ring.style.cssText = 'position:absolute;inset:-5px;border-radius:50%;pointer-events:none'; todayEl.appendChild(ring); }
  },
});

function tapNode(n, el, layer) {
  const act = activeDay();
  const d = DAYS[n];
  const enHoja = layer.dataset.dia != null ? +layer.dataset.dia : walkDay();
  if (n === enHoja) { startDay(n); return; } // el día que ya muestra la hoja: empezar
  if (isDone(n)) { showPast(layer, n, el); return; }
  if (fase() === 'recuerdo' && !contentDone(n) && n < 26) { animate(el, 'a-pop'); toast('El camino de este año terminó', 'Nos vemos el próximo año'); return; }
  // cualquier día ya desbloqueado (atrasado o con la trivia pendiente): su hoja, sin saltar directo
  if (n <= lastDay()) { animate(el, 'a-pop'); go('mapa', { dia: n }, 'none', { replace: true }); return; }
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

/** Terminó el día: una chispa sale del día hacia la batería de la cabecera, la batería se llena rayita a rayita
 *  y Teodoro pasa de cansado a feliz. Nada se bloquea mientras tanto. */
async function recargarPila(layer, desde, teo, de) {
  const bat = layer.querySelector('[aria-label^="Energía de Teodoro"]');
  const img = bat?.querySelector('img');
  const fin = () => { paintEnergy(layer); if (teo) teo.src = teodoroImg(); };
  if (!img || !desde) return fin();
  await Promise.all(BATTERY_IDS.slice(de + 1).map(id => { const i = new Image(); i.src = A(id); return i.decode().catch(() => {}); }));
  if (!layer.isConnected) return;
  // el teléfono puede estar escalado en el escritorio: las medidas se pasan a las de la pantalla
  const L = layer.getBoundingClientRect(), k = L.width / layer.offsetWidth || 1;
  const centro = r => [(r.left + r.width / 2 - L.left) / k, (r.top + r.height / 2 - L.top) / k];
  const [x0, y0] = centro(desde.getBoundingClientRect()), [x1, y1] = centro(img.getBoundingClientRect());
  const cx = (x0 + x1) / 2 - 40, cy = Math.min(y0, y1) - 70; // arco hacia arriba
  const pasos = Array.from({ length: 13 }, (_, i) => {
    const t = i / 12, u = 1 - t, x = u * u * x0 + 2 * u * t * cx + t * t * x1, y = u * u * y0 + 2 * u * t * cy + t * t * y1;
    return { transform: `translate(${x - 14}px,${y - 14}px) scale(${1.1 - t * .5}) rotate(${t * 180}deg)`, opacity: i === 12 ? .4 : 1 };
  });
  const vuelos = [0, 1, 2].map(i => {
    const c = document.createElement('span'); c.className = 'pila-chispa'; c.setAttribute('aria-hidden', 'true');
    c.innerHTML = '<svg width="28" height="28" viewBox="0 0 14 14"><path d="M7 .58 8.52 5.48 13.42 7 8.52 8.52 7 13.42 5.48 8.52.58 7 5.48 5.48Z" fill="#FFD54A" stroke="#FFF7D6" stroke-width=".7" stroke-linejoin="round"/></svg>';
    layer.appendChild(c);
    return c.animate(pasos, { duration: 680, delay: i * 90, easing: 'cubic-bezier(.45,0,.75,.35)', fill: 'both' }).finished.finally(() => c.remove());
  });
  await vuelos[0];
  if (!layer.isConnected) return;
  // llega: la batería brilla y se llena una rayita cada vez
  bat.animate([{ filter: 'drop-shadow(0 0 0 rgba(71,198,218,0))' }, { filter: 'drop-shadow(0 0 9px rgba(71,198,218,.95))', offset: .35 }, { filter: 'drop-shadow(0 0 0 rgba(71,198,218,0))' }], { duration: 300 + (5 - de) * 170 + 500 });
  for (let n = de + 1; n <= 5; n++) {
    img.src = A(BATTERY_IDS[n]);
    img.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.16)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'cubic-bezier(.23,1,.32,1)' });
    await wait(170);
  }
  fin();
  navigator.vibrate?.(20);
  if (teo) { teo.classList.remove('a-bob'); animate(teo, 'a-hop'); }
  // «¡Al 100 %!» bajo la batería, alineado a su borde derecho (nunca se sale de la pantalla)
  const r = img.getBoundingClientRect();
  const chip = document.createElement('span'); chip.className = 'pila-llena'; chip.setAttribute('role', 'status');
  chip.textContent = '¡Al 100 %!';
  chip.style.top = `${(r.bottom - L.top) / k + 8}px`;
  chip.style.right = `${Math.max(8, layer.offsetWidth - (r.right - L.left) / k - 4)}px`;
  layer.appendChild(chip);
  chip.animate([{ opacity: 0, transform: 'translateY(-6px) scale(.9)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.2,.9,.3,1.2)' });
  setTimeout(() => chip.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: 'forwards' }).finished.then(() => chip.remove()), 1500);
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
  [...sheet.querySelectorAll('div')].filter(x => /le dan energía/.test(x.textContent) && ![...x.children].some(c => /le dan energía/.test(c.textContent)))
    .forEach(x => { x.textContent = 'Cada día que caminan juntos lo llena.'; });
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
  head.children[1].textContent = d.title;
  if (d.cita) { const c = document.createElement('span'); c.className = 'sheet-cita'; c.textContent = d.cita; head.children[1].appendChild(c); }
  const [r1, r2] = [...sheet.children].filter(x => isRow(x));
  const C = contOf(d.type);
  const ic = iconOf(n, dark()); if (ic) r1.querySelector('img').src = A(ic);
  const [t1, s1] = r1.querySelector(':scope > div').children; t1.textContent = C[0]; s1.textContent = C[1];
  const verOtra = () => go(pantallaDia(n), { day: n, replay: true }, 'up');
  const a1 = r1.querySelector('a'); if (a1 && a1 !== r1) on(layer, a1, verOtra); else on(layer, r1, verOtra);
  if (a1 && d.type === 'juego') a1.textContent = 'Jugar otra vez';
  r1.style.cursor = 'pointer';
  const st = stars(n);
  const cta = [...sheet.children].find(x => x.tagName === 'A' && !isRow(x));
  if (!hasTrivia(n)) {
    // sin trivia: solo el contenido; el botón vuelve a verlo
    r2.remove();
    const tn = [...cta.querySelectorAll('*'), cta].flatMap(e => [...e.childNodes]).find(c => c.nodeType === 3 && c.nodeValue.trim());
    if (tn) tn.nodeValue = { cancion: 'Escuchar otra vez', reto: 'Ver el reto', juego: 'Jugar otra vez' }[d.type] || 'Ver otra vez';
    on(layer, cta, () => go(pantallaDia(n), { day: n, replay: true }, 'up'));
  } else {
  r2.querySelectorAll('[role=img] svg path').forEach((p, i) => p.setAttribute('fill', i < st ? '#F7C948' : (dark() ? 'rgba(255,255,255,.28)' : '#D3DDE5')));
  r2.querySelector('[role=img]')?.setAttribute('aria-label', `${st} de 3 estrellas`);
  const s2 = r2.querySelector(':scope > div').children[1]; s2.textContent = st === 3 ? '¡Ya tienes las 3 estrellas!' : `+${RULES.panes.trivia} panes si mejoras tus estrellas`;
  on(layer, cta, () => go('trivia', { day: n, i: 0, ok: 0, replay: true }, 'push'));
  r2.style.cursor = 'pointer'; r2.setAttribute('role', 'button'); r2.tabIndex = 0; on(layer, r2, () => go('trivia', { day: n, i: 0, ok: 0, replay: true }, 'push'));
  }
  cta.classList.add('cta-mini'); // se toca la fila; el botón queda en la barra minimizada
  if (t1.textContent.trim() === head.children[1].textContent.trim()) t1.textContent = C[0] === d.title ? 'Actividad' : C[0];
  const pr = [...sheet.children].find(x => x.tagName === 'A' && isRow(x));
  if (pr) {
    const r = document.createElement('div'); r.innerHTML = pr.innerHTML; r.setAttribute('style', pr.getAttribute('style'));
    r.className = 'sheet-row'; r.dataset.print = '1'; r.setAttribute('role', 'button'); r.tabIndex = 0; r.style.cursor = 'pointer';
    filaDescarga(r, d);
    pr.replaceWith(r); on(layer, r, () => abrirDescargable(n, 'mapa'));
  }
  // la sorpresa que dejó para después sigue aquí
  if (RULES.sorpresa[n] && S.sorpresas[n] !== 'hecha') {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'sheet-alt';
    b.innerHTML = `<img src="${A(IMG.dorso)}" alt="" style="width:22px;height:22px;object-fit:contain"><span>Juego sorpresa · ${SORPRESA_NOMBRE[RULES.sorpresa[n]]}</span><svg class="sa-go" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>`;
    cta.after(b); sheet.style.height = 'auto'; on(layer, b, () => openSorpresa(n));
  }
  sheet.classList.add('in-up');
  seen('S-03c-Mapa-dia-pasado');
}
/** Fila del descargable con el título del día (en los retos de acción lleva a los pasos del reto). */
function filaDescarga(r, d) {
  const { t, s, accion } = d.descarga;
  const [pt, ps] = r.querySelector(':scope > div')?.children || [];
  if (pt) pt.textContent = t; if (ps) ps.textContent = s;
  r.setAttribute('aria-label', `${t}: ${s}. Abrir`);
  if (accion) r.querySelector('svg path')?.setAttribute('d', 'M9 6l6 6-6 6');
}
export function contOf(type) {
  return {
    meditacion: ['Video', 'Ya lo viste', 'el video'], cuento: ['Video', 'Ya lo viste', 'el video'], amigos: ['Video', 'Ya lo viste', 'el video'],
    intro: ['Video', 'Ya lo viste', 'el video'], domingo: ['Video', 'Ya lo vieron', 'el video'], cancion: ['Canción', 'Ya la escuchaste', 'la canción'],
    reto: ['Reto en familia', 'Ya lo hicieron', 'el reto'], juego: ['Juego', 'Ya jugaron', 'el juego'], video: ['Video', 'Ya lo viste', 'el video'],
    nochebuena: ['Actividad final', 'Ya llegaste', 'la actividad'],
  }[type];
}

function paintSheet(layer, T, dia) {
  let sheet = [...layer.children].find(el => el.style.bottom === '10px');
  if (!sheet) return;
  sheet.dataset.sheet = '1';
  const act = dia ?? walkDay();
  if (act === 26 && !contentDone(26) && T.sheet26) {
    const t = document.createElement('template'); t.innerHTML = T.sheet26;
    const s26 = t.content.firstElementChild; s26.dataset.sheet = '1'; sheet.replaceWith(s26); sheet = s26;
    replaceText(sheet, /¡Llegamos a Belén!/, S.hoy <= 27 ? 'Hoy nace Jesús' : 'El nacimiento');
    const a = sheet.querySelector('a'); if (a) on(layer, a, () => startDay(26));
    sheet.classList.add('in-up');
    return;
  }
  const n = act ?? Math.min(lastDay(), 26);
  const d = DAYS[n];
  const head = [...sheet.children].find(el => /HOY · DÍA/.test(el.textContent));
  const rows = [...sheet.children].filter(el => isRow(el));
  const cta = [...sheet.children].filter(el => el.tagName === 'A' && !isRow(el)).pop() || sheet.querySelector('a');
  rows.forEach(r => r.remove());

  sheet.dataset.day = String(n);
  let kicker = 'HOY';
  if (act != null && act < lastDay()) kicker = `DÍA ${n}`;
  if (act == null) kicker = S.hoy >= 27 ? 'CAMINO TERMINADO' : `DÍA ${n} · LISTO`;
  if (n === 0) kicker = 'DÍA 0 · ANTES DE SALIR';
  if (dia != null && dia !== walkDay() && n > 0) kicker = contentDone(n) && !isDone(n) ? `DÍA ${n} · TRIVIA PENDIENTE` : `DÍA ${n}`;
  if (n > 0 && S.hoy <= 26 && n === S.hoy && /^(HOY|DÍA \d+)$/.test(kicker)) kicker = `HOY · DÍA ${n}`;
  if (head) {
    head.classList.add('sheet-head');
    head.children[0].textContent = kicker;
    head.children[1].textContent = n === 0 ? '¿Qué es el Adviento?' : d.title;
    head.children[1].style.fontWeight = '700';
    if (n > 0 && d.cita) { const c = document.createElement('span'); c.className = 'sheet-cita'; c.textContent = d.cita; head.children[1].appendChild(c); }
  }

  if (S.hoy <= 0) {
    // antes del 29: no hay día 0; se ve lo que viene y se invita
    if (head) { head.children[0].textContent = 'ANTES DE SALIR'; head.children[1].textContent = 'Salimos el 29 de noviembre'; }
    const t = document.createElement('template'); t.innerHTML = T.rowOff;
    const r = t.content.firstElementChild;
    const im = r.querySelector('img'); const ic = iconOf(1, dark()); if (im && ic) im.src = A(ic);
    r.style.opacity = ''; r.classList.add('sheet-row');
    const [tt, st] = r.querySelector(':scope > div').children; tt.textContent = DAYS[1].title; st.textContent = 'Día 1';
    cta.before(r);
    const txt = [...cta.childNodes].find(c => c.nodeType === 3 && c.nodeValue.trim()); if (txt) txt.nodeValue = 'Invitar a un amigo';
    const icon = cta.querySelector('svg'); if (icon) icon.style.display = 'none';
    on(layer, cta, () => go('invitacion', {}, 'push'));
    const alt = document.createElement('button'); alt.type = 'button'; alt.className = 'sheet-alt';
    alt.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1Z"/></svg><span>Volver al inicio</span><svg class="sa-go" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
    cta.after(alt); on(layer, alt, () => back(mapOrigin || 'hoy', 'back'));
    sheet.style.height = 'auto'; sheet.dataset.day = '1';
    sheet.classList.add('in-up');
    return;
  }
  const build = (on, title, sub, badge, icon) => {
    const t = document.createElement('template');
    t.innerHTML = on ? T.rowOn : T.rowOff;
    const r = t.content.firstElementChild;
    r.style.opacity = ''; r.classList.add('sheet-row'); // el candado ya marca el bloqueo
    if (icon) { const im = r.querySelector('img'); if (im) im.src = icon; }
    const [tt, st] = r.querySelector(':scope > div').children;
    tt.textContent = title; st.textContent = sub;
    const b = r.lastElementChild;
    if (badge === 'lock') {
      r.dataset.lock = '1';
      // cerrado = el mismo candado del mapa (el círculo con ✦ parecía un botón)
      b.outerHTML = '<img src="assets/candado.webp" alt="" aria-hidden="true" style="width:24px;height:auto;flex:none;margin-right:6px">';
    }
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
  const rowIcon = iconOf(n, dark()) ? A(iconOf(n, dark())) : n === 0 ? A(IMG.pergamino) : null;
  const list = [];
  let filaSorpresa = null; // va al final, justo encima del botón principal
  const pago = !puedeDia(n) && !contentDone(n); // free en un día de pago: todo con candado y la hoja lleva al pago
  const filaCont = build(!contentDone(n) && !pago, CONT[0], contentDone(n) ? CONT[1] : `${ty.min} min`, contentDone(n) ? 'ok' : pago ? 'lock' : 'now', rowIcon);
  // juego ya jugado (días 7, 14 y 21): en vez del check, la píldora para jugarlo otra vez
  if (d.type === 'juego' && contentDone(n) && T.otraVez) {
    const pill = document.createElement('span'); pill.setAttribute('style', T.otraVez); pill.textContent = 'Jugar otra vez';
    filaCont.lastElementChild.replaceWith(pill);
  }
  list.push(filaCont);
  let filaTriv = null;
  if (n !== 0 && n !== 26) {
    if (hasTrivia(n)) {
      const trivOn = contentDone(n) && !isDone(n);
      list.push(filaTriv = build(trivOn, 'Trivia', isDone(n) ? 'Ya la jugaste' : contentDone(n) ? 'Gana hasta 3 estrellas' : `Después de ${CONT[2]}`.replace('de el ', 'del '), isDone(n) ? 'stars' : trivOn ? 'now' : 'lock', T.trivIcon));
    }
    const sorp = RULES.sorpresa[n];
    if (sorp && isDone(n) && S.sorpresas[n] !== 'hecha') filaSorpresa = (build(true, '¡Hoy hay juego sorpresa!', `Hoy toca ${SORPRESA_NOMBRE[sorp]}`, 'now', A(IMG.regalo)));
  }
  // imprimible del día (lienzo): una fila tocable
  if (n >= 1 && T.printRow) {
    const t = document.createElement('template'); t.innerHTML = T.printRow;
    const a = t.content.firstElementChild;
    // un botón, no un enlace: el enlace de la hoja es solo el botón principal
    const r = document.createElement('div'); r.innerHTML = a.innerHTML; r.setAttribute('style', a.getAttribute('style'));
    r.className = 'sheet-row'; r.dataset.print = '1'; r.setAttribute('role', 'button'); r.tabIndex = 0; r.style.cursor = 'pointer';
    filaDescarga(r, d);
    if (pago) { r.lastElementChild.outerHTML = '<img src="assets/candado.webp" alt="" aria-hidden="true" style="width:24px;height:auto;flex:none;margin-right:6px">'; r.dataset.lock = '1'; }
    else on(layer, r, () => abrirDescargable(n, 'mapa'));
    list.push(r);
  }
  if (filaSorpresa) list.push(filaSorpresa);
  list.forEach(r => cta.before(r));
  list.filter(r => r.dataset.lock).forEach(r => {
    r.style.cursor = 'pointer'; r.setAttribute('role', 'button');
    on(layer, r, () => pago ? startDay(n) : (animate(r, 'a-shake'), toast(`Primero ${CONT[2]}`, 'La trivia se abre al terminarla')));
  });
  sheet.style.height = 'auto';

  // Botón principal
  const label = ctaLabel(n);
  const txt = [...cta.childNodes].find(c => c.nodeType === 3 && c.nodeValue.trim());
  if (txt) txt.nodeValue = label.text;
  const icon = cta.querySelector('svg');
  if (icon && !label.play) icon.style.display = 'none';
  on(layer, cta, label.go);
  // la hoja abierta se usa tocando la actividad que se quiere hacer; el botón amarillo queda solo en la barra minimizada
  const tocar = (r, fn) => { if (!r || r.dataset.lock) return; r.style.cursor = 'pointer'; r.setAttribute('role', 'button'); r.tabIndex = 0; on(layer, r, fn); };
  tocar(filaCont, contentDone(n) ? () => go(pantallaDia(n), { day: n, replay: true }, 'up') : () => startDay(n));
  tocar(filaTriv, isDone(n) ? () => go('trivia', { day: n, i: 0, ok: 0, replay: true }, 'push') : () => startDay(n));
  tocar(filaSorpresa, () => openSorpresa(n));
  // sin actividad que tocar (día de pago con free, o todo hecho: «Seguir al día N», «Hasta mañana»), el botón se queda
  if (!pago && (!contentDone(n) || (filaTriv && !isDone(n)) || filaSorpresa)) cta.classList.add('cta-mini');
  // trivias que quedaron pendientes al seguir con las historias: a un toque
  const trivAct = activeDay();
  const pendTriv = Array.from({ length: Math.min(lastDay(), 26) }, (_, i) => i + 1).filter(d => triviaPendiente(d) && d !== n);
  const ICO = {
    trivia: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.5v.4"/><circle cx="12" cy="17" r=".6" fill="currentColor"/></svg>',
    regalo: `<img src="${A(IMG.regalo)}" alt="" style="width:22px;height:22px;object-fit:contain">`,
    dorso: `<img src="${A(IMG.dorso)}" alt="" style="width:22px;height:22px;object-fit:contain">`,
    casa: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1Z"/></svg>',
  };
  let altHecho = false; // máximo una acción secundaria por hoja
  const addAlt = (txt, ico, fn, extra = {}, chip = '') => {
    if (altHecho) return; altHecho = true;
    const alt = document.createElement('button'); alt.type = 'button'; alt.className = 'sheet-alt';
    alt.innerHTML = `${ICO[ico]}<span>${txt}</span>${chip ? `<em class="sa-chip">${chip}</em>` : ''}<svg class="sa-go" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>`;
    Object.assign(alt.dataset, extra); cta.after(alt); on(layer, alt, fn);
  };
  // prioridad: volver a tu día > trivias pendientes > sorpresa pendiente (la ruleta nunca va en la hoja: se toca en el mapa)
  if (dia != null && dia !== teoDay() && teoDay() != null) addAlt(`Volver con Teodoro · Día ${teoDay()}`, 'casa', () => go('mapa', {}, 'none', { replace: true }));
  const mas = /trivia/i.test(label.text);
  if (n > 0 && pendTriv.length) addAlt(mas ? `${pendTriv.length} ${pendTriv.length === 1 ? 'trivia más' : 'trivias más'}` : (pendTriv.length === 1 ? 'Trivia pendiente' : `${pendTriv.length} trivias pendientes`), 'trivia', () => startDay(pendTriv[0]), { pend: String(pendTriv.length) }, `Día ${pendTriv[0]}`);
  const sorpPend = Object.keys(RULES.sorpresa).map(Number).filter(d => d < n && d <= lastDay() && isDone(d) && S.sorpresas[d] === 'luego');
  if (n > 0 && sorpPend.length) addAlt(`Juego sorpresa · ${SORPRESA_NOMBRE[RULES.sorpresa[sorpPend[0]]]}`, 'dorso', () => openSorpresa(sorpPend[0]), {}, `Día ${sorpPend[0]}`);
  // día 0 visto: volver al inicio sin buscar la flecha
  sheet.style.height = 'auto';
  sheet.classList.add('in-up');
}
/** La rayita de la hoja funciona: arrastra hacia abajo para ver el mapa, hacia arriba (o toca) para abrirla. */
/** Hoja del día: se minimiza a una barra compacta (como el mini reproductor de iOS) con el botón principal a mano.
 *  Se cambia con el botón, tocando la rayita o arrastrando. */
function sheetDrag(layer) {
  let y0 = null, dy = 0, sheet = null, mini = false;
  const after = () => setTimeout(() => layer._syncBackHoy?.(), 380);
  const scaleOf = s => s.getBoundingClientRect().height / s.offsetHeight || 1;
  // FLIP: la hoja se encoge o crece desde donde está, sin saltos
  const setMini = (s, on, fromDy = 0) => {
    const k = scaleOf(s), top0 = s.getBoundingClientRect().top;
    s.style.transition = 'none'; s.style.transform = '';
    s.classList.remove('in-up'); s.style.animation = 'none';
    s.classList.toggle('mini', on); mini = on;
    const top1 = s.getBoundingClientRect().top;
    const d = (top0 - top1) / k;
    if (!reduced()) s.animate([{ transform: `translateY(${d}px)` }, { transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.32,.72,0,1)' });
    const b = s.querySelector('.sheet-min'); b?.setAttribute('aria-expanded', String(!on)); b?.setAttribute('aria-label', on ? 'Abrir el día' : 'Minimizar');
    s.setAttribute('aria-expanded', String(!on));
    after();
  };
  const build = s => {
    if (!s || s.querySelector('.sheet-min')) return;
    s.style.zIndex = '30';
    // botón minimizar / abrir
    const b = document.createElement('button'); b.type = 'button'; b.className = 'sheet-min'; b.dataset.bound = '1'; b.setAttribute('aria-label', 'Minimizar'); b.setAttribute('aria-expanded', 'true');
    b.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
    s.appendChild(b);
    b.addEventListener('pointerdown', ev => ev.stopPropagation());
    b.addEventListener('click', ev => { ev.stopPropagation(); setMini(s, !s.classList.contains('mini')); });
    // barra compacta: ícono · día y título · acción principal
    const head = s.querySelector('.sheet-head') || [...s.children].find(el => el.children.length === 2 && /HOY|TE ESPERA|DÍA|ANTES DE SALIR|NOCHEBUENA|YA LO HICISTE/i.test(el.children[0]?.textContent || ''));
    const cta = [...s.children].filter(el => el.tagName === 'A' && !isRow(el)).pop();
    const rowImg = [...s.children].find(isRow)?.querySelector('img');
    const pend = s.querySelector('.sheet-alt[data-pend]');
    const bar = document.createElement('div'); bar.className = 'mini-bar';
    const eyebrow = s.dataset.day ? `Día ${s.dataset.day}` : (head?.children[0]?.textContent || '').trim();
    const title = head?.children[1]?.firstChild?.textContent.trim() || ''; // sin la cita
    const verbo = (cta?.textContent.trim() || '').replace(/^▶\s*/, '');
    const CORTOS = { 'Escuchar el Evangelio': 'Escuchar', 'Escuchar canción': 'Escuchar', 'Ir al juego sorpresa': 'Jugar', 'Invitar a un amigo': 'Invitar', 'Ver el nacimiento': 'Nacimiento', 'Jugar con Teodoro': 'Jugar', 'Volver al inicio': 'Inicio' };
    const corto = CORTOS[verbo] || (verbo.length > 15 ? verbo.split(' ')[0] : verbo);
    const play = !!cta?.querySelector('svg') && cta.querySelector('svg').style.display !== 'none';
    // imagen, un texto corto y el botón; lo pendiente es un punto, no una frase
    bar.innerHTML = `<span class="mb-ico">${rowImg ? `<img src="${rowImg.getAttribute('src')}" alt="">` : ''}${pend ? '<i class="mb-dot" aria-hidden="true"></i>' : ''}</span>
      <span class="mb-txt"><b>${eyebrow}</b></span>
      <button type="button" class="mb-cta" data-bound="1">${!play ? '' : '<svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5Z" fill="currentColor"/></svg>'}${corto}</button>`;
    bar.setAttribute('aria-label', `${eyebrow}: ${title}${pend ? `. ${pend.dataset.pend} ${pend.dataset.pend === '1' ? 'trivia pendiente' : 'trivias pendientes'}` : ''}`);
    const grab = [...s.children].find(el => el.getAttribute('aria-hidden') === 'true' && el.offsetHeight <= 6);
    if (grab) { grab.classList.add('sheet-grab'); grab.after(bar); } else s.prepend(bar);
    const mcta = bar.querySelector('.mb-cta');
    mcta.setAttribute('aria-label', verbo);
    mcta.addEventListener('pointerdown', ev => ev.stopPropagation());
    mcta.addEventListener('click', ev => { ev.stopPropagation(); cta?.click(); });
    bar.addEventListener('click', ev => { if (!ev.target.closest('.mb-cta')) setMini(s, false); });
  };
  build(layer.querySelector('[data-sheet]'));
  new MutationObserver(() => { const s = layer.querySelector('[data-sheet]'); if (s && !s.querySelector('.sheet-min')) { mini = false; build(s); layer._syncBackHoy?.(); } }).observe(layer, { childList: true });
  // arrastrar desde la parte de arriba (o desde la barra compacta)
  layer.addEventListener('pointerdown', ev => {
    sheet = ev.target.closest('[data-sheet]'); if (!sheet) return;
    if ((ev.clientY - sheet.getBoundingClientRect().top) / scaleOf(sheet) > 56 && !sheet.classList.contains('mini')) { sheet = null; return; }
    y0 = ev.clientY; dy = 0; sheet.setPointerCapture?.(ev.pointerId);
  });
  layer.addEventListener('pointermove', ev => {
    if (y0 == null || !sheet) return;
    dy = (ev.clientY - y0) / scaleOf(sheet);
    const isMini = sheet.classList.contains('mini');
    const v = isMini ? Math.min(0, Math.max(-60, dy)) * .4 : Math.max(0, dy);
    sheet.style.animation = 'none'; sheet.classList.remove('in-up'); sheet.style.transition = 'none'; sheet.style.transform = v ? `translateY(${v}px)` : '';
  });
  const end = () => {
    if (y0 == null || !sheet) return;
    y0 = null;
    const isMini = sheet.classList.contains('mini');
    if (Math.abs(dy) < 6) { if (!isMini) { sheet.style.transform = ''; setMini(sheet, true); } return; } // un toque en la rayita alterna
    if (!isMini && dy > 60) setMini(sheet, true);
    else if (isMini && dy < -30) setMini(sheet, false);
    else { sheet.style.transition = 'transform .3s cubic-bezier(.32,.72,0,1)'; sheet.style.transform = ''; }
  };
  layer.addEventListener('pointerup', end); layer.addEventListener('pointercancel', end);
}
function leaveMap() { back(mapOrigin || 'hoy', 'back'); }
