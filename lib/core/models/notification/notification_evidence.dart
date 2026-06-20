/// 🔱 NOTIFICATION EVIDENCE (v1.0)
class EvidenceMap {
  final Map<String, Evidence> factEvidence;
  final ConfidenceReport confidence;

  EvidenceMap({
    required this.factEvidence,
    required this.confidence,
  });

  Map<String, dynamic> toMap() => {
    'fact_evidence': factEvidence.map((k, v) => MapEntry(k, v.toMap())),
    'confidence': confidence.toMap(),
  };

  factory EvidenceMap.fromMap(Map<String, dynamic> map) => EvidenceMap(
    factEvidence: (map['fact_evidence'] as Map? ?? {}).map((k, v) => MapEntry(k.toString(), Evidence.fromMap(v))),
    confidence: ConfidenceReport.fromMap(map['confidence'] ?? {}),
  );
}

class Evidence {
  final int page;
  final int lineStart;
  final int lineEnd;
  final String extractedText;
  final double confidence;

  Evidence({
    this.page = 1,
    this.lineStart = 0,
    this.lineEnd = 0,
    this.extractedText = '',
    this.confidence = 0.0,
  });

  Map<String, dynamic> toMap() => {
    'page': page,
    'line_start': lineStart,
    'line_end': lineEnd,
    'extracted_text': extractedText,
    'confidence': confidence,
  };

  factory Evidence.fromMap(Map<String, dynamic> map) => Evidence(
    page: map['page'] ?? 1,
    lineStart: map['line_start'] ?? 0,
    lineEnd: map['line_end'] ?? 0,
    extractedText: map['extracted_text'] ?? '',
    confidence: (map['confidence'] ?? 0.0).toDouble(),
  );
}

class ConfidenceReport {
  final double average;
  final Map<String, double> fieldConfidence;

  ConfidenceReport({this.average = 0.0, this.fieldConfidence = const {}});

  Map<String, dynamic> toMap() => {'average': average, 'field_confidence': fieldConfidence};

  factory ConfidenceReport.fromMap(Map<String, dynamic> map) => ConfidenceReport(
    average: (map['average'] ?? 0.0).toDouble(),
    fieldConfidence: Map<String, double>.from(map['field_confidence'] ?? {}),
  );
}
