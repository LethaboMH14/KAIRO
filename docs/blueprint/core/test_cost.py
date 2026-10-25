import json
import unittest
from pathlib import Path
from calculate_cost import calculate


class CostScenarioTests(unittest.TestCase):
    def setUp(self):
        self.p = json.loads(Path(__file__).with_name("cost-scenarios.json").read_text(encoding="utf-8"))["parameters"]

    def test_conservative_100_hours(self):
        result = calculate(self.p)
        self.assertEqual(result["tts_usd"], 135)
        self.assertEqual(result["stt_usd"], 9.6)
        self.assertEqual(result["gross_planning_total_usd"], 224.6)

    def test_80_percent_eligible_reuse(self):
        self.p["reuse_fraction"] = .8
        self.assertEqual(calculate(self.p)["gross_planning_total_usd"], 116.6)

    def test_explicit_remaining_quota_not_negative_cost(self):
        self.p["tts_remaining_allowance_chars"] = 1_000_000
        self.assertEqual(calculate(self.p)["tts_usd"], 105)
        self.p["tts_remaining_allowance_chars"] = 9_000_000
        self.assertEqual(calculate(self.p)["tts_usd"], 0)

    def test_continuous_mic_and_multichannel_cost(self):
        self.p["microphone_fraction"] = 1
        self.assertEqual(calculate(self.p)["stt_usd"], 96)
        self.p["channels"] = 2
        self.assertEqual(calculate(self.p)["stt_usd"], 192)

    def test_no_usage_still_has_standing_allocations(self):
        self.p["learner_hours"] = 0
        self.assertEqual(calculate(self.p)["gross_planning_total_usd"], 80)

    def test_reject_unbounded_or_invalid_numbers(self):
        for value in (float("nan"), float("inf"), -1, True, "100"):
            with self.subTest(value=value):
                with self.assertRaises(ValueError):
                    calculate({**self.p, "learner_hours": value})
        for key, value in (("reuse_fraction", 1.01), ("channels", .5), ("channels", 1.5)):
            with self.assertRaises(ValueError):
                calculate({**self.p, key: value})


if __name__ == "__main__":
    unittest.main()
