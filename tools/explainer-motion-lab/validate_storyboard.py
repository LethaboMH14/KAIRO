"""Validate a deterministic, source-linked explainer storyboard contract."""
import json
from pathlib import Path


def validate(spec: dict) -> None:
    errors = []
    if spec.get("schemaVersion") != 1:
        errors.append("schemaVersion must be 1")
    duration = spec.get("durationSeconds")
    fps = spec.get("fps")
    if not isinstance(duration, int) or not 6 <= duration <= 10:
        errors.append("durationSeconds must be an integer from 6 through 10")
    if not isinstance(fps, int) or not 1 <= fps <= 60:
        errors.append("fps must be an integer from 1 through 60")
    if not isinstance(spec.get("width"), int) or not isinstance(spec.get("height"), int):
        errors.append("width and height must be integers")
    sources = spec.get("sources", [])
    ids = [s.get("id") for s in sources]
    if len(ids) != len(set(ids)) or not ids or any(not s.get("title") or not s.get("locator") or not s.get("shortCitation") or not s.get("url", "").startswith("https://") for s in sources):
        errors.append("sources need unique ids, titles, locators and HTTPS URLs")
    scene_ids = []
    cursor = 0
    for scene in spec.get("scenes", []):
        scene_ids.append(scene.get("id"))
        start, end = scene.get("start"), scene.get("end")
        if start != cursor or not isinstance(end, int) or end <= start:
            errors.append(f"scene {scene.get('id')} has a gap, overlap or non-positive duration")
        if not scene.get("headline") or not scene.get("detail") or not scene.get("caption"):
            errors.append(f"scene {scene.get('id')} needs headline, detail and caption")
        refs = scene.get("sourceRefIds", [])
        if not refs or any(ref not in ids for ref in refs):
            errors.append(f"scene {scene.get('id')} has missing or unknown source references")
        if not scene.get("sourceRefIds"):
            errors.append(f"scene {scene.get('id')} needs visible source references")
        if isinstance(end, int):
            cursor = end
    if not scene_ids or len(scene_ids) != len(set(scene_ids)):
        errors.append("scenes need unique ids and at least one scene")
    if duration and cursor != duration:
        errors.append("scene timings must cover the declared duration exactly")
    if not spec.get("claimBoundary"):
        errors.append("claimBoundary is required")
    if spec.get("audio") != "none":
        errors.append("this bounded renderer accepts silent output only")
    if errors:
        raise ValueError("; ".join(errors))


def load(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    validate(data)
    return data


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("storyboard", type=Path)
    args = parser.parse_args()
    spec = load(args.storyboard)
    print(f"valid: {len(spec['scenes'])} scenes, {spec['durationSeconds']} seconds, {len(spec['sources'])} cited sources")
