import 'package:flutter/material.dart';
import '../founder/theme/founder_light_theme.dart';
export 'rc_layout.dart';

/// SCR-18: Dedicated Auxiliary, Empty, Loading, and Error States.
/// Conforms to Executive Command Slate Daylight Light Theme.

/// Empty state when a collection has zero active records
class RcEmptyStateCard extends StatelessWidget {
  final String title;
  final String description;
  final String? buttonLabel;
  final VoidCallback? onAction;
  final IconData icon;

  const RcEmptyStateCard({
    super.key,
    this.title = 'No Active Automation Runs In Flight',
    this.description =
        'Firestore collection `automation_runs` has 0 open exceptions. All missions are operating under verified consensus.',
    this.buttonLabel = 'RETURN TO TELEMETRY →',
    this.onAction,
    this.icon = Icons.inventory_2_outlined,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 40),
      margin: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: FounderLightTheme.border),
        boxShadow: FounderLightTheme.softShadow,
      ),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: FounderLightTheme.surfaceAlt,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 28, color: FounderLightTheme.textMuted),
              ),
              const SizedBox(height: 16),
              Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: FounderLightTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                description,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 12,
                  color: FounderLightTheme.textMuted,
                  height: 1.4,
                ),
              ),
              if (buttonLabel != null && onAction != null) ...[
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: onAction,
                  style: FilledButton.styleFrom(
                    backgroundColor: FounderLightTheme.gold,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 10),
                    textStyle: const TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  child: Text(buttonLabel!),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// Skeleton loading placeholder with pulse animation
class RcSkeletonLoading extends StatelessWidget {
  final double height;
  final double width;
  final BorderRadius? borderRadius;

  const RcSkeletonLoading({
    super.key,
    this.height = 80,
    this.width = double.infinity,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      width: width,
      decoration: BoxDecoration(
        color: FounderLightTheme.surfaceAlt,
        borderRadius: borderRadius ?? BorderRadius.circular(8),
        border: Border.all(color: FounderLightTheme.borderSubtle),
      ),
    );
  }
}

/// 403 Permission Denied state
class RcPermissionDeniedCard extends StatelessWidget {
  final String requiredLevel;
  final String moduleName;

  const RcPermissionDeniedCard({
    super.key,
    this.requiredLevel = 'Level-0 (Founder Execution)',
    this.moduleName = 'This operational workspace',
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: FounderLightTheme.crimsonBorder, width: 1.5),
        boxShadow: FounderLightTheme.softShadow,
      ),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: const BoxDecoration(
                color: FounderLightTheme.dangerBg,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.gpp_bad_rounded,
                  size: 28, color: FounderLightTheme.crimson),
            ),
            const SizedBox(height: 14),
            const Text(
              '403 — LEVEL-0 PERMISSION REQUIRED',
              style: TextStyle(
                fontFamily: 'monospace',
                fontSize: 13,
                fontWeight: FontWeight.w900,
                color: FounderLightTheme.crimson,
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '$moduleName is restricted to Founder level-0 authority keys. Admin roles can only inspect assigned modules.',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 12,
                color: FounderLightTheme.textSecondary,
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Offline / Network Recovery state
class RcOfflineStateCard extends StatelessWidget {
  final VoidCallback onRetry;

  const RcOfflineStateCard({super.key, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: FounderLightTheme.warningBg,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: FounderLightTheme.amberBorder),
      ),
      child: Row(
        children: [
          const Icon(Icons.wifi_off_rounded,
              size: 22, color: FounderLightTheme.amber),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'SYSTEM TELEMETRY OFFLINE // LOCAL CACHE RETENTION',
                  style: TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF78350F),
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'Connection to Firebase Firestore lost. Read-only cached records displayed.',
                  style: TextStyle(
                      fontSize: 11, color: FounderLightTheme.textSecondary),
                ),
              ],
            ),
          ),
          OutlinedButton(
            onPressed: onRetry,
            style: OutlinedButton.styleFrom(
              foregroundColor: FounderLightTheme.amber,
              side: const BorderSide(color: FounderLightTheme.amber),
            ),
            child: const Text('RETRY SYNC',
                style: TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 10,
                    fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
