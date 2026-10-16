import 'dart:convert';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:crypto/crypto.dart';
import 'package:file_picker/file_picker.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:rank_crackers/core/admin/admin_permission_resolver.dart';
import '../../shared/rc_colors.dart';
import '../../shared/rc_field.dart';
import '../../shared/rc_file_helpers.dart';
import '../../shared/rc_loaders.dart';
import '../../shared/rc_panel.dart';
import '../../shared/mission_processing_health_bar.dart';

import '../../shared/unified_command_console.dart';
import 'mission_document_detail_dialog.dart';
import 'pyq_verification_tab.dart';
import 'syllabus_atom_verification_tab.dart';

class MissionDocumentsTab extends StatefulWidget {
  final String missionId;
  final Map<String, dynamic> mission;
  final ConsoleRoleMode roleMode;
  final Map<String, dynamic>? permissions;
  final String? taskId;
  final int? initialSubTab;
  final String? initialDocumentId;

  const MissionDocumentsTab({
    super.key,
    required this.missionId,
    required this.mission,
    this.roleMode = ConsoleRoleMode.founder,
    this.permissions,
    this.taskId,
    this.initialSubTab,
    this.initialDocumentId,
  });

  @override
  State<MissionDocumentsTab> createState() => _MissionDocumentsTabState();
}

