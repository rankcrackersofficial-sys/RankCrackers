const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const cp = require('child_process');

const PROJECT_ID = 'rankcrackers-55';
const MISSION_ID = 'ssc_cgl';
const ASSEMBLY_VERSION = 'ssc_cgl_digibook_pedagogy_v1';
const TAXONOMY_VERSION = 'ssc_cgl_taxonomy_verifier_v1';
const SOURCE_DOCUMENT_ID = 'syllabus_3ab83ad80406b7a7c3d51a40da404c722ee8921b816244b061ea35f7588fc78f';
const SOURCE_SHA256 = '3ab83ad80406b7a7c3d51a40da404c722ee8921b816244b061ea35f7588fc78f';

const SUBJECT_PROFILES = {
  'Quantitative Aptitude': {
    learningModel: 'concept_method_practice',
    progression: ['Basic Identity', 'Concept and Formula Map', 'Guided Application', 'Timed Retrieval', 'Spaced Revision'],
    focus: 'Build a method first, then apply it with increasing retrieval pressure.',
  },
  Reasoning: {
    learningModel: 'pattern_rule_application',
    progression: ['Pattern Identity', 'Rule Extraction', 'Worked Pattern', 'Timed Retrieval', 'Spaced Revision'],
    focus: 'Recognise the pattern, state the rule, then practise clean application.',
  },
  'General Awareness': {
    learningModel: 'context_fact_linkage',
    progression: ['Context Identity', 'Verified Fact Set', 'Linkage Map', 'Retrieval Check', 'Spaced Revision'],
    focus: 'Keep facts source-bound and connect them to a memorable context before recall.',
  },
  English: {
    learningModel: 'rule_usage_error_correction',
    progression: ['Rule Identity', 'Usage and Meaning', 'Guided Examples', 'Error Retrieval', 'Spaced Revision'],
    focus: 'Move from rule recognition to usage, correction and repeated retrieval.',
  },
};

function canonicalSubject(value) {
  const subject = String(value || '').trim();
  if (subject === 'English Comprehension') return 'English';
  if (subject === 'General Intelligence' || subject === 'General Intelligence & Reasoning' || subject === 'Reasoning and General Intelligence') return 'Reasoning';
  if (subject === 'GA') return 'General Awareness';
  return subject;
}

function availableSections(unit) {
  const sections = ['basic_identity', 'official_syllabus_context', 'micro_topic_map', 'atomic_topic_map'];
  if (String(unit.definition || '').trim() || String(unit.explanation || '').trim()) sections.push('concept_explanation');
  if (Array.isArray(unit.examples) && unit.examples.length > 0) sections.push('guided_examples');
  if (Number(unit.pyq_count || 0) > 0) sections.push('verified_pyq_linkage');
  return sections;
}

function buildAssembly(node, unit) {
  const hierarchy = node.syllabusHierarchy || {};
  const subject = canonicalSubject(hierarchy.subject || node.subjectId || node.subject);
  const profile = SUBJECT_PROFILES[subject];
  if (!profile) throw new Error(`DIGIBOOK_SUBJECT_PROFILE_MISSING:${subject}`);
  const microTopics = Array.isArray(hierarchy.microTopics) ? hierarchy.microTopics : [];
  const atomicTopics = Array.isArray(hierarchy.atomicTopics) ? hierarchy.atomicTopics : [];
  if (hierarchy.verificationState !== 'VERIFIED' || hierarchy.publicationState !== 'STUDENT_READY' || hierarchy.notificationContamination !== false) {
    throw new Error(`DIGIBOOK_SOURCE_NOT_STUDENT_READY:${node.id}`);
  }
  if (!microTopics.length || !atomicTopics.length) throw new Error(`DIGIBOOK_TAXONOMY_EMPTY:${node.id}`);
  const sections = availableSections(unit);
  return {
    assemblyVersion: ASSEMBLY_VERSION,
    assemblyStatus: 'PEDAGOGY_ASSEMBLED',
    sourceBound: true,
    sourceDocumentId: SOURCE_DOCUMENT_ID,
    sourceSha256: SOURCE_SHA256,
    taxonomyVersion: TAXONOMY_VERSION,
    officialHierarchy: {
      subject,
      unit: hierarchy.unit || node.chapterId || node.unitId || '',
      topic: hierarchy.topic || node.title || '',
    },
    derivedTaxonomy: {
      microTopicCount: microTopics.length,
      atomicTopicCount: atomicTopics.length,
      microTopicIds: microTopics.map((x) => x.id),
      atomicTopicIds: atomicTopics.map((x) => x.id),
      provenance: 'bounded_expert_taxonomy_from_official_syllabus_scope',
      disclaimer: 'Micro and atomic entries are derived study taxonomy; they are not official SSC headings.',
    },
    pedagogy: {
      learningModel: profile.learningModel,
      progression: profile.progression,
      focus: profile.focus,
      freeSections: ['basic_identity', 'official_syllabus_context', 'micro_topic_map', 'atomic_topic_map', 'spaced_revision'],
      premiumSections: ['guided_application', 'deep_explanation', 'diagnostic_feedback'],
      premiumPolicy: 'Premium layers are shown only when verified content and entitlement are both available.',
    },
    contentReadiness: {
      availableSections: sections,
      pendingSections: ['guided_examples', 'diagnostic_feedback'].filter((section) => !sections.includes(section)),
      noSyntheticContent: true,
    },
    assembledAt: new Date().toISOString(),
  };
}

