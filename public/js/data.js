// Contenido del camino. Fuente: lienzo «Theo Quest · Camino a Belén»
// (Íconos del camino, Arte 5 · Ilustraciones, Simple-Reglas, Datos).
// Las preguntas de trivia son propuesta para el MVP: revisar con contenido/pastoral.

export const IMG = {
  maria: '8afe2c2bcf5059804b51f40a1a7885f8', oveja: '543f9314fe9fabc594275985114d3d36',
  teodoro: 'f2c3d1af29c060c91efbf35ede368c80', estrella: 'c1e5ee9a1f2c5bbdc81016b68efe050b',
  jose: '3b63e04a9185489b1a91612a3907c6b4', pastor: 'e07f6af93fb16342d996ee67fc5a4f85',
  lampara: 'd8eb2bc12316a1e94f670288bb6e136a', gabriel: 'c3a74965b1ac9e159c6556947a68d3a5',
  reyes: '7fd0b6da0f3db8283d60acaffc952eaf', nino: '46f3f3019ffe7e189c230d710bde97ec',
  corona: '209dadda6ec89387ba94391283a82819', isabel: '0573721cfb9c2522ea349da0934be5c8',
  pergamino: '8325ca235ba2fb8f0fd97f515b622ffc', manzana: '6e92187eb364b89efd0d37223e75c141',
  cuarto: '16ea87b5ecae2048c4c2210e6f0daf32', gorro: '28a067c47bf9134f91f26a009e0465b5',
  bufanda: 'ed7f054b6f0d602d40b41b8d2706379a', bolso: '5395dc871861741f74c551c3a1031492',
  paja: '98a7495c73f5fff24bb7130fa01efe67', pan: '5bab1fe48e4c5009d62da468a9d7f69f',
  pesebre: '06d17746a01e5a05a453fdf6f0e24b1d', farol: '8f9cd03fb68bac90ed249fa5d45f0828',
  dorso: '834fcca7dd481ce118a38c73d90f02cc', regalo: '40de1cf55d4441bd10615c06350dde30', nacimiento: '455d2635515c50327d1e7cc360590069',
  // Teodoro por nivel de batería (Teodoro-Energia)
  t5: '345591e97560d37b84ead12837ff9c75', t4: '64167d45da19875626c545019275e29c',
  t3: '7bfff4a8f40290f70de7fc8e49ee7d4d', t2: '52ba38f10b723e04ad04beea396aba0c',
  t1: '976c9b59c0fcc1d60682381e421591ee', t0: '55c6a5fd9cf68d7041920d65829c3c80',
  tCelebra: 'a98be2e11e018975563512bddc52be5a', tPregunta: 'cd7abd57ac6154597b18285ae710d7ba',
  tFarol: '12a860faaeb0bce3b45192bde1b48d63', tCamina: '67947142d31d9fb5442ef113320694e6',
  // Batería en uso, 0..5
  b0: '27bb485f436b46be2a2d653b3a20bf3f', b1: 'deac36cce020e374cf7f482297f2082d',
  b2: 'cf767fcbf0222668adbf6d034ac727a3', b3: '0c32fdbef8718a32c8591f2e1f735206',
  b4: '1026bcf94b07418de82a878d671104b2', b5: '4b563b5c264cac11814acc731db9db86',
};

// Ícono de cada día, el mismo del mapa del Figma («Mapa Diozen»); de noche el Figma usa el mismo dibujo
const ICONO_DIA = [null, 'luna', 'vela', 'burro', 'pergamino', 'notas', 'casa', 'rompecabezas', 'carta', 'vela', 'burro', 'pergamino', 'notas', 'casa', 'rompecabezas', 'regalo', 'burro', 'vela', 'pergamino', 'casa', 'notas', 'rompecabezas', 'corazon', 'burro', 'pergamino', 'video', 'estrella'];
const DAY_ICONS = Object.fromEntries(ICONO_DIA.map((x, n) => [n, x ? [`dia-icono/${x}.webp`, `dia-icono/${x}.webp`] : [null, null]]));
export function iconOf(n, dark) { return DAY_ICONS[n]?.[dark ? 1 : 0] || null; }

export const BATTERY_IDS = [IMG.b0, IMG.b1, IMG.b2, IMG.b3, IMG.b4, IMG.b5];
export const TEODORO_IDS = [IMG.t0, IMG.t1, IMG.t2, IMG.t3, IMG.t4, IMG.t5];
export const ENERGY_NAMES = ['Dormido', 'Cabeceando', 'Agotado', 'Tranquilo', 'Travieso', 'Feliz'];

// Escenas por día (Arte 5): días 3–26 listas; 1 y 2 «FALTA»
const SCENES = {
  3: '6fd57032840014e77e98d35d8201b13b', 4: 'f32fdcdc86233fa9b456d4c52a4a73f0', 5: '159e005b01f8e32191bbf3fe1358c5a7',
  6: 'd033c6a2403c27d416eed13191f777a3', 7: '1529466222277b40de85bc9f1c132aed', 8: '9a0f0f25c30652f0366d5725ba49158f',
  9: 'e5c590902fea7da50e33cf7584629163', 10: '01b7d95b9bfce11df9fbbb29914bcce5', 11: 'b3f6a9c88f4b32088adc3c722526ce4c',
  12: '9c5323977b16daf5e2eb5168fa1bb177', 13: 'd800d0f4a9fe7ec2f631ee8f4fb2ebd4', 14: '78a055f73ee6e1fc8c14f39bb931fc77',
  15: 'e7f682b970adabda92b49f1e7f8d04f5', 16: '9caf33a9fc36d0b8f6f7803571fa85a3', 17: 'a8f25293f207dc7eab99b4a2491972c9',
  18: '183c744879d8ae7dd89b10934cde465c', 19: 'c4ccddc6600cba02966d74b4e5937ac8', 20: '55a8fbeeef883e5d3d7d6f081d8bd168',
  21: '832e6416715007c87bf50f5330cb8eff', 22: '641044c4e0d7d7c08e0922364396cba6', 23: '0379fd70721f131c8b3d2576470ed921',
  24: '47459af67a4b5599e33f6147ecedf0f3', 25: 'ff5ba60d05369d61e404403a80c98628', 26: '455d2635515c50327d1e7cc360590069',
};

