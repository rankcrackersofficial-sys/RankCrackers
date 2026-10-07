import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/digibook/domain/services/digibook_canonical_bridge_service.dart';
import 'package:rank_crackers/features/digibook/domain/services/digibook_revision_service.dart';

void main() {
  group('DigiBook Revision Pointer Switch Tests (Closeout 04)', () {
    late DigiBookCanonicalBridgeService bridge;
    late DigiBookRevisionService revService;

    setUp(() {
      bridge = DigiBookCanonicalBridgeService.instance;
      revService = DigiBookRevisionService.instance;

      bridge.initializeFromMap({
        'version': '1.0.0',
        'lessons': [
          {
            'guId': 'GU_JEEMAIN2027_MAT_9BB8FB46',
            'subject': 'Mathematics',
            'canonicalNodeId': 'JEE_MAIN_2026_MAT_U01_T_00000001',
            'topic': 'Sets',
            'lessonRevision': 'REV_GU_JEEMAIN2027_MAT_9BB8FB46_V001',
            'atomicFactIds': ['AF_01', 'AF_02'],
            'factSemantics': 'SOURCE_FACT_COMPLETE',
            'privateLessonAuthorityPath': '',
          }
        ]
      });

      // Register mock payloads for V001 and V002
      revService.setMockRevisionPayload(
        'GU_JEEMAIN2027_MAT_9BB8FB46',
        'REV_GU_JEEMAIN2027_MAT_9BB8FB46_V001',
        {
          'generationUnitId': 'GU_JEEMAIN2027_MAT_9BB8FB46',
          'revisionId': 'REV_GU_JEEMAIN2027_MAT_9BB8FB46_V001',
          'atomicFactSetHash': 'hash_v001',
          'components': {
            'overview': {'overviewText': 'Overview V001'}
          }
        },
      );

      revService.setMockRevisionPayload(
        'GU_JEEMAIN2027_MAT_9BB8FB46',
        'REV_GU_JEEMAIN2027_MAT_9BB8FB46_V002',
        {
          'generationUnitId': 'GU_JEEMAIN2027_MAT_9BB8FB46',
          'revisionId': 'REV_GU_JEEMAIN2027_MAT_9BB8FB46_V002',
          'atomicFactSetHash': 'hash_v002',
          'components': {
            'overview': {'overviewText': 'Overview V002 Updated'}
          }
        },
      );
    });

    tearDown(() {
      revService.clearPointerOverride('GU_JEEMAIN2027_MAT_9BB8FB46');
    });

    test('Syllabus mapping stays fixed while revision pointer switches V001 -> V002', () async {
      const canonicalNodeId = 'JEE_MAIN_2026_MAT_U01_T_00000001';

      // 1. Verify Syllabus mapping stays fixed on GU_JEEMAIN2027_MAT_9BB8FB46
      final resolveResult = bridge.resolveCanonicalNode(canonicalNodeId);
      expect(resolveResult.isMapped, isTrue);
      expect(resolveResult.primaryEntry!.guId, equals('GU_JEEMAIN2027_MAT_9BB8FB46'));

      // 2. Default pointer / fallback resolves V001
      revService.setPointerOverride('GU_JEEMAIN2027_MAT_9BB8FB46', 'REV_GU_JEEMAIN2027_MAT_9BB8FB46_V001');
      final launchArgsV1 = await bridge.buildLaunchArgs('GU_JEEMAIN2027_MAT_9BB8FB46');

      expect(launchArgsV1, isNotNull);
      expect(launchArgsV1!.revisionId, equals('REV_GU_JEEMAIN2027_MAT_9BB8FB46_V001'));
      expect(launchArgsV1.atomicFactSetHash, equals('hash_v001'));
      expect(launchArgsV1.componentOverview?['overviewText'], equals('Overview V001'));

      // 3. Switch current revision pointer to V002 (WITHOUT mutating Syllabus mapping)
      revService.setPointerOverride('GU_JEEMAIN2027_MAT_9BB8FB46', 'REV_GU_JEEMAIN2027_MAT_9BB8FB46_V002');

      // Syllabus mapping check again
      final resolveResult2 = bridge.resolveCanonicalNode(canonicalNodeId);
      expect(resolveResult2.primaryEntry!.guId, equals('GU_JEEMAIN2027_MAT_9BB8FB46'));

      // Build launch args for switched pointer
      final launchArgsV2 = await bridge.buildLaunchArgs('GU_JEEMAIN2027_MAT_9BB8FB46');

      expect(launchArgsV2, isNotNull);
      expect(launchArgsV2!.revisionId, equals('REV_GU_JEEMAIN2027_MAT_9BB8FB46_V002'));
      expect(launchArgsV2.atomicFactSetHash, equals('hash_v002'));
      expect(launchArgsV2.componentOverview?['overviewText'], equals('Overview V002 Updated'));
    });
  });
}
