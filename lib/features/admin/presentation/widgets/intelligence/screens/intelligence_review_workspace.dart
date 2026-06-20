import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:pdfx/pdfx.dart';
import 'package:dio/dio.dart';
import 'package:rank_crackers/core/theme/app_colors.dart';
import 'package:rank_crackers/core/theme/app_typography.dart';
import 'package:rank_crackers/core/models/sentinel_draft.dart';
import 'package:rank_crackers/features/admin/data/repositories/sentinel_admin_repository.dart';
import '../../shared/founder_sovereign_scaffold.dart';

class IntelligenceReviewWorkspace extends StatefulWidget {
  final SentinelDraft draft;
  const IntelligenceReviewWorkspace({super.key, required this.draft});

  @override
  State<IntelligenceReviewWorkspace> createState() => _IntelligenceReviewWorkspaceState();
}

class _IntelligenceReviewWorkspaceState extends State<IntelligenceReviewWorkspace> {
  PdfControllerPinch? _pdfController;
  bool _isLoadingPdf = true;
  String? _pdfError;

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

  @override
  void dispose() {
    _pdfController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FounderSovereignScaffold(
      body: Row(
        children: [
          // 🔱 LEFT: SOURCE PDF PREVIEW
          Expanded(flex: 3, child: _buildPdfPreview()),
          
          // 🔱 RIGHT: AI FINDINGS & VERIFICATION REPORT
          Expanded(flex: 2, child: _buildVerificationPanel(context)),
        ],
      ),
    );
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

  Widget _buildVerificationPanel(BuildContext context) {
    final data = widget.draft.rawData;
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(color: Colors.black45, border: Border(left: BorderSide(color: Colors.white10))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("AI VERIFICATION REPORT", style: AppTypography.label.copyWith(fontSize: 9, letterSpacing: 1.5)),
          const SizedBox(height: 24),
          Expanded(
            child: ListView(
              children: [
                _reportItem("CONFIDENCE SCORE", "${(widget.draft.audit.confidenceScore * 100).toInt()}%", icon: Icons.radar_rounded, color: Colors.greenAccent),
                _reportItem("DETECTED REALM", data['org'] ?? 'AUTO_DETECT'),
                _reportItem("DETECTED TYPE", widget.draft.type.toUpperCase()),
                _reportItem("WORKER VERSION", widget.draft.audit.workerVersion),
                const Divider(color: Colors.white10, height: 32),
                Text("DETECTED METADATA", style: AppTypography.label.copyWith(fontSize: 8, color: Colors.white24)),
                const SizedBox(height: 12),
                if (data['summary'] != null)
                  Text(data['summary'], style: AppTypography.body.copyWith(fontSize: 11, height: 1.6, color: Colors.white70)),
                
                const SizedBox(height: 16),
                ...data.entries.where((e) => !['title', 'summary', 'recordId', 'fullText', 'chunks', 'pageMap'].contains(e.key)).map((e) => 
                   _reportItem(e.key.toUpperCase(), e.value.toString())
                ),

                const SizedBox(height: 32),
                _workerUsedBadge(widget.draft.audit.provider),
              ],
            ),
          ),
          
          const SizedBox(height: 24),
          _actionButton(
            title: "VERIFY & PUBLISH", 
            color: Colors.greenAccent, 
            textColor: Colors.black,
            onTap: () async {
              final action = widget.draft.type == 'recruitment_notification' ? 'launch_mission' : 'publish';
              await SentinelAdminRepository.handleAction(draftId: widget.draft.id, action: action);
              if (mounted) Navigator.pop(context);
            }
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _actionButton(
                  title: "REJECT", 
                  color: Colors.redAccent.withValues(alpha: 0.1), 
                  textColor: Colors.redAccent,
                  onTap: () async {
                    await SentinelAdminRepository.handleAction(draftId: widget.draft.id, action: 'reject');
                    if (mounted) Navigator.pop(context);
                  }
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _actionButton(
                  title: "SEND BACK", 
                  color: Colors.white10, 
                  onTap: () {
                    Navigator.pop(context);
                  }
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _reportItem(String label, String value, {IconData? icon, Color? color}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: AppTypography.label.copyWith(fontSize: 7, color: Colors.white24)),
          const SizedBox(height: 4),
          Row(
            children: [
              if (icon != null) ...[Icon(icon, color: AppColors.gold, size: 12), const SizedBox(width: 8)],
              Expanded(child: Text(value, style: AppTypography.body.copyWith(fontSize: 12, fontWeight: FontWeight.bold, color: color ?? Colors.white))),
            ],
          ),
        ],
      ),
    );
  }

  Widget _workerUsedBadge(String provider) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(8)),
      child: Row(
        children: [
          const Icon(Icons.psychology_outlined, color: AppColors.gold, size: 16),
          const SizedBox(width: 12),
          Text("WORKER: ${provider.toUpperCase()}", style: AppTypography.label.copyWith(fontSize: 7, color: Colors.white54)),
        ],
      ),
    );
  }

  Widget _actionButton({required String title, required Color color, Color? textColor, required VoidCallback onTap}) {
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: TextButton(
        onPressed: onTap,
        style: TextButton.styleFrom(backgroundColor: color, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
        child: Text(title, style: AppTypography.cardTitle.copyWith(fontSize: 11, color: textColor ?? Colors.white)),
      ),
    );
  }
}

class InternetPdfReader {
  static Future<Uint8List> get(String url) async {
    final dio = Dio();
    final response = await dio.get<List<int>>(url, options: Options(responseType: ResponseType.bytes));
    return Uint8List.fromList(response.data!);
  }
}
