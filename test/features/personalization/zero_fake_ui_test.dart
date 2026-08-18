import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/database/local/dashboard_local_datasource.dart';
import 'package:rank_crackers/features/dashboard/data/repositories/dashboard_repository.dart';
import 'package:rank_crackers/core/engines/pyq_linkage_engine.dart';
import 'package:rank_crackers/core/engines/question_engine/distractor_engine.dart';
import 'package:rank_crackers/core/models/digibook_block.dart';

void main() {
  group('RC-STUDENT-ZERO-FAKE-01 Validation Tests', () {

    test('DashboardLocalDatasource returns empty topics - PASS', () async {
      final ds = DashboardLocalDatasource(null);
      expect(await ds.getAllTopics(), isEmpty);
      expect(await ds.getWeakTopics(), isEmpty);
    });

    test('DashboardRepository.mapTopics returns empty list - PASS', () {
      expect(DashboardRepository.mapTopics([]), isEmpty);
    });

    test('PYQLinkageEngine.mapTopic returns empty pyqIds - PASS', () async {
      final result = await PYQLinkageEngine.mapTopic('any_id');
      expect(result['pyqIds'], isEmpty);
      expect(result['pyqCount'], 0);
    });

    test('DistractorEngine does not use hardcoded fallbacks - PASS', () {
      final engine = DistractorEngine();
      final target = DigiBookBlock(
        id: 'b1',
        atomicTopicId: 't1',
        content: 'Correct Answer',
        type: 'concept_note',
        version: 1,
        updatedAt: DateTime.now(),
      );

      // With empty pool and siblings, it should return empty (fallback disabled)
      final distractors = engine.generateDistractors(target: target, pool: [], count: 3);
      expect(distractors, isEmpty);
      expect(distractors.contains('Incorrect Statement 1'), isFalse);
    });
  });
}
