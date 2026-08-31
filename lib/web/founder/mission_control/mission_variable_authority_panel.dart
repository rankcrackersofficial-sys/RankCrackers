import 'dart:convert';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/material.dart';

class MissionVariableAuthorityPanel extends StatefulWidget {
  const MissionVariableAuthorityPanel({super.key});

  @override
  State<MissionVariableAuthorityPanel> createState() =>
      _MissionVariableAuthorityPanelState();
}

class _MissionVariableAuthorityPanelState
    extends State<MissionVariableAuthorityPanel> {
  final _editor = TextEditingController();
  final _reason = TextEditingController();
  String? _missionId;
  Map<String, dynamic>? _mission;
  bool _realmPresent = false;
  bool _saving = false;
  String? _message;
  bool _error = false;

  @override
  void dispose() {
    _editor.dispose();
    _reason.dispose();
    super.dispose();
  }

  Future<void> _selectMission(String id, Map<String, dynamic> catalogData) async {
    final realmDoc = await FirebaseFirestore.instance.collection('mission_realms').doc(id).get();
    final data = realmDoc.data() ?? catalogData;
    final variables = Map<String, dynamic>.from(data['missionVariables'] ?? {});
    setState(() {
      _missionId = id;
      _mission = data;
      _realmPresent = realmDoc.exists;
      _editor.text = const JsonEncoder.withIndent('  ').convert(variables);
      _message = realmDoc.exists
          ? null
          : 'REALM_MISSING / REPAIR_REQUIRED: inspection is available, but mutation is blocked.';
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
        _message = 'Mutation blocked: canonical mission realm is missing.';
      });
      return;
    }
    if (_reason.text.trim().length < 12) {
      setState(() {
        _error = true;
        _message =
            'A specific change reason of at least 12 characters is required.';
      });
      return;
    }
    Map<String, dynamic> variables;
    try {
      final decoded = jsonDecode(_editor.text);
      if (decoded is! Map)
        throw const FormatException('Root must be an object.');
      variables = Map<String, dynamic>.from(decoded);
    } catch (e) {
      setState(() {
        _error = true;
        _message = 'Invalid JSON: $e';
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
          'expectedExamYear': mission['exam_year'] ?? mission['examYear'] ?? mission['year'],
          'expectedExamCategory': mission['exam_category'] ?? mission['examCategory'],
          'reason': _reason.text.trim(),
          'requestId': requestId,
        },
      });
      final data = Map<String, dynamic>.from(result.data as Map);
      setState(() {
        _mission = {
          ...mission,
          'missionVariables': variables,
          'missionVariableVersion': data['version']
        };
        _message = data['idempotent'] == true
            ? 'No duplicate write: this request was already applied.'
            : 'Mission variables saved as version ${data['version']}. Student projection updated atomically.';
        _reason.clear();
      });
    } catch (e) {
      setState(() {
        _error = true;
        _message = 'Mutation rejected: $e';
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
          width: 340,
          child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
            stream: FirebaseFirestore.instance
                .collection('student_mission_catalog')
                .snapshots(),
            builder: (context, snapshot) {
              if (snapshot.hasError)
                return Center(child: Text('${snapshot.error}'));
              if (!snapshot.hasData)
                return const Center(child: CircularProgressIndicator());
              return ListView(
                children: snapshot.data!.docs.map((doc) {
                  final data = doc.data();
                  return ListTile(
                    selected: doc.id == _missionId,
                    title: Text((data['displayName'] ?? data['title'] ?? data['name'] ?? data['exam_name'] ?? doc.id).toString()),
                    subtitle: Text(
                        '${data['examCategory'] ?? data['exam_category'] ?? 'category pending'} • ${data['examYear'] ?? data['exam_year'] ?? data['year'] ?? 'year pending'}'),
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
                  child: Text(
                      'Select a mission to inspect its canonical variables.'))
              : Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text('MISSION VARIABLE AUTHORITY — $_missionId',
                          style: Theme.of(context).textTheme.titleLarge),
                      const SizedBox(height: 8),
                      const Text(
                        'Allowed keys are the canonical 11 source-backed variable packs plus mediumPolicy, supportedMediums, and defaultMedium. Published content locks make changes fail closed.',
                      ),
                      const SizedBox(height: 16),
                      Expanded(
                        child: TextField(
                          controller: _editor,
                          expands: true,
                          maxLines: null,
                          minLines: null,
                          style: const TextStyle(
                              fontFamily: 'monospace', fontSize: 12),
                          decoration: const InputDecoration(
                            border: OutlineInputBorder(),
                            labelText: 'Canonical missionVariables JSON',
                            alignLabelWithHint: true,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _reason,
                        decoration: const InputDecoration(
                          border: OutlineInputBorder(),
                          labelText: 'Founder change reason (required)',
                        ),
                      ),
                      if (_message != null) ...[
                        const SizedBox(height: 10),
                        Text(_message!,
                            style: TextStyle(
                                color: _error
                                    ? Colors.redAccent
                                    : Colors.greenAccent)),
                      ],
                      const SizedBox(height: 12),
                      FilledButton.icon(
                        onPressed: (_saving || !_realmPresent) ? null : _save,
                        icon: _saving
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child:
                                    CircularProgressIndicator(strokeWidth: 2))
                            : const Icon(Icons.verified_user_outlined),
                        label: Text(_saving
                            ? 'VALIDATING…'
                            : 'VALIDATE AND SAVE ATOMICALLY'),
                      ),
                    ],
                  ),
                ),
        ),
      ],
    );
  }
}
