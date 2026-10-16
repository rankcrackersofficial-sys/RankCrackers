import 'package:flutter/material.dart';

import '../theme/founder_light_theme.dart';

/// Single light Founder landing surface. It only routes to existing governed
/// workspaces; it does not invent metrics or duplicate pipeline mutations.
class FounderOperationsOverviewWeb extends StatelessWidget {
  final VoidCallback onMissionControl;
  final VoidCallback onMissionWatch;
  final VoidCallback onStudentHealth;
  final VoidCallback onRevenue;
  final VoidCallback onAdminGovernance;
  final VoidCallback onSystemOps;
  final VoidCallback onDocuments;
  final VoidCallback onVerification;
  final VoidCallback onFactory;
  final VoidCallback onPublish;
  final VoidCallback onAdminWork;
  final VoidCallback onStudyMaster;
  final VoidCallback onIntelligence;
  final VoidCallback onActivity;
  final VoidCallback onMyAccess;

  const FounderOperationsOverviewWeb({
    super.key,
    required this.onMissionControl,
    required this.onMissionWatch,
    required this.onStudentHealth,
    required this.onRevenue,
    required this.onAdminGovernance,
    required this.onSystemOps,
    required this.onDocuments,
    required this.onVerification,
    required this.onFactory,
    required this.onPublish,
    required this.onAdminWork,
    required this.onStudyMaster,
    required this.onIntelligence,
    required this.onActivity,
    required this.onMyAccess,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 22, 24, 36),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('FOUNDER OPERATIONS', style: _overline),
          const SizedBox(height: 6),
          const Text('One command surface for governed platform operations', style: _title),
          const SizedBox(height: 8),
          const Text(
            'AI prepares, routes and reports. Founder approval remains the final publication authority.',
            style: _muted,
          ),
          const SizedBox(height: 22),
          _section('MISSION, WATCH & STUDENT OUTCOMES', [
            _card('Mission Control', 'Create, reconcile and inspect mission state.', Icons.explore_outlined, onMissionControl),
            _card('Mission Watch', 'Read four-slot authority and change evidence.', Icons.visibility_outlined, onMissionWatch),
            _card('Student Reports', 'Read delivery health and student-panel readiness.', Icons.groups_outlined, onStudentHealth),
            _card('Monetization', 'Founder-level offers, subscriptions and revenue controls.', Icons.payments_outlined, onRevenue),
          ]),
          const SizedBox(height: 20),
          _section('ACADEMIC PIPELINE', [
            _card('Official Documents', 'Notification and syllabus source-of-truth workspace.', Icons.description_outlined, onDocuments),
            _card('Verification', 'Notification facts, syllabus atoms and PYQ evidence review.', Icons.fact_check_outlined, onVerification),
            _card('Factory', 'Crucible, DigiBook and content-generation controls.', Icons.settings_suggest_outlined, onFactory),
            _card('Publish Gate', 'Student visibility and release-readiness controls.', Icons.publish_outlined, onPublish),
          ]),
          const SizedBox(height: 20),
          _section('ADMIN, AI & FORENSIC OPERATIONS', [
            _card('Admin Work Queue', 'Review assignments and governed human actions.', Icons.assignment_outlined, onAdminWork),
            _card('Study Master', 'Manage reusable subject and academic library records.', Icons.menu_book_outlined, onStudyMaster),
            _card('AI Intelligence', 'Worker governance, queues and evidence-backed automation.', Icons.auto_awesome_outlined, onIntelligence),
            _card('Activity Log', 'Immutable Founder/Admin activity trail.', Icons.history_rounded, onActivity),
            _card('My Access', 'Read effective role and explicit scopes.', Icons.shield_outlined, onMyAccess),
            _card('System Operations', 'Vitals, workers, failures and recovery controls.', Icons.computer_outlined, onSystemOps),
            _note(),
          ]),
        ],
      ),
    );
  }

  Widget _section(String title, List<Widget> children) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: _sectionTitle),
          const SizedBox(height: 10),
          LayoutBuilder(
            builder: (context, constraints) {
              final columns = constraints.maxWidth > 980 ? 4 : constraints.maxWidth > 620 ? 2 : 1;
              return GridView.count(
                crossAxisCount: columns,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: columns == 1 ? 4.8 : 2.25,
                children: children,
              );
            },
          ),
        ],
      );

  Widget _card(String title, String subtitle, IconData icon, VoidCallback onTap) => InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: FounderLightTheme.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: FounderLightTheme.border),
            boxShadow: FounderLightTheme.softShadow,
          ),
          child: Row(
            children: [
              Icon(icon, color: FounderLightTheme.gold, size: 21),
              const SizedBox(width: 11),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
                Text(title, style: _label),
                const SizedBox(height: 4),
                Text(subtitle, style: _muted, maxLines: 2, overflow: TextOverflow.ellipsis),
              ])),
              const Icon(Icons.arrow_forward_ios_rounded, size: 13, color: FounderLightTheme.textDisabled),
            ],
          ),
        ),
      );

  Widget _note() => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: FounderLightTheme.surfaceAlt,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: FounderLightTheme.border),
        ),
        child: const Row(children: [
          Icon(Icons.lock_outline, size: 18, color: FounderLightTheme.textMuted),
          SizedBox(width: 10),
          Expanded(child: Text('Student mastery and private scores remain read-only. AI cannot publish without the governed human gate.', style: _muted)),
        ]),
      );
}

const _overline = TextStyle(fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1.1, color: FounderLightTheme.textMuted);
const _title = TextStyle(fontSize: 23, fontWeight: FontWeight.w800, color: FounderLightTheme.textPrimary);
const _sectionTitle = TextStyle(fontSize: 12, fontWeight: FontWeight.w800, letterSpacing: .8, color: FounderLightTheme.textSecondary);
const _label = TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: FounderLightTheme.textPrimary);
const _muted = TextStyle(fontSize: 12, color: FounderLightTheme.textMuted);
