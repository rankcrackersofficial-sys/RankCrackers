import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:io';

import 'package:rank_crackers/core/theme/app_colors.dart';
import 'package:rank_crackers/core/theme/app_typography.dart';
import 'package:rank_crackers/core/widgets/dark_card.dart';
import 'package:rank_crackers/shared/widgets/tactical_button.dart';
import 'package:rank_crackers/core/services/universal_ingestion_service.dart';

class MissionAssetForm extends StatefulWidget {
  final String assetType; // notification, syllabus, pyq, study_material, notice
  const MissionAssetForm({super.key, required this.assetType});

  @override
  State<MissionAssetForm> createState() => _MissionAssetFormState();
}

class _MissionAssetFormState extends State<MissionAssetForm> {
  String? selectedNoticeType;
  String? selectedAmendmentFor;
  bool isUploading = false;

  @override
  void initState() {
    super.initState();
    if (widget.assetType == 'notice') selectedNoticeType = 'exam_date';
  }

  @override
  Widget build(BuildContext context) {
    if (_requiresMissionSourcePipeline) return _missionSourcePipelineNotice();

    // Rules (Constitution v1.0):
    // Zero Manual Classification for core assets.
    // Founder only provides the raw PDF.
    
    return DarkCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("INGEST ${widget.assetType.toUpperCase()} ASSET", style: AppTypography.label.copyWith(color: AppColors.gold, fontSize: 10)),
          const SizedBox(height: 8),
          Text(_getInstructionText(), style: AppTypography.label.copyWith(fontSize: 7, color: Colors.white24)),
          const SizedBox(height: 24),
          
          if (widget.assetType == 'notice') ...[
            DropdownButtonFormField<String>(
              value: selectedNoticeType,
              dropdownColor: AppColors.surface,
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: const InputDecoration(labelText: "NOTICE CATEGORY", labelStyle: TextStyle(color: Colors.white38)),
              items: const [
                DropdownMenuItem(value: 'exam_date', child: Text("Exam Date / Schedule")),
                DropdownMenuItem(value: 'result', child: Text("Result Notice")),
                DropdownMenuItem(value: 'cutoff', child: Text("Cutoff Notice")),
                DropdownMenuItem(value: 'answer_key', child: Text("Answer Key")),
                DropdownMenuItem(value: 'amendment', child: Text("Amendment / Corrigendum")),
              ],
              onChanged: (val) => setState(() {
                selectedNoticeType = val;
                if (val != 'amendment') selectedAmendmentFor = null;
              }),
            ),
            const SizedBox(height: 16),
          ],

          if (selectedNoticeType == 'amendment') ...[
            DropdownButtonFormField<String>(
              value: selectedAmendmentFor,
              dropdownColor: AppColors.surface,
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: const InputDecoration(labelText: "AMENDMENT FOR", labelStyle: TextStyle(color: Colors.white38)),
              items: const [
                DropdownMenuItem(value: 'notification', child: Text("Original Notification")),
                DropdownMenuItem(value: 'syllabus', child: Text("Official Syllabus")),
                DropdownMenuItem(value: 'exam_date', child: Text("Exam Date / Schedule")),
              ],
              onChanged: (val) => setState(() => selectedAmendmentFor = val),
            ),
            const SizedBox(height: 16),
          ],

          const Center(
            child: Icon(Icons.cloud_upload_outlined, color: Colors.white10, size: 64),
          ),
          
          const SizedBox(height: 32),
          
          if (isUploading)
            const Center(child: CircularProgressIndicator(color: AppColors.gold))
          else
            TacticalButton(
              title: "SELECT SOURCE FILE", 
              onTap: _pickAndUpload,
            ),
          
          const SizedBox(height: 24),
          _uploadStatusTimeline(),
        ],
      ),
    );
  }

  bool get _requiresMissionSourcePipeline =>
      widget.assetType == 'notification' ||
      widget.assetType == 'syllabus' ||
      widget.assetType == 'pyq';

  Widget _missionSourcePipelineNotice() {
    return DarkCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.lock_outline, color: AppColors.gold, size: 28),
          const SizedBox(height: 16),
          Text(
            "MISSION-BOUND OFFICIAL SOURCE UPLOAD IS NOT CONNECTED",
            style: AppTypography.label.copyWith(color: AppColors.gold, fontSize: 12),
          ),
          const SizedBox(height: 12),
          Text(
            "Notification, syllabus, and PYQ files must enter through the authorized "
            "mission/cycle source-pair flow with server-verified official domain, "
            "stored-byte SHA-256, and immutable source identity. This legacy form uses "
            "AUTO_DETECT and generic ingestion records, so it cannot safely bind or "
            "process an official mission source. Upload is disabled here until the "
            "protected server upload/finalization path is connected.",
            style: AppTypography.label.copyWith(fontSize: 11, color: Colors.white70),
          ),
        ],
      ),
    );
  }

  String _getInstructionText() {
    switch (widget.assetType) {
      case 'notification': return "AI will extract Recruitment Identity, Vacancy, and Eligibility.";
      case 'syllabus': return "AI will build Atomic Node hierarchy and subject mapping.";
      case 'pyq': return "AI will extract Shift, Language, and Pattern metadata.";
      case 'study_material': return "AI will classify subjects, chapters, and topics.";
      default: return "AI Workers will automatically classify and extract data.";
    }
  }

  Widget _uploadStatusTimeline() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.02), borderRadius: BorderRadius.circular(8)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("INGESTION PIPELINE", style: AppTypography.label.copyWith(fontSize: 6, color: Colors.white12)),
          const SizedBox(height: 8),
          Text("Received → Parsing → Analyzing → Draft Created → Verification Queue", 
            style: AppTypography.label.copyWith(fontSize: 7, color: Colors.white38, letterSpacing: 0.5)),
        ],
      ),
    );
  }

  Future<void> _pickAndUpload() async {
    if (_requiresMissionSourcePipeline) return;
    if (widget.assetType == 'notice' && selectedNoticeType == 'amendment' && selectedAmendmentFor == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('AMENDMENT PARENT REQUIRED')));
      return;
    }

    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'docx', 'xlsx', 'json', 'csv', 'txt'],
      withData: true, 
    );

    if (result != null && result.files.single.bytes != null) {
      setState(() => isUploading = true);
      try {
        final pickedFile = result.files.single;
        
        String assetTypeToSend = widget.assetType;
        if (widget.assetType == 'notification') assetTypeToSend = 'recruitment_notification';
        if (widget.assetType == 'notice') assetTypeToSend = selectedNoticeType!;

        await UniversalIngestionService.registerSource(
          fileName: pickedFile.name,
          bytes: pickedFile.bytes!,
          file: kIsWeb ? null : File(pickedFile.path!),
          assetType: assetTypeToSend,
          recruitmentId: 'AUTO_DETECT', 
          documentStatus: widget.assetType == 'pyq' ? 'HISTORICAL' : 'LIVE',
          extraMetadata: {
            if (selectedNoticeType == 'amendment') 'amendmentFor': selectedAmendmentFor,
          },
        );
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('ASSET INGESTED. AI ANALYSIS STARTED.')));
          Navigator.pop(context);
        }
      } finally {
        if (mounted) setState(() => isUploading = false);
      }
    }
  }
}
