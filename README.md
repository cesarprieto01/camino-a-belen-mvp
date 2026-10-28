# Camino a Belén · MVP

Prototipo navegable de **Theo Quest · Camino a Belén**: un camino de Adviento de 26 días con Teodoro, el burrito de la app Theo, para familias católicas.

- En vivo: https://camino-a-belen-mvp.vercel.app
- La rama `main` es siempre lo que está publicado.

## Correrlo

```bash
npm install
npm run dev
```

Abre http://localhost:5190/app.html. El botón de controles (arriba a la derecha) es solo del prototipo: mueve los días, carga escenarios (antes del 29, un día con trivia, día de ruleta, juegos sorpresa, Navidad, gracia, free…) y simula compras.

## Qué hay en el repo

```
public/            la app (HTML, CSS y JavaScript sin framework)
  js/data.js       el contenido y las reglas: los 26 días, la trivia, premios, ruleta, días gratis
  js/core.js       estado, fechas y fases (antes · camino · gracia · recuerdo), navegación, pop-ups y hojas
  js/flow.js       Hoy, destacado y pósters de temporada, tab Teodoro, Mundos, reproductor, retos, premios, ruleta
  js/map.js        el mapa del camino (diseño «Mapa Diozen» del Figma) y la hoja de cada día
  js/games.js      trivia, memorama, adivinanza, desafío en familia y calificación
  js/tabbar.js     la barra de pestañas de Theo
  js/musica.js     la música del mapa y la trivia
  js/assets.js     índice de imágenes del lienzo (código → archivo)
  js/app.js        SOLO PROTOTIPO: arranque y panel de controles del equipo
  screens/         las pantallas del lienzo de diseño, ya convertidas a HTML; la app las usa de base y las completa con JS
  assets/          las imágenes que usa la app
    mapa/          el paisaje del mapa en 6 tiras de 600 px (día y noche) y las dos ruletas del camino
    dia-icono/     el ícono de cada día (los del Figma; el mismo de día y de noche)
    pila/          las 12 escenas de Teodoro según la energía (días sin caminar), en día y noche
    poster/        los 7 pósters de temporada del destacado del inicio
    ruleta/ inicio/ tabbar/   ruleta de 8 casillas, fondos del destacado y pestañas
    *.webp/png     el resto, con el código del lienzo como nombre (el índice con nombres legibles está en Drive)
  audio/           «Burrito Sabanero» en piano, en loop
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

## Reglas principales

- **Calendario:** 26 días, del domingo 29 de noviembre al 24 de diciembre. Antes del 29 hay invitación y cuenta regresiva.
- **Pre registro (antes del 29, flujo 1 del lienzo «Pre registro · artes»):** el inicio trae el póster «El Adviento más grande del mundo» y la card de Adviento detrás de un vidrio empañado con «Únete al reto»; al abrir la app sale el pop-up con la cuenta regresiva. Al unirse (desde el pop-up o la card) se abre «¡Ya estás dentro!»; con «Volver al inicio» (o «Volver al cuarto de Teodoro» si se unió desde el cuarto) vuelve a donde estaba y ahí el vidrio se limpia y aparece Teodoro de espaldas mirando el pesebre. El vidrio también se limpia con el dedo, libre (arranca donde sea, también fuera del vidrio, y en cualquier dirección): lo que se arrastra se despeja; al despejar ~42 % se revela todo y se abre «¡Ya estás dentro!», igual que con «Únete al reto» (al volver, la card ya está limpia). Tocarlo sin arrastrar abre el pop-up. Para iOS hay un componente de referencia en `ios/VidrioEmpanado.swift` (guía en `ios/LEEME.md`). La card del tab Teodoro es siempre la misma del inicio. El destacado del inicio es el póster del evento («El Adviento más grande del mundo», con su logo) hasta que la familia EMPIEZA el reto: es su publicidad. Lo ve quien no se ha unido (también después del 29 y en la gracia, con «Unirme gratis») y quien se unió pero aún no ve ningún día («Seguir la aventura» antes del 29, «Iniciar la aventura» desde el 29). Cuando ya vio su primer día, entra el póster de la temporada. Ya dentro, «Seguir la aventura» abre Mundos con la cuenta regresiva.
- **Cada día:** un contenido (historia, video o canción). Trivia solo los días 1, 2, 3, 4, 9, 11, 17, 18 y 24 (5 preguntas, 4 respuestas); los demás días no tienen estrellas.
- **Juego sorpresa** cada 3 días: Memorama, Adivinanza y Desafío en familia.
- **Ruleta** de 8 casillas los días 4, 11, 18 y 24, solo al tocarla en el mapa y después de ver el cuento de su día (antes dice «Termina el día N»; en el recuerdo, «Cerrada»): fondo nuevo, prenda al azar, prenda de la semana, otra oportunidad y panes.
- **Energía de Teodoro:** un contenido lo deja lleno; cada día sin caminar baja una rayita y cambia su escena (`assets/pila`, de feliz a congelado en 10 días). Teodoro siempre está en el día del calendario, aunque la familia vaya atrasada.
- **Gracia:** del 25 de diciembre al 6 de enero se puede terminar el camino («Quedan N días»). Desde el 7 de enero queda como recuerdo.
- **Free y Premium (igual en US y LATAM):** gratis los días 0, 1, 4, 8, 11, 15, 18, 22, 25 y 26; el resto con Theo Premium o el Pase de Adviento (US$19,99, pago único).
- **Destacado del inicio:** del 29 de noviembre al 6 de enero es el póster de la temporada (Esperanza, Paz, Alegría, Amor, Nochebuena, «¡Feliz Navidad!» solo el 25 y Tiempo de Navidad). La energía de Teodoro se ve en la pieza grande de Hoy y en el tab Teodoro.
- Al terminar cada video o canción: «¿Te gustó…?» con 5 estrellas y Compartir.
- Música en el mapa y la trivia al 37,5 % del volumen original.

## Pruebas

Con `npm run dev` corriendo, cada recorrido en su propio proceso:

```bash
node tools/e2e.mjs dia /tmp/e2e mobile
```

Recorridos: `dia ruleta memorama adivinanza desafio antes reto regreso atrasado nochebuena oscuro post nav cerrado inicio paginas hoja volver libre sintrivia titulos teodoro vidrio poster`. Las herramientas buscan Chrome en `~/Library/Caches/ms-playwright/chromium-1243`; en otro computador, cambia esa ruta.

## Dónde está lo demás

En Drive, carpeta «Adviento 2026»: todas las imágenes ordenadas por sección y con índice, capturas de cada pantalla, el flujo y las decisiones, las escenas de Teodoro, los pósters de temporada, la música y los archivos fuente del lienzo. El lienzo de diseño es el artefacto «Theo Quest · Camino a Belén» de Claude.

El contenido, las ilustraciones y la marca Theo pertenecen a Familify.
