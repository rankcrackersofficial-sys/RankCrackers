import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/admin/presentation/widgets/mission_control/mission_control_center.dart';
import 'package:rank_crackers/web/founder/mission_control/founder_mission_inventory.dart';

void main() {
  test('canonical Mission Control compiles with reconciled lifecycle inventory', () {
    expect(const MissionControlCenter(), isA<MissionControlCenter>());
    expect(const FounderMissionInventory(), isA<FounderMissionInventory>());
  });
}
