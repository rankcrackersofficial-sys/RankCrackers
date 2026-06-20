class CognitiveProfile {
  final double memoryStrength;
  final double conceptualDepth;
  final double analyticalAbility;
  final double speed;
  final Map<String, double> domainMastery;
  final double retentionRate;

  const CognitiveProfile({
    this.memoryStrength = 0.0,
    this.conceptualDepth = 0.0,
    this.analyticalAbility = 0.0,
    this.speed = 0.0,
    this.domainMastery = const {},
    this.retentionRate = 0.0,
  });

  Map<String, dynamic> toMap() {
    return {
      'memoryStrength': memoryStrength,
      'conceptualDepth': conceptualDepth,
      'analyticalAbility': analyticalAbility,
      'speed': speed,
      'domainMastery': domainMastery,
      'retentionRate': retentionRate,
    };
  }

  factory CognitiveProfile.fromMap(Map<String, dynamic> map) {
    return CognitiveProfile(
      memoryStrength: (map['memoryStrength'] ?? 0.0).toDouble(),
      conceptualDepth: (map['conceptualDepth'] ?? 0.0).toDouble(),
      analyticalAbility: (map['analyticalAbility'] ?? 0.0).toDouble(),
      speed: (map['speed'] ?? 0.0).toDouble(),
      domainMastery: Map<String, double>.from(map['domainMastery'] ?? {}),
      retentionRate: (map['retentionRate'] ?? 0.0).toDouble(),
    );
  }
}
