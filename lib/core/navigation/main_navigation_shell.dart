import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../../features/dashboard/presentation/providers/dashboard_scroll_provider.dart';

class MainNavigationShell extends ConsumerWidget {
  final StatefulNavigationShell navigationShell;

  const MainNavigationShell({
    super.key,
    required this.navigationShell,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeDashboardSection = ref.watch(dashboardActiveSectionProvider);
    final int effectiveIndex = _calculateEffectiveIndex(
      navigationShell.currentIndex,
      activeDashboardSection,
    );

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (navigationShell.currentIndex != 0) {
          navigationShell.goBranch(0, initialLocation: true);
        }
      },
      child: Scaffold(
        body: navigationShell,
        bottomNavigationBar: Container(
          height: 78,
          decoration: BoxDecoration(
            color: AppColors.surface,
            border: const Border(
              top: BorderSide(
                color: AppColors.borderSoft,
              ),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.24),
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

  int _calculateEffectiveIndex(int currentIndex, DashboardSection section) {
    if (currentIndex != 0) return currentIndex;

    switch (section) {
      case DashboardSection.crucible:
        return 1;
      case DashboardSection.digibook:
        return 2;
      case DashboardSection.syllabus:
        return 3;
      case DashboardSection.tools:
        return 4;
      default:
        return 0;
    }
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
              ? AppColors.gold.withValues(alpha: 0.12)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Icon(
          icon,
          color: active ? AppColors.gold : Colors.white54,
          size: 24,
        ),
      ),
    );
  }
}
