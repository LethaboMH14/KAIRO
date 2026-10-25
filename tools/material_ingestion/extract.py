import argparse,hashlib,json,zipfile,posixpath
from pathlib import Path
MAX_BYTES=25*1024*1024;MAX_OUTPUT=1000000;MAX_ZIP=80*1024*1024;MAX_ITEMS=20000;TEXT_CAP=12000

def run(path,max_units):
 if not isinstance(max_units,int) or not 1<=max_units<=200: raise ValueError('max_units must be 1..200')
 size=path.stat().st_size
 result={'schemaVersion':1,'contentSha256':'','coverage':{'discoveredUnits':0,'attemptedUnits':0,'completedUnits':0,'skipped':[],'failures':[]},'blocks':[],'warnings':[]};c=result['coverage'];units=[]
 overflow={'count':0,'first':None}
 def unit(kind,text,loc,method='native-parser'):
  if text is None or not str(text).strip():
   if len(c['skipped'])<max_units:c['skipped'].append({'locator':loc,'reason':'empty native text; no semantic content extracted'})
   else:overflow['count']+=1
   return
  if len(units)>=max_units:
   overflow['count']+=1
   if overflow['first'] is None:overflow['first']=loc
   return
  units.append((kind,str(text),loc,method))
 try:
  if size>MAX_BYTES: raise ValueError('input exceeds 25 MiB')
  raw=path.read_bytes();result['contentSha256']=hashlib.sha256(raw).hexdigest()
  ext=path.suffix.lower()
  if ext in ('.pdf','.docx','.pptx','.xlsx'):result['warnings'].append('native text only; visual, image, chart and embedded-object semantics are not extracted')
  if ext in ('.txt','.md'):
   text=raw.decode('utf-8-sig');delimiter='\f' if '\f' in text else '\n\n'; count=text.count(delimiter)+1;c['discoveredUnits']=count
   parts=text.split(delimiter,max_units)
   for i,t in enumerate(parts[:max_units]):unit('text',t,{'sectionIndex':i},'utf8')
   if count>max_units:c['skipped'].append({'locator':{'sectionIndex':max_units,'omittedCount':count-max_units},'reason':'max-units limit; remaining sections not extracted'})
  elif ext=='.pdf':
   from pypdf import PdfReader
   d=PdfReader(path,strict=False)
   if len(d.pages)>MAX_ITEMS:raise ValueError('PDF page count exceeds safety limit')
   c['discoveredUnits']=len(d.pages)
   for i,p in enumerate(d.pages):
    if i>=max_units:
     c['skipped'].append({'locator':{'pageIndex':i},'reason':'max-units limit'});continue
    loc={'pageIndex':i}
    try:
     t=p.extract_text() or ''
     if t.strip():unit('page',t,loc)
     else:c['skipped'].append({'locator':loc,'reason':'needsOCR: no extractable native text'})
    except Exception:c['failures'].append({'locator':loc,'code':'page-extraction-failed'})
  elif ext=='.docx':
   with zipfile.ZipFile(path) as z:
    if len(z.infolist())>MAX_ITEMS or sum(x.file_size for x in z.infolist())>MAX_ZIP:raise ValueError('package expands beyond safety limit')
   from docx import Document
   d=Document(path);body=d.element.body;pi=ti=0
   result['warnings'].append('DOCX headers, footnotes, comments, nested tables and floating visual content are outside the extracted top-level body coverage')
   for child in body.iterchildren():
    if child.tag.endswith('}p'):
     from docx.text.paragraph import Paragraph
     p=Paragraph(child,body);unit('paragraph',p.text,{'paragraphIndex':pi});pi+=1
    elif child.tag.endswith('}tbl'):
     from docx.table import Table
     t=Table(child,body)
     for ri,row in enumerate(t.rows):
      for ci,cell in enumerate(row.cells):unit('table-cell',cell.text,{'tableIndex':ti,'rowIndex':ri,'cellIndex':ci})
     ti+=1
   c['discoveredUnits']=pi+sum(len(t.rows)*len(t.columns) for t in d.tables)
  elif ext=='.pptx':
   with zipfile.ZipFile(path) as z:
    if len(z.infolist())>MAX_ITEMS or sum(x.file_size for x in z.infolist())>MAX_ZIP:raise ValueError('package expands beyond safety limit')
   from pptx import Presentation
   d=Presentation(path);c['discoveredUnits']=len(d.slides)
   for si,s in enumerate(d.slides):
    if si>=max_units:
     c['skipped'].append({'locator':{'slideIndex':si},'reason':'max-units limit'});continue
    loc={'slideIndex':si}; texts=[]
    def read_shapes(shapes,prefix=()):
     for hi,sh in enumerate(shapes):
      anchor=prefix+(hi,)
      if getattr(sh,'has_text_frame',False) and sh.text.strip():texts.append((sh.text,{'slideIndex':si,'shapeIndex':anchor[0]}))
      if getattr(sh,'has_table',False):
       for ri,row in enumerate(sh.table.rows):
        for ci,cell in enumerate(row.cells):
         if cell.text.strip():texts.append((cell.text,{'slideIndex':si,'shapeIndex':anchor[0],'rowIndex':ri,'cellIndex':ci}))
      if getattr(sh,'shape_type',None)==6 and hasattr(sh,'shapes'):read_shapes(sh.shapes,anchor)
    read_shapes(s.shapes)
    try:
     if s.has_notes_slide:
      for ni,sh in enumerate(s.notes_slide.shapes):
       if getattr(sh,'has_text_frame',False) and sh.text.strip():texts.append((sh.text,{'slideIndex':si,'notesIndex':ni}))
    except Exception:c['failures'].append({'locator':loc,'code':'notes-extraction-failed'})
    if not texts:c['skipped'].append({'locator':loc,'reason':'no extractable slide or notes text; image/chart semantics unsupported'})
    else:
     # One coverage unit per slide, preserving source shape and note locators in sequence.
     unit('slide','\n'.join(t for t,_ in texts),loc)
     units[-1]=('slide',units[-1][1],{'slideIndex':si,'elements':[l for _,l in texts]},'python-pptx')
  elif ext=='.xlsx':
   with zipfile.ZipFile(path) as z:
    if len(z.infolist())>MAX_ITEMS or sum(x.file_size for x in z.infolist())>MAX_ZIP:raise ValueError('package expands beyond safety limit')
   import xml.etree.ElementTree as ET
   with zipfile.ZipFile(path) as z:
    ss=[]
    if 'xl/sharedStrings.xml' in z.namelist():
     for _,el in ET.iterparse(z.open('xl/sharedStrings.xml'),events=('end',)):
      if el.tag.endswith('}si'):
       ss.append(''.join(x.text or '' for x in el.iter() if x.tag.endswith('}t')));el.clear()
       if len(ss)>MAX_ITEMS:raise ValueError('shared string count safety limit')
    workbook=ET.fromstring(z.read('xl/workbook.xml'));rels=ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    targets={r.attrib['Id']:r.attrib['Target'] for r in rels}
    sheetmap=[]
    for sh in workbook.iter():
     if sh.tag.endswith('}sheet'):
      rid=next((v for k,v in sh.attrib.items() if k.endswith('}id')),None);target=targets.get(rid,'')
      member=posixpath.normpath(target.lstrip('/') if target.startswith('/') else posixpath.join('xl',target))
      sheetmap.append((sh.attrib.get('name',''),member))
    n=0;stopped=False
    for si,(sheetname,sheet) in enumerate(sheetmap):
     with z.open(sheet) as stream:
      for _,el in ET.iterparse(stream,events=('end',)):
       if el.tag.endswith('}c'):
        ref=el.attrib.get('r','?');typ=el.attrib.get('t');v=el.find('{*}v');f=el.find('{*}f');value=''
        if f is not None and f.text is not None:value='='+f.text
        elif typ=='inlineStr':value=''.join(x.text or '' for x in el.iter() if x.tag.endswith('}t'))
        elif v is not None and v.text is not None:
          if typ=='s':
           idx=int(v.text)
           if idx<0 or idx>=len(ss):raise ValueError('invalid XLSX shared-string index')
           value=ss[idx]
          else:value=v.text
        if value:
         n+=1
         if len(units)>=max_units:
          c['skipped'].append({'locator':{'sheet':sheetname,'range':ref},'reason':'max-units limit; later cell coverage unknown'});stopped=True;el.clear();break
         unit('cell',value,{'sheet':sheetname,'range':ref});el.clear()
       if stopped:break
     if stopped:break
    c['discoveredUnits']=n if not stopped else None
    if stopped:result['warnings'].append('discoveredUnits is null because extraction stopped at max-units; later cells were not scanned')
  else:raise ValueError('unsupported file type')
  if c['discoveredUnits'] is not None:c['discoveredUnits']=max(c['discoveredUnits'],len(units)+len(c['skipped']))
  c['attemptedUnits']=min(c['discoveredUnits'],max_units) if isinstance(c['discoveredUnits'],int) else max_units
  # Skips are coverage entries; block-producing units are emitted in document order.
  selected=units[:max_units]
  for i,(kind,text,loc,method) in enumerate(selected):
   trunc=len(text)>TEXT_CAP;result['blocks'].append({'blockId':f'b{i+1}','kind':kind,'text':text[:TEXT_CAP],'locator':loc,'order':i,'provenance':{'method':method,'engine':'python','reviewed':False},'warnings':['text-truncated-at-12000-chars'] if trunc else []});c['completedUnits']+=1
   if trunc:c['skipped'].append({'locator':loc,'reason':'text truncated at 12000 characters'})
  if overflow['count']:c['skipped'].append({'locator':{'first':overflow['first'],'omittedCount':overflow['count']},'reason':'max-units limit; remaining coverage summarized'})
  if len(units)>max_units:c['discoveredUnits']=max(c['discoveredUnits'],len(units))
 except Exception as e:
  result['warnings'].append(type(e).__name__+': '+str(e)[:200]);c['failures'].append({'locator':{},'code':'document-extraction-failed'});result['coverage']['attemptedUnits']=min(result['coverage']['discoveredUnits'],max_units)
 encoded=json.dumps(result,ensure_ascii=False)
 if len(encoded.encode())>MAX_OUTPUT:
  # Preserve accounting and bound output by omitting trailing blocks, marking each omitted unit.
  while result['blocks'] and len(json.dumps(result,ensure_ascii=False).encode())>MAX_OUTPUT:
   b=result['blocks'].pop();c['completedUnits']-=1;c['skipped'].append({'locator':b['locator'],'reason':'output-size limit'})
  if len(json.dumps(result,ensure_ascii=False).encode())>MAX_OUTPUT and len(c['skipped'])>100:
   omitted=len(c['skipped'])-99;c['skipped']=c['skipped'][:99]+[{'locator':{'omittedCount':omitted},'reason':'additional unit details omitted by output-size limit'}]
  result['warnings'].append('output-size limit reached; omitted blocks are listed as skipped')
 return result

def main():
 p=argparse.ArgumentParser();p.add_argument('--input',required=True);p.add_argument('--max-units',type=int,default=100);a=p.parse_args()
 if not 1<=a.max_units<=200:p.error('--max-units must be 1..200')
 print(json.dumps(run(Path(a.input),a.max_units),ensure_ascii=False))
if __name__=='__main__':main()
