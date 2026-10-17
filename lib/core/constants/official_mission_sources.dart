/// Canonical official source roles for automated mission ingestion.
///
/// These are source-of-truth configuration values, not UI upload defaults.
/// Notification and syllabus must remain separate artefacts.
class OfficialMissionSources {
  const OfficialMissionSources._();

  static const String sscCglNotification =
      'https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_cgl_2026.pdf';
  static const String sscCglSyllabus =
      'https://ssc.gov.in/api/attachment/uploads/masterData/Syllabus/CGL-syllabus-169635-.pdf';

  static String? notificationUrl(String missionId) =>
      missionId == 'ssc_cgl' ? sscCglNotification : null;

  static String? syllabusUrl(String missionId) =>
      missionId == 'ssc_cgl' ? sscCglSyllabus : null;
}
