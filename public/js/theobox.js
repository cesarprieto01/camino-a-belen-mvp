// TheoBox, el gran premio de la ruleta (día 24, una sola en todo el reto): «¡Ganaste la TheoBox!», los datos de envío en dos pasos,
// «Va en camino», «Comparte tu premio» y «Mi TheoBox» (seguimiento y soporte). Diseño aprobado por César en el lienzo
// «TheoBox · Gran premio» (9 y 10-nov-2026): cada pantalla tiene su versión clara (TB-*-claro.html) y oscura (TB-*.html).
// Si eligen «Ahora no», la TheoBox queda esperando encima de la hoja del día en el mapa (map.js) hasta que la reclamen; ya
// reclamada, mientras viaja se llega a «Mi TheoBox» desde el mapa, el inicio (card) y Ajustes («Mis premios»).
import { S, save, go, back, on, register, toast, confetti, conTheobox } from './core.js';
import { teoDice, motivo, levanta } from './musica.js';
import { celebrar } from './teo-anim.js';

const tema = f => [f + '-claro', f]; // [clara, oscura]
// países de ejemplo hasta saber a dónde se envía: el país elegido trae sus estados (o departamentos) y sus ciudades
export const PAISES = {
  'Estados Unidos': { region: 'Estado', zonas: { California: ['Los Ángeles', 'San Diego', 'San Francisco'], Florida: ['Miami', 'Orlando', 'Tampa'], Texas: ['Austin', 'Dallas', 'Houston'] } },
  Colombia: { region: 'Departamento', zonas: { Antioquia: ['Envigado', 'Medellín', 'Rionegro'], Cundinamarca: ['Bogotá', 'Chía', 'Soacha'], 'Valle del Cauca': ['Buga', 'Cali', 'Palmira'] } },
  México: { region: 'Estado', zonas: { 'Ciudad de México': ['Benito Juárez', 'Coyoacán', 'Tlalpan'], Jalisco: ['Guadalajara', 'Tlaquepaque', 'Zapopan'], 'Nuevo León': ['Apodaca', 'Monterrey', 'San Pedro Garza García'] } },
};
const HISTORIA = 'assets/theobox/historia.jpg';
const envio = () => (S.theoboxEnvio ||= {});

/** Un campo: «msg» vacío = bien (✓ si tiene algo escrito); con texto = el error, junto al campo. Devuelve si está bien. */
function marcar(campo, msg) {
  const f = campo.closest('.tb-f'), err = f?.querySelector('.tb-error');
  f?.classList.toggle('tb-mal', !!msg);
  f?.classList.toggle('tb-ok', !msg && !!campo.value.trim() && campo.type !== 'checkbox');
  campo.setAttribute('aria-invalid', String(!!msg));
  if (err) { err.textContent = msg; err.hidden = !msg; }
  return !msg;
}
/** Revisa todos los campos con sus reglas; el primero que falle se enfoca. */
function revisar(reglas) {
  let primero = null;
  reglas.forEach(([campo, regla]) => { if (!marcar(campo, regla(campo)) && !primero) primero = campo; });
  if (primero) { primero.focus({ preventScroll: true }); primero.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  return !primero;
}
// cada campo se revisa al salir de él (no mientras escribe) y se vuelve a revisar al corregirlo
const alSalir = reglas => reglas.forEach(([campo, regla]) => {
  campo.addEventListener('blur', () => { if (campo.value.trim()) marcar(campo, regla(campo)); });
  campo.addEventListener('input', () => { if (campo.closest('.tb-f')?.classList.contains('tb-mal')) marcar(campo, regla(campo)); });
  campo.addEventListener('change', () => marcar(campo, regla(campo)));
});

register('tbGano', {
  files: tema('TB-Ganaste'),
  mount(root, p, layer) {
    requestAnimationFrame(() => celebrar(root)); // Teodoro salta (Lottie) donde está el dibujo quieto
    confetti(layer, 195, 260, 90);
    setTimeout(() => layer.isConnected && confetti(layer, 195, 220, 60), 900); // el gran premio festeja dos veces
    navigator.vibrate?.([30, 60, 30]);
    setTimeout(() => levanta('ruleta', 0.5), (Math.max(motivo('largo'), teoDice('premioGrande', { tras: 0.6 })) + 1.5) * 1000);
    on(root, 'Reclamar mi TheoBox', () => go('tbDatos', {}, 'push'));
    on(root, 'Ahora no', () => go('mapa', {}, 'down', { replace: true }));
  },
});

register('tbDatos', {
  files: tema('TB-Datos'), scrollAuto: true,
  mount(root) {
    if (S.theoboxReclamada) return go('tbEnCamino', {}, 'none', { replace: true });
    const e = envio(), $ = id => root.querySelector('#tb-' + id);
    const nombre = $('nombre'), correo = $('correo'), prefijo = $('prefijo'), tel = $('telefono');
    nombre.value = e.nombre || '';
    correo.value = e.correo || 'familia@correo.com'; // el de la cuenta (en la app real viene del perfil)
    prefijo.value = e.prefijo || '+1';
    tel.value = e.telefono || '';
    const reglas = [
      [nombre, c => c.value.trim().length >= 3 ? '' : 'Escribe el nombre de quien la recibe'],
      [correo, c => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.value.trim()) ? '' : 'Revisa el correo: falta algo, como la @'],
      [tel, c => c.value.replace(/\D/g, '').length >= 7 ? '' : 'Revisa el teléfono: debe tener al menos 7 números'],
    ];
    alSalir(reglas);
    if (correo.value) marcar(correo, reglas[1][1](correo));
    on(root, 'Atrás', () => back('mapa'));
    on(root, 'Continuar', () => {
      if (!revisar(reglas)) return;
      Object.assign(e, { nombre: nombre.value.trim(), correo: correo.value.trim(), prefijo: prefijo.value, telefono: tel.value.trim() });
      save(); go('tbDireccion', {}, 'push');
    });
  },
});

