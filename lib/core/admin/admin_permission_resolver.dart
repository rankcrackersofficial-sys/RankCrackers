/// Presentation-layer filtering for delegated Admin roles.
///
/// Only explicit true grants are accepted. Authentication/authorization for
/// reads and mutations must still be enforced by Firestore rules and callables.
/// The Founder role is granted separately by verified Firebase auth claims,
/// never by fields inside this untrusted map.
class AdminPermissionResolver {
  const AdminPermissionResolver._();

  static bool allows(Map<String, dynamic> permissions, String scope) {
    // A direct deny overrides all other representations.
    if (permissions.containsKey(scope)) {
      return permissions[scope] == true;
    }

    // Firestore user permissions may be stored as an explicit list of scopes.
    for (final key in const ['scopes', 'grants']) {
      final values = permissions[key];
      if (values is List && values.contains(scope)) return true;
    }

    // Also accept an explicitly granted nested object, e.g.
    // { 'syllabus': { 'review': true } }.
    dynamic current = permissions;
    for (final part in scope.split('.')) {
      if (current is! Map || !current.containsKey(part)) return false;
      current = current[part];
    }
    return current == true;
  }

  static bool canSeeSyllabusReview(Map<String, dynamic> permissions) =>
      allows(permissions, 'syllabus.review');

  static bool canSeePyqReview(Map<String, dynamic> permissions) =>
      allows(permissions, 'pyq.review');

  static bool canManageDocuments(Map<String, dynamic> permissions) =>
      allows(permissions, 'document.manage');

  static bool canUploadDocuments(Map<String, dynamic> permissions) =>
      allows(permissions, 'document.upload');

  static bool canSeeMissionControl(Map<String, dynamic> permissions) =>
      allows(permissions, 'mission.view');

  static bool canSeeStudyMaster(Map<String, dynamic> permissions) =>
      allows(permissions, 'study_master.view');

  static bool canSeeIngestion(Map<String, dynamic> permissions) =>
      allows(permissions, 'document.view');

  static bool canSeeIntelligenceRoom(Map<String, dynamic> permissions) =>
      allows(permissions, 'intelligence.view');

  static bool canSeeRecentActivity(Map<String, dynamic> permissions) =>
      allows(permissions, 'activity.view');
}
