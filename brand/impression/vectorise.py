"""Vectorise les logos PT (noir + orange) depuis les PNG d'origine Higgsfield.
Usage : python3 -I vectorise.py
Sortie : SVG positif / negatif / orange seul pour le logo et l'icone.
"""
import cv2, numpy as np, potrace, os

OUT = "/home/claude/vec/out"
os.makedirs(OUT, exist_ok=True)
ORANGE = "#C55426"
SCALE = 4  # sur-echantillonnage avant trace = contours plus lisses


def masks(path):
    im = cv2.imread(path)
    big = cv2.resize(im, None, fx=SCALE, fy=SCALE, interpolation=cv2.INTER_CUBIC)
    big = cv2.GaussianBlur(big, (0, 0), SCALE * 0.6)
    hsv = cv2.cvtColor(big, cv2.COLOR_BGR2HSV).astype(np.int32)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    orange = (s > 110) & (v > 90) & ((h < 25) | (h > 170))
    black = (v < 110) & ~orange
    k = np.ones((3, 3), np.uint8)
    o = cv2.morphologyEx(orange.astype(np.uint8), cv2.MORPH_OPEN, k)
    b = cv2.morphologyEx(black.astype(np.uint8), cv2.MORPH_OPEN, k)
    return b.astype(bool), o.astype(bool)


def trace(mask):
    bm = potrace.Bitmap(~mask)  # potracer trace les pixels "sombres" (False)
    plist = bm.trace(turdsize=40, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY,
                     alphamax=1.0, opticurve=True, opttolerance=0.3)
    parts = []
    for curve in plist:
        sp = curve.start_point
        d = [f"M{sp.x/SCALE:.2f},{sp.y/SCALE:.2f}"]
        for seg in curve.segments:
            if seg.is_corner:
                d.append(f"L{seg.c.x/SCALE:.2f},{seg.c.y/SCALE:.2f}L{seg.end_point.x/SCALE:.2f},{seg.end_point.y/SCALE:.2f}")
            else:
                d.append(f"C{seg.c1.x/SCALE:.2f},{seg.c1.y/SCALE:.2f} {seg.c2.x/SCALE:.2f},{seg.c2.y/SCALE:.2f} {seg.end_point.x/SCALE:.2f},{seg.end_point.y/SCALE:.2f}")
        d.append("Z")
        parts.append("".join(d))
    return "".join(parts)


def bbox(*ms):
    m = np.zeros_like(ms[0])
    for x in ms:
        m |= x
    ys, xs = np.where(m)
    pad = 6 * SCALE
    return ((xs.min() - pad) / SCALE, (ys.min() - pad) / SCALE,
            (xs.max() - xs.min() + 2 * pad) / SCALE, (ys.max() - ys.min() + 2 * pad) / SCALE)


def svg(vb, black_d, orange_d, black_fill, bg=None):
    x, y, w, h = vb
    rect = f'<rect x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x:.2f} {y:.2f} {w:.2f} {h:.2f}" '
            f'width="{w:.0f}" height="{h:.0f}">{rect}'
            f'<path fill="{black_fill}" fill-rule="evenodd" d="{black_d}"/>'
            f'<path fill="{ORANGE}" fill-rule="evenodd" d="{orange_d}"/></svg>')


for name, src in [("logo-pt", "wordmark_src.png"), ("icone-pt", "icon_src.png")]:
    b, o = masks(f"/home/claude/vec/{src}")
    vb = bbox(b, o)
    bd, od = trace(b), trace(o)
    open(f"{OUT}/{name}.svg", "w").write(svg(vb, bd, od, "#000000"))
    open(f"{OUT}/{name}-negatif.svg", "w").write(svg(vb, bd, od, "#FFFFFF"))
    open(f"{OUT}/{name}-negatif-fond.svg", "w").write(svg(vb, bd, od, "#FFFFFF", bg="#1A1A1A"))
    print(name, "viewBox", [round(v) for v in vb], "noir", len(bd), "orange", len(od))
