import 'package:equatable/equatable.dart';

/// CANONICAL ACADEMIC REFERENCE CONTRACT (Document 55 / Gate-13 Fail-Closed Reconciled)
/// Standardizes the universal academic identity chain:
/// canonicalMissionId -> canonicalNodeId -> generationUnitId -> atomicFactIds
///
/// FAIL-CLOSED LAW:
/// A CanonicalAcademicRef is routable ONLY when genuine values exist for canonicalMissionId,
/// canonicalNodeId, and generationUnitId. Placeholder aliasing (e.g. domainId -> GU, paperId -> GU)
/// is strictly forbidden.
class CanonicalAcademicRef extends Equatable {
  final String canonicalMissionId;
  final String canonicalNodeId;
  final String generationUnitId;
  final List<String> atomicFactIds;
  final bool isRoutable;

  const CanonicalAcademicRef({
    required this.canonicalMissionId,
    required this.canonicalNodeId,
    required this.generationUnitId,
    this.atomicFactIds = const [],
    this.isRoutable = true,
  });

  /// Fail-closed non-routable placeholder instance
  static const CanonicalAcademicRef nonRoutable = CanonicalAcademicRef(
    canonicalMissionId: '',
    canonicalNodeId: '',
    generationUnitId: '',
    atomicFactIds: [],
    isRoutable: false,
  );

  /// Factory adapter for QuestionModel
  /// Routable only when verified generationUnitId or verified atomicTopicId is present.
  factory CanonicalAcademicRef.fromQuestion({
    required String examId,
    required String nodeId,
    String? factId,
    List<String> atomicTopicIds = const [],
    String? generationUnitId,
  }) {
    final effectiveGuId = generationUnitId ?? (atomicTopicIds.isNotEmpty ? atomicTopicIds.first : '');
    final bool routable = examId.isNotEmpty && nodeId.isNotEmpty && effectiveGuId.isNotEmpty;

    return CanonicalAcademicRef(
      canonicalMissionId: examId,
      canonicalNodeId: nodeId,
      generationUnitId: effectiveGuId,
      atomicFactIds: factId != null && factId.isNotEmpty ? [factId] : const [],
      isRoutable: routable,
    );
  }

  /// Factory adapter for CrucibleNode
  /// Routable when digibookUnitId is explicitly bound.
  factory CanonicalAcademicRef.fromCrucibleNode({
    required String realmId,
    required String atomicTopicId,
    required String digibookUnitId,
  }) {
    final bool routable = realmId.isNotEmpty && atomicTopicId.isNotEmpty && digibookUnitId.isNotEmpty;

    return CanonicalAcademicRef(
      canonicalMissionId: realmId,
      canonicalNodeId: atomicTopicId,
      generationUnitId: digibookUnitId,
      atomicFactIds: const [],
      isRoutable: routable,
    );
  }

  /// Factory adapter for Diagnostic / Smart Entry items
  /// FAIL-CLOSED: Diagnostic items lacking explicit GU binding are NOT routable to DigiBook.
  factory CanonicalAcademicRef.fromDiagnosticItem({
    required String missionId,
    required String domainId,
    required String questionId,
    String? nodeId,
    String? generationUnitId,
  }) {
    final effectiveNodeId = nodeId ?? '';
    final effectiveGuId = generationUnitId ?? '';
    final bool routable = missionId.isNotEmpty && effectiveNodeId.isNotEmpty && effectiveGuId.isNotEmpty;

    return CanonicalAcademicRef(
      canonicalMissionId: missionId,
      canonicalNodeId: effectiveNodeId,
      generationUnitId: effectiveGuId,
      atomicFactIds: const [],
      isRoutable: routable, // Fail-closed: returns false if exact GU is unknown
    );
  }

  /// Factory adapter for TestArenaEvent
  /// FAIL-CLOSED: Test Arena Event level does NOT map to a single GU; it is NOT routable.
  factory CanonicalAcademicRef.fromTestArenaEvent({
    required String examId,
    required String paperId,
  }) {
    return CanonicalAcademicRef(
      canonicalMissionId: examId,
      canonicalNodeId: paperId,
      generationUnitId: '', // Event level has no single GU
      atomicFactIds: const [],
      isRoutable: false, // Fail-closed
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'canonical_mission_id': canonicalMissionId,
      'canonical_node_id': canonicalNodeId,
      'generation_unit_id': generationUnitId,
      'atomic_fact_ids': atomicFactIds,
      'is_routable': isRoutable,
    };
  }

  factory CanonicalAcademicRef.fromMap(Map<String, dynamic> map) {
    return CanonicalAcademicRef(
      canonicalMissionId: map['canonical_mission_id'] ?? '',
      canonicalNodeId: map['canonical_node_id'] ?? '',
      generationUnitId: map['generation_unit_id'] ?? '',
      atomicFactIds: List<String>.from(map['atomic_fact_ids'] ?? []),
      isRoutable: map['is_routable'] ?? false,
    );
  }

  @override
  List<Object?> get props => [canonicalMissionId, canonicalNodeId, generationUnitId, atomicFactIds, isRoutable];
}
