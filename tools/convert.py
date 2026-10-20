#!/usr/bin/env python3
"""Convierte las pantallas del lienzo de Claude Design (design-source/*.dc.html)
en fragmentos HTML que el MVP inyecta (public/screens/<archivo>.html) y genera
public/screens/manifest.json con tamaño y tema de cada pantalla.

- Reescribe /_blob/<id> -> assets/<id>.<ext> (usa .webp optimizado si existe)
- Deja solo el div raíz del artboard (sin <helmet>, que es igual en todas)
"""
import json, os, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'design-source'
ASSETS = ROOT / 'public' / 'assets'
OUT = ROOT / 'public' / 'screens'
OUT.mkdir(parents=True, exist_ok=True)

# 1) Optimizar PNG/JPG pesados a WebP (una vez)
blob_file = {}
for f in sorted(ASSETS.iterdir()):
    if f.suffix in ('.png', '.jpg') and f.stat().st_size > 60_000:
        webp = f.with_suffix('.webp')
        if not webp.exists():
            subprocess.run(['cwebp', '-quiet', '-q', '82', '-alpha_q', '90', str(f), '-o', str(webp)], check=True)
        if webp.stat().st_size < f.stat().st_size:
            f.unlink()
            f = webp
        else:
            webp.unlink()
    blob_file[f.stem] = f.name
# volver a listar por si hubo cambios
for f in ASSETS.iterdir():
    blob_file.setdefault(f.stem, f.name)
    if f.suffix == '.webp':
        blob_file[f.stem] = f.name

canvas = json.loads((SRC / 'canvas.json').read_text())
boards = {k: b for k, b in canvas['boards'].items() if b.get('page') in (None, 'page-1')}

def blob(m):
    bid = m.group(1)
    name = blob_file.get(bid)
    if not name:
        print('FALTA asset', bid, file=sys.stderr)
        return m.group(0)
    return 'assets/' + name

manifest = {}
for fname, b in boards.items():
    t = (SRC / fname).read_text()
    body = t[t.find('<x-dc>') + 6:t.rfind('</x-dc>')]
    body = re.sub(r'<helmet>[\s\S]*?</helmet>', '', body).strip()
    body = re.sub(r'/_blob/([0-9a-f]{32})', blob, body)
    title = re.search(r'<title>([\s\S]*?)</title>', t)
    dark = bool(re.search(r'#00082B|#02254F', body[:600])) or '-oscuro' in fname
    stem = fname[:-len('.dc.html')]
    (OUT / f'{stem}.html').write_text(body)
    manifest[stem] = {
        'w': b['w'], 'h': b['h'],
        'title': b.get('title') or (title.group(1).strip() if title else stem),
        'dark': dark,
        'x': b['x'], 'y': b['y'],
    }

(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=1))
# fuentes del helmet (iguales en todas): se copian a app.css a mano
total = sum(f.stat().st_size for f in ASSETS.iterdir())
print(f'{len(manifest)} pantallas · assets {total/1e6:.1f} MB')

# Mapa id -> archivo para el JS del MVP
files = {f.stem: f.name for f in ASSETS.iterdir()}
(ROOT / 'public' / 'js' / 'assets.js').write_text('export const FILES = ' + json.dumps(files, sort_keys=True) + ';\n')
