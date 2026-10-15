import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/tactical_noir_background.dart';
import '../../../../core/widgets/dark_card.dart';
import '../../../../core/widgets/premium_button.dart';
import '../../../../core/utils/app_routes.dart';
import '../../../../core/utils/responsive_helper.dart';

class DiagnosticResultScreen extends StatelessWidget {
  final List<dynamic> questions;
  final List<int?> answers;
  final List<int> durations;

  const DiagnosticResultScreen({
    super.key,
    required this.questions,
    required this.answers,
    required this.durations,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: TacticalNoirBackground(
        child: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              return SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: EdgeInsets.symmetric(horizontal: ResponsiveHelper.wp(context, 0.06)),
                child: Center(
                  child: ConstrainedBox(
                    constraints: BoxConstraints(maxWidth: 500, minHeight: constraints.maxHeight),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 20),
                        _buildHeader(context),
                        SizedBox(height: ResponsiveHelper.compactGap(context)),
                        Text('Diagnostic\nNot Ready', style: AppTypography.hero.copyWith(height: 1.0, fontSize: ResponsiveHelper.sp(context, 26))),
                        const SizedBox(height: 10),
                        Text('No server-authoritative attempt is available.', style: AppTypography.body.copyWith(color: Colors.white38, fontSize: 13)),
                        
                        SizedBox(height: ResponsiveHelper.sectionSpacing(context)),

                        Row(
                          children: [
                            _metricItem('🎯 ACCURACY', 'NOT READY', AppColors.gold),
                            const SizedBox(width: 10),
                            _metricItem('🧠 GRADE', 'NOT READY', Colors.greenAccent),
                            const SizedBox(width: 10),
                            _metricItem('🔥 READY', 'NOT READY', Colors.orangeAccent),
                          ],
                        ),

                        SizedBox(height: ResponsiveHelper.sectionSpacing(context)),
                        
                        Text('VERDICT', style: AppTypography.label.copyWith(color: Colors.white24, fontSize: 8)),
                        const SizedBox(height: 8),
                        DarkCard(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            children: [
                              _row('Accuracy', 'Unavailable'),
                              _row('Speed', 'Unavailable'),
                              _row('Weakness', 'Unavailable'),
                            ],
                          ),
                        ),

                        const Spacer(),
                        const SizedBox(height: 20),
                        PremiumButton(
                          text: 'ENTER BATTALION', 
                          onTap: () => context.go(AppRoutes.missionRealm),
                        ),
                        Center(
                          child: TextButton(
                            onPressed: () => context.pop(), 
                            child: Text('REVIEW ANSWERS', style: AppTypography.label.copyWith(color: Colors.white12, fontSize: 8)),
                          ),
                        ),
                        const SizedBox(height: 10),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text('VERDICT', style: AppTypography.label.copyWith(fontSize: 8)),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(color: AppColors.gold.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(20)),
          child: Text('NOT READY', style: AppTypography.label.copyWith(fontSize: 7, color: AppColors.gold)),
        ),
      ],
    );
  }

  Widget _metricItem(String label, String value, Color color) {
    return Expanded(
      child: DarkCard(
        padding: const EdgeInsets.all(10),
        child: Column(
          children: [
            Text(label, style: AppTypography.label.copyWith(fontSize: 6, color: Colors.white12)),
            const SizedBox(height: 4),
            Text(value, style: AppTypography.hero.copyWith(fontSize: 18, color: color)),
          ],
        ),
      ),
    );
  }

  Widget _row(String l, String v) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(l, style: AppTypography.body.copyWith(fontSize: 11, color: Colors.white24)),
          Text(v, style: AppTypography.body.copyWith(fontSize: 11, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
