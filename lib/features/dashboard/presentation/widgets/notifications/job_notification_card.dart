import 'package:flutter/material.dart';

import 'notification_tile.dart';

class JobNotificationCard extends StatelessWidget {
  const JobNotificationCard({super.key});

  @override
  Widget build(BuildContext context) {
    return const NotificationTile(
      title: "RPSC new vacancy announced",
      subtitle: "Executive Realm Update",
      time: "Fresh update • Today",
    );
  }
}