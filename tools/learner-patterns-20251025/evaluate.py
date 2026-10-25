"""Synthetic-only, dependency-free online logistic baseline for KAIRO events.

No real learner data is read. Synthetic learner/source grouping metadata stays
outside the minimized event payload and is used only to form a disjoint split.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import random
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path

SEED = 20261025
EVENT_SCHEMA_VERSION = 1
FEATURE_NAMES = (
    "history_count_capped", "history_correct_smoothed", "history_independent_smoothed",
    "help_hint", "help_worked_example", "help_unknown", "assessment_recall", "assessment_transfer",
)


def _sigmoid(value: float) -> float:
    if value >= 0:
        z = math.exp(-min(value, 40))
        return 1 / (1 + z)
    z = math.exp(max(value, -40))
    return z / (1 + z)


def _opaque_digest(seed: int, group: str) -> int:
    raw = f"{seed}:{group}".encode("utf-8")
    return int.from_bytes(hashlib.sha256(raw).digest()[:8], "big")


def _timestamp(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def generate_synthetic_records(seed: int = SEED, learners: int = 160, sources: int = 24, attempts: int = 16):
    """Generate deterministic synthetic attempts with no real identifiers/data."""
    rng = random.Random(seed)
    base_time = datetime(2026, 1, 1, tzinfo=timezone.utc)
    source_difficulty = {f"synthetic-source-r{i:02d}": rng.gauss(0, .65) for i in range(sources)}
    concept_difficulty = {f"concept-{i:02d}": rng.gauss(0, .35) for i in range(8)}
    rows = []
    missing_attempts = 0
    unknown_help = 0
    for learner_index in range(learners):
        learner_group = f"synthetic-learner-{learner_index:04d}"
        ability = rng.gauss(0, .8)
        concept_mastery = {concept: rng.gauss(0, .45) for concept in concept_difficulty}
        for attempt_index in range(attempts):
            # Simulate an unobserved-attempt rate explicitly; no placeholder event
            # or synthetic label is created for a missing observation.
            if rng.random() < .06:
                missing_attempts += 1
                continue
            source_revision = f"synthetic-source-r{rng.randrange(sources):02d}"
            concept_id = f"concept-{rng.randrange(8):02d}"
            assessment_kind = rng.choices(("practice", "recall", "transfer"), (0.62, .25, .13))[0]
            help_exposure = rng.choices(("none", "hint", "worked-example", "unknown"), (.58, .20, .12, .10))[0]
            unknown_help += help_exposure == "unknown"
            assessment_effect = {"practice": .12, "recall": -.16, "transfer": -.30}[assessment_kind]
            help_effect = {"none": 0, "hint": .15, "worked-example": .38, "unknown": 0}[help_exposure]
            logit = ability + concept_mastery[concept_id] + source_difficulty[source_revision] + assessment_effect + help_effect
            correct = rng.random() < _sigmoid(logit)
            at = base_time + timedelta(days=learner_index, minutes=attempt_index * 30)
            event_id = f"synthetic-event-{learner_index:04d}-{attempt_index:03d}"
            rows.append({
                "syntheticLearnerGroup": learner_group,
                "syntheticSourceGroup": source_revision,
                "event": {
                    "schemaVersion": EVENT_SCHEMA_VERSION,
                    "eventId": event_id,
                    "lessonId": f"synthetic-lesson-{source_revision}",
                    "sourceRevision": source_revision,
                    "conceptId": concept_id,
                    "taskId": f"synthetic-task-{attempt_index % 6:02d}",
                    "taskRevision": "synthetic-task-r1",
                    "rubricRevision": "synthetic-rubric-r1",
                    "occurredAt": _timestamp(at),
                    "correct": bool(correct),
                    "helpExposure": help_exposure,
                    "contextKey": f"synthetic-context-{attempt_index % 5:02d}",
                    "assessmentKind": assessment_kind,
                },
            })
    return rows, {"scheduledAttempts": learners * attempts, "unobservedAttempts": missing_attempts,
                  "observedAttempts": len(rows), "unknownHelpExposure": unknown_help}


def disjoint_split(records, seed: int = SEED, test_fraction: float = .5):
    """Split by both synthetic learner and source-revision groups.

    Cross-partition learner/source combinations are excluded, never moved across
    a boundary. This keeps every learner and every source revision exclusive to
    one side. Returned keys contain no event-level identity information.
    """
    if not 0 < test_fraction < 1:
        raise ValueError("test_fraction must be between zero and one")
    learners = sorted({row["syntheticLearnerGroup"] for row in records})
    sources = sorted({row["event"]["sourceRevision"] for row in records})
    if min(len(learners), len(sources)) < 2:
        raise ValueError("at least two learner groups and source revisions are required")

    def test_groups(values):
        ordered = sorted(values, key=lambda value: (_opaque_digest(seed, value), value))
        count = min(len(values) - 1, max(1, round(len(values) * test_fraction)))
        return set(ordered[:count])

    learner_test = test_groups(learners)
    source_test = test_groups(sources)
    train, evaluation = [], []
    cross_excluded = 0
    for row in records:
        learner_is_test = row["syntheticLearnerGroup"] in learner_test
        source_is_test = row["event"]["sourceRevision"] in source_test
        if learner_is_test == source_is_test:
            (evaluation if learner_is_test else train).append(row)
        else:
            cross_excluded += 1
    train_learners = {row["syntheticLearnerGroup"] for row in train}
    test_learners = {row["syntheticLearnerGroup"] for row in evaluation}
    train_sources = {row["event"]["sourceRevision"] for row in train}
    test_sources = {row["event"]["sourceRevision"] for row in evaluation}
    if not train or not evaluation or train_learners & test_learners or train_sources & test_sources:
        raise ValueError("could not produce non-empty learner/source-disjoint partitions")
    return {"train": train, "evaluation": evaluation, "excludedCrossGroupRows": cross_excluded,
            "trainLearnerGroups": sorted(train_learners), "evaluationLearnerGroups": sorted(test_learners),
            "trainSourceRevisions": sorted(train_sources), "evaluationSourceRevisions": sorted(test_sources)}


def _features_in_time_order(records):
    """Create pre-attempt history features; never read current/future correctness."""
    ordered = sorted(records, key=lambda row: (row["event"]["occurredAt"], row["event"]["eventId"]))
    history = defaultdict(lambda: {"n": 0, "correct": 0, "independent_n": 0, "independent_correct": 0})
    output = []
    for row in ordered:
        event = row["event"]
        key = (row["syntheticLearnerGroup"], event["conceptId"])
        prior = history[key]
        help_kind = event["helpExposure"]
        assessment = event["assessmentKind"]
        x = [
            min(prior["n"], 10) / 10,
            (prior["correct"] + 1) / (prior["n"] + 2),
            (prior["independent_correct"] + 1) / (prior["independent_n"] + 2),
            float(help_kind == "hint"), float(help_kind == "worked-example"), float(help_kind == "unknown"),
            float(assessment == "recall"), float(assessment == "transfer"),
        ]
        # The target is added only after the current feature vector is frozen.
        output.append((x, int(event["correct"])))
        prior["n"] += 1
        prior["correct"] += int(event["correct"])
        if help_kind == "none":
            prior["independent_n"] += 1
            prior["independent_correct"] += int(event["correct"])
    return output


def _standardize(train_x, eval_x):
    columns = len(FEATURE_NAMES)
    means = [sum(row[j] for row in train_x) / len(train_x) for j in range(columns)]
    scales = []
    for j in range(columns):
        variance = sum((row[j] - means[j]) ** 2 for row in train_x) / len(train_x)
        scales.append(math.sqrt(variance) or 1.0)
    def transform(rows):
        return [[(row[j] - means[j]) / scales[j] for j in range(columns)] for row in rows]
    return transform(train_x), transform(eval_x)


def train_logistic(train, epochs: int = 500, learning_rate: float = .12, l2: float = .04):
    if len(train) < 2:
        raise ValueError("at least two training observations required")
    train_x = [x for x, _ in train]
    labels = [y for _, y in train]
    mean = sum(labels) / len(labels)
    if mean in (0, 1):
        mean = .5
    weights = [0.0] * (len(FEATURE_NAMES) + 1)
    weights[0] = math.log(mean / (1 - mean))
    for epoch in range(epochs):
        gradient = [0.0] * len(weights)
        for x, label in train:
            vector = [1.0] + x
            error = _sigmoid(sum(w * v for w, v in zip(weights, vector))) - label
            for j, value in enumerate(vector):
                gradient[j] += error * value
        rate = learning_rate / math.sqrt(1 + epoch / 20)
        for j in range(len(weights)):
            grad = gradient[j] / len(train) + (l2 * weights[j] if j else 0)
            weights[j] -= rate * grad
    return weights


def _metrics(labels, probabilities, baseline_probability):
    eps = 1e-12
    brier = sum((p - y) ** 2 for y, p in zip(labels, probabilities)) / len(labels)
    log_loss = -sum(y * math.log(max(eps, p)) + (1-y) * math.log(max(eps, 1-p)) for y, p in zip(labels, probabilities)) / len(labels)
    accuracy = sum((p >= .5) == bool(y) for y, p in zip(labels, probabilities)) / len(labels)
    baseline_brier = sum((baseline_probability-y)**2 for y in labels) / len(labels)
    return {"count": len(labels), "accuracyAtHalf": accuracy, "brier": brier,
            "logLoss": log_loss, "constantTrainingPrevalenceBrier": baseline_brier}


def evaluate(seed: int = SEED):
    records, missing = generate_synthetic_records(seed=seed)
    split = disjoint_split(records, seed=seed)
    train_pairs = _features_in_time_order(split["train"])
    eval_pairs = _features_in_time_order(split["evaluation"])
    train_y = [y for _, y in train_pairs]
    eval_y = [y for _, y in eval_pairs]
    train_x, eval_x = _standardize([x for x, _ in train_pairs], [x for x, _ in eval_pairs])
    # Fit only on training-standardized rows; evaluation rows use the same
    # training means/scales and never influence preprocessing.
    weights = train_logistic(list(zip(train_x, train_y)))
    probabilities = [_sigmoid(sum(w*v for w, v in zip(weights, [1.0] + x))) for x in eval_x]
    train_prevalence = sum(train_y) / len(train_y)
    unknown_count = sum(row["event"]["helpExposure"] == "unknown" for row in records)
    fingerprint = hashlib.sha256(json.dumps(records, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    return {
        "schemaVersion": 1,
        "label": "synthetic-only CPU baseline; not a learner prediction or efficacy result",
        "seed": seed,
        "syntheticDataset": {**missing, "sha256": fingerprint,
            "unknownHelpExposureRate": unknown_count / len(records) if records else 0},
        "split": {"method": "independent deterministic hash partition by synthetic learner group and source revision; crossing rows excluded",
            "trainCount": len(split["train"]), "evaluationCount": len(split["evaluation"]),
            "excludedCrossGroupRows": split["excludedCrossGroupRows"],
            "trainLearnerGroups": len(split["trainLearnerGroups"]), "evaluationLearnerGroups": len(split["evaluationLearnerGroups"]),
            "trainSourceRevisions": len(split["trainSourceRevisions"]), "evaluationSourceRevisions": len(split["evaluationSourceRevisions"]),
            "learnerDisjoint": not (set(split["trainLearnerGroups"]) & set(split["evaluationLearnerGroups"])),
            "sourceRevisionDisjoint": not (set(split["trainSourceRevisions"]) & set(split["evaluationSourceRevisions"]))},
        "features": list(FEATURE_NAMES),
        "excludedFromFeatures": ["eventId", "lessonId", "sourceRevision", "conceptId", "taskId", "taskRevision", "rubricRevision", "occurredAt", "correct", "contextKey", "syntheticLearnerGroup", "syntheticSourceGroup"],
        "evaluation": _metrics(eval_y, probabilities, train_prevalence),
        "interpretation": "Synthetic partitions share a generated mechanism only. Metrics demonstrate reproducible code execution, not held-out real-learner performance, learning, mastery, fairness, or commercial value.",
        "missingness": {"unobservedScheduledAttempts": missing["unobservedAttempts"], "unknownHelpExposureEvents": unknown_count,
            "missingHelpExposureFieldIsInvalid": True, "unobservedAttemptsAreNotLabeledAsIncorrect": True},
        "model": {"kind": "standard-library logistic regression", "epochs": 500, "learningRate": .12, "l2": .04,
            "featureStandardization": "training partition only", "history": "strictly prior attempts for same synthetic learner and concept within each partition"},
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", type=int, default=SEED)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    report = json.dumps(evaluate(args.seed), indent=2, sort_keys=True) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(report, encoding="utf-8")
    else:
        print(report, end="")


if __name__ == "__main__":
    main()
