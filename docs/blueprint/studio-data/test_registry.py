import copy,json,tempfile,unittest
from pathlib import Path
from build_registry import BASE,build,eligible,search,validate

class RegistryTests(unittest.TestCase):
    def setUp(self):
        self.catalog=json.loads((BASE/'catalog.json').read_text(encoding='utf-8'))
    def test_discovery_does_not_authorize_other_uses(self):
        for r in validate(self.catalog):
            self.assertTrue(eligible(r,'discovery'))
            for purpose in ['publicRag','train','redistribute']:self.assertFalse(eligible(r,purpose))
    def test_unknown_rights_and_string_review_cannot_be_approved(self):
        r=copy.deepcopy(self.catalog['resources'][0]);r['use']['publicRag']='allowed';r['specificAssetReviewed']='true'
        self.assertFalse(eligible(r,'publicRag'))
        with self.assertRaises(ValueError):validate({**self.catalog,'resources':[r]})
        with self.assertRaises(ValueError):eligible(r,'execute')
    def test_duplicate_identifiers_rejected(self):
        with self.assertRaises(ValueError):validate({**self.catalog,'resources':[self.catalog['resources'][0]]*2})
    def test_search_returns_sources_and_cannot_expose_unapproved_content(self):
        with tempfile.TemporaryDirectory() as tmp:
            db=Path(tmp)/'test.sqlite';self.assertEqual(build(db),13)
            hits=search('heart',db_path=db);self.assertTrue(hits);self.assertTrue(all(h['url'].startswith('https://') for h in hits))
            self.assertEqual(search('anatomy','publicRag',db_path=db),[])
            self.assertEqual(search('Forage','train',db_path=db),[])
            # SQL-looking words may match ordinary metadata; they must never execute.
            search('"; DROP TABLE resources; --',db_path=db)
            self.assertTrue(search('heart',db_path=db))
            self.assertEqual(search('***',db_path=db),[])
    def test_input_bounds(self):
        for query in ['', 'x'*201]:
            with self.assertRaises(ValueError):search(query)
        with self.assertRaises(ValueError):search('heart',limit=True)

if __name__=='__main__':unittest.main()
