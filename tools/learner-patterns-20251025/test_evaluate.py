import unittest

import evaluate


class SyntheticEvaluationTests(unittest.TestCase):
    def test_reproducible_cpu_evaluation_and_disjoint_groups(self):
        first = evaluate.evaluate()
        second = evaluate.evaluate()
        self.assertEqual(first, second)
        self.assertTrue(first["split"]["learnerDisjoint"])
        self.assertTrue(first["split"]["sourceRevisionDisjoint"])
        self.assertGreater(first["split"]["trainCount"], 100)
        self.assertGreater(first["split"]["evaluationCount"], 100)
        self.assertEqual(first["model"]["featureStandardization"], "training partition only")
        self.assertEqual(len(first["syntheticDataset"]["sha256"]), 64)

    def test_group_split_excludes_crossing_rows_instead_of_leaking(self):
        records, _ = evaluate.generate_synthetic_records(learners=80, sources=16, attempts=8)
        split = evaluate.disjoint_split(records)
        self.assertFalse({r["syntheticLearnerGroup"] for r in split["train"]} & {r["syntheticLearnerGroup"] for r in split["evaluation"]})
        self.assertFalse({r["event"]["sourceRevision"] for r in split["train"]} & {r["event"]["sourceRevision"] for r in split["evaluation"]})
        self.assertGreater(split["excludedCrossGroupRows"], 0)
        self.assertEqual(len(records), len(split["train"]) + len(split["evaluation"]) + split["excludedCrossGroupRows"])

    def test_current_and_future_labels_do_not_leak_into_current_features(self):
        records, _ = evaluate.generate_synthetic_records(learners=16, sources=8, attempts=10)
        learner = records[0]["syntheticLearnerGroup"]
        concept = records[0]["event"]["conceptId"]
        # Construct two strictly ordered attempts in one synthetic history.
        first = {"syntheticLearnerGroup": learner, "event": records[0]["event"] | {"conceptId": concept, "occurredAt": "2026-01-01T00:00:00Z", "correct": False}}
        second = {"syntheticLearnerGroup": learner, "event": records[0]["event"] | {"eventId": "synthetic-second", "conceptId": concept, "occurredAt": "2026-01-01T00:01:00Z", "correct": True}}
        before = evaluate._features_in_time_order([first, second])
        flipped_current = first | {"event": first["event"] | {"correct": True, "eventId": "different-event-id", "contextKey": "different-context"}}
        after = evaluate._features_in_time_order([flipped_current, second])
        self.assertEqual(before[0][0], after[0][0])
        self.assertNotEqual(before[1][0][1], after[1][0][1])  # prior outcome may inform the next attempt
        self.assertEqual(len(before[0][0]), len(evaluate.FEATURE_NAMES))
        self.assertNotIn("correct", evaluate.FEATURE_NAMES)
        self.assertNotIn("eventId", evaluate.FEATURE_NAMES)
        self.assertNotIn("contextKey", evaluate.FEATURE_NAMES)

    def test_unknown_help_and_absent_attempts_are_reported_as_missingness(self):
        report = evaluate.evaluate()
        self.assertGreater(report["missingness"]["unobservedScheduledAttempts"], 0)
        self.assertGreater(report["missingness"]["unknownHelpExposureEvents"], 0)
        self.assertTrue(report["missingness"]["missingHelpExposureFieldIsInvalid"])
        self.assertTrue(report["missingness"]["unobservedAttemptsAreNotLabeledAsIncorrect"])


if __name__ == "__main__":
    unittest.main()
