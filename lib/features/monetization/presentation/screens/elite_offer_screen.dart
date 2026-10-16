import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/utils/app_routes.dart';
import '../../domain/revenue_plan.dart';

class EliteOfferScreen extends StatefulWidget {
  const EliteOfferScreen({super.key});

  @override
  State<EliteOfferScreen> createState() => _EliteOfferScreenState();
}

class _EliteOfferScreenState extends State<EliteOfferScreen> {
  RevenuePlanKind _selected = RevenuePlanKind.missionPass;

  RevenuePlan get _selectedPlan =>
      RevenuePlan.catalog.firstWhere((p) => p.kind == _selected);

  void _beginCheckout() {
    context.push(AppRoutes.eliteCheckout, extra: {'planKind': _selected});
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: scheme.surface,
      appBar: AppBar(
        backgroundColor: scheme.surface,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_rounded, color: scheme.onSurface),
          onPressed: () => context.pop(),
        ),
        title: Text('ELITE ACCESS', style: AppTypography.label),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 36),
          children: [
            Text('Build your rank system.', style: AppTypography.hero),
            const SizedBox(height: 10),
            Text(
              'Unlock the complete preparation loop: learn, practise, revise, and know exactly what to do next.',
              style: AppTypography.body,
            ),
            const SizedBox(height: 22),
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: scheme.surface,
                borderRadius: BorderRadius.circular(20),
                border:
                    Border.all(color: AppColors.gold.withValues(alpha: 0.45)),
              ),
              child: Row(
                children: [
                  Icon(Icons.workspace_premium_rounded,
                      color: AppColors.gold, size: 34),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Text(
                      'One clear mission. Zero noisy upgrades.',
                      style: AppTypography.cardTitle.copyWith(fontSize: 16),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            ...RevenuePlan.catalog.map(_buildPlanCard),
            const SizedBox(height: 14),
            SizedBox(
              height: 54,
              child: ElevatedButton(
                onPressed: _beginCheckout,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.tacticalGold,
                  foregroundColor: Colors.black,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(18)),
                ),
                child: Text(
                    'CONTINUE WITH ${_selectedPlan.title.toUpperCase()}',
                    style: AppTypography.button),
              ),
            ),
            const SizedBox(height: 12),
            Center(
              child: TextButton(
                onPressed: () => context.go(AppRoutes.dashboard),
                child: Text('Continue with free access',
                    style: AppTypography.body.copyWith(fontSize: 12)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlanCard(RevenuePlan plan) {
    final scheme = Theme.of(context).colorScheme;
    final selected = plan.kind == _selected;
    return GestureDetector(
      onTap: () => setState(() => _selected = plan.kind),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: selected
              ? scheme.surface
              : scheme.surface.withValues(alpha: 0.62),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
              color: selected ? AppColors.gold : scheme.outline,
              width: selected ? 1.5 : 1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                    child: Text(plan.title,
                        style: AppTypography.cardTitle.copyWith(fontSize: 16))),
                if (plan.highlighted)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                        color: AppColors.gold.withValues(alpha: 0.14),
                        borderRadius: BorderRadius.circular(8)),
                    child: Text('BEST VALUE',
                        style: AppTypography.label
                            .copyWith(color: AppColors.gold, fontSize: 9)),
                  ),
              ],
            ),
            const SizedBox(height: 6),
            Text(plan.promise,
                style: AppTypography.body.copyWith(fontSize: 12)),
            const SizedBox(height: 12),
            Row(children: [
              Text(plan.price,
                  style: AppTypography.hero.copyWith(fontSize: 24)),
              const SizedBox(width: 8),
              Text(plan.cadence,
                  style: AppTypography.body.copyWith(fontSize: 12))
            ]),
            const SizedBox(height: 12),
            ...plan.benefits.map((benefit) => Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(children: [
                    Icon(Icons.check_rounded,
                        color: AppColors.gold, size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                        child: Text(benefit,
                            style: AppTypography.body.copyWith(fontSize: 12)))
                  ]),
                )),
          ],
        ),
      ),
    );
  }
}
