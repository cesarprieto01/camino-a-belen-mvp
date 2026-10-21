// Se ejecuta en el navegador: convierte lo que se ve en #viewport en HTML con estilos en línea,
// listo para una mesa editable del lienzo (sin clases, sin JS, sin app.css).
(() => {
  const vp = document.querySelector('#viewport');
  const PROPS = ['position', 'top', 'right', 'bottom', 'left', 'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
    'display', 'flex-direction', 'flex-wrap', 'align-items', 'align-content', 'align-self', 'justify-content', 'justify-items', 'justify-self',
    'flex-grow', 'flex-shrink', 'flex-basis', 'order', 'row-gap', 'column-gap', 'grid-template-columns', 'grid-template-rows', 'grid-column', 'grid-row', 'grid-auto-flow',
    'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'box-sizing',
    'overflow-x', 'overflow-y', 'z-index', 'background-color', 'background-image', 'background-size', 'background-position', 'background-repeat', 'background-clip',
    'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width', 'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
    'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
    'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius',
    'box-shadow', 'outline-width', 'outline-style', 'outline-color', 'outline-offset', 'opacity', 'transform', 'transform-origin', 'filter', 'backdrop-filter', '-webkit-backdrop-filter',
    'mix-blend-mode', 'isolation', 'clip-path', '-webkit-mask-image', 'mask-image', 'object-fit', 'object-position', 'vertical-align', 'pointer-events', 'aspect-ratio'];
  const INH = ['color', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-align', 'text-transform', 'white-space',
    'word-break', 'overflow-wrap', 'text-shadow', 'visibility', 'font-variant-numeric', 'text-wrap', '-webkit-text-stroke-width', '-webkit-text-stroke-color'];
  const NOINH = ['text-decoration-line', 'text-decoration-color', 'text-overflow', '-webkit-line-clamp', '-webkit-box-orient'];
  // valores por defecto de cada etiqueta, medidos en un documento limpio
  const ifr = document.createElement('iframe'); ifr.style.cssText = 'position:absolute;width:0;height:0;border:0;visibility:hidden'; document.body.appendChild(ifr);
  const idoc = ifr.contentDocument; idoc.open(); idoc.write('<!doctype html><html><body></body></html>'); idoc.close();
  const defs = {};
  const defOf = tag => { if (defs[tag]) return defs[tag]; const e = idoc.createElement(tag); idoc.body.appendChild(e); const cs = ifr.contentWindow.getComputedStyle(e); const o = {}; for (const p of [...PROPS, ...NOINH]) o[p] = cs.getPropertyValue(p); e.remove(); return (defs[tag] = o); };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const escA = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  const KEEP_ATTR = ['src', 'alt', 'aria-label', 'role', 'href', 'type', 'aria-hidden', 'width', 'height', 'viewBox'];
  const FIXED = [];
  const VOID = new Set(['br', 'hr', 'wbr', 'input', 'img']);
  const SKIP = new Set(['SCRIPT', 'STYLE', 'CANVAS', 'NOSCRIPT', 'TEMPLATE', 'LINK', 'META']);

  function styleOf(el, parentCs, isRoot) {
    const cs = getComputedStyle(el); const d = defOf(el.tagName.toLowerCase()); const out = [];
    for (const p of [...PROPS, ...NOINH]) {
      let v = cs.getPropertyValue(p); if (v === d[p]) continue;
      if (p === 'position' && v === 'fixed') v = 'absolute';
      if (p === 'position' && v === 'sticky') v = 'absolute';
      // en flujo normal el ancho/alto lo da el contenido: solo se fija en lo posicionado, imágenes y cajas flex/grid de tamaño fijo
      if ((p === 'width' || p === 'height') && !isRoot) {
        const abs = /absolute|fixed/.test(cs.position); const repl = /^(IMG|SVG|BUTTON|INPUT|VIDEO)$/i.test(el.tagName);
        const inline = el.style[p] && el.style[p] !== 'auto';
        if (!abs && !repl && !inline) continue;
      }
      if (/^(top|right|bottom|left)$/.test(p) && /absolute|sticky/.test(cs.position)) continue;
      out.push(`${p}: ${v}`);
    }
    // lo posicionado va con su caja real dentro del contenedor (como se ve en el MVP)
    if (/absolute|sticky/.test(cs.position) && el.offsetParent) {
      const mt = parseFloat(cs.marginTop) || 0, ml = parseFloat(cs.marginLeft) || 0;
      out.push(`top: ${el.offsetTop - mt}px`, `left: ${el.offsetLeft - ml}px`);
    } else if (cs.position === 'absolute' && el instanceof SVGElement === false) {
      const r = el.getBoundingClientRect(); out.push(`top: ${r.top}px`, `left: ${r.left}px`);
    }
    for (const p of INH) { const v = cs.getPropertyValue(p); if (isRoot || !parentCs || v !== parentCs.getPropertyValue(p) || (el.tagName === 'A' && p === 'color')) out.push(`${p}: ${v}`); }
    if (el.tagName === 'A' && !out.some(x => x.startsWith('text-decoration-line'))) out.push(`text-decoration-line: ${cs.textDecorationLine}`);
    return { css: out.join('; '), cs };
  }

  function ser(node, parentCs, isRoot) {
    if (node.nodeType === 3) { const t = node.nodeValue; return t.trim() || /\s/.test(t) ? esc(t) : ''; }
    if (node.nodeType !== 1) return '';
    const el = node; if (SKIP.has(el.tagName)) return '';
    const cs0 = getComputedStyle(el); if (cs0.display === 'none') return '';
    if (el.closest('#panel,#panelBtn,.toast,.nota')) return '';
    if (el instanceof SVGElement && el.tagName.toLowerCase() !== 'svg') return '';
    const tag = el.tagName.toLowerCase();
    if (cs0.position === 'fixed' && !el.dataset.fx) {
      const r = el.getBoundingClientRect(), v = vp.getBoundingClientRect();
      el.dataset.fx = '1'; const h = ser(el, parentCs, false); delete el.dataset.fx;
      FIXED.push(h.replace(/style="/, `style="top: ${r.top - v.top}px; left: ${r.left - v.left}px; width: ${r.width}px; height: ${r.height}px; right: auto; bottom: auto; `));
      return '';
    }
    const { css, cs } = styleOf(el, parentCs, isRoot);
    if (tag === 'svg') {
      const c = el.cloneNode(true); c.removeAttribute('class'); c.setAttribute('style', css);
      // el color de los trazos puede venir de la hoja de estilos: se copia el calculado a cada pieza
      const src = [el, ...el.querySelectorAll('*')], dst = [c, ...c.querySelectorAll('*')];
      src.forEach((o, i) => { if (!i) return; const k = getComputedStyle(o); const d = dst[i]; d.removeAttribute('class');
        const st = ['fill', 'stroke', 'stroke-width', 'opacity', 'fill-opacity', 'stroke-opacity'].map(p => `${p}: ${k.getPropertyValue(p)}`).join('; ');
        d.setAttribute('style', (d.getAttribute('style') || '') + ';' + st); });
      const k0 = getComputedStyle(el); c.setAttribute('style', css + `; fill: ${k0.fill}; stroke: ${k0.stroke}; color: ${k0.color}`);
      return c.outerHTML;
    }
    const attrs = KEEP_ATTR.filter(a => el.hasAttribute(a)).map(a => ` ${a}="${escA(a === 'src' ? el.getAttribute('src') : el.getAttribute(a))}"`).join('');
    const kids = [...el.childNodes].map(k => ser(k, cs, false)).join('');
    // un contenedor desplazado (el mapa) se congela en su posición actual
    const st = el.scrollTop, sl = el.scrollLeft;
    const inner = (st || sl) ? `<div style="position: absolute; left: 0; top: 0; width: ${el.scrollWidth}px; height: ${el.scrollHeight}px; transform: translate(${-sl}px, ${-st}px)">${kids}</div>` : kids;
    const t = tag === 'img' ? 'img' : tag;
    return VOID.has(t) ? `<${t}${attrs} style="${escA(css)}">` : `<${t}${attrs} style="${escA(css)}">${inner}</${t}>`;
  }
  const layers = [...vp.querySelectorAll(':scope > .layer, :scope > *')].filter(l => getComputedStyle(l).display !== 'none' && !l.matches('#panel,#panelBtn,.toast,.nota'));
  const vpCs = getComputedStyle(vp);
  const body = layers.map(l => ser(l, vpCs, false)).join('') + FIXED.join('');
  ifr.remove();
  return `<div style="width: 390px; height: 844px; position: relative; overflow: hidden; background: ${vpCs.backgroundColor}; color: ${vpCs.color}; font-family: ${escA(vpCs.fontFamily)}">${body}</div>`;
})()
