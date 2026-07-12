const fs = require('fs');
const path = require('path');

function audit() {
  console.log('==============================================');
  console.log('PATCH RC-X4E-P1-FIX1 - PAGEWISE APPLY CAPABILITY AUDIT');
  console.log('==============================================');

  const workerPath = path.join(__dirname, 'process_pagewise_extraction_batches.js');
  if (!fs.existsSync(workerPath)) {
    console.error('BLOCKER: process_pagewise_extraction_batches.js missing');
    process.exit(1);
  }

  const content = fs.readFileSync(workerPath, 'utf8');
  const blockers = [];

  // 1. Supports --dry-run and --limit
  if (!content.includes('--dry-run')) blockers.push('Missing --dry-run support');
  if (!content.includes('--limit')) blockers.push('Missing --limit support');

  // 2. Apply locked
  if (!content.includes('CONFIRM_PROCESS_PAGEWISE_EXTRACTION')) blockers.push('Apply mode not locked with confirmation phrase');
  if (!content.includes('cli.limit !== 1')) blockers.push('Apply mode must be locked to limit 1');

  // 3. Mapping: uses pData.num, no pageIndex
  if (!content.includes('pData.num')) blockers.push('Missing pData.num mapping for pdf-parse v2');
  if (content.includes('pData.pageIndex')) blockers.push('Must not use pData.pageIndex for pdf-parse v2');

  // 4. Empty Text Safety
  if (!content.includes('NATIVE_TEXT_EXTRACTION_EMPTY_OR_UNSUPPORTED')) blockers.push('Missing empty text extraction safety');
  if (!content.includes('emptyPages.length > 0')) blockers.push('Missing empty page check logic');

  // 5. Duplicate Check
  if (!content.includes('PAGE_EXTRACTION_ALREADY_EXISTS')) blockers.push('Missing duplicate page_extraction check');
  if (!content.includes('existing.exists')) blockers.push('Missing existing record existence check');

  // 6. Block Partial Writes
  if (!content.includes('batch.commit()')) blockers.push('Missing batch commit for atomic writes');
  if (content.includes('db.collection(\'page_extractions\').add')) blockers.push('Should use batch.set for page_extractions');

  // 7. Allowed Writes
  const writeSigs = ['.set(', '.update(', '.add(', 'batch.commit()'];
  for (const sig of writeSigs) {
    if (content.includes(sig)) {
        const lines = content.split('\n');
        const badLines = lines.filter(l => {
            if (!l.includes(sig) || l.trim().startsWith('//')) return false;
            if (sig === '.add(' && (l.includes('Represented.add') || l.includes('Set'))) return false;
            if (l.includes('db.collection(\'ai_queue\').doc(task.id).update')) return false;
            if (l.includes('batch.set(extractionRef')) return false;
            if (l.includes('batch.update(taskRef')) return false;
            if (l.includes('await batch.commit()')) return false;
            return true;
        });
        if (badLines.length > 0) blockers.push(`Potentially dangerous write signature found: ${sig} in lines: ${badLines.map(l => l.trim()).join(', ')}`);
    }
  }

  // 8. NO AI/OCR
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
         if (badLines.length > 0) blockers.push(`AI/OCR signature found: ${sig} in lines: ${badLines.map(l => l.trim()).join(', ')}`);
     }
  }

  console.log(`- pdf-parse v2 mapping (pData.num): ${content.includes('pData.num') ? 'YES' : 'NO'}`);
  console.log(`- Empty text safety: ${content.includes('NATIVE_TEXT_EXTRACTION_EMPTY_OR_UNSUPPORTED') ? 'YES' : 'NO'}`);
  console.log(`- Duplicate check: ${content.includes('PAGE_EXTRACTION_ALREADY_EXISTS') ? 'YES' : 'NO'}`);
  console.log(`- Apply limit lock: ${content.includes('cli.limit !== 1') ? 'YES' : 'NO'}`);

  if (blockers.length === 0) {
    console.log('\nRC_X4E_P1_FIX1_PAGEWISE_APPLY_CAPABILITY_READY');
  } else {
    console.error('\nRC_X4E_P1_FIX1_BLOCKED:');
    blockers.forEach(b => console.error(`- ${b}`));
    process.exit(1);
  }
}

audit();
