import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/widgets/dark_card.dart';

class OutcomeVerificationCenter extends StatefulWidget {
  const OutcomeVerificationCenter({super.key});

  @override
  State<OutcomeVerificationCenter> createState() => _OutcomeVerificationCenterState();
}

class _OutcomeVerificationCenterState extends State<OutcomeVerificationCenter> {
  bool _showProdOnly = true;

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 7, // Forensic Fix: Corrected length for 7 tabs
      child: Column(
        children: [
          _governanceHeader(),
          TabBar(
            isScrollable: true,
            dividerColor: Colors.transparent,
            indicatorColor: AppColors.gold,
            labelColor: AppColors.gold,
            unselectedLabelColor: Colors.white30,
            labelStyle: AppTypography.label.copyWith(fontSize: 8, fontWeight: FontWeight.bold),
            tabs: const [
              Tab(text: "PENDING"),
              Tab(text: "FLAGGED 🚨"),
              Tab(text: "ELIGIBLE"),
              Tab(text: "PIPELINE"),
              Tab(text: "FORENSICS 🔍"),
              Tab(text: "REGISTRY"),
              Tab(text: "FAILED"),
            ],
          ),
          Expanded(
            child: TabBarView(
              children: [
                _ParticipantOutcomeList(status: 'PENDING_VERIFICATION', showProdOnly: _showProdOnly),
                _ParticipantOutcomeList(status: 'FLAGGED', showProdOnly: _showProdOnly),
                _ParticipantOutcomeList(status: 'CERTIFICATE_ELIGIBLE', showProdOnly: _showProdOnly),
                const _PipelineMonitor(),
                const _IngestionForensics(),
                const _RegistryViewer(),
                const _FailedJobConsole(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _governanceHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: Row(
        children: [
          _purgeButton(),
          const Spacer(),
          Text("PRODUCTION ONLY", style: AppTypography.label.copyWith(fontSize: 8, color: Colors.white24)),
          const SizedBox(width: 8),
          Switch(
            value: _showProdOnly, 
            activeColor: AppColors.gold,
            onChanged: (v) => setState(() => _showProdOnly = v)
          ),
        ],
      ),
    );
  }

  Widget _purgeButton() {
    return OutlinedButton.icon(
      onPressed: () => _confirmPurge(),
      icon: const Icon(Icons.cleaning_services_rounded, size: 12, color: Colors.redAccent),
      label: Text("PURGE TEST DATA", style: AppTypography.label.copyWith(fontSize: 7, color: Colors.redAccent)),
      style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.redAccent)),
    );
  }

  Future<void> _confirmPurge() async {
    bool? confirmed = await showDialog(
      context: context,
      builder: (c) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text("FORENSIC PURGE", style: TextStyle(color: Colors.redAccent)),
        content: const Text("This will permanently delete all warriors lacking the environment tag or marked as Mock Data. Continue?"),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c, false), child: const Text("CANCEL")),
          TextButton(onPressed: () => Navigator.pop(c, true), child: const Text("EXECUTE PURGE", style: TextStyle(color: Colors.redAccent))),
        ],
      )
    );
    if (confirmed == true) {
       final callable = FirebaseFunctions.instanceFor(region: 'us-central1').httpsCallable('handleSentinelAction');
       await callable.call({'action': 'purge_historical_test_data'});
       if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Purge complete.")));
    }
  }
}

class _ParticipantOutcomeList extends StatelessWidget {
  final String status;
  final bool showProdOnly;
  const _ParticipantOutcomeList({required this.status, required this.showProdOnly});

  @override
  Widget build(BuildContext context) {
    Query query = FirebaseFirestore.instance.collectionGroup('participants')
        .where('attempts.FINAL_RESULT.status', isEqualTo: status);
    
    if (showProdOnly) {
      query = query.where('environment', isEqualTo: 'rankcrackers-55');
    }

    return StreamBuilder<QuerySnapshot>(
      stream: query.snapshots(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator(color: AppColors.gold));
        final docs = snapshot.data?.docs ?? [];
        if (docs.isEmpty) return _emptyState("NO DATA IN $status");

        return ListView.builder(
          padding: const EdgeInsets.all(24),
          itemCount: docs.length,
          itemBuilder: (context, index) {
            final data = docs[index].data() as Map<String, dynamic>;
            final realmRef = docs[index].reference.parent.parent!;
            return _VerificationCard(participantData: data, realmId: realmRef.id, status: status);
          },
        );
      },
    );
  }

  Widget _emptyState(String msg) => Center(
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Icon(Icons.verified_user_outlined, color: Colors.white10, size: 48),
        const SizedBox(height: 16),
        Text(msg, style: AppTypography.label.copyWith(color: Colors.white24, fontSize: 8)),
      ],
    ),
  );
}

