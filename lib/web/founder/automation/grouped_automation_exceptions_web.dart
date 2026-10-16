import 'package:flutter/material.dart';
import '../../shared/grouped_exception_card.dart';
import '../theme/founder_light_theme.dart';
import 'automation_telemetry_repository.dart';

/// SCR-12: Grouped Automation Exceptions
/// Dedicated Policy Desk for resolving Gate 12 exceptions.
/// Conforms to Stitch screen 75a64a7be8cc4141b19341cb00f9199c.
class GroupedAutomationExceptionsWeb extends StatefulWidget {
  final VoidCallback? onBack;

  const GroupedAutomationExceptionsWeb({super.key, this.onBack});

  @override
  State<GroupedAutomationExceptionsWeb> createState() =>
      _GroupedAutomationExceptionsWebState();
}

class _GroupedAutomationExceptionsWebState
    extends State<GroupedAutomationExceptionsWeb> {
  late final AutomationTelemetryRepository _repository;

  @override
  void initState() {
    super.initState();
    _repository = AutomationTelemetryRepository();
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<AutomationExceptionTelemetry>>(
      stream: _repository.watchOpenExceptions(),
      builder: (context, snapshot) {
        final exceptions = snapshot.data ?? const [];
        final hasOpenExceptions = exceptions.isNotEmpty;

        return SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Breadcrumb & Back
              if (widget.onBack != null)
                TextButton.icon(
                  onPressed: widget.onBack,
                  icon: const Icon(Icons.arrow_back_rounded, size: 16),
                  label: const Text('BACK TO OPERATIONS OVERVIEW'),
                  style: TextButton.styleFrom(
                    foregroundColor: FounderLightTheme.gold,
                    textStyle: const TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              const SizedBox(height: 8),

              // Screen Header
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: FounderLightTheme.border),
                  boxShadow: FounderLightTheme.softShadow,
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'OPERATIONS // SCR-12',
                            style: TextStyle(
                              fontFamily: 'monospace',
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              color: FounderLightTheme.gold,
                              letterSpacing: 0.8,
                            ),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Grouped Automation Exceptions Desk',
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              color: FounderLightTheme.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Level-0 Executive Policy Resolution Desk • Zero Atom-by-Atom Reviews',
                            style: TextStyle(
                              fontFamily: 'monospace',
                              fontSize: 11,
                              color: FounderLightTheme.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: hasOpenExceptions
                            ? FounderLightTheme.warningBg
                            : FounderLightTheme.successBg,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: hasOpenExceptions
                              ? FounderLightTheme.amberBorder
                              : FounderLightTheme.emeraldBorder,
                        ),
                      ),
                      child: Text(
                        hasOpenExceptions
                            ? '${exceptions.length} OPEN EXCEPTION(S)'
                            : 'ZERO OPEN EXCEPTIONS',
                        style: TextStyle(
                          fontFamily: 'monospace',
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          color: hasOpenExceptions
                              ? FounderLightTheme.amber
                              : FounderLightTheme.emerald,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Exception Cards Stream
              if (hasOpenExceptions) ...[
                for (final exc in exceptions) ...[
                  GroupedExceptionCard(
                    exception: exc,
                    repository: _repository,
                    onResolved: () => setState(() {}),
                  ),
                  const SizedBox(height: 16),
                ],
              ] else ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: FounderLightTheme.border),
                  ),
                  child: const Text(
                    'No live automation exceptions. Awaiting live sync.',
                    style: TextStyle(color: FounderLightTheme.textMuted),
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}
