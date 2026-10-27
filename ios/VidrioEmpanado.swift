// VidrioEmpanado.swift — Camino a Belén (Theo)
//
// Card «Camino a Belén» antes del 29 de noviembre: el vidrio empañado se limpia con el dedo
// y deja ver a Teodoro de espaldas mirando el pesebre. Al despejar ~42 % se revela todo,
// la familia queda unida (`unido = true`) y se llama a `alRevelarTodo`: ahí se abre
// «¡Ya estás dentro!», igual que al tocar «Únete al reto». Tocar sin arrastrar llama a
// `alTocar` (abre el teaser). Si nadie lo toca, un dedo fantasma limpia una franja tenue.
//
// Mismos números que el MVP web: public/js/flow.js → vidrioConDedo. Guía: ios/LEEME.md.
// SwiftUI puro, iOS 17+. Sin dependencias.

import SwiftUI

public struct VidrioEmpanado<Escena: View>: View {
    @Binding private var unido: Bool
    private let vidrio: Image
    private let alTocar: () -> Void
    private let alRevelarTodo: () -> Void
    private let escena: Escena

    /// - Parameters:
    ///   - unido: la familia ya está en el reto. Si llega en `true`, no hay vidrio.
    ///     Al limpiar el vidrio pasa a `true`: ahí se guarda y la card cambia sus botones.
    ///   - vidrio: el arte del vidrio empañado (gotas + abertura donde se asoma Teodoro).
    ///   - alTocar: un toque sin arrastrar (abre el teaser antes de unirse).
    ///   - alRevelarTodo: el vidrio terminó de desvanecerse (0,95 s después de unirse):
    ///     abre «¡Ya estás dentro!», la misma pantalla que «Únete al reto».
    ///   - escena: lo que hay detrás del vidrio; la misma imagen de la card «ya dentro».
    public init(unido: Binding<Bool>, vidrio: Image, alTocar: @escaping () -> Void = {},
                alRevelarTodo: @escaping () -> Void = {}, @ViewBuilder escena: () -> Escena) {
        _unido = unido
        self.vidrio = vidrio
        self.alTocar = alTocar
        self.alRevelarTodo = alRevelarTodo
        self.escena = escena()
        _hayVidrio = State(initialValue: !unido.wrappedValue)
    }

    // Lienzo de 358×201 pt (como en el diseño); todo se escala al ancho real.
    static var ancho: CGFloat { 358 }
    static var alto: CGFloat { 201 }
    static var radio: CGFloat { 24 }          // pincel: 24 pt de radio, borde suave
    static var columnas: Int { 14 }           // rejilla 14×8 = 112 celdas
    static var filas: Int { 8 }
    static var meta: Int { 47 }               // 47 celdas ≈ 42 % → unido
    static var duracionPista: Double { 1.5 }
    /// Zona de toque libre: el vidrio + este margen (hasta los bordes de la pantalla a los lados).
    /// El dedo puede arrancar donde sea —también fuera del vidrio— e ir en cualquier dirección.
    static var margenToque: EdgeInsets { EdgeInsets(top: 10, leading: 16, bottom: 0, trailing: 16) }

    @Environment(\.accessibilityReduceMotion) private var sinMovimiento
    @State private var hayVidrio: Bool
    @State private var desvanecer = false
    @State private var trazos: [[CGPoint]] = []   // en puntos del lienzo 358×201
    @State private var celdas = Set<Int>()
    @State private var enCurso = false
    @State private var recorrido: CGFloat = 0
    @State private var pistaInicio: Date?
    @State private var pistaHasta: Double = 0     // hasta dónde limpió el dedo fantasma (0…1)
    @State private var anchoVidrio: CGFloat = 358

