/* top.strony – interactions and motion (vanilla, no dependencies).
   Replaces the design's component state: theme, mega menu, mobile menu, services accordion, FAQ,
   calculator, quick-contact sheet, contact form, plus scroll / pointer animations. */

const root = document.getElementById('top') as HTMLElement;
const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = root) => el.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = root) => Array.from(el.querySelectorAll<T>(s));
const mq = (q: string) => window.matchMedia(q).matches;
const reduce = mq('(prefers-reduced-motion: reduce)');
const fine = mq('(hover: hover) and (pointer: fine)');
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));

/* ---------- theme ---------- */
function syncTheme() {
  const light = root.dataset.theme === 'light';
  const label = light ? 'Włącz tryb ciemny' : 'Włącz tryb jasny';
  $$('[data-act="theme"]').forEach((b) => {
    if (b.classList.contains('tlink')) b.textContent = label;
    else { b.setAttribute('aria-label', label); b.setAttribute('aria-pressed', String(light)); }
  });
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', light ? '#FFFFFF' : '#0A0E0B');
}
function toggleTheme() {
  root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
  try { localStorage.setItem('ts-theme', root.dataset.theme); } catch (e) { /* private mode */ }
  syncTheme();
}

/* ---------- show / hide state blocks ---------- */
const show = (key: string, on: boolean, i?: string) =>
  $$(`[data-if="${key}"]${i !== undefined ? `[data-i="${i}"]` : ''}`).forEach((w) => { w.hidden = !on; });

/* ---------- mobile menu ---------- */
let menuOpen = false;
function setMenu(on: boolean) {
  menuOpen = on;
  show('menu', on);
  $$('.burger').forEach((b) => b.setAttribute('aria-expanded', String(on)));
  document.documentElement.style.overflow = on ? 'hidden' : '';
  if (on) $<HTMLElement>('.mnav .icon-btn')?.focus();
}

/* ---------- mega menu ---------- */
const mega = $('#mega-uslugi');
let megaOpen = false, megaT = 0;
function setMega(on: boolean) {
  if (!mega || megaOpen === on) return;
  megaOpen = on;
  mega.classList.toggle('is-open', on);
  mega.setAttribute('aria-hidden', String(!on));
  $('.mega-veil')?.classList.toggle('is-open', on);
  const btn = $('.nav-mega-btn');
  btn?.classList.toggle('is-open', on);
  btn?.setAttribute('aria-expanded', String(on));
}
function pickMega(i: number) {
  if (!mega) return;
  mega.style.setProperty('--mi', String(i));
  $$('.mega-it', mega).forEach((a) => a.classList.toggle('is-on', a.dataset.msrv === String(i)));
  $$('.mega-pv', mega).forEach((p, k) => {
    const on = k === i;
    p.classList.toggle('is-on', on);
    p.setAttribute('aria-hidden', String(!on));
    $$('a', p).forEach((a) => a.setAttribute('tabindex', on ? '0' : '-1'));
  });
}

/* ---------- services accordion (home) ---------- */
const srvItems = $$('.acc-item[data-srv]');
let srv = 0;
function setSrv(i: number) {
  if (!srvItems.length) return;
  srv = (i + srvItems.length) % srvItems.length;
  srvItems.forEach((el, k) => {
    const on = k === srv;
    el.classList.toggle('is-active', on);
    show('srv-a', on, String(k));
    show('srv-c', !on, String(k));
  });
}

/* ---------- FAQ (home) ---------- */
function toggleFaq(i: string) {
  $$('.faq-item').forEach((item) => {
    const btn = $('.faq-q', item);
    const w = $<HTMLElement>('[data-if="faq"]', item);
    const on = w?.dataset.i === i ? w.hidden : false;
    item.classList.toggle('open', on);
    btn?.setAttribute('aria-expanded', String(on));
    const sign = $('.faq-sign', item); if (sign) sign.textContent = on ? '−' : '+';
    if (w) w.hidden = !on;
  });
}

