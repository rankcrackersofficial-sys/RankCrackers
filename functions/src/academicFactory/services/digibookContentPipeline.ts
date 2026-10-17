import * as admin from 'firebase-admin';
import { createHash } from 'crypto';
import { generateGemini } from '../../providers/geminiProvider';
import { AafJobMetadata } from '../models/aafJob';

if (admin.apps.length === 0) admin.initializeApp();

const db = admin.firestore();
const TAXONOMY_VERSION = 'ssc_cgl_taxonomy_verifier_v1';
const ASSEMBLY_VERSION = 'ssc_cgl_digibook_pedagogy_v1';

type Context = {
  nodeId: string;
  node: any;
  atom: any;
  sourceDocumentId: string;
  subject: string;
  pedagogy: any;
};

const pedagogy: Record<string, any> = {
  'Quantitative Aptitude': {
    model: 'concept_method_practice',
    progression: ['Identity', 'Concept and Formula Map', 'Guided Application', 'Timed Retrieval', 'Spaced Revision'],
    quality: 'Every explanation must show why a method works, then move from guided to independent application.',
  },
  Reasoning: {
    model: 'pattern_rule_application',
    progression: ['Pattern Identity', 'Rule Extraction', 'Worked Pattern', 'Timed Retrieval', 'Spaced Revision'],
    quality: 'Use pattern recognition and rule transfer; never present it as a mathematics lesson.',
  },
  'General Awareness': {
    model: 'context_fact_linkage',
    progression: ['Context Identity', 'Verified Fact Set', 'Linkage Map', 'Retrieval Check', 'Spaced Revision'],
    quality: 'Connect facts to time, place, institution and consequence; mark time-sensitive facts explicitly.',
  },
  English: {
    model: 'rule_usage_error_correction',
    progression: ['Rule Identity', 'Usage and Meaning', 'Guided Examples', 'Error Retrieval', 'Spaced Revision'],
    quality: 'Teach usage in context and contrast correct/incorrect forms; do not copy quantitative or factual pedagogy.',
  },
};

const pedagogyKey: Record<string, string> = {
  'English Comprehension': 'English',
  English: 'English',
  'General Intelligence & Reasoning': 'Reasoning',
  Reasoning: 'Reasoning',
  'Reasoning and General Intelligence': 'Reasoning',
  'General Awareness': 'General Awareness',
  'Quantitative Aptitude': 'Quantitative Aptitude',
};

function hash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function stripJson(text: string): any {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = (fenced?.[1] || text).trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('AI_JSON_OBJECT_NOT_FOUND');
  return JSON.parse(candidate.slice(start, end + 1));
}

async function loadContext(job: AafJobMetadata): Promise<Context> {
  const nodes = await db.collection('micro_nodes')
    .where('missionId', '==', job.missionId)
    .where('decompositionVersion', '==', TAXONOMY_VERSION)
    .get();
  for (const doc of nodes.docs) {
    const node = doc.data() || {};
    const hierarchy = node.syllabusHierarchy || {};
    const atom = (hierarchy.atomicTopics || []).find((item: any) => item.id === job.canonicalTargetId);
    if (!atom) continue;
    if (hierarchy.verificationState !== 'VERIFIED' || hierarchy.publicationState !== 'STUDENT_READY' || hierarchy.notificationContamination !== false) {
      throw new Error('SOURCE_HIERARCHY_NOT_STUDENT_READY');
    }
    const subject = String(atom.subject || hierarchy.subject || node.subjectId || '');
    const profile = pedagogy[pedagogyKey[subject] || subject];
    if (!profile) throw new Error(`UNSUPPORTED_SUBJECT_PEDAGOGY:${subject}`);
    return {
      nodeId: doc.id,
      node,
      atom,
      sourceDocumentId: String(job.sourceDocumentIds[0] || node.sourceUploadId || ''),
      subject,
      pedagogy: { ...profile, officialSubject: subject, profileKey: pedagogyKey[subject] || subject },
    };
  }
  throw new Error(`ATOMIC_SOURCE_NOT_FOUND:${job.canonicalTargetId}`);
}

