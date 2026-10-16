import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/tactical_noir_background.dart';
import '../../providers/sentinel_intelligence_provider.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../widgets/notification_card.dart';

class NotificationCenterScreen extends ConsumerWidget {
  const NotificationCenterScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scheme = Theme.of(context).colorScheme;
    final notificationsAsync = ref.watch(notificationListProvider);

    return Scaffold(
      backgroundColor: scheme.surface,
      body: TacticalNoirBackground(
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 12, 24, 12),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => context.pop(),
                      icon: Icon(Icons.arrow_back_ios_new_rounded, color: scheme.onSurface, size: 20),
                    ),
                    const SizedBox(width: 4),
                    Text('NOTIFICATION CENTER', style: AppTypography.hero.copyWith(fontSize: 20)),
                  ],
                ),
              ),
              Expanded(
                child: notificationsAsync.when(
                  data: (notifications) => notifications.isEmpty
                    ? Center(
                        child: Text(
                          'No active notifications.',
                          style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 14),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        itemCount: notifications.length,
                        itemBuilder: (context, index) {
                          final item = notifications[index];
                          return NotificationCard(
                            item: item,
                            onTap: () async {
                              final uid = ref.read(authNotifierProvider).user?.uid ?? 'guest';
                              await ref.read(sentinelRepositoryProvider).markAsRead(uid, item.id);
                            },
                          );
                        },
                      ),
                  loading: () => const Center(child: CircularProgressIndicator(color: AppColors.gold)),
                  error: (e, _) => Center(child: Text("FAILED TO LOAD NOTIFICATIONS", style: AppTypography.label.copyWith(color: AppColors.error))),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
