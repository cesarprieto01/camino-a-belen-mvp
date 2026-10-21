import { chromium } from 'playwright'; import fs from 'fs';
const dir = process.argv[2];
const b = await chromium.launch({ executablePath: '/Users/ces/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
const head = `<!doctype html><html><head><meta charset="utf-8"><base href="http://localhost:5190/"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Mulish:wght@400;500;600;700;800&display=swap"><style>
@font-face{font-family:"Neue Montreal";src:url("assets/16bd749815fc4408d1b50b7c8bd433f3.otf");font-weight:500}
@font-face{font-family:"Neue Montreal";src:url("assets/52a6d304b2788dd70960c8db3c3e12e5.otf");font-weight:400}
@font-face{font-family:"Neue Montreal";src:url("assets/3419e3c4ca7d11a9b7d64e2c8dac84ba.otf");font-weight:700}
body{margin:0}</style></head><body>`;
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.html'))) {
  fs.writeFileSync('public/_cmp.html', head + fs.readFileSync(dir + '/' + f, 'utf8') + '</body></html>');
  await p.goto('http://localhost:5190/_cmp.html'); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${dir}/${f.replace('.html', '.render.jpg')}`, type: 'jpeg', quality: 80 });
}
fs.unlinkSync('public/_cmp.html'); await b.close();
