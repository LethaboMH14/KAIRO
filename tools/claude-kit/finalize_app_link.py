from pathlib import Path
root=Path(__file__).resolve().parents[2]
p=root/'studio/src/profile/ProgressPage.tsx';s=p.read_text(encoding='utf8')
old='<a href="/practice">Workplace practice</a></nav>'
new='<a href="/practice">Workplace practice</a><a href="/pathways">Explore roles</a></nav>'
if old not in s and new not in s:raise RuntimeError('Progress navigation changed; review before editing')
p.write_text(s.replace(old,new),encoding='utf8')
p=root/'tools/claude-kit/review.template.html';s=p.read_text(encoding='utf8')
for label in ['Compare rigs','Art direction','Bake/export','Runtime check']:
 s=s.replace('<button>'+label+'</button>','<span class="step">'+label+'</span>').replace('<button type="button">'+label+'</button>','<span class="step">'+label+'</span>')
p.write_text(s,encoding='utf8')
print('Added role entrypoint; replaced noninteractive pipeline buttons with labels.')
