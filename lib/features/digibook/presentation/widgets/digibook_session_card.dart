import 'package:flutter/material.dart';

import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/dark_card.dart';
import '../../core/digibook_engine.dart';
import '../../models/digibook_session.dart';

class DigiBookSessionCard extends StatelessWidget {
  final DigiBookSession session;

  const DigiBookSessionCard({
    super.key,
    required this.session,
  });

  @override
  Widget build(BuildContext context) {
    final mcqs = DigiBookEngine.totalMcqs(session.payloads);
    final pyqs = DigiBookEngine.totalPyqs(session.payloads);

    return DarkCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            session.title,
            style: AppTypography.section,
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(
                child: _metric(
                  label: 'TOPICS',
                  value: '${session.nodes.length}',
                ),
              ),
              Expanded(
                child: _metric(
                  label: 'MINUTES',
                  value: '${session.estimatedMinutes}',
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _metric(
                  label: 'MCQS',
                  value: '$mcqs',
                ),
              ),
              Expanded(
                child: _metric(
                  label: 'PYQS',
                  value: '$pyqs',
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text(
            'Session Coverage',
            style: AppTypography.cardTitle,
          ),
          const SizedBox(height: 10),
          Text(
            session.nodes.take(3).map((e) => e.title).join(' • '),
            style: AppTypography.body,
          ),
        ],
      ),
    );
  }

  Widget _metric({
    required String label,
    required String value,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: AppTypography.section,
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: AppTypography.label,
        ),
      ],
    );
  }
}
