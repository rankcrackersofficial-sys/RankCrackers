import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:crypto/crypto.dart';
import 'package:file_picker/file_picker.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:rank_crackers/web/shared/rc_colors.dart';
import 'package:rank_crackers/web/shared/rc_panel.dart';
import 'package:rank_crackers/web/shared/rc_layout.dart';
import 'package:rank_crackers/web/shared/rc_loaders.dart';
import 'package:rank_crackers/web/shared/rc_file_helpers.dart';

import 'package:rank_crackers/core/admin/admin_permission_resolver.dart';
import '../founder/mission_control/mission_control_room.dart';
import '../founder/mission_control/mission_publish_readiness_panel.dart';
import '../founder/study_master/study_master_library_web.dart';
import '../founder/ingestion/ingestion_review_web.dart';
import '../founder/intelligence/intelligence_room_web.dart';
import '../founder/activity/recent_activity_web.dart';
import '../founder/system/founder_system_operations_web.dart';
import '../founder/health/founder_student_health_web.dart';
import '../founder/revenue/revenue_subscription_control_web.dart';
import '../founder/access/access_security_web.dart';
import '../../features/admin/presentation/widgets/review_queue/admin_tasks_list.dart';
import '../admin/admin_my_access_panel.dart';

import '../founder/fdc/document_command_center.dart';

enum ConsoleRoleMode {
  founder,
  admin,
}

class UnifiedCommandConsole extends StatefulWidget {
  final ConsoleRoleMode roleMode;
  final Map<String, dynamic> permissions;
  final Map<String, dynamic> userDoc;
  final String? initialTaskId;
  final WidgetBuilder? founderDeliveryPreviewBuilder;

  const UnifiedCommandConsole({
    super.key,
    required this.roleMode,
    required this.permissions,
    required this.userDoc,
    this.initialTaskId,
    this.founderDeliveryPreviewBuilder,
  });

  @override
  State<UnifiedCommandConsole> createState() => _UnifiedCommandConsoleState();
}

class _UnifiedCommandConsoleState extends State<UnifiedCommandConsole> {
  int _subTab = 0;
  int _ingestionTab = 0; // 0: Review Board, 1: Unified Registry
  String? _activeTaskId;

  @override
  void initState() {
    super.initState();
    _activeTaskId = widget.initialTaskId;
    // For admin, landing should be Work Queue (index 0 in filtered list)
  }

  @override
  Widget build(BuildContext context) {
    final modules = _getFilteredModules();
    if (_subTab >= modules.length) _subTab = 0;

    final currentModule = modules[_subTab];
    final currentGroup = currentModule.group;
    final groupedModules =
        modules.where((module) => module.group == currentGroup).toList();

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(102),
        child: Container(
          decoration: const BoxDecoration(
            color: Color(0xFF050A10),
            border: Border(bottom: BorderSide(color: rcLine)),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(
                height: 42,
                child: Row(
                  children: [
                    Expanded(
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: _moduleGroups
                              .map((group) =>
                                  _groupButton(group, currentGroup, modules))
                              .toList(),
                        ),
                      ),
                    ),
                    if (MediaQuery.sizeOf(context).width >= 1180) ...[
                      const SizedBox(width: 16),
                      _buildIdentityHeader(),
                    ],
                  ],
                ),
              ),
              SizedBox(
                height: 54,
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: groupedModules
                        .map((module) => _subTabButton(
                            module.label, modules.indexOf(module)))
                        .toList(),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      body: IndexedStack(
        index: _subTab,
        children: modules.map((m) => m.builder(context)).toList(),
      ),
    );
  }

