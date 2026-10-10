import 'package:flutter/material.dart';
import '../../../../core/models/question_model.dart';
import '../../../progress/data/progress_cloud_engine.dart';
import '../../../revision/data/memory_engine.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/dark_card.dart';

import '../../../../core/knowledge/knowledge_engine.dart';
import '../../../../core/telemetry/telemetry_engine.dart';
import '../../../progress/data/models/user_progress.dart';

/// MCQ CARD
/// The tactical unit for micro-combat. Type-safe and cloud-synced.
class McqCard extends StatefulWidget {
  final String nodeId;
  final QuestionModel mcq;
  final double currentMastery;

  const McqCard({
    super.key,
    required this.nodeId,
    required this.mcq,
    required this.currentMastery,
  });

  @override
  State<McqCard> createState() => _McqCardState();
}

class _McqCardState extends State<McqCard> {
  int? selected;
  bool submitted = false;

  @override
  Widget build(BuildContext context) {
    final options = widget.mcq.options;
    final correct = widget.mcq.answerIndex;

    return DarkCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.mcq.question,
            style: AppTypography.cardTitle,
          ),
          const SizedBox(height: 20),
          ...List.generate(
            options.length,
            (index) {
              final isCorrect = index == correct;
              final isSelected = selected == index;

              Color borderColor = AppColors.border;

              if (submitted && isCorrect) {
                borderColor = AppColors.success;
              }
              if (submitted && isSelected && !isCorrect) {
                borderColor = AppColors.error;
              }

              return GestureDetector(
                onTap: () {
                  if (submitted) return;
                  setState(() {
                    selected = index;
                  });
                },
                child: Container(
                  margin: const EdgeInsets.only(bottom: 14),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: borderColor),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          options[index],
                          style: AppTypography.body,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: selected == null || submitted
                  ? null
                  : () async {
                      final start = DateTime.now().millisecondsSinceEpoch;
                      setState(() {
                        submitted = true;
                      });

                      final correctAnswer = selected == correct;

                      // CALC MASTERY (Memory Engine logic remains legacy for now)
                      final mastery = MemoryEngine.updateMastery(
                        current: widget.currentMastery,
                        correct: correctAnswer,
                      );

                      // SYNC TO CLOUD via Write Buffer
                      final existing = KnowledgeEngine.instance.userProgress.firstWhere(
                        (p) => p.nodeId == widget.nodeId, 
                        orElse: () => UserProgress.empty(widget.nodeId)
                      );

                      await ProgressCloudEngine.saveMastery(
                        nodeId: widget.nodeId,
                        mastery: mastery,
                        factId: widget.mcq.factId,
                        existingProgress: existing,
                      );

                      final duration = DateTime.now().millisecondsSinceEpoch - start;
                      await TelemetryEngine.instance.capture(
                        eventName: 'battle_submit', 
                        durationMs: duration,
                        metadata: {'correct': correctAnswer}
                      );

                      debugPrint('Cloud Sync Complete: $mastery');
                    },
              child: const Text('SUBMIT COMBAT'),
            ),
          ),
        ],
      ),
    );
  }
}