// Formato de cada tipo (cronograma de contenido): fila de la hoja, botón y lo que se celebra al terminar.
// Video: cuento, meditación, Evangelio del domingo (lo lee un influencer), Amigos de la Biblia y Navidad de Canela.
export const TYPES = {
  intro: { label: 'Teodoro te lo cuenta', content: 'Video', min: 3, verbo: 'Ver video', fin: '¡Terminaste el video!' },
  domingo: { label: 'Domingo', content: 'Video', min: 4, verbo: 'Ver video', fin: '¡Escuchaste el Evangelio!' },
  meditacion: { label: 'Meditación', content: 'Video', min: 4, verbo: 'Ver video', fin: '¡Terminaste el video!' },
  cuento: { label: 'Cuento con Teodoro', content: 'Video', min: 5, verbo: 'Ver video', fin: '¡Terminaste el video!' },
  amigos: { label: 'Amigos de la Biblia', content: 'Video', min: 5, verbo: 'Ver video', fin: '¡Terminaste el video!' },
  cancion: { label: 'Canción', content: 'Canción', min: 3, verbo: 'Escuchar canción', fin: '¡Terminaste la canción!' },
  reto: { label: 'Reto en familia', content: 'Reto en familia', min: 10, verbo: 'Ver el reto', fin: '¡Hicieron el reto!' },
  juego: { label: 'Juego', content: 'Juego', min: 5, verbo: 'Jugar', fin: '¡Jugaron con Teodoro!' },
  video: { label: 'Video', content: 'Video', min: 6, verbo: 'Ver video', fin: '¡Terminaste el video!' },
  nochebuena: { label: 'Actividad final', content: 'Actividad final', min: 6, verbo: 'Comenzar', fin: '¡Llegamos a Belén!' },
};

const MESES = ['NOVIEMBRE', 'DICIEMBRE'];
const DOW = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
// Día 1 = domingo 29 nov 2026 · Día 26 = jueves 24 dic 2026
export function dateOf(day) {
  const d = new Date(2026, 10, 28 + day);
  return { dow: DOW[d.getDay()], dd: d.getDate(), mes: MESES[d.getMonth() - 10] ?? 'ENERO', label: `${DOW[d.getDay()]} ${d.getDate()} DE ${MESES[d.getMonth() - 10] ?? 'ENERO'}` };
}

const D = (n, type, title, extra = {}) => ({ n, type, title, scene: SCENES[n] || null, ...extra });
// sub: una línea (≤60) sacada de la descripción del cronograma · cita: la lectura y la velita (domingos), en segunda línea · reto/pasos: lo que se hace en el hub ·
// descarga: la fila «descargable» de la hoja (en los retos de acción lleva a los pasos del reto)
const DESCARGA = { t: 'Imprimible del día', s: 'Para colorear en familia' };
const ACCION = { t: 'Reto del día', s: 'Los pasos para hacerlo juntos', accion: true };
export const DAYS = [
  D(0, 'intro', '¿Qué es el Adviento?', { sub: 'No esperamos algo, esperamos a Alguien' }),
  D(1, 'domingo', 'Domingo de la Esperanza', { cita: 'Mc 13,33-37 · 1.ª velita', vela: 1, sub: 'Esperamos a Jesús con el corazón despierto', descarga: { t: 'Corona de Adviento', s: 'Ármenla en familia' }, imprimible: IMG.corona }),
  D(2, 'meditacion', 'Estamos esperando a alguien', { sub: 'Jesús vino, viene y vendrá' }),
  D(3, 'cuento', 'Maranatha en mi corazón', { sub: 'Ser pesebre para que Jesús llegue' }),
  D(4, 'amigos', 'Parábola de los talentos', { sub: 'Cuidar lo que Dios nos confía' }),
  D(5, 'cancion', 'Maranatha', { sub: 'Ven, Señor Jesús' }),
  D(6, 'reto', 'Es hora de preparar el corazón', { sub: '«Les daré un corazón nuevo» (Ez 36,26)', reto: 'Ordenen algo por fuera y algo por dentro', descarga: ACCION,
    pasos: ['Ordenen juntos el cuarto: cada cosa en su lugar.', 'Piensen en alguien a quien perdonar y díganselo con cariño.', 'Recen juntos: «Jesús, dame un corazón nuevo».'] }),
  D(7, 'juego', 'Teodoro dice', { sub: 'Hagan solo lo que manda «Teodoro dice»',
    pasos: ['Uno hace de Teodoro y da las órdenes; los demás obedecen solo si empiezan con «Teodoro dice».', 'Usen órdenes de Adviento: «Teodoro dice: caminen como burrito hasta Belén», «Teodoro dice: hagan como que encienden una velita».', 'Quien se equivoque pasa a ser Teodoro. Terminen con un abrazo de familia.'] }),
  D(8, 'domingo', 'Domingo de la Fe', { cita: 'Mc 1,1-8 · 2.ª velita', vela: 2, sub: '«Preparen el camino del Señor»' }),
  D(9, 'meditacion', 'Meditación de la Escucha', { sub: 'Dios nos pide escuchar: Shemá' }),
  D(10, 'cuento', 'Orejas de Shemá', { sub: 'Isaías escucha y responde: «Aquí estoy»' }),
  D(11, 'amigos', 'La casa sobre la roca', { sub: 'Escuchar a Jesús y ponerlo en práctica' }),
  D(12, 'cancion', 'Shemá', { sub: 'Una canción para escuchar a Dios' }),
  D(13, 'reto', 'Pesebre', { sub: 'Un rincón que recuerda que Dios está con ustedes', reto: 'Coloréalo con tu familia', descarga: { t: 'Pesebre para colorear', s: 'Para tenerlo en casa' },
    pasos: ['Imprime el pesebre y busquen sus colores.', 'Mientras pintan, hablen de María, José, los pastores y Jesús.', 'Pónganlo en un rincón especial de la casa.'] }),
  D(14, 'juego', 'Teléfono roto con la Biblia', { sub: 'Una frase de la Biblia que pasa de oído en oído', 
    pasos: ['Siéntense en ronda. Papá o mamá elige una frase, como «Preparen el camino del Señor».', 'Se la dicen al oído al de al lado, y así hasta el último.', 'El último la dice en voz alta: ¿llegó igual? Léanla juntos.'] }),
  D(15, 'domingo', 'Domingo de la Alegría', { cita: 'Jn 1,6-8.19-28 · 3.ª velita (rosa)', vela: 3, sub: 'Nos alegramos: la Luz ya está cerca' }),
  D(16, 'cuento', 'Esperanza en 4 patas', { sub: 'Un fuego que enciende el mundo' }),
  D(17, 'meditacion', 'Jaire, la alegría que viene de Dios', { sub: 'La alegría es saber que Dios está conmigo' }),
  D(18, 'amigos', 'La oveja perdida', { sub: 'Hay alegría en el cielo por cada uno' }),
  D(19, 'reto', 'Prende tu luz', { sub: '«Tú eres la luz del mundo»', reto: '«Tú eres la luz del mundo»', descarga: ACCION,
    pasos: ['Con papá o mamá, apaguen las luces y prendan una velita o una linterna.', 'Miren cómo la oscuridad desaparece.', 'Pregúntense: ¿a quién puedo iluminar hoy? ¿Cómo puedo ser luz?'] }),
  D(20, 'cancion', 'Talita', { sub: 'Hay alegría en el cielo' }),
  D(21, 'juego', 'Busquen la estrella', { sub: 'Como los Magos, sigan la estrella hasta encontrarla',
    pasos: ['Recorten una estrella de papel.', 'Uno la esconde en la casa y los demás la buscan; ayuden con «frío», «tibio» y «caliente».', 'Quien la encuentre la pone junto al pesebre o en la ventana y cuenta algo bonito de su día.'] }),
  D(22, 'domingo', 'Domingo del Amor', { cita: 'Lc 1,26-38 · 4.ª velita', vela: 4, sub: 'María le dice sí a Jesús' }),
  D(23, 'cuento', 'Un burro de Navidad', { sub: 'Un cuento de Navidad con Teodoro' }),
  D(24, 'amigos', 'Especial de Navidad', { sub: 'Los Amigos de la Biblia esperan la Navidad' }),
  D(25, 'video', 'Navidad de Canela', { sub: 'Un cuento de Navidad' }),
  D(26, 'nochebuena', 'El nacimiento de Jesús', { cita: 'Actividad final', sub: 'Llegamos a Belén: hoy nace Jesús' }),
];
DAYS.forEach(d => { d.descarga ||= DESCARGA; });
/** El día se hace en el hub (pasos + «¡Lo hicimos!») y no en el reproductor: retos y juegos en familia. */
export const usaHub = n => DAYS[n]?.type === 'reto' || !!DAYS[n]?.pasos;

