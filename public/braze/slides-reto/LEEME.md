# Slides del reto · in-app de Braze

Los 4 slides que salen **cuando la persona se une al reto de Adviento**. Su «¡Vamos!» (y cerrar) lleva a **«¡Ya estás dentro!»** en la app nativa.
Se ve en el navegador: https://camino-a-belen-mvp.vercel.app/braze/slides-reto/ (día o noche según el tema del teléfono; ahí «¡Vamos!» muestra lo que haría la app).

## Qué hay en esta carpeta

- `braze.html`: **el que se pega en Braze** (Custom Code). Usa las URLs de los archivos ya subidos a Braze (`urls.json`).
- `index.html`: el mismo mensaje con los nombres de archivo, para verlo en la web.
- 8 imágenes `adviento-slide-reto-<n>-<slide>-<claro|oscuro>.jpg`: el arte de cada slide ya armado (sale del MVP), de día y de noche.
- Neue Montreal 400 y 700 (`.otf`).
- **No se editan a mano**: `node tools/braze-slides.mjs capturar` saca el arte del MVP y `node tools/braze-slides.mjs` arma los dos HTML.

El texto, los puntos, «Siguiente / ¡Vamos!» y la X van en HTML (se leen con VoiceOver y se corrigen sin rehacer imágenes).
Respecto del MVP no están las entradas animadas de cada slide (el abanico, la ruleta que gira, Teodoro saltando): cada arte entra suave.

## En Braze (hecho el 6-nov-2026, guardado como borrador, sin lanzar)

Campaña **«test»** del workspace Theo: Prayer and Meditation:

- **Compose:** Custom Code con `braze.html` y los 10 archivos subidos.
- **Schedule:** Action-based con `eng_quest_join` o `eng_join_challenge_click` (ya estaba), envío inmediato, sin re-elegibilidad (se ve una vez).
- **Target:** All Users (iOS) + **idioma español**; la variante A al 100 % (estaba al 50 %).
- **Conversion:** sigue la del test premium (`mon_subscription_purchase_success` > 30 USD en 30 días): por decidir.

## Botones (para ver los clics en Braze)

- **Botón 1** (`brazeBridge.logClick('0')`): «¡Vamos!» en el último slide.
- **Botón 2** (`brazeBridge.logClick('1')`): cerrar (la X, tocar fuera de la ventana o Esc).

Los dos abren el deep link de «¡Ya estás dentro!»; al abrirlo, la app cierra el mensaje sola.

## Pendiente

- **Deep link de «¡Ya estás dentro!»** del equipo de la app. Hoy: `theo://adviento/ya-estas-dentro`. Para cambiarlo: `DEEP_LINK=theo://… node tools/braze-slides.mjs` y volver a pegar `braze.html`.
- **El evento de conversión** (por ejemplo, abrir el primer día del camino).
- **Nombre** de la campaña según el patrón de Theo (por ejemplo `Adviento - iOS ES - Slides del reto al unirse`) y la copia para **Android ES**.
- El revisor de accesibilidad de Braze marca contraste en el texto del slide 1: con axe-core no hay problema ni de día ni de noche (falso positivo).
