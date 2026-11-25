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
    tpl = tpl.replace('Szczegóły w polityce prywatności.', 'Szczegóły w <a href="/polityka-prywatnosci/" class="tlink">polityce prywatności</a>.')
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
    G = {'HomeMain': [('kamil-piech-k1cut.webp" alt="Kamil Piech, założyciel top.strony" width="760" height="965"', 'konsultantka-telefon.webp" alt="Doradczyni top.strony" width="641" height="1000"'),
                      ('kamil-piech-k4cut.webp" alt="Kamil Piech, założyciel top.strony" width="760" height="939"', 'konsultantka-zaproszenie.webp" alt="Doradczyni top.strony" width="725" height="1000"'),
                      ('kamil-piech-k3cut.webp" alt="Kamil Piech, założyciel top.strony" width="738" height="1000"', 'konsultantka-sluchawki.webp" alt="Doradczyni top.strony" width="714" height="1000"')],
         'ServiceMain': [('kamil-piech-k3cut.webp" alt="Kamil Piech, założyciel top.strony" width="738" height="1000"', 'konsultantka-pewna.webp" alt="Doradczyni top.strony" width="652" height="1000"')]}
    for a, b in G.get(name, []):
        assert a in code, (name, a)
        code = code.replace(a, b)
    if name == 'Header':
        a = '<li><a href={m?.href} tabindex={m?.tab} data-act="mega-close">{s}</a></li>'
        assert a in code
        code = code.replace(a, "<li><a href={s === 'Google Ads' ? '/uslugi/google-ads/' : m?.href} tabindex={m?.tab} data-act=\"mega-close\">{s}</a></li>")
    if name == 'HomeMain':
        a = 'FAQ, dane strukturalne i plik llms.txt.</p>'
        assert a in code
        code = code.replace(a, 'FAQ, dane strukturalne i plik llms.txt. Tak samo przygotowaliśmy strony <a href="/uslugi/strony-internetowe/piaseczno/" class="tlink">strony internetowe Piaseczno</a> i <a href="/uslugi/strony-internetowe/warszawa/" class="tlink">strony internetowe Warszawa</a>.</p>', 1)
    if name == 'Footer':
        code = code.replace('<a href="#asystent-ai" class="qc-tile t-ai">', '<a href="/kontakt/#asystent-ai" class="qc-tile t-ai">')
        code = code.replace("const { v } = Astro.props;", "import PartnerBadges from '../PartnerBadges.astro';\nconst { v } = Astro.props;", 1)
        code = code.replace('      <div class="foot-bot">', '      <div class="foot-partners"><span class="foot-t" style="margin:0">Jesteśmy partnerem</span><PartnerBadges variant="foot" /></div>\n      <div class="foot-bot">', 1)
    if name == 'HomeMain':
        code = code.replace("const { v } = Astro.props;", "import PartnerBadges from '../PartnerBadges.astro';\nimport AiConsultant from '../AiConsultant.astro';\nconst { v } = Astro.props;", 1)
        code = code.replace("  <!-- ============ BANER 3 ============ -->", "  <AiConsultant />\n\n  <!-- ============ BANER 3 ============ -->", 1)
        code = code.replace("  <!-- ============ BANER 2 ============ -->", '  <!-- ============ PARTNERZY ============ -->\n  <section id="partnerzy" class="sec-partners" aria-labelledby="partnerzy-h">\n    <div class="wrap">\n      <p id="partnerzy-h" class="eyebrow scr" style="text-align:center">Certyfikowany partner Google i Meta</p>\n      <div class="rv"><PartnerBadges variant="home" /></div>\n    </div>\n  </section>\n\n  <!-- ============ BANER 2 ============ -->', 1)
    if name == 'KontaktMain':
        code = code.replace("const { v } = Astro.props;", "import AiConsultant from '../AiConsultant.astro';\nconst { v } = Astro.props;", 1)
        code = code.replace("  <!-- ============ KONTAKT: SPOSOBY ============ -->", "  <AiConsultant />\n\n  <!-- ============ KONTAKT: SPOSOBY ============ -->", 1)
        import re as _re
        code, n = _re.subn(r'<div class="kt-map rv d2" aria-hidden="true">.*?</div>\n    </div>\n  </section>',
            '<div class="kt-map rv d2"><iframe title="Mapa Google: Top Strony – Strony Internetowe Piaseczno i Warszawa, ul. Strusia 3C" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1223!2d21.0129119!3d52.0775981!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47192fe20fe2da93%3A0xf50fcb17f005e31a!2sTop%20Strony%20%E2%80%93%20Strony%20Internetowe%20Piaseczno%20i%20Warszawa!5e0!3m2!1spl!2spl!4v1732500000000!5m2!1spl!2spl" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>\n    </div>\n  </section>', code, flags=_re.S)
        assert n == 1, n
        code = code.replace('https://www.google.com/maps/search/?api=1&amp;query=ul.+Strusia+3C+Piaseczno', 'https://www.google.com/maps/place/Top+Strony+%E2%80%93+Strony+Internetowe+Piaseczno+i+Warszawa/@52.0776014,21.010337,17z/data=!3m1!4b1!4m6!3m5!1s0x47192fe20fe2da93:0xf50fcb17f005e31a!8m2!3d52.0775981!4d21.0129119!16s%2Fg%2F11jmxz18x3?hl=pl')
    if name == 'ServiceMain':
        code = code.replace("const { v } = Astro.props;", "import AdsHub from '../AdsHub.astro';\nimport SeoHub from '../SeoHub.astro';\nconst { v } = Astro.props;", 1)
        code = code.replace("  <!-- ============ USŁUGA: FAQ ============ -->", "  {v.svc?.slug === 'pozycjonowanie-seo' && <SeoHub />}\n\n  <!-- ============ USŁUGA: FAQ ============ -->", 1)
        code = code.replace("  <!-- ============ USŁUGA: CZYM JEST + DLA KOGO ============ -->", "  {v.svc?.slug === 'kampanie-google-meta-ads' && <AdsHub />}\n\n  <!-- ============ USŁUGA: CZYM JEST + DLA KOGO ============ -->", 1)
        assert 'AdsHub />' in code
        code = code.replace('<b>Odpowiadam w 24 h</b>', '<b>Odpowiadamy w 24 h</b>')
    open('src/components/gen/%s.astro' % name, 'w').write(code)
    used[name] = u