// Reglas acordadas con César (20-oct-2026)
export const RULES = {
  ruleta: [4, 11, 18, 24],                  // al iniciar el día, pop-up sobre el cuento
  // cada 3 días, en orden fijo (lienzo, sección 4): 3 Memorama, 6 Adivinanza, 9 Desafío y así sigue
  sorpresa: { 3: 'memorama', 6: 'adivinanza', 9: 'desafio', 12: 'memorama', 15: 'adivinanza', 18: 'desafio', 21: 'memorama', 24: 'adivinanza' },
  panes: { contenidoPremium: 15, contenidoFree: 7, trivia: 10, sorpresa: 15, ruleta: 20 },
  // terminar un cuento la llena (5/5); cada día completo sin hacer nada baja una rayita
  bateria: { contenido: 5, diaSinAdviento: -1 },
  regresoDias: 5, // días seguidos sin caminar para «¡Te guardé el camino!»
  // días con trivia según el cronograma de contenido (Adviento 2026, columna ACTIVIDAD = TRIVIA).
  // Los demás días no tienen trivia ni estrellas: el día se completa con la historia.
  trivia: [1, 2, 3, 4, 9, 11, 17, 18, 24],
};
export const hasTrivia = n => RULES.trivia.includes(n);

// Prenda de cada semana (la del regalo de la ruleta). Semana 4: por definir en el lienzo.
export const PRENDAS = [
  { id: 'gorro', nombre: 'un gorro', img: IMG.gorro, sub: 'Teodoro ya lo tiene puesto' },
  { id: 'bufanda', nombre: 'una bufanda', img: IMG.bufanda, sub: 'Teodoro ya la tiene puesta' },
  { id: 'bolso', nombre: 'un bolso', img: IMG.bolso, sub: 'Teodoro ya lo lleva' },
  { id: 'paja', nombre: 'una cama de paja', img: IMG.paja, sub: 'Ya está en el cuarto de Teodoro' },
];

