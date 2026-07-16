const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'rankcrackers-55';

async function audit() {
  console.log('==============================================');
  console.log('PATCH RC-X4E-R11 - PAGEWISE APPLY CAPABILITY AUDIT');
  console.log('==============================================');

  const runtimeAuditPath = path.join(__dirname, 'audit_pagewise_worker_runtime_safety.js');
  const blockers = [];

  if (fs.existsSync(runtimeAuditPath)) {
    const content = fs.readFileSync(runtimeAuditPath, 'utf8');
    const mixedSigs = ['@google-cloud' + '/firestore', 'google-auth' + '-library', 'new Fire' + 'store(', 'auth' + 'Client', 'OAuth2' + 'Client'];
    for (const sig of mixedSigs) {
      if (content.includes(sig)) {
        blockers.push(`Runtime audit file contains prohibited mixed SDK signature: ${sig}`);
      }
    }
  }

  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  const db = admin.firestore();

  const syllabusDocId = 'hash_7cad9da2a12065444828f744bd9f1a93a2dd0d9bd54c32a6d92d94a769e4f905';
  const peSnap = await db.collection('mission_realms').doc('jee_main_2026').collection('official_documents').doc(syllabusDocId).collection('page_extractions').get();

  if (peSnap.size === 0) {
    blockers.push('No page extraction records found for JEE syllabus. Extraction likely failed or not committed.');
  } else {
    const pages = peSnap.docs.map(d => d.data());
    const invalidSchema = pages.filter(p => !p.extraction_text || p.extraction_status !== 'extracted_draft');
    if (invalidSchema.length > 0) {
      blockers.push(`Found ${invalidSchema.length} records with invalid schema in JEE syllabus.`);
      console.error('RC_X4E_R2_PAGE_EXTRACTION_RECORD_INVALID');
    }

    pages.sort((a, b) => a.page_number - b.page_number);
    const pNums = pages.map(p => p.page_number);
    for (let i = 1; i <= 17; i++) {
        if (!pNums.includes(i)) {
            blockers.push(`Missing page ${i} in JEE syllabus extraction sequence.`);
            console.error('RC_X4E_R3_PAGE_SEQUENCE_OR_LINKAGE_INVALID');
        }
    }
  }

  if (blockers.length === 0) {
    console.log('\nRC_X4E_R11_PAGEWISE_APPLY_CAPABILITY_READY');
  } else {
    console.error('\nRC_X4E_R11_PAGEWISE_APPLY_CAPABILITY_BLOCKED:');
    blockers.forEach(b => console.error(`- ${b}`));
    process.exit(1);
  }
}

audit().catch(e => {
  console.error(e);
  process.exit(1);
});
