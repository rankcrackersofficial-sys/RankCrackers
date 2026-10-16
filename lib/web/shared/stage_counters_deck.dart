import 'package:flutter/material.dart';
import '../founder/automation/automation_telemetry_repository.dart';
import '../founder/theme/founder_light_theme.dart';

/// Stage Counters Deck
/// Renders 7 real pipeline stage counters conforming to the deterministic contract:
/// 1. Queued, 2. Generating, 3. Verifying, 4. Reconciling, 5. Auto-Passed, 6. Auto-Hold, 7. Failed.
class StageCountersDeck extends StatelessWidget {
  final List<AutomationRunTelemetry> runs;
  final int openExceptionsCount;
  final ValueChanged<AutomationRunStatus>? onFilterStatus;

  const StageCountersDeck({
    super.key,
    required this.runs,
    this.openExceptionsCount = 0,
    this.onFilterStatus,
  });

  @override
  Widget build(BuildContext context) {
    // Tally real states from Firestore automation_runs
    int queued = 0;
    int generating = 0;
    int verifying = 0;
    int reconciling = 0;
    int autoPassed = 0;
    int autoHold = openExceptionsCount;
    int failed = 0;

    for (final run in runs) {
      switch (run.status) {
        case AutomationRunStatus.queued:
          queued++;
          break;
        case AutomationRunStatus.generating:
          generating++;
          break;
        case AutomationRunStatus.verifying:
          verifying++;
          break;
        case AutomationRunStatus.reconciling:
          reconciling++;
          break;
        case AutomationRunStatus.autoPassed:
        case AutomationRunStatus.autoRepaired:
          autoPassed++;
          break;
        case AutomationRunStatus.autoHold:
          autoHold++;
          break;
        case AutomationRunStatus.failed:
          failed++;
          break;
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Row(
              children: [
                Icon(Icons.schema_outlined,
                    size: 16, color: FounderLightTheme.gold),
                SizedBox(width: 6),
                Text(
                  'AUTONOMOUS PIPELINE STAGE TELEMETRY [CONTRACT: `automation_runs`]',
                  style: TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: FounderLightTheme.textSecondary,
                    letterSpacing: 0.6,
                  ),
                ),
              ],
            ),
            Text(
              'Active Runs Tracked: ${runs.length}',
              style: const TextStyle(
                fontFamily: 'monospace',
                fontSize: 11,
                color: FounderLightTheme.textMuted,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        LayoutBuilder(
          builder: (context, constraints) {
            final double cardWidth = (constraints.maxWidth - (6 * 8)) / 7;
            final bool useWrap = constraints.maxWidth < 900;

            if (useWrap) {
              return Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _buildStageCards(
                  queued: queued,
                  generating: generating,
                  verifying: verifying,
                  reconciling: reconciling,
                  autoPassed: autoPassed,
                  autoHold: autoHold,
                  failed: failed,
                  width: 140,
                ),
              );
            }

            return Row(
              children: _buildStageCards(
                queued: queued,
                generating: generating,
                verifying: verifying,
                reconciling: reconciling,
                autoPassed: autoPassed,
                autoHold: autoHold,
                failed: failed,
                width: cardWidth,
              ),
            );
          },
        ),
      ],
    );
  }

