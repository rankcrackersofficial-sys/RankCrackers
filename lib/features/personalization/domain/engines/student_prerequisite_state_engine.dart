/// RankCrackers deterministic Prerequisite State Engine.
        throw const FormatException(
          'StudentPrerequisiteStateEngine state map contains empty AMTN key.',
        );
      }


      if (state.studentId != studentId) {
        throw const FormatException(
          'StudentPrerequisiteStateEngine received state for another student.',
        );
      }


      if (state.amtnId != key) {
        throw const FormatException(
          'StudentPrerequisiteStateEngine state map key does not match '
          'StudentLearningState.amtnId.',
        );
      }
    }
  }


  int _confidenceRank(
    StudentLearningStateConfidence confidence,
  ) {
    switch (confidence) {
      case StudentLearningStateConfidence.insufficient:
        return 0;
      case StudentLearningStateConfidence.low:
        return 1;
      case StudentLearningStateConfidence.medium:
        return 2;
      case StudentLearningStateConfidence.high:
        return 3;
    }
  }
}


extension StudentPrerequisiteReadinessWire
    on StudentPrerequisiteReadiness {
  String get wireName {
    switch (this) {
      case StudentPrerequisiteReadiness.unknown:
        return 'unknown';
      case StudentPrerequisiteReadiness.blocked:
        return 'blocked';
      case StudentPrerequisiteReadiness.fragile:
        return 'fragile';
      case StudentPrerequisiteReadiness.ready:
        return 'ready';
    }
  }
}


extension StudentPrerequisiteDiagnosisWire
    on StudentPrerequisiteDiagnosis {
  String get wireName {
    switch (this) {
      case StudentPrerequisiteDiagnosis.unknown:
        return 'unknown';
      case StudentPrerequisiteDiagnosis.targetConceptRepair:
        return 'target_concept_repair';
      case StudentPrerequisiteDiagnosis.prerequisiteRepair:
        return 'prerequisite_repair';
      case StudentPrerequisiteDiagnosis.mixedRepair:
        return 'mixed_repair';
      case StudentPrerequisiteDiagnosis.prerequisitesReady:
        return 'prerequisites_ready';
    }
  }
}


extension StudentPrerequisiteStateReasonWire
    on StudentPrerequisiteStateReason {
  String get wireName {
    switch (this) {
      case StudentPrerequisiteStateReason.ready:
        return 'ready';
      case StudentPrerequisiteStateReason.masteryTooLow:
        return 'mastery_too_low';
      case StudentPrerequisiteStateReason.retentionTooLow:
        return 'retention_too_low';
      case StudentPrerequisiteStateReason.insufficientEvidence:
        return 'insufficient_evidence';
      case StudentPrerequisiteStateReason.staleEvidence:
        return 'stale_evidence';
      case StudentPrerequisiteStateReason.missingState:
        return 'missing_state';
      case StudentPrerequisiteStateReason.optionalPrerequisiteNotReady:
        return 'optional_prerequisite_not_ready';
      case StudentPrerequisiteStateReason.mandatoryPrerequisiteNotReady:
        return 'mandatory_prerequisite_not_ready';
    }
  }
}
