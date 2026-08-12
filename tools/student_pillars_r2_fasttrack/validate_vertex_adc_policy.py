#!/usr/bin/env python3

import json
from pathlib import Path

POLICY = Path("tools/student_pillars_r2_fasttrack/vertex_adc_policy.json")


def fail(reason):
    print("VERTEX_ADC_POLICY_VALIDATION=FAIL")
    print(f"REASON={reason}")
    raise SystemExit(1)


def main():
    if not POLICY.is_file():
        fail("policy file missing")
    data = json.loads(POLICY.read_text(encoding="utf-8"))
    if data.get("backend") != "vertex_ai":
        fail("backend must be vertex_ai")
    if data.get("authentication") != "application_default_credentials":
        fail("ADC authentication required")
    if data.get("apiKeyRequired") is not False:
        fail("API key must not be required for Vertex ADC path")
    optional = data.get("optionalEnvironment", {})
    expected = {
        "RC_VERTEX_MODEL_PRO": "gemini-3.1-pro-preview",
        "RC_VERTEX_MODEL_FLASH": "gemini-3.6-flash",
        "RC_VERTEX_MODEL_LITE": "gemini-3.5-flash-lite",
    }
    for key, value in expected.items():
        if optional.get(key) != value:
            fail(f"{key} mismatch")
    safety = data.get("safety", {})
    if safety.get("studentRuntimeAi") is not False:
        fail("student runtime AI forbidden")
    if safety.get("modelOutputCanonicalTruth") is not False:
        fail("model output cannot become canonical truth")
    if safety.get("productionFirestoreRead") is not False:
        fail("production Firestore read forbidden")
    if safety.get("productionFirestoreWrite") is not False:
        fail("production Firestore write forbidden")
    print("VERTEX_ADC_POLICY_VALIDATION=PASS")


if __name__ == "__main__":
    main()