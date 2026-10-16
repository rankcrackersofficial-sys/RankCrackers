import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/dashboard/presentation/providers/dashboard_scroll_provider.dart';

class MainNavigationShell extends ConsumerWidget {
  final StatefulNavigationShell navigationShell;

  const MainNavigationShell({
    super.key,
    required this.navigationShell,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scheme = Theme.of(context).colorScheme;
    final int effectiveIndex = navigationShell.currentIndex;

    // Root dashboard may exit normally. Other tabs must always provide a
    // deterministic back path to the dashboard instead of swallowing back.
    final canPopFromShell = navigationShell.currentIndex == 0;
    return PopScope(
      canPop: canPopFromShell,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (!canPopFromShell) {
          navigationShell.goBranch(0, initialLocation: true);
        }
      },
      child: Scaffold(
        body: navigationShell,
        bottomNavigationBar: Container(
          height: 78,
          decoration: BoxDecoration(
            color: scheme.surfaceContainerHighest,
            border: Border(
              top: BorderSide(
                color: scheme.outline,
              ),
            ),
            boxShadow: [
              BoxShadow(
                color: scheme.shadow.withValues(alpha: 0.18),
                blurRadius: 20,
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _navItem(
                context,
                icon: Icons.home_rounded,
                label: 'Home',
                index: 0,
                effectiveIndex: effectiveIndex,
              ),
              _navItem(
                context,
                icon: Icons.local_fire_department_rounded,
                label: 'Crucible',
                index: 1,
                effectiveIndex: effectiveIndex,
              ),
              _navItem(
                context,
                icon: Icons.auto_stories_rounded,
                label: 'DigiBook',
                index: 2,
                effectiveIndex: effectiveIndex,
              ),
              _navItem(
                context,
                icon: Icons.account_tree_rounded,
                label: 'Syllabus',
                index: 3,
                effectiveIndex: effectiveIndex,
              ),
              _navItem(
                context,
                icon: Icons.work_outline_rounded,
                label: 'Career',
                index: 4,
                effectiveIndex: effectiveIndex,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _navItem(
    BuildContext context, {
    required IconData icon,
    required String label,
    required int index,
    required int effectiveIndex,
  }) {
    final bool active = effectiveIndex == index;
    final scheme = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: () => navigationShell.goBranch(
        index,
        initialLocation: index == navigationShell.currentIndex,
      ),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: active
              ? scheme.primary.withValues(alpha: 0.12)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: active ? scheme.primary : scheme.onSurfaceVariant,
              size: 21,
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: active ? scheme.primary : scheme.onSurfaceVariant,
                    fontWeight: active ? FontWeight.w700 : FontWeight.w500,
                    letterSpacing: 0.15,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
