import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:rank_crackers/features/admin/presentation/widgets/mission_control/mission_control_center.dart';
import 'package:rank_crackers/features/admin/presentation/widgets/upload_factory/upload_factory_center.dart';
import 'mission_documents_tab.dart';
import 'mission_publish_readiness_panel.dart';

import '../../shared/unified_command_console.dart';

class MissionControlRoom extends StatelessWidget {
  static String? selectedMissionId;
  static int targetDetailTab = 0;
  static int targetSubTab = 0;

  final ConsoleRoleMode roleMode;
  final Map<String, dynamic>? permissions;
  final String? taskId;
  const MissionControlRoom(
      {super.key,
      this.roleMode = ConsoleRoleMode.founder,
      this.permissions,
      this.taskId});

  @override
  Widget build(BuildContext context) {
    final missionId = selectedMissionId;
    if (missionId != null && targetDetailTab == 1) {
      return _MissionBoundTarget(
        missionId: missionId,
        builder: (mission) => MissionDocumentsTab(
          missionId: missionId,
          mission: mission,
          roleMode: roleMode,
          permissions: permissions,
          taskId: taskId,
          initialSubTab: targetSubTab == 1 ? 3 : targetSubTab == 2 ? 4 : 2,
        ),
      );
    }
    if (missionId != null && targetDetailTab == 2) {
      return const UploadFactoryCenter();
    }
    if (missionId != null && targetDetailTab == 3) {
      return MissionPublishReadinessPanel(missionId: missionId);
    }
    return MissionControlCenter(
      onMissionSelected: (missionId) {
        selectedMissionId = missionId;
        targetDetailTab = 0;
        targetSubTab = 0;
      },
    );
  }
}

class _MissionBoundTarget extends StatelessWidget {
  const _MissionBoundTarget({required this.missionId, required this.builder});

  final String missionId;
  final Widget Function(Map<String, dynamic>) builder;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<DocumentSnapshot<Map<String, dynamic>>>>(
      future: Future.wait([
        FirebaseFirestore.instance.collection('student_mission_catalog').doc(missionId).get(),
        FirebaseFirestore.instance.collection('recruitments').doc(missionId).get(),
        FirebaseFirestore.instance.collection('mission_realms').doc(missionId).get(),
      ]),
      builder: (context, snapshot) {
        if (snapshot.hasError) return Center(child: Text('Mission context unavailable: ${snapshot.error}'));
        if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
        final mission = <String, dynamic>{};
        for (final doc in snapshot.data!) {
          if (doc.exists) mission.addAll(doc.data() ?? const {});
        }
        if (mission.isEmpty) return Center(child: Text('No canonical mission data found for $missionId.'));
        return builder(mission);
      },
    );
  }
}
