#!/usr/bin/env python3
import re
import os
import sys

CSS_PATH = os.path.join(os.path.dirname(__file__), '..', 'app', 'globals.css')

if not os.path.exists(CSS_PATH):
    print('globals.css not found at', CSS_PATH)
    sys.exit(2)

with open(CSS_PATH, 'r', encoding='utf-8') as f:
    css = f.read()

pattern = re.compile(r'--([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,6})')
matches = pattern.findall(css)

tokens = [{'key': k, 'color': c} for k, c in matches]

if not tokens:
    print('No color tokens found.')
    sys.exit(0)


def hex_to_rgb(hex_color):
    h = hex_color.lstrip('#')
    if len(h) == 3:
        h = ''.join([ch * 2 for ch in h])
    r = int(h[0:2], 16)
    g = int(h[2:4], 16)
    b = int(h[4:6], 16)
    return r, g, b


def luminance(rgb):
    def _f(v):
        v = v / 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4

    r, g, b = rgb
    return 0.2126 * _f(r) + 0.7152 * _f(g) + 0.0722 * _f(b)


def contrast_ratio(hex1, hex2):
    L1 = luminance(hex_to_rgb(hex1))
    L2 = luminance(hex_to_rgb(hex2))
    lighter = max(L1, L2)
    darker = min(L1, L2)
    return (lighter + 0.05) / (darker + 0.05)

failed = 0
print('Checking color tokens contrast (threshold 4.5/1 - WCAG AA for normal text)')
for token in tokens:
    c = token['color']
    ratio_white = contrast_ratio(c, '#ffffff')
    ratio_black = contrast_ratio(c, '#000000')
    best = max(ratio_white, ratio_black)
    bg = 'white' if best == ratio_white else 'black'
    passed = best >= 4.5
    print(f"{token['key']}: {c} -> best contrast {best:.2f} on {bg} ({'PASS' if passed else 'FAIL'})")
    if not passed:
        failed += 1

if failed > 0:
    print(f"{failed} token(s) failed contrast check")
    sys.exit(1)

print('All tokens passed contrast check.')
sys.exit(0)
