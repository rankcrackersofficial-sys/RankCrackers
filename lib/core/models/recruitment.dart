import 'package:equatable/equatable.dart';

Map<String, dynamic> _asStringDynamicMap(dynamic value) {
  if (value is Map) return Map<String, dynamic>.from(value);
  return const {};
}

/// RECRUITMENT LAW: The Mission Identity.
/// Repesents an official recruitment (e.g., REET 2024, RAS 2025).
class Recruitment extends Equatable {
  final String id;
  final String recruitmentGroupId;
  final String boardId;
  final String examId;
  final String examBlueprintId;
  final String title;
  final String titleHindi;
  final int year;
  final String state;
  final String examCategory;
  final String status;
  final double examDifficulty;
  final String variantCode;
  final Map<String, dynamic> missionVariables;
  final String version;
  final String sourceMissionId;
  final String sourceMissionVersion;
  final String sourcePath;
  final String sourceType;
  final String studentPublicationState;
  final DateTime? examDate;
  final String jurisdictionLevel;
  final String? stateCode;
  final String? stateName;
  final String authorityGroupKey;
  final String authorityDisplayName;
  final bool quickEntryEnabled;
  final bool smartEntryEnabled;
  final bool missionSelectionReady;
  final bool catalogDiscoverable;
  final bool archived;
  final bool founderHold;
  final bool manualGovernanceLock;
  final bool variantRequired;

  const Recruitment({
    required this.id,
    required this.recruitmentGroupId,
    required this.boardId,
    required this.examId,
    required this.examBlueprintId,
    required this.title,
    required this.titleHindi,
    required this.year,
    required this.state,
    required this.examCategory,
    this.status = 'draft',
    this.examDifficulty = 0.6,
    this.variantCode = '',
    this.missionVariables = const {},
    this.version = '1.0.0',
    this.sourceMissionId = '',
    this.sourceMissionVersion = '',
    this.sourcePath = '',
    this.sourceType = '',
    this.studentPublicationState = '',
    this.examDate,
    this.jurisdictionLevel = 'CENTRAL',
    this.stateCode,
    this.stateName,
    this.authorityGroupKey = '',
    this.authorityDisplayName = '',
    this.quickEntryEnabled = false,
    this.smartEntryEnabled = false,
    this.missionSelectionReady = false,
    this.catalogDiscoverable = true,
    this.archived = false,
    this.founderHold = false,
    this.manualGovernanceLock = false,
    this.variantRequired = false,
  });

  /// Fail-safe student-visible status mapping.
  /// Section 10: Unknown status MUST NOT default to Available — fails safely to Preparing!
  static String studentStatusLabel(String raw) {
    switch (raw.toUpperCase()) {
      case 'PREPARING':
        return 'Preparing';
      case 'COMING_SOON':
        return 'Coming Soon';
      case 'LIVE':
      case 'AVAILABLE':
      case 'PUBLISHED':
      case 'ACTIVE':
      case 'CATALOG_VISIBLE':
        return 'Available';
      case 'MISSION_AVAILABLE_WITH_PARTIAL_COVERAGE':
        return 'Available with Partial Coverage';
      case 'MISSION_COMPLETE':
        return 'Complete';
      case 'HOLD':
        return 'On Hold';
      case 'PAUSED':
        return 'Paused';
      case 'DRAFT':
        return 'Draft';
      case 'BLOCKED':
        return 'Blocked';
      case 'ARCHIVED':
        return 'Archived';
      default:
        return 'Preparing'; // FAIL-SAFE DEFAULT: Never Available
    }
  }

