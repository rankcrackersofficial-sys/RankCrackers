/// RankCrackers deterministic governed Crucible Item Selector.
/// CODE NO: PERS-17-R2
library;

import '../models/crucible_personalization_blueprint.dart';

enum CrucibleSelectableItemFormat { multipleChoice, numeric, shortAnswer }

enum CrucibleSelectableItemReadiness { approved, held, rejected, archived }

final class CrucibleSelectableItem {
  const CrucibleSelectableItem({
    required this.itemId,
    required this.amtnId,
    required this.bucket,
    required this.difficulty,
    required this.format,
    required this.readiness,
    required this.sourceBacked,
  });

  final String itemId;
  final String amtnId;
  final CruciblePersonalizationBucketType bucket;
  final CruciblePersonalizationDifficultyBand difficulty;
  final CrucibleSelectableItemFormat format;
  final CrucibleSelectableItemReadiness readiness;
  final bool sourceBacked;
}

final class CruciblePersonalizedItemSelector {
  const CruciblePersonalizedItemSelector();

  List<CrucibleSelectableItem> select({
    required CruciblePersonalizationBlueprint blueprint,
    required Iterable<CrucibleSelectableItem> pool,
  }) {
    blueprint.validate();
    final candidates = pool
        .where((i) =>
            i.amtnId == blueprint.targetAmtnId &&
            i.readiness == CrucibleSelectableItemReadiness.approved &&
            i.sourceBacked)
        .toList()
      ..sort((a, b) => a.itemId.compareTo(b.itemId));

    final selected = <CrucibleSelectableItem>[];
    final used = <String>{};

    for (final allocation in blueprint.allocations) {
      final bucketItems = candidates
          .where((i) =>
              i.bucket == allocation.bucket &&
              i.difficulty == allocation.difficulty &&
              !used.contains(i.itemId))
          .take(allocation.questionCount)
          .toList();

      if (bucketItems.length != allocation.questionCount) {
        throw FormatException(
          'Insufficient approved source-backed items for ${allocation.bucket}.',
        );
      }
      for (final item in bucketItems) {
        used.add(item.itemId);
        selected.add(item);
      }
    }
    return List.unmodifiable(selected);
  }
}
