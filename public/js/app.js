// Arranque del MVP y panel de control para el equipo.
// El panel sigue el orden del lienzo (secciones 1 a 8) para que diseño y prueba hablen el mismo idioma.
import { S, save, reset, boot, go, cur, onChange, toast, manifest, shareURL, A, activeDay, isDone, doneCount, lastDay, fase, prefetch, logical, flowScreens } from './core.js';
import { RULES, IMG, PRENDAS, ENERGY_NAMES, TEODORO_IDS, dateOf } from './data.js';
import './flow.js';
import './map.js';
import './games.js';

const NAMES = {
  hoy: 'Hoy', teaser: 'Teaser', confirmacion: 'Inscripción confirmada', espera: 'Ya estás dentro', invitacion: 'Invitación',
  teodoro: 'Tab Teodoro', mundos: 'Mundos', mapa: 'Mapa del camino', reproductor: 'Reproductor', hub: 'Reto en familia',
  completado: '¿Jugamos a la trivia?', trivia: 'Trivia', triviaFin: 'Resultado de la trivia', cerrado: 'Mañana seguimos',
  calificacion: '¿Te gustó?', free: 'Free · descargables', ruletaPop: 'Ruleta', ruletaPremio: 'Premio de la ruleta', premioCuarto: 'Cuarto nuevo',
  memoramaReglas: 'Memorama · antes de jugar', memorama: 'Memorama', memoramaFin: 'Memorama · fin', adivinanzaIntro: 'Adivinanza · antes de jugar',
  adivinanza: 'Adivinanza', adivinanzaTiempo: 'Adivinanza · se acabó el tiempo', adivinanzaFin: 'Adivinanza · fin', desafioIntro: 'Desafío · antes de empezar',
  desafio: 'Desafío en familia', desafioFin: 'Desafío · cumplido', final: 'Nochebuena', estatica: 'Vista del lienzo',
};
// Sección del lienzo de cada pantalla (para «Dónde estás»)
const SECTION_OF = name => {
  if (['teaser', 'confirmacion', 'espera', 'invitacion'].includes(name)) return 1;
  if (name === 'hoy') return fase() === 'antes' ? 1 : S.regreso || (activeDay() ?? 99) < lastDay() ? 5 : 6;
  if (['teodoro', 'mundos'].includes(name)) return fase() === 'antes' ? 1 : 6;
  if (['ruletaPop', 'ruletaPremio', 'premioCuarto'].includes(name)) return 3;
  if (/^(memorama|adivinanza|desafio)/.test(name)) return 4;
  if (name === 'free') return 7;
  if (name === 'final') return 8;
  return 2;
};
const SECTIONS = [
  [1, 'Antes del 29 de noviembre', 3380], [2, 'Un día normal', 5888], [3, 'Día de ruleta', 8908], [4, 'Juegos sorpresa', 12598],
  [5, 'La energía de Teodoro', 15346], [6, 'Dónde vive el Adviento', 18126], [7, 'Durante el camino', 22120], [8, 'Nochebuena y después', 28415],
];
const sectionOfY = y => [...SECTIONS].reverse().find(s => y >= s[2]) || SECTIONS[0];

// ---------- Escala del teléfono ----------
function fit() {
  const w = innerWidth, h = innerHeight;
  const mobile = w <= 760;
  const panelW = w > 1100 ? 400 + 28 : 0;
  const s = mobile ? Math.min(w / 390, h / 844) : Math.min((h - 32) / 864, (w - panelW - 40) / 410, 1.1);
  document.documentElement.style.setProperty('--s', s.toFixed(4));
}
addEventListener('resize', fit);

