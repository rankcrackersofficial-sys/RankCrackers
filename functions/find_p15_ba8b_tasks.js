const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({projectId: 'rankcrackers-55'});
const db = admin.firestore();

async function main() {
    const DOC_ID = 'hash_ba8b5256533e0a29e2eb71df3e322885335219d48259f4083365662f5ad7933b';
    const s = await db.collection('ai_queue')
        .where('document_id', '==', DOC_ID)
        .where('status', 'in', ['queued', 'pending'])
        .get();

    console.log(`Found ${s.size} pending tasks for BA8B`);
    s.forEach(d => {
        console.log(`| ${d.id} | ${d.data().page_start}-${d.data().page_end} | ${d.data().status} |`);
    });
}
main();