// Trivia: 5 preguntas por día. o = opciones (texto o {t,img}); a = índice correcto o lista (varias)
const P = (q, o, a, pista, ok) => ({ q, o, a, pista, ok });
const pic = (t, k) => ({ t, img: IMG[k] });
export const TRIVIA = {
  1: [
    P('¿Qué encendemos el primer domingo de Adviento?', ['La primera vela', 'Todas las velas', 'Una fogata', 'El árbol'], 0, 'se enciende una cada domingo', 'La vela de la esperanza'),
    P('¿Cuántas velas tiene la corona de Adviento?', ['Dos', 'Cuatro', 'Siete', 'Diez'], 1, 'una por cada domingo', 'Cuatro velas, cuatro domingos'),
    P('¿A quién esperamos en Adviento?', [pic('Jesús', 'nino'), pic('Los Reyes', 'reyes'), pic('Un pastor', 'pastor')], 0, 'nace en Belén', '¡Esperamos a Jesús!'),
    P('¿Qué nos regala la primera vela?', ['Esperanza', 'Prisa', 'Miedo', 'Sueño'], 0, 'es la vela de la …', 'La esperanza'),
    P('¿Cómo esperamos a Jesús?', ['Con el corazón despierto', 'Con alegría', 'Haciendo travesuras', 'Cuidando a los demás'], [0, 1, 3], 'son tres respuestas', '¡Así se espera a Jesús!'),
  ],
  2: [
    P('¿Qué quiere decir «Adviento»?', ['Llegada', 'Vacaciones', 'Viento', 'Regalo'], 0, 'alguien viene', 'Adviento es «llegada»'),
    P('¿Quién está por llegar?', [pic('Jesús', 'nino'), pic('Una oveja', 'oveja'), pic('Teodoro', 'teodoro')], 0, 'es el Hijo de Dios', 'Jesús viene a nosotros'),
    P('Cuando esperamos a un amigo, preparamos…', ['La casa', 'Una pelea', 'Nada', 'Un enojo'], 0, 'que todo esté listo', 'Preparamos la casa… y el corazón'),
    P('¿Qué podemos hacer mientras esperamos?', ['Rezar', 'Ayudar en casa', 'Gritar', 'Perdonar'], [0, 1, 3], 'son tres', '¡Muy bien!'),
    P('¿Quién fue la primera en esperar a Jesús?', [pic('María', 'maria'), pic('Isabel', 'isabel'), pic('Un pastor', 'pastor')], 0, 'es su mamá', 'María lo esperó con amor'),
  ],
  3: [
    P('¿Qué significa «Maranatha»?', ['Ven, Señor', 'Buenas noches', 'Gracias', 'Adiós'], 0, 'es una oración muy corta', '«Ven, Señor Jesús»'),
    P('¿Dónde quiere vivir Jesús?', ['En mi corazón', 'En una nube', 'En el mar', 'En un castillo'], 0, 'está dentro de ti', 'En tu corazón'),
    P('¿Quién acompaña a Teodoro en el cuento?', [pic('María', 'maria'), pic('Gabriel', 'gabriel'), pic('Los Reyes', 'reyes')], 0, 'es la mamá de Jesús', 'María camina con él'),
    P('¿Cuándo podemos decir «Maranatha»?', ['Siempre', 'Solo en Navidad', 'Nunca', 'Solo de día'], 0, 'no hay hora para rezar', 'Siempre podemos llamarlo'),
    P('Un corazón listo para Jesús es…', ['Limpio', 'Alegre', 'Enojado', 'Generoso'], [0, 1, 3], 'son tres', '¡Así se prepara!'),
  ],
  4: [
    P('¿Qué repartió el señor a sus siervos?', ['Talentos', 'Manzanas', 'Ovejas', 'Velas'], 0, 'eran monedas de mucho valor', 'Les dio talentos'),
    P('¿Qué hizo el siervo que guardó su talento bajo tierra?', ['No lo usó', 'Lo multiplicó', 'Lo regaló', 'Lo perdió en el mar'], 0, 'tuvo miedo', 'Lo escondió y no lo usó'),
    P('¿Qué talentos te dio Dios a ti?', ['Cantar', 'Ayudar', 'Dibujar', 'Escuchar'], [0, 1, 2, 3], 'todas pueden ser', '¡Todos son regalos de Dios!'),
    P('Los talentos se usan para…', ['Ayudar a los demás', 'Presumir', 'Esconderlos', 'Pelear'], 0, 'piensa en el siervo bueno', 'Para servir y amar'),
    P('¿Quién contó esta parábola?', [pic('Jesús', 'nino'), pic('Un pastor', 'pastor'), pic('José', 'jose')], 0, 'el Maestro', 'Jesús la contó'),
  ],
  5: [
    P('¿Qué decimos al cantar «Maranatha»?', ['Ven, Señor', 'Vámonos', 'Hola', 'Ya llegué'], 0, 'lo aprendiste el día 3', '«Ven, Señor Jesús»'),
    P('¿Con quién cantamos la canción?', ['Con la familia', 'Solos y callados', 'Con nadie', 'Con enojo'], 0, 'es una canción para compartir', 'En familia suena mejor'),
    P('Cantar a Dios es una forma de…', ['Rezar', 'Dormir', 'Comer', 'Pelear'], 0, 'hablar con Él', '¡Quien canta reza dos veces!'),
    P('¿Quién cantó de alegría cuando nació Jesús?', [pic('Los ángeles', 'gabriel'), pic('Una oveja', 'oveja'), pic('Teodoro', 'teodoro')], 0, 'vinieron del cielo', 'Los ángeles cantaron gloria'),
    P('¿Cómo nos sentimos al esperar a Jesús?', ['Alegres', 'Con esperanza', 'Aburridos', 'Con paz'], [0, 1, 3], 'son tres', '¡Así esperamos!'),
  ],
  6: [
    P('¿Quién dijo «Preparen el camino del Señor»?', ['Juan el Bautista', 'Un rey', 'Teodoro', 'Un soldado'], 0, 'era primo de Jesús', 'Juan el Bautista'),
    P('Preparar el corazón es…', ['Pedir perdón', 'Ser amable', 'Ser egoísta', 'Rezar'], [0, 1, 3], 'son tres', '¡Así se prepara!'),
    P('¿De quién era hijo Juan el Bautista?', [pic('Isabel', 'isabel'), pic('María', 'maria'), pic('Un pastor', 'pastor')], 0, 'era prima de María', 'De Isabel y Zacarías'),
    P('¿Qué hiciste hoy en familia?', ['Una carta a Jesús', 'Una carrera', 'Un pastel', 'Nada'], 0, 'escribiste algo', 'Una carta para Jesús'),
    P('¿Para quién preparamos el corazón?', [pic('Jesús', 'nino'), pic('Los Reyes', 'reyes'), pic('Gabriel', 'gabriel')], 0, 'llega en Navidad', 'Para Jesús'),
  ],
  7: [
    P('¿Quién camina con nosotros hasta Belén?', [pic('Teodoro', 'teodoro'), pic('Una oveja', 'oveja'), pic('Gabriel', 'gabriel')], 0, 'es un burrito', '¡Teodoro!'),
    P('¿En qué pueblo nació Jesús?', ['Belén', 'Roma', 'Nazaret', 'Egipto'], 0, 'vamos camino a…', 'En Belén'),
    P('¿Dónde vivían María y José?', ['Nazaret', 'Belén', 'Jerusalén', 'Roma'], 0, 'empezamos el camino allí', 'En Nazaret'),
    P('¿Qué guió a los Reyes Magos?', [pic('Una estrella', 'estrella'), pic('Un farol', 'lampara'), pic('Una oveja', 'oveja')], 0, 'brillaba en el cielo', 'Una estrella'),
    P('Jugar en familia nos ayuda a…', ['Estar unidos', 'Reír juntos', 'Pelear', 'Compartir'], [0, 1, 3], 'son tres', '¡Qué buen equipo!'),
  ],
  8: [
    P('¿Cuántas velas encendemos hoy?', ['Una', 'Dos', 'Tres', 'Cuatro'], 1, 'es el segundo domingo', 'Dos velas'),
    P('¿Qué significa tener fe?', ['Confiar en Dios', 'Tener miedo', 'Saberlo todo', 'Estar solo'], 0, 'como un niño con su papá', 'Confiar en Dios'),
    P('¿Quién creyó en lo que le dijo el ángel?', [pic('María', 'maria'), pic('Un pastor', 'pastor'), pic('Isabel', 'isabel')], 0, 'dijo «sí»', 'María creyó'),
    P('¿Qué dijo María al ángel?', ['Hágase en mí', 'No quiero', 'Mañana', 'Tengo miedo'], 0, 'dijo que sí', '«Hágase en mí según tu palabra»'),
    P('¿Cómo crece la fe?', ['Rezando', 'Escuchando la Palabra', 'Ignorando a Dios', 'Amando'], [0, 1, 3], 'son tres', '¡Así crece!'),
  ],
  9: [
    P('¿Quién cuidó a María en el camino?', [pic('José', 'jose'), pic('Gabriel', 'gabriel'), pic('Un pastor', 'pastor')], 0, 'era su esposo', 'José cuidó a María'),
    P('¿Quién le dijo a María que no tuviera miedo?', [pic('Isabel', 'isabel'), pic('José', 'jose'), pic('Gabriel', 'gabriel')], 2, 'vino del cielo y tiene alas', 'Fue el ángel Gabriel'),
    P('¿Para escuchar a Dios necesitamos…?', ['Silencio', 'Mucho ruido', 'Gritar', 'Correr'], 0, 'cierra los ojos', 'Un corazón en silencio'),
    P('¿Dónde podemos escuchar a Dios?', ['En la oración', 'En la Biblia', 'En los demás', 'En la televisión'], [0, 1, 2], 'son tres', '¡Dios nos habla así!'),
    P('¿Qué hizo María con las palabras del ángel?', ['Las guardó en su corazón', 'Las olvidó', 'Se rió', 'Se fue'], 0, 'las guardó muy dentro', 'Las guardó en su corazón'),
  ],
  10: [
    P('¿Qué significa «Shemá»?', ['Escucha', 'Corre', 'Duerme', 'Canta'], 0, 'tiene que ver con las orejas', '«Escucha, Israel»'),
    P('¿Por qué Teodoro tiene orejas grandes?', ['Para escuchar mejor', 'Para volar', 'Para asustar', 'Para nadar'], 0, 'oye todo', '¡Para escuchar a Dios!'),
    P('¿A quién escuchó Samuel de niño?', ['A Dios', 'A un rey', 'A un león', 'A nadie'], 0, 'lo llamaron de noche', 'Dios lo llamó y él respondió'),
    P('¿Qué respondió Samuel?', ['Habla, Señor, que tu siervo escucha', 'Déjame dormir', 'No te oigo', 'Mañana'], 0, 'estaba listo', '«Habla, Señor…»'),
    P('Escuchar bien es…', ['Mirar a quien habla', 'Hacer silencio', 'Interrumpir', 'Prestar atención'], [0, 1, 3], 'son tres', '¡Buenas orejas!'),
  ],
  11: [
    P('¿Dónde construyó su casa el hombre sabio?', ['Sobre la roca', 'Sobre la arena', 'En el agua', 'En una nube'], 0, 'algo firme', 'Sobre la roca'),
    P('¿Qué pasó con la casa sobre la arena?', ['Se cayó', 'Creció', 'Voló', 'Brilló'], 0, 'llegó la tormenta', 'Se derrumbó'),
    P('¿Quién es nuestra roca firme?', [pic('Jesús', 'nino'), pic('Teodoro', 'teodoro'), pic('Una oveja', 'oveja')], 0, 'nunca nos falla', 'Jesús es nuestra roca'),
    P('Construimos sobre la roca cuando…', ['Escuchamos a Jesús', 'Hacemos lo que dice', 'Lo ignoramos', 'Amamos'], [0, 1, 3], 'son tres', '¡Casa firme!'),
    P('¿Qué llegó a las dos casas?', ['La lluvia y el viento', 'Una fiesta', 'Los Reyes', 'Un burrito'], 0, 'una tormenta', 'Lluvia, ríos y viento'),
  ],
  12: [
    P('¿Qué canción cantamos hoy?', ['Shemá', 'Noche de paz', 'Cumpleaños', 'Maranatha'], 0, 'significa «escucha»', 'Shemá'),
    P('«Shemá» nos invita a…', ['Escuchar a Dios', 'Dormir', 'Correr', 'Gritar'], 0, 'orejas atentas', 'Escuchar a Dios'),
    P('¿Con qué amamos a Dios?', ['Con todo el corazón', 'Con toda el alma', 'Con nada', 'Con todas las fuerzas'], [0, 1, 3], 'son tres', '¡Con todo!'),
    P('¿Quién nos enseña a escuchar en este camino?', [pic('Teodoro', 'teodoro'), pic('Los Reyes', 'reyes'), pic('Un pastor', 'pastor')], 0, 'tiene orejas grandes', '¡Teodoro!'),
    P('Cantar en familia nos hace…', ['Más unidos', 'Más tristes', 'Más solos', 'Más enojados'], 0, 'juntos', 'Más unidos'),
  ],
  13: [
    P('¿Dónde acostaron a Jesús al nacer?', [pic('En un pesebre', 'nino'), pic('En un castillo', 'reyes'), pic('En la paja del campo', 'paja')], 0, 'donde comen los animales', 'En un pesebre'),
    P('¿Quiénes estaban en el pesebre?', ['María', 'José', 'Un dragón', 'Jesús'], [0, 1, 3], 'son tres', '¡La Sagrada Familia!'),
    P('¿Por qué nació en un pesebre?', ['No había lugar en la posada', 'Le gustaban los animales', 'Era verano', 'Se perdieron'], 0, 'todo estaba lleno', 'No había lugar para ellos'),
    P('¿Qué animal llevó a María según la tradición?', [pic('Un burrito', 'teodoro'), pic('Una oveja', 'oveja'), pic('Un camello', 'reyes')], 0, 'como Teodoro', '¡Un burrito!'),
    P('¿Con quién coloreaste el pesebre?', ['Con mi familia', 'Con nadie', 'Con un robot', 'Con un rey'], 0, 'era un reto en familia', 'En familia'),
  ],
  14: [
    P('En el teléfono roto, el mensaje…', ['Cambia si no escuchamos bien', 'Nunca cambia', 'Se vuelve canción', 'Desaparece'], 0, 'pasa de oreja en oreja', 'Por eso hay que escuchar bien'),
    P('¿Quién llevó el mensaje de Dios a María?', [pic('Gabriel', 'gabriel'), pic('José', 'jose'), pic('Isabel', 'isabel')], 0, 'un ángel', 'El ángel Gabriel'),
    P('¿Qué mensaje llevaron los ángeles a los pastores?', ['Les ha nacido un Salvador', 'Vayan a dormir', 'Cuiden sus ovejas', 'Vuelvan mañana'], 0, 'una buena noticia', '«Les ha nacido un Salvador»'),
    P('La Palabra de Dios la encontramos en…', ['La Biblia', 'Un periódico', 'Un videojuego', 'Una caja'], 0, 'un libro santo', 'En la Biblia'),
    P('Para pasar bien un mensaje hay que…', ['Escuchar', 'Hablar claro', 'Inventar', 'Prestar atención'], [0, 1, 3], 'son tres', '¡Mensaje perfecto!'),
  ],
  15: [
    P('¿De qué color es la vela de hoy?', ['Rosa', 'Verde', 'Negra', 'Azul'], 0, 'es distinta a las demás', 'Rosa, ¡la vela de la alegría!'),
    P('¿Por qué estamos alegres?', ['Jesús está cerca', 'Hay vacaciones', 'Hay dulces', 'Llovió'], 0, 'falta poco', '¡Jesús ya viene!'),
    P('¿Cuántas velas hay encendidas hoy?', ['Dos', 'Tres', 'Cuatro', 'Una'], 1, 'tercer domingo', 'Tres velas'),
    P('¿Quién saltó de alegría al oír a María?', [pic('El niño de Isabel', 'isabel'), pic('Un pastor', 'pastor'), pic('Teodoro', 'teodoro')], 0, 'estaba en el vientre de su mamá', 'Juan saltó en el vientre de Isabel'),
    P('La alegría de Dios se comparte…', ['Sonriendo', 'Ayudando', 'Callando todo', 'Visitando a alguien'], [0, 1, 3], 'son tres', '¡Alegría compartida!'),
  ],
  16: [
    P('¿Quién es el héroe de este cuento?', [pic('Un burrito', 'teodoro'), pic('Un rey', 'reyes'), pic('Una oveja', 'oveja')], 0, 'tiene cuatro patas', '¡Un burrito!'),
    P('¿Qué llevó el burrito en el viaje a Belén?', ['A María', 'Un tesoro', 'Juguetes', 'Nada'], 0, 'esperaba a Jesús', 'Llevó a María'),
    P('La esperanza es…', ['Confiar en que Dios cumple', 'Rendirse', 'Tener miedo', 'Estar triste'], 0, 'Dios no falla', 'Confiar en sus promesas'),
    P('Aunque el camino sea largo, hay que…', ['Seguir caminando', 'Rendirse', 'Volver atrás', 'Dormir para siempre'], 0, 'paso a paso', '¡Seguir caminando!'),
    P('¿Quién nos da fuerzas en el camino?', ['Dios', 'La familia', 'Los amigos', 'Las peleas'], [0, 1, 2], 'son tres', '¡Nunca caminamos solos!'),
  ],
  17: [
    P('¿Qué significa «Jaire»?', ['Alégrate', 'Duérmete', 'Vete', 'Escóndete'], 0, 'es lo que dijo el ángel', '«Alégrate, llena de gracia»'),
    P('¿A quién le dijo el ángel «Alégrate»?', [pic('María', 'maria'), pic('Isabel', 'isabel'), pic('José', 'jose')], 0, 'la llena de gracia', 'A María'),
    P('¿De dónde viene la alegría verdadera?', ['De Dios', 'De los juguetes', 'De ganar siempre', 'De la tele'], 0, 'no se compra', 'Viene de Dios'),
    P('María estaba llena de…', ['Gracia', 'Miedo', 'Enojo', 'Prisa'], 0, '«llena de …»', 'Llena de gracia'),
    P('¿Cómo compartimos la alegría de Dios?', ['Con un abrazo', 'Rezando juntos', 'Con malas caras', 'Ayudando'], [0, 1, 3], 'son tres', '¡Alegría que se nota!'),
  ],
  18: [
    P('¿Cuántas ovejas tenía el pastor?', ['Cien', 'Diez', 'Tres', 'Mil'], 0, 'muchas, muchas', 'Cien ovejas'),
    P('¿Cuántas se perdieron?', [pic('Una', 'oveja'), pic('Diez', 'reyes'), pic('Ninguna', 'pastor')], 0, 'solo una', 'Una oveja'),
    P('¿Qué hizo el pastor?', ['La buscó hasta encontrarla', 'Se olvidó', 'Se enojó', 'Compró otra'], 0, 'no descansó', 'La buscó hasta encontrarla'),
    P('¿Quién es el Buen Pastor?', [pic('Jesús', 'nino'), pic('Teodoro', 'teodoro'), pic('Un rey', 'reyes')], 0, 'nos busca siempre', 'Jesús es el Buen Pastor'),
    P('Cuando encontró la oveja, el pastor…', ['Hizo fiesta', 'La regañó', 'La dejó', 'Se durmió'], 0, 'estaba feliz', '¡Hubo fiesta en el cielo!'),
  ],
  19: [
    P('Jesús dijo: «Ustedes son la … del mundo»', ['Luz', 'Sombra', 'Nube', 'Piedra'], 0, 'ilumina', '¡Luz del mundo!'),
    P('¿Dónde se pone una lámpara?', [pic('En lo alto', 'lampara'), pic('Debajo de la cama', 'paja'), pic('En una caja', 'pergamino')], 0, 'para que alumbre a todos', 'En lo alto, para alumbrar'),
    P('Prendemos nuestra luz cuando…', ['Ayudamos', 'Perdonamos', 'Peleamos', 'Compartimos'], [0, 1, 3], 'son tres', '¡Qué luz tan bonita!'),
    P('¿Qué luz guió a los Reyes?', ['Una estrella', 'Una vela', 'Un faro', 'La luna'], 0, 'brillaba sobre Belén', 'La estrella de Belén'),
    P('El reto de hoy fue…', ['Hacer algo bueno en secreto', 'Esconderse', 'Apagar las luces', 'Nada'], 0, 'nadie lo sabe', '¡Luz escondida que alumbra!'),
  ],
  20: [
    P('¿Qué significa «Talita kum»?', ['Niña, levántate', 'Buenos días', 'Ven aquí', 'Gracias'], 0, 'Jesús se lo dijo a una niña', '«Niña, levántate»'),
    P('¿Qué hizo Jesús con la niña?', ['La levantó', 'La regañó', 'La dejó', 'Le cantó'], 0, 'le dio la vida', 'La levantó de la mano'),
    P('Jesús tiene poder para…', ['Dar vida', 'Sanar', 'Hacer daño', 'Amar'], [0, 1, 3], 'son tres', '¡Jesús da vida!'),
    P('¿Quién nos tiende la mano siempre?', [pic('Jesús', 'nino'), pic('Una oveja', 'oveja'), pic('Un farol', 'lampara')], 0, 'nunca nos deja', 'Jesús'),
    P('Cantar «Talita» nos recuerda que…', ['Jesús nos levanta', 'Hay que dormir', 'Todo es triste', 'No hay esperanza'], 0, 'nos pone de pie', 'Jesús nos levanta'),
  ],
  21: [
    P('¿Quiénes visitaron al Niño en Belén primero?', [pic('Los pastores', 'pastor'), pic('Los Reyes', 'reyes'), pic('Isabel', 'isabel')], 0, 'cuidaban ovejas de noche', 'Los pastores'),
    P('¿Qué regalos llevaron los Reyes?', ['Oro', 'Incienso', 'Juguetes', 'Mirra'], [0, 1, 3], 'son tres', 'Oro, incienso y mirra'),
    P('¿Cómo se llama el papá adoptivo de Jesús?', [pic('José', 'jose'), pic('Gabriel', 'gabriel'), pic('Un pastor', 'pastor')], 0, 'era carpintero', 'San José'),
    P('¿Cuántos días dura el camino a Belén?', ['26', '7', '100', '3'], 0, 'mira el mapa', '¡26 días!'),
    P('¿Quién es el mejor compañero de camino?', [pic('Teodoro', 'teodoro'), pic('Una oveja', 'oveja'), pic('Un farol', 'lampara')], 0, 'el burrito', '¡Teodoro!'),
  ],
  22: [
    P('¿Cuántas velas encendemos hoy?', ['Cuatro', 'Tres', 'Dos', 'Una'], 0, 'último domingo', '¡Las cuatro!'),
    P('¿De qué es la cuarta vela?', ['Del amor', 'Del sueño', 'Del enojo', 'De la prisa'], 0, 'Dios es…', 'La vela del amor'),
    P('Dios nos ama tanto que nos dio a…', [pic('Jesús', 'nino'), pic('Una estrella', 'estrella'), pic('Una oveja', 'oveja')], 0, 'su Hijo', 'Nos dio a su Hijo'),
    P('Amamos como Jesús cuando…', ['Perdonamos', 'Compartimos', 'Excluimos', 'Ayudamos'], [0, 1, 3], 'son tres', '¡Amor de verdad!'),
    P('¿Cuánto falta para Navidad?', ['Muy poquito', 'Un año', 'Nada, ya pasó', 'Un mes'], 0, 'ya casi', '¡Muy poquito!'),
  ],
  23: [
    P('¿Quién es el burro de Navidad?', [pic('Teodoro', 'teodoro'), pic('Un rey', 'reyes'), pic('Un pastor', 'pastor')], 0, 'nuestro amigo', '¡Teodoro!'),
    P('¿Qué hacía el burrito junto al pesebre?', ['Daba calor al Niño', 'Dormía lejos', 'Se escondía', 'Jugaba'], 0, 'con su aliento', 'Con su aliento daba calor'),
    P('Teodoro es pequeño, pero…', ['Tiene un gran corazón', 'Es malo', 'No sirve', 'Está solo'], 0, 'lo importante es por dentro', '¡Gran corazón!'),
    P('¿A quién llevó el burrito a Belén?', [pic('María', 'maria'), pic('Isabel', 'isabel'), pic('Gabriel', 'gabriel')], 0, 'la mamá de Jesús', 'A María'),
    P('Dios usa a los pequeños para…', ['Hacer cosas grandes', 'Nada', 'Aburrirse', 'Esconderse'], 0, 'como un burrito', '¡Cosas grandes!'),
  ],
  24: [
    P('¿Quién anunció el nacimiento a los pastores?', [pic('Un ángel', 'gabriel'), pic('José', 'jose'), pic('Una oveja', 'oveja')], 0, 'brillaba en la noche', 'Un ángel del Señor'),
    P('¿Qué cantaron los ángeles?', ['Gloria a Dios', 'Buenas noches', 'Feliz cumpleaños', 'Shemá'], 0, '«… en el cielo»', '«Gloria a Dios en el cielo»'),
    P('¿Dónde encontraron al Niño los pastores?', ['En un pesebre', 'En un palacio', 'En el templo', 'En un barco'], 0, 'envuelto en pañales', 'Acostado en un pesebre'),
    P('¿Qué trajo Jesús al mundo?', ['Paz', 'Amor', 'Guerra', 'Alegría'], [0, 1, 3], 'son tres', '¡El mejor regalo!'),
    P('¿Quiénes llegaron siguiendo la estrella?', [pic('Los Reyes', 'reyes'), pic('Los pastores', 'pastor'), pic('Isabel', 'isabel')], 0, 'venían de Oriente', 'Los Reyes Magos'),
  ],
  25: [
    P('¿Qué celebramos en Navidad?', ['El nacimiento de Jesús', 'El año nuevo', 'Un cumpleaños cualquiera', 'Las vacaciones'], 0, 'nace en Belén', 'El nacimiento de Jesús'),
    P('El mejor regalo de Navidad es…', [pic('Jesús', 'nino'), pic('Un gorro', 'gorro'), pic('Una manzana', 'manzana')], 0, 'no viene en caja', '¡Jesús!'),
    P('En Navidad compartimos con…', ['La familia', 'Los que no tienen', 'Nadie', 'Los amigos'], [0, 1, 3], 'son tres', '¡Navidad es compartir!'),
    P('¿Quién guía nuestro camino como la estrella?', ['Dios', 'Un GPS', 'Nadie', 'La suerte'], 0, 'nunca nos pierde', 'Dios nos guía'),
    P('Mañana es Nochebuena. ¿Dónde llegamos?', ['A Belén', 'A Roma', 'A casa de Isabel', 'A Nazaret'], 0, 'el final del camino', '¡A Belén!'),
  ],
};

