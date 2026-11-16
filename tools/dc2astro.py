#!/usr/bin/env python3
"""Transpile the design's x-dc templates ({{ }}, <sc-for>, <sc-if>) into Astro components.

Every component receives the page values as `v`. Loop variables stay local. Event handlers become
data-act attributes handled by src/scripts/app.js; state-driven <sc-if> blocks are always rendered
inside a display:contents wrapper toggled with the `hidden` attribute.
"""
import html
import json
import re
import sys

TAG_RE = re.compile(r'<(?:[^>"\']|"[^"]*"|\'[^\']*\')*>')
ATTR_RE = re.compile(r'([^\s=/>]+)(?:\s*=\s*"([^"]*)")?')
EXPR_RE = re.compile(r'\{\{\s*([\w.]+)\s*\}\}')

# (list name or None, field) -> wrapper key for state-driven blocks
STATEFUL = {
    (None, 'menuOpen'): 'menu', (None, 'fabOpen'): 'fab-open', (None, 'fabClosed'): 'fab-closed',
    ('services', 'active'): 'srv-a', ('services', 'closed'): 'srv-c', ('faqs', 'open'): 'faq',
}
# handler expression -> (data-act, extra attrs using the loop var)
HANDLERS = {
    'toggleMega': 'mega-toggle', 'closeMega': 'mega-close', 'openMenu': 'menu-open', 'closeMenu': 'menu-close',
    'toggleTheme': 'theme', 'toggleFab': 'fab', 'prevSrv': 'srv-prev', 'nextSrv': 'srv-next',
    'sv.open': 'srv', 'fq.toggle': 'faq', 'nd.pick': 'need', 'r.pick0': 'proj:0', 'r.pick1': 'proj:1',
}
REFS = {'setEco': 'data-eco', 'setManifesto': 'data-manifesto'}


def split_words(inner):
    out = []
    for part in re.split(r'(<[^>]+>)', inner):
        if part.startswith('<'):
            out.append(part)
            continue
        for t in re.split(r'(\s+)', part):
            if t:
                out.append(t if t.isspace() else '<span class="wm"><span class="wi">' + t + '</span></span>')
    return ''.join(out)


def presplit(tpl):
    return re.sub(r'(<h2 [^>]*class="[^"]*\bsplit\b[^"]*"[^>]*>)(.*?)</h2>',
                  lambda m: m.group(1) + (m.group(2) if '{{' in m.group(2) else split_words(m.group(2))) + '</h2>', tpl, flags=re.S)


class T:
    def __init__(self):
        self.scope = []  # [(var, list)]
        self.used = set()

    def var_list(self, name):
        for v, l in reversed(self.scope):
            if v == name:
                return l
        return None

    def js(self, path):
        parts = path.split('.')
        if any(v == parts[0] for v, _ in self.scope):
            return '?.'.join(parts)
        self.used.add(parts[0])
        return 'v.' + '?.'.join(parts)

    def loopvar(self, path):
        parts = path.split('.')
        return parts[0] if self.var_list(parts[0]) is not None or any(v == parts[0] for v, _ in self.scope) else None

    def text(self, s):
        s = s.replace('{', '&#123;').replace('}', '&#125;') if '{{' not in s else s
        return EXPR_RE.sub(lambda m: '{' + self.js(m.group(1)) + '}', s)

    def attr_value(self, name, val):
        exprs = EXPR_RE.findall(val)
        if not exprs:
            return '%s="%s"' % (name, val)
        if EXPR_RE.fullmatch(val.strip()):
            return '%s={%s}' % (name, self.js(exprs[0]))
        raw = html.unescape(val).replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
        raw = EXPR_RE.sub(lambda m: '${' + self.js(m.group(1)) + " ?? ''}", raw)
        return '%s={`%s`}' % (name, raw)

    def tag(self, t):
        m = re.match(r'<(/?)([\w:-]+)', t)
        closing, name = m.group(1), m.group(2)
        if closing:
            return t
        body = t[len(m.group(0)):]
        selfclose = body.rstrip().endswith('/>')
        body = body.rstrip()[:-2] if selfclose else body.rstrip()[:-1]
        attrs = []
        for am in ATTR_RE.finditer(body):
            an, av = am.group(1), am.group(2)
            if an.startswith('hint-'):
                continue
            if re.match(r'on[A-Z]', an):
                h = EXPR_RE.fullmatch(av.strip()).group(1)
                if an == 'onFocus':
                    continue
                act = HANDLERS[h]
                k = None
                if ':' in act:
                    act, k = act.split(':')
                attrs.append('data-act="%s"' % act)
                lv = h.split('.')[0] if '.' in h else None
                if lv:
                    attrs.append('data-i={%s.i}' % lv)
                if k is not None:
                    attrs.append('data-k="%s"' % k)
                continue
            if an == 'ref':
                h = EXPR_RE.fullmatch(av.strip()).group(1)
                if h in REFS:
                    attrs.append(REFS[h])
                continue
            attrs.append(an if av is None else self.attr_value(an, av))
        return '<' + name + (' ' + ' '.join(attrs) if attrs else '') + (' />' if selfclose else '>')

    def run(self, tpl):
        out = []
        stack = []
        pos = 0
        for m in TAG_RE.finditer(tpl):
            out.append(self.text(tpl[pos:m.start()]))
            pos = m.end()
            t = m.group(0)
            if t.startswith('<!--'):
                out.append(t)
                continue
            if t.startswith('<sc-for'):
                lst = re.search(r'list="\{\{\s*([\w.]+)', t).group(1)
                var = re.search(r'as="(\w+)"', t).group(1)
                out.append('{(%s ?? []).map((%s) => (<Fragment>' % (self.js(lst), var))
                self.scope.append((var, lst.split('.')[-1]))
                stack.append('for')
            elif t.startswith('</sc-for'):
                assert stack.pop() == 'for'
                self.scope.pop()
                out.append('</Fragment>))}')
            elif t.startswith('<sc-if'):
                path = re.search(r'value="\{\{\s*([\w.]+)', t).group(1)
                parts = path.split('.')
                lst = self.var_list(parts[0]) if len(parts) > 1 else None
                key = STATEFUL.get((lst, parts[-1])) if len(parts) <= 2 else None
                if key:
                    extra = ' data-i={%s.i}' % parts[0] if lst else ''
                    out.append('<div data-if="%s"%s hidden={!%s}>' % (key, extra, self.js(path)))
                    stack.append('ifw')
                else:
                    out.append('{%s && (<Fragment>' % self.js(path))
                    stack.append('if')
            elif t.startswith('</sc-if'):
                k = stack.pop()
                out.append('</div>' if k == 'ifw' else '</Fragment>)}')
            else:
                out.append(self.tag(t))
        out.append(self.text(tpl[pos:]))
        assert not stack, stack
        return ''.join(out)


def component(tpl, props_comment=''):
    t = T()
    body = t.run(presplit(tpl))
    fm = '---\n// Generated from the top.strony design (tools/dc2astro.py). %s\nconst { v } = Astro.props;\n---\n' % props_comment
    return fm + body.strip() + '\n', sorted(t.used)


if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    code, used = component(open(src).read())
    open(dst, 'w').write(code)
    print(json.dumps(used))
