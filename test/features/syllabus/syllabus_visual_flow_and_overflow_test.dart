import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rank_crackers/features/syllabus/presentation/providers/syllabus_tree_provider.dart';
import 'package:rank_crackers/features/syllabus/presentation/screens/syllabus_screen.dart';
import 'package:rank_crackers/shared/providers/session_provider.dart';
import 'package:rank_crackers/features/dashboard/presentation/providers/dashboard_provider.dart';
import 'package:rank_crackers/core/knowledge/knowledge_engine_provider.dart';
import 'package:rank_crackers/core/models/micro_topic_node.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  final sampleAtom = SyllabusNode(
    id: 'atom_1',
    title: 'Very Long Knowledge Node Title Regarding Fundamental SI Units and Dimensional Analysis Standards',
    type: 'atom',
    parentId: 'topic_1',
    subjectId: 'Physics',
  );

  final sampleTopic = SyllabusNode(
    id: 'topic_1',
    title: 'Units of measurement, systems of units, SI units, fundamental and derived units with extended descriptive phrases',
    type: 'topic',
    parentId: 'unit_1',
    subjectId: 'Physics',
    atomCount: 4,
    children: [sampleAtom],
  );

  final sampleUnit = SyllabusNode(
    id: 'unit_1',
    title: 'Unit 1 • Physics and Measurement with Highly Detailed Experimental Mechanics and Vector Foundations',
    type: 'unit',
    parentId: 'Physics',
    subjectId: 'Physics',
    topicCount: 157,
    atomCount: 424,
    children: [sampleTopic],
  );

  final sampleSubject = SyllabusNode(
    id: 'Physics',
    title: 'Physics',
    type: 'subject',
    subjectId: 'Physics',
    unitCount: 20,
    topicCount: 157,
    atomCount: 424,
    children: [sampleUnit],
  );

  final sampleChemistry = SyllabusNode(
    id: 'Chemistry',
    title: 'Chemistry',
    type: 'subject',
    subjectId: 'Chemistry',
    unitCount: 20,
    topicCount: 144,
    atomCount: 512,
    children: [],
  );

  final sampleMathematics = SyllabusNode(
    id: 'Mathematics',
    title: 'Mathematics',
    type: 'subject',
    subjectId: 'Mathematics',
    unitCount: 14,
    topicCount: 64,
    atomCount: 189,
    children: [],
  );

  final testTree = [sampleSubject, sampleChemistry, sampleMathematics];

  final mockUser = SessionUser(
    uid: 'test_uid',
    name: 'Test Warrior',
    email: 'warrior@rankcrackers.com',
    examName: 'jee_main_2026',
    examId: 'jee_main_2026',
    recruitmentId: 'jee_main_2026',
  );

  Widget createSubjectHarness({required double width, List<SyllabusNode>? customTree}) {
    return ProviderScope(
      overrides: [
        activeSessionUserProvider.overrideWithValue(mockUser),
        missionReadinessProvider.overrideWith((ref) => null),
        structuredNodesProvider.overrideWith((ref) => Stream.value([
          {'paperId': 'PAPER_1', 'runId': 'run_jee_full_materialization', 'nodeType': 'subject', 'subjectId': 'Physics'},
        ])),
        syllabusTreeProvider.overrideWithValue(customTree ?? testTree),
        allNodesProvider.overrideWithValue(<MicroTopicNode>[]),
      ],
      child: MaterialApp(
        home: MediaQuery(
          data: MediaQueryData(size: Size(width, 800)),
          child: const SizedBox(
            width: double.infinity,
            height: 800,
            child: SyllabusScreen(),
          ),
        ),
      ),
    );
  }

  group('RC_SYLLABUS_HIERARCHY_VISUAL_FLOW_AND_BREADCRUMB_OVERFLOW_REPAIR_34', () {
    
    testWidgets('1. NO_SUBJECT_LABEL_REPETITION - Subject root cards do not render SUBJECT badge', (tester) async {
      await tester.binding.setSurfaceSize(const Size(393, 800));
      await tester.pumpWidget(createSubjectHarness(width: 393));
      await tester.pumpAndSettle();

      // Verify subject titles render cleanly
      expect(find.text('Physics'), findsOneWidget);
      expect(find.text('Chemistry'), findsOneWidget);
      expect(find.text('Mathematics'), findsOneWidget);

      // Verify NO generic SUBJECT label exists
      expect(find.text('SUBJECT'), findsNothing);
      expect(find.text('20 Units • 157 Topics • 424 Knowledge Nodes'), findsOneWidget);
      expect(find.text('20 Units • 144 Topics • 512 Knowledge Nodes'), findsOneWidget);
      expect(find.text('14 Units • 64 Topics • 189 Knowledge Nodes'), findsOneWidget);
    });

    testWidgets('2. NO_UNIT_LABEL_REPETITION - Unit cards do not render repeated UNIT badge', (tester) async {
      await tester.binding.setSurfaceSize(const Size(393, 800));
      await tester.pumpWidget(createSubjectHarness(width: 393));
      await tester.pumpAndSettle();

      // Tap Physics to enter Unit level
      await tester.tap(find.text('Physics'));
      await tester.pumpAndSettle();

      // Verify Unit title renders
      expect(find.text('Unit 1 • Physics and Measurement with Highly Detailed Experimental Mechanics and Vector Foundations'), findsOneWidget);

      // Verify generic repeated UNIT badge is removed
      expect(find.text('UNIT'), findsNothing);
    });

    testWidgets('3. NO_TOPIC_LABEL_REPETITION - Topic cards do not render repeated TOPIC badge', (tester) async {
      await tester.binding.setSurfaceSize(const Size(393, 800));
      await tester.pumpWidget(createSubjectHarness(width: 393));
      await tester.pumpAndSettle();

      // Navigate to Physics -> Unit 1
      await tester.tap(find.text('Physics'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Unit 1 • Physics and Measurement with Highly Detailed Experimental Mechanics and Vector Foundations'));
      await tester.pumpAndSettle();

      // Verify Topic title renders
      expect(find.text('Units of measurement, systems of units, SI units, fundamental and derived units with extended descriptive phrases'), findsOneWidget);

      // Verify generic repeated TOPIC badge is removed
      expect(find.text('TOPIC'), findsNothing);
    });

    testWidgets('4. NO_KNOWLEDGE_NODE_LABEL_REPETITION - Knowledge node cards do not render generic KNOWLEDGE NODE badge', (tester) async {
      await tester.binding.setSurfaceSize(const Size(393, 800));
      await tester.pumpWidget(createSubjectHarness(width: 393));
      await tester.pumpAndSettle();

      // Navigate to Physics -> Unit 1 -> Topic 1
      await tester.tap(find.text('Physics'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Unit 1 • Physics and Measurement with Highly Detailed Experimental Mechanics and Vector Foundations'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Units of measurement, systems of units, SI units, fundamental and derived units with extended descriptive phrases'));
      await tester.pumpAndSettle();

      // Verify Atom / Knowledge Node title renders
      expect(find.text('Very Long Knowledge Node Title Regarding Fundamental SI Units and Dimensional Analysis Standards'), findsOneWidget);

      // Verify generic repeated KNOWLEDGE NODE badge is removed
      expect(find.text('KNOWLEDGE NODE'), findsNothing);
    });

    for (final width in [360.0, 393.0, 412.0]) {
      testWidgets('BREADCRUMB_AND_TITLE_NO_OVERFLOW at width $width', (tester) async {
        await tester.binding.setSurfaceSize(Size(width, 800));
        await tester.pumpWidget(createSubjectHarness(width: width));
        await tester.pumpAndSettle();

        // 1. ROOT (Depth 0)
        expect(tester.takeException(), isNull, reason: 'Depth 0 overflow on width $width');
        expect(find.text('JEE Main 2027'), findsWidgets);

        // 2. SUBJECT (Depth 1)
        await tester.tap(find.text('Physics'));
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull, reason: 'Depth 1 overflow on width $width');

        // 3. UNIT (Depth 2)
        await tester.tap(find.text('Unit 1 • Physics and Measurement with Highly Detailed Experimental Mechanics and Vector Foundations'));
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull, reason: 'Depth 2 overflow on width $width');

        // 4. TOPIC (Depth 3)
        await tester.tap(find.text('Units of measurement, systems of units, SI units, fundamental and derived units with extended descriptive phrases'));
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull, reason: 'Depth 3 overflow on width $width');

        // Back button navigation check without overflow
        final backButton = find.byIcon(Icons.arrow_back_ios_new_rounded);
        expect(backButton, findsOneWidget);

        await tester.tap(backButton);
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull, reason: 'Back tap to Depth 2 overflow on width $width');

        await tester.tap(backButton);
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull, reason: 'Back tap to Depth 1 overflow on width $width');

        await tester.tap(backButton);
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull, reason: 'Back tap to Depth 0 overflow on width $width');
      });
    }
  });
}
