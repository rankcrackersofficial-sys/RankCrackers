import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum AppThemeChoice { system, lightLuxe, luxuryNight }

class AppThemeController extends ChangeNotifier {
  static const _preferenceKey = 'rankcrackers.theme.choice';

  AppThemeChoice _choice;

  AppThemeController._(this._choice);

  static Future<AppThemeController> bootstrap() async {
    final preferences = await SharedPreferences.getInstance();
    final stored = preferences.getString(_preferenceKey);
    final choice = kIsWeb
        ? AppThemeChoice.lightLuxe
        : AppThemeChoice.values.firstWhere(
            (item) => item.name == stored,
            orElse: () => AppThemeChoice.luxuryNight,
          );
    return AppThemeController._(choice);
  }

  AppThemeChoice get choice => _choice;

  ThemeMode get themeMode {
    switch (_choice) {
      case AppThemeChoice.system:
        return ThemeMode.system;
      case AppThemeChoice.lightLuxe:
        return ThemeMode.light;
      case AppThemeChoice.luxuryNight:
        return ThemeMode.dark;
    }
  }

  Future<void> setChoice(AppThemeChoice choice) async {
    if (kIsWeb) choice = AppThemeChoice.lightLuxe;
    if (_choice == choice) return;
    _choice = choice;
    notifyListeners();
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(_preferenceKey, choice.name);
  }
}

class AppThemeScope extends InheritedNotifier<AppThemeController> {
  const AppThemeScope({
    required AppThemeController controller,
    required super.child,
    super.key,
  }) : super(notifier: controller);

  static AppThemeController of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<AppThemeScope>();
    assert(scope != null, 'AppThemeScope is missing above this context.');
    return scope!.notifier!;
  }
}
