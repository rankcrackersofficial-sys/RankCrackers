import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:rank_crackers/core/constants/official_mission_sources.dart';
import '../theme/founder_light_theme.dart';
import '../mission_control/mission_control_room.dart';
import '../mission_control/mission_documents_tab.dart';
import '../../shared/unified_command_console.dart';
import 'package:rank_crackers/features/admin/presentation/widgets/upload_center/widgets/mission_source_pair_form.dart';

typedef DocumentMissionPickerBuilderForTest = Widget Function(
    BuildContext context, ValueChanged<String> onSelected);
typedef DocumentWorkspaceBuilderForTest = Widget Function(
  BuildContext context,
  String missionId,
  VoidCallback onChangeMission,
);

class DocumentCommandCenter extends StatefulWidget {
  final ConsoleRoleMode roleMode;
  final DocumentMissionPickerBuilderForTest? missionPickerBuilderForTest;
  final DocumentWorkspaceBuilderForTest? workspaceBuilderForTest;
  const DocumentCommandCenter({
    super.key,
    this.roleMode = ConsoleRoleMode.founder,
    this.missionPickerBuilderForTest,
    this.workspaceBuilderForTest,
  });

  @override
  State<DocumentCommandCenter> createState() => _DocumentCommandCenterState();
}

class _DocumentCommandCenterState extends State<DocumentCommandCenter> {
  String? _missionId;

  @override
  void initState() {
    super.initState();
    _missionId = MissionControlRoom.selectedMissionId;
  }

