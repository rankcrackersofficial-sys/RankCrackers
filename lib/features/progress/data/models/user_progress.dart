import 'package:equatable/equatable.dart';

import '../../../../core/models/atomic_mastery_state.dart';
import '../../../../core/models/atomic_coverage_state.dart';
import '../../../../core/models/atomic_risk_state.dart';

/// 🔱 USER PROGRESS LAW: Sovereign Personal Truth.
/// Tracks mastery, coverage, and risk at both node and atomic levels.
class UserProgress extends Equatable {
  final String nodeId;
  final double mastery; 
  final Map<String, double> factMastery; 
  final Map<String, AtomicMasteryState> atomicMastery; 
  final Map<String, AtomicCoverageState> atomicCoverage; // 🔱 Phase 2D: Document 34
  final Map<String, AtomicRiskState> atomicRisk; // 🔱 Phase 2D: Document 35
  final int revisionLevel;
  final int battlesWon;
  final int battlesLost;
  final DateTime lastReviewed;

  // 🔱 EVIDENCE CHAIN (Article 7)
  final double assessmentEvidence;
  final double readingEvidence;
  final double revisionEvidence;
  final double evidenceScore;

  const UserProgress({
    required this.nodeId,
    required this.mastery,
    this.factMastery = const {},
    this.atomicMastery = const {},
    this.atomicCoverage = const {},
    this.atomicRisk = const {},
    required this.revisionLevel,
    required this.battlesWon,
    required this.battlesLost,
    required this.lastReviewed,
    this.assessmentEvidence = 0.0,
    this.readingEvidence = 0.0,
    this.revisionEvidence = 0.0,
    this.evidenceScore = 0.0,
  });

  /// 🔱 EMPTY PROGRESS FACTORY
  factory UserProgress.empty(String nodeId) {
    return UserProgress(
      nodeId: nodeId,
      mastery: 0.0,
      revisionLevel: 1,
      battlesWon: 0,
      battlesLost: 0,
      lastReviewed: DateTime.fromMillisecondsSinceEpoch(0),
      assessmentEvidence: 0.0,
      readingEvidence: 0.0,
      revisionEvidence: 0.0,
      evidenceScore: 0.0,
    );
  }

  UserProgress copyWith({
    String? nodeId,
    double? mastery,
    Map<String, double>? factMastery,
    Map<String, AtomicMasteryState>? atomicMastery,
    Map<String, AtomicCoverageState>? atomicCoverage,
    Map<String, AtomicRiskState>? atomicRisk,
    int? revisionLevel,
    int? battlesWon,
    int? battlesLost,
    DateTime? lastReviewed,
    double? assessmentEvidence,
    double? readingEvidence,
    double? revisionEvidence,
    double? evidenceScore,
  }) {
    return UserProgress(
      nodeId: nodeId ?? this.nodeId,
      mastery: mastery ?? this.mastery,
      factMastery: factMastery ?? this.factMastery,
      atomicMastery: atomicMastery ?? this.atomicMastery,
      atomicCoverage: atomicCoverage ?? this.atomicCoverage,
      atomicRisk: atomicRisk ?? this.atomicRisk,
      revisionLevel: revisionLevel ?? this.revisionLevel,
      battlesWon: battlesWon ?? this.battlesWon,
      battlesLost: battlesLost ?? this.battlesLost,
      lastReviewed: lastReviewed ?? this.lastReviewed,
      assessmentEvidence: assessmentEvidence ?? this.assessmentEvidence,
      readingEvidence: readingEvidence ?? this.readingEvidence,
      revisionEvidence: revisionEvidence ?? this.revisionEvidence,
      evidenceScore: evidenceScore ?? this.evidenceScore,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'nodeId': nodeId,
      'mastery': mastery,
      'factMastery': factMastery,
      'atomicMastery': atomicMastery.map((k, v) => MapEntry(k, v.toMap())),
      'atomicCoverage': atomicCoverage.map((k, v) => MapEntry(k, v.toMap())),
      'atomicRisk': atomicRisk.map((k, v) => MapEntry(k, v.toMap())),
      'revisionLevel': revisionLevel,
      'battlesWon': battlesWon,
      'battlesLost': battlesLost,
      'lastReviewed': lastReviewed.millisecondsSinceEpoch,
      'assessmentEvidence': assessmentEvidence,
      'readingEvidence': readingEvidence,
      'revisionEvidence': revisionEvidence,
      'evidenceScore': evidenceScore,
    };
  }

  factory UserProgress.fromMap(Map<String, dynamic> map) {
    final rawFactMastery = Map<String, dynamic>.from(map['factMastery'] ?? {});
    final factMastery = rawFactMastery.map(
      (k, v) => MapEntry(k, (v as num).toDouble()),
    );

    final rawAtomicMastery = Map<String, dynamic>.from(map['atomicMastery'] ?? {});
    final atomicMastery = rawAtomicMastery.map(
      (k, v) => MapEntry(k, AtomicMasteryState.fromMap(Map<String, dynamic>.from(v))),
    );

    final rawAtomicCoverage = Map<String, dynamic>.from(map['atomicCoverage'] ?? {});
    final atomicCoverage = rawAtomicCoverage.map(
      (k, v) => MapEntry(k, AtomicCoverageState.fromMap(Map<String, dynamic>.from(v))),
    );

    final rawAtomicRisk = Map<String, dynamic>.from(map['atomicRisk'] ?? {});
    final atomicRisk = rawAtomicRisk.map(
      (k, v) => MapEntry(k, AtomicRiskState.fromMap(Map<String, dynamic>.from(v))),
    );

    return UserProgress(
      nodeId: map['nodeId'] ?? '',
      mastery: (map['mastery'] ?? 0.0).toDouble(),
      factMastery: factMastery,
      atomicMastery: atomicMastery,
      atomicCoverage: atomicCoverage,
      atomicRisk: atomicRisk,
      revisionLevel: map['revisionLevel'] ?? 1,
      battlesWon: map['battlesWon'] ?? 0,
      battlesLost: map['battlesLost'] ?? 0,
      lastReviewed: map['lastReviewed'] != null
          ? DateTime.fromMillisecondsSinceEpoch(map['lastReviewed'])
          : DateTime.now(),
      assessmentEvidence: (map['assessmentEvidence'] ?? 0.0).toDouble(),
      readingEvidence: (map['readingEvidence'] ?? 0.0).toDouble(),
      revisionEvidence: (map['revisionEvidence'] ?? 0.0).toDouble(),
      evidenceScore: (map['evidenceScore'] ?? 0.0).toDouble(),
    );
  }

  @override
  List<Object?> get props => [
        nodeId,
        mastery,
        factMastery,
        atomicMastery,
        atomicCoverage,
        atomicRisk,
        revisionLevel,
        battlesWon,
        battlesLost,
        lastReviewed,
      ];
}
