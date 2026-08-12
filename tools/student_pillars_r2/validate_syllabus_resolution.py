#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

from contracts import (
    R1_HIERARCHY_PENDING,
    SYLLABUS_PREVIEW_ELIGIBLE,
    require,
    require_non_empty,
    validate_source_evidence,
)

ALLOWED_STATUS = {"VERIFIED", "STILL_PENDING", "HELD_FOR_SOURCE"}


def validate_item(item: dict, index: int) -> None:
    prefix = f"items[{index}]"
    require_non_empty(item.get("atomId"), f"{prefix}.atomId")
    status = item.get("status")
    require(status in ALLOWED_STATUS, f"{prefix}.status invalid: {status}")

    if status == "VERIFIED":
        require_non_empty(item.get("verifiedUnit"), f"{prefix}.verifiedUnit")
        require_non_empty(item.get("verifiedChapter"), f"{prefix}.verifiedChapter")
        validate_source_evidence(item)

    if status in {"STILL_PENDING", "HELD_FOR_SOURCE"}:
        require_non_empty(item.get("blocker"), f"{prefix}.blocker")

    method = item.get("resolutionMethod")
    require(
        method not in {"MODEL_ONLY", "TITLE_GUESS", "NAME_HEURISTIC"},
        f"{prefix}: unsafe resolution method {method}",
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    args = parser.parse_args()
    report = json.loads(Path(args.input).read_text(encoding="utf-8"))

    require(
        report.get("baselinePreviewEligible") == SYLLABUS_PREVIEW_ELIGIBLE,
        "Expected preview-eligible denominator = 417",
    )
    require(
        report.get("baselinePending") == R1_HIERARCHY_PENDING,
        "Expected R1 pending hierarchy denominator = 206",
    )

    items = report.get("items")
    require(isinstance(items, list), "items must be a list")
    require(
        len(items) == R1_HIERARCHY_PENDING,
        f"Expected exactly {R1_HIERARCHY_PENDING} pending work items",
    )

    seen = set()
    for index, item in enumerate(items):
        require(isinstance(item, dict), f"items[{index}] invalid")
        validate_item(item, index)
        atom_id = item["atomId"]
        require(atom_id not in seen, f"Duplicate atomId: {atom_id}")
        seen.add(atom_id)

    verified = sum(1 for item in items if item["status"] == "VERIFIED")
    pending = len(items) - verified

    print("SYLLABUS_R2A_VALIDATION=PASS")
    print(f"R1_PENDING={R1_HIERARCHY_PENDING}")
    print(f"NEWLY_VERIFIED={verified}")
    print(f"REMAINING_PENDING={pending}")
    print(
        "TOTAL_HIERARCHY_VERIFIED="
        f"{SYLLABUS_PREVIEW_ELIGIBLE - pending}/"
        f"{SYLLABUS_PREVIEW_ELIGIBLE}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())