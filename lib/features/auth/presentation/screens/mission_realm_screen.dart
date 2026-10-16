import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:firebase_auth/firebase_auth.dart' hide AuthProvider;
import 'package:cloud_firestore/cloud_firestore.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/tactical_noir_background.dart';
import '../../../../core/utils/app_routes.dart';
import '../../../../shared/session/session_manager.dart';
import '../../../../data/india_states.dart';
import '../../../../core/models/recruitment.dart';
import '../../../../core/knowledge/knowledge_engine.dart';
import '../../../../core/utils/responsive_helper.dart';
import '../../../../core/firebase/firestore_service.dart';
import '../../../profile/presentation/widgets/smart_search_field.dart';
import '../providers/auth_provider.dart';
import '../providers/mission_realm_provider.dart';
import '../../../../shared/providers/session_provider.dart';

class MissionRealmScreen extends ConsumerStatefulWidget {
  final Future<void> Function(String uid, Map<String, dynamic> data)? serverSelectionSaverForTest;

  const MissionRealmScreen({super.key, this.serverSelectionSaverForTest});

  @override
  ConsumerState<MissionRealmScreen> createState() => _MissionRealmScreenState();
}

class _MissionRealmScreenState extends ConsumerState<MissionRealmScreen> {
  String? selectedRecruitmentId;
  String selectedState = 'Rajasthan';
  String selectedStateCode = 'RJ';
  bool isChangingState = false;
  bool _isLoading = false;
  String _selectedJurisdiction = 'CENTRAL'; // 'CENTRAL' or 'STATE'

  final TextEditingController stateController = TextEditingController();
  final TextEditingController examSearchController = TextEditingController();

  List<String> filteredStates = [];
  List<Recruitment> searchResults = [];

  @override
  void initState() {
    super.initState();
    final syncState = SessionManager.getUserStateSync();
    final syncCode = SessionManager.getUserStateCodeSync();
    if (syncState != null && syncState.isNotEmpty) {
      selectedState = syncState;
      selectedStateCode = (syncCode != null && syncCode.isNotEmpty)
          ? syncCode
          : (IndiaStates.getStateCode(syncState) ?? 'RJ');
      stateController.text = selectedState;
    }
    _loadUserState();
  }

  @override
  void dispose() {
    stateController.dispose();
    examSearchController.dispose();
    super.dispose();
  }

  Future<void> _loadUserState() async {
    final syncState = SessionManager.getUserStateSync();
    final syncCode = SessionManager.getUserStateCodeSync();
    if (syncState != null && syncState.isNotEmpty) {
      setState(() {
        selectedState = syncState;
        selectedStateCode = (syncCode != null && syncCode.isNotEmpty)
            ? syncCode
            : (IndiaStates.getStateCode(syncState) ?? 'RJ');
        stateController.text = selectedState;
      });
    }

    final savedState = await SessionManager.getUserState();
    final savedCode = await SessionManager.getUserStateCode();
    if (savedState != null && savedState.isNotEmpty && mounted) {
      setState(() {
        selectedState = savedState;
        selectedStateCode = (savedCode != null && savedCode.isNotEmpty)
            ? savedCode
            : (IndiaStates.getStateCode(savedState) ?? 'RJ');
        stateController.text = selectedState;
      });
    }
  }

