// El in-app de Braze con los slides del reto (se muestran al unirse; su «¡Vamos!» lleva a «¡Ya estás dentro!» en la app).
// El arte de cada slide va en UNA imagen ya armada (sale del MVP, de día y de noche); el texto, los puntos y los botones
// van en HTML. Así en Braze hay 8 imágenes y no 20 piezas, y para cambiar un slide basta con cambiar su imagen.
//   node tools/braze-slides.mjs capturar   → saca las 8 imágenes del MVP (servidor local en :5190)
//   node tools/braze-slides.mjs            → arma index.html (nombres de archivo: vista previa web) y braze.html (URLs de
//                                             Braze, de urls.json: es el que se pega en Braze)
// DEEP_LINK=theo://… node tools/braze-slides.mjs  fija el deep link de «¡Ya estás dentro!».
import fs from 'node:fs';
import path from 'node:path';

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CARPETA = path.join(RAIZ, 'public/braze/slides-reto');
const DEEP_LINK = process.env.DEEP_LINK || 'theo://adviento/ya-estas-dentro'; // pendiente: el deep link real del equipo de la app
const ALTO_ARTE = 478; // el arte llega hasta el título (la ventana mide 350 × 698)

// mismo contenido que SLIDES en flow.js
const SLIDES = [
  { vis: 'pesebre', t: '¡Jesús está por llegar!', d: 'Preparemos juntos el corazón para recibirlo en Navidad.', alt: 'El pesebre vacío bajo la estrella de Belén, esperando al Niño Jesús' },
  { vis: 'camino', t: '¡Rumbo a Belén!', d: '26 días, un paso nuevo cada día junto a Teodoro hasta el pesebre.', alt: 'El mapa del camino: Teodoro en el día de hoy, los días hechos con sus estrellas y los que vienen con candado' },
  { vis: 'aprende', t: 'Mira, juega, canta… y ama', d: 'Historias de la Biblia, trivias, juegos, canciones y una misión de amor al día.', alt: 'Un cuento de la oveja perdida, el nacimiento de Jesús y una trivia' },
  { vis: 'gana', t: '¡Gira la ruleta y gana!', d: 'Completa cada día, gira y gana estrellas, panes para Teodoro y sorpresas.', alt: 'La ruleta de premios con un gorro, una bufanda y una trivia perfecta de tres estrellas y diez panes' },
];
const arte = (i, tema) => `adviento-slide-reto-${i + 1}-${SLIDES[i].vis}-${tema}.jpg`;
const FUENTES = { 400: 'adviento-neue-montreal-400.otf', 700: 'adviento-neue-montreal-700.otf' };

// ---------- 1 · capturar el arte desde el MVP (con «Reducir movimiento»: todo en su lugar y Teodoro con su dibujo) ----------
async function capturar() {
  const { chromium } = await import(path.join(RAIZ, 'node_modules/playwright/index.mjs'));
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/Users/ces/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
  for (const tema of ['claro', 'oscuro']) {
    // el teléfono del MVP va escalado: se mide y se pide la densidad que da @3x exacto
    const medir = await b.newPage({ viewport: { width: 1440, height: 1000 } });
    await medir.goto('http://localhost:5190/app.html'); await medir.waitForTimeout(800);
    const s = await medir.evaluate(() => document.getElementById('viewport').getBoundingClientRect().width / 390); await medir.close();
    const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 3 / s, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    await p.goto('http://localhost:5190/app.html', { waitUntil: 'domcontentloaded' });
    await p.evaluate(async t => { localStorage.clear(); const c = await import('./js/core.js'); c.reset({ hoy: -3, inscrito: false, musica: false, tema: t }); c.save(); }, tema);
    await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
    await p.evaluate(async () => { const c = await import('./js/core.js'); await c.go('retoSlides', {}, 'none'); }); await p.waitForTimeout(2500);
    // solo el arte: sin texto, puntos, botones ni esquinas
    await p.addStyleTag({ content: '.rs-txt, .rs-puntos, .rs-cta, .rs-cerrar { visibility: hidden !important; } .rs { border-radius: 0 !important; box-shadow: none !important; }' });
    for (let i = 0; i < SLIDES.length; i++) {
      await p.waitForTimeout(900);
      const r = await p.evaluate(() => { const c = document.querySelector('#viewport .layer:last-child .rs').getBoundingClientRect(); return { x: c.left, y: c.top, w: c.width }; });
      const k = r.w / 350, salida = path.join(CARPETA, arte(i, tema === 'claro' ? 'claro' : 'oscuro'));
      await p.screenshot({ path: salida, type: 'jpeg', quality: 86, clip: { x: r.x, y: r.y, width: 350 * k, height: ALTO_ARTE * k } });
      console.log(path.relative(RAIZ, salida), Math.round(fs.statSync(salida).size / 1024) + ' KB');
      await p.evaluate(() => document.querySelector('#viewport .layer:last-child .rs-cta').click());
    }
    await ctx.close();
  }
  await b.close();
}

