from __future__ import annotations

from typing import Any

SYLLABUS_TOTAL = 430
SYLLABUS_PREVIEW_ELIGIBLE = 417
SYLLABUS_HELD_EXCLUDED = 13

R1_HIERARCHY_VERIFIED = 211
R1_HIERARCHY_PENDING = 206

CRUCIBLE_TOTAL_DAYS = 100
CRUCIBLE_PHASES = 7
CRUCIBLE_SCHEDULES = 42
CRUCIBLE_REBUILD_WINDOWS = 7
CRUCIBLE_MACRO_SLOTS = 7
CRUCIBLE_MAJOR_SLOTS = 1
CRUCIBLE_ASSESSMENT_SLOTS = 8
CRUCIBLE_ALLOCATED_ATOMS = 417

DIGIBOOK_TOTAL_RELEVANT_ATOMS = 417
DIGIBOOK_R1_APPROVED_ATOMS = 2

FORBIDDEN_ACADEMIC_SOURCES = {
    "MODEL_ONLY",
    "TITLE_GUESS",
    "NAME_HEURISTIC",
    "UNSOURCED_INFERENCE",
    "SYNTHETIC_FALLBACK",
}


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def require_non_empty(value: Any, name: str) -> None:
    require(
        isinstance(value, str) and value.strip(),
        f"{name} must be a non-empty string",
    )


def validate_source_evidence(
    item: dict[str, Any],
    *,
    field: str = "sourceEvidence",
) -> None:
    evidence = item.get(field)
    require(
        isinstance(evidence, list) and evidence,
        f"{field} must contain source evidence",
    )

    for index, source in enumerate(evidence):
        require(
            isinstance(source, dict),
            f"{field}[{index}] must be an object",
        )
        source_type = source.get("sourceType")
        require_non_empty(source_type, f"{field}[{index}].sourceType")
        require(
            source_type not in FORBIDDEN_ACADEMIC_SOURCES,
            f"Forbidden academic source: {source_type}",
        )
        require_non_empty(
            source.get("reference"),
            f"{field}[{index}].reference",
        )


def require_exact_metric(
    *,
    numerator: int,
    denominator: int,
    label: str,
) -> None:
    require(numerator >= 0, f"{label}: numerator < 0")
    require(denominator >= 0, f"{label}: denominator < 0")
    require(
        numerator <= denominator,
        f"{label}: numerator exceeds denominator",
    )