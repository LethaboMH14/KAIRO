"""Local, in-memory OCR evaluation helpers. No file, network, or answer-key access."""
from __future__ import annotations

import math
import re
import unicodedata
from collections.abc import Mapping, Sequence
from typing import Any

MAX_TEXT_CHARS = 20_000
MAX_EDIT_CELLS = 1_000_000
MAX_BATCH_EDIT_CELLS = 1_000_000
MAX_WORDS = 5_000
MAX_PAGES = 1_000
MAX_CRITICAL_TOKENS = 100
MAX_CRITICAL_LENGTH = 500
MAX_POLYGONS = 100
MAX_POINTS_PER_POLYGON = 100
SOURCE_ROLES = {"unknown", "student-response", "reference-transcription"}
METHODS = {"pypdf-text", "rapidocr-onnxruntime-1.4.4", "windows-ocr", "python-docx", "openpyxl-read-only", "pptx-slide-text", "utf8-text", "synthetic-test"}
SAFE_FAILURE_CODES = {"ocr_timeout", "ocr_failed", "render_failed", "unsupported_input", "encrypted_input", "empty_output", "processing_failed"}
NORMALIZATION = "Unicode NFC; collapse whitespace runs to one ASCII space; preserve case, punctuation, digits, signs and symbols"
_SOURCE_ID = re.compile(r"^[a-f0-9]{24}$")


def _normalise(value: str) -> str:
    return " ".join(unicodedata.normalize("NFC", value).split())


def _edit_distance(left: Sequence[Any], right: Sequence[Any]) -> int:
    """Levenshtein distance with O(min(n, m)) auxiliary memory."""
    if len(left) < len(right):
        left, right = right, left
    previous = list(range(len(right) + 1))
    for i, left_item in enumerate(left, 1):
        current = [i]
        for j, right_item in enumerate(right, 1):
            current.append(min(
                current[-1] + 1,
                previous[j] + 1,
                previous[j - 1] + (left_item != right_item),
            ))
        previous = current
    return previous[-1]


def _unavailable(code: str) -> dict[str, Any]:
    return {
        "available": False,
        "errorCode": code,
        "normalization": NORMALIZATION,
        "characterErrors": None,
        "referenceCharacters": None,
        "cer": None,
        "wordErrors": None,
        "referenceWords": None,
        "wer": None,
    }


def score_text(reference: str, recognized: str) -> dict[str, Any]:
    """Return uncapped CER/WER; unavailable denominators are null, never zero."""
    if not isinstance(reference, str) or not isinstance(recognized, str):
        return _unavailable("text-invalid")
    if len(reference) > MAX_TEXT_CHARS or len(recognized) > MAX_TEXT_CHARS:
        return _unavailable("text-limit")
    ref = _normalise(reference)
    hyp = _normalise(recognized)
    if not ref:
        return _unavailable("empty-reference")
    ref_words = ref.split()
    hyp_words = hyp.split()
    if len(ref_words) > MAX_WORDS or len(hyp_words) > MAX_WORDS:
        return _unavailable("word-limit")
    char_cells = len(ref) * len(hyp)
    word_cells = len(ref_words) * len(hyp_words)
    if char_cells > MAX_EDIT_CELLS or word_cells > MAX_EDIT_CELLS:
        return _unavailable("edit-budget")
    char_errors = _edit_distance(ref, hyp)
    word_errors = _edit_distance(ref_words, hyp_words)
    return {
        "available": True,
        "errorCode": None,
        "normalization": NORMALIZATION,
        "characterErrors": char_errors,
        "referenceCharacters": len(ref),
        "cer": char_errors / len(ref),
        "wordErrors": word_errors,
        "referenceWords": len(ref_words),
        "wer": word_errors / len(ref_words),
    }


def _text_edit_cell_estimate(reference: Any, recognized: Any) -> int | None:
    """Return combined CER/WER DP cell estimate after the same input bounds."""
    if not isinstance(reference, str) or not isinstance(recognized, str):
        return None
    if len(reference) > MAX_TEXT_CHARS or len(recognized) > MAX_TEXT_CHARS:
        return None
    ref = _normalise(reference)
    hyp = _normalise(recognized)
    if not ref:
        return None
    ref_words = ref.split()
    hyp_words = hyp.split()
    if len(ref_words) > MAX_WORDS or len(hyp_words) > MAX_WORDS:
        return None
    char_cells = len(ref) * len(hyp)
    word_cells = len(ref_words) * len(hyp_words)
    if char_cells > MAX_EDIT_CELLS or word_cells > MAX_EDIT_CELLS:
        return None
    return char_cells + word_cells