  /// MISSION SHELL ACCESS (Quick Start to Dashboard)
  /// Student may select a canonical mission and enter Dashboard/Home shell.
  /// Does NOT require academic content readiness or diagnostic readiness.
  bool get canEnterMissionShell {
    final upper = status.toUpperCase();
    final pubUpper = studentPublicationState.toUpperCase();
    final isBlocked = archived ||
        founderHold ||
        manualGovernanceLock ||
        upper == 'ARCHIVED' ||
        upper == 'HOLD' ||
        upper == 'BLOCKED' ||
        upper == 'DRAFT' ||
        upper == 'INTERNAL_DRAFT' ||
        upper == 'PAUSED' ||
        pubUpper == 'INTERNAL_DRAFT' ||
        pubUpper == 'DRAFT' ||
        pubUpper == 'INTERNAL' ||
        pubUpper == 'UNPUBLISHED' ||
        pubUpper == 'ARCHIVED';
    if (isBlocked) return false;
    if (!catalogDiscoverable) return false;
    if (variantRequired && !missionSelectionReady) return false;
    return true;
  }

  /// QUICK START = Select Mission + Enter Dashboard
  bool get canQuickStart => canEnterMissionShell;

  /// SMART START = Diagnostic / Smart Entry (Fail-Closed)
  /// Only enabled when diagnostic / smart entry readiness is explicitly verified.
  bool get canSmartStart =>
      canEnterMissionShell &&
      smartEntryEnabled &&
      (status.toUpperCase() == 'AVAILABLE' ||
          status.toUpperCase() == 'LIVE' ||
          status.toUpperCase() == 'PUBLISHED' ||
          status.toUpperCase() == 'ACTIVE' ||
          status.toUpperCase() == 'CATALOG_VISIBLE' ||
          status.toUpperCase() == 'MISSION_COMPLETE' ||
          status.toUpperCase() == 'MISSION_AVAILABLE_WITH_PARTIAL_COVERAGE');

