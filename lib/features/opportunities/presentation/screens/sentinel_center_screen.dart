import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/tactical_noir_background.dart';

class SentinelCenterScreen extends ConsumerWidget {
  const SentinelCenterScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: TacticalNoirBackground(
        child: SafeArea(
          child: CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              _buildHeader(),
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    _sectionLabel("Academic Trend Intelligence"),
                    const SizedBox(height: 24),
                    _alertPlaceholder("Sentinel intelligence monitoring is active. Verified trend updates and pattern intelligence will appear here as new insights are published for your preparation mission."),
                    const SizedBox(height: 48),
                    Center(
                      child: Column(
                        children: [
                          Icon(Icons.shield_rounded, color: AppColors.gold.withValues(alpha: 0.2), size: 64),
                          const SizedBox(height: 16),
                          Text("No active trend alerts",
                            style: AppTypography.label.copyWith(color: Colors.white24)),
                        ],
                      ),
                    ),
                  ]),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("SENTINEL CENTER", style: AppTypography.hero),
            const SizedBox(height: 8),
            Text("Sovereign Academic Trend Intelligence", style: AppTypography.label.copyWith(color: Colors.white24)),
          ],
        ),
      ),
    );
  }

  Widget _sectionLabel(String text) {
    return Text(text.toUpperCase(), style: AppTypography.label.copyWith(color: AppColors.gold, fontSize: 10));
  }

  Widget _alertPlaceholder(String text) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderSoft),
      ),
      child: Text(text, style: AppTypography.body.copyWith(fontSize: 13, color: Colors.white70)),
    );
  }
}
