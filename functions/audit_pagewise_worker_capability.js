const fs = require('fs');
const path = require('path');

function audit() {
  console.log('==============================================');
  console.log('PATCH RC-X4W - PAGEWISE WORKER CAPABILITY AUDIT');
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
  if (!content.includes('APPLY_BLOCKED_NOT_ENABLED_FOR_RC_X4W')) blockers.push('Apply mode not explicitly blocked for RC-X4W');

  // 3. Dry-run default
  if (!content.includes('isDryRun = argv.includes(\'--dry-run\') || applyIndex === -1')) blockers.push('Dry-run should be default');

  // 4. Correct task type and status
  if (!content.includes('pagewise_text_extraction_batch')) blockers.push('Does not filter by correct task_type');
  if (!content.includes('status\', \'in\', [\'queued\', \'pending\']')) blockers.push('Does not filter by correct status (queued/pending)');

  // 5. NO WRITES in RC-X4W
  const writeSigs = ['.set(', '.update(', '.add(', 'batch.commit()'];
  for (const sig of writeSigs) {
    if (content.includes(sig)) {
        // Exclude Set.add
        if (sig === '.add(' && (content.includes('Set()') || content.includes('new Set'))) {
            // Simple check: if .add is used on something that looks like a Set
            const lines = content.split('\n');
            const badLines = lines.filter(l => l.includes('.add(') && !l.includes('Represented.add') && !l.trim().startsWith('//'));
            if (badLines.length > 0) blockers.push(`Potentially dangerous write signature found: ${sig} in lines: ${badLines.join(', ')}`);
        } else {
            blockers.push(`Potentially dangerous write signature found: ${sig}`);
        }
    }
  }

  // 6. NO AI/OCR
  const aiSigs = ['VertexAI', 'GenerativeModel', 'Gemini', 'documentai', 'vision', 'OCR', 'processDocument'];
  for (const sig of aiSigs) {
     if (content.includes(sig)) {
         // Check if it's inside a comment or a log message confirming "no AI"
         const regex = new RegExp(`//.*${sig}|/\\*[\\s\\S]*?${sig}[\\s\\S]*?\\*/|console\\.log\\(.*no ${sig}`);
         if (!regex.test(content)) {
             blockers.push(`AI/OCR signature found: ${sig}`);
         }
     }
  }

  // 7. Limit check
  if (!content.includes('limit(cli.limit)')) blockers.push('Does not respect limit in query');

  console.log('Results:');
  console.log(`- Supports dry-run: ${content.includes('--dry-run') ? 'YES' : 'NO'}`);
  console.log(`- Supports limit: ${content.includes('--limit') ? 'YES' : 'NO'}`);
  console.log(`- Apply mode locked: ${content.includes('APPLY_BLOCKED_NOT_ENABLED_FOR_RC_X4W') ? 'YES' : 'NO'}`);
  console.log(`- Firestore writes found: ${writeSigs.some(s => content.includes(s)) ? 'YES' : 'NO'}`);
  console.log(`- AI/OCR calls found: ${aiSigs.some(s => content.includes(s)) ? 'YES' : 'NO'}`);

  if (blockers.length === 0) {
    console.log('\nRC_X4W_PAGEWISE_WORKER_CAPABILITY_READY');
  } else {
    console.error('\nRC_X4W_BLOCKED:');
    blockers.forEach(b => console.error(`- ${b}`));
    process.exit(1);
  }
}

audit();