// Memorama: 6 parejas (V2-Memorama)
export const MEMORAMA = ['maria', 'jose', 'teodoro', 'oveja', 'estrella', 'gabriel'];

// Adivinanza: mazo (Adivinanza-tarjetas). w = palabra, no = palabras prohibidas
export const ADIVINANZA = [
  { w: 'ESTRELLA', img: 'estrella', no: ['luz', 'cielo'] },
  { w: 'MARÍA', img: 'maria', no: ['mamá', 'Jesús'] },
  { w: 'PASTOR', img: 'pastor', no: ['ovejas', 'campo'] },
  { w: 'OVEJA', img: 'oveja', no: ['lana', 'balido'] },
  { w: 'JOSÉ', img: 'jose', no: ['papá', 'carpintero'] },
  { w: 'ÁNGEL', img: 'gabriel', no: ['alas', 'cielo'] },
  { w: 'PESEBRE', img: 'nino', no: ['paja', 'cuna'] },
  { w: 'REYES', img: 'reyes', no: ['corona', 'regalos'] },
  { w: 'VELA', img: 'corona', no: ['fuego', 'luz'] },
  { w: 'ISABEL', img: 'isabel', no: ['prima', 'Juan'] },
];

// Desafío en familia: mazo de cartas
export const DESAFIOS = [
  { t: 'Ayuda a alguien en casa hoy', sub: 'Como María, que fue de prisa a ayudar a Isabel', icon: 'isabel' },
  { t: 'Recen juntos un Avemaría', sub: 'Como el ángel Gabriel, que saludó a María', icon: 'gabriel' },
  { t: 'Pidan perdón y abrácense', sub: 'Como José, que recibió a María con amor', icon: 'jose' },
  { t: 'Den gracias por tres cosas de hoy', sub: 'Como María, que guardaba todo en su corazón', icon: 'maria' },
  { t: 'Hagan algo bonito por un vecino', sub: 'Como los pastores, que fueron a ver al Niño', icon: 'pastor' },
  { t: 'Compartan algo suyo con alguien', sub: 'Como los Reyes, que llevaron regalos a Jesús', icon: 'reyes' },
  { t: 'Bendigan la mesa antes de comer', sub: 'Jesús daba gracias al Padre antes de partir el pan', icon: 'pan' },
  { t: 'Cuenten una historia de cuando nacieron', sub: 'Como en Belén, todo nacimiento es una fiesta', icon: 'nino' },
];
export const SORPRESA_NOMBRE = { memorama: 'Memorama', adivinanza: 'Adivinanza en familia', desafio: 'Desafío en familia' };

