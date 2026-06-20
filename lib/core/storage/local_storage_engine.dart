import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class LocalStorageEngine {
  // ===================================================
  // SAVE
  // ===================================================
  static Future<void> save({
    required String key,
    required dynamic value,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final encoded = jsonEncode(value);
    await prefs.setString(key, encoded);
  }

  // ===================================================
  // LOAD
  // ===================================================
  static Future<dynamic> load(String key) async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString(key);
    if (data == null) {
      return null;
    }
    return jsonDecode(data);
  }
}
