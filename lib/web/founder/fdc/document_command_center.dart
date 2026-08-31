import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:rank_crackers/features/admin/presentation/widgets/upload_center/upload_center.dart';
import '../mission_control/mission_control_room.dart';
import '../mission_control/mission_documents_tab.dart';
import '../../shared/unified_command_console.dart';

class DocumentCommandCenter extends StatelessWidget {
  final ConsoleRoleMode roleMode;
  const DocumentCommandCenter({super.key, this.roleMode = ConsoleRoleMode.founder});

  @override
  Widget build(BuildContext context) {
    final missionId = MissionControlRoom.selectedMissionId;
    if (missionId == null) return const MissionFactory();

    return StreamBuilder<List<DocumentSnapshot<Map<String, dynamic>>>>(
      stream: _missionSnapshots(missionId),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Center(child: Text('Mission document binding unavailable: ${snapshot.error}'));
        }
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }
        final docs = snapshot.data!;
        final mission = <String, dynamic>{};
        for (final doc in docs.reversed) {
          if (doc.exists) mission.addAll(doc.data() ?? const {});
        }
        if (mission.isEmpty) {
          return Center(
            child: Text('No canonical mission data found for $missionId.'),
          );
        }
        return MissionDocumentsTab(
          missionId: missionId,
          mission: mission,
          roleMode: roleMode,
        );
      },
    );
  }

  Stream<List<DocumentSnapshot<Map<String, dynamic>>>> _missionSnapshots(
    String missionId,
  ) {
    final firestore = FirebaseFirestore.instance;
    late final Stream<List<DocumentSnapshot<Map<String, dynamic>>>> stream;
    stream = firestore.collection('mission_realms').doc(missionId).snapshots().asyncMap(
      (realm) async {
        final results = await Future.wait([
          firestore.collection('recruitments').doc(missionId).get(),
          firestore.collection('student_mission_catalog').doc(missionId).get(),
        ]);
        return [realm, ...results];
      },
    );
    return stream;
  }
}