/* ---------- calculator rows ---------- */
function pickProj(btn: HTMLElement) {
  const row = btn.closest('.prow'); if (!row) return;
  const k = btn.dataset.k as '0' | '1';
  const seg = $('.seg', row);
  seg?.classList.toggle('is-b', k === '1');
  $$('.seg button', row).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
  const meta = $('.prow-meta', row); if (meta) meta.textContent = meta.getAttribute('data-m' + k) || '';
  const val = $('.prow-val', row);
  if (val && val.lastChild) val.lastChild.textContent = val.getAttribute('data-t' + k) || '';
}

/* ---------- contact form: service chips ---------- */
function pickNeed(btn: HTMLElement) {
  $$('.need').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
  const inp = $<HTMLInputElement>('#formularz input[name="need"]');
  if (inp) inp.value = btn.textContent?.trim() || '';
}

/* ---------- quick contact sheet ---------- */
let fabOpen = false, fabReturn: HTMLElement | null = null;
function setFab(on: boolean) {
  fabOpen = on;
  if (on) fabReturn = document.activeElement as HTMLElement;
  show('fab-open', on);
  show('fab-closed', !on);
  if (on) $<HTMLElement>('.qc-x')?.focus(); else fabReturn?.focus?.();
}

/* ---------- availability (pn–pt 9–20, Europe/Warsaw) ---------- */
function status() {
  let online = true;
  try {
    const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Warsaw', weekday: 'short', hour: '2-digit', hour12: false }).formatToParts(new Date());
    const wd = p.find((x) => x.type === 'weekday')?.value || '', hr = parseInt(p.find((x) => x.type === 'hour')?.value || '12', 10);
    online = !['Sat', 'Sun'].includes(wd) && hr >= 9 && hr < 20;
  } catch (e) { /* keep default */ }
  if (online) return;
  const label = 'Teraz offline', note = 'oddzwonimy po 9:00';
  $$('.mega-dot, .qc-av, .qc-st, .kt-dot').forEach((el) => el.classList.add('off'));
  $$('.mega-dot, .qc-av').forEach((el) => el.setAttribute('title', label));
  $$('.qc-st').forEach((el) => { el.textContent = label; if (el.nextSibling) el.nextSibling.textContent = ' · ' + note; });
  $$('.kt-st').forEach((el) => { if (el.lastChild) el.lastChild.textContent = note; });
}

/* ---------- clicks (event delegation) ---------- */
root.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  const el = t.closest<HTMLElement>('[data-act]');
  if (!el) return;
  const a = el.dataset.act;
  switch (a) {
    case 'theme': toggleTheme(); break;
    case 'menu-open': setMenu(true); break;
    case 'menu-close': setMenu(false); break;
    case 'mega-toggle': setMega(!megaOpen); break;
    case 'mega-close': setMega(false); break;
    case 'srv': setSrv(parseInt(el.dataset.i || '0', 10)); break;
    case 'srv-prev': setSrv(srv - 1); break;
    case 'srv-next': setSrv(srv + 1); break;
    case 'faq': toggleFaq(el.dataset.i || '0'); break;
    case 'proj': pickProj(el); break;
    case 'need': pickNeed(el); break;
    case 'fab': e.preventDefault(); setFab(!fabOpen); if (el.tagName === 'A' && !fabOpen) location.href = (el as HTMLAnchorElement).href; break;
  }
});
root.addEventListener('focusin', (e) => {
  const row = (e.target as HTMLElement).closest<HTMLElement>('[data-msrv]');
  if (row) pickMega(parseInt(row.dataset.msrv || '0', 10));
});
window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (fabOpen) setFab(false);
  if (menuOpen) setMenu(false);
  setMega(false);
});

/* ---------- contact form submit (Netlify Forms; mailto fallback) ---------- */
const form = $<HTMLFormElement>('#formularz');
form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const btn = $<HTMLButtonElement>('button[type="submit"]', form);
  if (btn) { btn.disabled = true; btn.textContent = 'Wysyłanie…'; }
  try {
    const r = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(fd as any).toString() });
    if (!r.ok) throw new Error(String(r.status));
    form.innerHTML = '<div class="h" style="font-size:24px;font-weight:700">Dziękujemy!</div><p>Odezwiemy się w ciągu 24 godzin. Jeśli sprawa jest pilna, zadzwoń: <a href="tel:+48501784882">501 784 882</a>.</p>';
  } catch (err) {
    const body = `Usługa: ${fd.get('need')}\nImię i nazwisko: ${fd.get('name')}\nTelefon: ${fd.get('phone')}\nE-mail: ${fd.get('email')}\n\n${fd.get('msg')}`;
    location.href = 'mailto:biuro@topstrony.pl?subject=' + encodeURIComponent('Zapytanie o wycenę') + '&body=' + encodeURIComponent(body);
    if (btn) { btn.disabled = false; btn.textContent = 'Wyślij zapytanie'; }
  }
});

