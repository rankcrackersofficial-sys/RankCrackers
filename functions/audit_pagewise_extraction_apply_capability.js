const fs = require('fs');
const path = require('path');

function audit() {
  console.log('==============================================');
  console.log('PATCH RC-X4E-P1 - APPLY CAPABILITY AUDIT');
  console.log('==============================================');

  const workerPath = path.join(__dirname, 'process_pagewise_extraction_batches.js');
  if (!fs.existsSync(workerPath)) {
    console.error('BLOCKER: process_pagewise_extraction_batches.js missing');
    process.exit(1);
  }

  const content = fs.readFileSync(workerPath, 'utf8');
  const blockers = [];

  // 1. apply requires CONFIRM_PROCESS_PAGEWISE_EXTRACTION
  if (!content.includes('CONFIRM_PROCESS_PAGEWISE_EXTRACTION')) blockers.push('Missing apply confirmation phrase');

  // 2. RC-X4E-P1 apply limit lock exists: limit must be exactly 1
  if (!content.includes('if (cli.isApplyMode && cli.limit !== 1)')) {
      blockers.push('Missing strict apply limit lock for RC-X4E-P1 (must be 1)');
  }

  // 3. no Vertex/Gemini/DocumentAI/CloudVision/OCR calls
  const aiSigs = ['VertexAI', 'GenerativeModel', 'Gemini', 'documentai', 'vision', 'OCR', 'processDocument'];
  for (const sig of aiSigs) {
     if (content.includes(sig)) {
         const lines = content.split('\n');
         const badLines = lines.filter(l => {
             if (!l.includes(sig)) return false;
             if (l.trim().startsWith('//') || l.includes('/*') || l.includes('*/')) return false;
             if (l.includes(`no ${sig}`)) return false;
             return true;
         });
         if (badLines.length > 0) blockers.push(`AI/OCR signature found: ${sig}`);
     }
  }

  // 4. page_extractions include specific fields
  if (!content.includes('extraction_status: \'extracted_draft\'')) blockers.push('Missing extracted_draft status');
  if (!content.includes('review_status: \'pending_founder_verification\'')) blockers.push('Missing pending review status');
  if (!content.includes('extraction_method: \'native_pdf_text\'')) blockers.push('Missing native extraction method');
  if (!content.includes('source_proof:')) blockers.push('Missing source_proof field');

  // 5. AUTO_DETECT publish block fields exist
  if (!content.includes('publish_blocked_until_founder_mission_assignment = true')) {
      blockers.push('Missing AUTO_DETECT publish block logic');
  }

  if (blockers.length === 0) {
    console.log('\nRC_X4E_P1_APPLY_CAPABILITY_READY');
  } else {
    console.error('\nRC_X4E_P1_APPLY_CAPABILITY_BLOCKED:');
    blockers.forEach(b => console.error(`- ${b}`));
    process.exit(1);
  }
}

audit();
