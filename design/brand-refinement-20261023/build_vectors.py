"""Reproducible, outlined C-led KAIRO identity studies; no network access."""
from pathlib import Path
import hashlib
import json
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'vectors'
OUT.mkdir(exist_ok=True)
font_path = ROOT / 'fonts/CormorantGaramond-wght.ttf'
font = instantiateVariableFont(TTFont(font_path), {'wght': 600}, inplace=False)
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
positions = []
cursor = 0
pair_adjust = {'KA': -30, 'AI': -12, 'IR': 2, 'RO': -22}
previous = ''
for char in 'KAIRO':
    cursor += pair_adjust.get(previous + char, 0)
    name = cmap[ord(char)]
    pen = SVGPathPen(glyphs)
    glyphs[name].draw(pen)
    bounds = BoundsPen(glyphs)
    glyphs[name].draw(bounds)
    positions.append((cursor, pen.getCommands(), bounds.bounds))
    cursor += font['hmtx'].metrics[name][0] + 14
    previous = char
minx = min(x + b[0] for x, _, b in positions)
maxx = max(x + b[2] for x, _, b in positions)
miny = min(b[1] for _, _, b in positions)
maxy = max(b[3] for _, _, b in positions)
width, height = maxx - minx, maxy - miny

def word(x, y, w, colour):
    scale = w / width
    paths = ''.join(f'<path transform="translate({pos} 0)" d="{d}"/>' for pos,d,_ in positions)
    return f'<g fill="{colour}" transform="translate({x-minx*scale:.4f} {y+maxy*scale:.4f}) scale({scale:.6f} {-scale:.6f})">{paths}</g>'

# Two solid architectural planes. The open channel is intentional and reproducible.
# This is an A-derived symbol study; no assertion of final trademark originality.
symbol = '<path d="M18 46 96 8v66L70 88v104H18Z"/><path d="m96 74 78-38v156l-78-48Z"/>'

def mark(x, y, size, colour):
    return f'<g fill="{colour}" transform="translate({x} {y}) scale({size/192:.6f})">{symbol}</g>'

def svg(name, w, h, body, title):
    content = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-labelledby="title"><title id="title">{title}</title>{body}</svg>'
    (OUT/name).write_text(content, encoding='utf-8')

forest, ivory, olive, sand = '#1E332A', '#F3ECDD', '#626B4D', '#CEBEA3'
word_height = 720 * height / width
svg('kairo-wordmark-forest.svg', 800, round(word_height+80), word(40,40,720,forest), 'KAIRO C-led outlined serif wordmark')
svg('kairo-wordmark-ivory.svg', 800, round(word_height+80), word(40,40,720,ivory), 'KAIRO inverse outlined serif wordmark')
svg('kairo-symbol-forest.svg', 192, 208, mark(0,0,192,forest), 'KAIRO Threshold symbol study')
svg('kairo-symbol-ivory.svg', 192, 208, mark(0,0,192,ivory), 'KAIRO inverse Threshold symbol study')
svg('kairo-horizontal-forest.svg', 1060, 260, mark(32,30,180,forest)+word(270,66,740,forest), 'KAIRO Threshold symbol with C-led serif wordmark')
svg('kairo-horizontal-ivory.svg', 1060, 260, mark(32,30,180,ivory)+word(270,66,740,ivory), 'KAIRO inverse Threshold symbol and serif wordmark')
svg('kairo-stacked-forest.svg', 800, 510, mark(285,25,230,forest)+word(70,320,660,forest), 'KAIRO stacked Threshold symbol and C-led wordmark')

# Decorative contour: a single oversized stepped passage; not an extra logo.
contour = '<path d="M-100 550H150V350H390V180H650V-80" fill="none" stroke="#626B4D" stroke-width="42" stroke-linecap="square" opacity=".20"/>'
svg('kairo-passage-pattern.svg', 600,600,contour,'KAIRO abstract passage contour graphic')

def label(x,y,text,size=22,colour=forest):
    return f'<text x="{x}" y="{y}" fill="{colour}" font-family="Arial,sans-serif" font-size="{size}" letter-spacing="2">{text}</text>'

body = f'<rect width="1600" height="1120" fill="{ivory}"/>'
body += label(70,65,'KAIRO / C-LED REFINEMENT',22)
body += label(70,101,'TYPOGRAPHY FIRST. A SPATIAL SYMBOL IN SUPPORT.',16)
body += word(90,180,880,forest) + mark(1215,140,245,forest)
body += label(90,465,'PRIMARY WORDMARK',16)+label(1200,465,'SECONDARY SYMBOL',16)
body += f'<rect x="70" y="520" width="720" height="270" fill="{forest}" rx="10"/>'
body += mark(100,550,175,ivory)+word(310,590,420,ivory)
body += f'<rect x="820" y="520" width="710" height="270" fill="#FFFFFF" rx="10"/>'
body += mark(850,550,175,'#151515')+word(1060,590,420,'#151515')
tokens = [('PARCHMENT',ivory),('FOREST',forest),('OLIVE',olive),('SAND',sand),('OCHRE','#B39356')]
for i,(name,c) in enumerate(tokens):
    x=70+i*298
    body+=f'<rect x="{x}" y="840" width="270" height="100" fill="{c}" stroke="#D6CDBD"/>'
    body+=label(x,977,name,14)+label(x,1005,c,15)
body+=label(70,1075,'OUTLINED VECTOR STUDY / FLAT PROOFS / NOT A MOCKUP',16)
svg('kairo-vector-proof.svg',1600,1120,body,'KAIRO C-led serif and A-derived symbol vector design proof')

metadata = {
    'typeface': 'Cormorant Garamond', 'weight':600,
    'source':'https://github.com/google/fonts/tree/main/ofl/cormorantgaramond',
    'licence':'SIL Open Font License 1.1; see fonts/OFL.txt',
    'fontSha256':hashlib.sha256(font_path.read_bytes()).hexdigest(),
    'wordmark':'Font-derived outlined glyphs, optically adjusted pair spacing; not an original custom typeface.',
    'pairAdjustmentsFontUnits':pair_adjust,'trackingFontUnits':14,
    'symbol':'Original A-derived architectural study. Geometry and originality require further selection/review.',
    'exports': [p.name for p in sorted(OUT.glob('*.svg'))]
}
(ROOT/'vector-manifest.json').write_text(json.dumps(metadata,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'svgExports':len(metadata['exports']),'fontSha256':metadata['fontSha256']},indent=2))
