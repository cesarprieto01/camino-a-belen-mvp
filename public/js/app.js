// Arranque del MVP y panel de control para el equipo.
// El panel sigue el orden del lienzo (secciones 1 a 8) para que diseño y prueba hablen el mismo idioma.
import { S, save, reset, boot, go, cur, onChange, nota, manifest, shareURL, A, activeDay, isDone, doneCount, lastDay, fase, GRACIA_FIN, cuentaGracia, vistos, puedeDia, prefetch, logical, flowScreens, sections } from './core.js';
import { RULES, IMG, PRENDAS, ENERGY_NAMES, TEODORO_IDS, dateOf, hasTrivia } from './data.js';
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
const day = (hoy, done, extra = {}) => () => { reset({ hoy, inscrito: true, teaserVisto: true, ...extra }); fill(done); Object.assign(S, extra); };

// Recorridos: uno por cada caso del lienzo. «covers» = pantallas del lienzo que deja ver.
const REC = [
  { sec: 1, t: 'Sin inscribirse', mira: 'Tarjeta en Hoy → teaser → inscripción → espera', run: () => { reset({ hoy: 0, inscrito: false, teaserVisto: false }); S.completos = {}; }, go: 'hoy', covers: ['R-Hoy-completo-pre', 'V2-Teaser-claro', 'V2-Confirmacion-claro', 'V2-Espera-claro'] },
  { sec: 1, t: 'Ya inscrito', mira: '«Entrar» abre los Mundos con Adviento cerrado y la cuenta regresiva · la ilustración abre la espera · invitar a un amigo', run: () => { reset({ hoy: 0, inscrito: true }); S.completos = {}; }, go: 'hoy', covers: ['R-Hoy-pre-dentro', 'V2-Invitacion-claro'] },
  { sec: 1, t: 'Tab Teodoro antes del 29', mira: 'Ícono de Adviento junto a Teodoro, sin inscribirse', run: () => { reset({ hoy: 0, inscrito: false, teaserVisto: true }); S.completos = {}; }, go: 'teodoro', covers: ['V2-Pre-Teodoro-claro'] },
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
  'Inicio real de Theo (lienzo «Inicio real», 21 oct): el destacado de Camino a Belén va primero en el héroe, que se desliza entre tres destacados; Misiones Diarias y las filas de cuentos se deslizan de lado.',
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
  'Hojas de página (se cierran deslizando): free sobre el reto, calificación sobre el mapa, espera sobre Hoy.',
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

function advance(k) {
  // se guarda cómo estaba Teodoro este día: si luego se vuelve atrás en el panel, vuelve igual
  S.diaGuardado = { ...(S.diaGuardado || {}), [S.hoy]: { bateria: S.bateria, sinCaminar: S.sinCaminar || 0, manzana: !!S.manzana, ultimoJugado: S.ultimoJugado } };
  // Teodoro se cansa por los días sin caminar del 29 nov al 6 ene (también en la gracia, si falta algo); antes del 29 y en el recuerdo no cuenta
  let baja = 0;
  for (let i = 0; i < k; i++) { const d = S.hoy + i; if (S.inscrito && d >= 1 && d <= GRACIA_FIN && (d <= 26 || vistos() < 26) && (d > 26 || puedeDia(d)) && !(i === 0 && S.ultimoJugado === S.hoy)) baja++; }
  // la manzana guardada de la ruleta le ahorra a Teodoro un día de cansancio
  S.sinCaminar = (S.sinCaminar || 0) + baja; // días seguidos sin caminar: la escena de Teodoro sigue exagerándose hasta 10
  if (baja && S.manzana) { baja--; S.manzana = false; }
  S.bateria = Math.max(0, S.bateria - baja);
  const antes = S.hoy;
  S.hoy = Math.min(GRACIA_FIN + 1, S.hoy + k);
  if (k >= RULES.regresoDias && S.inscrito && S.hoy >= 1) S.regreso = true;
  save();
  nota(antes === 0 && S.hoy >= 1 ? '¡Hoy empieza el camino!' : k === 1 ? 'Pasó la medianoche' : `Pasaron ${k} días`, S.hoy === 27 ? 'Ya es Navidad' : S.hoy > GRACIA_FIN ? 'El camino quedó como recuerdo' : S.hoy > 27 ? cuentaGracia() : `Hoy es el día ${S.hoy}`);
  go('hoy', {}, 'fade');
}

/** Volver un día atrás en el panel: Teodoro (escena y batería) vuelve a como estaba ese día. */
function retroceder() {
  if (S.hoy <= 0) return;
  const dia = S.hoy - 1, g = S.diaGuardado?.[dia];
  if (g) Object.assign(S, g);
  else if (S.inscrito && dia >= 1 && S.ultimoJugado !== dia && (S.sinCaminar || 0) > 0) {
    // sin registro de ese día (escenario cargado a mitad de camino): se deshace un día sin caminar
    S.sinCaminar -= 1; S.bateria = Math.min(5, S.bateria + 1);
  }
  S.hoy = dia;
  S.pilaVista = S.bateria; // volver atrás no es una recarga: sin «reactivado»
  save();
  nota('Un día atrás', S.hoy <= 0 ? 'Antes del 29 de noviembre' : `Hoy es el día ${S.hoy} · energía ${S.bateria} de 5`);
  go('hoy', {}, 'fade');
}

// ---------- Panel ----------
const panel = document.getElementById('panel');
const btn = document.getElementById('panelBtn');
let tab = 'rec';
let moreOpen = false;
let filtro = 'todas';
try { tab = localStorage.getItem('cab-tab2') || 'rec'; } catch { /* sin storage */ }
btn.onclick = () => { const o = panel.classList.toggle('open'); btn.setAttribute('aria-expanded', o); document.body.classList.toggle('panel-open', o); if (o) render(); };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const check = on => `<span class="p-check ${on ? 'on' : ''}" aria-label="${on ? 'Visto' : 'Sin ver'}">${on ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' : ''}</span>`;

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
  const hoyTxt = fase() === 'antes' ? 'Antes del 29 de noviembre' : fase() === 'gracia' ? `Gracia · ${cuentaGracia(true)}` : fase() === 'recuerdo' ? 'Desde el 7 de enero: recuerdo' : `Hoy: día ${S.hoy} de 26`;
  const progTxt = act == null ? (fase() === 'antes' ? (S.inscrito ? 'Inscrito' : 'Sin inscribirse') : 'Al día') : act < lastDay() ? `Va en el día ${act}` : `Toca el día ${act}`;
  const dayTitle = S.hoy <= 0 ? 'Antes del 29 de noviembre' : S.hoy > GRACIA_FIN ? 'Camino cerrado' : S.hoy >= 27 ? `Gracia · ${cuentaGracia(true)}` : `Día ${S.hoy} de 26`;
  const daySub = S.hoy <= 0 ? 'El camino aún no empieza' : S.hoy > GRACIA_FIN ? 'Desde el 7 de enero' : S.hoy >= 27 ? (() => { const f = dateOf(S.hoy); return `${f.dow.toLowerCase()} ${f.dd} de ${f.mes.toLowerCase()}`; })() : (() => { const f = dateOf(S.hoy); return `${f.dow.toLowerCase()} ${f.dd} de ${f.mes.toLowerCase()}`; })();
  const simple = `<section class="p-simple">
    <div class="p-day">
      <button class="p-arrow" data-act="dayMinus" aria-label="Día anterior" ${S.hoy <= 0 ? 'disabled' : ''}>‹</button>
      <div><b>${dayTitle}</b><small>${daySub} · ${progTxt}</small></div>
      <button class="p-arrow" data-act="dayPlus" aria-label="Día siguiente" ${S.hoy > GRACIA_FIN ? 'disabled' : ''}>›</button>
    </div>
    <div class="seg p-wide">${[['claro', 'Día'], ['oscuro', 'Noche']].map(([v, l]) => `<button data-tema="${v}" aria-pressed="${S.tema === v}">${l}</button>`).join('')}</div>
    <div class="p-teo">
      <img src="${A(TEODORO_IDS[S.bateria])}" alt="Teodoro ${ENERGY_NAMES[S.bateria].toLowerCase()}">
      <div>
        <b>Teodoro · ${ENERGY_NAMES[S.bateria]}</b>
        <span class="p-bat" role="img" aria-label="Energía ${S.bateria} de 5">${[0, 1, 2, 3, 4].map(i => `<i class="${i < S.bateria ? 'on' : ''}"></i>`).join('')}</span>
        <small>Un cuento lo llena. Cada día sin caminar baja una rayita.</small>
      </div>
    </div>
    <div class="p-row p-panes"><label for="nPan"><img src="${A(IMG.pan)}" alt="">Panes</label><span class="p-step"><button data-act="panMinus" aria-label="Quitar 10 panes">−</button><input id="nPan" type="number" min="0" step="5" value="${S.panes}"><button data-act="panPlus" aria-label="Sumar 10 panes">+</button></span></div>
    <button class="p-link p-reset" data-act="reset">Empezar de cero</button>
  </section>`;
  const head = `<div class="p-head"><div class="p-title"><h1>Camino a Belén</h1><span class="p-tag">MVP</span></div><small class="p-now-screen">Estás en: <b>${esc(name)}</b></small></div>`;
  const tabsHtml = `<div class="p-tabs" role="tablist">${[['rec', 'Recorridos'], ['aj', 'Avanzado'], ['pant', `Pantallas · ${cov.seenN}/${cov.total}`], ['notas', `Notas${S.huecos.length ? ' · ' + S.huecos.length : ''}`]].map(([k, l]) => `<button class="p-tab" role="tab" aria-selected="${tab === k}" data-tab="${k}">${l}</button>`).join('')}</div>`;

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
      <div class="p-row"><label for="pSel">Completó hasta</label><select id="pSel">${Array.from({ length: 27 }, (_, n) => `<option value="${n}" ${n === maxDone ? 'selected' : ''}>${n ? 'Día ' + n : 'Ninguno'}</option>`).join('')}</select></div>
      <div class="p-btns"><button class="p-btn" data-act="week">7 días sin abrir (regreso)</button></div>
    </section>
    <section class="p-group"><h2>Familia</h2>
      <div class="p-row"><label>Plan</label><span class="seg">${[['premium', 'Premium'], ['pase', 'Pase'], ['free', 'Free']].map(([v, l]) => `<button data-plan="${v}" aria-pressed="${S.plan === v}">${l}</button>`).join('')}</span></div>
      <div class="p-row"><label>Inscrito</label><span class="seg">${[['1', 'Sí'], ['0', 'No']].map(([v, l]) => `<button data-ins="${v}" aria-pressed="${S.inscrito === (v === '1')}">${l}</button>`).join('')}</span></div>
    </section>
    <section class="p-group"><h2>Ruleta</h2>
      <p class="p-help">Qué sale al girar:</p>
      <div class="p-chips">${[['', 'Al azar'], ['cuarto', '? Fondo nuevo'], ['panes', '20 panes'], ['regalo', 'Regalo (prenda al azar)'], ['prenda', 'Prenda de la semana'], ['otra', 'Otra oportunidad']].map(([v, l]) => `<button data-premio="${v}" aria-pressed="${(S.forzarPremio || '') === v}">${l}</button>`).join('')}</div>
      <div class="p-btns"><button class="p-btn main" data-act="ruletaOtraVez">Girar la ruleta otra vez</button></div>
      <p class="p-help">Vuelve a abrir la ruleta de esta semana sin cambiar de día (días 4, 11, 18 y 24).</p>
    </section>
    <section class="p-group"><h2>Compartir</h2>
      <div class="p-btns"><button class="p-btn main" data-act="share">Copiar enlace a este estado</button><button class="p-btn" data-act="reset">Volver al día 9</button></div>
      <p class="p-help">El enlace abre la app en esta misma pantalla y estado. Sirve para decir «mira esto» por Slack.</p>
    </section>
    <details class="p-group p-rules"><summary>Reglas que usa el MVP</summary><ul class="p-list">
      <li><b>Panes</b><small>Contenido +${RULES.panes.contenidoPremium} premium / +${RULES.panes.contenidoFree} free · trivia +${RULES.panes.trivia} · sorpresa +${RULES.panes.sorpresa} · ruleta ${RULES.panes.ruleta}</small></li>
      <li><b>Batería</b><small>Terminar un cuento la llena · cada día sin caminar baja una rayita · nunca bloquea</small></li>
      <li><b>Ruleta</b><small>Días ${RULES.ruleta.join(', ')} · al tocarla en el mapa</small></li>
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
  panel.innerHTML = head + `<div class="p-body">${simple}<details class="p-more" ${moreOpen ? 'open' : ''}><summary>Más herramientas para el equipo</summary>${tabsHtml}<div class="p-more-body">${body}</div></details></div>`;
  panel.dataset.tab = tab;
  if (sameTab) panel.querySelector('.p-body').scrollTop = scroll;
}

