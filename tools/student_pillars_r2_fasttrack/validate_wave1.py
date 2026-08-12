#!/usr/bin/env python3

import argparse
import json
from pathlib import Path


BASELINE = "36f00384cfe5a629e52cd1af54316d2453a39e2d"


def fail(reason):
    print("R2_FASTTRACK_WAVE1_VALIDATION=FAIL")
    print(f"REASON={reason}")
    raise SystemExit(1)


def require(condition, reason):
    if not condition:
        fail(reason)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", required=True)
    args = parser.parse_args()

    report_path = Path(args.report)
    require(report_path.is_file(), "wave report missing")

    data = json.loads(report_path.read_text(encoding="utf-8-sig"))

    require(data.get("baselineHead") == BASELINE, "baseline HEAD mismatch")

    syllabus = data["syllabus"]
    require(syllabus["baselineVerified"] == 211, "syllabus baseline must be 211")
    require(syllabus["denominator"] == 417, "syllabus denominator must be 417")
    require(syllabus["attempted"] == 26, "Wave-1 must account for exactly 26 syllabus atoms")

    verified = syllabus["newlyVerified"]
    pending = syllabus["stillPending"]
    held = syllabus["heldForSource"]

    require(verified + pending + held == 26, "syllabus Wave-1 accounting must equal 26")
    require(syllabus["totalVerified"] == 211 + verified, "syllabus verified arithmetic mismatch")
    require(syllabus["modelOnlyPromotions"] == 0, "model-only syllabus promotion forbidden")

    crucible = data["crucible"]
    require(crucible["questionPacksReady"] >= 1, "existing 1/8 pack regressed")
    require(crucible["questionPacksReady"] <= 8, "question pack denominator exceeded")
    require(1 <= crucible["macroReviewed"] <= 7, "macro reviewed count invalid")
    require(0 <= crucible["majorReviewed"] <= 1, "major reviewed count invalid")
    require(1 <= crucible["answerKeysVerified"] <= 8, "answer-key count invalid")
    require(crucible["studentReady"] is False, "Wave-1 cannot promote Crucible to studentReady")

    digibook = data["digibook"]
    require(digibook["baselineApprovedAtoms"] == 2, "DigiBook baseline must remain 2")
    require(digibook["denominator"] == 417, "DigiBook denominator must remain 417")
    require(digibook["attempted"] == 20, "Wave-1 DigiBook must account for 20 atoms")

    approved = digibook["newlyApproved"]
    pending_review = digibook["pendingReview"]
    rejected = digibook["rejectedOrHeld"]

    require(approved + pending_review + rejected == 20, "DigiBook Wave-1 accounting must equal 20")
    require(digibook["approvedAtoms"] == 2 + approved, "DigiBook approved arithmetic mismatch")
    require(digibook["modelOnlyPromotions"] == 0, "model-only DigiBook approval forbidden")

    models = data["models"]
    require(models["flashActual"] == "gemini-3.6-flash", "unexpected Flash model")
    require(models["proActual"] == "gemini-3.1-pro-preview", "unexpected Pro model")
    require(models["silentFallbackCount"] == 0, "silent model fallback forbidden")
    require(data["modelOnlyCanonicalPromotions"] == 0, "canonical model-only promotion detected")
    require(data["productionReady"] is False, "Wave-1 cannot mark production ready")

    print("R2_FASTTRACK_WAVE1_VALIDATION=PASS")
    print(f"SYLLABUS={syllabus['totalVerified']}/417")
    print(
        "CRUCIBLE="
        f"{crucible['questionPacksReady']}/8 packs, "
        f"{crucible['answerKeysVerified']}/8 keys"
    )
    print(f"DIGIBOOK={digibook['approvedAtoms']}/417")


if __name__ == "__main__":
    main()
