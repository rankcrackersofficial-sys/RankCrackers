import 'package:flutter/material.dart';
import '../../../../../../core/theme/app_colors.dart';
import '../../../../../../core/theme/app_typography.dart';
import '../../../../../../core/widgets/dark_card.dart';
import '../../../../data/repositories/sentinel_admin_repository.dart';
import '../../../../data/repositories/health_repository.dart';

class DiscoveryMiniMetrics extends StatelessWidget {
  const DiscoveryMiniMetrics({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(child: _miniMetric("TOTAL PENDING", SentinelAdminRepository.streamPendingDiscoveriesCount(), AppColors.gold)),
            const SizedBox(width: 12),
            Expanded(child: _miniMetric("AI FAILURES", HealthRepository.streamAIFailuresCount(), Colors.redAccent)), 
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _miniMetric("CRITICAL", SentinelAdminRepository.streamCriticalDiscoveriesCount(), Colors.redAccent)),
            const SizedBox(width: 12),
            Expanded(child: _miniMetric("HIGH", SentinelAdminRepository.streamHighDiscoveriesCount(), Colors.orangeAccent)),
          ],
        ),
      ],
    );
  }

  Widget _miniMetric(String label, Stream<int> stream, Color color) {
    return StreamBuilder<int>(
      stream: stream,
      builder: (context, snapshot) {
        return DarkCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: AppTypography.label.copyWith(fontSize: 8, color: Colors.white24)),
              const SizedBox(height: 8),
              Text(snapshot.data?.toString() ?? "0", style: AppTypography.hero.copyWith(fontSize: 18, color: color)),
            ],
          ),
        );
      },
    );
  }
}
