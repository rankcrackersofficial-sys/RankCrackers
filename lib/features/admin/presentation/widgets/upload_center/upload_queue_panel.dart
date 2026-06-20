import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/material.dart';
import 'package:rank_crackers/core/theme/app_colors.dart';
import 'package:rank_crackers/core/theme/app_typography.dart';
import 'package:rank_crackers/core/widgets/dark_card.dart';

enum IngestionFilter { all, active, underReview, published, failed, archived, defaultView }

class UploadQueuePanel extends StatelessWidget {
  final String? assetType;
  const UploadQueuePanel({super.key, this.assetType});

  Query _applyGovernanceFilter(Query query, IngestionFilter filter) {
    switch (filter) {
      case IngestionFilter.active:
        return query.where('status', whereIn: ['received', 'parsing']);
      case IngestionFilter.underReview:
        return query.where('status', isEqualTo: 'under_review');
      case IngestionFilter.published:
        return query.where('status', isEqualTo: 'published');
      case IngestionFilter.failed:
        return query.where('status', isEqualTo: 'failed');
      case IngestionFilter.archived:
        return query.where('archived', isEqualTo: true);
      case IngestionFilter.defaultView:
        return query.where('status', whereIn: ['received', 'parsing', 'under_review']);
      case IngestionFilter.all:
      default:
        return query;
    }
  }

  @override
  Widget build(BuildContext context) {
    Query baseQuery = FirebaseFirestore.instance.collection('ingestion_refinery');

    // 🔱 Apply Governance Filter (Defaulting to Active + Under Review)
    Query filteredQuery = _applyGovernanceFilter(baseQuery, IngestionFilter.defaultView);
    
    if (assetType != null) {
      String filterType = assetType!;
      if (assetType == 'notification') filterType = 'recruitment_notification';
      filteredQuery = filteredQuery.where('assetType', isEqualTo: filterType);
    }

    final query = filteredQuery.orderBy('createdAt', descending: true).limit(10);

    return StreamBuilder<QuerySnapshot>(
      stream: query.snapshots(),
      builder: (context, snapshot) {
        final docs = snapshot.data?.docs ?? [];
        if (docs.isEmpty) return const SizedBox.shrink();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.rocket_launch_rounded, color: AppColors.gold, size: 14),
                const SizedBox(width: 8),
                Text("ACTIVE PROCESSING QUEUE", style: AppTypography.label.copyWith(fontSize: 8, color: AppColors.gold)),
              ],
            ),
            const SizedBox(height: 16),
            ...docs.map((doc) {
              final data = doc.data() as Map<String, dynamic>;
              final String docId = doc.id;
              final String sourceId = data['sourceId'] ?? docId;
              return _QueueItem(data: {
                ...data,
                'id': docId,
                'resolvedSourceId': sourceId,
              });
            }),
          ],
        );
      },
    );
  }
}

class _QueueItem extends StatelessWidget {
  final Map<String, dynamic> data;
  const _QueueItem({required this.data});

  @override
  Widget build(BuildContext context) {
    final status = data['status'] ?? 'received';
    final progress = _deriveProgress(status);

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: DarkCard(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(_getStatusIcon(status), color: _getStatusColor(status).withValues(alpha: 0.5), size: 16),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(data['fileName'] ?? 'Discovery Ingested', 
                    style: AppTypography.body.copyWith(fontSize: 11, fontWeight: FontWeight.bold),
                    maxLines: 1, overflow: TextOverflow.ellipsis),
                ),
                Text("$progress%", style: AppTypography.label.copyWith(fontSize: 7, color: Colors.white24)),
                if (status != 'published') ...[
                  const SizedBox(width: 8),
                  _DeleteButton(sourceId: data['resolvedSourceId'] ?? data['id']),
                ],
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Text("WORKER: ${_getWorkerName(status, data['assetType'])}", 
                  style: AppTypography.label.copyWith(fontSize: 6, color: Colors.white10)),
                const Spacer(),
                Text(status.toString().toUpperCase(), 
                  style: AppTypography.label.copyWith(fontSize: 6, color: _getStatusColor(status), fontWeight: FontWeight.w900)),
              ],
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(2),
              child: LinearProgressIndicator(
                value: progress / 100,
                backgroundColor: Colors.white.withValues(alpha: 0.02),
                color: _getStatusColor(status),
                minHeight: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }

  int _deriveProgress(String status) {
    switch (status) {
      case 'received': return 5;
      case 'parsing': return 20;
      case 'analyzing': return 50;
      case 'structuring': return 65;
      case 'extracting': return 80;
      case 'mapping': return 90;
      case 'awaiting_review': return 95;
      case 'verified':
      case 'published': return 100;
      default: return 5;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'parsing': return Colors.blueAccent;
      case 'analyzing': return Colors.purpleAccent;
      case 'extracting': return Colors.orangeAccent;
      case 'awaiting_review': return AppColors.gold;
      case 'published': return Colors.greenAccent;
      case 'failed': return Colors.redAccent;
      default: return Colors.white24;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'parsing': return Icons.precision_manufacturing_rounded;
      case 'analyzing': return Icons.psychology_rounded;
      case 'awaiting_review': return Icons.fact_check_rounded;
      case 'published': return Icons.check_circle_rounded;
      case 'failed': return Icons.error_rounded;
      default: return Icons.hourglass_top_rounded;
    }
  }

