import 'package:cloud_firestore/cloud_firestore.dart';

/// NOTIFICATION FEEDBACK (v1.0)
class NotificationFeedback {
  final String status;
  final String? verifiedBy;
  final DateTime? verifiedAt;
  final List<CorrectionRecord> correctionDataset;

  NotificationFeedback({
    this.status = "awaiting_review",
    this.verifiedBy,
    this.verifiedAt,
    this.correctionDataset = const [],
  });

  Map<String, dynamic> toMap() => {
    'status': status,
    'verified_by': verifiedBy,
    'verified_at': verifiedAt != null ? Timestamp.fromDate(verifiedAt!) : null,
    'correction_dataset': correctionDataset.map((e) => e.toMap()).toList(),
  };

  factory NotificationFeedback.fromMap(Map<String, dynamic> map) => NotificationFeedback(
    status: map['status'] ?? 'awaiting_review',
    verifiedBy: map['verified_by'],
    verifiedAt: map['verified_at'] != null ? (map['verified_at'] as Timestamp).toDate() : null,
    correctionDataset: (map['correction_dataset'] as List? ?? []).map((e) => CorrectionRecord.fromMap(e)).toList(),
  );
}

class CorrectionRecord {
  final String fieldPath;
  final dynamic originalValue;
  final dynamic correctedValue;
  final String workerVersion;
  final String pdfHash;
  final String correctedBy;
  final DateTime timestamp;

  CorrectionRecord({
    required this.fieldPath,
    required this.originalValue,
    required this.correctedValue,
    required this.workerVersion,
    required this.pdfHash,
    required this.correctedBy,
    required this.timestamp,
  });

  Map<String, dynamic> toMap() => {
    'field_path': fieldPath,
    'original_value': originalValue,
    'corrected_value': correctedValue,
    'worker_version': workerVersion,
    'pdf_hash': pdfHash,
    'corrected_by': correctedBy,
    'timestamp': timestamp.toIso8601String(),
  };

  factory CorrectionRecord.fromMap(Map<String, dynamic> map) => CorrectionRecord(
    fieldPath: map['field_path'] ?? '',
    originalValue: map['original_value'],
    correctedValue: map['corrected_value'],
    workerVersion: map['worker_version'] ?? 'unknown',
    pdfHash: map['pdf_hash'] ?? 'unknown',
    correctedBy: map['corrected_by'] ?? 'Founder',
    timestamp: DateTime.parse(map['timestamp'] ?? DateTime.now().toIso8601String()),
  );
}
