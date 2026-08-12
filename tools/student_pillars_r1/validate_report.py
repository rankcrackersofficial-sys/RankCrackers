#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

EXPECTED_BASELINE = 'e7b70ce40447fe7bb45a900f09f94a70998082a1'
EXPECTED_GRADLE_HASH = '4319efa3f9e08cc36fa19ee480112de9edb938f4'
PASS_VERDICT = 'RANKCRACKERS_STUDENT_PILLARS_R1_CANONICAL_STATUS_AND_BINDING_AUDIT_PASSED'
REQUIRED_SAFETY_LOCKS = (
    'NO_PRODUCTION_READ', 'NO_PRODUCTION_WRITE', 'NO_RULES_CHANGE',
    'NO_DEPLOY', 'NO_STUDENT_PUBLISH', 'NO_FIREBASE_CONFIG_SWAP',
    'NO_SYLLABUS_FABRICATION', 'NO_HIERARCHY_GUESSING',
    'NO_CRUCIBLE_FAKE_READY', 'NO_TEST_CONTENT_FABRICATION',
    'NO_DIGIBOOK_BULK_GENERATION', 'NO_MISSION_VARIABLE_GUESSING',
    'NO_GRADLE_TOUCH',
)
ALLOWED_BINDING = {'PASS', 'PARTIAL', 'BLOCKED'}
ALLOWED_READINESS = {'READY', 'NOT_READY'}
ALLOWED_SURFACE = {
    'CAN_RENDER_TRUTHFULLY_NOW', 'PARTIAL_TRUTHFUL_PREVIEW',
    'BLOCKED_BY_CANONICAL_DATA', 'BLOCKED_BY_REVIEW',
    'BLOCKED_BY_VARIABLE_PROJECTION', 'BLOCKED_BY_UI_BINDING',
}
FORBIDDEN_TEXT = ('100%', '95%', 'almost complete', 'fully ready', 'production ready')

class AuditFailure(Exception):
    pass

def require(condition: bool, message: str) -> None:
    if not condition:
        raise AuditFailure(message)

def git(*args: str) -> str:
    return subprocess.run(['git', *args], check=True, capture_output=True, text=True).stdout.strip()

def source_proof(obj: dict[str, Any], path: str) -> None:
    proof = obj.get('sourceProof')
    require(isinstance(proof, list) and proof, f'{path}.sourceProof missing')
    for i, row in enumerate(proof):
        require(isinstance(row, dict), f'{path}.sourceProof[{i}] must be object')
        require(row.get('path'), f'{path}.sourceProof[{i}].path missing')
        require(row.get('sourceType') in {'CANONICAL','DERIVED','PREVIEW_ONLY','TEST_ONLY','LEGACY','UNKNOWN'},
                f'{path}.sourceProof[{i}].sourceType invalid')

def ratio(obj: dict[str, Any], path: str) -> None:
    require(isinstance(obj.get('numerator'), int), f'{path}.numerator must be int')
    require(isinstance(obj.get('denominator'), int), f'{path}.denominator must be int')
    require(obj['denominator'] >= 0, f'{path}.denominator invalid')
    require(0 <= obj['numerator'] <= obj['denominator'], f'{path} ratio invalid')
    source_proof(obj, path)

def binding_rows(rows: Any, path: str) -> None:
    require(isinstance(rows, list) and rows, f'{path} must be non-empty list')
    for i, row in enumerate(rows):
        require(isinstance(row, dict), f'{path}[{i}] must be object')
        for key in ('field','canonicalSource','projection','studentModel','providerOrRepository','studentUi','status'):
            require(row.get(key) not in (None, ''), f'{path}[{i}].{key} missing')
        require(row['status'] in ALLOWED_BINDING, f'{path}[{i}].status invalid')

