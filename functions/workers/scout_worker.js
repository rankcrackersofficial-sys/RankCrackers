const functions = require("firebase-functions");
const admin = require("firebase-admin");
const ScoutService = require("../services/scout_service");
const { logFounderActivity } = require("../services/audit_service");
const { isAiEnabled, trackSystemBudget } = require("../services/budget_service");
const { isWorkerEnabled, getWorkerMode, updateHeartbeat } = require("../services/worker_service");
const crypto = require("crypto");

/**
 * 🔱 SOVEREIGN WEBSITE SCOUT
 */
exports.sovereignWebsiteScout = functions.pubsub
  .schedule('every 6 hours')
  .onRun(async (context) => {

    // 🔱 GOVERNANCE LAYER ENFORCEMENT
    if (!(await isWorkerEnabled('scout_worker'))) {
        console.log("🔱 SCOUT: Worker disabled or budget exceeded.");
        return null;
    }

    const mode = await getWorkerMode('scout_worker');
    if (mode === 'manual') {
        console.log("🔱 SCOUT: Manual mode active. Skipping scheduled run.");
        return null;
    }

    // 🔱 Update Heartbeat for Dashboard
    await updateHeartbeat('scout_worker', { status: 'ONLINE' });

    console.log("🔱 SCOUT: Initiating global scan...");
    await updateHeartbeat('scout_worker');

    console.log("🔱 SCOUT: Initiating global scan...");

    const discoveries = [];
    discoveries.push(...(await ScoutService.scanRPSC()));
    discoveries.push(...(await ScoutService.scanRSSB()));
    discoveries.push(...(await ScoutService.scanSSC()));

    for (const item of discoveries) {
      // 🔱 Audit Fix: Hardened Deduplication (Queue + Drafts + Published)
      const discoveryHash = crypto.createHash('sha256').update(item.url + item.title).digest('hex');

      const inQueue = await admin.firestore().collection('ai_queue')
        .where('payload.discoveryHash', '==', discoveryHash).get();

      const inDrafts = await admin.firestore().collection('sentinel_drafts')
        .where('audit.sourceHash', '==', discoveryHash).get();

      const inDownloads = await admin.firestore().collection('scout_downloads')
        .where('sourceHash', '==', discoveryHash).get();

      if (!inQueue.empty || !inDrafts.empty || !inDownloads.empty) {
          console.log(`🔱 SCOUT: Discovery ${item.title} already exists in registry. Skipping.`);
          continue;
      }

      const taskId = `scout_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      // 🔱 Create Scout Download Record (For Intelligence Feed)
      if (item.url.endsWith('.pdf')) {
          await admin.firestore().collection('scout_downloads').doc(taskId).set({
              id: taskId,
              title: item.title,
              source: item.source,
              downloadUrl: item.url,
              status: 'PENDING_REVIEW',
              sourceHash: discoveryHash,
              createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
      }

      await admin.firestore().collection('ai_queue').doc(taskId).set({
        type: 'scout_discovery',
        status: 'received',
        payload: {
          id: taskId,
          text: `TITLE: ${item.title}\nSOURCE: ${item.source}\nURL: ${item.url}`,
          task: item.type,
          isUrgent: item.isUrgent || false,
          batchId: 'scout_auto_discovery',
          discoveryHash: discoveryHash
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 🔱 Update Heartbeat Success
      await updateHeartbeat('scout_worker', { success: true });

      await logFounderActivity({
        type: 'SCOUT_DISCOVERY',
        message: `Scout detected new potential mission from ${item.source}: ${item.title}`,
        metadata: { source: item.source, url: item.url }
      });
    }

    return null;
  });