// Todas las preguntas de opción múltiple con 4 respuestas: a las de imagen (3) se les suma una alternativa
// claramente incorrecta, elegida a mano para que no haya otra respuesta válida.
const CUARTA = {
  '1.2': ['Una oveja', 'oveja'],
  '2.1': ['Un pastor', 'pastor'],
  '2.4': ['Una oveja', 'oveja'],
  '3.2': ['Una manzana', 'manzana'],
  '4.4': ['Gabriel', 'gabriel'],
  '5.3': ['Un farol', 'lampara'],
  '6.2': ['José', 'jose'],
  '6.4': ['Una oveja', 'oveja'],
  '7.0': ['Los Reyes', 'reyes'],
  '7.3': ['Una manzana', 'manzana'],
  '8.2': ['Una oveja', 'oveja'],
  '9.0': ['Los Reyes', 'reyes'],
  '9.1': ['Un pastor', 'pastor'],
  '11.2': ['Un farol', 'lampara'],
  '12.3': ['Una oveja', 'oveja'],
  '13.0': ['En una caja de regalo', 'regalo'],
  '13.3': ['Una estrella', 'estrella'],
  '14.1': ['Un pastor', 'pastor'],
  '15.3': ['José', 'jose'],
  '16.0': ['Un pastor', 'pastor'],
  '17.1': ['Un pastor', 'pastor'],
  '18.1': ['Cien', 'estrella'],
  '18.3': ['Un pastor', 'pastor'],
  '19.1': ['Apagada en un rincón', 'farol'],
  '20.3': ['Un rey', 'reyes'],
  '21.0': ['Gabriel', 'gabriel'],
  '21.2': ['Un rey', 'reyes'],
  '21.4': ['Un rey', 'reyes'],
  '22.2': ['Un gorro', 'gorro'],
  '23.0': ['Una oveja', 'oveja'],
  '23.3': ['Una oveja', 'oveja'],
  '24.0': ['Los Reyes', 'reyes'],
  '24.4': ['José', 'jose'],
  '25.1': ['Una bufanda', 'bufanda'],
};
Object.entries(CUARTA).forEach(([k, [t, img]]) => { const [d, i] = k.split('.').map(Number); const q = TRIVIA[d]?.[i]; if (q && q.o.length === 3) q.o.push(pic(t, img)); });

