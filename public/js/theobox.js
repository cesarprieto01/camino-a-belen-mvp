// TheoBox, el gran premio de la ruleta (día 24, una sola en todo el reto): «¡Ganaste la TheoBox!», los datos de envío en dos pasos,
// «Va en camino» y «Comparte tu premio». Diseño aprobado por César en el lienzo «TheoBox · Gran premio» (9-nov-2026). Las pantallas
// (public/screens/TB-*.html) son oscuras en los dos temas: es un momento aparte, como el diseño. Si eligen «Ahora no», la TheoBox
// queda esperando encima de la hoja del día en el mapa (map.js) hasta que la reclamen.
import { S, save, go, back, on, register, toast, confetti } from './core.js';
import { teoDice, motivo, levanta } from './musica.js';
import { celebrar } from './teo-anim.js';

const igual = f => [f, f]; // misma pantalla de día y de noche
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
  files: igual('TB-Ganaste'),
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
  files: igual('TB-Datos'), scrollAuto: true,
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
  files: igual('TB-Direccion'), scrollAuto: true,
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
      S.theoboxReclamada = true; save();
      go('tbEnCamino', { recien: true }, 'fade', { replace: true });
    });
  },
});

register('tbEnCamino', {
  files: igual('TB-EnCamino'),
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
  files: igual('TB-Celebrar'),
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