    public var body: some View {
        GeometryReader { geo in
            let k = geo.size.width / Self.ancho
            ZStack(alignment: .topLeading) {
                escena
                    .frame(width: geo.size.width, height: geo.size.height)
                if hayVidrio {
                    vidrio
                        .resizable()
                        .scaledToFill()
                        .frame(width: geo.size.width, height: geo.size.height)
                        .clipped()
                        .mask { mascara(k: k) }
                        .opacity(desvanecer ? 0 : 1)
                        .blur(radius: desvanecer && !sinMovimiento ? 8 : 0)
                        .allowsHitTesting(false)
                    if let inicio = pistaInicio {
                        dedoFantasma(desde: inicio, k: k)
                    }
                }
            }
        }
        .aspectRatio(Self.ancho / Self.alto, contentMode: .fit)
        .clipped()
        .onGeometryChange(for: CGFloat.self) { $0.size.width } action: { anchoVidrio = $0 }
        // el gesto vive en una zona más grande que el vidrio (y vuelve a su tamaño para el layout)
        .padding(Self.margenToque)
        .contentShape(Rectangle())
        .gesture(
            DragGesture(minimumDistance: 0)
                .onChanged { arrastrar(a: enVidrio($0.location)) }
                .onEnded { soltar(en: enVidrio($0.location)) }
        )
        .padding(EdgeInsets(top: -Self.margenToque.top, leading: -Self.margenToque.leading,
                            bottom: -Self.margenToque.bottom, trailing: -Self.margenToque.trailing))
        .sensoryFeedback(.impact(weight: .light, intensity: 0.6), trigger: celdas.count / 6)
        .sensoryFeedback(.success, trigger: desvanecer) { _, nuevo in nuevo }
        .task { await pista() }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(unido ? "Camino a Belén" : "Camino a Belén: se revela al unirte al reto")
        .accessibilityAddTraits(.isButton)
        .accessibilityAction { alTocar() }
        .accessibilityAction(named: "Limpiar el vidrio y unirte al reto") { if !unido { completar() } }
    }

    // MARK: - Dibujo

    /// Opaco = vidrio; cada trazo lo borra con borde suave (destinationOut + blur).
    private func mascara(k: CGFloat) -> some View {
        TimelineView(.animation(paused: pistaInicio == nil)) { tl in
            Canvas { ctx, size in
                ctx.fill(Path(CGRect(origin: .zero, size: size)), with: .color(.black))
                ctx.blendMode = .destinationOut
                ctx.addFilter(.blur(radius: Self.radio * 0.45 * k))
                let pincel = StrokeStyle(lineWidth: Self.radio * 1.4 * k, lineCap: .round, lineJoin: .round)
                let escala = CGAffineTransform(scaleX: k, y: k)
                let hasta = pistaInicio.map { Self.progreso(desde: $0, ahora: tl.date) } ?? pistaHasta
                if hasta > 0 {
                    ctx.opacity = 0.45
                    ctx.stroke(Self.rutaPista(hasta: hasta).applying(escala), with: .color(.black), style: pincel)
                    ctx.opacity = 1
                }
                for t in trazos where t.count > 1 {
                    var p = Path()
                    p.addLines(t)
                    ctx.stroke(p.applying(escala), with: .color(.black), style: pincel)
                }
            }
        }
    }

    private func dedoFantasma(desde inicio: Date, k: CGFloat) -> some View {
        TimelineView(.animation) { tl in
            let e = Self.progreso(desde: inicio, ahora: tl.date)
            let p = Self.puntoPista(e)
            Circle()
                .fill(.white.opacity(0.7))
                .overlay(Circle().stroke(.white.opacity(0.6), lineWidth: 2))
                .shadow(color: Color(red: 0, green: 0.12, blue: 0.24).opacity(0.28), radius: 7, y: 4)
                .frame(width: 40, height: 40)
                .position(x: p.x * k, y: p.y * k)
                .opacity(e < 1 ? 1 : 0)
        }
        .allowsHitTesting(false)
    }

    // MARK: - Gesto

    /// Punto de la zona de toque → punto del lienzo 358×201 (puede quedar fuera del vidrio).
    private func enVidrio(_ lugar: CGPoint) -> CGPoint {
        let k = max(anchoVidrio, 1) / Self.ancho
        return CGPoint(x: (lugar.x - Self.margenToque.leading) / k, y: (lugar.y - Self.margenToque.top) / k)
    }

    private func arrastrar(a p: CGPoint) {
        guard hayVidrio, !desvanecer else { return }
        cortarPista()
        guard enCurso, let ult = trazos.last?.last else {
            enCurso = true
            recorrido = 0
            trazos.append([p])
            return
        }
        let d = hypot(p.x - ult.x, p.y - ult.y)
        guard d >= 4 else { return }          // menos puntos: el Canvas redibuja rápido
        trazos[trazos.count - 1].append(p)
        var s: CGFloat = 0
        while s <= d {
            marcar(CGPoint(x: ult.x + (p.x - ult.x) * s / d, y: ult.y + (p.y - ult.y) * s / d))
            s += 6
        }
        marcar(p)
        recorrido += d
        if celdas.count >= Self.meta { completar() }
    }

