import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/personalization/domain/engines/crucible_personalized_item_selector.dart';
import 'package:rank_crackers/features/personalization/domain/models/crucible_personalization_blueprint.dart';

void main() {
  test('selector admits only approved source-backed exact bucket items', () {
    final t = DateTime.utc(2026, 8, 16);
    final b = CruciblePersonalizationBlueprint(
        studentId: 's',
        targetAmtnId: 'a',
        createdAtUtc: t,
        totalQuestionCount: 1,
        durationMinutes: 2,
        schemaVersion: 2,
        allocations: [
          const CruciblePersonalizationAllocation(
              bucket: CruciblePersonalizationBucketType.independent,
              questionCount: 1,
              difficulty: CruciblePersonalizationDifficultyBand.standard,
              reason: CruciblePersonalizationReason.maintenance)
        ]);
    final out =
        const CruciblePersonalizedItemSelector().select(blueprint: b, pool: [
      const CrucibleSelectableItem(
          itemId: 'i',
          amtnId: 'a',
          bucket: CruciblePersonalizationBucketType.independent,
          difficulty: CruciblePersonalizationDifficultyBand.standard,
          format: CrucibleSelectableItemFormat.multipleChoice,
          readiness: CrucibleSelectableItemReadiness.approved,
          sourceBacked: true)
    ]);
    expect(out.single.itemId, 'i');
  });
}
