"""Bounded upload extraction for the local learner workspace; never accepts a source path from HTTP."""
import json, sys, zipfile
from pathlib import Path
from extract import extract_source

root=Path(__file__).resolve().parents[2]
uploads=(root/'data/private/app-workspace/uploads').resolve()
path=Path(sys.argv[1]).resolve()
if not path.is_relative_to(uploads) or path.is_symlink() or path.stat().st_size>8*1024*1024:
    raise ValueError('Upload is outside the local workspace or too large')
if zipfile.is_zipfile(path):
    with zipfile.ZipFile(path) as z:
        if len(z.infolist())>2000 or sum(i.file_size for i in z.infolist())>40*1024*1024:
            raise ValueError('Document package exceeds preview limits')
engine=None
if path.suffix.lower() in {'.png','.jpg','.jpeg'}:
    from PIL import Image
    with Image.open(path) as image:
        if image.width*image.height>12000000:
            raise ValueError('Image exceeds 12 million pixels; resize before upload')
if path.suffix.lower() in {'.pdf','.png','.jpg','.jpeg'}:
    from rapidocr_onnxruntime import RapidOCR
    engine=RapidOCR(intra_op_num_threads=2,inter_op_num_threads=1)
out=uploads.parent/'worker'
out.mkdir(exist_ok=True)
result=extract_source({'id':path.stem,'path':str(path),'kind':'user-upload','courseCodes':[], 'rights':'Learner supplied; private study only'},out,4,engine)
pages=[]
for i,p in enumerate(result['pages'][:4]):
    pages.append({'text':p.get('text','')[:16000],'locator':f"Page {p['page']}" if p.get('page') else p.get('sheet') or p.get('locator') or f'Section {i+1}', 'method':p['method']})
print(json.dumps({'pages':pages,'pageCount':result.get('pageCount'),'limitNote':'First 4 pages/slides/sheets; text sections limited to 16,000 characters.'},ensure_ascii=True))
