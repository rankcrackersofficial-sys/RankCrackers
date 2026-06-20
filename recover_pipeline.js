#!/usr/bin/env node
/**
 * PIPELINE RECOVERY SCRIPT
 * 1. Deploys function fixes
 * 2. Recycles stuck tasks back to processing queue
 */

const admin = require('firebase-admin');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

try {
  const serviceAccount = require('./functions/service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (err) {
  console.error('ERROR: Could not load service account.');
  process.exit(1);
}

const db = admin.firestore();

async function recoverPipeline() {
  console.log('\n================== PIPELINE RECOVERY ==================\n');
  console.log('📋 STEP 1: Redeploy functions with fixes\n');
  
  console.log('⚠️  Running: firebase deploy --only functions\n');
  console.log('This will deploy the updated code with:');
  console.log('  ✅ Fixed PDF parsing (sentinel_worker.js)');
  console.log('  ✅ GROQ retry logic with exponential backoff (groq_service.js)\n');

  try {
    console.log('Deploying... (this may take 2-3 minutes)\n');
    const { stdout, stderr } = await execPromise('firebase deploy --only functions', {
      cwd: 'e:\\RankCrackers',
      timeout: 300000,
      maxBuffer: 10 * 1024 * 1024
    });
    
    console.log(stdout);
    if (stderr) console.log('STDERR:', stderr);
    console.log('\n✅ Functions deployed successfully!\n');
  } catch (error) {
    console.error('⚠️  Deployment command failed. Manual deployment needed:\n');
    console.error('  cd e:\\RankCrackers');
    console.error('  firebase deploy --only functions\n');
  }

  console.log('📋 STEP 2: Recover stuck STRUCTURAL tasks\n');
  
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  
  try {
    const stuckTasks = await db.collection('ai_queue')
      .where('status', '==', 'pending')
      .where('createdAt', '<', threeDaysAgo)
      .get();

    if (stuckTasks.empty) {
      console.log('✅ No stuck STRUCTURAL tasks found.\n');
    } else {
      console.log(`Found ${stuckTasks.size} stuck tasks. Resetting to 'received' for reprocessing...\n`);
      
      const batch = db.batch();
      let count = 0;
      
      stuckTasks.docs.forEach(doc => {
        batch.update(doc.ref, {
          status: 'received',
          recoveredAt: admin.firestore.FieldValue.serverTimestamp(),
          previousStatus: 'pending'
        });
        console.log(`  Resetting: ${doc.id}`);
        count++;
      });
      
      await batch.commit();
      console.log(`\n✅ Reset ${count} tasks for reprocessing.\n`);
    }
  } catch (error) {
    console.error('Error recovering tasks:', error.message);
  }

  console.log('📋 STEP 3: Verify recovery\n');
  
  try {
    // Check current queue status
    const queueSnapshot = await db.collection('ai_queue')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const statusCount = {};
    queueSnapshot.docs.forEach(doc => {
      const status = doc.data().status;
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    console.log('Updated Queue Status:');
    for (const [status, count] of Object.entries(statusCount)) {
      console.log(`  ${status}: ${count} tasks`);
    }
    console.log('');

    // Check worker health
    const sentinelWorker = await db.collection('worker_registry').doc('sentinel_worker').get();
    if (sentinelWorker.exists) {
      const data = sentinelWorker.data();
      console.log('Sentinel Worker Status:');
      console.log(`  Enabled: ${data.enabled !== false ? 'YES' : 'NO'}`);
      console.log(`  Last Heartbeat: ${data.lastHeartbeat?.toDate?.().toISOString?.() || 'N/A'}`);
      console.log(`  Error Count: ${data.errorCount || 0}`);
    }
    console.log('');

  } catch (error) {
    console.error('Error verifying recovery:', error.message);
  }

  console.log('================== RECOVERY COMPLETE ==================\n');
  console.log('🎯 Next Steps:\n');
  console.log('1. Wait 5 minutes for workers to pick up new tasks');
  console.log('2. Run: NODE_PATH=./node_modules node pipeline_diagnosis.js');
  console.log('3. Check Firestore console for new drafts in sentinel_drafts');
  console.log('4. Monitor functions logs: firebase functions:log\n');
  console.log('📋 Configuration Needed:\n');
  console.log('⚠️  Ensure functions/.env has valid API keys:');
  console.log('   GEMINI_API_KEY=<your-key>');
  console.log('   GROQAI_API_KEY=<your-key>');
  console.log('   OPENAI_API_KEY=<your-key>');
  console.log('   CEREBRAS_API_KEY=<your-key>\n');
  console.log('💡 Tip: Get API keys from:');
  console.log('   - Gemini: https://aistudio.google.com/app/apikey');
  console.log('   - GROQ: https://console.groq.com/keys');
  console.log('   - OpenAI: https://platform.openai.com/api-keys');
  console.log('   - Cerebras: https://console.cerebras.ai/\n');

  process.exit(0);
}

recoverPipeline().catch(err => {
  console.error('RECOVERY ERROR:', err);
  process.exit(1);
});
