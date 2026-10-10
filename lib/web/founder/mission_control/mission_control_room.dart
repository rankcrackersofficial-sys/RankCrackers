import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:rank_crackers/features/admin/presentation/widgets/mission_control/mission_control_center.dart';
import 'package:rank_crackers/features/admin/presentation/widgets/upload_factory/upload_factory_center.dart';
import 'package:rank_crackers/web/founder/mission_control/mission_variable_authority_panel.dart';
import 'mission_documents_tab.dart';
import 'mission_publish_readiness_panel.dart';

import '../../shared/unified_command_console.dart';

typedef MissionListBuilderForTest = Widget Function(
  BuildContext context,
  ValueChanged<String> onMissionSelected,
);
typedef MissionDetailBuilderForTest = Widget Function(
  BuildContext context,
  String missionId,
  VoidCallback onBack,
  VoidCallback onOpenVariables,
);

class MissionControlRoom extends StatefulWidget {
  static String? selectedMissionId;
  static int targetDetailTab = 0;
  static int targetSubTab = 0;

  final ConsoleRoleMode roleMode;
  final Map<String, dynamic>? permissions;
  final String? taskId;
  final MissionListBuilderForTest? missionListBuilderForTest;
  final MissionDetailBuilderForTest? missionDetailBuilderForTest;
  const MissionControlRoom(
      {super.key,
      this.roleMode = ConsoleRoleMode.founder,
      this.permissions,
      this.taskId,
      this.missionListBuilderForTest,
      this.missionDetailBuilderForTest});

  @override
  State<MissionControlRoom> createState() => _MissionControlRoomState();
}

class _MissionControlRoomState extends State<MissionControlRoom> {
  String? _selectedMissionId;
  bool _showVariables = false;

  @override
  void initState() {
    super.initState();
    _selectedMissionId = MissionControlRoom.selectedMissionId;
  }

  @override
  Widget build(BuildContext context) {
    final missionId = _selectedMissionId;
    if (missionId != null && MissionControlRoom.targetDetailTab == 1) {
      return _MissionBoundTarget(
        missionId: missionId,
        builder: (mission) => MissionDocumentsTab(
          missionId: missionId,
          mission: mission,
          roleMode: widget.roleMode,
          permissions: widget.permissions,
          taskId: widget.taskId,
          initialSubTab: MissionControlRoom.targetSubTab == 1
              ? 3
              : MissionControlRoom.targetSubTab == 2
                  ? 4
                  : 2,
        ),
      );
    }
    if (missionId != null && MissionControlRoom.targetDetailTab == 2) {
      return const UploadFactoryCenter();
    }
    if (missionId != null && MissionControlRoom.targetDetailTab == 3) {
      return MissionPublishReadinessPanel(missionId: missionId);
    }
    if (missionId != null && _showVariables) {
      return Column(
        children: [
          _DetailHeader(
            title: 'MISSION VARIABLES',
            missionId: missionId,
            onBack: () => setState(() => _showVariables = false),
          ),
          Expanded(
              child:
                  MissionVariableAuthorityPanel(initialMissionId: missionId)),
        ],
      );
    }
    if (missionId != null) {
      return widget.missionDetailBuilderForTest?.call(
            context,
            missionId,
            _clearSelection,
            () => setState(() => _showVariables = true),
          ) ??
          _SelectedMissionDetail(
            missionId: missionId,
            onBack: _clearSelection,
            onOpenVariables: () => setState(() => _showVariables = true),
            onOpenDocuments: () => setState(() {
              MissionControlRoom.targetDetailTab = 1;
              MissionControlRoom.targetSubTab = 0;
            }),
          );
    }
    return widget.missionListBuilderForTest?.call(context, _selectMission) ??
        MissionControlCenter(onMissionSelected: _selectMission);
  }

  void _selectMission(String missionId) {
    setState(() {
      _selectedMissionId = missionId;
      MissionControlRoom.selectedMissionId = missionId;
      MissionControlRoom.targetDetailTab = 0;
      MissionControlRoom.targetSubTab = 0;
      _showVariables = false;
    });
  }

