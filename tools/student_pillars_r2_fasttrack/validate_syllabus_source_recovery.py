#!/usr/bin/env python3

import argparse
import json
from pathlib import Path


ALLOWED = {
    "SOURCE_PROVEN",
    "SOURCE_NOT_PRESENT",
    "SOURCE_AMBIGUOUS",
}


def fail(reason):
    print("SYLLABUS_SOURCE_RECOVERY_VALIDATION=FAIL")
    print(f"REASON={reason}")
    raise SystemExit(1)


def require(value, reason):
    if not value:
        fail(reason)


def valid_ref(ref, label):
    require(isinstance(ref, dict), f"{label} must be object")
    require(
        isinstance(ref.get("document"), str)
        and ref["document"].strip(),
        f"{label}.document missing",
    )
    require(
        isinstance(ref.get("locator"), str)
        and ref["locator"].strip(),
        f"{label}.locator missing",
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    args = parser.parse_args()

    path = Path(args.input)
    require(path.is_file(), "input missing")

    data = json.loads(path.read_text(encoding="utf-8"))
    items = data.get("items")

    require(isinstance(items, list), "items must be list")
    require(len(items) == 26, "Wave source recovery must account for 26 atoms")

    seen = set()
    proven = 0

    for index, item in enumerate(items):
        prefix = f"items[{index}]"

        atom_id = item.get("atomId")
        require(
            isinstance(atom_id, str) and atom_id.strip(),
            f"{prefix}.atomId missing",
        )
        require(atom_id not in seen, f"duplicate atomId {atom_id}")
        seen.add(atom_id)

        status = item.get("sourceStatus")
        require(status in ALLOWED, f"{prefix}.sourceStatus invalid")

        if status == "SOURCE_PROVEN":
            require(
                isinstance(item.get("verifiedUnit"), str)
                and item["verifiedUnit"].strip(),
                f"{prefix}.verifiedUnit missing",
            )
            require(
                isinstance(item.get("verifiedChapter"), str)
                and item["verifiedChapter"].strip(),
                f"{prefix}.verifiedChapter missing",
            )
            valid_ref(item.get("unitSource"), f"{prefix}.unitSource")
            valid_ref(
                item.get("chapterSource"),
                f"{prefix}.chapterSource",
            )
            proven += 1
        else:
            require(
                isinstance(item.get("blocker"), str)
                and item["blocker"].strip(),
                f"{prefix}.blocker missing",
            )

        require(
            item.get("modelOnlyProof") is False,
            f"{prefix}: model-only proof forbidden",
        )

    print("SYLLABUS_SOURCE_RECOVERY_VALIDATION=PASS")
    print(f"ACCOUNTED={len(items)}/26")
    print(f"SOURCE_PROVEN={proven}/26")
    print(f"UNRESOLVED={26 - proven}/26")


if __name__ == "__main__":
    main()
