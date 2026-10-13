import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';
import 'package:rank_crackers/core/models/sentinel_draft.dart';
import '../intelligence/widgets/intelligence_feed_tile.dart';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';
import 'package:rank_crackers/core/models/sentinel_draft.dart';
import '../intelligence/widgets/intelligence_feed_tile.dart';
import 'outcome_verification_center.dart';
import 'syllabus_candidate_review_center.dart';

class ReviewQueue extends StatefulWidget {
  const ReviewQueue({super.key});

  @override
  State<ReviewQueue> createState() => _ReviewQueueState();
}

class _ReviewQueueState extends State<ReviewQueue> {
  bool _showOutcomes = false;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
          child: Row(
            children: [
              _toggleButton("DISCOVERIES", !_showOutcomes, () => setState(() => _showOutcomes = false)),
              const SizedBox(width: 12),
              _toggleButton("OUTCOMES", _showOutcomes, () => setState(() => _showOutcomes = true)),
            ],
          ),
        ),
        Expanded(
          child: _showOutcomes ? const OutcomeVerificationCenter() : const _DiscoveryReviewQueue(),
        ),
      ],
    );
  }

  Widget _toggleButton(String label, bool active, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: active ? AppColors.gold.withValues(alpha: 0.1) : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: active ? AppColors.gold : Colors.white10),
          ),
          child: Center(
            child: Text(label, style: AppTypography.label.copyWith(
              color: active ? AppColors.gold : Colors.white24,
              fontSize: 9,
              fontWeight: FontWeight.bold,
            )),
          ),
        ),
      ),
    );
  }
}

class _DiscoveryReviewQueue extends StatelessWidget {
  const _DiscoveryReviewQueue();

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 6,
      child: Column(
        children: [
          TabBar(
            isScrollable: true,
            dividerColor: Colors.transparent,
            indicatorColor: AppColors.gold,
            labelColor: AppColors.gold,
            unselectedLabelColor: Colors.white30,
            labelStyle: AppTypography.label.copyWith(fontSize: 9, fontWeight: FontWeight.bold),
            tabs: const [
              Tab(text: "DRAFT"),
              Tab(text: "UNDER REVIEW"),
              Tab(text: "VERIFIED"),
              Tab(text: "PUBLISHED"),
              Tab(text: "REJECTED"),
              Tab(text: "SYLLABUS"),
            ],
          ),
          const Expanded(
            child: TabBarView(
              children: [
                _ReviewList(status: 'draft'),
                _ReviewList(status: 'under_review'), 
                _ReviewList(status: 'verified'),
                _ReviewList(status: 'published'),
                _ReviewList(status: 'rejected'),
                const SyllabusCandidateReviewCenter(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ReviewList extends StatelessWidget {
  final String status;
  const _ReviewList({required this.status});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('sentinel_drafts')
          .where('status', isEqualTo: status)
          .orderBy('audit.createdAt', descending: true)
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator(color: AppColors.gold));
        }
        final docs = snapshot.data?.docs ?? [];
        if (docs.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.inventory_2_outlined, color: Colors.white10, size: 48),
                const SizedBox(height: 16),
                Text("QUEUE EMPTY", style: AppTypography.label.copyWith(color: Colors.white24, fontSize: 8)),
              ],
            ),
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.all(24),
          itemCount: docs.length,
          itemBuilder: (context, index) {
            final draft = SentinelDraft.fromMap(docs[index].data() as Map<String, dynamic>);
            return IntelligenceFeedTile(draft: draft);
          },
        );
      },
    );
  }
}
