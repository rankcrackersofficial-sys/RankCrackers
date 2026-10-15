import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'rc_colors.dart';

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
          return _buildBar(null, 'Status: Awaiting Pipeline Data');
        }

        final data = snapshot.data!.data() ?? {};
        final status = data['status']?.toString() ?? 'DRAFT';
        final isVerified = data['verified'] == true ||
            status == 'VERIFIED' ||
            status == 'ACTIVE';

        final completedUnits = (data['completedUnits'] as num?)?.toDouble() ??
            (data['completedSteps'] as num?)?.toDouble();
        final totalUnits = (data['totalUnits'] as num?)?.toDouble() ??
            (data['totalSteps'] as num?)?.toDouble();

        double? progress;
        String label;

        if (isVerified) {
          progress = 1.0;
          label = 'Pipeline: $status (Verified)';
        } else if (completedUnits != null &&
            totalUnits != null &&
            totalUnits > 0) {
          progress = (completedUnits / totalUnits).clamp(0.0, 1.0);
          final pct = (progress * 100).toInt();
          label = 'Pipeline: $status ($pct%)';
        } else {
          progress = null; // Honest reporting: no fabricated progress
          label = 'Pipeline: $status (Awaiting Evidence)';
        }

        return _buildBar(progress, label);
      },
    );
  }

  Widget _buildBar(double? progressValue, String statusLabel) {
    final hasProgress = progressValue != null;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              'Mission: $missionId',
              style: const TextStyle(color: rcMuted, fontSize: 10),
            ),
            const Spacer(),
            Text(
              statusLabel,
              style: TextStyle(
                color: hasProgress ? rcGold : rcMuted,
                fontSize: 10,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        if (hasProgress)
          LinearProgressIndicator(
            value: progressValue.clamp(0.0, 1.0),
            minHeight: 8,
            borderRadius: BorderRadius.circular(99),
            valueColor: const AlwaysStoppedAnimation<Color>(Colors.amber),
            backgroundColor: rcSurfaceAlt,
          )
        else
          Container(
            height: 8,
            decoration: BoxDecoration(
              color: rcSurfaceAlt,
              borderRadius: BorderRadius.circular(99),
            ),
          ),
      ],
    );
  }
}
