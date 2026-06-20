import 'package:flutter/material.dart';
import 'quick_access_card.dart';

class QuickAccessGrid extends StatelessWidget {
  final Function(int, {int subTabIndex}) onTabSwitch;
  const QuickAccessGrid({super.key, required this.onTabSwitch});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: QuickAccessCard(
                icon: Icons.add_task_rounded,
                title: "Create Mission",
                subtitle: "Recruitment Registry",
                onTap: () => onTabSwitch(1, subTabIndex: 1), // Registry is now index 1
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: QuickAccessCard(
                icon: Icons.notification_add_rounded,
                title: "Upload Notice",
                subtitle: "Official Alerts",
                onTap: () => onTabSwitch(1, subTabIndex: 2), // Notification is 2
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: QuickAccessCard(
                icon: Icons.menu_book_rounded,
                title: "Upload Syllabus",
                subtitle: "Knowledge Mapping",
                onTap: () => onTabSwitch(1, subTabIndex: 3),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: QuickAccessCard(
                icon: Icons.history_edu_rounded,
                title: "Upload PYQs",
                subtitle: "Exam Extraction",
                onTap: () => onTabSwitch(1, subTabIndex: 4),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: QuickAccessCard(
                icon: Icons.radar_rounded,
                title: "Review Sentinel",
                subtitle: "Machine Discoveries",
                onTap: () => onTabSwitch(4), 
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: QuickAccessCard(
                icon: Icons.fact_check_rounded,
                title: "Review DigiBook",
                subtitle: "Verified Content",
                onTap: () => onTabSwitch(3),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