// ---------- Simulación ----------
const STAR_PATTERN = [3, 2, 3, 1, 3, 2, 3, 3, 2, 3, 1, 3, 2, 3, 3, 2, 3, 3, 1, 3, 2, 3, 3, 2, 3, 3];
function fill(upto, opts = {}) {
  S.completos = {};
  S.completos[0] = { contenido: true };
  for (let n = 1; n <= upto; n++) S.completos[n] = { contenido: true, trivia: n !== 26, estrellas: STAR_PATTERN[n - 1] };
  S.ruletas = {}; S.prendas = []; S.sorpresas = {}; S.ruletaPendiente = {};
  RULES.ruleta.forEach((d, i) => { if (d <= upto) { S.ruletas[d] = PRENDAS[i].id; S.prendas.push(PRENDAS[i].id); } });
  Object.keys(RULES.sorpresa).forEach(d => { if (+d <= upto) S.sorpresas[d] = 'hecha'; });
  S.panes = 60 + upto * 22;
  Object.assign(S, opts);
}
const day = (hoy, done, extra = {}) => () => { reset({ hoy, ...extra }); fill(done); Object.assign(S, extra); };

// Recorridos: uno por cada caso del lienzo. «covers» = pantallas del lienzo que deja ver.
const REC = [
  { sec: 1, t: 'Sin inscribirse', mira: 'Tarjeta en Hoy → teaser → inscripción → espera', run: () => { reset({ hoy: 0, inscrito: false, teaserVisto: false }); S.completos = {}; }, go: 'hoy', covers: ['V2-Pre-Hoy-claro', 'V2-Teaser-claro', 'V2-Confirmacion-claro', 'V2-Espera-claro'] },
  { sec: 1, t: 'Ya inscrito', mira: 'Hoy y tab Teodoro con la cuenta regresiva · invitar a un amigo', run: () => { reset({ hoy: 0, inscrito: true }); S.completos = {}; }, go: 'hoy', covers: ['V2-Pre-Hoy-dentro-claro', 'V2-Invitacion-claro'] },
  { sec: 1, t: 'Tab Teodoro antes del 29', mira: 'Ícono de Adviento junto a Teodoro, sin inscribirse', run: () => { reset({ hoy: 0, inscrito: false, teaserVisto: true }); S.completos = {}; }, go: 'teodoro', covers: ['V2-Pre-Teodoro-claro'] },
  { sec: 2, t: 'Un día de cuento', mira: 'Día 10 · mapa → historia → ¿jugamos? → 5 preguntas → mañana seguimos', run: day(10, 9), go: 'hoy', covers: ['S-03-Mapa', 'S-05-Reproductor', 'S-06-Completado', 'V2-06a-Trivia-sin-elegir-claro', 'V2-Trivia-fin-claro', 'V2-Cerrado'] },
  { sec: 2, t: 'Equivocarse en la trivia', mira: 'Toca una respuesta mala: pista sutil y reintento', run: day(10, 9), go: 'mapa', covers: ['V2-08-Pista-claro', 'V2-08b-Reintento-claro'] },
  { sec: 2, t: 'Reto en familia', mira: 'Día 13 · hub del reto, imprimible y canción', run: day(13, 12), go: 'mapa', covers: ['S-04-Hub-familia'] },
  { sec: 2, t: 'Calificar el día', mira: '«Califícanos» al terminar: 3 caritas y comentario', run: day(10, 9), go: 'mapa', covers: ['V2-Calificacion-claro'] },
  { sec: 3, t: 'Día de ruleta', mira: 'Día 11 · la ruleta sale antes del cuento, gira y da premio', run: day(11, 10), go: 'mapa', covers: ['S-05b-Ruleta-pop', 'S-05c-Ruleta-premio'] },
  { sec: 3, t: 'Premio: cuarto nuevo', mira: 'La ruleta cae en la casa: cuarto de Nazaret', run: day(11, 10, { forzarPremio: 'cuarto' }), go: 'mapa', covers: ['S-09-Premio-cuarto', 'V3-Teodoro-nazaret'] },
  { sec: 4, t: 'Memorama', mira: 'Día 14 · tras la trivia: ¡Hoy hay sorpresa!', run: day(14, 13), go: 'mapa', covers: ['V2-Trivia-fin-sorpresa-claro', 'V2-Memorama-reglas-claro', 'V2-Memorama-claro', 'V2-Memorama-fin-claro'] },
  { sec: 4, t: 'Adivinanza', mira: 'Día 7 · 5 palabras con tiempo (pasa el teléfono)', run: day(7, 6), go: 'mapa', covers: ['V2-Adivinanza-intro-claro', 'V2-Adivinanza-claro', 'V2-Adivinanza-fin-claro'] },
  { sec: 4, t: 'Desafío en familia', mira: 'Día 9 · una carta, otra carta, ¡lo hicimos!', run: day(9, 8), go: 'mapa', covers: ['V2-Desafio-intro-claro', 'V2-Desafio-claro', 'V2-Desafio-fin-claro'] },
  { sec: 5, t: 'Va atrasado', mira: 'En el día 9, hoy es el 11: puede ponerse al día', run: day(11, 8, { bateria: 3 }), go: 'hoy', covers: ['S-01-Hoy-atrasado'] },
  { sec: 5, t: 'Regreso tras una semana', mira: 'Teodoro le guardó el camino · batería en 0', run: day(16, 8, { bateria: 0, regreso: true }), go: 'hoy', covers: ['V2-10-Regreso'] },
  { sec: 5, t: 'Teodoro cansado', mira: 'Batería 2 de 5 en Hoy y en el mapa', run: day(10, 9, { bateria: 2 }), go: 'hoy', covers: ['S-01-Energia'] },
  { sec: 6, t: 'Hoy, tab Teodoro y Mundos', mira: 'Dónde aparece el camino dentro de la app', run: day(9, 8), go: 'teodoro', covers: ['V2-01-Hoy-completo', 'V3-Teodoro', 'V2-02-Mundos-claro'] },
  { sec: 7, t: 'Usuario free', mira: 'Día 13 · todo abierto, los descargables piden Premium', run: day(13, 12, { plan: 'free' }), go: 'mapa', covers: ['V2-24-Dia-completo-claro'] },
  { sec: 7, t: 'Primer día', mira: 'Día 1 · el camino recién empieza', run: day(1, 0), go: 'hoy', covers: ['V2-Mapa-completo-claro'] },
  { sec: 8, t: 'Nochebuena', mira: 'Día 26 · llegada a Belén', run: day(26, 25), go: 'mapa', covers: ['V2-Mapa-d24-claro', 'V2-Final-claro'] },
  { sec: 8, t: 'Terminó completo', mira: '25 de diciembre · 26 de 26 días', run: day(27, 26), go: 'hoy', covers: [] },
  { sec: 8, t: 'Terminó incompleto', mira: '25 de diciembre · le faltan 5 días', run: day(27, 21), go: 'hoy', covers: [] },
  { sec: 8, t: 'Se une tarde', mira: 'Día 5 sin inscribirse: «¡Ya salimos! ¿Vienes?»', run: () => { reset({ hoy: 5, inscrito: false }); S.completos = {}; }, go: 'hoy', covers: [] },
];
// Lo que el MVP decidió por su cuenta (para revisarlo con el equipo)
const DECISIONES = [
  'La barra de pestañas es la del tab Teodoro en todas las pantallas (en el lienzo, Hoy y Mundos usan otra barra clara e ilustrada, también en modo oscuro).',
  '«Entrar» antes del 29 lleva al día 0 («¿Qué es el Adviento?»); en el lienzo apuntaba al Desafío.',
  'Al terminar la trivia, Teodoro camina en el mapa al día siguiente y luego aparece «Mañana seguimos».',
  'La trivia se completa con 5 preguntas propias por día (revisar con contenido): 3 imágenes, 4 textos o varias correctas.',
  'Estrellas: 5 de 5 = 3 estrellas · 3 o 4 = 2 · menos = 1. Solo cuenta el primer intento de cada pregunta.',
  'Ruleta: 10 casillas (7 panes, manzana, prenda de la semana, cuarto). Prendas: gorro, bufanda, bolso y cama de paja.',
  'La historia del reproductor dura 9 segundos para poder probar rápido.',
];
const PENDIENTES_LIENZO = [
  'Escenas de los días 1 y 2 (Arte 5 las marca como «FALTA»).',
  'Ícono del día 25 · Video (Íconos del camino: «Aún sin ícono»).',
  'Qué pasa al tocar un día ya completado en el mapa.',
  '«Ver el nacimiento» en Nochebuena no tiene pantalla.',
  'Desafío y Desafío cumplido: dos imágenes rotas en el lienzo.',
  'El aviso de batería baja y el hub como portada quedaron en Basura: confirmar que no vuelven.',
];