def check_critical_tokens(checks: Any) -> dict[str, Any]:
    """Compare caller-reviewed reference/recognized token regions exactly.

    Text and labels are intentionally omitted from output. This checks strings,
    not whether the caller's reference is authoritative or semantically correct.
    """
    if not isinstance(checks, list):
        return {"available": False, "errorCode": "critical-list-invalid", "checks": []}
    if len(checks) > MAX_CRITICAL_TOKENS:
        return {"available": False, "errorCode": "critical-token-limit", "checks": []}
    results = []
    for index, item in enumerate(checks):
        if not isinstance(item, Mapping):
            return {"available": False, "errorCode": "critical-record-invalid", "checks": []}
        label = item.get("label")
        reference = item.get("reference")
        recognized = item.get("recognized")
        if (not isinstance(label, str) or not label or len(label) > MAX_CRITICAL_LENGTH or
                not isinstance(reference, str) or not reference or len(reference) > MAX_CRITICAL_LENGTH or
                not isinstance(recognized, str) or len(recognized) > MAX_CRITICAL_LENGTH):
            return {"available": False, "errorCode": "critical-token-invalid", "checks": []}
        results.append({"index": index, "exact": reference == recognized})
    return {"available": True, "errorCode": None, "checks": results}


def _valid_source_id(value: Any) -> bool:
    return isinstance(value, str) and _SOURCE_ID.fullmatch(value) is not None


def _valid_page_number(value: Any) -> bool:
    return isinstance(value, int) and not isinstance(value, bool) and value > 0


def _valid_offset(value: Any) -> bool:
    return isinstance(value, int) and not isinstance(value, bool) and value >= 0


def _finite_number(value: Any) -> bool:
    if not isinstance(value, (int, float)) or isinstance(value, bool):
        return False
    try:
        return math.isfinite(value)
    except (OverflowError, TypeError, ValueError):
        return False


def validate_provenance(record: Any, require_excerpt: bool = True) -> dict[str, Any]:
    """Validate exact page text offsets and optional polygons; never echo text/path."""
    errors: list[str] = []
    if not isinstance(record, Mapping):
        return {"valid": False, "errorCodes": ["record-invalid"], "sourceId": None, "page": None, "sourceRole": None, "geometryAvailable": False, "boxCount": 0}

    source_id = record.get("source_id")
    safe_source_id = source_id if _valid_source_id(source_id) else None
    if safe_source_id is None:
        errors.append("source-id-invalid")

    page = record.get("page")
    safe_page = page if _valid_page_number(page) else None
    if safe_page is None:
        errors.append("page-invalid")

    source_role = record.get("source_role")
    safe_role = source_role if isinstance(source_role, str) and source_role in SOURCE_ROLES else None
    if safe_role is None:
        errors.append("source-role-invalid")

    method = record.get("method")
    safe_method = method if isinstance(method, str) and method in METHODS else None
    if safe_method is None:
        errors.append("method-invalid")

    page_text = record.get("page_text")
    excerpt = record.get("excerpt")
    start = record.get("start")
    end = record.get("end")
    offset_present = any(key in record for key in ("page_text", "excerpt", "start", "end"))
    if require_excerpt or offset_present:
        offset_valid = True
        if not isinstance(page_text, str) or len(page_text) > MAX_TEXT_CHARS:
            errors.append("page-text-invalid")
            offset_valid = False
        if not isinstance(excerpt, str) or not excerpt or len(excerpt) > MAX_TEXT_CHARS:
            errors.append("excerpt-invalid")
            offset_valid = False
        if not _valid_offset(start) or not _valid_offset(end):
            errors.append("offset-invalid")
            offset_valid = False
        if offset_valid:
            if start > end or end > len(page_text):
                errors.append("offset-out-of-range")
            elif page_text[start:end] != excerpt:
                errors.append("offset-mismatch")

    page_width = record.get("page_width")
    page_height = record.get("page_height")
    polygons = record.get("polygons")
    geometry_present = any(key in record for key in ("page_width", "page_height", "polygons"))
    box_count = 0
    if geometry_present:
        valid_dimensions = _finite_number(page_width) and page_width > 0 and _finite_number(page_height) and page_height > 0
        if not valid_dimensions:
            errors.append("page-dimensions-invalid")
        if not isinstance(polygons, list) or not polygons or len(polygons) > MAX_POLYGONS:
            errors.append("polygon-list-invalid")
        else:
            box_count = len(polygons)
            for polygon in polygons:
                if not isinstance(polygon, list) or len(polygon) < 3 or len(polygon) > MAX_POINTS_PER_POLYGON:
                    errors.append("polygon-points-invalid")
                    continue
                for point in polygon:
                    if not isinstance(point, (list, tuple)) or len(point) != 2:
                        errors.append("polygon-point-invalid")
                        continue
                    x, y = point
                    if not _finite_number(x) or not _finite_number(y):
                        errors.append("polygon-coordinate-invalid")
                    elif valid_dimensions and (x < 0 or y < 0 or x > page_width or y > page_height):
                        errors.append("polygon-out-of-bounds")

    return {
        "valid": not errors,
        "errorCodes": sorted(set(errors)),
        "sourceId": safe_source_id,
        "page": safe_page,
        "sourceRole": safe_role,
        "method": safe_method,
        "geometryAvailable": geometry_present and not any(code in errors for code in ("page-dimensions-invalid", "polygon-list-invalid", "polygon-points-invalid", "polygon-point-invalid", "polygon-coordinate-invalid", "polygon-out-of-bounds")),
        "boxCount": box_count,
    }