async function sourcePrompt(context: Context): Promise<string> {
  const h = context.node.syllabusHierarchy || {};
  return [
    'You are a bounded academic content worker for RankCrackers.',
    'Return JSON only. Do not invent official syllabus claims, PYQs, statistics, or citations.',
    'The official source defines scope; derived micro/atomic taxonomy is a study decomposition, not an official claim.',
    `Subject pedagogy: ${context.subject}; model=${context.pedagogy.model}; quality=${context.pedagogy.quality}`,
    `Subject: ${h.subject}; Unit: ${h.unit}; Official topic: ${h.topic}; Atomic topic: ${context.atom.title}`,
    `Official source description: ${String(context.node.description || '').slice(0, 6000)}`,
    `Source document: ${context.sourceDocumentId}; source page: ${context.node.sourcePage || 'unknown'}`,
    'Create a bounded learning block with keys: concept, definition, explanation, examples (array of 1-3), keywords (array), sourceEvidence (array of 1-2 exact short phrases from the supplied source description), misconceptions (array).',
    'Examples may explain the atomic concept, but must not claim they are official SSC questions or PYQs.',
  ].join('\n');
}

export async function createDraft(job: AafJobMetadata) {
  const context = await loadContext(job);
  const generated = await generateGemini(await sourcePrompt(context));
  const content = stripJson(generated.text);
  const required = ['concept', 'definition', 'explanation', 'examples', 'keywords', 'sourceEvidence', 'misconceptions'];
  if (required.some((key) => !(key in content))) throw new Error('DRAFT_SCHEMA_INCOMPLETE');
  const ref = db.collection('mission_realms').doc(job.missionId).collection('digibook_work_items').doc(job.canonicalTargetId);
  await ref.set({
    missionId: job.missionId,
    atomicTopicId: job.canonicalTargetId,
    canonicalNodeId: context.nodeId,
    sourceDocumentId: context.sourceDocumentId,
    sourcePage: context.node.sourcePage || null,
    sourceSha256: context.node.sourceSha256 || context.node.syllabusHierarchy?.sourceSha256 || null,
    officialHierarchy: { subject: context.subject, unit: context.node.syllabusHierarchy.unit, topic: context.node.syllabusHierarchy.topic, atomicTitle: context.atom.title },
    pedagogy: context.pedagogy,
    content,
    contentHash: hash(content),
    taxonomyVersion: TAXONOMY_VERSION,
    assemblyVersion: ASSEMBLY_VERSION,
    contentStatus: 'DRAFT_CANDIDATE',
    verificationStatus: 'PENDING',
    noSyntheticContent: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  return { context, content, contentHash: hash(content) };
}

export async function validateDraft(job: AafJobMetadata) {
  const ref = db.collection('mission_realms').doc(job.missionId).collection('digibook_work_items').doc(job.canonicalTargetId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('DRAFT_WORK_ITEM_NOT_FOUND');
  const data = snap.data() || {};
  const content = data.content || {};
  const context = await loadContext(job);
  const checks = {
    sourceBound: data.sourceDocumentId === job.sourceDocumentIds[0] && data.canonicalNodeId === context.nodeId,
    taxonomyBound: data.taxonomyVersion === TAXONOMY_VERSION,
    pedagogyBound: data.pedagogy?.model === context.pedagogy.model && data.pedagogy?.progression?.length === 5,
    contentShape: typeof content.definition === 'string' && content.definition.length >= 20 && typeof content.explanation === 'string' && content.explanation.length >= 40 && Array.isArray(content.examples) && content.examples.length >= 1 && content.examples.length <= 3 && Array.isArray(content.sourceEvidence) && content.sourceEvidence.length >= 1,
    noOfficialMislabel: !JSON.stringify(content).toLowerCase().match(/official pyq|previous year question|asked in ssc/),
  };
  const passed = Object.values(checks).every(Boolean);
  await ref.set({ validation: { checks, passed, verifiedAt: admin.firestore.FieldValue.serverTimestamp() }, verificationStatus: passed ? 'VALIDATION_PASSED' : 'VALIDATION_FAILED', updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  if (!passed) throw new Error(`DIGIBOOK_VALIDATION_FAILED:${Object.entries(checks).filter(([, value]) => !value).map(([key]) => key).join(',')}`);
  return { checks };
}

export async function proReview(job: AafJobMetadata) {
  const ref = db.collection('mission_realms').doc(job.missionId).collection('digibook_work_items').doc(job.canonicalTargetId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('DRAFT_WORK_ITEM_NOT_FOUND');
  const data = snap.data() || {};
  if (data.verificationStatus !== 'VALIDATION_PASSED') throw new Error('VALIDATION_GATE_NOT_PASSED');
  const reviewPrompt = [
    'Act as an independent academic verifier. Return JSON only: {"verdict":"PASS"|"HOLD","reasons":[string],"sourceEvidenceAdequate":boolean,"pedagogyDistinct":boolean}.',
    'Reject if the draft invents official facts, PYQs, dates, statistics, or unsupported source claims.',
    `Subject pedagogy model: ${data.pedagogy.model}; progression: ${data.pedagogy.progression.join(' > ')}`,
    `Official hierarchy: ${JSON.stringify(data.officialHierarchy)}`,
    `Source description: ${String((await loadContext(job)).node.description || '').slice(0, 6000)}`,
    `Candidate draft: ${JSON.stringify(data.content)}`,
  ].join('\n');
  const result = stripJson((await generateGemini(reviewPrompt)).text);
  const passed = result.verdict === 'PASS' && result.sourceEvidenceAdequate === true && result.pedagogyDistinct === true && Array.isArray(result.reasons);
  await ref.set({ proReview: { ...result, passed, reviewedAt: admin.firestore.FieldValue.serverTimestamp() }, verificationStatus: passed ? 'PRO_REVIEW_PASSED' : 'PRO_REVIEW_HOLD', updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  if (!passed) throw new Error('DIGIBOOK_PRO_REVIEW_HOLD');
  return { review: result };
}

export async function assemble(job: AafJobMetadata) {
  const ref = db.collection('mission_realms').doc(job.missionId).collection('digibook_work_items').doc(job.canonicalTargetId);
  const snap = await ref.get();
  const data = snap.data() || {};
  if (data.verificationStatus !== 'PRO_REVIEW_PASSED') throw new Error('PRO_REVIEW_GATE_NOT_PASSED');
  await ref.set({ assembly: { status: 'READY', assemblyVersion: ASSEMBLY_VERSION, officialSourceBound: true, derivedTaxonomyOnlyForNavigation: true, noSyntheticContent: true, assembledAt: admin.firestore.FieldValue.serverTimestamp() }, verificationStatus: 'ASSEMBLY_READY', updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  return { assemblyVersion: ASSEMBLY_VERSION };
}

export async function materialize(job: AafJobMetadata) {
  const ref = db.collection('mission_realms').doc(job.missionId).collection('digibook_work_items').doc(job.canonicalTargetId);
  const snap = await ref.get();
  const data = snap.data() || {};
  if (data.verificationStatus !== 'ASSEMBLY_READY' || data.assembly?.status !== 'READY') throw new Error('ASSEMBLY_GATE_NOT_PASSED');
  const unitsRef = db.collection('mission_realms').doc(job.missionId).collection('digibook_units');
  const direct = await unitsRef.doc(`digi_${data.canonicalNodeId}`).get();
  const units = direct.exists ? [direct] : (await unitsRef.where('nodeId', '==', data.canonicalNodeId).limit(1).get()).docs;
  if (!units.length) throw new Error('DIGIBOOK_UNIT_NOT_FOUND_FOR_CANONICAL_NODE');
  await units[0].ref.set({
    concept: data.content.concept,
    definition: data.content.definition,
    explanation: data.content.explanation,
    examples: data.content.examples,
    keywords: data.content.keywords,
    status: 'published',
    studentVisibilityAuthorized: true,
    sourceApproved: true,
    verificationStatus: 'VERIFIED',
    assemblyStatus: 'VERIFIED_PUBLISHED',
    contentHash: data.contentHash,
    sourceDocumentId: data.sourceDocumentId,
    sourceSha256: data.sourceSha256,
    pedagogy: data.pedagogy,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  await ref.set({ verificationStatus: 'PUBLISHED', publishedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  return { published: true, canonicalNodeId: data.canonicalNodeId };
}
