import 'package:flutter/material.dart';

import 'notification_tile.dart';

class ExamNotificationCard extends StatelessWidget {
  const ExamNotificationCard({super.key});

  @override
  Widget build(BuildContext context) {
    return const NotificationTile(
      title: "Upcoming exam reminder visible",
      subtitle: "RAS Examination Pattern Updated",
      time: "Important date • Tomorrow",
    );
  }
}