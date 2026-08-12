#!/usr/bin/env python3

import argparse
import json
from pathlib import Path


def fail(message: str):
    print("R2_FASTTRACK_PROGRESS_VALIDATION=FAIL")
    print(f"REASON={message}")
    raise SystemExit(1)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", required=True)
    args = parser.parse_args()
    path = Path(args.report)
    if not path.is_file():
        fail(f"Missing report: {path}")
    data = json.loads(path.read_text(encoding="utf-8"))
    syllabus = data["syllabus"]
    if syllabus["baselineVerified"] != 211:
        fail("Syllabus baselineVerified must remain 211")
    if syllabus["denominator"] != 417:
        fail("Syllabus denominator must remain 417")
    if syllabus["newlyVerified"] + syllabus["remainingPending"] != 206:
        fail("Syllabus newlyVerified + remainingPending must equal 206")
    expected_total = 211 + syllabus["newlyVerified"]
    if syllabus["totalVerified"] != expected_total:
        fail("Syllabus totalVerified arithmetic mismatch")
    if syllabus["studentReady"] and syllabus["totalVerified"] != 417:
        fail("Syllabus cannot be studentReady before 417/417 verified hierarchy")
    crucible = data["crucible"]
    if crucible["macroTotal"] != 7:
        fail("Macro denominator must be 7")
    if crucible["majorTotal"] != 1:
        fail("Major denominator must be 1")
    if crucible["questionPacksTotal"] != 8:
        fail("Question-pack denominator must be 8")
    if crucible["answerKeysTotal"] != 8:
        fail("Answer-key denominator must be 8")
    if not (0 <= crucible["macroReviewed"] <= 7):
        fail("macroReviewed out of range")
    if not (0 <= crucible["majorReviewed"] <= 1):
        fail("majorReviewed out of range")
    if not (0 <= crucible["questionPacksReady"] <= 8):
        fail("questionPacksReady out of range")
    if not (0 <= crucible["answerKeysVerified"] <= 8):
        fail("answerKeysVerified out of range")
    if crucible["studentReady"]:
        if crucible["macroReviewed"] != 7:
            fail("Crucible studentReady requires 7/7 Macro review")
        if crucible["majorReviewed"] != 1:
            fail("Crucible studentReady requires 1/1 Major review")
        if crucible["questionPacksReady"] != 8:
            fail("Crucible studentReady requires 8/8 packs")
        if crucible["answerKeysVerified"] != 8:
            fail("Crucible studentReady requires 8/8 answer keys")
    digibook = data["digibook"]
    if digibook["baselineApprovedAtoms"] != 2:
        fail("DigiBook baselineApprovedAtoms must remain 2")
    if digibook["denominator"] != 417:
        fail("DigiBook denominator must remain 417")
    expected_approved = digibook["baselineApprovedAtoms"] + digibook["newlyApprovedAtoms"]
    if digibook["approvedAtoms"] != expected_approved:
        fail("DigiBook approvedAtoms arithmetic mismatch")
    if not (2 <= digibook["approvedAtoms"] <= 417):
        fail("DigiBook approvedAtoms out of range")
    if digibook["studentReady"] and digibook["approvedAtoms"] != 417:
        fail("Whole-mission DigiBook cannot be studentReady before 417/417")
    adaptive = data["adaptiveUi"]
    if adaptive["overflowCount"] != 0:
        fail("Adaptive UI overflowCount must be zero")
    if adaptive["redScreenCount"] != 0:
        fail("Adaptive UI redScreenCount must be zero")
    if data["productionReady"] is not False:
        fail("Fast-track execution cannot promote production readiness")
    print("R2_FASTTRACK_PROGRESS_VALIDATION=PASS")
    print(f"SYLLABUS={syllabus['totalVerified']}/417")
    print("CRUCIBLE=" f"{crucible['questionPacksReady']}/8 packs, " f"{crucible['answerKeysVerified']}/8 keys")
    print(f"DIGIBOOK={digibook['approvedAtoms']}/417")


if __name__ == "__main__":
    main()