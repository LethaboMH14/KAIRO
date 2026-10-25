"""CPU-only SQuAD 1.1 relevance-proxy evaluation for KAIRO issue #50.

Crowd-labelled answers identify source paragraphs; they do NOT certify educational
benefit, KAIRO citations or factual accuracy. No private material or model export.
"""
import argparse
from collections import Counter
from hashlib import sha1, sha256
import json
import math
from pathlib import Path
import random
import re
import statistics
import time
from urllib.request import urlopen

from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

SOURCE_COMMIT = 'eee5fdbf62f8613a7812b03419e6b29617b74fd1'
BLOB_SHA1 = 'e9a3f913ad1468ebe105b891334ca7b0bc0e2510'
SOURCE_URL = f'https://raw.githubusercontent.com/rajpurkar/SQuAD-explorer/{SOURCE_COMMIT}/dataset/dev-v1.1.json'
MAX_BYTES = 8_000_000
TOKEN = re.compile(r'(?u)\b\w\w+\b')
SEED = 5010

def tokens(text):
    return TOKEN.findall(text.casefold())

def accept_source_bytes(raw):
    if len(raw) > MAX_BYTES:
        raise ValueError('Source dataset exceeds permitted size')
    git_hash = sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest()
    if git_hash != BLOB_SHA1:
        raise ValueError('Unexpected Git blob hash: ' + git_hash)
    return json.loads(raw)

def load_public_source(path, fetch_public=False, acknowledge_license=False):
    if not acknowledge_license:
        raise ValueError('Explicit --acknowledge-license required: CC-BY-SA-4.0/Wikipedia')
    if fetch_public:
        if path.exists():
            raise ValueError('Refusing to overwrite dataset')
        with urlopen(SOURCE_URL, timeout=45) as response:
            raw = response.read(MAX_BYTES + 1)
        data = accept_source_bytes(raw)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(raw)
    else:
        raw = path.read_bytes()
        data = accept_source_bytes(raw)
    return data, sha256(raw).hexdigest()

def synthetic_fixture():
    articles = []
    for i in range(9):
        paragraphs = []
        for j in range(3):
            key = f'topic{i}unit{j}'
            context = f'The {key} is a made up example for group {i}, passage {j}. Not a real lesson.'
            paragraphs.append({'context': context, 'qas': [
                {'id': f'q{i}-{j}', 'question': f'What is the {key} example?',
                 'answers': [{'text': key, 'answer_start': 4}]}]})
        articles.append({'title': f'synthetic-article-{i}', 'paragraphs': paragraphs})
    return {'version':'1.1', 'data':articles}

def prepare(raw):
    docs, queries, titles = {}, [], set()
    for article in raw['data']:
        title = article['title']
        if title in titles:
            raise ValueError('Duplicated source title')
        titles.add(title)
        for index, paragraph in enumerate(article['paragraphs']):
            context = paragraph['context']
            if not isinstance(context, str) or not context.strip():
                raise ValueError('Empty source paragraph')
            docid = f'{title}::{index}'
            docs[docid] = {'title':title, 'text':context,
                           'digest':sha256(context.encode()).hexdigest()}
            for item in paragraph['qas']:
                answers = item.get('answers', [])
                if not answers or not all(isinstance(a.get('answer_start'),int)
                    and context[a['answer_start']:a['answer_start']+len(a['text'])]==a['text']
                    for a in answers):
                    raise ValueError('Invalid independent gold answer span')
                queries.append({'id':item['id'], 'title':title,
                                'text':item['question'], 'gold':docid})
    if not docs or not queries:
        raise ValueError('Missing labelled benchmark examples')
    return docs, queries

