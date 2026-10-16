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
                index: 0,
                effectiveIndex: effectiveIndex,
              ),
              _navItem(
                context,
                icon: Icons.local_fire_department_rounded,
                index: 1,
                effectiveIndex: effectiveIndex,
              ),
              _navItem(
                context,
                icon: Icons.auto_stories_rounded,
                index: 2,
                effectiveIndex: effectiveIndex,
              ),
              _navItem(
                context,
                icon: Icons.account_tree_rounded,
                index: 3,
                effectiveIndex: effectiveIndex,
              ),
              _navItem(
                context,
                icon: Icons.work_outline_rounded,
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
    required int index,
    required int effectiveIndex,
  }) {
    final bool active = effectiveIndex == index;

    return GestureDetector(
      onTap: () => navigationShell.goBranch(
        index,
        initialLocation: index == navigationShell.currentIndex,
      ),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        padding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 10,
        ),
        decoration: BoxDecoration(
          color: active
              ? scheme.primary.withValues(alpha: 0.12)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Icon(
          icon,
          color: active ? scheme.primary : scheme.onSurfaceVariant,
          size: 24,
        ),
      ),
    );
  }
}
