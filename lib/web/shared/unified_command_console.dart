import 'dart:html' as html;
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

  const UnifiedCommandConsole({
    super.key,
    required this.roleMode,
    required this.permissions,
    required this.userDoc,
    this.initialTaskId,
  });

  @override
  State<UnifiedCommandConsole> createState() => _UnifiedCommandConsoleState();
}

class _UnifiedCommandConsoleState extends State<UnifiedCommandConsole> {
  int _subTab = 0;
  int _ingestionTab = 0; // 0: Review Board, 1: Unified Registry
  String? _activeTaskId;

  // Existing upload state
  static const _categories = {
    'Notification': 'recruitment_notification',
    'Syllabus': 'syllabus',
    'PYQ': 'pyq',
    'Study Material': 'study_material',
    'Update / Notice': 'notice',
  };
  String _category = 'recruitment_notification';
  bool _uploading = false;
  String? _message;

  @override
  void initState() {
    super.initState();
    _activeTaskId = widget.initialTaskId;
    // For admin, landing should be Work Queue (index 0 in filtered list)
  }

  Future<void> _upload() async {
    if (widget.roleMode == ConsoleRoleMode.admin) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text(
                'Source ingestion is restricted to Founder access in this phase.')),
      );
      return;
    }

    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: [
        'pdf',
        'docx',
        'xlsx',
        'json',
        'csv',
        'txt',
        'png',
        'jpg',
        'jpeg',
        'webp',
      ],
      withData: true,
    );
    final file = result?.files.single;
    final bytes = file?.bytes;
    if (file == null || bytes == null) return;

    setState(() {
      _uploading = true;
      _message = null;
    });

    try {
      final hash = sha256.convert(bytes).toString();
      final ext = file.extension?.toLowerCase() ??
          file.name.split('.').last.toLowerCase();
      final sourceId = 'hash_$hash';
      final storagePath = 'ingestion_refinery/$hash.$ext';
      final metadata = SettableMetadata(contentType: mimeForExtension(ext));
      await FirebaseStorage.instance.ref(storagePath).putData(bytes, metadata);
      final downloadUrl =
          await FirebaseStorage.instance.ref(storagePath).getDownloadURL();

      final now = FieldValue.serverTimestamp();
      await FirebaseFirestore.instance
          .collection('ingestion_refinery')
          .doc(sourceId)
          .set({
        'id': sourceId,
        'sourceId': sourceId,
        'fileName': file.name,
        'fileType': ext,
        'mimeType': mimeForExtension(ext),
        'fileSize': bytes.length,
        'fileHash': hash,
        'assetType': _category,
        'status': 'uploaded',
        'documentStatus': _category == 'pyq' ? 'HISTORICAL' : 'LIVE',
        'sourceUrl': downloadUrl,
        'storagePath': storagePath,
        'createdAt': now,
        'updatedAt': now,
        'uploadedFrom': 'rankcrackers_web_unified',
      }, SetOptions(merge: true));

      await FirebaseFirestore.instance.collection('ai_queue').add({
        'type': 'pdfParse',
        'provider': 'gemini',
        'payload': {
          'id': sourceId,
          'fileName': file.name,
          'filePath': downloadUrl,
          'storagePath': storagePath,
          'fileType': ext,
          'mimeType': mimeForExtension(ext),
          'intent': _category,
          'fileHash': hash,
          'mediumPolicy': 'ENGLISH_ONLY',
        },
        'status': 'received',
        'manualTrigger': true,
        'createdAt': now,
        'triggeredFrom': 'rankcrackers_web_unified',
      });

      setState(
        () => _message = 'Upload queued. Extraction worker should pick it up.',
      );
    } catch (e) {
      setState(() => _message = 'Upload failed: $e');
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final modules = _getFilteredModules();
    if (_subTab >= modules.length) _subTab = 0;

    final currentModule = modules[_subTab];

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(60),
        child: Container(
          decoration: const BoxDecoration(
            color: Color(0xFF050A10),
            border: Border(bottom: BorderSide(color: rcLine)),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: List.generate(modules.length, (index) {
                      return _subTabButton(modules[index].label, index);
                    }),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              _buildIdentityHeader(),
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
          label: 'Mission Control',
          builder: (_) =>
              const MissionControlRoom(roleMode: ConsoleRoleMode.founder)));
      list.add(_ConsoleModule(
          label: 'Document Command Center',
          builder: (_) => const DocumentCommandCenter()));
      list.add(_ConsoleModule(
          label: 'Verification Center',
          builder: (_) => _buildVerificationCenterLanding()));
      list.add(_ConsoleModule(
          label: 'Factory Hub', builder: (_) => _buildFactoryHubLanding()));
      list.add(_ConsoleModule(
          label: 'Admin Governance',
          builder: (_) => const AccessSecurityWeb()));
      list.add(_ConsoleModule(
          label: 'Publish Gate', builder: (_) => _buildPublishGateLanding()));
      list.add(_ConsoleModule(
          label: 'System Ops / Dev Mode',
          builder: (_) => const _SystemOpsWithDeliveryHealth()));
      list.add(_ConsoleModule(
          label: 'Study Master Library',
          builder: (_) =>
              const StudyMasterLibraryWeb(roleMode: ConsoleRoleMode.founder)));
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
          label: 'My Access', builder: (_) => const AdminMyAccessPanel()));
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
        Container(
          width: 8,
          height: 8,
          decoration: const BoxDecoration(
            color: rcGreen,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(color: rcGreen, blurRadius: 4, spreadRadius: 1),
            ],
          ),
        ),
        const SizedBox(width: 8),
        const Text(
          'SYSTEM ONLINE',
          style: TextStyle(
              color: rcGreen,
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5),
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
          title: 'Syllabus Atom Review',
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
          title: 'PYQ Question Review',
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
          title: 'Exam Rule Review',
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
    return _PremiumLandingPage(
      title: 'PUBLISH GATE',
      subtitle: 'Final student visibility control and rollback.',
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

  Widget _subTabButton(String label, int index) {
    final active = _subTab == index;
    return InkWell(
      onTap: () => setState(() => _subTab = index),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
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
          ),
        ),
      ),
    );
  }
}