function advance(k) {
  const jugo = S.ultimoJugado === S.hoy;
  S.bateria = Math.max(0, S.bateria - (jugo ? 0 : 1) - (k - 1));
  S.hoy = Math.min(27, S.hoy + k);
  if (k >= RULES.regresoDias && S.inscrito && S.hoy >= 1) S.regreso = true;
  save();
  toast(k === 1 ? 'Pasó la medianoche' : `Pasaron ${k} días`, S.hoy >= 27 ? 'Ya es Navidad' : `Hoy es el día ${S.hoy}`);
  go('hoy', {}, 'fade');
}

// ---------- Panel ----------
const panel = document.getElementById('panel');
const btn = document.getElementById('panelBtn');
let tab = 'rec';
let filtro = 'todas';
try { tab = localStorage.getItem('cab-tab2') || 'rec'; } catch { /* sin storage */ }
btn.onclick = () => { const o = panel.classList.toggle('open'); btn.setAttribute('aria-expanded', o); document.body.classList.toggle('panel-open', o); if (o) render(); };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const check = on => `<span class="p-check ${on ? 'on' : ''}" aria-label="${on ? 'Visto' : 'Sin ver'}">${on ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' : ''}</span>`;

function dayLabel(n) { if (n <= 0) return 'Antes del 29 nov'; if (n >= 27) return '25 dic – 6 ene'; const f = dateOf(n); return `Día ${n} · ${f.dow.slice(0, 3).toLowerCase()} ${f.dd} ${f.mes.slice(0, 3).toLowerCase()}`; }
function coverage() {
  const all = flowScreens();
  const seenN = [...all.keys()].filter(k => S.vistas?.[k]).length;
  return { all, seenN, total: all.size };
}

