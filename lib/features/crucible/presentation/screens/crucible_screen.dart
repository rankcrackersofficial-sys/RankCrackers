import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/tactical_noir_background.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/utils/app_routes.dart';
import '../../../../core/widgets/dark_card.dart';
import '../../../../shared/providers/session_provider.dart';
import '../../../../shared/widgets/command_header.dart';
import '../../../../core/knowledge/knowledge_engine.dart';
import '../../../dashboard/presentation/providers/dashboard_provider.dart';
import '../../core/crucible_clock_engine.dart';
import '../../core/crucible_canonical_schedules.dart';
import '../../models/crucible_protocol_state.dart';
import '../providers/crucible_state_provider.dart';
import '../../../digibook/domain/services/digibook_canonical_bridge_service.dart';
import '../../../digibook/domain/models/digibook_launch_args.dart';

/// CRUCIBLE SCREEN
/// Sovereign Student Panel for the 98-Day Continuous Learning Ring.
/// Adheres strictly to the Universal Crucible Constitution and Academic Truth.
class CrucibleScreen extends ConsumerStatefulWidget {
  const CrucibleScreen({super.key});

  @override
  ConsumerState<CrucibleScreen> createState() => _CrucibleScreenState();
}

class _CrucibleScreenState extends ConsumerState<CrucibleScreen> {
  @override
  void initState() {
    super.initState();
    DigiBookCanonicalBridgeService.instance.initialize();
  }

  @override
  Widget build(BuildContext context) {
    final sessionUser = ref.watch(sessionUserProvider).valueOrNull;
    final readiness = ref.watch(missionReadinessProvider);
    final knowledge = KnowledgeEngine.instance;
    final momentum = knowledge.momentumState;

    final protocolStateAsync = ref.watch(crucibleProtocolStateProvider);
    final missionId = sessionUser?.examId ?? '';
    final publishedDays = missionId.isEmpty
        ? const <Map<String, dynamic>>[]
        : ref.watch(publishedCrucibleDaysProvider(missionId)).valueOrNull ??
            const <Map<String, dynamic>>[];
    final publishedTests = missionId.isEmpty
        ? const <Map<String, dynamic>>[]
        : ref.watch(publishedCrucibleTestsProvider(missionId)).valueOrNull ??
            const <Map<String, dynamic>>[];

    return protocolStateAsync.when(
      data: (protocolState) {
        if (publishedDays.isNotEmpty) {
          return _buildPublishedStudySchedule(
            sessionUser: sessionUser,
            readiness: readiness,
            momentum: momentum,
            days: publishedDays,
          );
        }
        if (protocolState == null) {
          return _buildPreparingState(
            sessionUser: sessionUser,
            readiness: readiness,
            momentum: momentum,
            publishedDayCount: publishedDays.length,
            publishedTestCount: publishedTests.length,
          );
        }
        return _buildCrucibleContent(
          protocolState: protocolState,
          sessionUser: sessionUser,
          readiness: readiness,
          momentum: momentum,
        );
      },
      loading: () => Scaffold(
        backgroundColor: Theme.of(context).colorScheme.surface,
        body: TacticalNoirBackground(
          child: const Center(
            child: CircularProgressIndicator(color: AppColors.gold),
          ),
        ),
      ),
      error: (err, stack) => _buildPreparingState(
        sessionUser: sessionUser,
        readiness: readiness,
        momentum: momentum,
      ),
    );
  }

