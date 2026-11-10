// Renderiza la imagen para historias de la TheoBox: tools/historia-theobox.html → public/assets/theobox/historia.jpg
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
const aqui = p => fileURLToPath(new URL(p, import.meta.url));
const [src = aqui('./historia-theobox.html'), out = aqui('../public/assets/theobox/historia.jpg')] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/Users/ces/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', args: ['--allow-file-access-from-files'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto('file://' + src, { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);
console.log(await p.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight).join(', ')));
await p.screenshot({ path: out, type: 'jpeg', quality: 86, clip: { x: 0, y: 0, width: 1080, height: 1920 } });
await b.close();
