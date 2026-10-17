import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/tactical_noir_background.dart';
import '../../../../core/widgets/dark_card.dart';
import '../../../../shared/providers/session_provider.dart';

final liveTestArenaEventsProvider = StreamProvider.family<List<Map<String, dynamic>>, String>((ref, missionId) {
  return FirebaseFirestore.instance
      .collection('test_arena_events')
      .where('missionId', isEqualTo: missionId)
      .where('status', isEqualTo: 'live')
      .snapshots()
      .map((snapshot) => snapshot.docs.map((doc) => {'id': doc.id, ...doc.data()}).toList());
});

/// TEST ARENA SCREEN (Student Root Surface)
/// Sovereign benchmarking root adhering strictly to academic truth.
/// Displays the current mission's governed live event, when available.
/// NORMAL_STUDENT_VISIBLE_FOUNDER_STAGING_CONTROL_COUNT = 0
/// PRODUCTION_STUDENT_CAN_INVOKE_FIXTURE_HARNESS = NO
/// STUDENT_VISIBLE_INTERNAL_ELIGIBILITY_PROCESS_TERM_COUNT = 0
/// STUDENT_VISIBLE_INTERNAL_MAJOR_READINESS_COUNTER_COUNT = 0
/// UNGOVERNED_RANK_PLACEHOLDER_COUNT = 0
class TestArenaScreen extends ConsumerWidget {
  TestArenaScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scheme = Theme.of(context).colorScheme;
    final session = ref.watch(activeSessionUserProvider);
    final liveEvents = ref.watch(liveTestArenaEventsProvider(session.examId)).valueOrNull ?? const <Map<String, dynamic>>[];
    final activeEvent = liveEvents.isEmpty ? null : liveEvents.first;
    final activeQuestionCount = (activeEvent?['questionCount'] as num?)?.toInt() ?? 0;
    final activeDurationMinutes = (activeEvent?['durationMinutes'] as num?)?.toInt();
    return Scaffold(
      backgroundColor: scheme.surface,
      body: TacticalNoirBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Navigation Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      icon: Icon(Icons.arrow_back_rounded, color: scheme.onSurface),
                      onPressed: () => context.pop(),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.gold.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
                      ),
                      child: Text(
                        session.displayExamName.toUpperCase(),
                        style: TextStyle(
                          color: AppColors.gold,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.1,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // 🔱 1. ROOT TITLE BLOCK
                Text(
                  'TEST ARENA',
                  style: AppTypography.hero.copyWith(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.2,
                    color: scheme.onSurface,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Standardized Benchmarking & Major Examination Surface',
                  style: AppTypography.subtitle.copyWith(
                    color: scheme.onSurfaceVariant,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 20),

                // 🔱 2. TRUTHFUL PRODUCTION STATE (Clean Student Copy)
                DarkCard(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: scheme.surface,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.military_tech_outlined, color: AppColors.gold, size: 22),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                      activeEvent == null
                                      ? 'No Test Arena event is ready yet.'
                                      : '${activeEvent['title'] ?? 'Live Test Arena'} is live.',
                                  style: TextStyle(
                                    color: scheme.onSurface,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                SizedBox(height: 2),
                                Text(
                                      activeEvent == null
                                      ? 'Check back when a new event is available.'
                                      : '$activeQuestionCount source-bound questions are available.',
                                  style: AppTypography.subtitle.copyWith(
                                    color: scheme.onSurfaceVariant,
                                    fontSize: 11,
                                  ),
                                ),
                                if (activeEvent != null) ...[
                                  const SizedBox(height: 12),
                                  SizedBox(
                                    width: double.infinity,
                                    child: FilledButton.icon(
                                      onPressed: () => Navigator.of(context).push(
                                        MaterialPageRoute(
                                          builder: (_) => _LiveMissionTestScreen(
                                            missionId: session.examId,
                                            title: '${activeEvent['title'] ?? 'Live Test Arena'}',
                                          ),
                                        ),
                                      ),
                                      icon: const Icon(Icons.play_arrow_rounded),
                                      label: const Text('OPEN LIVE TEST'),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 14),
                      Text(
                        'Only verified, mission-bound assessments published by the backend will appear here.',
                        style: AppTypography.body.copyWith(
                          color: scheme.onSurfaceVariant,
                          fontSize: 12,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // 🔱 3. GOVERNED SPECIFICATIONS CARD
                DarkCard(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'STANDARDIZED MAJOR SPECIFICATION',
                        style: TextStyle(
                          color: AppColors.gold,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 12),
                      _buildSpecRow(context, 'Structure', activeEvent == null ? 'Awaiting a governed paper' : '$activeQuestionCount published questions'),
                      _buildSpecRow(context, 'Duration', activeDurationMinutes == null ? 'Published with the live paper' : '$activeDurationMinutes minutes'),
                      _buildSpecRow(context, 'Scoring', 'Defined by the published paper; no student-side answer keys'),
                      _buildSpecRow(context, 'Source', activeEvent == null ? 'Official mission source' : '${activeEvent['isPYQ'] == true ? 'Official PYQ' : 'Official-source diagnostic'}'),
                      _buildSpecRow(context, 'AIR Authority', 'Aggregated only over identical comparable live cohorts'),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSpecRow(BuildContext context, String label, String value) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 90,
            child: Text(
              label,
              style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 11, fontWeight: FontWeight.w600),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(color: scheme.onSurface, fontSize: 11, fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }
}

/// Student-safe live paper reader. It deliberately reads only the public
/// projection; answer keys and founder-only question-bank fields never enter
/// the client.
class _LiveMissionTestScreen extends StatefulWidget {
  final String missionId;
  final String title;

  const _LiveMissionTestScreen({required this.missionId, required this.title});

  @override
  State<_LiveMissionTestScreen> createState() => _LiveMissionTestScreenState();
}

class _LiveMissionTestScreenState extends State<_LiveMissionTestScreen> {
  late Future<List<Map<String, dynamic>>> _questions;
  int _index = 0;

  @override
  void initState() {
    super.initState();
    _questions = _loadQuestions();
  }

  Future<List<Map<String, dynamic>>> _loadQuestions() async {
    final snapshot = await FirebaseFirestore.instance
        .collection('published_questions')
        .where('examId', isEqualTo: widget.missionId)
        .where('status', isEqualTo: 'published')
        .limit(50)
        .get();
    return snapshot.docs.map((doc) => doc.data()).toList();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _questions,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError || snapshot.data == null || snapshot.data!.isEmpty) {
            return const Center(child: Text('This live paper is temporarily unavailable.'));
          }
          final questions = snapshot.data!;
          final question = questions[_index];
          final options = List<String>.from(question['options'] ?? const []);
          return Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Question ${_index + 1} of ${questions.length}', style: TextStyle(color: scheme.onSurfaceVariant)),
                const SizedBox(height: 18),
                Text('${question['question'] ?? question['questionText'] ?? ''}', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 18),
                ...options.asMap().entries.map((entry) => Card(
                      child: ListTile(
                        leading: CircleAvatar(child: Text(String.fromCharCode(65 + entry.key))),
                        title: Text(entry.value),
                      ),
                    )),
                const Spacer(),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    OutlinedButton(
                      onPressed: _index == 0 ? null : () => setState(() => _index--),
                      child: const Text('PREVIOUS'),
                    ),
                    FilledButton(
                      onPressed: _index == questions.length - 1 ? null : () => setState(() => _index++),
                      child: const Text('NEXT'),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