class _ConsoleModule {
  final String label;
  final WidgetBuilder builder;
  _ConsoleModule({required this.label, required this.builder});
}

class _SystemOpsWithDeliveryHealth extends StatelessWidget {
  const _SystemOpsWithDeliveryHealth();

  @override
  Widget build(BuildContext context) {
    return const DefaultTabController(
      length: 2,
      child: Column(
        children: [
          TabBar(
            tabs: [
              Tab(text: 'SYSTEM OPERATIONS'),
              Tab(text: 'STUDENT DELIVERY HEALTH'),
            ],
          ),
          Expanded(
            child: TabBarView(
              children: [
                FounderSystemOperationsWeb(),
                FounderStudentHealthWeb(),
              ],
            ),
          ),
        ],
      ),
    );
  }
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
    return RcPagePad(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RcPageTitle(title: title, subtitle: subtitle),
          const SizedBox(height: 32),
          Expanded(
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                crossAxisSpacing: 24,
                mainAxisSpacing: 24,
                childAspectRatio: 1.6,
              ),
              itemCount: items.length,
              itemBuilder: (context, index) {
                final item = items[index];
                return RcPanel(
                  child: InkWell(
                    onTap: item.onTap,
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(item.icon, color: rcGold, size: 32),
                          const Spacer(),
                          Text(
                            item.title,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            item.subtitle,
                            style: const TextStyle(
                              color: Colors.white38,
                              fontSize: 12,
                            ),
                          ),
                          const SizedBox(height: 12),
                          const Row(
                            children: [
                              Text(
                                'OPEN MODULE',
                                style: TextStyle(
                                  color: rcGold,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 1,
                                ),
                              ),
                              SizedBox(width: 4),
                              Icon(Icons.arrow_forward_rounded,
                                  color: rcGold, size: 12),
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
