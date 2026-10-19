"""Regenere les images du site depuis le logo vectoriel (memes noms de fichiers).
Usage : python3 -I site_assets.py <dossier public du repo>
"""
import io, re, sys, cairosvg
from PIL import Image

PUB = sys.argv[1]
V = "/home/claude/vec/out"
BG = (250, 250, 248, 255)  # fond des icones actuelles (#FAFAF8)


def render(name, width):
    png = cairosvg.svg2png(url=f"{V}/{name}.svg", output_width=width)
    return Image.open(io.BytesIO(png)).convert("RGBA")


# 1. Logos : 2400 px de large (environ 44x la hauteur affichee dans l'en-tete)
for src, dst in [("logo-pt", "brand/logo-pt-2026.png"), ("logo-pt-negatif", "brand/logo-pt-2026-negatif.png")]:
    im = render(src, 2400)
    im.save(f"{PUB}/{dst}", optimize=True)
    print(dst, im.size)


# 2. Icones carrees : fond #FAFAF8, icone a 82 % de la largeur, centree
def icon(size):
    canvas = Image.new("RGBA", (size, size), BG)
    ic = render("icone-pt", int(size * 0.82))
    canvas.alpha_composite(ic, ((size - ic.width) // 2, (size - ic.height) // 2))
    return canvas


for dst, size in [("brand/pt-icon.png", 1024), ("brand/apple-touch-icon.png", 180),
                  ("brand/pwa-192x192.png", 192), ("brand/pwa-512x512.png", 512),
                  ("brand/favicon-pt.png", 64), ("favicon.png", 64),
                  ("pwa-192x192.png", 192), ("pwa-512x512.png", 512)]:
    icon(size).save(f"{PUB}/{dst}", optimize=True)
    print(dst, size)
icon(256).save(f"{PUB}/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
print("favicon.ico")

# 3. Image de partage 1200 x 630 (meme mise en page que l'actuelle)
logo = open(f"{V}/logo-pt.svg").read()
vb = re.search(r'viewBox="([^"]+)"', logo).group(1)
body = logo[logo.index(">") + 1: logo.rindex("</svg>")]
vx, vy, vw, vh = map(float, vb.split())
lw = 760
lh = lw * vh / vw
og = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#F5F0E8"/>
<svg x="{(1200-lw)/2}" y="{250-lh/2}" width="{lw}" height="{lh}" viewBox="{vb}">{body}</svg>
<g transform="translate(600 440) skewX(-10)"><text x="0" y="0" text-anchor="middle" font-family="Unbounded Black" font-size="46" fill="#1A1A1A">PLUS JAMAIS LA MAUVAISE PIÈCE.</text></g>
<text x="600" y="495" text-anchor="middle" font-family="Plus Jakarta Sans Medium" font-size="24" fill="#4B4B5A">Pièces détachées compatibles avec ta trottinette électrique</text>
<rect y="616" width="1200" height="14" fill="#1A1A1A"/>
</svg>'''
png = cairosvg.svg2png(bytestring=og.encode(), output_width=1200)
Image.open(io.BytesIO(png)).convert("RGB").save(f"{PUB}/brand/og-image.jpg", quality=90)
print("brand/og-image.jpg")
