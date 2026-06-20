import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class RouteGuard {
  static const _storage = FlutterSecureStorage();

  static Future<bool> isLoggedIn() async {
    final token = await _storage.read(key: 'auth_token');

    return token != null && token.isNotEmpty;
  }
}
