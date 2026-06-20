import 'package:flutter/material.dart';
import '../../../../../../core/theme/app_colors.dart';
import '../../../../../../core/theme/app_typography.dart';
import '../../../../../../core/models/worker_registry.dart';
import '../../../../data/repositories/worker_registry_repository.dart';
import '../../../../../../shared/widgets/tactical_button.dart';

class WorkerControlSheet extends StatefulWidget {
  final WorkerRegistry worker;
  const WorkerControlSheet({super.key, required this.worker});

  @override
  State<WorkerControlSheet> createState() => _WorkerControlSheetState();
}

class _WorkerControlSheetState extends State<WorkerControlSheet> {
  late WorkerMode selectedMode;
  late WorkerPriority selectedPriority;

  @override
  void initState() {
    super.initState();
    selectedMode = widget.worker.mode;
    selectedPriority = widget.worker.priority;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: Color(0xFF060B16),
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        border: Border(top: BorderSide(color: Colors.white10)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(widget.worker.name.toUpperCase(), style: AppTypography.hero.copyWith(fontSize: 18)),
              IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close, color: Colors.white38)),
            ],
          ),
          const SizedBox(height: 32),
          
          Text("EXECUTION MODE", style: AppTypography.label.copyWith(color: AppColors.gold, fontSize: 8)),
          const SizedBox(height: 12),
          _modeSelector(),
          
          const SizedBox(height: 32),
          
          Text("WORKER PRIORITY", style: AppTypography.label.copyWith(color: AppColors.gold, fontSize: 8)),
          const SizedBox(height: 12),
          _prioritySelector(),
          
          const SizedBox(height: 40),
          Row(
            children: [
              Expanded(
                child: TacticalButton(
                  title: "RESET ERRORS", 
                  onTap: () async {
                    await WorkerRegistryRepository.resetErrorCount(widget.worker.id);
                    if (mounted) Navigator.pop(context);
                  },
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: TacticalButton(
                  title: "APPLY CONFIG", 
                  onTap: () async {
                    await WorkerRegistryRepository.updateWorker(widget.worker.id, {
                      'mode': selectedMode.name,
                      'priority': selectedPriority.name,
                    });
                    if (mounted) Navigator.pop(context);
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _modeSelector() {
    return Row(
      children: WorkerMode.values.map((mode) {
        final active = selectedMode == mode;
        return Expanded(
          child: GestureDetector(
            onTap: () => setState(() => selectedMode = mode),
            child: Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: active ? AppColors.gold.withValues(alpha: 0.1) : Colors.transparent,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: active ? AppColors.gold : Colors.white10),
              ),
              child: Center(
                child: Text(_getModeLabel(mode), 
                  style: AppTypography.label.copyWith(fontSize: 8, color: active ? AppColors.gold : Colors.white24)),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _prioritySelector() {
    return Row(
      children: WorkerPriority.values.map((p) {
        final active = selectedPriority == p;
        return Expanded(
          child: GestureDetector(
            onTap: () => setState(() => selectedPriority = p),
            child: Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: active ? _getPriorityColor(p).withValues(alpha: 0.1) : Colors.transparent,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: active ? _getPriorityColor(p) : Colors.white10),
              ),
              child: Center(
                child: Text(p.name.toUpperCase(), 
                  style: AppTypography.label.copyWith(fontSize: 8, color: active ? _getPriorityColor(p) : Colors.white24)),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  String _getModeLabel(WorkerMode mode) {
    switch (mode) {
      case WorkerMode.auto: return "AUTO";
      case WorkerMode.manual: return "MANUAL";
    }
  }

  Color _getPriorityColor(WorkerPriority p) {
    switch (p) {
      case WorkerPriority.critical: return Colors.redAccent;
      case WorkerPriority.high: return Colors.orangeAccent;
      case WorkerPriority.normal: return Colors.blueAccent;
      case WorkerPriority.low: return Colors.white24;
    }
  }
}
