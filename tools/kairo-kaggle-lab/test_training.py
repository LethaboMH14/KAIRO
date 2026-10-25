import unittest
from train import TOPICS,dataset,features,run
class SyntheticTrainingTests(unittest.TestCase):
 def test_disjoint_groups(self):
  a=dataset(list(range(6)));b=dataset([6,7]);self.assertFalse(set(a[2])&set(b[2]))
 def test_labels_features(self):
  x,y,g=dataset([0,1]);self.assertEqual(y,[1,0,0,1]);self.assertEqual(len(x),4);self.assertTrue(all(0<=v<=1 for r in x for v in r))
 def test_never_claims_real_user_or_kaggle_success(self):
  r=run();self.assertTrue(r['model_fitted']);self.assertFalse(r['production_eligible']);self.assertEqual(r['dataset'],'SYNTHETIC_DEMO_ONLY');self.assertEqual(r['test_pairs'],4)
if __name__=='__main__':unittest.main()