  Future<void> _saveMissionSelection(Recruitment recruitment) async {
    // 1. Authoritative server persistence to users/{uid} FIRST (fail-closed before local cache mutation)
    if (widget.serverSelectionSaverForTest != null) {
      String uid = 'test_uid';
      try {
        uid = FirebaseAuth.instance.currentUser?.uid ?? 'test_uid';
      } catch (_) {
        uid = 'test_uid';
      }
      await widget.serverSelectionSaverForTest!(
        uid,
        {
          'selectedExam': recruitment.examId,
          'selectedExamId': recruitment.examId,
          'selectedExamName': recruitment.title,
          'selectedBoardId': recruitment.boardId,
          'selectedRecruitmentId': recruitment.id,
          'selectedVariantId': recruitment.variantCode,
          'selectedBlueprintId': recruitment.examBlueprintId,
        },
      );
    } else if (!SessionManager.disableFirebaseForTest) {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        throw StateError('User must be authenticated to select a mission');
      }
      await FirestoreService.saveUserProfile(
        uid: user.uid,
        profileData: {
          'selectedExam': recruitment.examId,
          'selectedExamId': recruitment.examId,
          'selectedExamName': recruitment.title,
          'selectedBoardId': recruitment.boardId,
          'selectedRecruitmentId': recruitment.id,
          'selectedVariantId': recruitment.variantCode,
          'selectedBlueprintId': recruitment.examBlueprintId,
          'updatedAt': FieldValue.serverTimestamp(),
        },
      ).timeout(const Duration(seconds: 4));
      debugPrint('MISSION SELECTION SERVER PERSIST SUCCESS: ${recruitment.examId}');
    }

    // 2. Only AFTER server confirmation succeeds, update local cache
    await SessionManager.saveMissionIdentity(
      examId: recruitment.examId,
      examName: recruitment.title,
      recruitmentId: recruitment.id,
      examBlueprintId: recruitment.examBlueprintId,
      variantId: recruitment.variantCode,
      variantName: recruitment.variantCode,
    );

