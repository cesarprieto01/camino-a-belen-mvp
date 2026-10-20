// Compara pantalla del lienzo (raw) vs la app: node tools/cmp.mjs <archivo-lienzo> <js para ir a la pantalla> <out>
import { chromium } from 'playwright';
const [file, nav, out] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/Users/ces/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const p = await b.newPage({ viewport: { width: 900, height: 900 } });
await p.goto('http://localhost:5190/sheet.html?l=' + file); await p.waitForSelector('body[data-ready]'); await p.waitForTimeout(600);
await p.screenshot({ path: out + '-a.png', clip: { x: 0, y: 0, width: 420, height: 900 } });
const q = await b.newPage({ viewport: { width: 390, height: 844 } });
await q.goto('http://localhost:5190/app.html'); await q.waitForTimeout(900);
await q.evaluate(nav); await q.waitForTimeout(1500);
await q.locator('#viewport').screenshot({ path: out + '-b.png' });
await b.close();
