const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
if (!emulatorHost) {
  throw new Error('FIRESTORE_EMULATOR_HOST is required. Refusing to seed without emulator.');
}

const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'rankcrackers-55';
admin.initializeApp({ projectId });

const db = admin.firestore();
const repoRoot = path.resolve(__dirname, '..');
const fixturePath = path.join(
  repoRoot,
  'assets',
  'data',
  'emulator',
  'founder_mission_exact_production_inventory_20260811065513.json',
);
const outPath = path.join(
  repoRoot,
  'docs',
  'patch_safety',
  'student_journey_fix4_r4e_r3_samsung_mission_dashboard_20260812_113800',
  'admin_emulator_seed_result.json',
);

const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

async function main() {
  const written = [];
  for (const mission of fixture.missions) {
    const id = String(mission.realmId);
    await db.collection('student_mission_catalog').doc(id).set({
      missionId: String(mission.missionId),
      realmId: String(mission.realmId),
      displayName: String(mission.displayName),
      title: String(mission.title),
      name: String(mission.displayName),
      year: Number(mission.year),
      status: String(mission.status),
      userPanelVisible: Boolean(mission.userPanelVisible),
      cardVisible: Boolean(mission.cardVisible),
      archived: false,
      source: 'ONE_TIME_PRODUCTION_EXPORT_DERIVED',
      environment: 'EMULATOR_ONLY',
      sourceEvidence: 'docs/patch_safety/FOUNDER_MISSION_EXACT_PRODUCTION_INVENTORY_20260811065513.json',
      categoryStatus: 'FOUNDER_MISSION_CATEGORY_MAPPING_REQUIRED',
      state: 'Central',
    }, { merge: false });
    written.push(id);
  }

  const snap = await db.collection('student_mission_catalog').get();
  const docs = snap.docs.map((doc) => ({
    id: doc.id,
    displayName: doc.get('displayName'),
    status: doc.get('status'),
    category: doc.get('category') ?? null,
    categoryStatus: doc.get('categoryStatus') ?? null,
    userPanelVisible: doc.get('userPanelVisible'),
    cardVisible: doc.get('cardVisible'),
    archived: doc.get('archived'),
  }));

  const result = {
    emulatorHost,
    projectId,
    source: 'ONE_TIME_PRODUCTION_EXPORT_DERIVED',
    environment: 'EMULATOR_ONLY',
    productionWrite: false,
    written,
    readBackCount: docs.length,
    docs,
  };
  fs.writeFileSync(outPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