class _VerificationCard extends StatefulWidget {
  final Map<String, dynamic> participantData;
  final String realmId;
  final String status;
  const _VerificationCard({required this.participantData, required this.realmId, required this.status});

  @override
  State<_VerificationCard> createState() => _VerificationCardState();
}

class _VerificationCardState extends State<_VerificationCard> {
  bool _isProcessing = false;
  bool _evidenceVerified = false;
  final _scoreController = TextEditingController();
  final _rankController = TextEditingController();

  Future<void> _handleAction(String action, {Map<String, dynamic>? extraPayload}) async {
    setState(() => _isProcessing = true);
    try {
      final callable = FirebaseFunctions.instanceFor(region: 'us-central1').httpsCallable('handleSentinelAction');
      await callable.call({
        'action': action,
        'recruitmentId': widget.realmId,
        'payload': {
          'userId': widget.participantData['uid'],
          'milestoneType': 'FINAL_RESULT',
          'verifiedScore': double.tryParse(_scoreController.text),
          'verifiedRank': _rankController.text.isNotEmpty ? _rankController.text : null,
          ...?extraPayload
        }
      });
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e")));
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final attempts = widget.participantData['attempts'] as Map? ?? {};
    final attempt = attempts['FINAL_RESULT'] ?? (attempts.values.isNotEmpty ? attempts.values.firstWhere((a) => a is Map && a['status'] == widget.status, orElse: () => {}) : {});
    
    final int authScore = (attempt['authenticityScore'] ?? 0).toInt();
    
    final String uid = widget.participantData['uid']?.toString() ?? 'UNKNOWN';
    final String shortUid = uid.length > 8 ? uid.substring(0, 8) : uid;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: DarkCard(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("WARRIOR: $shortUid...", style: AppTypography.body.copyWith(fontWeight: FontWeight.bold, fontSize: 12)),
                      Text("MISSION: ${widget.realmId.toUpperCase()}", style: AppTypography.label.copyWith(fontSize: 8, color: AppColors.gold)),
                    ],
                  ),
                ),
                _authenticityBadge(authScore),
              ],
            ),
            const Divider(height: 32, color: Colors.white10),
            
            if (widget.status == 'FLAGGED')
               Padding(
                 padding: const EdgeInsets.only(bottom: 16),
                 child: Text("🚩 FLAG REASON: ${attempt['flagReason'] ?? 'SUSPICIOUS DATA'}", style: const TextStyle(color: Colors.redAccent, fontSize: 8, fontWeight: FontWeight.bold)),
               ),
            
            _metricsGrid(attempt),
            const SizedBox(height: 24),
            
            if (attempt['claimedResultUrl'] != null || attempt['resultUrl'] != null)
              _linkBtn("OPEN CLAIMED RESULT URL", attempt['claimedResultUrl'] ?? attempt['resultUrl']),
            if (attempt['claimedScreenshotUrl'] != null || attempt['screenshotUrl'] != null)
              _linkBtn("VIEW SCREENSHOT PROOF", attempt['claimedScreenshotUrl'] ?? attempt['screenshotUrl']),

            const SizedBox(height: 24),

            if (widget.status == 'PENDING_VERIFICATION' || widget.status == 'FLAGGED') ...[
              _verificationForm(),
              const SizedBox(height: 12),
              Row(
                children: [
                  Checkbox(
                    value: _evidenceVerified, 
                    activeColor: AppColors.gold,
                    onChanged: (v) => setState(() => _evidenceVerified = v!)
                  ),
                  Text("I HAVE AUDITED PHYSICAL PROOF", style: AppTypography.label.copyWith(fontSize: 7, color: Colors.white38)),
                ],
              ),
              const SizedBox(height: 12),
            ],

            if (_isProcessing)
              const LinearProgressIndicator(color: AppColors.gold, minHeight: 2)
            else if (widget.status == 'PENDING_VERIFICATION' || widget.status == 'FLAGGED')
              Row(
                children: [
                  Expanded(child: _btn("VERIFY & UNLOCK", Colors.greenAccent, _evidenceVerified ? () => _handleAction('verify_participant_claim', extraPayload: {'status': 'VERIFIED'}) : null)),
                  const SizedBox(width: 12),
                  Expanded(child: _btn("REJECT", Colors.redAccent, () => _handleAction('verify_participant_claim', extraPayload: {'status': 'REJECTED'}), outlined: true)),
                ],
              )
            else if (widget.status == 'CERTIFICATE_ELIGIBLE')
              _btn("GENERATE CERTIFICATE", AppColors.gold, () => _handleAction('declare_result', extraPayload: {'finalStatus': 'WON'})),
          ],
        ),
      ),
    );
  }

  Widget _metricsGrid(Map attempt) {
    return Row(
      children: [
        Expanded(child: _infoRow("CLAIMED SCORE", "${attempt['claimedScore'] ?? attempt['score'] ?? 'N/A'}%")),
        Expanded(child: _infoRow("CLAIMED RANK", attempt['claimedRank'] ?? attempt['rank'] ?? 'N/A')),
        Expanded(child: _infoRow("ROLL NUMBER", attempt['claimedRollNumber'] ?? attempt['rollNumber'] ?? 'N/A')),
      ],
    );
  }

  Widget _verificationForm() {
    return Row(
      children: [
        Expanded(child: TextField(controller: _scoreController, style: const TextStyle(fontSize: 10), decoration: const InputDecoration(labelText: "VERIFIED SCORE %", labelStyle: TextStyle(fontSize: 7)))),
        const SizedBox(width: 12),
        Expanded(child: TextField(controller: _rankController, style: const TextStyle(fontSize: 10), decoration: const InputDecoration(labelText: "VERIFIED RANK", labelStyle: TextStyle(fontSize: 7)))),
      ],
    );
  }

  Widget _authenticityBadge(int score) {
    final color = score > 80 ? Colors.greenAccent : (score > 50 ? Colors.orangeAccent : Colors.redAccent);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(4)),
      child: Text("$score% AUTHENTICITY", style: TextStyle(color: color, fontSize: 7, fontWeight: FontWeight.bold)),
    );
  }

  Widget _infoRow(String l, String v) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Text(l, style: AppTypography.label.copyWith(fontSize: 6, color: Colors.white24)),
    const SizedBox(height: 2),
    Text(v, style: AppTypography.body.copyWith(fontSize: 9, color: Colors.white70)),
  ]);

  Widget _linkBtn(String l, String? u) {
    if (u == null || u.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: InkWell(onTap: () => launchUrl(Uri.parse(u)), child: Text(l, style: const TextStyle(color: Colors.blueAccent, fontSize: 8, decoration: TextDecoration.underline))),
    );
  }

  Widget _btn(String l, Color c, VoidCallback? t, {bool outlined = false}) => ElevatedButton(
    onPressed: t,
    style: ElevatedButton.styleFrom(backgroundColor: outlined ? Colors.transparent : c, foregroundColor: outlined ? c : Colors.black, side: outlined ? BorderSide(color: c) : null, minimumSize: const Size(double.infinity, 36)),
    child: Text(l, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
  );
}