/* =====================================================================
   Motion
   ===================================================================== */

/* split headings: stagger by rendered line */
function revealSplit(el: HTMLElement) {
  let line = -1, top: number | null = null;
  $$('.wm', el).forEach((w) => {
    const t = w.offsetTop;
    if (top === null || Math.abs(t - top) > 4) { line++; top = t; }
    const wi = w.firstElementChild as HTMLElement | null;
    if (wi) wi.style.transitionDelay = (line * 0.09).toFixed(2) + 's';
  });
  requestAnimationFrame(() => el.classList.add('in'));
}
function textNode(el: Element) {
  return Array.from(el.childNodes).find((n) => n.nodeType === 3 && (n as Text).data.trim()) as Text | undefined;
}
function scramble(el: HTMLElement) {
  const node = textNode(el); if (!node) return;
  const txt = node.data, chars = 'ABCDEFGHIJKLMNOPRSTUWZ0123456789', t0 = performance.now(), dur = 1100;
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / dur), keep = Math.floor(txt.length * Math.max(0, (p - 0.2) / 0.8));
    let s = txt.slice(0, keep);
    for (let i = keep; i < txt.length; i++) s += txt[i] === ' ' ? ' ' : chars[(Math.random() * chars.length) | 0];
    node.data = p >= 1 ? txt : s;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function countUp(el: HTMLElement) {
  const node = textNode(el); if (!node) return;
  const raw = node.data.trim(), comma = raw.includes(','), to = parseFloat(raw.replace(',', '.'));
  if (isNaN(to)) return;
  const dec = comma ? 1 : 0, t0 = performance.now(), dur = 1400;
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / dur), k = 1 - Math.pow(1 - p, 3);
    node.data = p >= 1 ? raw : (to * k).toFixed(dec).replace('.', comma ? ',' : '.');
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function reveal(el: HTMLElement) {
  if (el.classList.contains('split')) return revealSplit(el);
  el.classList.add('in');
  if (el.classList.contains('scr')) scramble(el);
  if (el.classList.contains('cnt')) countUp(el);
}

/* ecosystem diagram: arrows from sources into the hub and out to results */
const eco = $('[data-eco]');
function drawEco() {
  if (!eco) return;
  const svg = $('.eco-svg', eco), hub = $('.eco-hub', eco);
  if (!svg) return;
  const R = eco.getBoundingClientRect();
  if (!hub || R.width < 700 || window.innerWidth < 900) { svg.innerHTML = ''; return; }
  const H = hub.getBoundingClientRect();
  const cx = H.left + H.width / 2 - R.left, cy = H.top + H.height / 2 - R.top, r = H.width / 2 + 10, k = 70;
  const f = (n: number) => n.toFixed(1);
  const P = (x1: number, y1: number, c1x: number, c1y: number, c2x: number, c2y: number, x2: number, y2: number) =>
    `M${f(x1)} ${f(y1)} C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(x2)} ${f(y2)}`;
  const line = (d: string, i: number) =>
    `<path class="eco-base" d="${d}"/><path class="eco-flow" d="${d}" marker-end="url(#ecoArr)" style="animation-delay:${(-i * 0.17).toFixed(2)}s"/>` +
    (reduce ? '' : `<circle class="eco-dot" r="4"><animateMotion dur="2.4s" begin="-${(i * 0.4).toFixed(1)}s" repeatCount="indefinite" path="${d}"/></circle>`);
  let out = '<defs><marker id="ecoArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="eco-arrow" d="M0 0L10 5L0 10z"/></marker></defs>';
  let i = 0;
  $$('.eco-src .eco-node', eco).forEach((n) => {
    const b = n.getBoundingClientRect();
    const sx = b.right - R.left + 6, sy = b.top + b.height / 2 - R.top, a = Math.atan2(sy - cy, sx - cx);
    const ex = cx + Math.cos(a) * r, ey = cy + Math.sin(a) * r;
    out += line(P(sx, sy, sx + (ex - sx) * 0.45, sy, ex + Math.cos(a) * k, ey + Math.sin(a) * k, ex, ey), i++);
  });
  $$('.eco-out .eco-node', eco).forEach((n) => {
    const b = n.getBoundingClientRect();
    const ex = b.left - R.left - 8, ey = b.top + b.height / 2 - R.top, a = Math.atan2(ey - cy, ex - cx);
    const sx = cx + Math.cos(a) * r, sy = cy + Math.sin(a) * r;
    out += line(P(sx, sy, sx + Math.cos(a) * k, sy + Math.sin(a) * k, ex - (ex - sx) * 0.45, ey, ex, ey), i++);
  });
  svg.setAttribute('viewBox', `0 0 ${R.width.toFixed(0)} ${R.height.toFixed(0)}`);
  svg.innerHTML = out;
}

