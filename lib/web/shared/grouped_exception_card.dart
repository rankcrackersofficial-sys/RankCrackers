import 'package:flutter/material.dart';
import '../founder/automation/automation_telemetry_repository.dart';
import '../founder/theme/founder_light_theme.dart';

/// Grouped Exception Card (Grouped Exception Desk)
/// Conforms to SCR-12 from the Stitch specification.
/// Presents dual-worker split evidence, AI consensus policy recommendation,
/// and executive policy actions (e.g. Rule POL-902). Zero atom micro-approvals!
class GroupedExceptionCard extends StatefulWidget {
  final AutomationExceptionTelemetry? exception;
  final AutomationRunTelemetry? relatedRun;
  final AutomationTelemetryRepository repository;
  final VoidCallback? onResolved;

  const GroupedExceptionCard({
    super.key,
    this.exception,
    this.relatedRun,
    required this.repository,
    this.onResolved,
  });

  @override
  State<GroupedExceptionCard> createState() => _GroupedExceptionCardState();
}

class _GroupedExceptionCardState extends State<GroupedExceptionCard> {
  bool _auditChecked = true;
  bool _isActionInProgress = false;

  @override
  Widget build(BuildContext context) {
    final exc = widget.exception;
    if (exc == null) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: FounderLightTheme.border),
        ),
        child: const Text(
          'No live automation exception evidence. Awaiting live sync.',
          style: TextStyle(color: FounderLightTheme.textMuted),
        ),
      );
    }
    final excId = exc.id;
    final ruleId = exc.ruleId ?? 'Not assigned';
    final recommendation = exc.aiPolicyRecommendation ??
        'No AI policy recommendation recorded.';
    final runId = exc.runId.isNotEmpty ? exc.runId : (widget.relatedRun?.id ?? '');
    final run = widget.relatedRun;
    final scope = exc.affectedItemsScope ?? const <String, dynamic>{};
    final generator = run?.generatorResult;
    final verifier = run?.verifierResult;
    final affectedCount = scope['count']?.toString() ??
        scope['affectedCount']?.toString() ??
        'Not reported';
    final affectedLabel = scope['label']?.toString() ??
        scope['description']?.toString() ??
        'No live scope attached';
    final atomId = scope['atomId']?.toString() ?? 'Not reported';
    final atomDescription = scope['atomDescription']?.toString() ??
        'No live atom scope attached';
    final target = scope['target']?.toString() ?? 'Not reported';
    final generatorConfidence = _telemetryConfidence(generator);
    final verifierConfidence = _telemetryConfidence(verifier);
    final generatorModel = _telemetryValue(generator, 'model');
    final verifierModel = _telemetryValue(verifier, 'model');
    final generatorSource = _telemetryValue(generator, 'ocrSource');
    final verifierSource = _telemetryValue(verifier, 'ocrSource');
    final generatorVerdict = _telemetryValue(generator, 'verdict');
    final verifierVerdict = _telemetryValue(verifier, 'verdict');

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: FounderLightTheme.amberBorder,
          width: 2,
        ),
        boxShadow: FounderLightTheme.softShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  FounderLightTheme.goldLight.withValues(alpha: 0.9),
                  FounderLightTheme.goldLight.withValues(alpha: 0.4),
                ],
              ),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(10),
                topRight: Radius.circular(10),
              ),
              border: const Border(
                bottom: BorderSide(color: FounderLightTheme.amberBorder),
              ),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.report_problem_rounded,
                  size: 20,
                  color: Color(0xFF78350F), // Amber 900
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: FounderLightTheme.amber.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'CRITICAL POLICY LEVEL-0',
                          style: TextStyle(
                            fontFamily: 'monospace',
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF78350F),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Grouped Exception: $excId',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: FounderLightTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
                const Text(
                  'Collection: automation_exceptions',
                  style: TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 10,
                    color: FounderLightTheme.textMuted,
                  ),
                ),
              ],
            ),
          ),

          // Content Body
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Affected Scope Cards (3 columns)
                LayoutBuilder(
                  builder: (context, constraints) {
                    final isNarrow = constraints.maxWidth < 600;
                    return isNarrow
                        ? Column(
                            children: [
                              _scopeTile('Affected Scope', affectedCount,
                                  affectedLabel),
                              const SizedBox(height: 8),
                              _scopeTile('Knowledge Atom', atomId,
                                  atomDescription,
                                  color: FounderLightTheme.gold),
                              const SizedBox(height: 8),
                              _scopeTile('Target DigiBook', target,
                                  'Live target from exception scope',
                                  color: FounderLightTheme.emerald),
                            ],
                          )
                        : Row(
                            children: [
                              Expanded(
                                child: _scopeTile('Affected Scope',
                                    affectedCount, affectedLabel),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: _scopeTile('Knowledge Atom', atomId,
                                    atomDescription,
                                    color: FounderLightTheme.gold),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: _scopeTile(
                                    'Target DigiBook',
                                    target,
                                    'Live target from exception scope',
                                    color: FounderLightTheme.emerald),
                              ),
                            ],
                          );
                  },
                ),
                const SizedBox(height: 14),

                // Dual-Worker Evidence Cards (Split Comparison)
                LayoutBuilder(
                  builder: (context, constraints) {
                    final isNarrow = constraints.maxWidth < 700;
                    return isNarrow
                        ? Column(
                            children: [
                              _workerResultCard(
                                title: 'Worker 1 (generatorResult)',
                                confidence: generatorConfidence,
                                model: generatorModel,
                                source: generatorSource,
                                verdict: generatorVerdict,
                                isGenerator: true,
                              ),
                              const SizedBox(height: 10),
                              _workerResultCard(
                                title: 'Worker 2 (verifierResult)',
                                confidence: verifierConfidence,
                                model: verifierModel,
                                source: verifierSource,
                                verdict: verifierVerdict,
                                isGenerator: false,
                              ),
                            ],
                          )
                        : Row(
                            children: [
                              Expanded(
                                child: _workerResultCard(
                                  title: 'Worker 1 (generatorResult)',
                                  confidence: generatorConfidence,
                                  model: generatorModel,
                                  source: generatorSource,
                                  verdict: generatorVerdict,
                                  isGenerator: true,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: _workerResultCard(
                                  title: 'Worker 2 (verifierResult)',
                                  confidence: verifierConfidence,
                                  model: verifierModel,
                                  source: verifierSource,
                                  verdict: verifierVerdict,
                                  isGenerator: false,
                                ),
                              ),
                            ],
                          );
                  },
                ),
                const SizedBox(height: 14),

                // AI Consensus Recommendation Box
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: FounderLightTheme.goldLight.withValues(alpha: 0.6),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: FounderLightTheme.amberBorder),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.psychology_outlined,
                              size: 16, color: Color(0xFF78350F)),
                          SizedBox(width: 6),
                          Text(
                            'AUTONOMOUS CONSENSUS RECOMMENDATION:',
                            style: TextStyle(
                              fontFamily: 'monospace',
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF78350F),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        recommendation,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: FounderLightTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Applies only the live AI policy recommendation recorded for this exception. No student-facing publication occurs until the automation run is eligible.',
                        style: TextStyle(
                          fontSize: 11,
                          color: FounderLightTheme.textSecondary,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                // Cryptographic Non-Repudiation Checkbox
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: FounderLightTheme.surfaceAlt,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: FounderLightTheme.border),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Checkbox(
                        value: _auditChecked,
                        activeColor: FounderLightTheme.gold,
                        onChanged: (v) =>
                            setState(() => _auditChecked = v ?? true),
                      ),
                      const Expanded(
                        child: Text(
                          'Cryptographic non-repudiation audit receipt: Log transaction to Coldline Immutable Ledger (sha256 signature generated upon override). No manual atom-level clicks permitted.',
                          style: TextStyle(
                            fontFamily: 'monospace',
                            fontSize: 10,
                            color: FounderLightTheme.textSecondary,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                // Executive Actions Bar (No Atom-Level Controls)
                Row(
                  children: [
                    _isActionInProgress
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Wrap(
                            spacing: 10,
                            runSpacing: 8,
                            children: [
                              // Primary Policy Override Button
                              InkWell(
                                onTap: () => _handleApplyPolicyOverride(
                                    excId, runId, ruleId),
                                borderRadius: BorderRadius.circular(6),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 14, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: FounderLightTheme.gold,
                                    borderRadius: BorderRadius.circular(6),
                                    boxShadow: FounderLightTheme.softShadow,
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.verified_rounded,
                                          size: 15, color: Colors.white),
                                      const SizedBox(width: 6),
                                      Text(
                                        'Apply Policy Override: Dual Answer Acceptance Rule $ruleId',
                                        style: const TextStyle(
                                          fontFamily: 'monospace',
                                          fontSize: 11,
                                          fontWeight: FontWeight.w800,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),

                              // Keep in Auto-Hold Button
                              OutlinedButton(
                                onPressed: () => _handleKeepInHold(excId),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor:
                                      FounderLightTheme.textPrimary,
                                  side: const BorderSide(
                                      color: FounderLightTheme.borderSecondary),
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 14, vertical: 8),
                                ),
                                child: const Text(
                                  'Keep in Auto-Hold',
                                  style: TextStyle(
                                    fontFamily: 'monospace',
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ],
                          ),
                    const Spacer(),
                    TextButton(
                      onPressed: () => _handleEscalate(excId),
                      child: const Text(
                        'Escalate to Academic Council',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: FounderLightTheme.textMuted,
                          decoration: TextDecoration.underline,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _telemetryValue(Map<String, dynamic>? result, String key) {
    final value = result?[key];
    if (value == null || value.toString().trim().isEmpty) {
      return 'No live evidence attached';
    }
    return value.toString();
  }

  String _telemetryConfidence(Map<String, dynamic>? result) {
    final value = result?['confidence'];
    if (value == null) return 'Awaiting live confidence';
    final parsed = double.tryParse(value.toString());
    if (parsed == null) return 'Unreported confidence';
    final normalized = parsed <= 1 ? parsed * 100 : parsed;
    return '${normalized.toStringAsFixed(1)}% Confidence';
  }

  Widget _scopeTile(String label, String value, String desc, {Color? color}) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: FounderLightTheme.surfaceAlt,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: FounderLightTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              fontFamily: 'monospace',
              fontSize: 9,
              fontWeight: FontWeight.w700,
              color: FounderLightTheme.textMuted,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            value,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: color ?? FounderLightTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            desc,
            style: const TextStyle(
              fontFamily: 'monospace',
              fontSize: 10,
              color: FounderLightTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _workerResultCard({
    required String title,
    required String confidence,
    required String model,
    required String source,
    required String verdict,
    required bool isGenerator,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: FounderLightTheme.borderSecondary),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 7,
                    height: 7,
                    decoration: BoxDecoration(
                      color: isGenerator
                          ? FounderLightTheme.emerald
                          : FounderLightTheme.primaryBlue,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    title,
                    style: const TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: FounderLightTheme.textPrimary,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: isGenerator
                      ? FounderLightTheme.successBg
                      : FounderLightTheme.primaryBlueLight,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  confidence,
                  style: TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: isGenerator
                        ? FounderLightTheme.emerald
                        : FounderLightTheme.primaryBlue,
                  ),
                ),
              ),
            ],
          ),
          const Divider(height: 14, color: FounderLightTheme.border),
          Text.rich(
            TextSpan(
              style: const TextStyle(
                fontFamily: 'monospace',
                fontSize: 10,
                color: FounderLightTheme.textSecondary,
                height: 1.4,
              ),
              children: [
                const TextSpan(
                    text: 'Model: ',
                    style: TextStyle(fontWeight: FontWeight.bold)),
                TextSpan(text: '$model\n'),
                const TextSpan(
                    text: 'Source: ',
                    style: TextStyle(fontWeight: FontWeight.bold)),
                TextSpan(text: '$source\n'),
                const TextSpan(
                    text: 'Decomposition Result: ',
                    style: TextStyle(fontWeight: FontWeight.bold)),
                TextSpan(
                    text: verdict,
                    style:
                        const TextStyle(color: FounderLightTheme.textPrimary)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleApplyPolicyOverride(
      String excId, String runId, String ruleId) async {
    setState(() => _isActionInProgress = true);
    try {
      await widget.repository.applyPolicyOverride(
        exceptionId: excId,
        runId: runId,
        ruleId: ruleId,
        note: 'Dual Answer Acceptance applied by Founder Level-0 authority',
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: FounderLightTheme.emerald,
            content: Text(
              'Founder Policy Override $ruleId Applied. Run promoted to auto_passed.',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        );
        widget.onResolved?.call();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: FounderLightTheme.crimson,
            content: Text('Policy Override action failed: $e'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isActionInProgress = false);
    }
  }

  Future<void> _handleKeepInHold(String excId) async {
    setState(() => _isActionInProgress = true);
    try {
      await widget.repository.keepInAutoHold(
        exceptionId: excId,
        reason: 'Maintained at Gate 12 by Founder decision',
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: FounderLightTheme.amber,
            content: Text(
              'Exception maintained in Auto-Hold (Gate 12).',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Action failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isActionInProgress = false);
    }
  }

  Future<void> _handleEscalate(String excId) async {
    setState(() => _isActionInProgress = true);
    try {
      await widget.repository.escalateToCouncil(exceptionId: excId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Discrepancy escalated to Academic Council ledger.',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Escalation failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isActionInProgress = false);
    }
  }
}
