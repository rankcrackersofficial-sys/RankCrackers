import 'package:flutter/material.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/widgets/dark_card.dart';
import '../../../../../core/utils/benchmark_util.dart';
import '../shared/center_header.dart';
import '../shared/center_placeholder.dart';

class AuditCenter extends StatelessWidget {
  const AuditCenter({super.key});

  @override
  Widget build(BuildContext context) {
    final logs = BenchmarkRepository.results;

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(24),
      children: [
        const CenterHeader(title: "TRACED AUDIT LOGS", subtitle: "Physical execution evidence and benchmarks."),
        const SizedBox(height: 24),
        if (logs.isEmpty)
          const SizedBox(
            height: 400,
            child: CenterPlaceholder(title: "NO RECENT LOGS", icon: Icons.history_edu_outlined)
          )
        else
          Column(
            children: logs.reversed.map((log) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: DarkCard(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    const Icon(Icons.timer_outlined, color: Colors.greenAccent, size: 20),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(log.label, style: AppTypography.cardTitle.copyWith(fontSize: 14)),
                          Text(log.timestamp.toIso8601String(), style: AppTypography.body.copyWith(fontSize: 10, color: Colors.white24)),
                        ],
                      ),
                    ),
                    Text("${log.durationMs}ms", style: AppTypography.label.copyWith(color: Colors.greenAccent)),
                  ],
                ),
              ),
            )).toList(),
          ),
      ],
    );
  }
}
