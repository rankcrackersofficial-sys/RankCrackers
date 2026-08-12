#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

from contracts import (
    CRUCIBLE_ASSESSMENT_SLOTS,
    CRUCIBLE_MACRO_SLOTS,
    CRUCIBLE_MAJOR_SLOTS,
    require,
    require_non_empty,
    validate_source_evidence,
)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    args = parser.parse_args()
    report = json.loads(Path(args.input).read_text(encoding="utf-8"))

    slots = report.get("slots")
    require(isinstance(slots, list), "slots must be a list")
    require(
        len(slots) == CRUCIBLE_ASSESSMENT_SLOTS,
        "Crucible must account for exactly 8 assessment slots",
    )

    macro = 0
    major = 0
    reviewed = 0
    keys_verified = 0
    seen = set()

    for index, slot in enumerate(slots):
        prefix = f"slots[{index}]"
        require_non_empty(slot.get("slotId"), f"{prefix}.slotId")
        slot_id = slot["slotId"]
        require(slot_id not in seen, f"Duplicate slotId: {slot_id}")
        seen.add(slot_id)

        slot_type = slot.get("slotType")
        require(slot_type in {"MACRO", "MAJOR"}, f"{prefix}.slotType invalid")
        if slot_type == "MACRO":
            macro += 1
        else:
            major += 1

        question_count = slot.get("questionCount")
        require(
            isinstance(question_count, int) and question_count >= 0,
            f"{prefix}.questionCount invalid",
        )

        ready = slot.get("questionPackReady") is True
        is_reviewed = slot.get("reviewed") is True
        key_verified = slot.get("answerKeyVerified") is True

        if ready:
            require(question_count > 0, f"{prefix}: ready pack has zero questions")
            validate_source_evidence(slot)
        if is_reviewed:
            require(ready, f"{prefix}: reviewed slot without ready pack")
            reviewed += 1
        if key_verified:
            require(is_reviewed, f"{prefix}: answer key verified before review")
            keys_verified += 1
        if slot.get("studentReady") is True:
            require(
                ready and is_reviewed and key_verified,
                f"{prefix}: invalid studentReady promotion",
            )

    require(macro == CRUCIBLE_MACRO_SLOTS, f"Expected {CRUCIBLE_MACRO_SLOTS} Macro slots, got {macro}")
    require(major == CRUCIBLE_MAJOR_SLOTS, f"Expected {CRUCIBLE_MAJOR_SLOTS} Major slot, got {major}")

    print("CRUCIBLE_R2B_VALIDATION=PASS")
    print(f"ASSESSMENT_SLOTS={len(slots)}")
    print(f"REVIEWED={reviewed}/{CRUCIBLE_ASSESSMENT_SLOTS}")
    print(f"ANSWER_KEYS_VERIFIED={keys_verified}/{CRUCIBLE_ASSESSMENT_SLOTS}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())