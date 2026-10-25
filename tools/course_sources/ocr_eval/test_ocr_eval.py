import math
import unittest

import ocr_eval
from ocr_eval import check_critical_tokens, evaluate_pages, score_text, validate_provenance


def record(**overrides):
    value = {
        "source_id": "a" * 24,
        "source_role": "unknown",
        "page": 1,
        "method": "synthetic-test",
        "page_text": "Sample +3.5 answer",
        "start": 7,
        "end": 11,
        "excerpt": "+3.5",
        "score_scope": "excerpt",
        "reference_text": "+3.5",
        "recognized_text": "+3.5",
        "critical_tokens": [{"label": "signed decimal", "reference": "+3.5", "recognized": "+3.5"}],
        "status": "success",
    }
    value.update(overrides)
    return value


class OcrEvalTests(unittest.TestCase):
    def test_cer_wer_preserve_symbols_and_allow_insertions_over_one_hundred_percent(self):
        result = score_text("A+", "A+XYZ")
        self.assertTrue(result["available"])
        self.assertEqual(result["characterErrors"], 3)
        self.assertEqual(result["cer"], 1.5)
        self.assertGreater(score_text("word", "word extra inserted")["wer"], 1.0)
        self.assertIn("signs", result["normalization"])
        self.assertEqual(score_text("Café", "Cafe\u0301")["cer"], 0.0)
        self.assertEqual(score_text("SQL, option 2", "SQL option 2")["characterErrors"], 1)

    def test_empty_reference_and_workload_caps_are_unavailable(self):
        empty = score_text(" \t\n", "insertions")
        self.assertFalse(empty["available"])
        self.assertEqual(empty["cer"], None)
        too_large = score_text("x" * 1100, "y" * 1100)
        self.assertFalse(too_large["available"])
        self.assertEqual(too_large["errorCode"], "edit-budget")
        over_limit = score_text("x" * 20_001, "x")
        self.assertEqual(over_limit["errorCode"], "text-limit")

    def test_critical_tokens_are_exact_and_never_echoed(self):
        result = check_critical_tokens([
            {"label": "sign", "reference": "−", "recognized": "-"},
            {"label": "option", "reference": "B)", "recognized": "B)"},
        ])
        self.assertEqual([row["exact"] for row in result["checks"]], [False, True])
        self.assertNotIn("reference", str(result))
        self.assertFalse(check_critical_tokens([{"label": "x", "reference": "1", "recognized": 1}])["available"])
        self.assertEqual(check_critical_tokens([{}])["checks"], [])

    def test_offsets_and_page_role_are_validated_without_returning_source_text_or_paths(self):
        result = validate_provenance(record(source_role="student-response", path="private/path.pdf"))
        self.assertTrue(result["valid"])
        self.assertEqual(result["sourceRole"], "student-response")
        self.assertEqual(result["sourceId"], "a" * 24)
        self.assertNotIn("path", str(result))
        self.assertNotIn("Sample", str(result))
        self.assertIn("offset-mismatch", validate_provenance(record(excerpt="wrong"))["errorCodes"])
        self.assertIn("page-invalid", validate_provenance(record(page=float("inf")))["errorCodes"])
        self.assertIn("source-role-invalid", validate_provenance(record(source_role="answer-key"))["errorCodes"])
        self.assertIsNone(validate_provenance(record(source_id="arbitrary filename.pdf"))["sourceId"])

    def test_geometry_requires_finite_bounded_points_and_positive_dimensions(self):
        good = record(page_width=100, page_height=80, polygons=[[[0, 0], [10, 0], [10, 5], [0, 5]]])
        self.assertTrue(validate_provenance(good)["geometryAvailable"])
        for invalid in [
            record(page_width=0, page_height=80, polygons=[[[0, 0], [10, 0], [10, 5]]]),
            record(page_width=100, page_height=80, polygons=[[[0, 0], [math.inf, 0], [10, 5]]]),
            record(page_width=100, page_height=80, polygons=[[[-1, 0], [10, 0], [10, 5]]]),
            record(page_width=100, page_height=80, polygons=[[[0, 0], [10, 0]]]),
        ]:
            self.assertFalse(validate_provenance(invalid)["valid"])

    def test_per_page_attempt_counts_include_failures_and_output_is_text_free(self):
        result = evaluate_pages([
            record(source_role="reference-transcription"),
            {"source_id": "b" * 24, "source_role": "unknown", "page": 2, "method": "rapidocr-onnxruntime-1.4.4", "status": "failure", "error_code": "ocr_timeout"},
            record(start=999),
            record(reference_text="", recognized_text="extra"),
        ])
        self.assertEqual(result["attemptedPages"], 4)
        self.assertEqual(result["evaluatedPages"], 1)
        self.assertEqual(result["failedPages"], 2)
        self.assertEqual(result["unavailablePages"], 1)
        self.assertEqual(result["pages"][1]["status"], "failed")
        self.assertEqual(result["pages"][1]["errorCodes"], ["ocr_timeout"])
        serialized = str(result)
        self.assertNotIn("Sample", serialized)
        self.assertNotIn("+3.5", serialized)
        self.assertNotIn("path", serialized)
        self.assertEqual(result["pages"][0]["sourceRole"], "reference-transcription")
        secret_failure = evaluate_pages([{"source_id": "c" * 24, "source_role": "unknown", "page": 1, "method": "rapidocr-onnxruntime-1.4.4", "status": "failure", "error_code": "C:/private/name.pdf"}])
        self.assertEqual(secret_failure["pages"][0]["errorCodes"], ["processing_failed"])
        self.assertNotIn("private", str(secret_failure))

    def test_scoring_candidate_must_match_the_checked_page_or_excerpt(self):
        excerpt = evaluate_pages([record()])
        self.assertEqual(excerpt["evaluatedPages"], 1)
        self.assertEqual(excerpt["pages"][0]["metrics"]["cer"], 0.0)

        page_record = record(
            page_text="Signed amount: +3.5",
            start=15,
            end=19,
            excerpt="+3.5",
            score_scope="page",
            reference_text="Signed amount: +3.5",
            recognized_text="Signed amount: +3.5",
        )
        self.assertEqual(evaluate_pages([page_record])["evaluatedPages"], 1)
        mismatch = evaluate_pages([record(recognized_text="unrelated perfect text")])
        self.assertEqual(mismatch["pages"][0]["status"], "unavailable")
        self.assertEqual(mismatch["pages"][0]["errorCodes"], ["candidate-scope-mismatch"])
        self.assertNotIn("unrelated", str(mismatch))

    def test_aggregate_batch_budget_is_all_or_unavailable_at_exact_boundary(self):
        rows = [record(), record(source_id="b" * 24)]
        # Each row has 4*4 character cells plus one word cell = 17; exact total is 34.
        original_budget = ocr_eval.MAX_BATCH_EDIT_CELLS
        try:
            ocr_eval.MAX_BATCH_EDIT_CELLS = 34
            exact = evaluate_pages(rows)
            self.assertEqual(exact["evaluatedPages"], 2)
            ocr_eval.MAX_BATCH_EDIT_CELLS = 33
            over = evaluate_pages(rows)
            self.assertEqual(over["attemptedPages"], 2)
            self.assertEqual(over["evaluatedPages"], 0)
            self.assertEqual(over["unavailablePages"], 2)
            self.assertEqual([page["errorCodes"] for page in over["pages"]], [["batch-edit-budget"]] * 2)
        finally:
            ocr_eval.MAX_BATCH_EDIT_CELLS = original_budget

    def test_page_limit_counts_all_attempted_rows_without_truncating_to_a_false_success(self):
        result = evaluate_pages([{}] * 1001)
        self.assertEqual(result["attemptedPages"], 1001)
        self.assertEqual(result["unavailablePages"], 1001)
        self.assertEqual(result["pages"], [])
        self.assertEqual(result["errorCodes"], ["page-limit"])


if __name__ == "__main__":
    unittest.main()
