# Vidrio empañado (iOS)

Card «Camino a Belén» antes del 29 de noviembre. La familia limpia el vidrio con el dedo y aparece Teodoro de espaldas mirando el pesebre. Al despejar ~42 % se revela todo, la familia queda unida al reto y se abre «¡Ya estás dentro!», la misma pantalla que con «Únete al reto».

- Componente: [`VidrioEmpanado.swift`](VidrioEmpanado.swift). SwiftUI puro, iOS 17+, sin dependencias.
- Cómo se siente: en el MVP, https://camino-a-belen-mvp.vercel.app → panel de controles → «Sin inscribirse» → baja a la card (inicio o tab Teodoro) y arrastra el dedo.
- Código del MVP con los mismos números: `public/js/flow.js` → `vidrioConDedo`.

## Uso

```swift
@State private var unido = false          // viene del servidor: ¿la familia ya está en el reto?
@State private var yaDentro = false

VidrioEmpanado(unido: $unido,
               vidrio: Image("vidrio-empanado"),
               alTocar: { mostrarTeaser = true },          // toque sin arrastrar
               alRevelarTodo: { yaDentro = true }) {       // «¡Ya estás dentro!» con confeti
    // detrás del vidrio: la misma imagen de la card «ya dentro»
    CaminoEscena()   // camino-fondo + teodoro-de-espaldas (left 106, top 22, 144×210 sobre 358×201)
}
.onChange(of: unido) { _, nuevo in if nuevo { guardarInscripcion() } }
```

- `unido` pasa a `true` en el momento en que se despeja la meta: guarda ahí.
- `alRevelarTodo` llega 0,95 s después, cuando el vidrio terminó de desvanecerse: abre «¡Ya estás dentro!».
- Al volver de esa pantalla, la card ya está limpia: no se vuelve a empañar.
- La card del inicio y la del tab Teodoro son la misma: usa este componente en las dos.

## Imágenes

| Asset en Xcode | Archivo en el repo | Tamaño |
|---|---|---|
| `vidrio-empanado` | `public/assets/ffc14384b753c2d8d87872f172d05946.webp` | 1074×603 |
| `camino-fondo` | `public/assets/601dffc99f4046212c443d9f68cffa56.webp` | 1672×941 |
| `teodoro-de-espaldas` | `public/assets/1f3fd4be1e19dc04ca6f72efef34263e.webp` | 548×800, con transparencia |

Las tres suman 516 KB en WebP. Para pasarlas a PNG: `sips -s format png <archivo>.webp --out <nombre>.png`. En el catálogo, «Single Scale».

## Números

| Qué | Valor |
|---|---|
| Lienzo | 358×201 pt; todo escala al ancho real |
| Pincel | 24 pt de radio: línea de 33,6 pt + desenfoque de 10,8 pt (borde suave) |
| Progreso | rejilla de 14×8 = 112 celdas; cuenta la celda cuyo centro cae dentro del pincel |
| Meta | 47 celdas (≈ 42 %): una pasada de lado a lado no alcanza; dos o tres sí |
| Desvanecer | 0,7 s (opacidad + desenfoque de 8 pt); `alRevelarTodo` a los 0,95 s |
| Zona de toque | el vidrio + 16 pt a cada lado (hasta el borde de la pantalla) + 10 pt arriba (`margenToque`) |
| Toque | menos de 10 pt de recorrido y sobre el vidrio = toque → `alTocar` |
| Dedo fantasma | si nadie toca en 1,8 s, un dedo recorre la card en 1,5 s y limpia una franja al 45 %; no cuenta para la meta |
| Háptica | impacto ligero cada 6 celdas; `.success` al unirse |

## Detalles

- Libre: el dedo puede arrancar donde sea dentro de la zona de toque (también fuera del vidrio, por ejemplo con el pulgar desde el borde derecho) e ir en cualquier dirección; limpia por donde pasa.
- Nada encima del vidrio puede recibir toques: el degradado de abajo de la card va con `.allowsHitTesting(false)`. En el MVP ese degradado tapaba el 25 % inferior y, si el dedo arrancaba ahí, no limpiaba.
- El arrastre sobre la zona no hace scroll: es a propósito. El resto de la pantalla sí.
- VoiceOver: la card es un botón (abre el teaser) con la acción «Limpiar el vidrio y unirte al reto».
- Reducir movimiento: sin dedo fantasma ni desenfoque; el vidrio solo se desvanece.
- Rendimiento: los puntos del trazo se guardan cada 4 pt, así el `Canvas` de la máscara redibuja poco. Nada se carga aparte de las tres imágenes.

## Verificado

- `swiftc -typecheck -swift-version 6` contra el SDK de iOS 17: sin errores ni avisos.
- Por probar en un iPhone: que el margen fuera del vidrio reciba el dedo. Funciona si la card no le pone `contentShape` ni otro gesto encima; si no, pon el gesto en la card.
- La máscara (`Canvas` con `.destinationOut` + desenfoque) renderizada con `ImageRenderer` sobre las imágenes reales.
- En el MVP web: prueba `node tools/e2e.mjs vidrio <carpeta> mobile` (inicio y tab Teodoro), y 8 direcciones × dedo y mouse arrancando dentro y fuera del vidrio.
