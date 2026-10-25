from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[2];PACK=ROOT/'coordination/briefs/AVATAR-AND-PATHWAYS'
template=(ROOT/'tools/claude-kit/review.template.html').read_text(encoding='utf8')
for name,file in [('SOURCES','sources.json'),('ASSETS','assets.json')]:
 data=json.loads((PACK/file).read_text(encoding='utf8'));template=template.replace('__'+name+'__',json.dumps(data,ensure_ascii=False).replace('</','<\\/'))
(PACK/'index.html').write_text(template,encoding='utf8')
script=re.search(r'<script>([\s\S]*)</script>',template).group(1)
(ROOT/'tools/claude-kit/review-script.check.js').write_text(script,encoding='utf8')
print('Built standalone product explorer; registry and asset statuses embedded.')
