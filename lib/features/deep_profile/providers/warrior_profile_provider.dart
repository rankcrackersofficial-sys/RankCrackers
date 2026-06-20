import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/warrior_profile.dart';
import '../services/warrior_profile_service.dart';

final warriorProfileProvider = StateNotifierProvider<WarriorProfileNotifier, WarriorProfile?>((ref) {
  return WarriorProfileNotifier();
});

class WarriorProfileNotifier extends StateNotifier<WarriorProfile?> {
  WarriorProfileNotifier() : super(null);

  Future<void> loadProfile(String uid) async {
    final profile = await WarriorProfileService.getProfile(uid);
    state = profile;
  }

  void updateProfile(WarriorProfile updatedProfile) {
    state = updatedProfile;
    WarriorProfileService.autoSave(updatedProfile);
  }
}
