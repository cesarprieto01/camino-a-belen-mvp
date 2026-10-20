// node tools/shots.mjs out.png "A,B,C" [url-base]
import { chromium } from 'playwright';
const [out, list, base = 'http://localhost:5190'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/Users/ces/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const p = await b.newPage({ viewport: { width: 1660, height: 900 } });
await p.goto(`${base}/sheet.html?l=${list}`);
await p.waitForSelector('body[data-ready]'); await p.waitForTimeout(800);
await p.screenshot({ path: out, fullPage: true, scale: 'css' });
await b.close();