  List<_ConsoleModule> _getFilteredModules() {
    final isFounder = widget.roleMode == ConsoleRoleMode.founder;
    final perms = widget.permissions;
    final List<_ConsoleModule> list = [];

    if (isFounder) {
      list.add(_ConsoleModule(
          group: 'MISSION & DELIVERY',
          label: 'Mission Control',
          builder: (_) =>
              const MissionControlRoom(roleMode: ConsoleRoleMode.founder)));
      if (widget.founderDeliveryPreviewBuilder != null) {
        list.add(_ConsoleModule(
            group: 'MISSION & DELIVERY',
            label: 'Mission Delivery Preview',
            builder: widget.founderDeliveryPreviewBuilder!));
      }
      list.add(_ConsoleModule(
          group: 'CONTENT PIPELINE',
          label: 'Document Command Center',
          builder: (_) => const DocumentCommandCenter()));
      list.add(_ConsoleModule(
          group: 'CONTENT PIPELINE',
          label: 'Verification Center',
          builder: (_) => _buildVerificationCenterLanding()));
      list.add(_ConsoleModule(
          group: 'CONTENT PIPELINE',
          label: 'Factory Hub',
          builder: (_) => _buildFactoryHubLanding()));
      list.add(_ConsoleModule(
          group: 'CONTENT PIPELINE',
          label: 'Publish Gate',
          builder: (_) => _buildPublishGateLanding()));
      list.add(_ConsoleModule(
          group: 'STUDENT & HEALTH',
          label: 'Student Delivery Health',
          builder: (_) => const FounderStudentHealthWeb()));
      list.add(_ConsoleModule(
          group: 'SYSTEM & GOVERNANCE',
          label: 'Admin Governance',
          builder: (_) => const AccessSecurityWeb()));
      list.add(_ConsoleModule(
          group: 'SYSTEM & GOVERNANCE',
          label: 'System Ops / Dev Mode',
          builder: (_) => const FounderSystemOperationsWeb()));
    } else {
      // Admin Mode - Dynamic filtering using central resolver
      list.add(_ConsoleModule(
          label: 'My Work Queue',
          builder: (_) => AdminTasksList(
                onOpenTask: (taskId, taskType, missionId) {
                  setState(() {
                    _activeTaskId = taskId;
                    // Map taskType to subTab
                    if (taskType == 'DOCUMENT_REVIEW' ||
                        taskType == 'OCR_REPROCESS_REVIEW') {
                      _subTab = _findModuleIndex('Document Command Center');
                    } else if (taskType.contains('MISSION') ||
                        taskType.contains('SYLLABUS') ||
                        taskType.contains('PYQ') ||
                        taskType.contains('CRUCIBLE') ||
                        taskType.contains('BLUEPRINT')) {
                      _subTab = _findModuleIndex('Mission Control');
                    }
                  });
                },
              )));

      if (AdminPermissionResolver.canSeeMissionControl(perms)) {
        list.add(_ConsoleModule(
          label: 'Mission Control Room',
          builder: (_) => MissionControlRoom(
              roleMode: ConsoleRoleMode.admin,
              permissions: perms,
              taskId: _activeTaskId),
        ));
      }
      if (AdminPermissionResolver.canSeeStudyMaster(perms)) {
        list.add(_ConsoleModule(
          label: 'Study Master Library',
          builder: (_) =>
              const StudyMasterLibraryWeb(roleMode: ConsoleRoleMode.admin),
        ));
      }
      if (AdminPermissionResolver.canSeeIngestion(perms)) {
        list.add(_ConsoleModule(
          label: 'Document Command Center',
          builder: (_) =>
              const DocumentCommandCenter(roleMode: ConsoleRoleMode.admin),
        ));
      }
      if (AdminPermissionResolver.canSeeIntelligenceRoom(perms)) {
        list.add(_ConsoleModule(
          label: 'Intelligence Room',
          builder: (_) =>
              const IntelligenceRoomWeb(roleMode: ConsoleRoleMode.admin),
        ));
      }
      if (AdminPermissionResolver.canSeeRecentActivity(perms)) {
        list.add(_ConsoleModule(
          label: 'Recent Activity Log',
          builder: (_) =>
              const RecentActivityWeb(roleMode: ConsoleRoleMode.admin),
        ));
      }

      list.add(_ConsoleModule(
          label: 'My Access',
          builder: (_) => AdminMyAccessPanel(
            permissions: perms,
            userDoc: widget.userDoc,
          )));
    }

    return list;
  }

