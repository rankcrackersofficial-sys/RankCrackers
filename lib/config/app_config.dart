import 'environment.dart';

class AppConfig {

  static String get baseUrl =>
      Environment.baseUrl;

  static bool get enableLogs =>
      !Environment.isProduction;

}
