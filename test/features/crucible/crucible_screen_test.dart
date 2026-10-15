import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rank_crackers/features/crucible/presentation/screens/crucible_screen.dart';
import 'package:rank_crackers/features/crucible/core/crucible_canonical_schedules.dart';
import 'package:rank_crackers/features/crucible/core/crucible_clock_engine.dart';
import 'package:rank_crackers/features/crucible/models/crucible_protocol_state.dart';
import 'package:rank_crackers/features/crucible/models/mission_crucible_blueprint.dart';
import 'package:rank_crackers/features/digibook/domain/services/digibook_canonical_bridge_service.dart';

void main() {
  group('Crucible Chief Architect Comprehensive Authority Tests', () {
    setUp(() {
      DigiBookCanonicalBridgeService.instance.initializeFromMap({
        'version': '1.0.0',
        'lessons': [
          {
            'guId': 'GU_JEEMAIN2027_PHY_54665F87',
            'subject': 'Physics',
            'canonicalNodeId': 'JEE_MAIN_2026_PHY_U01_T_54665f87',
            'topic': 'Dimensional Analysis',
            'lessonRevision': 'REV_01',
            'atomicFactIds': ['AF_01', 'AF_02'],
            'factSemantics': 'SOURCE_FACT_COMPLETE',
            'privateLessonAuthorityPath': '',
          },
          {
            'guId': 'GU_JEEMAIN2027_PHY_8B5D7BD6',
            'subject': 'Physics',
            'canonicalNodeId': 'JEE_MAIN_2026_PHY_U05_T_8b5d7bd6',
            'topic': 'Centre of Mass & Rotational Motion',
            'lessonRevision': 'REV_01',
            'atomicFactIds': ['AF_03', 'AF_04'],
            'factSemantics': 'SOURCE_FACT_COMPLETE',
            'privateLessonAuthorityPath': '',
          },
          {
            'guId': 'GU_JEEMAIN2027_PHY_REM_0001',
            'subject': 'Physics',
            'canonicalNodeId': 'JEE_MAIN_2026_PHY_U_REM_0001',
            'topic': 'Centre of Mass of System',
            'lessonRevision': 'REV_01',
            'atomicFactIds': ['AF_05', 'AF_06'],
            'factSemantics': 'SOURCE_FACT_COMPLETE',
            'privateLessonAuthorityPath': '',
          },
        ],
      });
    });

    // =========================================================================
    // 1. SCHEDULE IDENTITY & REM0001 NON-COLLISION TESTS
    // =========================================================================
    test('1. Explicit Regression: REM_0001 != Properties of Matter & Fluids (S06)', () {
      final s06 = CrucibleCanonicalScheduleRegistry.getScheduleByNumber(6);
      expect(s06, isNotNull);
      expect(s06!.canonicalTitle, equals('Properties of Matter & Fluids'));
      // S06 must NOT contain GU_JEEMAIN2027_PHY_REM_0001
      expect(s06.generationUnitIds.contains('GU_JEEMAIN2027_PHY_REM_0001'), isFalse);
      expect(s06.generationUnitIds.isEmpty, isTrue);
      expect(s06.availability, equals(ScheduleDigiBookAvailability.none));

      // S04 (Centre of Mass & Rotational Motion) MUST contain REM_0001
      final s04 = CrucibleCanonicalScheduleRegistry.getScheduleByNumber(4);
      expect(s04, isNotNull);
      expect(s04!.canonicalTitle, equals('Centre of Mass & Rotational Motion'));
      expect(s04.generationUnitIds.contains('GU_JEEMAIN2027_PHY_REM_0001'), isTrue);
      expect(s04.generationUnitIds.contains('GU_JEEMAIN2027_PHY_8B5D7BD6'), isTrue);
      // Multi-GU supported
      expect(s04.generationUnitIds.length, greaterThan(1));
    });

    test('2. Zero Synthetic Suffixes on Canonical Node IDs (No _OSC / _WAV)', () {
      for (final schedule in CrucibleCanonicalScheduleRegistry.all42Schedules) {
        for (final nodeId in schedule.canonicalNodeIds) {
          expect(nodeId.endsWith('_OSC'), isFalse, reason: 'Node $nodeId in ${schedule.formattedCode} contains synthetic suffix _OSC');
          expect(nodeId.endsWith('_WAV'), isFalse, reason: 'Node $nodeId in ${schedule.formattedCode} contains synthetic suffix _WAV');
        }
      }
    });

    test('3. Founder-Locked Titles for S01–S12', () {
      final expectedTitles = [
        'Kinematics 1D',
        'Laws of Motion & Friction',
        'Work, Energy & Power',
        'Centre of Mass & Rotational Motion',
        'Gravitation & Satellite Motion',
        'Properties of Matter & Fluids',
        'Thermodynamics',
        'Kinetic Theory of Gases',
        'Oscillations & SHM',
        'Waves & Acoustics',
        'Electrostatics',
        'Potential & Capacitance',
      ];

      for (int i = 1; i <= 12; i++) {
        final sch = CrucibleCanonicalScheduleRegistry.getScheduleByNumber(i);
        expect(sch, isNotNull);
        expect(sch!.canonicalTitle, equals(expectedTitles[i - 1]));
      }
    });

    // =========================================================================
    // 2. GLOBAL CLOCK ENGINE ARITHMETIC TESTS
    // =========================================================================
    test('4. Global Clock: 98-Day Continuous Ring, Orbit Index & Zero Day99', () {
      final start = DateTime(2026, 1, 1, 10, 0, 0);
      final bp = MissionCrucibleBlueprint.jeeMain2027Blueprint;

      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 1,
        currentScheduleId: 'sch_jee_main_2027_1',
        status: 'study',
        scheduleStartTime: start,
        protocolStartTime: start,
        currentBoundaryTime: start.add(const Duration(hours: 48)),
        isVIP: true,
        isStalled: false,
      );

      // Day 1
      expect(CrucibleClockEngine.getCycleDay(state: state, now: start, blueprint: bp), equals(1));
      expect(CrucibleClockEngine.getOrbitNumber(protocolStartTime: start, now: start, blueprint: bp), equals(1));

      // Day 13 (Rebuild 1)
      final day13 = start.add(const Duration(days: 12, hours: 2));
      expect(CrucibleClockEngine.getCycleDay(state: state, now: day13, blueprint: bp), equals(13));
      expect(CrucibleCanonicalScheduleRegistry.isRebuildDay(13), isTrue);

      // Day 14 (Macro 1)
      final day14 = start.add(const Duration(days: 13, hours: 2));
      expect(CrucibleClockEngine.getCycleDay(state: state, now: day14, blueprint: bp), equals(14));
      expect(CrucibleCanonicalScheduleRegistry.isMacroDay(14), isTrue);

      // Day 97 (Rebuild 7)
      final day97 = start.add(const Duration(days: 96, hours: 2));
      expect(CrucibleClockEngine.getCycleDay(state: state, now: day97, blueprint: bp), equals(97));
      expect(CrucibleCanonicalScheduleRegistry.isRebuildDay(97), isTrue);

      // Day 98 (Macro 7)
      final day98 = start.add(const Duration(days: 97, hours: 2));
      expect(CrucibleClockEngine.getCycleDay(state: state, now: day98, blueprint: bp), equals(98));
      expect(CrucibleCanonicalScheduleRegistry.isMacroDay(98), isTrue);

      // Day 99 -> Day 1 of Orbit 2 (Never Day 99)
      final day99 = start.add(const Duration(days: 98, hours: 2));
      final wrappedDay = CrucibleClockEngine.getCycleDay(state: state, now: day99, blueprint: bp);
      final orbit2 = CrucibleClockEngine.getOrbitNumber(protocolStartTime: start, now: day99, blueprint: bp);
      expect(wrappedDay, equals(1));
      expect(orbit2, equals(2));
      expect(wrappedDay >= 1 && wrappedDay <= 98, isTrue);
    });

    test('5. Late-joining student does not reset global ring', () {
      final missionStart = DateTime(2026, 1, 1, 10, 0, 0);
      final studentJoinDate = DateTime(2026, 3, 15, 14, 30, 0); // Day 74

      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 1,
        scheduleIndex: 1,
        currentScheduleId: 'sch_jee_main_2027_1',
        status: 'study',
        scheduleStartTime: missionStart,
        protocolStartTime: missionStart,
        currentBoundaryTime: missionStart.add(const Duration(hours: 48)),
        isVIP: true,
        isStalled: false,
      );

      final globalDay = CrucibleClockEngine.getCycleDay(
        state: state,
        now: studentJoinDate,
      );

      // Global day is independent of student join date
      expect(globalDay, equals(74));
      expect(CrucibleCanonicalScheduleRegistry.getPhaseForCycleDay(globalDay), equals(6));
    });

    // =========================================================================
    // 3. UI RENDERING & ASSESSMENT HOLDS
    // =========================================================================
    testWidgets('6. CrucibleScreen renders without jargon and with truthful holds', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: CrucibleScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Header
      expect(find.text('THE CRUCIBLE'), findsOneWidget);
      expect(find.text('JEE MAIN 2027'), findsAtLeastNWidgets(1));
      expect(find.text('Continuous Learning Ring'), findsOneWidget);

      // Truthful hold wordings (no operational jargon)
      expect(find.text('Micro assessment is not ready for this schedule yet.'), findsOneWidget);
      expect(find.text('Smart Entry — Not Ready'), findsNothing);
      expect(find.text('Test Arena — Not Ready'), findsOneWidget);
      expect(find.text('PERSONAL COVERAGE LEDGER'), findsOneWidget);

      // Ensure no forbidden terms are present
      expect(find.textContaining('PRODUCTION QUEUE'), findsNothing);
      expect(find.textContaining('HUMAN ACADEMIC SIGN-OFF'), findsNothing);
      expect(find.textContaining('Protocol Synchronization Required'), findsNothing);
      expect(find.textContaining('Day 99'), findsNothing);
      expect(find.textContaining('Day 100'), findsNothing);
      expect(find.textContaining('AIR '), findsNothing);
    });
  });
}
