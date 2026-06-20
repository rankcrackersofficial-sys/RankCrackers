import '../../config/app_config.dart';

class ApiConstants {

  static String get baseUrl =>
      AppConfig.baseUrl;

  // ================= AUTH =================

  static const String login =
      '/auth/login';

  static const String signup =
      '/auth/signup';

  static const String logout =
      '/auth/logout';

  static const String profile =
      '/auth/profile';

  // ================= DASHBOARD =================

  static const String dashboard =
      '/dashboard';

  // ================= TEST =================

  static const String generateTest =
      '/test/generate';

  static const String submitTest =
      '/test/submit';

  // ================= AI =================
  // Backend controlled only

  static const String aiAnalysis =
      '/ai/analysis';

  static const String weakTopics =
      '/ai/weak-topics';

}
