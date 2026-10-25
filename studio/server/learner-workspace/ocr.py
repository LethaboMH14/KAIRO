import json,sys,math
from pathlib import Path
from PIL import Image
import pytesseract
Image.MAX_IMAGE_PIXELS=12000000
path=Path(sys.argv[1]);pages=[];units=[]
def read(image,index):
 if image.width*image.height>12000000: raise ValueError('Image exceeds pixel limit')
 text=pytesseract.image_to_string(image,timeout=25)[:12000]
 units.append({'pageIndex':index,'status':'ocr' if text.strip() else 'needs-review','reason':None if text.strip() else 'OCR returned no text.'})
 if text.strip(): pages.append({'text':text,'locator':{'pageIndex':index} if path.suffix.lower()=='.pdf' else f'Page {index+1}','method':'tesseract-ocr-preview'})
if path.suffix.lower()=='.pdf':
 import pypdfium2 as pdfium
 doc=pdfium.PdfDocument(path)
 try:
  page_count=len(doc)
  for i in range(min(4,page_count)):
   page=doc[i]
   try:
    width,height=page.get_size()
    if not all(math.isfinite(v) and v>0 for v in (width,height)) or math.ceil(width*1.5)*math.ceil(height*1.5)>12000000:
     units.append({'pageIndex':i,'status':'needs-review','reason':'PDF page exceeds pixel limit.'});continue
    image=page.render(scale=1.5).to_pil();read(image,i);image.close()
   finally: page.close()
 finally: doc.close()
else:
 page_count=1
 with Image.open(path) as image: read(image.convert('RGB'),0)
print(json.dumps({'pages':pages,'pageCount':page_count,'coverage':{'units':units}},ensure_ascii=True))
