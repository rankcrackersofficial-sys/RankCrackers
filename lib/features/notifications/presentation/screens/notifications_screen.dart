import 'package:flutter/material.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final notifications = [
      {
        "title": "New Physics Test Available",
        "subtitle": "Attempt now to improve your rank",
        "icon": Icons.science,
      },
      {
        "title": "Daily Study Reminder",
        "subtitle": "Complete today's target",
        "icon": Icons.alarm,
      },
      {
        "title": "Roadmap Updated",
        "subtitle": "New chapter added in Mathematics",
        "icon": Icons.map,
      },
      {
        "title": "Mock Test Result",
        "subtitle": "Your AIR improved by 23 ranks",
        "icon": Icons.emoji_events,
      },
    ];

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FB),

      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        centerTitle: true,
        title: const Text(
          "Notifications",
          style: TextStyle(
            color: Colors.black,
            fontWeight: FontWeight.bold,
          ),
        ),
        iconTheme: const IconThemeData(color: Colors.black),
      ),

      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: notifications.length,

        itemBuilder: (context, index) {
          final item = notifications[index];

          return Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(16),

            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),

            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(14),

                  decoration: BoxDecoration(
                    color: const Color(0xFF003399).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(14),
                  ),

                  child: Icon(
                    item["icon"] as IconData,
                    color: const Color(0xFF003399),
                    size: 28,
                  ),
                ),

                const SizedBox(width: 16),

                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item["title"].toString(),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),

                      const SizedBox(height: 6),

                      Text(
                        item["subtitle"].toString(),
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade700,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
