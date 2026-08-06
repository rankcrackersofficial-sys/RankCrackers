import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:collection/collection.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';

class NebulaFounderPreviewScreen extends StatefulWidget {
  const NebulaFounderPreviewScreen({
    super.key,
    this.previewBundleForTest,
    this.initialTabIndexForTest = 0,
  });

  final Future<Map<String, dynamic>>? previewBundleForTest;
  final int initialTabIndexForTest;

  @override
  State<NebulaFounderPreviewScreen> createState() =>
      _NebulaFounderPreviewScreenState();
}

class _NebulaFounderPreviewScreenState
    extends State<NebulaFounderPreviewScreen> {
  late final Future<Map<String, dynamic>> _bundle;
  String _query = '';
  String _subject = 'ALL';

  @override
  void initState() {
    super.initState();
    _bundle = widget.previewBundleForTest ?? _loadBundle();
  }

  TextStyle get _heroStyle => widget.previewBundleForTest == null
      ? AppTypography.hero
      : const TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.w700,
          color: AppColors.primaryText,
          height: 1.2,
        );

  TextStyle get _labelStyle => widget.previewBundleForTest == null
      ? AppTypography.label
      : const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w800,
          color: AppColors.gold,
        );
  Future<Map<String, dynamic>> _loadBundle() async {
    Future<Map<String, dynamic>> load(String name) async {
      final raw = await rootBundle
          .loadString('assets/data/preview/jee_main_2027/$name');
      return Map<String, dynamic>.from(jsonDecode(raw) as Map);
    }

    return {
      'manifest': await load('mission_preview_manifest.json'),
      'syllabus': await load('syllabus_preview_tree.json'),
      'crucible': await load('crucible_preview_plan.json'),
      'digibook': await load('digibook_preview_catalog.json'),
      'assessment': await load('assessment_preview_manifest.json'),
    };
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: FutureBuilder<Map<String, dynamic>>(
          future: _bundle,
          builder: (context, snap) {
            if (!snap.hasData) {
              if (snap.hasError) return _error(snap.error.toString());
              return const Center(child: CircularProgressIndicator());
            }
            final data = snap.data!;
            final pages = <Widget>[
              _missionLanding(data),
              _syllabus(data['syllabus'] as Map<String, dynamic>,
                  data['manifest'] as Map<String, dynamic>),
              _crucible(data['crucible'] as Map<String, dynamic>),
              _digibook(data['digibook'] as Map<String, dynamic>),
              _assessment(data['assessment'] as Map<String, dynamic>),
            ];
            const tabTitles = [
              'Mission Overview',
              'Syllabus',
              'Crucible',
              'DigiBook',
              'Assessment',
            ];
            if (widget.previewBundleForTest != null) {
              final index =
                  widget.initialTabIndexForTest.clamp(0, pages.length - 1);
              return Column(
                children: [
                  index == 0
                      ? _header(data['manifest'] as Map<String, dynamic>)
                      : _compactHeader(
                          data['manifest'] as Map<String, dynamic>,
                          tabTitles[index],
                        ),
                  Expanded(child: _responsivePreviewBody(pages[index])),
                ],
              );
            }
            return DefaultTabController(
              length: 5,
              child: Column(
                children: [
                  _header(data['manifest'] as Map<String, dynamic>),
                  const TabBar(
                    isScrollable: true,
                    tabs: [
                      Tab(text: 'Mission'),
                      Tab(text: 'Syllabus'),
                      Tab(text: 'Crucible'),
                      Tab(text: 'DigiBook'),
                      Tab(text: 'Assessment'),
                    ],
                  ),
                  Expanded(
                    child: TabBarView(
                      children: [
                        for (final page in pages) _responsivePreviewBody(page),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _compactHeader(Map<String, dynamic> manifest, String sectionTitle) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(bottom: BorderSide(color: AppColors.borderSoft)),
      ),
      child: Row(children: [
        const Icon(Icons.arrow_back_rounded, size: 18, color: Colors.white70),
        const SizedBox(width: 8),
        Expanded(
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(
              manifest['displayMission']?.toString() ?? 'JEE Main 2027',
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              sectionTitle,
              style: const TextStyle(
                color: AppColors.primaryText,
                fontSize: 18,
                fontWeight: FontWeight.w900,
              ),
            ),
          ]),
        ),
        _badge('Founder Preview'),
      ]),
    );
  }

  Widget _responsivePreviewBody(Widget child) => LayoutBuilder(
        builder: (context, constraints) {
          if (constraints.maxWidth < 900) return child;
          return Align(
            alignment: Alignment.topCenter,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1040),
              child: child,
            ),
          );
        },
      );

  Widget _header(Map<String, dynamic> manifest) {
    final copy = Map<String, dynamic>.from(manifest['copy'] as Map? ?? {});
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(bottom: BorderSide(color: AppColors.borderSoft)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _badge(manifest['banner']?.toString() ?? 'INTERNAL FOUNDER PREVIEW'),
        const SizedBox(height: 10),
        Text(manifest['displayMission']?.toString() ?? 'JEE Main 2027',
            style: _heroStyle.copyWith(fontSize: 25)),
        const SizedBox(height: 6),
        Text(
          '${copy['syllabus']} ${copy['crucible']} ${copy['digibook']} ${copy['assessment']}',
          style: const TextStyle(color: Colors.white70, height: 1.35),
        ),
      ]),
    );
  }

  Widget _missionLanding(Map<String, dynamic> data) {
    final manifest = Map<String, dynamic>.from(data['manifest'] as Map);
    final inventory =
        Map<String, dynamic>.from(manifest['inventory'] as Map? ?? {});
    final subjectCounts =
        Map<String, dynamic>.from(inventory['subjectCounts'] as Map? ?? {});
    final crucible = Map<String, dynamic>.from(data['crucible'] as Map);
    final digibook = Map<String, dynamic>.from(data['digibook'] as Map);
    final unit = Map<String, dynamic>.from(
        ((digibook['units'] as List? ?? []).firstOrNull ?? {}) as Map);
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
      children: [
        _truth('INTERNAL FOUNDER PREVIEW',
            'This is a truthful student-experience prototype. It shows what is available, what is being prepared and what remains under academic review.'),
        const SizedBox(height: 12),
        _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(manifest['displayMission']?.toString() ?? 'JEE Main 2027',
              style: _heroStyle.copyWith(fontSize: 28)),
          const SizedBox(height: 8),
          const Text(
            'Your preparation system is being built around the official syllabus, a 100-day Crucible plan and premium DigiBook learning units.',
            style: TextStyle(color: Colors.white70, height: 1.4),
          ),
          const SizedBox(height: 14),
          _metrics([
            ['Verified topics', inventory['previewEligibleAtoms'] ?? 417],
            [
              'Crucible plan',
              '${crucible['cycleDays'] ?? 100} days / ${crucible['scheduleCount'] ?? 42} schedules'
            ],
            ['Pilot DigiBook', unit['title'] ?? 'Mechanics Foundations'],
            ['Reviewed tests', 'In progress'],
          ]),
          const SizedBox(height: 12),
          Wrap(spacing: 8, runSpacing: 8, children: [
            _actionChip(Icons.account_tree_outlined, 'Explore Syllabus'),
            _actionChip(Icons.timeline_outlined, 'View Crucible Plan'),
            _actionChip(Icons.menu_book_outlined, 'Open Pilot DigiBook'),
          ]),
        ])),
        _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Mission readiness dashboard', style: _labelStyle),
          const SizedBox(height: 10),
          _readinessRow(Icons.verified_outlined, 'Syllabus Verified',
              '${inventory['previewEligibleAtoms'] ?? 417} student-visible atomic topics are ready for preview.'),
          _readinessRow(Icons.auto_graph_outlined, 'Structure Preview',
              'The Crucible has 7 phases, 42 focused learning schedules and 7 rebuild windows.'),
          _readinessRow(Icons.menu_book_outlined, 'DigiBook Available',
              'Mechanics Foundations is the reference pilot unit for reading comfort and academic tone.'),
          _readinessRow(Icons.fact_check_outlined, 'Assessment Under Review',
              'Tests are visible as structure only. No score, mastery or progress will be saved.'),
        ])),
        _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Subject map', style: _labelStyle),
          const SizedBox(height: 10),
          for (final entry in subjectCounts.entries)
            _readinessRow(Icons.school_outlined, entry.key,
                '${entry.value} atomic topics linked into the preview syllabus.'),
        ])),
        _card(Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Text('Student promise',
                  style: TextStyle(
                      color: AppColors.gold, fontWeight: FontWeight.w900)),
              SizedBox(height: 8),
              Text(
                'RankCrackers will feel motivating without pretending that locked tests, missing content or academic review items are ready.',
                style: TextStyle(color: Colors.white70, height: 1.4),
              ),
            ])),
      ],
    );
  }

  Widget _syllabus(
      Map<String, dynamic> syllabus, Map<String, dynamic> manifest) {
    final summary =
        Map<String, dynamic>.from(syllabus['summary'] as Map? ?? {});
    final subjects = (syllabus['subjects'] as List? ?? []).cast<Map>();
    final visible = subjects
        .where((s) => _subject == 'ALL' || s['name'] == _subject)
        .toList();
    return ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
        children: [
          _truth('Verified syllabus structure is shown.',
              'Held, duplicate, rejected and missing-canonical atoms stay outside the normal student tree. No progress is saved.'),
          const SizedBox(height: 12),
          _metrics([
            ['Total atoms', summary['totalAtoms']],
            ['Preview eligible', summary['previewEligibleAtoms']],
            ['Held/excluded', summary['heldExcludedAtoms']],
            ['Topics', summary['topicCount']],
          ]),
          const SizedBox(height: 12),
          TextField(
            decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search_rounded),
                labelText: 'Search atomic topic',
                border: OutlineInputBorder()),
            onChanged: (v) => setState(() => _query = v.toLowerCase().trim()),
          ),
          const SizedBox(height: 10),
          Wrap(
              spacing: 8,
              children: ['ALL', ...subjects.map((s) => s['name'].toString())]
                  .map((s) => ChoiceChip(
                      label: Text(s),
                      selected: _subject == s,
                      onSelected: (_) => setState(() => _subject = s)))
                  .toList()),
          const SizedBox(height: 12),
          if (visible.isNotEmpty)
            _atomicTopicDetailCard(Map<String, dynamic>.from(visible.first)),
          const SizedBox(height: 12),
          for (final subject in visible)
            _subjectTile(Map<String, dynamic>.from(subject)),
        ]);
  }

  Widget _subjectTile(Map<String, dynamic> subject) {
    final units = (subject['children'] as List? ?? []).cast<Map>();
    return _card(ExpansionTile(
      tilePadding: EdgeInsets.zero,
      initiallyExpanded: _query.isNotEmpty,
      title: Text('${subject['name']} (${subject['atomCount']})'),
      children: [
        for (final unit in units) _unitTile(Map<String, dynamic>.from(unit))
      ],
    ));
  }

  Widget _unitTile(Map<String, dynamic> unit) {
    final chapters = (unit['children'] as List? ?? []).cast<Map>();
    return ExpansionTile(
      title: Text('${unit['name']} (${unit['atomCount']})'),
      initiallyExpanded: _query.isNotEmpty,
      children: [
        for (final chapter in chapters)
          _chapterTile(Map<String, dynamic>.from(chapter))
      ],
    );
  }

  Widget _chapterTile(Map<String, dynamic> chapter) {
    final topics = (chapter['children'] as List? ?? []).cast<Map>();
    return ExpansionTile(
      title: Text('${chapter['name']} (${chapter['atomCount']})'),
      initiallyExpanded: _query.isNotEmpty,
      children: [
        for (final topic in topics)
          if (_topicMatches(topic)) _topicTile(Map<String, dynamic>.from(topic))
      ],
    );
  }

  bool _topicMatches(Map topic) {
    if (_query.isEmpty) return true;
    if (topic['name'].toString().toLowerCase().contains(_query)) return true;
    return ((topic['atoms'] as List? ?? []))
        .any((a) => jsonEncode(a).toLowerCase().contains(_query));
  }

  Widget _topicTile(Map<String, dynamic> topic) {
    final atoms = (topic['atoms'] as List? ?? []).cast<Map>();
    return ExpansionTile(
      title: Text('${topic['name']} (${topic['atomCount']})'),
      children: [
        for (final raw in atoms)
          if (_query.isEmpty || jsonEncode(raw).toLowerCase().contains(_query))
            ListTile(
              dense: true,
              title:
                  Text(raw['atomicTopicLabel']?.toString() ?? 'Atomic Topic'),
              subtitle: Text(_atomLearningPromise(raw)),
              trailing: Wrap(spacing: 6, children: [
                _badge(raw['digibookReadiness']?.toString() ?? 'IN_PROGRESS'),
                _badge(raw['assessmentReadiness']?.toString() ?? 'NOT_STARTED')
              ]),
            ),
      ],
    );
  }

  Widget _crucible(Map<String, dynamic> plan) {
    final allocation =
        Map<String, dynamic>.from(plan['allocationIntegrity'] as Map? ?? {});
    final phases = (plan['phases'] as List? ?? []).cast<Map>();
    final schedules = (plan['schedules'] as List? ?? []).cast<Map>();
    final rebuildWindows = (plan['rebuildWindows'] as List? ?? []).cast<Map>();
    final macroTests = (plan['macroTestSlots'] as List? ?? []).cast<Map>();
    final majorTest = Map<String, dynamic>.from(
        plan['majorTestSlot'] as Map? ?? <String, dynamic>{});
    return ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
        children: [
          _truth('STRUCTURE PREVIEW - not an active learner schedule.',
              'All preview-eligible atoms are allocated exactly once. Tests remain structural slots until reviewed question pools exist.'),
          const SizedBox(height: 12),
          _metrics([
            ['100-Day Plan', '${plan['cycleDays']} days'],
            ['Learning phases', plan['phaseCount']],
            ['Focused schedules', plan['scheduleCount']],
            [
              'Allocation check',
              allocation['duplicateAllocationCount'] == 0 ? 'clean' : 'review'
            ],
          ]),
          const SizedBox(height: 12),
          _card(Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text('How the Crucible works',
                    style: TextStyle(
                        color: AppColors.gold, fontWeight: FontWeight.w900)),
                SizedBox(height: 8),
                Text(
                    'Learning Schedule: a focused group of topics for a few days.'),
                Text('Rebuild Window: revision and recovery time.'),
                Text(
                    'Macro Test: a phase-level test after review is complete.'),
                Text('Major Test: a full-cycle test after approval.'),
              ])),
          const SizedBox(height: 14),
          Text('7 Learning Phases', style: _labelStyle),
          const SizedBox(height: 8),
          for (final raw in phases) _phaseCard(Map<String, dynamic>.from(raw)),
          const SizedBox(height: 14),
          _rebuildWindowsSection(rebuildWindows),
          const SizedBox(height: 14),
          _testSlotsSection(macroTests, majorTest),
          const SizedBox(height: 14),
          Text('42 schedule cards', style: _labelStyle),
          const SizedBox(height: 8),
          for (final raw in schedules)
            _scheduleCard(Map<String, dynamic>.from(raw)),
        ]);
  }

  Widget _rebuildWindowsSection(List<Map> windows) => _card(
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text('Rebuild Windows', style: _labelStyle)),
            _badge('${windows.length} revision windows'),
          ]),
          const SizedBox(height: 8),
          const Text(
            'Rebuild Windows are reserved structural periods for revision, recovery and gap correction. This preview is not an active learner plan.',
            style: TextStyle(color: Colors.white70, height: 1.35),
          ),
          const SizedBox(height: 10),
          for (var i = 0; i < windows.length; i++)
            _rebuildWindowCard(i + 1, Map<String, dynamic>.from(windows[i])),
        ]),
      );

  Widget _rebuildWindowCard(int number, Map<String, dynamic> window) =>
      Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.white12),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(
                child: Text('Revision Window $number', style: _labelStyle)),
            _statusBadge(window['status']?.toString() ?? 'STRUCTURE_PREVIEW'),
          ]),
          const SizedBox(height: 6),
          Text('Linked phase: ${_phaseLabel(window['phaseId']?.toString())}'),
          const Text('Purpose: revision, recovery and gap correction'),
          const Text(
              'Student status: preview only; progress is not active yet'),
        ]),
      );

  Widget _testSlotsSection(
          List<Map> macroTests, Map<String, dynamic> majorTest) =>
      _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Macro and Major Test Readiness', style: _labelStyle),
        const SizedBox(height: 8),
        const Text(
          'Test slots are structural only until reviewed question pools exist.',
          style: TextStyle(color: Colors.white70, height: 1.35),
        ),
        const SizedBox(height: 10),
        for (final raw in macroTests)
          _testSlotCard('Macro Test', Map<String, dynamic>.from(raw)),
        _testSlotCard('Major Test', majorTest),
      ]));

  Widget _testSlotCard(String label, Map<String, dynamic> slot) => Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.white12),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(
                child:
                    Text(_studentTestTitle(label, slot), style: _labelStyle)),
            _statusBadge(slot['status']?.toString() ?? 'NOT_READY'),
          ]),
          const SizedBox(height: 6),
          Text('Coverage: ${_phaseLabel(slot['phaseId']?.toString())}'),
          Text(_studentReadinessReason(slot['reason']?.toString())),
        ]),
      );
  Widget _phaseCard(Map<String, dynamic> phase) {
    final number = phase['phaseNumber']?.toString() ?? '-';
    final title = phase['title']?.toString() ?? 'Learning Phase';
    return _card(
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        CircleAvatar(child: Text(number)),
        const SizedBox(width: 12),
        Expanded(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Phase $number - $title', style: _labelStyle),
          const SizedBox(height: 4),
          Text(
              '${phase['atomCount']} focused topics | ${phase['estimatedCoverage']}% mission coverage'),
        ])),
      ]),
      const SizedBox(height: 10),
      const Text('Phase Detail',
          style: TextStyle(color: Colors.white54, fontSize: 12)),
      const SizedBox(height: 4),
      const Text(
        'Purpose: build the learning base, keep the schedule understandable, and prepare for reviewed practice without pretending tests are live.',
        style: TextStyle(color: Colors.white70, height: 1.35),
      ),
      const SizedBox(height: 8),
      Wrap(spacing: 8, runSpacing: 8, children: [
        _badge('DigiBook summary visible'),
        _badge('Assessment under review'),
        _badge('Schedule list available'),
      ]),
    ]));
  }

  Widget _scheduleCard(Map<String, dynamic> schedule) {
    final pilots = schedule['pilotDigibookUnits'] as List? ?? [];
    return _card(
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Expanded(
            child: Text(
                'Schedule ${schedule['scheduleNumber']} - Days ${schedule['dayRange']}',
                style: _labelStyle)),
        _statusBadge(schedule['scheduleReadiness']?.toString() ??
            'INTERNAL_REVIEW_REQUIRED'),
      ]),
      const SizedBox(height: 8),
      Text('Phase: ${_phaseLabel(schedule['phaseId']?.toString())}'),
      Text(
          'What to learn: ${(schedule['assignedAtomIds'] as List? ?? []).length} focused topics'),
      Text('Topic mix: ${_studentSubjectMix(schedule['subjectMix'])}'),
      Text(
          'DigiBook: ${schedule['digibookAvailableCount']} ready, ${schedule['digibookMissingCount']} being prepared'),
      Text(
          'Test status: ${_studentStatus(schedule['microTestStatus']?.toString() ?? 'NOT_READY')}'),
      if (pilots.isNotEmpty) ...[
        const SizedBox(height: 8),
        _badge('MECHANICS FOUNDATIONS DIGIBOOK DEMO'),
      ],
    ]));
  }

  Widget _digibook(Map<String, dynamic> catalog) {
    final unit = Map<String, dynamic>.from(
        ((catalog['units'] as List? ?? []).firstOrNull ?? {}) as Map);
    final sections = (unit['sections'] as List? ?? []).cast<Map>();
    final formulas = (unit['formulaRegister'] as List? ?? []).cast<Map>();
    final misconceptions =
        (unit['misconceptionRegister'] as List? ?? []).cast<Map>();
    final examples = (unit['workedExamples'] as List? ?? []).cast<Map>();
    final checks = (unit['selfCheckPrompts'] as List? ?? []).cast<Map>();
    final missing =
        Map<String, dynamic>.from(catalog['missingContentState'] as Map? ?? {});
    return ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
        children: [
          _truth('INTERNAL PILOT CONTENT',
              'Only real accepted Mechanics Foundations content is shown. Empty or fake DigiBook reader pages are blocked.'),
          const SizedBox(height: 12),
          _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(unit['title']?.toString() ?? 'Mechanics Foundations',
                style: _heroStyle.copyWith(fontSize: 22)),
            const SizedBox(height: 4),
            Text(unit['subtitle']?.toString() ?? '',
                style: const TextStyle(color: Colors.white70)),
            const SizedBox(height: 12),
            _metrics([
              ['Sections', unit['sectionCount']],
              ['Formulas', unit['formulaCount']],
              ['Misconceptions', unit['misconceptionCount']],
              ['Examples', examples.length],
              ['Self-checks', checks.length],
            ]),
          ])),
          _sectionNavigator([
            'Overview',
            'Concepts',
            'Formula Register',
            'Common Misconceptions',
            'Worked Examples',
            'Self-Checks',
            'Assessment Preview',
          ]),
          _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Concept reader', style: _labelStyle),
            const SizedBox(height: 8),
            for (final raw in sections)
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading:
                    const Icon(Icons.menu_book_outlined, color: AppColors.gold),
                title: Text(raw['title']?.toString() ?? 'Section'),
                subtitle: Text(raw['content']?.toString() ??
                    'Linked examples and self-checks available.'),
              ),
          ])),
          _formulaRegisterSection(formulas),
          _misconceptionSection(misconceptions),
          if (examples.isNotEmpty)
            _workedExampleDetail(Map<String, dynamic>.from(examples.first)),
          _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Self-Checks', style: _labelStyle),
            const SizedBox(height: 8),
            for (final raw in checks)
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.fact_check_outlined,
                    color: AppColors.gold),
                title: Text(raw['prompt']?.toString() ?? ''),
                subtitle:
                    Text('Model idea: ${raw['briefModelResponse'] ?? ''}'),
              ),
          ])),
          _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Assessment Preview', style: _labelStyle),
            const SizedBox(height: 8),
            const Text(
                'Preview only - results will not be saved. Full assessment remains under internal academic review.'),
          ])),
          _comingSoonState(missing),
        ]);
  }

  Widget _workedExampleDetail(Map<String, dynamic> raw) {
    final steps =
        (raw['steps'] as List? ?? []).map((e) => e.toString()).toList();
    return _card(
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Worked Example', style: _labelStyle),
      const SizedBox(height: 8),
      Text(raw['concept']?.toString() ?? 'Example',
          style: const TextStyle(
              color: AppColors.primaryText,
              fontSize: 18,
              fontWeight: FontWeight.w900)),
      const SizedBox(height: 10),
      _detailLine('Problem', raw['find']),
      _detailLine('Given', raw['given']),
      _detailLine('Method', raw['principleUsed']),
      if (steps.isNotEmpty) ...[
        const SizedBox(height: 10),
        const Text('Solution',
            style: TextStyle(color: Colors.white54, fontSize: 12)),
        const SizedBox(height: 4),
        for (var i = 0; i < steps.length; i++)
          Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Text('Step ${i + 1}: ${steps[i]}'),
          ),
      ],
      _detailLine('Final Result', raw['finalResult']),
      _detailLine('Concept Takeaway', raw['reasonablenessCheck']),
      _detailLine('Common error to avoid', raw['commonError']),
    ]));
  }

  Widget _comingSoonState(Map<String, dynamic> missing) => _card(
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            const Icon(Icons.hourglass_empty_rounded, color: AppColors.gold),
            const SizedBox(width: 8),
            Expanded(child: Text('Content Being Prepared', style: _labelStyle)),
          ]),
          const SizedBox(height: 10),
          const Text(
            'This syllabus topic is verified, but its DigiBook lesson is still under academic preparation.',
            style: TextStyle(color: Colors.white70, height: 1.35),
          ),
          const SizedBox(height: 10),
          Text(missing['reason']?.toString() ??
              'Empty fake reader pages are blocked until reviewed teaching content exists.'),
          const SizedBox(height: 12),
          Wrap(spacing: 8, runSpacing: 8, children: [
            _actionChip(Icons.account_tree_outlined, 'Return to Syllabus'),
            _actionChip(Icons.timeline_outlined, 'View Crucible Schedule'),
            _actionChip(
                Icons.menu_book_outlined, 'Open Available Pilot DigiBook'),
          ]),
        ]),
      );

  Widget _sectionNavigator(List<String> labels) => _card(
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final label in labels)
              Chip(
                label: Text(label),
                visualDensity: VisualDensity.compact,
                backgroundColor: Colors.white.withValues(alpha: 0.06),
              ),
          ],
        ),
      );

  Widget _formulaRegisterSection(List<Map> formulas) => _card(
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text('Formula Register', style: _labelStyle)),
            _badge('${formulas.length} FORMULAS'),
          ]),
          const SizedBox(height: 8),
          const Text(
            'INTERNAL PILOT CONTENT - source-backed formulas for Founder preview. Not a final student-ready formula book.',
            style: TextStyle(color: Colors.white70, height: 1.35),
          ),
          const SizedBox(height: 10),
          if (formulas.isEmpty)
            const Text('Formula Register is not available for this unit yet.')
          else
            for (final raw in formulas)
              _formulaCard(Map<String, dynamic>.from(raw)),
        ]),
      );

  Widget _formulaCard(Map<String, dynamic> formula) => Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.white12),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Wrap(
              spacing: 8,
              runSpacing: 6,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                _badge(formula['id']?.toString() ?? 'FORMULA'),
                _badge('INTERNAL PILOT CONTENT'),
              ]),
          const SizedBox(height: 8),
          Text(
            formula['formula']?.toString() ?? '',
            softWrap: true,
            style: const TextStyle(
              color: AppColors.gold,
              fontWeight: FontWeight.w900,
              fontSize: 16,
              height: 1.35,
            ),
          ),
          _detailLine('Symbols', formula['symbols']),
          _detailLine('Condition', formula['condition']),
          _detailLine('Units', formula['siUnits']),
          _detailLine('Usage note', formula['commonError']),
          _detailLine('Linked atom', formula['authorizedAtomId']),
        ]),
      );

  Widget _misconceptionSection(List<Map> misconceptions) => _card(
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text('Common Misconceptions', style: _labelStyle)),
            _badge('${misconceptions.length} WARNINGS'),
          ]),
          const SizedBox(height: 8),
          const Text(
            'Each statement below is an incorrect belief. The correction is shown immediately so it cannot be mistaken for a fact.',
            style: TextStyle(color: Colors.white70, height: 1.35),
          ),
          const SizedBox(height: 10),
          if (misconceptions.isEmpty)
            const Text('Misconception guidance is being prepared.')
          else
            for (final raw in misconceptions)
              _misconceptionCard(Map<String, dynamic>.from(raw)),
        ]),
      );

  Widget _misconceptionCard(Map<String, dynamic> item) => Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.redAccent.withValues(alpha: 0.07),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.redAccent.withValues(alpha: 0.22)),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Wrap(spacing: 8, runSpacing: 6, children: [
            _badge(item['id']?.toString() ?? 'MISCONCEPTION'),
            _badge('INCORRECT BELIEF'),
          ]),
          _detailLine('Misconception', item['incorrectBelief']),
          _detailLine('Why it fails', item['correctiveExample']),
          _detailLine('Correct understanding', item['correctPrinciple']),
          _detailLine('Linked atom', item['authorizedAtomId']),
        ]),
      );
  Widget _assessment(Map<String, dynamic> manifest) {
    final assessment = Map<String, dynamic>.from(
        ((manifest['assessments'] as List? ?? []).firstOrNull ?? {}) as Map);
    final items = (assessment['sampleItems'] as List? ?? []).cast<Map>();
    return ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
        children: [
          _truth('INTERNAL ASSESSMENT PREVIEW',
              'Results will not be saved. Mastery will not update. This pack remains under independent academic review.'),
          const SizedBox(height: 12),
          _metrics([
            ['Questions', assessment['itemCount']],
            ['Points', assessment['totalPoints']],
            [
              'Answer review',
              _studentReviewStatus(assessment['answerReviewStatus']?.toString())
            ],
            [
              'Student ready',
              assessment['studentPublishReady'] == true ? 'YES' : 'NO'
            ],
          ]),
          const SizedBox(height: 12),
          _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(assessment['title']?.toString() ?? 'Assessment Preview',
                style: _labelStyle),
            const SizedBox(height: 10),
            for (final raw in items)
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.assignment_outlined,
                    color: AppColors.gold),
                title: Text(_assessmentItemTitle(raw)),
                subtitle: Text(raw['stem']?.toString() ?? '',
                    maxLines: 5, overflow: TextOverflow.ellipsis),
              ),
            const Divider(),
            const Text(
                'No production attempt. No marks persistence. No official answer-key claim.'),
          ])),
        ]);
  }

  Widget _actionChip(IconData icon, String label) => ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 252),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 9),
          decoration: BoxDecoration(
            color: AppColors.gold.withValues(alpha: 0.10),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppColors.gold.withValues(alpha: 0.28)),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(icon, size: 16, color: AppColors.gold),
            const SizedBox(width: 7),
            Flexible(
              child: Text(label,
                  softWrap: true,
                  style: const TextStyle(
                      color: AppColors.primaryText,
                      fontWeight: FontWeight.w800)),
            ),
          ]),
        ),
      );

  Widget _readinessRow(IconData icon, String title, String body) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.white12),
            ),
            child: Icon(icon, size: 18, color: AppColors.gold),
          ),
          const SizedBox(width: 10),
          Expanded(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title,
                  style: const TextStyle(
                      fontWeight: FontWeight.w900,
                      color: AppColors.primaryText)),
              const SizedBox(height: 2),
              Text(body,
                  style: const TextStyle(color: Colors.white70, height: 1.35)),
            ]),
          ),
        ]),
      );

  Widget _atomicTopicDetailCard(Map<String, dynamic> subject) {
    final units = (subject['children'] as List? ?? []).cast<Map>();
    if (units.isEmpty) return const SizedBox.shrink();
    final unit = Map<String, dynamic>.from(units.first);
    final chapters = (unit['children'] as List? ?? []).cast<Map>();
    if (chapters.isEmpty) return const SizedBox.shrink();
    final chapter = Map<String, dynamic>.from(chapters.first);
    final topics = (chapter['children'] as List? ?? []).cast<Map>();
    if (topics.isEmpty) return const SizedBox.shrink();
    final topic = Map<String, dynamic>.from(topics.first);
    final atoms = (topic['atoms'] as List? ?? []).cast<Map>();
    if (atoms.isEmpty) return const SizedBox.shrink();
    final atom = Map<String, dynamic>.from(atoms.first);
    return _card(
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Atomic Topic Detail', style: _labelStyle),
      const SizedBox(height: 8),
      _hierarchyLine('Subject', subject['name']),
      _hierarchyLine('Unit', unit['name']),
      _hierarchyLine('Chapter', chapter['name']),
      _hierarchyLine('Topic', topic['name']),
      const Divider(height: 18),
      Text(atom['atomicTopicLabel']?.toString() ?? 'Atomic Topic',
          style: const TextStyle(
              color: AppColors.primaryText,
              fontSize: 18,
              fontWeight: FontWeight.w900)),
      const SizedBox(height: 6),
      Text(_atomLearningPromise(atom),
          style: const TextStyle(color: Colors.white70, height: 1.35)),
      const SizedBox(height: 10),
      Wrap(spacing: 8, runSpacing: 8, children: [
        _badge(_studentStatus(
            atom['digibookReadiness']?.toString() ?? 'IN_PROGRESS')),
        _badge(_studentStatus(
            atom['assessmentReadiness']?.toString() ?? 'NOT_STARTED')),
      ]),
    ]));
  }

  Widget _hierarchyLine(String label, Object? value) => Padding(
        padding: const EdgeInsets.only(bottom: 5),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          SizedBox(
            width: 72,
            child: Text(label,
                style: const TextStyle(color: Colors.white54, fontSize: 12)),
          ),
          Expanded(
            child: Text(value?.toString() ?? '-',
                style: const TextStyle(fontWeight: FontWeight.w700)),
          ),
        ]),
      );

  String _atomLearningPromise(Map raw) {
    final label = raw['atomicTopicLabel']?.toString().trim();
    if (label == null || label.isEmpty) {
      return 'This atomic topic is linked to the syllabus tree and will open its DigiBook, practice and review material when ready.';
    }
    return 'Learn $label through the syllabus tree, then connect it to DigiBook reading, Crucible practice and reviewed questions.';
  }

  String _phaseLabel(String? raw) {
    if (raw == null || raw.trim().isEmpty) return 'Full mission';
    final match = RegExp(r'phase_(\d+)').firstMatch(raw);
    if (match != null) return 'Phase ${match.group(1)}';
    return _studentStatus(raw);
  }

  String _studentSubjectMix(Object? value) {
    if (value is Map) {
      return value.entries
          .map((entry) => '${entry.key}: ${entry.value} topics')
          .join(', ');
    }
    final text = value?.toString().trim() ?? '';
    if (text.isEmpty || text == '{}') return 'balanced mission mix';
    return text;
  }

  String _studentReadinessReason(String? raw) {
    switch (raw) {
      case 'REVIEWED_QUESTION_POOL_NOT_AVAILABLE':
      case 'REVIEWED_FULL_MISSION_QUESTION_POOL_NOT_AVAILABLE':
        return 'Test questions are under academic review.';
      case null:
      case '':
        return 'Academic review is pending.';
      default:
        return _studentStatus(raw);
    }
  }

  String _studentTestTitle(String label, Map<String, dynamic> slot) {
    if (label == 'Major Test') return 'Major Test - Full Mission Review';
    final phase = _phaseLabel(slot['phaseId']?.toString());
    return '$label - $phase Review';
  }

  String _studentReviewStatus(String? raw) {
    switch (raw) {
      case 'PENDING_INDEPENDENT_REVIEW':
        return 'Under academic review';
      case 'APPROVED':
        return 'Approved';
      default:
        return _studentStatus(raw ?? 'UNDER_REVIEW');
    }
  }

  String _assessmentItemTitle(Map raw) {
    final format = raw['format']?.toString() == 'SINGLE_SELECT'
        ? 'Single-choice question'
        : _studentStatus(raw['format']?.toString() ?? 'Question');
    return format;
  }

  String _studentStatus(String raw) {
    switch (raw) {
      case 'AVAILABLE_FOR_FOUNDER_PREVIEW':
      case 'AVAILABLE':
      case 'READY':
        return 'DigiBook Available';
      case 'INTERNAL_REVIEW_REQUIRED':
      case 'UNDER_REVIEW':
      case 'PENDING_INDEPENDENT_REVIEW':
        return 'Under Academic Review';
      case 'QUESTION_POOL_BLOCKED':
      case 'REVIEWED_QUESTION_POOL_NOT_AVAILABLE':
      case 'REVIEWED_FULL_MISSION_QUESTION_POOL_NOT_AVAILABLE':
        return 'Test Questions Under Review';
      case 'STRUCTURAL_SLOT_ONLY':
      case 'STRUCTURE_PREVIEW':
        return 'Structure Preview';
      case 'NOT_READY':
        return 'Not Available Yet';
      case 'NOT_STARTED':
        return 'Not Started';
      case 'IN_PROGRESS':
      case 'CONTENT_IN_PROGRESS':
        return 'Content Being Prepared';
      case 'CONTENT_PARTIAL':
        return 'Content Partly Available';
      default:
        return raw.replaceAll('_', ' ').toLowerCase().split(' ').map((part) {
          if (part.isEmpty) return part;
          return '${part[0].toUpperCase()}${part.substring(1)}';
        }).join(' ');
    }
  }

  Widget _statusBadge(String label) => _badge(_studentStatus(label));
  Widget _truth(String title, String body) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.gold.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.gold.withValues(alpha: 0.28)),
        ),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Icon(Icons.verified_outlined, color: AppColors.gold),
          const SizedBox(width: 10),
          Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                Text(title,
                    style: const TextStyle(
                        color: AppColors.gold, fontWeight: FontWeight.w900)),
                const SizedBox(height: 4),
                Text(body,
                    style:
                        const TextStyle(color: Colors.white70, height: 1.35)),
              ])),
        ]),
      );

  Widget _metrics(List<List<dynamic>> metrics) => Wrap(
        spacing: 10,
        runSpacing: 10,
        children: metrics
            .map((m) => SizedBox(
                  width: 158,
                  child: _card(Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(m[0].toString(),
                            style: const TextStyle(
                                color: Colors.white54, fontSize: 12)),
                        const SizedBox(height: 5),
                        Text(m[1].toString(),
                            style: const TextStyle(
                                color: AppColors.gold,
                                fontWeight: FontWeight.w900,
                                fontSize: 18)),
                      ])),
                ))
            .toList(),
      );

  Widget _card(Widget child) => Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.borderSoft),
        ),
        child: Material(
          type: MaterialType.transparency,
          child: child,
        ),
      );

  Widget _badge(String label) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: Colors.white12),
        ),
        child: Text(label,
            style: const TextStyle(
                fontSize: 10,
                color: Colors.white70,
                fontWeight: FontWeight.w800)),
      );

  Widget _detailLine(String label, Object? value) {
    final text = value?.toString().trim() ?? '';
    if (text.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label,
            style: const TextStyle(color: Colors.white54, fontSize: 12)),
        const SizedBox(height: 2),
        Text(text, style: const TextStyle(height: 1.35)),
      ]),
    );
  }

  Widget _error(String error) => Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: _card(Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.error_outline, color: Colors.redAccent, size: 42),
            const SizedBox(height: 12),
            const Text('Founder preview bundle could not be loaded.'),
            const SizedBox(height: 8),
            Text(error, textAlign: TextAlign.center),
          ])),
        ),
      );
}