h, main, f = parts('body.html')
import re
# usunięta sekcja kalkulatora wyceny (#wycena) ze strony głównej
main = re.sub(r'<!-- ============ 14\. WYCENA ============ -->.*?(?=<!-- ============)', '', main, flags=re.S)
main = re.sub(r'<!-- ============ BANER 4 ============ -->.*?(?=<!-- ============)', '', main, flags=re.S)
h = h.replace('<a href="#wycena" onClick="{{ closeMega }}">Policz projekt w kalkulatorze</a>', '<a href="/kontakt/" onClick="{{ closeMega }}">Poproś o bezpłatną wycenę</a>')
gen('Header', h.replace('href="#top" class="logo"', 'href="/" class="logo"').replace('href="#wycena"', 'href="/#wycena"').replace('href="#case-sahra-art"', 'href="/#case-sahra-art"'))
gen('Footer', f.replace('href="#top" class="logo"', 'href="/" class="logo"').replace('<a href="#polityka">Polityka prywatności</a><a href="#regulamin">Regulamin</a>', '<a href="/polityka-prywatnosci/">Polityka prywatności</a><a href="/polityka-prywatnosci/#cookies">Cookies</a>'))
# sekcja bloga na stronie głównej -> Baza wiedzy
main = main.replace('href="#blog" class="btn btn-d"', 'href="/baza-wiedzy/" class="btn btn-d"').replace('Ostatnie wpisy na blogu', 'Z naszej bazy wiedzy')
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
    for col in d.get('footCols', []):
        for l in col.get('links', []):
            if l.get('t') == 'Blog':
                l['t'] = 'Baza wiedzy'; l['href'] = '/baza-wiedzy/'
    if 'posts' in d:
        slugs = ['jak-powinna-wygladac-strona-internetowa-firmy', 'wordpress-czy-strona-pisana-kodem', 'wartosc-bloga-dla-pozycjonowania']
        for i, post in enumerate(d['posts']):
            post['href'] = '/baza-wiedzy/%s/' % slugs[i]
    json.dump(d, open(p, 'w'), ensure_ascii=False, indent=1)
print(json.dumps(used, indent=0))
