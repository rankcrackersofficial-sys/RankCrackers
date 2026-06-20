import 'package:flutter/material.dart';
import '../../../../../../core/theme/app_colors.dart';
import '../../../../../../core/theme/app_typography.dart';
import '../../../../../../core/widgets/dark_card.dart';
import '../../../../data/command_center_repository.dart';

class BudgetConsumptionCard extends StatelessWidget {
  const BudgetConsumptionCard({super.key});

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text("BUDGET CONSUMPTION", style: AppTypography.cardTitle.copyWith(fontSize: 12)),
              const Icon(Icons.account_balance_wallet_outlined, color: AppColors.gold, size: 16),
            ],
          ),
          const SizedBox(height: 24),
          StreamBuilder<int>(
            stream: CommandCenterRepository.streamAiBudgetUsage(),
            builder: (context, snapshot) {
              final tokens = snapshot.data ?? 0;
              final double costInr = (tokens / 1000000) * 83.0;
              final double progress = (tokens / 500000).clamp(0.0, 1.0);

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _largeMetric("₹${costInr.toStringAsFixed(2)}", "ESTIMATED COST", Colors.greenAccent),
                      _largeMetric("${(tokens / 1000).toStringAsFixed(1)}K", "TOKENS USED", AppColors.gold),
                    ],
                  ),
                  const SizedBox(height: 24),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: progress,
                      backgroundColor: Colors.white10,
                      color: progress > 0.8 ? Colors.redAccent : AppColors.gold,
                      minHeight: 4,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text("MONTHLY HARD CAP: 500K TOKENS", 
                    style: AppTypography.label.copyWith(fontSize: 7, color: Colors.white10)),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _largeMetric(String value, String label, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(value, style: AppTypography.hero.copyWith(fontSize: 24, color: color)),
        Text(label, style: AppTypography.label.copyWith(fontSize: 7, color: Colors.white24)),
      ],
    );
  }
}
