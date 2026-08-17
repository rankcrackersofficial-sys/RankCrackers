import * as admin from 'firebase-admin';

/**
 * 🔱 AAF PROGRESS MONITOR
 * Aggregates persistent state for a Run or Mission.
 */
export class AafProgressMonitor {
  private db = admin.firestore();

  /**
   * 🛡️ GET RUN PROGRESS
   */
  async getRunProgress(runId: string) {
    const snap = await this.db.collection('ai_queue')
      .where('queueContract', '==', 'academic_factory_v1')
      .where('runId', '==', runId)
      .get();

    const stats = {
      total: 0,
      planned: 0,
      waitingDependency: 0,
      ready: 0,
      leased: 0,
      running: 0,
      reviewing: 0,
      repairRequired: 0,
      retryWait: 0,
      hardHold: 0,
      approved: 0,
      materializing: 0,
      published: 0,
      failedTerminal: 0,
    };

    snap.docs.forEach(doc => {
      const data = doc.data();
      stats.total++;
      if (data.state in stats) {
        (stats as any)[data.state]++;
      }
    });

    return stats;
  }
}
