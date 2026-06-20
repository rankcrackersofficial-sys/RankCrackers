import 'package:flutter/material.dart';
import 'package:rank_crackers/core/theme/app_colors.dart';
import 'package:rank_crackers/core/theme/app_typography.dart';
import 'package:rank_crackers/core/widgets/dark_card.dart';
import 'package:rank_crackers/features/admin/data/command_center_repository.dart';
import '../upload_center/notification_upload_center.dart';
import '../upload_center/syllabus_upload_center.dart';
import '../upload_center/pyq_upload_center.dart';
import '../upload_center/study_material_center.dart';
import '../upload_center/update_notice_center.dart';
import '../shared/founder_sovereign_scaffold.dart';

class UploadFactoryCenter extends StatelessWidget {
  const UploadFactoryCenter({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      children: [
        _buildCommandSummary(),
        const SizedBox(height: 32),

        _sectionLabel("INGESTION CHANNELS"),
        const SizedBox(height: 12),
        _uploadTile(context, "Notification", Icons.campaign_rounded, const NotificationUploadCenter()),
        _uploadTile(context, "Syllabus", Icons.account_tree_rounded, const SyllabusUploadCenter()),
        _uploadTile(context, "PYQ", Icons.history_edu_rounded, const PyqUploadCenter()),
        _uploadTile(context, "Study Material", Icons.menu_book_rounded, const StudyMaterialCenter()),
        _uploadTile(context, "Update / Notice", Icons.update_rounded, const UpdateNoticeCenter()),
        
        const SizedBox(height: 40),
      ],
    );
  }

  Widget _sectionLabel(String label) {
    return Text(label, style: AppTypography.label.copyWith(color: Colors.white12, fontSize: 8, letterSpacing: 1.5));
  }

  Widget _buildCommandSummary() {
    return Container(
      height: 90,
      child: Row(
        children: [
          _summaryCard("PENDING", CommandCenterRepository.streamAIQueueSize(), Colors.blueAccent),
          const SizedBox(width: 12),
          _summaryCard("RUNNING", CommandCenterRepository.streamActiveWorkersCount(), Colors.purpleAccent),
          const SizedBox(width: 12),
          _summaryCard("REVIEW", CommandCenterRepository.streamTotalPendingReviews(), Colors.orangeAccent),
          const SizedBox(width: 12),
          _summaryCard("LIVE", CommandCenterRepository.streamActiveMissionsCount(), Colors.greenAccent),
        ],
      ),
    );
  }

  Widget _summaryCard(String label, Stream<int> stream, Color color) {
    return Expanded(
      child: DarkCard(
        padding: EdgeInsets.zero,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            StreamBuilder<int>(
              stream: stream,
              builder: (context, snap) => Text("${snap.data ?? 0}", 
                style: AppTypography.hero.copyWith(fontSize: 18, color: color)),
            ),
            const SizedBox(height: 2),
            Text(label, style: AppTypography.label.copyWith(fontSize: 6, color: Colors.white24, fontWeight: FontWeight.w900)),
          ],
        ),
      ),
    );
  }

  Widget _uploadTile(BuildContext context, String title, IconData icon, Widget screen) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: DarkCard(
        padding: EdgeInsets.zero,
        height: 56,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => FounderSovereignScaffold(
              body: screen,
            ))),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: AppColors.gold.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(8)),
                    child: Icon(icon, color: AppColors.gold, size: 18),
                  ),
                  const SizedBox(width: 16),
                  Text(title, style: AppTypography.cardTitle.copyWith(fontSize: 13, fontWeight: FontWeight.bold)),
                  const Spacer(),
                  const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white10, size: 10),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
