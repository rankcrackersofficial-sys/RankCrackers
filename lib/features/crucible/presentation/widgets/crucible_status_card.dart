import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/dark_card.dart';
import '../../core/crucible_clock_engine.dart';

class CrucibleStatusCard extends StatefulWidget {
  final DateTime enrollmentTime;

  const CrucibleStatusCard({
    super.key,
    required this.enrollmentTime,
  });

  @override
  State<CrucibleStatusCard> createState() => _CrucibleStatusCardState();
}

class _CrucibleStatusCardState extends State<CrucibleStatusCard> {
  late Timer _timer;
  late Duration _timeLeft;

  @override
  void initState() {
    super.initState();
    _calculateTimeLeft();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _calculateTimeLeft();
        });
      }
    });
  }

  void _calculateTimeLeft() {
    final nextTest = CrucibleClockEngine.getNextMicroTest(
      enrollmentTime: widget.enrollmentTime,
    );
    _timeLeft = nextTest.difference(DateTime.now());
    if (_timeLeft.isNegative) _timeLeft = Duration.zero;
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  String _formatDuration(Duration d) {
    String twoDigits(int n) => n.toString().padLeft(2, "0");
    String hours = twoDigits(d.inHours);
    String minutes = twoDigits(d.inMinutes.remainder(60));
    String seconds = twoDigits(d.inSeconds.remainder(60));
    return "$hours:$minutes:$seconds";
  }

  @override
  Widget build(BuildContext context) {
    final schedule = CrucibleClockEngine.getScheduleIndex(
      enrollmentTime: widget.enrollmentTime,
    );

    final rebuild = CrucibleClockEngine.isRebuildPhase(
      enrollmentTime: widget.enrollmentTime,
    );

    return DarkCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'CRUCIBLE STATUS',
                style: AppTypography.section.copyWith(color: AppColors.gold),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: rebuild ? AppColors.error.withValues(alpha: 0.1) : AppColors.success.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: rebuild ? AppColors.error.withValues(alpha: 0.3) : AppColors.success.withValues(alpha: 0.3)),
                ),
                child: Text(
                  rebuild ? 'REBUILD' : 'TACTICAL',
                  style: AppTypography.label.copyWith(
                    color: rebuild ? AppColors.error : AppColors.success,
                    fontSize: 10,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'ACTIVE SCHEDULE : ${schedule + 1}',
                      style: AppTypography.cardTitle,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'TARGET ACQUISITION TIMER',
                      style: AppTypography.label.copyWith(letterSpacing: 1.5),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _formatDuration(_timeLeft),
                      style: AppTypography.metric.copyWith(fontSize: 32, color: AppColors.gold),
                    ),
                  ],
                ),
              ),
              Container(
                height: 60,
                width: 2,
                color: AppColors.borderSoft,
              ),
              const SizedBox(width: 20),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'NEXT BATTLE',
                    style: AppTypography.label,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    DateFormat('dd MMM').format(CrucibleClockEngine.getNextMicroTest(enrollmentTime: widget.enrollmentTime)),
                    style: AppTypography.cardTitle.copyWith(fontSize: 18),
                  ),
                  Text(
                    '09:00 AM',
                    style: AppTypography.body.copyWith(fontSize: 12, color: Colors.white54),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
