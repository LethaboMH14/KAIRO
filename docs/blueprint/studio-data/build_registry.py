"""Local research-metadata FTS registry. No download, embedding, training or app auth.

  python docs/blueprint/studio-data/build_registry.py --build
  python docs/blueprint/studio-data/build_registry.py --query heart
  python docs/blueprint/studio-data/build_registry.py --query anatomy --purpose publicRag
"""
from pathlib import Path
from contextlib import closing
import argparse,json,re,sqlite3
BASE=Path(__file__).resolve().parent
PURPOSES=('discovery','publicRag','redistribute','train')

def validate(catalog):
    if catalog.get('schema')!='kairo-research-resources/1':raise ValueError('Unsupported catalogue')
    resources=catalog.get('resources')
    if not isinstance(resources,list) or len(resources)>500:raise ValueError('Invalid resource list')
    seen=set()
    for r in resources:
        if not isinstance(r,dict) or not isinstance(r.get('id'),str) or not re.fullmatch(r'[a-z0-9-]{1,80}',r['id']) or r['id'] in seen:raise ValueError('Invalid or duplicate resource ID')
        seen.add(r['id'])
        for field in ['title','domain','kind','url','notes','licenceObserved']:
            if not isinstance(r.get(field),str) or not 1<=len(r[field])<=3000:raise ValueError('Invalid resource text')
        if not r['url'].startswith('https://'):raise ValueError('HTTPS source required')
        if type(r.get('specificAssetReviewed')) is not bool:raise ValueError('Review state must be boolean')
        if not isinstance(r.get('use'),dict) or set(r['use'])!=set(PURPOSES) or any(v not in ('allowed','review','denied') for v in r['use'].values()):raise ValueError('Purpose policies required')
    return resources

def eligible(resource,purpose):
    if purpose not in PURPOSES:raise ValueError('Unknown purpose')
    if resource.get('use',{}).get(purpose)!='allowed':return False
    return purpose=='discovery' or resource.get('specificAssetReviewed') is True

def build(db_path=BASE/'research-registry.sqlite',catalog_path=BASE/'catalog.json'):
    catalog=json.loads(Path(catalog_path).read_text(encoding='utf-8'));resources=validate(catalog)
    # Only public research metadata is inserted. This is not production source ingestion.
    with closing(sqlite3.connect(db_path)) as db:
        db.execute('CREATE TABLE IF NOT EXISTS resources (id TEXT PRIMARY KEY, metadata TEXT NOT NULL)')
        db.execute('CREATE VIRTUAL TABLE IF NOT EXISTS resource_search USING fts5(id UNINDEXED, title, domain, notes)')
        db.execute('DELETE FROM resource_search');db.execute('DELETE FROM resources')
        for r in resources:
            db.execute('INSERT INTO resources VALUES (?,?)',(r['id'],json.dumps(r,ensure_ascii=False)))
            db.execute('INSERT INTO resource_search VALUES (?,?,?,?)',(r['id'],r['title'],r['domain'],r['notes']))
        db.commit()
    return len(resources)

def search(query,purpose='discovery',limit=10,db_path=BASE/'research-registry.sqlite'):
    if purpose not in PURPOSES or type(limit) is not int or not 1<=limit<=20:raise ValueError('Invalid search options')
    if not isinstance(query,str) or not 1<=len(query.strip())<=200:raise ValueError('Query must be 1–200 characters')
    tokens=re.findall(r'\w+',query,flags=re.UNICODE)
    if not tokens:return []
    match=' OR '.join('"'+t+'"' for t in tokens)
    with closing(sqlite3.connect(db_path)) as db:
        rows=db.execute('SELECT r.metadata FROM resource_search JOIN resources r ON r.id=resource_search.id WHERE resource_search MATCH ? ORDER BY bm25(resource_search)',(match,)).fetchall()
    results=[]
    for (value,) in rows:
        r=json.loads(value)
        if eligible(r,purpose):
            results.append({'id':r['id'],'title':r['title'],'url':r['url'],'purpose':purpose,'status':'discovery metadata; no content acquired','licenceObserved':r['licenceObserved'],'notes':r['notes']})
            if len(results)>=limit:break
    return results

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--build',action='store_true');parser.add_argument('--query');parser.add_argument('--purpose',choices=PURPOSES,default='discovery');args=parser.parse_args()
    if args.build:print(json.dumps({'resources':build(),'database':'research-registry.sqlite','scope':'public research metadata only'}))
    if args.query:print(json.dumps(search(args.query,args.purpose),indent=2,ensure_ascii=False))
    if not args.build and not args.query:parser.print_help()
