"""Local-only blueprint verification; does not run the app or access the network."""
import hashlib
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

CORE = Path(__file__).resolve().parent
PACK = CORE.parent
REPO = PACK.parents[1]


def run():
    issues = []
    checked = {"json": 0, "svg": 0, "markdown_relative_links": 0, "html_local_links": 0}
    files = sorted(p for p in PACK.rglob("*") if p.is_file() and "__pycache__" not in p.parts
                   and p.name not in {"verification.json", "KAIRO-BLUEPRINT.zip"})
    for p in files:
        if p.suffix == ".json":
            try:
                json.loads(p.read_text(encoding="utf-8-sig"))
                checked["json"] += 1
            except Exception as e:
                issues.append(f"JSON {p.relative_to(REPO)}: {type(e).__name__}")
        if p.suffix == ".svg":
            try:
                ET.parse(p)
                checked["svg"] += 1
            except Exception as e:
                issues.append(f"SVG {p.relative_to(REPO)}: {type(e).__name__}")
        if p.suffix == ".md":
            content = p.read_text(encoding="utf-8")
            for target in re.findall(r"\]\(([^\s)]+)\)", content):
                if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:", target) or target.startswith("#"):
                    continue
                target = target.split("#")[0].strip("<>")
                checked["markdown_relative_links"] += 1
                if target and not (p.parent / target).exists():
                    issues.append(f"Missing link {p.relative_to(REPO)} -> {target}")
    portal = CORE / "index.html"
    for target in re.findall(r'(?:href|src)="([^"]+)"', portal.read_text(encoding="utf-8")):
        if not re.match(r"^(?:https?:|#|data:)", target):
            checked["html_local_links"] += 1
            if not (portal.parent / target).exists():
                issues.append(f"Portal missing {target}")
    asset = REPO / "studio/public/models/character/kairo-teacher.glb"
    actual_hash = hashlib.sha256(asset.read_bytes()).hexdigest()
    expected = "5c3aacb1cb7df2a729ab763306420255ea37404d3b8ccd2b2602ea27b19ee6af"
    if actual_hash != expected or asset.stat().st_size != 3424844:
        issues.append("Character checkpoint changed; re-review owner handoff before integration")
    receipt = {
        "schema": "kairo-blueprint-verification/1", "date": "2026-10-22",
        "checks": checked, "issues": issues, "passed": not issues,
        "characterCheckpoint": {"bytes": asset.stat().st_size, "sha256": actual_hash,
                                "matchesOwnerBuild6": actual_hash == expected},
        "costTests": {"command": "python -m unittest discover -s docs/blueprint/core -p test_cost.py -v",
                      "result": "6 passed independently by root; cost arithmetic only"},
        "architecture": {"source": "../visuals/kairo-target-architecture.architecture.json",
                         "ownerEvidence": "9 showcase checks passed; 0 errors/warnings; root revalidation recorded in handoff"},
        "limits": ["No current application build or runtime test: runtime unchanged by this package",
                   "No browser, real audio, phone, language quality or learning validation",
                   "Provider/account balances and quotas not refreshed live",
                   "Mermaid source provided; not a claim that every Mermaid diagram was rendered",
                   "No deployment, model download, training or paid API calls in this run"],
        "files": [{"path": str(p.relative_to(REPO)).replace("\\", "/"),
                   "bytes": p.stat().st_size, "sha256": hashlib.sha256(p.read_bytes()).hexdigest()}
                  for p in files]
    }
    (CORE / "verification.json").write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"passed": not issues, "checks": checked, "issues": issues, "files": len(files)}, indent=2))
    return 0 if not issues else 1


if __name__ == "__main__":
    sys.exit(run())
