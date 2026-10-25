"""Export honest small-size/one-ink proofs and validate vector assets locally."""
from pathlib import Path
import hashlib
import json
import xml.etree.ElementTree as ET
import build_vectors as identity

root = Path(__file__).resolve().parent
forest, ivory = '#1E332A', '#F3ECDD'
body = f'<rect width="1600" height="1000" fill="{ivory}"/>'
body += identity.label(65,65,'KAIRO / REPRODUCTION STUDY',23)
body += identity.label(65,105,'ACTUAL VECTOR GEOMETRY / SINGLE INK / NO MATERIAL EFFECTS',16)
for i,size in enumerate((16,24,32,48,64,96)):
    x=80+i*240
    body += identity.mark(x,165,size,forest)
    body += identity.label(x,295,f'{size} PX',16)
body += identity.label(65,360,'WORDMARK SIZES',18)
for y,width in ((400,96),(490,160),(610,320)):
    body += identity.word(80,y,width,forest)
    body += identity.label(560,y+26,f'{width} PX WIDE',16)
body += f'<rect x="860" y="360" width="670" height="370" fill="{forest}" rx="10"/>'
body += identity.mark(920,400,170,ivory)+identity.word(1120,445,340,ivory)
body += identity.label(910,675,'INVERSE / ONE INK',16,ivory)
body += identity.label(65,825,'PRINT: SMALL TYPE AND FINE SERIFS REQUIRE A REAL PROCESS PROOF.',16)
body += identity.label(65,865,'SHIRT: START WITH ICON ONLY; CHECK THREAD, WEAVE, SIZE AND LIGHT.',16)
body += identity.label(65,905,'SCREEN: USE SYMBOL FOR FAVICONS, NOT A FIVE-LETTER WORDMARK.',16)
identity.svg('kairo-reproduction-proof.svg',1600,1000,body,'KAIRO exact-size and inverse reproduction vector study')

ns={'svg':'http://www.w3.org/2000/svg'}
results=[]
masters=[p for p in (root/'vectors').glob('*.svg') if 'proof' not in p.name and 'pattern' not in p.name]
for p in sorted((root/'vectors').glob('*.svg')):
    doc=ET.parse(p)
    no_external=all(not any(k.endswith('href') for k in el.attrib) for el in doc.iter())
    no_script=not doc.findall('.//svg:script',ns)
    outlined=not doc.findall('.//svg:text',ns) if p in masters else None
    assert no_external and no_script and outlined is not False
    results.append({'file':p.name,'xml':True,'noExternalLinks':no_external,'noScripts':no_script,'logoOutlinesNoFontDependency':outlined,
                    'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})

def luminance(hex_colour):
    rgb=[int(hex_colour[i:i+2],16)/255 for i in (1,3,5)]
    linear=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb]
    return sum(v*w for v,w in zip(linear,(.2126,.7152,.0722)))

def ratio(a,b):
    x,y=sorted((luminance(a),luminance(b)),reverse=True)
    return round((x+.05)/(y+.05),2)

receipt={'date':'2026-10-23','vectors':results,'logoMastersChecked':len(masters),
         'contrastTokenPairs':[{'foreground':c,'background':ivory,'ratio':ratio(c,ivory)} for c in (forest,'#626B4D','#B39356')],
         'limits':['Contrast ratios refer to flat intended sRGB tokens, not generated pixels or embroidery.',
                   'XML/outline checks are not print/garment reproduction acceptance.',
                   'Small-size proofs are inspectable studies, not automatically passed recognizability tests.',
                   'No trademark clearance or original-typeface claim.']}
(root/'reproduction-verification.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'svgChecks':len(results),'outlinedLogoMasters':len(masters),'contrast':receipt['contrastTokenPairs']},indent=2))