// Domingos: una pregunta sobre el Evangelio que escucharon (Adviento 2026 · ciclo B)
TRIVIA[1][3] = P('¿Qué nos pide Jesús en el Evangelio de hoy?', ['Dormir mucho', 'Estar despiertos y atentos', 'Correr rápido', 'Esconder la lámpara'], 1, 'como el portero que espera a su señor', 'Jesús nos pide velar: estar atentos porque Él viene (Mc 13,33-37).');
TRIVIA[8][0] = P('¿Quién gritaba en el desierto «Preparen el camino del Señor»?', ['Un rey', 'Juan el Bautista', 'Un pastor', 'Un soldado'], 1, 'vivía en el desierto y comía miel silvestre', 'Juan el Bautista preparó el camino para Jesús (Mc 1,1-8).');
TRIVIA[15][2] = P('Juan dijo: «Yo soy la voz que grita en el…»', ['mar', 'castillo', 'desierto', 'mercado'], 2, 'un lugar seco y lleno de arena', 'Juan era la voz que anunciaba que Jesús llegaba (Jn 1,23).');
TRIVIA[22][4] = P('¿Qué le dijo el ángel Gabriel a María?', ['Vete a dormir', 'Cuidado con el lobo', 'Alégrate, llena de gracia', 'Prepara la cena'], 2, 'una palabra de alegría', 'El ángel le anunció que sería la mamá de Jesús (Lc 1,26-38).');

