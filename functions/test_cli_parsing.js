const { parseArgs } = require('./process_pagewise_extraction_batches');

function test(args) {
    console.log(`Testing args: ${args.join(' ')}`);
    const cli = parseArgs(args);
    console.log(`Parsed cli.missionId: ${cli.missionId}`);
    console.log(`Parsed cli.documentId: ${cli.documentId}`);
    console.log(`Parsed cli.taskId: ${cli.taskId}`);
    console.log(`Parsed cli.limit: ${cli.limit}`);
}

console.log('--- T01: Space separated ---');
test(['--mission-id', 'neet_(ug)-2027', '--document-id', 'hash_TARGET', '--limit', '3']);

console.log('\n--- T02: Equals separated ---');
test(['--mission-id=neet_(ug)-2027', '--document-id=hash_TARGET', '--limit=3']);
