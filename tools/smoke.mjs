// node tools/smoke.mjs <out-prefix> [steps json]
import { chromium } from 'playwright';
const [out = 'tmp/s', w = '1440', h = '900'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/Users/ces/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
const errs = [];
p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
await p.goto('http://localhost:5190/app.html');
await p.waitForTimeout(1800);
await p.screenshot({ path: out + '.png' });
console.log(errs.join('\n') || 'sin errores');
await b.close();
