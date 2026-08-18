/// RankCrackers governed Student Revision Queue Contract.
/// CODE NO: PERS-18-R2
library;

enum StudentRevisionQueueState {
  overdue,
  dueToday,
  evidenceNeeded,
  maintenance,
  upcoming,
}

final class StudentRevisionQueueItem {
  const StudentRevisionQueueItem({
    required this.revisionItemId,
    required this.studentId,
    required this.amtnId,
    required this.state,
    required this.sequenceRank,
    required this.reviewAtUtc,
    required this.required,
  });

  final String revisionItemId;
  final String studentId;
  final String amtnId;
  final StudentRevisionQueueState state;
  final int sequenceRank;
  final DateTime reviewAtUtc;
  final bool required;

  void validate() {
    if (revisionItemId.trim().isEmpty ||
        studentId.trim().isEmpty ||
        amtnId.trim().isEmpty ||
        sequenceRank <= 0 ||
        !reviewAtUtc.isUtc) {
      throw const FormatException('Invalid revision queue item.');
    }
  }
}

final class StudentRevisionQueue {
  const StudentRevisionQueue({
    required this.studentId,
    required this.builtAtUtc,
    required this.items,
  });

  final String studentId;
  final DateTime builtAtUtc;
  final List<StudentRevisionQueueItem> items;

  void validate() {
    if (studentId.trim().isEmpty || !builtAtUtc.isUtc) {
      throw const FormatException('Invalid revision queue.');
    }
    for (var i = 0; i < items.length; i++) {
      items[i].validate();
      if (items[i].studentId != studentId || items[i].sequenceRank != i + 1) {
        throw const FormatException('Revision queue order/identity mismatch.');
      }
    }
  }
}
