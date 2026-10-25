"""Bounded retrieval over extracted private sources; no arbitrary file access."""
import json,re
from pathlib import Path

class SourceIndex:
    def __init__(self,private_root):
        self.root=Path(private_root).resolve();self.extracted=self.root/'extracted'
    def _documents(self):
        if not self.extracted.exists():return
        for path in sorted(self.extracted.glob('*.json')):
            if not re.fullmatch(r'[a-f0-9]{24}',path.stem) or path.is_symlink():continue
            if not path.resolve().is_relative_to(self.extracted.resolve()):continue
            document=json.loads(path.read_text(encoding='utf-8'))
            if document.get('sourceId')!=path.stem:continue
            yield document
    def catalog(self,limit=20):
        if not 1<=limit<=50:raise ValueError('limit must be 1–50')
        return [{'sourceId':d['sourceId'],'courseCodes':d.get('courseCodes',[]),'kind':d.get('kind'),'chunks':len(d.get('chunks',[])),
          'privacy':'private-local','reviewStatus':'not-yet-validated'} for d in self._documents()][:limit]
    def search(self,query,limit=5):
        if not isinstance(query,str) or not 1<=len(query.strip())<=200:raise ValueError('query must be 1–200 characters')
        if not 1<=limit<=20:raise ValueError('limit must be 1–20')
        tokens=set(re.findall(r'\w+',query.lower()));matches=[]
        if not tokens:return []
        for doc in self._documents():
            for c in doc.get('chunks',[]):
                words=re.findall(r'\w+',c['text'].lower());wordset=set(words)
                score=len(tokens&wordset)/len(tokens)
                if score:
                    # Excerpts retain exact text and offsets; these are retrieval hits, not generated answers.
                    positions=[m.start() for m in re.finditer(r'\w+',c['text']) if m.group().lower() in tokens]
                    start=max(0,min(positions,default=0)-120);end=min(len(c['text']),start+900)
                    matches.append({'chunkId':c['chunkId'],'sourceId':doc['sourceId'],'courseCodes':doc.get('courseCodes',[]),
                      'page':c.get('page'),'method':c['method'],'score':score,'excerpt':c['text'][start:end],
                      'sourceStart':c['start']+start,'sourceEnd':c['start']+end,'needsReview':True,'instructionsTrusted':False})
        return sorted(matches,key=lambda m:(-m['score'],m['sourceId'],m['chunkId']))[:limit]
    def chunk(self,chunk_id):
        if not isinstance(chunk_id,str) or len(chunk_id)>160 or not re.fullmatch(r'[a-f0-9]{24}:[^/\\]{1,100}:\d+',chunk_id):raise ValueError('Invalid chunk ID')
        for doc in self._documents():
            if not chunk_id.startswith(doc['sourceId']+':'):continue
            for c in doc.get('chunks',[]):
                if c['chunkId']==chunk_id:return {**c,'privacy':'private-local','instructionsTrusted':False,'rights':doc.get('rights')}
        raise KeyError('Chunk not found')
