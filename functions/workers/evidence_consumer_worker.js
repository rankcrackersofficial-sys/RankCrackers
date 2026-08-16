"use strict";

/**
 * 🔱 Crucible C4 Evidence Consumer & Rebuild Engine Worker
 * Fully audit-compliant canonical analytics calculations and transaction safety.
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

        // 🔱 Canonical Mastery Engine calculation
        const assessmentEvidence = accuracy;
        const readingEvidence = previousMastery > 0 ? 0.5 : 0.0;
        const revisionEvidence = 0.0;
        const retention = 1.0; // Diagnostic recency
        const difficulty = 0.5;

        // score = assessmentEvidence * 0.40 + readingEvidence * 0.20 + revisionEvidence * 0.20 + retention * 0.10 + difficulty * 0.10
        const masteryScore = (assessmentEvidence * 0.40) + (readingEvidence * 0.20) + (retention * 0.10) + (difficulty * 0.10);
        const finalMastery = Math.min(1.0, Math.max(0.0, masteryScore));

        let masteryStatus = 'Unknown';
        if (finalMastery > 0.80) masteryStatus = 'Mastered';
        else if (finalMastery > 0.60) masteryStatus = 'Strong';
        else if (finalMastery > 0.40) masteryStatus = 'Developing';
        else if (finalMastery > 0.20) masteryStatus = 'Learning';

        // 🔱 Canonical Coverage Engine calculation
        const coverageScore = (readingEvidence * 0.35) + (assessmentEvidence * 0.45) + (revisionEvidence * 0.20);
        
        const encountered = totalAttempts > 0;
        const assessed = assessedAttempts > 0;
        const evidenceBackedCoverage = totalAttempts >= 3 || correctAttempts >= 1;

        let coverageStatus = 'Not Started';
        if (coverageScore >= 0.90) coverageStatus = 'Verified';
        else if (coverageScore >= 0.60) coverageStatus = 'Covered';
        else if (coverageScore > 0.0) coverageStatus = 'In Progress';

        // 🔱 Canonical Risk Engine calculation
        const coverageDeficiency = 1.0 - coverageScore;
        const masteryDeficiency = 1.0 - finalMastery;
        const assessmentWeakness = 1.0 - accuracy;
        const recencyWeakness = 0.0;

        const riskScore = (coverageDeficiency * 0.25) + (masteryDeficiency * 0.35) + (assessmentWeakness * 0.25) + (recencyWeakness * 0.15);
        const isRisk = totalAttempts >= 2 && riskScore >= 0.60;

        let riskStatus = 'Minimal';
        if (riskScore >= 0.80) riskStatus = 'Critical';
        else if (riskScore >= 0.60) riskStatus = 'High';
        else if (riskScore >= 0.40) riskStatus = 'Moderate';
        else if (riskScore >= 0.20) riskStatus = 'Low';

        // 🔱 Canonical Rebuild Engine calculation
        let rebuildReason = null;
        if (finalMastery < 0.50) {
          rebuildReason = 'low_mastery';
        } else if (totalAttempts >= 2 && accuracy < 0.4) {
          rebuildReason = 'failed_battles';
        }

        const isRebuild = rebuildReason !== null;
        const rebuildPriorityScore = ((1.0 - finalMastery) * 50.0) + 15.0; // defaulted importance/difficulty

        // 🔱 Battle Priority calculation
        const isBattlePriority = evidenceBackedCoverage && finalMastery < 0.60;

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
          isBattlePriority,
          updatedAt: new Date().toISOString()
        });

        transaction.set(userRef.collection('rebuild_candidates').doc(atomId), {
          atomId,
          userId,
          isRebuild,
          reason: rebuildReason,
          priorityScore: rebuildPriorityScore,
          updatedAt: new Date().toISOString()
        });
      }

      // Mark outbox event processed inside the same transaction
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
