const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({projectId: 'rankcrackers-55'});
const db = admin.firestore();
async function main() {
    const pages = await db.collection('mission_realms').doc('neet_(ug)-2027').collection('official_documents').doc('hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925').collection('page_extractions').get();
    console.log('Page Extractions: ' + pages.size);
    if (pages.size === 9) console.log('RC_X4E_P15_AUTHORIZED_APPLY_RESULT_READY');
    else process.exit(1);
}
main().catch(e => { console.error(e); process.exit(1); });
