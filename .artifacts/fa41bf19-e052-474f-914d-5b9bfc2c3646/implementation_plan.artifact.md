# Crucible Runtime Zero-Fake Fix 02

This plan addresses several UI/data binding defects in The Crucible identified from runtime video analysis. The goal is to ensure "Zero-Fake" compliance by removing unsupported claims, placeholders, and rendering artifacts.

## Proposed Changes

### [Crucible Component]

#### [MODIFY] [mission_blueprint_card.dart](file:///C:/RankCrackers/RankCrackers-55/lib/features/crucible/presentation/widgets/mission_blueprint_card.dart)
- Add `hasEvidence` parameter.
- Conditional subtitle for "TODAY'S DHARMA":
  - If `hasEvidence` is true: "Today's tactical objectives generated from your weakest and highest priority learning nodes."
  - If `hasEvidence` is false: "Tactical priorities will appear after enough learning evidence is available."

#### [MODIFY] [crucible_screen.dart](file:///C:/RankCrackers/RankCrackers-55/lib/features/crucible/presentation/screens/crucible_screen.dart)
- Pass `hasCrucibleEvidence` to `MissionBlueprintCard`.
- Improve `missions` logic:
  - If `plan.isEmpty` but `hasCrucibleEvidence` is true, show "Awaiting tactical generation..."
  - If `hasCrucibleEvidence` is false, show "EVIDENCE PENDING".
- Fix `TacticalRoadmapCard` tasks:
  - If `hasCrucibleEvidence` is false, all tasks show "EVIDENCE PENDING".
  - Remove generic hardcoded tasks like "MCQ Practice", "Revision Cycle", etc., when real data is missing.

#### [MODIFY] [battle_engine_card.dart](file:///C:/RankCrackers/RankCrackers-55/lib/features/crucible/presentation/widgets/battle_engine_card.dart)
- Fix the potential text concatenation/corruption issue in `_evidencePendingRow`.
- Change "Pending" label in the no-evidence state to "Remaining" to avoid "Pending Evidence Pending" confusion.
- Ensure `EVIDENCE PENDING` text is clearly separated and styled to avoid overlap.

## Verification Plan

### Automated Tests
- Run `flutter analyze` to ensure no regressions.
- Create/Run targeted unit tests for `CrucibleMasterEngine` and `CrucibleScreen` state logic.

### Manual Verification
- Verify the UI on an emulator/device.
- Test with `hasCrucibleEvidence` = true and false.
- Confirm "No Active Mission" contradiction is resolved.
- Confirm "Today's Dharma" claim is correctly conditioned.
- Confirm corrupted "PENDING" text is fixed.
