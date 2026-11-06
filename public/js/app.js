// Arranque del MVP y panel de control para el equipo.
// El panel sigue el orden del lienzo (secciones 1 a 8) para que diseño y prueba hablen el mismo idioma.
import { S, save, reset, boot, go, cur, onChange, nota, manifest, shareURL, A, activeDay, isDone, doneCount, lastDay, fase, GRACIA_FIN, cuentaGracia, vistos, puedeDia, prefetch, logical, flowScreens, sections } from './core.js';
import { RULES, IMG, PRENDAS, ENERGY_NAMES, TEODORO_IDS, dateOf, hasTrivia } from './data.js';
import { musicaPara } from './musica.js';
import './flow.js';
import './map.js';
import './games.js';
import { devActivo, alCambiar, activar as modoDev, usandoApp, usar as usarApp } from './dev.js';
import { pintarDev } from './dev-panel.js';

const NAMES = {
  hoy: 'Hoy', teaser: 'Teaser', retoSlides: 'Slides del reto', listo: '¡Ya estás dentro!', invitacion: 'Invitación',
  teodoro: 'Tab Teodoro', mundos: 'Mundos', mapa: 'Mapa del camino', reproductor: 'Reproductor', hub: 'Reto en familia',
  completado: '¿Jugamos a la trivia?', trivia: 'Trivia', triviaFin: 'Resultado de la trivia', cerrado: 'Mañana seguimos',
  calificacion: '¿Te gustó?', free: 'Free · descargables', ruletaPop: 'Ruleta', ruletaPremio: 'Premio de la ruleta', premioCuarto: 'Cuarto nuevo',
  memoramaReglas: 'Memorama · antes de jugar', memorama: 'Memorama', memoramaFin: 'Memorama · fin', adivinanzaIntro: 'Adivinanza · antes de jugar',
  adivinanza: 'Adivinanza', adivinanzaTiempo: 'Adivinanza · se acabó el tiempo', adivinanzaFin: 'Adivinanza · fin', desafioIntro: 'Desafío · antes de empezar',
  desafio: 'Desafío en familia', desafioFin: 'Desafío · cumplido', juegoIntro: 'Juego en familia', juegoPasos: 'Juego · así se juega', juegoCarta: 'Juego · a jugar', juegoFin: 'Juego · ¡ganaron todos!', final: 'Nochebuena', estatica: 'Vista del lienzo',
};
// Sección del lienzo de cada pantalla (para «Dónde estás»)
const SECTION_OF = name => {
  if (['teaser', 'listo', 'invitacion'].includes(name)) return 1;
  if (name === 'hoy') return fase() === 'antes' ? 1 : (S.regreso && fase() !== 'recuerdo') || (activeDay() ?? 99) < lastDay() ? 5 : 6;
  if (['teodoro', 'mundos'].includes(name)) return fase() === 'antes' ? 1 : 6;
  if (['ruletaPop', 'ruletaPremio', 'premioCuarto'].includes(name)) return 3;
  if (/^(memorama|adivinanza|desafio)/.test(name)) return 4;
  if (name === 'free') return 7;
  if (name === 'final') return 8;
  return 2;
};
// Nombres cortos; la posición (y) sale de las notas del lienzo al arrancar
const SECTIONS = [
  [1, 'Antes del 29 de noviembre', 3380], [2, 'Un día normal', 6128], [3, 'Día de ruleta', 9148], [4, 'Juegos sorpresa', 12838],
  [5, 'La energía de Teodoro', 15586], [6, 'Dónde vive el Adviento', 18366], [7, 'Durante el camino', 22360], [8, 'Nochebuena y después', 28655],
];
const syncSections = () => sections().forEach(s => { const row = SECTIONS.find(r => r[0] === s.n); if (row) row[2] = s.y; });
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
  for (let n = 1; n <= upto; n++) S.completos[n] = hasTrivia(n) ? { contenido: true, trivia: true, estrellas: STAR_PATTERN[n - 1] } : { contenido: true };
  S.ruletas = {}; S.prendas = []; S.sorpresas = {}; S.ruletaPendiente = {};
  RULES.ruleta.forEach((d, i) => { if (d <= upto) { S.ruletas[d] = PRENDAS[i].id; S.prendas.push(PRENDAS[i].id); } });
  Object.keys(RULES.sorpresa).forEach(d => { if (+d <= upto) S.sorpresas[d] = 'hecha'; });
  S.panes = 60 + upto * 22;
  Object.assign(S, opts);
}
// escenarios del camino: familia ya inscrita (el estado inicial de la app es «sin inscribirse»)
// la mañana del día: cada noche Teodoro bajó una rayita (con el día de hoy hecho, ya se recargó)
const pilaDe = (hoy, done) => hoy < 1 || hoy > 26 || done >= hoy ? 5 : Math.max(0, 4 - Math.max(0, hoy - 1 - done));
const day = (hoy, done, extra = {}) => () => { reset({ hoy, inscrito: true, teaserVisto: true, bateria: pilaDe(hoy, done), ...extra }); fill(done); Object.assign(S, extra); };

