/**
 * Erzeugt alle Export-Dateien in brand/export/.
 *   node brand/build/render.js            (Playwright + Chromium erforderlich)
 *   node brand/build/render.js advent     (nur Dateien, deren Name "advent" enthält)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'export');
const only = process.argv[2];
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.png': 'image/png' };

function serve() {
  const srv = http.createServer((req, res) => {
    const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r(srv)));
}

async function canvasPng(page, url, out) {
  await page.goto(url);
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const data = await page.evaluate(() => document.getElementById('c').toDataURL('image/png'));
  fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
}

async function canvasJpg(page, url, out, quality = 0.92) {
  await page.goto(url);
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const data = await page.evaluate(q => document.getElementById('c').toDataURL('image/jpeg', q), quality);
  fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
}

/** Bild als randlose PDF-Seite in exakter Größe (mm). */
async function imagePdf(page, base, img, out, wMm, hMm) {
  await page.goto(`${base}/build/blank.html`);
  const src = 'data:image/jpeg;base64,' + fs.readFileSync(img).toString('base64');
  await page.setContent(`<style>@page{size:${wMm}mm ${hMm}mm;margin:0}html,body{margin:0}img{display:block;width:${wMm}mm;height:${hMm}mm}</style><img src="${src}">`);
  await page.pdf({ path: out, width: `${wMm}mm`, height: `${hMm}mm`, printBackground: true, pageRanges: '1' });
}

async function htmlPdf(page, url, out) {
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: out, format: 'A4', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  await page.emulateMedia({ media: 'screen' });
}

async function svgPng(page, base, svg, out, width, bg = 'transparent') {
  await page.goto(`${base}/build/blank.html`);
  await page.setContent(`<style>html,body{margin:0;background:${bg}}img{display:block;width:${width}px}</style><img src="${base}/${svg}">`);
  await page.waitForFunction(() => document.images[0].complete);
  const el = await page.$('img');
  await el.screenshot({ path: out, omitBackground: bg === 'transparent' });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const want = n => !only || n.includes(only);
  const o = n => path.join(OUT, n);

  const jobs = [
    ['logo-png', async () => {
      for (const v of ['dunkel', 'hell', 'weiss', 'schwarz']) {
        await svgPng(page, base, `logo/logo-${v}.svg`, o(`logo-${v}-2000px.png`), 2000);
        await svgPng(page, base, `logo/signet-${v}.svg`, o(`signet-${v}-512px.png`), 512);
      }
    }],
    ['teams', async () => {
      await canvasPng(page, `${base}/vorlagen/teams-hintergrund.html?v=logo`, o('teams-hintergrund-1920x1080.png'));
      await canvasPng(page, `${base}/vorlagen/teams-hintergrund.html?v=pur`, o('teams-hintergrund-ohne-logo-1920x1080.png'));
    }],
    ['advent', async () => {
      await canvasJpg(page, `${base}/vorlagen/adventskalender.html`, o('adventskalender-A4quer-300dpi-beschnitt3mm.jpg'), 0.95);
      await canvasJpg(page, `${base}/vorlagen/adventskalender.html?tueren=1`, o('adventskalender-mit-tueren-A4quer-300dpi-beschnitt3mm.jpg'), 0.95);
      await imagePdf(page, base, o('adventskalender-A4quer-300dpi-beschnitt3mm.jpg'), o('adventskalender-A4quer-beschnitt3mm.pdf'), 303, 216);
      await imagePdf(page, base, o('adventskalender-mit-tueren-A4quer-300dpi-beschnitt3mm.jpg'), o('adventskalender-mit-tueren-A4quer-beschnitt3mm.pdf'), 303, 216);
    }],
    ['brief', async () => {
      await htmlPdf(page, `${base}/vorlagen/briefkopf.html?leer=1`, o('briefbogen-leer-A4.pdf'));
      await htmlPdf(page, `${base}/vorlagen/briefkopf.html`, o('briefbogen-beispiel-A4.pdf'));
    }],
  ];
  for (const [name, fn] of jobs) if (want(name)) { await fn(); console.log('✓', name); }
  await browser.close();
  srv.close();
})();