  /// Full academic startability (Legacy / Strict Academic)
  bool get isStartable =>
      (quickEntryEnabled || smartEntryEnabled) &&
      !founderHold &&
      !manualGovernanceLock &&
      !archived &&
      (!variantRequired || missionSelectionReady) &&
      (status.toUpperCase() == 'AVAILABLE' ||
          status.toUpperCase() == 'LIVE' ||
          status.toUpperCase() == 'PUBLISHED' ||
          status.toUpperCase() == 'ACTIVE' ||
          status.toUpperCase() == 'CATALOG_VISIBLE' ||
          status.toUpperCase() == 'MISSION_COMPLETE' ||
          status.toUpperCase() == 'MISSION_AVAILABLE_WITH_PARTIAL_COVERAGE');

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'recruitmentGroupId': recruitmentGroupId,
      'boardId': boardId,
      'examId': examId,
      'examBlueprintId': examBlueprintId,
      'title': title,
      'titleHindi': titleHindi,
      'year': year,
      'state': state,
      'examCategory': examCategory,
      'status': status,
      'examDifficulty': examDifficulty,
      'variantCode': variantCode,
      'missionVariables': missionVariables,
      'version': version,
      'sourceMissionId': sourceMissionId,
      'sourceMissionVersion': sourceMissionVersion,
      'sourcePath': sourcePath,
      'sourceType': sourceType,
      'studentPublicationState': studentPublicationState,
      'examDate': examDate?.toIso8601String(),
      'jurisdictionLevel': jurisdictionLevel,
      'stateCode': stateCode,
      'stateName': stateName,
      'authorityGroupKey': authorityGroupKey,
      'authorityDisplayName': authorityDisplayName,
      'quickEntryEnabled': quickEntryEnabled,
      'smartEntryEnabled': smartEntryEnabled,
      'missionSelectionReady': missionSelectionReady,
      'catalogDiscoverable': catalogDiscoverable,
      'archived': archived,
      'founderHold': founderHold,
      'manualGovernanceLock': manualGovernanceLock,
      'variantRequired': variantRequired,
    };
  }

  factory Recruitment.fromMap(Map<String, dynamic> map) {
    final rawJurisdiction = (map['jurisdictionLevel'] ?? map['jurisdictionType'])?.toString().toUpperCase();
    final rawState = (map['state'] ?? '').toString();
    final rawRegion = (map['regionCode'] ?? map['region'] ?? map['stateCode'])?.toString().toUpperCase();
    final inferredJurisdiction = rawJurisdiction != null && rawJurisdiction.isNotEmpty
        ? rawJurisdiction
        : (rawRegion == 'IN' || rawState.toLowerCase() == 'central' ? 'CENTRAL' : 'STATE');

    final rawStatus = (map['status'] ?? 'draft').toString();
    final upperStatus = rawStatus.toUpperCase();
    final pubState = (map['studentPublicationState'] ?? '').toString();
    final pubUpper = pubState.toUpperCase();

    final isArchived = map['archived'] == true || upperStatus == 'ARCHIVED' || pubUpper == 'ARCHIVED';
    final isFounderHold = map['founderHold'] == true || upperStatus == 'HOLD';
    final isGovernanceLock = map['manualGovernanceLock'] == true;

    final isNonStartableStatus = upperStatus == 'PREPARING' ||
        upperStatus == 'COMING_SOON' ||
        upperStatus == 'HOLD' ||
        upperStatus == 'DRAFT' ||
        upperStatus == 'INTERNAL_DRAFT' ||
        upperStatus == 'BLOCKED' ||
        upperStatus == 'PAUSED' ||
        pubUpper == 'INTERNAL_DRAFT' ||
        pubUpper == 'DRAFT' ||
        pubUpper == 'INTERNAL' ||
        isArchived ||
        isFounderHold ||
        isGovernanceLock;

    final visibilityMap = map['visibility'] is Map ? map['visibility'] as Map : null;
    final rawQuickEntry = map['quickEntryEnabled'] ?? visibilityMap?['quickEntryEnabled'];
    final rawSmartEntry = map['smartEntryEnabled'] ?? visibilityMap?['smartEntryEnabled'];
    final rawSelectionReady = map['missionSelectionReady'] ?? visibilityMap?['missionSelectionReady'];
    final rawDiscoverable = map['catalogDiscoverable'] ?? visibilityMap?['catalogDiscoverable'];

    final bool quickEnabled = !isNonStartableStatus && (rawQuickEntry == true);
    final bool smartEnabled = !isNonStartableStatus && (rawSmartEntry == true);
    final bool selectionReady = !isNonStartableStatus && (rawSelectionReady == true);

    return Recruitment(
      id: map['id'] ?? '',
      recruitmentGroupId: map['recruitmentGroupId'] ?? '',
      boardId: map['boardId'] ?? '',
      examId: map['examId'] ?? '',
      examBlueprintId: map['examBlueprintId'] ?? '',
      title: map['title'] ?? '',
      titleHindi: map['titleHindi'] ?? '',
      year: map['year'] ?? 0,
      state: map['state'] ?? '',
      examCategory: map['examCategory'] ?? '',
      status: rawStatus,
      examDifficulty: (map['examDifficulty'] ?? 0.6).toDouble(),
      variantCode: map['variantCode'] ?? '',
      missionVariables: _asStringDynamicMap(map['missionVariables']),
      version: map['version'] ?? '1.0.0',
      sourceMissionId: map['sourceMissionId'] ?? '',
      sourceMissionVersion: map['sourceMissionVersion'] ?? '',
      sourcePath: map['sourcePath'] ?? '',
      sourceType: map['sourceType'] ?? '',
      studentPublicationState: pubState,
      examDate:
          map['examDate'] != null ? DateTime.parse(map['examDate']) : null,
      jurisdictionLevel: inferredJurisdiction,
      stateCode: map['stateCode']?.toString() ?? (rawRegion != 'IN' ? rawRegion : null),
      stateName: map['stateName']?.toString(),
      authorityGroupKey: (map['authorityGroupKey'] ?? map['authorityId'] ?? map['canonicalAuthorityKey'] ?? '').toString().toLowerCase(),
      authorityDisplayName: (map['authorityDisplayName'] ?? map['authorityName'] ?? '').toString(),
      quickEntryEnabled: quickEnabled,
      smartEntryEnabled: smartEnabled,
      missionSelectionReady: selectionReady,
      catalogDiscoverable: rawDiscoverable == true || (rawDiscoverable == null && !isArchived),
      archived: isArchived,
      founderHold: isFounderHold,
      manualGovernanceLock: isGovernanceLock,
      variantRequired: map['variantRequired'] == true,
    );
  }

  Recruitment copyWith({
    String? id,
    String? recruitmentGroupId,
    String? boardId,
    String? examId,
    String? examBlueprintId,
    String? title,
    String? titleHindi,
    int? year,
    String? state,
    String? examCategory,
    String? status,
    double? examDifficulty,
    String? variantCode,
    Map<String, dynamic>? missionVariables,
    String? version,
    String? sourceMissionId,
    String? sourceMissionVersion,
    String? sourcePath,
    String? sourceType,
    String? studentPublicationState,
    DateTime? examDate,
    String? jurisdictionLevel,
    String? stateCode,
    String? stateName,
    String? authorityGroupKey,
    String? authorityDisplayName,
    bool? quickEntryEnabled,
    bool? smartEntryEnabled,
    bool? missionSelectionReady,
    bool? catalogDiscoverable,
    bool? archived,
    bool? founderHold,
    bool? manualGovernanceLock,
    bool? variantRequired,
  }) {
    return Recruitment(
      id: id ?? this.id,
      recruitmentGroupId: recruitmentGroupId ?? this.recruitmentGroupId,
      boardId: boardId ?? this.boardId,
      examId: examId ?? this.examId,
      examBlueprintId: examBlueprintId ?? this.examBlueprintId,
      title: title ?? this.title,
      titleHindi: titleHindi ?? this.titleHindi,
      year: year ?? this.year,
      state: state ?? this.state,
      examCategory: examCategory ?? this.examCategory,
      status: status ?? this.status,
      examDifficulty: examDifficulty ?? this.examDifficulty,
      variantCode: variantCode ?? this.variantCode,
      missionVariables: missionVariables ?? this.missionVariables,
      version: version ?? this.version,
      sourceMissionId: sourceMissionId ?? this.sourceMissionId,
      sourceMissionVersion: sourceMissionVersion ?? this.sourceMissionVersion,
      sourcePath: sourcePath ?? this.sourcePath,
      sourceType: sourceType ?? this.sourceType,
      studentPublicationState:
          studentPublicationState ?? this.studentPublicationState,
      examDate: examDate ?? this.examDate,
      jurisdictionLevel: jurisdictionLevel ?? this.jurisdictionLevel,
      stateCode: stateCode ?? this.stateCode,
      stateName: stateName ?? this.stateName,
      authorityGroupKey: authorityGroupKey ?? this.authorityGroupKey,
      authorityDisplayName: authorityDisplayName ?? this.authorityDisplayName,
      quickEntryEnabled: quickEntryEnabled ?? this.quickEntryEnabled,
      smartEntryEnabled: smartEntryEnabled ?? this.smartEntryEnabled,
      missionSelectionReady: missionSelectionReady ?? this.missionSelectionReady,
      catalogDiscoverable: catalogDiscoverable ?? this.catalogDiscoverable,
      archived: archived ?? this.archived,
      founderHold: founderHold ?? this.founderHold,
      manualGovernanceLock: manualGovernanceLock ?? this.manualGovernanceLock,
      variantRequired: variantRequired ?? this.variantRequired,
    );
  }

  @override
  List<Object?> get props => [
        id,
        examId,
        title,
        year,
        status,
        missionVariables,
        sourceMissionId,
        sourceMissionVersion,
        sourcePath,
        sourceType,
        studentPublicationState,
        jurisdictionLevel,
        stateCode,
        authorityGroupKey,
        quickEntryEnabled,
        smartEntryEnabled,
        missionSelectionReady,
        catalogDiscoverable,
        archived,
        founderHold,
        manualGovernanceLock,
        variantRequired,
      ];
}
