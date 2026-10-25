"""Synthetic educational retrieval model training smoke test. NOT a Kaggle run or product validation."""
import json
import re
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import balanced_accuracy_score

TOPICS=[
 ('motor','What changes synchronous speed of a motor?','Induction motor synchronous speed changes with frequency and pole count.'),
 ('pump','How does an impeller contribute to pump head?','A centrifugal pump impeller transfers energy to liquid, affecting head and flow.'),
 ('http','What does a server status code represent?','An HTTP server returns a status code indicating the response classification.'),
 ('arrays','What happens to a recursive call stack?','Recursive function calls build a call stack until a base case unwinds it.'),
 ('circuits','What determines current through a resistor?','Ohm law states current equals voltage divided by resistance.'),
 ('database','How do foreign keys connect table rows?','A foreign key references a primary key in another relational table.'),
 ('inventory','What triggers a reorder level?','Inventory is reordered when stock quantity reaches the reorder point.'),
 ('access','What is authorization after authentication?','Authentication establishes identity; authorization verifies resource access permission.')
]
TOKEN=re.compile(r'[a-z]{2,}')
def features(query,passage):
 q=set(TOKEN.findall(query.lower()));p=set(TOKEN.findall(passage.lower()))
 return [len(q&p)/max(1,len(q)),len(q&p)/max(1,len(q|p)),min(1.,len(p)/100)]
def dataset(indices):
 xs,ys,groups=[],[],[]
 for i in indices:
  _,q,_=TOPICS[i]
  for j in indices:
   xs.append(features(q,TOPICS[j][2]));ys.append(int(i==j));groups.append(i)
 return xs,ys,groups
def run():
 train_ids=list(range(6));holdout_ids=[6,7]
 x,y,groups=dataset(train_ids);tx,ty,tgroups=dataset(holdout_ids)
 assert not set(groups)&set(tgroups),'topic leakage'
 model=LogisticRegression(random_state=42,max_iter=200,class_weight='balanced')
 model.fit(x,y)
 baseline=[int(a[0]>=0.25) for a in tx]
 return {'training_location':'CURRENT_EXECUTION_ENVIRONMENT_NOT_VERIFIED_AS_KAGGLE',
         'dataset':'SYNTHETIC_DEMO_ONLY','split':'held-out-topic-group',
         'train_topic_ids':train_ids,'test_topic_ids':holdout_ids,'train_pairs':len(y),'test_pairs':len(ty),
         'test_balanced_accuracy':round(float(balanced_accuracy_score(ty,model.predict(tx))),4),
         'lexical_threshold_baseline_balanced_accuracy':round(float(balanced_accuracy_score(ty,baseline)),4),
         'model_fitted':True,'production_eligible':False,
         'warning':'Tiny authored samples. No real learner outcome or generalisation, source-quality, fairness or permitted Kaggle execution evidence.'}
if __name__=='__main__':print(json.dumps(run(),sort_keys=True,indent=2))
