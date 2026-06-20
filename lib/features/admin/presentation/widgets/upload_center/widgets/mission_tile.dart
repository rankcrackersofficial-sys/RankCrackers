import 'package:flutter/material.dart';
import '../../../../../../core/theme/app_colors.dart';
import '../../../../../../core/theme/app_typography.dart';
import '../../../../../../core/widgets/dark_card.dart';
import '../../../../../../core/models/recruitment.dart';

class MissionTile extends StatelessWidget {
  final Recruitment recruitment;
  const MissionTile({super.key, required this.recruitment});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: DarkCard(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            const Icon(Icons.military_tech_outlined, color: AppColors.gold),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(recruitment.title, style: AppTypography.cardTitle),
                  Text("${recruitment.state} • ${recruitment.year} • ${recruitment.status.toUpperCase()}", 
                    style: AppTypography.body.copyWith(fontSize: 11, color: Colors.white24)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
