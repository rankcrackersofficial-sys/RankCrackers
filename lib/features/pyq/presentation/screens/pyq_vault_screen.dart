import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/tactical_noir_background.dart';
import '../../../../core/widgets/dark_card.dart';

class PyqVaultScreen extends StatelessWidget {
  const PyqVaultScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: TacticalNoirBackground(
        child: SafeArea(
          child: CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              _buildVaultHeader(),
              _buildPatternInsight(),
              _buildAnalyticsGrid(),
              _buildYearArchive(),
              _buildWeaknessMapping(),
              const SliverToBoxAdapter(
                child: SizedBox(height: 120),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ==========================================================
  // VAULT HEADER 🔱
  // ==========================================================
  Widget _buildVaultHeader() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 30),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('PYQ Vault', style: AppTypography.hero),
            const SizedBox(height: 14),
            Text(
              'Previous years reveal recurring psychological patterns of the examination system.',
              style: AppTypography.body,
            ),
          ],
        ),
      ),
    );
  }

  // ==========================================================
  // PATTERN INSIGHT CARD 🔱
  // ==========================================================
  Widget _buildPatternInsight() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: DarkCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Pattern Insight', style: AppTypography.cardTitle),
              const SizedBox(height: 18),
              Text(
                'Recent analysis indicates repeated constitutional interpretation patterns across the last five examination cycles.',
                style: AppTypography.body,
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ==========================================================
  // PYQ ANALYTICS GRID 🔱
  // ==========================================================
  Widget _buildAnalyticsGrid() {
    return SliverPadding(
      padding: const EdgeInsets.all(20),
      sliver: SliverGrid(
        delegate: SliverChildListDelegate(
          [
            _analyticsCard(icon: Icons.history_edu_rounded, value: '12Y', label: 'Coverage'),
            _analyticsCard(icon: Icons.auto_graph_rounded, value: '84%', label: 'Trend'),
            _analyticsCard(icon: Icons.psychology_rounded, value: 'High', label: 'Pattern'),
            _analyticsCard(icon: Icons.workspace_premium, value: 'Elite', label: 'Vault'),
          ],
        ),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: 1.02,
        ),
      ),
    );
  }

  Widget _analyticsCard({required IconData icon, required String value, required String label}) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.borderSoft),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.gold, size: 22),
          const Spacer(),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(value, maxLines: 1, style: AppTypography.hero.copyWith(fontSize: 40)),
          ),
          const SizedBox(height: 8),
          Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: AppTypography.label),
        ],
      ),
    );
  }

  // ==========================================================
  // YEAR ARCHIVE 🔱
  // ==========================================================
  Widget _buildYearArchive() {
    final years = ["2024", "2023", "2022", "2021", "2020"];
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, index) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _yearCard(
              year: years[index],
              subtitle: "RAS Examination cycle • Historical Battle Map",
            ),
          ),
          childCount: years.length,
        ),
      ),
    );
  }

  Widget _yearCard({required String year, required String subtitle}) {
    return DarkCard(
      child: Row(
        children: [
          Container(
            width: 54,
            height: 54,
            decoration: BoxDecoration(
              color: AppColors.surface2,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Center(
              child: Text(year, style: AppTypography.cardTitle),
            ),
          ),
          const SizedBox(width: 18),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(subtitle, style: AppTypography.body.copyWith(fontSize: 13)),
              ],
            ),
          ),
          const Icon(Icons.arrow_forward_ios_rounded, size: 12, color: AppColors.secondaryText),
        ],
      ),
    );
  }

  // ==========================================================
  // TOPIC WEAKNESS MAPPING 🔱
  // ==========================================================
  Widget _buildWeaknessMapping() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: DarkCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'ऐतिहासिक कमजोरी मानचित्र (Weakness Mapping)',
                style: AppTypography.cardTitle.copyWith(color: AppColors.gold),
              ),
              const SizedBox(height: 18),
              Text(
                'पिछले वर्षों के प्रश्नों के विश्लेषण के अनुसार, भारतीय संविधान की एकात्मक और संघात्मक विशेषताओं से जुड़े क्षेत्रों में बार-बार भ्रम (traps) उत्पन्न हुए हैं।',
                style: AppTypography.body.copyWith(height: 1.6),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
