#!/usr/bin/env python3
"""Rend les SVG de scripts/visuel-technique.py en PNG 1200x1200 fond transparent (Playwright Python + police Inter locale).
Usage : python3 scripts/visuel_technique_rendu.py <dossier>"""
import sys, glob, os
from playwright.sync_api import sync_playwright
d = sys.argv[1]; n = 0
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1200, 'height': 1200})
    for f in sorted(glob.glob(os.path.join(d, '*.svg'))):
        pg.set_content(f'<html><body style="margin:0;background:transparent">{open(f).read()}</body></html>')
        pg.screenshot(path=f[:-4] + '.png', omit_background=True, clip={'x': 0, 'y': 0, 'width': 1200, 'height': 1200}); n += 1
    b.close()
print(f'{n} PNG')