    await SessionManager.saveStudentState(selectedState, stateCode: selectedStateCode);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_state', selectedState);
  }

  void _searchStates(String query) {
    if (query.isEmpty) {
      setState(() => filteredStates = []);
      return;
    }
    setState(() {
      filteredStates = IndiaStates.searchStates(query);
    });
  }

  void _searchMissions(String query, List<Recruitment> candidateMissions) {
    if (query.isEmpty) {
      setState(() => searchResults = []);
      return;
    }
    final q = query.toLowerCase();
    setState(() {
      searchResults = candidateMissions.where((r) {
        return r.title.toLowerCase().contains(q) ||
            r.state.toLowerCase().contains(q) ||
            (r.stateName?.toLowerCase().contains(q) ?? false);
      }).toList();
    });
  }

  void _showMissionStartError() {
    final scheme = Theme.of(context).colorScheme;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: scheme.surface,
        content: Text(
          'Mission could not start yet. Please try again.',
          style: AppTypography.body.copyWith(color: scheme.onSurface),
        ),
      ),
    );
  }

  Future<void> _startMission(Recruitment recruitment, bool isSmart) async {
    if (_isLoading) return;
    setState(() => _isLoading = true);

    try {
      // 1. Authoritative server confirmation FIRST, followed by local cache persistence
      await _saveMissionSelection(recruitment);

      // 2. Authoritatively register this mission in the accessible catalog snapshot
      SessionManager.registerAccessibleMissions(
        [recruitment.examId],
        source: 'MISSION_REALM_START',
      );

      // 3. Invalidate sessionUserProvider to propagate state change
      ref.invalidate(sessionUserProvider);

      // 4. Background engine initialization (non-blocking)
      unawaited(
        KnowledgeEngine.instance
            .initialize(recruitment: recruitment, force: true)
            .catchError((e) {
          debugPrint('KnowledgeEngine init non-blocking note: $e');
        }),
      );

      if (!mounted) return;
      // Single canonical entry navigates to Dashboard; Diagnostic remains unavailable.
      context.go(AppRoutes.dashboard);
    } catch (e) {
      debugPrint('MISSION REALM ERROR: $e');
      if (mounted) _showMissionStartError();
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _getAuthorityGroupKey(Recruitment r) {
    if (r.authorityGroupKey.isNotEmpty) {
      return r.authorityGroupKey.toLowerCase().trim();
    }
    return 'other';
  }

  String _getAuthorityDisplayName(Recruitment r, String groupKey) {
    if (r.authorityDisplayName.isNotEmpty) {
      return r.authorityDisplayName;
    }
    switch (groupKey.toLowerCase()) {
      case 'nta':
        return 'National Testing Agency (NTA)';
      case 'upsc':
        return 'Union Public Service Commission (UPSC)';
      case 'ssc':
        return 'Staff Selection Commission (SSC)';
      case 'rpsc':
        return 'Rajasthan Public Service Commission (RPSC)';
      case 'uppsc':
        return 'Uttar Pradesh Public Service Commission (UPPSC)';
      default:
        return groupKey.isEmpty || groupKey == 'other' ? 'Other Exams' : groupKey.toUpperCase();
    }
  }

  bool _isCentralExam(Recruitment r) {
    if (r.jurisdictionLevel.isNotEmpty) {
      return r.jurisdictionLevel.toUpperCase() == 'CENTRAL';
    }
    final stateNorm = r.state.trim().toLowerCase();
    return stateNorm == 'central' || stateNorm == 'all india';
  }

  bool _isRegionalExam(Recruitment r, String stateName, String stateCode) {
    if (r.jurisdictionLevel.isNotEmpty) {
      final level = r.jurisdictionLevel.toUpperCase();
      if (level == 'CENTRAL') return false;
      if (level != 'STATE' && level != 'UT' && level != 'REGIONAL') return false;
    } else {
      if (r.state.trim().toLowerCase() == 'central') return false;
    }

    if (r.stateCode != null && r.stateCode!.isNotEmpty && stateCode.isNotEmpty) {
      final rCode = r.stateCode!.toUpperCase().trim();
      final targetCode = stateCode.toUpperCase().trim();
      if (rCode == targetCode) return true;
    }

    final rState = (r.stateName != null && r.stateName!.isNotEmpty) ? r.stateName! : r.state;
    final rStateNorm = rState.trim().toLowerCase();
    final targetStateNorm = stateName.trim().toLowerCase();
    if (rStateNorm.isNotEmpty && rStateNorm == targetStateNorm) return true;

    final mappedCode = IndiaStates.getStateCode(rState);
    if (mappedCode != null && stateCode.isNotEmpty && mappedCode.toUpperCase() == stateCode.toUpperCase()) {
      return true;
    }

    return false;
  }

  Future<void> _handleLogout() async {
    final scheme = Theme.of(context).colorScheme;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: scheme.surface,
        title: Text('Logout', style: TextStyle(color: scheme.onSurface, fontSize: 16)),
        content: Text(
          'Are you sure you want to log out of your session?',
          style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text('Cancel', style: TextStyle(color: scheme.onSurfaceVariant)),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Logout', style: TextStyle(color: AppColors.gold)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await ref.read(authNotifierProvider.notifier).signOut();
      if (mounted) {
        context.go(AppRoutes.login);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final allMissions = ref.watch(publishedRecruitmentsProvider);
    final publishedStates = ref.watch(publishedStatesProvider);

    if (allMissions.isNotEmpty) {
      SessionManager.registerAccessibleMissions(
        allMissions.map((r) => r.examId),
        source: 'MISSION_REALM_PROVIDER',
      );
    }

    final recruitmentsAsync = ref.watch(recruitmentsProvider);
    final isLoadingMissions = recruitmentsAsync.isLoading && !recruitmentsAsync.hasValue;
    final hasError = recruitmentsAsync.hasError && !recruitmentsAsync.hasValue;

    final discoverableMissions = allMissions.where((r) {
      if (!r.catalogDiscoverable || r.archived || r.founderHold || r.manualGovernanceLock) {
        return false;
      }
      final pubState = r.studentPublicationState.toUpperCase();
      if (pubState == 'INTERNAL_DRAFT' ||
          pubState == 'DRAFT' ||
          pubState == 'INTERNAL' ||
          pubState == 'UNPUBLISHED' ||
          pubState == 'ARCHIVED') {
        return false;
      }
      final rawStatus = r.status.toUpperCase();
      if (rawStatus == 'INTERNAL_DRAFT' ||
          rawStatus == 'DRAFT' ||
          rawStatus == 'ARCHIVED') {
        return false;
      }
      return true;
    }).toList();

    final centralMissions = discoverableMissions.where(_isCentralExam).toList();
    final stateMissions = discoverableMissions.where((r) => _isRegionalExam(r, selectedState, selectedStateCode)).toList();

    final List<Recruitment> activeJurisdictionMissions =
        _selectedJurisdiction == 'CENTRAL' ? centralMissions : stateMissions;

    final List<Recruitment> visibleMissions =
        examSearchController.text.trim().isNotEmpty ? searchResults : activeJurisdictionMissions;

    final sessionUser = ref.watch(sessionUserProvider).valueOrNull ?? SessionUser.getSync();
    final hasActiveMission = sessionUser.examId.isNotEmpty;

    final centralCountLabel = isLoadingMissions ? '--' : (hasError ? '!' : '${centralMissions.length}');
    final stateCountLabel = isLoadingMissions ? '--' : (hasError ? '!' : '${stateMissions.length}');

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (hasActiveMission) {
          try {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go(AppRoutes.dashboard);
            }
          } catch (_) {
            context.go(AppRoutes.dashboard);
          }
        }
      },
      child: Scaffold(
        backgroundColor: Theme.of(context).colorScheme.surface,
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
                          _buildHeader(hasActiveMission),
                          SizedBox(
                              height: ResponsiveHelper.compactGap(context)),
                          if (isChangingState) ...[
                            _buildStateSearchSection(publishedStates),
                            const SizedBox(height: 16),
                          ],
                          _buildJurisdictionSwitcher(
                            centralCountLabel: centralCountLabel,
                            stateCountLabel: stateCountLabel,
                          ),
                          if (_selectedJurisdiction == 'STATE') ...[
                            const SizedBox(height: 10),
                            _buildStateBanner(),
                          ],
                          SizedBox(
                              height: ResponsiveHelper.compactGap(context)),
                          SmartSearchField(
                            title: 'SEARCH MISSION',
                            hint: _selectedJurisdiction == 'CENTRAL'
                                ? 'Search Central Exams (e.g. JEE, NEET, CGL)'
                                : 'Search $selectedState Exams (e.g. 1st Grade, RAS)',
                            controller: examSearchController,
                            suggestions:
                                searchResults.map((e) => e.title).toList(),
                            onChanged: (q) =>
                                _searchMissions(q, activeJurisdictionMissions),
                            onSelected: (title) {
                              final match = activeJurisdictionMissions
                                  .where((r) => r.title == title);
                              if (match.isNotEmpty) {
                                final recruitment = match.first;
                                setState(() {
                                  selectedRecruitmentId = recruitment.id;
                                  examSearchController.text = title;
                                  searchResults = [];
                                });
                              }
                            },
                          ),
                          SizedBox(
                              height: ResponsiveHelper.compactGap(context)),
                          if (isLoadingMissions)
                            const Center(
                              child: Padding(
                                padding: EdgeInsets.symmetric(vertical: 40),
                                child: CircularProgressIndicator(
                                  color: AppColors.gold,
                                ),
                              ),
                            )
                          else if (hasError)
                            _buildErrorState(() => ref.refresh(recruitmentsProvider))
                          else if (visibleMissions.isNotEmpty)
                            _selectedJurisdiction == 'CENTRAL'
                                ? _buildCentralExamList(visibleMissions)
                                : _buildStateExamList(visibleMissions)
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

  Widget _buildHeader(bool hasActiveMission) {
    final scheme = Theme.of(context).colorScheme;
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Mission Realm',
                style: AppTypography.hero.copyWith(
                  fontSize: ResponsiveHelper.sp(context, 20),
                  color: scheme.onSurface,
                ),
              ),
              Text(
                'Select the mission you are preparing to dominate.',
                style: AppTypography.body.copyWith(
                    color: scheme.onSurfaceVariant,
                    fontSize: ResponsiveHelper.sp(context, 11)),
              ),
            ],
          ),
        ),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
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
            IconButton(
              tooltip: 'Logout',
              onPressed: _handleLogout,
              icon: const Icon(
                Icons.logout_rounded,
                color: AppColors.gold,
                size: 20,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildJurisdictionSwitcher({
    required String centralCountLabel,
    required String stateCountLabel,
  }) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: scheme.outline),
      ),
      child: Row(
        children: [
          Expanded(
            child: _jurisdictionTabButton(
              key: const ValueKey('tab_central_exams'),
              title: 'CENTRAL EXAMS',
              countLabel: centralCountLabel,
              isSelected: _selectedJurisdiction == 'CENTRAL',
              onTap: () {
                setState(() {
                  _selectedJurisdiction = 'CENTRAL';
                  selectedRecruitmentId = null;
                  examSearchController.clear();
                  searchResults = [];
                });
              },
            ),
          ),
          const SizedBox(width: 6),
          Expanded(
            child: _jurisdictionTabButton(
              key: const ValueKey('tab_state_exams'),
              title: 'STATE / UT EXAMS',
              countLabel: stateCountLabel,
              isSelected: _selectedJurisdiction == 'STATE',
              onTap: () {
                setState(() {
                  _selectedJurisdiction = 'STATE';
                  selectedRecruitmentId = null;
                  examSearchController.clear();
                  searchResults = [];
                });
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _jurisdictionTabButton({
    required Key key,
    required String title,
    required String countLabel,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    final scheme = Theme.of(context).colorScheme;
    return InkWell(
      key: key,
      borderRadius: BorderRadius.circular(8),
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.gold.withValues(alpha: 0.18) : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? AppColors.gold : Colors.transparent,
            width: 1.2,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Flexible(
              child: Text(
                title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppTypography.label.copyWith(
                  fontSize: 10,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                color: isSelected ? AppColors.gold : scheme.onSurfaceVariant,
                  letterSpacing: 0.5,
                ),
              ),
            ),
            const SizedBox(width: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
              decoration: BoxDecoration(
                color: isSelected ? AppColors.gold : scheme.outline,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                countLabel,
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                  color: isSelected ? scheme.onPrimary : scheme.onSurfaceVariant,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStateBanner() {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: scheme.surface.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: scheme.outline),
      ),
      child: Row(
        children: [
          Icon(Icons.location_on_rounded, color: AppColors.gold, size: 16),
          const SizedBox(width: 8),
          Text(
            'STATE:',
            style: AppTypography.label.copyWith(
              fontSize: 9,
              color: scheme.onSurfaceVariant,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              selectedState,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.cardTitle.copyWith(
                fontSize: 12,
                color: AppColors.gold,
              ),
            ),
          ),
          InkWell(
            onTap: () => setState(() => isChangingState = !isChangingState),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              child: Text(
                isChangingState ? 'CLOSE' : 'CHANGE',
                style: AppTypography.label.copyWith(
                  fontSize: 9,
                  color: AppColors.gold,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  IconData _getAuthorityIcon(String groupKey) {
    switch (groupKey.toLowerCase()) {
      case 'nta':
        return Icons.biotech_rounded;
      case 'upsc':
        return Icons.military_tech_rounded;
      case 'ssc':
        return Icons.account_balance_rounded;
      case 'rpsc':
      case 'uppsc':
        return Icons.domain_rounded;
      default:
        return Icons.assured_workload_rounded;
    }
  }

  Widget _buildCentralExamList(List<Recruitment> centralMissions) {
    final Map<String, List<Recruitment>> grouped = {};
    for (final m in centralMissions) {
      final groupKey = _getAuthorityGroupKey(m);
      grouped.putIfAbsent(groupKey, () => []).add(m);
    }

    final sortedKeys = grouped.keys.toList()
      ..sort((a, b) {
        const order = {'nta': 0, 'upsc': 1, 'ssc': 2};
        final rankA = order[a] ?? 99;
        final rankB = order[b] ?? 99;
        if (rankA != rankB) return rankA.compareTo(rankB);
        return a.compareTo(b);
      });

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ...sortedKeys.map((key) {
          final missions = grouped[key]!;
          final sample = missions.first;
          final authorityTitle = _getAuthorityDisplayName(sample, key);
          final icon = _getAuthorityIcon(key);
          return _buildAuthorityGroup(
            key: ValueKey('${key}_group_header'),
            title: authorityTitle,
            subtitle: missions.length == 1 ? '1 exam' : '${missions.length} exams',
            icon: icon,
            missions: missions,
          );
        }),
      ],
    );
  }

  Widget _buildAuthorityGroup({
    Key? key,
    required String title,
    String? subtitle,
    required IconData icon,
    required List<Recruitment> missions,
  }) {
    final scheme = Theme.of(context).colorScheme;
    final summaryText = subtitle ??
        (missions.length == 1 ? '1 exam' : '${missions.length} exams');

    return Container(
      key: key,
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: scheme.surface.withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: scheme.outline),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.gold.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: AppColors.gold, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: AppTypography.cardTitle.copyWith(
                          fontSize: 13,
                          color: scheme.onSurface,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        summaryText,
                        style: AppTypography.body.copyWith(
                          fontSize: 10,
                          color: scheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.gold.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.gold.withValues(alpha: 0.4), width: 0.8),
                  ),
                  child: Text(
                    '${missions.length}',
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: AppColors.gold,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Divider(color: scheme.outline, height: 1),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: missions.map((r) => _buildMissionCard(r)).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStateExamList(List<Recruitment> missions) {
    final Map<String, List<Recruitment>> grouped = {};
    for (final m in missions) {
      final groupKey = _getAuthorityGroupKey(m);
      grouped.putIfAbsent(groupKey, () => []).add(m);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ...grouped.entries.map((entry) {
          final sample = entry.value.first;
          final authorityTitle = _getAuthorityDisplayName(sample, entry.key);
          return _buildAuthorityGroup(
            key: ValueKey('${entry.key}_group_header'),
            title: authorityTitle,
            subtitle: entry.value.length == 1 ? '1 exam' : '${entry.value.length} exams',
            icon: Icons.domain_rounded,
            missions: entry.value,
          );
        }),
      ],
    );
  }

  Widget _buildStateSearchSection(List<String> publishedStates) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: scheme.outline),
      ),
      child: SmartSearchField(
        title: 'SELECT STATE',
        hint: 'Type state name (e.g. Rajasthan, UP)',
        controller: stateController,
        suggestions:
            filteredStates.where((s) => publishedStates.isEmpty || publishedStates.contains(s) || publishedStates.contains('Central')).toList(),
        onChanged: _searchStates,
        onSelected: (state) async {
          final code = IndiaStates.getStateCode(state) ?? '';
          await SessionManager.saveStudentState(state, stateCode: code);
          setState(() {
            selectedState = state;
            selectedStateCode = code;
            stateController.text = state;
            selectedRecruitmentId = null;
            isChangingState = false;
          });
        },
      ),
    );
  }

  String? _getVariantBadgeText(Recruitment recruitment) {
    final variantsData = recruitment.missionVariables['variants'];
    if (variantsData is List && variantsData.isNotEmpty) {
      return '${variantsData.length} subject variants';
    }
    final rawVarsCount = recruitment.missionVariables['variants_count'];
    if (rawVarsCount != null) {
      final count = int.tryParse(rawVarsCount.toString());
      if (count != null && count > 0) {
        return '$count subject variants';
      }
    }
    final idLower = recruitment.id.toLowerCase();
    final examIdLower = recruitment.examId.toLowerCase();
    final titleLower = recruitment.title.toLowerCase();
    if (idLower.contains('first_grade') ||
        examIdLower.contains('first_grade') ||
        idLower.contains('school_lecturer') ||
        examIdLower.contains('school_lecturer') ||
        titleLower.contains('first grade') ||
        titleLower.contains('1st grade')) {
      return '28 subject variants';
    }
    if (recruitment.variantCode.isNotEmpty &&
        recruitment.variantCode != recruitment.examId &&
        recruitment.variantCode != recruitment.id) {
      return 'Stream: ${recruitment.variantCode.toUpperCase()}';
    }
    if (idLower.contains('reet') || examIdLower.contains('reet')) {
      return 'Level 1 & Level 2';
    }
    if (idLower.contains('eo_ro') || examIdLower.contains('eo_ro')) {
      return 'EO & RO Streams';
    }
    if (idLower.contains('2nd_grade') || examIdLower.contains('2nd_grade')) {
      return '6 Subject Streams';
    }
    return null;
  }

  String _missionMeta(Recruitment recruitment) {
    return Recruitment.studentStatusLabel(recruitment.status);
  }

  Widget _buildMissionCard(Recruitment recruitment) {
    final bool isExpanded = selectedRecruitmentId == recruitment.id;
    final scheme = Theme.of(context).colorScheme;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isExpanded ? AppColors.gold : scheme.outline,
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
                      color: isExpanded ? AppColors.gold : scheme.onSurface)),
              subtitle: Text(_missionMeta(recruitment),
                  style: AppTypography.body
                      .copyWith(fontSize: 9, color: scheme.onSurfaceVariant)),
              trailing: Icon(
                  isExpanded
                      ? Icons.keyboard_arrow_up_rounded
                      : Icons.keyboard_arrow_down_rounded,
                  color: isExpanded ? AppColors.gold : scheme.onSurfaceVariant,
                  size: 16),
            ),
          ),
          if (isExpanded) _buildMissionInfoPanel(recruitment),
          if (isExpanded) _buildMissionActionButtons(recruitment),
        ],
      ),
    );
  }

  Widget _buildMissionActionButtons(Recruitment recruitment) {
    final canEnterMission = recruitment.canEnterMissionShell;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: LayoutBuilder(
        builder: (context, constraints) {
          return SizedBox(
            width: constraints.maxWidth,
            child: _missionActionButton(
              label: 'ENTER MISSION',
              icon: Icons.play_arrow_rounded,
              filled: true,
              onPressed: canEnterMission ? () => _startMission(recruitment, false) : null,
            ),
          );
        },
      ),
    );
  }

  Widget _buildMissionInfoPanel(Recruitment recruitment) {
    final groupKey = _getAuthorityGroupKey(recruitment);
    final authority = _getAuthorityDisplayName(recruitment, groupKey);
    final isCentral = _isCentralExam(recruitment);
    final stateName = (recruitment.stateName != null && recruitment.stateName!.isNotEmpty)
        ? recruitment.stateName!
        : (recruitment.state.isNotEmpty && recruitment.state.toLowerCase() != 'central'
            ? recruitment.state
            : 'State');
    final jurisdictionLabel = isCentral ? 'Central Exam • All India' : '$stateName Exam';

    final mediumVar = (recruitment.missionVariables['medium'] ?? recruitment.missionVariables['language'] ?? '').toString().trim();
    String? mediumBadgeText;
    if (mediumVar.isNotEmpty) {
      final mLower = mediumVar.toLowerCase();
      if (mLower.contains('bilingual') || (mLower.contains('hindi') && mLower.contains('english'))) {
        mediumBadgeText = 'Hindi & English (Bilingual)';
      } else {
        mediumBadgeText = mediumVar;
      }
    }

    String? categoryBadgeText;
    final rawCategory = recruitment.examCategory.trim();
    if (rawCategory.isNotEmpty) {
      final cLower = rawCategory.toLowerCase();
      if (cLower != 'category_pending' &&
          cLower != 'pending' &&
          cLower != 'none' &&
          cLower != 'null' &&
          cLower != 'general' &&
          cLower != 'draft') {
        categoryBadgeText = rawCategory
            .replaceAll('_', ' ')
            .replaceAll('-', ' ')
            .split(' ')
            .where((w) => w.isNotEmpty)
            .map((w) => w[0].toUpperCase() + w.substring(1).toLowerCase())
            .join(' ');
      }
    }

    final variantBadgeText = _getVariantBadgeText(recruitment);

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
            Row(
              children: [
                const Icon(Icons.verified_outlined, size: 13, color: AppColors.gold),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    authority,
                    style: AppTypography.label.copyWith(
                      color: AppColors.gold,
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (mediumBadgeText != null)
                  _infoBadge(Icons.language_rounded, mediumBadgeText),
                _infoBadge(Icons.public_rounded, jurisdictionLabel),
                if (variantBadgeText != null)
                  _infoBadge(Icons.layers_outlined, variantBadgeText),
                if (categoryBadgeText != null)
                  _infoBadge(Icons.category_outlined, categoryBadgeText),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoBadge(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: AppColors.gold.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 11, color: AppColors.gold),
          const SizedBox(width: 5),
          Text(
            text,
            style: AppTypography.body.copyWith(
              color: Colors.white.withValues(alpha: 0.85),
              fontSize: 9.5,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _missionActionButton({
    required String label,
    required IconData icon,
    required bool filled,
    required VoidCallback? onPressed,
  }) {
    final isEnabled = onPressed != null;

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
              color: filled
                  ? (isEnabled ? Colors.black : Colors.black38)
                  : (isEnabled ? AppColors.gold : Colors.white24),
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
            backgroundColor: isEnabled ? AppColors.gold : AppColors.gold.withValues(alpha: 0.25),
            foregroundColor: Colors.black,
            disabledBackgroundColor: AppColors.gold.withValues(alpha: 0.25),
            disabledForegroundColor: Colors.black38,
            elevation: isEnabled ? 2 : 0,
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
          foregroundColor: AppColors.gold,
          disabledForegroundColor: Colors.white24,
          backgroundColor: isEnabled ? AppColors.gold.withValues(alpha: 0.08) : Colors.transparent,
          side: BorderSide(
            color: isEnabled ? AppColors.gold : AppColors.borderSoft,
            width: 1.2,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(9),
          ),
        ),
        child: child,
      ),
    );
  }

  Widget _buildEmptyState() {
    if (_selectedJurisdiction == 'STATE') {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 16),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.school_outlined, size: 48, color: Colors.white24),
              const SizedBox(height: 16),
              Text(
                'No exams available for $selectedState yet.',
                textAlign: TextAlign.center,
                style: AppTypography.cardTitle.copyWith(
                  fontSize: 14,
                  color: AppColors.primaryText,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Missions for $selectedState will appear here once announced.',
                textAlign: TextAlign.center,
                style: AppTypography.body.copyWith(
                  fontSize: 11,
                  color: AppColors.secondaryText,
                ),
              ),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: () => setState(() => isChangingState = true),
                icon: const Icon(Icons.edit_location_alt_rounded, size: 14, color: AppColors.gold),
                label: Text(
                  'Change State',
                  style: AppTypography.label.copyWith(fontSize: 10, color: AppColors.gold),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.gold),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 16),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.search_off_rounded, size: 48, color: Colors.white24),
            const SizedBox(height: 16),
            Text(
              'No central exams found.',
              textAlign: TextAlign.center,
              style: AppTypography.cardTitle.copyWith(
                fontSize: 14,
                color: AppColors.primaryText,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(VoidCallback onRetry) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 16),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_rounded, size: 48, color: Colors.white24),
            const SizedBox(height: 16),
            Text(
              'Unable to load mission catalog.',
              textAlign: TextAlign.center,
              style: AppTypography.cardTitle.copyWith(
                fontSize: 14,
                color: AppColors.primaryText,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Please check your connection and tap retry to reconnect.',
              textAlign: TextAlign.center,
              style: AppTypography.body.copyWith(
                fontSize: 11,
                color: AppColors.secondaryText,
              ),
            ),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded, size: 14, color: AppColors.gold),
              label: Text(
                'Retry',
                style: AppTypography.label.copyWith(fontSize: 10, color: AppColors.gold),
              ),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.gold),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
