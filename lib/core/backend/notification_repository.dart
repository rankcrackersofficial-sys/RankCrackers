import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/notification_event.dart';
import '../firebase/firestore_service.dart';

/// NOTIFICATION REPOSITORY
/// Access layer for tactical alerts.
class NotificationRepository {
  static final _firestore = FirebaseFirestore.instance;
  static const String _globalCollection = 'global_alerts';

  static Future<void> push(NotificationEvent event) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    await FirestoreService.saveNotification(user.uid, event);
  }

  static Future<void> pushGlobal(NotificationEvent event) async {
    await _firestore.collection(_globalCollection).doc(event.id).set(event.toMap());
  }

  static Stream<List<NotificationEvent>> stream() {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return Stream.value([]);
    return FirestoreService.streamNotifications(user.uid);
  }

  static Stream<List<NotificationEvent>> streamGlobal() {
    return _firestore.collection(_globalCollection).snapshots().map((snap) =>
        snap.docs.map((d) => NotificationEvent.fromMap(d.data())).toList());
  }
}
