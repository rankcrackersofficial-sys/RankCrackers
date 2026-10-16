import 'dart:math';
import 'package:flutter/material.dart';
import '../founder/theme/founder_light_theme.dart';

/// Executive Header
/// Implements the top brand bar conforming to Stitch design specifications:
/// - 40x40 solid black container (#000000) with official white RankCrackers emblem
/// - Bold typography
/// - Founder console badge
/// - Deterministic telemetry chips
/// - Emergency Rollback and Deploy Changes action buttons
class ExecutiveHeader extends StatelessWidget {
  final String title;
  final String userName;
  final String designation;
  final VoidCallback? onEmergencyRollback;
  final VoidCallback? onDeployChanges;
  final VoidCallback? onToggleSidebar;
  final bool showSidebarToggle;

  const ExecutiveHeader({
    super.key,
    this.title = 'RankCrackers',
    this.userName = 'Founder',
    this.designation = 'Founder & Policy Owner',
    this.onEmergencyRollback,
    this.onDeployChanges,
    this.onToggleSidebar,
    this.showSidebarToggle = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 62,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: FounderLightTheme.border),
        ),
      ),
      child: Row(
        children: [
          if (showSidebarToggle)
            IconButton(
              icon: const Icon(Icons.menu_rounded,
                  color: FounderLightTheme.primaryDark),
              onPressed: onToggleSidebar,
            ),

          // 40x40 Solid Black Container with White Emblem
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: FounderLightTheme.logoBlack,
              borderRadius: BorderRadius.circular(10),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x1A000000),
                  blurRadius: 4,
                  offset: Offset(0, 1),
                ),
              ],
            ),
            padding: const EdgeInsets.all(7),
            child: Image.asset(
              'assets/images/logo_white.png',
              fit: BoxFit.contain,
              errorBuilder: (_, __, ___) => const Icon(
                Icons.auto_awesome,
                color: Colors.white,
                size: 20,
              ),
            ),
          ),
          const SizedBox(width: 12),

          // Brand Name + Founder Console Pill
          Row(
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: FounderLightTheme.textPrimary,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: FounderLightTheme.goldLight,
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: FounderLightTheme.amberBorder),
                ),
                child: const Text(
                  'FOUNDER CONSOLE',
                  style: TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                    color: FounderLightTheme.brandGoldText,
                    letterSpacing: 0.8,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(width: 14),
          const SizedBox(
            height: 20,
            child: VerticalDivider(
              color: FounderLightTheme.border,
              thickness: 1,
            ),
          ),
          const SizedBox(width: 14),

          // Telemetry Chips (Desktop only)
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: FounderLightTheme.surfaceAlt,
                      borderRadius: BorderRadius.circular(4),
                      border:
                          Border.all(color: FounderLightTheme.borderSecondary),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircleAvatar(
                          radius: 3,
                          backgroundColor: FounderLightTheme.emerald,
                        ),
                        SizedBox(width: 6),
                        Text(
                          '[LVL-0 FOUNDER AUTH: VERIFIED]',
                          style: TextStyle(
                            fontFamily: 'monospace',
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: FounderLightTheme.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: FounderLightTheme.primaryBlueLight,
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: FounderLightTheme.blueBorder),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircleAvatar(
                          radius: 3,
                          backgroundColor: FounderLightTheme.primaryBlue,
                        ),
                        SizedBox(width: 6),
                        Text(
                          'FIRESTORE: automation_runs',
                          style: TextStyle(
                            fontFamily: 'monospace',
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: FounderLightTheme.primaryBlue,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Action Buttons: Emergency Rollback & Deploy Changes
          Row(
            children: [
              OutlinedButton.icon(
                onPressed: onEmergencyRollback ??
                    () => _showActionAlert(
                          context,
                          'Emergency Rollback',
                          'Rollback initiated for active deployment payload. Atomic 180s rollback window armed.',
                        ),
                icon: const Icon(Icons.history_rounded, size: 14),
                label: const Text('Emergency Rollback'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: FounderLightTheme.crimson,
                  side: const BorderSide(color: FounderLightTheme.crimson),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  textStyle: const TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              FilledButton.icon(
                onPressed: onDeployChanges ??
                    () => _showActionAlert(
                          context,
                          'Deploy Changes',
                          'Verification passed. Reconciled artifacts published to Student Delivery network.',
                        ),
                icon: const Icon(Icons.rocket_launch_rounded, size: 14),
                label: const Text('Deploy Changes'),
                style: FilledButton.styleFrom(
                  backgroundColor: FounderLightTheme.emerald,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  textStyle: const TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              const SizedBox(width: 14),

              // User Avatar
              CircleAvatar(
                radius: 16,
                backgroundColor: FounderLightTheme.gold,
                child: Text(
                  userName.substring(0, min(2, userName.length)).toUpperCase(),
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    userName,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: FounderLightTheme.textPrimary,
                    ),
                  ),
                  Text(
                    designation,
                    style: const TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w600,
                      color: FounderLightTheme.brandGoldText,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showActionAlert(BuildContext context, String title, String body) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        title: Text(title,
            style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color: FounderLightTheme.textPrimary)),
        content: Text(body,
            style: const TextStyle(
                fontSize: 12, color: FounderLightTheme.textSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('OK',
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
