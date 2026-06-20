import 'package:equatable/equatable.dart';
import 'audit_record.dart';

/// 🔱 SENTINEL DRAFT (Document 50 Component)
/// The "Isolation Zone" for raw intelligence data before validation and publication.
class SentinelDraft extends Equatable {
  final String id;
  final String? sourceId; // 🔱 Added: Physical Traceability
  final String type; // recruitment, blueprint, node, combined
  final Map<String, dynamic> rawData; // Extracted JSON from Workers
  final AuditRecord audit;
  final String status; // draft, under_review, verified, rejected, published

  const SentinelDraft({
    required this.id,
    this.sourceId,
    required this.type,
    required this.rawData,
    required this.audit,
    this.status = 'draft',
  });

  SentinelDraft copyWith({
    String? id,
    String? sourceId,
    String? type,
    Map<String, dynamic>? rawData,
    AuditRecord? audit,
    String? status,
  }) {
    return SentinelDraft(
      id: id ?? this.id,
      sourceId: sourceId ?? this.sourceId,
      type: type ?? this.type,
      rawData: rawData ?? this.rawData,
      audit: audit ?? this.audit,
      status: status ?? this.status,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'sourceId': sourceId,
      'type': type,
      'rawData': rawData,
      'audit': audit.toMap(),
      'status': status,
    };
  }

  factory SentinelDraft.fromMap(Map<String, dynamic> map) {
    // 🔱 Hardened casting for high-volume fact ingestion
    return SentinelDraft(
      id: map['id'] ?? '',
      sourceId: map['sourceId'],
      type: map['type'] ?? 'recruitment',
      rawData: Map<String, dynamic>.from(map['rawData'] as Map? ?? {}),
      audit: AuditRecord.fromMap(Map<String, dynamic>.from(map['audit'] as Map? ?? {})),
      status: map['status'] ?? 'draft',
    );
  }

  @override
  List<Object?> get props => [id, sourceId, type, rawData, audit, status];
}
