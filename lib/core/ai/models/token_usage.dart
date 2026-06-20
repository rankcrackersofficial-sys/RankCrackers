class TokenUsage {
  final String provider;
  final int dailyLimit;
  int used;

  TokenUsage({
    required this.provider,
    required this.dailyLimit,
    this.used = 0,
  });

  bool get canUse => used < dailyLimit;
}