  Widget _buildIdentityHeader() {
    final isFounder = widget.roleMode == ConsoleRoleMode.founder;
    final name = widget.userDoc['name'] ??
        widget.userDoc['displayName'] ??
        'Administrator';
    final designation = widget.userDoc['designation'] ??
        (isFounder ? 'Founder & CEO' : 'Administrator');

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
          stream: FirebaseFirestore.instance
              .collection('system_health_pings')
              .doc('heartbeat')
              .snapshots(),
          builder: (context, snapshot) {
            final hasData = snapshot.hasData && (snapshot.data?.exists ?? false);
            final statusColor = hasData ? rcGreen : const Color(0xFFE5A93C);
            final statusLabel = hasData ? 'SYSTEM MONITORED' : 'SYSTEM STANDBY';
            return Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: statusColor,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(color: statusColor, blurRadius: 4, spreadRadius: 1),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  statusLabel,
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            );
          },
        ),
        const SizedBox(width: 20),
        const VerticalDivider(
            width: 1, color: rcLine, indent: 16, endIndent: 16),
        const SizedBox(width: 20),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              name.toString().toUpperCase(),
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.bold),
            ),
            Text(
              designation.toString(),
              style: TextStyle(
                  color: rcGold, fontSize: 10, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ],
    );
  }

  int _findModuleIndex(String label) {
    final modules = _getFilteredModules();
    for (int i = 0; i < modules.length; i++) {
      if (modules[i].label == label) return i;
    }
    return 0;
  }

  Widget _buildVerificationCenterLanding() {
    return _PremiumLandingPage(
      title: 'VERIFICATION CENTER',
      subtitle: 'Audit and verify academic data before Crucible linkage.',
      items: [
        _LandingItem(
          title: 'Syllabus Verification',
          subtitle: 'Verify extracted topics and hierarchy.',
          icon: Icons.fact_check_rounded,
          onTap: () {
            if (MissionControlRoom.selectedMissionId == null) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                    content:
                        Text('Open a mission from Mission Control first.')),
              );
            } else {
              setState(() {
                MissionControlRoom.targetDetailTab =
                    1; // Verification Center sub-hub
                MissionControlRoom.targetSubTab =
                    1; // Syllabus Review (Direct) sub-tab
                _subTab = _findModuleIndex('Mission Control');
              });
            }
          },
        ),
        _LandingItem(
          title: 'PYQ Verification',
          subtitle: 'Audit LaTeX, answers, and atom mapping.',
          icon: Icons.quiz_rounded,
          onTap: () {
            if (MissionControlRoom.selectedMissionId == null) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                    content:
                        Text('Open a mission from Mission Control first.')),
              );
            } else {
              setState(() {
                MissionControlRoom.targetDetailTab =
                    1; // Verification Center sub-hub
                MissionControlRoom.targetSubTab =
                    2; // PYQ Review (Direct) sub-tab
                _subTab = _findModuleIndex('Mission Control');
              });
            }
          },
        ),
        _LandingItem(
          title: 'Exam Rule Verification',
          subtitle: 'Verify extracted notification facts.',
          icon: Icons.gavel_rounded,
          onTap: () {
            if (MissionControlRoom.selectedMissionId == null) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                    content:
                        Text('Open a mission from Mission Control first.')),
              );
            } else {
              setState(() {
                MissionControlRoom.targetDetailTab =
                    1; // Verification Center sub-hub
                MissionControlRoom.targetSubTab =
                    0; // AI Proposals / Review sub-tab
                _subTab = _findModuleIndex('Mission Control');
              });
            }
          },
        ),
      ],
    );
  }

  Widget _buildFactoryHubLanding() {
    return _PremiumLandingPage(
      title: 'FACTORY HUB',
      subtitle: 'Manage scheduling and pre-generated content drafting.',
      items: [
        _LandingItem(
          title: 'Crucible Planner',
          subtitle: '98-Day mission schedule generation.',
          icon: Icons.calendar_month_rounded,
          onTap: () {
            if (MissionControlRoom.selectedMissionId == null) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                    content:
                        Text('Open a mission from Mission Control first.')),
              );
            } else {
              setState(() {
                MissionControlRoom.targetDetailTab = 2; // Factory Hub sub-hub
                MissionControlRoom.targetSubTab =
                    0; // Crucible Plan Review sub-tab
                _subTab = _findModuleIndex('Mission Control');
              });
            }
          },
        ),
        _LandingItem(
          title: 'DigiBook Builder',
          subtitle: 'Pre-generated mentor-style unit review.',
          icon: Icons.menu_book_rounded,
          onTap: () {
            if (MissionControlRoom.selectedMissionId == null) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                    content:
                        Text('Open a mission from Mission Control first.')),
              );
            } else {
              setState(() {
                MissionControlRoom.targetDetailTab = 2; // Factory Hub sub-hub
                MissionControlRoom.targetSubTab = 1; // DigiBook Review sub-tab
                _subTab = _findModuleIndex('Mission Control');
              });
            }
          },
        ),
      ],
    );
  }

  Widget _buildPublishGateLanding() {
    final missionId = MissionControlRoom.selectedMissionId;
    if (missionId != null && missionId.isNotEmpty) {
      return MissionPublishReadinessPanel(missionId: missionId);
    }
    return _PremiumLandingPage(
      title: 'PUBLISH GATE',
      subtitle:
          'Select a mission in Mission Control to review its release readiness and governed publication actions.',
      items: [
        _LandingItem(
          title: 'Student Visibility Gate',
          subtitle: 'Toggle mission live/draft status.',
          icon: Icons.vignette_rounded,
          onTap: () {
            if (MissionControlRoom.selectedMissionId == null) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                    content:
                        Text('Open a mission from Mission Control first.')),
              );
            } else {
              setState(() {
                MissionControlRoom.targetDetailTab = 3; // Publish Gate sub-hub
                MissionControlRoom.targetSubTab = 0;
                _subTab = _findModuleIndex('Mission Control');
              });
            }
          },
        ),
        _LandingItem(
          title: 'Archive / Rollback',
          subtitle: 'Manage mission lifecycle safety.',
          icon: Icons.history_rounded,
          onTap: () {
            if (MissionControlRoom.selectedMissionId == null) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                    content:
                        Text('Open a mission from Mission Control first.')),
              );
            } else {
              setState(() {
                MissionControlRoom.targetDetailTab = 3; // Publish Gate sub-hub
                MissionControlRoom.targetSubTab = 0;
                _subTab = _findModuleIndex('Mission Control');
              });
            }
          },
        ),
      ],
    );
  }

  Widget _groupButton(
      String group, String activeGroup, List<_ConsoleModule> modules) {
    final active = group == activeGroup;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: TextButton(
        onPressed: () {
          final index = modules.indexWhere((module) => module.group == group);
          if (index >= 0) setState(() => _subTab = index);
        },
        style: TextButton.styleFrom(
          foregroundColor: active ? rcGold : Colors.white54,
          backgroundColor:
              active ? rcGold.withValues(alpha: 0.08) : Colors.transparent,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
        ),
        child: Text(group,
            style: TextStyle(
              fontSize: 9,
              letterSpacing: 0.7,
              fontWeight: active ? FontWeight.w800 : FontWeight.w600,
            )),
      ),
    );
  }

  Widget _subTabButton(String label, int index) {
    final active = _subTab == index;
    return InkWell(
      onTap: () => setState(() => _subTab = index),
      child: Container(
        constraints: const BoxConstraints(minHeight: 48),
        alignment: Alignment.center,
        padding: const EdgeInsets.fromLTRB(24, 11, 24, 10),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: active ? rcGold : Colors.transparent,
              width: 3,
            ),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: active ? rcGold : Colors.white60,
            fontWeight: active ? FontWeight.w800 : FontWeight.normal,
            height: 1.2,
          ),
        ),
      ),
    );
  }
}

