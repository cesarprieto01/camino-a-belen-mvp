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
    # trazos del lienzo que terminan con una curva incompleta (el navegador los rechaza): se recorta el último tramo
    def fix_d(m):
        need = {'M': 2, 'L': 2, 'C': 6, 'S': 4, 'Q': 4, 'T': 2, 'A': 7, 'H': 1, 'V': 1, 'Z': 0}
        out = []
        for cmd, args in re.findall(r'([A-Za-z])([^A-Za-z]*)', m.group(1)):
            nums = re.findall(r'-?\d*\.?\d+(?:e-?\d+)?', args)
            k = need.get(cmd.upper(), 0)
            if k:
                nums = nums[:len(nums) - len(nums) % k]
                if not nums: continue
            out.append(cmd + ' '.join(nums))
        return 'd="' + ' '.join(out) + '"'
    body = re.sub(r'd="([^"]*\d[^"]*)"', lambda m: fix_d(m) if re.search(r'[CSQ]', m.group(1)) and len(m.group(1)) > 400 else m.group(0), body)
    title = re.search(r'<title>([\s\S]*?)</title>', t)
    dark = bool(re.search(r'#00082B|#02254F', body[:600])) or '-oscuro' in fname
    stem = fname[:-len('.dc.html')]
    h = b['h']
    # Pantallas con varios bloques sueltos (Tab Teodoro antes del 29): el lienzo las trae «ya desplazadas».
    # Se convierten en página con scroll real que empieza arriba.
    first = re.match(r'<div style="([^"]*)"', body)
    if first and re.search(r'top:\s*-(\d+)px', first.group(1)) and body.count('\n<div style="position: absolute; left: 0; right: 0; top: 0; height: 50px') + body.count('<nav') >= 1:
        shift = int(re.search(r'top:\s*-(\d+)px', first.group(1)).group(1))
        style = first.group(1).replace(f'top: -{shift}px', 'top: 0')
        bottoms = [int(a) + int(c) for a, c in re.findall(r'top: (\d+)px; [^"]*?height: (\d+)px', body)]
        declared = [int(x) for x in re.findall(r'height:\s*(\d+)px', style)]
        inner_h = max([h + shift, max(bottoms) + 96] + declared)
        style = re.sub(r'height:\s*\d+px', f'height: {inner_h}px', style)
        body = body.replace(first.group(1), style, 1)
        bg = re.search(r'background:\s*([^;]+)', style)
        body = f'<div style="width: {b["w"]}px; height: {inner_h}px; position: relative; overflow: hidden; background: {bg.group(1) if bg else "transparent"}">' + body + '</div>'
        h = inner_h
    (OUT / f'{stem}.html').write_text(body)
    manifest[stem] = {
        'w': b['w'], 'h': h,
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

# Secciones del lienzo (notas «N · …»), para que el panel siga el orden aunque se muevan cosas
secs = []
for n in canvas.get('notes', {}).values():
    if n.get('page') in (None, 'page-1') and n.get('kind') == 'title1':
        m = re.match(r'^(\d+)\s*·\s*(.+?)(?:\s+·|$)', n['text'])
        if m: secs.append({'n': int(m.group(1)), 'title': m.group(2).strip(), 'y': n['y']})
secs.sort(key=lambda s: s['y'])
(OUT / 'sections.json').write_text(json.dumps(secs, ensure_ascii=False, indent=1))