/* scroll-linked effects */
const hdr = $('.hdr'), prog = $('.prog'), drift = $('.drift-row'), lead = $('.lead-clip'), man = $('[data-manifesto]');
const manWords = man ? $$('.sw', man) : [];
const stackCards = $$('.stack-card'), scrubs = $$('.m-scrub');
const marquee = $('.marquee');
const mqAnim = marquee && marquee.getAnimations ? marquee.getAnimations()[0] : null;
let lastY = window.scrollY, lastT = performance.now(), dir = 1, boost = 1, ticking = false;

function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    const vh = window.innerHeight || 800, se = document.documentElement, sy = window.scrollY;
    if (prog) prog.style.transform = `scaleX(${clamp(sy / Math.max(1, se.scrollHeight - se.clientHeight)).toFixed(4)})`;
    const now = performance.now(), dy = sy - lastY, dt = Math.max(16, now - lastT);
    if (hdr && Math.abs(dy) > 2) hdr.classList.toggle('up', dy > 0 && sy > 240 && !megaOpen);
    if (dy !== 0) { dir = dy > 0 ? 1 : -1; boost = Math.max(boost, Math.min(6, 1 + (Math.abs(dy / dt) * 1000) / 400)); }
    lastY = sy; lastT = now;
    if (reduce) return;
    if (drift) {
      const r = (drift.parentNode as HTMLElement).getBoundingClientRect();
      if (r.bottom > -50 && r.top < vh + 50) {
        const p = clamp((vh - r.top) / (vh + r.height));
        drift.style.transform = `translate3d(${(2 - p * 32).toFixed(2)}%,0,0)`;
        $$('.drift-s', drift).forEach((s) => { s.style.transform = `rotate(${(p * 360).toFixed(1)}deg)`; });
      }
    }
    if (lead) {
      const r = lead.getBoundingClientRect(), k = 1 - clamp((vh * 0.95 - r.top) / (vh * 0.5));
      lead.style.clipPath = `inset(${(k * 8).toFixed(2)}% ${(k * 6).toFixed(2)}% ${(k * 8).toFixed(2)}% ${(k * 6).toFixed(2)}% round ${(k * 48).toFixed(1)}px)`;
    }
    if (man && manWords.length) {
      const r = man.getBoundingClientRect(), lit = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.25)) * manWords.length * 1.15;
      manWords.forEach((w, i) => { w.style.opacity = (0.16 + clamp(lit - i) * 0.84).toFixed(3); });
    }
    stackCards.forEach((c, i) => {
      const next = stackCards[i + 1];
      if (!next) { c.style.transform = ''; return; }
      const a = c.getBoundingClientRect(), b = next.getBoundingClientRect();
      const p = clamp(1 - (b.top - a.top) / Math.max(a.height, 1));
      c.style.transform = `scale(${(1 - p * 0.06).toFixed(4)})`;
      c.style.filter = `brightness(${(1 - p * 0.08).toFixed(3)})`;
    });
    scrubs.forEach((m) => {
      const r = (m.parentNode as HTMLElement).getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      m.style.transform = `translate3d(0,${((((r.top + r.height / 2) - vh / 2) / vh) * -8).toFixed(2)}%,0)`;
    });
  });
}

