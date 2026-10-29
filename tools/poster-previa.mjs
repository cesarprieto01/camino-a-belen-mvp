// node tools/poster-previa.mjs <spec.json> <salida.png>
// spec: [{ etiqueta, fondo, teo, teoCss, kicker, escena }]  (escena=true: el fondo ya trae a Teodoro)
import { chromium } from 'playwright';
import fs from 'fs';
const [specF, out] = process.argv.slice(2);
const spec = JSON.parse(fs.readFileSync(specF, 'utf8'));
const b64 = f => 'data:image/' + (f.endsWith('.webp') ? 'webp' : 'png') + ';base64,' + fs.readFileSync(f).toString('base64');
const destello = '<svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24"><path fill="#F5DB78" d="M12 0c.9 6.6 4.8 10.6 12 12-7.2 1.4-11.1 5.4-12 12-.9-6.6-4.8-10.6-12-12C7.2 10.6 11.1 6.6 12 0Z"/></svg>';
const flecha = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const card = s => `<figure><div class="card"><div class="heroe-pre">
  <img class="hp-fondo" src="${b64(s.fondo)}" style="${s.fondoCss || ''}" alt="">
  ${s.sombra ? `<span style="position:absolute;${s.sombra};border-radius:50%;background:radial-gradient(closest-side,rgba(4,10,30,.55),transparent)"></span>` : ''}
  ${s.teo ? `<img class="hp-teo" src="${b64(s.teo)}" style="${s.teoCss || ''}" alt="">` : ''}
  <span class="hp-degradado"></span>
  <div class="hp-texto"><span class="hp-kicker">${destello}<span>${s.kicker}</span>${destello}</span><b class="hp-titulo">Adviento</b></div>
  <a class="hp-boton"><span>Continuar la aventura</span>${flecha}</a></div></div><figcaption>${s.etiqueta}</figcaption></figure>`;
const html = `<html><head><link rel="stylesheet" href="http://localhost:5190/app.css"><style>
body{margin:0;background:#EEF2F7;display:flex;flex-wrap:wrap;gap:28px;padding:24px;font:600 13px/1.3 Mulish,sans-serif;color:#06325A;align-items:flex-start}
figure{margin:0;display:flex;flex-direction:column;gap:10px;align-items:center;width:256px}
figcaption{text-align:center}
.card{position:relative;width:256px;height:330px;border-radius:24px;overflow:hidden;box-shadow:0 8px 24px rgba(2,37,79,.18)}
</style></head><body>${spec.map(card).join('')}</body></html>`;
const br = await chromium.launch({ executablePath: '/Users/ces/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const p = await (await br.newContext({ viewport: { width: 48 + Math.min(spec.length, 4) * 284, height: 420 }, deviceScaleFactor: 2 })).newPage();
await p.setContent(html, { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
await p.screenshot({ path: out, fullPage: true }); await br.close();
