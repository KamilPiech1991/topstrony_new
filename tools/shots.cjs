// node tools/shots.cjs '[["/",1440,"home"],...]'  -> /tmp/shots/<name>.jpg (full page, reveals forced)
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve('dist');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain' };
const srv = http.createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  if (!fs.existsSync(f)) { s.writeHead(404); return s.end('404'); }
  s.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s);
}).listen(4321);
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  fs.mkdirSync('/tmp/shots', { recursive: true });
  const errs = [];
  for (const [u, w, n, theme, full] of JSON.parse(process.argv[2])) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 });
    if (theme) await ctx.addInitScript((t) => { try { localStorage.setItem('ts-theme', t); } catch (e) {} }, theme);
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errs.push(n + ': ' + e.message));
    p.on('console', (m) => { if (m.type() === 'error') errs.push(n + ' console: ' + m.text()); });
    await p.goto('http://localhost:4321' + u, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1500);
    if (full !== false) {
      await p.evaluate(() => document.querySelectorAll('img[loading=lazy]').forEach((i) => { i.loading = 'eager'; }));
      await p.waitForLoadState('networkidle');
      await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo(0, 0); });
      await p.evaluate(() => document.querySelectorAll('.rv,.split,.scr,.cnt,.rule,.stg,.m-reveal').forEach((e) => e.classList.add('in')));
      await p.waitForTimeout(1300);
    }
    if (full === false) await p.screenshot({ path: '/tmp/shots/' + n + '.jpg', quality: 70 });
    else {
      const H = await p.evaluate(() => document.documentElement.scrollHeight);
      const step = 8000; let k = 0;
      for (let y = 0; y < H; y += step, k++) {
        await p.screenshot({ path: '/tmp/shots/' + n + '_' + k + '.png', fullPage: true, clip: { x: 0, y, width: w, height: Math.min(step, H - y) } });
      }
      require('child_process').execSync(`python3 -c "
from PIL import Image
import glob
fs=sorted(glob.glob('/tmp/shots/${n}_[0-9]*.png'),key=lambda f:int(f.split('_')[-1][:-4]))
ims=[Image.open(f) for f in fs]
out=Image.new('RGB',(ims[0].size[0],sum(i.size[1] for i in ims)))
y=0
for i in ims: out.paste(i,(0,y)); y+=i.size[1]
out.save('/tmp/shots/${n}.jpg',quality=70)
"`);
    }
    await ctx.close();
  }
  console.log(errs.join('\n') || 'no errors');
  await b.close(); srv.close();
})();