// Recorridos: uno por cada caso del lienzo. «covers» = pantallas del lienzo que deja ver.
const REC = [
  { sec: 1, t: 'Sin inscribirse', mira: 'Inicio con vidrio empañado → teaser → «Únete al reto» → «¡Ya estás dentro!» → el vidrio se limpia', run: () => { reset({ hoy: -1, inscrito: false, teaserVisto: false }); S.completos = {}; }, go: 'hoy', covers: ['P-Hoy-antes-d', 'P-Teaser-a', 'P-Listo-a'] },
  { sec: 1, t: 'Slides del reto (versión posterior)', mira: 'Prende los slides y deja la app sin inscribirse: «Únete al reto» → 4 slides → «¡Ya estás dentro!»', run: () => { reset({ hoy: -1, inscrito: false, teaserVisto: false, slidesReto: true }); S.completos = {}; }, go: 'hoy', covers: [] },
  { sec: 1, t: 'Ya inscrito', mira: 'Teodoro de espaldas mirando el pesebre · «Saber más» abre los Mundos con la cuenta regresiva', run: () => { reset({ hoy: -1, inscrito: true }); S.completos = {}; }, go: 'hoy', covers: ['P-Hoy-despues-d', 'V2-Invitacion-claro'] },
  { sec: 1, t: 'Tab Teodoro antes del 29', mira: 'Ícono de Adviento junto a Teodoro, sin inscribirse', run: () => { reset({ hoy: -1, inscrito: false, teaserVisto: true }); S.completos = {}; }, go: 'teodoro', covers: ['V2-Pre-Teodoro-claro'] },
  { sec: 1, t: 'El intro (28 de noviembre)', mira: 'Un día antes del día 1: el mapa ya se ve y Teodoro espera en el intro (la casa) · video y trivia de presentación con sus 3 estrellas · al día siguiente camina al día 1', run: () => { reset({ hoy: 0, inscrito: true, teaserVisto: true }); S.completos = {}; }, go: 'mapa', covers: [] },
  { sec: 2, t: 'Un día con trivia', mira: 'Día 17 · mapa → historia → ¿jugamos? → 5 preguntas → mañana seguimos', run: day(17, 16), go: 'hoy', covers: ['S-03-Mapa', 'S-05-Reproductor', 'S-06-Completado', 'V2-06a-Trivia-sin-elegir-claro', 'V2-Trivia-fin-claro', 'V2-Cerrado'] },
  { sec: 2, t: 'Un día sin trivia', mira: 'Día 10 · mapa → historia → un paso más hacia Belén → mañana seguimos', run: day(10, 9), go: 'hoy', covers: [] },
  { sec: 2, t: 'Equivocarse en la trivia', mira: 'Toca una respuesta mala: pista sutil y reintento', run: day(17, 16), go: 'mapa', covers: ['V2-08-Pista-claro', 'V2-08b-Reintento-claro'] },
  { sec: 2, t: 'Reto en familia', mira: 'Día 13 · hub: los pasos del reto, el pesebre para colorear y la canción', run: day(13, 12), go: 'mapa', covers: ['S-04-Hub-familia', 'S-04c-Imprimible'] },
  { sec: 2, t: 'Tocar un día cerrado', mira: 'Toca un día que aún no llega: globo con la fecha en que se abre', run: day(10, 9), go: 'mapa', covers: ['S-03d-Mapa-dia-cerrado'] },
  { sec: 2, t: 'Repetir un día ya hecho', mira: 'Toca un día con ✓ en el mapa: ver otra vez o repetir la trivia', run: day(10, 9), go: 'mapa', covers: ['S-03c-Mapa-dia-pasado'] },
  { sec: 3, t: 'Día de ruleta', mira: 'Día 11 · toca la ruleta del mapa: gira y da premio; «Volver al camino» deja en el mapa', run: day(11, 10), go: 'mapa', covers: ['S-03f-Mapa-dia11', 'S-05b-Ruleta-pop', 'S-05c-Ruleta-premio'] },
  { sec: 3, t: 'Premio: cuarto nuevo', mira: 'La ruleta cae en la casa: cuarto de Nazaret', run: day(11, 10, { forzarPremio: 'cuarto' }), go: 'mapa', covers: ['S-09-Premio-cuarto', 'V3-Teodoro-nazaret'] },
  { sec: 4, t: 'Memorama', mira: 'Día 3 · tras la trivia: «Hoy toca Memorama»', run: day(3, 2), go: 'mapa', covers: ['V2-Trivia-fin-sorpresa-claro', 'V2-Memorama-reglas-claro', 'V2-Memorama-claro', 'V2-Memorama-fin-claro'] },
  { sec: 4, t: 'Adivinanza', mira: 'Día 6 (sin trivia) · tras la historia: «Hoy toca Adivinanza» · toca el reloj para ver «se acabó el tiempo»', run: day(6, 5), go: 'mapa', covers: ['V2-Trivia-fin-sorpresa-adivinanza-claro', 'V2-Adivinanza-intro-claro', 'V2-Adivinanza-claro', 'V2-Adivinanza-tiempo-claro', 'V2-Adivinanza-fin-claro'] },
  { sec: 4, t: 'Desafío en familia', mira: 'Día 9 · «Hoy toca Desafío» · sacar otra carta (Avemaría) · ¡lo hicimos!', run: day(9, 8), go: 'mapa', covers: ['V2-Trivia-fin-sorpresa-desafio-claro', 'V2-Desafio-intro-claro', 'V2-Desafio-claro', 'V2-Desafio-carta2-claro', 'V2-Desafio-fin-claro'] },
  { sec: 4, t: 'Teodoro dice', mira: 'Día 7 · juego en familia: portada, 3 pasos, órdenes (una de cada tres con truco) y «¡Ganaron todos!»', run: day(7, 6), go: 'mapa', covers: ['J-teodoro-intro', 'J-teodoro-paso1', 'J-teodoro-paso2', 'J-teodoro-paso3', 'J-teodoro-carta', 'J-teodoro-especial', 'J-teodoro-fin'] },
  { sec: 4, t: 'Teléfono roto', mira: 'Día 14 · mantén la carta para ver la palabra de la Biblia; suéltala para taparla', run: day(14, 13), go: 'mapa', covers: ['J-telefono-intro', 'J-telefono-paso1', 'J-telefono-paso2', 'J-telefono-paso3', 'J-telefono-carta', 'J-telefono-ver', 'J-telefono-fin'] },
  { sec: 4, t: 'Busquen la estrella', mira: 'Día 21 · mantén la carta para ver el escondite · «¡La encontraron!» · luego el Memorama', run: day(21, 20), go: 'mapa', covers: ['J-estrella-intro', 'J-estrella-paso1', 'J-estrella-paso2', 'J-estrella-paso3', 'J-estrella-carta', 'J-estrella-ver', 'J-estrella-especial', 'J-estrella-fin'] },
  { sec: 5, t: 'Va atrasado', mira: 'En el día 9, hoy es el 11: puede ponerse al día', run: day(11, 8, { bateria: 3 }), go: 'hoy', covers: ['R-Hoy-completo'] },
  { sec: 5, t: 'Regreso tras una semana', mira: 'Teodoro le guardó el camino · batería en 0', run: day(16, 8, { bateria: 0, regreso: true, sinCaminar: 7 }), go: 'hoy', covers: ['V2-10-Regreso'] },
  { sec: 5, t: 'Pila en 0', mira: '5 días sin caminar: Teodoro desesperado buscándote', run: day(14, 8, { bateria: 0, sinCaminar: 5 }), go: 'hoy', covers: [] },
  { sec: 5, t: '10 días sin caminar', mira: 'La tragedia chistosa llega al final: Teodoro congelado en un bloque de hielo', run: day(19, 8, { bateria: 0, sinCaminar: 10 }), go: 'hoy', covers: [] },
  { sec: 5, t: 'Teodoro cansado', mira: 'Batería 2 de 5 · en el mapa toca la batería: cómo está Teodoro', run: day(10, 9, { bateria: 2 }), go: 'mapa', covers: ['S-01-Energia', 'S-03e-Mapa-energia'] },
  { sec: 6, t: 'Hoy, tab Teodoro y Mundos', mira: 'Dónde aparece el camino dentro de la app', run: day(9, 8), go: 'teodoro', covers: ['R-Hoy-completo', 'V3-Teodoro', 'V2-02-Mundos-claro'] },
  { sec: 6, t: 'Sin mascota', mira: 'Sin pestaña Teodoro: Hoy → Misiones Diarias «Mundos» → Adviento → el mapa · atrás vuelve a Hoy', run: day(9, 8, { mascota: false }), go: 'hoy', covers: ['R-Hoy', 'R-Misiones', 'R-Mundos'] },
  { sec: 7, t: 'Free · día de pago', mira: 'Día 13 · candado en los días de pago; «Desbloquear el día» abre Premium o el Pase de Adviento (US$19,99)', run: day(13, 12, { plan: 'free' }), go: 'mapa', covers: ['V2-24-Dia-completo-claro'] },
  { sec: 7, t: 'Free · día gratis', mira: 'Día 11 (miércoles) · gancho gratis con trivia y ruleta; los días de pago con candado', run: day(11, 10, { plan: 'free' }), go: 'mapa', covers: [] },
  { sec: 7, t: 'Pase de Adviento', mira: 'Día 13 · compró el Pase: los 26 días y sus extras', run: day(13, 12, { plan: 'pase' }), go: 'mapa', covers: [] },
  { sec: 7, t: 'Primer día', mira: 'Día 1 · el camino recién empieza', run: day(1, 0), go: 'hoy', covers: ['V2-Mapa-completo-claro'] },
  { sec: 8, t: 'Nochebuena', mira: 'Día 26 · llegada a Belén · ver el nacimiento y compartir', run: day(26, 25), go: 'mapa', covers: ['V2-Mapa-d24-claro', 'V2-Final-claro', 'V2-Final-compartir-claro'] },
  { sec: 8, t: 'Terminó completo', mira: '25 de diciembre · 26 de 26 días', run: day(27, 26), go: 'hoy', covers: [] },
  { sec: 8, t: 'Terminó incompleto', mira: '25 de diciembre · le faltan 5 días', run: day(27, 21), go: 'hoy', covers: [] },
  { sec: 8, t: 'Gracia · a medias', mira: '30 de diciembre · lleva 14 de 26: «Seguir con el día 15» y «Quedan 8 días para llegar a Belén»', run: day(32, 14), go: 'hoy', covers: [] },
  { sec: 8, t: 'Gracia · último día', mira: '6 de enero · lleva 20 de 26: «Último día para llegar a Belén»', run: day(39, 20), go: 'hoy', covers: [] },
  { sec: 8, t: 'Gracia · sin empezar', mira: '2 de enero · inscrito sin días hechos: «Teodoro te espera»', run: day(35, 0), go: 'hoy', covers: [] },
  { sec: 8, t: 'Gracia · sin inscribirse', mira: '28 de diciembre: pop-up «¡Aún llegas a Belén!»', run: () => { reset({ hoy: 30, inscrito: false }); S.completos = {}; }, go: 'hoy', covers: [] },
  { sec: 8, t: 'Recuerdo · 7 de enero', mira: 'Lleva 14 de 26: «Caminaste 14 días con Teodoro»; lo que faltó queda apagado', run: day(40, 14), go: 'hoy', covers: [] },
  { sec: 8, t: 'Se une tarde', mira: 'Día 5 sin inscribirse: «¡Ya salimos! ¿Vienes?»', run: () => { reset({ hoy: 5, inscrito: false }); S.completos = {}; }, go: 'hoy', covers: [] },
];
// Lo que el MVP decidió por su cuenta (para revisarlo con el equipo)
const DECISIONES = [
  'Inicio real de Theo (lienzo «Inicio real», 21 oct): el destacado de Adviento va primero en el héroe, que se desliza entre tres destacados; Misiones Diarias y las filas de cuentos se deslizan de lado.',
  'Misiones Diarias: «Mundos» va primera del 29 nov al 26 dic y queda «✓ Hecha» al terminar el día. Abre Mundos desde Hoy; atrás vuelve a Hoy.',
  'Sin mascota (panel: «Sin mascota»): la barra no trae la pestaña Teodoro y todo lo que llevaba a Teodoro lleva a Hoy.',
  'La barra de pestañas es siempre la del design system de Theo (tabbar.js): clara, ilustrada y la misma en todas las pantallas, también en modo oscuro.',
  'Los días 18 y 24 tienen ruleta (en el mapa) y juego sorpresa (al final de la trivia): la regla «cada 3 días, y así sigue» cae en días de ruleta.',
  'Títulos de la hoja de energía por nivel (dormido, durmiéndose, cansadito, tranquilo, travieso, feliz): el lienzo solo trae el de 5 de 5.',
  'Escena de Teodoro en las 3 piezas del camino (destacado y pieza grande de Hoy, tab Teodoro) según los días sin caminar, de la fiesta a una tragedia chistosa que termina congelado: 0 felicidad explosiva · 1 ¡vamos a la aventura! · 2 listo para salir · 3 café tipo Mona Lisa · 4 impaciente · 5 desesperado (pila en 0) · 6 telaraña · 7 musgo · 8 ventisca · 9 carámbanos · 10 bloque glacial. «Reactivado» la primera vez que la pila sube. Día y noche según el tema. En el mapa Teodoro no cambia.',
  'Plan (US y LATAM igual): el reto es de pago con Theo Premium o el Pase de Adviento (US$19,99, pago único hasta el 6 de enero). Free tiene gratis los días 0 y 1 y dos ganchos por semana, domingo y miércoles: 0, 1, 4, 8, 11, 15, 18, 22, 25 y 26.',
  'Free en un día de pago: candado en el mapa, la hoja dice «Desbloquear el día» y abre la ventana de Premium con el Pase como segunda opción. Teodoro igual avanza con el calendario y solo se cansa por los días gratis que no hicieron.',
  'Extras del reto (imprimible y canción) piden Premium o el Pase a usuarios free.',
  'El Desafío abierto desde el hub del reto no da panes extra: se ganan al marcar «¡Lo hicimos!» en el hub.',
  'Repetir la trivia de un día pasado: si mejora las estrellas gana +10 panes; si no, solo cuenta como práctica.',
  'Al terminar la trivia, Teodoro camina en el mapa al día siguiente y luego aparece «Mañana seguimos».',
  'Solo los días 1, 2, 3, 4, 9, 11, 17, 18 y 24 tienen trivia (cronograma de contenido). Los demás se completan con la historia, sin estrellas; si toca sorpresa (6, 12, 15, 21) se abre al terminar la historia.',
  'Trivia: 5 preguntas por día, todas con 4 respuestas; revisión pastoral hecha (exactitud bíblica, una sola respuesta válida, lenguaje para 5–8 años). Falta la aprobación final del equipo de contenido.',
  'Estrellas: 5 de 5 = 3 estrellas · 3 o 4 = 2 · menos = 1. Solo cuenta el primer intento de cada pregunta.',
  'Ruleta: 10 casillas (7 panes, manzana, prenda de la semana, cuarto). Prendas: gorro, bufanda, bolso y cama de paja.',
  'La historia del reproductor dura 9 segundos para poder probar rápido.',
  'Ruleta: la manzana le da +1 de energía a Teodoro; la prenda de la semana sale más seguido si aún no la tiene; el cuarto no se repite.',
  'Pop-ups sobre la pantalla real: teaser, final de trivia, ruleta y premios, «Se acabó el tiempo» y «Mañana seguimos».',
  'Hojas de página (se cierran deslizando): free sobre el reto y calificación sobre el mapa.',
  'Pantalla completa a propósito: el reto en familia (es un destino con contenido, extras y un juego dentro: en hoja quedaría apretado y se perdería al deslizar) y la invitación (simula salir a WhatsApp/iMessage; en la app real es la hoja de compartir del sistema).',
  'Pantalla completa también: la llegada a Belén y la confirmación de inscripción (1,6 s y sigue sola). Todos los premios de la ruleta, también el cuarto nuevo, son pop-ups sobre el mapa con «Volver al camino».',
  'Calificar: al terminar cada video o canción, en «¡Terminaste!» (5 estrellas opcionales y Compartir); el día ya no se califica al cerrarlo.',
  'Atrasado: tras ver la historia de un día puede seguir con la del siguiente; las trivias quedan pendientes y se pueden hacer después.',
  'Domingo: la misión «Evangelio del día» de Hoy es el mismo Evangelio del camino; lleva al camino y se marca hecha con él (no se hace dos veces).',
  'Ruleta en el mapa: «Sorpresa de hoy» / «Te espera» (no «Hoy»); todas las casillas premian, así no se lee como azar.',
  'Monedas: dentro del camino solo hay panes, estrellas y energía de Teodoro. Racha y XP son de la app Theo y no se nombran en el camino.',
  '«¡Ya casi salimos!» solo en la última semana; antes dice «¡Prepárate para salir!».',
  'Cada domingo, una pregunta de la trivia es del Evangelio del día (Adviento 2026, ciclo B: Mc 13 · Mc 1 · Jn 1 · Lc 1).',
  'Letreros del mapa: al tocarlos explican su palabra (Maranatha = «Ven, Señor Jesús», Shemá = «Escucha», Jaire = «Alégrate», Acogida).',
  '«¿Te gustó?»: solo las tres caritas, sin campo de texto.',
  'Ruleta sin mínimo de estrellas: los días 4, 11, 18 y 24 se juega al tocar la ruleta dibujada en el mapa (ya no sale sola al empezar el día); «Ver video» abre directo el video.',
  'Trivia: todas las preguntas con 4 respuestas (a las de imagen se les sumó una alternativa claramente incorrecta).',
  'Racha = la que traía en Theo (3) + días seguidos del camino; si se salta un día, cuenta desde ahí.',
];
const PENDIENTES_LIENZO = [
  'PREGUNTA ABIERTA · Días 7 y 21 «Juego con Teodoro»: el cronograma no dice qué juego es. Hoy abren un video con «Jugar». Falta definir el juego (o si es un juego que ya existe: Memorama, Adivinanza, Desafío).',
  'Escenas de los días 1 y 2 (Arte 5 las marca como «FALTA»).',
  'Ícono del día 25 · Video (Íconos del camino: «Aún sin ícono»).',
  'Cuarto de Teodoro: nombre, racha y panes van pintados en la imagen; el MVP los tapa con los datos reales. Conviene exportar el cuarto sin esos datos.',
  'Cuarto clásico: Teodoro va dentro de la imagen y no cambia de pose; en el de Nazaret sí. Conviene exportarlo suelto.',
  'Fuera de Theo Quest a propósito: pestañas Explorar, Música y Favoritos; villancicos y oraciones generales; paywall «Ver Theo Premium».',
];

