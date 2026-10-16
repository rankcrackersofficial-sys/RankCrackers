import 'package:flutter/material.dart';
import '../founder/theme/founder_light_theme.dart';

/// Executive Authority Bar
/// Displays the active mission context, Gate 12 exception status, latency telemetry,
/// and the 4 prominent Founder executive authority controls.
class ExecutiveAuthorityBar extends StatelessWidget {
  final String missionTitle;
  final String realmId;
  final String gateStatus;
  final String telemetryInfo;
  final VoidCallback? onEmergencyHalt;
  final VoidCallback? onHaltStudentDelivery;
  final VoidCallback? onArchiveMission;
  final VoidCallback? onSystemPolicySettings;

  const ExecutiveAuthorityBar({
    super.key,
    this.missionTitle = 'NEET UG 2026 – Chemical Bonding & Molecular Structure',
    this.realmId = 'realm_neet_chem_bond_2026_v4',
    this.gateStatus = 'GATE 12 EXCEPTION HOLD',
    this.telemetryInfo = '14ms latency • Node DEL-ALPHA-01 // v4.12',
    this.onEmergencyHalt,
    this.onHaltStudentDelivery,
    this.onArchiveMission,
    this.onSystemPolicySettings,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      decoration: BoxDecoration(
        color: FounderLightTheme.surface,
        border: const Border(
          bottom: BorderSide(color: FounderLightTheme.border),
        ),
        boxShadow: FounderLightTheme.softShadow,
      ),
      child: Wrap(
        spacing: 12,
        runSpacing: 8,
        crossAxisAlignment: WrapCrossAlignment.center,
        alignment: WrapAlignment.spaceBetween,
        children: [
          // Left: Mission Realm Context
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'MISSION CONTEXT:',
                style: TextStyle(
                  fontFamily: 'monospace',
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: FounderLightTheme.textMuted,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: FounderLightTheme.surfaceAlt,
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: FounderLightTheme.border),
                ),
                child: Text(
                  missionTitle,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: FounderLightTheme.textPrimary,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '($realmId)',
                style: const TextStyle(
                  fontFamily: 'monospace',
                  fontSize: 11,
                  color: FounderLightTheme.textDisabled,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: FounderLightTheme.dangerBg,
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: FounderLightTheme.crimsonBorder),
                ),
                child: Text(
                  gateStatus,
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                    color: FounderLightTheme.crimson,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ],
          ),

          // Right: Telemetry & Executive Buttons
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                telemetryInfo,
                style: const TextStyle(
                  fontFamily: 'monospace',
                  fontSize: 11,
                  color: FounderLightTheme.textSecondary,
                ),
              ),
              const SizedBox(width: 14),
              _buildButton(
                label: '[Emergency Halt Pipeline]',
                color: FounderLightTheme.crimson,
                bgColor: FounderLightTheme.dangerBg,
                borderColor: FounderLightTheme.crimson,
                onTap: onEmergencyHalt ??
                    () => _showDialog(context, 'Emergency Halt Pipeline',
                        'Triggered immediate emergency halt across active ingestion & test generation pipelines.'),
              ),
              const SizedBox(width: 8),
              _buildButton(
                label: '[Halt Student Delivery]',
                color: FounderLightTheme.amber,
                bgColor: FounderLightTheme.warningBg,
                borderColor: FounderLightTheme.amber,
                onTap: onHaltStudentDelivery ??
                    () => _showDialog(context, 'Halt Student Delivery',
                        'Student release channels frozen. Existing cached sessions remain read-only.'),
              ),
              const SizedBox(width: 8),
              _buildButton(
                label: '[Archive Mission]',
                color: FounderLightTheme.textSecondary,
                bgColor: FounderLightTheme.surfaceAlt,
                borderColor: FounderLightTheme.borderSecondary,
                onTap: onArchiveMission ??
                    () => _showDialog(context, 'Archive Mission',
                        'Archiving mission realm. All downstream workers disconnected.'),
              ),
              const SizedBox(width: 8),
              _buildFilledButton(
                label: '[System Policy Settings]',
                onTap: onSystemPolicySettings ??
                    () => _showDialog(context, 'System Policy Settings',
                        'Level-0 Policy Governance Matrix opened.'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildButton({
    required String label,
    required Color color,
    required Color bgColor,
    required Color borderColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(4),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(4),
          border: Border.all(color: borderColor),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontFamily: 'monospace',
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
      ),
    );
  }

  Widget _buildFilledButton({
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(4),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
        decoration: BoxDecoration(
          color: FounderLightTheme.gold,
          borderRadius: BorderRadius.circular(4),
          boxShadow: FounderLightTheme.softShadow,
        ),
        child: Text(
          label,
          style: const TextStyle(
            fontFamily: 'monospace',
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
        ),
      ),
    );
  }

  void _showDialog(BuildContext context, String title, String message) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        title: Text(title,
            style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color: FounderLightTheme.textPrimary)),
        content: Text(message,
            style: const TextStyle(
                fontSize: 12, color: FounderLightTheme.textSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('DISMISS',
                style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: FounderLightTheme.gold)),
          ),
        ],
      ),
    );
  }
}
