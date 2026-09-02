const { parseArgs } = require('./process_pagewise_extraction_batches');

function test(name, args) {
    console.log(`\n--- ${name} ---`);
    console.log(`Input: ${args.join(' ')}`);
    const cli = parseArgs(args);
    console.log(`Parsed cli.missionId: "${cli.missionId}"`);
    console.log(`Parsed cli.documentId: "${cli.documentId}"`);
    console.log(`Parsed cli.taskId: "${cli.taskId}"`);
    console.log(`Parsed cli.limit: ${cli.limit}`);
    return cli;
}

// P01-CLOSE-T01: Space separated
test('T01: Space separated', ['--apply', 'CONFIRM_PROCESS_PAGEWISE_EXTRACTION', '--mission-id', 'neet_(ug)-2027', '--document-id', 'hash_TARGET', '--limit', '3']);

// P01-CLOSE-T02: Equals separated
test('T02: Equals separated', ['--apply', 'CONFIRM_PROCESS_PAGEWISE_EXTRACTION', '--mission-id=neet_(ug)-2027', '--document-id=hash_TARGET', '--limit=3']);

// P01-CLOSE-T03: APPLY without taskId and without mission/document
test('T03: Apply no scope', ['--apply', 'CONFIRM_PROCESS_PAGEWISE_EXTRACTION', '--limit', '3']);

// P01-CLOSE-T04: Mission only, no document
test('T04: Mission only', ['--apply', 'CONFIRM_PROCESS_PAGEWISE_EXTRACTION', '--mission-id', 'neet_(ug)-2027', '--limit', '3']);

// P01-CLOSE-T05: Document only, no mission
test('T05: Document only', ['--apply', 'CONFIRM_PROCESS_PAGEWISE_EXTRACTION', '--document-id', 'hash_TARGET', '--limit', '3']);

// P01-CLOSE-T06: Explicit task path
test('T06: Explicit task', ['--apply', 'CONFIRM_PROCESS_PAGEWISE_EXTRACTION', '--task-id', 'X', '--limit', '1']);

// P01-CLOSE-T07: Explicit task + limit 2
test('T07: Explicit task limit 2', ['--apply', 'CONFIRM_PROCESS_PAGEWISE_EXTRACTION', '--task-id', 'X', '--limit', '2']);
