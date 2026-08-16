"use strict";

/**
 * 🔱 Crucible C4 Evidence Consumer & Rebuild Engine Worker
 */

async function consumeEvidenceOutboxEvents({ db }) {
  const outboxRef = db.collection('evidence_outbox');
  const pendingEventsSnap = await outboxRef.where('eventStatus', '==', 'pending_processing').get();

  let eventsConsumed = 0;
  let atomsWithMastery = new Set();
  let atomsWithCoverage = new Set();
  let atomsFlaggedRisk = new Set();
  let battlePriorityItems = new Set();
  let rebuildCandidates = new Set();

  for (const doc of pendingEventsSnap.docs) {
    const event = doc.data();
    const eventId = doc.id;
    const attemptSessionId = event.attemptSessionId;
    const userId = event.userId;

    console.log(`[C4 Consumer] Processing outbox event: ${eventId} for user: ${userId}`);

    // Fetch new evidence records created for this session
    const evidenceSnap = await db.collection('atomic_evidence_records')
      .where('attemptSessionId', '==', attemptSessionId)
      .get();

    const currentAtomIds = [...new Set(evidenceSnap.docs.map(d => d.data().atomId))];
    if (currentAtomIds.length === 0) {
      console.log(`[C4 Consumer] No evidence records found for session: ${attemptSessionId}. Marking processed.`);
      await outboxRef.doc(eventId).update({ eventStatus: 'processed' });
      eventsConsumed++;
      continue;
    }

    const batch = db.batch();

    // Process each unique atom mapped in the session evidence
    for (const atomId of currentAtomIds) {
      // Query ALL historical evidence records for this user + atom to calculate cumulative metrics
      const historySnap = await db.collection('atomic_evidence_records')
        .where('userId', '==', userId)
        .where('atomId', '==', atomId)
        .get();

      const history = historySnap.docs.map(d => d.data());
      const totalAttempts = history.length;
      const correctAttempts = history.filter(h => h.outcome === 'correct').length;
      const incorrectAttempts = totalAttempts - correctAttempts;

      const mastery = totalAttempts > 0 ? (correctAttempts / totalAttempts) : 0.0;
      const covered = totalAttempts > 0;
      const riskScore = totalAttempts > 0 ? (incorrectAttempts / totalAttempts) : 0.0;
      const isRisk = totalAttempts >= 2 && riskScore > 0.5;

      const isBattlePriority = covered && mastery < 0.6;
      const isRebuild = isRisk || (covered && mastery < 0.4);

      // Downstream boundary metrics tracking
      atomsWithMastery.add(atomId);
      if (covered) atomsWithCoverage.add(atomId);
      if (isRisk) atomsFlaggedRisk.add(atomId);
      if (isBattlePriority) battlePriorityItems.add(atomId);
      if (isRebuild) rebuildCandidates.add(atomId);

      // Target write-set paths (strictly founder-only writable)
      const userRef = db.collection('users').doc(userId);
      
      batch.set(userRef.collection('atomic_mastery').doc(atomId), {
        atomId,
        userId,
        mastery,
        updatedAt: new Date().toISOString()
      });

      batch.set(userRef.collection('atomic_coverage').doc(atomId), {
        atomId,
        userId,
        covered,
        updatedAt: new Date().toISOString()
      });

      batch.set(userRef.collection('atomic_risk').doc(atomId), {
        atomId,
        userId,
        riskScore,
        isRisk,
        updatedAt: new Date().toISOString()
      });

      batch.set(userRef.collection('battle_priority').doc(atomId), {
        atomId,
        userId,
        isBattlePriority,
        updatedAt: new Date().toISOString()
      });

      batch.set(userRef.collection('rebuild_candidates').doc(atomId), {
        atomId,
        userId,
        isRebuild,
        updatedAt: new Date().toISOString()
      });
    }

    // Update event status to processed inside the same WriteBatch
    batch.update(outboxRef.doc(eventId), { eventStatus: 'processed' });

    // Commit batch atomically
    await batch.commit();
    eventsConsumed++;
  }

  return {
    eventsConsumed,
    masteryCount: atomsWithMastery.size,
    coverageCount: atomsWithCoverage.size,
    riskCount: atomsFlaggedRisk.size,
    battleCount: battlePriorityItems.size,
    rebuildCount: rebuildCandidates.size
  };
}

module.exports = {
  consumeEvidenceOutboxEvents
};
