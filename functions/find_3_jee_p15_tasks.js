const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({projectId: 'rankcrackers-55'});
const db = admin.firestore();

async function main() {
    const s = await db.collection('ai_queue')
        .where('mission_id', '==', 'jee_main_2026')
        .where('status', 'in', ['queued', 'pending'])
        .limit(3)
        .get();

    console.log(`Found ${s.size} pending tasks for JEE`);
    s.forEach(d => {
        const data = d.data();
        console.log(`| ${d.id} | ${data.document_id} | ${data.page_start}-${data.page_end} | ${data.status} |`);
    });
}
main();
