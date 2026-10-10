import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import '../../models/sentinel_metrics.dart';
import '../../../../core/models/notification_item.dart';
import '../../../../core/models/notification_priority.dart';

/// SENTINEL REPOSITORY INTERFACE
/// Sovereign authority for managing career intelligence and alerts.
abstract class SentinelRepository {
  Stream<SentinelMetrics> streamMetrics(String uid);
  Stream<List<NotificationItem>> streamNotifications(String uid);
  Future<void> markAsRead(String uid, String notificationId);
  Future<void> updateMetrics(String uid, SentinelMetrics metrics);
  void dispose();
}

/// FIRESTORE SENTINEL REPOSITORY (Phase 9B/D Hardened)
/// Physical implementation for real-time Firestore synchronization.
class FirestoreSentinelRepository implements SentinelRepository {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  @override
  Stream<SentinelMetrics> streamMetrics(String uid) {
    if (uid == 'guest') return Stream.value(SentinelMetrics());

    return _firestore
        .collection('users')
        .doc(uid)
        .collection('sentinel')
        .doc('metrics')
        .snapshots()
        .map((snap) =>
            snap.exists ? _mapMetrics(snap.data()!) : SentinelMetrics());
  }

  @override
  Future<void> updateMetrics(String uid, SentinelMetrics metrics) async {
    if (uid == 'guest') return;

    await _firestore
        .collection('users')
        .doc(uid)
        .collection('sentinel')
        .doc('metrics')
        .set({
      'masterySignals': metrics.masterySignals,
      'riskAlerts': metrics.riskAlerts,
      'missionCriticals': metrics.missionCriticals,
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  @override
  Stream<List<NotificationItem>> streamNotifications(String uid) {
    if (uid == 'guest') return Stream.value([]);

    return _firestore
        .collection('users')
        .doc(uid)
        .collection('notifications')
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snap) => snap.docs
            .map((doc) => _mapNotification(doc.id, doc.data()))
            .toList());
  }

  @override
  Future<void> markAsRead(String uid, String notificationId) async {
    if (uid == 'guest') return;

    try {
      await _firestore
          .collection('users')
          .doc(uid)
          .collection('notifications')
          .doc(notificationId)
          .update({'isRead': true, 'read': true});
    } catch (e) {
      debugPrint(
          "SENTINEL REPO ERROR: Failed update, falling back to merge set - $e");
      await _firestore
          .collection('users')
          .doc(uid)
          .collection('notifications')
          .doc(notificationId)
          .set({'isRead': true, 'read': true}, SetOptions(merge: true));
    }
  }

  @override
  void dispose() {
    // Firestore streams are closed by the listener
  }

  NotificationItem _mapNotification(String id, Map<String, dynamic> data) {
    return NotificationItem(
      id: id,
      title: data['title'] ?? '',
      body: data['body'] ?? (data['message'] ?? ''),
      source: data['source'] ?? 'Sentinel',
      priority: _mapPriority(data['priority'] ?? data['priorityState']),
      createdAt: data['timestamp'] != null
          ? (data['timestamp'] is Timestamp
              ? (data['timestamp'] as Timestamp).toDate()
              : DateTime.parse(data['timestamp'].toString()))
          : DateTime.now(),
      read: data['isRead'] ?? (data['read'] ?? false),
    );
  }

  SentinelMetrics _mapMetrics(Map<String, dynamic> data) {
    return SentinelMetrics(
      masterySignals: data['masterySignals'] ?? 0,
      riskAlerts: data['riskAlerts'] ?? 0,
      missionCriticals: data['missionCriticals'] ?? 0,
    );
  }

  NotificationPriority _mapPriority(dynamic p) {
    if (p is int) {
      if (p >= 0 && p < NotificationPriority.values.length) {
        return NotificationPriority.values[p];
      }
      return NotificationPriority.low;
    }

    switch (p?.toString().toLowerCase()) {
      case 'critical':
        return NotificationPriority.critical;
      case 'high':
        return NotificationPriority.high;
      case 'medium':
        return NotificationPriority.medium;
      default:
        return NotificationPriority.low;
    }
  }
}

/// LOCAL SENTINEL REPOSITORY
class LocalSentinelRepository implements SentinelRepository {
  final _notifController = StreamController<List<NotificationItem>>.broadcast();
  List<NotificationItem> _localNotifications = [];

  LocalSentinelRepository() {
    // Local fallback is intentionally empty to ensure zero invented alerts.
    _localNotifications = [];
    _notifController.add(_localNotifications);
  }

  @override
  Stream<SentinelMetrics> streamMetrics(String uid) {
    return Stream.value(SentinelMetrics(
      masterySignals: 0,
      riskAlerts: 0,
      missionCriticals: 0,
    ));
  }

  @override
  Future<void> updateMetrics(String uid, SentinelMetrics metrics) async {
    // Stub
  }

  @override
  Stream<List<NotificationItem>> streamNotifications(String uid) {
    return _notifController.stream;
  }

  @override
  Future<void> markAsRead(String uid, String notificationId) async {
    final index = _localNotifications.indexWhere((n) => n.id == notificationId);
    if (index != -1) {
      _localNotifications[index] =
          _localNotifications[index].copyWith(read: true);
      _notifController.add(List.from(_localNotifications));
    }
  }

  @override
  void dispose() {
    _notifController.close();
  }
}
