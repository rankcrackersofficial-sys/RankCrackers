import 'package:flutter/material.dart';

class MissionProcessingHealthBar extends StatelessWidget {
  final String missionId;
  final double value;

  const MissionProcessingHealthBar({
    super.key,
    required this.missionId,
    this.value = 0.0,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Mission health: $missionId', style: const TextStyle(color: Colors.white70, fontSize: 10)),
        const SizedBox(height: 4),
        LinearProgressIndicator(
          value: value.clamp(0.0, 1.0),
          minHeight: 8,
          borderRadius: BorderRadius.circular(99),
          valueColor: const AlwaysStoppedAnimation<Color>(Colors.amber),
          backgroundColor: Colors.white12,
        ),
      ],
    );
  }
}
