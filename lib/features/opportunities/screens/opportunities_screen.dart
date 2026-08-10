import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/tactical_noir_background.dart';
import '../../../core/widgets/dark_card.dart'; // 🔱 Import for Report Card
import '../widgets/opportunity_card.dart';
import '../providers/opportunity_match_provider.dart';
import '../providers/opportunities_provider.dart';
import '../services/opportunity_filter_service.dart';
import '../models/opportunity_match.dart';

class OpportunitiesScreen extends ConsumerStatefulWidget {
  const OpportunitiesScreen({super.key});

  @override
  ConsumerState<OpportunitiesScreen> createState() =>
      _OpportunitiesScreenState();
}

class _OpportunitiesScreenState extends ConsumerState<OpportunitiesScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: TacticalNoirBackground(
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
                child: Text("CAREER SIGNALS", style: AppTypography.hero),
              ),
              _buildPersonalReportCard(), // 🔱 BATCH-2: Personal Recruitment Report
              const SizedBox(height: 12),
              TabBar(
                controller: _tabController,
                isScrollable: true,
                dividerColor: Colors.transparent,
                indicatorColor: AppColors.gold,
                labelColor: AppColors.gold,
                unselectedLabelColor: Colors.white30,
                labelPadding: const EdgeInsets.symmetric(horizontal: 20),
                labelStyle: AppTypography.label
                    .copyWith(fontSize: 11, fontWeight: FontWeight.bold),
                tabs: const [
                  Tab(text: "ELIGIBLE PATHS"),
                  Tab(text: "ALMOST ELIGIBLE"),
                  Tab(text: "CLOSING SOON"),
                  Tab(text: "NEW THIS WEEK"),
                ],
              ),
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildMatchesTab(),
                    _buildAlmostEligibleTab(),
                    _buildClosingSoonTab(),
                    _buildNewThisWeekTab(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPersonalReportCard() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: DarkCard(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("CAREER ELIGIBILITY SNAPSHOT",
                    style: AppTypography.label
                        .copyWith(color: AppColors.gold, letterSpacing: 1.0)),
                const Icon(Icons.verified_user_rounded,
                    color: AppColors.gold, size: 16),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(child: _reportStat("Eligible Paths", "12")),
                Expanded(child: _reportStat("Priority Alerts", "4")),
                Expanded(child: _reportStat("Age Safe", "YES", isStatus: true)),
              ],
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(
                    child: _reportStat("Category Benefits", "ACTIVE",
                        isStatus: true)),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppColors.gold.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                        color: AppColors.gold.withValues(alpha: 0.2)),
                  ),
                  child: Column(
                    children: [
                      Text("87",
                          style: AppTypography.hero
                              .copyWith(fontSize: 22, color: AppColors.gold)),
                      Text("SCORE",
                          style: AppTypography.label
                              .copyWith(fontSize: 7, color: AppColors.gold)),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _reportStat(String label, String value, {bool isStatus = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(),
            style: AppTypography.label
                .copyWith(fontSize: 8, color: Colors.white24)),
        const SizedBox(height: 4),
        Text(value,
            style: AppTypography.cardTitle.copyWith(
                fontSize: 14,
                color: isStatus ? Colors.greenAccent : Colors.white)),
      ],
    );
  }

  Widget _buildMatchesTab() {
    final matches = ref.watch(eligibleOpportunitiesProvider);
    final allOpps = ref.watch(allOpportunitiesProvider).asData?.value ?? [];

    if (matches.isEmpty) return _placeholderTab("No exact matches found yet.");

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: matches.length,
      itemBuilder: (context, index) {
        final match = matches[index];
        final opportunity =
            allOpps.firstWhere((o) => o.id == match.opportunityId);
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: OpportunityCard(opportunity: opportunity, match: match),
        );
      },
    );
  }

  Widget _buildAlmostEligibleTab() {
    final matches = ref.watch(almostEligibleOpportunitiesProvider);
    final allOpps = ref.watch(allOpportunitiesProvider).asData?.value ?? [];

    if (matches.isEmpty) {
      return _placeholderTab("No opportunities in 'Almost Eligible' range.");
    }

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: matches.length,
      itemBuilder: (context, index) {
        final match = matches[index];
        final opportunity =
            allOpps.firstWhere((o) => o.id == match.opportunityId);
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: OpportunityCard(opportunity: opportunity, match: match),
        );
      },
    );
  }

  Widget _buildClosingSoonTab() {
    final allOpps = ref.watch(allOpportunitiesProvider).asData?.value ?? [];
    final filtered = OpportunityFilterService.getClosingSoon(allOpps);
    final allMatches = ref.watch(opportunityMatchesProvider);

    if (filtered.isEmpty) {
      return _placeholderTab("No opportunities closing this week.");
    }

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: filtered.length,
      itemBuilder: (context, index) {
        final opportunity = filtered[index];
        final match = allMatches.firstWhere(
            (m) => m.opportunityId == opportunity.id,
            orElse: () => OpportunityMatch(
                uid: '',
                opportunityId: opportunity.id,
                eligible: false,
                matchScore: 0));
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: OpportunityCard(opportunity: opportunity, match: match),
        );
      },
    );
  }

  Widget _buildNewThisWeekTab() {
    final allOpps = ref.watch(allOpportunitiesProvider).asData?.value ?? [];
    final filtered = OpportunityFilterService.getNewThisWeek(allOpps);
    final allMatches = ref.watch(opportunityMatchesProvider);

    if (filtered.isEmpty) {
      return _placeholderTab("No new notifications this week.");
    }

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: filtered.length,
      itemBuilder: (context, index) {
        final opportunity = filtered[index];
        final match = allMatches.firstWhere(
            (m) => m.opportunityId == opportunity.id,
            orElse: () => OpportunityMatch(
                uid: '',
                opportunityId: opportunity.id,
                eligible: false,
                matchScore: 0));
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: OpportunityCard(opportunity: opportunity, match: match),
        );
      },
    );
  }

  Widget _placeholderTab(String message) {
    return Center(
      child: Text(message,
          style: AppTypography.body.copyWith(color: Colors.white24)),
    );
  }
}
