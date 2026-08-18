# PERS-AAF-01 Validation Commands

# 1. Run all existing personalization recovery tests
flutter test test/features/personalization/recovery

# 2. Run new fail-closed bridge attack tests
flutter test docs/patch_safety/pers_aaf_01_clean_personalization_source_authority_20260818/tests/aaf_pers_bridge_attacks_test.dart

# 3. Analyze the personalization code quality and static contracts
flutter analyze lib/features/personalization