/** Cambios del panel (día, tema, batería): se repinta la misma pestaña en el mismo punto del scroll,
 *  para ir viendo cómo cambia esa sección día a día. Desde cualquier otra pantalla se vuelve a Hoy, como siempre. */
function repintar(anim = 'fade') {
  const misma = ['hoy', 'teodoro', 'mundos', 'mapa'].includes(cur?.name);
  go(misma ? cur.name : 'hoy', misma ? cur.params || {} : {}, anim, { scrollTop: misma ? cur.layer.scrollTop : 0 });
}

function advance(k) {
  // se guarda cómo estaba Teodoro este día: si luego se vuelve atrás en el panel, vuelve igual
  S.diaGuardado = { ...(S.diaGuardado || {}), [S.hoy]: { bateria: S.bateria, sinCaminar: S.sinCaminar || 0, manzana: !!S.manzana, ultimoJugado: S.ultimoJugado } };
  // Teodoro se cansa cada noche del 29 nov al 6 ene (también en la gracia, si falta algo): amanece con una rayita menos y terminar el día lo recarga.
  // Los días sin caminar se cuentan aparte para su escena. Antes del 29 y en el recuerdo no cuenta.
  let baja = 0, noches = 0;
  for (let i = 0; i < k; i++) {
    const d = S.hoy + i, m = d + 1; // m: el día que amanece
    if (S.inscrito && d >= 1 && d <= GRACIA_FIN && (d <= 26 || vistos() < 26) && (d > 26 || puedeDia(d)) && !(i === 0 && S.ultimoJugado === S.hoy)) baja++;
    if (S.inscrito && m >= 1 && m <= GRACIA_FIN && (m <= 26 || vistos() < 26) && (m > 26 || puedeDia(m))) noches++;
  }
  S.sinCaminar = (S.sinCaminar || 0) + baja; // días seguidos sin caminar: la escena de Teodoro sigue exagerándose hasta 10
  // la manzana guardada de la ruleta le ahorra a Teodoro un día de cansancio (solo si se saltó un día)
  if (baja && S.manzana) { noches--; S.manzana = false; }
  S.bateria = Math.max(0, S.bateria - Math.max(0, noches));
  S.recarga = null; // la recarga de ayer ya no se anima
  const antes = S.hoy;
  S.hoy = Math.min(GRACIA_FIN + 1, S.hoy + k);
  // «¡Te guardé el camino!»: 5 días o más sin caminar, una vez por ausencia, en el camino y la gracia (no en el recuerdo)
  if (S.inscrito && S.hoy >= 1 && S.hoy <= GRACIA_FIN && (S.sinCaminar || 0) >= RULES.regresoDias && !S.regresoAvisado) { S.regreso = true; S.regresoAvisado = true; }
  save();
  nota(antes <= 0 && S.hoy >= 1 ? '¡Hoy empieza el camino!' : S.hoy === 0 ? '28 de noviembre' : k === 1 ? 'Pasó la medianoche' : `Pasaron ${k} días`, S.hoy === 0 ? 'Ya se puede ver el intro en el mapa' : S.hoy === 27 ? 'Ya es Navidad' : S.hoy > GRACIA_FIN ? 'El camino quedó como recuerdo' : S.hoy > 27 ? cuentaGracia() : `Hoy es el día ${S.hoy}`);
  repintar();
}

