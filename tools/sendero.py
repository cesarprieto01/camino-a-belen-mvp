# Traza el sendero de piedras del mapa (paisaje de día) entre cada par de días seguidos, por el medio de las piedras:
# los puntos por donde pasan los pies de Teodoro, desde donde está de pie en un día hasta donde queda de pie en el siguiente. Escribe public/js/sendero.js.
# Uso: uv run --with pillow --with numpy --with scipy --with scikit-image python tools/sendero.py [imagen-de-control.png]
import json, re, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from skimage.graph import route_through_array

K = 2  # las tiras miden 780 de ancho: 2 px por punto
src = open('public/js/map.js').read()
i = src.index('const CENTRO'); C = {int(n): (float(x), float(y)) for n, x, y in re.findall(r'(\d+): \[([\d.]+), (\d+)\]', src[i:src.index('};', i)])}
mapa = Image.new('RGB', (390 * K, 3600 * K))
for t in range(6): mapa.paste(Image.open(f'public/assets/mapa/dia-{t}.webp').convert('RGB'), (0, t * 600 * K))
a = np.asarray(mapa).astype(int); R, G, B = a[..., 0], a[..., 1], a[..., 2]
# el sendero = piedras (gris cálido) + su borde de arena clara; el pasto es verde, el fondo de abajo crema y el de arriba durazno más oscuro
piedra = (R - G >= 4) & (R - G <= 14) & (R - B >= 8) & (R - B <= 30) & (R > 150)  # el fondo crema de abajo tiene R ≈ G y menos azul
borde = (G >= 205) & (R - G >= 22) & (R - G <= 45) & (R >= 235)
senda = ndimage.binary_closing(ndimage.binary_opening(piedra | borde, iterations=1), iterations=3)
dist = ndimage.distance_transform_edt(senda)
costo = np.where(senda, 1.0 / (1.0 + dist) ** 2, 50.0)  # por el medio cuesta menos; fuera del sendero, casi prohibido

def simplificar(pts, eps):
    if len(pts) < 3: return pts
    p0, p1 = np.array(pts[0]), np.array(pts[-1]); d = p1 - p0; L = np.hypot(*d) or 1
    dists = [abs(d[0] * (p[1] - p0[1]) - d[1] * (p[0] - p0[0])) / L for p in pts[1:-1]]
    j = int(np.argmax(dists)) + 1
    if dists[j - 1] > eps: return simplificar(pts[:j + 1], eps)[:-1] + simplificar(pts[j:], eps)
    return [pts[0], pts[-1]]

def suave(x):  # 0 → 1 sin quiebres
    x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)

out = {}
for n in range(2, 27):
    # por el medio de las piedras, de centro a centro de los días
    (x0, y0), (x1, y1) = C[n - 1], C[n]
    ruta, _ = route_through_array(costo, (int(y0 * K), int(x0 * K)), (int(y1 * K), int(x1 * K)), fully_connected=True, geometric=True)
    P = np.array([(c / K, r / K) for r, c in ruta])
    # cada 1 punto de recorrido y suavizado gaussiano (sigma 9): sigue el sendero sin el zigzag de las piedras grandes
    seg = np.r_[0, np.cumsum(np.hypot(*np.diff(P, axis=0).T))]; u = np.arange(0, seg[-1] + .5, 1.0); u[-1] = seg[-1]
    xs, ys = np.interp(u, seg, P[:, 0]), np.interp(u, seg, P[:, 1])
    xs, ys = ndimage.gaussian_filter1d(xs, 9, mode='nearest'), ndimage.gaussian_filter1d(ys, 9, mode='nearest')
    w = suave(np.minimum(u, u[-1] - u) / 10)  # las puntas, exactas en el centro de cada día
    xs = xs * w + np.where(u < u[-1] / 2, x0, x1) * (1 - w); ys = ys * w + np.where(u < u[-1] / 2, y0, y1) * (1 - w)
    # los pies: de pie en un día van 28 bajo el centro (29 en el de hoy); al caminar suben a la línea del medio en los primeros 24 de recorrido y bajan en los últimos 24
    ys = ys + 28 * (1 - suave(u / 24)) * (u < u[-1] / 2) + 29 * (1 - suave((u[-1] - u) / 24)) * (u >= u[-1] / 2)
    pts = list(zip(xs, ys)); pts[0], pts[-1] = (x0, y0 + 28), (x1, y1 + 29)
    out[n] = [[round(x, 1), round(y, 1)] for x, y in simplificar(pts, .8)]

with open('public/js/sendero.js', 'w') as f:
    f.write('// Sendero de piedras entre cada día y el anterior (tools/sendero.py): puntos por donde camina Teodoro, de sus pies en el día n-1 a sus pies en el día n.\n')
    f.write('export const SENDERO = {\n' + ',\n'.join(f'  {n}: {json.dumps(v, separators=(",", ":"))}' for n, v in out.items()) + ',\n};\n')

if len(sys.argv) > 1:  # imagen de control: el sendero en rojo sobre el mapa (y la máscara aparte, si se pide)
    if len(sys.argv) > 2: Image.fromarray((senda * 255).astype('uint8')).resize((390, 3600)).save(sys.argv[2])
    d = ImageDraw.Draw(mapa)
    for n, v in out.items(): d.line([(x * K, y * K) for x, y in v], fill=(230, 30, 30), width=4); [d.ellipse((x * K - 4, y * K - 4, x * K + 4, y * K + 4), fill=(30, 30, 230)) for x, y in v]
    mapa.resize((390, 3600)).save(sys.argv[1])
print({n: len(v) for n, v in out.items()})
