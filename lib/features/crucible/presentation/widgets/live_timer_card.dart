import 'dart:async';
import 'package:flutter/material.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/widgets/dark_card.dart';
import '../../models/crucible_protocol_state.dart';
import '../../core/crucible_clock_engine.dart';

class LiveTimerCard extends StatefulWidget {
  final int day;
  final int phase;
  final CrucibleProtocolState protocolState;

  const LiveTimerCard({
    super.key,
    required this.day,
    required this.phase,
    required this.protocolState,
  });

  @override
  State<LiveTimerCard> createState() => _LiveTimerCardState();
}

class _LiveTimerCardState extends State<LiveTimerCard> {
  Timer? _timer;
  late Duration _remaining;
  late String _windowType;

  @override
  void initState() {
    super.initState();
    _updateTime();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _updateTime();
        });
      }
    });
  }

  void _updateTime() {
    final now = DateTime.now();
    _remaining = CrucibleClockEngine.getWindowRemainingDuration(
      state: widget.protocolState,
      now: now,
    );
    _windowType = CrucibleClockEngine.getWindowType(
      state: widget.protocolState,
      now: now,
    );
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String _formatDuration(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds = duration.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '${hours}h ${minutes}m ${seconds}s';
  }

  @override
  Widget build(BuildContext context) {
    return DarkCard(
      padding: const EdgeInsets.all(22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'THE CRUCIBLE',
            style: AppTypography.hero.copyWith(fontSize: 22),
          ),
          const SizedBox(height: 18),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('DAY ${widget.day}', style: AppTypography.section),
                  const SizedBox(height: 4),
                  Text('PHASE ${widget.phase} • $_windowType', style: AppTypography.label),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    _formatDuration(_remaining),
                    style: AppTypography.metric.copyWith(fontSize: 28),
                  ),
                  Text('REMAINING', style: AppTypography.label),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