def partition(docs, queries):
    titles = sorted({d['title'] for d in docs.values()})
    if len(titles) < 6:
        raise ValueError('Need six or more independent article titles')
    random.Random(SEED).shuffle(titles)
    n=len(titles)
    groups={'train':set(titles[:int(n*.6)]),
            'dev':set(titles[int(n*.6):int(n*.8)]),
            'test':set(titles[int(n*.8):])}
    if not all(groups.values()):
        raise ValueError('Empty split')
    digests={}
    for doc in docs.values():
        split=next(name for name, group in groups.items() if doc['title'] in group)
        prior=digests.setdefault(doc['digest'], split)
        if prior != split:
            raise ValueError('Duplicate paragraph crossed split boundary')
    for name, group in groups.items():
        if not any(q['title'] in group for q in queries):
            raise ValueError('No labelled queries in '+name)
    return groups

class BM25:
    def __init__(self, docs):
        self.counts={k:Counter(tokens(v['text'])) for k,v in docs.items()}
        self.lengths={k:sum(v.values()) for k,v in self.counts.items()}
        self.avg=sum(self.lengths.values())/max(1,len(docs))
        df=Counter(t for terms in self.counts.values() for t in terms)
        self.idf={t:math.log1p((len(docs)-n+0.5)/(n+0.5)) for t,n in df.items()}
    def score(self, qtokens, did):
        counts=self.counts[did]
        norm=1.2*(0.25+0.75*self.lengths[did]/max(self.avg,1))
        return sum(self.idf.get(t,0)*2.2*counts[t]/(counts[t]+norm)
                   for t in set(qtokens) if counts[t])

def features(qtokens, passage, lexical):
    pt=tokens(passage)
    q,p=set(qtokens),set(pt)
    common=len(q & p)
    bigrams=set(zip(qtokens,qtokens[1:]))
    return [lexical,common/max(1,len(q)),common/max(1,len(q|p)),
            len(bigrams & set(zip(pt,pt[1:])))/max(1,len(bigrams)),
            math.log1p(len(pt)),math.log1p(common)]

def candidates(question, docs, index, limit=24):
    qt=tokens(question)
    return sorted(docs, key=lambda did:(-index.score(qt,did),did))[:limit]

def examples(docs, queries, max_queries, with_gold):
    index=BM25(docs)
    rows, labels, selected=[],[],[]
    for query in sorted(queries,key=lambda q:sha256(q['id'].encode()).hexdigest())[:max_queries]:
        top=candidates(query['text'],docs,index)
        if with_gold and query['gold'] not in top:
            top=top[:-1]+[query['gold']]  # train only, never add gold on dev/test
        selected.append((query,top))
        if with_gold:
            qt=tokens(query['text'])
            for did in top:
                rows.append(features(qt,docs[did]['text'],index.score(qt,did)))
                labels.append(int(did==query['gold']))
    return index,selected,rows,labels

def evaluate(model,index,selected,docs):
    counts={which:{k:0 for k in (1,3,5,24)} for which in ('lexical','trained')}
    timings={'lexical':[],'trained':[]}
    for query,top in selected:
        qt=tokens(query['text'])
        start=time.perf_counter()
        lexical=sorted(top,key=lambda did:(-index.score(qt,did),did))
        timings['lexical'].append((time.perf_counter()-start)*1000)
        start=time.perf_counter()
        scores=model.predict_proba([features(qt,docs[did]['text'],index.score(qt,did))
                                    for did in top])[:,1]
        trained=[did for did,score in sorted(zip(top,scores),key=lambda p:(-p[1],p[0]))]
        timings['trained'].append((time.perf_counter()-start)*1000)
        for name,ranked in (('lexical',lexical),('trained',trained)):
            for k in counts[name]:
                counts[name][k]+=int(query['gold'] in ranked[:k])
    n=len(selected)
    return {name:{**{'recall_at_'+str(k):round(v/n,5) for k,v in values.items()},
                   'exact_gold_paragraph_at_1':round(values[1]/n,5),
                   'median_cpu_ranking_ms':round(statistics.median(timings[name]),3)}
            for name,values in counts.items()}

