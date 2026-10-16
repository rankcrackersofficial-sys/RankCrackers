/**
 * 🔱 AUTHORITY WATCH SCHEDULED CLOUD FUNCTION WORKER
 * Target Collection: authority_intelligence_events
 * Command: RC-AUTHORITY-WATCH-R1A-FIXED-IST-SCHEDULE-AND-FOUNDER-ONDEMAND-SCAN-AG1-20260914
 *
 * Laws:
 *   - Scheduled cadence: fixed cron 0 0,6,12,18 * * * in Asia/Kolkata timezone.
 *   - Daily execution slots: 00:00 IST, 06:00 IST, 12:00 IST, 18:00 IST.
 *   - Strictly 6 pilot authorities: UPSC, SSC, NTA, RPSC, RSSB, DSSSB.
 *   - Governed execution: checks isWorkerEnabled('authority_watch') and worker mode.
 *   - Zero source prepare, zero verify, zero mission creation, zero publication.
 */

'use strict';

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { isWorkerEnabled, getWorkerMode } = require("../services/worker_service");
const {
  scanAllEnabledAuthorities,
  scanSingleAuthority,
  runAuthorityWatch,
} = require("../services/authority_intelligence/authority_watch_scanner");

const SCHEDULE_CONFIG = Object.freeze({
  cron: '0 0,6,12,18 * * *',
  timeZone: 'Asia/Kolkata',
  dailySlotsIst: Object.freeze(['00:00', '06:00', '12:00', '18:00']),
});

/**
 * Scheduled Cloud Function running at fixed India Standard Time slots:
 * 00:00 IST, 06:00 IST, 12:00 IST, 18:00 IST.
 */
const authorityWatchWorker = functions
  .runWith({
    timeoutSeconds: 300,
    memory: '512MB',
  })
  .pubsub
  .schedule(SCHEDULE_CONFIG.cron)
  .timeZone(SCHEDULE_CONFIG.timeZone)
  .onRun(async (context) => {
    // 1. Governance check: is worker enabled
    if (!(await isWorkerEnabled('authority_watch'))) {
      console.log("🔱 AUTHORITY_WATCH: Worker disabled or budget exceeded.");
      return null;
    }

    // 2. Worker mode check
    const mode = await getWorkerMode('authority_watch');
    if (mode === 'manual' || mode === 'manualOnly') {
      console.log("🔱 AUTHORITY_WATCH: Manual mode active. Skipping scheduled run.");
      return null;
    }

    console.log(`🔱 AUTHORITY_WATCH: Initiating scheduled watch [CRON: ${SCHEDULE_CONFIG.cron} | TZ: ${SCHEDULE_CONFIG.timeZone}]...`);
    const db = admin.firestore();
    const result = await scanAllEnabledAuthorities({ db });
    console.log("🔱 AUTHORITY_WATCH: Completed scheduled run:", JSON.stringify(result.summary));
    return result;
  });

/**
 * Programmatic invocation helper for testing, manual CLI runs, and verification.
 */
async function executeAuthorityWatchJob({ db = null, authorityKeys = null, dryRun = false, maxCandidatesPerAuthority = 100 } = {}) {
  const targetDb = db || admin.firestore();
  return runAuthorityWatch({
    db: targetDb,
    authorityKeys,
    dryRun,
    maxCandidatesPerAuthority,
  });
}

module.exports = {
  SCHEDULE_CONFIG,
  authorityWatchWorker,
  executeAuthorityWatchJob,
};