  List<Widget> _buildStageCards({
    required int queued,
    required int generating,
    required int verifying,
    required int reconciling,
    required int autoPassed,
    required int autoHold,
    required int failed,
    required double width,
  }) {
    return [
      _stageCard(
        stageNumber: '1',
        title: 'Queued',
        value: '$queued tasks',
        subtitle: queued > 0 ? 'in queue' : 'idle',
        borderColor: FounderLightTheme.border,
        textColor: FounderLightTheme.textPrimary,
        statusColor: FounderLightTheme.textDisabled,
        width: width,
        onTap: () => onFilterStatus?.call(AutomationRunStatus.queued),
      ),
      const SizedBox(width: 8),
      _stageCard(
        stageNumber: '2',
        title: 'Generating',
        value: '$generating active',
        subtitle: generating > 0 ? 'worker_extract' : 'awaiting run',
        borderColor: FounderLightTheme.blueBorder,
        bgColor: FounderLightTheme.primaryBlueLight,
        textColor: FounderLightTheme.primaryBlue,
        statusColor: FounderLightTheme.primaryBlue,
        width: width,
        onTap: () => onFilterStatus?.call(AutomationRunStatus.generating),
      ),
      const SizedBox(width: 8),
      _stageCard(
        stageNumber: '3',
        title: 'Verifying',
        value: '$verifying running',
        subtitle: verifying > 0 ? 'parity check' : 'verified',
        borderColor: FounderLightTheme.blueBorder,
        bgColor: FounderLightTheme.primaryBlueLight,
        textColor: FounderLightTheme.primaryBlue,
        statusColor: FounderLightTheme.primaryBlue,
        width: width,
        onTap: () => onFilterStatus?.call(AutomationRunStatus.verifying),
      ),
      const SizedBox(width: 8),
      _stageCard(
        stageNumber: '4',
        title: 'Reconciling',
        value: '$reconciling dual',
        subtitle: 'consensus engine',
        borderColor: FounderLightTheme.border,
        textColor: const Color(0xFF7E22CE), // Purple 700
        statusColor: const Color(0xFF9333EA),
        width: width,
        onTap: () => onFilterStatus?.call(AutomationRunStatus.reconciling),
      ),
      const SizedBox(width: 8),
      _stageCard(
        stageNumber: '5',
        title: 'Auto-Passed',
        value: '$autoPassed items',
        subtitle: '>90% conf.',
        borderColor: FounderLightTheme.emeraldBorder,
        bgColor: FounderLightTheme.successBg,
        textColor: FounderLightTheme.emerald,
        statusColor: FounderLightTheme.emerald,
        width: width,
        onTap: () => onFilterStatus?.call(AutomationRunStatus.autoPassed),
      ),
      const SizedBox(width: 8),
      _stageCard(
        stageNumber: '6',
        title: 'Auto-Hold',
        value: '$autoHold policy halt',
        subtitle: 'Gate 12 req.',
        borderColor: FounderLightTheme.amberBorder,
        bgColor: FounderLightTheme.warningBg,
        textColor: FounderLightTheme.amber,
        statusColor: FounderLightTheme.amber,
        isWarning: true,
        width: width,
        onTap: () => onFilterStatus?.call(AutomationRunStatus.autoHold),
      ),
      const SizedBox(width: 8),
      _stageCard(
        stageNumber: '7',
        title: 'Failed',
        value: '$failed fatal',
        subtitle: failed == 0 ? '0 errors' : 'requires repair',
        borderColor: failed > 0
            ? FounderLightTheme.crimsonBorder
            : FounderLightTheme.border,
        bgColor:
            failed > 0 ? FounderLightTheme.dangerBg : FounderLightTheme.surface,
        textColor: failed > 0
            ? FounderLightTheme.crimson
            : FounderLightTheme.textPrimary,
        statusColor:
            failed > 0 ? FounderLightTheme.crimson : FounderLightTheme.emerald,
        width: width,
        onTap: () => onFilterStatus?.call(AutomationRunStatus.failed),
      ),
    ];
  }

  Widget _stageCard({
    required String stageNumber,
    required String title,
    required String value,
    required String subtitle,
    required Color borderColor,
    Color? bgColor,
    required Color textColor,
    required Color statusColor,
    required double width,
    bool isWarning = false,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: width,
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: bgColor ?? Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: borderColor,
            width: isWarning ? 1.5 : 1,
          ),
          boxShadow: FounderLightTheme.softShadow,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              '$stageNumber. $title',
              style: TextStyle(
                fontFamily: 'monospace',
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: textColor,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: textColor,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
            Row(
              children: [
                Container(
                  width: 5,
                  height: 5,
                  decoration: BoxDecoration(
                    color: statusColor,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    subtitle,
                    style: TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 9,
                      fontWeight: FontWeight.w600,
                      color: textColor.withValues(alpha: 0.8),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
