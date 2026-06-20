import 'package:cloud_firestore/cloud_firestore.dart';

class VerificationReport {
  final String id;
  final String fileName;
  final String assetType; // notification, syllabus, pyq, study_material, notice
  final String status; // received, parsing, analyzing, draft_created, awaiting_review, verified, published, rejected
  final double confidence;
  final Map<String, dynamic> findings;
  final List<String> workersUsed;
  final DateTime createdAt;

  VerificationReport({
    required this.id,
    required this.fileName,
    required this.assetType,
    required this.status,
    required this.confidence,
    required this.findings,
    required this.workersUsed,
    required this.createdAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'fileName': fileName,
      'assetType': assetType,
      'status': status,
      'confidence': confidence,
      'findings': findings,
      'workersUsed': workersUsed,
      'createdAt': createdAt,
    };
  }

  factory VerificationReport.fromMap(Map<String, dynamic> map) {
    return VerificationReport(
      id: map['id'] ?? '',
      fileName: map['fileName'] ?? '',
      assetType: map['assetType'] ?? '',
      status: map['status'] ?? 'received',
      confidence: (map['confidence'] ?? 0.0).toDouble(),
      findings: map['findings'] ?? {},
      workersUsed: List<String>.from(map['workersUsed'] ?? []),
      createdAt: (map['createdAt'] as Timestamp).toDate(),
    );
  }
}
