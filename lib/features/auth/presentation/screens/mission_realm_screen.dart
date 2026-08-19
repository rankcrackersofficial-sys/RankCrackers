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
import '../providers/auth_provider.dart';
import '../providers/mission_realm_provider.dart';
import '../../../../shared/providers/session_provider.dart';

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
  String _categoryFilter = 'all';

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

  void _showMissionStartError() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: const Color(0xFF111625),
        content: Text(
          'Mission could not start yet. Please try again.',
          style: AppTypography.body.copyWith(color: Colors.white),
        ),
      ),
    );
  }

  Future<void> _startMission(Recruitment recruitment, bool isSmart) async {
    if (_isLoading) return;
    setState(() => _isLoading = true);

    try {
      await _saveMissionSelection(recruitment);

      // 🔱 Atomic reactivity: invalidate sessionUserProvider & await re-hydration
      ref.invalidate(sessionUserProvider);
      await ref.read(sessionUserProvider.future);

      await KnowledgeEngine.instance
          .initialize(recruitment: recruitment, force: true)
          .timeout(const Duration(seconds: 5), onTimeout: () {
        debugPrint(
            'MISSION START: Engine hydration slow. Continuing with saved mission.');
      });

      if (!mounted) return;
      if (isSmart) {
        context.push(
          AppRoutes.diagnosticTest,
          extra: {
            'exam': recruitment.examId,
            'examName': recruitment.title,
            'variant': recruitment.variantCode,
            'state': recruitment.state,
          },
        );
      } else {
        context.go(AppRoutes.dashboard);
      }
    } catch (e) {
      debugPrint('MISSION REALM ERROR: $e');
      if (mounted) _showMissionStartError();
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _logoutToIdentity() async {
    if (_isLoading) return;
    await ref.read(authNotifierProvider.notifier).signOut();
    await SessionManager.logout();
    if (!mounted) return;
    context.go(AppRoutes.login);
  }

  @override
  Widget build(BuildContext context) {
    final allMissions = ref.watch(publishedRecruitmentsProvider);
    final publishedStates = ref.watch(publishedStatesProvider);

    final missions = allMissions.where((r) {
      return r.state.toLowerCase() == selectedState.toLowerCase() ||
          r.state.toLowerCase() == 'central';
    }).toList();
    final visibleMissions = _filterMissionsByCategory(missions);

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
                          _buildMissionCategorySwitcher(missions),
                          SizedBox(
                              height: ResponsiveHelper.compactGap(context)),
                          SmartSearchField(
                            title: 'SEARCH MISSION',
                            hint: 'Type Exam Name',
                            controller: examSearchController,
                            suggestions:
                                searchResults.map((e) => e.title).toList(),
                            onChanged: (q) =>
                                _searchMissions(q, visibleMissions),
                            onSelected: (title) {
                              final recruitment = visibleMissions
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
                          if (visibleMissions.isNotEmpty)
                            _buildMissionGroups(visibleMissions)
                          else
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
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              tooltip: 'Logout',
              onPressed: _logoutToIdentity,
              icon: Icon(
                Icons.logout_rounded,
                color: Colors.white54,
                size: 19,
              ),
            ),
            IconButton(
              tooltip:
                  isChangingState ? 'Close state selector' : 'Change state',
              onPressed: () =>
                  setState(() => isChangingState = !isChangingState),
              icon: Icon(
                  isChangingState
                      ? Icons.close_rounded
                      : Icons.edit_location_alt_rounded,
                  color: AppColors.gold,
                  size: 20),
            ),
          ],
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

  List<Recruitment> _filterMissionsByCategory(List<Recruitment> missions) {
    switch (_categoryFilter) {
      case 'competitive':
        return missions
            .where((mission) => _missionCategoryKey(mission) == 'competitive')
            .toList();
      case 'qualifying':
        return missions
            .where((mission) => _missionCategoryKey(mission) == 'qualifying')
            .toList();
      default:
        return missions;
    }
  }

  Widget _buildMissionCategorySwitcher(List<Recruitment> missions) {
    final competitive = missions
        .where((mission) => _missionCategoryKey(mission) == 'competitive')
        .length;
    final qualifying = missions
        .where((mission) => _missionCategoryKey(mission) == 'qualifying')
        .length;

    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        _categoryFilterChip('ALL', 'all', missions.length),
        _categoryFilterChip('COMPETITIVE', 'competitive', competitive),
        _categoryFilterChip('QUALIFYING', 'qualifying', qualifying),
      ],
    );
  }

  Widget _categoryFilterChip(String label, String value, int count) {
    final selected = _categoryFilter == value;
    return InkWell(
      borderRadius: BorderRadius.circular(999),
      onTap: () {
        setState(() {
          _categoryFilter = value;
          selectedRecruitmentId = null;
          examSearchController.clear();
          searchResults = [];
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.gold.withValues(alpha: 0.16)
              : AppColors.surface.withValues(alpha: 0.84),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: selected ? AppColors.gold : AppColors.borderSoft,
          ),
        ),
        child: Text(
          '$label $count',
          maxLines: 1,
          overflow: TextOverflow.visible,
          style: AppTypography.label.copyWith(
            color: selected ? AppColors.gold : Colors.white54,
            fontSize: 8,
            letterSpacing: 0.9,
          ),
        ),
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

  Widget _buildMissionGroups(List<Recruitment> missions) {
    final competitive = missions
        .where((mission) => _missionCategoryKey(mission) == 'competitive')
        .toList();
    final qualifying = missions
        .where((mission) => _missionCategoryKey(mission) == 'qualifying')
        .toList();
    final pending = missions
        .where((mission) => _missionCategoryKey(mission) == 'pending')
        .toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildAvailableMissionsLabel(),
        const SizedBox(height: 12),
        if (competitive.isNotEmpty)
          _buildMissionGroup(
            title: 'COMPETITIVE MISSIONS',
            subtitle: 'Rank-driven exams with source-backed category.',
            missions: competitive,
          ),
        if (qualifying.isNotEmpty)
          _buildMissionGroup(
            title: 'QUALIFYING MISSIONS',
            subtitle: 'Eligibility-focused exams with source-backed category.',
            missions: qualifying,
          ),
        if (pending.isNotEmpty)
          _buildMissionGroup(
            title: 'CATEGORY PENDING VERIFICATION',
            subtitle:
                'Visible missions whose category is not yet source-proven.',
            missions: pending,
          ),
      ],
    );
  }

  String _missionCategoryKey(Recruitment recruitment) {
    final category = recruitment.examCategory.trim().toLowerCase();
    if (category == 'competitive') return 'competitive';
    if (category == 'qualifying') return 'qualifying';
    return 'pending';
  }

  Widget _buildMissionGroup({
    required String title,
    required String subtitle,
    required List<Recruitment> missions,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
            decoration: BoxDecoration(
              color: AppColors.surface.withValues(alpha: 0.72),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.borderSoft),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.label.copyWith(
                    fontSize: 8,
                    color: AppColors.gold,
                    letterSpacing: 1.1,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  subtitle,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.body.copyWith(
                    fontSize: 9,
                    color: Colors.white38,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          ...missions.map((r) => _buildMissionCard(r)),
        ],
      ),
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
    final category = _studentCategoryLabel(recruitment);
    return '$year - $status - $category';
  }

  String _studentCategoryLabel(Recruitment recruitment) {
    switch (_missionCategoryKey(recruitment)) {
      case 'competitive':
        return 'Competitive mission';
      case 'qualifying':
        return 'Qualifying mission';
      default:
        return 'Category pending verification';
    }
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
        return 'Status pending verification';
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
          if (isExpanded) _buildMissionVariablePanel(recruitment),
          if (isExpanded) _buildMissionActionButtons(recruitment),
        ],
      ),
    );
  }

  Widget _buildMissionActionButtons(Recruitment recruitment) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final useStackedButtons = constraints.maxWidth < 292;
          final buttonWidth = useStackedButtons
              ? constraints.maxWidth
              : (constraints.maxWidth - 10) / 2;
          return Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              SizedBox(
                width: buttonWidth,
                child: _missionActionButton(
                  label: 'SMART START',
                  icon: Icons.auto_awesome_rounded,
                  filled: true,
                  onPressed: _areRequiredVariablesPresent(recruitment)
                      ? () => _startMission(recruitment, true)
                      : null,
                ),
              ),
              SizedBox(
                width: buttonWidth,
                child: _missionActionButton(
                  label: 'QUICK START',
                  icon: Icons.play_arrow_rounded,
                  filled: false,
                  onPressed: () => _startMission(recruitment, false),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildMissionVariablePanel(Recruitment recruitment) {
    final chips = _missionVariableChips(recruitment.missionVariables);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFF0D121C).withValues(alpha: 0.78),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.borderSoft),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'MISSION VARIABLES',
              style: AppTypography.label.copyWith(
                color: AppColors.gold,
                fontSize: 8,
                letterSpacing: 1.1,
              ),
            ),
            const SizedBox(height: 8),
            if (chips.isEmpty)
              Text(
                'Mission variables pending Founder projection',
                style: AppTypography.body.copyWith(
                  color: Colors.white38,
                  fontSize: 10,
                ),
              )
            else
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: chips,
              ),
          ],
        ),
      ),
    );
  }

  List<Widget> _missionVariableChips(Map<String, dynamic> variables) {
    final specs = <String, String>{
      'mediumPolicy': 'MEDIUM',
      'supportedMediums': 'MEDIUM',
      'paper_variables': 'PAPERS',
      'subject_variables': 'SUBJECTS',
      'vacancy_variables': 'VACANCY',
      'eligibility_variables': 'ELIGIBILITY',
      'category_variables': 'CATEGORY',
      'department_variables': 'DEPARTMENTS',
      'date_variables': 'DATES',
      'fee_variables': 'FEES',
    };

    final labels = <String>{};
    for (final entry in specs.entries) {
      final value = variables[entry.key];
      if (_studentVariableValue(value)) {
        labels.add(entry.value);
      }
    }

    return labels
        .map(
          (label) => Container(
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.gold.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: AppColors.gold.withValues(alpha: 0.35)),
            ),
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.label.copyWith(
                color: AppColors.gold,
                fontSize: 7,
                letterSpacing: 0.7,
              ),
            ),
          ),
        )
        .toList();
  }

  int _variablePackCount(dynamic value) {
    if (value is Map) return value.values.where(_studentVariableValue).length;
    if (value is Iterable) return value.where(_studentVariableValue).length;
    return _studentVariableValue(value) ? 1 : 0;
  }

  bool _studentVariableValue(dynamic value) {
    if (value == null) return false;
    if (value is String) return value.trim().isNotEmpty;
    if (value is num || value is bool) return true;
    return _variablePackCount(value) > 0;
  }

  bool _areRequiredVariablesPresent(Recruitment recruitment) {
    final vars = recruitment.missionVariables;
    final hasMedium = _studentVariableValue(vars['mediumPolicy']) || _studentVariableValue(vars['supportedMediums']);
    final hasPapers = _studentVariableValue(vars['paper_variables']);
    final hasSubjects = _studentVariableValue(vars['subject_variables']);
    return hasMedium && hasPapers && hasSubjects;
  }

  Widget _missionActionButton({
    required String label,
    required IconData icon,
    required bool filled,
    required VoidCallback? onPressed,
  }) {
    final child = FittedBox(
      fit: BoxFit.scaleDown,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14),
          const SizedBox(width: 6),
          Text(
            label,
            maxLines: 1,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.4,
              color: filled ? Colors.black : Colors.white70,
            ),
          ),
        ],
      ),
    );

    if (filled) {
      return SizedBox(
        height: 42,
        child: ElevatedButton(
          onPressed: onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.gold,
            foregroundColor: Colors.black,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(9),
            ),
          ),
          child: child,
        ),
      );
    }

    return SizedBox(
      height: 42,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: Colors.white70,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          side: const BorderSide(color: AppColors.borderSoft),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(9),
          ),
        ),
        child: child,
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
