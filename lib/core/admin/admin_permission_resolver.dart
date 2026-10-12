class AdminPermissionResolver {
  static bool canSeeSyllabusReview(Map<String, dynamic> permissions) => true;
  static bool canSeePyqReview(Map<String, dynamic> permissions) => true;
  static bool canManageDocuments(Map<String, dynamic> permissions) => true;
  static bool canUploadDocuments(Map<String, dynamic> permissions) => true;

  // Additional guards used by unified_command_console and other web stubs
  static bool canSeeMissionControl(Map<String, dynamic> permissions) => true;
  static bool canSeeStudyMaster(Map<String, dynamic> permissions) => true;
  static bool canSeeIngestion(Map<String, dynamic> permissions) => true;
  static bool canSeeIntelligenceRoom(Map<String, dynamic> permissions) => true;
  static bool canSeeRecentActivity(Map<String, dynamic> permissions) => true;
}
