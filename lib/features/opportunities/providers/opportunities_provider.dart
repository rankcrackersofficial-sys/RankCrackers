import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/opportunity.dart';

/// 🔱 OPPORTUNITIES PROVIDER
/// Streams all active recruitment notifications from Firestore.
final allOpportunitiesProvider = StreamProvider<List<Opportunity>>((ref) {
  return FirebaseFirestore.instance
      .collection('recruitments')
      .where('status', isEqualTo: 'published')
      .snapshots()
      .map((snapshot) => snapshot.docs
          .map((doc) => Opportunity.fromMap({...doc.data(), 'id': doc.id}))
          .toList());
});
