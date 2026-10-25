"""Offline scenario arithmetic. Reads no credentials and calls no providers."""
import argparse
import json
import math
from pathlib import Path


def calculate(p):
    required = {
        "learner_hours", "characters_per_narrated_hour", "narration_fraction",
        "reuse_fraction", "microphone_fraction", "channels", "tts_per_million",
        "tts_remaining_allowance_chars", "stt_v2_per_minute",
        "infrastructure_allowance", "generation_allowance", "other_allowance"
    }
    if set(p) != required:
        raise ValueError("Scenario keys must match the documented parameter set.")
    for key, value in p.items():
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0:
            raise ValueError(f"Invalid nonnegative finite number: {key}")
    for key in ("narration_fraction", "reuse_fraction", "microphone_fraction"):
        if p[key] > 1:
            raise ValueError(f"Fraction exceeds one: {key}")
    if p["channels"] < 1 or int(p["channels"]) != p["channels"]:
        raise ValueError("channels must be a positive integer")
    chars = p["learner_hours"] * p["characters_per_narrated_hour"] * p["narration_fraction"] * (1 - p["reuse_fraction"])
    minutes = p["learner_hours"] * 60 * p["microphone_fraction"] * p["channels"]
    tts = max(0, chars - p["tts_remaining_allowance_chars"]) / 1_000_000 * p["tts_per_million"]
    stt = minutes * p["stt_v2_per_minute"]
    allocations = sum(p[k] for k in ("infrastructure_allowance", "generation_allowance", "other_allowance"))
    return {
        "new_tts_characters": round(chars, 3),
        "submitted_stt_channel_minutes": round(minutes, 3),
        "tts_usd": round(tts, 4), "stt_usd": round(stt, 4),
        "engineering_allocations_usd": round(allocations, 4),
        "gross_planning_total_usd": round(tts + stt + allocations, 4),
        "warning": "Scenario only; excludes listed costs, quota/SKU eligibility and live credit state."
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("scenario", nargs="?", type=Path, default=Path(__file__).with_name("cost-scenarios.json"))
    args = parser.parse_args()
    payload = json.loads(args.scenario.read_text(encoding="utf-8"))
    print(json.dumps(calculate(payload["parameters"]), indent=2))
