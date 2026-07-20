const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({projectId: 'rankcrackers-55'});
const db = admin.firestore();

async function main() {
    const tasks = await db.collection('ai_queue').where('task_type', '==', 'pagewise_text_extraction_batch').get();
    let latestTask = 0;
    tasks.forEach(d => {
        const t = d.updateTime.toMillis();
        if (t > latestTask) latestTask = t;
    });

    const pages = await db.collectionGroup('page_extractions').get();
    let latestPage = 0;
    pages.forEach(d => {
        const t = d.updateTime.toMillis();
        if (t > latestPage) latestPage = t;
    });

    const sandbox = await db.collection('system_verification_sandbox').get();
    let latestSandbox = 0;
    sandbox.forEach(d => {
        const t = d.updateTime.toMillis();
        if (t > latestSandbox) latestSandbox = t;
    });

    console.log(JSON.stringify({
        latestTask: new Date(latestTask).toISOString(),
        latestPage: new Date(latestPage).toISOString(),
        latestSandbox: new Date(latestSandbox).toISOString(),
        timestamp: new Date().toISOString()
    }, null, 2));
    process.exit(0);
}

main();