async function main() {
  const token = cp.execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
  const auth = new OAuth2Client();
  auth.setCredentials({ access_token: token });
  const db = new Firestore({ projectId: PROJECT_ID, authClient: auth });
  const realm = db.collection('mission_realms').doc(MISSION_ID);
  const nodesSnap = await db.collection('micro_nodes')
    .where('missionId', '==', MISSION_ID)
    .where('decompositionVersion', '==', TAXONOMY_VERSION)
    .get();
  if (nodesSnap.empty) throw new Error('DIGIBOOK_NO_VERIFIED_TAXONOMY_NODES');
  const unitSnap = await realm.collection('digibook_units').get();
  const unitsByNode = new Map();
  for (const doc of unitSnap.docs) {
    const data = doc.data() || {};
    const nodeId = data.nodeId || (doc.id.startsWith('digi_') ? doc.id.slice(5) : '');
    if (nodeId) unitsByNode.set(nodeId, { ref: doc.ref, data });
  }
  const subjectSummary = {};
  const batch = db.batch();
  let assembled = 0;
  for (const nodeDoc of nodesSnap.docs) {
    const unit = unitsByNode.get(nodeDoc.id);
    if (!unit) throw new Error(`DIGIBOOK_UNIT_MISSING:${nodeDoc.id}`);
    const assembly = buildAssembly({ id: nodeDoc.id, ...nodeDoc.data() }, unit.data);
    const subject = assembly.officialHierarchy.subject;
    subjectSummary[subject] ||= { topicCount: 0, microTopicCount: 0, atomicTopicCount: 0, unitIds: [] };
    subjectSummary[subject].topicCount += 1;
    subjectSummary[subject].microTopicCount += assembly.derivedTaxonomy.microTopicCount;
    subjectSummary[subject].atomicTopicCount += assembly.derivedTaxonomy.atomicTopicCount;
    subjectSummary[subject].unitIds.push(unit.ref.id);
    batch.set(unit.ref, {
      missionId: MISSION_ID,
      realm_id: MISSION_ID,
      canonicalMissionId: MISSION_ID,
      assembly,
      pedagogyProfile: SUBJECT_PROFILES[subject],
      updatedAt: new Date(),
    }, { merge: true });
    assembled += 1;
  }
  const subjectBatch = db.batch();
  for (const [subject, summary] of Object.entries(subjectSummary)) {
    subjectBatch.set(realm.collection('digibook_subjects').doc(subject.toLowerCase().replace(/[^a-z0-9]+/g, '_')), {
      missionId: MISSION_ID,
      subject,
      assemblyVersion: ASSEMBLY_VERSION,
      sourceDocumentId: SOURCE_DOCUMENT_ID,
      sourceSha256: SOURCE_SHA256,
      topicCount: summary.topicCount,
      microTopicCount: summary.microTopicCount,
      atomicTopicCount: summary.atomicTopicCount,
      unitIds: summary.unitIds,
      pedagogyProfile: SUBJECT_PROFILES[subject],
      sourceBound: true,
      noSyntheticContent: true,
      updatedAt: new Date(),
    }, { merge: true });
  }
  subjectBatch.set(realm.collection('digibook_assemblies').doc(ASSEMBLY_VERSION), {
    missionId: MISSION_ID,
    assemblyVersion: ASSEMBLY_VERSION,
    taxonomyVersion: TAXONOMY_VERSION,
    sourceDocumentId: SOURCE_DOCUMENT_ID,
    sourceSha256: SOURCE_SHA256,
    subjectSummary,
    topicCount: assembled,
    status: 'COMPLETE',
    sourceBound: true,
    noSyntheticContent: true,
    updatedAt: new Date(),
  }, { merge: true });
  await batch.commit();
  await subjectBatch.commit();
  console.log(JSON.stringify({ status: 'COMPLETE', assemblyVersion: ASSEMBLY_VERSION, assembledTopics: assembled, subjectSummary }, null, 2));
}

main().catch((error) => { console.error(error); process.exit(1); });
