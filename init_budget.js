#!/usr/bin/env node
/**
 * INITIALIZE BUDGET SYSTEM
 * Creates the missing system_budget document in Firestore
 */

const admin = require('firebase-admin');

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

async function initializeBudget() {
  console.log('🔄 Initializing system_budget...\n');

  const budgetRef = db.collection('system_budget').doc('current');
  
  const budgetData = {
    tokensUsedThisMonth: 0,
    monthlyTokenLimit: 1000000,
    aiEnabled: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    metadata: {
      version: '1.0',
      purpose: 'Control AI processing budget and feature gates'
    }
  };

  try {
    await budgetRef.set(budgetData);
    console.log('✅ Budget document created successfully\n');
    console.log('Document path: system_budget/current');
    console.log('Contents:');
    console.log(`  - tokensUsedThisMonth: 0`);
    console.log(`  - monthlyTokenLimit: 1,000,000`);
    console.log(`  - aiEnabled: true`);
    console.log('\n✨ Workers should now process tasks normally.\n');
  } catch (err) {
    console.error('❌ Failed to create budget document:', err.message);
    process.exit(1);
  }

  process.exit(0);
}

initializeBudget();
