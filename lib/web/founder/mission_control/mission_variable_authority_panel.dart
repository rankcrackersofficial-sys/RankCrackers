import 'dart:convert';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/material.dart';

class MissionVariableAuthorityPanel extends StatefulWidget {
  const MissionVariableAuthorityPanel({super.key, this.initialMissionId});
  final String? initialMissionId;

  @override
  State<MissionVariableAuthorityPanel> createState() =>
      _MissionVariableAuthorityPanelState();
}

class _MissionVariableAuthorityPanelState
    extends State<MissionVariableAuthorityPanel> {
  static const _packLabels = <String, String>{
    'vacancy_variables': 'Vacancies',
    'eligibility_variables': 'Eligibility',
    'paper_variables': 'Exam Papers',
    'category_variables': 'Categories',
    'subject_variables': 'Subjects',
    'department_variables': 'Departments',
    'fee_variables': 'Fees',
    'date_variables': 'Important Dates',
    'relaxation_variables': 'Relaxations',
    'link_variables': 'Official Links',
    'amendment_variables': 'Amendments',
  };
  static const _policies = ['ENGLISH_ONLY', 'HINDI_ONLY', 'BILINGUAL'];
  static const _mediums = ['ENGLISH', 'HINDI'];

  final _editor = TextEditingController();
  final _reason = TextEditingController();
  String? _missionId;
  Map<String, dynamic>? _mission;
  bool _realmPresent = false;
  bool _saving = false;
  String? _message;
  bool _error = false;
  bool _initialSelectionScheduled = false;

  @override
  void dispose() {
    _editor.dispose();
    _reason.dispose();
    super.dispose();
  }

  Map<String, dynamic> _variables() {
    try {
      final decoded = jsonDecode(_editor.text);
      return decoded is Map
          ? Map<String, dynamic>.from(decoded)
          : <String, dynamic>{};
    } catch (_) {
      return <String, dynamic>{};
    }
  }

  void _replaceVariables(Map<String, dynamic> variables) {
    setState(
      () =>
          _editor.text = const JsonEncoder.withIndent('  ').convert(variables),
    );
  }

  void _setPolicy(String policy) {
    final variables = _variables();
    variables['mediumPolicy'] = policy;
    if (policy == 'ENGLISH_ONLY') {
      variables['supportedMediums'] = ['ENGLISH'];
      variables['defaultMedium'] = 'ENGLISH';
    } else if (policy == 'HINDI_ONLY') {
      variables['supportedMediums'] = ['HINDI'];
      variables['defaultMedium'] = 'HINDI';
    } else {
      variables['supportedMediums'] = ['ENGLISH', 'HINDI'];
      if (!_mediums.contains(variables['defaultMedium']))
        variables['defaultMedium'] = 'ENGLISH';
    }
    _replaceVariables(variables);
  }

  void _setDefaultMedium(String medium) {
    final variables = _variables();
    variables['defaultMedium'] = medium;
    _replaceVariables(variables);
  }

  void _updatePackItem(String packKey, int index, String field, dynamic value) {
    final variables = _variables();
    final pack = List<dynamic>.from(variables[packKey] ?? const []);
    if (index >= pack.length || pack[index] is! Map) return;
    final item = Map<String, dynamic>.from(pack[index] as Map);
    item[field] = value;
    pack[index] = item;
    variables[packKey] = pack;
    _replaceVariables(variables);
  }

  Future<void> _selectMission(
    String id,
    Map<String, dynamic> catalogData,
  ) async {
    final realmDoc = await FirebaseFirestore.instance
        .collection('mission_realms')
        .doc(id)
        .get();
    final data = realmDoc.data() ?? catalogData;
    final variables = Map<String, dynamic>.from(data['missionVariables'] ?? {});
    setState(() {
      _missionId = id;
      _mission = data;
      _realmPresent = realmDoc.exists;
      _editor.text = const JsonEncoder.withIndent('  ').convert(variables);
      _message = realmDoc.exists
          ? null
          : 'VARIABLE CHANGES LOCKED — Authority repair required.';
      _error = !realmDoc.exists;
    });
  }

  Future<void> _save() async {
    final id = _missionId;
    final mission = _mission;
    if (id == null || mission == null || _saving) return;
    if (!_realmPresent) {
      setState(() {
        _error = true;
        _message = 'VARIABLE CHANGES LOCKED — Authority repair required.';
      });
      return;
    }
    if (_reason.text.trim().length < 12) {
      setState(() {
        _error = true;
        _message = 'Add a specific change reason of at least 12 characters.';
      });
      return;
    }
    Map<String, dynamic> variables;
    try {
      final decoded = jsonDecode(_editor.text);
      if (decoded is! Map)
        throw const FormatException('Root must be an object.');
      variables = Map<String, dynamic>.from(decoded);
    } catch (error) {
      setState(() {
        _error = true;
        _message = 'Technical data is invalid: $error';
      });
      return;
    }

    setState(() {
      _saving = true;
      _message = null;
      _error = false;
    });
    try {
      final requestId = 'web-${DateTime.now().microsecondsSinceEpoch}';
      final result = await FirebaseFunctions.instanceFor(region: 'us-central1')
          .httpsCallable('handleSentinelAction')
          .call({
            'action': 'update_mission_variables',
            'recruitmentId': id,
            'payload': {
              'missionVariables': variables,
              'expectedVersion': mission['missionVariableVersion'] ?? 0,
              'expectedExamYear':
                  mission['exam_year'] ??
                  mission['examYear'] ??
                  mission['year'],
              'expectedExamCategory':
                  mission['exam_category'] ?? mission['examCategory'],
              'reason': _reason.text.trim(),
              'requestId': requestId,
            },
          });
      final data = Map<String, dynamic>.from(result.data as Map);
      setState(() {
        _mission = {
          ...mission,
          'missionVariables': variables,
          'missionVariableVersion': data['version'],
        };
        _message = data['idempotent'] == true
            ? 'No duplicate write: this request was already applied.'
            : 'Mission variables saved as version ${data['version']}. Student projection updated atomically.';
        _reason.clear();
      });
    } catch (error) {
      setState(() {
        _error = true;
        _message = 'Change rejected: $error';
      });
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(
          width: 300,
          child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
            stream: FirebaseFirestore.instance
                .collection('mission_realms')
                .snapshots(),
            builder: (context, snapshot) {
              if (snapshot.hasError)
                return Center(child: Text('${snapshot.error}'));
              if (!snapshot.hasData)
                return const Center(child: CircularProgressIndicator());
              if (!_initialSelectionScheduled &&
                  _mission == null &&
                  widget.initialMissionId != null) {
                final matches = snapshot.data!.docs
                    .where((doc) => doc.id == widget.initialMissionId)
                    .toList();
                if (matches.isNotEmpty) {
                  _initialSelectionScheduled = true;
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    if (mounted)
                      _selectMission(matches.first.id, matches.first.data());
                  });
                }
              }
              return ListView(
                children: snapshot.data!.docs.map((doc) {
                  final data = doc.data();
                  return ListTile(
                    selected: doc.id == _missionId,
                    title: Text(
                      (data['displayName'] ??
                              data['title'] ??
                              data['name'] ??
                              doc.id)
                          .toString(),
                    ),
                    subtitle: Text(
                      '${data['examCategory'] ?? data['exam_category'] ?? 'Category pending'} • ${data['examYear'] ?? data['exam_year'] ?? data['year'] ?? 'Year pending'}',
                    ),
                    trailing: Text('v${data['missionVariableVersion'] ?? 0}'),
                    onTap: () => _selectMission(doc.id, data),
                  );
                }).toList(),
              );
            },
          ),
        ),
        const VerticalDivider(width: 1),
        Expanded(
          child: _missionId == null
              ? const Center(
                  child: Text('Select a mission to manage its variables.'),
                )
              : _buildEditor(context),
        ),
      ],
    );
  }

  Widget _buildEditor(BuildContext context) {
    final variables = _variables();
    final policy = _policies.contains(variables['mediumPolicy'])
        ? variables['mediumPolicy'] as String
        : null;
    final supported = List<String>.from(
      variables['supportedMediums'] ?? const [],
    );
    final allowedDefaults = supported.where(_mediums.contains).toList();
    final defaultMedium = allowedDefaults.contains(variables['defaultMedium'])
        ? variables['defaultMedium'] as String
        : null;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'MISSION VARIABLES',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    Text(
                      _missionId!,
                      style: const TextStyle(
                        fontSize: 10,
                        color: Colors.white38,
                      ),
                    ),
                  ],
                ),
              ),
              if (!_realmPresent)
                const Chip(
                  avatar: Icon(Icons.lock_outline, size: 15),
                  label: Text('CHANGES LOCKED'),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Expanded(
            child: ListView(
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'LANGUAGE DELIVERY',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFFE8C766),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: DropdownButtonFormField<String>(
                                initialValue: policy,
                                decoration: const InputDecoration(
                                  labelText: 'Medium Policy',
                                  border: OutlineInputBorder(),
                                ),
                                items: _policies
                                    .map(
                                      (value) => DropdownMenuItem(
                                        value: value,
                                        child: Text(value.replaceAll('_', ' ')),
                                      ),
                                    )
                                    .toList(),
                                onChanged: _realmPresent
                                    ? (value) {
                                        if (value != null) _setPolicy(value);
                                      }
                                    : null,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: InputDecorator(
                                decoration: const InputDecoration(
                                  labelText: 'Supported Mediums',
                                  border: OutlineInputBorder(),
                                ),
                                child: Text(
                                  supported.isEmpty
                                      ? 'NOT CONFIGURED'
                                      : supported.join(' + '),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: DropdownButtonFormField<String>(
                                initialValue: defaultMedium,
                                decoration: const InputDecoration(
                                  labelText: 'Default Medium',
                                  border: OutlineInputBorder(),
                                ),
                                items: allowedDefaults
                                    .map(
                                      (value) => DropdownMenuItem(
                                        value: value,
                                        child: Text(value),
                                      ),
                                    )
                                    .toList(),
                                onChanged: _realmPresent
                                    ? (value) {
                                        if (value != null)
                                          _setDefaultMedium(value);
                                      }
                                    : null,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  'VARIABLE PACKS',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFFE8C766),
                  ),
                ),
                const SizedBox(height: 6),
                ..._packLabels.entries.map(
                  (entry) => _packSection(entry.key, entry.value, variables),
                ),
                const SizedBox(height: 8),
                ExpansionTile(
                  tilePadding: EdgeInsets.zero,
                  leading: const Icon(Icons.code, size: 18),
                  title: const Text('ADVANCED TECHNICAL VIEW'),
                  subtitle: const Text(
                    'Raw canonical data for diagnostics only.',
                  ),
                  children: [
                    SizedBox(
                      height: 260,
                      child: TextField(
                        controller: _editor,
                        expands: true,
                        maxLines: null,
                        minLines: null,
                        enabled: _realmPresent,
                        style: const TextStyle(
                          fontFamily: 'monospace',
                          fontSize: 11,
                        ),
                        decoration: const InputDecoration(
                          border: OutlineInputBorder(),
                          labelText: 'Canonical data',
                          alignLabelWithHint: true,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _reason,
            enabled: _realmPresent,
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              labelText: 'Founder change reason (required)',
            ),
          ),
          if (_message != null) ...[
            const SizedBox(height: 8),
            Text(
              _message!,
              style: TextStyle(
                color: _error ? Colors.orangeAccent : Colors.greenAccent,
              ),
            ),
          ],
          const SizedBox(height: 10),
          FilledButton.icon(
            onPressed: (_saving || !_realmPresent) ? null : _save,
            icon: _saving
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.verified_user_outlined),
            label: Text(_saving ? 'VALIDATING…' : 'REVIEW AND SAVE CHANGES'),
          ),
        ],
      ),
    );
  }

  Widget _packSection(
    String key,
    String label,
    Map<String, dynamic> variables,
  ) {
    final pack = List<dynamic>.from(variables[key] ?? const []);
    return Card(
      child: ExpansionTile(
        dense: true,
        title: Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
        trailing: Text(
          '${pack.length} item${pack.length == 1 ? '' : 's'}',
          style: const TextStyle(color: Colors.white54),
        ),
        children: pack.isEmpty
            ? const [
                Padding(
                  padding: EdgeInsets.fromLTRB(16, 0, 16, 14),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'No source-backed items.',
                      style: TextStyle(color: Colors.white38),
                    ),
                  ),
                ),
              ]
            : List.generate(pack.length, (index) {
                final item = Map<String, dynamic>.from(pack[index] as Map);
                final statuses = ['pending', 'approved', 'edited', 'sent_back'];
                final status =
                    statuses.contains(item['founder_verification_status'])
                    ? item['founder_verification_status'] as String
                    : 'pending';
                return Padding(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
                  child: Row(
                    children: [
                      Expanded(
                        flex: 2,
                        child: Text(
                          item['label']?.toString() ??
                              item['key']?.toString() ??
                              'Unnamed item',
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        flex: 3,
                        child: TextFormField(
                          initialValue: item['value']?.toString() ?? '',
                          enabled: _realmPresent,
                          decoration: const InputDecoration(
                            labelText: 'Value',
                            isDense: true,
                            border: OutlineInputBorder(),
                          ),
                          onChanged: (value) =>
                              _updatePackItem(key, index, 'value', value),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        flex: 2,
                        child: DropdownButtonFormField<String>(
                          initialValue: status,
                          decoration: const InputDecoration(
                            labelText: 'Review',
                            isDense: true,
                            border: OutlineInputBorder(),
                          ),
                          items: statuses
                              .map(
                                (value) => DropdownMenuItem(
                                  value: value,
                                  child: Text(value.replaceAll('_', ' ')),
                                ),
                              )
                              .toList(),
                          onChanged: _realmPresent
                              ? (value) {
                                  if (value != null)
                                    _updatePackItem(
                                      key,
                                      index,
                                      'founder_verification_status',
                                      value,
                                    );
                                }
                              : null,
                        ),
                      ),
                    ],
                  ),
                );
              }),
      ),
    );
  }
}
