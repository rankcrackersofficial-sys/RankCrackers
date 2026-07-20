import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../shared/rc_colors.dart';
import '../../shared/rc_loaders.dart';
import '../../shared/rc_panel.dart';
import '../../shared/unified_command_console.dart';

class SyllabusAtomVerificationTab extends StatefulWidget {
  final String missionId;
  final String? initialDocumentId;
  final List<QueryDocumentSnapshot<Map<String, dynamic>>> variables;
  final ConsoleRoleMode roleMode;
  final Map<String, dynamic>? permissions;
  final String? taskId;

  const SyllabusAtomVerificationTab({
    super.key,
    required this.missionId,
    this.initialDocumentId,
    required this.variables,
    this.roleMode = ConsoleRoleMode.founder,
    this.permissions,
    this.taskId,
  });

  @override
  State<SyllabusAtomVerificationTab> createState() =>
      _SyllabusAtomVerificationTabState();
}

class _SyllabusAtomVerificationTabState
    extends State<SyllabusAtomVerificationTab> {
  String? _documentFilter;
  String _statusFilter = 'all';
  String _subjectFilter = 'all';
  String _sourceFilter = 'all';
  String _approvalFilter = 'all';
  String _searchQuery = '';
  final ScrollController _horizontalTableController = ScrollController();
  final ScrollController _verticalTableController = ScrollController();

  @override
  void initState() {
    super.initState();
    _documentFilter = widget.initialDocumentId;
  }

  bool get _isFounder => widget.roleMode == ConsoleRoleMode.founder;

  @override
  void dispose() {
    _horizontalTableController.dispose();
    _verticalTableController.dispose();
    super.dispose();
  }

  bool _isSourceBacked(Map<String, dynamic> data) {
    return data['extractionRunType'] == 'SOURCE_TRACEABLE_REEXTRACTION' ||
        data['legacyRun'] == false ||
        data['sourceTraceQuality'] == 'GOOD_TEXT_NO_PAGE';
  }

  String _statusOf(Map<String, dynamic> data) {
    return (data['verification_status'] ??
            data['verificationStatus'] ??
            'verification_pending')
        .toString();
  }

  String _approvalOf(Map<String, dynamic> data) {
    final value = data['founderApproved'] ?? data['founder_approved'];
    if (value == true) return 'approved';
    if (value == false) return 'not_approved';
    return 'unknown';
  }

  Future<void> _updateSourceAtomReview(
    String atomId,
    Map<String, dynamic> data,
    String nextStatus, {
    String? note,
  }) async {
    if (!_isFounder || !_isSourceBacked(data)) return;

    final bool approved = nextStatus == 'verified';
    final String canonicalStatus = nextStatus == 'needs_review'
        ? 'NEEDS_REVIEW'
        : nextStatus == 'verified'
            ? 'VERIFIED'
            : 'REJECTED';

    final existingNote = (data['reviewNote'] ?? data['founderReviewNote'])?.toString();
    final normalizedNote = note != null && note.trim().isNotEmpty
        ? note.trim()
        : (existingNote != null && existingNote.trim().isNotEmpty ? existingNote.trim() : null);
    final updates = <String, dynamic>{
      'verificationStatus': canonicalStatus,
      'verification_status': nextStatus,
      'founderApproved': approved,
      'founder_approved': approved,
      'reviewedAt': FieldValue.serverTimestamp(),
      'reviewedBy': FirebaseAuth.instance.currentUser?.uid ?? 'founder_web',
      'reviewAction': canonicalStatus,
      'reviewNote': normalizedNote,
      'founderReviewNote': normalizedNote,
      'reviewBatchStatus': canonicalStatus,
      'status': canonicalStatus,
      'studentTopicNodePublished': false,
      'updatedAt': FieldValue.serverTimestamp(),
    };

    try {
      await FirebaseFirestore.instance
          .collection('mission_realms')
          .doc(widget.missionId)
          .collection('syllabus_atoms')
          .doc(atomId)
          .update(updates);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Review status updated to ${canonicalStatus.replaceAll('_', ' ')}.'),
            backgroundColor: rcGreen,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Review update failed: $e'), backgroundColor: rcRed),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _buildHeader(),
        _buildReviewGuidance(),
        _buildFilters(),
        Expanded(child: _buildVerificationTable()),
      ],
    );
  }

  Widget _buildHeader() {
    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance
          .collection('mission_realms')
          .doc(widget.missionId)
          .collection('syllabus_atoms')
          .snapshots(),
      builder: (context, snapshot) {
        final docs = snapshot.data?.docs ?? [];
        final total = docs.length;
        final sourceBacked = docs.where((d) => _isSourceBacked(d.data())).length;
        final legacy = total - sourceBacked;
        final needsReview = docs.where((d) => _statusOf(d.data()) == 'needs_review').length;
        final verified = docs.where((d) => _statusOf(d.data()) == 'verified').length;
        final rejected = docs.where((d) => _statusOf(d.data()) == 'rejected').length;

        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          color: rcSurface.withValues(alpha: 0.5),
          child: Row(
            children: [
              _stat('Total Atoms', total.toString(), Colors.white),
              const SizedBox(width: 28),
              _stat('RX2 Source-Backed', sourceBacked.toString(), rcGold),
              const SizedBox(width: 28),
              _stat('Legacy', legacy.toString(), Colors.white38),
              const SizedBox(width: 28),
              _stat('Needs Review', needsReview.toString(), rcGold),
              const SizedBox(width: 28),
              _stat('Verified', verified.toString(), rcGreen),
              const SizedBox(width: 28),
              _stat('Rejected', rejected.toString(), rcRed),
            ],
          ),
        );
      },
    );
  }

  Widget _stat(String label, String value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(), style: const TextStyle(color: Colors.white24, fontSize: 9, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text(value, style: TextStyle(color: color, fontSize: 18, fontWeight: FontWeight.w900)),
      ],
    );
  }

  Widget _buildReviewGuidance() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: RcPanel(
        child: Row(
          children: [
            const Icon(Icons.fact_check_rounded, color: rcGold, size: 22),
            const SizedBox(width: 12),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('FOUNDER REVIEW QUEUE', style: TextStyle(color: rcGold, fontSize: 12, fontWeight: FontWeight.w900)),
                  SizedBox(height: 6),
                  Text(
                    'Review source-backed RX2 atoms only. Legacy atoms stay read-only. Verification does not publish to students or write topic_nodes. Scroll horizontally to view source, status, and review actions.',
                    style: TextStyle(color: Colors.white54, fontSize: 12),
                  ),
                  SizedBox(height: 4),
                  Text('GOOD_TEXT_NO_PAGE is allowed for review, but student publish remains blocked until page-proof or explicit override policy.', style: TextStyle(color: Colors.white30, fontSize: 10)),
                ],
              ),
            ),
            _legendChip('SOURCE-BACKED', rcGold),
            const SizedBox(width: 8),
            _legendChip('LEGACY READ-ONLY', Colors.white30),
          ],
        ),
      ),
    );
  }

  Widget _legendChip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        border: Border.all(color: color.withValues(alpha: 0.35)),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(label, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildFilters() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: RcPanel(
        child: Wrap(
          spacing: 12,
          runSpacing: 12,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            SizedBox(
              width: 520,
              child: TextField(
                onChanged: (v) => setState(() => _searchQuery = v.toLowerCase()),
                decoration: const InputDecoration(hintText: 'Search atom title, hierarchy, source excerpt, or run id...', prefixIcon: Icon(Icons.search), isDense: true),
              ),
            ),
            _dropdown('Source', _sourceFilter, const ['all', 'source_backed', 'legacy'], (v) => setState(() => _sourceFilter = v!)),
            _dropdown('Subject', _subjectFilter, const ['all', 'Physics', 'Chemistry', 'Biology', 'Mathematics'], (v) => setState(() => _subjectFilter = v!)),
            _dropdown('Status', _statusFilter, const ['all', 'needs_review', 'verified', 'rejected', 'verification_pending'], (v) => setState(() => _statusFilter = v!)),
            _dropdown('Approval', _approvalFilter, const ['all', 'approved', 'not_approved', 'unknown'], (v) => setState(() => _approvalFilter = v!)),
            if (_documentFilter != null)
              Chip(
                label: const Text('Filtered by Document', style: TextStyle(fontSize: 10)),
                onDeleted: () => setState(() => _documentFilter = null),
                backgroundColor: rcGold.withValues(alpha: 0.1),
                labelStyle: const TextStyle(color: rcGold),
              ),
          ],
        ),
      ),
    );
  }

  Widget _dropdown(String label, String value, List<String> items, ValueChanged<String?> onChanged) {
    return SizedBox(
      width: 160,
      child: DropdownButtonFormField<String>(
        initialValue: value,
        decoration: InputDecoration(labelText: label, isDense: true),
        items: items.map((e) => DropdownMenuItem(value: e, child: Text(e.replaceAll('_', ' ').toUpperCase(), style: const TextStyle(fontSize: 10)))).toList(),
        onChanged: onChanged,
      ),
    );
  }

  Widget _buildVerificationTable() {
    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance
          .collection('mission_realms')
          .doc(widget.missionId)
          .collection('syllabus_atoms')
          .orderBy('atomId')
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.hasError) return Center(child: Text('Error: ${snapshot.error}', style: const TextStyle(color: rcRed)));
        if (!snapshot.hasData) return const RcCenteredLoader();

        final allDocs = snapshot.data!.docs.where((doc) {
          final data = doc.data();
          final sourceBacked = _isSourceBacked(data);
          final title = (data['atom_title'] ?? data['atomTitle'] ?? '').toString().toLowerCase();
          final path = (data['hierarchy_path'] ?? data['hierarchyPath'] ?? '').toString().toLowerCase();
          final excerpt = (data['source_text_excerpt'] ?? data['sourceTextExcerpt'] ?? '').toString().toLowerCase();
          final runId = (data['extractionRunId'] ?? '').toString().toLowerCase();
          final subject = (data['subject'] ?? '').toString();
          final status = _statusOf(data);
          final approval = _approvalOf(data);
          final docId = (data['source_document_id'] ?? data['sourceDocumentId'] ?? '').toString();

          if (_documentFilter != null && docId != _documentFilter) return false;
          if (_sourceFilter == 'source_backed' && !sourceBacked) return false;
          if (_sourceFilter == 'legacy' && sourceBacked) return false;
          if (_subjectFilter != 'all' && subject != _subjectFilter) return false;
          if (_statusFilter != 'all' && status != _statusFilter) return false;
          if (_approvalFilter != 'all' && approval != _approvalFilter) return false;
          if (_searchQuery.isNotEmpty &&
              !title.contains(_searchQuery) &&
              !path.contains(_searchQuery) &&
              !excerpt.contains(_searchQuery) &&
              !runId.contains(_searchQuery)) {
            return false;
          }
          return true;
        }).toList();

        if (allDocs.isEmpty) return const Center(child: Text('No atoms found matching filters.', style: TextStyle(color: Colors.white24)));

        return Scrollbar(
          controller: _horizontalTableController,
          thumbVisibility: true,
          trackVisibility: true,
          notificationPredicate: (notification) => notification.metrics.axis == Axis.horizontal,
          child: SingleChildScrollView(
            controller: _horizontalTableController,
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 16),
            child: ConstrainedBox(
              constraints: const BoxConstraints(minWidth: 1860),
              child: Scrollbar(
                controller: _verticalTableController,
                thumbVisibility: true,
                notificationPredicate: (notification) => notification.metrics.axis == Axis.vertical,
                child: SingleChildScrollView(
                  controller: _verticalTableController,
                  child: DataTable(
              headingRowHeight: 40,
              dataRowMinHeight: 76,
              dataRowMaxHeight: 132,
              columnSpacing: 22,
              columns: const [
                DataColumn(label: Text('TYPE', style: TextStyle(color: rcGold, fontSize: 10, fontWeight: FontWeight.bold))),
                DataColumn(label: Text('ATOM ID', style: TextStyle(color: rcGold, fontSize: 10, fontWeight: FontWeight.bold))),
                DataColumn(label: Text('HIERARCHY PATH', style: TextStyle(color: rcGold, fontSize: 10, fontWeight: FontWeight.bold))),
                DataColumn(label: Text('ATOM TITLE', style: TextStyle(color: rcGold, fontSize: 10, fontWeight: FontWeight.bold))),
                DataColumn(label: Text('SOURCE PROOF', style: TextStyle(color: rcGold, fontSize: 10, fontWeight: FontWeight.bold))),
                DataColumn(label: Text('RUN / DOC', style: TextStyle(color: rcGold, fontSize: 10, fontWeight: FontWeight.bold))),
                DataColumn(label: Text('STATUS', style: TextStyle(color: rcGold, fontSize: 10, fontWeight: FontWeight.bold))),
                DataColumn(label: Text('ACTIONS', style: TextStyle(color: rcGold, fontSize: 10, fontWeight: FontWeight.bold))),
              ],
              rows: allDocs.map((doc) => _buildDataRow(doc.id, doc.data())).toList(),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  DataRow _buildDataRow(String docId, Map<String, dynamic> data) {
    final status = _statusOf(data);
    final isVerified = status == 'verified';
    final isRejected = status == 'rejected';
    final sourceBacked = _isSourceBacked(data);
    final canReview = _isFounder && sourceBacked;

    Color statusColor = rcGold;
    if (isVerified) statusColor = rcGreen;
    if (isRejected) statusColor = rcRed;

    return DataRow(
      color: WidgetStateProperty.resolveWith((_) => sourceBacked ? rcGold.withValues(alpha: 0.025) : Colors.transparent),
      cells: [
        DataCell(_sourceBadge(sourceBacked)),
        DataCell(
          InkWell(
            onTap: () => Clipboard.setData(ClipboardData(text: (data['atom_id'] ?? data['atomId'] ?? docId).toString())),
            child: SizedBox(
              width: 190,
              child: Text((data['atom_id'] ?? data['atomId'] ?? 'ID_MISSING').toString(), style: const TextStyle(fontFamily: 'monospace', fontSize: 10, color: Colors.white38)),
            ),
          ),
        ),
        DataCell(
          SizedBox(
            width: 260,
            child: Text((data['hierarchy_path'] ?? data['hierarchyPath'] ?? '--').toString(), style: const TextStyle(fontSize: 11, color: Colors.white54), maxLines: 4, overflow: TextOverflow.ellipsis),
          ),
        ),
        DataCell(
          SizedBox(
            width: 240,
            child: Text((data['atom_title'] ?? data['atomTitle'] ?? 'Untitled').toString(), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold), maxLines: 4, overflow: TextOverflow.ellipsis),
          ),
        ),
        DataCell(_sourceProofCell(data)),
        DataCell(_runDocCell(data)),
        DataCell(_statusCell(status, statusColor, data)),
        DataCell(_actionsCell(docId, data, canReview, isVerified, isRejected)),
      ],
    );
  }

  Widget _sourceBadge(bool sourceBacked) {
    final color = sourceBacked ? rcGold : Colors.white30;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        border: Border.all(color: color.withValues(alpha: 0.3)),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(sourceBacked ? 'RX2 SOURCE' : 'LEGACY', style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.bold)),
    );
  }

  Widget _sourceProofCell(Map<String, dynamic> data) {
    final excerpt = (data['source_text_excerpt'] ?? data['sourceTextExcerpt'] ?? '--').toString();
    final quality = (data['sourceTraceQuality'] ?? 'UNKNOWN').toString();
    return SizedBox(
      width: 360,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(excerpt, style: const TextStyle(fontSize: 10, color: Colors.white38, fontStyle: FontStyle.italic), maxLines: 4, overflow: TextOverflow.ellipsis),
          const SizedBox(height: 6),
          _miniPill(quality, quality == 'GOOD_TEXT_NO_PAGE' ? rcGold : Colors.white30),
        ],
      ),
    );
  }

  Widget _runDocCell(Map<String, dynamic> data) {
    final runId = (data['extractionRunId'] ?? '--').toString();
    final docId = (data['source_document_id'] ?? data['sourceDocumentId'] ?? '--').toString();
    return SizedBox(
      width: 260,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(runId, style: const TextStyle(fontFamily: 'monospace', fontSize: 9, color: Colors.white38), maxLines: 2, overflow: TextOverflow.ellipsis),
          const SizedBox(height: 6),
          Text(docId, style: const TextStyle(fontFamily: 'monospace', fontSize: 9, color: Colors.white24), maxLines: 2, overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }

  Widget _statusCell(String status, Color statusColor, Map<String, dynamic> data) {
    final approved = _approvalOf(data) == 'approved';
    return SizedBox(
      width: 130,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _miniPill(status.toUpperCase(), statusColor),
          const SizedBox(height: 6),
          _miniPill(approved ? 'FOUNDER APPROVED' : 'NOT APPROVED', approved ? rcGreen : Colors.white30),
        ],
      ),
    );
  }

  Widget _actionsCell(String docId, Map<String, dynamic> data, bool canReview, bool isVerified, bool isRejected) {
    if (!canReview) {
      return Text(_isFounder ? 'LEGACY READ ONLY' : 'READ ONLY', style: const TextStyle(color: Colors.white10, fontSize: 10));
    }
    return Row(
      children: [
        if (!isVerified)
          IconButton(
            icon: const Icon(Icons.check_circle_rounded, color: rcGreen, size: 20),
            onPressed: () => _updateSourceAtomReview(docId, data, 'verified'),
            tooltip: 'Mark Verified',
          ),
        if (!isRejected)
          IconButton(
            icon: const Icon(Icons.cancel_rounded, color: rcRed, size: 20),
            onPressed: () => _updateSourceAtomReview(docId, data, 'rejected'),
            tooltip: 'Reject',
          ),
        IconButton(
          icon: const Icon(Icons.undo_rounded, color: rcGold, size: 20),
          onPressed: () => _updateSourceAtomReview(docId, data, 'needs_review'),
          tooltip: 'Send Back / Needs Review',
        ),
        IconButton(
          icon: const Icon(Icons.edit_note_rounded, color: Colors.blue, size: 20),
          onPressed: () => _showReviewNoteDialog(docId, data),
          tooltip: 'Review Note',
        ),
      ],
    );
  }

  Widget _miniPill(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color.withValues(alpha: 0.22)),
      ),
      child: Text(label, style: TextStyle(color: color, fontSize: 8, fontWeight: FontWeight.bold)),
    );
  }

  void _showReviewNoteDialog(String docId, Map<String, dynamic> data) {
    if (!_isFounder || !_isSourceBacked(data)) return;
    final noteCtrl = TextEditingController(text: (data['reviewNote'] ?? data['founderReviewNote'] ?? '').toString());

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: rcBg,
        title: const Text('FOUNDER REVIEW NOTE', style: TextStyle(color: rcGold, fontSize: 14, fontWeight: FontWeight.bold)),
        content: SizedBox(
          width: 520,
          child: TextField(
            controller: noteCtrl,
            decoration: const InputDecoration(labelText: 'Review note'),
            maxLines: 4,
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('CANCEL')),
          FilledButton(
            onPressed: () {
              _updateSourceAtomReview(docId, data, _statusOf(data), note: noteCtrl.text);
              Navigator.pop(context);
            },
            child: const Text('SAVE NOTE'),
          ),
        ],
      ),
    );
  }
}

