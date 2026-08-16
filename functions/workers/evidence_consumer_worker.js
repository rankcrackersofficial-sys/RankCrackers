"use strict";

/**
 * 🔱 Crucible C4-FIX4-R1 Evidence Consumer & Rebuild Engine Worker
 *
 * CONFLICT RESOLUTIONS:
 * 1. Battle Score: Battle Constitution v2.0 formula (Risk*0.40 + MissionWeight*0.25 + AssessmentWeakness*0.20 + DependencyImpact*0.15)
 *    has higher authority than Blueprint v2.0 formula (Risk*0.50 + MasteryDeficiency*0.30 + CoverageDeficiency*0.20) and supersedes it.
 * 2. Rebuild Score: Rebuild Engine & Recovery Constitution v2.0 formula (PersistentWeakness*0.35 + KnowledgeDecay*0.25 + DependencyDamage*0.20 + BattleFailureHistory*0.20)
 *    has higher authority than Blueprint v2.0 formula (BattleFailure*0.30 + RiskScore*0.30 + DependencySeverity*0.25 + MasteryCollapse*0.15) and supersedes it.
 */

async function consumeEvidenceOutboxEvents({ db }) {
  const outboxRef = db.collection('evidence_outbox');
  const pendingEventsSnap = await outboxRef.where('eventStatus', '==', 'pending_processing').get();

  let eventsConsumed = 0;
  const atomsWithEvidence = new Set();
  const atomsWithCanonicalMastery = new Set();
  const atomsWithCoverageEvidence = new Set();
  const atomsFlaggedCanonicalRisk = new Set();
  const battlePriorityItems = new Set();
  const rebuildCandidates = new Set();

  for (const doc of pendingEventsSnap.docs) {
    const eventId = doc.id;
    const event = doc.data();
    const attemptSessionId = event.attemptSessionId;
    const userId = event.userId;

    // Read current session evidence records outside transaction
    const evidenceSnap = await db.collection('atomic_evidence_records')
      .where('attemptSessionId', '==', attemptSessionId)
      .get();
    const evidenceDocs = evidenceSnap.docs;

    const currentAtomIds = [...new Set(evidenceDocs.map(d => d.data().atomId))];
    if (currentAtomIds.length === 0) {
      await outboxRef.doc(eventId).update({ eventStatus: 'processed' });
      eventsConsumed++;
      continue;
    }

    // Read history queries outside transaction to prevent Web SDK TypeErrors
    const atomDataList = [];
    for (const atomId of currentAtomIds) {
      const historySnap = await db.collection('atomic_evidence_records')
        .where('userId', '==', userId)
        .where('atomId', '==', atomId)
        .get();

      const masteryDocRef = db.collection('users').doc(userId).collection('atomic_mastery').doc(atomId);
      
      atomDataList.push({
        atomId,
        historyDocs: historySnap.docs,
        masteryDocRef
      });
    }

    // Run transaction block for atomic check-and-write state transitions
    const txResult = await db.runTransaction(async (transaction) => {
      const eventRef = outboxRef.doc(eventId);
      const eventDoc = await transaction.get(eventRef);

      if (!eventDoc.exists || eventDoc.data().eventStatus === 'processed') {
        return null; // Concurrency check: already processed or invalid
      }

      // Read previous mastery document within transaction
      const atomDataWithPrevious = [];
      for (const item of atomDataList) {
        const previousMasteryDoc = await transaction.get(item.masteryDocRef);
        const previousMastery = previousMasteryDoc.exists ? previousMasteryDoc.data().mastery : 0.0;
        atomDataWithPrevious.push({
          ...item,
          previousMastery
        });
      }

      const txAtoms = [];

      // Compute calculations and set/update documents
      for (const { atomId, historyDocs, previousMastery, masteryDocRef } of atomDataWithPrevious) {
        const history = historyDocs.map(d => d.data());
        const totalAttempts = history.length;
        
        // Only count attempts that have a valid answer outcome (assessed attempts)
        const assessedAttempts = history.filter(h => h.outcome === 'correct' || h.outcome === 'incorrect').length;
        const correctAttempts = history.filter(h => h.outcome === 'correct').length;
        const accuracy = assessedAttempts > 0 ? (correctAttempts / assessedAttempts) : 0.0;

        // 🔱 Mastery Input 1: Accuracy (correct / assessed)
        const inputAccuracy = accuracy;

        // 🔱 Mastery Input 2: Consistency
        // True Fail-Closed: Since consistency sub-formula is unresolved, consistency is null
        const consistency = null;

        // 🔱 Mastery Input 3: Retention
        // True Fail-Closed: Since retention sub-formula is unresolved, retention is null
        const retention = null;

        // 🔱 Mastery Input 4: Difficulty
        // Derived dynamically from Easy (1.0), Medium (1.5), Hard (2.0) question weights
        let totalDifficultyWeight = 0.0;
        for (const record of history) {
          const qId = record.questionId;
          const qDoc = await transaction.get(db.collection('question_bank').doc(qId));
          const qData = qDoc.exists ? qDoc.data() : null;
          const diffStr = qData ? qData.difficulty : 'medium';
          
          if (diffStr === 'easy') totalDifficultyWeight += 1.0;
          else if (diffStr === 'hard') totalDifficultyWeight += 2.0;
          else totalDifficultyWeight += 1.5; // medium default
        }
        const avgDifficultyWeight = totalAttempts > 0 ? (totalDifficultyWeight / totalAttempts) : 1.5;
        const difficultyScore = Math.min(1.0, Math.max(0.0, (avgDifficultyWeight - 1.0) / 1.0));

        // 🔱 MasteryScore is Incomplete due to unresolved Consistency & Retention
        const finalMastery = null;
        const masteryStatus = 'Unknown';

        // 🔱 CoverageScore is Incomplete due to unresolved AssessmentEvidence
        const scheduleCompletion = totalAttempts > 0 ? 1.0 : 0.0;
        const assessmentEvidence = null;
        const atomicVerification = correctAttempts >= 1 ? 1.0 : 0.0;

        const coverageScore = null;
        const encountered = totalAttempts > 0;
        const assessed = assessedAttempts > 0;
        const evidenceBackedCoverage = totalAttempts >= 3 || correctAttempts >= 1;

        const coverageStatus = 'Incomplete';

        // 🔱 RiskScore is Incomplete due to unresolved inputs
        const riskScore = null;
        const isRisk = false;
        const riskStatus = 'Incomplete';

        // 🔱 BattleScore is Incomplete due to unresolved inputs
        const battleScore = null;
        const isBattlePriority = false; 

        // 🔱 Dependency Damage is Incomplete / Unresolved
        const dependencyDamage = null;

        // 🔱 RebuildScore is Incomplete due to unresolved factors
        const rebuildScore = null;
        const isRebuild = false;
        const rebuildReason = null;

        txAtoms.push({
          atomId,
          evidenceBackedCoverage,
          isRisk,
          isBattlePriority,
          isRebuild
        });

        const userRef = db.collection('users').doc(userId);
        
        transaction.set(masteryDocRef, {
          atomId,
          userId,
          mastery: null,
          consistencyStatus: 'POLICY_UNRESOLVED',
          retentionStatus: 'POLICY_UNRESOLVED',
          status: masteryStatus,
          updatedAt: new Date().toISOString()
        });

        transaction.set(userRef.collection('atomic_coverage').doc(atomId), {
          atomId,
          userId,
          coverageScore: null,
          encountered,
          assessed,
          evidenceBackedCoverage,
          assessmentEvidenceStatus: 'POLICY_UNRESOLVED',
          status: coverageStatus,
          updatedAt: new Date().toISOString()
        });

        transaction.set(userRef.collection('atomic_risk').doc(atomId), {
          atomId,
          userId,
          riskScore: null,
          isRisk,
          masteryStatus: 'POLICY_UNRESOLVED',
          recencyStatus: 'POLICY_UNRESOLVED',
          status: riskStatus,
          updatedAt: new Date().toISOString()
        });

        transaction.set(userRef.collection('battle_priority').doc(atomId), {
          atomId,
          userId,
          battleScore: null,
          isBattlePriority,
          riskStatus: 'POLICY_UNRESOLVED',
          status: 'Incomplete',
          updatedAt: new Date().toISOString()
        });

        transaction.set(userRef.collection('rebuild_candidates').doc(atomId), {
          atomId,
          userId,
          isRebuild,
          reason: rebuildReason,
          rebuildScore: null,
          factorsStatus: 'POLICY_UNRESOLVED',
          status: 'Incomplete',
          updatedAt: new Date().toISOString()
        });
      }

      transaction.update(eventRef, { eventStatus: 'processed' });
      return { txAtoms };
    });

    if (txResult) {
      eventsConsumed++;
      for (const item of txResult.txAtoms) {
        atomsWithEvidence.add(item.atomId);
      }
    }
  }

  return {
    eventsConsumed,
    uniqueEvidenceContributions: atomsWithEvidence.size,
    atomsWithEvidenceState: atomsWithEvidence.size,
    masteryCount: atomsWithCanonicalMastery.size, // 0
    coverageCount: atomsWithCoverageEvidence.size, // 0
    riskCount: atomsFlaggedCanonicalRisk.size, // 0
    battleCount: battlePriorityItems.size, // 0
    rebuildCount: rebuildCandidates.size // 0
  };
}

module.exports = {
  consumeEvidenceOutboxEvents
};
