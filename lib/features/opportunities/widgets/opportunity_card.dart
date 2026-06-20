import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/dark_card.dart';
import '../models/opportunity.dart';
import '../models/opportunity_match.dart';

class OpportunityCard extends StatelessWidget {
  final Opportunity opportunity;
  final OpportunityMatch? match;

  const OpportunityCard({super.key, required this.opportunity, this.match});

  @override
  Widget build(BuildContext context) {
    final bool isEligible = match?.eligible ?? false;
    final int matchScore = ((match?.matchScore ?? 0.0) * 100).round();

    return DarkCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(opportunity.title, style: AppTypography.cardTitle),
              ),
              if (match != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: isEligible ? Colors.green.withValues(alpha: 0.1) : AppColors.gold.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    isEligible ? "$matchScore% Eligible Match" : "$matchScore% Match",
                    style: AppTypography.label.copyWith(
                      fontSize: 10, 
                      color: isEligible ? Colors.green : AppColors.gold
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            "${opportunity.department} • ${opportunity.state}",
            style: AppTypography.body.copyWith(fontSize: 11, color: Colors.white38),
          ),
          const SizedBox(height: 16),
          _buildExplainability(match),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _miniStat("Total Posts", opportunity.totalPosts.toString()),
              _miniStat("Last Date", "${opportunity.lastDate.day}/${opportunity.lastDate.month}/${opportunity.lastDate.year}"),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildExplainability(OpportunityMatch? match) {
    if (match == null) return const SizedBox.shrink();
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ...match.eligibilityReasons.take(2).map((r) => _reasonRow(r, true)),
        ...match.missingRequirements.take(2).map((r) => _reasonRow(r, false)),
      ],
    );
  }

  Widget _reasonRow(String text, bool success) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Icon(
            success ? Icons.check_circle_rounded : Icons.cancel_rounded,
            size: 12,
            color: success ? Colors.green : Colors.redAccent,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: AppTypography.body.copyWith(
                fontSize: 10, 
                color: success ? Colors.white70 : Colors.white38
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _miniStat(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(), style: AppTypography.label.copyWith(fontSize: 8, color: Colors.white24)),
        const SizedBox(height: 2),
        Text(value, style: AppTypography.body.copyWith(fontSize: 12, fontWeight: FontWeight.w600)),
      ],
    );
  }
}