  @override
  Widget build(BuildContext context) {
    final missionId = _missionId ?? MissionControlRoom.selectedMissionId;
    if (missionId == null) {
      return widget.missionPickerBuilderForTest?.call(
            context,
            _selectMission,
          ) ??
          _buildMissionSelection();
    }
    final testWorkspace = widget.workspaceBuilderForTest;
    if (testWorkspace != null)
      return testWorkspace(context, missionId, _clearMission);
    return StreamBuilder<List<DocumentSnapshot<Map<String, dynamic>>>>(
      stream: _missionSnapshots(missionId),
      builder: (context, snapshot) {
        if (snapshot.hasError)
          return _PermissionAwareError(
            error: snapshot.error,
            missionId: missionId,
          );
        if (!snapshot.hasData)
          return const Center(child: CircularProgressIndicator());
        final snapshots = snapshot.data!;
        final realm = snapshots.first;
        final mission = <String, dynamic>{};
        for (final doc in snapshots.reversed) {
          if (doc.exists) mission.addAll(doc.data() ?? const {});
        }
        if (mission.isEmpty)
          return _DocumentEmptyState(
            missionId: missionId,
            onBack: _clearMission,
          );
        return Column(
          children: [
            if (missionId == 'ssc_cgl')
              Padding(
                padding: EdgeInsets.fromLTRB(24, 16, 24, 0),
                child: MissionSourcePairForm(
                  initialMission: 'ssc_cgl',
                  initialCycle: '2026',
                  initialAuthority: 'auth_in_ssc',
                  initialNotificationUrl:
                      OfficialMissionSources.notificationUrl('ssc_cgl')!,
                  initialSyllabusUrl:
                      OfficialMissionSources.syllabusUrl('ssc_cgl')!,
                ),
              ),
            _DocumentWorkspaceSummary(
              missionId: missionId,
              mission: mission,
              realmPresent: realm.exists,
              onChangeMission: _clearMission,
            ),
            Expanded(
              child: MissionDocumentsTab(
                missionId: missionId,
                mission: mission,
                roleMode: widget.roleMode,
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildMissionSelection() => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'DOCUMENT COMMAND CENTER',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 6),
            const Text(
              'Select a mission to manage its official source documents.',
              style: TextStyle(color: FounderLightTheme.textMuted),
            ),
            const SizedBox(height: 20),
            const Text(
              'SELECT MISSION',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: Color(0xFFE8C766),
              ),
            ),
            const SizedBox(height: 10),
            Expanded(
              child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                stream: FirebaseFirestore.instance
                    .collection('mission_realms')
                    .snapshots(),
                builder: (context, snapshot) {
                  if (snapshot.hasError)
                    return _PermissionAwareError(
                      error: snapshot.error,
                      missionId: null,
                    );
                  if (!snapshot.hasData)
                    return const Center(child: CircularProgressIndicator());
                  final docs = snapshot.data!.docs;
                  if (docs.isEmpty)
                    return const Center(
                      child: Text(
                        'No missions are available in the canonical inventory.',
                      ),
                    );
                  return GridView.builder(
                    gridDelegate:
                        const SliverGridDelegateWithMaxCrossAxisExtent(
                      maxCrossAxisExtent: 360,
                      mainAxisExtent: 116,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                    ),
                    itemCount: docs.length,
                    itemBuilder: (context, index) {
                      final doc = docs[index];
                      final data = doc.data();
                      final title = (data['displayName'] ??
                              data['title'] ??
                              data['name'] ??
                              doc.id)
                          .toString();
                      final live = data['cardVisible'] == true &&
                          data['userPanelVisible'] == true &&
                          data['archived'] != true;
                      return Card(
                        child: InkWell(
                          onTap: () => _selectMission(doc.id),
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  title,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const Spacer(),
                                Text(
                                  live ? 'LIVE FOR STUDENTS' : 'FOUNDER DRAFT',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: live
                                        ? Colors.greenAccent
                                        : Colors.orangeAccent,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                const Text(
                                  'Open source-document workspace →',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: FounderLightTheme.textMuted,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      );

  void _selectMission(String id) => setState(() {
        _missionId = id;
        MissionControlRoom.selectedMissionId = id;
      });
  void _clearMission() => setState(() {
        _missionId = null;
        MissionControlRoom.selectedMissionId = null;
      });

  Stream<List<DocumentSnapshot<Map<String, dynamic>>>> _missionSnapshots(
    String missionId,
  ) {
    final firestore = FirebaseFirestore.instance;
    return firestore
        .collection('mission_realms')
        .doc(missionId)
        .snapshots()
        .map((realm) => [realm]);
  }
}

class _DocumentWorkspaceSummary extends StatelessWidget {
  const _DocumentWorkspaceSummary({
    required this.missionId,
    required this.mission,
    required this.realmPresent,
    required this.onChangeMission,
  });
  final String missionId;
  final Map<String, dynamic> mission;
  final bool realmPresent;
  final VoidCallback onChangeMission;

  @override
  Widget build(BuildContext context) {
    final title = (mission['displayName'] ??
            mission['title'] ??
            mission['recruitment_name'] ??
            missionId)
        .toString();
    final live = mission['cardVisible'] == true &&
        mission['userPanelVisible'] == true &&
        mission['archived'] != true;
    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance
          .collection('mission_realms')
          .doc(missionId)
          .collection('official_documents')
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.hasError)
          return _PermissionAwareError(
            error: snapshot.error,
            missionId: missionId,
          );
        final docs = snapshot.data?.docs ?? const [];
        final source = docs.isEmpty ? null : docs.last;
        if (source == null) return _summary(context, title, live, null, null);
        return StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
          stream: FirebaseFirestore.instance
              .collection('ingestion_refinery')
              .doc(source.id)
              .snapshots(),
          builder: (context, refinery) =>
              _summary(context, title, live, source, refinery.data?.data()),
        );
      },
    );
  }

  Widget _summary(
    BuildContext context,
    String title,
    bool live,
    QueryDocumentSnapshot<Map<String, dynamic>>? source,
    Map<String, dynamic>? refinery,
  ) {
    final data = source?.data() ?? const <String, dynamic>{};
    final ingestionRaw = (refinery?['status'] ??
            data['ingestionStatus'] ??
            data['aiQueueStatus'] ??
            (source == null ? 'NOT_STARTED' : 'PENDING'))
        .toString()
        .toUpperCase();
    final reviewRaw =
        (data['reviewStatus'] ?? 'PENDING').toString().toUpperCase();
    final failed =
        ingestionRaw.contains('FAIL') || reviewRaw.contains('REJECT');
    final verified = reviewRaw == 'VERIFIED' || reviewRaw == 'APPROVED';
    final nextAction = source == null
        ? 'START AUTOMATED SOURCE ACQUISITION'
        : failed
            ? 'REVIEW EXTRACTION FAILURE'
            : !verified
                ? (ingestionRaw.contains('COMPLETE')
                    ? 'OPEN VERIFICATION CENTER'
                    : 'WAITING FOR INGESTION')
                : 'READY FOR FACTORY';
    final fileName =
        (data['originalFileName'] ?? data['fileName'] ?? 'NOT PROVIDED')
            .toString();
    final hash = (refinery?['fileHash'] ??
            data['sourceSha256'] ??
            (source?.id.startsWith('hash_') == true
                ? source!.id.substring(5)
                : 'NOT PROVIDED'))
        .toString();
    return Container(
      margin: const EdgeInsets.fromLTRB(18, 12, 18, 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: FounderLightTheme.surface,
        border: Border.all(color: FounderLightTheme.border),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.description_outlined, color: Color(0xFFE8C766)),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'DOCUMENT COMMAND CENTER',
                      style: TextStyle(
                        fontSize: 9,
                        color: FounderLightTheme.textMuted,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(title, style: Theme.of(context).textTheme.titleMedium),
                    Text(
                      missionId,
                      style: const TextStyle(
                        fontSize: 10,
                        color: FounderLightTheme.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              OutlinedButton.icon(
                onPressed: onChangeMission,
                icon: const Icon(Icons.swap_horiz, size: 16),
                label: const Text('CHANGE MISSION'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 10,
            runSpacing: 8,
            children: [
              _fact(
                'STUDENT',
                live ? 'LIVE FOR STUDENTS' : 'FOUNDER DRAFT',
                live,
              ),
              _fact(
                'MISSION AUTHORITY',
                realmPresent ? 'COMPLETE' : 'AUTHORITY REPAIR REQUIRED',
                realmPresent,
              ),
              _fact(
                'SOURCE DOCUMENT',
                source == null ? 'NO SOURCE DOCUMENT' : 'SOURCE CONNECTED',
                source != null,
              ),
              _fact('INGESTION', _friendly(ingestionRaw), !failed),
              _fact('VERIFICATION', _friendly(reviewRaw), verified),
            ],
          ),
          const SizedBox(height: 10),
          if (source == null)
            const Text(
              'No verified source is connected yet. The server will acquire and verify the official pair automatically.',
              style:
                  TextStyle(color: FounderLightTheme.textMuted, fontSize: 11),
            )
          else
            Text(
              '$fileName  •  SHA-256 ${hash == 'NOT PROVIDED' ? hash : '${hash.substring(0, hash.length > 16 ? 16 : hash.length)}…'}',
              style: const TextStyle(
                  color: FounderLightTheme.textSecondary, fontSize: 11),
            ),
          const SizedBox(height: 9),
          Row(
            children: [
              const Text(
                'NEXT ACTION  ',
                style: TextStyle(
                  fontSize: 9,
                  color: FounderLightTheme.textMuted,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                nextAction,
                style: const TextStyle(
                  color: Color(0xFFE8C766),
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              const Text(
                'SOURCE → INGESTION → VERIFICATION → FACTORY → PUBLISH READINESS',
                style: TextStyle(
                    fontSize: 9, color: FounderLightTheme.textDisabled),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _fact(String label, String value, bool ok) => Container(
        width: 190,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
        decoration: BoxDecoration(
          color: FounderLightTheme.surfaceAlt,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 8,
                color: FounderLightTheme.textDisabled,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: ok ? Colors.greenAccent : Colors.orangeAccent,
              ),
            ),
          ],
        ),
      );

  String _friendly(String value) => value.replaceAll('_', ' ');
}

class _PermissionAwareError extends StatelessWidget {
  const _PermissionAwareError({required this.error, required this.missionId});
  final Object? error;
  final String? missionId;
  @override
  Widget build(BuildContext context) {
    final denied = error.toString().toLowerCase().contains('permission-denied');
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Text(
          denied
              ? 'FOUNDER PERMISSION REQUIRED\nAccess to the canonical mission document path was denied. Mission: ${missionId ?? 'inventory'}.'
              : 'Document workspace unavailable: $error',
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}

class _DocumentEmptyState extends StatelessWidget {
  const _DocumentEmptyState({required this.missionId, required this.onBack});
  final String missionId;
  final VoidCallback onBack;
  @override
  Widget build(BuildContext context) => Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 560),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.description_outlined,
                    size: 34,
                    color: Color(0xFFE8C766),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'NO SOURCE DOCUMENT',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'No verified source is connected to $missionId yet. Start the automated source pair acquisition from the command center.',
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  OutlinedButton(
                    onPressed: onBack,
                    child: const Text('SELECT ANOTHER MISSION'),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
}
