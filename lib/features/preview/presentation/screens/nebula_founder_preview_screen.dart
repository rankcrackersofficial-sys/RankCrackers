import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:collection/collection.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';

class NebulaFounderPreviewScreen extends StatefulWidget {
  const NebulaFounderPreviewScreen({super.key});

  @override
  State<NebulaFounderPreviewScreen> createState() =>
      _NebulaFounderPreviewScreenState();
}

class _NebulaFounderPreviewScreenState
    extends State<NebulaFounderPreviewScreen> {
  late final Future<Map<String, dynamic>> _bundle = _loadBundle();
  String _query = '';
  String _subject = 'ALL';

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
            return DefaultTabController(
              length: 4,
              child: Column(
                children: [
                  _header(data['manifest'] as Map<String, dynamic>),
                  const TabBar(
                    isScrollable: true,
                    tabs: [
                      Tab(text: 'Syllabus'),
                      Tab(text: 'Crucible'),
                      Tab(text: 'DigiBook'),
                      Tab(text: 'Assessment'),
                    ],
                  ),
                  Expanded(
                    child: TabBarView(
                      children: [
                        _syllabus(data['syllabus'] as Map<String, dynamic>,
                            data['manifest'] as Map<String, dynamic>),
                        _crucible(data['crucible'] as Map<String, dynamic>),
                        _digibook(data['digibook'] as Map<String, dynamic>),
                        _assessment(data['assessment'] as Map<String, dynamic>),
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
        Text('JEE Main 2027 - Internal Preview',
            style: AppTypography.hero.copyWith(fontSize: 23)),
        const SizedBox(height: 6),
        Text(
          '${copy['syllabus']} ${copy['crucible']} ${copy['digibook']} ${copy['assessment']}',
          style: const TextStyle(color: Colors.white70, height: 1.35),
        ),
      ]),
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
    final held =
        Map<String, dynamic>.from(manifest['heldDiagnostics'] as Map? ?? {});
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
          for (final subject in visible)
            _subjectTile(Map<String, dynamic>.from(subject)),
          _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Founder diagnostics', style: AppTypography.label),
            const SizedBox(height: 8),
            Text('Held/excluded atoms: ${held['count'] ?? 0}'),
            Text('Reasons: ${held['byReason'] ?? {}}'),
            const SizedBox(height: 6),
            const Text(
                'These records are hidden from the normal student syllabus tree.'),
          ])),
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
              subtitle: Text(raw['atomId']?.toString() ?? ''),
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
    return ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
        children: [
          _truth('STRUCTURE PREVIEW - not an active learner schedule.',
              'All preview-eligible atoms are allocated exactly once. Tests remain structural slots until reviewed question pools exist.'),
          const SizedBox(height: 12),
          _metrics([
            ['Cycle', '${plan['cycleDays']} days'],
            ['Phases', plan['phaseCount']],
            ['Schedules', plan['scheduleCount']],
            ['Duplicate allocation', allocation['duplicateAllocationCount']],
          ]),
          const SizedBox(height: 14),
          Text('7-phase structure', style: AppTypography.label),
          const SizedBox(height: 8),
          for (final raw in phases) _phaseCard(Map<String, dynamic>.from(raw)),
          const SizedBox(height: 14),
          Text('42 schedule cards', style: AppTypography.label),
          const SizedBox(height: 8),
          for (final raw in schedules)
            _scheduleCard(Map<String, dynamic>.from(raw)),
          _card(const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Test readiness summary'),
                SizedBox(height: 8),
                Text('7 macro-test slots: NOT_READY'),
                Text('1 major-test slot: NOT_READY'),
                Text('Reason: REVIEWED_QUESTION_POOL_NOT_AVAILABLE'),
              ])),
        ]);
  }

  Widget _phaseCard(Map<String, dynamic> phase) {
    return _card(Row(children: [
      CircleAvatar(child: Text('${phase['phaseNumber']}')),
      const SizedBox(width: 12),
      Expanded(
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(phase['title']?.toString() ?? 'Phase', style: AppTypography.label),
        Text(
            '${phase['atomCount']} atoms | ${phase['estimatedCoverage']}% coverage'),
      ])),
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
                style: AppTypography.label)),
        _badge(schedule['scheduleReadiness']?.toString() ??
            'INTERNAL_REVIEW_REQUIRED'),
      ]),
      const SizedBox(height: 8),
      Text('Phase: ${schedule['phaseId']}'),
      Text(
          'Syllabus atoms allocated: ${(schedule['assignedAtomIds'] as List? ?? []).length}'),
      Text('Subject mix: ${schedule['subjectMix'] ?? {}}'),
      Text(
          'DigiBook available: ${schedule['digibookAvailableCount']} | In progress: ${schedule['digibookMissingCount']}'),
      Text(
          'Question pool ready: ${schedule['questionPoolReadyCount']} | Micro test: ${schedule['microTestStatus']}'),
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
                style: AppTypography.hero.copyWith(fontSize: 22)),
            const SizedBox(height: 4),
            Text(unit['subtitle']?.toString() ?? '',
                style: const TextStyle(color: Colors.white70)),
            const SizedBox(height: 12),
            _metrics([
              ['Sections', unit['sectionCount']],
              ['Formulas', unit['formulaCount']],
              ['Examples', examples.length],
              ['Self-checks', checks.length],
            ]),
          ])),
          _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Concept reader', style: AppTypography.label),
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
          _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Worked examples', style: AppTypography.label),
            const SizedBox(height: 8),
            for (final raw in examples)
              ExpansionTile(
                tilePadding: EdgeInsets.zero,
                title: Text(raw['concept']?.toString() ?? 'Example'),
                subtitle: Text(raw['finalResult']?.toString() ?? ''),
                children: [
                  _kv('Given', raw['given']),
                  _kv('Find', raw['find']),
                  _kv('Principle', raw['principleUsed']),
                  _kv('Common error', raw['commonError']),
                ],
              ),
          ])),
          _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Self-check screen', style: AppTypography.label),
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
          _card(Text(missing['reason']?.toString() ?? 'Content in progress')),
        ]);
  }

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
            ['Answer review', assessment['answerReviewStatus']],
            [
              'Student ready',
              assessment['studentPublishReady'] == true ? 'YES' : 'NO'
            ],
          ]),
          const SizedBox(height: 12),
          _card(Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(assessment['title']?.toString() ?? 'Assessment Preview',
                style: AppTypography.label),
            const SizedBox(height: 10),
            for (final raw in items)
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.assignment_outlined,
                    color: AppColors.gold),
                title: Text('${raw['itemId']} - ${raw['format']}'),
                subtitle: Text(raw['stem']?.toString() ?? '',
                    maxLines: 5, overflow: TextOverflow.ellipsis),
              ),
            const Divider(),
            const Text(
                'No production attempt. No marks persistence. No official answer-key claim.'),
          ])),
        ]);
  }

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
        child: child,
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

  Widget _kv(String label, Object? value) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          SizedBox(
              width: 88,
              child:
                  Text(label, style: const TextStyle(color: Colors.white54))),
          Expanded(child: Text(value?.toString() ?? '')),
        ]),
      );

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
