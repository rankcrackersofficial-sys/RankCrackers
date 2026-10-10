import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/sentinel_metrics.dart';
import '../../../core/models/notification_item.dart';
import '../data/repositories/sentinel_repository.dart';
import '../../auth/presentation/providers/auth_provider.dart';

/// SENTINEL REPOSITORY PROVIDER
final sentinelRepositoryProvider = Provider<SentinelRepository>((ref) {
  final repo = FirestoreSentinelRepository();
  ref.onDispose(() => repo.dispose());
  return repo;
});

/// SENTINEL METRICS PROVIDER
/// Stream for AI-driven career metrics.
final sentinelMetricsProvider = StreamProvider<SentinelMetrics>((ref) {
  final uid = ref.watch(authNotifierProvider).user?.uid ?? 'guest';
  return ref.watch(sentinelRepositoryProvider).streamMetrics(uid);
});

/// NOTIFICATION FEED PROVIDER
/// Real-time update stream for the Notification Center.
final notificationListProvider = StreamProvider<List<NotificationItem>>((ref) {
  final uid = ref.watch(authNotifierProvider).user?.uid ?? 'guest';
  return ref.watch(sentinelRepositoryProvider).streamNotifications(uid);
});