/** Volver un día atrás en el panel: Teodoro (escena y batería) vuelve a como estaba ese día. */
function retroceder() {
  if (S.hoy <= -1) return; // -1: antes del 28 · 0: el 28, un día antes (se abre el intro)
  const dia = S.hoy - 1, g = S.diaGuardado?.[dia];
  if (g) Object.assign(S, g);
  else if (S.inscrito && dia >= 1 && S.ultimoJugado !== dia && (S.sinCaminar || 0) > 0) {
    // sin registro de ese día (escenario cargado a mitad de camino): se deshace un día sin caminar
    S.sinCaminar -= 1; S.bateria = Math.min(5, S.bateria + 1);
  }
  S.hoy = dia;
  S.pilaVista = S.bateria; S.recarga = null; // volver atrás no es una recarga: sin «reactivado»
  save();
  nota('Un día atrás', S.hoy < 0 ? 'Antes del 28 de noviembre' : S.hoy === 0 ? '28 de noviembre: se abre el intro' : `Hoy es el día ${S.hoy} · energía ${S.bateria} de 5`);
  repintar();
}

// ---------- Panel ----------
const panel = document.getElementById('panel');
const btn = document.getElementById('panelBtn');
// arriba, siempre a la vista: título, pantalla actual, día y las pestañas. Cada pestaña, una sola cosa:
// lo que se simula (Estado), los recorridos del lienzo, sus pantallas, las notas y los ajustes de prueba
const svg = (d, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON = {
  estado: '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  rec: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8.2 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8"/>',
  pant: '<rect x="4" y="3.5" width="7" height="12" rx="1.8"/><rect x="13" y="8.5" width="7" height="12" rx="1.8"/>',
  notas: '<path d="M6 3.5h8.5L19 8v12.5H6z"/><path d="M14 3.5V8h5M9 12.5h7M9 16h5"/>',
  aj: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  enlace: '<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/>',
  sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  luna: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  play: '<path d="M9 6.5l9 5.5-9 5.5z" fill="currentColor"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  atras: '<path d="M15 6l-6 6 6 6"/>',
  ok: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  dev: '<path d="M8.5 7.5L4 12l4.5 4.5M15.5 7.5L20 12l-4.5 4.5M13.5 5l-3 14"/>',
  cursor: '<path d="M5 3.5l13 7-5.6 1.6L10 18z"/><path d="M12.4 12.1l5 5"/>',
};
// acceso rápido: Estado y Ajustes. Recorridos, Pantallas y Notas se usan poco: van discretas al pie y se vuelve con «‹»
const PRIMARIAS = [['estado', 'Estado'], ['aj', 'Ajustes']];
// la canción del mapa (panel › Ajustes): S.musicaMapa
const MUSICA_MAPA = [['juegos', 'Opción 1', 'La música de las trivias y los juegos'], ['original', 'Opción 2', 'La canción original del mapa']];
const EQUIPO = [['rec', 'Recorridos'], ['pant', 'Pantallas'], ['notas', 'Notas']];
let tab = 'estado';
let ultima = 'estado'; // la última pestaña principal, a la que vuelve «‹»
let filtro = 'todas';
let abiertas = null; // secciones plegables abiertas; la primera vez, la de la pantalla donde se está
try { tab = localStorage.getItem('cab-tab3') || 'estado'; abiertas = JSON.parse(localStorage.getItem('cab-abiertas') || 'null'); } catch { /* sin storage */ }
if (![...PRIMARIAS, ...EQUIPO, ['insp']].some(([k]) => k === tab)) tab = 'estado';
if (tab === 'insp' && !devActivo()) tab = 'estado';
if (PRIMARIAS.some(([k]) => k === tab)) ultima = tab;
btn.onclick = () => { const o = panel.classList.toggle('open'); btn.setAttribute('aria-expanded', o); document.body.classList.toggle('panel-open', o); if (o) render(); };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const check = on => `<span class="p-check ${on ? 'on' : ''}" aria-label="${on ? 'Visto' : 'Sin ver'}">${on ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' : ''}</span>`;
// piezas del panel: interruptor (sí/no), fila de un grupo, grupo con título y sección plegable
const sw = (id, on, label) => `<button class="p-switch" role="switch" aria-checked="${!!on}" aria-label="${label}" data-sw="${id}"></button>`;
const fila = (label, control, sub = '') => `<div class="p-row"><span class="p-row-t">${label}${sub ? `<small>${sub}</small>` : ''}</span>${control}</div>`;
const grupo = (titulo, filas, pie = '') => `<section class="p-group"><h2>${titulo}</h2><div class="p-card">${filas}</div>${pie ? `<p class="p-help">${pie}</p>` : ''}</section>`;
const plegable = (id, titulo, cuerpo, { badge = '', n = '' } = {}) => `<details class="p-acc" data-acc="${id}" ${abiertas.includes(id) ? 'open' : ''}><summary>${badge !== '' ? `<span class="p-sec-badge">${badge}</span>` : ''}<span class="p-acc-t">${titulo}</span>${n !== '' ? `<span class="p-acc-n">${n}</span>` : ''}${svg(ICON.chev, 18)}</summary><div class="p-acc-body">${cuerpo}</div></details>`;

function dayLabel(n) { if (n <= 0) return 'Antes del 29 nov'; if (n > GRACIA_FIN) return 'Desde el 7 ene'; if (n >= 27) { const f = dateOf(n); return `Gracia · ${f.dd} ${f.mes.slice(0, 3).toLowerCase()}`; } const f = dateOf(n); return `Día ${n} · ${f.dow.slice(0, 3).toLowerCase()} ${f.dd} ${f.mes.slice(0, 3).toLowerCase()}`; }
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
  const hoyTxt = fase() === 'antes' ? (S.hoy === 0 ? '28 de noviembre · un día antes' : 'Antes del 28 de noviembre') : fase() === 'gracia' ? `Gracia · ${cuentaGracia(true)}` : fase() === 'recuerdo' ? 'Desde el 7 de enero: recuerdo' : `Hoy: día ${S.hoy} de 26`;
  const progTxt = act == null ? (fase() === 'antes' ? (S.inscrito ? 'Inscrito' : 'Sin inscribirse') : 'Al día') : act < lastDay() ? `Va en el día ${act}` : `Toca el día ${act}`;
  const dayTitle = S.hoy < 0 ? 'Antes del 28 de noviembre' : S.hoy === 0 ? '28 de noviembre' : S.hoy > GRACIA_FIN ? 'Camino cerrado' : S.hoy >= 27 ? `Gracia · ${cuentaGracia(true)}` : `Día ${S.hoy} de 26`;
  const daySub = S.hoy < 0 ? 'El camino aún no empieza' : S.hoy === 0 ? 'Un día antes · se abre el intro' : S.hoy > GRACIA_FIN ? 'Desde el 7 de enero' : S.hoy >= 27 ? (() => { const f = dateOf(S.hoy); return `${f.dow.toLowerCase()} ${f.dd} de ${f.mes.toLowerCase()}`; })() : (() => { const f = dateOf(S.hoy); return `${f.dow.toLowerCase()} ${f.dd} de ${f.mes.toLowerCase()}`; })();
  const tema = `<span class="seg p-tema" role="group" aria-label="Tema">${[['claro', 'Día', ICON.sol], ['oscuro', 'Noche', ICON.luna]].map(([v, l, d]) => `<button data-tema="${v}" aria-pressed="${S.tema === v}" aria-label="${l}" title="${l}">${svg(d, 18)}</button>`).join('')}</span>`;
  // modo developer: una sola fila arriba (el día, día/noche, inspeccionar, enlace y salir); lo que importa es lo que se inspecciona
  const diaCorto = S.hoy < 0 ? 'Antes del 28' : S.hoy === 0 ? '28 nov' : S.hoy > GRACIA_FIN ? 'Recuerdo' : S.hoy >= 27 ? 'Gracia' : `Día ${S.hoy}`;
  const head = devActivo() ? `<header class="p-head p-head-dev"><div class="p-devbar">
    <div class="p-dia-mini"><button class="p-arrow" data-act="dayMinus" aria-label="Día anterior" ${S.hoy <= -1 ? 'disabled' : ''}>‹</button><b title="${dayTitle} · ${daySub} · ${progTxt}">${diaCorto}</b><button class="p-arrow" data-act="dayPlus" aria-label="Día siguiente" ${S.hoy > GRACIA_FIN ? 'disabled' : ''}>›</button></div>
    <span class="p-tools">${tema}<button class="p-icon" data-act="inspeccionar" aria-pressed="${!usandoApp()}" aria-label="Inspeccionar (I)" title="Inspeccionar · I">${svg(ICON.cursor)}</button><button class="p-icon" data-act="share" aria-label="Copiar enlace a este estado" title="Copiar enlace a este estado">${svg(ICON.enlace)}</button><button class="p-icon p-dev" data-act="dev" aria-pressed="true" aria-label="Salir del modo developer (⇧D)" title="Salir del modo developer · ⇧D">${svg(ICON.dev)}</button></span>
  </div></header>` : `<header class="p-head">
    <div class="p-title"><h1>Adviento</h1><span class="p-tag">MVP</span><span class="p-tools">${tema}<button class="p-icon p-dev" data-act="dev" aria-pressed="false" aria-label="Modo developer (⇧D)" title="Modo developer · ⇧D">${svg(ICON.dev)}</button><button class="p-icon" data-act="share" aria-label="Copiar enlace a este estado" title="Copiar enlace a este estado">${svg(ICON.enlace)}</button></span></div>
    ${devActivo() ? '' : `<small class="p-now-screen">Estás en: <b>${esc(name)}</b></small>`}
    <div class="p-day">
      <button class="p-arrow" data-act="dayMinus" aria-label="Día anterior" ${S.hoy <= -1 ? 'disabled' : ''}>‹</button>
      <div><b>${dayTitle}</b><small>${daySub} · ${progTxt}</small></div>
      <button class="p-arrow" data-act="dayPlus" aria-label="Día siguiente" ${S.hoy > GRACIA_FIN ? 'disabled' : ''}>›</button>
    </div>
    <div class="seg p-prim" role="tablist" aria-label="Panel">${PRIMARIAS.map(([k, l]) => `<button role="tab" id="pt-${k}" aria-controls="pbody" aria-selected="${tab === k}" data-tab="${k}">${svg(ICON[k], 18)}${l}</button>`).join('')}</div>
  </header>`;
  const equipo = `<nav class="p-foot ${devActivo() ? 'p-foot2' : ''}" aria-label="Para el equipo">${EQUIPO.filter(([k]) => !devActivo() || k !== 'notas').map(([k, l]) => `<button id="pt-${k}" data-tab="${k}" ${tab === k ? 'aria-current="page"' : ''}>${svg(ICON[k], 16)}<span>${l}</span>${k === 'notas' && S.huecos.length ? `<i class="p-badge" aria-label="${S.huecos.length} huecos">${S.huecos.length}</i>` : ''}</button>`).join('')}</nav>`;
  const enEquipo = EQUIPO.find(([k]) => k === tab);
  const atras = devActivo() ? ['insp', 'Inspector'] : PRIMARIAS.find(([k]) => k === ultima);
  const volver = enEquipo ? `<div class="p-sub"><button class="p-back" data-tab="${atras[0]}">${svg(ICON.atras, 18)}${atras[1]}</button><h2>${enEquipo[1]}</h2></div>` : '';
  abiertas ??= [`rec-${sec?.[0] ?? 2}`, `pant-${sec?.[0] ?? 2}`];
  const pct = Math.round(cov.seenN / cov.total * 100);
  const cobertura = link => `<div class="p-cov"><div class="p-cov-top"><b>${cov.seenN} de ${cov.total} pantallas del lienzo vistas</b>${link ? '<button class="p-link" data-tab="pant" data-filtro="faltan">Ver las que faltan</button>' : ''}</div><div class="p-bar"><span style="width:${pct}%"></span></div></div>`;

  let body = '';
  if (tab === 'estado') {
    const maxDone = Math.max(0, ...Object.keys(S.completos).filter(k => isDone(+k)).map(Number));
    body = `<div class="p-teo">
      <img src="${A(TEODORO_IDS[S.bateria])}" alt="Teodoro ${ENERGY_NAMES[S.bateria].toLowerCase()}">
      <div><b>Teodoro · ${ENERGY_NAMES[S.bateria]}</b><span class="p-bat" role="img" aria-label="Energía ${S.bateria} de 5">${[0, 1, 2, 3, 4].map(i => `<i class="${i < S.bateria ? 'on' : ''}"></i>`).join('')}</span></div>
    </div>
    ${grupo('Familia',
      fila('Plan', `<span class="seg">${[['premium', 'Premium'], ['pase', 'Pase'], ['free', 'Free']].map(([v, l]) => `<button data-plan="${v}" aria-pressed="${S.plan === v}">${l}</button>`).join('')}</span>`)
      + fila('Inscrito', sw('ins', S.inscrito, 'Inscrito'))
      + `<div class="p-row p-panes"><label for="nPan"><img src="${A(IMG.pan)}" alt="">Panes</label><span class="p-step"><button data-act="panMinus" aria-label="Quitar 10 panes">−</button><input id="nPan" type="number" min="0" step="5" value="${S.panes}"><button data-act="panPlus" aria-label="Sumar 10 panes">+</button></span></div>`)}
    ${grupo('Tiempo',
      `<div class="p-row"><label for="pSel">Completó hasta</label><select id="pSel">${Array.from({ length: 27 }, (_, n) => `<option value="${n}" ${n === maxDone ? 'selected' : ''}>${n ? 'Día ' + n : 'Ninguno'}</option>`).join('')}</select></div>`
      + fila('Saltar 7 días', '<button class="p-btn p-btn-sm" data-act="week">Saltar</button>', 'Para ver «¡Te guardé el camino!»'))}
    <button class="p-btn p-danger" data-act="reset">Empezar de cero</button>`;
  } else if (tab === 'rec') {
    body = cobertura(true) + SECTIONS.map(([n, label]) => {
      const items = REC.map((r, i) => ({ ...r, i })).filter(r => r.sec === n);
      if (!items.length) return '';
      return plegable(`rec-${n}`, label, items.map(r => {
        const done = r.covers.length && r.covers.every(f => S.vistas?.[logical(f)]);
        return `<button class="p-rec" data-scen="${r.i}">${check(done)}<span><b>${esc(r.t)}</b><small>${esc(r.mira)}</small></span><span class="p-go" aria-hidden="true">${svg(ICON.play, 14)}</span></button>`;
      }).join(''), { badge: n, n: items.length });
    }).join('');
  } else if (tab === 'pant') {
    const groups = {};
    cov.all.forEach((v, k) => { const s = sectionOfY(v.y); (groups[s[0]] ??= []).push([k, v]); });
    const man = manifest();
    const pair = key => Object.entries(man).filter(([f]) => logical(f) === key).sort((a, b) => a[1].dark - b[1].dark).map(([f, m]) => ({ f, dark: m.dark }));
    body = cobertura(false) + `<div class="seg p-filter">${[['todas', 'Todas'], ['faltan', 'Faltan'], ['vistas', 'Vistas']].map(([v, l]) => `<button data-filtro="${v}" aria-pressed="${filtro === v}">${l}</button>`).join('')}</div>`
      + SECTIONS.map(([n, label]) => {
        const todas = (groups[n] || []).sort((a, b) => a[1].y - b[1].y || a[1].x - b[1].x);
        const rows = todas.filter(([k]) => filtro === 'todas' || (filtro === 'vistas') === !!S.vistas?.[k]);
        if (!rows.length) return '';
        return plegable(`pant-${n}`, label, `<ul class="p-list">${rows.map(([k]) => `<li class="p-screen">${check(S.vistas?.[k])}<span>${esc(k)}</span><span class="p-mini">${pair(k).map(p => `<button data-file="${p.f}">${p.dark ? 'Oscuro' : 'Claro'}</button>`).join('')}</span></li>`).join('')}</ul>`, { badge: n, n: `${todas.filter(([k]) => S.vistas?.[k]).length}/${todas.length}` });
      }).join('');
  } else if (tab === 'notas') {
    const key = cur?.name || 'hoy';
    const notes = Object.entries(S.notas).filter(([, v]) => v.trim());
    body = `<section class="p-group"><h2>Nota sobre «${esc(NAMES[key] || key)}»</h2>
      <textarea class="p-note" id="note" placeholder="¿Qué mejorarías aquí? ¿Falta una pantalla? ¿Algo confunde a un niño?">${esc(S.notas[key] || '')}</textarea>
      <div class="p-btns"><button class="p-btn main" data-act="copyNotes">Copiar todo para el equipo</button><button class="p-btn" data-act="dlNotes">Descargar .md</button></div></section>
    <section class="p-group"><h2>Notas del equipo · ${notes.length}</h2>${notes.length ? `<ul class="p-list">${notes.map(([k, v]) => `<li><b>${esc(NAMES[k] || k)}</b><small>${esc(v)}</small></li>`).join('')}</ul>` : '<p class="p-help">Aún no hay notas.</p>'}</section>
    <section class="p-group"><h2>Huecos encontrados · ${S.huecos.length}</h2>${S.huecos.length ? `<ul class="p-list">${S.huecos.map(h => `<li><b>${esc(h.label)}</b><small>en ${esc(NAMES[h.where] || h.where)}</small></li>`).join('')}</ul><div class="p-btns"><button class="p-btn" data-act="clearH">Vaciar huecos</button></div>` : '<p class="p-help">Se anotan solos al tocar algo que el lienzo no define.</p>'}</section>
    ${plegable('notas-pend', 'Pendientes del lienzo', `<ul class="p-list">${PENDIENTES_LIENZO.map(t => `<li><small>${esc(t)}</small></li>`).join('')}</ul>`, { n: PENDIENTES_LIENZO.length })}
    ${plegable('notas-dec', 'Decisiones del MVP para revisar', `<ul class="p-list">${DECISIONES.map(t => `<li><small>${esc(t)}</small></li>`).join('')}</ul>`, { n: DECISIONES.length })}`;
  } else {
    const mus = S.musicaMapa === 'original' ? 'original' : 'juegos';
    body = `${grupo('Variantes',
      fila('Slides del reto', sw('slides', S.slidesReto, 'Slides del reto'), 'Versión posterior · hoy lo envía Braze')
      + `<div class="p-row p-stack"><span class="p-row-t">Canción del mapa</span><div class="p-radio" role="radiogroup" aria-label="Canción del mapa">${MUSICA_MAPA.map(([v, l, d]) => `<button role="radio" aria-checked="${mus === v}" data-musica="${v}"><span><b>${l}</b><small>${d}</small></span>${svg(ICON.ok, 18)}</button>`).join('')}</div></div>`)}
    ${grupo('Ruleta',
      `<div class="p-row p-stack"><span class="p-row-t">Qué sale al girar</span><div class="p-chips">${[['', 'Al azar'], ['cuarto', '? Fondo nuevo'], ['panes', '20 panes'], ['regalo', 'Regalo (prenda al azar)'], ['prenda', 'Prenda de la semana'], ['otra', 'Otra oportunidad']].map(([v, l]) => `<button data-premio="${v}" aria-pressed="${(S.forzarPremio || '') === v}">${l}</button>`).join('')}</div></div>`
      + fila('Girar otra vez', '<button class="p-btn p-btn-sm" data-act="ruletaOtraVez">Girar</button>', `La de esta semana · días ${RULES.ruleta.join(', ').replace(/, (\d+)$/, ' y $1')}`))}
    ${grupo('iPhone',
      fila('Isla dinámica', sw('isla', S.isla !== false, 'Isla dinámica'))
      + fila('Zonas seguras', sw('zonas', S.zonas, 'Zonas seguras')),
      'iPhone 15 y 16: isla de 126 × 37 pt a 11 pt del borde · zona segura de 59 pt arriba y 34 abajo')}
    ${plegable('aj-reglas', 'Reglas que usa el MVP', `<ul class="p-list">
      <li><b>Panes</b><small>Contenido +${RULES.panes.contenidoPremium} premium / +${RULES.panes.contenidoFree} free · trivia +${RULES.panes.trivia} · sorpresa +${RULES.panes.sorpresa} · ruleta ${RULES.panes.ruleta}</small></li>
      <li><b>Batería</b><small>Cada noche baja una rayita · terminar el día la llena · nunca bloquea</small></li>
      <li><b>Ruleta</b><small>Días ${RULES.ruleta.join(', ')} · al tocarla en el mapa</small></li>
      <li><b>Sorpresa</b><small>${Object.entries(RULES.sorpresa).map(([d, g]) => `día ${d} ${g}`).join(' · ')} · nunca el mismo día que la ruleta</small></li>
      <li><b>Atrasado y regreso</b><small>Puede hacer varios días seguidos hasta alcanzar hoy · regreso tras ${RULES.regresoDias}+ días sin caminar</small></li>
    </ul>`)}`;
  }
  const scroll = panel.querySelector('.p-body')?.scrollTop || 0;
  const sameTab = panel.dataset.tab === tab;
  const insp = devActivo() && tab === 'insp';
  panel.innerHTML = head + `<div class="p-body ${insp ? 'dv' : ''}" id="pbody" role="tabpanel" aria-labelledby="pt-${tab}">${insp ? '' : volver + body}</div>` + equipo;
  if (insp) {
    // el inspector del modo developer: la pantalla (sus assets y capas) o la capa elegida con sus estados
    const variantes = Object.entries(manifest()).filter(([f]) => cur?.file && logical(f) === logical(cur.file)).sort((x, y) => x[1].dark - y[1].dark);
    pintarDev(panel.querySelector('#pbody'), { nombre: NAMES[cur?.name] || cur?.name || 'Pantalla', archivo: cur?.name === 'estatica' ? cur.params?.file : cur?.file, lienzo: variantes.map(([f, m]) => [f, `Ver en el lienzo · ${m.dark ? 'noche' : 'día'}`]) });
  }
  panel.dataset.tab = tab;
  if (sameTab) panel.querySelector('.p-body').scrollTop = scroll;
}

