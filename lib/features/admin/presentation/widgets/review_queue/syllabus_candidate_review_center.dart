import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/material.dart';

class SyllabusCandidateReviewCenter extends StatefulWidget {
  const SyllabusCandidateReviewCenter({super.key});

  @override
  State<SyllabusCandidateReviewCenter> createState() => _SyllabusCandidateReviewCenterState();
}

class _SyllabusCandidateReviewCenterState extends State<SyllabusCandidateReviewCenter> {
  final _mission = TextEditingController();
  final _subject = TextEditingController();
  String _kind = 'official_syllabus_candidates';
  bool _loading = false;

  @override
  void dispose() {
    _mission.dispose();
    _subject.dispose();
    super.dispose();
  }

  Future<void> _review(String nodeId, String decision) async {
    final reason = TextEditingController();
    final accepted = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('${decision == 'APPROVE' ? 'Approve' : 'Reject'} syllabus candidate'),
        content: TextField(
          controller: reason,
          minLines: 2,
          maxLines: 4,
          decoration: const InputDecoration(labelText: 'Review reason (required)'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Submit')),
        ],
      ),
    );
    if (accepted != true || reason.text.trim().isEmpty) { reason.dispose(); return; }
    setState(() => _loading = true);
    try {
      await FirebaseFunctions.instance.httpsCallable('reviewSyllabusCandidate').call({
        'missionId': _mission.text.trim(),
        'nodeId': nodeId,
        'decision': decision,
        'reason': reason.text.trim(),
      });
    } on FirebaseFunctionsException catch (error) {
      if (mounted) { ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Review denied: ${error.message ?? error.code}')),
      ); }
    } catch (error) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Review failed: $error')),
      ); }
    } finally {
      reason.dispose();
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final missionId = _mission.text.trim();
    final subjectId = _subject.text.trim();
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('MISSION SYLLABUS REVIEW', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 8,
            children: [
              SizedBox(
                width: 240,
                child: TextField(
                  controller: _mission,
                  decoration: const InputDecoration(labelText: 'Assigned mission ID'),
                  onSubmitted: (_) => setState(() {}),
                ),
              ),
              SizedBox(
                width: 200,
                child: TextField(
                  controller: _subject,
                  decoration: const InputDecoration(labelText: 'Assigned subject ID'),
                  onSubmitted: (_) => setState(() {}),
                ),
              ),
              DropdownButton<String>(
                value: _kind,
                items: const [
                  DropdownMenuItem(value: 'official_syllabus_candidates', child: Text('Official extraction')),
                  DropdownMenuItem(value: 'derived_syllabus_candidates', child: Text('Micro / atomic decomposition')),
                ],
                onChanged: (value) => setState(() => _kind = value ?? _kind),
              ),
              FilledButton(onPressed: () => setState(() {}), child: const Text('Load queue')),
            ],
          ),
          const SizedBox(height: 12),
          Expanded(
            child: missionId.isEmpty || subjectId.isEmpty
                ? const Center(child: Text('Enter the mission and subject assigned to your reviewer account.'))
                : StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                    stream: FirebaseFirestore.instance
                        .collection('mission_realms').doc(missionId).collection(_kind)
                        .where('subjectId', isEqualTo: subjectId)
                        .where('reviewState', isEqualTo: _kind == 'official_syllabus_candidates'
                            ? 'PENDING_REVIEW' : 'PENDING_FACULTY_REVIEW')
                        .snapshots(),
                    builder: (context, snapshot) {
                      if (snapshot.hasError) return Center(child: Text('Queue unavailable: ${snapshot.error}'));
                      if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
                      final docs = snapshot.data!.docs;
                      if (docs.isEmpty) return const Center(child: Text('No pending candidates for this scope.'));
                      return ListView.builder(
                        itemCount: docs.length,
                        itemBuilder: (context, index) {
                          final doc = docs[index];
                          final data = doc.data();
                          final title = data['canonicalTitle'] ?? data['title'] ?? '(untitled candidate)';
                          final pages = data['sourcePages'] ?? [data['sourcePage']];
                          return Card(
                            child: ListTile(
                              title: Text('$title'),
                              subtitle: Text(
                                'Mission: $missionId · Subject: ${data['subjectId']}\n'
                                'Level: ${data['nodeType'] ?? data['level']} · Pages: $pages\n'
                                '${data['scopeRationale'] ?? data['sourceTextAnchor'] ?? ''}',
                              ),
                              isThreeLine: true,
                              trailing: _loading ? const SizedBox(
                                width: 24, height: 24, child: CircularProgressIndicator(),
                              ) : Wrap(
                                spacing: 4,
                                children: [
                                  IconButton(
                                    tooltip: 'Approve',
                                    onPressed: () => _review(doc.id, 'APPROVE'),
                                    icon: const Icon(Icons.check_circle_outline),
                                  ),
                                  IconButton(
                                    tooltip: 'Reject',
                                    onPressed: () => _review(doc.id, 'REJECT'),
                                    icon: const Icon(Icons.cancel_outlined),
                                  ),
                                ],
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
