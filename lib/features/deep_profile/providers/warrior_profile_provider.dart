import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/warrior_profile.dart';
import '../services/warrior_profile_service.dart';

final warriorProfileProvider = StateNotifierProvider<WarriorProfileNotifier, WarriorProfile?>((ref) {
  return WarriorProfileNotifier();
});

class WarriorProfileNotifier extends StateNotifier<WarriorProfile?> {
  WarriorProfileNotifier() : super(null);

  Future<void> loadProfile(String uid) async {
    try {
      final profile = await WarriorProfileService.getProfile(uid).timeout(
        const Duration(seconds: 5),
        onTimeout: () => throw TimeoutException("Profile fetch timed out"),
      );
      state = profile ?? WarriorProfile(uid: uid);
    } catch (e) {
      state = WarriorProfile(uid: uid);
    }
  }

  Future<void> updateProfile(WarriorProfile updatedProfile) async {
    state = updatedProfile;
    await WarriorProfileService.autoSave(updatedProfile);
  }

  void clear() {
    state = null;
  }
}