  String _getWorkerName(String status, String? type) {
    final bool isNotif = type == 'recruitment_notification';
    switch (status) {
      case 'parsing': return "PDF_PARSE_WORKER";
      case 'analyzing': return isNotif ? "RECRUITMENT_DETECTION_WORKER" : "CLASSIFICATION_WORKER";
      case 'extracting': return isNotif ? "VACANCY_MATRIX_WORKER" : "DATA_EXTRACTION_WORKER";
      case 'mapping': return "EVIDENCE_MAPPING_WORKER";
      case 'awaiting_review': return "VERIFICATION_REPORT_GENERATOR";
      default: return "INGESTION_PIPELINE";
    }
  }
}

class _DeleteButton extends StatefulWidget {
  final String sourceId;
  const _DeleteButton({required this.sourceId});

  @override
  State<_DeleteButton> createState() => _DeleteButtonState();
}

class _DeleteButtonState extends State<_DeleteButton> {
  bool _isDeleting = false;

  Future<void> _showDeleteConfirmation() async {
    final controller = TextEditingController();
    bool canDelete = false;

    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => LayoutBuilder(
        builder: (context, constraints) => Dialog(
          insetPadding: const EdgeInsets.all(16),
          backgroundColor: const Color(0xFF0A0A0A),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: SafeArea(
            child: SingleChildScrollView(
              child: Padding(
                padding: EdgeInsets.only(
                  left: 20,
                  right: 20,
                  top: 20,
                  bottom: MediaQuery.of(context).viewInsets.bottom + 20,
                ),
                child: StatefulBuilder(
                  builder: (context, setModalState) => Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("🔱 PERMANENT DELETION", style: AppTypography.heading.copyWith(color: Colors.redAccent)),
                      const SizedBox(height: 16),
                      Text("⚠️ This action will permanently remove:", style: AppTypography.body.copyWith(fontSize: 12)),
                      const SizedBox(height: 12),
                      Text("• Firestore Record\n• Storage File\n• Audit References", 
                        style: AppTypography.label.copyWith(color: Colors.white38, fontSize: 10)),
                      const SizedBox(height: 20),
                      Text("Type DELETE to continue:", style: AppTypography.label.copyWith(color: AppColors.gold)),
                      const SizedBox(height: 8),
                      TextField(
                        controller: controller,
                        autofocus: true,
                        style: AppTypography.body.copyWith(color: Colors.white),
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: Colors.white.withValues(alpha: 0.05),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                          hintText: "DELETE",
                          hintStyle: const TextStyle(color: Colors.white10),
                        ),
                        onChanged: (val) {
                          setModalState(() => canDelete = val == "DELETE");
                        },
                      ),
                      const SizedBox(height: 24),
                      // 🔱 Forensic Fix: Responsive Action Container
                      SizedBox(
                        width: double.infinity,
                        child: Wrap(
                          spacing: 12,
                          runSpacing: 12,
                          alignment: WrapAlignment.end,
                          crossAxisAlignment: WrapCrossAlignment.center,
                          children: [
                            TextButton(
                              onPressed: () => Navigator.pop(context),
                              child: Text("CANCEL", style: AppTypography.label.copyWith(color: Colors.white24)),
                            ),
                            ConstrainedBox(
                              constraints: const BoxConstraints(minWidth: 120, maxWidth: 220),
                              child: ElevatedButton(
                                onPressed: canDelete ? () => Navigator.pop(context, true) : null,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.redAccent,
                                  foregroundColor: Colors.white,
                                  disabledBackgroundColor: Colors.white10,
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                ),
                                child: const Text("DELETE PERMANENTLY", textAlign: TextAlign.center, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );

    if (confirmed == true) {
      setState(() => _isDeleting = true);
      try {
        final callable = FirebaseFunctions.instanceFor(region: 'us-central1').httpsCallable('handleSentinelAction');
        await callable.call({
          'sourceId': widget.sourceId,
          'action': 'delete',
          'payload': {'confirmation': 'DELETE'}
        });
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e")));
        }
      } finally {
        if (mounted) setState(() => _isDeleting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isDeleting) {
      return const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.redAccent));
    }

    return IconButton(
      onPressed: _showDeleteConfirmation,
      icon: const Icon(Icons.delete_forever_rounded, color: Colors.redAccent, size: 16),
      padding: EdgeInsets.zero,
      constraints: const BoxConstraints(),
      visualDensity: VisualDensity.compact,
    );
  }
}