/* pointer: cursor follower, magnetic buttons, tilt, hover intents */
const cur = $('.cur');
let mx = -200, my = -200, cx = -200, cy = -200, magEl: HTMLElement | null = null, tiltEl: HTMLElement | null = null;
function onMove(e: PointerEvent) {
  mx = e.clientX; my = e.clientY;
  const t = e.target as HTMLElement;
  // magnetic
  const m = t.closest<HTMLElement>('[data-magnetic]');
  if (magEl && magEl !== m) { magEl.classList.remove('is-mag'); magEl.style.transform = ''; magEl = null; }
  if (m) {
    magEl = m; m.classList.add('is-mag');
    const r = m.getBoundingClientRect();
    m.style.transform = `translate3d(${((e.clientX - r.left - r.width / 2) * 0.3).toFixed(1)}px,${((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1)}px,0)`;
  }
  // tilt
  const tl = t.closest<HTMLElement>('[data-tilt]');
  if (tiltEl && tiltEl !== tl) { tiltEl.classList.remove('tilted'); tiltEl.style.transform = ''; tiltEl = null; }
  if (tl) {
    tiltEl = tl; tl.classList.add('tilted');
    const r = tl.getBoundingClientRect();
    tl.style.transform = `perspective(900px) rotateX(${(-((e.clientY - r.top) / r.height - 0.5) * 10).toFixed(2)}deg) rotateY(${(((e.clientX - r.left) / r.width - 0.5) * 12).toFixed(2)}deg)`;
  }
  // mega menu: hover opens, leaving closes
  if (mega && window.innerWidth > 1180) {
    const inMega = !!t.closest('[data-mega]');
    clearTimeout(megaT);
    if (inMega) {
      if (!megaOpen) megaT = window.setTimeout(() => setMega(true), 70);
      const row = t.closest<HTMLElement>('[data-msrv]');
      if (row) pickMega(parseInt(row.dataset.msrv || '0', 10));
      const pv = t.closest<HTMLElement>('.mega-stage');
      if (pv) { const r = pv.getBoundingClientRect(); pv.style.setProperty('--px', e.clientX - r.left + 'px'); pv.style.setProperty('--py', e.clientY - r.top + 'px'); }
    } else if (megaOpen) megaT = window.setTimeout(() => setMega(false), 220);
  }
  // cursor label
  if (!cur) return;
  cur.classList.add('on');
  const c = t.closest<HTMLElement>('[data-cursor]');
  if (c) {
    const sp = cur.firstElementChild, lab = c.dataset.cursor || '';
    if (sp && sp.textContent !== lab) sp.textContent = lab;
    cur.classList.add('big');
  } else cur.classList.remove('big');
}

/* ---------- boot ---------- */
syncTheme();
status();
drawEco();
window.addEventListener('resize', drawEco, { passive: true });
document.fonts?.ready.then(drawEco);
setTimeout(drawEco, 600);

if (!reduce) {
  root.classList.add('js-anim');
  $$('.h-in').forEach((el, i) => el.style.setProperty('--hi', String(i)));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { reveal(en.target as HTMLElement); io.unobserve(en.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  $$('.rv, .split, .scr, .cnt, .rule, .stg, .m-reveal').forEach((el) => io.observe(el));
  // the logos marquee speeds up with scroll velocity and follows its direction
  if (mqAnim) {
    const loop = () => { boost += (1 - boost) * 0.04; mqAnim.playbackRate = boost * dir; requestAnimationFrame(loop); };
    loop();
  }
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

if (fine) {
  root.classList.add('has-cursor');
  window.addEventListener('pointermove', onMove, { passive: true });
  if (cur) {
    const loop = () => {
      cx += (mx - cx) * 0.18; cy += (my - cy) * 0.18;
      cur.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`;
      requestAnimationFrame(loop);
    };
    loop();
  }
}
