import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/opportunity.dart';

/// OPPORTUNITIES PROVIDER
/// Streams all active recruitment notifications from Firestore.
final allOpportunitiesProvider = StreamProvider<List<Opportunity>>((ref) {
  return FirebaseFirestore.instance
      .collection('mission_realms')
      .where('userPanelVisible', isEqualTo: true)
      .where('archived', isEqualTo: false)
      .snapshots()
      .map(
        (snapshot) => snapshot.docs
            .where((doc) {
              final data = doc.data();
              final status = (data['status'] ?? '').toString().toUpperCase();
              return data['archived'] != true &&
                  (status == 'ACTIVE' || status == 'LIVE' || status == 'PUBLISHED');
            })
            .map((doc) => Opportunity.fromMap({...doc.data(), 'id': doc.id}))
            .toList(),
      );
});
