// Arranque del MVP y panel de control para el equipo.
import { S, save, reset, boot, go, cur, onChange, toast, manifest, shareURL, A, activeDay, isDone, doneCount, lastDay, fase, prefetch } from './core.js';
import { DAYS, TYPES, RULES, IMG, PRENDAS, BATTERY_IDS, ENERGY_NAMES, dateOf } from './data.js';
import './flow.js';
import './map.js';
import './games.js';

const NAMES = {
  hoy: 'Hoy', teaser: 'Teaser', confirmacion: 'Inscripción confirmada', espera: 'Ya estás dentro', invitacion: 'Invitación',
  teodoro: 'Tab Teodoro', mundos: 'Mundos', mapa: 'Mapa del camino', reproductor: 'Reproductor', hub: 'Reto en familia',
  completado: '¡Terminaste! · ¿Jugamos?', trivia: 'Trivia', triviaFin: 'Resultado de la trivia', cerrado: 'Mañana seguimos',
  calificacion: '¿Te gustó?', free: 'Free · descargables', ruletaPop: 'Ruleta', ruletaPremio: 'Premio de la ruleta', premioCuarto: 'Cuarto nuevo',
  memoramaReglas: 'Memorama · reglas', memorama: 'Memorama', memoramaFin: 'Memorama · fin', adivinanzaIntro: 'Adivinanza · intro',
  adivinanza: 'Adivinanza', adivinanzaTiempo: 'Adivinanza · tiempo', adivinanzaFin: 'Adivinanza · fin', desafioIntro: 'Desafío · intro',
  desafio: 'Desafío en familia', desafioFin: 'Desafío · fin', final: 'Nochebuena', estatica: 'Vista del lienzo',
};