// ---------- 2 · el HTML ----------
const css = fs.readFileSync(path.join(RAIZ, 'public/app.css'), 'utf8');
const desde = css.indexOf('.rs { background'), hasta = css.indexOf('/* ---------- Modo developer');
if (desde < 0 || hasta < desde) throw new Error('No encontré el bloque .rs-* en app.css');
const ESTILOS_SLIDES = css.slice(desde, hasta).replace(/\.rs-antes[^\n]*\n/, '').trim(); // los textos, los puntos y los botones, tal cual el MVP

function html(url) {
  const ESTILOS = `
@font-face { font-family: 'Neue Montreal'; src: url('${url(FUENTES[400])}') format('opentype'); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: 'Neue Montreal'; src: url('${url(FUENTES[700])}') format('opentype'); font-weight: 700; font-style: normal; font-display: swap; }
html, body { margin: 0; height: 100%; overflow: hidden; background: transparent; -webkit-text-size-adjust: 100%; -webkit-tap-highlight-color: transparent; }
body { font-family: 'Neue Montreal', system-ui, -apple-system, sans-serif; }
/* el velo sobre la app (el mismo del MVP); tocarlo es como cerrar */
.velo { position: fixed; inset: 0; background: rgba(4,14,36,.55); -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); animation: velo-entra .28s ease-out both; }
.claro .velo { background: rgba(0,8,43,.42); }
.marco { position: fixed; left: 0; right: 0; top: env(safe-area-inset-top, 0px); bottom: env(safe-area-inset-bottom, 0px); }
/* la ventana mide 350 × 698 pt, como en el MVP; su centro va al centro de la pantalla y se escala desde ahí para caber en cada
   teléfono (centrada aunque antes de escalar no quepa: si no, en pantallas bajas queda corrida hacia abajo) */
.rs { position: absolute; left: 50%; top: 50%; width: 350px; height: 698px; margin: -349px 0 0 -175px; border-radius: 36px; overflow: hidden; box-shadow: 0 30px 70px rgba(4,14,36,.45); transform-origin: 50% 50%; animation: ventana-entra .32s cubic-bezier(0,0,.2,1) both; }
.rs button { font-family: inherit; }
/* cada slide lleva el color de la ventana (así el revisor de accesibilidad de Braze sabe sobre qué fondo va el texto) */
.rs-slide { background: #05204E; }
.rs-claro .rs-slide { background: #FFFFFF; }
/* el arte del slide: una imagen ya armada, hasta el título */
.arte { position: absolute; left: 0; top: 0; width: 350px; height: auto; display: block; pointer-events: none; user-select: none; -webkit-user-drag: none; }
@keyframes velo-entra { from { opacity: 0; } }
@keyframes ventana-entra { from { opacity: 0; translate: 0 16px; } }
@media (prefers-reduced-motion: reduce) { .velo, .rs { animation: none; } }
/* vista previa en el navegador (sin Braze): lo que haría la app */
.aviso { position: fixed; left: 50%; bottom: calc(env(safe-area-inset-bottom, 0px) + 18px); translate: -50% 0; padding: 10px 16px; border-radius: 14px; background: #06325A; color: #FFFFFF; font: 700 15px 'Neue Montreal', system-ui, sans-serif; opacity: 0; transition: opacity .2s; pointer-events: none; }
.aviso.on { opacity: 1; }`;

  const SCRIPT = `
(function () {
  // «¡Vamos!» y cerrar llevan a «¡Ya estás dentro!» en la app
  var DEEP_LINK = ${JSON.stringify(DEEP_LINK)};
  var caja = document.querySelector('.rs'), oscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches, W = 350;
  if (!oscuro) { caja.classList.add('rs-claro'); document.body.classList.add('claro'); }
  // solo el arte del tema
  [].forEach.call(document.querySelectorAll(oscuro ? '.solo-dia' : '.solo-noche'), function (e) { e.remove(); });

  // la ventana se ajusta al teléfono (16 pt de aire por lado, hasta 1,2×)
  var marco = document.querySelector('.marco');
  function ajustar() { var s = Math.min((marco.clientWidth - 32) / 350, (marco.clientHeight - 32) / 698, 1.2); caja.style.transform = 'scale(' + s + ')'; }
  ajustar(); window.addEventListener('resize', ajustar);

  // salir: Botón 1 «¡Vamos!», Botón 2 cerrar (para ver los clics en Braze); el deep link lo abre la app y cierra el mensaje sola
  var yendo = false;
  function salir(boton) {
    if (yendo) return; yendo = true;
    if (window.brazeBridge) {
      brazeBridge.logClick(boton === 'vamos' ? '0' : '1');
      if (DEEP_LINK) window.location.href = DEEP_LINK; else brazeBridge.closeMessage();
      return;
    }
    var a = document.querySelector('.aviso'); a.textContent = 'En la app: ¡Ya estás dentro!'; a.classList.add('on');
    setTimeout(function () { a.classList.remove('on'); yendo = false; ir(0); }, 1800);
  }

  var pista = caja.querySelector('.rs-pista'), slides = [].slice.call(caja.querySelectorAll('.rs-slide')), puntos = [].slice.call(caja.querySelectorAll('.rs-puntos i')), cta = caja.querySelector('.rs-cta'), N = slides.length;
  // la primera vez que se ve un slide, su arte entra suave
  var vistos = [];
  function estrenar(n) {
    if (vistos[n] || quieto) return; vistos[n] = true;
    var a = slides[n].querySelector('.arte');
    if (a && a.animate) a.animate([{ opacity: 0, transform: 'scale(1.04)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
  }
  // pasar de slide: sigue al dedo 1:1, se resiste en los bordes y al soltar decide por la velocidad o por cuánto se corrió
  var i = 0, x = 0;
  function poner(v, ms) { x = v; pista.style.transition = ms ? 'transform ' + ms + 'ms cubic-bezier(.2,.9,.25,1)' : 'none'; pista.style.transform = 'translateX(' + v + 'px)'; }
  function pintar(anim) {
    if (quieto) { poner(-i * W, 0); if (anim && slides[i].animate) slides[i].animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' }); }
    else poner(-i * W, anim ? 380 : 0);
    slides.forEach(function (sl, n) { sl.inert = n !== i; sl.setAttribute('aria-hidden', String(n !== i)); });
    puntos.forEach(function (p, n) { p.classList.toggle('on', n === i); });
    cta.textContent = i < N - 1 ? 'Siguiente' : '¡Vamos!';
    estrenar(i);
  }
  function ir(n) { i = Math.max(0, Math.min(N - 1, n)); pintar(true); }
  cta.addEventListener('click', function () { if (i < N - 1) ir(i + 1); else salir('vamos'); });
  caja.querySelector('.rs-cerrar').addEventListener('click', function () { salir('cerrar'); });
  marco.addEventListener('click', function (e) { if (e.target === marco) salir('cerrar'); });
  document.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') ir(i + 1); if (e.key === 'ArrowLeft') ir(i - 1); if (e.key === 'Escape') salir('cerrar'); });
  var goma = function (d) { var c = .55; return (d * W * c) / (W + c * Math.abs(d)); };
  var g = null;
  pista.addEventListener('pointerdown', function (e) {
    var vista = new DOMMatrix(getComputedStyle(pista).transform).m41;
    g = { x0: e.clientX, y0: e.clientY, desde: vista, k: pista.getBoundingClientRect().width / pista.offsetWidth || 1, h: [[performance.now(), vista]], activo: false };
    poner(vista, 0); pista.setPointerCapture(e.pointerId);
  });
  pista.addEventListener('pointermove', function (e) {
    if (!g) return;
    var dx = (e.clientX - g.x0) / g.k;
    if (!g.activo) { if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(e.clientY - g.y0)) return; g.activo = true; }
    var v = g.desde + dx, min = -(N - 1) * W;
    if (v > 0) v = goma(v); else if (v < min) v = min + goma(v - min);
    poner(v, 0); g.h.push([performance.now(), v]); if (g.h.length > 5) g.h.shift();
  });
  function soltar() {
    if (!g) return;
    var h = g.h; g = null;
    var vel = h.length > 1 ? (h[h.length - 1][1] - h[0][1]) / Math.max(1, h[h.length - 1][0] - h[0][0]) * 1000 : 0;
    var corrido = x + i * W;
    ir(Math.abs(vel) > 300 ? i + (vel < 0 ? 1 : -1) : corrido < -W / 4 ? i + 1 : corrido > W / 4 ? i - 1 : i);
  }
  pista.addEventListener('pointerup', soltar); pista.addEventListener('pointercancel', soltar);
  pintar(false);
})();`;

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Así es el reto · Adviento</title>
<!-- In-app de Braze (Custom Code): los slides del reto al unirse. Generado con tools/braze-slides.mjs desde el MVP; no se edita a mano. -->
<style>
${ESTILOS.trim()}

/* ---- textos, puntos y botones (de app.css del MVP) ---- */
${ESTILOS_SLIDES}
</style>
</head>
<body>
<div class="velo" aria-hidden="true"></div>
<div class="marco">
  <div class="rs" role="dialog" aria-modal="true" aria-label="Así es el reto">
    <div class="rs-capa">
      <div class="rs-pista" aria-roledescription="carrusel">${SLIDES.map((sl, i) => `
        <section class="rs-slide" role="group" aria-roledescription="slide" aria-label="${i + 1} de ${SLIDES.length}">
          <img class="arte solo-dia" src="${url(arte(i, 'claro'))}" alt="${sl.alt}"><img class="arte solo-noche" src="${url(arte(i, 'oscuro'))}" alt="${sl.alt}">
          <div class="rs-txt"><h2>${sl.t}</h2><p>${sl.d}</p></div>
        </section>`).join('')}
      </div>
      <button type="button" class="rs-cerrar" aria-label="Cerrar"><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
      <div class="rs-puntos" aria-hidden="true">${SLIDES.map(() => '<i></i>').join('')}</div>
      <button type="button" class="rs-cta">Siguiente</button>
    </div>
  </div>
</div>
<div class="aviso" role="status"></div>
<script>${SCRIPT}
</script>
</body>
</html>
`;
}

function armar() {
  const archivos = [...SLIDES.flatMap((_, i) => [arte(i, 'claro'), arte(i, 'oscuro')]), FUENTES[400], FUENTES[700]];
  const faltan = archivos.filter(f => !fs.existsSync(path.join(CARPETA, f)));
  if (faltan.length) throw new Error('Faltan: ' + faltan.join(', ') + ' (node tools/braze-slides.mjs capturar)');
  fs.writeFileSync(path.join(CARPETA, 'index.html'), html(f => f));
  // braze.html: con las URLs de los archivos ya subidos a Braze (urls.json), para no depender de que Braze cambie los nombres
  const urlsArchivo = path.join(CARPETA, 'urls.json'), urls = fs.existsSync(urlsArchivo) ? JSON.parse(fs.readFileSync(urlsArchivo, 'utf8')) : {};
  const sinUrl = archivos.filter(f => !urls[f]);
  if (!sinUrl.length) fs.writeFileSync(path.join(CARPETA, 'braze.html'), html(f => urls[f]));
  console.log(`index.html · ${archivos.length} archivos · deep link ${DEEP_LINK}${sinUrl.length ? ` · braze.html no se armó: faltan URLs de ${sinUrl.join(', ')}` : ' · braze.html con URLs de Braze'}`);
}

if (process.argv[2] === 'capturar') await capturar();
else armar();
