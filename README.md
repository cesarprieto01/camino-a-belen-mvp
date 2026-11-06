# Adviento · MVP

Prototipo navegable de **Adviento** («El Adviento más grande del mundo»): 26 días de camino hasta Belén con Teodoro, el burrito de la app Theo, para familias católicas. Antes se llamó «Camino a Belén»; el repositorio y la URL conservan ese nombre.

- En vivo: https://camino-a-belen-mvp.vercel.app
- La rama `main` es siempre lo que está publicado.

## Correrlo

```bash
npm install
npm run dev
```

Abre http://localhost:5190/app.html. El panel de controles (a la derecha; en el celular, el botón de arriba a la derecha) es solo del prototipo:

- **Arriba, siempre a la vista:** la pantalla donde estás, Día/Noche, copiar el enlace a este estado y el día con ‹ ›.
- **Estado:** Teodoro y su energía, la familia (plan, inscrito, panes), el tiempo (completó hasta, saltar 7 días) y «Empezar de cero».
- **Ajustes:** variantes para comparar (slides del reto, canción del mapa), qué sale en la ruleta y girarla otra vez, la isla dinámica y las zonas seguras del iPhone, y las reglas que usa el MVP.
- **Al pie, para el equipo:** Recorridos (escenarios del lienzo: antes del 29, un día con trivia, ruleta, juegos sorpresa, Navidad, gracia, free…), Pantallas (las del lienzo vistas y por ver) y Notas.

## Qué hay en el repo

```
public/            la app (HTML, CSS y JavaScript sin framework)
  js/data.js       el contenido y las reglas: los 26 días, la trivia, premios, ruleta, días gratis
  js/core.js       estado, fechas y fases (antes · camino · gracia · recuerdo), navegación, pop-ups y hojas
  js/flow.js       Hoy, destacado y pósters de temporada, tab Teodoro, Mundos, reproductor, retos, premios, ruleta
  js/map.js        el mapa del camino (diseño «Mapa Diozen» del Figma) y la hoja de cada día
  js/games.js      trivia, memorama, adivinanza, desafío en familia y calificación
  js/tabbar.js     la barra de pestañas de Theo
  js/musica.js     el sonido: música, voces de Teodoro, efectos y motivo de Adviento
  js/teo-anim.js   Teodoro animado (Lottie): camina en el mapa, salta donde celebra y en la trivia cambia de pose con transiciones
  js/assets.js     índice de imágenes del lienzo (código → archivo)
  js/app.js        SOLO PROTOTIPO: arranque y panel de controles del equipo
  js/dev*.js       SOLO PROTOTIPO: el modo developer (inspector tipo Figma y descargas para Xcode)
  dev/             SOLO PROTOTIPO: catálogo de assets, componentes y estados, y los PNG de Drive para el modo developer
  screens/         las pantallas del lienzo de diseño, ya convertidas a HTML; la app las usa de base y las completa con JS
  assets/          las imágenes que usa la app
    mapa/          el paisaje del mapa en 6 tiras de 600 px (día y noche) y las dos ruletas del camino
    dia-icono/     el ícono de cada día (los del Figma; el mismo de día y de noche)
    pila/          las 12 escenas de Teodoro según la energía (días sin caminar), en día y noche
    poster/        los 7 pósters de temporada del destacado del inicio
    ruleta/ inicio/ tabbar/   ruleta de 8 casillas, fondos del destacado y pestañas
    *.webp/png     el resto, con el código del lienzo como nombre (el índice con nombres legibles está en Drive)
  audio/           «Quiet Snow Village» (actividades y, por defecto, el mapa), «Burrito Sabanero» con Eduardo (mapa, opción 2) y teo/ (9 reacciones de voz de Teodoro)
  anim/            las animaciones Lottie de Teodoro (ver «Teodoro animado»)
tools/             SOLO PROTOTIPO: pruebas de recorrido y capturas (Playwright); no van a la app
```

Todo lo que está en `public/` lo usa la app o el panel del prototipo (`raw.html` y `sheet.html` son para las capturas de `tools/`). El 26 de octubre de 2026 se borró lo que no se usaba: imágenes y pantallas que nadie pedía, la página «Basura» del lienzo, los archivos fuente del lienzo (`design-source/`, con su conversor `tools/convert.py`) y scripts temporales. Todo sigue en el historial de git.

