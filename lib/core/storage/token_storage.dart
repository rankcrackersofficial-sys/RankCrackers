import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenStorage {

  static final FlutterSecureStorage storage =
  FlutterSecureStorage();

  static const String accessTokenKey =
      'access_token';

  static Future<void> saveToken(
      String token,
      ) async {

    await storage.write(
      key: accessTokenKey,
      value: token,
    );
  }

  static Future<String?> getToken()
  async {

    return await storage.read(
      key: accessTokenKey,
    );
  }

  static Future<void> clearToken()
  async {

    await storage.delete(
      key: accessTokenKey,
    );
  }
}