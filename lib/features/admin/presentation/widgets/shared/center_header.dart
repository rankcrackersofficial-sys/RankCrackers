import 'package:flutter/material.dart';
import '../../../../../core/theme/app_typography.dart';

class CenterHeader extends StatelessWidget {
  final String title;
  final String subtitle;

  const CenterHeader({
    super.key,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: AppTypography.hero.copyWith(fontSize: 18, color: Colors.white),
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          style: AppTypography.body.copyWith(color: Colors.white38, fontSize: 12),
        ),
        const SizedBox(height: 16),
        const Divider(color: Colors.white10),
      ],
    );
  }
}
