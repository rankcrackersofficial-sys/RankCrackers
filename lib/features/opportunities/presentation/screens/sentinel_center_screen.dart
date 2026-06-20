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
                    _sectionLabel("Critical Alerts"),
                    const SizedBox(height: 16),
                    _alertPlaceholder("Application Window Closing Soon: RPSC School Lecturer"),
                    const SizedBox(height: 24),
                    
                    _sectionLabel("Strong Matches"),
                    const SizedBox(height: 16),
                    _alertPlaceholder("92% Match Found: UGC NET History"),
                    const SizedBox(height: 24),

                    _sectionLabel("Opportunity Gaps"),
                    const SizedBox(height: 16),
                    _gapIntelligence("Need B.Ed to unlock 47 potential opportunities."),
                    const SizedBox(height: 12),
                    _gapIntelligence("Need NET to unlock 16 potential opportunities."),
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
            Text("Sovereign Career Intelligence", style: AppTypography.label.copyWith(color: Colors.white24)),
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

  Widget _gapIntelligence(String text) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.gold.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.1)),
      ),
      child: Row(
        children: [
          const Icon(Icons.lightbulb_outline_rounded, color: AppColors.gold, size: 18),
          const SizedBox(width: 14),
          Expanded(child: Text(text, style: AppTypography.body.copyWith(fontSize: 12, color: AppColors.gold))),
        ],
      ),
    );
  }
}