def run(raw, smoke=False, limits=(650,150,200)):
    started=time.perf_counter()
    docs,queries=prepare(raw)
    groups=partition(docs,queries)
    split={name:({did:doc for did,doc in docs.items() if doc['title'] in titles},
                 [q for q in queries if q['title'] in titles]) for name,titles in groups.items()}
    _, train_queries=split['train']
    _,selected,x,y=examples(split['train'][0],train_queries,limits[0],True)
    if len(set(y)) != 2:
        raise ValueError('Training labels need positive and negative examples')
    model=make_pipeline(StandardScaler(),LogisticRegression(
        max_iter=400,class_weight='balanced',random_state=SEED))
    fit_start=time.perf_counter()
    model.fit(x,y)
    fit_seconds=round(time.perf_counter()-fit_start,3)
    metrics={}
    sample_counts={}
    for name,limit in [('dev',limits[1]),('test',limits[2])]:
        sd,sq=split[name]
        index,chosen,_,_=examples(sd,sq,limit,False)
        metrics[name]=evaluate(model,index,chosen,sd)
        sample_counts[name]=len(chosen)
    baseline=metrics['test']['lexical']['recall_at_3']
    trained=metrics['test']['trained']['recall_at_3']
    return {'data':'SYNTHETIC_SMOKE_ONLY' if smoke else 'SQUAD_V1_1_HUMAN_ANNOTATED_QA_PROXY',
            'hosted_kaggle':'NOT_EXECUTED','environment':'OFFLINE_OR_CI_CPU',
            'dataset_title_group_split':{name:len(titles) for name,titles in groups.items()},
            'split_method':'whole_article_sha256_text_deduplicated_seed_5010',
            'train_pairs':len(y),'train_queries':len(selected),'eval_queries':sample_counts,
            'dev':metrics['dev'],'test':metrics['test'],
            'model':'StandardScaler+LogisticRegression sklearn 1.8.0',
            'fit_cpu_seconds':fit_seconds,'total_wall_seconds':round(time.perf_counter()-started,3),
            'other_owner_retrieval':'NOT_MEASURED_PRODUCTION',
            'hallucination_rate':'NOT_MEASURABLE_NO_GENERATOR',
            'token_latency':'NOT_MEASURED_CPU_RANKING_MS_ONLY',
            'provider_cost_usd':'NO_PROVIDER_CALLS_CPU_RUNNER_COST_NOT_PRICED',
            'languages':'ENGLISH_ONLY','production_eligible':False,
            'decision':'REJECT_PROMOTION' if smoke or trained<=baseline else 'REVIEW_REQUIRED_NOT_APPROVED',
            'limitations':['Gold QA paragraph != verified citation truth',
                           'No private learner source or revision is loaded',
                           'Cannot retrieve gold absent from lexical top24',
                           'No cross-owner KAIRO test, unanswerable query or multilingual human study']}

def main(argv=None):
    p=argparse.ArgumentParser()
    p.add_argument('--dataset',type=Path,default=Path('data/squad-dev-v1.1.json'))
    p.add_argument('--fetch-public',action='store_true')
    p.add_argument('--acknowledge-license',action='store_true')
    p.add_argument('--smoke',action='store_true')
    p.add_argument('--output',type=Path)
    p.add_argument('--train-limit',type=int,default=650)
    p.add_argument('--dev-limit',type=int,default=150)
    p.add_argument('--test-limit',type=int,default=200)
    a=p.parse_args(argv)
    if min(a.train_limit,a.dev_limit,a.test_limit)<1:
        p.error('Limits must be strictly positive')
    if a.smoke:
        if a.fetch_public:
            p.error('--smoke forbids network download')
        data, source_hash=synthetic_fixture(),None
    else:
        data,source_hash=load_public_source(a.dataset,a.fetch_public,a.acknowledge_license)
    result=run(data,smoke=a.smoke,limits=(a.train_limit,a.dev_limit,a.test_limit))
    result['source_sha256']=source_hash
    result['source_git_blob_sha1']=None if a.smoke else BLOB_SHA1
    result['source_url']=None if a.smoke else SOURCE_URL
    encoded=json.dumps(result,sort_keys=True,indent=2)+'\n'
    if a.output:
        a.output.parent.mkdir(parents=True,exist_ok=True)
        a.output.write_text(encoded,encoding='utf-8')
    print(encoded)
    return result

if __name__=='__main__':
    main()
