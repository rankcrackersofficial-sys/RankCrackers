/// Presentation-layer filtering for delegated Admin roles.
///
/// Only explicit true grants are accepted. Authentication/authorization for
/// reads and mutations must still be enforced by Firestore rules and callables.
/// The Founder role is granted separately by verified Firebase auth claims,
/// never by fields inside this untrusted map.
class AdminPermissionResolver {
  const AdminPermissionResolver._();

  static const String scopeDocumentsView = 'DOCUMENTS_VIEW';
  static const String scopeDocumentsUpload = 'DOCUMENTS_UPLOAD';
  static const String scopeSyllabusReview = 'SYLLABUS_REVIEW';
  static const String scopePyqReview = 'PYQ_REVIEW';
  static const String scopeMissionCreate = 'MISSION_CREATE';
  static const String scopeStudyMaster = 'STUDY_MASTER';

  static const List<String> canonicalScopes = [
    scopeDocumentsView,
    scopeDocumentsUpload,
    scopeSyllabusReview,
    scopePyqReview,
    scopeMissionCreate,
    scopeStudyMaster,
  ];

  static const Map<String, String> _scopeAliases = {
    'document.view': scopeDocumentsView,
    'document.upload': scopeDocumentsUpload,
    'syllabus.review': scopeSyllabusReview,
    'pyq.review': scopePyqReview,
    'mission.view': scopeMissionCreate,
    'study_master.view': scopeStudyMaster,
  };

  static String? _getAlias(String scope) {
    if (_scopeAliases.containsKey(scope)) {
      return _scopeAliases[scope];
    }
    for (final entry in _scopeAliases.entries) {
      if (entry.value == scope) {
        return entry.key;
      }
    }
    return null;
  }

  static bool allows(Map<String, dynamic> permissions, String scope) {
    final alias = _getAlias(scope);

    // A direct deny overrides all other representations.
    if (permissions.containsKey(scope)) {
      if (permissions[scope] != true) return false;
      return true;
    }
    if (alias != null && permissions.containsKey(alias)) {
      if (permissions[alias] != true) return false;
      return true;
    }

    // Firestore user permissions may be stored as an explicit list of scopes.
    for (final key in const ['scopes', 'grants']) {
      final values = permissions[key];
      if (values is List) {
        if (values.contains(scope)) return true;
        if (alias != null && values.contains(alias)) return true;
      }
    }

    // Also accept an explicitly granted nested object, e.g.
    // { 'syllabus': { 'review': true } }.
    dynamic current = permissions;
    for (final part in scope.split('.')) {
      if (current is! Map || !current.containsKey(part)) {
        current = null;
        break;
      }
      current = current[part];
    }
    if (current == true) return true;

    if (alias != null) {
      dynamic aliasCurrent = permissions;
      for (final part in alias.split('.')) {
        if (aliasCurrent is! Map || !aliasCurrent.containsKey(part)) {
          aliasCurrent = null;
          break;
        }
        aliasCurrent = aliasCurrent[part];
      }
      if (aliasCurrent == true) return true;
    }

    return false;
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
