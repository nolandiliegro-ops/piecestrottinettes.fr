#!/usr/bin/env python3
"""
scripts/visuel-technique.py — 3e visuel « technique » des pièces sans 3e photo trouvable (arbitrage A2, 24/10/2026).

Entrée : JSON [{slug, cat, name, ch, fs}] (lu en base).
Sortie : <out>/<slug>.svg — dessin coté, fond transparent, couleurs du site (carbon #1A1A1A, vert #4A7C59).
Rendu PNG : scripts/visuel-technique-rendu.mjs (Playwright, police Inter installée).

Règle : on ne dessine QUE ce que la base dit (diamètre, trous, entraxe, angle de valve, tension, connecteur).
Une donnée absente => pas de cote inventée ; une fiche sans aucune donnée exploitable => pas de visuel.
"""
import json, math, re, sys, html

INK, GREEN, GREY = '#1A1A1A', '#4A7C59', '#6B7280'
W = H = 1200
FONT = "Inter Display, Inter, sans-serif"

def esc(s): return html.escape(str(s), quote=True)

def txt(x, y, s, size, color=INK, weight=900, anchor='middle', ls=0):
    return f'<text x="{x}" y="{y}" font-family="{FONT}" font-size="{size}" font-weight="{weight}" fill="{color}" text-anchor="{anchor}" letter-spacing="{ls}">{esc(s)}</text>'

def cote_h(x1, x2, y, label, size=46):
    a = 18
    return (f'<line x1="{x1}" y1="{y}" x2="{x2}" y2="{y}" stroke="{GREEN}" stroke-width="5"/>'
            f'<path d="M{x1},{y} l{a},-{a*0.55} v{a*1.1} z M{x2},{y} l-{a},-{a*0.55} v{a*1.1} z" fill="{GREEN}"/>'
            f'<rect x="{(x1+x2)/2-len(label)*size*0.33}" y="{y-size*0.95}" width="{len(label)*size*0.66}" height="{size*1.25}" rx="12" fill="#ffffff"/>'
            + txt((x1+x2)/2, y+size*0.1, label, size, GREEN))

def frame(title, sub, body, tag):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
            f'<rect x="60" y="60" width="{len(tag)*21+64}" height="64" rx="32" fill="{GREEN}"/>'
            + txt(92, 103, tag, 30, '#ffffff', 800, 'start', 2)
            + body
            + txt(W/2, 1060, title, 84)
            + (txt(W/2, 1130, sub, 40, GREY, 600) if sub else '')
            + '</svg>')

def num(s): return s.replace('.', ',')

# ---------- disques ----------
def disque(p):
    bd = (p.get('fs') or {}).get('brake_disc') or {}
    ch = p.get('ch') or ''
    d = (bd.get('diameters') or [None])[0] or (re.search(r'(\d{3})\s?mm', p['name']) or [None, None])[1]
    if not d: return None
    holes = (bd.get('holes') or [None])[0] or (re.search(r'(\d)\s?trous', p['name'] + ' ' + ch) or [None, None])[1]
    pcd = (bd.get('pcds') or [None])[0] or (re.search(r'[Ee]ntraxe\s*(\d+)', p['name'] + ' ' + ch) or [None, None])[1]
    ep = re.search(r'[ÉéEe]paisseur[^0-9]{0,20}(\d+[.,]?\d*)\s?mm', ch)
    cx, cy, R = 600, 520, 330
    r_in = R * 0.30
    b = [f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="none" stroke="{INK}" stroke-width="10"/>',
         f'<circle cx="{cx}" cy="{cy}" r="{R*0.80}" fill="none" stroke="{INK}" stroke-width="4" stroke-dasharray="18 14"/>',
         f'<circle cx="{cx}" cy="{cy}" r="{r_in}" fill="none" stroke="{INK}" stroke-width="8"/>']
    if holes:
        n = int(holes); rp = r_in * 0.62
        for k in range(n):
            t = -math.pi/2 + 2*math.pi*k/n
            b.append(f'<circle cx="{cx+rp*math.cos(t):.1f}" cy="{cy+rp*math.sin(t):.1f}" r="16" fill="none" stroke="{INK}" stroke-width="6"/>')
        if pcd:
            b.append(f'<circle cx="{cx}" cy="{cy}" r="{rp}" fill="none" stroke="{GREEN}" stroke-width="3" stroke-dasharray="8 8"/>')
    b.append(cote_h(cx-R, cx+R, cy+R+70, f'Ø {num(d)} mm'))
    bits = []
    if holes: bits.append(f'{holes} trous')
    if pcd: bits.append(f'entraxe {num(pcd)} mm')
    if ep: bits.append(f'épaisseur {num(ep.group(1))} mm')
    return frame(f'DISQUE Ø {num(d)} MM', ' · '.join(bits), ''.join(b), 'COTES')

