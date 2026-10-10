const crypto = require('node:crypto');
const FieldValue = {
  get serverTimestamp() {
    try {
      return require('firebase-admin/firestore').FieldValue.serverTimestamp;
    } catch (e) {
      return () => new Date().toISOString();
    }
  }
};

const FAMILIES = Object.freeze(['SYLLABUS', 'NOTIFICATION', 'PYQ', 'AMENDMENT', 'OTHER_OFFICIAL_SOURCE']);
const DELTA_CLASSES = Object.freeze(['UNCHANGED', 'ADDED', 'REMOVED', 'RENAMED', 'MOVED', 'MODIFIED', 'SPLIT', 'MERGED', 'AMBIGUOUS']);

function text(value) { return value == null ? '' : String(value).trim(); }
function token(value, fallback = 'none') {
  const normalized = text(value).toLowerCase().replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
  return normalized || fallback;
}
function documentFamily(documentType) {
  const type = token(documentType, 'other');
  if (type.includes('syllabus')) return 'SYLLABUS';
  if (type.includes('pyq') || type.includes('question_paper')) return 'PYQ';
  if (type.includes('amendment') || type.includes('shuddhi') || type.includes('corrigendum')) return 'AMENDMENT';
  if (type.includes('notification') || type.includes('notice')) return 'NOTIFICATION';
  return 'OTHER_OFFICIAL_SOURCE';
}
function sourceSlotIdentity(input) {
  const family = FAMILIES.includes(input.documentFamily) ? input.documentFamily : documentFamily(input.documentType);
  const scope = token(input.scope, 'mission_common');
  let context = 'mission';
  if (family === 'PYQ') {
    context = [token(input.paperType), token(input.year || input.session), token(input.variableId)].join(':');
  } else if (scope !== 'mission_common') {
    context = [token(input.paperType), token(input.variableId || input.subjectCode)].join(':');
  }
  const key = [token(input.missionId), family.toLowerCase(), scope, context].join('|');
  return { sourceSlotKey: key, sourceSlotId: `slot_${crypto.createHash('sha256').update(key).digest('hex').slice(0, 32)}`, documentFamily: family };
}
function sourceVersionIdentity(sourceSlotKey, sha256) {
  const sha = text(sha256).replace(/^hash_/, '').toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(sha)) throw new Error('INVALID_SOURCE_SHA256');
  return { sourceSha256: sha, sourceVersionId: `srcv_${crypto.createHash('sha256').update(`${sourceSlotKey}\0${sha}`).digest('hex').slice(0, 40)}` };
}
function normalizeUnit(unit) {
  return {
    id: text(unit.id || unit.nodeId || unit.atomId),
    semanticKey: token(unit.semanticKey || unit.canonicalKey || unit.id || unit.title),
    title: text(unit.title || unit.canonicalTitle),
    parentKey: token(unit.parentKey || unit.parentId),
    contentDigest: text(unit.contentDigest || unit.digest),
  };
}
function classifySyllabusDelta(currentUnits, candidateUnits, decisions = {}) {
  const current = currentUnits.map(normalizeUnit);
  const candidate = candidateUnits.map(normalizeUnit);
  const oldByKey = new Map(current.map(unit => [unit.semanticKey, unit]));
  const newByKey = new Map(candidate.map(unit => [unit.semanticKey, unit]));
  const consumedOld = new Set();
  const consumedNew = new Set();
  const items = [];
  const add = (classification, before, after, confidence = 'EXACT') => {
    items.push({ classification, before: before || null, after: after || null, confidence });
    if (before) consumedOld.add(before.semanticKey);
    if (after) consumedNew.add(after.semanticKey);
  };
  for (const [key, before] of oldByKey) {
    const after = newByKey.get(key);
    if (!after) continue;
    if (before.title === after.title && before.parentKey === after.parentKey && before.contentDigest === after.contentDigest) add('UNCHANGED', before, after);
    else if (before.title !== after.title && before.parentKey === after.parentKey && before.contentDigest === after.contentDigest) add('RENAMED', before, after);
    else if (before.title === after.title && before.parentKey !== after.parentKey && before.contentDigest === after.contentDigest) add('MOVED', before, after);
    else add('MODIFIED', before, after);
  }
  for (const decision of Object.values(decisions || {})) {
    if (!decision || !DELTA_CLASSES.includes(decision.classification)) continue;
    const before = oldByKey.get(token(decision.beforeKey));
    const after = newByKey.get(token(decision.afterKey));
    if (before || after) add(decision.classification, before, after, 'VERIFIED_DECISION');
  }
  for (const before of current) if (!consumedOld.has(before.semanticKey)) add('REMOVED', before, null);
  for (const after of candidate) if (!consumedNew.has(after.semanticKey)) add('ADDED', null, after);
  const duplicateKeys = [...newByKey.keys()].filter(key => candidate.filter(unit => unit.semanticKey === key).length > 1);
  for (const key of duplicateKeys) items.push({ classification: 'AMBIGUOUS', before: oldByKey.get(key) || null, after: newByKey.get(key) || null, confidence: 'COLLISION' });
  const counts = Object.fromEntries(DELTA_CLASSES.map(name => [name, items.filter(item => item.classification === name).length]));
  return { items, counts, activationBlocked: counts.AMBIGUOUS > 0 || counts.SPLIT > 0 || counts.MERGED > 0 };
}
function classifyAmendmentEffects(baseCanonicalVersionId, effects) {
  if (!text(baseCanonicalVersionId)) throw new Error('AMENDMENT_BASE_VERSION_REQUIRED');
  const allowed = new Set(['ADDED', 'REMOVED', 'MODIFIED', 'REPLACED']);
  const items = (Array.isArray(effects) ? effects : []).map((effect, index) => {
    const classification = text(effect.classification).toUpperCase();
    if (!allowed.has(classification)) return { ...effect, index, classification: 'AMBIGUOUS' };
    return { ...effect, index, classification };
  });
  const counts = { ADDED: 0, REMOVED: 0, MODIFIED: 0, REPLACED: 0, AMBIGUOUS: 0 };
  items.forEach(item => { counts[item.classification] += 1; });
  return { baseCanonicalVersionId, items, counts, verificationRequired: true, activationBlocked: counts.AMBIGUOUS > 0 };
}
function downstreamImpact(delta) {
  const digibook = { preserve: [], queueGeneration: [], retireCurrent: [], markStale: [], updateReferences: [] };
  const crucible = { preserveHistory: true, preserveCompletedSlots: true, futureAdd: [], futureRemove: [], futureReconcile: [], activePlanRewrite: false };
  for (const item of delta.items) {
    const id = item.after?.id || item.before?.id || item.after?.semanticKey || item.before?.semanticKey;
    if (item.classification === 'UNCHANGED') digibook.preserve.push(id);
    if (item.classification === 'ADDED') { digibook.queueGeneration.push(id); crucible.futureAdd.push(id); }
    if (item.classification === 'REMOVED') { digibook.retireCurrent.push(id); crucible.futureRemove.push(id); }
    if (item.classification === 'MODIFIED') { digibook.markStale.push(id); crucible.futureReconcile.push(id); }
    if (item.classification === 'RENAMED' || item.classification === 'MOVED') digibook.updateReferences.push(id);
  }
  return { digibook, crucible, reconciliationRequired: delta.activationBlocked };
}
function assertActivationEligible(slot, version, request) {
  if (!version) throw new Error('SOURCE_VERSION_NOT_FOUND');
  if (version.sourceSlotId !== request.sourceSlotId) throw new Error('SOURCE_SLOT_MISMATCH');
  if (version.sourceSha256 !== request.sourceSha256) throw new Error('SOURCE_SHA_MISMATCH');
  if (version.verificationState !== 'VERIFIED') throw new Error('SOURCE_NOT_VERIFIED');
  if (version.deltaState === 'AMBIGUOUS' || version.activationBlocked === true) throw new Error('SOURCE_DELTA_BLOCKED');
  if (version.documentFamily === 'AMENDMENT' && !version.baseCanonicalVersionId) throw new Error('AMENDMENT_BASE_VERSION_REQUIRED');
  if (version.documentFamily === 'AMENDMENT' && version.amendmentVerificationState !== 'VERIFIED') throw new Error('AMENDMENT_NOT_VERIFIED');
  const generation = Number(slot?.activationEpoch || 0);
  if (generation !== Number(request.expectedActivationEpoch)) throw new Error('STALE_CANONICAL_POINTER');
  if ((slot?.canonicalVersionId || null) !== (request.expectedCanonicalVersionId || null)) throw new Error('STALE_CANONICAL_VERSION');
}
async function registerCandidateSourceVersion(db, input) {
  const slotIdentity = sourceSlotIdentity(input);
  const versionIdentity = sourceVersionIdentity(slotIdentity.sourceSlotKey, input.sourceSha256 || input.fileHash || input.documentId);
  const slotRef = db.collection('mission_realms').doc(input.missionId).collection('source_slots').doc(slotIdentity.sourceSlotId);
  const versionRef = slotRef.collection('source_versions').doc(versionIdentity.sourceVersionId);
  const documentRef = db.collection('mission_realms').doc(input.missionId).collection('official_documents').doc(input.documentId);
  await db.runTransaction(async transaction => {
    const [slotSnap, versionSnap] = await Promise.all([transaction.get(slotRef), transaction.get(versionRef)]);
    if (versionSnap.exists) {
      const existing = versionSnap.data();
      if (existing.sourceSha256 !== versionIdentity.sourceSha256 || existing.sourceSlotKey !== slotIdentity.sourceSlotKey) throw new Error('IMMUTABLE_SOURCE_VERSION_CONFLICT');
      return;
    }
    const nextSequence = Number(slotSnap.data()?.nextSequence || 0) + 1;
    transaction.set(slotRef, { ...slotIdentity, missionId: input.missionId, canonicalVersionId: slotSnap.data()?.canonicalVersionId || null, canonicalSha256: slotSnap.data()?.canonicalSha256 || null, activationEpoch: Number(slotSnap.data()?.activationEpoch || 0), nextSequence, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    transaction.create(versionRef, { ...slotIdentity, ...versionIdentity, versionNumber: nextSequence, missionId: input.missionId, documentId: input.documentId, scope: input.scope || 'MISSION_COMMON', paperType: input.paperType || null, variableId: input.variableId || null, subjectCode: input.subjectCode || null, originalFileName: input.originalFileName || input.fileName || null, mimeType: input.mimeType || null, fileSize: input.fileSize || null, storagePath: input.storagePath || null, founderActor: input.uploadedBy || null, uploadedAt: input.uploadedAt || FieldValue.serverTimestamp(), verificationState: 'PENDING', activationState: 'CANDIDATE', baseCanonicalVersionId: slotSnap.data()?.canonicalVersionId || null, supersedes: null, supersededBy: null, immutable: true, createdAt: FieldValue.serverTimestamp() });
    transaction.set(documentRef, { ...slotIdentity, ...versionIdentity, versionNumber: nextSequence, verificationState: 'PENDING', activationState: 'CANDIDATE', studentTruth: false }, { merge: true });
  });
  return { ...slotIdentity, ...versionIdentity };
}
async function activateCanonicalSource(db, request) {
  const slotRef = db.collection('mission_realms').doc(request.missionId).collection('source_slots').doc(request.sourceSlotId);
  const versionRef = slotRef.collection('source_versions').doc(request.sourceVersionId);
  const auditId = `source_activation_${request.sourceSlotId}_${request.sourceVersionId}_${request.expectedActivationEpoch + 1}`;
  return db.runTransaction(async transaction => {
    const [slotSnap, versionSnap] = await Promise.all([transaction.get(slotRef), transaction.get(versionRef)]);
    const slot = slotSnap.data() || {};
    const version = versionSnap.data();
    if (slot.canonicalVersionId === request.sourceVersionId && slot.canonicalSha256 === request.sourceSha256) return { idempotent: true, activationEpoch: slot.activationEpoch };
    if (!request.founderActor) throw new Error('FOUNDER_ACTOR_REQUIRED');
    if (String(request.reason || '').trim().length < 12) throw new Error('ACTIVATION_REASON_REQUIRED');
    assertActivationEligible(slot, version, request);
    const previousId = slot.canonicalVersionId || null;
    const previousSnap = previousId ? await transaction.get(slotRef.collection('source_versions').doc(previousId)) : null;
    const previous = previousSnap?.data() || null;
    const nextEpoch = Number(slot.activationEpoch || 0) + 1;
    if (previousId) {
      transaction.update(slotRef.collection('source_versions').doc(previousId), { activationState: 'SUPERSEDED', supersededBy: request.sourceVersionId, supersededAt: FieldValue.serverTimestamp() });
      if (previous?.documentId) transaction.set(db.collection('mission_realms').doc(request.missionId).collection('official_documents').doc(previous.documentId), { activationState: 'SUPERSEDED', supersededBy: request.sourceVersionId, studentTruth: false }, { merge: true });
    }
    if (version.documentId) transaction.set(db.collection('mission_realms').doc(request.missionId).collection('official_documents').doc(version.documentId), { activationState: 'CANONICAL', supersedes: previousId, activationEpoch: nextEpoch, canonicalSource: true, studentTruth: false }, { merge: true });
    transaction.update(versionRef, { activationState: 'CANONICAL', supersedes: previousId, activatedBy: request.founderActor, activatedAt: FieldValue.serverTimestamp(), activationReason: request.reason, activationEpoch: nextEpoch });
    transaction.set(slotRef, { canonicalVersionId: request.sourceVersionId, canonicalSha256: request.sourceSha256, canonicalVerificationState: 'VERIFIED', academicDeltaApplied: version.documentFamily === 'SYLLABUS' ? false : true, downstreamVerificationComplete: false, ambiguousDelta: false, staleSourceJobs: 0, activationEpoch: nextEpoch, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    transaction.create(db.collection('canonical_source_audit').doc(auditId), { type: 'CANONICAL_SOURCE_ACTIVATED', missionId: request.missionId, sourceSlotId: request.sourceSlotId, sourceVersionId: request.sourceVersionId, sourceSha256: request.sourceSha256, invalidatedVersionId: previousId, previousCanonicalVersionId: previousId, nextCanonicalVersionId: request.sourceVersionId, activationEpoch: nextEpoch, founderActor: request.founderActor, reason: request.reason, createdAt: FieldValue.serverTimestamp() });
    transaction.create(db.collection('canonical_source_events').doc(auditId), { type: 'CANONICAL_SOURCE_ACTIVATED', missionId: request.missionId, sourceSlotId: request.sourceSlotId, sourceVersionId: request.sourceVersionId, sourceSha256: request.sourceSha256, documentFamily: version.documentFamily, deltaSummary: version.deltaSummary || null, activationEpoch: nextEpoch, status: 'PENDING_RECONCILIATION', createdAt: FieldValue.serverTimestamp() });
    return { idempotent: false, activationEpoch: nextEpoch, previousCanonicalVersionId: previousId };
  });
}
async function rollbackCanonicalSource(db, request) {
  return activateCanonicalSource(db, { ...request, sourceVersionId: request.targetVersionId, sourceSha256: request.targetSha256 });
}
function isJobCurrent(slot, job) {
  return Boolean(slot && job && slot.canonicalVersionId === job.sourceVersionId && slot.canonicalSha256 === job.sourceSha256 && Number(slot.activationEpoch) === Number(job.activationEpoch));
}

function classifyWorkerAuthority(slot, job) {
  if (!job || !job.sourceVersionId || !job.sourceSha256) {
    return 'AUTHORITY_MISSING';
  }
  if (!slot || !slot.canonicalVersionId || !slot.canonicalSha256) {
    return 'NOT_CANONICAL';
  }
  if (slot.canonicalVersionId === job.sourceVersionId &&
      slot.canonicalSha256 === job.sourceSha256 &&
      Number(slot.activationEpoch) === Number(job.activationEpoch)) {
    return 'CURRENT';
  }
  if (Number(job.activationEpoch || 0) < Number(slot.activationEpoch || 0)) {
    return 'STALE';
  }
  if (slot.canonicalVersionId !== job.sourceVersionId) {
    return 'SUPERSEDED';
  }
  return 'NOT_CANONICAL';
}

module.exports = { FAMILIES, DELTA_CLASSES, documentFamily, sourceSlotIdentity, sourceVersionIdentity, classifySyllabusDelta, classifyAmendmentEffects, downstreamImpact, assertActivationEligible, registerCandidateSourceVersion, activateCanonicalSource, rollbackCanonicalSource, isJobCurrent, classifyWorkerAuthority };






