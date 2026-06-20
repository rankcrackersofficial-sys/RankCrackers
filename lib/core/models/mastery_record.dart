class MasteryRecord {
  final String nodeId;

  final double previousMastery;

  final double currentMastery;

  final DateTime updatedAt;

  final String source;

  const MasteryRecord({
    required this.nodeId,
    required this.previousMastery,
    required this.currentMastery,
    required this.updatedAt,
    required this.source,
  });

  double get delta =>
      currentMastery - previousMastery;

  Map<String, dynamic> toMap() {
    return {
      'nodeId': nodeId,
      'previousMastery': previousMastery,
      'currentMastery': currentMastery,
      'updatedAt':
      updatedAt.millisecondsSinceEpoch,
      'source': source,
    };
  }

  factory MasteryRecord.fromMap(
      Map<String, dynamic> map,
      ) {
    return MasteryRecord(
      nodeId: map['nodeId'],
      previousMastery:
      (map['previousMastery'] ?? 0)
          .toDouble(),
      currentMastery:
      (map['currentMastery'] ?? 0)
          .toDouble(),
      updatedAt:
      DateTime.fromMillisecondsSinceEpoch(
        map['updatedAt'] ?? 0,
      ),
      source:
      map['source'] ?? 'unknown',
    );
  }
}