register('tbDireccion', {
  files: tema('TB-Direccion'), scrollAuto: true,
  mount(root) {
    if (S.theoboxReclamada) return go('tbEnCamino', {}, 'none', { replace: true });
    const e = envio(), $ = id => root.querySelector('#tb-' + id);
    const pais = $('pais'), region = $('region'), ciudad = $('ciudad'), dir = $('direccion'), apto = $('apto'), cp = $('cp'), notas = $('notas'), bases = $('bases');
    const etiqueta = root.querySelector('label[for="tb-region"]');
    const opciones = (lista, elegido, vacio) => (vacio ? `<option value="">${vacio}</option>` : '') + lista.map(x => `<option${x === elegido ? ' selected' : ''}>${x}</option>`).join('');
    pais.innerHTML = opciones(Object.keys(PAISES), e.pais || 'Estados Unidos');
    // el país manda: sus estados (o departamentos) y, al elegir uno, sus ciudades
    const regiones = (elegida = '') => {
      const P = PAISES[pais.value];
      etiqueta.textContent = P.region;
      region.innerHTML = opciones(Object.keys(P.zonas), elegida, 'Elige');
      ciudades(e.region === region.value ? e.ciudad : '');
    };
    const ciudades = (elegida = '') => {
      const zona = PAISES[pais.value].zonas[region.value];
      ciudad.innerHTML = opciones(zona || [], elegida, 'Elige');
      ciudad.disabled = !zona;
    };
    regiones(e.pais === pais.value || !e.pais ? e.region : '');
    pais.addEventListener('change', () => { regiones(); [region, ciudad].forEach(c => marcar(c, '')); });
    region.addEventListener('change', () => { ciudades(); marcar(ciudad, ''); });
    dir.value = e.direccion || ''; apto.value = e.apto || ''; cp.value = e.cp || ''; notas.value = e.notas || '';
    const reglas = [
      [region, c => c.value ? '' : `Elige el ${PAISES[pais.value].region.toLowerCase()}`],
      [ciudad, c => c.value ? '' : 'Elige la ciudad'],
      [dir, c => c.value.trim().length >= 5 ? '' : 'Escribe la dirección'],
      [bases, c => c.checked ? '' : 'Acepta las bases para recibirla'],
    ];
    alSalir(reglas);
    on(root, 'Atrás', () => back('tbDatos'));
    on(root, 'bases del gran premio', () => toast('Bases del gran premio', 'Muy pronto aquí'));
    on(root, 'Reclamar mi TheoBox', () => {
      if (!revisar(reglas)) return;
      Object.assign(e, { pais: pais.value, region: region.value, ciudad: ciudad.value, direccion: dir.value.trim(), apto: apto.value.trim(), cp: cp.value.trim(), notas: notas.value.trim() });
      S.theoboxReclamada = true; S.theoboxPaso = 2; save();
      go('tbEnCamino', { recien: true }, 'fade', { replace: true });
    });
  },
});

