import 'package:flutter/material.dart';

import 'notification_tile.dart';

class SyllabusUpdateCard extends StatelessWidget {
  const SyllabusUpdateCard({super.key});

  @override
  Widget build(BuildContext context) {
    return const NotificationTile(
      title: "Hindi grammar topic sequence updated",
      subtitle: "New Learning Sequence Active",
      time: "Curriculum change • Today",
    );
  }
}