class _MissionDocumentsTabState extends State<MissionDocumentsTab>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _titleCtrl = TextEditingController();
  final _searchCtrl = TextEditingController();

  String _scope = 'MISSION_COMMON';
  String _documentType = 'original_notification';
  String? _selectedVariableId;
  Map<String, dynamic>? _selectedVariable;
  String _paperType = 'Paper 1';
  bool _uploading = false;
  String? _error;
  String? _info;

  String _levelFilter = 'all';
  String _typeFilter = 'all';
  String _variableFilter = 'all';
  String _paperFilter = 'all';
  String _statusFilter = 'all';
  String _reviewFilter = 'all';
  String _publishFilter = 'all';
  String _aiFilter = 'all';

  static const _levelLabels = {
    'MISSION_COMMON': 'Mission-level document',
    'VARIABLE_SPECIFIC': 'Variable-level document',
    'PAPER_WISE': 'Paper-specific document',
  };

  static const _paperTypes = [
    'Paper 1',
    'Paper 2',
    'Paper 3',
    'All Papers',
    'Not Applicable',
  ];

  static const Map<String, List<MapEntry<String, String>>> _documentTypes = {
    'MISSION_COMMON': [
      MapEntry('original_notification', 'Original Notification'),
      MapEntry('amendment', 'Amendment / Shuddhipatra'),
      MapEntry('exam_date_notice', 'Exam Date Notice'),
      MapEntry('answer_key_notice', 'Answer Key Notice'),
      MapEntry('result_notice', 'Result Notice'),
      MapEntry('cutoff_notice', 'Cutoff Notice'),
      MapEntry('general_notice', 'General Notice / Instructions'),
      MapEntry('common_syllabus', 'Common Syllabus'),
      MapEntry('common_pyq', 'Common PYQ'),
      MapEntry('common_instructions', 'Common Instructions'),
      MapEntry('exam_scheme', 'Exam Scheme'),
      MapEntry('sample_pyq', 'Sample PYQ'),
      MapEntry('sample_question_paper', 'Sample Question Paper'),
      MapEntry('topic_wise_sample_questions', 'Topic-wise Sample Questions'),
      MapEntry(
          'chapter_wise_sample_questions', 'Chapter-wise Sample Questions'),
      MapEntry('study_material', 'Study Material'),
      MapEntry('topic_wise_study_material', 'Topic-wise Study Material'),
      MapEntry('chapter_wise_study_material', 'Chapter-wise Study Material'),
      MapEntry('practice_set', 'Practice Set'),
      MapEntry('model_paper', 'Model Paper'),
    ],
    'VARIABLE_SPECIFIC': [
      MapEntry('variable_syllabus', 'Variable Syllabus'),
      MapEntry('variable_pyq', 'Variable PYQ'),
      MapEntry('variable_notice', 'Variable Notice / Update'),
      MapEntry('variable_answer_key', 'Variable Answer Key'),
      MapEntry('variable_result', 'Variable Result'),
      MapEntry('variable_cutoff', 'Variable Cutoff'),
      MapEntry('variable_study_material', 'Variable Study Material'),
      MapEntry('variable_sample_questions', 'Variable Sample Questions'),
      MapEntry('variable_practice_set', 'Variable Practice Set'),
    ],
    'PAPER_WISE': [
      MapEntry('paper_syllabus', 'Paper Syllabus'),
      MapEntry('paper_pyq', 'Paper PYQ'),
      MapEntry('paper_instructions', 'Paper Instructions'),
      MapEntry('paper_answer_key', 'Paper Answer Key'),
      MapEntry('paper_result_cutoff', 'Paper Result / Cutoff'),
      MapEntry('paper_sample_questions', 'Paper Sample Questions'),
      MapEntry('paper_study_material', 'Paper Study Material'),
      MapEntry('paper_model_paper', 'Paper Model Paper'),
    ],
  };

  String? _atomDocumentIdFilter;
  String? _questionDocumentIdFilter;

  void _navigateToSubTab(String tabLabel) {
    final bool isFounder = widget.roleMode == ConsoleRoleMode.founder;
    final perms = widget.permissions ?? {};
    final currentSubTabLabels = [
      if (isFounder) 'Upload Source',
      'Source Documents',
      if (isFounder) 'Student Visibility',
      if (isFounder || AdminPermissionResolver.canSeeSyllabusReview(perms))
        'Syllabus Verification',
      if (isFounder || AdminPermissionResolver.canSeePyqReview(perms))
        'PYQ Verification',
    ];
    final idx = currentSubTabLabels.indexOf(tabLabel);
    if (idx != -1) {
      _tabController.animateTo(idx);
    }
  }

  @override
  void initState() {
    super.initState();
    final bool isFounder = widget.roleMode == ConsoleRoleMode.founder;
    final perms = widget.permissions ?? {};
    int len = 1; // Registry
    if (isFounder) len += 2; // Upload, Review
    if (isFounder || AdminPermissionResolver.canSeeSyllabusReview(perms)) len++;
    if (isFounder || AdminPermissionResolver.canSeePyqReview(perms)) len++;

    _tabController = TabController(length: len, vsync: this);

    final int? targetIndex = widget.initialSubTab;
    if (targetIndex != null) {
      // Map initial sub-tab index from Founder mode (fixed indices) to dynamic actual index
      String? requestedLabel;
      if (targetIndex == 0) requestedLabel = 'Upload Source';
      if (targetIndex == 1) requestedLabel = 'Source Documents';
      if (targetIndex == 2) requestedLabel = 'Student Visibility';
      if (targetIndex == 3) requestedLabel = 'Syllabus Verification';
      if (targetIndex == 4) requestedLabel = 'PYQ Verification';

      final currentSubTabLabels = [
        if (isFounder) 'Upload Source',
        'Source Documents',
        if (isFounder) 'Student Visibility',
        if (isFounder || AdminPermissionResolver.canSeeSyllabusReview(perms))
          'Syllabus Verification',
        if (isFounder || AdminPermissionResolver.canSeePyqReview(perms))
          'PYQ Verification',
      ];

      final mappedIdx = currentSubTabLabels.indexOf(requestedLabel ?? '');
      if (mappedIdx != -1) {
        _tabController.index = mappedIdx;
      }
    }
    _atomDocumentIdFilter = widget.initialDocumentId;
    _questionDocumentIdFilter = widget.initialDocumentId;
  }

  @override
  void dispose() {
    _tabController.dispose();
    _titleCtrl.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  String get _documentTypeLabel => _documentTypes[_scope]!
      .firstWhere((entry) => entry.key == _documentType)
      .value;

  List<Map<String, String>> _getAvailablePapers() {
    final struct = widget.mission['examStructure'] as Map?;
    final papers = List.from(struct?['papers'] ?? []);
    if (papers.isEmpty) {
      return _paperTypes.map((p) => {'code': p, 'name': p}).toList();
    }
    return papers
        .map((p) => {
              'code': (p['paperCode'] ?? '').toString(),
              'name': (p['paperName'] ?? p['paperCode'] ?? '').toString(),
            })
        .toList();
  }

  void _setScope(String scope) {
    setState(() {
      _scope = scope;
      _documentType = _documentTypes[scope]!.first.key;
      if (scope == 'MISSION_COMMON') {
        _selectedVariableId = null;
        _selectedVariable = null;
      }

      final avail = _getAvailablePapers();
      if (scope != 'PAPER_WISE') {
        _paperType = avail.first['code']!;
      } else {
        // If transitioning to paper-wise, try to pick PAPER_2 or something sensible
        if (avail.any((p) => p['code'] == 'PAPER_2')) {
          _paperType = 'PAPER_2';
        } else {
          _paperType = avail.first['code']!;
        }
      }

      _error = null;
      _info = null;
    });
  }

  String _documentFamilyFor(String type) {
    final value = type.toLowerCase();
    if (value.contains('syllabus')) return 'SYLLABUS';
    if (value.contains('pyq') || value.contains('question_paper')) return 'PYQ';
    if (value.contains('amendment') ||
        value.contains('shuddhi') ||
        value.contains('corrigendum')) return 'AMENDMENT';
    if (value.contains('notification') || value.contains('notice'))
      return 'NOTIFICATION';
    return 'OTHER_OFFICIAL_SOURCE';
  }

  String? _forcePipelineSourceUrl() {
    final configured = widget.mission['officialSourceUrl']?.toString().trim();
    if (configured != null && configured.isNotEmpty) return configured;
    if (widget.missionId == 'ssc_cgl') {
      return 'https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_cgl_2026.pdf';
    }
    return null;
  }

  Future<void> _uploadDocument() async {
    final manualTitle = _titleCtrl.text.trim();
    if (_scope != 'MISSION_COMMON' && _selectedVariableId == null) {
      setState(() {
        _error = 'Select a variable before uploading this document.';
        _info = null;
      });
      return;
    }
    if (_scope == 'PAPER_WISE' && _paperType.trim().isEmpty) {
      setState(() {
        _error = 'Select paper type before uploading this document.';
        _info = null;
      });
      return;
    }

    FilePickerResult? result;
    try {
      result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: [
          'pdf',
          'doc',
          'docx',
          'xlsx',
          'json',
          'csv',
          'txt',
          'png',
          'jpg',
          'jpeg',
          'webp'
        ],
        withData: true,
        allowMultiple: true,
      );
    } catch (e) {
      setState(() {
        _error = 'File picker failed: $e';
        _info = null;
      });
      return;
    }

    if (result == null || result.files.isEmpty) {
      setState(() {
        _error = 'No file selected.';
        _info = null;
      });
      return;
    }

    final files = result.files;
    final unreadable = files
        .where((file) => file.bytes == null)
        .map((file) => file.name)
        .toList();
    if (unreadable.isNotEmpty) {
      setState(() {
        _error = 'Could not read selected file bytes: ${unreadable.join(', ')}';
        _info = null;
      });
      return;
    }

    setState(() {
      _uploading = true;
      _error = null;
      _info = files.length == 1
          ? 'Selected ${files.first.name}. Uploading official document...'
          : 'Selected ${files.length} files. Uploading documents one by one...';
    });

    final now = FieldValue.serverTimestamp();
    final variable = _selectedVariable;
    final variableName = variable == null
        ? null
        : (variable['displayName'] ?? variable['name'] ?? _selectedVariableId)
            .toString();
    final subjectCode =
        variable?['subjectCode']?.toString() ?? variable?['code']?.toString();
    final subjectHindiName = variable?['hindiName']?.toString();
    final paper = _scope == 'PAPER_WISE' ? _paperType : null;
    var uploadedCount = 0;
    final failedFiles = <String>[];

    try {
      for (final file in files) {
        final bytes = file.bytes!;
        final fallbackTitle = file.name.contains('.')
            ? file.name.substring(0, file.name.lastIndexOf('.'))
            : file.name;
        final title = manualTitle.isNotEmpty ? manualTitle : fallbackTitle;
        final titleSource =
            manualTitle.isNotEmpty ? 'MANUAL' : 'FILE_NAME_FALLBACK';
        final hash = sha256.convert(bytes).toString();
        final documentId = 'hash_$hash';
        final ext = file.extension?.toLowerCase() ??
            file.name.split('.').last.toLowerCase();
        final storagePath =
            'mission_realms/${widget.missionId}/official_documents/$documentId.$ext';

        try {
          // Official notification PDFs must use the server-governed force
          // pipeline. Direct client writes to mission_realms official storage
          // are intentionally denied by Storage Rules.
          if (_scope == 'MISSION_COMMON' &&
              _documentType == 'original_notification' &&
              ext == 'pdf') {
            final cycleKey = widget.mission['cycleKey']?.toString().trim() ??
                (widget.missionId == 'ssc_cgl' ? 'ssc_cgl_2026' : '');
            final authorityKey =
                widget.mission['authorityKey']?.toString().trim() ??
                    (widget.missionId == 'ssc_cgl' ? 'auth_in_ssc' : '');
            final sourceUrl = _forcePipelineSourceUrl();
            if (cycleKey.isEmpty || authorityKey.isEmpty || sourceUrl == null) {
              throw StateError(
                'This mission is missing cycle, authority, or official source URL metadata.',
              );
            }
            final callable = FirebaseFunctions.instance.httpsCallable(
              'forceMissionPipeline',
            );
            await callable.call({
              'missionId': widget.missionId,
              'cycleKey': cycleKey,
              'authorityKey': authorityKey,
              'officialSourceUrl': sourceUrl,
              'sourceBase64': base64Encode(bytes),
              'sourceType': 'notification',
              'sourceLanguage': 'en',
              'syllabusBindingMode': 'EMBEDDED',
              'requestId': 'ui-${hash.substring(0, 24)}',
            });
            uploadedCount++;
            continue;
          }

          final ref = FirebaseStorage.instance.ref(storagePath);
          await ref.putData(
              bytes, SettableMetadata(contentType: mimeForExtension(ext)));
          final downloadUrl = await ref.getDownloadURL();

          final docData = {
            'id': documentId,
            'docId': documentId,
            'documentId': documentId,
            'missionId': widget.missionId,
            'missionName': widget.mission['name'] ?? widget.missionId,
            'scope': _scope,
            'documentLevelLabel': _levelLabels[_scope],
            'documentType': _documentType,
            'documentTypeLabel': _documentTypeLabel,
            'title': title,
            'displayTitle': title,
            'originalFileName': file.name,
            'titleSource': titleSource,
            'fileName': file.name,
            'mimeType': mimeForExtension(ext),
            'fileSize': bytes.length,
            'sourceSha256': hash,
            'documentFamily': _documentFamilyFor(_documentType),
            'verificationState': 'PENDING',
            'activationState': 'CANDIDATE',
            'studentTruth': false,
            'storagePath': storagePath,
            'storageRawPath': storagePath,
            'downloadUrl': downloadUrl,
            'variableId':
                _scope == 'MISSION_COMMON' ? null : _selectedVariableId,
            'variableName': _scope == 'MISSION_COMMON' ? null : variableName,
            'subjectCode': _scope == 'MISSION_COMMON' ? null : subjectCode,
            'subjectName': _scope == 'MISSION_COMMON' ? null : variableName,
            'subjectHindiName':
                _scope == 'MISSION_COMMON' ? null : subjectHindiName,
            'paperType': paper,
            'paperIndex': paper,
            'status': 'RECEIVED',
            'reviewStatus': 'PENDING',
            'publishStatus': 'draft',
            'aiQueueStatus': 'pending',
            'uploadedAt': now,
            'uploadedBy': FirebaseAuth.instance.currentUser?.uid,
            'source': 'mission_documents_center',
          };

          await FirebaseFirestore.instance
              .collection('mission_realms')
              .doc(widget.missionId)
              .collection('official_documents')
              .doc(documentId)
              .set(docData, SetOptions(merge: true));
          await FirebaseFirestore.instance
              .collection('ingestion_refinery')
              .doc(documentId)
              .set({
            ...docData,
            'sourceId': documentId,
            'fileType': ext,
            'mimeType': mimeForExtension(ext),
            'fileSize': bytes.length,
            'fileHash': hash,
            'assetType': 'official_document',
            'status': 'uploaded',
            'documentStatus': 'LIVE',
            'sourceUrl': downloadUrl,
            'createdAt': now,
            'updatedAt': now,
            'uploadedFrom': 'mission_documents_center',
          }, SetOptions(merge: true));
          await FirebaseFirestore.instance
              .collection('ai_queue')
              .doc(documentId)
              .set({
            'type': 'pdfParse',
            'provider': 'gemini',
            'sourceType': 'MISSION_DOCUMENT',
            'documentId': documentId,
            'missionId': widget.missionId,
            'scope': _scope,
            'documentType': _documentType,
            'variableId':
                _scope == 'MISSION_COMMON' ? null : _selectedVariableId,
            'subjectCode': _scope == 'MISSION_COMMON' ? null : subjectCode,
            'paperType': paper,
            'storagePath': storagePath,
            'status': 'received',
            'payload': {
              'id': documentId,
              'documentId': documentId,
              'fileName': file.name,
              'filePath': downloadUrl,
              'storagePath': storagePath,
              'fileType': ext,
              'mimeType': mimeForExtension(ext),
              'intent': _documentType,
              'sourceType': 'MISSION_DOCUMENT',
              'missionId': widget.missionId,
              'scope': _scope,
              'documentType': _documentType,
              'variableId':
                  _scope == 'MISSION_COMMON' ? null : _selectedVariableId,
              'subjectCode': _scope == 'MISSION_COMMON' ? null : subjectCode,
              'paperType': paper,
              'mediumPolicy': widget.mission['mediumPolicy'] ?? 'ENGLISH_ONLY',
            },
            'manualTrigger': true,
            'createdAt': now,
            'triggeredFrom': 'mission_documents_center',
          }, SetOptions(merge: true));
          await FirebaseFirestore.instance
              .collection('mission_realms')
              .doc(widget.missionId)
              .collection('official_documents')
              .doc(documentId)
              .set({'aiQueueStatus': 'received', 'aiQueueTaskId': documentId},
                  SetOptions(merge: true));
          uploadedCount++;
        } catch (fileError) {
          failedFiles.add('${file.name}: $fileError');
        }
      }
      setState(() {
        if (failedFiles.isEmpty) _titleCtrl.clear();
        _info = failedFiles.isEmpty
            ? 'Uploaded $uploadedCount document${uploadedCount == 1 ? '' : 's'} to Storage, Ingestion, and AI Queue.'
            : 'Uploaded $uploadedCount document${uploadedCount == 1 ? '' : 's'}. Failed: ${failedFiles.join('; ')}';
        if (uploadedCount > 0) _navigateToSubTab('Source Documents');
      });
    } catch (e) {
      setState(() => _error = 'Upload failed: $e');
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  bool _matchesFilters(QueryDocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data();
    final q = _searchCtrl.text.trim().toLowerCase();
    final haystack = [
      doc.id,
      data['title'],
      data['fileName'],
      data['documentTypeLabel'],
      data['variableName'],
      data['subjectCode'],
      data['storagePath'],
    ].whereType<Object>().join(' ').toLowerCase();
    if (q.isNotEmpty && !haystack.contains(q)) return false;
    if (_levelFilter != 'all' && data['scope'] != _levelFilter) return false;
    if (_typeFilter != 'all' && data['documentType'] != _typeFilter)
      return false;
    if (_variableFilter != 'all' && data['variableId'] != _variableFilter)
      return false;
    if (_paperFilter != 'all' &&
        data['paperType'] != _paperFilter &&
        data['paperIndex'] != _paperFilter) return false;
    if (_statusFilter != 'all' &&
        (data['status'] ?? '').toString().toUpperCase() != _statusFilter)
      return false;
    if (_reviewFilter != 'all' &&
        (data['reviewStatus'] ?? '').toString().toUpperCase() != _reviewFilter)
      return false;
    if (_publishFilter != 'all' &&
        (data['publishStatus'] ?? '').toString().toLowerCase() !=
            _publishFilter) return false;
    if (_aiFilter != 'all' &&
        _aiStatus(data).toLowerCase().replaceAll(' ', '_') != _aiFilter)
      return false;
    return true;
  }

  bool _isStudentVisible(Map<String, dynamic> data) {
    final publish = (data['publishStatus'] ?? '').toString().toLowerCase();
    final status = (data['status'] ?? '').toString().toUpperCase();
    final visible = data['studentVisible'] == true ||
        data['isUserVisible'] == true ||
        data['userPanelVisible'] == true ||
        publish == 'published';
    return visible &&
        publish == 'published' &&
        status != 'ARCHIVED' &&
        status != 'HIDDEN';
  }

  List<String> _diagnostics(Map<String, dynamic> data) {
    final chips = <String>[];
    final scope = data['scope']?.toString();
    if (scope == null || scope.isEmpty) chips.add('Missing scope');
    if ((data['documentType'] ?? data['type']) == null)
      chips.add('Missing document type');
    if ((scope == 'VARIABLE_SPECIFIC' || scope == 'PAPER_WISE') &&
        (data['variableId'] ?? '').toString().isEmpty) {
      chips.add('Missing variable link');
    }
    if (scope == 'PAPER_WISE' &&
        (data['paperType'] ?? data['paperIndex'] ?? '').toString().isEmpty) {
      chips.add('Missing paper type');
    }
    if ((data['publishStatus'] ?? '').toString().toLowerCase() != 'published')
      chips.add('Not published');
    final status = (data['status'] ?? '').toString().toUpperCase();
    if (status == 'ARCHIVED' || status == 'HIDDEN')
      chips.add('Archived/hidden');
    if (!_isStudentVisible(data)) chips.add('Hidden from Student Review');
    if (data['source'] != 'mission_documents_center')
      chips.add('Legacy metadata');
    return chips;
  }

  String _aiStatus(Map<String, dynamic> data) {
    final raw = (data['aiQueueStatus'] ??
            data['aiStatus'] ??
            data['extractionStatus'] ??
            '')
        .toString()
        .toLowerCase();

    final extractionQuality = data['extractionQuality'] ??
        data['latestExtractionQuality'] ??
        'UNKNOWN';
    if (extractionQuality == 'FAILED') return 'OCR Quality Failed';
    if (data['reprocessStatus'] == 'QUEUED') return 'Reprocess Queued';

    if ((data['proposalId'] ?? '').toString().isNotEmpty)
      return 'Proposal Available';
    if (_hasExtraction(data)) return 'Extracted';
    if (raw.contains('fail')) return 'Failed';
    if (raw.contains('process')) return 'Processing';
    if (raw.contains('queue') || raw == 'received' || raw == 'pending')
      return 'In Queue';
    return 'Not Queued';
  }

  bool _hasExtraction(Map<String, dynamic> data) {
    if (data['latestDraftId'] != null) return true;
    for (final key in [
      'extractedText',
      'extractedMarkdown',
      'searchableSummary',
      'extractedFacts',
      'aiSummary',
      'classification',
      'aiResult'
    ]) {
      final value = data[key];
      if (value == null) continue;
      if (value is String && value.trim().isNotEmpty) return true;
      if (value is Iterable && value.isNotEmpty) return true;
      if (value is Map && value.isNotEmpty) return true;
    }
    return false;
  }

  Future<void> _openFile(Map<String, dynamic> data) async {
    final url = (data['downloadUrl'] ?? data['sourceUrl'] ?? '').toString();
    if (url.isEmpty) return;
    await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
  }

  void _copy(BuildContext context, String value, String label) {
    Clipboard.setData(ClipboardData(text: value));
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text('$label copied.')));
  }

  void _showExtractionReview(BuildContext context, Map<String, dynamic> data) {
    if (data['latestDraftId'] != null) {
      _showSentinelDraftReview(context, data['latestDraftId']);
      return;
    }
    final fields = <String, Object?>{};
    for (final key in [
      'extractedText',
      'extractedMarkdown',
      'searchableSummary',
      'extractedFacts',
      'aiSummary',
      'classification',
      'aiResult'
    ]) {
      final value = data[key];
      if (value != null && value.toString().trim().isNotEmpty)
        fields[key] = value;
    }
    if (fields.isEmpty) return;
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: rcSurface,
        title:
            const Text('AI Extraction Review', style: TextStyle(color: rcGold)),
        content: SizedBox(
          width: 720,
          child: SingleChildScrollView(
            child: SelectableText(fields.entries
                .map((e) => '${e.key}:\n${e.value}')
                .join('\n\n')),
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'))
        ],
      ),
    );
  }

  void _showSentinelDraftReview(BuildContext context, String draftId) {
    showDialog(
      context: context,
      builder: (context) =>
          FutureBuilder<DocumentSnapshot<Map<String, dynamic>>>(
        future: FirebaseFirestore.instance
            .collection('sentinel_drafts')
            .doc(draftId)
            .get(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) return const RcCenteredLoader();
          final data = snapshot.data!.data() ?? {};
          return AlertDialog(
            backgroundColor: rcSurface,
            title: Text('Sentinel Draft: $draftId',
                style: const TextStyle(color: rcGold, fontSize: 14)),
            content: SizedBox(
              width: 900,
              height: 700,
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('RAW EXTRACTED TEXT',
                        style: TextStyle(
                            color: rcGold,
                            fontSize: 10,
                            fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    SelectableText(
                        data['searchableSummary'] ??
                            'No text summary available.',
                        style: const TextStyle(fontSize: 12)),
                    const Divider(height: 32, color: rcLine),
                    const Text('STRUCTURED JSON DATA',
                        style: TextStyle(
                            color: rcGold,
                            fontSize: 10,
                            fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    SelectableText(data['rawData']?.toString() ?? '{}',
                        style: const TextStyle(
                            fontSize: 11,
                            fontFamily: 'monospace',
                            color: Colors.blue)),
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Close'))
            ],
          );
        },
      ),
    );
  }

  Future<void> _activateVerifiedSource(Map<String, dynamic> data) async {
    final slotId = data['sourceSlotId']?.toString();
    final versionId = data['sourceVersionId']?.toString();
    final sha = data['sourceSha256']?.toString();
    if (slotId == null || versionId == null || sha == null) return;
    final slotRef = FirebaseFirestore.instance
        .collection('mission_realms')
        .doc(widget.missionId)
        .collection('source_slots')
        .doc(slotId);
    final slot = await slotRef.get();
    if (!mounted) return;
    final reason = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('ACTIVATE VERIFIED SOURCE'),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          const Text(
              'This switches the canonical source pointer atomically. The current verified source remains preserved for rollback.'),
          const SizedBox(height: 12),
          TextField(
              controller: reason,
              minLines: 2,
              maxLines: 4,
              decoration: const InputDecoration(
                  labelText:
                      'Founder activation reason (minimum 12 characters)',
                  border: OutlineInputBorder())),
        ]),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: const Text('CANCEL')),
          FilledButton(
              onPressed: () {
                if (reason.text.trim().length >= 12)
                  Navigator.pop(dialogContext, true);
              },
              child: const Text('ACTIVATE')),
        ],
      ),
    );
    final activationReason = reason.text.trim();
    reason.dispose();
    if (confirmed != true) return;
    try {
      await FirebaseFunctions.instanceFor(region: 'us-central1')
          .httpsCallable('handleSentinelAction')
          .call({
        'action': 'activate_canonical_source',
        'recruitmentId': widget.missionId,
        'payload': {
          'sourceSlotId': slotId,
          'sourceVersionId': versionId,
          'sourceSha256': sha,
          'expectedActivationEpoch': slot.data()?['activationEpoch'] ?? 0,
          'expectedCanonicalVersionId': slot.data()?['canonicalVersionId'],
          'reason': activationReason,
        },
      });
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text(
                'Verified source activated. Downstream reconciliation is governed by this version.')));
    } catch (error) {
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Activation blocked: $error')));
    }
  }

  Future<void> _restoreVerifiedSource(Map<String, dynamic> data) async {
    final slotId = data['sourceSlotId']?.toString();
    final versionId = data['sourceVersionId']?.toString();
    final sha = data['sourceSha256']?.toString();
    if (slotId == null || versionId == null || sha == null) return;
    final slotRef = FirebaseFirestore.instance
        .collection('mission_realms')
        .doc(widget.missionId)
        .collection('source_slots')
        .doc(slotId);
    final slot = await slotRef.get();
    if (!mounted) return;
    final reason = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('RESTORE VERIFIED VERSION'),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          const Text(
              'Rollback preserves every source version and creates a new governed activation event.'),
          const SizedBox(height: 12),
          TextField(
              controller: reason,
              minLines: 2,
              maxLines: 4,
              decoration: const InputDecoration(
                  labelText: 'Founder rollback reason (minimum 12 characters)',
                  border: OutlineInputBorder())),
        ]),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: const Text('CANCEL')),
          FilledButton(
              onPressed: () {
                if (reason.text.trim().length >= 12)
                  Navigator.pop(dialogContext, true);
              },
              child: const Text('RESTORE')),
        ],
      ),
    );
    final rollbackReason = reason.text.trim();
    reason.dispose();
    if (confirmed != true) return;
    try {
      await FirebaseFunctions.instanceFor(region: 'us-central1')
          .httpsCallable('handleSentinelAction')
          .call({
        'action': 'rollback_canonical_source',
        'recruitmentId': widget.missionId,
        'payload': {
          'sourceSlotId': slotId,
          'targetVersionId': versionId,
          'targetSha256': sha,
          'expectedActivationEpoch': slot.data()?['activationEpoch'] ?? 0,
          'expectedCanonicalVersionId': slot.data()?['canonicalVersionId'],
          'reason': rollbackReason,
        },
      });
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content:
                Text('Verified source restored through governed rollback.')));
    } catch (error) {
      if (mounted)
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Rollback blocked: $error')));
    }
  }

  Widget _buildVersionHistory() {
    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance
          .collection('mission_realms')
          .doc(widget.missionId)
          .collection('source_slots')
          .snapshots(),
      builder: (context, slotsSnapshot) {
        final slots = slotsSnapshot.data?.docs ?? const [];
        if (slots.isEmpty) return const SizedBox.shrink();
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: RcPanel(
            child: ExpansionTile(
              tilePadding: EdgeInsets.zero,
              title: const Text('VERSION HISTORY',
                  style: TextStyle(
                      color: rcGold,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1)),
              subtitle: Text(
                  '${slots.length} canonical source slot${slots.length == 1 ? '' : 's'}',
                  style: const TextStyle(color: Colors.white54, fontSize: 11)),
              children: slots.map((slotDoc) {
                final slot = slotDoc.data();
                return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                  stream: slotDoc.reference
                      .collection('source_versions')
                      .orderBy('versionNumber', descending: true)
                      .snapshots(),
                  builder: (context, versionsSnapshot) {
                    final versions = versionsSnapshot.data?.docs ?? const [];
                    return Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Divider(color: rcLine),
                          Text(
                              (slot['documentFamily'] ?? 'OFFICIAL SOURCE')
                                  .toString(),
                              style: const TextStyle(
                                  color: Colors.white70,
                                  fontWeight: FontWeight.bold)),
                          const SizedBox(height: 6),
                          for (final versionDoc in versions)
                            Builder(builder: (context) {
                              final version = versionDoc.data();
                              final state =
                                  (version['activationState'] ?? 'CANDIDATE')
                                      .toString();
                              final verified =
                                  version['verificationState'] == 'VERIFIED';
                              final sha =
                                  (version['sourceSha256'] ?? '').toString();
                              return ListTile(
                                dense: true,
                                contentPadding: EdgeInsets.zero,
                                title: Text(
                                    'V${version['versionNumber'] ?? '?'}  $state'),
                                subtitle: Text(
                                    '${sha.length >= 12 ? sha.substring(0, 12) : sha}…  •  ${version['verificationState'] ?? 'PENDING'}'),
                                trailing: state == 'CANONICAL'
                                    ? const Chip(label: Text('STUDENT TRUTH'))
                                    : verified && state == 'CANDIDATE'
                                        ? TextButton(
                                            onPressed: () =>
                                                _activateVerifiedSource(
                                                    version),
                                            child: const Text('ACTIVATE'))
                                        : verified && state == 'SUPERSEDED'
                                            ? TextButton(
                                                onPressed: () =>
                                                    _restoreVerifiedSource(
                                                        version),
                                                child: const Text('RESTORE'))
                                            : null,
                              );
                            }),
                        ]);
                  },
                );
              }).toList(),
            ),
          ),
        );
      },
    );
  }

  Widget _sourceAuthorityOverview(
      List<QueryDocumentSnapshot<Map<String, dynamic>>> docs) {
    int canonical = 0, candidates = 0, superseded = 0, pending = 0;
    for (final doc in docs) {
      final data = doc.data();
      final activation =
          (data['activationState'] ?? 'CANDIDATE').toString().toUpperCase();
      final verification =
          (data['verificationState'] ?? data['reviewStatus'] ?? 'PENDING')
              .toString()
              .toUpperCase();
      if (activation == 'CANONICAL') canonical++;
      if (activation == 'CANDIDATE') candidates++;
      if (activation == 'SUPERSEDED') superseded++;
      if (verification != 'VERIFIED' && verification != 'APPROVED') pending++;
    }
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
      child: RcPanel(
          child: Wrap(
              spacing: 22,
              runSpacing: 10,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
            const Text('SOURCE AUTHORITY',
                style: TextStyle(
                    color: rcGold,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1)),
            _chip('CANONICAL $canonical',
                color: canonical > 0 ? rcGreen : rcRed),
            _chip('CANDIDATE $candidates'),
            _chip('VERIFICATION PENDING $pending',
                color: pending > 0 ? rcGold : rcGreen),
            _chip('SUPERSEDED $superseded'),
            const Text(
                'Upload is candidate-only. Student truth changes only after verified Founder activation.',
                style: TextStyle(color: Colors.white54, fontSize: 11)),
          ])),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bool isFounder = widget.roleMode == ConsoleRoleMode.founder;
    final perms = widget.permissions ?? {};

    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance
          .collection('mission_realms')
          .doc(widget.missionId)
          .collection('variables')
          .snapshots(),
      builder: (context, variableSnapshot) {
        final variables = variableSnapshot.data?.docs ?? [];
        return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
          stream: FirebaseFirestore.instance
              .collection('mission_realms')
              .doc(widget.missionId)
              .collection('official_documents')
              .snapshots(),
          builder: (context, documentSnapshot) {
            if (!documentSnapshot.hasData)
              return const RcCenteredLoader(compact: true);
            final docs = documentSnapshot.data!.docs;
            final filteredDocs = docs.where(_matchesFilters).toList();
            final visibleDocs =
                docs.where((doc) => _isStudentVisible(doc.data())).toList();

            final detailTabs = [
              if (isFounder) const Tab(text: 'Upload Source'),
              const Tab(text: 'Source Documents'),
              if (isFounder) const Tab(text: 'Student Visibility'),
              if (isFounder ||
                  AdminPermissionResolver.canSeeSyllabusReview(perms))
                const Tab(text: 'Syllabus Verification'),
              if (isFounder || AdminPermissionResolver.canSeePyqReview(perms))
                const Tab(text: 'PYQ Verification'),
            ];

            // Re-sync tab controller if needed or handle mismatch
            if (_tabController.length != detailTabs.length) {
              _tabController =
                  TabController(length: detailTabs.length, vsync: this);
            }

            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _sourceAuthorityOverview(docs),
                _buildVersionHistory(),
                TabBar(
                  controller: _tabController,
                  tabs: detailTabs,
                ),
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      if (isFounder) _buildUploadSection(variables),
                      _buildRegistrySection(filteredDocs, variables),
                      if (isFounder) _buildStudentReviewSection(visibleDocs),
                      if (isFounder ||
                          AdminPermissionResolver.canSeeSyllabusReview(perms))
                        SyllabusAtomVerificationTab(
                          missionId: widget.missionId,
                          variables: variables,
                          initialDocumentId: _atomDocumentIdFilter,
                          roleMode: widget.roleMode,
                          permissions: perms,
                        ),
                      if (isFounder ||
                          AdminPermissionResolver.canSeePyqReview(perms))
                        PyqVerificationTab(
                          missionId: widget.missionId,
                          variables: variables,
                          initialDocumentId: _questionDocumentIdFilter,
                          roleMode: widget.roleMode,
                        ),
                    ],
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Widget _buildUploadSection(
      List<QueryDocumentSnapshot<Map<String, dynamic>>> variables) {
    final isSingleTrack =
        widget.mission['missionStructureType'] == 'SINGLE_TRACK';
    final List<MapEntry<String, String>> filteredScopes = _levelLabels.entries
        .where((e) => !isSingleTrack || e.key != 'VARIABLE_SPECIFIC')
        .toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: RcPanel(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('UPLOAD SOURCE DOCUMENT',
                style: TextStyle(color: rcGold, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _scope,
              decoration: const InputDecoration(labelText: 'Document Level'),
              items: filteredScopes
                  .map((entry) => DropdownMenuItem(
                      value: entry.key, child: Text(entry.value)))
                  .toList(),
              onChanged: (value) => _setScope(value!),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _documentType,
              decoration: const InputDecoration(labelText: 'Document Type'),
              items: _documentTypes[_scope]!
                  .map((entry) => DropdownMenuItem(
                      value: entry.key, child: Text(entry.value)))
                  .toList(),
              onChanged: (value) => setState(() => _documentType = value!),
            ),
            if (_scope != 'MISSION_COMMON') ...[
              const SizedBox(height: 12),
              if (variables.isEmpty)
                const Text(
                    'No variables added yet. Add variables before uploading variable-level documents.',
                    style: TextStyle(color: rcRed, fontSize: 12))
              else
                DropdownButtonFormField<String>(
                  value: _selectedVariableId,
                  decoration: const InputDecoration(labelText: 'Variable'),
                  items: variables.map((doc) {
                    final data = doc.data();
                    final label = [
                      data['displayName'] ?? data['name'] ?? doc.id,
                      data['hindiName'],
                      data['subjectCode'],
                      data['paperType'],
                    ]
                        .where((v) => v != null && v.toString().isNotEmpty)
                        .join(' / ');
                    return DropdownMenuItem(value: doc.id, child: Text(label));
                  }).toList(),
                  onChanged: (value) {
                    final doc =
                        variables.firstWhere((item) => item.id == value);
                    setState(() {
                      _selectedVariableId = value;
                      _selectedVariable = doc.data();
                    });
                  },
                ),
            ],
            if (_scope == 'PAPER_WISE') ...[
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _paperType,
                decoration: const InputDecoration(labelText: 'Paper Scope'),
                items: _getAvailablePapers()
                    .map((p) => DropdownMenuItem(
                        value: p['code'], child: Text(p['name']!)))
                    .toList(),
                onChanged: (value) => setState(() => _paperType = value!),
              ),
            ],
            const SizedBox(height: 12),
            RcField(controller: _titleCtrl, label: 'Document Title (Optional)'),
            const SizedBox(height: 6),
            const Text(
              'Optional. If blank, the file name becomes the source title.',
              style: TextStyle(color: Colors.white38, fontSize: 11),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: rcRed))
            ],
            if (_info != null) ...[
              const SizedBox(height: 12),
              Text(_info!, style: const TextStyle(color: rcGreen))
            ],
            const SizedBox(height: 18),
            const Text(
              'Upload one or more supported official source files.',
              style: TextStyle(color: Colors.white38, fontSize: 11),
            ),
            const SizedBox(height: 8),
            FilledButton.icon(
              onPressed: _uploading ? null : _uploadDocument,
              icon: const Icon(Icons.cloud_upload_rounded),
              label: Text(
                  _uploading ? 'Uploading...' : 'SELECT FILE(S) AND UPLOAD'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRegistrySection(
      List<QueryDocumentSnapshot<Map<String, dynamic>>> docs,
      List<QueryDocumentSnapshot<Map<String, dynamic>>> variables) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          MissionProcessingHealthBar(missionId: widget.missionId),
          const SizedBox(height: 16),
          _buildFilters(variables),
          const SizedBox(height: 12),
          Expanded(
            child: docs.isEmpty
                ? const Center(
                    child: Text(
                        'No mission documents match the selected filters.'))
                : ListView.separated(
                    itemCount: docs.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) =>
                        _buildDocumentCard(docs[index]),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilters(
      List<QueryDocumentSnapshot<Map<String, dynamic>>> variables) {
    final allTypes = _documentTypes.values.expand((items) => items).toList();
    return RcPanel(
      child: Wrap(
        spacing: 10,
        runSpacing: 10,
        children: [
          SizedBox(
              width: 220,
              child: RcField(
                  controller: _searchCtrl,
                  label: 'Search',
                  onChanged: (_) => setState(() {}))),
          _filter('Level', _levelFilter, {'all': 'All Levels', ..._levelLabels},
              (v) => setState(() => _levelFilter = v)),
          _filter(
              'Type',
              _typeFilter,
              {'all': 'All Types', for (final e in allTypes) e.key: e.value},
              (v) => setState(() => _typeFilter = v)),
          _filter(
              'Variable',
              _variableFilter,
              {
                'all': 'All Variables',
                for (final v in variables)
                  v.id: (v.data()['displayName'] ?? v.id).toString()
              },
              (v) => setState(() => _variableFilter = v)),
          _filter(
              'Paper',
              _paperFilter,
              {'all': 'All Papers', for (final p in _paperTypes) p: p},
              (v) => setState(() => _paperFilter = v)),
          _filter(
              'Status',
              _statusFilter,
              const {
                'all': 'All Status',
                'RECEIVED': 'RECEIVED',
                'ARCHIVED': 'ARCHIVED',
                'HIDDEN': 'HIDDEN'
              },
              (v) => setState(() => _statusFilter = v)),
          _filter(
              'Review',
              _reviewFilter,
              const {
                'all': 'All Review',
                'PENDING': 'PENDING',
                'APPROVED': 'APPROVED',
                'REJECTED': 'REJECTED'
              },
              (v) => setState(() => _reviewFilter = v)),
          _filter(
              'Publish',
              _publishFilter,
              const {
                'all': 'All Publish',
                'draft': 'draft',
                'published': 'published',
                'archived': 'archived'
              },
              (v) => setState(() => _publishFilter = v)),
          _filter(
              'AI',
              _aiFilter,
              const {
                'all': 'All AI',
                'not_queued': 'Not Queued',
                'in_queue': 'In Queue',
                'processing': 'Processing',
                'extracted': 'Extracted',
                'proposal_available': 'Proposal Available',
                'failed': 'Failed'
              },
              (v) => setState(() => _aiFilter = v)),
        ],
      ),
    );
  }

  Widget _filter(String label, String value, Map<String, String> options,
      ValueChanged<String> onChanged) {
    return SizedBox(
      width: 180,
      child: DropdownButtonFormField<String>(
        value: options.containsKey(value) ? value : 'all',
        isDense: true,
        decoration: InputDecoration(labelText: label),
        items: options.entries
            .map((entry) => DropdownMenuItem(
                value: entry.key,
                child: Text(entry.value, overflow: TextOverflow.ellipsis)))
            .toList(),
        onChanged: (value) => onChanged(value!),
      ),
    );
  }

  Widget _buildDocumentCard(QueryDocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data();
    final diagnostics = _diagnostics(data);
    final title = (data['title'] ?? data['fileName'] ?? doc.id).toString();
    final path =
        (data['storagePath'] ?? data['storageRawPath'] ?? '').toString();
    final url = (data['downloadUrl'] ?? data['sourceUrl'] ?? '').toString();
    final proposalId = (data['proposalId'] ?? '').toString();

    final extractionQuality = data['extractionQuality'] ??
        data['latestExtractionQuality'] ??
        'UNKNOWN';
    final structuredQuality = data['structuredDataQuality'] ??
        data['latestStructuredDataQuality'] ??
        'UNKNOWN';
    final isUnsafe =
        extractionQuality == 'FAILED' || structuredQuality == 'INVALID';
    final publishStatus = (data['publishStatus'] ?? '--').toString();

    return RcPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                  child: Text(title,
                      style: const TextStyle(
                          color: Colors.white, fontWeight: FontWeight.bold))),
              if (isUnsafe)
                _chip('QUALITY UNSAFE', color: rcRed)
              else
                _chip(_aiStatus(data),
                    color: _aiStatus(data) == 'Failed' ? rcRed : rcGold),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _chip(data['documentLevelLabel']?.toString() ??
                  _levelLabels[data['scope']] ??
                  'Missing level'),
              _chip(data['documentTypeLabel']?.toString() ??
                  data['documentType']?.toString() ??
                  data['type']?.toString() ??
                  'Missing type'),
              if ((data['variableName'] ?? '').toString().isNotEmpty)
                _chip(data['variableName'].toString()),
              if ((data['paperType'] ?? data['paperIndex'] ?? '')
                  .toString()
                  .isNotEmpty)
                _chip('Paper: ${data['paperType'] ?? data['paperIndex']}'),
              _chip('Status: ${data['status'] ?? '--'}'),
              _chip('Review: ${data['reviewStatus'] ?? '--'}'),
              if (data['versionNumber'] != null)
                _chip('VERSION V${data['versionNumber']}'),
              if (data['activationState'] != null)
                _chip(data['activationState'].toString(),
                    color: data['activationState'] == 'CANONICAL'
                        ? rcGreen
                        : rcGold),
              if ((data['sourceSha256'] ?? '').toString().length >= 10)
                _chip(
                    'SHA ${data['sourceSha256'].toString().substring(0, 10)}…'),
              if (publishStatus == 'published' && isUnsafe)
                _chip('LEGACY PUBLISHED / BLOCKED', color: rcRed)
              else
                _chip('Publish: $publishStatus'),
              if (data['syllabusAtomStatus'] == 'persisted') ...[
                _chip('Atoms: ${data['syllabusAtomCount'] ?? 0}',
                    color: rcGold),
                _chip('Extracted: ${data['syllabusAtomExtractedCount'] ?? 0}',
                    color: rcGreen),
                _chip('Review: ${data['syllabusAtomNeedsReviewCount'] ?? 0}',
                    color: rcRed),
                _chip('Verified: ${data['syllabusAtomVerifiedCount'] ?? 0}',
                    color: Colors.blue),
              ],
              for (final item in diagnostics) _chip(item, color: rcRed),
            ],
          ),
          const SizedBox(height: 8),
          Text(path.isEmpty ? 'No storage path recorded.' : path,
              style: const TextStyle(color: Colors.white38, fontSize: 11)),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              OutlinedButton.icon(
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (context) => MissionDocumentDetailDialog(
                        missionId: widget.missionId,
                        documentId: doc.id,
                        data: data,
                        taskId: widget.taskId,
                        onReviewAtoms: () {
                          Navigator.pop(context);
                          setState(() {
                            _atomDocumentIdFilter = doc.id;
                          });
                          _navigateToSubTab('Syllabus Verification');
                        },
                        onReviewQuestions: () {
                          Navigator.pop(context);
                          setState(() {
                            _questionDocumentIdFilter = doc.id;
                          });
                          _navigateToSubTab('PYQ Verification');
                        },
                      ),
                    );
                  },
                  icon: const Icon(Icons.info_outline_rounded, size: 16),
                  label: const Text('View Status & Details')),
              OutlinedButton.icon(
                  onPressed: url.isEmpty ? null : () => _openFile(data),
                  icon: const Icon(Icons.open_in_new_rounded, size: 16),
                  label: const Text('View File')),
              OutlinedButton.icon(
                  onPressed: _hasExtraction(data)
                      ? () => _showExtractionReview(context, data)
                      : null,
                  icon: const Icon(Icons.psychology_alt_rounded, size: 16),
                  label: Text(_hasExtraction(data)
                      ? 'View AI Extraction Review'
                      : 'AI extraction review not connected yet')),
              OutlinedButton.icon(
                  onPressed: proposalId.isEmpty
                      ? null
                      : () => _copy(context, proposalId, 'Proposal ID'),
                  icon: const Icon(Icons.task_alt_rounded, size: 16),
                  label: Text(proposalId.isEmpty
                      ? 'No AI Proposal'
                      : 'Open AI Proposal')),
              if ((data['activationState'] ?? 'CANDIDATE') == 'CANDIDATE' &&
                  ['VERIFIED', 'APPROVED'].contains(
                      (data['verificationState'] ?? data['reviewStatus'] ?? '')
                          .toString()
                          .toUpperCase()))
                FilledButton.icon(
                  onPressed: () => _activateVerifiedSource(data),
                  icon: const Icon(Icons.verified_user_outlined, size: 16),
                  label: const Text('ACTIVATE VERIFIED SOURCE'),
                  style: FilledButton.styleFrom(
                      backgroundColor: rcGold, foregroundColor: Colors.black),
                ),
              OutlinedButton.icon(
                  onPressed: () => _copy(context, doc.id, 'Document ID'),
                  icon: const Icon(Icons.copy_rounded, size: 16),
                  label: const Text('Copy ID')),
              OutlinedButton.icon(
                  onPressed: path.isEmpty
                      ? null
                      : () => _copy(context, path, 'Storage path'),
                  icon: const Icon(Icons.copy_all_rounded, size: 16),
                  label: const Text('Copy Path')),
              OutlinedButton.icon(
                  onPressed: null,
                  icon: const Icon(Icons.build_circle_outlined, size: 16),
                  label: const Text('Metadata Repair (Planned for Phase G)')),
              if (data['syllabusAtomStatus'] == 'persisted')
                FilledButton.icon(
                  onPressed: () {
                    setState(() {
                      _atomDocumentIdFilter = doc.id;
                    });
                    _navigateToSubTab('Syllabus Verification');
                  },
                  icon: const Icon(Icons.fact_check_rounded, size: 16),
                  label: const Text('Review Syllabus Atoms'),
                  style: FilledButton.styleFrom(
                      backgroundColor: rcGold, foregroundColor: Colors.black),
                ),
              if (data['questionStatus'] == 'persisted')
                FilledButton.icon(
                  onPressed: () {
                    setState(() {
                      _questionDocumentIdFilter = doc.id;
                    });
                    _navigateToSubTab('PYQ Verification');
                  },
                  icon: const Icon(Icons.quiz_rounded, size: 16),
                  label: const Text('Review PYQ Questions'),
                  style: FilledButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white),
                ),
            ],
          ),
          if (proposalId.isNotEmpty) ...[
            const SizedBox(height: 8),
            const Text('Proposal available in AI Proposals / Review',
                style: TextStyle(color: rcGreen, fontSize: 12)),
          ],
          if ((data['aiQueueError'] ?? '').toString().isNotEmpty) ...[
            const SizedBox(height: 8),
            Text('AI Queue Failed: ${data['aiQueueError']}',
                style: const TextStyle(color: rcRed, fontSize: 12)),
          ],
        ],
      ),
    );
  }

  Widget _buildStudentReviewSection(
      List<QueryDocumentSnapshot<Map<String, dynamic>>> visibleDocs) {
    final isSingleTrack =
        widget.mission['missionStructureType'] == 'SINGLE_TRACK';

    if (visibleDocs.isEmpty) {
      return const Center(
          child: Text('No documents are visible to students yet.'));
    }
    final missionDocs = visibleDocs
        .where((doc) => doc.data()['scope'] == 'MISSION_COMMON')
        .toList();
    final variableDocs = visibleDocs
        .where((doc) => doc.data()['scope'] == 'VARIABLE_SPECIFIC')
        .toList();
    final paperDocs = visibleDocs
        .where((doc) => doc.data()['scope'] == 'PAPER_WISE')
        .toList();
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        _reviewGroup('Mission-level (Common) documents', missionDocs),
        if (!isSingleTrack) ...[
          const SizedBox(height: 14),
          _reviewGroup('Variable-level documents', variableDocs,
              groupBy: 'variableName'),
        ],
        const SizedBox(height: 14),
        _reviewGroup('Paper-specific documents', paperDocs,
            groupBy: 'paperType'),
      ],
    );
  }

  Widget _reviewGroup(
      String title, List<QueryDocumentSnapshot<Map<String, dynamic>>> docs,
      {String? groupBy}) {
    return RcPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style:
                  const TextStyle(color: rcGold, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          if (docs.isEmpty)
            const Text('No visible documents in this group.',
                style: TextStyle(color: Colors.white38))
          else
            ...docs.map((doc) {
              final data = doc.data();
              final group = groupBy == null
                  ? ''
                  : ' ? ${data[groupBy] ?? data['variableName'] ?? 'Ungrouped'}';
              return ListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                title: Text(
                    (data['title'] ?? data['fileName'] ?? doc.id).toString()),
                subtitle: Text(
                    '${data['documentTypeLabel'] ?? data['documentType'] ?? data['type'] ?? '--'}$group'),
                trailing: Text((data['publishStatus'] ?? '').toString()),
              );
            }),
        ],
      ),
    );
  }

  Widget _chip(String label, {Color color = Colors.white54}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        border: Border.all(color: color.withValues(alpha: 0.3)),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(label,
          style: TextStyle(
              color: color, fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }
}
