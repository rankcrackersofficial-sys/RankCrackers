#!/usr/bin/env python3

from __future__ import annotations

import json
from pathlib import Path


POLICY = Path("tools/student_pillars_r2/vertex_policy.json")

EXPECTED = {
    "deepReasoningPro": "gemini-3.1-pro-preview",
    "factoryFlash": "gemini-3.6-flash",
    "bulkLite": "gemini-3.5-flash-lite",
    "intermediateFlash": "gemini-3.5-flash",
}

FORBIDDEN_DEFAULTS = {
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-flash-latest",
    "gemini-2.5-pro",
    "gemini-2.5-flash",
}


def fail(message: str) -> None:
    print("VERTEX_3X_POLICY_VALIDATION=FAIL")
    print(f"REASON={message}")
    raise SystemExit(1)


def main() -> None:
    if not POLICY.is_file():
        fail(f"Missing policy: {POLICY}")

    data = json.loads(POLICY.read_text(encoding="utf-8"))

    selection = data.get("modelSelection", {})
    defaults = selection.get("defaults", {})

    for role, expected_model in EXPECTED.items():
        actual = defaults.get(role)
        if actual != expected_model:
            fail(f"{role}: expected {expected_model}, got {actual}")

    for model in defaults.values():
        if model in FORBIDDEN_DEFAULTS:
            fail(f"Legacy model remains default: {model}")

    fallback = selection.get("fallbackPolicy", {})

    if fallback.get("silentFallbackAllowed") is not False:
        fail("Silent model fallback must remain disabled")

    if fallback.get("fallbackMustBeRecorded") is not True:
        fail("Fallback metadata must be recorded")

    requirements = data.get("requirements", {})

    required_true = (
        "englishFirstOfficialSources",
        "sourceGroundingRequired",
        "reviewRequiredBeforeStudentDelivery",
        "recordActualModelPerArtifact",
        "recordFallbackPerArtifact",
    )

    for key in required_true:
        if requirements.get(key) is not True:
            fail(f"Required policy flag is not true: {key}")

    if requirements.get("modelOutputIsCanonicalTruth") is not False:
        fail("Model output must not become canonical truth")

    if requirements.get("studentRuntimeAiAllowed") is not False:
        fail("Student runtime AI must remain disabled")

    print("VERTEX_3X_POLICY_VALIDATION=PASS")
    for role, model in EXPECTED.items():
        print(f"{role}={model}")


if __name__ == "__main__":
    main()