# ---------- chambres à air ----------
def chambre(p):
    name, ch = p['name'], (p.get('ch') or '')
    dim = re.search(r'(\d{1,3}(?:[.,]\d+)?\s?[x/]\s?\d+(?:[.,]\d+)?(?:-\d+(?:[.,]\d+)?)?)', name)
    if not dim: return None
    dim = dim.group(1).replace(' ', '')
    pair = lambda t: re.search(r'(\d{1,2})\s?°?\s?[x×]\s?(\d{1,2})\s?°', t.lower()) or re.search(r'valve\s+(?:coud[ée]e\s+)?(\d{1,2})\s?[x×]\s?(\d{1,2})', t.lower())
    pn, pc = pair(name), pair(ch)
    low = (name + ' ' + ch).lower()
    angle, vlab = None, ''
    if pn and pc and (pn.groups() != pc.groups()):
        vlab = 'valve coudée'                      # nom et description se contredisent : on ne dessine pas d'angle
    elif pn or pc:
        a1, a2 = (pn or pc).groups()
        if a1 == '0': angle, vlab = int(a2), f'valve 0° × {a2}°'
        else: angle, vlab = int(a1), f'valve coudée {a1}° × {a2}°'
    elif 'droite' in low: angle, vlab = 0, 'valve droite'
    elif re.search(r'coud[ée]e\s+(\d{2})\s?°', low):
        a = re.search(r'coud[ée]e\s+(\d{2})\s?°', low).group(1); angle, vlab = int(a), f'valve coudée {a}°'
    elif 'coud' in low: vlab = 'valve coudée'
    di = re.search(r'[Dd]iam[èe]tre int[ée]rieur\s*(\d{2,3})\s?mm', ch)
    sub = ' · '.join(x for x in [vlab, f'Ø intérieur {di.group(1)} mm' if di else ''] if x)
    cx, cy, R, r = 600, 500, 330, 225
    b = [f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="none" stroke="{INK}" stroke-width="10"/>',
         f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{INK}" stroke-width="10"/>']
    if angle is not None:
        x0, y0 = cx, cy + r
        x1, y1 = x0, y0 - 70
        t = math.radians(angle)
        x2, y2 = x1 + 110*math.sin(t), y1 - 110*math.cos(t)
        b.append(f'<polyline points="{x0},{y0} {x1},{y1} {x2:.1f},{y2:.1f}" fill="none" stroke="{GREEN}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>')
        if angle:
            b.append(f'<path d="M{x1},{y1-55} A55,55 0 0 1 {x1+55*math.sin(t):.1f},{y1-55*math.cos(t):.1f}" fill="none" stroke="{GREEN}" stroke-width="4"/>')
            b.append(txt(x1-80, y1-30, f'{angle}°', 44, GREEN))
    b.append(cote_h(cx-R, cx+R, cy+R+70, num(dim)))
    return frame(f'CHAMBRE {num(dim)}', sub, ''.join(b), 'COTES')

# ---------- chargeurs / adaptateurs ----------
CONN = [  # (motif, libellé, famille) — l'ordre compte : le plus précis d'abord
    (r'gx\s?16[-\s]?inv\w*\s?(\d)|nami[^,;]*?(\d)\s?broches', 'Nami GX16 inversé {}P', 'gx'),
    (r'gx\s?16[-\s]?(\d)\s?(?:p|broches)?', 'GX16-{}P', 'gx'), (r'gx\s?12[-\s]?(\d)\s?(?:p|broches)?', 'GX12-{}P', 'gx'),
    (r'lp\s?-?16[-\s]?(\d)', 'LP16-{}', 'gx'), (r'xlr', 'XLR 3 broches', 'xlr'),
    (r'xt\s?90', 'XT90', 'xt'), (r'xt\s?60', 'XT60', 'xt'),
    (r'(?:dc|jack)[^0-9]{0,6}(5[.,]5)\s?[x×*-]\s?(2[.,][15])', 'Jack DC {} × {} mm', 'dc'),
    (r'rond 8 ?mm|rca', 'Rond 8 mm (RCA)', 'rca'),
    (r'gx\s?16', 'GX16', 'gx0'), (r'lp\s?-?16', 'LP16', 'gx0'),
]
def find_conns(t):
    t = t.lower(); hits = []
    for pat, lab, kind in CONN:
        for m in re.finditer(pat, t):
            if any(m.start() < e and s0 < m.end() for s0, e, *_ in hits): continue
            g = [x for x in m.groups() if x] if m.groups() else []
            hits.append((m.start(), m.end(), lab.format(*[x.replace('.', ',') for x in g]) if g else lab.replace('{}', ''), kind, g))
    return [h[2:] for h in sorted(hits)]

def face(kind, g, cx, cy, R):
    b = [f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="none" stroke="{INK}" stroke-width="{max(6, R//25)}"/>']
    if kind in ('gx', 'gx0'):
        b.append(f'<circle cx="{cx}" cy="{cy}" r="{R*0.78:.0f}" fill="none" stroke="{INK}" stroke-width="{max(4, R//50)}"/>')
        b.append(f'<rect x="{cx-R*0.09:.0f}" y="{cy-R*0.88:.0f}" width="{R*0.18:.0f}" height="{R*0.15:.0f}" rx="6" fill="{INK}"/>')
        if kind == 'gx' and g:
            n = int(g[0])
            for k in range(n):
                t = -math.pi/2 + 2*math.pi*(k+0.5)/n
                b.append(f'<circle cx="{cx+R*0.45*math.cos(t):.1f}" cy="{cy+R*0.45*math.sin(t):.1f}" r="{R*0.13:.0f}" fill="{GREEN}"/>')
    elif kind == 'xlr':
        b.append(f'<rect x="{cx-R*0.09:.0f}" y="{cy-R*1.03:.0f}" width="{R*0.18:.0f}" height="{R*0.2:.0f}" rx="6" fill="{INK}"/>')
        for (dx, dy) in [(-0.42, -0.1), (0.42, -0.1), (0, 0.42)]:
            b.append(f'<circle cx="{cx+R*dx:.1f}" cy="{cy+R*dy:.1f}" r="{R*0.13:.0f}" fill="{GREEN}"/>')
    elif kind == 'xt':
        b = [f'<path d="M{cx-R},{cy-R*0.5} h{R*1.6} l{R*0.4},{R*0.3} v{R*0.4} l-{R*0.4},{R*0.3} h-{R*1.6} z" fill="none" stroke="{INK}" stroke-width="{max(6, R//25)}"/>',
             f'<circle cx="{cx-R*0.5}" cy="{cy}" r="{R*0.23:.0f}" fill="{GREEN}"/>', f'<circle cx="{cx+R*0.43}" cy="{cy}" r="{R*0.23:.0f}" fill="{GREEN}"/>']
    elif kind in ('dc', 'rca'):
        b.append(f'<circle cx="{cx}" cy="{cy}" r="{R*0.55:.0f}" fill="none" stroke="{INK}" stroke-width="{max(5, R//30)}"/>')
        b.append(f'<circle cx="{cx}" cy="{cy}" r="{R*0.22:.0f}" fill="{GREEN}"/>')
    else:
        return None
    return ''.join(b)

def chargeur(p):
    name, ch = p['name'], (p.get('ch') or '')
    s = (name + ' ' + ch).lower()
    adapt = s.startswith('adaptateur')
    pack = 'adaptateur' in s and not adapt
    conns = find_conns(ch if (adapt or pack) and ch else name + ' ' + ch)
    # dédoublonne en gardant l'ordre
    seen, cs = set(), []
    for c in conns:
        if c[0] not in seen: seen.add(c[0]); cs.append(c)
    v = re.search(r'(\d{2}(?:[.,]\d)?)\s?v\s*(?:→|➡️|->|-|à)\s*(\d{2}(?:[.,]\d)?)\s?v', s)
    v1 = re.search(r'(\d{2})\s?v\b', s)
    amp = lambda t: re.search(r'(\d+(?:[.,]\d+)?(?:\s?-\s?\d+)?)\s?a(?:mp|\b)', t.lower().replace('ampères', 'a'))
    an, ac = amp(name), amp(ch)
    a = None if (an and ac and an.group(1).replace(' ', '') != ac.group(1).replace(' ', '')) else (an or ac)
    if adapt or pack:
        if len(cs) < 2: return None
        sortie = re.search(r'vers\s+(.+?)(?:\s+-\s|$)', ch.lower())
        if not sortie or not find_conns(sortie.group(1)): return None   # sortie non dessinable (CQ, magnétique…) : pas de visuel
        (l1, k1, g1), (l2, k2, g2) = cs[0], find_conns(sortie.group(1))[0]
        f1, f2 = face(k1, g1, 330, 470, 210), face(k2, g2, 870, 470, 210)
        if not f1 or not f2: return None
        b = f1 + f2 + (f'<path d="M560,470 h70" stroke="{GREEN}" stroke-width="14" stroke-linecap="round"/><path d="M650,470 l-36,-30 v60 z" fill="{GREEN}"/>'
                       + txt(330, 760, l1, 40, INK, 800) + txt(870, 760, l2, 40, INK, 800))
        if adapt: return frame('ADAPTATEUR DE CHARGE', 'entrée → sortie · schéma de principe', b, 'CONNECTEURS')
        t = (f'CHARGEUR {v1.group(1)}V' if v1 else 'CHARGEUR') + (f' · {num(a.group(1))}A' if a else '')
        return frame(t, '+ adaptateur inclus · schéma de principe', b, 'CONNECTEURS')
    if not v or not cs: return None
    lab, kind, g = cs[0]
    f1 = face(kind, g, 600, 480, 300)
    if not f1: return None
    title = f'{num(v.group(1))}V → {num(v.group(2))}V' + (f' · {num(a.group(1))}A' if a else '')
    return frame(title, f'Connecteur {lab} · schéma de principe', f1, 'CONNECTEUR')

# ---------- plaquettes ----------
CALIPER = {'hope_tech4_v4': 'HOPE TECH4 V4', 'magura_9c': 'MAGURA 9.C', 'magura_mt5_mt7': 'MAGURA MT5 · MT7',
           'speedway_dualtron': 'SPEEDWAY · DUALTRON', 'jak_5': 'JAK 5', 'zoom': 'ZOOM 30 MM', 'xiaomi_m365': 'XIAOMI M365',
           'nutt_4p': 'NUTT 4 PISTONS', 'nutt_vented': 'NUTT VENTILÉ', 'sram_avid': 'SRAM AVID', 'speedtrott_02b': 'SPEEDTROTT 02B',
           'xiaomi_mi4': 'XIAOMI MI4', 'xtech_zoom': 'XTECH · ZOOM', 'togo_g2': 'TOGO · KUKIRIN G2'}
def plaquette(p):
    fs = p.get('fs') or {}
    cal = [CALIPER[c] for c in (fs.get('brake_caliper') or []) if c in CALIPER][:2]
    name, ch = p['name'], (p.get('ch') or '')
    s = (name + ' ' + ch).lower()
    nm = name.lower()
    comp = ('métal fritté' if 'fritt' in nm else 'semi-métallique' if 'semi' in nm else 'céramique' if 'ceram' in nm or 'céram' in nm
            else 'métallique' if 'metall' in nm or 'métall' in nm else None)
    dims = []
    for lab, pat in [('largeur', r'largeur(?: du haut)?\s*:?\s*(\d{2}[.,]?\d*)\s?mm'), ('diamètre', r'diam[èe]tre(?: hors tout)?\s*:?\s*(\d{2}[.,]?\d*)\s?mm'),
                     ('épaisseur', r'[ée]paisseur\s*:?\s*(\d[.,]?\d*)\s?mm')]:
        m = re.search(pat, s)
        if m: dims.append(f'{lab} {num(m.group(1))} mm')
    if not cal and not dims: return None
    b = []; y = 330
    if cal:
        b.append(txt(600, y, 'ÉTRIER COMPATIBLE', 40, GREY, 700, ls=3)); y += 110
        for nme in cal:
            b.append(txt(600, y, nme, 88 if len(nme) < 16 else 70)); y += 105
    if comp:
        y += 40
        b.append(f'<rect x="{600-len(comp)*19-50}" y="{y-62}" width="{len(comp)*38+100}" height="96" rx="48" fill="none" stroke="{GREEN}" stroke-width="6"/>')
        b.append(txt(600, y, comp.upper(), 46, GREEN, 900, ls=2)); y += 80
    if dims:
        y += 70
        for d in dims:
            b.append(txt(600, y, d.upper(), 54, INK, 800, ls=1)); y += 75
    return frame('PLAQUETTES DE FREIN', 'vérifiez la référence gravée sur votre étrier', ''.join(b), 'COMPATIBILITÉ' if cal else 'COTES')

GEN = {'Disques': disque, 'Chambres à Air': chambre, 'Chargeurs': chargeur, 'Plaquettes': plaquette}

if __name__ == '__main__':
    src, out = sys.argv[1], sys.argv[2]
    import os; os.makedirs(out, exist_ok=True)
    rows = json.load(open(src)); ok = skip = 0; rep = {}
    for p in rows:
        f = GEN.get(p['cat'])
        svg = f(p) if f else None
        if svg:
            open(f'{out}/{p["slug"]}.svg', 'w').write(svg); ok += 1; rep[p['slug']] = 'ok'
        else:
            skip += 1; rep[p['slug']] = 'pas de donnée exploitable'
    json.dump(rep, open(f'{out}/_rapport.json', 'w'), ensure_ascii=False, indent=1)
    print(f'{ok} visuels, {skip} sans donnée exploitable')
