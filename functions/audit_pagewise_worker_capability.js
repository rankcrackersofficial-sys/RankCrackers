const fs = require('fs');
const path = require('path');

function audit() {
  console.log('==============================================');
  console.log('PATCH RC-X4E-R11 - PAGEWISE WORKER CAPABILITY AUDIT');
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
  if (content.includes('APPLY_BLOCKED_NOT_ENABLED_FOR_RC_X4W')) {
      // Must be removed for RC-X4E-P1
      blockers.push('Apply mode still explicitly blocked with RC-X4W message');
  }

  // 3. Dry-run default
  if (!content.includes('isDryRun = argv.includes(\'--dry-run\') || applyIndex === -1')) blockers.push('Dry-run should be default');

  // 4. Correct task type and status
  if (!content.includes('pagewise_text_extraction_batch')) blockers.push('Does not filter by correct task_type');
  if (!content.includes('status\', \'in\', [\'queued\', \'pending\']')) blockers.push('Does not filter by correct status (queued/pending)');

  if (content.includes('.limit(cli.limit)') && content.includes('allActiveTasks')) {
      blockers.push('Main query should not have .limit() when counting total active tasks');
  }
  if (!content.includes('allActiveTasks.length')) blockers.push('Missing total active tasks count logic');
  if (!content.includes('selectedTasks.length >= cli.limit')) blockers.push('Missing in-memory selection by limit');
  if (!content.includes('Total active pagewise tasks found')) blockers.push('Missing logging for total active tasks');
  if (!content.includes('Tasks selected by limit/selector')) blockers.push('Missing logging for selected tasks count');
  if (!content.includes('task limit is not page limit')) blockers.push('Missing task limit policy logging');

  // 5. WRITES in RC-X4E-P1 (Limited to ai_queue and page_extractions)
  const writeSigs = ['.set(', '.update(', '.add(', 'batch.commit()'];
  for (const sig of writeSigs) {
    if (content.includes(sig)) {
        const lines = content.split('\n');
        const badLines = lines.filter(l => {
            if (!l.includes(sig) || l.trim().startsWith('//')) return false;
            // Exclude Set.add
            if (sig === '.add(' && (l.includes('Represented.add') || l.includes('Set'))) return false;
            // Allowed writes: ai_queue update, page_extractions batch.set, batch.commit
            if (l.includes('db.collection(\'ai_queue\').doc(task.id).update')) return false;
            if (l.includes('batch.set(extractionRef')) return false;
            if (l.includes('batch.update(taskRef')) return false;
            if (l.includes('await batch.commit()')) return false;
            return true;
        });
        if (badLines.length > 0) blockers.push(`Potentially dangerous write signature found: ${sig} in lines: ${badLines.map(l => l.trim()).join(', ')}`);
    }
  }

  // 6. NO AI/OCR
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

  console.log(`- Supports limit: ${content.includes('--limit') ? 'YES' : 'NO'}`);
  console.log(`- Apply mode enabled: ${!content.includes('APPLY_BLOCKED_NOT_ENABLED_FOR_RC_X4W') ? 'YES' : 'NO'}`);
  console.log(`- Firestore writes found: ${writeSigs.some(s => content.includes(s)) ? 'YES' : 'NO'}`);
  console.log(`- AI/OCR calls found: ${aiSigs.some(s => content.includes(s)) ? 'YES' : 'NO'}`);

  if (blockers.length === 0) {
    console.log('\nRC_X4E_R11_PAGEWISE_WORKER_CAPABILITY_READY');
  } else {
    console.error('\nRC_X4E_R11_BLOCKED:');
    blockers.forEach(b => console.error(`- ${b}`));
    process.exit(1);
  }
}

audit();
