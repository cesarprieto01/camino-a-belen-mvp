# Camino a Belén · MVP

Prototipo navegable de **Theo Quest · Camino a Belén**: un camino de Adviento de 26 días con Teodoro, el burrito de la app Theo, para familias católicas.

En vivo: https://camino-a-belen-mvp.vercel.app

## Correrlo en tu computador

```bash
npm install
npm run dev
```

Abre http://localhost:5190/app.html. El botón de controles (arriba a la derecha) trae recorridos listos para probar cada caso: antes del 29, un día con trivia, día de ruleta, juegos sorpresa, Navidad, etc.

## Cómo está hecho

- `public/` — la app: HTML, CSS y módulos JavaScript sin framework.
  - `js/core.js` — estado, navegación, pop-ups y hojas.
  - `js/flow.js` — Hoy, espera, Mundos, tab Teodoro, reproductor, retos, premios.
  - `js/map.js` — el mapa del camino y la hoja del día.
  - `js/games.js` — trivia, memorama, adivinanza, desafío y la calificación.
  - `js/data.js` — los 26 días (alineados al cronograma de contenido), la trivia y las reglas.
  - `screens/` — pantallas convertidas desde el lienzo de diseño.
- `design-source/` — las mesas del lienzo de diseño de donde salen las pantallas (`npm run convert`).
- `tools/e2e.mjs` — pruebas de recorrido con Playwright: `node tools/e2e.mjs dia,ruleta,hoja <carpeta> mobile`.
- `tools/lienzo.mjs` — capturas de todas las pantallas en claro y oscuro.

## Reglas principales

- Trivia solo los días 1, 2, 3, 4, 9, 11, 17, 18 y 24; los demás días se completan con el contenido.
- Juego sorpresa cada 3 días (Memorama, Adivinanza, Desafío en familia).
- Ruleta los días 4, 11, 18 y 24, solo al tocarla en el mapa.
- Al terminar cada video o canción: «¿Te gustó…?» con 5 estrellas y Compartir.
- Música de fondo en el mapa y la trivia: «Burrito Sabanero» (piano, en loop sin cortes) al 75 % del volumen original (`public/audio/`, `js/musica.js`).

El contenido, las ilustraciones y la marca Theo pertenecen a Familify.
