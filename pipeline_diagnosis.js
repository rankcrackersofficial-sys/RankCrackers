#!/usr/bin/env node
/**
 * PIPELINE DIAGNOSTIC TOOL
 * Traces upload pipeline blockage points across all Firestore collections.
 */

const admin = require('firebase-admin');

// Load service account from functions directory
try {
  const serviceAccount = require('./functions/service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (err) {
  console.error('ERROR: Could not load service account. Run from repo root.');
  process.exit(1);
}

const db = admin.firestore();

function formatTime(val) {
  if (!val) return "N/A";
  if (val.toDate) return val.toDate().toISOString();
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'number') return new Date(val).toISOString();
  if (val._seconds) return new Date(val._seconds * 1000).toISOString();
  return String(val);
}

async function diagnose() {
  console.log('\n================== PIPELINE DIAGNOSTIC REPORT ==================\n');
  
  // 1. WORKER HEALTH
  console.log('📋 [1] WORKER REGISTRY STATUS\n');
  const workers = ['sentinel_worker', 'structural_worker', 'svo_worker'];
  for (const workerName of workers) {
    const doc = await db.collection('worker_registry').doc(workerName).get();
    if (doc.exists) {
      const data = doc.data();
      console.log(`  ${workerName}:`);
      console.log(`    Status: ${data.status || 'UNKNOWN'}`);
      console.log(`    Enabled: ${data.enabled !== false ? 'YES' : 'NO'}`);
      console.log(`    Last Heartbeat: ${formatTime(data.lastHeartbeat)}`);
      console.log(`    Error Count: ${data.errorCount || 0}`);
      if (data.error) console.log(`    Last Error: ${data.error.substring(0, 80)}`);
      console.log('');
    } else {
      console.log(`  ${workerName}: NOT FOUND ❌\n`);
    }
  }

  // 2. AI_QUEUE ANALYSIS
  console.log('📋 [2] AI_QUEUE STUCK TASKS\n');
  const queueSnapshot = await db.collection('ai_queue')
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get();

  if (queueSnapshot.empty) {
    console.log('  No tasks found.\n');
  } else {
    const statusCount = {};
    queueSnapshot.docs.forEach(doc => {
      const data = doc.data();
      statusCount[data.status] = (statusCount[data.status] || 0) + 1;
    });

    console.log('  Status Distribution:');
    for (const [status, count] of Object.entries(statusCount)) {
      console.log(`    ${status}: ${count} tasks`);
    }

    // Show stuck/failed tasks
    console.log('\n  Recent Task States:');
    queueSnapshot.docs.slice(0, 5).forEach(doc => {
      const data = doc.data();
      console.log(`    Task: ${doc.id}`);
      console.log(`      Status: ${data.status}`);
      console.log(`      Type: ${data.type}`);
      console.log(`      Created: ${formatTime(data.createdAt)}`);
      if (data.error) console.log(`      Error: ${data.error.substring(0, 60)}`);
      if (data.status === 'processing' || data.status === 'parsing') {
        const age = Date.now() - (data.processingStartedAt?.toDate?.().getTime?.() || data.createdAt?.toDate?.().getTime?.() || Date.now());
        console.log(`      Age: ${Math.floor(age / 1000)}s`);
      }
      console.log('');
    });
  }

  // 3. SENTINEL_DRAFTS BACKLOG
  console.log('📋 [3] SENTINEL_DRAFTS STATUS\n');
  const draftsSnapshot = await db.collection('sentinel_drafts')
    .orderBy('audit.processedAt', 'desc')
    .limit(20)
    .get();

  if (draftsSnapshot.empty) {
    console.log('  No drafts found.\n');
  } else {
    const draftStatusCount = {};
    draftsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      draftStatusCount[data.status] = (draftStatusCount[data.status] || 0) + 1;
    });

    console.log('  Draft Status Distribution:');
    for (const [status, count] of Object.entries(draftStatusCount)) {
      console.log(`    ${status}: ${count} drafts`);
    }

    console.log('\n  Under-Review Drafts (potential blockage):');
    const underReview = draftsSnapshot.docs
      .filter(d => d.data().status === 'under_review')
      .slice(0, 3);
    
    if (underReview.length === 0) {
      console.log('    None');
    } else {
      underReview.forEach(doc => {
        const data = doc.data();
        console.log(`    ${doc.id}`);
        console.log(`      Created: ${formatTime(data.audit?.processedAt)}`);
        console.log(`      Type: ${data.type}`);
      });
    }
    console.log('');
  }

  // 4. INGESTION_REFINERY BACKLOG
  console.log('📋 [4] INGESTION_REFINERY BACKLOG\n');
  const refinerySnapshot = await db.collection('ingestion_refinery')
    .orderBy('processedAt', 'desc')
    .limit(20)
    .get();

  if (refinerySnapshot.empty) {
    console.log('  No refineries found.\n');
  } else {
    const refineryStatusCount = {};
    refinerySnapshot.docs.forEach(doc => {
      const data = doc.data();
      refineryStatusCount[data.status] = (refineryStatusCount[data.status] || 0) + 1;
    });

    console.log('  Refinery Status Distribution:');
    for (const [status, count] of Object.entries(refineryStatusCount)) {
      console.log(`    ${status}: ${count} items`);
    }
    console.log('');
  }

  // 5. FAILED TASKS ANALYSIS
  console.log('📋 [5] AI_FAILED_TASKS (Recent Errors)\n');
  const failedSnapshot = await db.collection('ai_failed_tasks')
    .orderBy('timestamp', 'desc')
    .limit(10)
    .get();

  if (failedSnapshot.empty) {
    console.log('  No failures recorded.\n');
  } else {
    const errorTypes = {};
    failedSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const errMsg = (data.error || 'UNKNOWN').split(':')[0];
      errorTypes[errMsg] = (errorTypes[errMsg] || 0) + 1;
    });

    console.log('  Error Types:');
    for (const [errType, count] of Object.entries(errorTypes)) {
      console.log(`    ${errType}: ${count} times`);
    }

    console.log('\n  Recent Errors:');
    failedSnapshot.docs.slice(0, 3).forEach(doc => {
      const data = doc.data();
      console.log(`    ${doc.id}`);
      console.log(`      Error: ${data.error.substring(0, 80)}`);
      console.log(`      Type: ${data.type}`);
      console.log(`      Timestamp: ${formatTime(data.timestamp)}`);
    });
    console.log('');
  }

  // 6. BUDGET STATUS
  console.log('📋 [6] SYSTEM BUDGET\n');
  const budgetDoc = await db.collection('system_budget').doc('current').get();
  if (budgetDoc.exists) {
    const budget = budgetDoc.data();
    console.log(`  Tokens Used (This Month): ${budget.tokensUsedThisMonth || 0}`);
    console.log(`  Monthly Limit: ${budget.monthlyTokenLimit || 'UNLIMITED'}`);
    console.log(`  AI Enabled: ${budget.aiEnabled !== false ? 'YES' : 'NO'}`);
  } else {
    console.log('  Budget document not found.\n');
  }

  // 7. DIAGNOSIS SUMMARY
  console.log('\n📋 [7] DIAGNOSIS SUMMARY\n');
  
  let issues = [];
  
  if (!queueSnapshot.empty) {
    const stuck = queueSnapshot.docs.filter(d => {
      const data = d.data();
      return data.status === 'received' || data.status === 'parsing' || data.status === 'processing';
    });
    if (stuck.length > 0) {
      issues.push(`  ⚠️  ${stuck.length} tasks stuck in intermediate states (received/parsing/processing)`);
    }
  }

  if (!draftsSnapshot.empty) {
    const underReview = draftsSnapshot.docs.filter(d => d.data().status === 'under_review').length;
    if (underReview > 5) {
      issues.push(`  ⚠️  ${underReview} drafts stuck in 'under_review' (may indicate downstream processing issue)`);
    }
  }

  if (!failedSnapshot.empty) {
    issues.push(`  ⚠️  ${failedSnapshot.size} recent task failures. Check error types above.`);
  }

  const budgetEnabled = budgetDoc.exists && budgetDoc.data().aiEnabled !== false;
  if (!budgetEnabled) {
    issues.push(`  🔴 AI system is DISABLED (budget kill-switch active)`);
  }

  if (issues.length === 0) {
    console.log('  ✅ No obvious blockages detected. Pipeline appears healthy.');
  } else {
    console.log('Potential Issues Found:\n');
    issues.forEach(issue => console.log(issue));
  }

  console.log('\n===============================================================\n');

  process.exit(0);
}

diagnose().catch(err => {
  console.error('DIAGNOSTIC ERROR:', err);
  process.exit(1);
});