class _PipelineMonitor extends StatelessWidget {
  const _PipelineMonitor();
  @override
  Widget build(BuildContext context) {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance.collection('certificates').orderBy('issueDate', descending: true).limit(20).snapshots(),
      builder: (context, snapshot) {
        final docs = snapshot.data?.docs ?? [];
        return ListView.builder(
          padding: const EdgeInsets.all(24),
          itemCount: docs.length,
          itemBuilder: (context, index) {
            final data = docs[index].data() as Map<String, dynamic>;
            final status = data['status'] ?? 'UNKNOWN';
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: DarkCard(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    _statusIcon(status),
                    const SizedBox(width: 16),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text("CERT: ${docs[index].id.substring(0, 12)}...", style: AppTypography.body.copyWith(fontSize: 11, fontWeight: FontWeight.bold)),
                      Text("USER: ${data['userId']} | REGISTRY_APPR: ${data['isRegistryApproved']}", style: AppTypography.label.copyWith(fontSize: 7, color: Colors.white24)),
                    ])),
                    if (status == 'ACTIVE' && data['isRegistryApproved'] != true)
                      IconButton(
                        onPressed: () => FirebaseFunctions.instanceFor(region: 'us-central1').httpsCallable('handleSentinelAction').call({'action': 'approve_for_registry', 'payload': {'certificateId': docs[index].id}}),
                        icon: const Icon(Icons.publish_rounded, color: AppColors.gold, size: 16),
                      ),
                    Text(status, style: AppTypography.label.copyWith(color: _statusColor(status), fontSize: 7, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _statusIcon(String s) {
    if (s == 'ACTIVE') return const Icon(Icons.verified_rounded, color: Colors.greenAccent, size: 16);
    if (s == 'FAILED') return const Icon(Icons.error_outline_rounded, color: Colors.redAccent, size: 16);
    return const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.gold));
  }

  Color _statusColor(String s) {
    if (s == 'ACTIVE') return Colors.greenAccent;
    if (s == 'FAILED') return Colors.redAccent;
    if (s == 'REVOKED') return Colors.redAccent;
    return AppColors.gold;
  }
}

class _IngestionForensics extends StatelessWidget {
  const _IngestionForensics();

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance.collection('ingestion_refinery').orderBy('createdAt', descending: true).limit(30).snapshots(),
      builder: (context, snapshot) {
        final docs = snapshot.data?.docs ?? [];
        if (docs.isEmpty) return const Center(child: Text("NO RECENT INGESTION DATA", style: TextStyle(color: Colors.white10, fontSize: 10)));
        
        return ListView.builder(
          padding: const EdgeInsets.all(24),
          itemCount: docs.length,
          itemBuilder: (context, index) {
            final data = docs[index].data() as Map<String, dynamic>;
            final status = data['status'] ?? 'RECEIVED';
            
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: DarkCard(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        _getTypeIcon(data['fileType']),
                        const SizedBox(width: 12),
                        Expanded(child: Text(data['fileName'] ?? 'Unknown Source', style: AppTypography.body.copyWith(fontSize: 11, fontWeight: FontWeight.bold))),
                        Text(status.toString().toUpperCase(), style: AppTypography.label.copyWith(fontSize: 7, color: _getStatusColor(status))),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text("EXTRACTION: ${data['fullText'] != null ? 'SUCCESS (Bytes Found)' : 'PENDING'}", 
                      style: AppTypography.label.copyWith(fontSize: 7, color: data['fullText'] != null ? Colors.greenAccent : Colors.orangeAccent)),
                    if (data['linkedDraftId'] != null)
                      Text("DRAFT ID: ${data['linkedDraftId']}", style: AppTypography.label.copyWith(fontSize: 6, color: Colors.blueAccent)),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _getTypeIcon(String? type) {
    if (type == 'pdf') return const Icon(Icons.picture_as_pdf_rounded, color: Colors.redAccent, size: 14);
    if (type == 'xlsx') return const Icon(Icons.table_chart_rounded, color: Colors.greenAccent, size: 14);
    return const Icon(Icons.insert_drive_file_rounded, color: Colors.white24, size: 14);
  }

  Color _getStatusColor(String s) {
    if (s == 'under_review') return Colors.greenAccent;
    if (s == 'failed') return Colors.redAccent;
    return AppColors.gold;
  }
}

class _RegistryViewer extends StatelessWidget {
  const _RegistryViewer();
  @override
  Widget build(BuildContext context) {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance.collection('certificate_registry').orderBy('u_at', descending: true).limit(20).snapshots(),
      builder: (context, snapshot) {
        final docs = snapshot.data?.docs ?? [];
        return ListView.builder(
          padding: const EdgeInsets.all(24),
          itemCount: docs.length,
          itemBuilder: (context, index) {
            final data = docs[index].data() as Map<String, dynamic>;
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: DarkCard(
                padding: const EdgeInsets.all(16),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Text("HASH: ${data['v'].toString().substring(0, 16)}...", style: AppTypography.label.copyWith(fontSize: 8, color: AppColors.gold)),
                    const Spacer(),
                    Text(data['s'] ?? 'VALID', style: TextStyle(color: data['s'] == 'REVOKED' ? Colors.redAccent : Colors.greenAccent, fontSize: 7, fontWeight: FontWeight.bold)),
                  ]),
                  const SizedBox(height: 8),
                  Text(data['m']?['examName'] ?? 'Mission Victory', style: AppTypography.body.copyWith(fontSize: 12, fontWeight: FontWeight.bold)),
                ]),
              ),
            );
          },
        );
      },
    );
  }
}

class _FailedJobConsole extends StatelessWidget {
  const _FailedJobConsole();
  @override
  Widget build(BuildContext context) {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance.collection('certificates').where('status', isEqualTo: 'FAILED').snapshots(),
      builder: (context, snapshot) {
        final docs = snapshot.data?.docs ?? [];
        if (docs.isEmpty) return const Center(child: Text("NO FAILED JOBS", style: TextStyle(color: Colors.white10, fontSize: 10)));
        return ListView.builder(
          padding: const EdgeInsets.all(24),
          itemCount: docs.length,
          itemBuilder: (context, index) {
            final data = docs[index].data() as Map<String, dynamic>;
            return DarkCard(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text("ERROR: ${data['error'] ?? 'Unknown Rendering Error'}", style: TextStyle(color: Colors.redAccent, fontSize: 10)),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () => FirebaseFunctions.instanceFor(region: 'us-central1').httpsCallable('handleSentinelAction').call({
                    'action': 'retry_certificate_render',
                    'payload': {'certificateId': docs[index].id}
                  }),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.white10),
                  child: const Text("RETRY RENDER", style: TextStyle(fontSize: 9)),
                )
              ]),
            );
          },
        );
      },
    );
  }
}