register('tbEnCamino', {
  files: tema('TB-EnCamino'),
  mount(root, p, layer) {
    requestAnimationFrame(() => celebrar(root));
    if (p.recien) { confetti(layer, 195, 180, 50); motivo('corto'); navigator.vibrate?.(30); }
    on(root, 'Volver al camino', () => go('mapa', {}, 'down', { replace: true }));
    on(root, 'Compartir', () => go('tbCompartir', {}, 'push'));
  },
});

/** La imagen para historias (1080 × 1920) como archivo, para compartirla o guardarla. */
const historia = () => fetch(HISTORIA).then(r => r.blob()).then(b => new File([b], 'gane-la-theobox.jpg', { type: 'image/jpeg' }));
function guardar() {
  const a = document.createElement('a'); a.href = HISTORIA; a.download = 'gane-la-theobox.jpg';
  document.body.appendChild(a); a.click(); a.remove();
}
register('tbCompartir', {
  files: tema('TB-Celebrar'),
  mount(root) {
    requestAnimationFrame(() => celebrar(root));
    on(root, 'Cerrar', () => back('mapa'));
    // las opciones para compartir del teléfono con la imagen; donde no se puede (computador), se guarda
    on(root, 'Compartir', async () => {
      try {
        const f = await historia();
        if (navigator.canShare?.({ files: [f] })) { await navigator.share({ files: [f], text: '¡Gané la TheoBox! Descarga Theo y vive el Adviento conmigo' }); return; }
      } catch (err) { if (err?.name === 'AbortError') return; }
      guardar(); toast('Imagen guardada', 'Súbela a tus historias');
    });
    on(root, 'Guardar imagen', () => { guardar(); toast('Imagen guardada', 'Está en tus descargas'); });
  },
});

// ---------- Mi TheoBox: cómo va el envío y a quién escribir ----------
// el día 24 del reto es el 22 de diciembre: reclamada ese día, se prepara el 23, sale el 24 y llega entre el 28 y el 30
const PASOS = [
  ['Recibimos tus datos', '22 dic', '<path d="M7 3h7l4 4v14H7z"></path><path d="M14 3v4h4"></path><path d="M9.5 14l2 2 4-4"></path>'],
  ['La preparamos para ti', '23 dic', '<rect x="3.5" y="8" width="17" height="4" rx="1"></rect><path d="M5 12v8h14v-8"></path><path d="M12 8v12"></path><path d="M12 8C10.5 5 7 5 7 7s3 1 5 1zm0 0c1.5-3 5-3 5-1s-3 1-5 1z"></path>'],
  ['Salió hacia tu casa', '24 dic', '<path d="M2.5 7h11v9h-11z"></path><path d="M13.5 10h4l3 3v3h-7"></path><circle cx="6.5" cy="17.5" r="1.8"></circle><circle cx="17" cy="17.5" r="1.8"></circle>'],
  ['¡Llega a tu casa!', '28–30 dic', '<path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1Z"></path>'],
];
export const LLEGA = 'Llega entre el 28 y el 30 dic';
const paso = () => S.theoboxPaso || 2; // 2 = la preparan, 3 = salió, 4 = llegó
/** Reclamada y todavía viajando: el mapa y el inicio la muestran. */
export const enCamino = () => conTheobox() && S.theobox === 'mia' && S.theoboxReclamada && paso() < 4;
/** Lo de adentro del aviso del mapa y de la card del inicio: la caja, «va en camino», cuándo llega y «Ver envío». */
export const avisoEnvio = ({ camion = false } = {}) => '<span class="tb-espera-ico" aria-hidden="true">'
  + (camion ? '' : '<i></i>') + '<img src="assets/ruleta/theobox-casilla.webp" alt="">'
  + (camion ? '<span class="tb-camion"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">' + PASOS[2][2] + '</svg></span>' : '')
  + `</span><span class="tb-espera-txt"><b>Tu TheoBox va en camino</b><small>${LLEGA}</small></span><button type="button" class="tb-espera-cta" data-bound="1">Ver envío</button>`;

/** Inicio: mientras viaja, la card va entre Adviento y Misiones Diarias (lo de abajo baja lo que mide la card). */
export function tarjetaInicio(root) {
  if (!enCamino() || root.querySelector('.tb-inicio')) return;
  const ALTO = 88, DESDE = 460;
  [...root.children].forEach(el => {
    const t = parseFloat(el.style.top);
    if (el.tagName !== 'NAV' && el.style.position === 'absolute' && t >= DESDE) el.style.top = (t + ALTO) + 'px';
  });
  root.style.height = (parseFloat(root.style.height) + ALTO) + 'px';
  const c = document.createElement('div'); c.className = 'tb-inicio';
  c.innerHTML = avisoEnvio();
  c.querySelector('button').addEventListener('click', () => go('tbMiTheobox', {}, 'push'));
  root.appendChild(c);
}