  Widget _buildPublishedStudySchedule({
    required SessionUser? sessionUser,
    required dynamic readiness,
    required dynamic momentum,
    required List<Map<String, dynamic>> days,
  }) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: scheme.surface,
      body: TacticalNoirBackground(
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CommandHeader(
                userName: sessionUser?.name ?? 'Warrior',
                userPhoto: sessionUser?.photo,
                examName: sessionUser?.examName ?? 'SSC CGL 2026',
                readiness: readiness,
                momentum: momentum,
                missionEvidenceVerified: true,
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
                child: Text('DAILY TRAINING PLAN',
                    style: AppTypography.cardTitle.copyWith(
                        color: scheme.onSurface,
                        fontSize: 14,
                        letterSpacing: 1.0)),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Text(
                    'Source-bound SSC syllabus study schedule • assessments remain locked until question verification.',
                    style: AppTypography.body.copyWith(
                        color: scheme.onSurfaceVariant,
                        fontSize: 11,
                        height: 1.35)),
              ),
              const SizedBox(height: 8),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.fromLTRB(24, 8, 24, 100),
                  itemCount: days.length,
                  itemBuilder: (context, index) {
                    final day = days[index];
                    final subjects =
                        (day['subjects'] as List?)?.join(' • ') ?? 'SSC CGL';
                    final count = day['atomCount'] ??
                        (day['coveredAtomIds'] as List?)?.length ??
                        0;
                    final rawLanes = day['subjectLanes'];
                    final lanes = rawLanes is Map
                        ? Map<String, dynamic>.from(rawLanes)
                        : const <String, dynamic>{};
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: DarkCard(
                        padding: const EdgeInsets.all(14),
                        child: Row(children: [
                          Text('DAY ${day['day'] ?? index + 1}',
                              style: AppTypography.cardTitle.copyWith(
                                  color: AppColors.gold, fontSize: 12)),
                          const SizedBox(width: 14),
                          Expanded(
                              child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                Text(subjects,
                                    style: TextStyle(
                                        color: scheme.onSurface,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600)),
                                const SizedBox(height: 3),
                                Text(
                                    '$count verified atomic study topics • Assessment pending verification',
                                    style: TextStyle(
                                        color: scheme.onSurfaceVariant,
                                        fontSize: 10)),
                                if (lanes.isNotEmpty) ...[
                                  const SizedBox(height: 6),
                                  Wrap(
                                    spacing: 5,
                                    runSpacing: 4,
                                    children: lanes.entries.map((entry) {
                                      final lane = entry.value is Map
                                          ? Map<String, dynamic>.from(
                                              entry.value as Map)
                                          : const <String, dynamic>{};
                                      final short =
                                          entry.key == 'Quantitative Aptitude'
                                              ? 'Quant'
                                              : entry.key == 'General Awareness'
                                                  ? 'GA'
                                                  : entry.key;
                                      return Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 6, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: AppColors.gold
                                              .withValues(alpha: 0.10),
                                          borderRadius:
                                              BorderRadius.circular(5),
                                        ),
                                        child: Text(
                                          '$short ${lane['newCount'] ?? 0}N/${lane['revisionCount'] ?? 0}R',
                                          style: const TextStyle(
                                              color: AppColors.gold,
                                              fontSize: 8.5,
                                              fontWeight: FontWeight.w600),
                                        ),
                                      );
                                    }).toList(),
                                  ),
                                ],
                              ])),
                          Icon(Icons.chevron_right_rounded,
                              color: scheme.onSurfaceVariant),
                        ]),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPreparingState({
    required SessionUser? sessionUser,
    required dynamic readiness,
    required dynamic momentum,
    int publishedDayCount = 0,
    int publishedTestCount = 0,
  }) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: scheme.surface,
      body: TacticalNoirBackground(
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CommandHeader(
                userName: sessionUser?.name ?? 'Warrior',
                userPhoto: sessionUser?.photo,
                examName: sessionUser?.examName ?? 'Mission',
                readiness: readiness,
                momentum: momentum,
                missionEvidenceVerified: false,
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
                child: Text(
                  'DAILY TRAINING PLAN',
                  style: AppTypography.cardTitle.copyWith(
                    color: scheme.onSurface,
                    fontSize: 14,
                    letterSpacing: 1.0,
                  ),
                ),
              ),
              Expanded(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24.0),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: scheme.surfaceContainerHighest,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: scheme.outline),
                          ),
                          child: const Icon(
                            Icons.local_fire_department_rounded,
                            color: AppColors.gold,
                            size: 40,
                          ),
                        ),
                        const SizedBox(height: 20),
                        Text(
                          'CRUCIBLE PREPARATION',
                          style: AppTypography.hero.copyWith(
                            fontSize: 18,
                            color: scheme.onSurface,
                            letterSpacing: 1.1,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          publishedDayCount > 0
                              ? '${sessionUser?.examName ?? "This mission"} has $publishedDayCount published Crucible day(s) and $publishedTestCount published test(s).\n\nYour personal orbit will activate when your mission protocol state is created.'
                              : 'The mission schedule is not published yet for ${sessionUser?.examName ?? "this mission"}.',
                          textAlign: TextAlign.center,
                          style: AppTypography.body.copyWith(
                            fontSize: 13,
                            color: scheme.onSurfaceVariant,
                            height: 1.45,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCrucibleContent({
    required CrucibleProtocolState protocolState,
    required SessionUser? sessionUser,
    required dynamic readiness,
    required dynamic momentum,
  }) {
    final scheme = Theme.of(context).colorScheme;
    final now = DateTime.now();

    // Sovereign Global Clock Authority
    final globalStartTime = protocolState.protocolStartTime;
    final effectiveState = protocolState;

    final currentCycleDay = CrucibleClockEngine.getCycleDay(
      state: effectiveState,
      now: now,
    );

    final orbitNumber = CrucibleClockEngine.getOrbitNumber(
      protocolStartTime: globalStartTime,
      now: now,
    );

    final currentPhase =
        CrucibleCanonicalScheduleRegistry.getPhaseForCycleDay(currentCycleDay);
    final isRebuild =
        CrucibleCanonicalScheduleRegistry.isRebuildDay(currentCycleDay);
    final isMacro =
        CrucibleCanonicalScheduleRegistry.isMacroDay(currentCycleDay);

    final activeSchedule =
        CrucibleCanonicalScheduleRegistry.getScheduleForCycleDay(
            currentCycleDay);

    // Calculate position inside the 2-day schedule
    final isDayB =
        activeSchedule != null && currentCycleDay == activeSchedule.endCycleDay;
    final dayInScheduleLabel = isDayB ? 'Day B of 2' : 'Day A of 2';

    return Scaffold(
      backgroundColor: scheme.surface,
      body: TacticalNoirBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CommandHeader(
                  userName: sessionUser?.name ?? 'Candidate',
                  userPhoto: sessionUser?.photo,
                  examName: sessionUser?.examName ?? 'Mission',
                  readiness: readiness,
                  momentum: momentum,
                  missionEvidenceVerified: false,
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.screenPadding,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 12),
                      Text(
                        'DAILY TRAINING PLAN',
                        style: AppTypography.cardTitle.copyWith(
                          color: scheme.onSurface,
                          fontSize: 14,
                          letterSpacing: 1.0,
                        ),
                      ),
                      const SizedBox(height: 8),
                      // 🔱 1. TOP COMPACT HEADER SECTION
                      _buildCompactHeader(
                        currentCycleDay,
                        currentPhase,
                        orbitNumber,
                        sessionUser?.examName ?? 'Mission',
                      ),
                      const SizedBox(height: 16),

                      // 🔱 2. TODAY'S ACTIVE SCHEDULE CARD
                      _buildTodayScheduleCard(
                        activeSchedule: activeSchedule,
                        currentCycleDay: currentCycleDay,
                        currentPhase: currentPhase,
                        dayInScheduleLabel: dayInScheduleLabel,
                        isRebuild: isRebuild,
                        isMacro: isMacro,
                      ),
                      const SizedBox(height: 16),

                      // 🔱 3. PERSONAL COVERAGE LEDGER
                      _buildPersonalCoverageCard(sessionUser, currentCycleDay),
                      const SizedBox(height: 16),

                      // 🔱 4. UPCOMING MILESTONES (REBUILD & MACRO)
                      _buildMilestonesCard(currentCycleDay, currentPhase),
                      const SizedBox(height: 16),

                      // 🔱 5. 98-DAY CONTINUOUS RING VISUALIZATION
                      _build98DayRingCard(currentCycleDay, currentPhase),
                      const SizedBox(height: 16),

                      // 🔱 6. ANCILLARY CALIBRATION & COMPETITION HOLDS
                      _buildAncillaryHoldsCard(),
                      const SizedBox(height: 60),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION 1: COMPACT HEADER SECTION (<= 110dp)
  // ---------------------------------------------------------------------------
  Widget _buildCompactHeader(
      int currentCycleDay, int currentPhase, int orbitNumber, String examName) {
    final scheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: AppColors.gold.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(4),
                border:
                    Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
              ),
              child: Text(
                examName.toUpperCase(),
                style: TextStyle(
                  color: AppColors.gold,
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.1,
                ),
              ),
            ),
            Text(
              'Continuous Learning Ring',
              style: AppTypography.subtitle.copyWith(
                color: scheme.onSurfaceVariant,
                fontSize: 11,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Text(
          'THE CRUCIBLE',
          style: AppTypography.hero.copyWith(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.2,
            color: scheme.onSurface,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          'DAY $currentCycleDay OF 98 • BLOCK $currentPhase OF 7 • CYCLE $orbitNumber',
          style: AppTypography.label.copyWith(
            color: AppColors.gold,
            fontWeight: FontWeight.w600,
            fontSize: 11,
            letterSpacing: 1.0,
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION 2: TODAY'S ACTIVE SCHEDULE CARD
  // ---------------------------------------------------------------------------
  Widget _buildTodayScheduleCard({
    required CrucibleCanonicalSchedule? activeSchedule,
    required int currentCycleDay,
    required int currentPhase,
    required String dayInScheduleLabel,
    required bool isRebuild,
    required bool isMacro,
  }) {
    final scheme = Theme.of(context).colorScheme;
    if (isRebuild) {
      return DarkCard(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildTagChip('REBUILD WINDOW', AppColors.gold),
                Text('Day $currentCycleDay of 98',
                    style: AppTypography.subtitle),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              'Block $currentPhase Rebuild Window',
              style: AppTypography.section
                  .copyWith(color: scheme.onSurface, fontSize: 17),
            ),
            const SizedBox(height: 6),
            Text(
              'No assessment evidence yet. Use this window to revisit missed or unfinished learning.',
              style: AppTypography.body.copyWith(
                  color: scheme.onSurfaceVariant, fontSize: 13, height: 1.4),
            ),
            const SizedBox(height: 14),
            OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.gold),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8)),
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
              ),
              icon: const Icon(Icons.menu_book_rounded,
                  color: AppColors.gold, size: 16),
              label: const Text('EXPLORE SYLLABUS',
                  style: TextStyle(
                      color: AppColors.gold,
                      fontSize: 12,
                      fontWeight: FontWeight.w700)),
              onPressed: () => context.push(AppRoutes.syllabus),
            ),
          ],
        ),
      );
    }

    if (isMacro) {
      return DarkCard(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildTagChip('MACRO CITADEL', AppColors.gold),
                Text('Day $currentCycleDay of 98',
                    style: AppTypography.subtitle),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              'Block $currentPhase Comprehensive Milestone',
              style: AppTypography.section
                  .copyWith(color: scheme.onSurface, fontSize: 17),
            ),
            const SizedBox(height: 6),
            Text(
              'Block synthesis training milestone (50 Questions / 120 Minutes).',
              style: AppTypography.body.copyWith(
                  color: scheme.onSurfaceVariant, fontSize: 13, height: 1.4),
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: scheme.surfaceContainerHighest.withValues(alpha: 0.65),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: scheme.outline),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline_rounded,
                      color: scheme.onSurfaceVariant, size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Macro assessment is not ready yet.',
                      style: AppTypography.subtitle.copyWith(
                          color: scheme.onSurfaceVariant, fontSize: 11),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    if (activeSchedule == null) {
      return DarkCard(
        padding: const EdgeInsets.all(18),
        child: Text(
          'No active schedule resolved for Day $currentCycleDay.',
          style: AppTypography.body,
        ),
      );
    }

    // Resolve DigiBook Availability from Bridge
    final bridge = DigiBookCanonicalBridgeService.instance;
    final List<DigiBookAuthorityEntry> resolvedEntries = [];
    for (final nodeId in activeSchedule.canonicalNodeIds) {
      final res = bridge.resolveCanonicalNode(nodeId);
      if (res.isMapped) {
        resolvedEntries.addAll(res.entries);
      }
    }
    // Also check direct GU bindings
    for (final guId in activeSchedule.generationUnitIds) {
      final entry = bridge.getEntryByGuId(guId);
      if (entry != null && !resolvedEntries.any((e) => e.guId == guId)) {
        resolvedEntries.add(entry);
      }
    }

    final bool hasContent = resolvedEntries.isNotEmpty;

    return DarkCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildTagChip(
                  '${activeSchedule.formattedCode} • $dayInScheduleLabel',
                  AppColors.gold),
              Text(
                activeSchedule.subject.toUpperCase(),
                style: TextStyle(
                  color: scheme.onSurfaceVariant,
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1.0,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Title
          Text(
            activeSchedule.canonicalTitle,
            style: AppTypography.section.copyWith(
              color: scheme.onSurface,
              fontSize: 17,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '${activeSchedule.subject} • Block ${activeSchedule.phaseIndex}',
            style: AppTypography.subtitle.copyWith(
              color: scheme.onSurfaceVariant,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 12),

          // Truthful Content Availability Indicator (No operational/production jargon)
          Row(
            children: [
              Icon(
                hasContent
                    ? Icons.check_circle_outline_rounded
                    : Icons.radio_button_unchecked_rounded,
                size: 14,
                color: hasContent ? AppColors.success : scheme.onSurfaceVariant,
              ),
              const SizedBox(width: 6),
              Text(
                hasContent
                    ? 'Learning content available'
                    : 'Learning content not available yet',
                style: TextStyle(
                  color:
                      hasContent ? AppColors.success : scheme.onSurfaceVariant,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Action Buttons: LEARN / CONTINUE LEARNING & SYLLABUS
          Row(
            children: [
              Expanded(
                flex: 3,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: hasContent
                        ? AppColors.gold
                        : scheme.surfaceContainerHighest,
                    foregroundColor:
                        hasContent ? scheme.onPrimary : scheme.onSurfaceVariant,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    elevation: 0,
                  ),
                  icon: const Icon(Icons.play_arrow_rounded, size: 18),
                  label: Text(
                    hasContent ? 'LEARN' : 'LEARN',
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 13,
                      letterSpacing: 1.0,
                    ),
                  ),
                  onPressed: hasContent
                      ? () =>
                          _handleLearnAction(activeSchedule, resolvedEntries)
                      : () => _handleUnavailableContent(activeSchedule),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                flex: 2,
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: scheme.outline),
                    foregroundColor: scheme.onSurface,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  onPressed: () => context.push(AppRoutes.syllabus),
                  child: const Text(
                    'SYLLABUS',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.6,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Micro Test Status (Truthful Hold, No governance internals)
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: scheme.surfaceContainerHighest.withValues(alpha: 0.55),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: scheme.outline),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.shield_outlined,
                    color: scheme.onSurfaceVariant, size: 15),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Micro assessment is not ready for this schedule yet.',
                    style: AppTypography.subtitle.copyWith(
                      color: scheme.onSurfaceVariant,
                      fontSize: 11,
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

  // Multi-GU Learning Action (Zero Autoselect First GU without User Choice)
  void _handleLearnAction(
    CrucibleCanonicalSchedule schedule,
    List<DigiBookAuthorityEntry> entries,
  ) {
    final scheme = Theme.of(context).colorScheme;
    if (entries.isEmpty) {
      _handleUnavailableContent(schedule);
      return;
    }

    if (entries.length == 1) {
      final entry = entries.first;
      final launchArgs = DigiBookLaunchArgs(
        generationUnitId: entry.guId,
        canonicalNodeId: entry.canonicalNodeId,
        revisionId: entry.lessonRevision,
        subject: entry.subject,
        topicTitle:
            entry.topic.isNotEmpty ? entry.topic : schedule.canonicalTitle,
        factSemantics: entry.factSemantics,
        atomicFactIds: entry.atomicFactIds,
      );

      context.push(AppRoutes.digibookReader, extra: launchArgs);
      return;
    }

    // Multiple GUs: Render governed selection sheet
    showModalBottomSheet(
      context: context,
      backgroundColor: scheme.surfaceContainerHighest,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${schedule.formattedCode} — ${schedule.canonicalTitle}',
                style: AppTypography.section
                    .copyWith(color: scheme.onSurface, fontSize: 16),
              ),
              const SizedBox(height: 4),
              Text(
                'Select a learning module to begin (${entries.length} modules available):',
                style: AppTypography.subtitle
                    .copyWith(color: scheme.onSurfaceVariant, fontSize: 12),
              ),
              const SizedBox(height: 12),
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: entries.length,
                  separatorBuilder: (_, __) =>
                      Divider(color: scheme.outline, height: 1),
                  itemBuilder: (context, index) {
                    final e = entries[index];
                    return ListTile(
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                      leading: CircleAvatar(
                        radius: 12,
                        backgroundColor: AppColors.gold.withValues(alpha: 0.15),
                        child: Text(
                          '${index + 1}',
                          style: const TextStyle(
                              color: AppColors.gold,
                              fontSize: 11,
                              fontWeight: FontWeight.bold),
                        ),
                      ),
                      title: Text(
                        e.topic.isNotEmpty ? e.topic : 'Module ${index + 1}',
                        style: TextStyle(
                            color: scheme.onSurface,
                            fontSize: 13,
                            fontWeight: FontWeight.w600),
                      ),
                      trailing: Icon(Icons.chevron_right_rounded,
                          color: scheme.onSurfaceVariant, size: 18),
                      onTap: () {
                        Navigator.pop(ctx);
                        final launchArgs = DigiBookLaunchArgs(
                          generationUnitId: e.guId,
                          canonicalNodeId: e.canonicalNodeId,
                          revisionId: e.lessonRevision,
                          subject: e.subject,
                          topicTitle: e.topic.isNotEmpty
                              ? e.topic
                              : schedule.canonicalTitle,
                          factSemantics: e.factSemantics,
                          atomicFactIds: e.atomicFactIds,
                        );
                        this
                            .context
                            .push(AppRoutes.digibookReader, extra: launchArgs);
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _handleUnavailableContent(CrucibleCanonicalSchedule schedule) {
    final scheme = Theme.of(context).colorScheme;
    showModalBottomSheet(
      context: context,
      backgroundColor: scheme.surfaceContainerHighest,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.info_outline_rounded,
                      color: AppColors.gold, size: 20),
                  const SizedBox(width: 10),
                  Text(
                    'Learning Content Not Available Yet',
                    style: AppTypography.section
                        .copyWith(color: scheme.onSurface, fontSize: 15),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                'Learning content for "${schedule.canonicalTitle}" (${schedule.formattedCode}) is not available yet. You may explore related syllabus topics.',
                style: AppTypography.body.copyWith(
                    color: scheme.onSurfaceVariant, fontSize: 13, height: 1.4),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.gold,
                    foregroundColor: scheme.onPrimary,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8)),
                  ),
                  onPressed: () {
                    Navigator.pop(ctx);
                    context.push(AppRoutes.syllabus);
                  },
                  child: const Text('EXPLORE SYLLABUS',
                      style:
                          TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION 3: PERSONAL COVERAGE LEDGER (Zero Fake % Metrics)
  // ---------------------------------------------------------------------------
  Widget _buildPersonalCoverageCard(SessionUser? user, int currentCycleDay) {
    final scheme = Theme.of(context).colorScheme;
    return DarkCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'PERSONAL COVERAGE LEDGER',
                style: TextStyle(
                  color: AppColors.gold,
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.2,
                ),
              ),
              Text(
                'Continuous Progress',
                style: AppTypography.subtitle.copyWith(fontSize: 10),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildMetricTile(
                  label: 'Schedules Done',
                  value: '0',
                  hint: 'Verified attempts',
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildMetricTile(
                  label: 'Modules Studied',
                  value: '0',
                  hint: 'Active sessions',
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildMetricTile(
                  label: 'Backlog Scope',
                  value: '0',
                  hint: 'Never-wait policy',
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            'Your individual ledger records verified academic progress independently of the rotating mission clock. Late joiners start without fake failure or penalty.',
            style: AppTypography.subtitle.copyWith(
              color: scheme.onSurfaceVariant,
              fontSize: 10,
              height: 1.3,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricTile({
    required String label,
    required String value,
    required String hint,
  }) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: scheme.outline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: TextStyle(
              color: scheme.onSurface,
              fontSize: 18,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            label,
            style: const TextStyle(
              color: AppColors.gold,
              fontSize: 10,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 1),
          Text(
            hint,
            style: TextStyle(
              color: scheme.onSurfaceVariant,
              fontSize: 9,
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION 4: UPCOMING MILESTONES (REBUILD & MACRO)
  // ---------------------------------------------------------------------------
  Widget _buildMilestonesCard(int currentCycleDay, int currentPhase) {
    final scheme = Theme.of(context).colorScheme;
    final nextRebuildDay =
        currentPhase * 14 - 1; // e.g. Day 13 for Phase 1, Day 27 for Phase 2...
    final nextMacroDay =
        currentPhase * 14; // e.g. Day 14 for Phase 1, Day 28 for Phase 2...

    return DarkCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'BLOCK $currentPhase MILESTONES',
            style: const TextStyle(
              color: AppColors.gold,
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 12),
          _buildMilestoneRow(
            icon: Icons.build_circle_outlined,
            title: 'Rebuild Day • Day $nextRebuildDay',
            subtitle:
                'Personalized concept repair window for Block $currentPhase',
          ),
          Padding(
            padding: EdgeInsets.symmetric(vertical: 6),
            child: Divider(color: scheme.outline),
          ),
          _buildMilestoneRow(
            icon: Icons.flag_outlined,
            title: 'Macro Citadel • Day $nextMacroDay',
            subtitle:
                'Block $currentPhase synthesis assessment (50 Questions / 120 Min)',
          ),
        ],
      ),
    );
  }

  Widget _buildMilestoneRow({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    final scheme = Theme.of(context).colorScheme;
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: scheme.surfaceContainerHighest.withValues(alpha: 0.55),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: AppColors.gold, size: 18),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: AppTypography.body.copyWith(
                  color: scheme.onSurface,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 1),
              Text(
                subtitle,
                style: AppTypography.subtitle.copyWith(
                  color: scheme.onSurfaceVariant,
                  fontSize: 10,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION 5: 98-DAY CONTINUOUS RING VISUALIZATION
  // ---------------------------------------------------------------------------
  Widget _build98DayRingCard(int currentCycleDay, int currentPhase) {
    final scheme = Theme.of(context).colorScheme;
    return DarkCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '98-DAY CONTINUOUS RING',
                style: TextStyle(
                  color: AppColors.gold,
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.2,
                ),
              ),
              Text(
                '7 Blocks • 42 Schedules',
                style: AppTypography.subtitle.copyWith(fontSize: 10),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // 7 Phase Block Tiles
          Row(
            children: List.generate(7, (index) {
              final phaseNum = index + 1;
              final isCurrent = phaseNum == currentPhase;
              final isPast = phaseNum < currentPhase;

              return Expanded(
                child: Container(
                  margin: EdgeInsets.only(right: index < 6 ? 5 : 0),
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: isCurrent
                        ? AppColors.gold.withValues(alpha: 0.18)
                        : (isPast
                            ? scheme.surfaceContainerHighest
                                .withValues(alpha: 0.7)
                            : scheme.surface.withValues(alpha: 0.35)),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                      color: isCurrent ? AppColors.gold : scheme.outline,
                      width: isCurrent ? 1.4 : 1.0,
                    ),
                  ),
                  child: Column(
                    children: [
                      Text(
                        'B$phaseNum',
                        style: TextStyle(
                          color: isCurrent
                              ? AppColors.gold
                              : (isPast
                                  ? scheme.onSurface
                                  : scheme.onSurfaceVariant),
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${(phaseNum - 1) * 14 + 1}-${phaseNum * 14}d',
                        style: TextStyle(
                          color: isCurrent
                              ? AppColors.gold
                              : scheme.onSurfaceVariant,
                          fontSize: 8,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ),
          const SizedBox(height: 10),
          Text(
            'Continuous rotation: Day 98 advances back to Day 1 without syllabus loss.',
            style: AppTypography.subtitle.copyWith(
              color: scheme.onSurfaceVariant,
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION 6: ANCILLARY CALIBRATIONS & COMPETITION HOLDS
  // ---------------------------------------------------------------------------
  Widget _buildAncillaryHoldsCard() {
    final scheme = Theme.of(context).colorScheme;
    return Column(
      children: [
        // Test Arena Card
        DarkCard(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: scheme.surfaceContainerHighest.withValues(alpha: 0.55),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Icon(Icons.military_tech_outlined,
                    color: scheme.onSurfaceVariant, size: 18),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Test Arena — Not Ready',
                      style: TextStyle(
                        color: scheme.onSurface,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 1),
                    Text(
                      'Standardized competitive events are hosted in Test Arena.',
                      style: AppTypography.subtitle.copyWith(
                        color: scheme.onSurfaceVariant,
                        fontSize: 10,
                      ),
                    ),
                  ],
                ),
              ),
              _buildTagChip('TEST ARENA', AppColors.gold),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTagChip(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 9,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.7,
        ),
      ),
    );
  }
}