def validate(report: dict[str, Any]) -> None:
    as_text = json.dumps(report, ensure_ascii=False).lower()
    for bad in FORBIDDEN_TEXT:
        require(bad.lower() not in as_text, f'forbidden vague readiness text: {bad}')

    require(report.get('verdict') == PASS_VERDICT, 'verdict mismatch')
    require(report.get('baseline', {}).get('startingHead') == EXPECTED_BASELINE, 'baseline startingHead mismatch')
    require(git('rev-parse', 'HEAD') == EXPECTED_BASELINE, 'current HEAD must equal R1 baseline before audit commit')
    require(git('hash-object', 'android/app/build.gradle.kts') == EXPECTED_GRADLE_HASH, 'Gradle hash changed')

    safety = report.get('safety')
    require(isinstance(safety, dict), 'safety must be object')
    for lock in REQUIRED_SAFETY_LOCKS:
        require(safety.get(lock) is True, f'safety lock missing: {lock}')

    syllabus = report.get('syllabus')
    require(isinstance(syllabus, dict), 'syllabus object missing')
    inv = syllabus.get('inventory')
    require(isinstance(inv, dict), 'syllabus.inventory missing')
    for key in ('totalAtoms','previewEligible','heldOrExcluded'):
        require(isinstance(inv.get(key), int), f'syllabus.inventory.{key} must be int')
    require(inv['totalAtoms'] >= inv['previewEligible'] >= 0, 'syllabus inventory invalid')
    source_proof(inv, 'syllabus.inventory')
    ratio(syllabus.get('hierarchyVerified', {}), 'syllabus.hierarchyVerified')
    ratio(syllabus.get('hierarchyPending', {}), 'syllabus.hierarchyPending')
    require(syllabus['hierarchyVerified']['denominator'] == syllabus['hierarchyPending']['denominator'], 'syllabus hierarchy denominators must match')
    require(syllabus['hierarchyVerified']['numerator'] + syllabus['hierarchyPending']['numerator'] == syllabus['hierarchyVerified']['denominator'], 'syllabus hierarchy totals mismatch')
    require(isinstance(syllabus.get('blockers'), list), 'syllabus.blockers must be list')
    require(syllabus.get('studentBinding') in ALLOWED_BINDING, 'syllabus.studentBinding invalid')
    require(syllabus.get('studentReadiness') in ALLOWED_READINESS, 'syllabus.studentReadiness invalid')
    require(syllabus.get('surfaceTruth') in ALLOWED_SURFACE, 'syllabus.surfaceTruth invalid')

    crucible = report.get('crucible')
    require(isinstance(crucible, dict), 'crucible object missing')
    structure = crucible.get('structure')
    require(isinstance(structure, dict), 'crucible.structure missing')
    for key in ('totalDays','phases','schedules','rebuildWindows','macroSlots','majorSlots','missingAtoms','duplicateAtoms'):
        require(isinstance(structure.get(key), int), f'crucible.structure.{key} must be int')
    source_proof(structure, 'crucible.structure')
    for key in ('atomAllocation','reviewedMacroSlots','reviewedMajorSlots','questionPacksReady','answerKeysVerified'):
        ratio(crucible.get(key, {}), f'crucible.{key}')
    require(crucible.get('studentBinding') in ALLOWED_BINDING, 'crucible.studentBinding invalid')
    require(crucible.get('studentReadiness') in ALLOWED_READINESS, 'crucible.studentReadiness invalid')
    require(crucible.get('surfaceTruth') in ALLOWED_SURFACE, 'crucible.surfaceTruth invalid')

    digibook = report.get('digibook')
    require(isinstance(digibook, dict), 'digibook object missing')
    ratio(digibook.get('approvedAtomCoverage', {}), 'digibook.approvedAtomCoverage')
    pilot = digibook.get('pilotInventory')
    require(isinstance(pilot, dict), 'digibook.pilotInventory missing')
    for key in ('formulas','misconceptions','workedExamples','selfChecks'):
        require(isinstance(pilot.get(key), int), f'digibook.pilotInventory.{key} must be int')
    source_proof(pilot, 'digibook.pilotInventory')
    require(digibook.get('studentBinding') in ALLOWED_BINDING, 'digibook.studentBinding invalid')
    require(digibook.get('studentReadiness') in ALLOWED_READINESS, 'digibook.studentReadiness invalid')
    require(digibook.get('surfaceTruth') in ALLOWED_SURFACE, 'digibook.surfaceTruth invalid')

    binding_rows(report.get('founderToStudentBinding'), 'founderToStudentBinding')
    binding_rows(report.get('missionVariableBinding'), 'missionVariableBinding')

    adaptive = report.get('adaptiveUi')
    require(isinstance(adaptive, dict), 'adaptiveUi missing')
    viewports = adaptive.get('viewports')
    require(isinstance(viewports, list) and len(viewports) >= 4, 'adaptiveUi.viewports incomplete')
    for i, vp in enumerate(viewports):
        for key in ('width','height','overflowCount','redScreenCount'):
            require(isinstance(vp.get(key), int), f'adaptiveUi.viewports[{i}].{key} must be int')
    require(isinstance(adaptive.get('riskRegister'), list), 'adaptiveUi.riskRegister must be list')
    require(isinstance(report.get('nextRepairSequence'), list) and report['nextRepairSequence'], 'nextRepairSequence missing')
    require(report.get('productionReadiness') == 'NOT_READY', 'productionReadiness must remain NOT_READY')


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--report', required=True)
    args = parser.parse_args()
    path = Path(args.report)
    try:
        report = json.loads(path.read_text(encoding='utf-8'))
        require(isinstance(report, dict), 'report root must be object')
        validate(report)
    except (OSError, json.JSONDecodeError, subprocess.CalledProcessError, AuditFailure) as error:
        print('STUDENT_PILLARS_R1_VALIDATION=FAIL')
        print(f'REASON={error}')
        return 1
    print('STUDENT_PILLARS_R1_VALIDATION=PASS')
    print(f'REPORT={path}')
    print(f'BASELINE={EXPECTED_BASELINE}')
    print(f'GRADLE_HASH={EXPECTED_GRADLE_HASH}')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())