"""Deterministic example KAIRO loop cost calculator. Standard library only."""
from __future__ import annotations

import json

RATE_INPUT = 0.30       # USD per 1M tokens; Gemini 3.5 Flash-Lite Standard PayGo, Global
RATE_OUTPUT = 2.50      # USD per 1M tokens; Gemini 3.5 Flash-Lite Standard PayGo, Global
RATE_TTS = 30.0         # USD per 1M chars; Chirp 3 HD after included monthly tier


def component(name: str, calls: int, input_each: int, output_each: int) -> dict:
    input_cost = calls * input_each * RATE_INPUT / 1_000_000
    output_cost = calls * output_each * RATE_OUTPUT / 1_000_000
    return {
        "name": name, "calls": calls,
        "input_tokens_each_assumed": input_each,
        "output_tokens_each_assumed": output_each,
        "input_cost_usd": round(input_cost, 9),
        "output_cost_usd": round(output_cost, 9),
        "total_usd": round(input_cost + output_cost, 9),
    }


def scenario(name: str, lesson_in: int, lesson_out: int, help_calls: int,
             help_in: int, help_out: int, guide_calls: int, guide_in: int,
             guide_out: int, chars: int) -> dict:
    parts = [component("lesson", 1, lesson_in, lesson_out),
             component("passage_help", help_calls, help_in, help_out),
             component("guide", guide_calls, guide_in, guide_out)]
    llm = sum(p["total_usd"] for p in parts)
    tts = chars * RATE_TTS / 1_000_000
    return {
        "name": name, "components": parts,
        "llm_total_usd": round(llm, 9),
        "tts_characters_assumed": chars,
        "tts_cost_usd": round(tts, 9),
        "total_usd": round(llm + tts, 9),
        "scope": "Illustrative variable model and hosted speech only; excludes hosting, storage, delivery, support, payment, tax, retries and labor.",
    }


def main() -> None:
    typical = scenario("typical", 3500, 1500, 2, 1200, 400, 4, 500, 120, 8000)
    stress = scenario("stress", 5000, 4500, 2, 3000, 1100, 4, 1000, 256, 20000)
    # Explicitly model retries of every model action plus fresh TTS synthesis.
    stress_retry = dict(stress)
    stress_retry["name"] = "stress_one_retry_of_each_model_action_and_fresh_tts"
    stress_retry["components"] = [dict(p, calls=p["calls"] * 2,
                                         input_cost_usd=round(p["input_cost_usd"] * 2, 9),
                                         output_cost_usd=round(p["output_cost_usd"] * 2, 9),
                                         total_usd=round(p["total_usd"] * 2, 9))
                                  for p in stress["components"]]
    stress_retry["llm_total_usd"] = round(stress["llm_total_usd"] * 2, 9)
    stress_retry["tts_characters_assumed"] *= 2
    stress_retry["tts_cost_usd"] = round(stress["tts_cost_usd"] * 2, 9)
    stress_retry["total_usd"] = round(stress["total_usd"] * 2, 9)
    print(json.dumps({
        "pricing_basis": {
            "model": "Gemini 3.5 Flash-Lite Standard PayGo, Global",
            "input_usd_per_million_tokens": RATE_INPUT,
            "output_usd_per_million_tokens": RATE_OUTPUT,
            "chirp3_hd_usd_per_million_characters_after_monthly_included_tier": RATE_TTS,
            "pricing_review_date": "2026-10-24",
            "rates_url": "https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing",
            "tts_url": "https://cloud.google.com/text-to-speech/pricing",
        },
        "scenarios": [typical, stress, stress_retry],
    }, indent=2))


if __name__ == "__main__":
    main()
