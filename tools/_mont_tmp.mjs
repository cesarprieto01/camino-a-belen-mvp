// node tools/montage.mjs <dir> <out.png> [cols] [from] [to]
import { chromium } from 'playwright';
import fs from 'fs'; import path from 'path';
const [dir, out, cols = 6, from = 0, to = 99] = process.argv.slice(2);
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jpg')).sort().slice(+from, +to);
const html = `<body style="margin:0;background:#333;display:grid;grid-template-columns:repeat(${cols},260px);gap:8px;padding:8px;font:12px sans-serif;color:#fff">${files.map(f => `<div><div>${f}</div><img src="data:image/jpeg;base64,${fs.readFileSync(path.join(dir, f)).toString('base64')}" style="width:260px"></div>`).join('')}</body>`;
const b = await chromium.launch({ executablePath: '/Users/ces/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const p = await b.newPage({ viewport: { width: 8 + cols * 268, height: 600 } });
await p.setContent(html); await p.waitForTimeout(300);
await p.screenshot({ path: out, fullPage: true }); await b.close();
