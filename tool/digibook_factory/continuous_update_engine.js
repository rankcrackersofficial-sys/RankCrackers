const crypto = require('crypto');

/**
 * CONTINUOUS KNOWLEDGE UPDATE ENGINE
 * Monitors source versions, detects knowledge deltas, updates atomic facts,
 * builds immutable lesson revisions (V001 -> V002), and emits Question Factory notifications.
 */
class ContinuousUpdateEngine {
  constructor(registry) {
    this.registry = registry;
    this.revisions = new Map(); // guId -> [Revisions]
    this.questionRevalidationQueue = [];
  }

  /**
   * Process a source update.
   */
  processSourceUpdate({ sourceId, newContent, newVersion, changeReason }) {
    const existingSource = this.registry.getSource(sourceId);
    if (!existingSource) throw new Error(`Source ${sourceId} not found`);

    const newHash = crypto.createHash('sha256').update(newContent).digest('hex');

    // Idempotency check: same content hash -> no-op
    if (newHash === existingSource.contentHash) {
      return {
        updated: false,
        reason: 'SOURCE_HASH_UNCHANGED',
        duplicateRevisionAvoided: true,
      };
    }

    // Knowledge delta detected
    const delta = {
      sourceId,
      oldVersion: existingSource.version,
      newVersion,
      oldHash: existingSource.contentHash,
      newHash,
      changeReason,
      detectedAt: new Date().toISOString(),
    };

    // Update source in registry
    existingSource.version = newVersion;
    existingSource.contentHash = newHash;
    existingSource.rawContent = newContent;
    existingSource.lastCheckedAt = new Date().toISOString();

    // Map delta to affected GUs
    const affectedGUs = existingSource.canonicalNodeMappings;

    // Build immutable new revisions for affected GUs
    const newDraftRevisions = [];
    for (const mapping of affectedGUs) {
      const guId = mapping.replace('*', 'GU_SAMPLE');
      const revList = this.revisions.get(guId) || [];
      const revNumber = revList.length + 1;
      const revisionId = `REV_${guId}_V${String(revNumber).padStart(3, '0')}`;
      const previousRevisionId = revList.length > 0 ? revList[revList.length - 1].revisionId : null;

      const draftRevision = {
        guId,
        revisionId,
        previousRevisionId,
        changeReason,
        sourceDeltaId: delta.newHash.slice(0, 12),
        publicationStatus: 'READY_FOR_PUBLICATION', // Stops at Founder gate!
        assembledAt: new Date().toISOString(),
      };

      revList.push(draftRevision);
      this.revisions.set(guId, revList);
      newDraftRevisions.push(draftRevision);

      // Trigger Question Revalidation Notification (never auto-generate questions!)
      this.questionRevalidationQueue.push({
        guId,
        revisionId,
        deltaId: delta.newHash.slice(0, 12),
        action: 'QUESTION_REVALIDATION_REQUIRED',
        timestamp: new Date().toISOString(),
      });
    }

    return {
      updated: true,
      delta,
      newDraftRevisions,
      questionRevalidationsEmitted: this.questionRevalidationQueue.length,
    };
  }
}

module.exports = { ContinuousUpdateEngine };
