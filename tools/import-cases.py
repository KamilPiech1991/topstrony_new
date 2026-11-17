# Import opisów realizacji z qamitech.pl (ten sam właściciel) -> src/data/cases.json + obrazy w public/img/realizacje/<slug>/
import re, json, sys, os, html, glob, subprocess
SRC = '/tmp/qam/html'
SLUG = {'pso-tel-gracja': 'psotel-gracja', 'smka-portal': 'smka', 'instalacje-grzewcze-mcgoodwork': 'mc-good-work',
        'cloud-insight': 'cloudinsight', 'rancilio-ekspresy': 'goodo-rancilio-ekspresy', 'fastclean': 'fastpol'}
def txt(s): return html.unescape(re.sub(r'<[^>]+>', '', s)).strip()
def one(p, s, d=''):
    m = re.search(p, s, re.S); return txt(m.group(1)) if m else d
out = []
for f in sorted(glob.glob(SRC + '/*.html')):
    q = os.path.basename(f)[:-5]; s = open(f).read()
    a = s.find('<main'); s = s[a:s.find('</main>')]
    slug = SLUG.get(q, q)
    c = {'slug': slug, 'src': q}
    c['label'] = one(r'case-hero__label">(.*?)</p>', s)
    c['title'] = one(r'case-hero__title">(.*?)</h1>', s)
    c['lead'] = one(r'case-hero__lead">(.*?)</p>', s)
    m = re.search(r'<a class="button btn-dark" href="([^"]+)"', s); c['live'] = m.group(1) if m else ''
    c['facts'] = [[txt(k), txt(v)] for k, v in re.findall(r'<dt>(.*?)</dt>\s*<dd>(.*?)</dd>', s, re.S)]
    m = re.search(r'case-frame__bar[^>]*>.*?<em>(.*?)</em>', s, re.S); c['domain'] = txt(m.group(1)) if m else ''
    c['story'] = []
    for num, h, body in re.findall(r'case-story__num">(.*?)</span>\s*<h2[^>]*>(.*?)</h2>\s*</div>\s*<div class="col-lg-8 content">(.*?)</div>\s*</div>', s, re.S):
        ps = [txt(p) for p in re.findall(r'<p>(.*?)</p>', body, re.S)]
        pts = [txt(li) for li in re.findall(r'<li>(.*?)</li>', body, re.S)]
        c['story'].append({'n': txt(num), 'h': txt(h), 'p': ps, 'pts': pts})
    def lst(cls):
        m = re.search(r'<h2 class="h3">([^<]*)</h2>\s*<ul class="case-chips%s">(.*?)</ul>' % cls, s, re.S)
        return (txt(m.group(1)), [txt(li) for li in re.findall(r'<li>(.*?)</li>', m.group(2), re.S)]) if m else ('', [])
    c['techH'], c['tech'] = lst(' case-chips_accent')
    c['featH'], c['feat'] = lst('')
    g = s[s.find('case-gallery'):s.find('case-stack')] if 'case-gallery' in s else ''
    c['galleryH'] = one(r'<h2 class="h3">(.*?)</h2>', g, 'Jak wygląda strona')
    c['caption'] = one(r'case-gallery__caption">(.*?)</p>', g)
    c['cta'] = one(r'case-cta__box.*?<h2 class="h3">(.*?)</h2>', s)
    c['ctaP'] = one(r'case-cta__box.*?<h2 class="h3">.*?</h2>\s*<p>(.*?)</p>', s)
    imgs = []
    for src, w, h, alt in re.findall(r'<img src="(https://qamitech\.pl/assets/img/realizacje/[^"]+)"\s+width="(\d+)"\s+height="(\d+)"[^>]*alt="([^"]*)"', s):
        if '/' + q + '/' in src or True:
            imgs.append({'url': src, 'w': int(w), 'h': int(h), 'alt': html.unescape(alt)})
    own = [i for i in imgs if re.search(r'/realizacje/[^/]+/(hero|shot-\d+|mobile)\.', i['url']) and '/realizacje/%s/' % q in i['url']]
    c['cover'] = None; c['shots'] = []; c['mobile'] = None
    for i in own:
        n = i['url'].rsplit('/', 1)[1]; local = '/img/realizacje/%s/%s' % (slug, n)
        i2 = {'src': local, 'w': i['w'], 'h': i['h'], 'alt': i['alt'], 'url': i['url']}
        if n.startswith('hero'): c['cover'] = i2
        elif n.startswith('mobile'): c['mobile'] = i2
        else: c['shots'].append(i2)
    out.append(c)
json.dump(out, open('/tmp/qam/cases.json', 'w'), ensure_ascii=False, indent=1)
for c in out: print(c['slug'], '|', c['title'], '|', len(c['story']), len(c['shots']), bool(c['mobile']), bool(c['cover']), len(c['tech']), len(c['feat']), c['domain'])
