import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/tactical_noir_background.dart';
import '../../../../core/utils/app_routes.dart';
import '../../../../shared/session/session_manager.dart';
import '../../../../data/india_states.dart';
import '../../../../core/models/recruitment.dart';
import '../../../../core/knowledge/knowledge_engine.dart';
import '../../../../core/utils/responsive_helper.dart';
import '../../../profile/presentation/widgets/smart_search_field.dart';
import '../providers/mission_realm_provider.dart';

class MissionRealmScreen extends ConsumerStatefulWidget {
  const MissionRealmScreen({super.key});

  @override
  ConsumerState<MissionRealmScreen> createState() => _MissionRealmScreenState();
}

class _MissionRealmScreenState extends ConsumerState<MissionRealmScreen> {
  String? selectedRecruitmentId;
  String selectedState = 'Rajasthan';
  bool isChangingState = false;
  bool _isLoading = false;

  final TextEditingController stateController = TextEditingController();
  final TextEditingController examSearchController = TextEditingController();

  List<String> filteredStates = [];
  List<Recruitment> searchResults = [];

  @override
  void initState() {
    super.initState();
    _loadUserState();
  }

  @override
  void dispose() {
    stateController.dispose();
    examSearchController.dispose();
    super.dispose();
  }

  Future<void> _loadUserState() async {
    final prefs = await SharedPreferences.getInstance();
    final savedState = prefs.getString('user_state');
    if (savedState != null) {
      setState(() {
        selectedState = savedState;
        stateController.text = savedState;
      });
    }
  }

  Future<void> _saveMissionSelection(Recruitment recruitment) async {
    await SessionManager.saveMissionIdentity(
      examId: recruitment.examId,
      examName: recruitment.title,
      recruitmentId: recruitment.id,
      examBlueprintId: recruitment.examBlueprintId,
      variantId: recruitment.variantCode,
      variantName: recruitment.variantCode,
    );

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_state', selectedState);
  }

  void _searchStates(String query) {
    if (query.isEmpty) {
      setState(() => filteredStates = []);
      return;
    }
    setState(() {
      filteredStates = IndiaStates.statesAndUTs
          .where((state) => state.toLowerCase().startsWith(query.toLowerCase()))
          .toList();
    });
  }

  void _searchMissions(String query, List<Recruitment> allMissions) {
    if (query.isEmpty) {
      setState(() => searchResults = []);
      return;
    }
    final q = query.toLowerCase();
    setState(() {
      searchResults = allMissions.where((r) {
        return r.title.toLowerCase().contains(q) ||
            r.state.toLowerCase().contains(q);
      }).toList();
    });
  }

  Future<void> _startMission(Recruitment recruitment, bool isSmart) async {
    if (_isLoading) return;
    setState(() => _isLoading = true);

    try {
      await _saveMissionSelection(recruitment);

      await KnowledgeEngine.instance
          .initialize(recruitment: recruitment, force: true)
          .timeout(const Duration(seconds: 5), onTimeout: () {
        debugPrint(
            'MISSION START: Engine hydration slow. Moving to dashboard anyway.');
      });

      if (!mounted) return;
      if (isSmart) {
        context.push(
          AppRoutes.diagnosticTest,
          extra: {
            'exam': recruitment.examId,
            'variant': recruitment.variantCode,
            'state': recruitment.state,
          },
        );
      } else {
        context.go(AppRoutes.dashboard);
      }
    } catch (e) {
      debugPrint('MISSION REALM ERROR: $e');
      if (mounted) context.go(AppRoutes.dashboard);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final allMissions = ref.watch(publishedRecruitmentsProvider);
    final publishedStates = ref.watch(publishedStatesProvider);

    final missions = allMissions.where((r) {
      return r.state.toLowerCase() == selectedState.toLowerCase() ||
          r.state.toLowerCase() == 'central';
    }).toList();

    return PopScope(
      canPop: false,
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: TacticalNoirBackground(
          child: SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                return SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  padding: EdgeInsets.symmetric(
                    horizontal: ResponsiveHelper.wp(context, 0.06),
                    vertical: ResponsiveHelper.hp(context, 0.02),
                  ),
                  child: Center(
                    child: ConstrainedBox(
                      constraints: BoxConstraints(
                        minHeight: constraints.maxHeight,
                        maxWidth:
                            ResponsiveHelper.isTablet(context) ? 600 : 500,
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildHeader(),
                          SizedBox(
                              height: ResponsiveHelper.compactGap(context)),
                          if (isChangingState) ...[
                            _buildStateSearchSection(publishedStates),
                            const SizedBox(height: 16),
                          ],
                          _buildMissionSourceNotice(),
                          SizedBox(
                              height: ResponsiveHelper.sectionSpacing(context)),
                          SmartSearchField(
                            title: 'SEARCH MISSION',
                            hint: 'Type Exam Name',
                            controller: examSearchController,
                            suggestions:
                                searchResults.map((e) => e.title).toList(),
                            onChanged: (q) => _searchMissions(q, allMissions),
                            onSelected: (title) {
                              final recruitment = allMissions
                                  .firstWhere((r) => r.title == title);
                              setState(() {
                                selectedRecruitmentId = recruitment.id;
                                examSearchController.text = title;
                                searchResults = [];
                              });
                            },
                          ),
                          SizedBox(
                              height: ResponsiveHelper.compactGap(context)),
                          if (missions.isNotEmpty) ...[
                            _buildAvailableMissionsLabel(),
                            const SizedBox(height: 12),
                            ...missions
                                .take(10)
                                .map((r) => _buildMissionCard(r)),
                            if (missions.length > 10)
                              Padding(
                                padding: const EdgeInsets.only(top: 8),
                                child: Center(
                                    child: Text(
                                        '+ ${missions.length - 10} more missions available',
                                        style: AppTypography.label.copyWith(
                                            fontSize: 6,
                                            color: Colors.white10))),
                              ),
                          ] else
                            _buildEmptyState(),
                          SizedBox(
                              height: ResponsiveHelper.sectionSpacing(context)),
                          if (_isLoading)
                            const Center(
                                child: Padding(
                              padding: EdgeInsets.only(bottom: 20),
                              child: CircularProgressIndicator(
                                  color: AppColors.gold),
                            )),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Mission Realm',
                  style: AppTypography.hero
                      .copyWith(fontSize: ResponsiveHelper.sp(context, 20))),
              Text('Select the mission you are preparing to dominate.',
                  style: AppTypography.body.copyWith(
                      color: Colors.white30,
                      fontSize: ResponsiveHelper.sp(context, 12))),
            ],
          ),
        ),
        IconButton(
          onPressed: () => setState(() => isChangingState = !isChangingState),
          icon: Icon(
              isChangingState
                  ? Icons.close_rounded
                  : Icons.edit_location_alt_rounded,
              color: AppColors.gold,
              size: 20),
        ),
      ],
    );
  }

