import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/core/admin/admin_permission_resolver.dart';

void main() {
  test('unprivileged and malformed records fail closed for every module', () {
    final checks = <bool Function(Map<String, dynamic>)>[
      AdminPermissionResolver.canSeeSyllabusReview,
      AdminPermissionResolver.canSeePyqReview,
      AdminPermissionResolver.canManageDocuments,
      AdminPermissionResolver.canUploadDocuments,
      AdminPermissionResolver.canSeeMissionControl,
      AdminPermissionResolver.canSeeStudyMaster,
      AdminPermissionResolver.canSeeIngestion,
      AdminPermissionResolver.canSeeIntelligenceRoom,
      AdminPermissionResolver.canSeeRecentActivity,
    ];
    for (final check in checks) {
      expect(check({}), isFalse);
      expect(check({'admin': true, 'founder': true, 'all': true}), isFalse);
      expect(check({'scopes': '*'}), isFalse);
    }
  });

  test('each independent scope gates exactly its own access', () {
    const expected = <String, bool Function(Map<String, dynamic>)>{
      'syllabus.review': AdminPermissionResolver.canSeeSyllabusReview,
      'pyq.review': AdminPermissionResolver.canSeePyqReview,
      'document.manage': AdminPermissionResolver.canManageDocuments,
      'document.upload': AdminPermissionResolver.canUploadDocuments,
      'mission.view': AdminPermissionResolver.canSeeMissionControl,
      'study_master.view': AdminPermissionResolver.canSeeStudyMaster,
      'document.view': AdminPermissionResolver.canSeeIngestion,
      'intelligence.view': AdminPermissionResolver.canSeeIntelligenceRoom,
      'activity.view': AdminPermissionResolver.canSeeRecentActivity,
    };
    for (final entry in expected.entries) {
      final grants = {entry.key: true};
      expect(entry.value(grants), isTrue, reason: entry.key);
      for (final other in expected.entries.where((e) => e.key != entry.key)) {
        expect(other.value(grants), isFalse,
            reason: '${entry.key} must not grant ${other.key}');
      }
    }
  });

  test('explicit false overrides list grants and string truthiness is rejected', () {
    expect(AdminPermissionResolver.canSeeMissionControl({
      'mission.view': false,
      'scopes': ['mission.view'],
    }), isFalse);
    expect(AdminPermissionResolver.canSeeMissionControl({
      'mission.view': 'true',
    }), isFalse);
    expect(AdminPermissionResolver.canSeeMissionControl({
      'mission.view': 1,
    }), isFalse);
  });

  test('explicit list scopes and nested true grants work without wildcards', () {
    expect(AdminPermissionResolver.canSeePyqReview({
      'scopes': ['pyq.review'],
    }), isTrue);
    expect(AdminPermissionResolver.canSeeSyllabusReview({
      'syllabus': {'review': true},
    }), isTrue);
    expect(AdminPermissionResolver.canSeeIngestion({
      'grants': ['document.view'],
    }), isTrue);
    expect(AdminPermissionResolver.canSeeMissionControl({
      '*': true, 'mission': {'*': true},
    }), isFalse);
  });
}