### Qué es solo del prototipo (no va a la app)

- El panel de controles (`js/app.js`) y sus avisos «PROTOTIPO».
- Las compras: Theo Premium y el Pase de Adviento están simulados.
- El conteo de «pantallas vistas» del panel (`seen(...)` en el código).
- Algunas pantallas de `screens/` solo se abren desde el panel: son el diseño de estados que la app arma con JS (reintento de la trivia, pasar en la adivinanza, segunda carta del desafío, Teodoro cansado, modo sin mascota) o tableros de reglas (Datos, Estados, Simple-Flujo, Simple-Reglas).

### El mapa

El mapa es el «Mapa Diozen» del Figma *Theo · Mapa completo (oscuro)*: el paisaje (cielo, sendero, casas, árboles) es una imagen de fondo en `assets/mapa/`, y encima se pintan en vivo los 26 días, Teodoro, las ruletas y sus etiquetas, en las mismas posiciones del Figma (`CENTRO` y `RULETAS` en `js/map.js`). Los días que aún no se abren llevan candado. Si cambia el dibujo del paisaje en el Figma, hay que volver a exportar las tiras; si solo cambian los días o los textos, basta con el código. `tools/mapa-medidas.mjs` compara caja por caja el mapa del MVP con el Figma.

### Modo developer (para quien construye la app)

Como el modo Dev de Figma, sobre el prototipo: **⇧D** o el botón `</>` del panel (en computador; en el celular no aparece). Solo muestra lo de Adviento: la barra de pestañas, la barra de estado del iPhone, lo de Theo en Hoy y el tab Teodoro, y los mundos que no son Adviento no existen para el modo.

- **Arriba, una fila:** el día (‹ Día 9 ›), día/noche, inspeccionar (la flecha; apagada, se usa la app), copiar enlace y salir.
- **Sobre el teléfono:** al pasar el cursor se ve cada componente con su tamaño en pt; el clic lo elige (la opción de respuesta, el botón de música, el día del mapa) y otro clic o doble clic entra a lo de adentro. Con algo elegido, pasar sobre otra cosa muestra la distancia en rojo. Clic derecho: «Capas aquí». Teclado: Esc soltar · Tab el siguiente · T tocar (el toque llega a la app) · I / U inspeccionar o usar la app.
- **Sin nada elegido:** «Elige algo en el teléfono», «Descargar pantalla», los componentes de la pantalla con su número de estados (la lista de trabajo), sus imágenes y animaciones (las Lottie se ven animadas) y, plegadas, las capas.
- **Con algo elegido, en este orden:** qué es (nombre del componente, tipo y tamaño) → un solo botón principal (descargar la imagen o la animación, o copiar el SF Symbol) → sus **estados** en una fila (al tocar uno: cuándo pasa, qué cambia, sus assets y su pantalla en el diseño) → medidas para SwiftUI (tamaño, al contenedor, separación, esquinas), texto (contenido, fuente PostScript, línea, Dynamic Type, líneas, color), estilo y la etiqueta de VoiceOver → el código SwiftUI, plegado. Cada valor se copia al tocarlo, con punto decimal.
- **Cuándo sale cada animación:** al elegir una animación de Teodoro, debajo de «Descargar animación» está su lógica: qué la dispara y qué clips se encadenan (en la trivia: al abrir la pregunta, si fallan, tras 2 vueltas del farol, si aciertan, «Siguiente»…), con el clip elegido resaltado y cada clip descargable; las reglas comunes (salidas del bucle, respingo, movimiento reducido) van plegadas. La misma lógica viaja en el `manifest.json` del paquete. Fuente: `js/dev-logica.js` (se mantiene a mano junto a `teo-anim.js`, `games.js` y `map.js`).
- **Íconos de interfaz:** no son assets; el modo dice qué SF Symbol usar (`speaker.slash.fill`, `xmark`…) con su tamaño, peso y color.
- **Descargas:** «Descargar imagen» baja el `.imageset` para Xcode (@2x y @3x y, si existe, la variante de noche como apariencia oscura); «Descargar animación» baja el JSON para lottie-ios (en la trivia, también las 8); «Descargar pantalla» baja un .zip con `Assets.xcassets/`, `Lottie/` y `manifest.json` (cada capa con posición, tamaño, colores, fuente, SF Symbol y su componente, y los componentes de la pantalla con todos sus estados).
- **De dónde sale cada cosa:** `public/dev/assets.json` (nombre igual al de Drive, descripción, px, pt, ruta en «01 PARA LA APP», si es de Adviento), `public/dev/app/` (los PNG @2x/@3x de Drive: la descarga es la misma calidad de la entrega), `public/dev/componentes.json` (componentes y estados) y `public/dev/fuera.json` (zonas que no son de Adviento). El código está en `js/dev.js` (sobre el teléfono), `js/dev-motor.js` (medidas, colores, descargas y el .zip), `js/dev-panel.js` (el inspector) y `js/dev-logica.js` (cuándo sale cada animación).

