class RevisionEntry {
  final String nodeId;
  final double mastery;
  final int revisionLevel;
  final DateTime nextRevision;

  const RevisionEntry({
    required this.nodeId,
    required this.mastery,
    required this.revisionLevel,
    required this.nextRevision,
  });
}
