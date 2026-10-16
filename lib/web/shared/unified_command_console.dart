import 'dart:math';
import 'package:flutter/material.dart';
import 'package:rank_crackers/core/admin/admin_permission_resolver.dart';
import 'package:rank_crackers/web/founder/theme/founder_light_theme.dart';

import '../founder/access/access_security_web.dart';
import '../founder/activity/recent_activity_web.dart';
import '../founder/fdc/document_command_center.dart';
import '../founder/health/founder_student_health_web.dart';
import '../founder/home/founder_operations_overview_web.dart';
import '../founder/intelligence/intelligence_room_web.dart';
import '../founder/mission_control/mission_control_room.dart';
import '../founder/mission_control/mission_publish_readiness_panel.dart';
import '../founder/study_master/study_master_library_web.dart';
import '../founder/system/founder_system_operations_web.dart';
import '../founder/revenue/revenue_subscription_control_web.dart';
import '../founder/watch/mission_watch_web.dart';
import '../../features/admin/presentation/widgets/review_queue/admin_tasks_list.dart';
import '../admin/admin_my_access_panel.dart';

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
  String? _activeTaskId;

  @override
  void initState() {
    super.initState();
    _activeTaskId = widget.initialTaskId;
  }

  @override
  Widget build(BuildContext context) {
    final modules = _getFilteredModules();
    if (_subTab >= modules.length) _subTab = 0;

    final currentModule = modules[_subTab];
    final double screenWidth = MediaQuery.of(context).size.width;

    final bool showLeftSidebar = screenWidth >= 900;

    return Scaffold(
      backgroundColor: FounderLightTheme.bg,
      drawer:
          !showLeftSidebar ? Drawer(child: _buildLeftSidebar(modules)) : null,
      body: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // LEFT NAVIGATION SIDEBAR
          if (showLeftSidebar)
            SizedBox(
              width: 240,
              child: _buildLeftSidebar(modules),
            ),

          // MAIN WORKSPACE AREA
          Expanded(
            child: Column(
              children: [
                // TOP OPERATIONAL HEADER BAR
                _buildTopOperationalHeader(
                    context, currentModule, showLeftSidebar),

                // ACTIVE MODULE CONTENT WORKSPACE
                Expanded(
                  child: IndexedStack(
                    index: _subTab,
                    children: modules.map((m) => m.builder(context)).toList(),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // LEFT NAVIGATION SIDEBAR
  // ===========================================================================
  Widget _buildLeftSidebar(List<_ConsoleModule> modules) {
    return Container(
      decoration: const BoxDecoration(
        color: FounderLightTheme.surface,
        border: Border(right: BorderSide(color: FounderLightTheme.border)),
      ),
      child: Column(
        children: [
          // Top Branding Box
          Container(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
            decoration: const BoxDecoration(
              border:
                  Border(bottom: BorderSide(color: FounderLightTheme.border)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: FounderLightTheme.primaryDark,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.auto_awesome_rounded,
                    color: FounderLightTheme.gold,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'RankCrackers',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: FounderLightTheme.textPrimary,
                          letterSpacing: -0.5,
                        ),
                      ),
                      Text(
                        'Build Today, A Better Tomorrow',
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w500,
                          color: FounderLightTheme.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Grouped Navigation Links List
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
              children: [
                _buildNavGroupHeader('OPERATIONS'),
                _buildNavItem(modules, 'Operations Overview', Icons.space_dashboard_outlined),
                _buildNavItem(
                    modules, 'Mission Control', Icons.explore_outlined),
                if (widget.founderDeliveryPreviewBuilder != null)
                  _buildNavItem(modules, 'Mission Delivery Preview',
                      Icons.visibility_outlined),
                const SizedBox(height: 16),
                _buildNavGroupHeader('CONTENT PIPELINE'),
                _buildNavItem(modules, 'Document Command Center',
                    Icons.description_outlined),
                _buildNavItem(modules, 'Verification Center',
                    Icons.verified_user_outlined),
                _buildNavItem(
                    modules, 'Factory Hub', Icons.settings_suggest_outlined),
                _buildNavItem(modules, 'Publish Gate', Icons.publish_outlined),
                const SizedBox(height: 16),
                _buildNavGroupHeader('STUDENT & SYSTEM'),
                _buildNavItem(modules, 'Student Delivery Health',
                    Icons.visibility_outlined),
                _buildNavItem(modules, 'Revenue & Subscriptions',
                    Icons.payments_outlined),
                _buildNavItem(
                    modules, 'Admin Governance', Icons.people_outline_rounded),
                _buildNavItem(
                    modules, 'System Ops / Dev Mode', Icons.computer_outlined),
                if (widget.roleMode == ConsoleRoleMode.founder) ...[
                  const SizedBox(height: 16),
                  _buildNavGroupHeader('ADMIN & AI OPERATIONS'),
                  _buildNavItem(modules, 'Admin Work Queue', Icons.assignment_outlined),
                  _buildNavItem(modules, 'Study Master Library', Icons.menu_book_outlined),
                  _buildNavItem(modules, 'Intelligence Room', Icons.lightbulb_outline_rounded),
                  _buildNavItem(modules, 'Recent Activity Log', Icons.history_rounded),
                  _buildNavItem(modules, 'My Access', Icons.shield_outlined),
                ],
                if (widget.roleMode == ConsoleRoleMode.admin) ...[
                  const SizedBox(height: 16),
                  _buildNavGroupHeader('ADMIN WORK'),
                  _buildNavItem(
                      modules, 'My Work Queue', Icons.assignment_outlined),
                  _buildNavItem(
                      modules, 'Mission Control Room', Icons.explore_outlined),
                  _buildNavItem(modules, 'Study Master Library',
                      Icons.menu_book_outlined),
                  _buildNavItem(modules, 'Intelligence Room',
                      Icons.lightbulb_outline_rounded),
                  _buildNavItem(
                      modules, 'Recent Activity Log', Icons.history_rounded),
                  _buildNavItem(modules, 'My Access', Icons.shield_outlined),
                ],
              ],
            ),
          ),

          // Bottom Branding Panel
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              border: Border(top: BorderSide(color: FounderLightTheme.border)),
            ),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: FounderLightTheme.surfaceAlt,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: FounderLightTheme.border),
              ),
              child: const Row(
                children: [
                  Icon(Icons.shield_outlined,
                      size: 18, color: FounderLightTheme.gold),
                  SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Founder Panel v2.0',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: FounderLightTheme.primaryDark,
                          ),
                        ),
                        Text(
                          'Build · Govern · Grow 🇮🇳',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w600,
                            color: FounderLightTheme.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavGroupHeader(String label) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 6),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.w800,
          color: FounderLightTheme.textMuted,
          letterSpacing: 1.0,
        ),
      ),
    );
  }

  Widget _buildNavItem(
    List<_ConsoleModule> modules,
    String label,
    IconData icon,
  ) {
    final int index = modules.indexWhere((m) => m.label == label);
    if (index < 0) return const SizedBox.shrink();

    final bool isSelected = _subTab == index;

    return Container(
      margin: const EdgeInsets.only(bottom: 2),
      child: InkWell(
        onTap: () {
          setState(() {
            _subTab = index;
          });
        },
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color:
                isSelected ? FounderLightTheme.primaryDark : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            children: [
              Icon(
                icon,
                size: 18,
                color: isSelected
                    ? FounderLightTheme.surface
                    : FounderLightTheme.textSecondary,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                    color: isSelected
                        ? FounderLightTheme.surface
                        : FounderLightTheme.textPrimary,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ===========================================================================
  // TOP OPERATIONAL HEADER BAR
  // ===========================================================================
  Widget _buildTopOperationalHeader(
    BuildContext context,
    _ConsoleModule currentModule,
    bool showLeftSidebar,
  ) {
    final isFounder = widget.roleMode == ConsoleRoleMode.founder;
    final String name = (widget.userDoc['name'] ??
            widget.userDoc['displayName'] ??
            widget.userDoc['email'] ??
            (isFounder ? 'Founder' : 'Administrator'))
        .toString();
    final String designation = (widget.userDoc['designation'] ??
            (isFounder ? 'Founder' : 'Administrator'))
        .toString();

    return Container(
      height: 64,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      decoration: const BoxDecoration(
        color: FounderLightTheme.surface,
        border: Border(bottom: BorderSide(color: FounderLightTheme.border)),
      ),
      child: Row(
        children: [
          if (!showLeftSidebar)
            IconButton(
              icon: const Icon(Icons.menu_rounded,
                  color: FounderLightTheme.primaryDark),
              onPressed: () => Scaffold.of(context).openDrawer(),
              tooltip: 'Open navigation',
            ),

          // Operational Module Breadcrumb
          Row(
            children: [
              const Text(
                'FOUNDER OPERATIONS CONSOLE',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: FounderLightTheme.textMuted,
                  letterSpacing: 0.8,
                ),
              ),
              const SizedBox(width: 8),
              const Text(
                '·',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: FounderLightTheme.textMuted,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                currentModule.label.toUpperCase(),
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: FounderLightTheme.primaryDark,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),

          const Spacer(),

          // Governed Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: FounderLightTheme.surfaceAlt,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: FounderLightTheme.border),
            ),
            child: const Text(
              'GOVERNED CONSOLE',
              style: TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.w800,
                color: FounderLightTheme.textMuted,
                letterSpacing: 0.5,
              ),
            ),
          ),

          const SizedBox(width: 16),
          const VerticalDivider(
              width: 1,
              indent: 18,
              endIndent: 18,
              color: FounderLightTheme.border),
          const SizedBox(width: 16),

          // User Identity Card
          Row(
            children: [
              CircleAvatar(
                radius: 16,
                backgroundColor: FounderLightTheme.primaryDark,
                child: Text(
                  name.substring(0, min(2, name.length)).toUpperCase(),
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: FounderLightTheme.surface,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    name,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: FounderLightTheme.textPrimary,
                    ),
                  ),
                  Text(
                    designation,
                    style: const TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w600,
                      color: FounderLightTheme.gold,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // MODULE REGISTRY FILTER
  // ===========================================================================
  List<_ConsoleModule> _getFilteredModules() {
    final isFounder = widget.roleMode == ConsoleRoleMode.founder;
    final perms = widget.permissions;
    final List<_ConsoleModule> list = [];

    if (isFounder) {
      list.add(_ConsoleModule(
          group: 'OPERATIONS',
          label: 'Operations Overview',
          builder: (_) => FounderOperationsOverviewWeb(
                onMissionControl: () => setState(() => _subTab = _findModuleIndex('Mission Control')),
                onMissionWatch: () => setState(() => _subTab = _findModuleIndex('Mission Watch')),
                onStudentHealth: () => setState(() => _subTab = _findModuleIndex('Student Delivery Health')),
                onRevenue: () => setState(() => _subTab = _findModuleIndex('Revenue & Subscriptions')),
                onAdminGovernance: () => setState(() => _subTab = _findModuleIndex('Admin Governance')),
                onSystemOps: () => setState(() => _subTab = _findModuleIndex('System Ops / Dev Mode')),
                onDocuments: () => setState(() => _subTab = _findModuleIndex('Document Command Center')),
                onVerification: () => setState(() => _openMissionDetail(1, 0)),
                onFactory: () => setState(() => _openMissionDetail(2, 0)),
                onPublish: () => setState(() => _openMissionDetail(3, 0)),
                onAdminWork: () => setState(() => _subTab = _findModuleIndex('Admin Work Queue')),
                onStudyMaster: () => setState(() => _subTab = _findModuleIndex('Study Master Library')),
                onIntelligence: () => setState(() => _subTab = _findModuleIndex('Intelligence Room')),
                onActivity: () => setState(() => _subTab = _findModuleIndex('Recent Activity Log')),
                onMyAccess: () => setState(() => _subTab = _findModuleIndex('My Access')),
          )));
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
          group: 'MISSION & DELIVERY',
          label: 'Mission Watch',
          builder: (_) => const MissionWatchWeb()));
      list.add(_ConsoleModule(
          group: 'REVENUE & GROWTH',
          label: 'Revenue & Subscriptions',
          builder: (_) => const RevenueSubscriptionControlWeb()));
      list.add(_ConsoleModule(
          group: 'SYSTEM & GOVERNANCE',
          label: 'Admin Governance',
          builder: (_) => const AccessSecurityWeb()));
      list.add(_ConsoleModule(
          group: 'SYSTEM & GOVERNANCE',
          label: 'System Ops / Dev Mode',
          builder: (_) => const FounderSystemOperationsWeb()));
      list.add(_ConsoleModule(
          group: 'ADMIN & AI OPERATIONS',
          label: 'Admin Work Queue',
          builder: (_) => AdminTasksList(
                onOpenTask: (taskId, taskType, missionId) {
                  setState(() {
                    _activeTaskId = taskId;
                    _subTab = _findModuleIndex(
                      taskType == 'DOCUMENT_REVIEW' || taskType == 'OCR_REPROCESS_REVIEW'
                          ? 'Document Command Center'
                          : 'Mission Control',
                    );
                  });
                },
              )));
      list.add(_ConsoleModule(
          group: 'ADMIN & AI OPERATIONS',
          label: 'Study Master Library',
          builder: (_) => const StudyMasterLibraryWeb(roleMode: ConsoleRoleMode.founder)));
      list.add(_ConsoleModule(
          group: 'ADMIN & AI OPERATIONS',
          label: 'Intelligence Room',
          builder: (_) => const IntelligenceRoomWeb(roleMode: ConsoleRoleMode.founder)));
      list.add(_ConsoleModule(
          group: 'ADMIN & AI OPERATIONS',
          label: 'Recent Activity Log',
          builder: (_) => const RecentActivityWeb(roleMode: ConsoleRoleMode.founder)));
      list.add(_ConsoleModule(
          group: 'ADMIN & AI OPERATIONS',
          label: 'My Access',
          builder: (_) => AdminMyAccessPanel(
                permissions: widget.permissions,
                userDoc: widget.userDoc,
              )));
    } else {
      list.add(_ConsoleModule(
          label: 'My Work Queue',
          builder: (_) => AdminTasksList(
                onOpenTask: (taskId, taskType, missionId) {
                  setState(() {
                    _activeTaskId = taskId;
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
          builder: (_) => _PremiumLandingPage(
            title: 'STUDY MASTER LIBRARY',
            subtitle: 'Academic corpus library management.',
            items: [],
          ),
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
          builder: (_) => _PremiumLandingPage(
            title: 'INTELLIGENCE ROOM',
            subtitle: 'System intelligence and analytics hub.',
            items: [],
          ),
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
                permissions: widget.permissions,
                userDoc: widget.userDoc,
              )));
    }

    return list;
  }

  int _findModuleIndex(String label) {
    final modules = _getFilteredModules();
    for (int i = 0; i < modules.length; i++) {
      if (modules[i].label == label) return i;
    }
    return 0;
  }

  void _openMissionDetail(int detailTab, int subTab) {
    if (MissionControlRoom.selectedMissionId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Open a mission from Mission Control first.')),
      );
      _subTab = _findModuleIndex('Mission Control');
      return;
    }
    MissionControlRoom.targetDetailTab = detailTab;
    MissionControlRoom.targetSubTab = subTab;
    _subTab = _findModuleIndex('Mission Control');
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
                MissionControlRoom.targetDetailTab = 1;
                MissionControlRoom.targetSubTab = 1;
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
                MissionControlRoom.targetDetailTab = 1;
                MissionControlRoom.targetSubTab = 2;
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
                MissionControlRoom.targetDetailTab = 1;
                MissionControlRoom.targetSubTab = 0;
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
          subtitle: '100-Day mission schedule generation.',
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
                MissionControlRoom.targetDetailTab = 2;
                MissionControlRoom.targetSubTab = 0;
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
                MissionControlRoom.targetDetailTab = 2;
                MissionControlRoom.targetSubTab = 1;
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
                MissionControlRoom.targetDetailTab = 3;
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
                MissionControlRoom.targetDetailTab = 3;
                MissionControlRoom.targetSubTab = 0;
                _subTab = _findModuleIndex('Mission Control');
              });
            }
          },
        ),
      ],
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
    return Container(
      color: FounderLightTheme.bg,
      padding: const EdgeInsets.all(28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: FounderLightTheme.primaryDark,
              fontSize: 22,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.5,
            ),
          ),
          if (subtitle.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              subtitle,
              style: const TextStyle(
                color: FounderLightTheme.textMuted,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
          const SizedBox(height: 24),
          if (items.isEmpty)
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: FounderLightTheme.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: FounderLightTheme.border),
              ),
              child: const Text(
                'Module interface active. Select a target record or mission in Mission Control to load details.',
                style:
                    TextStyle(color: FounderLightTheme.textMuted, fontSize: 13),
              ),
            )
          else
            Expanded(
              child: GridView.builder(
                gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                  maxCrossAxisExtent: 380,
                  mainAxisExtent: 180,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                ),
                itemCount: items.length,
                itemBuilder: (context, index) {
                  final item = items[index];
                  return Container(
                    decoration: BoxDecoration(
                      color: FounderLightTheme.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: FounderLightTheme.border),
                      boxShadow: FounderLightTheme.softShadow,
                    ),
                    child: InkWell(
                      onTap: item.onTap,
                      borderRadius: BorderRadius.circular(16),
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(item.icon,
                                color: FounderLightTheme.gold, size: 28),
                            const Spacer(),
                            Text(
                              item.title,
                              style: const TextStyle(
                                color: FounderLightTheme.textPrimary,
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              item.subtitle,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: FounderLightTheme.textMuted,
                                fontSize: 12,
                              ),
                            ),
                            const SizedBox(height: 12),
                            const Row(
                              children: [
                                Text(
                                  'OPEN HUB',
                                  style: TextStyle(
                                    color: FounderLightTheme.primaryBlue,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.8,
                                  ),
                                ),
                                SizedBox(width: 4),
                                Icon(
                                  Icons.arrow_forward_rounded,
                                  color: FounderLightTheme.primaryBlue,
                                  size: 14,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
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