class _ConsoleModule {
  final String group;
  final String label;
  final WidgetBuilder builder;
  _ConsoleModule(
      {this.group = 'OPERATIONS', required this.label, required this.builder});
}

const _moduleGroups = [
  'MISSION & DELIVERY',
  'CONTENT PIPELINE',
  'STUDENT & HEALTH',
  'SYSTEM & GOVERNANCE',
];

class _PremiumLandingPage extends StatelessWidget {
  final String title;
  final String subtitle;
  final List<_LandingItem> items;

  const _PremiumLandingPage({
    required this.title,
    required this.subtitle,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    return RcPagePad(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RcPageTitle(title: title, subtitle: subtitle),
          const SizedBox(height: 18),
          Expanded(
            child: LayoutBuilder(
              builder: (context, constraints) {
                return GridView.builder(
                  gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                    maxCrossAxisExtent: 360,
                    mainAxisExtent: 170,
                    crossAxisSpacing: 14,
                    mainAxisSpacing: 14,
                  ),
                  itemCount: items.length,
                  itemBuilder: (context, index) {
                    final item = items[index];
                    return RcPanel(
                      child: InkWell(
                        onTap: item.onTap,
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Icon(item.icon, color: rcGold, size: 24),
                              const Spacer(),
                              Text(item.title,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                  )),
                              const SizedBox(height: 4),
                              Text(item.subtitle,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: Colors.white54,
                                    fontSize: 11,
                                  )),
                              const SizedBox(height: 10),
                              const Row(children: [
                                Text('OPEN',
                                    style: TextStyle(
                                      color: rcGold,
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 1,
                                    )),
                                SizedBox(width: 4),
                                Icon(Icons.arrow_forward_rounded,
                                    color: rcGold, size: 12),
                              ]),
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
  }
}

class _LandingItem {
  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;

  _LandingItem({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
  });
}
