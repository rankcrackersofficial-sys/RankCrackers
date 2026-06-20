import 'package:flutter/material.dart';
import '../../../../../core/widgets/dark_card.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';

class MacroWarStatusCard extends StatelessWidget {
  const MacroWarStatusCard({super.key});

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 🔱 PREMIUM CARD DNA: Title
          Text(
            'MACRO WAR STATUS',
            style: AppTypography.cardTitle.copyWith(color: AppColors.gold, letterSpacing: 2.2, fontSize: 11),
          ),

          const SizedBox(height: 18),

          Row(
            children: const [
              Expanded(
                child: _StatusTile(
                  label: 'Phase',
                  value: '2',
                  tone: AppColors.gold,
                ),
              ),
              SizedBox(width: 10),
              Expanded(
                child: _StatusTile(
                  label: 'Reckoning',
                  value: '2d',
                  tone: AppColors.error,
                ),
              ),
              SizedBox(width: 10),
              Expanded(
                child: _StatusTile(
                  label: 'Accuracy',
                  value: '71%',
                  tone: Color(0xFF4D7CFE),
                ),
              ),
            ],
          ),

          const SizedBox(height: 18),

          // 🔱 PREMIUM CARD DNA: Subtitle
          Text(
            'Recovery debt is controlled. Maintain the evening revision block for maximum cognitive yield.',
            style: AppTypography.subtitle,
          ),
        ],
      ),
    );
  }
}

class _StatusTile extends StatelessWidget {
  final String label;
  final String value;
  final Color tone;

  const _StatusTile({
    required this.label,
    required this.value,
    required this.tone,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: tone.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: tone.withValues(alpha: 0.12),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: AppTypography.metric.copyWith(fontSize: 18),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: AppTypography.label.copyWith(fontSize: 9, color: AppColors.secondaryText),
          ),
        ],
      ),
    );
  }
}
