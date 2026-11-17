#!/usr/bin/env python3
"""Regenerates src/components/gen/*.astro and prunes src/data/pages/*.json from the design sources."""
import json, re, sys, os, glob
sys.path.insert(0, os.path.dirname(__file__))
from dc2astro import component

N = '/home/claude/new/'
img = json.load(open('src/data/img-map.json'))
routes = json.load(open('src/data/routes.json'))

def fix(tpl):
    def blob(m):
        e = img.get(m.group(1))
        return e['src'] if e else m.group(0)
    tpl = re.sub(r'/_blob/([0-9a-z]+)', blob, tpl)
    def href(m):
        u = m.group(1); base, _, frag = u.partition('#')
        if base in routes: return 'href="%s"' % (routes[base] + ('#' + frag if frag else '') if not routes[base].count('#') else routes[base])
        return m.group(0)
    tpl = re.sub(r'href="([^"{}]+)"', href, tpl)
    tpl = tpl.replace('<!--LDJSON-->', '')
    tpl = tpl.replace('<li><a href="Main.dc.html#uslugi">Usługi</a></li>', '<li><a href="/uslugi/">Usługi</a></li>')
    tpl = tpl.replace('<p class="prow-meta">', '<p class="prow-meta" data-m0="{{ r.meta0 }}" data-m1="{{ r.meta1 }}">')
    tpl = tpl.replace('<div class="prow-val">', '<div class="prow-val" data-t0="{{ r.time0 }}" data-t1="{{ r.time1 }}">')
    tpl = tpl.replace('<form id="formularz" class="card form rv d2" aria-label="Formularz wyceny">',
        '<form id="formularz" class="card form rv d2" aria-label="Formularz wyceny" name="wycena" method="POST" action="/kontakt/dziekujemy/" data-netlify="true" netlify-honeypot="firma">'
        '<input type="hidden" name="form-name" value="wycena"><input type="hidden" name="need" value="Strona www">'
        '<p class="sr-only" aria-hidden="true"><label>Firma<input name="firma" tabindex="-1" autocomplete="off"></label></p>')
    tpl = tpl.replace('<input type="text" name="name" autocomplete="name">', '<input type="text" name="name" autocomplete="name" required>')
    tpl = tpl.replace('<input type="email" name="email" autocomplete="email">', '<input type="email" name="email" autocomplete="email" required>')
    tpl = tpl.replace('<input type="checkbox" name="rodo" ', '<input type="checkbox" name="rodo" required ')
    # images: async decode everywhere
    tpl = re.sub(r'<img (?![^>]*decoding)', '<img decoding="async" ', tpl)
    return tpl

def parts(f):
    s = open(N + f).read()
    a = s.index('<!-- ============ 1. HEADER'); b = s.index('<main'); c = s.index('</main>') + 7
    end = s.rindex('</div>')
    return s[a:b], s[b:c], s[c:end]

os.makedirs('src/components/gen', exist_ok=True)
used = {}
def gen(name, tpl):
    code, u = component(fix(tpl))
    open('src/components/gen/%s.astro' % name, 'w').write(code)
    used[name] = u

h, main, f = parts('body.html')
import re
# usunięta sekcja kalkulatora wyceny (#wycena) ze strony głównej
main = re.sub(r'<!-- ============ 14\. WYCENA ============ -->.*?(?=<!-- ============)', '', main, flags=re.S)
h = h.replace('<a href="#wycena" onClick="{{ closeMega }}">Policz projekt w kalkulatorze</a>', '<a href="/kontakt/" onClick="{{ closeMega }}">Poproś o bezpłatną wycenę</a>')
gen('Header', h.replace('href="#top" class="logo"', 'href="/" class="logo"').replace('href="#wycena"', 'href="/#wycena"').replace('href="#case-sahra-art"', 'href="/#case-sahra-art"'))
gen('Footer', f.replace('href="#top" class="logo"', 'href="/" class="logo"'))
gen('HomeMain', main)
gen('OnasMain', parts('onas_body.html')[1])
gen('KontaktMain', parts('kontakt_body.html')[1])
gen('ServiceMain', parts('uslugi_body.html')[1])

page_main = {'home': 'HomeMain', 'onas': 'OnasMain', 'kontakt': 'KontaktMain'}
for p in glob.glob('src/data/pages/*.json'):
    name = os.path.basename(p)[:-5]
    m = page_main.get(name, 'ServiceMain')
    keys = set(used['Header']) | set(used['Footer']) | set(used[m]) | {'theme', 'svc'}
    d = json.load(open(p))
    d = {k: v for k, v in d.items() if k in keys}
    json.dump(d, open(p, 'w'), ensure_ascii=False, indent=1)
print(json.dumps(used, indent=0))
