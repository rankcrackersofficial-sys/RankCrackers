import 'package:flutter/material.dart';
import '../../../../../../core/theme/app_colors.dart';
import '../../../../../../core/theme/app_typography.dart';
import '../../../../../../core/widgets/dark_card.dart';
import '../../../../../../core/models/worker_registry.dart';
import '../../../../data/repositories/worker_registry_repository.dart';
import 'worker_control_sheet.dart';
import 'package:intl/intl.dart';

class WorkerCard extends StatelessWidget {
  final WorkerRegistry worker;
  const WorkerCard({super.key, required this.worker});

  @override
  Widget build(BuildContext context) {
    final statusData = _deriveStatus(worker.lastHeartbeat);
    final status = statusData['status'] as String;
    final statusColor = statusData['color'] as Color;
    
    final isCritical = worker.priority == WorkerPriority.critical;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GestureDetector(
        onLongPress: () => _showControlSheet(context),
        child: DarkCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Row(
                children: [
                  Container(
                    width: 10, height: 10,
                    decoration: BoxDecoration(
                      color: worker.enabled ? statusColor : Colors.redAccent,
                      shape: BoxShape.circle,
                      boxShadow: [
                        if (worker.enabled && status == 'ONLINE')
                          BoxShadow(color: statusColor.withValues(alpha: 0.3), blurRadius: 8, spreadRadius: 2),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(worker.name, 
                          style: AppTypography.body.copyWith(fontWeight: FontWeight.bold, fontSize: 13),
                          maxLines: 1, overflow: TextOverflow.ellipsis),
                        Text("$status • ${_getModeDisplay(worker.mode)}", 
                          style: AppTypography.label.copyWith(fontSize: 8, color: Colors.white24),
                          maxLines: 1, overflow: TextOverflow.ellipsis),
                      ],
                    ),
                  ),
                  Switch(
                    value: worker.enabled,
                    onChanged: isCritical ? null : (v) async {
                      // Forensic Fix: Prevent crash if ID is empty
                      if (worker.id.isEmpty) {
                        debugPrint('WORKER_CARD: Cannot update worker with empty ID.');
                        return;
                      }
                      await WorkerRegistryRepository.updateWorker(worker.id, {'enabled': v});
                    },
                    activeColor: Colors.greenAccent,
                    activeTrackColor: Colors.greenAccent.withValues(alpha: 0.1),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _statItem("QUEUE", worker.queueSize.toString(), AppColors.gold),
                  _statItem("ERRORS", worker.errorCount.toString(), Colors.redAccent),
                  _statItem("COST", "₹${worker.monthlyCost.toStringAsFixed(0)}", Colors.greenAccent),
                  _statItem("HB", _formatHeartbeat(worker.lastHeartbeat), Colors.white38),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Map<String, dynamic> _deriveStatus(DateTime? lastHb) {
    if (lastHb == null) return {'status': 'DEAD', 'color': Colors.redAccent};
    
    final diff = DateTime.now().difference(lastHb);
    final seconds = diff.inSeconds;
    
    if (seconds <= 60) {
      return {'status': 'ONLINE', 'color': Colors.greenAccent};
    } else if (seconds <= 180) {
      return {'status': 'DEGRADED', 'color': Colors.orangeAccent};
    } else {
      return {'status': 'OFFLINE', 'color': Colors.redAccent};
    }
  }

  Widget _statItem(String label, String value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTypography.label.copyWith(fontSize: 7, color: Colors.white10)),
        const SizedBox(height: 4),
        Text(value, style: AppTypography.body.copyWith(fontSize: 10, fontWeight: FontWeight.bold, color: color)),
      ],
    );
  }

  String _getModeDisplay(WorkerMode mode) {
    switch (mode) {
      case WorkerMode.auto: return "AUTO";
      case WorkerMode.manual: return "MANUAL";
    }
  }

  String _formatHeartbeat(DateTime? hb) {
    if (hb == null) return "NEVER";
    return DateFormat('HH:mm').format(hb);
  }

  void _showControlSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => WorkerControlSheet(worker: worker),
    );
  }
}
