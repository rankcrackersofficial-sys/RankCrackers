import 'dart:typed_data';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:pdfx/pdfx.dart';
import 'package:dio/dio.dart';
import 'package:rank_crackers/core/theme/app_colors.dart';
import 'package:rank_crackers/core/theme/app_typography.dart';
import 'package:rank_crackers/core/models/sentinel_draft.dart';
import 'package:rank_crackers/core/models/notification_canonical.dart';
import 'package:rank_crackers/core/models/syllabus_canonical.dart';
import 'package:rank_crackers/core/backend/realm_repository.dart';
import 'package:rank_crackers/core/engines/realm_constitution_engine.dart';
import 'package:rank_crackers/core/models/recruitment_realm.dart';
import 'package:rank_crackers/features/admin/data/repositories/sentinel_admin_repository.dart';
import 'package:rank_crackers/core/theme/tactical_noir_background.dart';
import 'package:rank_crackers/core/widgets/dark_card.dart';
import '../shared/founder_header.dart';

class VerificationWorkspace extends StatefulWidget {
  final SentinelDraft draft;
  const VerificationWorkspace({super.key, required this.draft});

  @override
  State<VerificationWorkspace> createState() => _VerificationWorkspaceState();
}

class _VerificationWorkspaceState extends State<VerificationWorkspace> {
  PdfControllerPinch? _pdfController;
  bool _isLoadingPdf = true;
  String? _pdfError;
  
  final Map<String, dynamic> _corrections = {};
  bool _isEditing = false;

  @override
  void initState() {
    super.initState();
    _initPdf();
  }

