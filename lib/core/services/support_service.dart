import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

/// SUPPORT SERVICE
/// Central authority for warrior assistance and feedback.
/// Connects the Support Center to the Admin Command Plane.
class SupportService {
  static final _firestore = FirebaseFirestore.instance;

  /// CREATE SUPPORT TICKET
  static Future<void> createTicket({
    required String type, // help, feedback, bug_report
    required String message,
    Map<String, dynamic> metadata = const {},
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    final ticketId = 'ticket_${DateTime.now().millisecondsSinceEpoch}';

    try {
      await _firestore.collection('support_tickets').doc(ticketId).set({
        'id': ticketId,
        'uid': user.uid,
        'type': type,
        'message': message,
        'status': 'open',
        'createdAt': FieldValue.serverTimestamp(),
        'metadata': metadata,
      });
      debugPrint('SUPPORT: Ticket $ticketId created.');
    } catch (e) {
      debugPrint('SUPPORT ERROR: Failed to create ticket - $e');
      rethrow;
    }
  }
}
