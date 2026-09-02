const admin = require('firebase-admin');

// Set environment for emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

if (admin.apps.length === 0) {
    admin.initializeApp({ projectId: 'rankcrackers-55' });
}

const db = admin.firestore();

async function testFutureMission() {
    console.log('=== TESTING ORCHESTRATOR FIXTURE: future_exam_2099 ===');

    const missionId = 'future_exam_2099';
    const sourceSha = 'sha256_mock_future_exam_2099';
    const docId = `hash_${sourceSha}`;

    const docPath = `mission_realms/${missionId}/official_documents/${docId}`;

    console.log(`1. Simulating document registration: ${docPath}`);
    await db.doc(docPath).set({
        missionId,
        id: docId,
        sourceSha256: sourceSha,
        storagePath: `gs://bucket/syllabus/${sourceSha}.pdf`,
        documentType: 'syllabus',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('Waiting for SyllabusIngestionOrchestrator (onCreate)...');
    // In real emulator this would trigger automatically.
    // Here we might need to wait or check ai_queue.

    await new Promise(resolve => setTimeout(resolve, 3000));

    const taskSnap = await db.collection('ai_queue').where('mission_id', '==', missionId).get();
    console.log(`AI Queue Tasks for ${missionId}: ${taskSnap.size}`);
    taskSnap.forEach(t => console.log(`  - Task: ${t.id}, Type: ${t.data().task_type}`));

    const pageCountTask = taskSnap.docs.find(t => t.data().task_type === 'page_count_detection');
    if (pageCountTask) {
        console.log('2. Simulating Page Count Completion...');
        await pageCountTask.ref.update({
            status: 'completed',
            detected_page_count: 10,
            completedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // This should trigger syllabusLifecycleWorker (onUpdate)
        await new Promise(resolve => setTimeout(resolve, 3000));

        const nextTasks = await db.collection('ai_queue').where('mission_id', '==', missionId).get();
        console.log(`Updated AI Queue size: ${nextTasks.size}`);
        nextTasks.forEach(t => console.log(`  - Task: ${t.id}, Type: ${t.data().task_type}`));
    } else {
        console.error('FAIL: Page count task not created.');
    }

    process.exit(0);
}

testFutureMission().catch(err => {
    console.error(err);
    process.exit(1);
});