// las secciones plegables recuerdan si quedaron abiertas
panel.addEventListener('toggle', e => {
  const d = e.target; if (!d.matches?.('details[data-acc]')) return;
  abiertas = (abiertas || []).filter(x => x !== d.dataset.acc); if (d.open) abiertas.push(d.dataset.acc);
  try { localStorage.setItem('cab-abiertas', JSON.stringify(abiertas)); } catch { /* sin storage */ }
}, true);

panel.addEventListener('click', e => {
  const t = e.target.closest('button'); if (!t) return;
  if (t.dataset.tab) { tab = t.dataset.tab; if (PRIMARIAS.some(([k]) => k === tab)) ultima = tab; if (t.dataset.filtro) filtro = t.dataset.filtro; try { localStorage.setItem('cab-tab3', tab); } catch { /* */ } render(); return; }
  if (t.dataset.filtro) { filtro = t.dataset.filtro; render(); return; }
  if (t.dataset.plan) { S.plan = t.dataset.plan; save(); nota(S.plan === 'free' ? 'Ahora eres free' : S.plan === 'pase' ? 'Ahora tienes el Pase de Adviento' : 'Ahora eres premium'); return; }
  if (t.dataset.tema) { S.tema = t.dataset.tema; save(); if (cur?.name === 'estatica') go('hoy', {}, 'fade'); else go(cur?.name || 'hoy', cur?.params || {}, 'fade', { scrollTop: cur?.layer.scrollTop || 0 }); return; }
  // interruptores (sí/no): cambian al tocar
  if (t.dataset.sw === 'ins') { S.inscrito = !S.inscrito; save(); go('hoy', {}, 'fade'); return; }
  if (t.dataset.sw === 'slides') { S.slidesReto = !S.slidesReto; save(); nota(S.slidesReto ? 'Slides del reto prendidos' : 'Slides del reto apagados', S.slidesReto ? 'Salen al tocar «Únete al reto»' : ''); return; }
  if (t.dataset.sw === 'isla') { S.isla = S.isla === false; save(); return; }
  if (t.dataset.sw === 'zonas') { S.zonas = !S.zonas; save(); return; }
  if (t.dataset.musica) { S.musicaMapa = t.dataset.musica; save(); musicaPara(); render(); const [, l, d] = MUSICA_MAPA.find(([v]) => v === S.musicaMapa); nota(`Canción del mapa: ${l.toLowerCase()}`, d); return; }
  if (t.dataset.bat) { S.bateria = +t.dataset.bat; save(); go(cur?.name || 'hoy', cur?.params || {}, 'none', { scrollTop: cur?.layer.scrollTop || 0 }); return; }
  if ('premio' in t.dataset) { S.forzarPremio = t.dataset.premio; save(); return; }
  if (t.dataset.scen) { const r = REC[+t.dataset.scen]; r.run(); save(); go(r.go, {}, 'fade'); nota(r.t, r.mira); closeMobile(); return; }
  if (t.dataset.go) { go(t.dataset.go, {}, 'fade'); closeMobile(); return; }
  if (t.dataset.file) { go('estatica', { file: t.dataset.file, back: cur?.name !== 'estatica' ? cur?.name : 'hoy', backParams: cur?.params }, 'fade'); closeMobile(); return; }
  const a = t.dataset.act;
  if (a === 'dev') modoDev();
  if (a === 'inspeccionar') usarApp(!usandoApp() ? true : false);
  if (a === 'mid') advance(1);
  if (a === 'week') advance(7);
  if (a === 'dayPlus') advance(1);
  if (a === 'dayMinus') retroceder();
  if (a === 'ruletaOtraVez') {
    // la ruleta de la semana en curso (la última que ya llegó): se borra su giro y se abre de nuevo, sin cambiar de día
    const d = [...RULES.ruleta].reverse().find(x => x <= lastDay());
    if (!d) { nota('Aún no hay ruleta', 'La primera es el día 4'); return; }
    delete S.ruletas[d]; save();
    go('mapa', {}, 'none', { replace: true });
    setTimeout(() => go('ruletaPop', { day: d, from: 'mapa' }, 'modal'), 500);
    closeMobile();
  }
  if (a === 'panMinus' || a === 'panPlus') { S.panes = Math.max(0, S.panes + (a === 'panPlus' ? 10 : -10)); save(); }
  if (a === 'reset') { reset({}); go('hoy', {}, 'fade', { tab: true }); }
  if (a === 'share') { navigator.clipboard?.writeText(shareURL()).then(() => nota('Enlace copiado', 'Abre la app en este mismo estado')); }
  if (a === 'clearH') { S.huecos = []; save(); }
  if (a === 'copyNotes' || a === 'dlNotes') {
    const md = notesMarkdown();
    if (a === 'copyNotes') navigator.clipboard?.writeText(md).then(() => nota('Notas copiadas', 'Pégalas en Slack o en el lienzo'));
    else { const b = new Blob([md], { type: 'text/markdown' }); const u = URL.createObjectURL(b); const l = document.createElement('a'); l.href = u; l.download = 'camino-a-belen-notas.md'; l.click(); URL.revokeObjectURL(u); }
  }
});
panel.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'dSel') { S.hoy = +t.value; save(); repintar(); }
  if (t.id === 'pSel') { const n = +t.value; fill(n); if (n > 0) { S.inscrito = true; S.teaserVisto = true; } if (S.hoy < n) S.hoy = n; save(); go(cur?.name === 'mapa' ? 'mapa' : 'hoy', {}, 'fade'); }
  if (t.id === 'nPan') { S.panes = Math.max(0, +t.value || 0); save(); }
});
panel.addEventListener('input', e => { if (e.target.id === 'note') { S.notas[cur?.name || 'hoy'] = e.target.value; try { localStorage.setItem('cab-mvp-v1', JSON.stringify(S)); } catch { /* */ } } });
function closeMobile() { if (innerWidth <= 1100) { panel.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); document.body.classList.remove('panel-open'); } }
function notesMarkdown() {
  const cov = coverage();
  const lines = ['# Adviento · notas del MVP', '', `_${new Date().toLocaleString('es')} · ${cov.seenN} de ${cov.total} pantallas del lienzo recorridas_`, '', '## Notas por pantalla', ''];
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
// la isla dinámica y las zonas seguras del iPhone en el teléfono simulado (panel › Avanzado › iPhone)
// (se crean aquí: el MVP se abre tanto desde index.html como desde app.html)
const syncIphone = () => {
  const phone = document.getElementById('phone');
  ['isla', 'zonas'].forEach(id => { if (phone && !document.getElementById(id)) { const d = document.createElement('div'); d.id = id; d.setAttribute('aria-hidden', 'true'); phone.appendChild(d); } });
  document.body.classList.toggle('con-isla', S.isla !== false); document.body.classList.toggle('con-zonas', !!S.zonas);
};
let rT; onChange(() => { syncTheme(); syncIphone(); clearTimeout(rT); rT = setTimeout(() => { if (document.activeElement?.id !== 'note' && document.activeElement?.id !== 'nPan') render(); }, 60); });

// el modo developer repinta el panel cuando cambia la capa elegida (o se entra y se sale con la tecla D)
alCambiar(() => { if (devActivo() && panel.dataset.dev !== '1') tab = 'insp'; if (!devActivo() && tab === 'insp') tab = ultima; panel.dataset.dev = devActivo() ? '1' : ''; render(); });

// ---------- Arranque ----------
(async () => {
  fit();
  syncTheme(); syncIphone();
  await boot();
  syncSections();
  prefetch(['V2-01-Hoy-completo', 'V2-Mapa-completo-claro', 'V2-Mapa-dia0-claro', 'S-05-Reproductor', 'S-06-Completado', 'V2-06a-Trivia-sin-elegir-claro', 'V2-06c-Trivia-varias-claro', 'V2-07-Correcto-claro', 'V2-08-Pista-claro', 'V2-Trivia-fin-claro', 'V2-Cerrado']);
  const hp = new URLSearchParams(location.hash.slice(1));
  // la primera vez (o tras «Empezar de cero») todo arranca antes del 29 y sin inscribirse
  const start = hp.get('pantalla');
  const safe = ['hoy', 'mapa', 'teodoro', 'mundos'].includes(start) ? start : 'hoy';
  if (hp.get('estado')) save();
  await go(safe, {}, 'none');
  render();
})();
