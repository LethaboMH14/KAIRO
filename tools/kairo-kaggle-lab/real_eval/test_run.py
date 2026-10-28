"""Adversarial/contract tests. Fixture is authored and NOT a relevance benchmark."""
import unittest
from pathlib import Path
from run import (accept_source_bytes, load_public_source, prepare, partition,
                 run, synthetic_fixture)

class RelevanceEvaluationTests(unittest.TestCase):
    def test_whole_article_disjoint(self):
        docs,qs=prepare(synthetic_fixture())
        groups=partition(docs,qs)
        self.assertFalse(groups['train'] & groups['test'])
        self.assertFalse(groups['dev'] & groups['test'])
        self.assertFalse(groups['train'] & groups['dev'])

    def test_invalid_answer_span_fails_closed(self):
        d=synthetic_fixture()
        d['data'][0]['paragraphs'][0]['qas'][0]['answers'][0]['answer_start']=0
        with self.assertRaisesRegex(ValueError,'Invalid independent gold'):
            prepare(d)

    def test_cross_group_duplicate_paragraph_fails_closed(self):
        d=synthetic_fixture()
        for article in d['data']:
            p=article['paragraphs'][0]
            p['context']='identical paragraph in all groups'
            p['qas'][0]['answers']=[{'text':'identical','answer_start':0}]
        docs,qs=prepare(d)
        with self.assertRaisesRegex(ValueError,'Duplicate paragraph'):
            partition(docs,qs)

    def test_rights_confirmation_required(self):
        with self.assertRaisesRegex(ValueError,'acknowledge-license'):
            load_public_source(Path('no-dataset-file.json'))

    def test_unverified_data_refused(self):
        with self.assertRaisesRegex(ValueError,'Unexpected Git blob'):
            accept_source_bytes(b'{"version":"1.1","data":[]}')

    def test_synthetic_fits_but_blocks_promotion(self):
        result=run(synthetic_fixture(),smoke=True,limits=(50,10,10))
        self.assertEqual(result['hosted_kaggle'],'NOT_EXECUTED')
        self.assertEqual(result['data'],'SYNTHETIC_SMOKE_ONLY')
        self.assertFalse(result['production_eligible'])
        self.assertEqual(result['decision'],'REJECT_PROMOTION')
        self.assertIn('recall_at_3',result['test']['lexical'])
        self.assertIn('recall_at_3',result['test']['trained'])
        self.assertGreater(result['train_pairs'],0)

if __name__=='__main__':
    unittest.main()
