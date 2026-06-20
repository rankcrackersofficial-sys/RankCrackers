import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'app_language.dart';

class LanguageController extends ChangeNotifier {
  AppLanguage _currentLanguage = AppLanguage.english;

  AppLanguage get currentLanguage => _currentLanguage;

  bool get isHindi => _currentLanguage == AppLanguage.hindi;

  LanguageController() {
    _loadLanguage();
  }

  Future<void> _loadLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    final langIndex = prefs.getInt('app_language') ?? 0;
    _currentLanguage = AppLanguage.values[langIndex];
    notifyListeners();
  }

  Future<void> setLanguage(AppLanguage language) async {
    _currentLanguage = language;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('app_language', language.index);
  }
}
