const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const cp = require('child_process');

const PROJECT_ID = 'rankcrackers-55';
const MISSION_ID = 'ssc_cgl';
const ASSEMBLY_VERSION = 'ssc_cgl_digibook_pedagogy_v1';
const TAXONOMY_VERSION = 'ssc_cgl_taxonomy_verifier_v1';

async function main() {
  const token = cp.execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
  const auth = new OAuth2Client();
  auth.setCredentials({ access_token: token });
  const db = new Firestore({ projectId: PROJECT_ID, authClient: auth });
  const realm = db.collection('mission_realms').doc(MISSION_ID);
  const [nodes, units, subjects, manifest] = await Promise.all([
    db.collection('micro_nodes').where('missionId', '==', MISSION_ID).where('decompositionVersion', '==', TAXONOMY_VERSION).get(),
    realm.collection('digibook_units').get(),
    realm.collection('digibook_subjects').get(),
    realm.collection('digibook_assemblies').doc(ASSEMBLY_VERSION).get(),
  ]);
  const unitsByNode = new Map();
  for (const doc of units.docs) {
    const data = doc.data() || {};
    const nodeId = data.nodeId || (doc.id.startsWith('digi_') ? doc.id.slice(5) : '');
    if (nodeId) unitsByNode.set(nodeId, data);
  }
  const invalid = [];
  const subjectCounts = {};
  let microTopicCount = 0;
  let atomicTopicCount = 0;
  for (const nodeDoc of nodes.docs) {
    const node = nodeDoc.data() || {};
    const unit = unitsByNode.get(nodeDoc.id);
    const assembly = unit?.assembly;
    const hierarchy = node.syllabusHierarchy || {};
    const micro = Array.isArray(hierarchy.microTopics) ? hierarchy.microTopics : [];
    const atomic = Array.isArray(hierarchy.atomicTopics) ? hierarchy.atomicTopics : [];
    const subject = assembly?.officialHierarchy?.subject || hierarchy.subject || '';
    const valid = Boolean(unit && assembly && assembly.assemblyVersion === ASSEMBLY_VERSION && assembly.sourceBound === true && assembly.contentReadiness?.noSyntheticContent === true && assembly.taxonomyVersion === TAXONOMY_VERSION && assembly.derivedTaxonomy?.microTopicCount === micro.length && assembly.derivedTaxonomy?.atomicTopicCount === atomic.length && Array.isArray(assembly.pedagogy?.progression) && assembly.pedagogy.progression.length === 5);
    if (!valid) invalid.push({ nodeId: nodeDoc.id, subject, hasUnit: Boolean(unit), assemblyVersion: assembly?.assemblyVersion || null, micro: micro.length, atomic: atomic.length });
    microTopicCount += micro.length;
    atomicTopicCount += atomic.length;
    subjectCounts[subject] ||= { topicCount: 0, microTopicCount: 0, atomicTopicCount: 0 };
    subjectCounts[subject].topicCount += 1;
    subjectCounts[subject].microTopicCount += micro.length;
    subjectCounts[subject].atomicTopicCount += atomic.length;
  }
  const result = {
    missionId: MISSION_ID,
    assemblyVersion: ASSEMBLY_VERSION,
    manifestPresent: manifest.exists,
    canonicalTopics: nodes.size,
    assembledTopics: nodes.size - invalid.length,
    invalidTopics: invalid.length,
    microTopicCount,
    atomicTopicCount,
    subjectCount: subjects.size,
    subjectCounts,
    invalidSample: invalid.slice(0, 10),
  };
  console.log(JSON.stringify(result, null, 2));
  if (!manifest.exists || invalid.length > 0 || subjects.size !== 4 || nodes.size !== 82) process.exitCode = 2;
}

main().catch((error) => { console.error(error); process.exit(1); });