def evaluate_page(record: Any, index: int = 0, unavailable_code: str | None = None) -> dict[str, Any]:
    """Evaluate one in-memory attempt record and return a text-free summary."""
    base: dict[str, Any] = {"index": index, "status": "failed", "errorCodes": [], "sourceId": None, "page": None, "sourceRole": None, "method": None, "metrics": None, "critical": None}
    if not isinstance(index, int) or isinstance(index, bool) or index < 0:
        base["index"] = None
        base["errorCodes"] = ["index-invalid"]
        return base
    if not isinstance(record, Mapping):
        base["errorCodes"] = ["record-invalid"]
        return base
    status = record.get("status")
    provenance = validate_provenance(record, require_excerpt=status == "success")
    base["sourceId"] = provenance["sourceId"]
    base["page"] = provenance["page"]
    base["sourceRole"] = provenance["sourceRole"]
    base["method"] = provenance["method"]
    if not provenance["valid"]:
        base["errorCodes"] = provenance["errorCodes"]
        return base

    if not isinstance(status, str) or status not in {"success", "failure"}:
        base["errorCodes"] = ["status-invalid"]
        return base
    if status == "failure":
        code = record.get("error_code")
        base["errorCodes"] = [code if isinstance(code, str) and code in SAFE_FAILURE_CODES else "processing_failed"]
        return base

    reference = record.get("reference_text")
    recognized = record.get("recognized_text")
    score_scope = record.get("score_scope")
    if not isinstance(score_scope, str) or score_scope not in {"page", "excerpt"}:
        base["status"] = "unavailable"
        base["errorCodes"] = ["score-scope-invalid"]
        return base
    expected_candidate = record.get("page_text") if score_scope == "page" else record.get("excerpt")
    if not isinstance(recognized, str) or recognized != expected_candidate:
        base["status"] = "unavailable"
        base["errorCodes"] = ["candidate-scope-mismatch"]
        return base
    if unavailable_code is not None:
        base["status"] = "unavailable"
        base["errorCodes"] = [unavailable_code]
        return base
    metrics = score_text(reference, recognized)
    critical = check_critical_tokens(record.get("critical_tokens", []))
    if not metrics["available"] or not critical["available"]:
        base["status"] = "unavailable"
        codes = []
        if not metrics["available"]:
            codes.append(metrics["errorCode"] or "metric-unavailable")
        if not critical["available"]:
            codes.append(critical["errorCode"] or "critical-check-unavailable")
        base["errorCodes"] = codes
        return base
    base.update({"status": "evaluated", "metrics": metrics, "critical": critical})
    return base


def evaluate_pages(records: Any) -> dict[str, Any]:
    """Summarize an explicit in-memory sequence; failures count as attempts."""
    if not isinstance(records, Sequence) or isinstance(records, (str, bytes, bytearray)):
        return {"schemaVersion": 1, "normalization": NORMALIZATION, "attemptedPages": 0, "evaluatedPages": 0, "failedPages": 0, "unavailablePages": 0, "errorCodes": ["page-list-invalid"], "pages": []}
    attempted = len(records)
    if attempted > MAX_PAGES:
        return {"schemaVersion": 1, "normalization": NORMALIZATION, "attemptedPages": attempted, "evaluatedPages": 0, "failedPages": 0, "unavailablePages": attempted, "errorCodes": ["page-limit"], "pages": []}
    estimated_cells = 0
    successful_indexes: list[int] = []
    for index, record in enumerate(records):
        if not isinstance(record, Mapping) or record.get("status") != "success":
            continue
        provenance = validate_provenance(record, require_excerpt=True)
        if not provenance["valid"]:
            continue
        scope = record.get("score_scope")
        recognized = record.get("recognized_text")
        expected_candidate = record.get("page_text") if scope == "page" else record.get("excerpt") if scope == "excerpt" else None
        if not isinstance(scope, str) or scope not in {"page", "excerpt"} or not isinstance(recognized, str) or recognized != expected_candidate:
            continue
        if not check_critical_tokens(record.get("critical_tokens", []))["available"]:
            continue
        estimate = _text_edit_cell_estimate(record.get("reference_text"), recognized)
        if estimate is not None:
            estimated_cells += estimate
            successful_indexes.append(index)
    batch_over_budget = estimated_cells > MAX_BATCH_EDIT_CELLS
    pages = []
    for index, record in enumerate(records):
        pages.append(evaluate_page(record, index, "batch-edit-budget" if batch_over_budget and index in successful_indexes else None))
    return {
        "schemaVersion": 1,
        "normalization": NORMALIZATION,
        "attemptedPages": attempted,
        "evaluatedPages": sum(page["status"] == "evaluated" for page in pages),
        "failedPages": sum(page["status"] == "failed" for page in pages),
        "unavailablePages": sum(page["status"] == "unavailable" for page in pages),
        "errorCodes": [],
        "pages": pages,
    }
