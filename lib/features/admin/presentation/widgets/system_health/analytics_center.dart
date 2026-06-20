import 'package:flutter/material.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/widgets/dark_card.dart';
import '../shared/center_header.dart';

class AnalyticsCenter extends StatelessWidget {
  const AnalyticsCenter({super.key});

  @override
  Widget build(BuildContext context) {
    return Column( // Changed to Column for safe nesting inside ListView
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const CenterHeader(title: "GLOBAL ANALYTICS CENTER", subtitle: "National performance and scaling intelligence."),
        const SizedBox(height: 24),
        Row(
          children: [
            Expanded(child: _analyticsStat("TOTAL WARRIORS", "--", Colors.blueAccent)),
            const SizedBox(width: 12),
            Expanded(child: _analyticsStat("ACTIVE BATTLES", "--", Colors.orangeAccent)),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _analyticsStat("AVG READINESS", "--", Colors.greenAccent)),
            const SizedBox(width: 12),
            Expanded(child: _analyticsStat("FIRESTORE LOAD", "--", Colors.purpleAccent)),
          ],
        ),
      ],
    );
  }

  Widget _analyticsStat(String label, String value, Color color) {
    return DarkCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: AppTypography.label.copyWith(fontSize: 9, color: Colors.white38)),
          const SizedBox(height: 8),
          Text(value, style: AppTypography.hero.copyWith(fontSize: 20, color: color)),
        ],
      ),
    );
  }
}