  void _clearSelection() {
    setState(() {
      _selectedMissionId = null;
      MissionControlRoom.selectedMissionId = null;
      MissionControlRoom.targetDetailTab = 0;
      MissionControlRoom.targetSubTab = 0;
      _showVariables = false;
    });
  }
}

class _SelectedMissionDetail extends StatelessWidget {
  const _SelectedMissionDetail({
    required this.missionId,
    required this.onBack,
    required this.onOpenVariables,
    required this.onOpenDocuments,
  });

  final String missionId;
  final VoidCallback onBack;
  final VoidCallback onOpenVariables;
  final VoidCallback onOpenDocuments;

  @override
  Widget build(BuildContext context) {
    final firestore = FirebaseFirestore.instance;
    return FutureBuilder<List<dynamic>>(
      future: Future.wait<dynamic>([
        firestore.collection('mission_realms').doc(missionId).get(),
        firestore.collection('recruitments').doc(missionId).get(),
        firestore.collection('student_mission_catalog').doc(missionId).get(),
        firestore
            .collection('mission_realms')
            .doc(missionId)
            .collection('official_documents')
            .get(),
      ]),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Center(
              child: Text('Mission detail unavailable: ${snapshot.error}'));
        }
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }
        final realm =
            snapshot.data![0] as DocumentSnapshot<Map<String, dynamic>>;
        final recruitment =
            snapshot.data![1] as DocumentSnapshot<Map<String, dynamic>>;
        final catalog =
            snapshot.data![2] as DocumentSnapshot<Map<String, dynamic>>;
        final documents =
            snapshot.data![3] as QuerySnapshot<Map<String, dynamic>>;
        final realmData = realm.data() ?? const <String, dynamic>{};
        final recruitmentData = recruitment.data() ?? const <String, dynamic>{};
        final catalogData = catalog.data() ?? const <String, dynamic>{};
        final name = (catalogData['displayName'] ??
                catalogData['title'] ??
                recruitmentData['title'] ??
                recruitmentData['recruitment_name'] ??
                realmData['exam_name'] ??
                realmData['recruitment_name'] ??
                missionId)
            .toString();
        final studentVisible = catalog.exists &&
            catalogData['cardVisible'] == true &&
            catalogData['userPanelVisible'] == true &&
            catalogData['archived'] != true;
        final status = (realmData['status'] ??
                catalogData['studentPublicationState'] ??
                recruitmentData['status'] ??
                'UNKNOWN')
            .toString()
            .toUpperCase();
        return ListView(
          padding: const EdgeInsets.all(24),
          children: [
            _DetailHeader(title: name, missionId: missionId, onBack: onBack),
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                _DetailFact(
                    'STUDENT VISIBILITY',
                    studentVisible ? 'STUDENT LIVE' : 'NOT LIVE FOR STUDENTS',
                    studentVisible),
                _DetailFact('LIFECYCLE', status, realm.exists),
                _DetailFact(
                    'MISSION AUTHORITY',
                    realm.exists ? 'COMPLETE' : 'REPAIR REQUIRED',
                    realm.exists),
                _DetailFact(
                    'SOURCE DOCUMENT',
                    documents.docs.isEmpty
                        ? 'NO SOURCE DOCUMENT'
                        : '${documents.size} CONNECTED',
                    documents.docs.isNotEmpty),
              ],
            ),
            if (!realm.exists) ...[
              const SizedBox(height: 16),
              const Card(
                child: ListTile(
                  leading: Icon(Icons.lock_outline, color: Colors.orangeAccent),
                  title: Text('MISSION ACTIONS LOCKED'),
                  subtitle: Text(
                      'Founder authority must be repaired before lifecycle or variable changes.'),
                ),
              ),
            ],
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(children: [
                  const Text('NEXT ACTION',
                      style: TextStyle(
                          fontSize: 9,
                          color: Colors.white54,
                          fontWeight: FontWeight.bold)),
                  const SizedBox(width: 14),
                  Expanded(
                      child: Text(
                    !realm.exists
                        ? 'REPAIR FOUNDER AUTHORITY'
                        : documents.docs.isEmpty
                            ? 'UPLOAD SOURCE DOCUMENT'
                            : 'REVIEW PUBLISH READINESS',
                    style: const TextStyle(
                        color: Color(0xFFE8C766), fontWeight: FontWeight.bold),
                  )),
                  Text(
                      documents.docs.isEmpty
                          ? 'SOURCE → INGESTION → VERIFICATION'
                          : 'SOURCE CONNECTED',
                      style:
                          const TextStyle(fontSize: 9, color: Colors.white38)),
                ]),
              ),
            ),
            const SizedBox(height: 14),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                FilledButton.icon(
                  onPressed: onOpenVariables,
                  icon: const Icon(Icons.tune),
                  label: const Text('MISSION VARIABLES'),
                ),
                OutlinedButton.icon(
                  onPressed: onOpenDocuments,
                  icon: const Icon(Icons.description_outlined),
                  label: const Text('DOCUMENT PIPELINE'),
                ),
                OutlinedButton.icon(
                  onPressed: realm.exists
                      ? () {
                          MissionControlRoom.targetDetailTab = 3;
                          (context as Element).markNeedsBuild();
                        }
                      : null,
                  icon: const Icon(Icons.publish_outlined),
                  label: const Text('PUBLISH READINESS'),
                ),
                OutlinedButton.icon(
                  onPressed: null,
                  icon: const Icon(Icons.archive_outlined),
                  label: Text(realm.exists
                      ? 'LIFECYCLE ACTIONS GOVERNED'
                      : 'LIFECYCLE DISABLED'),
                ),
              ],
            ),
          ],
        );
      },
    );
  }
}

