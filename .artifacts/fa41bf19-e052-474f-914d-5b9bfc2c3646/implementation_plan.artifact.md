# Crucible Runtime Zero-Fake Fix 03

This plan addresses the "stale/hardcoded" Day and Remaining Time issues in The Crucible. The goal is to ensure all temporal data is bound to the canonical live protocol authority and remove all fake hardcoded fallbacks.

## Proposed Changes

### [Crucible Component]

#### [MODIFY] [crucible_screen.dart](file:///C:/RankCrackers/RankCrackers-55/lib/features/crucible/presentation/screens/crucible_screen.dart)
- Remove the hardcoded Day 17 fallback in the `build` method.
- Handle `protocolStateAsync` using `when` or proper null-checking.
- If the protocol state is loading or missing, show a "Mission Authority Pending" or "Loading..." state instead of fake data.
- Ensure `currentDay`, `currentPhase`, and `progress` are only calculated when authoritative state is available.

#### [MODIFY] [live_timer_card.dart](file:///C:/RankCrackers/RankCrackers-55/lib/features/crucible/presentation/widgets/live_timer_card.dart)
- Ensure the countdown timer is strictly bound to `protocolState.currentBoundaryTime` or the specific window type's end time.
- Verify `_formatDuration` provides the necessary precision (h m s) to avoid "rounded hour" confusion.

#### [MODIFY] [crucible_clock_engine.dart](file:///C:/RankCrackers/RankCrackers-55/lib/features/crucible/core/crucible_clock_engine.dart)
- Remove/Cleanup the legacy `getHoursRemaining()` method which was bound to calendar day end.
- Rename it or ensure it's not leaked into production UI.

## Verification Plan

### Automated Tests
- Run `flutter analyze` on target files.
- Run `zero_fake_ui_test.dart` and add cases for missing protocol state.

### Manual Verification
- **Fresh Build:** Build and install the latest HEAD on the Samsung physical device.
- **Authority Check:** Confirm that "DAY 17" is not shown for new users or when data is loading.
- **Clock Check:** Confirm the countdown timer is moving and matches the calculated protocol window remaining time.
- **Lineage Verification:** Report the actual HEAD SHA and device details in the final report.
