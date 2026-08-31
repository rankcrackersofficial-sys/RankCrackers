import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

class MissionPublishReadinessPanel extends StatelessWidget {
  const MissionPublishReadinessPanel({super.key, required this.missionId});

  final String missionId;

  @override
  Widget build(BuildContext context) {
    final firestore = FirebaseFirestore.instance;
    return FutureBuilder<List<dynamic>>(
      future: Future.wait<dynamic>([
        firestore.collection('mission_realms').doc(missionId).get(),
        firestore.collection('recruitments').doc(missionId).get(),
        firestore.collection('student_mission_catalog').doc(missionId).get(),
        firestore.collection('mission_realms').doc(missionId).collection('official_documents').get(),
      ]),
      builder: (context, snapshot) {
        if (snapshot.hasError) return Center(child: Text('Publish evidence unavailable: ${snapshot.error}'));
        if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
        final realm = snapshot.data![0] as DocumentSnapshot<Map<String, dynamic>>;
        final recruitment = snapshot.data![1] as DocumentSnapshot<Map<String, dynamic>>;
        final catalog = snapshot.data![2] as DocumentSnapshot<Map<String, dynamic>>;
        final documents = snapshot.data![3] as QuerySnapshot<Map<String, dynamic>>;
        final catalogData = catalog.data() ?? const <String, dynamic>{};
        final recruitmentData = recruitment.data() ?? const <String, dynamic>{};
        final visible = catalog.exists && catalogData['cardVisible'] == true &&
            catalogData['userPanelVisible'] == true && catalogData['archived'] != true;
        final verifiedDocuments = documents.docs.where((doc) {
          final data = doc.data();
          final state = (data['verificationStatus'] ?? data['reviewStatus'] ?? data['status'] ?? '').toString().toUpperCase();
          return state == 'VERIFIED' || state == 'APPROVED';
        }).length;
        final pipelineComplete = realm.exists && verifiedDocuments > 0;
        final publicationAllowed = pipelineComplete && visible;
        return ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text('PUBLISH GATE', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 6),
            SelectableText(missionId),
            const SizedBox(height: 24),
            _EvidenceRow(label: 'MISSION AUTHORITY', value: realm.exists ? 'REALM_PRESENT' : 'REALM_MISSING', ok: realm.exists),
            _EvidenceRow(label: 'RECRUITMENT PROJECTION', value: recruitment.exists ? (recruitmentData['status'] ?? 'PRESENT').toString().toUpperCase() : 'MISSING', ok: recruitment.exists),
            _EvidenceRow(label: 'STUDENT PROJECTION', value: catalog.exists ? (visible ? 'STUDENT_VISIBLE' : 'NOT_STUDENT_VISIBLE') : 'MISSING', ok: catalog.exists),
            _EvidenceRow(label: 'DOCUMENT BINDING', value: '${documents.size} SOURCE RECORD(S)', ok: documents.size > 0),
            _EvidenceRow(label: 'SOURCE VERIFIED', value: '$verifiedDocuments VERIFIED/APPROVED', ok: verifiedDocuments > 0),
            _EvidenceRow(label: 'PIPELINE COMPLETE', value: pipelineComplete ? 'YES' : 'NOT_READY', ok: pipelineComplete),
            _EvidenceRow(label: 'PUBLICATION ALLOWED', value: publicationAllowed ? 'YES' : 'BLOCKED', ok: publicationAllowed),
            const SizedBox(height: 16),
            const Text('This gate is evidence-only. Lifecycle and publication mutations remain governed and fail closed.'),
          ],
        );
      },
    );
  }
}

class _EvidenceRow extends StatelessWidget {
  const _EvidenceRow({required this.label, required this.value, required this.ok});
  final String label;
  final String value;
  final bool ok;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: Icon(ok ? Icons.verified_outlined : Icons.block_outlined,
            color: ok ? Colors.greenAccent : Colors.orangeAccent),
        title: Text(label),
        trailing: Text(value, style: TextStyle(
          color: ok ? Colors.greenAccent : Colors.orangeAccent,
          fontWeight: FontWeight.bold,
        )),
      ),
    );
  }
}
