import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/crucible/presentation/widgets/live_timer_card.dart';
import 'package:rank_crackers/features/crucible/core/crucible_clock_engine.dart';
import 'package:rank_crackers/features/crucible/models/crucible_protocol_state.dart';

void main() {
  final sizes = [
    Size(320, 568),
    Size(360, 800),
    Size(393, 873),
    Size(412, 915),
  ];
  final textScales = [1.0, 1.2, 1.3];

  group('LiveTimerCard responsive', () {
    for (final size in sizes) {
      for (final ts in textScales) {
        testWidgets('size ${size.width}x${size.height} textScale $ts',
            (WidgetTester tester) async {
          final protocol = CrucibleProtocolState(
            recruitmentId: 'r1',
            phaseIndex: 1,
            scheduleIndex: 1,
            currentScheduleId: 's1',
            status: 'study',
            scheduleStartTime: DateTime.now(),
            protocolStartTime: DateTime.now().subtract(const Duration(days: 16)),
            currentBoundaryTime: DateTime.now().add(const Duration(hours: 4)),
            isVIP: false,
            isStalled: false,
          );

          await tester.pumpWidget(MaterialApp(
            home: MediaQuery(
              data: MediaQueryData(size: size, textScaleFactor: ts),
              child: Scaffold(
                body: LiveTimerCard(day: 17, phase: 2, protocolState: protocol),
              ),
            ),
          ));

          await tester.pumpAndSettle(const Duration(milliseconds: 200));

          // Ensure no overflow errors were reported during layout
          expect(tester.takeException(), isNull);
        });
      }
    }
  });
}
