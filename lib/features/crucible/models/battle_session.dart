class BattleSession {
  final String id;
  final String opponent;
  final int score;
  final int opponentScore;
  final bool won;

  const BattleSession({
    required this.id,
    required this.opponent,
    required this.score,
    required this.opponentScore,
    required this.won,
  });
}