  Widget _buildMissionSourceNotice() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.borderSoft),
      ),
      child: Row(
        children: [
          const Icon(Icons.verified_outlined, color: AppColors.gold, size: 16),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Founder missions verified. Category mapping is pending source proof.',
              style: AppTypography.body.copyWith(
                color: Colors.white54,
                fontSize: 10,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAvailableMissionsLabel() {
    return Row(
      children: [
        const Icon(Icons.view_list_rounded, color: AppColors.gold, size: 15),
        const SizedBox(width: 8),
        Text(
          'AVAILABLE MISSIONS',
          style: AppTypography.label
              .copyWith(fontSize: 8, color: AppColors.gold, letterSpacing: 1.5),
        ),
      ],
    );
  }

  Widget _buildStateSearchSection(List<String> publishedStates) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderSoft),
      ),
      child: SmartSearchField(
        title: 'NEW STATE COMMAND',
        hint: 'Search State',
        controller: stateController,
        suggestions:
            filteredStates.where((s) => publishedStates.contains(s)).toList(),
        onChanged: _searchStates,
        onSelected: (state) async {
          setState(() {
            selectedState = state;
            stateController.text = state;
            selectedRecruitmentId = null;
            isChangingState = false;
          });
        },
      ),
    );
  }

  String _missionMeta(Recruitment recruitment) {
    final year =
        recruitment.year > 0 ? recruitment.year.toString() : 'Year pending';
    final status = _studentStatusLabel(recruitment.status);
    final category = recruitment.examCategory == 'category_pending'
        ? 'Category pending verification'
        : recruitment.examCategory;
    return '$year - $status - $category';
  }

  String _studentStatusLabel(String raw) {
    switch (raw.toUpperCase()) {
      case 'PREPARING':
        return 'Preparing';
      case 'COMING_SOON':
        return 'Coming soon';
      case 'ACTIVE':
        return 'Active';
      default:
        return raw.isEmpty ? 'Status pending' : raw;
    }
  }

  Widget _buildMissionCard(Recruitment recruitment) {
    final bool isExpanded = selectedRecruitmentId == recruitment.id;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isExpanded ? AppColors.gold : AppColors.borderSoft,
          width: 1.2,
        ),
      ),
      child: Column(
        children: [
          Material(
            color: Colors.transparent,
            child: ListTile(
              onTap: () => setState(() =>
                  selectedRecruitmentId = isExpanded ? null : recruitment.id),
              title: Text(recruitment.title,
                  style: AppTypography.cardTitle.copyWith(
                      fontSize: 13,
                      color: isExpanded ? AppColors.gold : Colors.white70)),
              subtitle: Text(_missionMeta(recruitment),
                  style: AppTypography.body
                      .copyWith(fontSize: 9, color: Colors.white24)),
              trailing: Icon(
                  isExpanded
                      ? Icons.keyboard_arrow_up_rounded
                      : Icons.keyboard_arrow_down_rounded,
                  color: Colors.white10,
                  size: 16),
            ),
          ),
          if (isExpanded)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Row(
                children: [
                  Expanded(
                    child: SizedBox(
                      height: 38,
                      child: ElevatedButton(
                        onPressed: () => _startMission(recruitment, true),
                        style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.gold,
                            foregroundColor: Colors.black,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8))),
                        child: const Text('SMART START',
                            style: TextStyle(
                                fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: SizedBox(
                      height: 38,
                      child: OutlinedButton(
                        onPressed: () => _startMission(recruitment, false),
                        style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: AppColors.borderSoft),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8))),
                        child: Text('QUICK START',
                            style: AppTypography.label
                                .copyWith(fontSize: 8, color: Colors.white60)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 40),
      child: Center(
          child: Text('No verified missions available for $selectedState yet.',
              style: AppTypography.body
                  .copyWith(color: Colors.white10, fontSize: 13))),
    );
  }
}