  Future<void> _initPdf() async {
    final url = widget.draft.audit.sourceUrl;
    if (url.isEmpty) {
      if (mounted) setState(() { _isLoadingPdf = false; _pdfError = "SOURCE URL IS EMPTY"; });
      return;
    }

    try {
      final bytes = await InternetPdfReader.get(url);
      if (mounted) {
        setState(() {
          _pdfController = PdfControllerPinch(document: PdfDocument.openData(bytes));
          _isLoadingPdf = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _isLoadingPdf = false; _pdfError = "FAILED TO LOAD PDF: $e"; });
    }
  }

  void _jumpToEvidence(Evidence? evidence) {
    if (evidence == null || _pdfController == null) return;
    _pdfController!.jumpToPage(evidence.page);
  }

  @override
  void dispose() {
    _pdfController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: TacticalNoirBackground(
        child: SafeArea(
          child: Column(
            children: [
              const FounderHeader(showBackButton: true),
              _buildHeader(),
              Expanded(
                child: Row(
                  children: [
                    Expanded(flex: 3, child: _buildPdfPreview()),
                    Expanded(flex: 2, child: _buildVerificationPanel()),
                  ],
                ),
              ),
              _buildActionBar(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    final data = widget.draft.rawData;
    final String type = widget.draft.type;
    
    String title = "UNKNOWN DOCUMENT";
    String org = "UNKNOWN";
    String status = widget.draft.status.toUpperCase();
    int confidence = (widget.draft.audit.confidenceScore * 100).toInt();

    if (type == 'notification') {
      final canonical = NotificationCanonical.fromMap(data);
      title = canonical.identity.recruitmentName;
      org = canonical.identity.organization;
      confidence = (canonical.evidence.confidence.average * 100).toInt();
    } else if (type == 'syllabus') {
      final canonical = SyllabusCanonical.fromMap(data);
      title = "${canonical.subject} Syllabus";
      org = "STAGED: ${canonical.stage}";
      confidence = (canonical.confidenceScore * 100).toInt();
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Colors.white10))),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: AppTypography.hero.copyWith(fontSize: 18, color: AppColors.gold)),
                Row(
                  children: [
                    Text("ORG: $org | STATUS: $status", style: AppTypography.label.copyWith(fontSize: 8, color: Colors.white24)),
                    const SizedBox(width: 12),
                    _resolutionBadge(),
                  ],
                ),
              ],
            ),
          ),
          _metricItem("CONFIDENCE", "$confidence%", _getConfidenceColor(confidence)),
          const SizedBox(width: 24),
          _metricItem("VERSION", widget.draft.audit.workerVersion, Colors.blueAccent),
          const SizedBox(width: 24),
          IconButton(
            icon: Icon(_isEditing ? Icons.save_rounded : Icons.edit_rounded, color: _isEditing ? Colors.greenAccent : Colors.white24, size: 18),
            onPressed: () => setState(() => _isEditing = !_isEditing),
          ),
        ],
      ),
    );
  }

  Widget _resolutionBadge() {
    final data = widget.draft.rawData;
    final String type = widget.draft.type;
    bool isLinked = false;

    if (type == 'notification') {
      final canonical = NotificationCanonical.fromMap(data);
      isLinked = canonical.identity.linkedRealmId != null;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: (isLinked ? Colors.blueAccent : AppColors.gold).withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: (isLinked ? Colors.blueAccent : AppColors.gold).withValues(alpha: 0.3)),
      ),
      child: Text(isLinked ? "LINKED TO REALM" : "NEW RECRUITMENT", 
        style: TextStyle(color: isLinked ? Colors.blueAccent : AppColors.gold, fontSize: 7, fontWeight: FontWeight.bold)),
    );
  }

  Widget _metricItem(String label, String value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Text(label, style: AppTypography.label.copyWith(fontSize: 7, color: Colors.white24)),
        Text(value, style: AppTypography.body.copyWith(fontSize: 14, fontWeight: FontWeight.bold, color: color)),
      ],
    );
  }

  Color _getConfidenceColor(int score) {
    if (score >= 95) return Colors.greenAccent;
    if (score >= 80) return Colors.orangeAccent;
    return Colors.redAccent;
  }

  Widget _buildPdfPreview() {
    if (_isLoadingPdf) return const Center(child: CircularProgressIndicator(color: AppColors.gold));
    if (_pdfError != null) return Center(child: Text(_pdfError!, style: const TextStyle(color: Colors.white24)));

    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.black, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white10)),
      clipBehavior: Clip.antiAlias,
      child: PdfViewPinch(controller: _pdfController!),
    );
  }

  Widget _buildVerificationPanel() {
    final data = widget.draft.rawData;
    final String type = widget.draft.type;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(color: Colors.black45, border: Border(left: BorderSide(color: Colors.white10))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("AI INTELLIGENCE REPORT", style: AppTypography.label.copyWith(fontSize: 9, letterSpacing: 1.5)),
          const SizedBox(height: 24),
          Expanded(
            child: ListView(
              children: [
                if (type == 'notification') ..._buildNotificationFindings(NotificationCanonical.fromMap(data)),
                if (type == 'syllabus') ...[
                  ..._buildSyllabusFindings(SyllabusCanonical.fromMap(data)),
                  const Divider(color: Colors.white10, height: 40),
                  _buildManifestedBlocksSection(),
                ],
                if (type == 'digibook') ..._buildDigiBookFindings(data),
                
                const Divider(color: Colors.white10, height: 40),
                _buildAuditPanel(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildNotificationFindings(NotificationCanonical canonical) {
    return [
      _buildFindingsGroup("1. RECRUITMENT IDENTITY", [
        _findingItem("Recruitment Name", canonical.identity.recruitmentName, key: 'identity.recruitment_name'),
        _findingItem("Organization", canonical.identity.organization, key: 'identity.organization'),
        _findingItem("Notice No", canonical.identity.notificationNumber, key: 'identity.notification_number'),
      ]),
      _buildFindingsGroup("2. VACANCY INTELLIGENCE", [
        _findingItem("Total Vacancies", canonical.intelligence.vacancy.totalVacancies.toString(), key: 'intelligence.vacancy.total_vacancies', evidence: canonical.evidence.factEvidence['total_vacancies']),
      ]),
      _buildFindingsGroup("3. EXAM & ELIGIBILITY", [
        _findingItem("Stages", canonical.intelligence.exam.stages.join(", "), key: 'intelligence.exam.stages'),
        _findingItem("Min Age", canonical.intelligence.eligibility.minimumAge?.toString() ?? "N/A", key: 'intelligence.eligibility.min_age'),
        _findingItem("Max Age", canonical.intelligence.eligibility.maximumAge?.toString() ?? "N/A", key: 'intelligence.eligibility.max_age'),
      ]),
      _buildFindingsGroup("4. ATOMIC RULES (${canonical.intelligence.atomicRules.length})", 
        canonical.intelligence.atomicRules.map<Widget>((AtomicNotificationRule r) => _findingItem(r.type, r.statement, page: r.page, key: "intelligence.atomic_rule.${r.ruleId}")).toList(),
      ),
      _buildFindingsGroup("5. KNOWLEDGE GRAPH", [
        _findingItem("Linked Syllabus", canonical.graph.linkedSyllabusTopics.join(", "), key: 'graph.linked_syllabus'),
        _findingItem("Linked Rules", canonical.graph.linkedRules.join(", "), key: 'graph.linked_rules'),
      ]),
    ];
  }

  List<Widget> _buildSyllabusFindings(SyllabusCanonical canonical) {
    return [
      _buildFindingsGroup("1. KNOWLEDGE IDENTITY", [
        _findingItem("Subject", canonical.subject, key: 'subject'),
        _findingItem("Stage", canonical.stage, key: 'stage'),
      ]),
    ];
  }

  List<Widget> _buildDigiBookFindings(Map<String, dynamic> data) {
    final List<dynamic> units = data['units'] ?? [];
    final String realmId = data['realmId'] ?? 'unknown';

    return [
      _buildFindingsGroup("1. DIGIBOOK SCOPE", [
        _findingItem("Parent Realm", realmId, key: 'realmId'),
        _findingItem("Total Units", units.length.toString(), key: 'unit_count'),
      ]),
      _buildFindingsGroup("2. CONTENT REVIEW (${units.length} UNITS)", 
        units.map((u) => _buildDigiBookUnitRow(u)).toList(),
      ),
    ];
  }

  Widget _buildManifestedBlocksSection() {
    final sourceId = widget.draft.sourceId;
    if (sourceId == null) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionLabel("MANIFESTED KNOWLEDGE BLOCKS"),
        const SizedBox(height: 16),
        StreamBuilder<QuerySnapshot>(
          stream: FirebaseFirestore.instance
              .collection('digibook_refinery')
              .where('sourceDocumentId', isEqualTo: sourceId)
              .snapshots(),
          builder: (context, snapshot) {
            if (!snapshot.hasData) return const Center(child: CircularProgressIndicator(color: AppColors.gold));
            final docs = snapshot.data!.docs;
            if (docs.isEmpty) return Text("No blocks manifested yet. Pull the trigger.", style: AppTypography.label.copyWith(color: Colors.white24));

            return Column(
              children: docs.map((doc) {
                final data = doc.data() as Map<String, dynamic>;
                final status = data['status'] ?? 'review';
                final isVerified = status == 'verified';

                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: DarkCard(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(color: isVerified ? Colors.greenAccent.withValues(alpha: 0.1) : AppColors.gold.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(4)),
                              child: Text(data['type']?.toString().toUpperCase() ?? 'BLOCK', style: TextStyle(color: isVerified ? Colors.greenAccent : AppColors.gold, fontSize: 8, fontWeight: FontWeight.bold)),
                            ),
                            const Spacer(),
                            if (!isVerified)
                              IconButton(
                                icon: const Icon(Icons.check_circle_outline_rounded, color: Colors.greenAccent, size: 18),
                                onPressed: () => SentinelAdminRepository.verifyKnowledgeBlock(doc.id),
                              ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(data['title'] ?? 'No Title', style: AppTypography.cardTitle.copyWith(fontSize: 12)),
                        const SizedBox(height: 6),
                        Text(data['content'] ?? '', style: AppTypography.body.copyWith(fontSize: 10, color: Colors.white70)),
                      ],
                    ),
                  ),
                );
              }).toList(),
            );
          },
        ),
      ],
    );
  }

  Widget _buildDigiBookUnitRow(Map<String, dynamic> unit) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(color: AppColors.gold.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(4)),
                child: Text(unit['atomic_topic_id'] ?? 'ATOMIC', style: const TextStyle(color: AppColors.gold, fontSize: 6, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(width: 8),
              Expanded(child: Text(unit['concept'] ?? 'Concept', style: AppTypography.body.copyWith(fontSize: 10, fontWeight: FontWeight.bold))),
            ],
          ),
          const SizedBox(height: 8),
          _findingItem("Definition", unit['definition'] ?? '', key: "units.${unit['id']}.definition"),
          _findingItem("Explanation", unit['explanation'] ?? '', key: "units.${unit['id']}.explanation"),
        ],
      ),
    );
  }

  Widget _sectionLabel(String text) => Text(text.toUpperCase(), style: AppTypography.label.copyWith(color: AppColors.secondaryText));

  Widget _buildFindingsGroup(String title, List<Widget> items) {
    return Theme(
      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
      child: ExpansionTile(
        title: Text(title, style: AppTypography.label.copyWith(fontSize: 10, color: Colors.white54, fontWeight: FontWeight.bold)),
        childrenPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        children: items,
        initiallyExpanded: true,
      ),
    );
  }

  Widget _findingItem(String label, String value, {required String key, Evidence? evidence, int? page}) {
    final correctedValue = _corrections[key] ?? value;
    final isCorrected = _corrections.containsKey(key);

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(label, style: AppTypography.label.copyWith(fontSize: 7, color: isCorrected ? Colors.greenAccent : Colors.white24)),
              const Spacer(),
              if (evidence != null || page != null) 
                _jumpButton(evidence ?? Evidence(page: page ?? 1)),
            ],
          ),
          const SizedBox(height: 4),
          if (_isEditing)
            TextFormField(
              initialValue: correctedValue,
              style: AppTypography.body.copyWith(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.white),
              onChanged: (val) => _corrections[key] = val,
            )
          else
            Text(correctedValue, style: AppTypography.body.copyWith(fontSize: 11, fontWeight: FontWeight.w600, color: isCorrected ? Colors.greenAccent : Colors.white)),
          
          if (evidence?.extractedText.isNotEmpty ?? false) ...[
            const SizedBox(height: 8),
            _buildEvidenceTrace(evidence!),
          ],
        ],
      ),
    );
  }

  Widget _buildEvidenceTrace(Evidence evidence) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.03), borderRadius: BorderRadius.circular(4)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("SOURCE EVIDENCE (P${evidence.page})", style: AppTypography.label.copyWith(fontSize: 6, color: Colors.white24)),
          const SizedBox(height: 4),
          Text("\"${evidence.extractedText}\"", style: AppTypography.body.copyWith(fontSize: 9, color: Colors.white54, fontStyle: FontStyle.italic)),
        ],
      ),
    );
  }

  Widget _jumpButton(Evidence evidence) {
    return GestureDetector(
      onTap: () => _jumpToEvidence(evidence),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        decoration: BoxDecoration(border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)), borderRadius: BorderRadius.circular(4)),
        child: Text("P${evidence.page}", style: const TextStyle(color: AppColors.gold, fontSize: 6, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildAuditPanel() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text("AI AUDIT PANEL", style: AppTypography.label.copyWith(fontSize: 8, color: Colors.white24)),
        const SizedBox(height: 12),
        _auditRow("Chunk Engine", "v4.0 SUCCESS"),
        _auditRow("Extraction", "v2.0 SUCCESS"),
        _auditRow("Knowledge Linker", "ACTIVE"),
      ],
    );
  }

  Widget _auditRow(String worker, String status) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Text(worker, style: AppTypography.body.copyWith(fontSize: 9, color: Colors.white38)),
          const Spacer(),
          Text(status, style: AppTypography.label.copyWith(fontSize: 8, color: Colors.greenAccent, fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }

  Widget _buildActionBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(color: Colors.black, border: Border(top: BorderSide(color: Colors.white10))),
      child: Row(
        children: [
          Expanded(child: _actionButton(title: "REPROCESS", color: Colors.white10, onTap: () => _handleAction('reprocess'))),
          const SizedBox(width: 12),
          Expanded(child: _actionButton(title: "MANIFEST", color: Colors.blueAccent, textColor: Colors.white, onTap: () => _handleAction('manifest_learning'))),
          const SizedBox(width: 12),
          Expanded(child: _actionButton(title: "REJECT", color: Colors.redAccent, onTap: () => _handleAction('reject'))),
          const SizedBox(width: 12),
          Expanded(child: _actionButton(title: "VERIFY", color: AppColors.gold, textColor: Colors.black, onTap: () => _handleAction('verify'))),
          const SizedBox(width: 12),
          Expanded(child: _actionButton(title: "PUBLISH", color: Colors.greenAccent, textColor: Colors.black, onTap: () => _handleAction('publish'))),
        ],
      ),
    );
  }

  Future<void> _handleAction(String action) async {
    if (action == 'publish') {
      final data = widget.draft.rawData;
      final canonical = NotificationCanonical.fromMap(data);
      final String realmId = "rec_${canonical.identity.organization.toLowerCase()}_${canonical.identity.recruitmentName.toLowerCase().replaceAll(' ', '_')}_2026";
      final realm = await RealmRepository.getRealm(realmId);
      if (realm != null) {
        final eligibility = RealmConstitutionEngine.validateLaunchEligibility(realm);
        if (!eligibility['canLaunch']) {
          if (mounted) _showBlockingError(eligibility['blockingErrors']);
          return;
        }
      }
    }

    final List<Map<String, dynamic>> structuredCorrections = [];
    _corrections.forEach((key, value) {
      structuredCorrections.add({
        'field_path': key,
        'original_value': _getOriginalValue(key),
        'corrected_value': value,
        'worker_version': widget.draft.audit.workerVersion,
        'pdf_hash': widget.draft.audit.sourceHash,
        'corrected_by': 'Founder',
        'timestamp': DateTime.now().toIso8601String(),
      });
    });

    await SentinelAdminRepository.handleAction(
      draftId: widget.draft.id, 
      action: action,
      payload: structuredCorrections.isNotEmpty ? {'corrections': structuredCorrections} : null,
    );

    if (mounted) Navigator.pop(context);
  }

  dynamic _getOriginalValue(String key) {
    final parts = key.split('.');
    dynamic current = widget.draft.rawData;
    for (final part in parts) {
      if (current is Map && current.containsKey(part)) { current = current[part]; } 
      else { return "unknown_original"; }
    }
    return current;
  }

  void _showBlockingError(List<String> errors) {
    showDialog(context: context, builder: (context) => AlertDialog(
      backgroundColor: Colors.black,
      title: const Text("LAUNCH BLOCKED", style: TextStyle(color: Colors.redAccent)),
      content: Column(mainAxisSize: MainAxisSize.min, children: errors.map((e) => Text("• $e")).toList()),
      actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text("OK"))],
    ));
  }

  Widget _actionButton({required String title, required Color color, Color? textColor, required VoidCallback onTap}) {
    return SizedBox(height: 44, child: TextButton(
      onPressed: onTap,
      style: TextButton.styleFrom(backgroundColor: color, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
      child: Text(title, style: AppTypography.cardTitle.copyWith(fontSize: 10, color: textColor ?? Colors.white, fontWeight: FontWeight.w900)),
    ));
  }
}

class InternetPdfReader {
  static Future<Uint8List> get(String url) async {
    final dio = Dio();
    final response = await dio.get<List<int>>(url, options: Options(responseType: ResponseType.bytes));
    return Uint8List.fromList(response.data!);
  }
}
