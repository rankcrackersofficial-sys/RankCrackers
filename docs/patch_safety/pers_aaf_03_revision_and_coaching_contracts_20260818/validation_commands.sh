# PERS-AAF-03 Validation Commands

# 1. Execute the 27 fail-closed Revision and Coaching contracts unit tests
flutter test docs/patch_safety/pers_aaf_03_revision_and_coaching_contracts_20260818/tests/revision_coaching_contracts_test.dart

# 2. Run static analysis over the contracts package to verify compile safety
flutter analyze docs/patch_safety/pers_aaf_03_revision_and_coaching_contracts_20260818/
