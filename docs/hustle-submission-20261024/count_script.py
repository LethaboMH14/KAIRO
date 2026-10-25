"""Count the timed spoken lines in README.md and save auditable JSON evidence."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).parent
source = ROOT / "README.md"
text = source.read_text(encoding="utf-8")
section = text.split("### Word count and timing", 1)[1].split(
    "## Separate cinematic alternative", 1
)[0]
line_pattern = re.compile(
    r"\|\s*(\d+)–(\d+)s\s*\|\s*(Entrant|KAIRO)\s*\|\s*“(.+?)”\s*\|\s*(\d+)\s*\|$"
)
word_pattern = re.compile(r"\b[\w]+(?:['’][\w]+)?\b")
lines = []
for line in section.splitlines():
    match = line_pattern.match(line)
    if not match:
        continue
    start, end, speaker, spoken, declared = match.groups()
    words = word_pattern.findall(spoken)
    lines.append(
        {
            "start_s": int(start),
            "end_s": int(end),
            "slot_seconds": int(end) - int(start),
            "speaker": speaker,
            "spoken_line": spoken,
            "words": words,
            "word_count": len(words),
            "declared_count": int(declared),
            "count_matches": len(words) == int(declared),
        }
    )
if not lines:
    raise SystemExit("No timed script rows found")

totals = {}
for item in lines:
    total = totals.setdefault(item["speaker"], {"words": 0, "slot_seconds": 0, "rows": 0})
    total["words"] += item["word_count"]
    total["slot_seconds"] += item["slot_seconds"]
    total["rows"] += 1

result = {
    "source_file": "README.md",
    "method": "Timed spoken table rows; Unicode word tokens, contractions count as one.",
    "lines": lines,
    "speaker_totals": totals,
    "total_words": sum(item["word_count"] for item in lines),
    "total_slot_seconds": sum(item["slot_seconds"] for item in lines),
    "all_declared_counts_match": all(item["count_matches"] for item in lines),
    "timing_note": "Allocated slot duration only; not a measured spoken delivery or pause duration.",
}
(ROOT / "script-count-evidence.json").write_text(
    json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)
print(json.dumps(result, ensure_ascii=False, indent=2))
