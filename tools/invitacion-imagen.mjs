// node tools/invitacion-imagen.mjs <salida.png>: dibuja la imagen de invitación (1200×630) desde screens/Invitacion-imagen.html
// con las fuentes de la app (necesita el servidor local en :5190). Luego: cwebp -q 82 y un nombre nuevo en assets (se cachean 1 semana).
import { chromium } from 'playwright';
import fs from 'fs';
const [out] = process.argv.slice(2);
const frag = fs.readFileSync('public/screens/Invitacion-imagen.html', 'utf8');
const b = await chromium.launch({ executablePath: '/Users/ces/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.goto('http://localhost:5190/app.html'); // mismo origen: fuentes y assets como en la app
await p.evaluate(f => { document.body.innerHTML = f; document.body.style.margin = '0'; }, frag);
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);
await p.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 630 } });
await b.close();
