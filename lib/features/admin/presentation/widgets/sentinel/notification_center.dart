import 'package:flutter/material.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/widgets/dark_card.dart';
import '../../../../../core/backend/notification_repository.dart';
import '../../../../../core/models/notification_event.dart';
import '../shared/center_header.dart';

class NotificationCenter extends StatelessWidget {
  const NotificationCenter({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const CenterHeader(title: "NOTIFICATION CENTER", subtitle: "Strategic communication gateway."),
        const SizedBox(height: 24),
        Text("GLOBAL BROADCASTS", style: AppTypography.cardTitle),
        const SizedBox(height: 18),
        StreamBuilder<List<NotificationEvent>>(
          stream: NotificationRepository.streamGlobal(),
          builder: (context, snapshot) {
            final list = snapshot.data ?? [];
            if (list.isEmpty) return const Text("No global alerts broadcasted.");
            return Column(
              children: list.map((e) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: DarkCard(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      const Icon(Icons.campaign_outlined, color: AppColors.gold),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(e.title, style: AppTypography.cardTitle),
                            Text(e.message, style: AppTypography.body.copyWith(fontSize: 12, color: Colors.white38)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              )).toList(),
            );
          },
        ),
      ],
    );
  }
}