function render() {
  if (window.innerWidth <= 1100 && !panel.classList.contains('open')) return;
  const act = activeDay();
  const name = cur ? (NAMES[cur.name] || cur.name) : '—';
  const sec = SECTIONS.find(s => s[0] === SECTION_OF(cur?.name || 'hoy'));
  const cov = coverage();
  const hoyTxt = fase() === 'antes' ? 'Antes del 29 de noviembre' : fase() === 'despues' ? 'Del 25 de diciembre al 6 de enero' : `Hoy: día ${S.hoy} de 26`;
  const progTxt = act == null ? (fase() === 'antes' ? (S.inscrito ? 'Inscrito' : 'Sin inscribirse') : 'Al día') : act < lastDay() ? `Va en el día ${act}` : `Toca el día ${act}`;
  const head = `<div class="p-head">
    <div class="p-title"><h1>Camino a Belén</h1><span class="p-tag">MVP</span></div>
    <div class="p-where"><span class="p-sec-badge">${sec[0]}</span><div><b>${esc(name)}</b><small>Sección ${sec[0]} del lienzo · ${sec[1]}</small></div></div>
    <div class="p-stats">
      <span class="chip-stat">${hoyTxt}</span>
      <span class="chip-stat">${progTxt}</span>
      <span class="chip-stat"><img src="${A(TEODORO_IDS[S.bateria])}" alt="">${S.bateria}/5</span>
      <span class="chip-stat"><img src="${A(IMG.pan)}" alt="">${S.panes}</span>
      <span class="chip-stat">${doneCount()}/26 días</span>
      <span class="chip-stat">${S.plan === 'free' ? 'Free' : 'Premium'} · ${S.tema === 'oscuro' ? 'Oscuro' : 'Claro'}</span>
    </div>
  </div>
  <div class="p-tabs" role="tablist">${[['rec', 'Recorridos'], ['aj', 'Ajustes'], ['pant', `Pantallas · ${cov.seenN}/${cov.total}`], ['notas', `Notas${S.huecos.length ? ' · ' + S.huecos.length : ''}`]].map(([k, l]) => `<button class="p-tab" role="tab" aria-selected="${tab === k}" data-tab="${k}">${l}</button>`).join('')}</div>`;

  let body = '';
  if (tab === 'rec') {
    const pct = Math.round(cov.seenN / cov.total * 100);
    body = `<div class="p-cov"><div class="p-cov-top"><b>${cov.seenN} de ${cov.total} pantallas del lienzo vistas</b><button class="p-link" data-tab="pant" data-filtro="faltan">Ver las que faltan</button></div><div class="p-bar"><span style="width:${pct}%"></span></div></div>
    <p class="p-help">Cada recorrido deja la app en el punto exacto. Tócalo, recórrelo como una familia y anota lo que veas en <b>Notas</b>.</p>
    ${SECTIONS.map(([n, label]) => {
      const items = REC.map((r, i) => ({ ...r, i })).filter(r => r.sec === n);
      if (!items.length) return '';
      return `<section class="p-group"><h2><span class="p-sec-badge">${n}</span>${label}</h2>${items.map(r => {
        const done = r.covers.length && r.covers.every(f => S.vistas?.[logical(f)]);
        return `<button class="p-rec" data-scen="${r.i}">${check(done)}<span><b>${esc(r.t)}</b><small>${esc(r.mira)}</small></span><span class="p-go" aria-hidden="true">Probar</span></button>`;
      }).join('')}</section>`;
    }).join('')}`;
  } else if (tab === 'aj') {
    const maxDone = Math.max(0, ...Object.keys(S.completos).filter(k => isDone(+k)).map(Number));
    body = `<section class="p-group"><h2>Tiempo</h2>
      <div class="p-row"><label>Calendario</label><span class="p-step"><button data-act="dayMinus" aria-label="Día anterior">−</button><select id="dSel" aria-label="Día del calendario">${Array.from({ length: 28 }, (_, n) => `<option value="${n}" ${n === S.hoy ? 'selected' : ''}>${dayLabel(n)}</option>`).join('')}</select><button data-act="dayPlus" aria-label="Día siguiente">+</button></span></div>
      <div class="p-row"><label for="pSel">Completó hasta</label><select id="pSel">${Array.from({ length: 27 }, (_, n) => `<option value="${n}" ${n === maxDone ? 'selected' : ''}>${n ? 'Día ' + n : 'Ninguno'}</option>`).join('')}</select></div>
      <div class="p-btns"><button class="p-btn main" data-act="mid">Avanzar a medianoche</button><button class="p-btn" data-act="week">7 días sin abrir</button></div>
    </section>
    <section class="p-group"><h2>Familia</h2>
      <div class="p-row"><label>Plan</label><span class="seg">${[['premium', 'Premium'], ['free', 'Free']].map(([v, l]) => `<button data-plan="${v}" aria-pressed="${S.plan === v}">${l}</button>`).join('')}</span></div>
      <div class="p-row"><label>Inscrito</label><span class="seg">${[['1', 'Sí'], ['0', 'No']].map(([v, l]) => `<button data-ins="${v}" aria-pressed="${S.inscrito === (v === '1')}">${l}</button>`).join('')}</span></div>
      <div class="p-row"><label>Tema</label><span class="seg">${[['claro', 'Claro'], ['oscuro', 'Oscuro']].map(([v, l]) => `<button data-tema="${v}" aria-pressed="${S.tema === v}">${l}</button>`).join('')}</span></div>
    </section>
    <section class="p-group"><h2>Teodoro</h2>
      <div class="p-faces" role="radiogroup" aria-label="Batería">${[0, 1, 2, 3, 4, 5].map(v => `<button role="radio" aria-checked="${S.bateria === v}" data-bat="${v}"><img src="${A(TEODORO_IDS[v])}" alt=""><b>${v}</b><small>${ENERGY_NAMES[v]}</small></button>`).join('')}</div>
      <div class="p-row"><label for="nPan">Panes</label><span class="p-step"><button data-act="panMinus" aria-label="Quitar 10 panes">−</button><input id="nPan" type="number" min="0" step="5" value="${S.panes}"><button data-act="panPlus" aria-label="Sumar 10 panes">+</button></span></div>
    </section>
    <section class="p-group"><h2>Ruleta</h2>
      <div class="p-chips">${[['', 'Al azar'], ['prenda', 'Prenda de la semana'], ['panes', '20 panes'], ['manzana', 'Manzana'], ['cuarto', 'Cuarto nuevo']].map(([v, l]) => `<button data-premio="${v}" aria-pressed="${S.forzarPremio === v}">${l}</button>`).join('')}</div>
    </section>
    <section class="p-group"><h2>Compartir</h2>
      <div class="p-btns"><button class="p-btn main" data-act="share">Copiar enlace a este estado</button><button class="p-btn" data-act="reset">Volver al día 9</button></div>
      <p class="p-help">El enlace abre la app en esta misma pantalla y estado. Sirve para decir «mira esto» por Slack.</p>
    </section>
    <details class="p-group p-rules"><summary>Reglas que usa el MVP</summary><ul class="p-list">
      <li><b>Panes</b><small>Contenido +${RULES.panes.contenidoPremium} premium / +${RULES.panes.contenidoFree} free · trivia +${RULES.panes.trivia} · sorpresa +${RULES.panes.sorpresa} · ruleta ${RULES.panes.ruleta}</small></li>
      <li><b>Batería</b><small>Contenido +2 · la trivia la llena · cada día sin Adviento −1 · nunca bloquea</small></li>
      <li><b>Ruleta</b><small>Días ${RULES.ruleta.join(', ')} · al iniciar el día, antes del contenido</small></li>
      <li><b>Sorpresa</b><small>${Object.entries(RULES.sorpresa).map(([d, g]) => `día ${d} ${g}`).join(' · ')} · nunca el mismo día que la ruleta</small></li>
      <li><b>Atrasado y regreso</b><small>Puede hacer varios días seguidos hasta alcanzar hoy · regreso tras ${RULES.regresoDias}+ días sin abrir</small></li>
    </ul></details>`;
  } else if (tab === 'pant') {
    const groups = {};
    cov.all.forEach((v, k) => { const s = sectionOfY(v.y); (groups[s[0]] ??= []).push([k, v]); });
    const man = manifest();
    const pair = key => Object.entries(man).filter(([f]) => logical(f) === key).sort((a, b) => a[1].dark - b[1].dark).map(([f, m]) => ({ f, dark: m.dark }));
    body = `<div class="seg p-filter">${[['todas', 'Todas'], ['faltan', 'Faltan'], ['vistas', 'Vistas']].map(([v, l]) => `<button data-filtro="${v}" aria-pressed="${filtro === v}">${l}</button>`).join('')}</div>
    <p class="p-help">Las ✓ ya aparecieron al recorrer la app. Toca Claro u Oscuro para verla tal cual está en el lienzo.</p>
    ${SECTIONS.map(([n, label]) => {
      const rows = (groups[n] || []).sort((a, b) => a[1].y - b[1].y || a[1].x - b[1].x).filter(([k]) => filtro === 'todas' || (filtro === 'vistas') === !!S.vistas?.[k]);
      if (!rows.length) return '';
      return `<section class="p-group"><h2><span class="p-sec-badge">${n}</span>${label}</h2><ul class="p-list">${rows.map(([k]) => `<li class="p-screen">${check(S.vistas?.[k])}<span>${esc(k)}</span><span class="p-mini">${pair(k).map(p => `<button data-file="${p.f}">${p.dark ? 'Oscuro' : 'Claro'}</button>`).join('')}</span></li>`).join('')}</ul></section>`;
    }).join('')}`;
  } else {
    const key = cur?.name || 'hoy';
    const notes = Object.entries(S.notas).filter(([, v]) => v.trim());
    body = `<section class="p-group"><h2>Nota sobre «${esc(NAMES[key] || key)}»</h2>
      <textarea class="p-note" id="note" placeholder="¿Qué mejorarías aquí? ¿Falta una pantalla? ¿Algo confunde a un niño?">${esc(S.notas[key] || '')}</textarea>
      <div class="p-btns"><button class="p-btn main" data-act="copyNotes">Copiar todo para el equipo</button><button class="p-btn" data-act="dlNotes">Descargar .md</button></div></section>
    <section class="p-group"><h2>Notas del equipo · ${notes.length}</h2>${notes.length ? `<ul class="p-list">${notes.map(([k, v]) => `<li><b>${esc(NAMES[k] || k)}</b><small>${esc(v)}</small></li>`).join('')}</ul>` : '<p class="p-help">Aún no hay notas. Escribe arriba mientras recorres.</p>'}</section>
    <section class="p-group"><h2>Huecos encontrados · ${S.huecos.length}</h2><p class="p-help">Se anotan solos cuando alguien toca algo que el lienzo no define.</p>
      ${S.huecos.length ? `<ul class="p-list">${S.huecos.map(h => `<li><b>${esc(h.label)}</b><small>en ${esc(NAMES[h.where] || h.where)}</small></li>`).join('')}</ul><div class="p-btns"><button class="p-btn" data-act="clearH">Vaciar huecos</button></div>` : ''}</section>
    <section class="p-group"><h2>Pendientes del lienzo</h2><ul class="p-list">${PENDIENTES_LIENZO.map(t => `<li><small>${esc(t)}</small></li>`).join('')}</ul></section>
    <section class="p-group"><h2>Decisiones del MVP para revisar</h2><ul class="p-list">${DECISIONES.map(t => `<li><small>${esc(t)}</small></li>`).join('')}</ul></section>`;
  }
  const scroll = panel.querySelector('.p-body')?.scrollTop || 0;
  const sameTab = panel.dataset.tab === tab;
  panel.innerHTML = head + `<div class="p-body">${body}</div>`;
  panel.dataset.tab = tab;
  if (sameTab) panel.querySelector('.p-body').scrollTop = scroll;
}