### Teodoro animado

Las animaciones son Lottie (lottie-web 5.12.2, versión light, en `vendor/`) hechas con la skill `chroma-to-lottie` a partir de videos de Higgsfield sobre fondo verde. El plan y los archivos están en Drive, «Adviento 2026 › 07 ANIMACIONES TEODORO (trivia)»; los JSON listos, en «04 Lottie listos».

- **Fuera de la trivia:** `teo-caminando.json` (camina en el mapa al llegar un día nuevo) y `teo-celebra.json` (salta en bucle donde estaba el dibujo quieto con estrellas: resultados, fin de los juegos, «¡Te guardé el camino!», Día completo, intro del desafío y el paso 3 de los juegos en familia; `celebrar()` en `teo-anim.js`).
- **En la trivia:** 3 bucles (mapa, farol, celebra) y 5 transiciones entre ellos, todos `teo-trivia-*.json` con el mismo lienzo de 426 × 600, así que se encadenan sin ajustes. Teodoro piensa con el mapa; si fallan, saca el farol (dos vueltas, ~5,6 s, y vuelve al mapa); si aciertan, suelta el mapa o el farol y salta. «Siguiente» abre la pregunta nueva con Teodoro celebrando, que vuelve al mapa. `pasarA()` espera una «salida» del bucle (≤ 0,5 s) o da un respingo para que el cambio no se vea cortado.
- **Sin pausas entre gesto y salto:** los clips traen la pose quieta al principio y al final; cada transición juega solo su `tramo` con movimiento (cuadros 2 a 31), las de celebrar a 1,3× (`vel`), y el bucle de celebrar entra en su cuadro 2 (`inicio`).
- **Bajo un pop-up** (el resultado de la trivia) la pantalla de abajo queda borrosa y en pausa: no compiten dos Teodoros.
- **Cambiar un clip:** reemplaza el JSON en `public/anim/` con el mismo nombre. Si el nuevo no sale del mismo lienzo (426 × 600, Teodoro de 532 px con los pies en 266,6 · 591,3), hay que medirlo y ajustar `LIENZO` en `teo-anim.js`.

## Reglas principales