// ---------- Escala del teléfono ----------
function fit() {
  const w = innerWidth, h = innerHeight;
  const mobile = w <= 760;
  const panelW = w > 1100 ? 380 + 28 : 0;
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
const SCEN = [
  { t: 'Día normal', s: 'Día 9 · historia → trivia', run: () => { reset({ hoy: 9 }); fill(8); }, go: 'hoy' },
  { t: 'Día de ruleta', s: 'Día 11 · ruleta antes del cuento', run: () => { reset({ hoy: 11 }); fill(10); }, go: 'mapa' },
  { t: 'Día con sorpresa', s: 'Día 14 · memorama tras la trivia', run: () => { reset({ hoy: 14 }); fill(13); }, go: 'mapa' },
  { t: 'Adivinanza', s: 'Día 7 · sorpresa de sábado', run: () => { reset({ hoy: 7 }); fill(6); }, go: 'mapa' },
  { t: 'Desafío en familia', s: 'Día 9 · sorpresa', run: () => { reset({ hoy: 9 }); fill(8); }, go: 'mapa' },
  { t: 'Reto en familia', s: 'Día 13 · pesebre', run: () => { reset({ hoy: 13 }); fill(12); }, go: 'mapa' },
  { t: 'Va atrasado', s: 'En el día 9, hoy es el 11', run: () => { reset({ hoy: 11, bateria: 3 }); fill(8); S.bateria = 3; }, go: 'hoy' },
  { t: 'Regreso', s: 'Una semana sin abrir', run: () => { reset({ hoy: 16 }); fill(8); S.bateria = 0; S.regreso = true; }, go: 'hoy' },
  { t: 'Antes del 29', s: 'Sin inscribirse (teaser)', run: () => { reset({ hoy: 0, inscrito: false, teaserVisto: false }); S.completos = {}; }, go: 'hoy' },
  { t: 'Antes del 29', s: 'Ya inscrito · día 0', run: () => { reset({ hoy: 0, inscrito: true }); S.completos = {}; }, go: 'hoy' },
  { t: 'Se une tarde', s: 'Día 5, sin inscribirse', run: () => { reset({ hoy: 5, inscrito: false }); S.completos = {}; }, go: 'hoy' },
  { t: 'Día 1', s: 'Empieza el camino', run: () => { reset({ hoy: 1 }); fill(0); }, go: 'hoy' },
  { t: 'Usuario free', s: 'Día 13 · descargables', run: () => { reset({ hoy: 13, plan: 'free' }); fill(12); }, go: 'mapa' },
  { t: 'Nochebuena', s: 'Día 26 · llegada a Belén', run: () => { reset({ hoy: 26 }); fill(25); }, go: 'mapa' },
  { t: 'Terminó completo', s: '25 dic · 26 de 26', run: () => { reset({ hoy: 27 }); fill(26); }, go: 'hoy' },
  { t: 'Terminó incompleto', s: '25 dic · le faltan 5', run: () => { reset({ hoy: 27 }); fill(21); }, go: 'hoy' },
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
let tab = 'sim';
try { tab = localStorage.getItem('cab-tab') || 'sim'; } catch { /* sin storage */ }
btn.onclick = () => { const o = panel.classList.toggle('open'); btn.setAttribute('aria-expanded', o); document.body.classList.toggle('panel-open', o); if (o) render(); };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function dayLabel(n) { if (n <= 0) return 'Antes del 29 nov'; if (n >= 27) return 'Del 25 dic al 6 ene'; const f = dateOf(n); return `Día ${n} · ${f.dow.slice(0, 3).toLowerCase()} ${f.dd} ${f.mes.slice(0, 3).toLowerCase()}`; }

function render() {
  if (window.innerWidth <= 1100 && !panel.classList.contains('open')) return;
  const act = activeDay();
  const name = cur ? (NAMES[cur.name] || cur.name) : '—';
  const head = `<div class="p-head"><h1>Camino a Belén · MVP</h1><p>Toca la app como lo haría una familia. Aquí cambias el día y el estado.</p></div>
  <div class="p-tabs" role="tablist">${[['sim', 'Simular'], ['esc', 'Escenarios'], ['pant', 'Pantallas'], ['notas', `Notas${S.huecos.length ? ' · ' + S.huecos.length : ''}`]].map(([k, l]) => `<button class="p-tab" role="tab" aria-selected="${tab === k}" data-tab="${k}">${l}</button>`).join('')}</div>`;
  const now = `<div class="p-now"><b>${esc(name)}</b>${fase() === 'antes' ? 'Antes del 29 de noviembre' : fase() === 'despues' ? 'Después de Nochebuena' : `Hoy es el día ${S.hoy} · ${act == null ? 'todo listo por hoy' : act === S.hoy ? 'toca el día ' + act : 'va en el día ' + act}`}
    <div><span class="chip-stat"><img src="${A(BATTERY_IDS[S.bateria])}" alt="">${S.bateria}/5 · ${ENERGY_NAMES[S.bateria]}</span><span class="chip-stat"><img src="${A(IMG.pan)}" alt="">${S.panes} panes</span><span class="chip-stat">${doneCount()}/26 días</span></div></div>`;
  let body = '';
  if (tab === 'sim') {
    body = `${now}
    <div class="p-sec">El día</div>
    <div class="p-row"><label for="dSel">Calendario</label><select id="dSel">${Array.from({ length: 28 }, (_, n) => `<option value="${n}" ${n === S.hoy ? 'selected' : ''}>${dayLabel(n)}</option>`).join('')}</select></div>
    <div class="p-row"><label for="pSel">Completó hasta</label><select id="pSel">${Array.from({ length: 27 }, (_, n) => `<option value="${n}" ${n === Math.max(0, ...Object.keys(S.completos).filter(k => isDone(+k)).map(Number)) ? 'selected' : ''}>${n ? 'Día ' + n : 'Ninguno'}</option>`).join('')}</select></div>
    <div class="p-btns"><button class="p-btn main" data-act="mid">Avanzar a medianoche</button><button class="p-btn" data-act="week">7 días sin abrir</button></div>
    <div class="p-sec">La familia</div>
    <div class="p-row"><label>Plan</label><span class="seg">${['premium', 'free'].map(v => `<button data-plan="${v}" aria-pressed="${S.plan === v}">${v === 'premium' ? 'Premium' : 'Free'}</button>`).join('')}</span></div>
    <div class="p-row"><label>Tema</label><span class="seg">${['claro', 'oscuro'].map(v => `<button data-tema="${v}" aria-pressed="${S.tema === v}">${v === 'claro' ? '☀ Claro' : '☾ Oscuro'}</button>`).join('')}</span></div>
    <div class="p-row"><label>Inscrito</label><span class="seg">${[['1', 'Sí'], ['0', 'No']].map(([v, l]) => `<button data-ins="${v}" aria-pressed="${S.inscrito === (v === '1')}">${l}</button>`).join('')}</span></div>
    <div class="p-row"><label for="bSel">Batería</label><select id="bSel">${[5, 4, 3, 2, 1, 0].map(v => `<option value="${v}" ${v === S.bateria ? 'selected' : ''}>${v} de 5 · ${ENERGY_NAMES[v]}</option>`).join('')}</select></div>
    <div class="p-row"><label for="nPan">Panes</label><input id="nPan" type="number" min="0" step="5" value="${S.panes}"></div>
    <div class="p-row"><label for="fSel">Ruleta cae en</label><select id="fSel">${[['', 'Al azar'], ['prenda', 'Prenda de la semana'], ['panes', '20 panes'], ['manzana', 'Manzana'], ['cuarto', 'Cuarto nuevo']].map(([v, l]) => `<option value="${v}" ${S.forzarPremio === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    <div class="p-btns"><button class="p-btn" data-act="share">Copiar enlace a este estado</button><button class="p-btn" data-act="reset">Empezar de cero</button></div>
    <div class="p-sec">Reglas que usa el MVP</div>
    <ul class="p-list">
      <li><b>Panes:</b> contenido +${RULES.panes.contenidoPremium} premium / +${RULES.panes.contenidoFree} free · trivia +${RULES.panes.trivia} · sorpresa +${RULES.panes.sorpresa} · ruleta ${RULES.panes.ruleta}</li>
      <li><b>Batería:</b> contenido +2 · la trivia la llena · cada día sin Adviento −1 · nunca bloquea</li>
      <li><b>Ruleta:</b> días ${RULES.ruleta.join(', ')} · al iniciar el día, antes del contenido</li>
      <li><b>Sorpresa:</b> ${Object.entries(RULES.sorpresa).map(([d, g]) => `${d} ${g}`).join(' · ')} · nunca el mismo día que la ruleta</li>
      <li><b>Atrasado:</b> puede hacer varios días seguidos hasta alcanzar hoy · <b>Regreso:</b> ${RULES.regresoDias}+ días sin abrir</li>
    </ul>`;
  } else if (tab === 'esc') {
    body = `${now}<div class="p-sec">Salta a una situación</div><div class="p-scen">${SCEN.map((s, i) => `<button class="p-btn" data-scen="${i}">${esc(s.t)}<small>${esc(s.s)}</small></button>`).join('')}</div>
    <div class="p-sec">Ir directo</div><div class="p-btns">${['hoy', 'mapa', 'teodoro', 'mundos', 'cerrado'].map(k => `<button class="p-btn" data-go="${k}">${NAMES[k]}</button>`).join('')}</div>`;
  } else if (tab === 'pant') {
    const SECTIONS = [[3380, '1 · Antes del 29 de noviembre'], [5888, '2 · Un día normal'], [8908, '3 · Día de ruleta'], [12598, '4 · Juegos sorpresa'], [15346, '5 · Energía de Teodoro'], [18126, '6 · Dónde vive el Adviento'], [22120, '7 · Durante el camino'], [28415, '8 · Nochebuena'], [30923, '9 · Piezas'], [33579, '10 · Dirección de arte'], [0, '0 · Empieza aquí']];
    const man = manifest(); const groups = {};
    Object.entries(man).forEach(([id, s]) => { const sec = SECTIONS.filter(x => x[0] <= s.y).sort((a, b) => b[0] - a[0])[0][1]; (groups[sec] ??= []).push([id, s]); });
    body = `<p class="p-empty">Así están en el lienzo, sin lógica. Útil para comparar con el flujo.</p>` + [...SECTIONS].sort((a, b) => a[0] - b[0]).map(([, sec]) => `<div class="p-sec">${sec}</div><ul class="p-list">${(groups[sec] || []).sort((a, b) => a[1].y - b[1].y || a[1].x - b[1].x).filter(([, s]) => s.w <= 400 || s.h > 1000 || s.w > 400).map(([id, s]) => `<li><button data-file="${id}"><b>${esc(s.title.split(' · ')[0])}</b><small>${esc(s.title.split(' · ').slice(1).join(' · ') || id)}</small></button></li>`).join('')}</ul>`).join('');
  } else {
    const key = cur?.name || 'hoy';
    const notes = Object.entries(S.notas).filter(([, v]) => v.trim());
    body = `<div class="p-sec">Nota sobre «${esc(NAMES[key] || key)}»</div>
    <textarea class="p-note" id="note" placeholder="¿Qué mejorarías aquí? ¿Falta una pantalla?">${esc(S.notas[key] || '')}</textarea>
    <div class="p-btns"><button class="p-btn main" data-act="copyNotes">Copiar todo para el equipo</button><button class="p-btn" data-act="dlNotes">Descargar .md</button></div>
    <div class="p-sec">Notas (${notes.length})</div>
    ${notes.length ? `<ul class="p-list">${notes.map(([k, v]) => `<li><b>${esc(NAMES[k] || k)}</b><small>${esc(v)}</small></li>`).join('')}</ul>` : '<p class="p-empty">Aún no hay notas.</p>'}
    <div class="p-sec">Huecos encontrados (${S.huecos.length})</div>
    <p class="p-empty">Se anotan solos cuando alguien toca algo que el lienzo no define.</p>
    ${S.huecos.length ? `<ul class="p-list">${S.huecos.map(h => `<li><b>${esc(h.label)}</b><small>en ${esc(NAMES[h.where] || h.where)}</small></li>`).join('')}</ul><div class="p-btns"><button class="p-btn" data-act="clearH">Vaciar huecos</button></div>` : ''}`;
  }
  panel.innerHTML = head + `<div class="p-body">${body}</div>`;
}

panel.addEventListener('click', e => {
  const t = e.target.closest('button'); if (!t) return;
  if (t.dataset.tab) { tab = t.dataset.tab; try { localStorage.setItem('cab-tab', tab); } catch { /* */ } render(); return; }
  if (t.dataset.plan) { S.plan = t.dataset.plan; save(); toast(S.plan === 'free' ? 'Ahora eres free' : 'Ahora eres premium'); return; }
  if (t.dataset.tema) { S.tema = t.dataset.tema; save(); go(cur?.name === 'estatica' ? 'hoy' : cur?.name || 'hoy', cur?.params || {}, 'fade'); return; }
  if (t.dataset.ins) { S.inscrito = t.dataset.ins === '1'; save(); go('hoy', {}, 'fade'); return; }
  if (t.dataset.scen) { const s = SCEN[+t.dataset.scen]; s.run(); save(); go(s.go, {}, 'fade'); toast(s.t, s.s); closeMobile(); return; }
  if (t.dataset.go) { go(t.dataset.go, {}, 'fade'); closeMobile(); return; }
  if (t.dataset.file) { go('estatica', { file: t.dataset.file, back: cur?.name !== 'estatica' ? cur?.name : 'hoy', backParams: cur?.params }, 'fade'); closeMobile(); return; }
  const a = t.dataset.act;
  if (a === 'mid') advance(1);
  if (a === 'week') advance(7);
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
  if (t.id === 'bSel') { S.bateria = +t.value; save(); go(cur?.name || 'hoy', cur?.params || {}, 'none'); }
  if (t.id === 'nPan') { S.panes = Math.max(0, +t.value || 0); save(); }
  if (t.id === 'fSel') { S.forzarPremio = t.value; save(); }
});
panel.addEventListener('input', e => { if (e.target.id === 'note') { S.notas[cur?.name || 'hoy'] = e.target.value; try { localStorage.setItem('cab-mvp-v1', JSON.stringify(S)); } catch { /* */ } } });
function closeMobile() { if (innerWidth <= 1100) { panel.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); document.body.classList.remove('panel-open'); } }
function notesMarkdown() {
  const lines = ['# Camino a Belén · notas del MVP', '', `_${new Date().toLocaleString('es')}_`, '', '## Notas por pantalla', ''];
  Object.entries(S.notas).filter(([, v]) => v.trim()).forEach(([k, v]) => lines.push(`- **${NAMES[k] || k}:** ${v.trim()}`));
  lines.push('', '## Huecos (tocados sin diseño)', '');
  S.huecos.forEach(h => lines.push(`- ${h.label} — _${NAMES[h.where] || h.where}_`));
  return lines.join('\n');
}
let rT; onChange(() => { clearTimeout(rT); rT = setTimeout(() => { if (document.activeElement?.id !== 'note') render(); }, 60); });

// ---------- Arranque ----------
(async () => {
  fit();
  document.documentElement.dataset.theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  await boot();
  // precarga de lo más usado para que las transiciones no esperen
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
