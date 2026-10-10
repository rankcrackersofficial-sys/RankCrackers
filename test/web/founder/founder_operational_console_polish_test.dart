import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Founder primary console uses the approved four-zone architecture', () {
    final source = File('lib/web/shared/unified_command_console.dart').readAsStringSync();
    for (final group in const [
      'MISSION & DELIVERY',
      'CONTENT PIPELINE',
      'STUDENT & HEALTH',
      'SYSTEM & GOVERNANCE',
    ]) {
      expect(source, contains(group));
    }
    for (final module in const [
      'Mission Control',
      'Mission Delivery Preview',
      'Document Command Center',
      'Verification Center',
      'Factory Hub',
      'Publish Gate',
      'Student Delivery Health',
      'Admin Governance',
      'System Ops / Dev Mode',
    ]) {
      expect(source, contains("label: '$module'"));
    }
  });

  test('Founder primary navigation excludes duplicate and secondary surfaces', () {
    final source = File('lib/web/shared/unified_command_console.dart').readAsStringSync();
    final founderBlock = source.substring(
      source.indexOf('if (isFounder) {'),
      source.indexOf('} else {', source.indexOf('if (isFounder) {')),
    );
    expect(founderBlock, isNot(contains("label: 'Study Master Library'")));
    expect(founderBlock, isNot(contains("label: 'Command Center'")));
    expect(founderBlock, isNot(contains("label: 'Mission Variables'")));
  });

  test('desktop shell and inventory are compact and responsive', () {
    final shell = File('lib/main_web.dart').readAsStringSync();
    final inventory = File('lib/web/founder/mission_control/founder_mission_inventory.dart').readAsStringSync();
    expect(shell, isNot(contains('NavigationRailDestination')));
    expect(inventory, contains('constraints.maxWidth >= 1050'));
    expect(inventory, contains("_SummaryMetric('STUDENT LIVE'"));
    expect(inventory, contains("_SummaryMetric('DRAFT / EXTRA'"));
    expect(inventory, contains("_SummaryMetric('AUTHORITY BLOCKED'"));
  });
}