panel.addEventListener('click', e => {
  const t = e.target.closest('button'); if (!t) return;
  if (t.dataset.tab) { tab = t.dataset.tab; if (t.dataset.filtro) filtro = t.dataset.filtro; try { localStorage.setItem('cab-tab2', tab); } catch { /* */ } render(); return; }
  if (t.dataset.filtro) { filtro = t.dataset.filtro; render(); return; }
  if (t.dataset.plan) { S.plan = t.dataset.plan; save(); toast(S.plan === 'free' ? 'Ahora eres free' : 'Ahora eres premium'); return; }
  if (t.dataset.tema) { S.tema = t.dataset.tema; save(); go(cur?.name === 'estatica' ? 'hoy' : cur?.name || 'hoy', cur?.params || {}, 'fade'); return; }
  if (t.dataset.ins) { S.inscrito = t.dataset.ins === '1'; save(); go('hoy', {}, 'fade'); return; }
  if (t.dataset.bat) { S.bateria = +t.dataset.bat; save(); go(cur?.name || 'hoy', cur?.params || {}, 'none'); return; }
  if ('premio' in t.dataset) { S.forzarPremio = t.dataset.premio; save(); return; }
  if (t.dataset.scen) { const r = REC[+t.dataset.scen]; r.run(); save(); go(r.go, {}, 'fade'); toast(r.t, r.mira); closeMobile(); return; }
  if (t.dataset.go) { go(t.dataset.go, {}, 'fade'); closeMobile(); return; }
  if (t.dataset.file) { go('estatica', { file: t.dataset.file, back: cur?.name !== 'estatica' ? cur?.name : 'hoy', backParams: cur?.params }, 'fade'); closeMobile(); return; }
  const a = t.dataset.act;
  if (a === 'mid') advance(1);
  if (a === 'week') advance(7);
  if (a === 'dayMinus' || a === 'dayPlus') { S.hoy = Math.max(0, Math.min(27, S.hoy + (a === 'dayPlus' ? 1 : -1))); save(); go('hoy', {}, 'fade'); }
  if (a === 'panMinus' || a === 'panPlus') { S.panes = Math.max(0, S.panes + (a === 'panPlus' ? 10 : -10)); save(); }
  if (a === 'reset') { reset({ hoy: 9 }); fill(8); save(); go('hoy', {}, 'fade'); }
  if (a === 'share') { navigator.clipboard?.writeText(shareURL()).then(() => toast('Enlace copiado', 'Abre la app en este mismo estado')); }
  if (a === 'clearH') { S.huecos = []; save(); }
  if (a === 'copyNotes' || a === 'dlNotes') {
    const md = notesMarkdown();
    if (a === 'copyNotes') navigator.clipboard?.writeText(md).then(() => toast('Notas copiadas', 'Pégalas en Slack o en el lienzo'));
    else { const b = new Blob([md], { type: 'text/markdown' }); const u = URL.createObjectURL(b); const l = document.createElement('a'); l.href = u; l.download = 'camino-a-belen-notas.md'; l.click(); URL.revokeObjectURL(u); }
  }
});
panel.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'dSel') { S.hoy = +t.value; save(); go('hoy', {}, 'fade'); }
  if (t.id === 'pSel') { const n = +t.value; fill(n); if (S.hoy < n) S.hoy = n; save(); go(cur?.name === 'mapa' ? 'mapa' : 'hoy', {}, 'fade'); }
  if (t.id === 'nPan') { S.panes = Math.max(0, +t.value || 0); save(); }
});
panel.addEventListener('input', e => { if (e.target.id === 'note') { S.notas[cur?.name || 'hoy'] = e.target.value; try { localStorage.setItem('cab-mvp-v1', JSON.stringify(S)); } catch { /* */ } } });
function closeMobile() { if (innerWidth <= 1100) { panel.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); document.body.classList.remove('panel-open'); } }
function notesMarkdown() {
  const cov = coverage();
  const lines = ['# Camino a Belén · notas del MVP', '', `_${new Date().toLocaleString('es')} · ${cov.seenN} de ${cov.total} pantallas del lienzo recorridas_`, '', '## Notas por pantalla', ''];
  const notes = Object.entries(S.notas).filter(([, v]) => v.trim());
  if (!notes.length) lines.push('_Sin notas_');
  notes.forEach(([k, v]) => lines.push(`- **${NAMES[k] || k}:** ${v.trim()}`));
  lines.push('', '## Huecos (tocados sin diseño)', '');
  if (!S.huecos.length) lines.push('_Ninguno_');
  S.huecos.forEach(h => lines.push(`- ${h.label} — _${NAMES[h.where] || h.where}_`));
  lines.push('', '## Pantallas del lienzo sin recorrer', '');
  [...cov.all.keys()].filter(k => !S.vistas?.[k]).forEach(k => lines.push(`- ${k}`));
  lines.push('', '## Pendientes del lienzo', '', ...PENDIENTES_LIENZO.map(t => '- ' + t));
  lines.push('', '## Decisiones del MVP para revisar', '', ...DECISIONES.map(t => '- ' + t));
  return lines.join('\n');
}
const syncTheme = () => { document.documentElement.dataset.theme = S.tema === 'oscuro' ? 'dark' : 'light'; document.querySelector('meta[name=theme-color]')?.setAttribute('content', S.tema === 'oscuro' ? '#00082B' : '#EAF4F8'); };
let rT; onChange(() => { syncTheme(); clearTimeout(rT); rT = setTimeout(() => { if (document.activeElement?.id !== 'note' && document.activeElement?.id !== 'nPan') render(); }, 60); });

// ---------- Arranque ----------
(async () => {
  fit();
  syncTheme();
  await boot();
  prefetch(['V2-01-Hoy-completo', 'V2-Mapa-completo-claro', 'V2-Mapa-dia0-claro', 'S-05-Reproductor', 'S-06-Completado', 'V2-06a-Trivia-sin-elegir-claro', 'V2-06c-Trivia-varias-claro', 'V2-07-Correcto-claro', 'V2-08-Pista-claro', 'V2-Trivia-fin-claro', 'V2-Cerrado']);
  const hp = new URLSearchParams(location.hash.slice(1));
  let fresh = true; try { fresh = !localStorage.getItem('cab-mvp-v1'); } catch { /* */ }
  if (fresh && !hp.get('estado')) { fill(8); save(); }
  const start = hp.get('pantalla');
  const safe = ['hoy', 'mapa', 'teodoro', 'mundos', 'cerrado'].includes(start) ? start : 'hoy';
  if (hp.get('estado')) save();
  await go(safe, {}, 'none');
  render();
})();
