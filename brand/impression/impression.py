"""Fichiers d'impression PT : autocollants + carte Rider A6, en mm, avec fonds perdus.
Usage : python3 -I impression.py
"""
import re, io, cairosvg, segno
from PIL import Image

OUT = "/home/claude/vec/out"
CREME, CARBON, ORANGE = "#F5F0E8", "#1A1A1A", "#C55426"


def inner(name):
    s = open(f"{OUT}/{name}.svg").read()
    vb = re.search(r'viewBox="([^"]+)"', s).group(1)
    body = s[s.index(">") + 1: s.rindex("</svg>")]
    body = re.sub(r"<rect[^>]*/>", "", body)  # pas de fond
    return vb, body


def place(name, x, y, w):
    vb, body = inner(name)
    vx, vy, vw, vh = map(float, vb.split())
    h = w * vh / vw
    return f'<svg x="{x}" y="{y - h/2}" width="{w}" height="{h}" viewBox="{vb}">{body}</svg>', h


def doc(w, h, content, name):
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}mm" height="{h}mm" '
           f'viewBox="0 0 {w} {h}">{content}</svg>')
    open(f"{OUT}/{name}.svg", "w").write(svg)
    cairosvg.svg2pdf(bytestring=svg.encode(), write_to=f"{OUT}/{name}.pdf")
    png = cairosvg.svg2png(bytestring=svg.encode(), output_width=int(w * 12))
    Image.open(io.BytesIO(png)).convert("RGB").save(f"{OUT}/apercu-{name}.jpg", quality=90)


def txt(x, y, s, size, fill, family, anchor="middle", ls=0):
    return (f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" fill="{fill}" '
            f'text-anchor="{anchor}" letter-spacing="{ls}">{s}</text>')


B = 2  # fond perdu autocollants (mm)

# 1. Autocollant rond 60 mm, fond creme, icone pt
W = 60 + 2 * B
logo, _ = place("icone-pt", W / 2 - 19, W / 2 + 1, 38)
doc(W, W, f'<rect width="{W}" height="{W}" fill="{CREME}"/>{logo}', "autocollant-rond-60mm-creme")

# 2. Autocollant rond 60 mm, fond noir, icone negative
logo, _ = place("icone-pt-negatif", W / 2 - 19, W / 2 + 1, 38)
doc(W, W, f'<rect width="{W}" height="{W}" fill="{CARBON}"/>{logo}', "autocollant-rond-60mm-noir")

# 3. Autocollant rectangle 100 x 35 mm (cartons), fond creme, logo complet
W, H = 100 + 2 * B, 35 + 2 * B
logo, _ = place("logo-pt", W / 2 - 43, H / 2, 86)
doc(W, H, f'<rect width="{W}" height="{H}" fill="{CREME}"/>{logo}', "autocollant-rect-100x35mm")

# 4. Carte Rider A6 (105 x 148) + 3 mm de fonds perdus
FB = 3
W, H = 105 + 2 * FB, 148 + 2 * FB
cx = W / 2
logo, lh = place("logo-pt-negatif", cx - 39, 52, 78)
recto = (f'<rect width="{W}" height="{H}" fill="{CARBON}"/>{logo}'
         + txt(cx, 92, "MERCI,", 13, "#FFFFFF", "Unbounded Black")
         + txt(cx, 107, "RIDER.", 13, "#FFFFFF", "Unbounded Black")
         + txt(cx, 125, "Ta pièce est arrivée. Monte-la, roule.", 4.2, "#FFFFFF", "Plus Jakarta Sans Medium")
         + txt(cx, H - 14, "ROULE · RÉPARE · DURE", 3.6, ORANGE, "Plus Jakarta Sans ExtraBold", ls=0.6))
doc(W, H, recto, "carte-rider-A6-recto")

qr = segno.make("https://piecestrottinettes.fr/garage", error="m")
qsvg = qr.svg_inline(dark=CARBON, light=None, scale=1, border=0)
qsize = qr.symbol_size(border=0)[0]
qw = 40
qin = re.sub(r'<svg[^>]*>', f'<svg x="{cx - qw/2}" y="62" width="{qw}" height="{qw}" viewBox="0 0 {qsize} {qsize}">', qsvg, count=1)
icon, _ = place("icone-pt", cx - 8, H - 22, 16)
verso = (f'<rect width="{W}" height="{H}" fill="{CREME}"/>'
         + txt(cx, 26, "TON GARAGE", 9.5, CARBON, "Unbounded Black")
         + txt(cx, 38, "Enregistre ta trottinette :", 4.4, CARBON, "Plus Jakarta Sans Medium")
         + txt(cx, 44.5, "le site te montre direct", 4.4, CARBON, "Plus Jakarta Sans Medium")
         + txt(cx, 51, "les pièces qui vont dessus.", 4.4, CARBON, "Plus Jakarta Sans Medium")
         + qin
         + txt(cx, 112, "Filme ton montage, tag-nous", 4.4, CARBON, "Plus Jakarta Sans ExtraBold")
         + txt(cx, 119, "@piecestrottinettes", 4.4, ORANGE, "Plus Jakarta Sans ExtraBold")
         + icon)
doc(W, H, verso, "carte-rider-A6-verso")
print("ok")