register('tbMiTheobox', {
  files: tema('TB-MiTheobox'), scrollAuto: true,
  mount(root) {
    const p = paso(), llego = p >= 4;
    on(root, 'Atrás', () => back('mapa'));
    // estado de arriba
    const estado = [...root.querySelectorAll('.tb-titulo')].find(t => t.textContent === 'ESTADO')?.parentElement;
    if (estado && llego) { estado.querySelector('.tb-oro').textContent = '¡Llegó!'; estado.lastElementChild.textContent = 'Que la disfruten en familia'; }
    // los pasos: hechos, el de ahora (late) y los que faltan
    const ol = root.querySelector('.tb-pasos');
    ol.innerHTML = PASOS.map(([t, fecha, ico], i) => {
      const clase = llego || i < p - 1 ? 'tb-paso-hecho' : i === p - 1 ? 'tb-paso-ahora' : 'tb-paso-luego';
      const titulo = llego && i === 3 ? '¡Llegó a tu casa!' : t;
      return `<li class="${clase}"><span class="tb-paso-eje"><span class="tb-paso-ico" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${ico}</svg></span>${i < 3 ? '<span class="tb-paso-linea" aria-hidden="true"></span>' : ''}</span>`
        + `<span class="tb-paso-txt"><span><b>${titulo}</b><small>${fecha}</small></span>${clase === 'tb-paso-ahora' ? '<small>Ahora</small>' : ''}</span></li>`;
    }).join('');
    // la guía de la paquetería existe desde que sale
    const guia = [...root.querySelectorAll('.tb-titulo')].find(t => t.textContent === 'ENVÍO')?.parentElement;
    if (guia && p < 3) guia.remove();
    on(root, 'Copiar el número de guía', () => { navigator.clipboard?.writeText('0000 0000 0000').catch(() => {}); toast('Guía copiada'); });
    on(root, 'Ver en la paquetería', () => toast('Paquetería', 'Muy pronto aquí'));
    // a quién se entrega: lo que llenaron (con el panel puede no haber datos: queda el ejemplo del diseño)
    const e = S.theoboxEnvio || {}, entrega = [...root.querySelectorAll('.tb-titulo')].find(t => t.textContent === 'SE ENTREGA A')?.parentElement;
    if (entrega && e.nombre) {
      entrega.querySelector('b').textContent = e.nombre;
      const lineas = [[e.direccion, e.apto].filter(Boolean).join(', '), [e.ciudad, e.region, e.pais].filter(Boolean).join(', '), [e.prefijo, e.telefono].filter(Boolean).join(' ')];
      entrega.lastElementChild.innerHTML = lineas.filter(Boolean).map(l => l.replace(/[<&]/g, c => c === '<' ? '&lt;' : '&amp;')).join('<br>');
    }
    on(root, 'Escribir a soporte', () => toast('Soporte de Theo', 'Muy pronto aquí'));
    on(root, 'Enviar un correo', () => toast('Correo de soporte', 'Muy pronto aquí'));
  },
});

// ---------- Ajustes de Theo (ya existen en la app; aquí solo es nuevo «Mis premios») ----------
register('ajustes', {
  files: ['Ajustes-claro', 'Ajustes'], scrollAuto: true,
  mount(root) {
    on(root, 'Atrás', () => back('hoy'));
    const perfil = [...root.querySelectorAll('.aj-fila b')].find(b => b.textContent === 'Lucía');
    if (perfil) perfil.textContent = S.nombre;
    const premios = [...root.querySelectorAll('.aj-seccion')].find(t => t.textContent === 'MIS PREMIOS'), fila = premios?.nextElementSibling;
    if (conTheobox() && S.theobox === 'mia' && S.theoboxReclamada) {
      const est = fila.querySelector('span > i')?.parentElement; // el punto y «En camino · llega…»
      if (est && paso() >= 4) est.lastChild.textContent = 'Entregada';
      on(root, fila, () => go('tbMiTheobox', {}, 'push'));
    } else { premios?.remove(); fila?.remove(); }
    [...root.querySelectorAll('.aj-fila')].filter(f => !f.dataset.bound).forEach(f => on(root, f, () => toast('Ajustes de Theo', 'Ya existen en la app')));
  },
});
