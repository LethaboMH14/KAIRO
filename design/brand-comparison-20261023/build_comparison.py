from pathlib import Path
import xml.etree.ElementTree as ET
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

root = Path(__file__).resolve().parent
reference = root.parent / 'brand-refinement-20261023'
font = instantiateVariableFont(TTFont(reference / 'fonts/CormorantGaramond-wght.ttf'), {'wght':600})
glyphs = font.getGlyphSet()
k = glyphs[font.getBestCmap()[ord('K')]]
pen = SVGPathPen(glyphs)
k.draw(pen)
b = BoundsPen(glyphs)
k.draw(b)
x0,y0,x1,y1 = b.bounds
s = 160/(y1-y0)

def embedded(file,x,y,w,h):
    tree=ET.parse(reference/'vectors'/file)
    body=''.join(ET.tostring(child,encoding='unicode') for child in tree.getroot() if not child.tag.endswith('title'))
    return f'<svg x="{x}" y="{y}" width="{w}" height="{h}" viewBox="{tree.getroot().attrib["viewBox"]}">{body}</svg>'

body='<rect width="1600" height="720" fill="#F3ECDD"/>'
body+='<path d="M800 40V680" stroke="#CEBEA3"/>'
body+='<g fill="#1E332A" font-family="Arial,sans-serif" letter-spacing="2"><text x="65" y="65" font-size="24">C / EDITORIAL</text><text x="865" y="65" font-size="24">C + A / SPATIAL</text></g>'
body+=embedded('kairo-wordmark-forest.svg',60,140,670,215)
body+=embedded('kairo-wordmark-forest.svg',860,140,670,215)
body+='<rect x="95" y="390" width="210" height="210" rx="44" fill="#1E332A"/>'
body+=f'<g fill="#F3ECDD" transform="translate({200-(x0+x1)*s/2} {415+y1*s}) scale({s} {-s})"><path d="{pen.getCommands()}"/></g>'
body+='<rect x="895" y="390" width="210" height="210" rx="44" fill="#1E332A"/>'
body+=embedded('kairo-symbol-ivory.svg',923,410,155,168)
body+='<g fill="#1E332A" font-family="Arial,sans-serif" font-size="21"><text x="350" y="470">Serif wordmark</text><text x="350" y="510">Serif K monogram</text><text x="1150" y="470">Same serif wordmark</text><text x="1150" y="510">Spatial passage symbol</text><text x="65" y="665">Same palette. Same content. Different visual signature.</text></g>'
svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 720" role="img" aria-label="KAIRO C editorial versus refined C plus A spatial identity">{body}</svg>'
(root/'comparison-source.svg').write_text(svg,encoding='utf-8')
print('Comparison source created; prior identity files untouched')
