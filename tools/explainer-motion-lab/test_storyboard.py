import copy
import unittest
from pathlib import Path

from validate_storyboard import load, validate

ROOT = Path(__file__).parent


class StoryboardTests(unittest.TestCase):
    def test_motor_storyboard_is_valid_and_eight_seconds(self):
        spec = load(ROOT / "storyboard.json")
        self.assertEqual(spec["durationSeconds"], 8)
        self.assertEqual(len(spec["scenes"]), 4)

    def test_gap_is_rejected(self):
        spec = copy.deepcopy(load(ROOT / "storyboard.json"))
        spec["scenes"][1]["start"] = 3
        with self.assertRaisesRegex(ValueError, "gap"):
            validate(spec)

    def test_missing_citation_is_rejected(self):
        spec = copy.deepcopy(load(ROOT / "storyboard.json"))
        spec["scenes"][0]["sourceRefIds"] = ["not-a-source"]
        with self.assertRaisesRegex(ValueError, "source references"):
            validate(spec)

    def test_duplicate_source_ids_are_rejected(self):
        spec = copy.deepcopy(load(ROOT / "storyboard.json"))
        spec["sources"][1]["id"] = spec["sources"][0]["id"]
        with self.assertRaisesRegex(ValueError, "unique ids"):
            validate(spec)

    def test_wrong_duration_and_audio_are_rejected(self):
        spec = copy.deepcopy(load(ROOT / "storyboard.json"))
        spec["durationSeconds"] = 12
        spec["audio"] = "generated"
        with self.assertRaisesRegex(ValueError, "durationSeconds.*silent output"):
            validate(spec)


if __name__ == "__main__":
    unittest.main()
