import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:rank_crackers/core/theme/app_colors.dart';
import 'package:rank_crackers/core/theme/app_typography.dart';
import 'package:rank_crackers/core/widgets/dark_card.dart';
import 'package:rank_crackers/features/admin/data/command_center_repository.dart';

class FounderDashboard extends StatelessWidget {
  final Function(int) onTabSwitch;
  const FounderDashboard({super.key, required this.onTabSwitch});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      children: [
        // 🔱 MISSION PIPELINE (2x2 Grid) - Height 110
        _sectionLabel("MISSION PIPELINE"),
        const SizedBox(height: 12),
        SizedBox(
          height: 110,
          child: GridView.count(
            crossAxisCount: 2,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 2.5,
            physics: const NeverScrollableScrollPhysics(),
            children: [
              _pipelineCard("UPLOADS", 1, Icons.cloud_upload_rounded, Colors.blueAccent),
              _pipelineCard("INTEL", 2, Icons.radar_rounded, Colors.purpleAccent),
              _pipelineCard("REVIEWS", 3, Icons.fact_check_rounded, Colors.orangeAccent),
              _pipelineCard("AI FAILURES", 4, Icons.error_outline_rounded, Colors.redAccent), // 🔱 Phase 6: Failures Visibility
            ],
          ),
        ),

        const SizedBox(height: 24),

        // 🔱 QUICK COMMANDS (4-Column) - Height 110
        _sectionLabel("QUICK COMMANDS"),
        const SizedBox(height: 12),
        SizedBox(
          height: 110,
          child: GridView.count(
            crossAxisCount: 4,
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            childAspectRatio: 0.8,
            physics: const NeverScrollableScrollPhysics(),
            children: [
              _quickCommandItem("Notification", Icons.campaign_rounded, () => onTabSwitch(1)),
              _quickCommandItem("Syllabus", Icons.account_tree_rounded, () => onTabSwitch(1)),
              _quickCommandItem("PYQ", Icons.history_edu_rounded, () => onTabSwitch(1)),
              _quickCommandItem("Material", Icons.menu_book_rounded, () => onTabSwitch(1)),
              _quickCommandItem("Notice", Icons.update_rounded, () => onTabSwitch(1)),
              _quickCommandItem("Reviews", Icons.fact_check_rounded, () => onTabSwitch(3)),
              _quickCommandItem("Recruitments", Icons.rocket_launch_rounded, () => onTabSwitch(2)),
            ],
          ),
        ),

        const SizedBox(height: 24),

        // 🔱 REVIEW QUEUE PREVIEW (Top 3) - Height 120
        _sectionLabel("REVIEW QUEUE PREVIEW"),
        const SizedBox(height: 12),
        SizedBox(
          height: 120,
          child: _streamPreviewList('sentinel_drafts', 'under_review', Colors.orangeAccent, "Review Queue", 3),
        ),

        const SizedBox(height: 24),

        // 🔱 INTEL FEED PREVIEW (Top 3) - Height 120
        _sectionLabel("INTELLIGENCE FEED PREVIEW"),
        const SizedBox(height: 12),
        SizedBox(
          height: 120,
          child: _streamPreviewList('sentinel_drafts', 'draft', Colors.purpleAccent, "Intelligence", 3),
        ),

        const SizedBox(height: 40),
      ],
    );
  }

  Widget _sectionLabel(String label) {
    return Text(label, 
      style: AppTypography.label.copyWith(color: Colors.white24, fontSize: 8, letterSpacing: 1.5, fontWeight: FontWeight.w900));
  }

  Widget _pipelineCard(String label, int tabIndex, IconData icon, Color color, {String? status}) {
    Stream<int> stream;
    if (label == "AI FAILURES") {
      stream = CommandCenterRepository.streamAIFailuresCount();
    } else if (status != null) {
      stream = FirebaseFirestore.instance.collection('sentinel_drafts').where('status', isEqualTo: status).snapshots().map((s) => s.size);
    } else if (label == "UPLOADS") {
      stream = FirebaseFirestore.instance.collection('ingestion_refinery').where('status', isEqualTo: 'pending').snapshots().map((s) => s.size);
    } else if (label == "INTEL") {
      stream = FirebaseFirestore.instance.collection('sentinel_drafts').where('status', isEqualTo: 'draft').snapshots().map((s) => s.size);
    } else {
      stream = CommandCenterRepository.streamTotalPendingReviews();
    }

    return GestureDetector(
      onTap: () => onTabSwitch(tabIndex),
      child: DarkCard(
        padding: EdgeInsets.zero,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color.withValues(alpha: 0.6), size: 14),
            const SizedBox(height: 4),
            StreamBuilder<int>(
              stream: stream,
              builder: (context, snap) => Text("${snap.data ?? 0}", 
                style: AppTypography.hero.copyWith(fontSize: 16, color: color)),
            ),
            Text(label, style: AppTypography.label.copyWith(fontSize: 6, color: Colors.white24, fontWeight: FontWeight.w900)),
          ],
        ),
      ),
    );
  }

  Widget _quickCommandItem(String label, IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: DarkCard(
        padding: EdgeInsets.zero,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: AppColors.gold.withValues(alpha: 0.4), size: 16),
            const SizedBox(height: 6),
            Text(label, 
              style: AppTypography.label.copyWith(fontSize: 7, color: Colors.white54, fontWeight: FontWeight.w600), 
              textAlign: TextAlign.center, maxLines: 1, overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }

  Widget _streamPreviewList(String collection, String status, Color accent, String label, int limit) {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance.collection(collection).where('status', isEqualTo: status).limit(limit).snapshots(),
      builder: (context, snap) {
        final docs = snap.data?.docs ?? [];
        if (docs.isEmpty) return _emptyBox();
        
        return Column(
          children: docs.map((doc) {
            final data = doc.data() as Map<String, dynamic>;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: DarkCard(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                child: Row(
                  children: [
                    Container(width: 2, height: 16, color: accent),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("$label: ${data['type']?.toString().toUpperCase() ?? "ITEM"}", 
                            style: AppTypography.label.copyWith(fontSize: 6, color: accent.withValues(alpha: 0.5))),
                          Text(data['rawData']?['title'] ?? 'Unknown Discovery', 
                            style: AppTypography.body.copyWith(fontSize: 9, fontWeight: FontWeight.bold),
                            maxLines: 1, overflow: TextOverflow.ellipsis),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        );
      },
    );
  }

  Widget _emptyBox() => Container(
    height: 40,
    width: double.infinity,
    decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.02), borderRadius: BorderRadius.circular(8)),
    child: const Center(child: Text("NO SIGNALS", style: TextStyle(color: Colors.white10, fontSize: 8))),
  );
}
