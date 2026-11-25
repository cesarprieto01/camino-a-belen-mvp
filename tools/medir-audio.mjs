// Mide el sonido REAL que sale (dBFS) en la trivia, la carta y el mapa, con un analizador enganchado a la salida del audio.
// node tools/medir-audio.mjs (BASE=https://… para producción). Referencia del 21-nov: trivia ≈ -46, carta ≈ -31, mapa ≈ -39 (picos -23).
import { chromium } from 'playwright';
import fs from 'fs';
const CFT = '/Users/ces/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const executablePath = process.env.CHROME || (fs.existsSync(CFT) ? CFT : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
const B = process.env.BASE || 'http://localhost:5190';
const b = await chromium.launch({ executablePath, args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.addInitScript(() => {
  const orig = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest, ...r) {
    if (dest instanceof AudioDestinationNode) { const c = dest.context; if (!c.__an) { c.__an = c.createAnalyser(); c.__an.fftSize = 4096; orig.call(c.__an, dest); window.__ctx = c; } return orig.call(this, c.__an, ...r); }
    return orig.call(this, dest, ...r);
  };
  window.__rms = () => { const a = window.__ctx?.__an; if (!a) return -999; const d = new Float32Array(a.fftSize); a.getFloatTimeDomainData(d); let s = 0; for (const x of d) s += x * x; return 20 * Math.log10(Math.sqrt(s / d.length) + 1e-9); };
});
await p.goto(B + '/app.html'); await p.waitForTimeout(2000);
await p.mouse.click(700, 400); await p.waitForTimeout(500);
const medir = async (etq, ms = 6000) => { const v = []; for (let t = 0; t < ms; t += 250) { await p.waitForTimeout(250); v.push(await p.evaluate(() => window.__rms())); }
  const s = [...v].sort((a, b) => a - b), med = s[Math.floor(s.length / 2)];
  const e = await p.evaluate(async () => { const m = await import('/js/musica.js'); const c = await import('/js/core.js'); const e = m.estadoMusica(); return `${c.cur?.name} pista=${e.pista} reposo=${e.reposo} voz=${e.vozDuck}`; });
  console.log(etq.padEnd(16), `mediana ${med.toFixed(1)} dBFS · máx ${s.at(-1).toFixed(1)} · mín ${s[0].toFixed(1)} ·`, e); };
await p.evaluate(async () => { const c = await import('/js/core.js'); c.reset({ hoy: 17, inscrito: true, teaserVisto: true }); for (let n = 0; n <= 16; n++) c.S.completos[n] = { contenido: true }; c.save(); c.go('trivia', { day: 17 }, 'none'); });
await medir('trivia');
await p.evaluate(async () => { const c = await import('/js/core.js'); c.reset({ hoy: 26, inscrito: true, teaserVisto: true }); for (let n = 0; n <= 25; n++) if (n % 5) c.S.completos[n] = { contenido: true }; c.save(); c.go('cartaSecreta', {}, 'fade'); });
await medir('carta secreta');
await p.evaluate(async () => { const c = await import('/js/core.js'); c.go('cartaFirma', {}, 'push'); });
await medir('carta · firma');
await p.evaluate(async () => { const c = await import('/js/core.js'); c.go('mapa', {}, 'fade', { tab: true }); });
await medir('mapa (burrito)', 8000);
await p.evaluate(async () => { const m = await import('/js/musica.js'); const c = await import('/js/core.js'); c.S.musica = false; c.save(); m.musicaPara(); });
await medir('música apagada', 3000);
await b.close();
