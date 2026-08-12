#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

from contracts import (
    DIGIBOOK_TOTAL_RELEVANT_ATOMS,
    require,
    require_non_empty,
    validate_source_evidence,
)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    args = parser.parse_args()
    report = json.loads(Path(args.input).read_text(encoding="utf-8"))

    require(
        report.get("missionAtomDenominator") == DIGIBOOK_TOTAL_RELEVANT_ATOMS,
        "DigiBook denominator must remain 417",
    )

    items = report.get("items")
    require(isinstance(items, list), "items must be a list")
    require(items, "DigiBook batch cannot be empty")

    seen = set()
    for index, item in enumerate(items):
        prefix = f"items[{index}]"
        require_non_empty(item.get("atomId"), f"{prefix}.atomId")
        atom_id = item["atomId"]
        require(atom_id not in seen, f"Duplicate atomId: {atom_id}")
        seen.add(atom_id)
        validate_source_evidence(item)

        sections = item.get("sections")
        require(isinstance(sections, dict), f"{prefix}.sections missing")
        for required in (
            "concepts",
            "formulaRegister",
            "commonMisconceptions",
            "workedExamples",
            "selfChecks",
        ):
            require(required in sections, f"{prefix}.sections.{required} missing")

        if item.get("approved") is True:
            require(item.get("reviewed") is True, f"{prefix}: approved without review")

    print("DIGIBOOK_R2C_BATCH_VALIDATION=PASS")
    print(f"BATCH_ITEMS={len(items)}")
    print(f"MISSION_DENOMINATOR={DIGIBOOK_TOTAL_RELEVANT_ATOMS}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())