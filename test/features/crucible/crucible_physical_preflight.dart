import 'package:flutter_test/flutter_test.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';

/// CRUCIBLE PHYSICAL PREFLIGHT
/// Run this on S23/S24 to verify security rules and content read-back.
void main() {
  group('Crucible Physical Preflight', () {

    test('1. Verify Protocol Write Access', () async {
      final db = FirebaseFirestore.instance;
      final uid = 'test-user-s23'; // Replace with actual UID if possible

      final protocolRef = db.collection('users').doc(uid).collection('protocols').doc('jee_main_2027');

      try {
        await protocolRef.set({
          'recruitmentId': 'jee_main_2027',
          'lastCheck': DateTime.now().toIso8601String(),
          'status': 'preflight'
        });
        print('✅ Protocol write success.');
      } catch (e) {
        print('❌ Protocol write failed: $e');
        fail('Permission denied on protocols subcollection.');
      }
    });

    test('2. Verify Content Read Access', () async {
      final db = FirebaseFirestore.instance;
      final atomId = 'DRYRUN_JEE_MAIN_2026_CHEMISTRY_JEE_MAIN_2026_CHEM_U03_T_36668546_CH001';
      final registryId = 'payload_$atomId';

      try {
        final doc = await db.collection('content_payloads').doc(registryId).get();
        if (doc.exists) {
          print('✅ Content read success: ${doc.id}');
          print('   Title: ${doc.data()?['learningOutcome']}');
        } else {
          print('⚠️ Content not found, but read allowed.');
        }
      } catch (e) {
        print('❌ Content read failed: $e');
        fail('Permission denied on content_payloads.');
      }
    });
  });
}
