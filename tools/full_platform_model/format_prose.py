"""Normalize prose spacing without altering Markdown links, code, or numeric model inputs."""
import re
from cost_model import OUT
for name in ['LEAN-CANVAS.md','FULL-JOURNEY-AND-DELIVERY.md','FULL-PLATFORM-COSTS.md','SKILLS-AND-SOURCES.md']:
    p=OUT/name;text=p.read_text(encoding='utf-8')
    chunks=re.split(r'(```[\s\S]*?```|`[^`]*`|\[[^\]]*\]\([^)]*\))',text)
    for i in range(0,len(chunks),2):
        s=chunks[i]
        s=re.sub(r'(?<=[a-z])(?=R\d)',' ',s)
        s=re.sub(r'(?<=[A-Za-z])(?=\d)',' ',s)
        s=re.sub(r'(?<=\d)(?=[A-Za-z])',' ',s)
        s=re.sub(r'(?<=%)(?=[A-Za-z])',' ',s)
        s=re.sub(r'\bR\s+(?=\d)','R',s)
        s=re.sub(r'\bR(\d+(?:\.\d+)?)\s+k\b',lambda m:'R'+f'{float(m[1])*1000:,.0f}',s)
        s=re.sub(r'\b([23]) D\b',r'\1D',s)
        chunks[i]=s
    p.write_text(''.join(chunks),encoding='utf-8')
print('Four prose documents formatted; source URLs/code preserved.')
