import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/dark_card.dart';
import '../../../../core/utils/app_routes.dart';

import '../../providers/sentinel_intelligence_provider.dart';

class SentinelIntelligenceCard extends ConsumerWidget {
  const SentinelIntelligenceCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final metricsAsync = ref.watch(sentinelMetricsProvider);

    return DarkCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.security_rounded,
                  color: AppColors.gold, size: 16),
              const SizedBox(width: 10),
              Text("SENTINEL INTEL",
                  style: AppTypography.label
                      .copyWith(color: AppColors.gold, fontSize: 8)),
              const Spacer(),
              const Icon(Icons.arrow_forward_ios_rounded,
                  size: 10, color: Colors.white10),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _miniAlert(
                  "New",
                  metricsAsync.hasValue
                      ? metricsAsync.valueOrNull!.newAlerts.toString()
                      : "--",
                  AppColors.info),
              _miniAlert(
                  "Expiry",
                  metricsAsync.hasValue
                      ? metricsAsync.valueOrNull!.expiringForms.toString()
                      : "--",
                  AppColors.error),
              _miniAlert(
                  "Priority",
                  metricsAsync.hasValue
                      ? metricsAsync.valueOrNull!.highPriorityExams.toString()
                      : "--",
                  AppColors.gold),
            ],
          ),
          const SizedBox(height: 16),
          _sentinelCenterButton(context),
        ],
      ),
    );
  }

  Widget _sentinelCenterButton(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 46,
      child: ElevatedButton(
        onPressed: () => context.push(AppRoutes.sentinelCenter),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.tacticalGold,
          foregroundColor: Colors.black,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 18),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(13),
          ),
        ),
        child: FittedBox(
          fit: BoxFit.scaleDown,
          child: Text(
            'OPEN CENTER',
            maxLines: 1,
            style: AppTypography.cardTitle.copyWith(
              color: Colors.black,
              fontSize: 16,
              height: 1.0,
            ),
          ),
        ),
      ),
    );
  }

  Widget _miniAlert(String label, String count, Color color) {
    return Column(
      children: [
        Text(count,
            style: AppTypography.hero.copyWith(fontSize: 16, color: color)),
        Text(label.toUpperCase(),
            style: AppTypography.label
                .copyWith(fontSize: 8, color: Colors.white30)),
      ],
    );
  }
}
