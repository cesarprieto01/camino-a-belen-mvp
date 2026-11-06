// Modo developer · cuándo sale cada animación de Teodoro (solo prototipo). Es la lógica que corre en el MVP, contada para quien
// la construye en iOS: qué la dispara, qué clips se encadenan y las reglas comunes. Sale de teo-anim.js, games.js, map.js y flow.js;
// si cambia la lógica allá, se cambia aquí.

// los 8 clips de la trivia: cada fila es «si pasa esto → se juegan estos clips (el último queda en bucle)»
const TRIVIA = {
  titulo: 'En la trivia',
  filas: [
    { si: 'Al abrir cada pregunta', clips: ['teo-trivia-mapa'], nota: 'Piensa en reposo (repite los primeros cuadros 4 veces) y luego lee el mapa completo' },
    { si: 'Si fallan', clips: ['teo-trivia-mapa-a-farol', 'teo-trivia-farol'], nota: 'El farol es la pista' },
    { si: 'Si vuelven a fallar con el farol', clips: [], nota: 'Sigue con el farol; la transición no se repite' },
    { si: 'Tras 2 vueltas del farol (unos 5,6 s)', clips: ['teo-trivia-farol-a-mapa', 'teo-trivia-mapa'] },
    { si: 'Si aciertan', clips: ['teo-trivia-mapa-a-celebra', 'teo-trivia-celebra'] },
    { si: 'Si aciertan después de fallar', clips: ['teo-trivia-farol-a-celebra', 'teo-trivia-celebra'] },
    { si: 'Al tocar «Siguiente»', clips: ['teo-trivia-celebra-a-mapa', 'teo-trivia-mapa'], nota: 'En la pregunta nueva: llega celebrando y vuelve al mapa' },
    { si: 'Al tocar «Ver resultado»', clips: [], nota: 'El resultado se abre encima: la trivia queda borrosa y Teodoro en pausa' },
  ],
  reglas: [
    'Para cambiar, espera a que el bucle llegue a una «salida» (hasta 0,5 s); si está lejos, hace un respingo de 0,25 s que tapa el corte.',
    'Si llega otro cambio en mitad de una transición, manda el último.',
    'Las transiciones juegan solo los cuadros con movimiento; las de celebrar, a 1,3×. Celebrar entra en su cuadro 2.',
    'Con «Reducir movimiento» no hay animaciones: se ven los dibujos quietos.',
  ],
};
const MAPA_FUERA = {
  titulo: 'Fuera de la trivia',
  filas: [{ si: 'En «¿Jugamos?», «Teléfono roto», los pasos de los juegos en familia y el póster de Nochebuena', clips: ['teo-trivia-mapa'], nota: 'El bucle completo de 5 s, sin reposo, encima del dibujo de Teodoro con su mapa' }],
  reglas: ['Con «Reducir movimiento» se ve el dibujo quieto.'],
};
const CAMINA = {
  titulo: 'En el mapa',
  filas: [
    { si: 'Al abrir el mapa cuando avanzó el calendario', clips: ['teo-caminando'], nota: 'Un paso: del día anterior al de hoy, por el sendero de piedras, mirando hacia donde va. Al llegar dice «¡Vamos a la aventura!» (en Belén, «¡Increíble!»)' },
  ],
  reglas: ['Ponerse al día (ir atrasado) no lo hace caminar: Teodoro siempre está en el día del calendario.', 'Con «Reducir movimiento» pasa de un día al otro sin caminar.'],
};
const CELEBRA = {
  titulo: 'Dónde celebra',
  filas: [
    { si: 'Al volver al mapa tras terminar el día de hoy', clips: ['teo-celebra'], nota: 'Salta en bucle en su día' },
    { si: 'En el resultado de la trivia y al final de los juegos', clips: ['teo-celebra'] },
    { si: 'En «¡Te guardé el camino!», Día completo, la intro del desafío y el paso 3 de los juegos en familia', clips: ['teo-celebra'] },
  ],
  reglas: ['Siempre en bucle, encima del dibujo quieto con estrellas (mismos pies y alto).', 'Con «Reducir movimiento» se ve el dibujo quieto.'],
};

/** Las lógicas en que aparece una animación (en la pantalla donde se está, primero) */
export function logicaDe(nombre, pantalla) {
  if (/^teo-trivia-/.test(nombre)) return nombre === 'teo-trivia-mapa' && pantalla !== 'trivia' ? [MAPA_FUERA, TRIVIA] : nombre === 'teo-trivia-mapa' ? [TRIVIA, MAPA_FUERA] : [TRIVIA];
  if (nombre === 'teo-caminando') return [CAMINA];
  if (nombre === 'teo-celebra') return [CELEBRA];
  return [];
}
/** Nombre corto de un clip para la secuencia («teo-trivia-mapa-a-farol» → «mapa → farol») */
export const corto = n => n.replace(/^teo-trivia-/, '').replace(/^teo-/, '').replace('-a-', ' → ');
