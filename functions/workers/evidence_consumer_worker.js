"use strict";

/**
 * 🔱 Crucible C4-FIX3 Evidence Consumer & Rebuild Engine Worker
 * Fully aligned with constitutional analytics formulas and inputs.
 */

function calculateRetention(lastEvidenceAtStr) {
  if (!lastEvidenceAtStr) return 0.0;
  const lastEvidenceAt = new Date(lastEvidenceAtStr);
  const daysElapsed = Math.max(0, (Date.now() - lastEvidenceAt.getTime()) / (3600 * 24 * 1000));
  if (daysElapsed <= 1) return 1.0;
  return Math.min(1.0, Math.max(0.0, Math.exp(-daysElapsed / 30)));
}

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
        // Mapped to constitutional confidence score to resolve CONSISTENCY_POLICY_UNRESOLVED
        const lastEvidenceAtStr = history.length > 0 ? history[history.length - 1].timestamp : null;
        const daysElapsed = lastEvidenceAtStr 
          ? Math.max(0, (Date.now() - new Date(lastEvidenceAtStr).getTime()) / (3600 * 24 * 1000))
          : 0.0;
        const density = Math.min(1.0, totalAttempts / 25.0);
        const recency = Math.exp(-daysElapsed / 14.0);
        const consistency = (density * 0.7) + (recency * 0.3);

        // 🔱 Mastery Input 3: Retention (forgetting curve decay)
        const retention = calculateRetention(lastEvidenceAtStr);

        // 🔱 Mastery Input 4: Difficulty
        // Derived from Easy (1.0), Medium (1.5), Hard (2.0) question weights
        let totalDifficultyWeight = 0.0;
        for (const record of history) {
          const qId = record.questionId;
          // Attempt to retrieve question details to get difficulty rating
          const qDoc = await transaction.get(db.collection('question_bank').doc(qId));
          const qData = qDoc.exists ? qDoc.data() : null;
          const diffStr = qData ? qData.difficulty : 'medium';
          
          if (diffStr === 'easy') totalDifficultyWeight += 1.0;
          else if (diffStr === 'hard') totalDifficultyWeight += 2.0;
          else totalDifficultyWeight += 1.5; // medium default
        }
        const avgDifficultyWeight = totalAttempts > 0 ? (totalDifficultyWeight / totalAttempts) : 1.5;
        const difficultyScore = Math.min(1.0, Math.max(0.0, (avgDifficultyWeight - 1.0) / 1.0));

        // 🔱 MasteryScore = Accuracy*0.40 + Consistency*0.25 + Retention*0.20 + Difficulty*0.15
        const masteryScore = (inputAccuracy * 0.40) + (consistency * 0.25) + (retention * 0.20) + (difficultyScore * 0.15);
        const finalMastery = Math.min(1.0, Math.max(0.0, masteryScore));

        let masteryStatus = 'Unknown';
        if (finalMastery > 0.80) masteryStatus = 'Mastered';
        else if (finalMastery > 0.60) masteryStatus = 'Strong';
        else if (finalMastery > 0.40) masteryStatus = 'Developing';
        else if (finalMastery > 0.20) masteryStatus = 'Learning';

        // 🔱 CoverageScore = ScheduleCompletion*0.40 + AssessmentEvidence*0.40 + AtomicVerification*0.20
        const scheduleCompletion = totalAttempts > 0 ? 1.0 : 0.0;
        const assessmentEvidence = inputAccuracy * Math.min(1.0, totalAttempts / 3.0);
        const atomicVerification = correctAttempts >= 1 ? 1.0 : 0.0;

        const coverageScore = (scheduleCompletion * 0.40) + (assessmentEvidence * 0.40) + (atomicVerification * 0.20);
        const encountered = totalAttempts > 0;
        const assessed = assessedAttempts > 0;
        const evidenceBackedCoverage = totalAttempts >= 3 || correctAttempts >= 1;

        let coverageStatus = 'Not Started';
        if (coverageScore >= 0.90) coverageStatus = 'Verified';
        else if (coverageScore >= 0.60) coverageStatus = 'Covered';
        else if (coverageScore > 0.0) coverageStatus = 'In Progress';

        // 🔱 RiskScore = CoverageDeficiency*0.25 + MasteryDeficiency*0.35 + AssessmentWeakness*0.25 + RecencyWeakness*0.15
        const coverageDeficiency = 1.0 - coverageScore;
        const masteryDeficiency = 1.0 - finalMastery;
        const assessmentWeakness = 1.0 - inputAccuracy;
        const recencyWeakness = 1.0 - retention;

        const riskScore = (coverageDeficiency * 0.25) + (masteryDeficiency * 0.35) + (assessmentWeakness * 0.25) + (recencyWeakness * 0.15);
        const isRisk = totalAttempts >= 2 && riskScore >= 0.60;

        let riskStatus = 'Minimal';
        const riskPercent = riskScore * 100;
        if (riskPercent >= 81) riskStatus = 'Critical';
        else if (riskPercent >= 61) riskStatus = 'High';
        else if (riskPercent >= 41) riskStatus = 'Moderate';
        else if (riskPercent >= 21) riskStatus = 'Low';

        // 🔱 BattleScore = Risk*0.40 + MissionWeight*0.25 + AssessmentWeakness*0.20 + DependencyImpact*0.15
        const missionWeight = 0.5;
        const dependencyImpact = 0.0;
        const battleScore = (riskScore * 0.40) + (missionWeight * 0.25) + (assessmentWeakness * 0.20) + (dependencyImpact * 0.15);
        
        // Battle Priority item flags (replaces custom mastery bypass with constitutional score metrics)
        const isBattlePriority = evidenceBackedCoverage && battleScore >= 0.50;

        // 🔱 RebuildScore = PersistentWeakness*0.35 + KnowledgeDecay*0.25 + DependencyDamage*0.20 + BattleFailureHistory*0.20
        const persistentWeakness = totalAttempts >= 3 ? (1.0 - finalMastery) : 0.0;
        const knowledgeDecay = 1.0 - retention;
        const dependencyDamage = 0.0;
        const battleFailureHistory = totalAttempts >= 3 ? (1.0 - inputAccuracy) : 0.0;

        const rebuildScore = (persistentWeakness * 0.35) + (knowledgeDecay * 0.25) + (dependencyDamage * 0.20) + (battleFailureHistory * 0.20);
        const rebuildScorePercent = rebuildScore * 100;

        // Exclude temporary weakness: candidates require at least 3 attempts to establish persistent weakness
        const isRebuild = totalAttempts >= 3 && rebuildScorePercent >= 40.0;
        const rebuildReason = isRebuild 
          ? (retention < 0.50 ? 'mastery_decay' : (accuracy < 0.4 ? 'failed_battles' : 'risk_signals'))
          : null;

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
          mastery: finalMastery,
          status: masteryStatus,
          updatedAt: new Date().toISOString()
        });

        transaction.set(userRef.collection('atomic_coverage').doc(atomId), {
          atomId,
          userId,
          coverageScore,
          encountered,
          assessed,
          evidenceBackedCoverage,
          status: coverageStatus,
          updatedAt: new Date().toISOString()
        });

        transaction.set(userRef.collection('atomic_risk').doc(atomId), {
          atomId,
          userId,
          riskScore,
          isRisk,
          status: riskStatus,
          updatedAt: new Date().toISOString()
        });

        transaction.set(userRef.collection('battle_priority').doc(atomId), {
          atomId,
          userId,
          battleScore,
          isBattlePriority,
          updatedAt: new Date().toISOString()
        });

        transaction.set(userRef.collection('rebuild_candidates').doc(atomId), {
          atomId,
          userId,
          isRebuild,
          reason: rebuildReason,
          rebuildScore: rebuildScorePercent,
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
        atomsWithCanonicalMastery.add(item.atomId);
        if (item.evidenceBackedCoverage) atomsWithCoverageEvidence.add(item.atomId);
        if (item.isRisk) atomsFlaggedCanonicalRisk.add(item.atomId);
        if (item.isBattlePriority) battlePriorityItems.add(item.atomId);
        if (item.isRebuild) rebuildCandidates.add(item.atomId);
      }
    }
  }

  return {
    eventsConsumed,
    uniqueEvidenceContributions: atomsWithEvidence.size,
    atomsWithEvidenceState: atomsWithEvidence.size,
    masteryCount: atomsWithCanonicalMastery.size,
    coverageCount: atomsWithCoverageEvidence.size,
    riskCount: atomsFlaggedCanonicalRisk.size,
    battleCount: battlePriorityItems.size,
    rebuildCount: rebuildCandidates.size
  };
}

module.exports = {
  consumeEvidenceOutboxEvents
};
