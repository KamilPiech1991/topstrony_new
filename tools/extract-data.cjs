// Evaluates the design's renderVals() for every page and writes plain JSON (functions dropped,
// blob ids -> optimized /img paths, canvas file links -> Astro routes).
const fs = require('fs');
const N = '/home/claude/new/';
const src = fs.readFileSync('/home/claude/tech.js', 'utf8') + '\n' + fs.readFileSync('/home/claude/stack.js', 'utf8') + '\n' +
  fs.readFileSync('tools/svc.js', 'utf8') + '\n' + fs.readFileSync(N + 'methods.js', 'utf8').trimEnd() + '\n' + fs.readFileSync(N + 'render.js', 'utf8');
global.DCLogic = class { constructor(p) { this.props = p; this.state = {}; } setState() {} };
global.window = { localStorage: { getItem() { return null; }, setItem() {} } };
const C = eval(src + '\n;Component');
const img = JSON.parse(fs.readFileSync('src/data/img-map.json', 'utf8'));
const SVCd = eval(fs.readFileSync('tools/svc.js', 'utf8') + ';SVC');
const routes = { 'Main.dc.html': '/', 'ONas.dc.html': '/o-nas/', 'Kontakt.dc.html': '/kontakt/', 'Realizacje.dc.html': '/realizacje/',
  '/case-studies/': '/#realizacje', '/opinie/': '/#opinie', '/blog/': '/#blog' };
for (const S of Object.values(SVCd)) routes[S.file] = '/uslugi/' + S.slug + '/';
const fixStr = (s) => {
  s = s.replace(/\/_blob\/([0-9a-z]+)/g, (m, id) => (img[id] ? img[id].src : m));
  if (routes[s]) return routes[s];
  const m = s.match(/^([A-Za-z-]+\.dc\.html)(#.*)$/); if (m && routes[m[1]]) return routes[m[1]] + m[2];
  return s;
};
const clean = (v) => {
  if (typeof v === 'function') return undefined;
  if (typeof v === 'string') return fixStr(v);
  if (Array.isArray(v)) return v.map((x, i) => { const c = clean(x); if (c && typeof c === 'object' && !Array.isArray(c) && c.i === undefined) c.i = String(i); return c; });
  if (v && typeof v === 'object') { const o = {}; for (const [k, x] of Object.entries(v)) { const c = clean(x); if (c !== undefined) o[k] = c; } return o; }
  return v;
};
const pages = { home: 'home', onas: 'onas', kontakt: 'kontakt' };
for (const k of Object.keys(SVCd)) pages['srv-' + k] = 'srv-' + k;
fs.mkdirSync('src/data/pages', { recursive: true });
for (const [name, page] of Object.entries(pages)) {
  const inst = new C({ page });
  const v = clean(inst.renderVals());
  // calculator rows: keep both variants so the static page can switch them without a re-render
  const alt = new C({ page }); alt.state = { ...inst.state, proj: [1, 1, 1, 1, 1, 1] };
  const b = clean(alt.renderVals()).projRows || [];
  const a0 = new C({ page }); a0.state = { ...inst.state, proj: [0, 0, 0, 0, 0, 0] };
  const z = clean(a0.renderVals()).projRows || [];
  (v.projRows || []).forEach((r, i) => { r.meta0 = z[i].meta; r.meta1 = b[i].meta; r.time0 = z[i].time; r.time1 = b[i].time; });
  fs.writeFileSync('src/data/pages/' + name + '.json', JSON.stringify(v));
}
fs.writeFileSync('src/data/routes.json', JSON.stringify(routes, null, 1));
console.log('ok', Object.keys(pages));