panel.addEventListener('toggle', e => { if (e.target.matches('.p-more')) moreOpen = e.target.open; }, true);
panel.addEventListener('click', e => {
  const t = e.target.closest('button'); if (!t) return;
  if (t.dataset.tab) { tab = t.dataset.tab; if (t.dataset.filtro) filtro = t.dataset.filtro; try { localStorage.setItem('cab-tab2', tab); } catch { /* */ } render(); return; }
  if (t.dataset.filtro) { filtro = t.dataset.filtro; render(); return; }
  if (t.dataset.plan) { S.plan = t.dataset.plan; save(); nota(S.plan === 'free' ? 'Ahora eres free' : S.plan === 'pase' ? 'Ahora tienes el Pase de Adviento' : 'Ahora eres premium'); return; }
  if (t.dataset.tema) { S.tema = t.dataset.tema; save(); go(cur?.name === 'estatica' ? 'hoy' : cur?.name || 'hoy', cur?.params || {}, 'fade'); return; }
  if (t.dataset.ins) { S.inscrito = t.dataset.ins === '1'; save(); go('hoy', {}, 'fade'); return; }
  if (t.dataset.bat) { S.bateria = +t.dataset.bat; save(); go(cur?.name || 'hoy', cur?.params || {}, 'none'); return; }
  if ('premio' in t.dataset) { S.forzarPremio = t.dataset.premio; save(); return; }
  if (t.dataset.scen) { const r = REC[+t.dataset.scen]; r.run(); save(); go(r.go, {}, 'fade'); nota(r.t, r.mira); closeMobile(); return; }
  if (t.dataset.go) { go(t.dataset.go, {}, 'fade'); closeMobile(); return; }
  if (t.dataset.file) { go('estatica', { file: t.dataset.file, back: cur?.name !== 'estatica' ? cur?.name : 'hoy', backParams: cur?.params }, 'fade'); closeMobile(); return; }
  const a = t.dataset.act;
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
  if (t.id === 'dSel') { S.hoy = +t.value; save(); go('hoy', {}, 'fade'); }
  if (t.id === 'pSel') { const n = +t.value; fill(n); if (n > 0) { S.inscrito = true; S.teaserVisto = true; } if (S.hoy < n) S.hoy = n; save(); go(cur?.name === 'mapa' ? 'mapa' : 'hoy', {}, 'fade'); }
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