    private func soltar(en p: CGPoint) {
        // toque = casi sin recorrido y sobre el vidrio (un toque en el margen no abre nada)
        let fueToque = recorrido < 10 && (0...Self.ancho).contains(p.x) && (0...Self.alto).contains(p.y)
        enCurso = false
        recorrido = 0
        if fueToque { alTocar() }
    }

    /// Celdas cuyo centro queda dentro del pincel.
    private func marcar(_ p: CGPoint) {
        let cw = Self.ancho / CGFloat(Self.columnas), ch = Self.alto / CGFloat(Self.filas)
        for cx in 0..<Self.columnas {
            for cy in 0..<Self.filas where hypot((CGFloat(cx) + 0.5) * cw - p.x, (CGFloat(cy) + 0.5) * ch - p.y) <= Self.radio {
                celdas.insert(cy * Self.columnas + cx)
            }
        }
    }

    private func completar() {
        guard hayVidrio, !desvanecer else { return }
        enCurso = false
        cortarPista()
        unido = true                          // la familia queda unida: quien usa la card guarda y cambia los botones
        withAnimation(.easeInOut(duration: 0.7)) { desvanecer = true }
        Task {
            try? await Task.sleep(for: .seconds(0.7))
            hayVidrio = false
            try? await Task.sleep(for: .seconds(0.25))
            alRevelarTodo()                   // «¡Ya estás dentro!» con confeti, como «Únete al reto»
        }
    }

    // MARK: - Pista sin palabras

    private func pista() async {
        guard hayVidrio, !sinMovimiento else { return }
        try? await Task.sleep(for: .seconds(1.8))
        guard !Task.isCancelled, trazos.isEmpty, !desvanecer else { return }
        pistaInicio = .now
        try? await Task.sleep(for: .seconds(Self.duracionPista))
        if pistaInicio != nil { pistaHasta = 1; pistaInicio = nil }
    }

    private func cortarPista() {
        guard let inicio = pistaInicio else { return }
        pistaHasta = Self.progreso(desde: inicio, ahora: .now)
        pistaInicio = nil
    }

    static func progreso(desde inicio: Date, ahora: Date) -> Double {
        let t = min(1, max(0, ahora.timeIntervalSince(inicio) / duracionPista))
        return t < 0.5 ? 2 * t * t : 1 - pow(-2 * t + 2, 2) / 2
    }

    static func puntoPista(_ e: Double) -> CGPoint {
        CGPoint(x: 70 + 218 * e, y: 104 + 28 * sin(e * .pi * 2))
    }

    static func rutaPista(hasta e: Double) -> Path {
        var p = Path()
        p.addLines(stride(from: 0.0, through: e, by: 0.02).map(puntoPista) + [puntoPista(e)])
        return p
    }
}

// MARK: - Ejemplo

struct VidrioEmpanado_Previews: PreviewProvider {
    struct Card: View {
        @State var unido = false
        @State var yaDentro = false
        var body: some View {
            VStack(alignment: .leading, spacing: 12) {
                VidrioEmpanado(unido: $unido, vidrio: Image("vidrio-empanado"),
                               alTocar: { /* abre el teaser */ },
                               alRevelarTodo: { yaDentro = true }) {
                    ZStack(alignment: .topLeading) {
                        Image("camino-fondo").resizable().scaledToFill()
                        GeometryReader { g in
                            let k = g.size.width / 358
                            Image("teodoro-de-espaldas").resizable()
                                .frame(width: 144 * k, height: 210 * k)
                                .shadow(color: Color(red: 0, green: 0.03, blue: 0.17).opacity(0.45), radius: 6, y: 6)
                                .offset(x: 106 * k, y: 22 * k)
                        }
                    }
                }
                Text("Camino a Belén").font(.title2.bold())
                Button(unido ? "Seguir la aventura" : "Únete al reto") {}
                    .buttonStyle(.borderedProminent)
            }
            .padding(16)
            .fullScreenCover(isPresented: $yaDentro) { Text("¡Ya estás dentro!") }
        }
    }
    static var previews: some View { Card() }
}
