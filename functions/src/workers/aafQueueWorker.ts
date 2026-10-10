import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { AafDispatcher } from '../academicFactory/core/aafDispatcher';
import { AafLifecycleService } from '../academicFactory/services/aafLifecycleService';
import { AafQueueRepository } from '../academicFactory/repositories/aafQueueRepository';
import { isAafTask } from './queueWorker';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const dispatcher = new AafDispatcher();
const lifecycle = new AafLifecycleService();
const repo = new AafQueueRepository();

/**
 * 🛡️ EVENT-DRIVEN AAF QUEUE WORKER
 * Listens to all updates on ai_queue and processes 'ready' and 'approved' tasks.
 */
export const aafQueueWorker = functions.firestore
  .document('ai_queue/{taskId}')
  .onWrite(async (change, context) => {
    // 🛡️ TEST ISOLATION GATE: Avoid executing background triggers in the emulator process during Jest runs
    if (process.env.JEST_WORKER_ID) {
      console.log("aafQueueWorker: Bypassing background trigger execution in emulator process.");
      return;
    }
    const data = change.after.exists ? change.after.data() : null;
    const beforeData = change.before.exists ? change.before.data() : null;
    
    if (!data) return;

    // 1. 🛡️ ONLY process tasks belonging to the academic_factory_v1 contract
    if (!isAafTask(data)) return;

    const taskId = context.params.taskId;
    const stateChanged = beforeData?.state !== data.state;

    // 2. 🛡️ LEASE EXPIRY / CRASH RECOVERY
    if (data.state === 'leased' || data.state === 'running') {
      const expires = data.leaseExpiresAtUtc ? data.leaseExpiresAtUtc.toMillis() : null;
      if (expires && expires < Date.now()) {
        console.log(`🛡️ AAF WORKER: Lease expired for task ${taskId}. Recovering to ready...`);
        await lifecycle.recoverExpiredLease(taskId);
        return;
      }
    }

    // 3. 🛡️ READY TASK AUTO-PICKUP
    if (data.state === 'ready') {
      console.log(`🛡️ AAF WORKER: Task ${taskId} is READY. Automatically leasing and running...`);
      try {
        await dispatcher.dispatch(taskId, 'background_aaf_worker');
      } catch (err) {
        console.error(`🔥 AAF WORKER: Dispatch failed for task ${taskId}:`, err);
      }
      return;
    }

    // 4. 🛡️ AUTO DEPENDENCY UNLOCK
    if (stateChanged && data.state === 'approved') {
      console.log(`🛡️ AAF GOVERNOR: Task ${taskId} APPROVED. Unlocking downstream dependents...`);
      const dependentsSnap = await db.collection('ai_queue')
        .where('dependencyJobIds', 'array-contains', taskId)
        .get();

      if (!dependentsSnap.empty) {
        console.log(`🛡️ AAF GOVERNOR: Unlocking ${dependentsSnap.size} dependent tasks...`);
        await Promise.all(dependentsSnap.docs.map(async (doc) => {
          const depId = doc.id;
          try {
            const unlocked = await lifecycle.checkAndUnlockDependencies(depId);
            if (unlocked) {
              console.log(`🛡️ AAF GOVERNOR: Dependent task ${depId} successfully unlocked to READY state.`);
            }
          } catch (err) {
            console.error(`🔥 AAF GOVERNOR: Dependency unlock failed for task ${depId}:`, err);
          }
        }));
      }
    }
  });

/**
 * 🛡️ SCHEDULED MAINTENANCE DAEMON (CRON)
 * Recovers any expired leases and wakes up retryWait tasks periodically.
 */
export const aafQueueScheduler = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    console.log('🛡️ AAF SCHEDULER: Running background maintenance scan...');

    // A. Expired Lease Recovery
    try {
      const expiredKeys = await repo.findExpiredLeases();
      if (expiredKeys.length > 0) {
        console.log(`🛡️ AAF SCHEDULER: Reclaiming ${expiredKeys.length} expired leases...`);
        await Promise.all(expiredKeys.map(key => lifecycle.recoverExpiredLease(key)));
      }
    } catch (err) {
      console.error('🔥 AAF SCHEDULER: Expired lease recovery failed:', err);
    }

    // B. retryWait Wakeup
    try {
      const retryWaitSnap = await db.collection('ai_queue')
        .where('queueContract', '==', 'academic_factory_v1')
        .where('state', '==', 'retryWait')
        .get();

      if (!retryWaitSnap.empty) {
        console.log(`🛡️ AAF SCHEDULER: Found ${retryWaitSnap.size} tasks in retryWait state. Checking wakeups...`);
        await Promise.all(retryWaitSnap.docs.map(async (doc) => {
          const key = doc.id;
          try {
            const woken = await lifecycle.wakeRetry(key);
            if (woken) {
              console.log(`🛡️ AAF SCHEDULER: Task ${key} woken up to READY state.`);
            }
          } catch (err) {
            console.error(`🔥 AAF SCHEDULER: Failed to wake task ${key}:`, err);
          }
        }));
      }
    } catch (err) {
      console.error('🔥 AAF SCHEDULER: retryWait wakeup scan failed:', err);
    }
  });
