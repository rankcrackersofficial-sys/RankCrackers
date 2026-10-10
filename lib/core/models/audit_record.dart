import 'package:equatable/equatable.dart';

/// AUDIT RECORD (Document 50 Component)
/// Tracks the origin, discovery, and validation history of any intelligence item.
class AuditRecord extends Equatable {
  final String sourceUrl;
  final String sourceHash; 
  final String documentHash; 
  final DateTime createdAt; 
  final DateTime discoveredAt; 
  final DateTime lastSeenAt; 
  final DateTime? processedAt; // Added: For chronologically ordered review
  final int discoveryCount; 
  final int contentVersion; 
  final String impactLevel; // Added: LOW, MEDIUM, HIGH, CRITICAL
  final double confidenceScore; // Added: 0.0 - 1.0 (Review prioritization)
  final String workerVersion;
  final String provider; // Added: Gemini, Groq, OpenRouter, etc.
  final String validationStatus; // pending, under_review, failed, success, corrigendum_detected
  final String? publishedBy; 
  final String? promotionBatchId; // Added: For rollback grouping (prom_date_num)
  final DateTime? validatedAt; 
  final DateTime? publishedAt;

  const AuditRecord({
    required this.sourceUrl,
    required this.sourceHash,
    required this.documentHash,
    required this.createdAt,
    required this.discoveredAt,
    required this.lastSeenAt,
    this.processedAt,
    this.discoveryCount = 1,
    this.contentVersion = 1,
    this.impactLevel = 'LOW',
    this.confidenceScore = 1.0,
    required this.workerVersion,
    required this.provider,
    required this.validationStatus,
    this.publishedBy,
    this.promotionBatchId,
    this.validatedAt,
    this.publishedAt,
  });

  AuditRecord copyWith({
    String? sourceUrl,
    String? sourceHash,
    String? documentHash,
    DateTime? createdAt,
    DateTime? discoveredAt,
    DateTime? lastSeenAt,
    DateTime? processedAt,
    int? discoveryCount,
    int? contentVersion,
    String? impactLevel,
    double? confidenceScore,
    String? workerVersion,
    String? provider,
    String? validationStatus,
    String? publishedBy,
    String? promotionBatchId,
    DateTime? validatedAt,
    DateTime? publishedAt,
  }) {
    return AuditRecord(
      sourceUrl: sourceUrl ?? this.sourceUrl,
      sourceHash: sourceHash ?? this.sourceHash,
      documentHash: documentHash ?? this.documentHash,
      createdAt: createdAt ?? this.createdAt,
      discoveredAt: discoveredAt ?? this.discoveredAt,
      lastSeenAt: lastSeenAt ?? this.lastSeenAt,
      processedAt: processedAt ?? this.processedAt,
      discoveryCount: discoveryCount ?? this.discoveryCount,
      contentVersion: contentVersion ?? this.contentVersion,
      impactLevel: impactLevel ?? this.impactLevel,
      confidenceScore: confidenceScore ?? this.confidenceScore,
      workerVersion: workerVersion ?? this.workerVersion,
      provider: provider ?? this.provider,
      validationStatus: validationStatus ?? this.validationStatus,
      publishedBy: publishedBy ?? this.publishedBy,
      promotionBatchId: promotionBatchId ?? this.promotionBatchId,
      validatedAt: validatedAt ?? this.validatedAt,
      publishedAt: publishedAt ?? this.publishedAt,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'sourceUrl': sourceUrl,
      'sourceHash': sourceHash,
      'documentHash': documentHash,
      'createdAt': createdAt.millisecondsSinceEpoch,
      'discoveredAt': discoveredAt.millisecondsSinceEpoch,
      'lastSeenAt': lastSeenAt.millisecondsSinceEpoch,
      'processedAt': processedAt?.millisecondsSinceEpoch,
      'discoveryCount': discoveryCount,
      'contentVersion': contentVersion,
      'impactLevel': impactLevel,
      'confidenceScore': confidenceScore,
      'workerVersion': workerVersion,
      'provider': provider,
      'validationStatus': validationStatus,
      'publishedBy': publishedBy,
      'promotionBatchId': promotionBatchId,
      'validatedAt': validatedAt?.millisecondsSinceEpoch,
      'publishedAt': publishedAt?.millisecondsSinceEpoch,
    };
  }

  factory AuditRecord.fromMap(Map<String, dynamic> map) {
    // Firestore Timestamp Handling
    DateTime parseDate(dynamic value) {
      if (value == null) return DateTime.fromMillisecondsSinceEpoch(0);
      if (value is int) return DateTime.fromMillisecondsSinceEpoch(value);
      if (value is String) return DateTime.parse(value);
      // Handles Cloud Firestore Timestamp physically
      try {
        return value.toDate();
      } catch (_) {
        return DateTime.fromMillisecondsSinceEpoch(0);
      }
    }

    return AuditRecord(
      sourceUrl: map['sourceUrl'] ?? '',
      sourceHash: map['sourceHash'] ?? '',
      documentHash: map['documentHash'] ?? '',
      createdAt: parseDate(map['createdAt']),
      discoveredAt: parseDate(map['discoveredAt']),
      lastSeenAt: parseDate(map['lastSeenAt'] ?? map['createdAt']),
      processedAt: map['processedAt'] != null ? parseDate(map['processedAt']) : null,
      discoveryCount: map['discoveryCount'] ?? 1,
      contentVersion: map['contentVersion'] ?? 1,
      impactLevel: map['impactLevel'] ?? 'LOW',
      confidenceScore: (map['confidenceScore'] ?? 1.0).toDouble(),
      workerVersion: map['workerVersion'] ?? '1.0.0',
      provider: map['provider'] ?? 'unknown',
      validationStatus: map['validationStatus'] ?? 'pending',
      publishedBy: map['publishedBy'],
      promotionBatchId: map['promotionBatchId'],
      validatedAt: map['validatedAt'] != null ? parseDate(map['validatedAt']) : null,
      publishedAt: map['publishedAt'] != null ? parseDate(map['publishedAt']) : null,
    );
  }

  @override
  List<Object?> get props => [
    sourceUrl,
    sourceHash,
    documentHash,
    createdAt,
    discoveredAt,
    lastSeenAt,
    processedAt,
    discoveryCount,
    contentVersion,
    impactLevel,
    confidenceScore,
    workerVersion,
    validationStatus,
    publishedBy,
    validatedAt,
    publishedAt,
  ];
}