- **Calendario:** 26 días, del domingo 29 de noviembre al 24 de diciembre. Antes del 29 hay invitación y cuenta regresiva, y el 28 (día 0, un día antes) además se abre el intro en la casa del mapa: video y trivia de presentación con sus 3 estrellas, sin panes; Teodoro espera ahí y el 29 camina al día 1.
- **Pre registro (antes del 29, flujo 1 del lienzo «Pre registro · artes»):** el inicio trae el póster «El Adviento más grande del mundo» y la card de Adviento detrás de un vidrio empañado con «Únete al reto»; al abrir la app sale el pop-up con la cuenta regresiva. Al unirse (desde el pop-up o la card) se abre «¡Ya estás dentro!»; con «Volver al inicio» (o «Volver al cuarto de Teodoro» si se unió desde el cuarto) vuelve a donde estaba y ahí el vidrio se limpia y aparece Teodoro de espaldas mirando el pesebre. El vidrio también se limpia con el dedo, libre (arranca donde sea, también fuera del vidrio, y en cualquier dirección): lo que se arrastra se despeja; al despejar ~42 % se revela todo y se abre «¡Ya estás dentro!», igual que con «Únete al reto» (al volver, la card ya está limpia). Tocarlo sin arrastrar abre el pop-up. Para iOS hay un componente de referencia en `ios/VidrioEmpanado.swift` (guía en `ios/LEEME.md`). La card del tab Teodoro es siempre la misma del inicio. El destacado del inicio es el póster del evento («El Adviento más grande del mundo», con su logo) hasta que la familia EMPIEZA el reto: es su publicidad. Lo ve quien no se ha unido (también después del 29 y en la gracia, con «Unirme gratis») y quien se unió pero aún no ve ningún día («Seguir la aventura» antes del 29, «Iniciar la aventura» desde el 29). Cuando ya vio su primer día, entra el póster de la temporada. Ya dentro, «Seguir la aventura» abre Mundos con la cuenta regresiva.
- **Cada día:** un contenido (historia, video o canción). Trivia solo los días 1, 2, 3, 4, 9, 11, 17, 18 y 24 (5 preguntas, 4 respuestas); los demás días no tienen estrellas.
- **Juego sorpresa** cada 3 días: Memorama, Adivinanza y Desafío en familia.
- **Ruleta** de 8 casillas los días 4, 11, 18 y 24, solo al tocarla en el mapa y después de ver el cuento de su día (antes dice «Termina el día N»; en el recuerdo, «Cerrada»): fondo nuevo, prenda al azar, prenda de la semana, otra oportunidad y panes.
- **Energía de Teodoro:** un contenido lo deja lleno; cada día sin caminar baja una rayita y cambia su escena (`assets/pila`, de feliz a congelado en 10 días). Teodoro siempre está en el día del calendario, aunque la familia vaya atrasada.
- **Gracia:** del 25 de diciembre al 6 de enero se puede terminar el camino («Quedan N días»). Desde el 7 de enero queda como recuerdo.
- **Free y Premium (igual en US y LATAM):** gratis los días 0, 1, 4, 8, 11, 15, 18, 22, 25 y 26; el resto con Theo Premium o el Pase de Adviento (US$19,99, pago único).
- **Destacado del inicio:** del 29 de noviembre al 6 de enero es el póster de la temporada (Esperanza, Paz, Alegría, Amor, Nochebuena, «¡Feliz Navidad!» solo el 25 y Tiempo de Navidad). La energía de Teodoro se ve en la pieza grande de Hoy y en el tab Teodoro.
- Al terminar cada video o canción: «¿Te gustó…?» con 5 estrellas y Compartir.
- **Sonido** (propuesta de diseño sonoro en Drive «05 MUSICA»): las trivias y actividades con «Quiet Snow Village»; el mapa, con la misma (opción 1, la de por defecto) o con «Burrito Sabanero» con Eduardo (opción 2), en panel › Ajustes › «Canción del mapa». En modo noche el ícono de silencio queda blanco también al tocarlo. La música se aparta cuando habla Teodoro o gira la ruleta, baja sola si nadie toca y calla donde habla la familia (adivinanza, «Busquen la estrella»). Ritual del día: Teodoro camina en silencio, dice «¡Vamos a la aventura!» y entra la canción; en «Mañana seguimos» se despide con su final. 9 reacciones de voz de Teodoro, sin globos de texto, con reglas (una a la vez, 8 s entre voces, 6 de paso al día, nunca la misma seguida, nunca encima de un diálogo de la canción), 8 efectos sintetizados y el motivo «La estrella de Teodoro». El botón de silencio calla solo la música.

## Pruebas

Con `npm run dev` corriendo, cada recorrido en su propio proceso:

```bash
node tools/e2e.mjs dia /tmp/e2e mobile
```

Recorridos: `dia ruleta memorama adivinanza desafio juegos antes reto regreso atrasado nochebuena oscuro post nav cerrado inicio paginas hoja volver libre sintrivia titulos teodoro vidrio poster completo`. `completo` es la familia entera de punta a punta (teaser, inscripción, el intro del 28, los 26 días con sus trivias, juegos y ruletas, Nochebuena y Navidad) y tarda unos 30 minutos. Las herramientas buscan Chrome en `~/Library/Caches/ms-playwright/chromium-1243`; en otro computador, cambia esa ruta.

## Dónde está lo demás

En Drive, carpeta «Adviento 2026»: todas las imágenes ordenadas por sección y con índice, capturas de cada pantalla, el flujo y las decisiones, las escenas de Teodoro, los pósters de temporada, la música y los archivos fuente del lienzo. El lienzo de diseño es el artefacto «Theo Quest · Camino a Belén» de Claude.

El contenido, las ilustraciones y la marca Theo pertenecen a Familify.