// Revisión pastoral (21-oct-2026): exactitud bíblica, una sola respuesta válida y lenguaje para 5–8 años
{
  const fix = (k, patch) => { const [d, i] = k.split('.').map(Number); if (TRIVIA[d]?.[i]) Object.assign(TRIVIA[d][i], patch); };
  const set = (k, q) => { const [d, i] = k.split('.').map(Number); if (TRIVIA[d]) TRIVIA[d][i] = q; };
  // errores de fondo
  set('9.4', P('Cuando nació Jesús y llegaron los pastores, ¿qué hacía María con todo lo que pasaba?', ['Lo guardaba en su corazón', 'Lo olvidaba', 'Se reía de todo', 'No le importaba'], 0, 'muy dentro de ella', 'María guardaba todo en su corazón (Lc 2,19).'));
  fix('2.4', { q: '¿Quién llevó a Jesús en su vientre mientras lo esperaba?', pista: 'es su mamá', ok: 'María lo esperó nueve meses con amor' });
  fix('21.4', { q: '¿Cómo se llama el burrito que nos acompaña hasta Belén?', pista: 'tiene orejas grandes', ok: '¡Teodoro! Y Jesús camina siempre con nosotros' });
  fix('7.0', { ok: '¡Teodoro! Y Dios también camina con nosotros' });
  // una sola respuesta válida
  fix('8.2', { q: '¿Quién le dijo «sí» al ángel Gabriel?', pista: 'dijo «hágase»', ok: 'María creyó y dijo que sí' });
  set('13.0', P('¿Dónde acostaron a Jesús al nacer?', ['En un pesebre', 'En un castillo', 'En un barco', 'En una caja de regalo'], 0, 'donde comen los animales', 'En un pesebre (Lc 2,7)'));
  set('13.1', P('¿Quiénes estaban en el portal de Belén?', ['María', 'José', 'Un dragón', 'Jesús'], [0, 1, 3], 'son tres', '¡La Sagrada Familia!'));
  set('13.4', P('¿Con quién coloreamos el pesebre?', ['Con mi familia', 'Con nadie', 'Con un robot', 'Con un rey'], 0, 'era un reto en familia', '¡En familia!'));
  set('18.1', P('¿Cuántas ovejas se perdieron?', ['Una', 'Diez', 'Ninguna', 'Cien'], 0, 'solo una', 'Una sola, ¡y el pastor fue a buscarla!'));
  if (TRIVIA[18]?.[3]?.o?.[3]) TRIVIA[18][3].o[3] = pic('Una oveja', 'oveja');
  set('19.1', P('¿Dónde se pone una lámpara?', ['En lo alto, para que alumbre', 'Debajo de la cama', 'Dentro de una caja', 'Escondida en un rincón'], 0, 'para que alumbre a todos', 'En lo alto, para alumbrar a todos (Mt 5,15)'));
  set('19.4', P('El reto de hoy fue…', ['Hacer algo bueno en secreto', 'Esconderse', 'Apagar las luces', 'Ver la tele'], 0, 'nadie lo supo', '¡Tu Padre del cielo ve el bien que haces en secreto! (Mt 6,4)'));
  set('6.3', P('¿Cuál es el reto de hoy?', ['Escribir una carta a Jesús', 'Hacer una carrera', 'Hornear un pastel', 'Ver la tele'], 0, 'algo para escribir', '¡Una carta para Jesús!'));
  // estilo y matices
  fix('3.1', { pista: 'ábrele la puerta' });
  fix('9.1', { pista: 'un ángel enviado por Dios' });
  fix('6.0', { pista: 'era pariente de Jesús' });
  fix('6.2', { pista: 'era pariente de María' });
  fix('18.4', { ok: '¡Llamó a sus amigos para celebrar! Así se alegra el cielo (Lc 15,6-7)' });
  fix('20.2', { q: 'Jesús usa su poder para…' });
  fix('21.2', { q: '¿Quién cuidó a Jesús como papá aquí en la tierra?', pista: 'era carpintero', ok: '¡San José!' });
}
