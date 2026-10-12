import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

class MissionProcessingHealthBar extends StatelessWidget {
  final String missionId;
  final double? value;

  const MissionProcessingHealthBar({
    super.key,
    required this.missionId,
    this.value,
  });

  @override
  Widget build(BuildContext context) {
    if (value != null) {
      return _buildBar(value!, 'Progress');
    }

    return StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance
          .collection('mission_realms')
          .doc(missionId)
          .snapshots(),
      builder: (context, snapshot) {
        if (!snapshot.hasData || !(snapshot.data?.exists ?? false)) {
          return _buildBar(0.0, 'Status: Awaiting Pipeline Data');
        }

        final data = snapshot.data!.data() ?? {};
        final status = data['status']?.toString() ?? 'DRAFT';
        final isVerified = data['verified'] == true || status == 'VERIFIED' || status == 'ACTIVE';
        final progress = isVerified ? 1.0 : (status == 'PROCESSING' ? 0.5 : 0.15);
        final label = 'Pipeline: $status';

        return _buildBar(progress, label);
      },
    );
  }

  Widget _buildBar(double progressValue, String statusLabel) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              'Mission: $missionId',
              style: const TextStyle(color: Colors.white70, fontSize: 10),
            ),
            const Spacer(),
            Text(
              statusLabel,
              style: const TextStyle(color: Colors.amber, fontSize: 10, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        const SizedBox(height: 4),
        LinearProgressIndicator(
          value: progressValue.clamp(0.0, 1.0),
          minHeight: 8,
          borderRadius: BorderRadius.circular(99),
          valueColor: const AlwaysStoppedAnimation<Color>(Colors.amber),
          backgroundColor: Colors.white12,
        ),
      ],
    );
  }
}
