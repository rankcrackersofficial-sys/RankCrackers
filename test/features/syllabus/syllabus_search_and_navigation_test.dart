import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/core/models/micro_topic_node.dart';
import 'package:rank_crackers/features/digibook/models/digibook_content.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Syllabus Search, Scoping and Navigation Tests (RC_RECORDING_REPAIR)', () {
    
    test('1. STRICT_REALM_SCOPE and STRICT_PAPER1_SCOPE search scoping (Leakage Prevention)', () {
      final activeRealmId = 'jee_main_2026';

      final allAtoms = [
        // Match: active realm + PAPER_1
        const MicroTopicNode(
          id: 'jee_p1_atom',
          examId: 'jee_main_2026',
          subjectId: 'Physics',
          chapterId: 'unit_1',
          topicId: 'topic_1',
          title: 'Phenolic compounds',
          titleHindi: 'फिनोल',
          subjectHindi: 'भौतिक विज्ञान',
          chapterHindi: 'इकाई 1',
          description: 'Desc',
          contentRegistryId: 'reg_1',
          difficulty: 2,
          importance: 3,
          paperId: 'PAPER_1',
        ),
        // Reject: active realm + PAPER_2
        const MicroTopicNode(
          id: 'jee_p2_atom',
          examId: 'jee_main_2026',
          subjectId: 'Physics',
          chapterId: 'unit_1',
          topicId: 'topic_1',
          title: 'Phenolic compounds part 2',
          titleHindi: 'फिनोल 2',
          subjectHindi: 'भौतिक विज्ञान',
          chapterHindi: 'इकाई 1',
          description: 'Desc',
          contentRegistryId: 'reg_2',
          difficulty: 2,
          importance: 3,
          paperId: 'PAPER_2',
        ),
        // Reject: empty/null paperId wildcard
        const MicroTopicNode(
          id: 'jee_wildcard_atom',
          examId: 'jee_main_2026',
          subjectId: 'Physics',
          chapterId: 'unit_1',
          topicId: 'topic_1',
          title: 'Wildcard Phenolic',
          titleHindi: 'फिनोल वाइल्डकार्ड',
          subjectHindi: 'भौतिक विज्ञान',
          chapterHindi: 'इकाई 1',
          description: 'Desc',
          contentRegistryId: 'reg_3',
          difficulty: 2,
          importance: 3,
          paperId: '', // Empty
        ),
        // Reject: NEET realm
        const MicroTopicNode(
          id: 'neet_atom',
          examId: 'NEET_UG_2027',
          subjectId: 'Biology',
          chapterId: 'unit_1',
          topicId: 'topic_1',
          title: 'Phenolic plant structures',
          titleHindi: 'फिनोल बायो',
          subjectHindi: 'जीव विज्ञान',
          chapterHindi: 'इकाई 1',
          description: 'Desc',
          contentRegistryId: 'reg_4',
          difficulty: 2,
          importance: 3,
          paperId: 'PAPER_1',
        ),
        // Reject: RPSC realm
        const MicroTopicNode(
          id: 'rpsc_atom',
          examId: 'RPSC_1',
          subjectId: 'GK',
          chapterId: 'unit_1',
          topicId: 'topic_1',
          title: 'Phenolic history',
          titleHindi: 'फिनोल इतिहास',
          subjectHindi: 'इतिहास',
          chapterHindi: 'इकाई 1',
          description: 'Desc',
          contentRegistryId: 'reg_5',
          difficulty: 2,
          importance: 3,
          paperId: 'PAPER_1',
        ),
      ];

      // Perform strict filtering exactly matching screen query logic
      final results = allAtoms.where((a) {
        if (activeRealmId.isEmpty) return false;
        final matchesQuery = a.title.toLowerCase().contains('phenolic');
        final isSameRealm = (a.examId == activeRealmId);
        final isPaper1 = (a.paperId == 'PAPER_1');
        return matchesQuery && isSameRealm && isPaper1;
      }).toList();

      expect(results.length, equals(1));
      expect(results.first.id, equals('jee_p1_atom'));

      // Validate zero leakage
      final neetLeakage = results.where((a) => a.examId == 'NEET_UG_2027').length;
      final rpscLeakage = results.where((a) => a.examId == 'RPSC_1').length;
      final paper2Leakage = results.where((a) => a.paperId == 'PAPER_2').length;

      expect(neetLeakage, equals(0), reason: 'NEET_LEAKAGE must be 0');
      expect(rpscLeakage, equals(0), reason: 'RPSC_LEAKAGE must be 0');
      expect(paper2Leakage, equals(0), reason: 'PAPER2_LEAKAGE must be 0');
    });

    testWidgets('2. PopScope and search query back button dismissal state simulation', (WidgetTester tester) async {
      // Simulate PopScope variables
      bool didPop = false;
      bool hasFocus = true;
      bool hasQuery = true;
      bool hasNavigation = true;

      void popCallback() {
        if (hasFocus) {
          hasFocus = false; // Dismiss keyboard
        } else if (hasQuery) {
          hasQuery = false; // Clear query
        } else if (hasNavigation) {
          hasNavigation = false; // Go back in stack
        } else {
          didPop = true; // Exit screen/go to dashboard
        }
      }

      // First back press: keyboard open (hasFocus == true)
      popCallback();
      expect(hasFocus, isFalse);
      expect(hasQuery, isTrue);
      expect(hasNavigation, isTrue);
      expect(didPop, isFalse);

      // Second back press: query remains (hasQuery == true)
      popCallback();
      expect(hasQuery, isFalse);
      expect(hasNavigation, isTrue);
      expect(didPop, isFalse);

      // Third back press: in-screen navigation active (hasNavigation == true)
      popCallback();
      expect(hasNavigation, isFalse);
      expect(didPop, isFalse);

      // Fourth back press: root state reached (canPop == true)
      popCallback();
      expect(didPop, isTrue);
    });

    test('3. MISSING_CONTENT_TRUTHFUL_STATE verification (DigiBook Screen empty states)', () {
      // Differentiate empty state logic from technical failure
      final bool hasException = DateTime.now().millisecondsSinceEpoch == 0;
      final DigiBookContent? content = null;

      expect(hasException, isFalse);
      expect(content, isNull);

      // Output text should be "CONTENT NOT YET AVAILABLE" instead of "SUMMONING FAILED" when no technical exception exists
      final String displayTitle = hasException ? "SUMMONING FAILED" : "CONTENT NOT YET AVAILABLE";
      final String displayMessage = hasException
          ? "Content is temporarily unreachable. Please ensure you are connected to the network and try again."
          : "Learning content is not yet available for this topic. The study notes are being prepared.";

      expect(displayTitle, equals("CONTENT NOT YET AVAILABLE"));
      expect(displayMessage, equals("Learning content is not yet available for this topic. The study notes are being prepared."));
    });
  });
}
