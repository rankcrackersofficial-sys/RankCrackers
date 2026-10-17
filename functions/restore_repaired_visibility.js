const admin = require('firebase-admin');
if (admin.apps.length === 0) admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: 'rankcrackers-55' });
const ref = admin.firestore().collection('mission_realms').doc('ssc_cgl');
ref.get().then(async (snap) => {
  const current = snap.data() || {};
  const gate = current.visibilityGate || {};
  await ref.set({
    studentVisible: true,
    catalogVisible: true,
    userPanelVisible: true,
    cardVisible: true,
    catalogDiscoverable: true,
    studentPublicationState: 'AVAILABLE',
    visibilityGate: { ...gate, studentVisible: true, catalogVisible: true, userPanelVisible: true, cardVisible: true, gateStatus: 'ACTIVE' },
    automatedRepair: { ...(current.automatedRepair || {}), visibilityNormalizedAt: admin.firestore.FieldValue.serverTimestamp() },
    updated_at: new Date().toISOString(),
  }, { merge: true });
  console.log(JSON.stringify({ restored: true }));
}).catch((e) => { console.error(e.stack || e.message || e); process.exitCode = 1; });
