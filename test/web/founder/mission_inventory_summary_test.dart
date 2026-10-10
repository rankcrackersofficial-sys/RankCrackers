import 'package:flutter_test/flutter_test.dart';

import 'package:rank_crackers/web/founder/mission_control/mission_inventory_summary.dart';

void main() {
  test('all Founder scope counters come from the same canonical snapshot', () {
    final summary = MissionInventorySummary.fromRealms([
      {'jurisdictionLevel': 'CENTRAL'},
      {'jurisdictionLevel': 'CENTRAL'},
      {'jurisdictionLevel': 'STATE', 'stateCode': 'RJ'},
      {'jurisdictionLevel': 'UT', 'stateCode': 'DL'},
      {'title': 'needs classification'},
    ]);

    expect(summary.total, 5);
    expect(summary.central, 2);
    expect(summary.state, 1);
    expect(summary.ut, 1);
    expect(summary.unclassified, 1);
    expect(summary.isConsistent, isTrue);
    expect(
      summary.total,
      summary.central + summary.state + summary.ut + summary.unclassified,
    );
  });
}
