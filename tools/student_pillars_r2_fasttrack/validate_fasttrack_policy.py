#!/usr/bin/env python3

import json
from pathlib import Path

POLICY = Path("tools/student_pillars_r2_fasttrack/fasttrack_policy.json")
EXPECTED_BASELINE = "5252a3f56e84c2a6f843f6e95845d47d6c75fc53"
EXPECTED_MODELS = {
    "factory": "gemini-3.6-flash",
    "adjudicator": "gemini-3.1-pro-preview",
    "normalizer": "gemini-3.5-flash-lite",
}


def fail(message: str):
    print("R2_FASTTRACK_POLICY_VALIDATION=FAIL")
    print(f"REASON={message}")
    raise SystemExit(1)


def main():
    if not POLICY.is_file():
        fail(f"Missing policy: {POLICY}")
    data = json.loads(POLICY.read_text(encoding="utf-8"))
    if data.get("baseline") != EXPECTED_BASELINE:
        fail("Baseline mismatch")
    models = data.get("models", {})
    for key, expected in EXPECTED_MODELS.items():
        if models.get(key) != expected:
            fail(f"Model mismatch for {key}: {models.get(key)} != {expected}")
    syllabus = data["syllabus"]
    if syllabus["totalInventory"] != 430:
        fail("Syllabus total must be 430")
    if syllabus["previewEligible"] != 417:
        fail("Syllabus previewEligible must be 417")
    if syllabus["heldExcluded"] != 13:
        fail("Syllabus heldExcluded must be 13")
    if syllabus["baselineHierarchyVerified"] != 211:
        fail("Syllabus verified baseline must be 211")
    if syllabus["baselineHierarchyPending"] != 206:
        fail("Syllabus pending baseline must be 206")
    if syllabus["baselineHierarchyVerified"] + syllabus["baselineHierarchyPending"] != syllabus["previewEligible"]:
        fail("Syllabus hierarchy denominator mismatch")
    crucible = data["crucible"]
    if crucible["macroSlots"] != 7:
        fail("Crucible macro slot count must be 7")
    if crucible["majorSlots"] != 1:
        fail("Crucible major slot count must be 1")
    if crucible["assessmentSlots"] != 8:
        fail("Crucible assessment slot count must be 8")
    if crucible["allocatedAtoms"] != 417:
        fail("Crucible atom allocation denominator must be 417")
    digibook = data["digibook"]
    if digibook["missionAtomDenominator"] != 417:
        fail("DigiBook denominator must be 417")
    if digibook["baselineApprovedAtoms"] != 2:
        fail("DigiBook baseline approved atoms must be 2")
    if digibook["remainingAtoms"] != 415:
        fail("DigiBook remaining atoms must be 415")
    if data["studentUi"]["liveAiAllowed"] is not False:
        fail("Student live AI must remain disabled")
    if data["studentUi"]["localAcademicGuessingAllowed"] is not False:
        fail("Student academic guessing must remain disabled")
    safety = data["safety"]
    forbidden_true = (
        "productionRead",
        "productionWrite",
        "rulesChange",
        "deploy",
        "studentPublish",
        "gradleTouch",
        "modelOutputCanonicalByItself",
    )
    for key in forbidden_true:
        if safety[key] is not False:
            fail(f"Safety violation: {key}")
    print("R2_FASTTRACK_POLICY_VALIDATION=PASS")
    print("SYLLABUS_PENDING=206")
    print("CRUCIBLE_ASSESSMENTS=8")
    print("DIGIBOOK_REMAINING=415")


if __name__ == "__main__":
    main()