class _DetailHeader extends StatelessWidget {
  const _DetailHeader(
      {required this.title, required this.missionId, required this.onBack});
  final String title;
  final String missionId;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) => Row(
        children: [
          IconButton(
              onPressed: onBack,
              tooltip: 'Back to Mission Control',
              icon: const Icon(Icons.arrow_back)),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: Theme.of(context).textTheme.headlineSmall),
                SelectableText(missionId,
                    style:
                        const TextStyle(color: Colors.white54, fontSize: 11)),
              ],
            ),
          ),
        ],
      );
}

class _DetailFact extends StatelessWidget {
  const _DetailFact(this.label, this.value, this.ok);
  final String label;
  final String value;
  final bool ok;

  @override
  Widget build(BuildContext context) => SizedBox(
        width: 260,
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: const TextStyle(
                        fontSize: 9,
                        color: Colors.white54,
                        fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text(value,
                    style: TextStyle(
                        color: ok ? Colors.greenAccent : Colors.orangeAccent,
                        fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ),
      );
}

class _MissionBoundTarget extends StatelessWidget {
  const _MissionBoundTarget({required this.missionId, required this.builder});

  final String missionId;
  final Widget Function(Map<String, dynamic>) builder;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<DocumentSnapshot<Map<String, dynamic>>>>(
      future: Future.wait([
        FirebaseFirestore.instance
            .collection('student_mission_catalog')
            .doc(missionId)
            .get(),
        FirebaseFirestore.instance
            .collection('recruitments')
            .doc(missionId)
            .get(),
        FirebaseFirestore.instance
            .collection('mission_realms')
            .doc(missionId)
            .get(),
      ]),
      builder: (context, snapshot) {
        if (snapshot.hasError)
          return Center(
              child: Text('Mission context unavailable: ${snapshot.error}'));
        if (!snapshot.hasData)
          return const Center(child: CircularProgressIndicator());
        final mission = <String, dynamic>{};
        for (final doc in snapshot.data!) {
          if (doc.exists) mission.addAll(doc.data() ?? const {});
        }
        if (mission.isEmpty)
          return Center(
              child: Text('No canonical mission data found for $missionId.'));
        return builder(mission);
      },
    );
  }
}
